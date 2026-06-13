---
date: 2026-06-13
researcher: Claude (prism-research)
topic: "Full-managed move — capability-parity analysis: can agent-run move behind the broker without losing capabilities?"
status: complete
decision_input_for: "Whether/how to do the deferred full-managed step (agent loop behind the broker)"
tags: [daemon, full-managed, agent-run, capability-parity, spectrum, cline, paseo, risk]
---

# Full-Managed Move — Capability-Parity Analysis

## The question

The v3.6.0 daemon arc deliberately kept agents **in-process** (the "hybrid + bridge" model). The
deferred "full-managed" step would move agent execution **behind the broker's `agent-run`
service**. The user's gate: *"providing we aren't losing any capabilities."* This document
audits exactly what would be at risk, and answers: **what is safe to move, what is not, and how.**

## TL;DR

**A naive swap (replace Prism's loop with paseo's `agent-run`) WOULD lose capabilities.** Prism's
in-process layer is not just "run a Claude session" — it carries **Prism-specific orchestration**
(Spectrum, the 4-phase workflow, the signal protocol, the Office, the plugin bridge) that paseo's
agent daemon has no equivalent for.

**But full-managed done correctly is safe**, because it's a *layered* migration, not a wholesale
replacement: move only the **execution substrate** (spawn a session, stream a timeline, run tools,
round-trip permissions) behind the broker, and **keep Prism's orchestration layer** in the
controller, driving the substrate over the broker instead of in-process. The substrate is what
paseo provides; the orchestration is Prism's value-add and stays.

## Prism's in-process execution — there are TWO paths

### Path A — `PrismTask` (interactive, Cline-derived)
`apps/prism-vscode/src/core/task/index.ts` — the interactive agent loop:
`sendMessage` → `_recursiveApiRequest` (the agentic loop) → `_processChunk` → `_executeToolCalls`.
Tool handlers in `core/task/tools/handlers/` (read/write/edit/execute-command/list-files/
search-files/ask-followup/attempt-completion) + `message-state` + `task-state`. Drives the Claude
Agent SDK in-process via `core/api/claude-sdk.ts`.

### Path B — `SpectrumRunner` (autonomous, Prism's signature)
`packages/prism-core/src/core/controller/prism/spectrum-runner.ts` — single-iteration executor for
the Spectrum loop. Each `runIteration()` **spawns a fresh `claude` CLI session** for the next
pending story, **parses the signal** (`<spectrum-continue>` / `<spectrum-retry>` /
`<spectrum-blocked>` / `<promise>COMPLETE</promise>`), and updates `stories.json`. Uses
`PluginBridge` (Prism plugin/skill invocation), `StoriesManager`, `ProgressFile`. The outer loop
(`PrismController`) handles pause/resume, max-iterations, inter-iteration sleep, consecutive-error
limit. **This is not an SDK loop — it's process-per-story orchestration with a signal protocol.**

## What paseo's `agent-run` provides

paseo's daemon (`packages/server`) exposes general agent execution over its WS RPCs
(`fetch_agents`, `send_agent_message`, `fetch_agent_timeline`, `cancel_agent`, `set_agent_mode/
model/thinking`, `agent_permission_*`, push frames `timeline`/`turn_*`/`permission_requested`):

- Agent **lifecycle** state machine (`initializing → idle → running → idle/error → closed`).
- **Multi-provider** (Claude Agent SDK / Codex AppServer / OpenCode).
- Append-only **timeline** with epochs (≤200 items/agent), broadcast to subscribers.
- Tool-call **normalization** to a `ToolCallDetail` union (shell/read/edit/write/search…).
- **Permission** round-trips (agent → server → client → decision → server → agent).

This is a *complete execution substrate*. It is **not** aware of stories, the 4-phase workflow,
the Spectrum signal protocol, the Office, or Prism's plugin bridge.

## Capability-by-capability parity

| Prism capability | paseo `agent-run` equivalent | Verdict |
|---|---|---|
| Run a Claude session, stream output | ✅ timeline + `turn_*` frames | **Movable** — substrate provides it |
| Tool execution (read/write/edit/exec/search) | ✅ normalized `ToolCallDetail` | **Movable** (verify handler shapes match) |
| Permission round-trips | ✅ `agent_permission_*` | **Movable** |
| Multi-provider (Claude/Codex/Cursor) | ✅ Claude/Codex/OpenCode | **Movable** (Cursor↔OpenCode delta) |
| **Spectrum loop** (story-by-story, signal protocol, stories.json) | ❌ none | **Prism-only — must stay or be re-built broker-side** |
| **4-phase workflow** (research/plan/implement/validate prompts) | ❌ none | **Prism-only — stays in controller** |
| **Signal protocol** (`<spectrum-*>`, `<promise>`) | ❌ none | **Prism-only — stays** |
| **PluginBridge** (skill/command invocation) | ❌ none | **Prism-only — stays** |
| **Office** (multi-agent visual desk) | ❌ none (paseo has its own UI) | **Prism-only — stays** |
| Process-per-story isolation (fresh session each story) | ⚠️ paseo agents are long-lived; "fresh session" = new agent + close | **Movable with care** — map "new story session" → create-agent/close-agent |

## The verdict

- **Safe to move (the substrate):** `PrismTask`'s in-process SDK loop and `SpectrumRunner`'s
  CLI-spawn can both be re-expressed as **broker `agent-run` calls** — `createAgent` /
  `sendMessage` / `stream(timeline)` / `permission` — *without losing capability*, because those
  are exactly what the substrate provides.
- **Must NOT be moved (the orchestration):** Spectrum's loop + signal parsing + `stories.json`
  writes, the 4-phase prompt selection, `PluginBridge`, and the Office stay in
  `PrismController` / `SpectrumRunner`. They **drive** the substrate; they are not part of it.
- **The real swap is small:** today `SpectrumRunner.runIteration()` does
  `child_process.spawn("claude", …)`; under full-managed it would call
  `agentRunClient.createAgent(...)` + collect the timeline + read the trailing signal. Same loop,
  different execution call. `PrismTask` similarly swaps its in-process SDK call for a brokered one.

## Risks & how to retire them

| Risk | Mitigation |
|---|---|
| Tool-handler shape mismatch (Prism's handlers vs paseo's `ToolCallDetail`) | Adapter test: drive one tool of each kind through `agent-run` and assert the normalized result matches the in-process handler's. |
| Signal protocol depends on raw CLI stdout; brokered timeline may not surface the trailing `<promise>` token | Verify the timeline's final assistant message carries the signal text; if not, add a `signal` field to the agent-run response. |
| 4-phase **system prompts** must reach the brokered agent | Pass Prism's `core/prompts/*` as the agent's system prompt via `createAgent(opts.systemPrompt)`. |
| Permission UX regression (in-process is synchronous; brokered is round-tripped) | The broker already has `permission_request` push frames — wire them to the existing Prism permission UI. |
| VS Code parity (it also runs in-process) | Both VS Code and Electron move together via the shared `PrismController`; the seam bridge already lets the webview reach `agent-run` transparently. |

## Recommended approach (incremental, reversible)

1. **Prove the substrate** — drive ONE `PrismTask` interaction through `agent-run` behind the
   broker (create agent, send a message, stream a turn, run one tool) and diff the result against
   the in-process path. Ship behind a flag (`PRISM_AGENTS_BROKERED=1`), default off.
2. **Move Spectrum's execution call** — swap `SpectrumRunner`'s `spawn("claude")` for an
   `agent-run` create/stream, **keeping** the signal parse + `stories.json` + the outer loop.
   Verify a full story iteration end-to-end.
3. **Flip the default** once both paths pass parity — the in-process code stays as a fallback for
   one release.

This is the seam bridge's payoff: because the webview already reaches `agent-run` through the same
`service.method` envelope, the move is a **transport flip on the execution call**, with the
orchestration untouched.

## Answer to the gate

**"Are we losing capabilities?"** — *Not if we move the substrate and keep the orchestration.* A
wholesale replacement with paseo's agent UX *would* lose Spectrum, the 4-phase workflow, the
signal protocol, the plugin bridge, and the Office. The layered migration above keeps all of them
and is reversible at every step. Full-managed is therefore **safe to pursue — as a substrate swap,
not a loop replacement** — and should be done as the 3-step incremental flag-gated rollout, not a
big-bang rewrite.
