/**
 * Prism gRPC service clients.
 *
 * One class per service, each method maps to a handler registered
 * in PrismController._registerHandlers().
 */
import { ProtoBusClient, StreamCallbacks } from "./grpc-client-base"

// ---------------------------------------------------------------------------
// StateService
// ---------------------------------------------------------------------------

export interface GetStateResponse {
  stateJson: string
}

export class StateServiceClient extends ProtoBusClient {
  /** Subscribe to state updates. Returns unsubscribe function. */
  static subscribeToState(callbacks: StreamCallbacks<GetStateResponse>): () => void {
    return this.makeStreamingRequest("StateService", "subscribeToState", {}, callbacks)
  }

  /** Get current state once (unary). */
  static getState(): Promise<GetStateResponse> {
    return this.makeUnaryRequest("StateService", "getState", {})
  }
}

// ---------------------------------------------------------------------------
// UiService
// ---------------------------------------------------------------------------

export interface InitializeWebviewResponse {
  ok: boolean
}

export class UiServiceClient extends ProtoBusClient {
  /** Called by webview on mount to trigger workspace detection and state push. */
  static initializeWebview(): Promise<InitializeWebviewResponse> {
    return this.makeUnaryRequest("UiService", "initializeWebview", {})
  }
}

// ---------------------------------------------------------------------------
// WorkflowService
// ---------------------------------------------------------------------------

export type WorkflowTransition =
  | "start_research"
  | "start_plan"
  | "start_implement"
  | "start_validate"
  | "complete"
  | "reset"

export interface TransitionResponse {
  ok: boolean
  newPhase?: string
  error?: string
}

export interface AvailableTransitionsResponse {
  transitions: WorkflowTransition[]
}

export class WorkflowServiceClient extends ProtoBusClient {
  static transition(transition: WorkflowTransition): Promise<TransitionResponse> {
    return this.makeUnaryRequest("WorkflowService", "transition", { transition })
  }

  static getAvailableTransitions(): Promise<AvailableTransitionsResponse> {
    return this.makeUnaryRequest("WorkflowService", "getAvailableTransitions", {})
  }
}

// ---------------------------------------------------------------------------
// ChatService
// ---------------------------------------------------------------------------

export interface ChatResponse {
  ok: boolean
  error?: string
}

export class ChatServiceClient extends ProtoBusClient {
  /** Send a user message to the AI. */
  static sendMessage(text: string): Promise<ChatResponse> {
    return this.makeUnaryRequest("ChatService", "sendMessage", { text })
  }

  /** Abort the current streaming task. */
  static abortTask(): Promise<ChatResponse> {
    return this.makeUnaryRequest("ChatService", "abortTask", {})
  }

  /** Clear all chat messages. */
  static clearMessages(): Promise<ChatResponse> {
    return this.makeUnaryRequest("ChatService", "clearMessages", {})
  }

  /** Approve or deny a pending tool use. */
  static approveToolUse(toolUseId: string, approved: boolean): Promise<ChatResponse> {
    return this.makeUnaryRequest("ChatService", "approveToolUse", { toolUseId, approved })
  }

  /** Set the Anthropic API key. */
  static setApiKey(apiKey: string): Promise<ChatResponse> {
    return this.makeUnaryRequest("ChatService", "setApiKey", { apiKey })
  }
}

// ---------------------------------------------------------------------------
// PluginService (Phase 4: Claude CLI Integration)
// ---------------------------------------------------------------------------

export interface PluginResponse {
  ok: boolean
  error?: string
}

export interface CheckCliResponse {
  hasClaudeCli: boolean
}

export interface GetSkillsResponse {
  skills: Record<string, string>
}

export class PluginServiceClient extends ProtoBusClient {
  /** Execute a Prism plugin skill via Claude CLI. */
  static executeSkill(skillName: string, args?: string): Promise<PluginResponse> {
    return this.makeUnaryRequest("PluginService", "executeSkill", { skillName, args })
  }

  /** Terminate the running plugin skill. */
  static terminateSkill(): Promise<PluginResponse> {
    return this.makeUnaryRequest("PluginService", "terminateSkill", {})
  }

  /** Check if Claude CLI is available. */
  static checkCli(): Promise<CheckCliResponse> {
    return this.makeUnaryRequest("PluginService", "checkCli", {})
  }

  /** Get the available skill commands and their mappings. */
  static getSkills(): Promise<GetSkillsResponse> {
    return this.makeUnaryRequest("PluginService", "getSkills", {})
  }
}
