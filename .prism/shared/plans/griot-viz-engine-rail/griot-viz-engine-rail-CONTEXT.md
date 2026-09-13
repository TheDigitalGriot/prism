# Stage contract - griot-viz-engine-rail

Inbound (awaits): apps/prism-viz-engine (published prism-viz-engine@0.1.0),
scripts/emit-screen.mjs (companion target, commit 56b8c05), src/core/layer-roles.ts,
src/layers/02-render/route.ts, .prism/shared/workgraph/uxui-canvas-nodes.json,
vendor/archify/references/viewer-runtime.md, vendor/archify/references/authoring-contract.md,
vendor/archify/recipes/scenarios.mjs, .prism/shared/plans/viz-companion-fusion/

## Why this stage exists

The engine's own thesis (artifact "prism-viz-engine - the assembled cluster") specifies four things
the build does not yet do: draw FROM substrate, render on the right canvas PER SHAPE, ship
INTERACTIVE and SOURCE-WIRED surfaces in the Waku mold, and explicitly "not static SVGs". The
current companion target emits a static lane chart. This stage closes the two layer-04 primitives
that are authorable from data already on disk, and takes the name.

Both primitives need NO new substrate and NO new renderer:
  - Every harvested node already carries data.origin.file + line. `validate` reports 27/27.
    waku-agent's premise - "every box is a real module file that opens" - is therefore wireable now.
  - Every node already has a stable id and authored edges, so curated chapters need nothing invented.

## Decisions (locked)

1. THE NAME IS griot-viz-engine. Gavin ruled 2026-09-13. Our things get our names (nomenclature
   rule). `prism-viz-engine` becomes a DEPRECATION ALIAS that RESOLVES and is never what we say,
   in exactly three places: the npm package, the MCP tool binding, and module imports.
2. THE MCP ALIAS IS LOAD-BEARING, NOT COSMETIC. The digital-griot MCP tool is bound as
   `prism_viz_engine`. If the rename lands without the alias, the live session loses its handle to
   the engine mid-run. Keep `prism_viz_engine` resolving to the renamed tool. Adding
   `griot_viz_engine` as the canonical binding is in scope; removing the old one is NOT.
3. NO NPM PUBLISH IN THIS RUN. Gavin performs the npm login and publish himself in his own
   terminal. The run prepares everything and STOPS, printing the exact command(s) to
   .prism/local/griot-viz-rail-report.md. Never run `npm publish`, `npm login`, `npm adduser`, or
   anything that consumes a credential. Do not touch the npm token.
4. CHAPTER RAIL = meta.views, archify's authored contract. At most FIVE curated chapters over
   stable node ids. Named Chapter Rail, Chapter Delta Preview, and stop list all derive from that
   ONE authored array - none owns parallel topology or layout (viewer-runtime.md).
5. CHAPTERS ARE READING PATHS, NOT CATEGORIES. A chapter is a journey ACROSS layers, never a
   restatement of a layer. Eleven layers were never going to be eleven chapters. Author chapters
   that cut the harvest the way a reader would walk it - e.g. what the shell owns vs what mounts
   into it; where the agent surface lives; how collaboration enters.
6. NEVER INFER. Story transitions classify only the exact authored relationship between adjacent
   stops - forward, reverse, multiple, or grouped/no-direct-link. Never infer a transitive edge,
   verb, causality, or runtime behaviour from proximity, kinds, or story order (viewer-runtime.md,
   verbatim). Same law as the harvest: never invent a node, never fill an unfilled layer.
7. CLICK-TO-SOURCE USES EXISTING DATA ONLY. data.origin.file + line is already present 27/27. Wire
   it; do not re-derive it, do not guess a path, and fail closed on a node missing an origin.
8. STATIC IS THE DEFAULT. No motion in this run. meta.animation "trace" is a separate switch for a
   later stage. Reduced motion, print and canonical export must preserve complete static meaning.
9. NON-BREAKING. The companion target from commit 56b8c05, the legacy --self/--in paths, the
   workgraph state channel, and the seeded LAYERS/TIMELINE panels all keep working unchanged.
10. STRUCTURE ROUTES THROUGH THE ARCHITECT. /prism:griot-agent-architect governs, its bundled
    validator is the gate, run device-side headless. Never hand-eyeball structure. No hand-authored
    HTML reaches a companion content dir (viz-companion-fusion Decision 1 still stands).

## Process

Step 1 - ARCHITECT. Run /prism:griot-agent-architect. Establish the full rename surface BEFORE
  editing: package.json name/bin, src imports, scripts/emit-screen.mjs, the MCP tool binding in
  digital-griot-mcp, skill references, .prism docs, CLAUDE.md mentions. Produce the list first.

Step 2 - RENAME. Apply it with the alias discipline of Decision 1 and 2. Directory rename
  apps/prism-viz-engine -> apps/griot-viz-engine is IN SCOPE only if the architect confirms nothing
  resolves it by hard path; otherwise leave the directory and rename the package identity only, and
  say so plainly rather than half-doing it.

Step 3 - CHAPTER RAIL. Add meta.views support to the companion target plus the Named Chapter Rail
  header and Chapter Delta Preview. Author the chapters over the existing 27 nodes per Decision 5.

Step 4 - CLICK-TO-SOURCE. Wire node click to its authored origin file:line per Decision 7.

Step 5 - VALIDATE. Architect validator, then prove in a live companion session: the rail renders
  with its chapters, stepping a chapter changes the stop list, a node click resolves to a real
  file:line, and the previously-landed panels still fill. Report the live URL.

Step 6 - COMMIT, THEN STOP. Commit the rename and both primitives. Do NOT publish. Print the exact
  publish command for Gavin to run himself, plus the deprecate command for the old package name.

## Success criteria

- The package identity is griot-viz-engine; `prism_viz_engine` still resolves as an MCP alias.
- A guided chapter rail renders over the harvest, derived from one authored meta.views array.
- Clicking a node resolves to its real authored file:line; a node without an origin fails closed.
- Nothing from commit 56b8c05 regressed; panels still seed and fill.
- No credential was touched and nothing was published.

## Heartbeat tokens

STEP 1 architect - STEP 2 rename - STEP 3 rail - STEP 4 source - STEP 5 validate - STEP 6 commit - DONE
