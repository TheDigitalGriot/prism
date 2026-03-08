---
title: Agent Screen
description: Interactive chat interface with conversation history browsing, real-time streaming, thinking block visualization, tool activity tracking, and text input.
outline: [2, 3]
---

# Agent Screen

An interactive chat interface with conversation history browsing, real-time streaming, thinking block visualization, tool activity tracking, and text input. Uses the **adapter system** (`app/adapter/`) to scan AI agent conversation files from disk. Supports wide mode (sidebar + chat) and compact mode (chat only).

## Adapter System

The Agent screen uses a pluggable `Adapter` interface to discover conversation sessions:

| Adapter | ID | Data Source | Format |
|---------|----|-------------|--------|
| `ClaudeAdapter` | `"claude"` | `~/.claude/projects/` | `.jsonl` per session |

Each adapter implements: `ID()`, `Name()`, `Available()`, `ScanSessions()`, `LoadMessages(path)`.

**Session** metadata includes: ID, Title (first user message excerpt), Path, ProjectPath, CreatedAt, UpdatedAt, MessageCount, TokenCount, Model.

The sidebar groups sessions by date (Today, Yesterday, This Week, etc.). `ClaudeAdapter.decodeProjectPath()` converts Claude's directory encoding (`c--Users-digit-Developer-prism-plugin`) back to filesystem paths.

### Structured Content Parts (v2.4.1)

Messages use a structured `ContentPart` system for rich rendering of tool calls, thinking blocks, and agent spawns:

```go
type ContentPart struct {
    Type     PartType   // PartText, PartToolCall, PartToolResult, PartThinking, PartAgent
    Text     string     // For text/thinking content
    ToolName, ToolInput, ToolOutput, ToolStatus, ToolID string  // For tools
    AgentID, AgentName, AgentType string                        // For agents
    AgentParts []ContentPart                                    // Nested agent content
}
```

**Message rendering** (`chat/renderer.go`) supports:
- **User messages**: `"> "` prompt prefix with blue styling
- **Assistant messages**: Left accent bar (`▎`) with dark background, Glamour markdown rendering + structured parts below
- **Tool messages**: Compact single-line with animated status: `⠋ ToolName` (running spinner) → `✓ ToolName` (complete) → `✗ ToolName` (error)
- **Thinking blocks**: Dim italic text with `💭` prefix, rendered as Claude reasons through problems
- **Agent spawns**: `▸ AgentDescription` with collapsible nested parts and indentation

The `RenderParts(parts []ContentPart, width int, collapsed bool) string` function renders structured parts with proper styling, called from `plugin_agent.go` when MarkdownMode is enabled.

### Streaming & Activity Visualization (v2.4.1)

The Agent screen now supports real-time streaming with live visualization of Claude's internal activity:

| Feature | Description |
|---------|-------------|
| **Incremental streaming** | Text appears character-by-character via `--output-format stream-json` |
| **Thinking blocks** | Extended thinking content renders as dim italic `💭 text...` in real-time |
| **Tool spinners** | Running tools show animated braille spinner (`⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏`) at 80ms tick rate |
| **Agent tracking** | Subagent spawns tracked via `AgentTracker` with status (running/complete/error) |
| **Signal detection** | Spectrum signals (`<spectrum-continue>`, `<spectrum-retry>`, etc.) displayed in separator bar |

**Enhanced Status Separator Bar** (displayed between messages during streaming):

```
Research | ⬤ streaming… · Read src/main.go | 1.2k in / 0.5k out | 5s | [signal]
─────────  ──────────────────────────────   ──────────────────   ──   ────────
 Phase       Active tool name                 Token counts       Time   Signal
```

**Streaming internals** (`plugin_agent.go`):
- `upsertStreamingMessage()` — creates or updates the last assistant message with accumulated stream text
- `appendPart()` — adds structured parts (tool calls, thinking, agents) to current message
- `updateToolPartStatus()` — finds tool parts by ID and updates status with render cache invalidation
- Streaming messages bypass the render cache to show real-time updates

## UI Layout — Wide Mode

```
╭──────── 1/3 ────────╮╭─────────────── 2/3 ──────────────────────────────────╮
│ CONVERSATIONS        ││                                                       │
│ ────────────────    ││   How do I implement authentication?                  │
│ ── Today ─────────  ││                          ┌──────────────────────────┐ │
│ > Fix auth bug       ││                          │ ▎ Use OAuth2 + JWT.     │ │
│   Add dark mode      ││                          │ ▎ Here's the approach:  │ │
│ ── Yesterday ─────  ││                          │ ▎ 💭 Considering the... │ │
│   Refactor API       ││                          │ ▎ ✓ Read auth.ts       │ │
│                      ││                          │ ▎ ⠋ Edit routes.ts     │ │
│                      ││                          └──────────────────────────┘ │
│                      ││ Research | ⬤ streaming… · Edit routes.ts | 12s      │
│                      ││ ┌──────────────────────────────────────────────────┐  │
│                      ││ │ Type a message... (Ctrl+Enter to send)          │  │
│                      ││ └──────────────────────────────────────────────────┘  │
╰──────────────────────╯╰──────────────────────────────────────────────────────╯
```

## UI Layout — Compact Mode

When `WideMode == false` or terminal width < 60 columns, the sidebar is hidden and the chat fills the full width:

```
╭──────────────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   How do I implement authentication?                                        │
│                          ┌──────────────────────────────────────────────┐    │
│                          │ ▎ Use OAuth2 + JWT. Here's the approach:    │    │
│                          │ ▎                                           │    │
│                          │ ▎ 💭 Let me think about the best...        │    │
│                          │ ▎ ✓ Read auth.ts                           │    │
│                          │ ▎ ✓ Read middleware.ts                     │    │
│                          │ ▎ ⠹ Edit routes.ts                        │    │
│                          │ ▎                                           │    │
│                          │ ▎ 1. Set up passport.js middleware          │    │
│                          └──────────────────────────────────────────────┘    │
│ Implement | ⬤ streaming… · Edit routes.ts | 8s                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Type a message... (Ctrl+Enter to send)                                  │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
╰──────────────────────────────────────────────────────────────────────────────╯
```

## UI Layout — Analytics View

Toggle with `a`. In wide mode, the analytics panel replaces the chat pane (sidebar stays visible):

```
╭──────── 1/3 ────────╮╭─────────────── 2/3 ──────────────────────────────────╮
│ CONVERSATIONS        ││ Usage Analytics                                      │
│ ────────────────    ││ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│ ── Today ─────────  ││ 12 sessions  |  1,247 messages  |  Feb 4 - Feb 28   │
│ > Fix auth bug       ││                                                      │
│   Add dark mode      ││ Model Usage                                          │
│ ── Yesterday ─────  ││ ──────────────────────────────────────────────────   │
│   Refactor API       ││ Opus     ████████████████████░░░░  847,231 tokens    │
│                      ││ Sonnet   ████████████░░░░░░░░░░░░  512,108 tokens    │
│                      ││ Haiku    ████░░░░░░░░░░░░░░░░░░░░  128,450 tokens    │
│                      ││                                                      │
│                      ││ Estimated Cost                                       │
│                      ││ ──────────────────────────────────────────────────   │
│                      ││ Opus:   $31.78   Sonnet: $3.84   Haiku: $0.05       │
│                      ││ Total:  $35.67                                       │
╰──────────────────────╯╰──────────────────────────────────────────────────────╯
```

### Analytics Mode

Toggle with `a`. Shows token usage and cost breakdown by model for the loaded conversation:

When analytics mode is active, the chat pane is replaced with the analytics panel (`plugin_agent.go:760-764`).

### Analytics Pricing

| Model | Input Cost | Output Cost | Per |
|-------|-----------|-------------|-----|
| Opus | $15.00 | $75.00 | 1M tokens |
| Sonnet | $3.00 | $15.00 | 1M tokens |
| Haiku | $0.25 | $1.25 | 1M tokens |

## Key Bindings

| Key | Action |
|-----|--------|
| `Ctrl+B` | Toggle wide/compact mode |
| `Ctrl+Enter` | Send message |
| `j` / `k` | Navigate conversations (sidebar) or scroll messages (chat) |
| `Enter` | Load selected conversation |
| `m` | Toggle Glamour/lite markdown rendering (now also renders structured parts) |
| `a` | Toggle analytics view |
| `Tab` | Toggle sidebar ↔ input focus |
| `Esc` / `Backspace` | Focus Home |
