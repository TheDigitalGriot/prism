# Stage Contract - S4 / N27: griot-agent-architect over both log skills

Status: FIRED by the Cowork session, 2026-09-15, at Gavin's instruction.
Route device-side headless (claude.exe -p) as an ICM stage-walk, cwd = digital-griot-skills.

## Why this stage exists

S4 asked for griot-agent-architect over both log skills; N27 recorded that griot-gold-log
has three working engines and no SKILL.md. Measured this run, both are worse than recorded:

- **griot-gold-log has NO canonical source at all.** `digital-griot-skills` has no
  `griot-gold-log` directory. It exists ONLY at `~/.claude/skills/griot-gold-log/` as
  `scripts/append-gold.mjs` (3,309 b), `scripts/render-gold-codex.mjs` (5,682 b),
  `scripts/gold-codex.css` (7,540 b). No SKILL.md anywhere. This is invariant I11's
  ungated-propagation-target class: a live home with no source behind it.
- **griot-drift-log has drifted BACKWARDS.** Every live file is LARGER than the repo source:
  append-drift.mjs 2,381 live vs 2,337 repo; codex.css 5,963 vs 5,899; render-drift-codex.mjs
  4,733 vs 4,617. SKILL.md matches at 6,425. Someone edited the live home instead of the
  source of truth.

## Inputs

WORKING (cwd - write here):
- `C:\Users\digit\GriotMeta\digital-griot-skills\griot-drift-log\` (SKILL.md + scripts\)
- `C:\Users\digit\GriotMeta\digital-griot-skills\griot-gold-log\` (DOES NOT EXIST YET - create)

REFERENCE (read, never write from this run - N17):
- `C:\Users\digit\.claude\skills\griot-drift-log\` (the drifted-ahead live copies)
- `C:\Users\digit\.claude\skills\griot-gold-log\` (the only copy that exists)
- `C:\Users\digit\GriotMeta\griot-live-artifacts\live\_gold\gold-entries.json` (3 entries, the real shape)
- `C:\Users\digit\GriotMeta\griot-live-artifacts\live\_drift\drift-entries.json`
- `C:\Users\digit\GriotApps\Prism\skills\griot-agent-architect\` (the standard + bundled validators)

## Locked Decisions

- RUN griot-agent-architect. Follow its conventions and RUN ITS BUNDLED VALIDATORS
  (parse-frontmatter at minimum). Never hand-eyeball skill structure. Never read its SKILL.md
  and hand-do the work.
- **NEVER BLIND-OVERWRITE THE DRIFT.** The live drift-log files are larger than the repo's.
  Diff them line by line and reconcile deliberately, carrying the live additions INTO the
  repo source. Losing a live edit because the repo is "source of truth" is a defect, not a
  policy win. Report exactly what the live copies contained that the repo did not.
- griot-gold-log gets a canonical home in digital-griot-skills: the three scripts copied in
  as source, plus a SKILL.md authored to the griot-agent-architect standard.
- The SKILL.md must describe what the engines ACTUALLY do - read append-gold.mjs and
  render-gold-codex.mjs and the real gold-entries.json shape, including the five board axes
  and the no-gold-without-its-trace invariant. Do not invent fields.
- ADD IN PLACE everywhere. Never strip or restructure existing content.
- Do NOT converge anything back to ~/.claude from inside this run (N17). Convergence is an
  explicit device-side step the Cowork session performs afterwards.
- DO NOT COMMIT. Leave everything uncommitted for Gavin's review.
- Daemon is NOT a prerequisite. :6767/:6780 are mobile/remote only.

## Process (ICM stage-walk)

1. LOAD - drive codebase-locator/analyzer over both skill trees. Establish the exact drift,
   file by file, as a diff not a size comparison. HEARTBEAT: STEP1_LOAD
2. RECONCILE DRIFT - carry the live drift-log additions into the repo source, additively.
   Name every hunk you moved. HEARTBEAT: STEP2_RECONCILE
3. GROUND GOLD - read the gold engines and gold-entries.json. Write down what the skill
   actually does before authoring a word of SKILL.md. HEARTBEAT: STEP3_GROUND
4. HOME GOLD - create digital-griot-skills\griot-gold-log\ with the scripts as source.
   HEARTBEAT: STEP4_HOME
5. AUTHOR - write griot-gold-log\SKILL.md to the griot-agent-architect standard, describing
   the real engines, the five axes and the invariant. HEARTBEAT: STEP5_AUTHOR
6. VALIDATE - run the griot-agent-architect validators on BOTH skill dirs. Prove the
   reconciled drift-log files now contain every live addition. HEARTBEAT: STEP6_VALIDATE
7. REPORT - the exact drift hunks recovered, what gold-log's SKILL.md says and why, validator
   output, and what still needs converging. HEARTBEAT: DONE_S4_N27

## Success criteria

- Every live drift-log addition is present in the repo source, proven by diff, none lost.
- digital-griot-skills\griot-gold-log\ exists with the three scripts and a SKILL.md.
- The SKILL.md describes the real engines - every field it names exists in the code or in
  gold-entries.json. No invented fields.
- griot-agent-architect validators pass on both skill dirs.
- Nothing committed, nothing converged to ~/.claude from inside the run.

## Heartbeat tokens

Write to `C:\Users\digit\GriotMeta\digital-griot-skills\.s4-n27-progress.txt`:
STEP1_LOAD - STEP2_RECONCILE - STEP3_GROUND - STEP4_HOME - STEP5_AUTHOR - STEP6_VALIDATE - DONE_S4_N27