---
date: 2026-04-08
title: Brainstorm Redesign — Implementation Plan
status: approved
ledger: .prism/shared/brainstorms/2026-04-08-brainstorm-redesign.md
research: .prism/shared/research/2026-04-08-brainstorm-redesign.md
phases: 5
execution: strict-sequential
---

# Brainstorm Redesign — Implementation Plan

## Overview

Implement the six locked decisions (Q1..Q6′) from the 2026-04-08 brainstorm ledger across five sequential phases. Transform the brainstorm visual companion into a griotwave-themed, fidelity-progressive, channel-driven experience and correct the inverted `prism-design ↔ prism-brainstorm` skill graph so brainstorm becomes the required upstream input that hands off a `.pen` design artifact.

## Locked Decisions (from the user, this session)

| # | Decision | Pick |
|---|---|---|
| D1 | `brainstorm-channel.ts` runtime | **Bun** (matches ledger, matches Anthropic reference plugins) |
| D2 | `prism-design` output format | **Dual `.md` + `.pen` in `.prism/shared/designs/`** (md carries meaning, pen carries layout) |
| D3 | Phase E "project-memory file" item | **Expand to a fresh `project_brainstorm_redesign_complete.md` write at end of Phase D** |
| Q-i | Phase ordering | **Strict sequential A→B→C→D→E** |
| Q-ii | Phase A smoke test location | **Worktree** (`worktree/brainstorm-redesign-phase-a`) |

## What We're NOT Doing

- **No `claude/channel/permission` (two-way reply tools).** Ledger Q3 explicitly kept Option C ("full channel with `push_screen` reply tool") in the awareness circle for *future* refinement. This plan implements only the thin one-way wake adapter.
- **No public-distribution UX for users below Claude Code v2.1.80.** Ledger Deferred Concern §2.3 — revisit before any public release.
- **No auto-detection of griotwave breaking changes.** Ledger Deferred Concern §2.1 — `port-griotwave.cjs` is run manually; v0.4 may need updates when it lands.
- **No `/hi` mid-clarification priority resolution.** Ledger Deferred Concern §2.2 — leave the classifier/command interaction unspecified, deal with it during Phase B implementation if it actually surfaces.
- **No `prism-plan` rewrite** to read `.pen` directly. Plan continues reading the markdown sidecar (D2 = B preserves current behavior).
- **No vendoring of `griotwave-library`.** Stays a sibling repo at `c:\Users\digit\Developer\griotwave-library\`. Port script reads across the path.
- **No backfill of historical `.prism/shared/plans/*-design.md` files** to the new `designs/` location. Phase D applies forward only.
- **No `helper.js` rewrite to a framework.** Stays vanilla 88-line WS client. Drawer additions are additive DOM + state.

---

## Phase A — Foundation (Channel + Extension Trigger)

**Goal**: Wake-on-click works end-to-end. Browser click → MCP channel server → Claude resumes mid-session. Trigger file → VS Code Simple Browser opens automatically.

**Worktree**: Create `worktree/brainstorm-redesign-phase-a` for this phase. Smoke testing the channel requires restarting Claude Code with `--dangerously-load-development-channels`, so isolation is mandatory.

### Files

| Path | Action | Notes |
|---|---|---|
| `skills/prism-brainstorm/scripts/brainstorm-channel.ts` | create | Bun MCP server, ~60 lines, declares `claude/channel` capability |
| `plugin.json` | modify | Register the new MCP server (invoke `cl-plugin-structure` skill for canonical wiring) |
| `apps/prism-vscode/src/prism/brainstormViewerWatcher.ts` | create | `vscode.FileSystemWatcher` over `.prism/local/brainstorm/*/state/open-viewer` |
| `apps/prism-vscode/src/extension.ts` | modify | Wire `BrainstormViewerWatcher` into activation, dispose in deactivate |
| `apps/prism-vscode/package.json` | modify | (only if a new command surface is required — likely not, watcher dispatches `simpleBrowser.show` directly) |
| `skills/prism-brainstorm/scripts/start-server.sh` | modify | Write `state/open-viewer` trigger file containing the URL after server bind |
| `skills/prism-brainstorm/scripts/server.cjs` | (no changes) | The existing WS reload broadcast stays exactly as-is — channel is additive |

### Steps

1. **Read `cl-plugin-structure` skill** for plugin.json MCP server registration shape. Confirm whether a new MCP server registers under `mcpServers` field, what `command`/`args`/`type` keys to use, and whether `${CLAUDE_PLUGIN_ROOT}` substitution is required.
2. **Write `brainstorm-channel.ts`** following the [Channels reference](https://code.claude.com/docs/en/channels-reference) shape:
   - Declare `capabilities.experimental['claude/channel']`
   - Listen on a local HTTP port (separate from `server.cjs`'s WS port — pick from `BRAINSTORM_CHANNEL_PORT` env or random ephemeral)
   - On `POST /channel` → validate body → call `mcp.notification({ method: 'notifications/claude/channel', params: { content, meta } })`
   - Use `@modelcontextprotocol/sdk` and `StdioServerTransport`
   - Write the channel port to `state/channel-info` so `helper.js` can discover it
3. **Update `start-server.sh`** to:
   - Spawn `bun run brainstorm-channel.ts` as a sibling process (track its PID into `state/channel.pid` for stop-server.sh)
   - After `server.cjs` reports its URL, write `state/open-viewer` containing exactly the URL string
4. **Update `helper.js`** to:
   - On `data-choice` click, *also* fire `fetch('http://127.0.0.1:<channel-port>/channel', { method: 'POST', body: JSON.stringify({ content: 'user clicked', meta: { choice: ..., id: ... } }) })`
   - Read channel port from a `<meta name="brainstorm-channel-port">` tag injected by `server.cjs` into the frame template
   - This is the ONLY change to existing visual-companion code in Phase A
5. **Create `BrainstormViewerWatcher.ts`**:
   - Glob-watch `.prism/local/brainstorm/*/state/open-viewer` via `vscode.workspace.createFileSystemWatcher`
   - On `onDidCreate` and `onDidChange`: read file → URL string → `vscode.commands.executeCommand('simpleBrowser.show', url)`
   - Mirror the disposal pattern from [`PrismWatcher`](apps/prism-vscode/src/prism/watcher.ts)
6. **Wire into [`extension.ts`](apps/prism-vscode/src/extension.ts)** activation alongside the existing `PrismWatcher` instantiation. Add to subscriptions for cleanup.
7. **Update `stop-server.sh`** to also kill the channel PID and remove `state/channel-info` + `state/open-viewer`.

### Success Criteria

#### Automated Verification:
- [x] Bun boots the channel script and `/health` returns `{"ok":true,"port":52342}`
- [x] VS Code extension compiles: `cd apps/prism-vscode && npm run compile` ✓
- [x] Plugin manifest validates: `claude plugin validate .` → `Validation passed`
- [x] Shell scripts pass `bash -n`
- [x] `server.cjs` and `helper.js` pass `node -c`

#### Manual Verification:
- [ ] In `worktree/brainstorm-redesign-phase-a`, restart Claude Code with `--dangerously-load-development-channels plugin:prism@local`
- [ ] Run a fresh `/prism-brainstorm` session
- [ ] Confirm Simple Browser auto-opens with the brainstorm URL (no manual click)
- [ ] Click an option in the browser
- [ ] Confirm Claude wakes mid-session and acknowledges the click without the user typing anything in the terminal
- [ ] Confirm `state/events`, `state/server-info`, `state/channel-info`, `state/open-viewer` all populate correctly
- [ ] `stop-server.sh` cleanly terminates both processes and removes state files

### Risks

- **Risk**: `cl-plugin-structure` reveals a constraint that forces the channel script under a different path (e.g., `mcp-servers/`). **Mitigation**: read the skill *first* before writing files. Move if required.
- **Risk**: Bun on Windows path resolution differs from POSIX. **Mitigation**: use `process.env.BRAINSTORM_DIR` rather than `__dirname` traversal.
- **Risk**: Channel notifications fail silently if Claude Code wasn't launched with the dev flag. **Mitigation**: `start-server.sh` warns to stderr if `CLAUDE_CODE_VERSION` < 2.1.80 or `--dangerously-load-development-channels` not detected.

---

## Phase B — Visual (Griotwave + Fidelity Engine)

**Goal**: Frame template renders in griotwave aesthetic. Fidelity engine (auto + manual + final-hi rule + carry-forward) is documented and Claude follows it.

### Files

| Path | Action | Notes |
|---|---|---|
| `skills/prism-brainstorm/scripts/port-griotwave.cjs` | create | ~30 lines, regenerates CSS variable block from griotwave tokens |
| `skills/prism-brainstorm/scripts/frame-template.html` | modify | Replace `:root` block (lines 23-54), keep everything else, add griotwave version comment header |
| `skills/prism-brainstorm/SKILL.md` | modify | Add fidelity vocabulary, classifier rules, slash commands, carry-forward, final-hi rule |
| `skills/prism-brainstorm/visual-companion.md` | modify | Add fidelity content type, document `data-fidelity` attribute |

### Steps

1. **Write `port-griotwave.cjs`**:
   - Read `c:/Users/digit/Developer/griotwave-library/_master/griotwave.tokens.json` (CLI flag `--griotwave-path` overrides)
   - Map tokens to CSS custom properties (preserve existing names where possible; add new ones for fidelity / typography / spacing as the token file dictates)
   - Read `frame-template.html`, locate the `/* griotwave-tokens-start */` ↔ `/* griotwave-tokens-end */` markers, replace block contents
   - Stamp comment header `/* griotwave port v<version> @ <ISO timestamp> */`
   - Idempotent: running twice with the same source produces identical output
2. **One-time prep on `frame-template.html`**: add the start/end marker comments around the existing `:root` block so the script has anchors.
3. **Run `node port-griotwave.cjs`** once. Commit the resulting `frame-template.html` and the script together.
4. **Update `prism-brainstorm/SKILL.md`** workflow section:
   - Add new section "Fidelity Levels" defining `lo` (sketch), `mid` (structured), `hi` (polished). Define which CSS classes apply at which level (e.g., `data-fidelity="lo"` on the body sets a sketch-stroke filter).
   - Add classifier instructions: every user message is classified `decide` (advance to next question, fresh fidelity if none carried) or `clarify` (re-render current screen at next fidelity up).
   - Add slash-command override: `/hi` `/mid` `/lo` jump to that level for the next render.
   - Add carry-forward rule: fidelity level persists across questions until explicitly downshifted.
   - Add final-hi ceremonial rule: the *last* decision-confirm screen before the design doc is ALWAYS hi-fi regardless of carry-forward state.
5. **Update `visual-companion.md`** to document `data-fidelity` attribute on root `<div>` of fragments and how it cascades.

### Success Criteria

#### Automated Verification:
- [x] `node skills/prism-brainstorm/scripts/port-griotwave.cjs --check` → "in sync with griotwave tokens"
- [x] `node -c port-griotwave.cjs` syntax clean
- [x] `node -c server.cjs` and `node -c helper.js` still clean
- [x] `claude plugin validate .` still passes

#### Manual Verification:
- [ ] Open the griotwave style tile and the new `frame-template.html` side-by-side. Header colors, accent, typography clearly match.
- [ ] Run a 3-question test brainstorm session. First question renders `lo`, escalate via `/mid` on Q2, observe Q3 starts at `mid` (carry-forward).
- [ ] Final confirmation screen renders at `hi` regardless of carry-forward state.
- [ ] Sketch/lo level visually distinct from polished/hi (filter, opacity, or border treatment).

### Risks

- **Risk**: `griotwave.tokens.json` schema unknown until read. **Mitigation**: port script's first action in implementation is to dump the schema and align mapping to it.
- **Risk**: Carry-forward + classifier ambiguity (Deferred Concern §2.2). **Mitigation**: leave it ambiguous; document the rule, deal with edge cases when they appear.

---

## Phase C — Drawer (Two-Pane Decisions + Parking Lot)

**Goal**: Two-pane drawer renders inside the griotwave frame. Decisions accumulate in the top pane. "Park this" verb defers items to the bottom pane with back-pointers.

### Files

| Path | Action | Notes |
|---|---|---|
| `skills/prism-brainstorm/scripts/frame-template.html` | modify | Add `<aside class="drawer">` markup with `decisions-pane` and `parking-pane` |
| `skills/prism-brainstorm/scripts/helper.js` | modify | Add drawer state, decision/parking renderers, WS message handler for `state-update` |
| `skills/prism-brainstorm/scripts/server.cjs` | modify | Add `GET /state/decisions.json` route + WS broadcast `{type:'state-update', decisions, parked}` when file changes |
| `skills/prism-brainstorm/SKILL.md` | modify | Add "park this" verb to classifier (decide / clarify / park) |
| `skills/prism-brainstorm/visual-companion.md` | modify | Document `state/decisions.json` schema |

### `state/decisions.json` schema

```json
{
  "decisions": [
    { "q": "Q1", "label": "Re-skin fidelity", "choice": "B", "summary": "Hybrid (inlined + regen script)" }
  ],
  "parked": [
    { "fromQ": "Q2", "label": "/hi mid-stream priority", "concern": "...", "revisit": "during Q2 impl" }
  ]
}
```

### Steps

1. **Update `server.cjs`**:
   - Add `GET /state/decisions.json` static route
   - In `startServer` watcher, also watch `STATE_DIR/decisions.json` → on change, broadcast `{type:'state-update', payload: <file contents>}`
2. **Update `frame-template.html`**:
   - Add `<aside class="drawer">` containing `<section class="decisions-pane"><h2>Decisions</h2><ul id="decisions-list"></ul></section><section class="parking-pane"><h2>Parked</h2><ul id="parking-list"></ul></section>`
   - Add CSS for `.drawer` (right-side fixed-width column, scrollable) — pull dimensions from griotwave tokens
3. **Update `helper.js`**:
   - On WS `state-update` message: render `decisions-list` and `parking-list` from payload
   - On initial connect: fetch `/state/decisions.json` once
4. **Update `prism-brainstorm/SKILL.md`**:
   - Extend classifier: every user message is one of `decide` / `clarify` / `park`
   - Add "park this" explicit user verb
   - On `decide`: append to `decisions[]` array in `state/decisions.json` and write file (Claude writes the file directly via the Write tool)
   - On `park`: append to `parked[]` with back-pointer `fromQ`
   - Final design doc (in Phase D's `.pen`) gains a "Deferred Concerns" appendix sourced from `parked[]`
5. **Update `visual-companion.md`** with the schema and the decisions/parking flow.

### Success Criteria

#### Automated Verification:
- [x] `GET /state/decisions.json` returns `{"decisions":[],"parked":[]}` when file absent and the parsed file content when present (curl smoke test passed)
- [x] `node -c helper.js` and `node -c server.cjs` clean
- [x] `port-griotwave.cjs --check` still passes (drawer changes are outside the markers)
- [x] `claude plugin validate .` still passes

#### Manual Verification:
- [ ] Drive a 4-question test session. Confirm 1, park 1, confirm 2 more.
- [ ] Drawer's "Decisions" pane shows 3 entries with correct Q→option mapping.
- [ ] Drawer's "Parked" pane shows 1 entry with back-pointer to its source Q.
- [ ] Final design doc (manually inspect the `.pen` once Phase D ships) carries the parked item into a "Deferred Concerns" appendix.

### Risks

- **Risk**: Drawer becomes a graveyard with too many parked items. **Mitigation**: ledger flagged this — long parking lot is a session-health signal documented in `prism-brainstorm/SKILL.md`. Claude warns when `parked.length >= 5`.
- **Risk**: Two classifiers (decide/clarify *and* decide/clarify/park) compound misfire risk. **Mitigation**: collapse to single 3-way classifier in SKILL.md instructions.

---

## Phase D — Pipeline (`prism-design` Rewrite + `.pen` + Memory)

**Goal**: `prism-design` is upstream-of-brainstorm corrected, requires a brainstorm ledger by default, writes both `.md` (architectural prose) and `.pen` (visual layout) to `.prism/shared/designs/`. Fresh project memory documents the new graph.

### Files

| Path | Action | Notes |
|---|---|---|
| `skills/prism-design/SKILL.md` | full rewrite | Invert graph, add `require_brainstorm` frontmatter, switch to dual md+pen output in `designs/`, add OPTIONAL code path |
| `commands/create_plan.md` | modify (audit) | If it references `.prism/shared/plans/*-design.md`, update to read from `.prism/shared/designs/` |
| `commands/iterate_plan.md` | modify (audit) | Same audit |
| `skills/prism-plan/SKILL.md` | modify (audit) | Same audit — `prism-plan` reads markdown sidecar from `designs/`, not `plans/` |
| `~/.claude/projects/c--Users-digit-Developer-prism-plugin/memory/project_brainstorm_redesign_complete.md` | create | Fresh project memory — document the inverted graph + dual-output convention |
| `~/.claude/projects/c--Users-digit-Developer-prism-plugin/memory/MEMORY.md` | modify | Add pointer to the new memory file |

### `prism-design/SKILL.md` rewrite outline

```yaml
---
name: prism-design
model: opus
description: ...
require_brainstorm: true   # NEW — flip to false for exploratory mode
inputs:
  required: [.prism/shared/brainstorms/]
  optional: [.prism/shared/research/, .prism/shared/prds/]
---
```

Workflow sections:
1. **Load Ledger** — read most recent (or named) ledger from `.prism/shared/brainstorms/`. If `require_brainstorm: true` and no ledger found → error and ask user to brainstorm first. If `require_brainstorm: false` → proceed in exploratory mode (dormant code path, tested but not default).
2. **Load Supporting Context** — research + PRD if present.
3. **Architect** — add mermaid diagrams, interface contracts, data models on top of the ledger's Chosen Approaches.
4. **Carry Deferred Concerns** — preserve ledger §2 verbatim into design doc appendix.
5. **Materialize Markdown Sidecar** — write `.prism/shared/designs/YYYY-MM-DD-<topic>-design.md` with the architectural prose.
6. **Materialize `.pen`** — call `pencil.batch_design` to write `.prism/shared/designs/YYYY-MM-DD-<topic>.pen`. Use the ledger's reference HTML (final hi-fi screen) as visual layout reference.
7. **Transition** — offer `/prism-plan`. `prism-plan` reads the markdown sidecar (existing behavior preserved).

### Steps

1. Read existing `prism-design/SKILL.md` line-by-line, draft the rewrite preserving section headers users may be familiar with.
2. Audit `commands/create_plan.md`, `commands/iterate_plan.md`, `skills/prism-plan/SKILL.md` for any string match on `*-design.md` in `plans/` and update path.
3. Run `/prism-design` against the 2026-04-08 ledger as the first end-to-end smoke test.
4. Verify `.prism/shared/designs/2026-04-08-brainstorm-redesign.pen` AND `2026-04-08-brainstorm-redesign-design.md` both exist.
5. Flip `require_brainstorm: false` in a scratch test, run `/prism-design` against a topic with no ledger, confirm exploratory mode works (don't commit the flag flip).
6. Write `memory/project_brainstorm_redesign_complete.md` describing: the corrected graph, the dual-output convention, the `require_brainstorm` flag, and a note that this supersedes `project_skill_graph_correction.md` (which documented the *decision*).
7. Add a one-line pointer to `memory/MEMORY.md`.

### Success Criteria

#### Automated Verification:
- [x] `prism-design/SKILL.md` frontmatter parses with `require_brainstorm: true` + `inputs.required: [.prism/shared/brainstorms/]`
- [x] `grep -rE "plans/.*-design\.md" commands/ skills/` returns no results
- [x] All 3 `apps/prism-setup/resources/plugin/skills/{prism-design,prism-brainstorm,prism}/SKILL.md` mirrors match source via `diff -q`
- [x] `claude plugin validate .` still passes
- [x] Memory file written + MEMORY.md pointer updated

#### Manual Verification:
- [ ] `/prism-design` against the 2026-04-08 ledger produces both files in `.prism/shared/designs/`
- [ ] `.pen` opens in pencil and shows a layout informed by the ledger's reference hi-fi HTML
- [ ] Markdown sidecar carries Deferred Concerns appendix verbatim
- [ ] Exploratory mode (`require_brainstorm: false`) runs without erroring when no ledger exists
- [ ] `/prism-plan` reads the markdown sidecar from `designs/` without breaking
- [ ] New project memory file written and pointer added to MEMORY.md

### Risks

- **Risk**: `commands/create_plan.md` and friends have hardcoded `plans/` reads that aren't easily greppable. **Mitigation**: thorough audit + worktree smoke test before merging.
- **Risk**: `pencil.batch_design` op shape unfamiliar from prism-design's Claude session context. **Mitigation**: invoke `mcp__pencil__get_guidelines` at the start of Phase D smoke test.
- **Risk**: The `OPTIONAL` code path rots if untested. **Mitigation**: include in success criteria above; flip the flag at least once during Phase D smoke test.

---

## Phase E — Init Infrastructure Tail

**Goal**: Fresh `prism init` creates `.prism/shared/brainstorms/`. All doc surfaces consistently reference it. Drift fix for `contracts/` in CLAUDE.md.

### Files (verified line ranges from research doc)

| Path | Action | Lines |
|---|---|---|
| `skills/prism/scripts/init_prism.py` | modify | 23-40 (dirs list — add `.prism/shared/brainstorms`) |
| `skills/prism/scripts/init_prism.py` | modify | 77-93 (README heredoc tree — add `brainstorms/` line) |
| `skills/prism/scripts/init_prism.py` | modify | 162-175 (CLI print tree — add `brainstorms/` line) |
| `skills/prism-init/SKILL.md` | modify | line 3 (description — add "brainstorms" to the list) |
| `skills/prism-init/SKILL.md` | modify | 31-47 (tree comment — add `brainstorms/` line) |
| `CLAUDE.md` | modify | 78-95 (`.prism/ Directory Structure` — add `brainstorms/` AND `contracts/`) |

### Steps

1. Edit `init_prism.py` dirs list — append `".prism/shared/brainstorms",` in the same alphabetical/grouping position the script currently uses.
2. Edit the README heredoc tree at lines 77-93 — add `│   ├── brainstorms/      # Brainstorm decision ledgers (YYYY-MM-DD-topic.md)` in the appropriate position.
3. Edit the CLI print statements at lines 162-175 — add the matching `print("   |   +-- brainstorms/  # Brainstorm decision ledgers")` line.
4. Edit `prism-init/SKILL.md:3` — change description to `... research, plans, validation, designs, assets, brainstorms, ...` (alphabetical or chronological — match existing convention).
5. Edit `prism-init/SKILL.md:31-47` tree block — add `brainstorms/` line.
6. Edit `CLAUDE.md:78-95` — add BOTH `brainstorms/` and the missing `contracts/` (drift fix from research finding).
7. **Drift consistency check**: after edits, run a diff between the three tree representations (init_prism.py heredoc, init_prism.py CLI print, prism-init/SKILL.md tree, CLAUDE.md tree) — all four should list the same directories in the same order. Fix any remaining drift opportunistically.

### Success Criteria

#### Automated Verification:
- [x] `python init_prism.py` in a fresh scratch dir creates `.prism/shared/brainstorms/` AND completes cleanly (no Unicode crash)
- [x] All four tree diagrams (init_prism.py heredoc, init_prism.py CLI prints, prism-init/SKILL.md, CLAUDE.md) contain `brainstorms/` AND `contracts/`
- [x] `claude plugin validate .` still passes
- [x] Mirror copies in `apps/prism-setup/resources/plugin/skills/{prism,prism-init}` synced via `cp` from source

#### Manual Verification:
- [ ] Visual diff of the four tree diagrams is consistent (same ordering, same comment style)
- [ ] CLAUDE.md drift fix doesn't break any other section

### Risks

- **Risk**: Tree drift between the four representations is a recurring problem (this brainstorm's existence proves it). **Mitigation**: out of scope for this plan, but flag as a future "single source of truth" follow-up.

---

## Cross-Phase Verification

After all phases ship, the end-to-end smoke is:

1. Fresh `prism init` in a scratch directory → `brainstorms/` exists
2. `/prism-brainstorm` → griotwave-themed browser viewer auto-opens via Simple Browser, fidelity progresses, drawer accumulates decisions, parking lot accumulates parked items, click events wake Claude mid-session
3. Brainstorm writes ledger to `.prism/shared/brainstorms/`
4. `/prism-design` reads the ledger (required by default), writes `.pen` + markdown sidecar to `.prism/shared/designs/`
5. `/prism-plan` reads the markdown sidecar, plans normally
6. `/prism-implement` → `/prism-validate` continue unchanged

## Open Questions Resolved

All seven Open Questions from the research doc are resolved by the decisions and phase structure above:

| OQ | Resolution |
|---|---|
| 1. `helper.js` runtime contract | Read this session — vanilla 88-line WS client, additive changes only |
| 2. `visual-companion.md` content | Read this session — Phase A updates `start-server.sh`, Phase B/C update the doc |
| 3. Plugin manifest implications | `cl-plugin-structure` invoked at the start of Phase A (Step 1) |
| 4. Bun availability | D1 = A (Bun, accept the prereq) |
| 5. `.pen` + markdown coexistence | D2 = B (dual output in `designs/`) |
| 6. CLAUDE.md drift (missing `contracts/`) | Bundled into Phase E (drift fix) |
| 7. Phase E item 7 | D3 = B (write fresh `project_brainstorm_redesign_complete.md`) |

## Deferred Concerns (carried forward from ledger §2)

These remain deferred and are NOT addressed by this plan:

1. **griotwave v0.4 breaking changes** — revisit when v0.4 lands
2. **`/hi` mid-stream interaction with classifier** — revisit during Phase B implementation if it surfaces
3. **`claude/channel` capability cutoff for users below v2.1.80** — revisit before any public release

## Phase Gate Summary

```
Phase A → smoke test in worktree → merge → continue
Phase B → manual fidelity test → continue
Phase C → 4-question drawer test → continue
Phase D → end-to-end /prism-design against this very ledger → continue
Phase E → fresh init scratch test → done
```

Strict sequential. No parallel tracks. Each gate is manual + automated.

---

## Session Notes — 2026-04-08 (Phase A implementation)

### Deviation: channel server lifecycle (Option C — persistent + session routing)

**Plan Step 3 said**: spawn `bun run brainstorm-channel.ts` from `start-server.sh`, track PID in `state/channel.pid`.

**Reality**: MCP `claude/channel` capability requires `StdioServerTransport`. Claude Code spawns the MCP server process via `plugin.json` `mcpServers` and owns its stdio pipe. A shell script cannot be the parent.

**Resolution (user-approved Option C)**: Channel server is persistent — registered in `plugin.json`, started by Claude Code at plugin-load time. Listens on fixed default port `52342` (overridable via `BRAINSTORM_CHANNEL_PORT` env). Each browser POST includes `session_id` so Claude knows which brainstorm fired the click. Routing is handled in the notification `meta` field.

**Consequential changes** to Phase A file list:
- `start-server.sh` no longer spawns or tracks the channel server. It only writes `state/open-viewer`.
- `stop-server.sh` no longer kills a channel PID. It only removes `state/open-viewer`.
- `server.cjs` is now modified (was "no changes") — it reads `BRAINSTORM_CHANNEL_PORT` from env (default 52342) and `BRAINSTORM_SESSION_ID` (derived from `SESSION_DIR` basename), then injects two `<meta>` tags into the wrapped frame so `helper.js` can discover them.
- `state/channel-info` is no longer written (no per-session channel state).

### Deviation: Phase D audit scope (Option A — expanded)

**Plan Step 2 said**: only audit `commands/create_plan.md`, `commands/iterate_plan.md`, `skills/prism-plan/SKILL.md`.

**Reality**: those three files were clean. But the audit pattern `plans/.*-design.md` also matched `skills/prism-brainstorm/SKILL.md` (lines 24, 124), `skills/prism/SKILL.md` (lines 27, 28 — top-level integrator table), and 3 mirror copies under `apps/prism-setup/resources/plugin/`.

**Resolution (user-approved Option A)**: expand Phase D scope to fix all of them. `prism-brainstorm/SKILL.md` now writes ledger to `.prism/shared/brainstorms/` (not `plans/*-design.md`) and the format section is rewritten as a *ledger* (decisions + parked, not a design doc). `prism/SKILL.md` integrator table updated. 3 mirror copies synced via `cp` from source. Audit grep returns clean across `commands/` and `skills/`.

### Deviation: Phase E pre-existing Windows encoding bug

**Found**: When running the fresh-init scratch test, `init_prism.py` crashed with `UnicodeEncodeError: 'charmap' codec can't encode characters` after creating directories. The README.md heredoc contains box-drawing characters (`├──` `│` `└──`) and `path.write_text()` defaults to cp1252 on Windows Python 3.14. Pre-existing latent bug — not caused by Phase E edits, but the fresh-init success criterion can't pass until it's fixed.

**Resolution (in spirit of Phase E drift-cleanup)**: added `encoding="utf-8"` to all 4 `read_text`/`write_text`/`open(mode="a")` calls in `init_prism.py` (gitignore read+write+append, README write, CLAUDE.md write+read+append). Mirror copy re-synced. Fresh init test now completes cleanly: directories created, README written (1836 bytes), CLAUDE.md written (645 bytes), no crash.

