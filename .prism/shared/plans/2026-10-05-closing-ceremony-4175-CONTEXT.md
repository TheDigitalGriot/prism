# closing-ceremony stage - Prism v4.17.5 (2026-10-05)

One job: run prism:prism-closing-ceremony headless for v4.17.5: the patch that carries the release-tooling fixes (audit gates the shipped release at a tagged HEAD; mobile Expo package in the release add-list, commit b759217) and the docs reconciliation (c30d5a4, a476e35). Repo: C:\Users\digit\GriotApps\Prism.

## Inputs
- skills/prism-closing-ceremony/SKILL.md (+ references/review-audit-gate.md), prism-bookend, prism-docs-update, prism-release (Step 6.5), skills/prism-release/references/answers-resolution.md
- Answers: .prism/local/release-answers.json (PRISM_NONINTERACTIVE=1; full push, version 4.17.5)

## Decisions (locked)
- Full push release: push, githubRelease, docs, syncMirror true. Do not re-litigate.
- Run in the FOREGROUND, synchronously. The native builds take ~13 min: start them, then poll .prism/local/build-*.log with sleep loops inside this same run until BUILD_DONE. Do NOT end your turn while anything is backgrounded.
- Use the release skill's updated add-list (it now includes apps/prism-mobile/packages/app/package.json); do not amend after tagging.
- Upload release assets one file at a time (bulk upload 404s on this repo).
- Step 6.5 runs BOTH syncs. Never hand-edit the marketplace mirror.
- docs: CHANGELOG + snapshot + site version only; page-level docs were reconciled in c30d5a4/a476e35.
- Fail-fast; a gate failure stops the run with BLOCKED-<reason>.

## Process
1 Review & Audit gate  2 bookend  3 docs-update  4 release incl. builds, tag, push, GitHub release (all assets incl. the macOS dmg if CI has finished), Step 6.5 syncs  5 node scripts/pre-release-audit.mjs  6 verify local HEAD == origin/main, tag v4.17.5 on the release commit, marketplace prism entry 4.17.5.

## Success
All steps pass, audit fully green (the zero-scan fix is in), tree clean.

## Heartbeat
Append timestamped lines to .prism/ceremony-progress.txt: ceremony-start-4175, review-pass, bookend-done, docs-done, builds-started, versions-verified, pushed, release-done, synced-plugin, synced-marketplace, audit-pass, DONE head=<hash>. BLOCKED-<reason> on a stop.