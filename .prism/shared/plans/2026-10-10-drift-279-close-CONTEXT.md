# Stage contract: drift-279-close (ruled by Gavin 2026-10-10 03:36: all-three)

## Inputs
- griot-live-artifacts: tools/verify-rename.mjs (dated-row fix already landed, 15e2f9c), live/_artifacts/rename-aliases.json (retiredOn 2026-09-25 per token), archive/2026-10-09-daily-briefing-freeze/, live/griot-daily-briefing/*.json, tools/dgs-sync-all.ps1 (line 308 runs the gate).
- Prism: .prism/stories/griot-codeintel-hygiene/stories.json, its coverage.md, generated .prism/shared/workgraph/index.json; the stories contract (rule 4: ids hash the behavioral-requirement text).
- Previous result: .prism/local/djeli-embeds-279.BLOCKED (Part 1 lists the 13 hits).

## Decisions (locked)
1. Retitle the two griot-codeintel-hygiene stories at the source from verify-cards to verify-artifacts. Before writing, prove the story ids stay stable under stories-contract rule 4; if a retitle would change an id, stop and write BLOCKED with the measurement. Regenerate coverage.md and index.json with their own generators, never by hand.
2. The retirement day counts as before it: a row dated on retiredOn is history. Strictly after still fails.
3. archive/*-daily-briefing-freeze/ is a record by definition: add it to FILE_EXEMPT beside transcripts/ with a one-line comment citing this ruling.
4. Never hand-edit a dated record row. If a dated live row after 2026-09-25 still carries a retired word after the source retitle, re-export it with the Daily Briefing export tool; if the export reproduces the old text verbatim, stop and write BLOCKED listing those rows.
5. Never start a background task. Add no bypass. A failing gate is BLOCKED with its verbatim output.

## Process
1. Retitle + regenerate (Decision 1). Heartbeat RETITLED.
2. Gate edits (Decisions 2, 3). node tools/verify-rename.mjs must print RENAME_GATE_OK. Heartbeat GATE-OK.
3. dgs-sync-all vocabulary stage green. Heartbeat SYNC-OK.
4. Resolve drift 279 through the griot-drift-log skill (status change, re-render, commit, push). Heartbeat DRIFT-RESOLVED.
5. Commit and push Prism and griot-live-artifacts; prove local HEAD == origin for each. Heartbeat PUSHED.

## Heartbeat
.prism/drift-279-close-progress.txt, one timestamped line per token.
TERMINAL MARKER: .prism/local/drift-279-close.DONE or .BLOCKED with the gate line, commit shas and the reason if blocked.