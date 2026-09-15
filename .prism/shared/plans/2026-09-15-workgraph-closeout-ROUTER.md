# Thin router - B26 + workgraph close-out + Djeli branch/contract

Three ICM stage-walks. Run them ONE AT A TIME, each with its own repo as cwd.
Headless runs are confined to cwd (workgraph N17 - a run "completed" while its
scope silently excluded everything outside cwd). Never start a stage in the wrong
repo, and never reach into a second repo from inside a headless run: cross-tree
convergence is an explicit device-side step in the contract, executed by the
Cowork session, not by the agent.

  STAGE 1 - engine (GATES stage 3)
    cwd      C:\Users\digit\GriotMeta\digital-griot-skills
    contract C:\Users\digit\GriotApps\Prism\.prism\shared\plans\2026-09-15-wg-advance-CONTEXT.md

  STAGE 2 - B26 (independent, may run in its own process any time)
    cwd      C:\Users\digit\GriotApps\Prism
    contract C:\Users\digit\GriotApps\Prism\.prism\shared\plans\2026-09-15-b26-device-carriage-CONTEXT.md

  STAGE 3 - close-out + Djeli (REQUIRES stage 1 merged and live)
    cwd      C:\Users\digit\GriotMeta\griot-live-artifacts
    contract C:\Users\digit\GriotApps\Prism\.prism\shared\plans\2026-09-15-wg-closeout-djeli-CONTEXT.md

Launcher: flags BEFORE -p, quote-free instructions file, detached Start-Process,
then poll the heartbeat file ONCE after a long wait. Never poll on a sub-minute
loop - every poll re-sends the whole conversation (Gavin's token HARD LINE).
The daemon is NOT a prerequisite: :6767/:6780 are mobile/remote only. In-process
agents, no daemon.

Rules that override any instinct:
- ADD IN PLACE. Never strip, rewrite or restructure Gavin's existing content.
- NEVER hand-edit a store that has a working engine behind it. Every workgraph
  write goes through griot-workgraph-update. Every gold/drift write goes through
  its append engine. (drift 47 / N26 - a render is never the place to add a fact.)
- NEVER search a generated document for a token you also just wrote into it, and
  never trust a -1 index into a slice. (N29 - that collision duplicated a whole
  codex.) Every injection into an artifact is gated on three refuse-to-write
  assertions: element count unchanged, final size == predicted, unique id present
  exactly once.
- Check what the DESTINATION already holds before calling a slot empty. (N16 /
  the B27 correction - the "empty" device slots each held an explicit
  self-declaring placeholder, and seven codexes already held real exports.)
- DRIVE the discovery agents (codebase-locator / codebase-analyzer /
  graph-navigator / prism-locator). Never drop to raw find/grep/Glob when a tool
  covers it, and never hand-simulate a skill's output.
- Load only each step's inputs + code-intel slices, ~2-8k tokens/step. Query the
  code graph; do not photocopy whole files into context.
- Dispositions are GAVIN'S calls. The run produces the sheet; it does not rule.
- Write a heartbeat token at the end of each step to the file the contract names.

Start at whichever stage Gavin says. Stop at that stage's DONE token with a report.