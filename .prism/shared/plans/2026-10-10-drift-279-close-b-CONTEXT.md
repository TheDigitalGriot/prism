# Stage contract: drift-279-close-b (continues drift-279-close-a; Gavin 2026-10-10 20:21: do everything, nothing owed)

## State on entry (measured by close-a, uncommitted, keep it)
- Prism: stories.json retitled (s-b02d6c48 -> s-5248f29d), coverage.md re-emitted, .prism/shared/workgraph/index.json regenerated.
- griot-live-artifacts: tools/verify-rename.mjs carries Decision 2 (row date <= retiredOn is history) and Decision 3 (archive/*-daily-briefing-freeze/ exempt).
- Gate: RENAME_GATE_FAIL with 5 hits, all live/griot-daily-briefing/workgraph.json rows 2026-10-02/06/07/08/09, the verbatim title of story s-b02d6c48 as Prism/scripts/workgraph-distil.mjs wrote it on those dates. refresh.mjs re-export reproduces them byte-identical.

## Decisions (locked)
1. Records rule (Gavin's standing rule: dated records stay verbatim). The source story kept the word until its retitle on 2026-10-10, so a distilled channel-workgraph row dated before that day recorded the story's real name. Add a per-token recordsUntil field to rename-aliases.json retiredVocabulary: verify-cards recordsUntil 2026-10-10, with a note citing this contract and the retitle. verify-rename.mjs treats a dated record row as history when its date is on or before retiredOn, OR before that token's recordsUntil. Rows dated on or after recordsUntil still fail. Never re-distil or edit the dated rows.
2. dgs-plan-update: the DGS plan edge label at index.json:24225 (source wg:dgs f4b5f657e354 -> 8fa1d5d2064a) still names s-b02d6c48. Update it through dgs-plan-update so it names s-5248f29d, then regenerate index.json with node scripts/workgraph-index.mjs .prism/shared/workgraph/index.json.
3. Then finish close-a Decisions 5 and 6 exactly as written in .prism/shared/plans/2026-10-10-drift-279-close-a-CONTEXT.md: log the stories-contract id-field drift through griot-drift-log (status flagged), and fix the griot-ontology-codex.html doctype at its generator if one exists, else add doctype, charset and viewport to the file, then confirm VERIFY_BRANCH_CODEX_OK on the Djeli page.
4. Resolve drift 279 through griot-drift-log once the gate is green.
5. Never start a background task. Add no bypass. A failing gate is BLOCKED with its verbatim output.

## Process
1. Decision 1; node tools/verify-rename.mjs prints RENAME_GATE_OK. Heartbeat GATE-OK.
2. dgs-sync-all vocabulary stage green. Heartbeat SYNC-OK.
3. Decision 2. Heartbeat DGS-EDGE-OK.
4. Decision 3 and 4. Heartbeat DRIFT-DONE and DOCTYPE-OK.
5. Commit and push Prism and griot-live-artifacts (and any other repo touched); prove local HEAD == origin for each. Heartbeat PUSHED.

## Heartbeat
.prism/drift-279-close-b-progress.txt, one timestamped line per token.
TERMINAL MARKER: .prism/local/drift-279-close-b.DONE or .BLOCKED with the gate line, new drift number, whether griot-ontology-codex.html changed, the list of live/ files changed, commit shas, and the reason if blocked.