# STAGE CONTRACT - prism-brainstorm ecosystem /design (2026-09-23)

Gavin's ask, unchanged: design the prism-brainstorm ecosystem UX, LIVE in the companion
template, rendering and reloading in his browser as we go.

## Inputs

- Repo: `C:\Users\digit\GriotApps\Prism` (cwd)
- Companion ALREADY RUNNING: session `C:\Users\digit\GriotApps\Prism\.prism\local\brainstorm\7354-1790199040`,
  port **51900**, open in his browser. Do NOT start a second server. Reuse this session.
- The skill: `skills/prism-brainstorm/` - SKILL.md, `visual-companion.md`,
  `references/fidelity-engine.md`, `references/griotwave.md`, `references/drawer-state.md`
- Push screens with `scripts/render-screen.sh <session-dir> <screen-file> [question-id]` - it
  writes the screen and advances state as ONE action and asserts the result. Use it every time.

## Locked decisions

1. Render through the skill's OWN system: frame-template component vocabulary
   (`.diagram`/`.arc`/`.seq-box`, `.options`/`.option[data-choice]`/`.selected`, `.split`,
   `.cards`, `.tool-card`, `.meta`/`.cell`/`.k`/`.v`, `.mea`, `.caveats`,
   `.tag.blue|green|amber|volt`, `.eyebrow`/`.lede`/`.mockup`) + `data-fidelity` on every
   fragment root. NO ad-hoc inline-styled HTML. This is the documented drift
   ("the gold entry was hand-written into the render instead of appended through the engine").
2. Visual-first. If more than ~1/3 of a screen is sentences, redraw it as diagram/boxes/cards
   before pushing.
3. Drawer state is `state/decisions.json` - read-merge-write, never overwrite.
4. Mobile boards ship in the same pass as desktop (Gavin's standing rule).
5. Motion is a primary channel, not polish. B21: one rAF loop, every part lerping to target
   at ~8% a frame.

## The open question set (already on the board)

- **Q-FORK** (open): where SPATIAL goes on the qrail-graph rail.
  MEASURED GROUND TRUTH - do not re-derive:
  - The rail has **TWO** chips, not three: `layers` (default) + `time`, at
    `frame-template.html:1488-1489`; `viewMode()` at `helper.js:453-479` is a hard binary.
  - Inside `layers`, `renderGraph()` (`helper.js:328-450`) co-renders **STATES + RELATIONS**
    split by `wirePanelSplit()` (`helper.js:485+`).
  - `helper.js:196-208`: state and direction are **ORTHOGONAL axes**.
  - The griot-ontology SOT adds: *"Bucketing on direction first is the documented defect that
    rendered 'Parked 0' while five parked items existed."* That is paid-for evidence bearing
    on whether to split the axes in the UI - put it in front of him.
  - Options: **A** third chip · **B** split `layers` into LAYERS + RELATIONS then spatial as a
    fourth peer · **C** both, as a density toggle.
- **Q-LOCK** (open): an individual decision-lock UI on the screen. Selectah locks MANY at once;
  brainstorm locks ONE at a time and the rail advances. Plus the know-more / more-information
  collapse on EVERY option, not just the recommended one.
- Parked: the drawer/rail seam; whether brainstorm is a phone surface at all.

## Process

1. Read `visual-companion.md`, `references/fidelity-engine.md`, `references/griotwave.md`, and
   the frame-template component vocabulary. Emit `HB_1_VOCAB`.
2. Render **Q-FORK** through the skill's system at the classifier-correct fidelity, visual-first,
   with both options DRAWN side by side and the ontology's direction-bucketing defect shown as
   evidence. Push with `render-screen.sh`. Emit `HB_2_FORK`.
3. Render **Q-LOCK** - the individual-lock pattern and the know-more collapse, as a real
   interactive mockup using `.option[data-choice]` + `.selected` so his click reaches the agent
   through the existing wiring, not a hand-rolled fetch. Desktop AND mobile. Emit `HB_3_LOCK`.
4. Write the decision ledger to `.prism/shared/brainstorms/2026-09-23-prism-brainstorm-design.md`
   in the skill's own ledger format. Emit `HB_4_LEDGER`.
5. Leave the server RUNNING (Gavin is watching it). Do not run the exit ceremony.
   Write `.prism/shared/plans/brainstorm-design-REPORT.md`. Emit `HB_5_REPORT`, then
   `DONE_BRAINSTORM_DESIGN`.

## Success criteria

- Every pushed screen uses frame-template classes and carries `data-fidelity`. Zero ad-hoc inline-styled fragments.
- Every screen pushed via `render-screen.sh`, which printed ok.
- Both fork options drawn, not described.
- Mobile board shipped alongside desktop.
- The companion on 51900 still serving when the run ends.

## Heartbeats -> `.prism/brainstorm-design-progress.txt`
`HB_1_VOCAB` `HB_2_FORK` `HB_3_LOCK` `HB_4_LEDGER` `HB_5_REPORT` then `DONE_BRAINSTORM_DESIGN`
