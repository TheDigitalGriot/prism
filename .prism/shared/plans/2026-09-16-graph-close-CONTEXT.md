# Stage Contract - close the graph: M1 closure model, the 7 CORRECT rows, and the DGS rows

Status: FIRED 2026-09-16 at Gavin's instruction. cwd = C:\Users\digit\GriotMeta\griot-live-artifacts
Three findings that were catalogued and never fixed. Close all three in one pass.

## The three

1. **M1 - the closure model has been lying.** `closureModel.total` says 23 closed / 26 open = 49
   nodes. The graph has 78. `resolved-verified` and `resolved-done` sit on nodes but appear in
   neither `closedStates` nor `openStates`, so closure % has been computed on a stale denominator
   since roughly pass 11. Recompute and classify.
2. **The 7 CORRECT rows** from the disposition sheet, never applied. They are in
   `.prism/shared/plans/2026-09-15-workgraph-disposition-sheet.md` section 4. Read them there -
   do not invent them. B10 is the headline: its pass-14 verification claimed ZERO tab affordances
   in the ontology codex; the file has five buttons at `live/griot-ontology-codex.html:106-110`.
   The check failed, not the node. Correct the verification; the STATE stays.
3. **The DGS rows run failed** - its heartbeat holds only PROCESS_EXITED, no step tokens, so
   dgs-plan-update never ran. The six rows are listed in
   `C:\Users\digit\GriotApps\Prism\.prism\local\dgs-rows-INSTRUCTIONS.txt`. Retry, and if it
   fails again, diagnose WHY and report the cause - do not silently exit twice.

## Locked Decisions
- EVERY write goes through its engine. `amend-workgraph.mjs` for nodes and corrections,
  `sync-codex-data.mjs` for propagation, `verify-workgraph.mjs` to prove parity,
  `dgs-plan-update` for the plan. NEVER hand-edit a store that has an engine behind it.
- Corrections carry wasClaimed / isTrue / cause. The engine refuses without them - do not
  work around it.
- M1 is model-level, not a node. If the engine has no verb for closureModel, SAY SO and report
  what a verb would need - do not hand-edit the JSON to get around it.
- DGS: ITEMS delta EXACTLY 6, POT_T stays 1157, lead count unchanged, final size == predicted.
  Anchor array boundaries by the NEXT declaration - ITEMS closes `}];` with no newline and a
  naive search sails past it into GAPS.
- ADD IN PLACE. Three-copy parity is the invariant; verify must end VERIFY_WORKGRAPH_OK.
  Lane-move warnings on promoted nodes are EXPECTED, not failures.
- DO NOT COMMIT. Daemon is NOT a prerequisite.

## Process
1. LOAD - read section 4 of the disposition sheet for the exact 7 CORRECT rows. Re-derive the
   closure counts from the live JSON. HEARTBEAT: STEP1_LOAD
2. CORRECT - one amend pass carrying all 7 corrections through the engine. HEARTBEAT: STEP2_CORRECT
3. CLOSURE - classify `resolved-verified` and `resolved-done`, recompute total and byLane against
   78 nodes. Through the engine if it has a verb; otherwise report the gap.
   HEARTBEAT: STEP3_CLOSURE
4. SYNC - sync-codex-data then verify-workgraph. Three-copy parity proven. HEARTBEAT: STEP4_SYNC
5. DGS - run dgs-plan-update for the six rows with the assertions above. HEARTBEAT: STEP5_DGS
6. REPORT - corrections applied, the old vs new closure numbers, DGS delta, anything INCOMPLETE
   said loudly. HEARTBEAT: DONE_GRAPH_CLOSE

## Success criteria
- All 7 corrections stamped on their nodes with wasClaimed/isTrue/cause; none skipped silently.
- Closure recomputed against 78 nodes, or the missing-verb gap reported precisely.
- VERIFY_WORKGRAPH_OK; three-copy parity holds.
- DGS ITEMS +6 exactly, POT_T 1157 unchanged - or a named diagnosis of why it failed again.
- Nothing hand-edited that has an engine behind it, provable from the command log.

## Heartbeat
`C:\Users\digit\GriotMeta\griot-live-artifacts\.graph-close-progress.txt`
STEP1_LOAD STEP2_CORRECT STEP3_CLOSURE STEP4_SYNC STEP5_DGS DONE_GRAPH_CLOSE