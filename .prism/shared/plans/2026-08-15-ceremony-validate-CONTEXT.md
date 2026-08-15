# validate stage — headless-aware release cycle (Prism)

One job: prove the answer-injection is CORRECT and ADDITIVE without running a real release. Verify the resolver, the gate wiring, interactive-path preservation, and conformance. Do NOT run the full closing ceremony (it would bump/edit the repo). No commit, no version bump.

## Inputs
- Working: .prism/shared/plans/2026-08-15-ceremony-implement-CONTEXT.md and the current git diff (scripts/resolve-answer.mjs, scripts/release-answers.template.json, scripts/release-answers.full-push.example.json, skills/prism-release/references/answers-resolution.md, .gitignore, the four edited SKILLs + skills/prism-closing-ceremony/references/review-audit-gate.md).
- Reference: .prism/shared/research/2026-08-15-headless-release-cycle-research.md — its §1 gate-inventory table IS the coverage checklist.

## Decisions (locked — do not ask)
- Validate the mechanism statically + via the resolver self-test. Do NOT invoke bookend/docs-update/release. No commit, no bump.

## Process
1. Resolver: run scripts/resolve-answer.mjs self-test (node). Then confirm: with an answers object lacking push, resolve(push) is false (fail-closed); with version set, resolve returns it; discovery precedence (--answers arg → PRISM_RELEASE_ANSWERS → .prism/local/release-answers.json) works; tagCollision defaults to abort.
2. Gate coverage: for EVERY gate in the research §1 table (G0-A..E, B1-4, D-A..C, R1-11), grep the matching SKILL and confirm it carries the PRISM_NONINTERACTIVE resolve-or-prompt preamble with the correct key + safe default. List any gate missing wiring.
3. Interactive intact: confirm each preamble is guarded by the env check so the gate still prompts when PRISM_NONINTERACTIVE is unset.
4. Destructive fail-closed: push, githubRelease, syncMirror resolve to false when omitted; tagCollision to abort.
5. The one literal AskUserQuestion (prism-release Step 1) is wrapped: headless resolves version/confirmVersion; TTY still asks.
6. cl-plugin-structure: claude plugin validate . passes.
7. Write .prism/shared/validation/2026-08-15-ceremony-validation.md: PASS/FAIL per check + a gate-coverage table + verdict (SHIP or NEEDS-WORK). Remove any throwaway test answers file you created.

## Success criteria
- resolver self-test + fail-closed checks green
- every research-table gate has correct wiring (or the report lists the gaps)
- interactive path unchanged; validator passes; nothing committed

## Heartbeat
Append one timestamped line to .prism/ceremony-validate-progress.txt per step. Tokens: validate-start, resolver-tested, gate-coverage, interactive-check, ran-cl-plugin-structure, wrote-report, DONE verdict=SHIP, DONE verdict=NEEDS-WORK. On block: BLOCKED-<short reason> then stop.