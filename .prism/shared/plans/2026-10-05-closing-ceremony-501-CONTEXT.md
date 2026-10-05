# closing-ceremony stage - Prism v5.0.1 (2026-10-05)

Gavin's decision (final, do not re-litigate, do not ask): the release is 5.0.1. The never-run Oct 1 contract (.prism/shared/plans/closing-ceremony-prism-5.0.0-CONTEXT.md) is superseded: its scope ships here under 5.0.1. v4.17.4 is already public; 5.0.1 follows it.

## Inputs
- WORKING: C:/Users/digit/GriotApps/Prism (main). REFERENCE read-only: C:/Users/digit/GriotMeta/digital-griot-marketplace (build artifact, never hand-edit), C:/Users/digit/.claude/skills/griot-propagate/scripts/check.mjs (verifier, read-only).
- Skills: prism-closing-ceremony, prism-bookend, prism-docs-update, prism-release (Step 6.5), skills/prism-release/references/answers-resolution.md.
- Answers: .prism/local/release-answers.json (PRISM_NONINTERACTIVE=1, full push, version 5.0.1).
- Scope shipping in this release: everything on main since v4.17.4: audit gates the shipped release at a tagged HEAD, mobile package in the release add-list (b759217), docs reconciliation (c30d5a4, a476e35), plus the Oct 1 contract's scope: the ch2 propagation blobs behind in the marketplace mirror (agents/codebase-analyzer.md, agents/graph-navigator.md, scripts/verify-code-intel.mjs, commands/create_plan.md, commands/decompose_plan.md, skills/prism-plan, prism-subagent, prism-validate, prism-decompose, spectrum) reach the mirror ONLY through the release sync.

## Locked decisions
- Version 5.0.1 via bump-version.py --set 5.0.1 (never hand-edit VERSION). Skip bookend's own echo > VERSION.
- Full push: push, githubRelease, docs, syncMirror all true. Execute scripts/sync-to-marketplace.sh and scripts/sync-prism-plugin.sh; never edit or reimplement them.
- Do NOT touch the DGS #wg-data block or the drift ledger. Channels 6 and 7 of the propagate check are out of scope: report only.
- Run FOREGROUND and synchronous. Native builds take ~13 min: launch them with a Windows-native detached process (PowerShell Start-Process, NOT setsid) writing .prism/local/build-501.log, then poll with sleep loops inside this same run until BUILD_DONE. Never end your turn while anything is backgrounded.
- Upload GitHub release assets one file at a time (bulk upload 404s). Include the macOS dmg if CI has finished.
- Use the release skill's add-list (includes apps/prism-mobile/packages/app/package.json); no amend after tagging.
- Fail-fast; a gate failure stops with BLOCKED-<reason>.

## Process
1 Review & Audit gate  2 bookend (5.0.1)  3 docs-update  4 prism-release: builds, verify embedded versions, commit, tag v5.0.1, push, GitHub release + assets, Step 6.5 both syncs, eval snapshot (own commit)  5 node scripts/pre-release-audit.mjs fully green  6 git fetch + ff-only merge C:/Users/digit/GriotMeta/digital-griot-marketplace to origin/main, then node C:/Users/digit/.claude/skills/griot-propagate/scripts/check.mjs --channel 2 must print PROPAGATE_CHECK_OK with 0 differing blobs  7 verify local HEAD == origin/main (rev-list --left-right --count origin/main...HEAD = 0 0), tag v5.0.1 on the release commit, plugin.json = 5.0.1, marketplace prism entry = 5.0.1.

## Heartbeat (.prism/ceremony-progress.txt)
ceremony-start-501, review-pass, bookend-done, docs-done, builds-started, versions-verified, pushed, release-done, synced-plugin, synced-marketplace, audit-pass, propagate-ok, DONE head=<hash>. BLOCKED-<reason> on a stop.