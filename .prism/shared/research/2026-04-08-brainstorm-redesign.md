---
date: 2026-04-08
topic: Brainstorm Redesign — current-state map for the 2026-04-08 brainstorm ledger
ledger: .prism/shared/brainstorms/2026-04-08-brainstorm-redesign.md
phases_covered: A, B, C, D, E
status: complete
---

# Research — Brainstorm Redesign

## Research Question

The 2026-04-08 brainstorm ledger ([.prism/shared/brainstorms/2026-04-08-brainstorm-redesign.md](.prism/shared/brainstorms/2026-04-08-brainstorm-redesign.md)) locks six decisions (Q1..Q6′) and groups them into five implementation phases (A..E). Before planning, document the **current state** of every file, surface, and external dependency the implementation will touch. Document what IS, not what SHOULD BE.

## Summary

The brainstorm visual companion already exists end-to-end (server, HTML frame, helper.js, SKILL.md, runtime state files) but has **no fidelity engine, no side drawer, no channel adapter, no griotwave styling**. The `prism-design` skill writes markdown to `.prism/shared/plans/` (not `.pen` to `.prism/shared/designs/`) and treats brainstorm as a downstream sub-step (the inverted graph the ledger calls out). The `prism-vscode` extension has a mature file-watcher pattern (`PrismWatcher`) but does not yet watch `.prism/local/brainstorm/`. The `init_prism.py` script and three doc surfaces are missing the `brainstorms/` directory entry. The `claude/channel` MCP capability is officially documented and matches the ledger's assumptions exactly. `griotwave-library` lives as a sibling of `prism-plugin` on disk.

## Files Discovered

### Phase B — Visual / Fidelity (Q1, Q2)

| Path | Lines | Purpose |
|---|---|---|
| [skills/prism-brainstorm/SKILL.md](skills/prism-brainstorm/SKILL.md) | 85 | Brainstorm skill workflow |
| [skills/prism-brainstorm/visual-companion.md](skills/prism-brainstorm/visual-companion.md) | 92 | Visual companion spec |
| [skills/prism-brainstorm/scripts/server.cjs](skills/prism-brainstorm/scripts/server.cjs) | 354 | HTTP + WebSocket server |
| [skills/prism-brainstorm/scripts/frame-template.html](skills/prism-brainstorm/scripts/frame-template.html) | 214 | HTML frame the server wraps screens in |
| [skills/prism-brainstorm/scripts/helper.js](skills/prism-brainstorm/scripts/helper.js) | 88 | Client-side runtime injected before `</body>` |
| [skills/prism-brainstorm/scripts/start-server.sh](skills/prism-brainstorm/scripts/start-server.sh) | 148 | Server startup |
| [skills/prism-brainstorm/scripts/stop-server.sh](skills/prism-brainstorm/scripts/stop-server.sh) | 56 | Server shutdown |

External (sibling repo, not in prism-plugin):
- `c:\Users\digit\Developer\griotwave-library\_master\griotwave-style-tile.html`
- `c:\Users\digit\Developer\griotwave-library\_master\griotwave.tokens.json`

### Phase A — Channel + Extension Trigger (Q3, Q5)

| Path | Purpose |
|---|---|
| [apps/prism-vscode/src/extension.ts](apps/prism-vscode/src/extension.ts) | Extension activation, command registration (line 109+) |
| [apps/prism-vscode/package.json](apps/prism-vscode/package.json) | `contributes.commands` (lines 76-230+) |
| [apps/prism-vscode/src/prism/watcher.ts](apps/prism-vscode/src/prism/watcher.ts) | `PrismWatcher` — `vscode.FileSystemWatcher` over `.prism/` |
| [apps/prism-vscode/src/office/fileWatcher.ts](apps/prism-vscode/src/office/fileWatcher.ts) | Lower-level `fs.watch` + polling |
| [apps/prism-vscode/src/hosts/vscode/OfficeViewProvider.ts](apps/prism-vscode/src/hosts/vscode/OfficeViewProvider.ts) | `vscode.env.openExternal` example (line 382) |
| [apps/prism-vscode/src/core/controller/index.ts](apps/prism-vscode/src/core/controller/index.ts) | `PrismController` event emitters |

### Phase D — Design Skill Rewrite (Q6, Q6′)

| Path | Lines | Purpose |
|---|---|---|
| [skills/prism-design/SKILL.md](skills/prism-design/SKILL.md) | (sole file, no siblings) | Current design skill — markdown output, brainstorm as sub-step |

### Phase E — Init Infrastructure Tail

| Path | Verified Range | Status |
|---|---|---|
| [skills/prism/scripts/init_prism.py](skills/prism/scripts/init_prism.py#L23-L40) | dirs list **23-40** (ledger said 24-35) | Missing `brainstorms` |
| [skills/prism/scripts/init_prism.py](skills/prism/scripts/init_prism.py#L77-L93) | README heredoc **77-93** (ledger said 80-90) | Missing `brainstorms/` |
| [skills/prism/scripts/init_prism.py](skills/prism/scripts/init_prism.py#L162-L175) | CLI prints **162-175** (ledger said 165-172) | Missing `brainstorms/` |
| [skills/prism-init/SKILL.md](skills/prism-init/SKILL.md#L3) | line 3 description | Lists "research, plans, validation, designs, assets" — no brainstorms |
| [skills/prism-init/SKILL.md](skills/prism-init/SKILL.md#L31-L47) | tree block **31-47** (ledger said 35-42) | Missing `brainstorms/` |
| [CLAUDE.md](CLAUDE.md#L78-L95) | `.prism/ Directory Structure` block | Missing `brainstorms/` AND `contracts/` |
| `~/.claude/projects/.../memory/architecture.md` | n/a | No `.prism/shared/` layout block exists; only "Key Files" path references at lines 60-63 |

## Component Analysis

### Existing brainstorm server ([scripts/server.cjs](skills/prism-brainstorm/scripts/server.cjs))

- **Transport**: raw Node `http` with hand-rolled RFC 6455 WebSocket upgrade ([server.cjs:8-72](skills/prism-brainstorm/scripts/server.cjs#L8-L72)). No `ws` dependency.
- **Port**: `BRAINSTORM_PORT` env or random `49152 + rand(16383)` ([server.cjs:76-78](skills/prism-brainstorm/scripts/server.cjs#L76-L78)).
- **Routes** ([server.cjs:129-161](skills/prism-brainstorm/scripts/server.cjs#L129-L161)):
  - `GET /` → newest screen from `CONTENT_DIR`, wrapped via `wrapInFrame` ([server.cjs:112-114](skills/prism-brainstorm/scripts/server.cjs#L112-L114)) which substitutes `<!-- CONTENT -->` in `frame-template.html` and injects `helper.js` before `</body>`.
  - `GET /files/*` → static asset serving with MIME map ([server.cjs:84-88](skills/prism-brainstorm/scripts/server.cjs#L84-L88)).
  - All other routes → 404.
- **File watcher** ([server.cjs:269-298](skills/prism-brainstorm/scripts/server.cjs#L269-L298)): `fs.watch(CONTENT_DIR)` filters `*.html`, 100 ms per-filename debounce, distinguishes `screen-added` vs `screen-updated` via a `knownFiles` Set, broadcasts `{type:'reload'}` over WS.
- **Session model** ([server.cjs:79-82](skills/prism-brainstorm/scripts/server.cjs#L79-L82)): `BRAINSTORM_DIR` env → `SESSION_DIR`; derives `CONTENT_DIR = SESSION_DIR/content` and `STATE_DIR = SESSION_DIR/state`. The directory IS the session — no session-id concept.
- **State files written**: `STATE_DIR/server-info` on listen ([server.cjs:346](skills/prism-brainstorm/scripts/server.cjs#L346)), `STATE_DIR/server-stopped` on shutdown ([server.cjs:305-308](skills/prism-brainstorm/scripts/server.cjs#L305-L308)), `STATE_DIR/events` appended on user choice ([server.cjs:235-237](skills/prism-brainstorm/scripts/server.cjs#L235-L237)).
- **WebSocket inbound** ([server.cjs:224-238](skills/prism-brainstorm/scripts/server.cjs#L224-L238)): logs as `user-event`, appends to `STATE_DIR/events` only when `event.choice` is truthy. **No channels, no external trigger endpoint, no pub/sub beyond `{type:'reload'}` broadcasts.**
- **Owner watchdog**: validates `BRAINSTORM_OWNER_PID` at startup ([server.cjs:329-337](skills/prism-brainstorm/scripts/server.cjs#L329-L337)), polls every 60 s ([server.cjs:320-323](skills/prism-brainstorm/scripts/server.cjs#L320-L323)), 30-min idle timeout ([server.cjs:249](skills/prism-brainstorm/scripts/server.cjs#L249)).

### Existing frame template ([scripts/frame-template.html](skills/prism-brainstorm/scripts/frame-template.html))

- **Layout** ([frame-template.html:197-213](skills/prism-brainstorm/scripts/frame-template.html#L197-L213)): three vertical regions in a flex column body — `.header` (title "Prism Design Studio" + `.status` "Connected" pill), `.main > #claude-content` scroll region with the `<!-- CONTENT -->` placeholder, `.indicator-bar` footer with `#indicator-text`. **No side drawer element exists. No fidelity indicator element exists.**
- **CSS variables** ([frame-template.html:23-54](skills/prism-brainstorm/scripts/frame-template.html#L23-L54)): `:root` defines `--bg-primary/secondary/tertiary`, `--border`, `--text-primary/secondary/tertiary`, `--accent`, `--accent-hover`, `--success`, `--warning`, `--error`, `--selected-bg`, `--selected-border`. A `prefers-color-scheme: dark` block overrides the same names. **This is the entire token system — no fidelity, spacing, radius, or typography tokens.**
- **Component CSS** ([frame-template.html:65-194](skills/prism-brainstorm/scripts/frame-template.html#L65-L194)): `.header`, `.main`, `.indicator-bar`, typography helpers, `.options/.option/.letter` (A/B/C choices), `.cards/.card/.card-image/.card-body`, `.mockup/mockup-header/mockup-body`, `.split` two-column, `.pros-cons/.pros/.cons`, `.placeholder`, inline mockup primitives `.mock-nav/mock-sidebar/mock-content/mock-button/mock-input`.
- **Inline JS**: none. All client behavior lives in `helper.js`, injected by the server at runtime.

### Existing brainstorm SKILL.md ([skills/prism-brainstorm/SKILL.md](skills/prism-brainstorm/SKILL.md))

- Frontmatter: `name: prism-brainstorm`, `model: opus`, triggers in description string (no `triggers:` field).
- Workflow ([SKILL.md:19-27](skills/prism-brainstorm/SKILL.md#L19-L27)): 9 steps — explore context, offer visual companion, ask clarifying questions one at a time, propose 2-3 approaches, present in sections, write design doc to `.prism/shared/plans/YYYY-MM-DD-<topic>-design.md`, self-review, user reviews, transition to `/prism-plan`.
- Visual companion section ([SKILL.md:29-37](skills/prism-brainstorm/SKILL.md#L29-L37)): single offer-message rule, defers to `visual-companion.md`.
- **No fidelity vocabulary anywhere (no `lo`/`mid`/`hi`).**
- **No side-drawer description anywhere.**
- **No structured per-session state file written by the skill itself** — only the design markdown (which targets `plans/`, not `brainstorms/`).

### Existing prism-design skill ([skills/prism-design/SKILL.md](skills/prism-design/SKILL.md))

- Frontmatter ([SKILL.md:1-5](skills/prism-design/SKILL.md#L1-L5)): `name: prism-design`, `model: opus`, description only — **no `triggers:`, no `requires:`, no `inputs:`, no `require_brainstorm` flag, no machine-readable config of any kind.**
- **Inverted skill graph confirmed**: brainstorm appears as Step 3 of 6 ([SKILL.md:41-42](skills/prism-design/SKILL.md#L41-L42)) — *"For each decision, use `/prism-brainstorm` to explore options interactively"*. Brainstorm is a sub-step downstream of design, not a required upstream input.
- **Output is markdown, not .pen**: Step 5 writes `.md` ([SKILL.md:52-61](skills/prism-design/SKILL.md#L52-L61)). **Zero references to pencil MCP, `batch_design`, `open_document`, `.pen` files, or `.prism/shared/designs/` anywhere in the file.**
- Step 1 "Load Context" ([SKILL.md:26-30](skills/prism-design/SKILL.md#L26-L30)) loads research and (optionally) PRD — **brainstorms are not loaded as input.**
- Output destination ([SKILL.md:54](skills/prism-design/SKILL.md#L54)): `.prism/shared/plans/YYYY-MM-DD-<topic>-design.md` — design docs co-located with plans.
- Visual delegation ([SKILL.md:46](skills/prism-design/SKILL.md#L46)): `/generate_user_flows` (no destination specified).

### prism-vscode extension surface

- **Existing watcher pattern**: [PrismWatcher](apps/prism-vscode/src/prism/watcher.ts) uses `vscode.FileSystemWatcher` over `.prism/` subdirectories (stories, research, plans, validation, spectrum). Emits typed `PrismFileChangeEvent`s consumed by tree providers via [PrismController](apps/prism-vscode/src/core/controller/index.ts) (`onDidChangeFile`, `onDidChangeState` event emitters). **Currently does NOT watch `.prism/local/brainstorm/`.**
- **Lower-level pattern**: [office/fileWatcher.ts](apps/prism-vscode/src/office/fileWatcher.ts) uses raw `fs.watch` + polling for agent JSONL files — proves both API styles are already in-tree.
- **Browser-opening patterns existing in repo**:
  - `vscode.env.openExternal(vscode.Uri.file(...))` at [OfficeViewProvider.ts:382](apps/prism-vscode/src/hosts/vscode/OfficeViewProvider.ts#L382)
  - `vscode.commands.executeCommand('vscode.openFolder', ...)` at [PrismPanelProvider.ts:411,418](apps/prism-vscode/src/hosts/vscode/PrismPanelProvider.ts#L411) and [extension.ts:217](apps/prism-vscode/src/extension.ts#L217)
  - **No existing `simpleBrowser.show` invocation found.** Q5 will introduce the first one.
- **Command registration pattern**: `vscode.commands.registerCommand` calls in [extension.ts](apps/prism-vscode/src/extension.ts) starting line 109; `contributes.commands` array in [package.json](apps/prism-vscode/package.json) lines 76-230+.

### init_prism.py — Phase E exact current state

The ledger's predicted line ranges were close but not exact. Verified ranges:

**`directories` list** ([init_prism.py:23-40](skills/prism/scripts/init_prism.py#L23-L40)) — does NOT include `brainstorms`. Currently:
```
.prism/stories
.prism/shared/research
.prism/shared/plans
.prism/shared/validation
.prism/shared/handoffs
.prism/shared/prs
.prism/shared/spectrum
.prism/shared/ref
.prism/shared/docs
.prism/shared/contracts
.prism/shared/designs
.prism/shared/assets
.prism/shared/validation/baselines
.prism/shared/validation/diffs
.prism/local/ref
.prism/local/docs
```

**README heredoc tree** ([init_prism.py:77-93](skills/prism/scripts/init_prism.py#L77-L93)): missing `brainstorms/` line (full quote in agent output).

**CLI print statements** ([init_prism.py:162-175](skills/prism/scripts/init_prism.py#L162-L175)): missing `brainstorms/` line (full quote in agent output).

**[skills/prism-init/SKILL.md:3](skills/prism-init/SKILL.md#L3)** description: lists `research, plans, validation, designs, assets` — does NOT mention brainstorms.

**[skills/prism-init/SKILL.md:31-47](skills/prism-init/SKILL.md#L31-L47)** tree block: missing `brainstorms/`.

**[CLAUDE.md:78-95](CLAUDE.md#L78-L95)** `.prism/ Directory Structure` block: missing `brainstorms/` AND missing `contracts/` (drift from script).

**`memory/architecture.md`**: no `.prism/shared/` layout block exists. Only path references at lines 60-63 (Key Files section). Nothing to update structurally.

## External Findings — `claude/channel` MCP capability

Source: [code.claude.com/docs/en/channels-reference](https://code.claude.com/docs/en/channels-reference) (official, research preview).

- **Capability key**: `capabilities.experimental['claude/channel']` — its presence in the MCP `Server` constructor registers the notification listener in Claude Code.
- **Minimum version**: **Claude Code v2.1.80** (matches ledger). Permission relay (`claude/channel/permission`) requires v2.1.81+.
- **Allowlist bypass flag** (matches ledger): `--dangerously-load-development-channels server:webhook` or `plugin:name@marketplace`. Per-entry, requires confirmation prompt. Org-level `channelsEnabled` policy still applies.
- **Notification shape** (exact):
  ```ts
  await mcp.notification({
    method: 'notifications/claude/channel',
    params: {
      content: 'event body text',
      meta: { key: 'value' }, // letters/digits/underscores only; hyphens silently dropped
    },
  })
  ```
  Claude receives `<channel source="webhook" key="value">event body text</channel>`.
- **Two-way reply tools**: fully supported. Add `tools: {}` to `capabilities`, register `ListToolsRequestSchema` + `CallToolRequestSchema` handlers, supply `instructions` string. This is Option C in the ledger's "kept in awareness circle".
- **Reference implementations**: [github.com/anthropics/claude-plugins-official/tree/main/external_plugins](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins) — Telegram, Discord, iMessage, fakechat. Bun is the official primary runtime. Only dep: `@modelcontextprotocol/sdk`.
- **Auth constraint**: requires claude.ai login (Console / API key auth not supported). Distribution concern that the ledger already parked as Deferred Concern §2.3.

## Patterns Found

- **WebSocket reload broadcast**: existing pattern in [server.cjs:269-298](skills/prism-brainstorm/scripts/server.cjs#L269-L298). Q3's channel adapter is additive — the existing WS server keeps doing reload, the channel server is a separate process that only carries the wake signal.
- **File-watcher → command dispatch**: existing pattern in [PrismWatcher](apps/prism-vscode/src/prism/watcher.ts). Q5's `state/open-viewer` watcher can mirror the same `vscode.FileSystemWatcher` style.
- **CSS-variable-only theming**: existing pattern in [frame-template.html:23-54](skills/prism-brainstorm/scripts/frame-template.html#L23-L54). Q1's griotwave port plugs in by replacing the variable block, leaving the rest of the template addressable.
- **Markdown-only design output**: existing pattern in [prism-design/SKILL.md:54](skills/prism-design/SKILL.md#L54). Q6 inverts this — `.pen` becomes the terminus, ledger becomes the upstream input.

## Open Questions

These are surfaced by the gap between the ledger's plan and the current code. They are NOT recommendations — they are unknowns the planning phase will need to resolve.

1. **`helper.js` runtime contract** (not analyzed): the Q4 two-pane drawer and Q2 fidelity escalation will both need DOM additions; the current client runtime in `helper.js` (88 lines) was not analyzed and may already define a message protocol that constrains how new panes are mounted. Read in plan phase.
2. **`visual-companion.md` content** (not analyzed): SKILL.md defers to it for the offer/installation flow; Q3's channel-based wake requires changing the offer message and likely the startup script. Read in plan phase.
3. **Plugin manifest implications of a new MCP server**: `brainstorm-channel.ts` needs to be declared somewhere the plugin recognizes — `plugin.json` MCP servers list, or `.mcp.json`, or both? `cl-plugin-structure` skill is the canonical guide for this and should be invoked when the plan is drafted.
4. **Bun availability assumption**: ledger specifies `scripts/brainstorm-channel.ts` (Bun). The repo currently has zero Bun scripts (`server.cjs` is plain Node). Distribution implications for users without Bun installed are unaddressed by the ledger.
5. **Q6 corollary — does `prism-design` rewrite move output from `plans/` to `designs/`?** SKILL.md currently writes `*-design.md` into `plans/`. The brainstorm ledger implies `.pen` files land in `designs/` but does not explicitly say what happens to the markdown counterpart. Decide in plan phase.
6. **Drift surface**: [CLAUDE.md:78-95](CLAUDE.md#L78-L95) is missing `contracts/` in addition to `brainstorms/`. Phase E should address this drift opportunistically.
7. **Phase E item 7** (the "any project-memory files" line): only one such file exists (`memory/architecture.md`) and it has no structural layout block to update. The ledger's checklist item is therefore a no-op as written; planning should either drop it or expand to a different memory file.

## Reference Artifacts (from ledger §3)

- Final hi-fi screen: `.prism/local/brainstorm/1051-1775635488/content/06-pipeline-terminus.html`
- All session screens: `.prism/local/brainstorm/1051-1775635488/content/00..07-*.html`
- Channel events log: `.prism/local/brainstorm/1051-1775635488/state/events`
- Griotwave source: `c:\Users\digit\Developer\griotwave-library\_master\griotwave-style-tile.html` + `griotwave.tokens.json`

## Handoff to `/prism-plan`

This document maps every file the five phases will touch. Planning should:

1. Read [helper.js](skills/prism-brainstorm/scripts/helper.js) and [visual-companion.md](skills/prism-brainstorm/visual-companion.md) (Open Questions 1, 2) before drafting Phase B.
2. Invoke the `cl-plugin-structure` skill when laying out the new `scripts/brainstorm-channel.ts` MCP server registration (Open Question 3).
3. Resolve the Bun availability question (Open Question 4) before committing to `.ts` over `.cjs`.
4. Decide markdown/`.pen` co-existence in Phase D (Open Question 5).
5. Carry the ledger's §2 Deferred Concerns forward verbatim into the plan.
