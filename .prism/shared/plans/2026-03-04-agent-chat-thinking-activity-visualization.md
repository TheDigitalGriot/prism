# Plan: Agent Chat Thinking & Activity Visualization

**Date**: 2026-03-04
**Status**: Approved
**Research**: `.prism/shared/research/2026-03-04-agent-chat-thinking-activity-visualization.md`

---

## Goal

Make tool calls, thinking blocks, agent spawns, phase changes, and signals visible in the Agent chat during streaming. The infrastructure mostly exists but is invisible due to rendering path issues.

## What We're NOT Doing

- No client/server split or SSE (that's a future architecture change)
- No SQLite session persistence
- No expandable/collapsible tool output with diffs (Tier 3)
- No per-tool custom renderers (Bash `$ command`, Edit diff preview)
- No grid layout for concurrent agents
- No shimmer/Knight Rider animations (future enhancement)
- No context compaction

---

## Success Criteria

#### Automated Verification:
- [x] `cd cmd/prism-cli && go build ./...` succeeds
- [x] `cd cmd/prism-cli && go test ./...` passes

#### Manual Verification:
- [ ] Tool calls show as `▸ ToolName input` (running) / `✓` (complete) / `✗` (error) during streaming
- [ ] Thinking blocks show as dim italic `💭 text...` when Claude sends thinking content
- [ ] Agent spawns show as `▸ AgentDesc` with nested parts
- [ ] Separator bar shows current phase (e.g., `Research | streaming...`)
- [ ] Separator bar shows active tool name (e.g., `⬤ streaming... · Read src/main.go`)
- [ ] Running tools display animated braille spinner instead of static `▸`
- [ ] Text content still renders with Glamour markdown formatting
- [ ] MarkdownMode toggle (`m` key) still works

---

## Phase 1: Fix MarkdownMode Rendering to Include Parts

**Goal**: Make existing Parts (tool calls, agents) visible alongside Glamour-rendered text.

**The Bug**: `plugin_agent.go:1362-1376` — when `MarkdownMode=true` (default), `renderMessages()` renders only `msg.Content` via Glamour. All `msg.Parts` are bypassed.

**Fix**: Render Parts below the Glamour text block. Both OpenCode and Codebuff render text and parts as siblings in sequence.

### Steps

1. **Modify `renderMessages()` in `plugin_agent.go:1362-1376`**
   - When `MarkdownMode=true` AND `msg.Parts` is non-empty:
     - Render `msg.Content` via Glamour (existing path) for text
     - Then render each Part via `chat.RenderParts()` (new helper)
     - Concatenate both with newline separator
   - When `MarkdownMode=true` AND `msg.Parts` is empty:
     - Keep existing behavior (Glamour only)

2. **Add `RenderParts()` export to `chat/renderer.go`**
   - New function: `RenderParts(parts []ContentPart, width int, collapsed bool) string`
   - Iterates parts, calls `renderPart()` for each, joins with newlines
   - Applies the `▎` bar styling to match Glamour output

3. **Invalidate render cache when Parts change**
   - Streaming messages are already not cached (`msg.Status == "streaming"`)
   - When a tool completes (status changes), the cache entry for that message index must be invalidated
   - Add cache invalidation in `updateToolPartStatus()` at `plugin_agent.go:571-581`

### Verification
```bash
cd cmd/prism-cli && go build ./... && go test ./...
```
Manual: Send a message that triggers tool use. Verify `▸ ToolName` appears below the text.

---

## Phase 2: Bridge Thinking Blocks

**Goal**: Surface Claude's thinking/reasoning content in the chat.

### Steps

1. **Add `Thinking` and `Signature` fields to `ContentBlock` in `events.go:59-65`**
   ```go
   Thinking  string `json:"thinking,omitempty"`
   Signature string `json:"signature,omitempty"`
   ```

2. **Add `EventThinkingDelta` to `agentbus/events.go`**
   - New constant after `EventCostUpdate`: `EventThinkingDelta`
   - Reuses existing `Text` field on `Event` struct

3. **Add `"thinking"` case to `BridgeStreamToBus()` in `conversation.go:224-234`**
   ```go
   case "thinking":
       if block.Thinking != "" {
           bus.Publish(agentbus.Event{
               Type:      agentbus.EventThinkingDelta,
               Timestamp: now,
               SessionID: sessionID,
               Text:      block.Thinking,
           })
       }
   ```

4. **Add `EventThinkingDelta` handler in `handleBusEvent()` at `plugin_agent.go:345`**
   - Create a `PartThinking` part with `Text: e.Text`
   - Call `appendPart(part)`
   - Call `autoScroll()`

### Verification
```bash
cd cmd/prism-cli && go build ./... && go test ./...
```
Manual: Use a model with extended thinking enabled. Verify `💭` thinking text appears in the chat.

---

## Phase 3: Enhanced Status Bar

**Goal**: Show phase, active tool name, and elapsed time in the separator bar.

### Steps

1. **Render `currentPhase` in `renderCostIndicator()` at `plugin_agent.go:716-740`**
   - If `p.currentPhase != ""`, prepend it as first element: `Research | ⬤ streaming... | 1.2k in / 0.5k out`

2. **Track and display active tool name**
   - Add `p.activeToolName string` field to `AgentPlugin`
   - Set it in `EventToolCallStart` handler: `p.activeToolName = e.ToolName`
   - Clear it in `EventToolCallComplete` handler: `p.activeToolName = ""`
   - Display in `renderCostIndicator()`: `⬤ streaming… · Read src/main.go`

3. **Add elapsed time during streaming**
   - Add `p.streamStartTime time.Time` field
   - Set in `sendMessage()` when `p.streaming = true`
   - Display in `renderCostIndicator()`: format as `Xs` or `Xm Xs`
   - Use `tea.Tick` at 1s interval while streaming to trigger re-renders

4. **Add `EventSignalDetected` handler in `handleBusEvent()`**
   - Store last signal in `p.lastSignal`
   - Display in separator bar if relevant (e.g., `spectrum-blocked`)

### Verification
```bash
cd cmd/prism-cli && go build ./... && go test ./...
```
Manual: During a multi-turn session, verify phase name appears. During tool use, verify tool name shows in separator.

---

## Phase 4: Incremental Streaming via `--include-partial-messages`

**Goal**: Get true character-by-character text and thinking deltas instead of complete messages.

### Steps

1. **Add `--include-partial-messages` flag to `RunConversationCmd()` in `conversation.go:53-57`**
   ```go
   args := []string{
       "--output-format", "stream-json",
       "--verbose",
       "--input-format", "stream-json",
       "--include-partial-messages",
   }
   ```

2. **Add `stream_event` structs to `events.go`**
   ```go
   // StreamSubEvent wraps a raw API streaming event inside a stream_event line.
   type StreamSubEvent struct {
       Type         string        `json:"type"`
       Index        int           `json:"index"`
       ContentBlock *ContentBlock `json:"content_block,omitempty"`
       Delta        *DeltaBlock   `json:"delta,omitempty"`
   }

   type DeltaBlock struct {
       Type      string `json:"type"`
       Text      string `json:"text,omitempty"`
       Thinking  string `json:"thinking,omitempty"`
       Signature string `json:"signature,omitempty"`
       InputJSON string `json:"partial_json,omitempty"`
   }
   ```

3. **Add `Event` field to `StreamEvent`**
   ```go
   Event *StreamSubEvent `json:"event,omitempty"`
   ```

4. **Add `"stream_event"` case to `BridgeStreamToBus()` in `conversation.go`**
   - For `event.Event.Type == "content_block_delta"`:
     - `delta.Type == "text_delta"` → publish `EventTextDelta` with `delta.Text`
     - `delta.Type == "thinking_delta"` → publish `EventThinkingDelta` with `delta.Thinking`
     - `delta.Type == "input_json_delta"` → (accumulate for tool input preview, or ignore for now)
   - For `content_block_start` / `content_block_stop` → (optional, for state tracking)

5. **Deduplicate with complete `assistant` events**
   - With `--include-partial-messages`, both incremental deltas AND complete messages arrive
   - The existing `assistant` handler will still fire with complete messages
   - To avoid double-rendering: skip the `assistant` text block case when `--include-partial-messages` is active, since deltas already accumulated the text
   - Alternatively: use the `assistant` event to finalize/correct the accumulated text

### Verification
```bash
cd cmd/prism-cli && go build ./... && go test ./...
```
Manual: Send a message. Verify text appears character-by-character (not as a complete block after delay).

---

## Phase 5: Tool Spinners

**Goal**: Replace static `▸` with animated braille dot spinner for running tools.

### Steps

1. **Add `spinner.Model` to `AgentPlugin` state**
   - Import `github.com/charmbracelet/bubbles/spinner`
   - Initialize with `spinner.Dot` type (braille dots: `⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏`)
   - Tick at 80ms interval (matching OpenCode's pattern)

2. **Wire spinner into Bubble Tea lifecycle**
   - Start spinner `tea.Cmd` when `p.streaming = true`
   - Handle `spinner.TickMsg` in `Update()` — forward to spinner, trigger re-render
   - Stop spinner when `p.streaming = false`

3. **Use spinner frame in Part rendering**
   - Pass current spinner frame string to `chat.RenderParts()`
   - In `renderToolPart()`, when `ToolStatus == "running"`, use spinner frame instead of `▸`
   - Same for `renderAgentPart()` running state

4. **Cache invalidation on spinner tick**
   - Running tools change every 80ms due to spinner — they must not be cached
   - Already handled: streaming messages (`msg.Status == "streaming"`) skip cache

### Verification
```bash
cd cmd/prism-cli && go build ./... && go test ./...
```
Manual: During a tool call, verify the spinner animates (braille dots cycle). After completion, verify it changes to `✓` or `✗`.

---

## Phase 6: Signal Handling

**Goal**: Handle `EventSignalDetected` events in the Agent UI.

### Steps

1. **Add `EventSignalDetected` case to `handleBusEvent()`**
   - Store signal: `p.lastSignal = e.Signal`
   - For Spectrum signals, update UI state:
     - `<spectrum-continue>` → continue (no action needed in Agent context)
     - `<spectrum-retry>` → show retry indicator
     - `<spectrum-blocked>` → show blocked warning
     - `<promise>COMPLETE</promise>` → show completion indicator

2. **Display signal in separator bar**
   - If `p.lastSignal` is set and relevant, show as badge: `[blocked]` or `[retry]`
   - Clear on next `EventMessageComplete`

### Verification
```bash
cd cmd/prism-cli && go build ./... && go test ./...
```
Manual: Run a Spectrum-style prompt. Verify signals appear in separator bar.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Glamour re-rendering per frame with spinner ticks | Only re-render if content changed; spinner only affects non-cached streaming messages |
| `--include-partial-messages` doubles event volume | 16ms debounce on re-render (Bubble Tea already batches); event channel buffer is 256 |
| Deduplication between stream_event deltas and complete assistant messages | Skip text block processing in `assistant` case when partial messages are active |
| Spinner tick floods Bubble Tea Update loop | Only tick when `p.streaming` is true; spinner stops immediately on completion |
| Parts rendering adds height, pushing viewport | `autoScroll()` already handles this for streaming messages |

---

## File Change Summary

| File | Changes |
|------|---------|
| `app/plugin_agent.go` | Fix `renderMessages()`, add spinner, enhance separator bar, add thinking/signal handlers, cache invalidation |
| `app/chat/renderer.go` | Export `RenderParts()`, accept spinner frame in tool rendering |
| `claude/events.go` | Add `Thinking`/`Signature` to ContentBlock, add `StreamSubEvent`/`DeltaBlock` structs, add `Event` field to StreamEvent |
| `claude/conversation.go` | Add `--include-partial-messages`, bridge thinking blocks, handle `stream_event` type |
| `agentbus/events.go` | Add `EventThinkingDelta` constant |
