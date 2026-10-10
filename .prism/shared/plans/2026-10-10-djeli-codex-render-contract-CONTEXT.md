# Stage contract: djeli-codex-render-contract (drift 287, parked 2026-10-10)

## Inputs - Working
- Graph (source of truth): C:\Users\digit\GriotMeta\griot-live-artifacts\live\djeli-branch-capture-workgraph.json (358 nodes / 362 edges at amendPass97_2026_10_10)
- Current page: C:\Users\digit\GriotMeta\griot-live-artifacts\live\djeli-branch-capture-codex.html (the hand-built original)
- Renderer: C:\Users\digit\.claude\skills\griot-branch-codex\scripts\render-codex.mjs
- Gate: C:\Users\digit\.claude\skills\griot-branch-codex\scripts\verify-branch-codex.mjs

## Inputs - Reference (pull, do not inline)
- griot-branch-codex references/renderer-contract.md
- griot-live-artifacts tools/inline-mirror-tabs.js (lines 22, 152, 167: the plan aliases workgraph-data to #wg-data)

## Measured (2026-10-10 mixdown, channel 2)
verify-branch-codex on the Djeli pair -> VERIFY_BRANCH_CODEX_FAIL, five render checks:
1. (b) the page never reads data.groups
2. (a) the page never enumerates the edge kinds present in the data
3. (c) state styling is not derived from closureModel (closedStates/openStates)
4. (c) no console-warning path for an unmapped value
5. (d) no computed header-pill host
The graph side passes: VERIFY_WORKGRAPH_OK across all four copies.

## Decisions (locked)
- D1 Do not overwrite the live page. Render to a CANDIDATE path: live/_candidates/djeli-branch-capture-codex.candidate.html.
- D2 The 2026-09-17 rule holds: the Djeli codex traces edges between MEASURED chip positions; a candidate that draws no edges is a broken upgrade and loses.
- D3 The swap is Gavin's ruling, made from side-by-side screenshots. This stage never swaps.

## Process
1. render-codex.mjs --json <graph> --out <candidate> --app djeli --accent <the accent in the current page's CSS>
2. verify-branch-codex.mjs --json <graph> --codex <candidate> -> expect VERIFY_BRANCH_CODEX_OK
3. Playwright screenshot of both pages at 1440x900 (runner copied into apps/prism-mobile); count rendered edge paths in each
4. Write RESULT beside this file: both gate outputs, both edge counts, both screenshot paths

## Success criteria
- Candidate gate OK; candidate edge-path count >= current page edge-path count; screenshots on disk; live page byte-identical to before the run.

## Heartbeat
.prism/djeli-codex-render-contract-progress.txt - one token per step: RENDERED, GATED, SHOT, RESULT
