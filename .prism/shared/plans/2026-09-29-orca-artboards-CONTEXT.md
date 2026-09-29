# Stage contract — Orca UI walk → IDE Shell artboards

Authority: workgraph node `C29` (djeli branch capture, amendPass68), with findings `N126`,
`N127` and suggestion `S21`. Gavin ruled the route on 2026-09-28: drive `griot-harvest-ux-ui`,
not the bare code agents.

## Inputs — exact paths, working vs reference

WORKING (this stage writes here):
- `C:\Users\digit\.prism\shared\harvests\uxui-canvas-nodes.json` **(MOVED 2026-09-29 to the
  Prism global, by Gavin's call — it spans four repos and had been living inside one)** — the validated
  node array. **CORRECTED 2026-09-29 by the first run of this contract.** 27 nodes, and NOT all
  genoffice: 13 genoffice, 4 orca, 4 djeli, 6 block-buzz, all landed in one commit (`315d9b1`,
  2026-09-11, previously untracked). The 4 existing orca nodes —
  `orca-app-confirmationdialogprovider`, `orca-app-sidebar`, `orca-app-rightsidebar`,
  `orca-app-newworkspacemodal` — already carry `sourceCommit`
  `05c30166f492958f3d80cf6731124d91a17218ed`, which is orca's CURRENT HEAD, so they are not stale.
  Only `orca-app-rightsidebar` falls inside the seven clusters below; the other three sit outside
  this contract's scope. So this walk is neither starting from zero orca coverage nor duplicating
  work: six of seven clusters plus most of `right-sidebar/` remain unwalked. Nodes are APPENDED by
  idempotent merge-by-id; not one existing node is removed or rewritten.
- `C:\Users\digit\GriotMeta\griot-live-artifacts\live\djeli-ide-shell\project\` — `canvas.json`
  plus the `.dc.html` boards. Step 3 only.

REFERENCE (read, never write):
- `C:\Users\digit\GriotSandbox\orca` — the surveyed target. 34 top-level entries, has `.git`.
  The skill refuses to clone; this is why it does not have to.
- `C:\Users\digit\GriotApps\Prism\skills\griot-harvest-ux-ui\` — SKILL.md and the three scripts:
  `emit-canvas-nodes.mjs` (validator), `build-canvas.mjs` (xyflow canvas), `render-canvas-preview.mjs`.
- `C:\Users\digit\.prism\shared\harvests\djeli-HARVEST-MAP.md` — **MOVED 2026-09-29 to the Prism
  global.** It was loose at the `GriotApps` root (and before that miscited as being inside the
  `djeli` repo). A run needs `--add-dir C:\Users\digit\.prism` to read it. The 2026-07-27 recon pass over the fresh
  Orca clone. Its LIFT table already names the renderer component dirs by path:
  `src/renderer/src/components/{agent,dashboard,new-workspace,diff-comments,right-sidebar,repo}`
  is "the lane/dashboard UI", `src/renderer/src/components/floating-terminal` is the WebGL terminal.
  Use it as the cluster seed, not as a finding — every cluster still gets its own analyzer pass.
- `C:\Users\digit\GriotApps\djeli` — the working fork, `orca` 1.4.160-rc.0. Read for divergence only.

## Locked decisions

1. **The walk drives the skill.** `griot-harvest-ux-ui` step 2 dispatches one `codebase-analyzer`
   per screen cluster. No bare locator/analyzer pass stands in for it, and no cluster is summarised
   without a `file:line`.
2. **Eleven layer roles, verbatim, no twelfth.** Routing goes through `emit-canvas-nodes.mjs`,
   which exits nonzero on an invented role, a dropped `file:line` or a typo'd field. A hand-authored
   node list is forbidden by the skill's own success criteria.
3. **Append, never replace.** The 27 genoffice nodes stay. Node count after the walk must be
   27 + (orca nodes added), asserted before anything downstream runs.
4. **The converter is the only new code.** Nothing on disk emits `.dc.html` from a node array
   (searched 2026-09-28). It reads a validated screen node and writes the desktop board AND its
   390×844 twin as one pair, then appends both to `canvas.json`'s `boards` map and `order` array.
   A run that emits a desktop board without its twin fails.
5. **Landing band y=13500.** The lowest occupied board is `CinopsisCompanion` at `y=11760 h=1500`,
   so the new band reflows none of the 15 existing boards. Pairing precedent: `Main` 2620×1560 with
   `Main-mobile` 390×844; `GriotTriad` 1720×760 with `TriadMobile` 1560×560.
6. **Each board carries its provenance.** The origin `file` and `line` and the `mountPoint` from the
   node that produced it are rendered on the artboard. That is what makes it a harvested screen and
   not a drawing.
7. **OA16 is unresolved and blocks styling, not structure.** Djeli's ember is gold `#E0A458` in its
   codex and purple `#8b5cf6` in shell chrome, both in use. Boards land structurally correct and
   unstyled on that axis until Gavin rules. Do not pick one.
8. **Never `render-codex.mjs` on the djeli branch capture.** Its page fails 9 render-contract checks
   because it is the 607 KB bespoke original the skill was generalized from; a rebuild would discard
   ~535 KB of Gavin's own content. Flagged, not fixed, and his call alone.

## Process

1. Confirm the target is surveyed. `GriotSandbox/orca` present with `.git`. Record the commit sha —
   it becomes `provenance.sourceCommit`, which the genoffice nodes left `null`.
2. Cluster the renderer surfaces from the harvest map's LIFT rows. One `codebase-analyzer` agent per
   cluster, each returning candidate nodes with `origin.file`, `origin.line` and `mountPoint`.
3. Route each finding to one of the eleven roles. Run `emit-canvas-nodes.mjs --cluster <name>
   --in <findings.json>` per cluster. A nonzero exit is a stop, never a warning.
4. Assert the append: all 27 existing node ids still present and unmodified, count is 27 + the
   number of genuinely NEW ids (merge-by-id, not a flat +N off a zero baseline), and every new node
   carries `provenance.repo = "orca"` and `sourceCommit`
   `05c30166f492958f3d80cf6731124d91a17218ed`.
5. Build the converter. Emit the pairs into the `y=13500` band. Assert every desktop board has its
   twin and that `canvas.json`'s `boards` keys and `order` entries agree exactly.
6. Gate, then commit. Then republish the IDE Shell card — done means pushed live.

## Success criteria

- `uxui-canvas-nodes.json` carries the newly walked orca nodes with `file:line` and a real
  `sourceCommit`, and still carries all 27 pre-existing nodes unchanged (13 genoffice, 4 orca,
  4 djeli, 6 block-buzz).
- Every `emit-canvas-nodes.mjs` invocation exited zero.
- `canvas.json` gained one desktop board and one 390×844 twin per landed screen, in the `y=13500`
  band, with `boards` and `order` in agreement and the 15 prior boards untouched at their original
  coordinates.
- Each new `.dc.html` renders its node's origin `file:line` and `mountPoint`.
- The IDE Shell card version incremented and the repo tree is clean.

## Heartbeat tokens

`HB_SURVEY_OK` · `HB_CLUSTER_<name>_OK` · `HB_EMIT_OK <count>` · `HB_APPEND_ASSERTED` ·
`HB_CONVERTER_BUILT` · `HB_PAIRS_<n>` · `HB_GATE_OK` · `HB_DONE`

A terminal marker file is written at `.prism/local/orca-artboards-DONE` on completion. The session
tests for that file's existence once, after a long wait — it never tails a growing log.
