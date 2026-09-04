# Griot Working Architecture — Brainstorm Decisions Ledger

**Date:** 2026-09-04
**Status:** Complete — decisions locked, carrier edits shipped
**Scope guardrail:** This brainstorm decided *and* shipped the three carrier edits + the assert
facade (Q4 = Option B, chosen deliberately: "half steps is what got us here").

---

## §1 · Locked Decisions

### Q1 · Where the name "Spectrum" lands → **Spectrum = Griot's implementation of ICM**
ICM names the protocol; Spectrum names the Griot implementation across CLI, desktop and other
surfaces. Interchangeable in speech — contract vs implementation, like POSIX/Linux. Spectrum is
re-founded on the ICM stage-walk rather than the Ralph loop.

### Q2 · How Griot reaches capability across ~24 tools → **facade + laddered backends**
MCP servers are siblings and cannot call each other, so a proxy is impossible. The spine owns
**one verb**; the backend resolves by surface: direct MCP → device bridge → cli → record
UNVERIFIED. Same shape as the existing `drive.cjs` ladder.

### Q3 · Brainstorm companion navigation → **multi-state left rail**
Two collapsible panes: the decision graph (collapses to a thin spine, no labels) and the
agent/multi-state box (collapses to a tab, identical chrome to the drawer). Mode controls sit at
the bottom, inside the thumb arc. The right-hand decision drawer is **collapsed by default**. All
rails are drag-resizable.

### Q3.4 · Decision notation → **spine + typed badges, NOT git lanes**
Researched against primary sources. Three independent channels, never overloaded:
**border-style = state** (QOC) · **badge = origin/direction** (Compendium transclusion) ·
**indent = splinter**. Git lanes rejected: no glyph for foreign origin, wrong semantics
(parallel timelines vs one ordered spine), unbounded width in a fixed rail.
Five lane states: parked · resolved · inbound · adjacent · outbound.
`source`/`destination` are **plural** — a tangent can be owed to more than one project.

### Q4 · How far to turn the carrier edits → **B · full build**
All three edits shipped *and* the assert facade built, against an ICM stage contract with the
three conditions as success criteria.

### D·layers · Files / Skills / MCP each keep their own job → **write-through**
**MCP acts. Files remember. Skills say how.** Every MCP result must write through to a file or it
is gone at compaction. If a file and a tool response disagree, **the file wins**.

### D·assert · The assertion primitive is **MCP, not a CLI**
Every proof this session ran through chrome-devtools `evaluate_script`. MCP works on both Claude
Code and Cowork; Bash, hooks and `bin/` do not. This is the way past the Cowork border that had
been patched with memory for months.

### D·slices · Sliced source artifacts join the system
Carve excerpts of large files to disk and work from the slice. Derived artifacts — regenerate
freely, never hand-edit, never treat as truth.

### D·method · STANDING — how UI decisions get presented
Every UI decision is shown as a **wireframe**, never described in prose. When a decision is both
architecture and UI — which it usually is — **show both views**.

### D·visible-first · STANDING — the screen ships before the question is spoken
Order is **write screen → update state → speak**. Never announce a question the browser is not
showing. (Earned twice: the A/B/C letters, then Q4 while Q3.4 was on screen. Second cause was
mechanical — screens are served newest-by-mtime and a bulk copy flattened the timestamps.)

### D·nomenclature · **Workgraph** / **worklanes**
The view/tab is a **Workgraph**, composed of **worklanes**. Applies to Prism surfaces and the DGS
Definitive Planning artifact tab. Proper names (*DGS Definitive Planning artifact*,
`dgs-plan-update`) stay verbatim; general descriptors say **Griot suite** or **Digital Griot
Studio**; the methodology is **ICM/Spectrum** — no third name.

### D·stance · ICM is the truth; the Griot suite is framework-adjacent
The test is not *"may we build a server?"* but **"does this infrastructure preserve
glass-box-ness?"** Write-through and mechanical branching are the guard.

---

## §2 · Deferred Concerns (parking lot)

1. **Workgraph — Griot-wide decision layer** → outbound to **prism** + **dgs-plan**
   Full design captured: `.prism/shared/designs/2026-09-04-griot-decision-layer-worklanes.md`
2. **Legacy Spectrum surfaces — stories + Ralph loops** — adjacent, lives in 2 maps
3. **prism-viz-engine — revise + lock the diagramming/viz cluster** → outbound
4. **assert-mode vs act-as-you browser modes** → outbound to **cinopsis**
   chrome-devtools runs `--headless --isolated` (logged-out); the Cinopsis frame-capture fix needs
   the logged-in profile.
5. **`D·` standing decisions placement** — inline on the spine, separate group, or own lane?
   *Unanswered.*
6. **4px drift** on rail width restore after collapse/expand. Cosmetic.

---

## §3 · Reference Artifacts

**Visual companion session:** `.prism/local/brainstorm/10345-1788516698/`
**Final hi-fi screen:** `.prism/local/brainstorm/10345-1788516698/content/17-icm-fit.html`
**Decisions state:** `.prism/local/brainstorm/10345-1788516698/state/decisions.json`
**Research:** `.prism/shared/research/2026-09-04-decision-graph-notation.md`
**Design:** `.prism/shared/designs/2026-09-04-griot-decision-layer-worklanes.md`
**Stage contract:** `.prism/shared/plans/2026-09-04-assert-facade-CONTEXT.md`
**Heartbeat:** `.prism/local/assert-facade-progress.txt`

---

## §4 · What shipped in this session

**Prism (source, 4.13.2 — uncommitted at time of writing):**
- `scripts/digital-griot-mcp/digital-griot-mcp.ts` — **`griot_assert`**: one verb, two phases
  (resolve → record), mechanical rung ladder, mandatory write-through, never fakes a pass.
- `skills/prism-brainstorm/scripts/` — multi-state rail, decision spine on the researched
  notation, click-to-navigate, drag-resize, companion agent wired to the local `claude` CLI.
- `skills/prism-research/SKILL.md` — reading rule **inverted**; research output contract added
  (write-through + verdict contract).
- `commands/create_plan.md`, `commands/research_codebase.md` — reading rule inverted.
- `skills/icm-architect/references/prism-run-contract.md` — slices convention; heartbeat
  unscoped from ICM-only runs.

**Cinopsis:** the griotwave companion redesign (commits `a812c78`, `da21cd2`) — built, reviewed,
verified, **not yet released**.
