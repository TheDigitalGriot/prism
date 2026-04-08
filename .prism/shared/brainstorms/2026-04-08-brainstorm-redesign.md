# Brainstorm Decisions Ledger — Prism Brainstorm Redesign

**Date:** 2026-04-08
**Session:** `1051-1775635488`
**Topic:** Reshape how brainstorming feels inside Prism — griotwave aesthetic, fluid channels, fidelity progression, `.pen` pipeline terminus
**Status:** Complete — ready for `prism-design` phase
**Scope guardrail:** This brainstorm decided. It did not implement. No plugin files were modified during the session.

---

## §1 · Locked Decisions

### Q1 · Re-skin fidelity → **B · Hybrid (inlined + regen script)**

Port griotwave aesthetic into `frame-template.html` with CSS inlined for runtime (self-contained), but add `scripts/port-griotwave.cjs` that reads `griotwave-library/_master/griotwave.tokens.json` and regenerates only the CSS variables block. Stamp the griotwave version in a comment header. Run manually on sync.

- **Runtime deps:** none
- **Sync cost:** one command
- **Why:** self-contained at runtime + drift visibility + tiny script (~30 lines)

### Q2 · Fidelity progression → **B · Auto + manual override + final-hi rule**

Default behavior: Claude classifies every user message as `decide` (advance) or `clarify` (re-render current screen at next fidelity up). Plus three escape hatches:

1. Explicit commands `/hi` / `/mid` / `/lo` jump to any level
2. The **last** decision-confirm screen before the design doc is **always** hi-fi (ceremonial final render)
3. Fidelity **carries forward** across questions — if you escalated Q2 to mid, Q3 starts at mid (downshifting is explicit)

- **Why:** auto behavior matches intuition, override exists when needed, final hi-fi guarantees the ceremonial prototype, session *earns* polish as it goes

### Q3 · Channel mechanics → **B · Thin channel adapter (one-way)**

Add `scripts/brainstorm-channel.ts` (Bun) — small MCP channel server that declares `claude/channel` capability and listens on a local port. Browser click → POST to channel → `mcp.notification()` → Claude wakes. Everything else stays: existing WS server keeps serving HTML and broadcasting reloads, Claude keeps writing screen files. The channel is purely the "wake" signal, nothing more.

- **New file:** `scripts/brainstorm-channel.ts` (~60 lines)
- **Requires:** Claude Code ≥ v2.1.80 + `--dangerously-load-development-channels` flag
- **Kept in awareness circle:** Option C (full channel with two-way `push_screen` reply tool) — future refinement once the thin adapter is proven

### Q4 · Side drawer content model → **C · Decisions + parking lot (two panes)**

Drawer has two panes:

- **Top pane (decisions):** clean, scannable spine of every confirmed pick with Q → option mapping
- **Bottom pane (open threads / parked):** clarifying questions that branched off but were explicitly deferred. Each keeps a back-pointer to the question it came from

New verb: **"park this"** — either explicit from the user or detected from Claude classification. Parked items are *not* unanswered — they're deferred on purpose. The final design doc gains a real **"Deferred Concerns"** appendix (§2 below).

- **Trade-off accepted:** second classifier (inline vs park) on top of Q2's decide/clarify classifier — misfire risk exists
- **Watch for:** parking lot becoming a graveyard; long parking-lot is a session-health signal (over-scoped)

### Q5 · Cursor detection → **B · Extension trigger via `prism-vscode`**

The `prism-brainstorm` skill writes a tiny trigger file (`.prism/local/brainstorm/<session>/state/open-viewer`) containing the viewer URL. The `prism-vscode` extension watches that path via `fs.watch`, reads the URL, and calls `vscode.commands.executeCommand('simpleBrowser.show', url)`. Official VS Code API — works identically in Cursor and VS Code (both ship Simple Browser).

- **Graceful degradation:** without `prism-vscode` installed, degrades to "print URL and click it" (acceptable)
- **Why:** official stable API, no deeplink fragility, no env-sniffing, leans into the surface we already own

### Q6 · Pipeline terminus → **B · Handoff (with html-as-visual-reference twist)**

Brainstorm writes a decisions ledger (this file) + path reference to the final hi-fi HTML screen. `prism-design` reads the ledger and uses the hi-fi HTML as **visual reference** while laying out the `.pen` — *html guides the eye, md carries the meaning.* No HTML→pencil parser needed.

### Q6′ · Skill graph correction → **Brainstorm is UPSTREAM of Design (REQUIRED by default)**

**The critical structural correction.** The documented `prism-design/SKILL.md` said "design calls brainstorm as a sub-step." In practice, the user calls brainstorm first, then design. The graph was upside down. Corrected flow:

```
prism-brainstorm                      (decides — Q1..Q6)
      ↓ writes
.prism/shared/brainstorms/<date>.md   (decisions ledger handoff)
      ↓ reads
prism-design                          (architects — adds mermaid, contracts, interfaces)
      ↓ calls pencil MCP
.prism/shared/designs/<date>.pen      (manifests — the final artifact)
      ↓
prism-plan                            (downstream, existing)
```

- **Brainstorm is REQUIRED input** for `prism-design` by default
- **Config override available:** `prism-design.require_brainstorm: false` (in `.prism/shared/config.yaml` or `prism-design/SKILL.md` frontmatter) flips to OPTIONAL for future exploratory design runs
- **Dormant-but-tested:** the OPTIONAL code path should be built, just not the default

---

## §2 · Deferred Concerns (from Q4 · C parking lot)

These survived the brainstorm as first-class items. They are known, deferred, and should be revisited:

1. **griotwave v0.4 breaking changes**
   - Source: Q1
   - Concern: When griotwave v0.4 ships with breaking token changes, `port-griotwave.cjs` may need updates. No auto-detection of breaking changes exists.
   - Revisit: when griotwave v0.4 lands

2. **`/hi` mid-stream interaction with classifier**
   - Source: Q2
   - Concern: What happens if user types `/hi` mid-clarification? Does it apply to the *next* screen or the *current* escalated one? Classifier and command-override priority is unspecified.
   - Revisit: during Q2 implementation

3. **MCP `claude/channel` capability cutoff**
   - Source: Q3
   - Concern: Claude Code < v2.1.80 doesn't support `claude/channel`. What's the fallback UX for those users? Distribution concern for wider plugin audience.
   - Revisit: before any public release beyond personal use

---

## §3 · Reference Artifacts

- **Final hi-fi HTML screen (visual reference for `prism-design` / `.pen` layout):**
  `.prism/local/brainstorm/1051-1775635488/content/06-pipeline-terminus.html`
- **All brainstorm screens (for context):**
  `.prism/local/brainstorm/1051-1775635488/content/00..07-*.html`
- **Channel events log:**
  `.prism/local/brainstorm/1051-1775635488/state/events`
- **Griotwave source (aesthetic source of truth):**
  `griotwave-library/_master/griotwave-style-tile.html` + `griotwave.tokens.json` (external repo)

---

## §4 · Implementation Handoff Notes

**This file is the handoff to `prism-design`.** When the next session runs `/prism-design` against this ledger, it should:

1. Read all `§1` decisions and preserve them verbatim in the design doc's "Chosen Approach" section
2. Carry `§2` Deferred Concerns forward as a first-class appendix in the design doc
3. Use `§3` reference HTML as visual-layout reference (not parsed structurally) for the `.pen` file
4. Generate architecture diagrams (mermaid) for the runtime topology: channel-server ↔ viewer ↔ extension ↔ pencil-mcp
5. Generate interface contracts for: `POST /channel` payload, `state/open-viewer` trigger payload, `simpleBrowser.show` usage
6. Call `pencil.batch_design` to materialize the final `.pen` at `.prism/shared/designs/2026-04-08-brainstorm-redesign.pen`

**Planned implementation phases** (for eventual `/prism-plan`):

- **Phase A** — Foundation: `brainstorm-channel.ts` + `prism-vscode` extension trigger handler (Q3 + Q5)
- **Phase B** — Visual: griotwave re-skin of `frame-template.html` + `port-griotwave.cjs` regen script + fidelity engine (Q1 + Q2)
- **Phase C** — Drawer: two-pane decisions + parking-lot UI in the viewer (Q4)
- **Phase D** — Pipeline: `prism-design/SKILL.md` rewrite to reflect corrected skill graph + `.pen` manifest step (Q6 + Q6′)
- **Phase E** — Infrastructure: register the new `.prism/shared/brainstorms/` directory across init + docs (Q6′ infrastructure tail)

**Phase E must-touch files** (caught during the brainstorm close-out, 2026-04-08):

1. `skills/prism/scripts/init_prism.py` (lines ~24-35) — add `.prism/shared/brainstorms` to the `dirs` list so fresh projects get the directory
2. `skills/prism/scripts/init_prism.py` (lines ~80-90) — update the README heredoc tree diagram
3. `skills/prism/scripts/init_prism.py` (lines ~165-172) — update the CLI output tree print statements
4. `skills/prism-init/SKILL.md` (line 3) — description string currently lists "research, plans, validation, designs, assets" — add brainstorms
5. `skills/prism-init/SKILL.md` (lines ~35-42) — directory tree comment block
6. `CLAUDE.md` (root) — `.prism/ Directory Structure` block currently doesn't list `brainstorms/`
7. Any project-memory files referencing the `.prism/shared/` layout (e.g. `memory/architecture.md`)

Why these are Phase E and not Phase D: these are the infrastructure ripples from introducing a new `.prism/shared/` category. They should land *with* the skill-graph correction (Phase D) so that fresh installs are consistent, but they touch init-side files, not brainstorm/design runtime, so they deserve their own phase for clean commits.

No code was written in the brainstorm session. All implementation begins with a fresh `/prism-research` → `/prism-plan` → `/prism-implement` cycle using this ledger as the primary input.
