# Agent Chat: Thinking & Activity Visualization Research

**Date**: 2026-03-04
**Type**: Research — Streaming Visualization Gap Analysis
**Status**: Complete
**Predecessor**: `2026-03-04-agent-chat-opencode-codebuff-analysis.md`

---

## Research Question

How do OpenCode and Codebuff communicate thinking/reasoning and background activity (tool calls, agent spawns, progress) in their TUI interfaces, and what does Prism CLI need to change to achieve similar visibility?

## Summary

Both OpenCode and Codebuff display rich real-time activity: thinking blocks, per-tool spinners, agent status indicators, and streaming progress. Prism CLI's infrastructure already captures most events via agentbus but **renders almost none of them** due to a MarkdownMode rendering conflict. The fix requires three layers: (1) bridge missing stream-json events (thinking, `content_block_delta`), (2) fix the MarkdownMode render path to include Parts alongside text, and (3) add visual indicators (spinners, status badges, phase display).

---

## Part 1: What Prism CLI Currently Captures vs Displays

### Events That Flow Through Agentbus

| Event | Published? | UI Handler? | User Sees It? |
|-------|-----------|-------------|---------------|
| `EventTextDelta` | Yes | Yes — `upsertStreamingMessage()` | **YES** — streaming text in chat |
| `EventToolCallStart` | Yes | Yes — `appendPart(PartToolCall)` | **NO** — Parts not rendered when MarkdownMode=true (default) |
| `EventToolCallComplete` | Yes | Yes — `updateToolPartStatus()` | **NO** — same MarkdownMode conflict |
| `EventAgentSpawnStart` | Yes | Yes — `appendPart(PartAgent)` | **NO** — same issue |
| `EventAgentSpawnFinish` | Defined | Yes (handler exists) | **NO** — never published by any code path |
| `EventPhaseChanged` | Yes | Yes — sets `p.currentPhase` | **NO** — state stored but never rendered |
| `EventSignalDetected` | Yes | **No handler** | **NO** — silently dropped |
| `EventMessageComplete` | Yes | Yes — resets streaming | **YES** — streaming indicator disappears |
| `EventPermissionRequired` | Yes | Yes — opens dialog | **YES** — modal permission dialog |
| `EventQuestionAsked` | Defined | Yes (handler exists) | **NO** — never published from stream bridge |
| `EventCostUpdate` | Yes | Yes — accumulates | **YES** — cost in separator bar |
| `EventStreamError` | Yes | Yes — error message | **YES** — error in chat |
| `EventProcessExited` | Yes | Yes — cleanup | **YES (indirect)** — streaming stops |
| `EventToolCallProgress` | Defined | No | **NO** — never published, no handler |
| `EventTextComplete` | Defined | No | **NO** — never published, no handler |

### The MarkdownMode Rendering Conflict

**Root cause**: `plugin_agent.go:renderMessages()` at line 1362 — when `MarkdownMode=true` (the default), assistant messages render ONLY `msg.Content` (flat text) through Glamour markdown. The `msg.Parts` array (tool calls, agent spawns, thinking) is **completely bypassed**.

Parts-based rendering (`chat/renderer.go:130-136`) only executes when `MarkdownMode=false` — but that path uses a basic markdown-lite renderer without Glamour.

**Impact**: Tool calls, agent spawns, and thinking blocks are tracked in state but invisible to the user. Only raw streaming text appears.

### Missing Stream-JSON Bridges

| Stream Event | ContentBlock Type | Bridged to Agentbus? |
|-------------|-------------------|---------------------|
| `assistant` | `text` | Yes — `EventTextDelta` |
| `assistant` | `tool_use` | Yes — `EventToolCallStart` or `EventAgentSpawnStart` |
| `assistant` | `thinking` | **NO** — no case in `BridgeStreamToBus` switch |
| `tool_result` | — | Yes — `EventToolCallComplete` |
| `result` | — | Yes — `EventMessageComplete` |
| `stream_event` (partial) | `content_block_delta` | **NO** — not parsed at all (requires `--include-partial-messages` flag) |

### Existing Part Types (chat/renderer.go)

| PartType | Defined? | Renderer? | Created by handleBusEvent? |
|----------|----------|-----------|---------------------------|
| `PartText` | Yes | Yes — `renderMarkdownLite()` | No (text goes to Content, not Parts) |
| `PartToolCall` | Yes | Yes — `▸ ToolName input` / `✓` / `✗` | Yes — `EventToolCallStart` |
| `PartToolResult` | Yes | Yes — `└ output...` | No — never created |
| `PartThinking` | Yes | Yes — `💭 text...` (dim italic) | **No** — thinking not bridged from stream |
| `PartAgent` | Yes | Yes — `▸ AgentDesc` (nested) | Yes — `EventAgentSpawnStart` |

---

## Part 2: How OpenCode Does It

### Activity Display Architecture

OpenCode uses a SolidJS-based TUI with three key visual layers:

#### 1. Thinking/Reasoning Display
- `ReasoningPart` component renders thinking in a bordered box with left accent bar
- Content shown in `theme.textMuted` color, italic, prefixed with `_Thinking:_ `
- Visibility togglable via command palette ("Show thinking" / "Hide thinking")
- Streams incrementally via `message.part.delta` events

#### 2. Tool Call Rendering (15+ tool-specific renderers)
- **Two visual forms**: `InlineTool` (compact one-line) and `BlockTool` (expandable panel)
- **InlineTool**: icon + tool name + params, e.g., `→ Read src/index.ts`
- **BlockTool**: bordered panel with title, expandable output (used for Bash, Edit with diffs)
- **Running state**: Braille dot spinner (`⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏` at 80ms) replaces icon
- **Status suffix**: `" running"` in primary color while active
- **Collapse logic**: Completed tools auto-collapse when "show details" is off

#### 3. Activity Indicators
- **Knight Rider scanner** below prompt: bidirectional scanning animation while busy
- **Braille spinners** inline with each running tool
- **Session status**: `idle` / `busy` / `retry` with retry countdown timer
- **16ms event batching**: Coalesces rapid events into single renders

### OpenCode Part Types (12 total, 3 rendered)
```
text → TextPart (markdown code component)
reasoning → ReasoningPart (bordered, toggleable, italic)
tool → ToolPart (dispatches to 15 tool-specific renderers)
file, compaction, subtask, step-start, step-finish, snapshot, patch, agent, retry → not rendered
```

### OpenCode Tool State Machine
```
pending → running → completed | error
```
Each tool carries `time.start`, `time.end`, `metadata`, `attachments`.

### OpenCode Subagent Display (Task tool)
- Shows `≡` icon with braille spinner while running
- Live progress: tool call count + currently executing tool name
- Example: `≡ Building the feature · 7 toolcalls └ Edit src/component.tsx`

---

## Part 3: How Codebuff Does It

### Activity Display Architecture

Codebuff uses React 19 with OpenTUI and Zustand state management.

#### 1. Thinking/Reasoning Display
- **Two sources**: native `reasoning_delta` events AND `<think>` tags in text
- Both produce `TextContentBlock` with `textType: 'reasoning'`
- Three collapse states: `expanded` | `preview` | `hidden`
- **Preview mode**: Last 5 lines, italic, muted color, prefixed with `"..."`
- **Toggle indicators**: `•` (streaming), `▾` (expanded), `▸` (collapsed)
- Clickable header to toggle states

#### 2. Tool Call Rendering (15 registered tools + generic fallback)
- **ToolCallItem** with expand/collapse: `▸`/`▾` toggle + tool name + status
- **Running indicator**: `" running"` in primary + DIM
- **Streaming preview**: First line of JSON input + `"..."` while running
- **Finished preview**: Completed content in muted italic
- **Per-tool custom renderers**: Read (file paths), Bash (`$ command` + output), Edit (diff viewer), etc.
- **Generic fallback**: JSON input display for unknown/MCP tools

#### 3. Multi-Agent Visualization
- `AgentContentBlock` with recursive nested `blocks[]` tree
- **Grid layout**: Multiple concurrent agents in responsive masonry columns
- **Bordered cards**: `borderColor` = primary (running) or muted (complete)
- **Status indicators**: `● running`, `✓ completed`, `✗ failed`, `⊘ cancelled`
- **Collapse defaults**: 11 agent types auto-collapsed, user overrides persist

#### 4. Activity Indicators
- **ShimmerText**: Animated HSL color wave across text (`"thinking..."`, `"working..."`)
- **Elapsed timer**: Running clock adjacent to status
- **State machine**: `waiting` → `streaming` → `idle` (or `retrying`, `paused`)

### Codebuff Event Types
```
start, text, tool_call, tool_result, subagent_start, subagent_finish,
reasoning_delta, finish, error, download
```

---

## Part 4: Claude CLI Stream-JSON Event Format

### Base Layer (current Prism behavior — complete messages only)

```json
{"type":"system","subtype":"init","session_id":"...","tools":[...],"model":"..."}
{"type":"assistant","message":{"role":"assistant","content":[
  {"type":"thinking","thinking":"Let me analyze...","signature":"EqQB..."},
  {"type":"text","text":"The answer is 42."},
  {"type":"tool_use","id":"tu_abc","name":"Bash","input":{"command":"ls"}}
]}}
{"type":"tool_result","tool_use_id":"tu_abc","content":"...","is_error":false}
{"type":"result","result":"Done.","is_error":false}
{"type":"permission_request","permission_request":{"id":"...","tool_name":"...","description":"...","preview":"..."}}
{"type":"usage","usage":{"input_tokens":150,"output_tokens":50,"model":"claude-opus-4-6"}}
```

**Key**: `thinking` blocks ARE present in `assistant` events as complete content blocks. Prism's `BridgeStreamToBus` just doesn't have a case for `block.Type == "thinking"`.

### Streaming Layer (with `--include-partial-messages`)

Adds `stream_event` wrapper events with incremental deltas:

```json
{"type":"stream_event","event":{"type":"content_block_start","index":0,"content_block":{"type":"thinking","thinking":""}}}
{"type":"stream_event","event":{"type":"content_block_delta","index":0,"delta":{"type":"thinking_delta","thinking":"Let me..."}}}
{"type":"stream_event","event":{"type":"content_block_delta","index":0,"delta":{"type":"signature_delta","signature":"EqQB..."}}}
{"type":"stream_event","event":{"type":"content_block_stop","index":0}}
{"type":"stream_event","event":{"type":"content_block_start","index":1,"content_block":{"type":"text","text":""}}}
{"type":"stream_event","event":{"type":"content_block_delta","index":1,"delta":{"type":"text_delta","text":"The answer"}}}
{"type":"stream_event","event":{"type":"content_block_stop","index":1}}
```

**Delta types**: `text_delta`, `thinking_delta`, `signature_delta`, `input_json_delta`

---

## Part 5: Gap Analysis — What Prism Needs

### Gap 1: MarkdownMode Blocks Part Rendering (CRITICAL)

**Current**: When `MarkdownMode=true`, `renderMessages()` renders only `msg.Content` via Glamour. All `msg.Parts` are invisible.

**Fix**: The markdown rendering path must interleave Parts with Content. Options:
- **A**: Render Parts inline within the Glamour output (complex)
- **B**: Render Parts below the Glamour text block (simpler, both OpenCode and Codebuff do this)
- **C**: Build a hybrid renderer that alternates between Glamour text sections and Part indicators

OpenCode approach: Text parts and tool parts are siblings in a flat list. Each renders independently. Codebuff approach: Same — blocks are processed sequentially, text and tools interleaved.

### Gap 2: Thinking Blocks Not Bridged

**Current**: `BridgeStreamToBus()` switch on `block.Type` has cases for `"text"` and `"tool_use"` only. Thinking blocks are silently dropped.

**Fix**: Add `"thinking"` case that publishes a new `EventThinkingDelta` (or reuse `EventTextDelta` with a flag). The `PartThinking` type and renderer already exist in `chat/renderer.go:24,149-151`.

### Gap 3: No Incremental Streaming (`content_block_delta`)

**Current**: Without `--include-partial-messages`, complete `assistant` messages arrive only after Claude finishes an entire response. The current `EventTextDelta` events come from complete assistant messages, not streaming deltas.

**Fix**: Add `--include-partial-messages` to CLI args and handle `stream_event` type in `streamConversationOutput`. Parse the nested `event` field for `content_block_delta` events to get true real-time streaming of text and thinking.

### Gap 4: Phase Not Rendered

**Current**: `p.currentPhase` is set by `EventPhaseChanged` handler but never displayed.

**Fix**: Render phase badge in separator bar, status line, or as a breadcrumb in the chat viewport.

### Gap 5: No Spinner/Activity Indicator for Running Tools

**Current**: Tool calls show as `▸ ToolName` (running) / `✓` (complete) / `✗` (error), but only in non-MarkdownMode. No animated spinner.

**Fix**: Add a Bubble Tea `spinner.Model` component for active tool calls (both OpenCode and Codebuff use braille dot spinners).

### Gap 6: No Streaming Status Beyond "streaming..."

**Current**: The separator bar shows `⬤ streaming...` while active, nothing else.

**Fix**: Show richer status: current phase, active tool name, elapsed time, tool call count.

### Gap 7: Signals Not Handled

**Current**: `EventSignalDetected` has no handler in `handleBusEvent`.

**Fix**: Add handler for Spectrum signals (`<spectrum-continue>`, `<spectrum-retry>`, `<spectrum-blocked>`).

---

## Part 6: Prioritized Implementation Order

### Tier 1: Make Existing Data Visible (Low effort, high impact)

1. **Fix MarkdownMode rendering to include Parts** — The data is already flowing through agentbus and stored in `msg.Parts`. The only issue is the render path skipping them.
2. **Bridge thinking blocks** — Add `"thinking"` case to `BridgeStreamToBus`, create `PartThinking` parts in `handleBusEvent`.
3. **Render currentPhase** — Display in separator bar or status area.

### Tier 2: Enhanced Streaming (Medium effort)

4. **Add `--include-partial-messages`** — Get true incremental text deltas instead of complete messages.
5. **Handle `stream_event` type** — Parse `content_block_delta` for text_delta and thinking_delta.
6. **Add tool spinners** — Bubble Tea spinner for running tools.
7. **Show active tool name in status** — e.g., `⬤ streaming... · Read src/main.go`

### Tier 3: Rich Activity Display (Higher effort)

8. **Expandable/collapsible tool output** — Like OpenCode's BlockTool/InlineTool pattern.
9. **Per-tool custom rendering** — Bash shows `$ command`, Read shows file path, Edit shows diff preview.
10. **Agent spawn tree** — Nested rendering for subagent activity.
11. **Elapsed timer** — Running clock while streaming.
12. **Shimmer/animation** — Knight Rider or shimmer text for activity status (Bubble Tea `harmonica` already available).

---

## Part 7: Key Architectural Patterns from References

### Pattern: Interleaved Parts Rendering (Both OpenCode and Codebuff)

Both render messages as a flat sequence of typed parts, not as "text blob + separate tool list":

```
[ThinkingPart] 💭 Let me analyze the codebase...
[TextPart]     Based on my analysis, I'll make these changes:
[ToolPart]     ⠋ Edit src/main.go                    ← spinner while running
[ToolPart]     ✓ Read package.json
[TextPart]     The changes are complete.
```

This interleaved approach preserves the narrative flow of the conversation.

### Pattern: Reactive Streaming Detection (Codebuff)

Individual tool/agent components subscribe to `streamingAgents.has(id)` rather than re-rendering on any streaming change. Prism equivalent: each Part could check `p.streaming && part.ToolStatus == "running"`.

### Pattern: Collapse Defaults with User Override (Both)

- Completed tools auto-collapse (OpenCode: when "show details" off; Codebuff: per-tool defaults)
- User can toggle, and override persists
- Prism already has `AgentCollapsed` map for agents; extend to tools

### Pattern: Two-Form Tool Display (OpenCode)

- **InlineTool**: `icon + name + summary` — for simple tools (Read, Grep, Glob)
- **BlockTool**: bordered expandable panel — for tools with output (Bash, Edit diffs)
- Decision based on tool type and whether output is available

---

## Referenced Files

| File | Relevance |
|------|-----------|
| `cmd/prism-cli/app/plugin_agent.go:1362-1376` | MarkdownMode rendering conflict |
| `cmd/prism-cli/app/plugin_agent.go:345-466` | handleBusEvent — event-to-UI dispatch |
| `cmd/prism-cli/app/chat/renderer.go:20-26,143-165` | Part types and rendering |
| `cmd/prism-cli/claude/conversation.go:224-234` | BridgeStreamToBus — missing thinking case |
| `cmd/prism-cli/agentbus/events.go:13-34` | Event type definitions |
| `.prism/shared/ref/opencode/packages/opencode/src/cli/cmd/tui/routes/session/index.tsx` | OpenCode part rendering |
| `.prism/shared/ref/opencode/packages/opencode/src/cli/cmd/tui/component/prompt/index.tsx` | OpenCode activity indicators |
| `.prism/shared/ref/opencode/packages/opencode/src/cli/cmd/tui/component/spinner.tsx` | Braille dot spinner |
| `.prism/shared/ref/codebuff/cli/src/components/tools/tool-call-item.tsx` | Codebuff tool expand/collapse |
| `.prism/shared/ref/codebuff/cli/src/components/thinking.tsx` | Codebuff thinking display |
| `.prism/shared/ref/codebuff/cli/src/components/status-bar.tsx` | Codebuff shimmer activity indicator |
| `.prism/shared/ref/codebuff/cli/src/components/blocks/agent-branch-item.tsx` | Codebuff agent cards |
