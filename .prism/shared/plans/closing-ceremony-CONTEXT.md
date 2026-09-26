# STAGE CONTRACT - closing ceremony + push all (2026-09-23)

Gavin's ask: run the closing ceremony and push everything, using HIS tools where they exist -
`/prism:prism-closing-ceremony` headless, and `dgs-plan-update`. Not hand-rolled equivalents.

## Inputs

WORKING (all four repos carry unpushed local commits from tonight):
- `C:\Users\digit\GriotApps\Prism` (cwd) - local `1dcdd26`
- `C:\Users\digit\GriotMeta\digital-griot-skills` (--add-dir) - local `a782d68`
- `C:\Users\digit\GriotMeta\griot-ontology` (--add-dir) - local `a4c67f2`
- `C:\Users\digit\GriotMeta\griot-live-artifacts` (--add-dir) - local `ffa9f76`, plus
  tonight's `664cfb1` and `057473b`

## Locked decisions

1. USE THE SKILLS. `/prism:prism-closing-ceremony` for Prism; `dgs-plan-update` for the DGS
   Definitive Plan. Do not hand-roll a version bump, a changelog, a release, or a plan edit.
   If a skill will not run, that is a ROUTING problem - report it, do not substitute.
2. RESPECT THE CEREMONY'S OWN GATES. It runs Review & Audit, then bookend, docs-update,
   release - sequential and fail-fast, each with its own push / GitHub-release / native-build
   gate. Let those gates decide. Do NOT force past a red gate; if one stops the run, report
   which one and stop.
3. PUSH ORDER (dependents never race ahead of what they cite):
   `digital-griot-skills` -> `Prism` -> `griot-ontology` -> `griot-live-artifacts`
4. `griot-ontology` propagates widely (propagate.ps1 -> ~15 repo-root CLAUDE.md files +
   the codex AGENTS.md). Push it, but report what propagation it implies rather than running
   propagate.ps1 unasked.
5. Do not start any companion server. Do not open a browser.

## Process

1. **State before.** For each of the four repos: current branch, local HEAD, remote HEAD,
   ahead/behind count, and whether the tree is clean. Report it as a table.
   Emit `HB_1_STATE`.
2. **Closing ceremony - Prism.** Run `/prism:prism-closing-ceremony`. Follow its sequence and
   its gates. Paste each stage's real output. If a gate is red, STOP there and report which
   stage, what failed, and what it would take - do not force past it. Emit `HB_2_CEREMONY`.
3. **dgs-plan-update.** Run the `dgs-plan-update` skill to bring the DGS Definitive Plan current
   with tonight: the griot-viz-engine rename landing, `griot-media-optimization` shipping,
   `validate-skill.sh` closing the standalone-skill validation gap, batch8's 9 advanced nodes,
   and the three new nodes OA26 / N124 / N125. Follow the skill's own rules (Rule 2 for the
   decision store). Emit `HB_3_PLAN`.
4. **Push, in the order above.** One repo at a time, verify each push landed (`HEAD == origin`)
   before moving to the next. If any push is rejected, stop and report - never force-push.
   Emit `HB_4_PUSH`.
5. **Report.** Write `.prism/shared/plans/closing-ceremony-REPORT.md`: the before/after table,
   each ceremony stage's verdict, what dgs-plan-update changed, every push result, and anything
   that did NOT run with the reason. Emit `HB_5_REPORT`, then `DONE_CLOSING_CEREMONY`.

## Success criteria

- Every step ran through the named skill, or is reported as not-run with the reason. No hand-rolled substitute.
- No gate forced. A red gate stops the run and is named.
- All four repos either pushed with `HEAD == origin` confirmed, or reported unpushed with why.
- Nothing force-pushed. No companion server started.

## Heartbeats -> `.prism/closing-ceremony-progress.txt`
`HB_1_STATE` `HB_2_CEREMONY` `HB_3_PLAN` `HB_4_PUSH` `HB_5_REPORT` then `DONE_CLOSING_CEREMONY`
