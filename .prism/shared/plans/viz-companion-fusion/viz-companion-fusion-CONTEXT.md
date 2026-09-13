# Stage contract - viz-companion-fusion

Inbound (awaits): apps/prism-viz-engine (published 0.1.0), skills/prism-brainstorm/scripts/server.cjs,
skills/prism-brainstorm/scripts/helper.js, skills/prism-brainstorm/scripts/frame-template.html,
skills/prism-brainstorm/references/griotwave.md, references/fidelity-engine.md,
.prism/shared/workgraph/uxui-canvas-nodes.json, .prism/shared/workgraph/index.json

## Why this stage exists

prism-viz-engine is built, published and unused. Its screens reach the brainstorm companion as
standalone documents the companion merely serves, so the frame is never applied and the engine's
own renderers are never selected. Separately the companion's WORKGRAPH panel is empty and
structurally cannot fill: server.cjs watches STATE_DIR and returns early on any filename that is
not decisions.json, so no node graph can reach the panel. These are one problem with two halves
and they land together or the panel stays empty whatever the engine emits.

Root cause, verified in source, not inferred:
  - emit-screen.mjs:115 builds `const html = \`<!doctype html> ...\`` - a FULL DOCUMENT.
  - server.cjs serves anything starting with <!DOCTYPE as-is, bypassing frame-template.html.
  - server.cjs:381-382 `fs.watch(STATE_DIR, ...)` then `if (filename !== 'decisions.json') return`.
  - helper.js:202-209 builds BOTH panels from that one file. LAYERS buckets state
    (done/superseded/parked/open); WORKGRAPH buckets direction, derived per decision from
    `destination` -> outbound, `source` -> inbound, `maps > 1` -> adjacent, else `local`.
    There is no `local` lane, so a flat decision is invisible in WORKGRAPH by design.

## Decisions (locked)

1. NO SCREEN REACHES THE COMPANION UNLESS THE ENGINE EMITTED IT. Hand-authored HTML, an ASCII
   diagram, or a mermaid fence pushed into a session content dir is a REFUSAL TO USE THE ENGINE,
   per Gavin's CLAUDE.md diagram quality bar - not a fallback. Gavin removed the ASCII block from
   the template deliberately; it must not return by hand. If the engine cannot emit a needed
   screen shape, that is a gap to close IN THE ENGINE.
2. BOTH HALVES LAND IN THIS RUN. The emitter without the state channel leaves the panel empty;
   the channel without the emitter leaves the canvas outside the frame. Ruled by Gavin 2026-09-13.
3. TAXONOMY IS ELEVEN layer roles from src/core/layer-roles.ts. Never nine. Never a twelfth.
   A finding that fits no role is `unplaceable`. Never invent a node; never fill an unfilled layer.
4. NON-BREAKING. The published 0.1.0 surface, the existing --self and --in paths, and the current
   static shell render all keep working unchanged. The companion target is ADDITIVE.
5. STRUCTURE ROUTES THROUGH THE ARCHITECT. This is Prism plugin work, so /prism:griot-agent-architect
   governs structure and its bundled validator is the gate. Never hand-eyeball plugin structure.
   Run device-side headless in the repo.
6. GRIOTWAVE IS THE REGISTER. Tokens from references/griotwave.md; fidelity values from
   references/fidelity-engine.md (lo blur 0 / bloom 0 / rim .07 / radius 6 / dashed;
   mid blur 8 / bloom .26 / rim .09 / radius 14 / solid; hi blur 40 / bloom .55 / rim .13 /
   radius 20 / solid). The engine's private --void/--mint palette does not belong in a companion
   screen. frame-template.html is authoritative for component classes - read it before emitting.

## Process

Step 1 - ARCHITECT. Run /prism:griot-agent-architect over apps/prism-viz-engine and the
  prism-brainstorm scripts. Establish where a new render target belongs behind
  src/layers/02-render/route.ts and how src/core/mount.ts is already the embed seam.

Step 2 - COMPANION EMIT TARGET (engine half). Add a companion/fragment target to the engine:
  emits a FRAGMENT (no doctype, no html/head/body) so server.cjs auto-wraps it in the frame;
  griotwave tokens only; `data-fidelity` on the fragment root so lo/mid/hi cascade into the
  canvas subtree; `data-choice` on every node so a click lands in state/events; lanes and nodes
  expressed in frame-template.html component classes. Renderer selectable - shell, isometric
  (vendor/fossflow), xyflow - not hardcoded to the static shell.

Step 3 - STATE CHANNEL (companion half). Widen server.cjs beyond the decisions.json-only watch so
  a node-graph state file is watched, broadcast, and served over a GET route alongside
  /state/decisions.json. Keep decisions.json working exactly as today.

Step 4 - PANEL. Make helper.js render the WORKGRAPH panel from the graph channel so the harvested
  nodes populate the rail, with decisions remaining their own view. Two views, one frame.

Step 5 - VALIDATE. Run the architect's bundled validator. Then prove it end to end: emit the 27
  harvested nodes through the companion target into a live brainstorm session and confirm, in the
  browser, that the frame is applied, the drawer is present, the WORKGRAPH rail is non-zero, the
  fidelity attribute changes the canvas treatment, and clicking a node appends to state/events.

Step 6 - COMMIT. Engine change, server/helper change, validator output.

## Success criteria

- The harvested canvas renders INSIDE the brainstorm frame, not as a served standalone document.
- The WORKGRAPH panel is non-zero from the harvested graph.
- lo / mid / hi visibly change the canvas, driven by data-fidelity, not by a rewrite.
- A node click appends an event to state/events.
- decisions.json behaviour and the published 0.1.0 surface are unchanged.
- The architect validator passes. No hand-authored HTML was written into any content dir.

## Heartbeat tokens

STEP 1 architect - STEP 2 emitter - STEP 3 channel - STEP 4 panel - STEP 5 validate - STEP 6 commit - DONE

## Also pull in this run

The Stage 0 contract at .prism/shared/plans/djeli-stage0-code-intel/djeli-stage0-code-intel-CONTEXT.md
carries a FALSE defect: its Step 2 calls emit-screen.mjs:93 a wire-format seam. It is not a seam -
--self is the correct path for the harvested array and --in expects an already-wrapped canvas.
Correct that step in place. Do not rewrite the surrounding contract.

## Decision 7 (locked, added 2026-09-13 by Gavin mid-run)

THE PANELS ARE NEVER EMPTY. LAYERS and TIMELINE must both carry something from the FIRST moment of
a session, not from the first decision. An empty panel at session start is a defect, not a neutral
initial state. The seed is foundational even when it is only the first ideation step: the session
genesis, the inbound context the contract names, the opening question. From there the panels GROW
ORGANICALLY and EVOLVE as the session runs - accretion, never a one-shot fill and never a rebuild.
TIMELINE in particular is a time axis: it starts at session genesis and gains entries as screens
are emitted, decisions ruled, and nodes touched.

Consequences for the process above:
  - Step 3 (state channel) must define a SEED written at session start, so the panels have content
    before any decision exists. Seeding happens in the session-start path, not as a screen-time
    afterthought.
  - Step 4 (panel) must render TIMELINE as well as WORKGRAPH and LAYERS - all three from the
    channel(s), none of them left to a later pass.
  - Step 5 (validate) must additionally prove: on a FRESH session with zero decisions, LAYERS and
    TIMELINE are both non-empty, and both gain entries as the session progresses.
  - An entry that arrives later must APPEND to the timeline rather than replace it; superseding is
    recorded, not erased (the existing supersededBy discipline in helper.js is the precedent).

## Decision 8 (locked, added 2026-09-13 by Gavin mid-run) - THIS BECOMES A DJELI WORKFLOW TAB

What this stage builds is not session-scoped tooling. The fused surface - engine-emitted canvas
inside the frame, with LAYERS / TIMELINE / WORKGRAPH panels seeded at genesis and growing - is a
FOUNDATIONAL element of Djeli and will ship as its own workflow tab, peer to the Prism (code),
Lucid, R3F Studio, Cinopsis, Kente, Synaptiq and Mixar tabs.

Consequences to hold even though they land after this run:
  - TAB-SHAPED, NOT SESSION-SHAPED. The surface must be hostable inside another shell, not only
    served by server.cjs on a session port. src/core/mount.ts is therefore first-class, not a
    companion-only detail - it is the seam Djeli mounts through.
  - The panels must survive being embedded: no assumption that the frame owns the whole viewport.
  - The state channel must be addressable by a host that is not the brainstorm server, since in
    Djeli the host is the Djeli shell.
  - Do NOT build the tab in this run. This decision exists so Step 2 and Step 3 are not built in a
    way that forecloses it. Nothing here authorises scope beyond the contract's six steps.
