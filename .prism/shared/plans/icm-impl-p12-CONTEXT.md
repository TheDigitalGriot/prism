# ICM Fuse + Opus 5 — Implement Stage Contract (PHASES 1-2 ONLY)

## Role
Headless in the Prism repo, branch feat/icm-fuse-opus5-multisurface. IMPLEMENT ONLY phases 1 and 2
of .prism/shared/plans/icm-fuse-opus5-PLAN.md. Do NOT start phases 3-9 (no app/mobile/mcp code this
run). Follow cl-plugin-structure conventions and run its validator. Mirror every plugin edit into
apps/prism-setup/resources/plugin/. Commit per phase (no AI/Claude attribution in the message — match
the repo's prism-commit convention). Ground edits by reading only the target files + the plan; do not
photocopy the whole repo. Do not invoke interactive skill wrappers (they hang headless).

## Inputs — working
- The plan: .prism/shared/plans/icm-fuse-opus5-PLAN.md (sections 2.2 for phase 1; 1.1, 1.2, 2.6 for phase 2)
- Phase 1 files: skills/cl-plugin-structure/references/model-config.md; skills/prism-spectrum/references/model-selection.md; skills/cl-plugin-structure/SKILL.md
- Phase 2 files: skills/icm-architect/ (references/, assets/templates/); the 9 pipeline skills at the exact insertion lines in plan §1.2; prism-validate/prism-subagent/prism-spectrum SKILL.md for the §2.6 sweep
- Mirror root: apps/prism-setup/resources/plugin/ (byte-identical copy — re-copy every changed plugin file)

## Locked decisions (Gavin — plan to these)
- Parallel opus5 key (keep opus=claude-opus-4-8 for A/B); Opus 5 is the routine ceiling.
- Opus 5 governance = effort dial + xhigh/max ONE-SHOT CONFIRM (Gavin chose option B). The confirm is an
  APP-surface control (built in phase 3), so in PHASE 1 only DOCUMENT it in model-config.md: note that
  effort xhigh|max triggers a one-shot confirm, headless-aware (auto-resolves via the resolve-answer.mjs
  pattern in non-interactive runs) and always emits a visibility event. Do NOT add a Fable-style model gate;
  do NOT add opus5 to fable-gate.sh; do NOT create opus5.flag.
- Prompting-guide sweep is SURGICAL: soften/remove only SELF-verification ("do not trust self-reported
  completion", "final verification step", re-verify-your-own-work). KEEP independent cross-agent review
  (spec-reviewer / quality-reviewer / visual-regression-grader) — those review a DIFFERENT agent's work.
  Add deterministic subagent caps (CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS, CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH;
  note Claude Code >= 2.1.217). Add a concision instruction to the shared ICM reference.

## Process (numbered)
1. Append heartbeat "start".
2. PHASE 1 (docs): make the §2.2 edits — add the Opus 5 row (claude-opus-5, 1M, 128k out, $5/$25, effort
   low..max default high), alias note, effort-matrix row + re-swept defaults, the xhigh|max confirm note,
   the ceiling reframe + re-baselined cost ratios in model-selection.md, and the SKILL.md tier table row.
   Keep the Opus 4.8 row for A/B. Re-copy each changed file into the mirror. Run `claude plugin validate .`.
   Commit. Append "phase1-done commit=<sha>".
3. PHASE 2 (ICM fuse + sweep): create skills/icm-architect/references/prism-run-contract.md and
   skills/icm-architect/assets/templates/prism-stage-CONTEXT.md (per plan §1.1). Insert the one-line ICM
   run-contract pointer at the exact line in each of the 9 skills (plan §1.2 table). Do the §2.6 surgical
   sweep + add subagent caps + concision line. Re-copy changed files into the mirror. Run
   `claude plugin validate .`. Commit. Append "phase2-done commit=<sha>".
4. Append "DONE commits=<sha1,sha2>". On any blocker, append "BLOCKED-<one-word-why>" and stop that phase
   cleanly (leave the tree committed or clean, never half-edited).

## Success criteria
- `claude plugin validate .` passes clean after each phase.
- Exactly two commits on the branch; each touches only the intended files + their mirrors.
- Live plugin file and its apps/prism-setup mirror remain byte-identical for every file changed.
- No app/mobile/mcp source touched (phases 3+ untouched); .prism/shared/evals/** untouched.

## Heartbeat tokens (append one timestamped line each to .prism/local/icm-impl-progress.txt)
start · phase1-done commit=<sha> · phase2-done commit=<sha> · DONE commits=<...> · BLOCKED-<why>
