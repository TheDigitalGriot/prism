# Stage Contract - the brainstorm frame gains a workflow REGISTRY + overlay layer

Status: FIRED by the Cowork session, 2026-09-15, at Gavin's instruction.
Route device-side headless (claude.exe -p) as an ICM stage-walk, cwd = GriotApps\Prism.

## Why this stage exists

Gavin's plane now hosts three workflows at once - brainstorm decisions, the branch workgraph,
and the gavel ceremony - and they were composed by IFRAMING whole applications side by side.
That does not scale: three headers, three nav rows, three scroll contexts before a single node
is visible, and the same graph rendered twice at two fidelities.

N10 already ruled the shape: "The brainstorm companion's panels are decision states. The
capture's lanes are branch states. Same substrate, two verbs." A workflow must be able to
REGISTER a surface into a zone the frame already owns, instead of arriving as its own app.

This stage builds the registry and the overlay layer. It does NOT extract the swimlane
primitive - that is Q2 and Gavin has not ruled it yet. Do not pre-empt it.

## Inputs

WORKING (cwd - edit here, ADD IN PLACE ONLY):
- `skills\prism-brainstorm\scripts\frame-template.html` (60,484 b baseline - MEASURE IT FIRST)
- `skills\prism-brainstorm\scripts\helper.js` (51,074 b - the client runtime)
- `skills\prism-brainstorm\references\` - add a `panel-system.md` documenting what you built

REFERENCE (read, never write):
- `skills\prism-brainstorm\scripts\server.cjs` - how the template is wrapped (griotRender,
  injectMeta) and the routes that exist: `/`, `/state/decisions.json`,
  `/state/workgraph.json`, `/files/<name>`
- `skills\prism-brainstorm\references\griotwave.md` - tokens
- `skills\prism-brainstorm\references\fidelity-engine.md` - the --fidelity-* cascade
- `skills\prism-brainstorm\references\workgraph-state.md` + `drawer-state.md` - the two channels
- `skills\prism-gavel\scripts\frame.html` - a second workflow that must be registerable

## The shape - LOCKED, do not redesign it

FOUR PERMANENT ZONES. These already exist in the frame. Do not move, rename or restyle them:
  - left rail      (`.grail` + `.grail-views` / `.grail-filters` / `.grail-toggle`) - the workgraph
  - centre stage   (the screen the server serves)
  - right drawer   (`.drawer` + `.pane` / `.pane-header` / `.pane-body`) - decisions, parked
  - agent bar      (`.arail` / `.ag-log` / `.ag-msg` / `.ag-input`) - the wake channel

FOUR TRANSIENTS. These are NEW and additive:
  - slide-over : full height, covers the stage, dismissible. For a whole workflow surface.
  - sheet      : bottom-anchored, for running a ceremony without leaving the stage.
  - inspector  : docked right, node detail on click. Coexists with the drawer, never replaces it.
  - palette    : keyboard-invoked list of every registered workflow.

THE REGISTRY. A declarative map, defined once in the template and read by helper.js:
  - each entry: `id`, `label`, `zones` (the ARRAY of zones/transients it can legally occupy),
    `defaultZone`, `minWidth` (below which it must not be squeezed), `channel` (which state file
    feeds it), `vocabulary` (which state names its lanes use), `icon`, `shortcut`.
  - registering a workflow must NOT require editing the frame's layout - that is the whole point.
  - the gavel and the branch workgraph must both be expressible as entries. Prove it by writing
    their entries, even if nothing mounts them yet.

## FLUIDITY - the anti-sardine contract (Gavin, verbatim intent)

Gavin: "I'm trying to add the new drawers and overlays for gavel and for the branch node
workgraph and cards WITHOUT SQUISHING SARDINES, and having it be fluid and interchangeable."
These are requirements, not preferences. A layout that crams is a failed layout.

- **NO FIXED PIXEL SLOTS.** Zones size from content and container with CSS grid `fr` units and
  `clamp()`. No hard-coded panel widths or heights anywhere.
- **AN EMPTY ZONE COLLAPSES TO ZERO.** It never reserves space for something that is not there.
- **TWO WORKFLOWS IN ONE ZONE BECOME TABS, NEVER TWO HALF-HEIGHT BOXES.** Splitting a zone to
  fit a second occupant IS the sardine failure. Tab them.
- **THE PROMOTION RULE.** If a zone would render a workflow below its declared `minWidth`, the
  frame PROMOTES that workflow to a slide-over instead of squeezing it. Nothing is ever
  rendered below its own legible minimum. This rule is the heart of this stage.
- **INTERCHANGEABLE AT RUNTIME.** Any workflow can be moved to any zone listed in its `zones`
  array, from the palette, without a reload and without editing layout. Adjacent zones carry a
  drag handle; the split persists for the session.
- **MOTION IS GRIOTWAVE.** Every move, promote, tab-switch and dismiss animates on the motion
  tokens - `tale` 220ms for UI, `song` 320ms for scene shifts, spring 50/22. Nothing snaps.
- **IT LIVES IN THE TEMPLATE, NOT IN A SESSION SCREEN.** A screen written to a session
  `content/` directory is disposable and vanishes on the next render - that brittleness is
  exactly what this stage exists to end. Everything built here goes into frame-template.html
  and helper.js so it survives every session, every restart, every new workflow.
## Locked Decisions

- ADD IN PLACE. This is Gavin's crafted template and it is his window to his own work. Never
  strip, rewrite, reorder or "tidy" anything that exists. Every current class, id, selector,
  CSS variable and behaviour must still be present and behave identically afterwards.
- MEASURE FIRST, PROVE AFTER. Record the baseline byte count and the full list of CSS class
  selectors before editing. After editing, prove every baseline selector still exists.
- No new runtime dependencies. No CDN. Vanilla CSS + JS, matching what is already there.
- Everything new reads the `--fidelity-*` variables rather than hard-coding blur, bloom,
  rim, radius or border-style. Griotwave tokens only - void/neural/bio/violet/solar/beacon
  and the voice/echo/whisper/footstep/ghost text ladder.
- Do NOT touch the griotwave marker block that `port-griotwave.cjs` rewrites.
- Do NOT change the channel meta tag names (`brainstorm-channel-port`,
  `brainstorm-session-id`) - server.cjs calls them a port CONTRACT.
- Do NOT extract the swimlane primitive. Q2 is unruled. Registry + overlays only.
- Transients must degrade: with JS disabled or a channel missing, the frame renders exactly as
  it does today. An empty panel at session start is a defect (Decision 7) - a registered
  workflow with no data shows a named empty state, never a blank box.
- Plugin/skill work routes through griot-agent-architect and RUNS its bundled validators.
- DO NOT COMMIT. Leave everything uncommitted for Gavin's review.
- Daemon is NOT a prerequisite. :6767/:6780 are mobile/remote only.

## Process (ICM stage-walk)

1. BASELINE - measure frame-template.html and helper.js. Extract the complete list of CSS
   selectors and JS entry points. Write it to `.prism/local/frame-baseline.txt`. This is the
   proof artifact for "nothing was lost". HEARTBEAT: STEP1_BASELINE
2. GROUND - read how server.cjs wraps the template, how helper.js hydrates from the two state
   channels, and how the gavel frame differs. Name the seams. HEARTBEAT: STEP2_GROUND
3. REGISTRY - add the registry to the template and teach helper.js to read it. Include real
   entries for brainstorm-decisions, branch-workgraph and gavel-ceremony.
   HEARTBEAT: STEP3_REGISTRY
4. TRANSIENTS - add the four overlays: slide-over, sheet, inspector, palette. Fidelity-aware,
   dismissible, keyboard-reachable, focus-trapped, and each with a named empty state.
   HEARTBEAT: STEP4_TRANSIENTS
5. WIRE - the palette lists registered workflows and invoking one mounts it into its declared
   zone or transient. No layout edit required to add a fourth workflow - prove that by adding a
   fourth entry and showing it appears with no further change. HEARTBEAT: STEP5_WIRE
6. VALIDATE - every baseline selector still present (diff against step 1's artifact); the file
   only grew; the companion still serves and renders an existing screen unchanged; run the
   griot-agent-architect validators. HEARTBEAT: STEP6_VALIDATE
7. DOCUMENT + REPORT - write `references/panel-system.md`. Report what was added, the baseline
   proof, and exactly how a new workflow registers in one entry. HEARTBEAT: DONE_PANEL_SYSTEM

## Success criteria

- Every CSS selector and JS entry point present at baseline is still present - proven by diff
  against the step 1 artifact, not asserted.
- frame-template.html grew; nothing was removed.
- A fourth workflow can be registered by adding ONE registry entry, with no layout edit.
  Demonstrated, not claimed.
- All four transients exist, are fidelity-aware, dismissible and keyboard-reachable, and each
  shows a named empty state rather than a blank box.
- An existing screen still renders identically through the companion.
- griot-agent-architect validators pass. Nothing committed.

## Heartbeat tokens

Write to `C:\Users\digit\GriotApps\Prism\.prism\local\panel-system-progress.txt`:
STEP1_BASELINE - STEP2_GROUND - STEP3_REGISTRY - STEP4_TRANSIENTS - STEP5_WIRE - STEP6_VALIDATE - DONE_PANEL_SYSTEM