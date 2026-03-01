/**
 * API stream chunk types — used by PrismApiHandler and PrismTask.
 *
 * Mirrors Anthropic SDK stream events but simplified for our use case.
 */

// ---------------------------------------------------------------------------
// Stream chunks (AsyncGenerator output)
// ---------------------------------------------------------------------------

export interface TextChunk {
  type: "text"
  text: string
}

export interface InputJsonDeltaChunk {
  type: "input_json_delta"
  toolUseId: string
  delta: string
}

export interface ToolCallChunk {
  type: "tool_call"
  toolName: string
  toolInput: Record<string, unknown>
  toolUseId: string
}

export interface UsageChunk {
  type: "usage"
  inputTokens: number
  outputTokens: number
}

export type ApiStreamChunk = TextChunk | InputJsonDeltaChunk | ToolCallChunk | UsageChunk

/** AsyncGenerator that yields API stream chunks. */
export type ApiStream = AsyncGenerator<ApiStreamChunk>

// ---------------------------------------------------------------------------
// Conversation message types (passed to Claude API)
// ---------------------------------------------------------------------------

export interface ApiTextContent {
  type: "text"
  text: string
}

export interface ApiToolUseContent {
  type: "tool_use"
  id: string
  name: string
  input: Record<string, unknown>
}

export interface ApiToolResultContent {
  type: "tool_result"
  tool_use_id: string
  content: string | { type: "text"; text: string }[]
  is_error?: boolean
}

export type ApiMessageContent =
  | ApiTextContent
  | ApiToolUseContent
  | ApiToolResultContent

export interface ApiConversationMessage {
  role: "user" | "assistant"
  content: string | ApiMessageContent[]
}

// ---------------------------------------------------------------------------
// Tool definition (for Claude API)
// ---------------------------------------------------------------------------

export interface ApiToolDefinition {
  name: string
  description: string
  input_schema: {
    type: "object"
    properties: Record<string, { type: string; description: string }>
    required?: string[]
  }
}

// ---------------------------------------------------------------------------
// Prism chat message types (UI-level)
// ---------------------------------------------------------------------------

export type PrismMessageType =
  | "user"
  | "assistant_text"
  | "tool_use"
  | "tool_result"
  | "completion"
  | "error"

export interface PrismChatMessage {
  id: string
  ts: number
  type: PrismMessageType
  /** For 'user' and 'assistant_text' */
  text?: string
  /** True while Claude is still streaming this message */
  isStreaming?: boolean
  /** For 'tool_use' */
  toolName?: string
  toolInput?: Record<string, unknown>
  toolUseId?: string
  /** Whether this tool needs explicit user approval */
  needsApproval?: boolean
  /** User's approval decision */
  approved?: boolean
  /** For 'tool_result' */
  toolResult?: string
  isToolError?: boolean
  /** For 'completion' */
  completionText?: string
  /** For 'error' */
  errorText?: string
}
