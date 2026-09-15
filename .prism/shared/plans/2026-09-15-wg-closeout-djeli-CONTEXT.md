# Stage Contract - close out the workgraph + the Djeli branch/contract cluster

Status: STAGED, not fired. Contract-first per Gavin. REQUIRES stage 1 (--advance) live.
Author: Cowork session, 2026-09-15. Graph state at authoring: 75 nodes / 84 edges / 34 branches.
Route device-side headless (claude.exe -p) as an ICM stage-walk, cwd = griot-live-artifacts.
Keep the plan-nod AND every disposition interactive in chat; only research/validate go headless.

## Why this stage exists

The workgraph has 75 nodes and 70 of them are not in a terminal state. That is not
70 open problems - most are nodes that were captured honestly and then LANDED
without the graph being told. The graph has become a record of what was noticed,
not a record of where things stand. This stage makes it the second thing again.

The ~28 live state strings cluster into four dispositions. The run's job is to
sort, evidence, and PROPOSE. Gavin rules.

## The open set (grounded, 2026-09-15 - re-derive, do not trust this list blindly)

By state: named-unfiled 23 - awaiting-disposition 5 - corrected-verified 6 -
resolved-verified 5 - flagged-not-fixed 4 - open 3 - done 3 - in-progress 1 -
plus 14 one-off states (written-not-run, written-not-launched, intact-unfiled,
largely-resolved-one-gap, documented-not-vendored, running-not-surfaced,
precedent-identified-ungeneralized, named-unfiled-interactive-only,
named-unfiled-roster, verified-existing-consolidated, consult-first-partially-verified,
reframed-not-newly-discovered, verified-reframe, candidate-identified,
design-decision-locked, verified-tooling-present-routing-gap, ruled-and-applied,
defect-fixed, resolved-done).

Needing a human ruling, named: S1 notation spec - S2 SOURCE-BRIEF - S4
griot-agent-architect over both log skills - S5 migrate the 20 gitignored decision
sets - S6 workgraph region in the brainstorm template - OA4 which idea_init
surface is THE Lucid UI - OA5 does Kente have a repo at all (CONFLICT) - OA6
Potluck/SkillForge seed repo location - N2 Griotwave registry upstream drift -
N14 20 locked decision sets in a gitignored dir - N27 griot-gold-log has three
working engines and no SKILL.md - N28 (closed by stage 1).

THE DJELI CLUSTER - close this as one contract, not as scattered nodes:
C1 workgraph codex + primitive + tab (in-progress, this-stage) - N10 the
lane/graph/findings/chapters shape is a Djeli TAB PRIMITIVE, not a one-off
(design-decision-locked) - B12 Djeli workflow-tab roster - B3 Griot pages that
become workflow tabs - B17 ONE cohesive UI, the synthesis. Confirm the cluster
from the graph's own edges (in-epic / awaits / splinter), do not assume this list.

## Inputs

WORKING (edit ONLY through engines):
- `C:\Users\digit\GriotMeta\griot-live-artifacts\live\djeli-branch-capture-workgraph.json`
- `...\live\djeli-branch-capture-codex.html` - inline block, synced by sync-codex-data.mjs
- `C:\Users\digit\GriotApps\Prism\.prism\shared\workgraph\djeli-branch-capture.json` - canonical, three-copy parity
- `...\live\dgs-definitive-plan.html` - ITEMS rows (1660 at authoring), POT_T must stay 1157
- `...\live\suite-drift-codex.html` + `live\_drift\drift-entries.json` (48 at authoring)
- `...\live\gold-codex.html` + `live\_gold\gold-entries.json` (3 at authoring)

ENGINES (the ONLY write path - never hand-edit any of the above):
- `C:\Users\digit\.claude\skills\griot-workgraph-update\scripts\amend-workgraph.mjs` (+ --advance from stage 1)
- `...\scripts\sync-codex-data.mjs` - propagates to the codex inline block AND the canonical Prism copy
- `...\scripts\verify-workgraph.mjs` - must end VERIFY_WORKGRAPH_OK
- `C:\Users\digit\.claude\skills\griot-drift-log\scripts\append-drift.mjs` + render-drift-codex.mjs
- `C:\Users\digit\.claude\skills\griot-gold-log\scripts\append-gold.mjs` + render-gold-codex.mjs

REFERENCE: `C:\Users\digit\GriotMeta\griot-live-artifacts\live\djeli-codex.html`,
`C:\Users\digit\GriotApps\Prism\.prism\shared\` research + plans for the Djeli cluster.

## Locked Decisions

- NEVER hand-edit a store that has a working engine behind it. Not the JSON, not
  the ledgers, not the rendered pages. (drift 47 / N26.) A render is never the
  place to add a fact when a ledger exists behind it.
- THE RUN DOES NOT RULE. It produces a DISPOSITION SHEET. Gavin rules. Anything
  needing a judgment call - what to build, what to drop, what a conflict resolves
  to - goes on the sheet and waits.
- ADVANCE ONLY ON EVIDENCE: a commit sha, a live artifact version, or a passing
  verify. Never on inference, never on "this looks done". An advance without
  evidence is refused by the engine (stage 1) - do not work around it.
- CHECK THE DESTINATION. Before advancing a node, confirm the thing it describes
  is actually in the state claimed - inspect the artifact/file/commit. (N16.)
- Four dispositions, nothing else: ADVANCE (evidence in hand) - CORRECT (the node
  says something factually wrong) - DEFER (real, not now: state unchanged, a note
  added) - RULE-NEEDED (on the sheet for Gavin).
- ADD IN PLACE across all three masters. Never strip Gavin's content.
- Three-copy parity is the invariant: workgraph JSON == codex inline block ==
  canonical Prism copy. sync-codex-data.mjs enforces it; verify-workgraph.mjs
  proves it. Lane-move warnings for promoted nodes are EXPECTED, not failures.
- DGS edits are gated on refuse-to-write assertions: ITEMS delta exactly as
  intended, POT_T unchanged, lead count unchanged, final size == predicted. Anchor
  array boundaries by the NEXT declaration, never by a bare terminator string -
  ITEMS closes `}];` with no newline and a naive search sails past it into GAPS.
- ONE REPO PER RUN. cwd = griot-live-artifacts. Engine scripts live under
  ~/.claude/skills and are invoked by absolute path; everything they WRITE is
  inside cwd or the canonical Prism copy the sync script owns. Nothing else is
  touched from inside the run. (N17.)
- PUBLISH IS PART OF DONE. Once Gavin has ruled the dispositions, the full loop
  runs in the same motion - amend -> sync -> verify -> DGS rows -> commit + push
  both repos ref-equal -> republish the DGS, Djeli branch capture, drift and gold
  cards. Do not hold an already-ruled change behind a second "yes to push".
- Daemon is NOT a prerequisite. In-process agents only.

## Process (numbered, ICM stage-walk)

1. LOAD CONTEXT - re-derive the open set from the live JSON (states, lanes, edges).
   Drive prism-locator over `.prism` for the Djeli cluster's prior research. Do not
   photocopy the 315 KB graph - query it. HEARTBEAT: STEP1_CONTEXT
2. EVIDENCE SWEEP - for each non-terminal node, hunt evidence in THIS repo and its
   git log: commit scopes, artifact versions, file presence, verify output. Drive
   git-investigator. Produce a table: node, claimed state, evidence found, proposed
   disposition. No writes. HEARTBEAT: STEP2_EVIDENCE
3. DJELI CLUSTER - resolve C1 / N10 / B12 / B3 / B17 as ONE contract: what the tab
   primitive IS, what the roster contains, what the cohesive UI synthesis says.
   Confirm cluster membership from the graph's edges. Write it to
   `.prism/shared/research/2026-09-15-djeli-branch-contract.md`. This is a
   PROPOSAL. HEARTBEAT: STEP3_DJELI
4. DISPOSITION SHEET - every non-terminal node sorted into ADVANCE / CORRECT /
   DEFER / RULE-NEEDED, each ADVANCE carrying its evidence string. Write to
   `.prism/shared/plans/2026-09-15-workgraph-disposition-sheet.md`. STOP HERE and
   hand it to Gavin in chat. HEARTBEAT: STEP4_SHEET
5. APPLY (only after Gavin rules) - one amend pass through the engine carrying the
   advances, corrections and notes. Then sync-codex-data.mjs, then
   verify-workgraph.mjs. Three-copy parity proven, not asserted.
   HEARTBEAT: STEP5_APPLY
6. MASTERS - DGS ITEMS rows for what landed (assertions above), drift entries for
   any defect the sweep surfaced, gold entries for anything that earned one - all
   through their append engines, never by hand. HEARTBEAT: STEP6_MASTERS
7. PUBLISH - commit + push griot-live-artifacts and Prism ref-equal; republish the
   DGS, Djeli branch capture, drift and gold cards. HEARTBEAT: STEP7_PUBLISH
8. REPORT - nodes advanced / corrected / deferred / still open, the Djeli contract
   location, final counts, both shas, and the card versions.
   HEARTBEAT: DONE_WG_CLOSEOUT

## Success criteria

- Every non-terminal node has an explicit disposition; none silently skipped. A
  forced skip is an INCOMPLETE run and is said LOUDLY, never quietly dropped.
- Every ADVANCE carries evidence that was checked at the destination, not inferred.
- The Djeli cluster closes as ONE contract with a written thesis, not as scattered
  node edits.
- Three-copy parity holds; verify-workgraph.mjs ends VERIFY_WORKGRAPH_OK.
- POT_T unchanged; ITEMS delta exactly as intended; no page duplicated (element
  counts prove it).
- Nothing hand-edited that has an engine behind it - provable from the command log.
- Both repos ref-equal with origin; all four cards republished.

## Heartbeat tokens

Write to `C:\Users\digit\GriotMeta\griot-live-artifacts\.wg-closeout-progress.txt`:
STEP1_CONTEXT - STEP2_EVIDENCE - STEP3_DJELI - STEP4_SHEET - STEP5_APPLY - STEP6_MASTERS - STEP7_PUBLISH - DONE_WG_CLOSEOUT