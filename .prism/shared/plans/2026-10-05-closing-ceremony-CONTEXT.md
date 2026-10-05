# closing-ceremony stage - Prism v4.17.4 (2026-10-05)

One job: run prism:prism-closing-ceremony headless for the committed Prism changes (7760b64, b5f0cf4: prism-codex-plan-sync forward.md/reverse.md now say top-level Artifact publish with url=). Repo: C:\Users\digit\GriotApps\Prism.

## Inputs
- Working: skills/prism-closing-ceremony/SKILL.md (+ references/review-audit-gate.md), skills/prism-bookend, skills/prism-docs-update, skills/prism-release/SKILL.md (Step 6.5), skills/prism-release/references/answers-resolution.md
- Answers: .prism/local/release-answers.json (PRISM_NONINTERACTIVE=1; full push, version 4.17.4)

## Decisions (locked)
- Full push release: push, githubRelease, docs, syncMirror all true. Do not re-litigate.
- Do NOT edit digital-griot-marketplace/prism-plugin by hand; only scripts sync it.
- Step 6.5 runs BOTH: sh scripts/sync-prism-plugin.sh then sh scripts/sync-to-marketplace.sh.
- Fail-fast: a gate failure stops the run with BLOCKED token; never skip silently.

## Process
1. Review & Audit gate  2. prism-bookend  3. prism-docs-update  4. prism-release incl. Step 6.5 syncs
5. node scripts/pre-release-audit.mjs  (section 5 mirror-freshness must pass)
6. Verify: local HEAD == origin/main, tag v4.17.4 exists, marketplace prism entry updated.

## Success
All steps pass; mirrors fresh; report short hashes.

## Heartbeat
Append timestamped lines to .prism/ceremony-progress.txt. Tokens: ceremony-start, review-pass, bookend-done, docs-done, release-done, synced-plugin, synced-marketplace, audit-pass, DONE head=<hash>. On block: BLOCKED-<reason> then stop.