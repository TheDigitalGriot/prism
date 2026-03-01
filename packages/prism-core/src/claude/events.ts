/**
 * Stream event types for Claude CLI `--output-format stream-json`.
 *
 * Port of cmd/prism-cli/claude/events.go — each JSON line from stdout
 * is one of these event shapes.
 */

// ---------------------------------------------------------------------------
// Stream-JSON event (raw from CLI)
// ---------------------------------------------------------------------------

/** Content block inside an assistant message. */
export interface ContentBlock {
  type: "text" | "tool_use" | "tool_result"
  /** For type=text */
  text?: string
  /** For type=tool_use */
  id?: string
  name?: string
  input?: Record<string, unknown>
}

/** The assistant message payload inside a stream event. */
export interface AssistantMessage {
  content: ContentBlock[]
}

/**
 * A single parsed JSON line from `claude --output-format stream-json`.
 *
 * Event types observed:
 *   "assistant"    — Claude's response with content blocks
 *   "tool_result"  — result of a tool execution
 *   "result"       — final result (completion)
 *   "system"       — system-level messages
 */
export interface ClaudeStreamEvent {
  type: "assistant" | "tool_result" | "result" | "system"
  subtype?: string

  /** For tool_use events */
  tool_use_id?: string
  tool?: { name: string; input?: Record<string, unknown> }

  /** For assistant message events */
  message?: AssistantMessage

  /** For result events */
  result?: string
  is_error?: boolean
  duration_ms?: number
}

// ---------------------------------------------------------------------------
// Parsed event types (enriched for the extension)
// ---------------------------------------------------------------------------

/** Human-readable tool activity extracted from stream events. */
export interface ToolActivity {
  toolName: string
  description: string
  isComplete: boolean
  timestamp: number
}

/** Phase detection from output keywords. */
export interface PhaseDetection {
  phase: "Research" | "Planning" | "Implementation" | "Browser Verification" | "Quality Gates" | "Committing"
  source: string
}

/** Raw output line from the CLI process. */
export interface RawOutput {
  text: string
  isStderr: boolean
  timestamp: number
}

// ---------------------------------------------------------------------------
// Union type for all events emitted by the runner
// ---------------------------------------------------------------------------

export type ClaudeRunnerEvent =
  | { type: "started"; pid: number }
  | { type: "output"; data: RawOutput }
  | { type: "stream_event"; event: ClaudeStreamEvent }
  | { type: "tool_activity"; activity: ToolActivity }
  | { type: "phase_detected"; detection: PhaseDetection }
  | { type: "signal_detected"; signalType: string; content: string; reason: string }
  | { type: "story_announced"; storyId: string; storyTitle: string }
  | { type: "finished"; exitCode: number; output: string; durationMs: number; error?: string }
  | { type: "error"; message: string }
