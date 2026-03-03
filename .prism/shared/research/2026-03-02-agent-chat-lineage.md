# Agent Chat Lineage: Sidecar Conversations → Prism CLI Agent Plugin

**Date**: 2026-03-02
**Type**: Research — Feature Archaeology
**Status**: Complete

---

## Summary

The Agent chat screen in `cmd/prism-cli/` traces directly to **Sidecar's Conversations plugin** (4th tab). Sidecar (`ref/sidecar/`) is a Go TUI dashboard forked from marcus/sidecar, designed to run alongside Claude Code. The Conversations plugin was the most fully-realized multi-adapter session browser in the reference codebase, and its architecture was deliberately adopted into Prism CLI's plugin system during the Feb 2026 integration effort.

---

## Origin: Sidecar's Conversations Plugin

Sidecar is a Bubble Tea TUI with 6 plugins: TD Monitor, Git Status, File Browser, **Conversations**, Workspaces, and Notes. The Conversations plugin provided:

- **30/70 split pane** — session list sidebar + message content area
- **Sessions grouped by date** — filterable by adapter type
- **10 adapter types**: Claude Code, Codex, Cursor CLI, Gemini CLI, OpenCode, Amp Code, Kiro, Warp, PI, Cache
- **Data sources**: `~/.claude/projects/`, `~/.codex/sessions/`, `~/.cursor/history/`, `~/.gemini/conversations/`, etc.
- **Full-text search** within conversations
- **Analytics view** — token usage, cost breakdown, model distribution
- **Resume/export** functionality
- **Real-time file watchers** for new messages

### Key Sidecar Files

| File | Purpose |
|------|---------|
| `ref/sidecar/internal/plugin/plugin.go` | Plugin interface definition |
| `ref/sidecar/internal/plugin/registry.go` | Plugin registry and message broadcast |
| `ref/sidecar/internal/plugins/conversations/plugin.go` | Conversations plugin (main) |
| `ref/sidecar/internal/plugins/gitstatus/plugin.go` | Git plugin (also ported) |
| `ref/sidecar/internal/plugins/filebrowser/plugin.go` | File browser plugin (also ported) |

---

## Integration Timeline

### Feb 12 — Architecture Comparison

**Document**: `2026-02-12-prism-cli-sidecar-crush-integration-architecture.md`

Comprehensive analysis comparing three TUI architectures:
- **Prism CLI**: Monolithic `Model` struct, 4-screen Elm architecture (Home, Research, Plans, Spectrum). No plugin system, no modal overlays, keyboard-only navigation.
- **Sidecar**: Plugin-based architecture with 6 plugins, message broadcast registry, multi-adapter pattern.
- **Crush**: State machine with SQLite persistence, pub/sub event system.

**Key discovery**: Sidecar's Conversations plugin was fully realized — a two-pane session browser with multi-adapter support. Prism CLI had nothing equivalent.

**Outcome**: Six integration patterns proposed — plugin-based architecture, modal overlays, permission dialogs, SQLite persistence, tab-based navigation, unified conversation history.

### Feb 12 — Deep Dive

**Document**: `2026-02-12-prism-cli-deep-dive.md`

Documented the pre-integration state of Prism CLI: no agent chat, no plugin system, single full-screen views only.

### Feb 15 — Mouse Support Research

**Document**: `2026-02-15-bubblezone-integration.md`

Identified that Prism CLI had **zero mouse handling** (keyboard-only). Any chat feature would need clickable message history and scrollable areas. Explored BubbleZone library for zone-based hit detection.

### Feb 17 — Screen Port Audit

**Document**: `2026-02-17-sidecar-port-screen-audit.md`

Comprehensive audit of all plugin screens vs Sidecar reference. Found that `plugin_agent.go` was scaffolded but **extremely simplified** — basic two-pane skeleton with all placeholder content. Sidecar reference had 15 files with full conversation rendering, session list filtering, and multi-adapter support.

**Gap identified**: Agent plugin was ~95% incomplete relative to Sidecar's Conversations.

### Feb 17 — Screen Port Plan

**Document**: `2026-02-17-sidecar-screen-port.md`

Implementation plan for porting Sidecar layouts:
- Phase 1: Shared layout utilities (dividers, scrollbars, pane calculation, gradient borders) — ✅ Complete
- Phase 2: Diff parser & renderer package — ✅ Complete
- Phase 3+: Refactor Git, Files, Workspaces, Agent plugins — Partial

### Feb 18 — Layout Issues

**Document**: `2026-02-18-tui-vertical-layout.md`

Agent plugin (`plugin_agent.go`) had broken height calculations with magic `-6` and `-12` offsets. Infrastructure for scrollable viewport-based chat was analyzed and fixed.

### Feb 19 — Integration Manifest

**Document**: `2026-02-19-sidecar-integration-manifest.md`

Feature-by-feature mapping of Sidecar → Prism CLI:
- Files Plugin: `[SAME]` — already had 2-pane, needed 30/70 split upgrade
- Git Plugin: `[EXTEND]` — needed persistent 2-pane layout
- **Agent/Conversations Plugin: `[BUILD]`** — needed full adapter system and real session loading
- Workspaces Plugin: `[BUILD]` — needed preview pane

---

## What Got Ported

### Architectural Patterns Adopted from Sidecar

| Pattern | Sidecar Source | Prism CLI Target |
|---------|---------------|-----------------|
| Plugin interface | `internal/plugin/plugin.go` | `cmd/prism-cli/plugin/plugin.go` |
| Plugin registry + broadcast | `internal/plugin/registry.go` | `cmd/prism-cli/plugin/registry.go` |
| Adapter interface | Conversations adapter pattern | `cmd/prism-cli/app/adapter/adapter.go` |
| Split pane layout | 30/70 ratio standard | 25/75 ratio in Agent plugin |
| Session date grouping | Conversations sidebar | Agent plugin sidebar |
| Shared layout utilities | Various | `ui/divider.go`, `ui/scrollbar.go`, `ui/pane.go`, `styles/borders.go` |
| Epoch-based staleness | Registry context | `plugin.Context.Epoch` for async command invalidation |

### Model Assignment

Following Prism's conventions:
- **Haiku**: Session scanning (fast I/O, simple parsing)
- **Sonnet**: Message rendering, JSONL parsing
- **Opus**: Not used in Agent plugin (would be for deep analysis if chat became interactive)

---

## Current Implementation

### File Map

| File | Role |
|------|------|
| `cmd/prism-cli/app/plugin_agent.go` | Main plugin — session browser, chat viewport, input, analytics |
| `cmd/prism-cli/app/adapter/adapter.go` | Adapter interface — `Session` struct, `Adapter` interface |
| `cmd/prism-cli/app/adapter/claude.go` | ClaudeAdapter — scans `~/.claude/projects/*/*.jsonl` |
| `cmd/prism-cli/app/chat/renderer.go` | Message rendering — user prompts, assistant responses, tool indicators |
| `cmd/prism-cli/markdown/renderer.go` | Glamour-based markdown rendering for assistant messages |

### Session Browsing (Functional)

```
AgentPlugin.Start()
  → scanSessionsCmd()
    → ClaudeAdapter.ScanSessions()
      → reads ~/.claude/projects/*/*.jsonl
      → scanSessionMetadata() per file
        → extracts title (first user message, truncated to 80 chars)
        → extracts model name (first assistant message)
        → counts user + assistant entries
        → tracks first/last timestamps
      → returns []Session sorted by UpdatedAt desc
    → SessionsLoadedMsg
  → groupSessionsByDate() → Today / Yesterday / This Week / Older

User presses Enter on session
  → loadSelectedSession()
    → ClaudeAdapter.LoadMessages(path)
      → reads JSONL line by line (1MB buffer limit)
      → filters to "user" and "assistant" entries
      → entryToMessage(): extracts text blocks, tool_use blocks
    → SessionMessagesLoadedMsg
  → Messages rendered in viewport
    → MarkdownMode=true: Glamour dark theme + blue ▎ accent bar
    → MarkdownMode=false: lite markdown (bold, code, bullets)
```

### Chat Input (Stub Only)

```
User types in textinput (2000 char limit)
  → Ctrl+Enter triggers sendMessage()
    → Appends user Message to state.Messages
    → Returns hardcoded placeholder:
      "I'm a placeholder response. In the future, I'll integrate
       with the Claude CLI to provide real responses."
    → AddMessageMsg appends placeholder to Messages
```

**No actual Claude CLI integration.** The `claude/runner.go` (`RunClaudeCmd`, `RunClaudeStreamingCmd`) is used exclusively by the Spectrum plugin for autonomous story execution, not by the Agent chat.

### Keyboard Navigation

| Key | Context | Action |
|-----|---------|--------|
| `ctrl+b` | Any | Toggle sidebar (WideMode) |
| `m` | Sidebar focused | Toggle Glamour/lite markdown |
| `a` | Sidebar focused | Toggle analytics view |
| `j` / `↓` | Sidebar focused | Navigate sessions down |
| `k` / `↑` | Sidebar focused | Navigate sessions up |
| `Enter` | Sidebar focused | Load selected session messages |
| `Ctrl+Enter` | Input focused | Send message (stub) |
| `Tab` | Any | Toggle sidebar ↔ input focus |
| `Esc` | Input focused | Blur input / navigate to Home |

### Analytics View

Token usage computed across all discovered sessions:
- **Cost rates**: Opus $15/$75, Sonnet $3/$15, Haiku $0.25/$1.25 per million tokens
- Breakdown by model, total cost, message counts

---

## Gaps: What's Still Missing vs Sidecar

| Feature | Sidecar | Prism CLI |
|---------|---------|-----------|
| Adapter count | 10 (Claude, Codex, Cursor, Gemini, etc.) | 1 (Claude Code only) |
| Full-text search | Within conversations | Not implemented |
| Resume/export | Session continuation | Not implemented |
| Real-time watchers | File system watchers for new messages | Not implemented |
| Interactive chat | N/A (Sidecar was read-only too) | Stub with placeholder response |
| Tool call rendering | Full tool name + status + collapsible | Basic single-line indicators |

---

## Evolution of "Agent Chat" Concept

The meaning of "agent chat" shifted across the research timeline:

1. **Feb 12**: No agent chat exists — Prism CLI has 4 screens, none conversational
2. **Feb 15-17**: Identified as missing, scaffolded as placeholder skeleton
3. **Feb 19**: Mapped to Sidecar Conversations, marked `[BUILD]` in integration manifest
4. **Feb 22**: Understood as part of larger autonomous execution model (Prism plugin architecture)
5. **Feb 26**: Concept evolved — not traditional interactive chat but **visual agent status + office visualization** (pixel agents research)
6. **Feb 27-Mar 1**: Final vision split into two tracks:
   - **TUI (prism-cli)**: Session browser + JSONL transcript viewer (Sidecar lineage)
   - **GUI (prism-vscode/electron)**: Canvas office with pixel-art characters, FSM states, activity bubbles

The TUI Agent screen remains a **read-only session browser** (like Sidecar's Conversations), while interactive agent visualization moved to the GUI applications.

---

## Referenced Documents

| Document | Relevance |
|----------|-----------|
| `2026-02-12-prism-cli-deep-dive.md` | Pre-integration Prism CLI state |
| `2026-02-12-prism-cli-sidecar-crush-integration-architecture.md` | Three-way architecture comparison |
| `2026-02-15-bubblezone-integration.md` | Mouse support needed for chat UI |
| `2026-02-17-sidecar-port-screen-audit.md` | Agent plugin gap analysis (95% incomplete) |
| `2026-02-17-sidecar-screen-port.md` | Porting plan (phases 1-2 complete) |
| `2026-02-18-tui-vertical-layout.md` | Agent plugin height calculation fixes |
| `2026-02-19-sidecar-integration-manifest.md` | Feature mapping: Agent = `[BUILD]` |
| `2026-02-22-prism-plugin-architecture.md` | Plugin architecture context |
| `2026-02-26-pixel-agents-integration-research.md` | Visual agent concept (office + sprites) |
| `2026-02-26-vscode-extension-cli-migration.md` | Plugin mode raw stream-json issue |
| `2026-02-27-prism-panel-unified-office-integration.md` | GUI agent visualization direction |
| `.prism/shared/docs/SIDECAR.md` | Sidecar reference documentation |
