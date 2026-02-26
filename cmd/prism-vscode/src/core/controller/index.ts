import * as vscode from "vscode"
import { PrismExtensionState, DEFAULT_PRISM_STATE } from "../../shared/PrismState"
import { WorkflowPhase } from "../../shared/types"
import { registerUnary, registerStream, StreamResponseFn } from "./grpc-handler"
import { WorkflowStateMachine, WorkflowTransition } from "./prism/workflow"
import { StoriesManager } from "./prism/stories"
import { PrismWatcher } from "../../prism/watcher"
import { detectPrismDir, detectStoriesPath } from "../../prism/config"
import { getApiKey, promptForApiKey } from "../api/auth"
import { PrismApiHandler, ModelName } from "../api/claude-sdk"
import { PrismTask } from "../task/index"
import { PrismChatMessage } from "../api/types"
import { SystemPromptContext } from "../prompts/system-prompt"
import { ModeBridge, detectSkillTrigger, type ChatMode } from "./prism/mode-bridge"
import { SKILL_MAP } from "./prism/plugin-bridge"
import { checkClaudeCli } from "../../claude/runner"

export type PostMessageFn = (message: unknown) => Promise<void>

/**
 * PrismController — central orchestrator for the extension.
 *
 * Manages application state and broadcasts it to all webview subscribers.
 * Integrates the workflow state machine, stories manager, .prism/ watcher,
 * and chat task management.
 */
export class PrismController implements vscode.Disposable {
  private _state: PrismExtensionState
  private _stateSubscribers = new Map<string, StreamResponseFn>()
  private _postMessage: PostMessageFn | null = null
  private _context: vscode.ExtensionContext

  // Prism Core Services
  readonly workflow = new WorkflowStateMachine()
  readonly storiesManager = new StoriesManager()
  private readonly _watcher = new PrismWatcher()
  private readonly _watcherSub: vscode.Disposable

  // Chat / Task management
  private _currentTask: PrismTask | undefined

  // Phase 4: Claude CLI Integration
  private _modeBridge: ModeBridge | undefined

  constructor(context: vscode.ExtensionContext) {
    this._context = context
    this._state = { ...DEFAULT_PRISM_STATE }
    this._watcherSub = this._watcher.onDidChange((event) => {
      void this._onPrismFileChange(event.type)
    })
    this._registerHandlers()

    // Check if API key and Claude CLI exist on startup
    void this._checkApiKey()
    void this._checkClaudeCli()
  }

  dispose(): void {
    this._watcher.dispose()
    this._watcherSub.dispose()
    if (this._modeBridge) {
      this._modeBridge.terminate()
    }
  }

  /** Called once by VscodeWebviewProvider after webview resolves. */
  setPostMessageFn(fn: PostMessageFn): void {
    this._postMessage = fn
  }

  get state(): PrismExtensionState {
    return this._state
  }

  /** Register all gRPC service handlers. */
  private _registerHandlers(): void {
    // -----------------------------------------------------------------------
    // StateService
    // -----------------------------------------------------------------------

    /** Streaming subscription: sends state now and on every future update. */
    registerStream(
      "StateService",
      "subscribeToState",
      async (_message: unknown, respond: StreamResponseFn, requestId: string) => {
        // Store subscriber for future pushes
        this._stateSubscribers.set(requestId, respond)

        // Immediately send current state (marks didHydrateState = true)
        const hydratedState: PrismExtensionState = { ...this._state, didHydrateState: true }
        await respond({ stateJson: JSON.stringify(hydratedState) })
      },
    )

    /** Unary: get current state once. */
    registerUnary("StateService", "getState", async (_message: unknown) => {
      const hydratedState: PrismExtensionState = { ...this._state, didHydrateState: true }
      return { stateJson: JSON.stringify(hydratedState) }
    })

    // -----------------------------------------------------------------------
    // UiService
    // -----------------------------------------------------------------------

    /** Initialize webview: sent on mount to kick off state subscription. */
    registerUnary("UiService", "initializeWebview", async (_message: unknown) => {
      await this._detectPrismDir()
      return { ok: true }
    })

    // -----------------------------------------------------------------------
    // WorkflowService
    // -----------------------------------------------------------------------

    /** Attempt a workflow phase transition. */
    registerUnary(
      "WorkflowService",
      "transition",
      async (message: unknown) => {
        const { transition } = message as { transition: WorkflowTransition }
        const result = this.workflow.transition(transition)
        if (result.ok && result.newPhase !== undefined) {
          await this.updateState({
            workflowPhase: result.newPhase,
            workflowContext: this.workflow.context,
          })
        }
        return result
      },
    )

    /** Get available transitions from the current phase. */
    registerUnary("WorkflowService", "getAvailableTransitions", async () => {
      return { transitions: this.workflow.availableTransitions() }
    })

    // -----------------------------------------------------------------------
    // ChatService
    // -----------------------------------------------------------------------

    /** Send a user message and start/continue the AI task. */
    registerUnary(
      "ChatService",
      "sendMessage",
      async (message: unknown) => {
        const { text } = message as { text: string }

        if (!text?.trim()) {
          return { ok: false, error: "Message text is required" }
        }

        const workspaceRoot = this._getWorkspaceRoot()
        if (!workspaceRoot) {
          return { ok: false, error: "No workspace folder open" }
        }

        // ---------------------------------------------------------------
        // Phase 4: Check if message triggers a Prism plugin skill
        // ---------------------------------------------------------------
        const skillTrigger = detectSkillTrigger(text)
        if (skillTrigger) {
          // Route to Plugin Mode via ModeBridge
          if (!this._state.hasClaudeCli) {
            return { ok: false, error: "Claude CLI not found. Install it to use Prism workflow commands." }
          }
          const bridge = this._getOrCreateModeBridge(workspaceRoot)
          void bridge.runPluginSkill(text).catch((err: Error) => {
            console.error("[Prism] Plugin skill error:", err)
          })
          return { ok: true }
        }

        // ---------------------------------------------------------------
        // SDK Mode: interactive chat
        // ---------------------------------------------------------------
        const apiKey = await getApiKey(this._context)
        if (!apiKey) {
          // Prompt user for API key
          const key = await promptForApiKey(this._context)
          if (!key) {
            return { ok: false, error: "Anthropic API key required. Please configure it in Prism settings." }
          }
        }

        const finalApiKey = await getApiKey(this._context)
        if (!finalApiKey) {
          return { ok: false, error: "No API key configured" }
        }

        // Create or reuse task
        if (!this._currentTask || this._currentTask.isComplete) {
          const model = this._state.defaultModel as ModelName
          const apiHandler = new PrismApiHandler({ apiKey: finalApiKey, model })
          const systemPromptCtx: SystemPromptContext = {
            workflowPhase: this._state.workflowPhase,
            workflowContext: this.workflow.context,
            workspaceRoot,
            prismDir: this._state.prismDir,
            hasPrismDir: this._state.hasPrismDir,
            hasStoriesJson: this._state.hasStoriesJson,
          }
          this._currentTask = new PrismTask({
            apiHandler,
            workspaceRoot,
            systemPromptCtx,
            onUpdate: (messages: PrismChatMessage[], isStreaming: boolean) => {
              void this.updateState({
                chatMessages: messages,
                isChatStreaming: isStreaming,
                hasActiveTask: true,
                pendingApprovalToolUseId: this._currentTask?.['_state']?.pendingApprovalToolUseId,
              })
            },
          })
        }

        // Run in background (non-blocking)
        void this._currentTask.sendMessage(text).catch((err: Error) => {
          console.error("[Prism] Task error:", err)
        })

        return { ok: true }
      },
    )

    /** Abort the current streaming task (SDK or Plugin mode). */
    registerUnary("ChatService", "abortTask", async () => {
      // Abort Plugin mode if running
      if (this._modeBridge?.isPluginStreaming) {
        this._modeBridge.terminate()
      }
      // Abort SDK mode if running
      if (this._currentTask) {
        this._currentTask.abort()
      }
      await this.updateState({
        isChatStreaming: false,
        chatMode: "sdk",
        activePluginSkill: null,
      })
      return { ok: true }
    })

    /** Clear all chat messages (start fresh). */
    registerUnary("ChatService", "clearMessages", async () => {
      this._currentTask = undefined
      await this.updateState({
        chatMessages: [],
        isChatStreaming: false,
        hasActiveTask: false,
        pendingApprovalToolUseId: undefined,
      })
      return { ok: true }
    })

    /** Approve or deny a pending tool use. */
    registerUnary(
      "ChatService",
      "approveToolUse",
      async (message: unknown) => {
        const { toolUseId, approved } = message as { toolUseId: string; approved: boolean }

        if (!this._currentTask) {
          return { ok: false, error: "No active task" }
        }

        this._currentTask.resolveApproval(toolUseId, approved)
        this._currentTask['_messages'].setToolApproval(toolUseId, approved)

        await this.updateState({
          pendingApprovalToolUseId: undefined,
          chatMessages: [...this._currentTask.chatMessages],
        })

        return { ok: true }
      },
    )

    /** Set API key. */
    registerUnary(
      "ChatService",
      "setApiKey",
      async (message: unknown) => {
        const { apiKey } = message as { apiKey: string }
        try {
          const { setApiKey } = await import("../api/auth")
          await setApiKey(this._context, apiKey)
          await this.updateState({ hasApiKey: true })
          return { ok: true }
        } catch (err) {
          return { ok: false, error: String(err) }
        }
      },
    )

    // -----------------------------------------------------------------------
    // PluginService (Phase 4: Claude CLI Integration)
    // -----------------------------------------------------------------------

    /** Execute a Prism plugin skill via Claude CLI. */
    registerUnary(
      "PluginService",
      "executeSkill",
      async (message: unknown) => {
        const { skillName, args } = message as { skillName: string; args?: string }

        if (!this._state.hasClaudeCli) {
          return { ok: false, error: "Claude CLI not found" }
        }

        const workspaceRoot = this._getWorkspaceRoot()
        if (!workspaceRoot) {
          return { ok: false, error: "No workspace folder open" }
        }

        const bridge = this._getOrCreateModeBridge(workspaceRoot)
        void bridge.runPluginSkill(`/${skillName}${args ? ` ${args}` : ""}`).catch((err: Error) => {
          console.error("[Prism] Plugin skill error:", err)
        })

        return { ok: true }
      },
    )

    /** Terminate the running plugin skill. */
    registerUnary("PluginService", "terminateSkill", async () => {
      if (this._modeBridge) {
        this._modeBridge.terminate()
      }
      return { ok: true }
    })

    /** Check if Claude CLI is available. */
    registerUnary("PluginService", "checkCli", async () => {
      await this._checkClaudeCli()
      return { hasClaudeCli: this._state.hasClaudeCli }
    })

    /** Get the available skill commands. */
    registerUnary("PluginService", "getSkills", async () => {
      return { skills: SKILL_MAP }
    })
  }

  // ---------------------------------------------------------------------------
  // .prism/ detection + watcher
  // ---------------------------------------------------------------------------

  /** Detect .prism/ directory in the current workspace and start watching. */
  async _detectPrismDir(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return
    }

    const prismDir = await detectPrismDir()
    const hasPrismDir = prismDir !== undefined
    let hasStoriesJson = false
    let storiesPath: string | undefined

    if (prismDir) {
      storiesPath = await detectStoriesPath(prismDir)
      hasStoriesJson = storiesPath !== undefined
      this._watcher.start(prismDir)
      if (storiesPath) {
        await this._loadStories(storiesPath)
      }
    }

    await this.updateState({ hasPrismDir, hasStoriesJson, prismDir, storiesPath })
    await vscode.commands.executeCommand("setContext", "prism.hasPrismDir", hasPrismDir)
    await vscode.commands.executeCommand("setContext", "prism.hasStoriesJson", hasStoriesJson)
  }

  private async _loadStories(storiesPath: string): Promise<void> {
    try {
      const sf = await this.storiesManager.load(storiesPath)
      await this.updateState({
        stories: sf.stories,
        plan: sf.plan,
        completedCount: this.storiesManager.completedCount(),
        remainingCount: this.storiesManager.remainingCount(),
      })
    } catch (err) {
      console.error("[Prism] Failed to load stories:", err)
    }
  }

  private async _onPrismFileChange(
    type: "stories" | "research" | "plans" | "validation" | "spectrum" | "other",
  ): Promise<void> {
    if (type === "stories" && this._state.storiesPath) {
      await this._loadStories(this._state.storiesPath)
    }
  }

  private async _checkApiKey(): Promise<void> {
    const apiKey = await getApiKey(this._context)
    await this.updateState({ hasApiKey: !!apiKey })
  }

  /** Check if Claude CLI is available on PATH. */
  private async _checkClaudeCli(): Promise<void> {
    const claudePath = await checkClaudeCli()
    await this.updateState({ hasClaudeCli: claudePath !== null })
  }

  /** Lazily create the ModeBridge for hybrid SDK/CLI mode. */
  private _getOrCreateModeBridge(workspaceRoot: string): ModeBridge {
    if (!this._modeBridge) {
      this._modeBridge = new ModeBridge(
        workspaceRoot,
        (messages: PrismChatMessage[], isStreaming: boolean, mode: ChatMode) => {
          void this.updateState({
            chatMessages: messages,
            isChatStreaming: isStreaming,
            chatMode: mode,
            activePluginSkill: this._modeBridge?.activeSkill ?? null,
            hasActiveTask: true,
          })
        },
      )
    } else {
      this._modeBridge.setProjectDir(workspaceRoot)
    }
    return this._modeBridge
  }

  private _getWorkspaceRoot(): string | undefined {
    const folders = vscode.workspace.workspaceFolders
    return folders?.[0]?.uri.fsPath
  }

  /** Remove a state subscriber (called when webview sends grpc_request_cancel). */
  removeSubscriber(requestId: string): void {
    this._stateSubscribers.delete(requestId)
  }

  /** Update partial state and broadcast to all webview subscribers. */
  async updateState(partial: Partial<PrismExtensionState>): Promise<void> {
    this._state = { ...this._state, ...partial }
    await this._broadcastState()
  }

  /** Set workflow phase (force) and broadcast. */
  async setPhase(phase: WorkflowPhase): Promise<void> {
    this.workflow.setPhase(phase)
    await this.updateState({ workflowPhase: phase, workflowContext: this.workflow.context })
  }

  /** Push current state to all subscribed webview clients. */
  private async _broadcastState(): Promise<void> {
    const hydratedState: PrismExtensionState = { ...this._state, didHydrateState: true }
    const stateJson = JSON.stringify(hydratedState)

    const deadSubscribers: string[] = []

    for (const [requestId, respond] of this._stateSubscribers) {
      try {
        await respond({ stateJson })
      } catch (err) {
        console.error(`[Prism] Failed to push state to subscriber ${requestId}:`, err)
        deadSubscribers.push(requestId)
      }
    }

    // Clean up dead subscribers
    for (const id of deadSubscribers) {
      this._stateSubscribers.delete(id)
    }
  }
}
