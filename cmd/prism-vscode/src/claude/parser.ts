/**
 * Claude CLI output parser — port of cmd/prism-cli/claude/parser.go + events.go.
 *
 * Parses stream-json lines from the Claude CLI, extracting:
 * - Tool activity (human-readable descriptions)
 * - Phase detection from keywords
 * - Signal detection (Spectrum protocol)
 * - Story announcements
 * - Quality gate results
 */

import {
  ClaudeStreamEvent,
  ContentBlock,
  ToolActivity,
  PhaseDetection,
} from "./events"
import { parseSignal, parseStoryAnnouncement, type Signal } from "../prism/signals"

// ---------------------------------------------------------------------------
// Stream-JSON line parsing
// ---------------------------------------------------------------------------

/**
 * Parse a single JSON line from `claude --output-format stream-json`.
 * Returns null if the line isn't valid JSON.
 */
export function parseStreamEvent(line: string): ClaudeStreamEvent | null {
  try {
    return JSON.parse(line) as ClaudeStreamEvent
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Tool activity extraction (port of events.go → ExtractToolActivity)
// ---------------------------------------------------------------------------

/** Shorten a file path for display — shows last 2 path components if long. */
function shortenPath(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/")
  if (normalized.length <= 50) return normalized
  const parts = normalized.split("/")
  if (parts.length >= 2) {
    return ".../" + parts.slice(-2).join("/")
  }
  return truncate(normalized, 50)
}

/** Truncate a string to max length with ellipsis. */
function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max - 3) + "..."
}

/** Common tool input fields we look for in JSON input. */
interface ToolInputFields {
  command?: string
  file_path?: string
  pattern?: string
  description?: string
  prompt?: string
  url?: string
}

/**
 * Format a tool_use content block into a human-readable description.
 * Port of events.go → formatToolUse.
 */
function formatToolUse(toolName: string, input: Record<string, unknown> | undefined): string {
  const inp = (input ?? {}) as ToolInputFields

  switch (toolName) {
    case "Read":
      return inp.file_path ? `Reading: ${shortenPath(inp.file_path)}` : "Reading file..."

    case "Edit":
      return inp.file_path ? `Editing: ${shortenPath(inp.file_path)}` : "Editing file..."

    case "Write":
      return inp.file_path ? `Writing: ${shortenPath(inp.file_path)}` : "Writing file..."

    case "Bash": {
      if (inp.command) {
        // Playwright-CLI activity detection
        if (inp.command.includes("playwright-cli")) {
          if (inp.command.includes("screenshot")) return "Capturing: screenshot"
          if (inp.command.includes("snapshot")) return "Verifying: page structure"
          if (inp.command.includes("console")) return "Checking: console errors"
          if (inp.command.includes("network")) return "Checking: network requests"
          if (inp.command.includes("open")) return "Opening: browser"
          if (inp.command.includes("session-close")) return "Closing: browser session"
          if (inp.command.includes("tracing")) return "Recording: browser trace"
          return `Browser: ${truncate(inp.command, 40)}`
        }
        return `Running: ${truncate(inp.command, 50)}`
      }
      return inp.description ? `Running: ${truncate(inp.description, 50)}` : "Running command..."
    }

    case "Glob":
      return inp.pattern ? `Finding: ${inp.pattern}` : "Searching files..."

    case "Grep":
      return inp.pattern ? `Searching: ${truncate(inp.pattern, 40)}` : "Searching content..."

    case "Task":
      return inp.description ? `Agent: ${truncate(inp.description, 50)}` : "Spawning agent..."

    case "WebFetch":
      return inp.url ? `Fetching: ${truncate(inp.url, 50)}` : "Fetching URL..."

    case "WebSearch":
      return "Web search..."

    case "TodoWrite":
      return "Updating tasks..."

    case "AskUserQuestion":
      return "Asking question..."

    default:
      return `Using: ${toolName}`
  }
}

/**
 * Extract a human-readable tool activity description from a stream event.
 * Port of events.go → ExtractToolActivity.
 */
export function extractToolActivity(event: ClaudeStreamEvent): ToolActivity | null {
  // Handle assistant messages with tool_use content blocks
  if (event.type === "assistant" && event.message) {
    for (const block of event.message.content) {
      if (block.type === "tool_use" && block.name) {
        return {
          toolName: block.name,
          description: formatToolUse(block.name, block.input),
          isComplete: false,
          timestamp: Date.now(),
        }
      }
    }
    // Check for text content (first line, truncated)
    for (const block of event.message.content) {
      if (block.type === "text" && block.text) {
        const firstLine = block.text.split("\n")[0]
        return {
          toolName: "text",
          description: truncate(firstLine, 80),
          isComplete: false,
          timestamp: Date.now(),
        }
      }
    }
  }

  // Handle tool_result events
  if (event.type === "tool_result") {
    return {
      toolName: "tool_result",
      description: "Processing tool result...",
      isComplete: false,
      timestamp: Date.now(),
    }
  }

  // Handle result events
  if (event.type === "result") {
    return {
      toolName: "result",
      description: event.is_error ? `Error: ${truncate(event.result ?? "", 60)}` : "Completed",
      isComplete: true,
      timestamp: Date.now(),
    }
  }

  return null
}

/** Extract tool name from a stream event. */
export function getToolName(event: ClaudeStreamEvent): string {
  if (event.message) {
    for (const block of event.message.content) {
      if (block.type === "tool_use" && block.name) {
        return block.name
      }
    }
  }
  return ""
}

// ---------------------------------------------------------------------------
// Phase detection (port of parser.go → detectPhase)
// ---------------------------------------------------------------------------

/**
 * Detect the current execution phase from a line of output.
 * Uses keyword heuristics matching parser.go → detectPhase.
 */
export function detectPhase(line: string): PhaseDetection | null {
  const lower = line.toLowerCase()

  // Research phase indicators
  if (
    lower.includes("research") ||
    lower.includes("exploring") ||
    lower.includes("reading file") ||
    lower.includes("searching")
  ) {
    return { phase: "Research", source: line }
  }

  // Planning phase indicators
  if (
    lower.includes("planning") ||
    lower.includes("designing") ||
    lower.includes("approach")
  ) {
    return { phase: "Planning", source: line }
  }

  // Implementation phase indicators
  if (
    lower.includes("implementing") ||
    lower.includes("writing") ||
    lower.includes("creating") ||
    lower.includes("modifying") ||
    lower.includes("editing file")
  ) {
    return { phase: "Implementation", source: line }
  }

  // Browser verification phase indicators
  if (
    lower.includes("playwright") ||
    lower.includes("browser verification") ||
    lower.includes("screenshot") ||
    lower.includes("capturing") ||
    lower.includes("console errors")
  ) {
    return { phase: "Browser Verification", source: line }
  }

  // Quality gates phase
  if (
    lower.includes("quality gate") ||
    lower.includes("typecheck") ||
    lower.includes("lint") ||
    lower.includes("npm run")
  ) {
    return { phase: "Quality Gates", source: line }
  }

  // Commit phase
  if (lower.includes("commit") || lower.includes("git add")) {
    return { phase: "Committing", source: line }
  }

  return null
}

// ---------------------------------------------------------------------------
// Quality gate result extraction (port of parser.go → ExtractQualityGateResult)
// ---------------------------------------------------------------------------

/** Parse quality gate results from accumulated output. */
export function extractQualityGateResults(output: string): Record<string, boolean> {
  const results: Record<string, boolean> = {}
  for (const line of output.split("\n")) {
    const lower = line.toLowerCase()
    if (lower.includes("typecheck")) {
      results["typecheck"] = !lower.includes("fail") && !lower.includes("error")
    }
    if (lower.includes("lint")) {
      results["lint"] = !lower.includes("fail") && !lower.includes("error")
    }
    if (lower.includes("test")) {
      if (lower.includes("passed") || lower.includes("ok")) {
        results["test"] = true
      } else if (lower.includes("failed") || lower.includes("error")) {
        results["test"] = false
      }
    }
  }
  return results
}

// ---------------------------------------------------------------------------
// OutputParser — stateful line-by-line parser (port of parser.go)
// ---------------------------------------------------------------------------

export type ParseEventType =
  | "story_announced"
  | "phase_changed"
  | "signal_detected"
  | "quality_gate_started"
  | "quality_gate_result"
  | "commit_created"

export interface ParseEvent {
  type: ParseEventType
  storyId?: string
  storyTitle?: string
  phase?: string
  signal?: Signal
  message?: string
}

/**
 * Stateful output parser — accumulates output and detects events.
 * Port of parser.go → OutputParser.
 */
export class OutputParser {
  private _buffer = ""
  private _lastSignalType = "none"
  private _currentPhase = ""
  private _storyId = ""
  private _storyTitle = ""

  /** Process a line and return any detected events. */
  parseLine(line: string): ParseEvent[] {
    const events: ParseEvent[] = []
    this._buffer += line + "\n"

    // Check for story announcement
    const announcement = parseStoryAnnouncement(this._buffer)
    if (announcement && announcement.id !== this._storyId) {
      this._storyId = announcement.id
      this._storyTitle = announcement.title
      events.push({
        type: "story_announced",
        storyId: announcement.id,
        storyTitle: announcement.title,
      })
    }

    // Check for phase changes
    const phaseDetection = detectPhase(line)
    if (phaseDetection && phaseDetection.phase !== this._currentPhase) {
      this._currentPhase = phaseDetection.phase
      events.push({
        type: "phase_changed",
        phase: phaseDetection.phase,
      })
    }

    // Check for quality gate indicators
    if (
      line.includes("Running quality gates") ||
      line.includes("npm run typecheck") ||
      line.includes("npm run lint") ||
      line.includes("npm test")
    ) {
      events.push({
        type: "quality_gate_started",
        message: line,
      })
    }

    // Check for commit creation
    if (line.includes("git commit") || line.includes("[STORY-")) {
      events.push({
        type: "commit_created",
        message: line,
      })
    }

    // Check for signal in accumulated buffer
    const signal = parseSignal(this._buffer)
    if (signal.type !== "none" && signal.type !== this._lastSignalType) {
      this._lastSignalType = signal.type
      events.push({
        type: "signal_detected",
        signal,
        storyId: this._storyId,
      })
    }

    return events
  }

  get lastSignalType(): string {
    return this._lastSignalType
  }

  get currentPhase(): string {
    return this._currentPhase
  }

  get storyId(): string {
    return this._storyId
  }

  get storyTitle(): string {
    return this._storyTitle
  }

  get fullOutput(): string {
    return this._buffer
  }

  /** Reset state for a new iteration. */
  reset(): void {
    this._buffer = ""
    this._lastSignalType = "none"
    this._currentPhase = ""
    this._storyId = ""
    this._storyTitle = ""
  }
}
