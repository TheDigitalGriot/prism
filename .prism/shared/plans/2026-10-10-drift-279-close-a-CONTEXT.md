# Stage contract: drift-279-close-a (ruled by Gavin 2026-10-10 20:21: option a, plus all-three from 03:36)

## Inputs
- Prism: .prism/stories/griot-codeintel-hygiene/stories.json, coverage.md, .prism/shared/workgraph/index.json, scripts/workgraph-index.mjs, .prism/shared/contracts/stories-contract.md (rule 4, lines 53-55), plan 2026-09-22-codex-plan-sync-eve-CONTEXT.md (how coverage.md is emitted).
- griot-live-artifacts: tools/verify-rename.mjs, live/_artifacts/rename-aliases.json, archive/2026-10-09-daily-briefing-freeze/, live/griot-daily-briefing/*.json, tools/dgs-sync-all.ps1, live/griot-ontology-codex.html.
- Previous result: .prism/local/drift-279-close.BLOCKED (measured: id = "s-" + md5(title)[0:8], 6/6).

## Decisions (locked)
1. Option a: accept the id churn. Retitle s-b02d6c48 to "Make verify-artifacts compare the published body it actually read back"; its new id is s-5248f29d (recompute and confirm). Rewrite verify-cards.ps1 to verify-artifacts.ps1 in its steps and description, and in s-3eeb40a6's step and description (the file on disk is verify-artifacts.ps1). Update s-3eeb40a6.blockedBy to the new id. Re-emit coverage.md the way the codex-plan-sync stage emits it, and regenerate index.json with node scripts/workgraph-index.mjs .prism/shared/workgraph/index.json.
2. A row dated on retiredOn counts as history; strictly after still fails.
3. archive/*-daily-briefing-freeze/ goes in FILE_EXEMPT beside transcripts/, with a one-line comment citing this ruling.
4. Never hand-edit a dated record row. Re-export the live Daily Briefing datasets with their own export tool so the post-rename rows pick up the new title. If the export reproduces the old text verbatim, write BLOCKED listing the rows.
5. Log one new drift through griot-drift-log: the stories contract rule 4 does not name which field the id hashes and no script computes or checks it (measured: ids hash the title). Fix: name the field in the contract and add an id check to the stories gate. Status flagged.
6. griot-ontology-codex.html lacks a doctype, so it renders in quirks mode inside the Djeli embed. Fix it at its generator if one exists; otherwise add the doctype, charset and viewport lines to the file. Then confirm VERIFY_BRANCH_CODEX_OK on the Djeli page still holds.
7. Never start a background task. Add no bypass. A failing gate is BLOCKED with its verbatim output.

## Process
1. Decision 1. Heartbeat RETITLED.
2. Decisions 2-4, then node tools/verify-rename.mjs prints RENAME_GATE_OK. Heartbeat GATE-OK.
3. dgs-sync-all vocabulary stage green. Heartbeat SYNC-OK.
4. Resolve drift 279 and log the Decision 5 drift, both through griot-drift-log. Heartbeat DRIFT-DONE.
5. Decision 6. Heartbeat DOCTYPE-OK.
6. Commit and push Prism and griot-live-artifacts; prove local HEAD == origin for each. Heartbeat PUSHED.

## Heartbeat
.prism/drift-279-close-a-progress.txt, one timestamped line per token.
TERMINAL MARKER: .prism/local/drift-279-close-a.DONE or .BLOCKED with the gate line, the new story id, the new drift number, commit shas, and the reason if blocked.