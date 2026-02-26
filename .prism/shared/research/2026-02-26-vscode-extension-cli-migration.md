---
title: "VS Code Extension: Replace Anthropic SDK with Claude CLI Max Subscription"
date: 2026-02-26
type: research
status: complete
tags: [vscode-extension, claude-cli, max-subscription, api-key-removal]
---

# Research: Replace Anthropic SDK with Claude CLI in VS Code Extension

## Research Question

How is the Prism VS Code extension currently using `@anthropic-ai/sdk` (direct Anthropic API) for interactive chat, and what are all the components that would need to change to route interactive chat through the Claude CLI subprocess using a Max subscription — the same approach used by the existing plugin mode and prism-cli?

## Summary

The extension operates in two chat modes today: **SDK mode** (interactive chat via `@anthropic-ai/sdk`, requires `sk-ant-*` API key) and **Plugin mode** (Prism workflow skills via `ClaudeRunner` CLI subprocess, uses Max subscription). The goal is to eliminate SDK mode's API key requirement by routing interactive chat through the same `ClaudeRunner` infrastructure already used by plugin mode. The changes touch 8 files: the controller (removing API key logic), shared state (removing `hasApiKey`), and the webview (replacing `ApiKeySetup` with a `CliNotFound` component).

---

## Files Discovered

| File | Role | Lines |
|------|------|-------|
| `src/core/api/claude-sdk.ts` | `PrismApiHandler` wrapping `@anthropic-ai/sdk` | 157 |
| `src/core/api/auth.ts` | API key CRUD via VS Code `SecretStorage` | 62 |
| `src/core/task/index.ts` | `PrismTask` — recursive agent loop with custom tools | 338 |
| `src/core/controller/index.ts` | `PrismController` — orchestrates API key check + task creation | 770 |
| `src/shared/PrismState.ts` | Shared state interface; `hasApiKey` at line 68 | 108 |
| `src/claude/runner.ts` | `ClaudeRunner` — spawns CLI, emits typed events | 438 |
| `src/claude/events.ts` | `ClaudeRunnerEvent` union type | 93 |
| `src/claude/parser.ts` | `parseStreamEvent`, `extractToolActivity`, `OutputParser` | ~412 |
| `src/core/controller/prism/plugin-bridge.ts` | `PluginBridge` — runner events → bridge events | 349 |
| `src/core/controller/prism/mode-bridge.ts` | `ModeBridge` — bridge events → `PrismChatMessage` objects | 396 |
| `webview-ui/src/context/PrismStateContext.tsx` | Webview state mirror; `hasApiKey` at line 128 | 247 |
| `webview-ui/src/views/ChatView.tsx` | `ApiKeySetup` component; `hasApiKey` gate at line 267 | 405 |
| `webview-ui/src/App.tsx` | `isFirstTimeUser` uses `hasApiKey` at line 42 | 138 |
| `webview-ui/src/services/grpc-client.ts` | `ChatServiceClient.setApiKey()` at line 112 | ~140 |
| `package.json` | `@anthropic-ai/sdk: ^0.36.0` dep; `prism.claudeApiKey` config | 434 |
| `.prism/shared/ref/claude-electron-sdk-fix/CLAUDE-AGENT-SDK-ELECTRON.md` | Reference: Windows fix for `@anthropic-ai/claude-agent-sdk` | 244 |
| `.prism/shared/ref/claude-electron-sdk-fix/claude-electron-test/src/main.ts` | Reference: `query()` usage with Windows path resolution | ~230 |

---

## Component Analysis

### 1. Current SDK Mode: How `@anthropic-ai/sdk` Is Used

#### PrismApiHandler (`src/core/api/claude-sdk.ts:37`)

Wraps `@anthropic-ai/sdk`. Constructor at line 42 accepts `{ apiKey, model?, maxTokens? }` and creates `new Anthropic({ apiKey })`.

The `createMessage()` generator at line 55 accepts:
- `systemPrompt: string`
- `messages: ApiConversationMessage[]` — full conversation history
- `tools?: ApiToolDefinition[]` — 8 custom tool definitions

Calls `this._client.messages.stream()` at line 60 with those parameters. Yields typed `ApiStreamChunk` objects: `text`, `tool_call`, `usage`, `input_json_delta`.

**Key constraint**: requires a raw `sk-ant-*` API key at construction time.

#### PrismTask (`src/core/task/index.ts:33`)

Implements a recursive agent loop:
1. `sendMessage(text)` adds user message, calls `_recursiveApiRequest()`
2. `_recursiveApiRequest()` calls `_api.createMessage(systemPrompt, apiMessages, PRISM_TOOL_DEFINITIONS)`
3. Processes streaming chunks, collects `tool_call` chunks
4. Executes tools sequentially via `ToolCoordinator` (custom: `read_file`, `write_file`, `edit_file`, `execute_command`, `search_files`, `list_files`, `ask_followup`, `attempt_completion`)
5. Adds tool results to `apiMessages`, recurses

Maintains two message arrays:
- `apiMessages` — Anthropic API format (conversation history for each request)
- `chatMessages` — UI display format (what's broadcast to webview)

**Key dependency**: requires `PrismApiHandler` instance at construction.

#### API Key Gate in Controller (`src/core/controller/index.ts:186-268`)

`sendMessage` handler (registered as `ChatService.sendMessage`):
1. Checks if text is a skill trigger → routes to `ModeBridge` (no API key needed)
2. Calls `getApiKey(this._context)` at line 221
3. If no key: calls `promptForApiKey()` at line 224 (VS Code input box)
4. Creates `PrismApiHandler({ apiKey: finalApiKey, model })` at line 238
5. Creates `PrismTask` at line 247, fires off `task.sendMessage(text)`

`_checkApiKey()` at line 544: called at constructor startup, reads from SecretStorage, sets `state.hasApiKey`.

#### API Key Storage (`src/core/api/auth.ts`)

- Secret key: `"prism.anthropicApiKey"` (line 9)
- Uses `context.secrets` (VS Code SecretStorage → OS keychain / Windows Credential Store)
- `isValidApiKey()` at line 32: must start with `sk-ant-` and be >20 chars
- `promptForApiKey()` at line 40: shows masking input box, validates, stores

---

### 2. Existing CLI Runner Infrastructure

#### ClaudeRunner (`src/claude/runner.ts:63`)

Spawns `claude` CLI via Node.js `child_process.spawn()`. In streaming mode, command is:
```
claude --dangerously-skip-permissions --print --output-format stream-json --verbose <prompt>
```

Emits `ClaudeRunnerEvent` objects via Node `EventEmitter`. Key event types:

| Event Type | Payload | When Emitted |
|-----------|---------|-------------|
| `output` | `{ text, isStderr, timestamp }` | Every raw stdout/stderr line |
| `stream_event` | `{ event: ClaudeStreamEvent }` | Each successfully JSON-parsed line |
| `tool_activity` | `{ activity: ToolActivity }` | Tool use detected in content |
| `phase_detected` | `{ detection: PhaseDetection }` | Phase keyword found in text |
| `signal_detected` | `{ signalType, content, reason }` | Spectrum signal found |
| `finished` | `{ exitCode, output, durationMs }` | Process exits normally |
| `error` | `{ message }` | Process spawn/runtime error |

`checkClaudeCli()` at line 428: runs `where claude` (Windows) or `which claude` (Unix), returns path or `null`.

`terminate()` at line 233: Windows uses `taskkill /F /T /PID`, Unix uses `SIGTERM` then `SIGKILL`.

#### ClaudeStreamEvent and Assistant Content (`src/claude/events.ts`)

When Claude outputs an assistant message, the stream-json line parses to:
```json
{
  "type": "assistant",
  "message": {
    "content": [
      { "type": "text", "text": "Claude's response text..." },
      { "type": "tool_use", "id": "...", "name": "Read", "input": { "file_path": "..." } }
    ]
  }
}
```

This is the `ClaudeStreamEvent` at `events.ts:37`. The `ContentBlock` type at `events.ts:13` covers `text`, `tool_use`, and `tool_result` types.

The runner's `_extractTextFromEvent()` at `runner.ts:360` extracts `text` from the first text-type content block in `assistant` events. However, this is only used internally for signal/phase parsing — **not** exposed through the event system.

**Important**: `stream_event` events expose the full `ClaudeStreamEvent` object, so a consumer can directly access `event.event.message?.content` to extract text.

#### ModeBridge: How Plugin Mode Converts CLI Output to Chat Messages

For plugin skills, `ModeBridge._handleBridgeEvent()` at `mode-bridge.ts:249` handles:
- `skill_output` → appends raw line text to a streaming `assistant_text` chat message
- `skill_tool_activity` → creates a `tool_use` chat message with `approved: true`
- `skill_completed` → creates a `completion` chat message

**Critical observation**: Plugin mode's `skill_output` handler at `mode-bridge.ts:254` uses **raw line text** (`event.data.text` from the `output` runner event), not the parsed text from `stream_event`. This means plugin mode currently shows raw stream-json lines in the chat (e.g., `{"type":"assistant","message":{...}}`), which is functional but not readable as clean text.

For interactive chat, we want clean parsed text from `stream_event.event.message.content[].text`.

---

### 3. Reference Implementation: `@anthropic-ai/claude-agent-sdk`

#### query() API (from reference `main.ts:172`)

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

const result = query({
  prompt: 'Your prompt here',
  options: {
    maxTurns: 1,
    pathToClaudeCodeExecutable: cliJsPath,
    executable: 'node',          // Windows only — bypasses .cmd spawn issue
    permissionMode: 'bypassPermissions',
    systemPrompt: '...',         // optional
  }
});

for await (const message of result) {
  if (message.type === 'assistant') {
    for (const block of message.message.content) {
      if (block.type === 'text') {
        text += block.text;
      }
    }
  }
}
```

`query()` returns a synchronous async iterable (no `await` on the call itself). Each yielded `message` is an `SDKMessage` with `type` discriminator.

**Authentication**: No API key. Uses `claude login` (Max subscription OAuth) stored by the Claude CLI.

#### Windows .cmd Fix (from reference `main.ts:147-160`)

The Claude Agent SDK uses `child_process.spawn()` without `shell: true`. On Windows, npm global installs create `.cmd` wrappers that cannot be spawned without a shell.

Fix: convert `.cmd` path to the underlying `cli.js`:
```
C:\...\npm\claude.cmd  →  C:\...\npm\node_modules\@anthropic-ai\claude-code\cli.js
```

Then pass `executable: 'node'` so the SDK spawns `node cli.js` instead of `cli.js` directly.

Detection: `claudePath.endsWith('.cmd')` at `main.ts:147`.
Conversion: `path.join(path.dirname(claudePath), 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js')` at `main.ts:153`.

**This same Windows issue applies to the VS Code extension** since it also spawns Claude CLI on Windows.

Note: The existing `ClaudeRunner` at `runner.ts:94` uses `spawn("claude", args, { shell: true })` — the `shell: true` option already works around this issue. The agent SDK reference is only needed if we switch to using `@anthropic-ai/claude-agent-sdk` directly.

---

### 4. `hasApiKey` and `hasClaudeCli` State Fields

#### `hasApiKey`

Declared at `src/shared/PrismState.ts:68` and mirrored at `webview-ui/src/context/PrismStateContext.tsx:128`.

Set in controller:
- Startup: `_checkApiKey()` at `controller/index.ts:544` reads SecretStorage → `updateState({ hasApiKey: !!apiKey })`
- On key save: `setApiKey` handler at `controller/index.ts:333` → `updateState({ hasApiKey: true })`

Consumed in webview:
- `ChatView.tsx:267`: `if (!state.hasApiKey) return <ApiKeySetup />` — primary UI gate
- `App.tsx:42`: `const isFirstTimeUser = !state.hasPrismDir && !state.hasApiKey` — secondary gate

**The `prism.claudeApiKey` VS Code config entry** at `package.json:352` is declared but **not read by any TypeScript code**. The extension exclusively uses SecretStorage, not settings.

#### `hasClaudeCli`

Declared at `src/shared/PrismState.ts:56`. Set by `_checkClaudeCli()` at `controller/index.ts:550`.

Already gates:
- Plugin skills: `controller/index.ts:208` — returns error if no CLI
- `PluginService.executeSkill`: `controller/index.ts:352`
- `SpectrumService.start`: `controller/index.ts:397`
- Spectrum UI: `SpectrumControls.tsx:52` — disables Start button; `SpectrumControls.tsx:160` — shows "Claude CLI not found" warning

**`hasClaudeCli` already has a "not found" UI pattern in `SpectrumControls`** that can be referenced for the new `CliNotFound` component in `ChatView`.

---

## Patterns Found

### Pattern 1: Skill Output → Clean Chat Message Rendering

Plugin mode currently converts raw CLI output lines (including JSON) to chat messages via `ModeBridge._appendToCurrentAssistant()` at `mode-bridge.ts:356`. The text is the raw stream-json line, not the extracted text content.

For interactive chat, we want to extract the clean text from `stream_event`:
```typescript
// runner.ts:313 — stream_event is emitted for each JSON-parsed line
runner.on("event", (event: ClaudeRunnerEvent) => {
  if (event.type === "stream_event" && event.event.type === "assistant") {
    for (const block of event.event.message?.content ?? []) {
      if (block.type === "text" && block.text) {
        // append block.text to streaming assistant message
      }
    }
  }
})
```

### Pattern 2: `CliNotFound` Warning in SpectrumControls (`SpectrumControls.tsx:160-163`)

```tsx
{!hasClaudeCli && (
    <span style={{ color: "#ef4444", fontSize: "11px" }}>
        Claude CLI not found
    </span>
)}
```

This pattern can be expanded into a full `CliNotFound` component for `ChatView`.

### Pattern 3: Fire-and-Forget Background Streaming in Controller (`controller/index.ts:262-265`)

```typescript
void this._currentTask.sendMessage(text).catch((err: Error) => {
  console.error("[Prism] Task error:", err)
})
return { ok: true }
```

The `sendMessage` handler returns immediately while the actual streaming runs in the background. This same pattern applies when we switch to `ClaudeRunner.runStreaming()`.

### Pattern 4: Parallel State Broadcasting (`controller/index.ts:736-768`)

Every `updateState()` call merges partial state and broadcasts serialized JSON to all webview subscribers. Streaming chat updates work by calling `updateState({ chatMessages, isChatStreaming: true })` from within the event listener.

---

## Open Questions

1. **Conversation history format**: How should prior conversation turns be included in the CLI prompt? The `ClaudeRunner` sends a single prompt string; multi-turn context requires encoding history as text in the prompt.

2. **Tool display**: Plugin mode shows tool activities from `tool_activity` events. For interactive chat via CLI, Claude Code's tools run automatically. Should we surface them the same way?

3. **`PrismTask` and custom tools**: Once we route interactive chat through the CLI, the custom tool implementations (`read_file`, `write_file`, etc. in `src/core/task/tools/`) become dead code. Should they be removed or kept for reference?

4. **`ChatService.setApiKey` handler**: This handler is called from the webview. Once `ApiKeySetup` is removed, no webview code will call it. Should the handler be removed from the controller?

5. **`approveToolUse` handler**: With CLI-based chat, tool approval is bypassed (`--dangerously-skip-permissions`). The `pendingApprovalToolUseId` state field and `approveToolUse` gRPC handler become unused. Remove or keep?

6. **`@anthropic-ai/claude-agent-sdk` vs direct `ClaudeRunner`**: The reference shows the agent SDK approach. The codebase already has `ClaudeRunner` infrastructure. Either approach works; `ClaudeRunner` avoids adding a new dependency.

---

## Key Findings Summary

| Finding | Location | Impact |
|---------|----------|--------|
| `PrismApiHandler` requires `apiKey` at construction | `claude-sdk.ts:42` | Must be replaced |
| `sendMessage` handler checks API key before creating task | `controller/index.ts:221-233` | Remove API key check |
| `hasApiKey` gates the entire chat UI | `ChatView.tsx:267` | Replace with `hasClaudeCli` gate |
| `isFirstTimeUser` combines `hasPrismDir` and `hasApiKey` | `App.tsx:42` | Remove `hasApiKey` condition |
| `ClaudeRunner` already uses `--dangerously-skip-permissions` | `runner.ts:277` | Interactive chat can use same runner |
| `stream_event` exposes parsed `ClaudeStreamEvent` with text | `runner.ts:313` | Clean text extraction possible |
| `ModeBridge` has full pipeline: runner → bridge → chat messages | `mode-bridge.ts` | Can adapt for interactive chat |
| Windows `.cmd` is handled by `shell: true` in ClaudeRunner | `runner.ts:94` | No extra fix needed vs agent SDK |
| `hasClaudeCli` already has "not found" UI in Spectrum | `SpectrumControls.tsx:160` | Pattern for new CliNotFound component |
| `prism.claudeApiKey` config entry is declared but never read | `package.json:352` | Safe to remove |
| `@anthropic-ai/sdk` is only imported in `claude-sdk.ts:7` | Single file | Remove when PrismApiHandler is replaced |
