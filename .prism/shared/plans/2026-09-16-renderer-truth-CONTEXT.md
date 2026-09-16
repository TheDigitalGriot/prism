# Stage Contract - the renderer tells the truth: per-shape canvas, per-shape fidelity, chapter rail

Status: FIRED 2026-09-16 at Gavin's instruction. cwd = C:\Users\digit\GriotApps\Prism
Route as an ICM stage-walk. This closes B7, the fidelity half of B17, and launches A4.

## Why this stage exists - measured, not inferred

Gavin asked for a UI design at hi fidelity and got back a re-skinned copy of the archify
diagram. The cause is in the engine's own comment:

- `apps/prism-viz-engine/scripts/emit-screen.mjs:307` - "Renderer 1/3 - shell. **Same lane-band
  shape as the full-document path**". `--renderer shell` has never emitted UI chrome. It emits
  the lane diagram under a different flag. This is B7 verbatim: "the right canvas PER SHAPE;
  engine always emits lanes."
- `src/layers/04-shell/Shell.tsx` exists at 13,207 b and the emitter NEVER reaches it.
- `fidelity` has ZERO occurrences anywhere under `apps/prism-viz-engine/src`. It lives only in
  the brainstorm companion's CSS cascade, so lo/mid/hi can only re-skin what was already drawn.
  This is B17's "fidelity is verified but unused outside the companion".
- A4 (griot-viz-engine-rail) carries: rename prism-viz-engine -> griot-viz-engine, chapter rail,
  click-to-source. Its contract is written and was never launched. Find it with prism-locator.

## Locked Decisions

- ROUTE THROUGH griot-agent-architect and RUN ITS BUNDLED VALIDATORS. Never hand-eyeball.
- A WIREFRAME NAV AND A GLASS NAV ARE DIFFERENT DRAWINGS, NOT THE SAME DRAWING AT DIFFERENT
  OPACITY. Fidelity must change WHAT is drawn, not just how it is tinted.
- PER-SHAPE CANVAS: `--renderer shell` emits UI chrome sourced from the real Shell component.
  `--renderer nodegraph` emits the lane/node graph. `--renderer isometric` emits the spatial
  view. They must be STRUCTURALLY DIFFERENT DOCUMENTS - proven by diff, never by eye.
- PER-SHAPE FIDELITY, inside the engine, honouring the fidelity-engine canon
  (`skills/prism-brainstorm/references/fidelity-engine.md` - lo blur 0 / rim .07 / dashed,
  mid blur 8 / bloom .26, hi blur 40 / bloom .55):
    shell     lo = wireframe chrome, no glass   -> mid = solid structure -> hi = full griotwave
    nodegraph lo = nodes only, no labels/edges  -> mid = labels          -> hi = labels + edges + embers
    isometric lo = flat boxes                   -> mid = depth           -> hi = full render
- ADD IN PLACE. Never strip or restructure Gavin's existing code. The existing document path
  and the companion target must behave byte-identically afterwards - prove it.
- Publish is Gavin's, never the agent's (A4's own words).
- DO NOT COMMIT. Daemon is NOT a prerequisite.

## Process

1. LOAD - prism-locator for the A4 contract; codebase-analyzer over emit-screen.mjs and
   Shell.tsx. Record the exact current behaviour at file:line. HEARTBEAT: STEP1_LOAD
2. A4 - launch the written A4 contract: rename to griot-viz-engine, chapter rail, click-to-source.
   HEARTBEAT: STEP2_A4
3. SHAPES - make shell reach Shell.tsx and emit real UI chrome; keep nodegraph and isometric on
   their own layout math. HEARTBEAT: STEP3_SHAPES
4. FIDELITY - implement per-shape fidelity in the engine per the table above.
   HEARTBEAT: STEP4_FIDELITY
5. PROVE - emit SIX artifacts into `.prism/local/shape-proof/`:
   shell-lo.html shell-mid.html shell-hi.html nodegraph-lo.html nodegraph-mid.html nodegraph-hi.html
   Assert: no two of the six are structurally identical (compare element counts + tag
   sequences, not bytes). Assert shell-* contain UI chrome selectors and nodegraph-* do not.
   If any two match, the run FAILED - say so loudly, do not paper over it.
   HEARTBEAT: STEP5_PROVE
6. VALIDATE - griot-agent-architect validators; existing document + companion paths unchanged.
   HEARTBEAT: STEP6_VALIDATE
7. REPORT - what changed at file:line, the six-artifact proof table, what is left.
   HEARTBEAT: DONE_RENDERER_TRUTH

## Success criteria
- Six artifacts exist and no two are structurally identical - proven by the comparison, not asserted.
- shell output contains UI chrome and does NOT contain lane-band markup.
- fidelity appears in the engine source and changes structure per shape.
- The existing document path and companion target are unchanged - proven.
- Validators pass. Nothing committed.

## Heartbeat
`C:\Users\digit\GriotApps\Prism\.prism\local\renderer-truth-progress.txt`
STEP1_LOAD STEP2_A4 STEP3_SHAPES STEP4_FIDELITY STEP5_PROVE STEP6_VALIDATE DONE_RENDERER_TRUTH