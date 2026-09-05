# Thin router — Spectrum renames run

You are running the Spectrum renames as an ICM stage-walk inside the Prism repo.

Load and follow the stage contract, in order, one step at a time:
  .prism/shared/plans/spectrum-renames-CONTEXT.md

Rules that override any instinct:
- ADDITIVE ONLY. Never break the old name's resolution. I6 must pass with BOTH old and new.
- READ `Prism/icm` to ground the re-founding; NEVER edit anything in it. Prove it untouched (git diff empty).
- Do NOT hand-edit the frozen version caches under ~/.claude/plugins/cache.
- The BIG HALF (re-founding off the Ralph loop) is a PROPOSAL for Gavin, not an applied rewrite.
- DO NOT COMMIT anything. Leave it all for review.
- Load only each step's inputs + code-intel slices (~2-8k tokens/step). Query the code graph; do not photocopy whole files.
- Write a heartbeat token to .prism/local/spectrum-progress.txt at the end of each step (tokens listed in the contract).

Start at STEP1_CONTEXT. Stop at DONE_SPECTRUM_RENAME_STAGED with a report.
