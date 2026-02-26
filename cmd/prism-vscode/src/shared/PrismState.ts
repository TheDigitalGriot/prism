import { WorkflowPhase } from "./types"
import type { Story, Plan } from "../prism/stories"
import type { WorkflowContext } from "../core/controller/prism/workflow"
import type { SpectrumState } from "../core/controller/prism/spectrum"
import type { PrismChatMessage } from "../core/api/types"

/**
 * Extension state broadcast to the webview via StateService.subscribeToState.
 * Serialized as JSON in the grpc_response message.
 */
export interface PrismExtensionState {
  version: string
  /** true once the first real state has been sent to webview */
  didHydrateState: boolean

  // -------------------------------------------------------------------------
  // Workspace detection
  // -------------------------------------------------------------------------
  hasPrismDir: boolean
  hasStoriesJson: boolean
  prismDir: string | undefined
  storiesPath: string | undefined

  // -------------------------------------------------------------------------
  // Workflow phase + context
  // -------------------------------------------------------------------------
  workflowPhase: WorkflowPhase
  workflowContext: WorkflowContext

  // -------------------------------------------------------------------------
  // Stories (loaded from stories.json)
  // -------------------------------------------------------------------------
  stories: Story[]
  plan: Plan | undefined
  completedCount: number
  remainingCount: number

  // -------------------------------------------------------------------------
  // Chat (Phase 3)
  // -------------------------------------------------------------------------
  chatMessages: PrismChatMessage[]
  isChatStreaming: boolean
  /** ID of tool use waiting for approval (if any) */
  pendingApprovalToolUseId: string | undefined
  /** Whether a task is currently active (has chat history) */
  hasActiveTask: boolean

  // -------------------------------------------------------------------------
  // Spectrum (Phase 5 placeholder)
  // -------------------------------------------------------------------------
  spectrum: SpectrumState

  // -------------------------------------------------------------------------
  // Config
  // -------------------------------------------------------------------------
  defaultModel: string
  planningModel: string
  hasApiKey: boolean
}

export const DEFAULT_PRISM_STATE: PrismExtensionState = {
  version: "2.1.8",
  didHydrateState: false,
  hasPrismDir: false,
  hasStoriesJson: false,
  prismDir: undefined,
  storiesPath: undefined,
  workflowPhase: WorkflowPhase.Idle,
  workflowContext: {},
  stories: [],
  plan: undefined,
  completedCount: 0,
  remainingCount: 0,
  chatMessages: [],
  isChatStreaming: false,
  pendingApprovalToolUseId: undefined,
  hasActiveTask: false,
  spectrum: {
    executionState: "idle",
    currentIteration: 0,
    maxIterations: 50,
    consecutiveErrors: 0,
  },
  defaultModel: "sonnet",
  planningModel: "opus",
  hasApiKey: false,
}
