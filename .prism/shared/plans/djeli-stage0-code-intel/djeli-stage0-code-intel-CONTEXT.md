# Stage contract - djeli-stage0-code-intel

Inbound (awaits): .prism/shared/plans/djeli-uxui-harvest/djeli-uxui-harvest-CONTEXT.md,
.prism/shared/workgraph/uxui-canvas-nodes.json, skills/griot-harvest-ux-ui/SKILL.md

## Why this stage exists

The djeli-uxui-harvest contract names the live Kuzu code graph as its SUBSTRATE. That substrate
does not exist for any Djeli target. ~/.gitnexus/registry.json holds exactly one entry - prism
(2958 files, 43405 nodes, 95510 edges, indexed 2026-09-12). genoffice, orca, djeli and block-buzz
carry no .gitnexus, no codebase-memory graph, nothing. Every Spectrum stage-walk on Djeli would
therefore fall back to reading whole files, which is the exact cost ICM was infused into Prism to
remove. Stage 0 builds the substrate the later stages already assume.
CORRECTED 2026-09-13 (djeli-branch-capture third AMEND pass), two corrections to the paragraph
above: (1) NAMING - the substrate is LadybugDB, not Kuzu; Kuzu was ARCHIVED 2025-10-10 (Apple
acquired Kuzu Inc.) and griot-live-artifacts commit d901bf6 (2026-09-11) already corrected the DGS
shelf to LadybugDB/ladybug (adopt/now, ".gitnexus/lbug runs on it" today) - see
djeli-uxui-harvest-CONTEXT.md decision 4 and djeli-branch-capture-workgraph.json B9 for the full
trail. (2) SCOPE - "no code-intel graph exists for any Djeli target" was a blanket claim that is
now wrong: code-review-graph (shelved by full name for months, never installed) is INSTALLED as of
the same commit d901bf6, closing Gap 3. The narrower, separately-verified finding stands unchanged:
genoffice/orca/djeli/block-buzz still carry no PER-REPO index of their own (~/.gitnexus/registry.json
above still holds only the one prism entry) - only the blanket "nothing exists" framing was wrong,
not that specific per-repo count. See djeli-branch-capture-workgraph.json A3 for the evidence.

## Decisions (locked)

1. THE TAXONOMY IS ELEVEN, not nine. prism_viz_engine mode=layers returns eleven roles from
   apps/prism-viz-engine/src/core/layer-roles.ts: the nine in the harvest contract plus
   Suite meta and Cross-cutting rails. The harvest contract's decision 2 is stale and must be
   amended before wave 2 runs, or wave 2 inherits a dead taxonomy. The 27 existing nodes were
   routed against nine; validate already reports 7/11 with four unfilled. Gavin ruled 2026-09-13
   that the Djeli workspace map IS Suite meta and that tab-to-tab motion IS Cross-cutting rails.
2. INDEX TARGETS. Confirmed on disk: GriotSandbox/genoffice, GriotSandbox/orca, GriotApps/djeli,
   GriotSandbox/block-buzz, GriotSandbox/openship, GriotSandbox/meetily, GriotApps/Synaptiq,
   GriotApps/lucid, GriotApps/lucid-ai-gen, GriotApps/idea_init, GriotApps/r3f-studio-dev.
   NOT FOUND on any Griot root: openscience, kente. Those remain open asks, not gaps to fill.
   CORRECTED 2026-09-13 (djeli-branch-capture AMEND pass) - mixar was WRONGLY listed here as
   "NOT FOUND". Mixar IS a real, actively-developed repo: https://github.com/Mixar-AI/mixar-app.git
   (git remote -v), HEAD a55ba08 "Merge pull request #1148 from Mixar-AI/develop", native
   Makefile+cmake+conftest.py C++/Python build (not JS), living at ~/mixar-app INSIDE the
   MixarBuild WSL distro (`wsl -d MixarBuild`) - D:\GriotEnvs\MixarBuild\ext4.vhdx is that distro's
   build environment, not the repo itself; both are real and distinct. It IS a real index target,
   but a WSL-internal one: graphify/git-nexus must be invoked via `wsl -d MixarBuild` against
   ~/mixar-app, not against a Windows path under any Griot root - the earlier search only checked
   top-level dirs under C: Griot roots, never recursed, never checked D:, and never looked inside a
   WSL distro. No licence verdict recorded - Gavin is exploring/remixing, not shipping.
   CORRECTED 2026-09-13 (second amend pass, prism-codex-plan-sync reverse channel) - openscience
   and kente were mischaracterized above as simply "NOT FOUND ... not gaps to fill". Per
   griot-live-artifacts/live/griot-ontology-codex.html's kente node (verbatim): repo:'GriotApps',
   seed:'←ModelMaker · fork of aipoch/open-science (OpenScience workbench)'. So "openscience"
   is NOT an abstract intake layer to search a Griot root for - it is aipoch/open-science, an
   EXTERNAL GitHub repo (the OpenScience workbench) that Kente forks FROM; the earlier search found
   no such directory because it is not vendored under a Griot root under its own name, not because
   it doesn't exist. And "kente" is not absent by design either: GAVIN'S RULING 2026-09-13,
   recorded verbatim - Kente is NOT "no repo by design"; it has simply not fully materialized out
   of the noise yet, the same consistent thread as the other signals in the suite. "By design" says
   stop looking; "not yet materialized" says keep watching for the signal. It remains not-found-on-
   disk this pass (that observation stands unchanged) - only the INTERPRETATION of that absence is
   corrected. Lesson (see djeli-branch-capture-workgraph.json N5): griot-ontology-codex.html carries
   per-node repo/seed/harvest data for the whole suite and already answered this - consult it before
   declaring a Griot-suite node's repo status NOT FOUND or by-design-absent. See
   djeli-branch-capture-workgraph.json OA2/OA3/OA5 for the full evidence trail, including OA5's
   UNRESOLVED conflict between kente-codex.html ("no repo yet") and griot-ontology-codex.html
   (repo:'GriotApps'), which Gavin has not yet ruled on.
3. COMPOSITION, one home per fact. graphify owns the index build. git-nexus owns the registry.
   griot-harvest-ux-ui owns the UI walk and the layer routing. dgs-plan-update owns every plan
   write. Call them; never reimplement them.
4. UI PROVENANCE IS ASKED, NEVER ASSUMED. Gavin's standing instruction 2026-09-13: if a Griot
   tool's UI is not present as HTML or a running application, it exists in a Claude design or a
   Pencil file and he will supply it by hand. Record "source unconfirmed" and ask. Never infer a
   UI that was not read.
5. LUCID IS NOT LOST. GriotApps/idea_init is intact and holds "idea_init app/" (companion/
   branding.jsx, tweaks-panel.jsx, companion/screen_session.jsx, app/icons.jsx),
   hub-wireframe-mid.html in four dated iterations under .prism/local/brainstorm/, 
   design-dna/design-dna-report.html, experiments-sample/workshop-bench-index.html, and
   inspo-sources.md. Which of these is THE idea_init UI is Gavin's call, not an inference.
6. Every claim carries file:line. Licence is a FACT for a field, never a verdict. Never gate or
   narrow what Gavin forks, studies or remixes.

## Process

Step 1 - AMEND THE TAXONOMY. Update djeli-uxui-harvest-CONTEXT.md decision 2 from nine roles to
  the eleven returned by prism_viz_engine mode=layers. Additive edit in place; never rewrite the
  surrounding contract.

Step 2 - CORRECTED 2026-09-13 (viz-companion-fusion-CONTEXT.md, "Also pull in this run"): NOT A
  WIRE SEAM. emit-screen.mjs:93's `(canvas.nodes ?? []).filter(n => n.griot)` runs against the
  IN-MEMORY `canvas` object the script builds a few lines earlier, not against the raw harvested
  file — and `--self` (emit-screen.mjs:61-83) is exactly the path that reads the bare 27-element
  array at .prism/shared/workgraph/uxui-canvas-nodes.json and WRAPS it into that `canvas` shape
  (adding `.griot`, `x`, `y`, `width`, `height` per node) before the `n.griot` filter ever runs.
  `--in` is the one that expects an already-wrapped canvas; it was never the path for this file.
  So there is no seam to fix here: `node emit-screen.mjs --self` already draws the 27 nodes
  (verified 2026-09-13 during viz-companion-fusion — 27 nodes/12 edges/7 layers rendered, zero
  code changes to this filter needed). If mode=render still refuses the file, the cause is an
  invocation calling `--in uxui-canvas-nodes.json` instead of `--self` — fix the CALL SITE, not
  emit-screen.mjs.

Step 3 - INDEX. Run graphify + git-nexus over every confirmed target in decision 2. Record each
  in ~/.gitnexus/registry.json with files/nodes/edges/communities, as prism already is.

Step 4 - VERIFY THE SUBSTRATE. Prove the graph answers a real structural question before trusting
  it: query the genoffice shell for every caller of the create*View factories and the
  addChildView contract in apps/shell/src/main/tab-manager.ts, and report the true blast radius
  of adding one TabKind member. That number decides whether panel two justifies generalising the
  registry - it is the question the Djeli codex left open and estimated rather than measured.

Step 5 - COMMIT. Contract amendment, the emit-screen fix, the registry entries.

## Success criteria

- djeli-uxui-harvest-CONTEXT.md decision 2 names eleven roles.
- prism_viz_engine mode=render draws the 27 harvested nodes instead of refusing them.
- ~/.gitnexus/registry.json holds an entry per confirmed target, not just prism.
- The tab-seam blast radius is a measured number from the graph, not an estimate.
- mixar, openscience and kente are reported as open asks, never invented.

## Heartbeat tokens

STEP 1 taxonomy - STEP 2 wire-seam - STEP 3 index - STEP 4 verify - STEP 5 commit - DONE

## Open asks (Gavin's calls, not agent inferences)

- mixar - CORRECTED 2026-09-13 (djeli-branch-capture AMEND pass): this line originally said
  "matched nothing on any Griot root" - that was wrong. Mixar IS a repo
  (https://github.com/Mixar-AI/mixar-app.git, HEAD a55ba08), living inside the MixarBuild WSL
  distro at ~/mixar-app, not merely the distro itself (D:\GriotEnvs\MixarBuild\ext4.vhdx). See
  decision 2 for the full correction. No open ask remains here beyond confirming its priority in
  the index queue.
- openscience / kente - no directory under GriotApps, GriotProducts, GriotMeta or GriotSandbox.
  CORRECTED 2026-09-13 (second amend pass): see decision 2's correction above. openscience =
  aipoch/open-science (an external fork-base repo, not a Griot-root directory to search for).
  kente = not "no repo by design" (Gavin's ruling) - "not yet materialized", still genuinely
  absent on disk this pass. The remaining open ask is OA5's conflict (kente-codex.html vs
  griot-ontology-codex.html on whether Kente has a repo at all) - Gavin rules it, not this pass.
- Which idea_init surface is THE Lucid UI (see decision 5).
- Live artifact titles from griot-live-artifacts, pending from Gavin.
