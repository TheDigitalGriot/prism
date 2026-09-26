# STAGE CONTRACT - reconcile, plan-update, push all (2026-09-23, final)

The closing-ceremony run stopped the push chain at repo 1: `digital-griot-skills` is genuinely
diverged (local `ccf4982` / remote `4521b39` / merge-base `cd19bba`). It correctly refused to
force-push or merge unilaterally. Gavin has now called it: reconcile and push everything.

Also: node **B56** was filed into the djeli branch graph after the ceremony ran, so the plan
needs one more `dgs-plan-update` pass to carry it.

## Locked decisions

1. **Reconcile with `git pull --rebase`, never a force-push.** The remote commit `4521b39` is a
   one-line doc change to `griot-output-style/output-styles/griot.md`. Rebasing local work on
   top of it republishes nothing. If the rebase CONFLICTS, STOP - do not resolve a content
   conflict unilaterally, report the conflicting hunks and stop.
2. **Never `--force` or `--force-with-lease` on any repo.** If a push is still rejected after a
   clean rebase, stop and report.
3. Use the `dgs-plan-update` skill. Do not hand-edit the plan.
4. Do NOT run `propagate.ps1` or `dgs-sync-all.ps1` - out of scope, as the last run correctly held.
5. Do NOT attempt to clear the ceremony's Review & Audit findings. They are reported, not fixed here.

## Process

1. **Commit B56.** In `griot-live-artifacts`, commit the djeli graph change that added B56
   ("node ids in prose are live handles - hover N2 and the 3D graph highlights it"). If the
   ceremony's `7b4dbed` already swept it in, say so and skip. Emit `HB_1_B56`.
2. **Reconcile `digital-griot-skills`.** `git pull --rebase origin main`. Report the rebase
   result and the resulting HEAD. On conflict: STOP, report, do not resolve. Emit `HB_2_REBASE`.
3. **`dgs-plan-update`** - one more pass, to carry B56 and anything else filed since the
   ceremony's run. Follow the skill's own rules. Emit `HB_3_PLAN`.
4. **Push, in order**, verifying `HEAD == origin` after each before moving on:
   `digital-griot-skills` -> `Prism` -> `griot-ontology` -> `griot-live-artifacts`.
   Any rejection: stop, report, never force. Emit `HB_4_PUSH`.
5. **Report** to `.prism/shared/plans/final-push-REPORT.md`: the rebase outcome, what
   dgs-plan-update changed, and a final table of all four repos with local HEAD, origin HEAD and
   whether they match. Emit `HB_5_REPORT`, then `DONE_FINAL_PUSH`.

## Success criteria

- Nothing force-pushed. No conflict resolved unilaterally.
- All four repos show `HEAD == origin`, or are reported unpushed with the exact reason.
- B56 is in the pushed state of `griot-live-artifacts`.
- `dgs-plan-update` ran as a skill.

## Heartbeats -> `.prism/final-push-progress.txt`
`HB_1_B56` `HB_2_REBASE` `HB_3_PLAN` `HB_4_PUSH` `HB_5_REPORT` then `DONE_FINAL_PUSH`
