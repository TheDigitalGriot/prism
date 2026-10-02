# STAGE CONTRACT - Prism Closing Ceremony v5.0.0

## Inputs (exact paths - working vs reference)
WORKING (edit here):
- C:/Users/digit/GriotApps/Prism                     <- source repo, branch main, HEAD bce4caa, clean, 0/0 vs origin
REFERENCE (read only, never edit):
- C:/Users/digit/GriotMeta/digital-griot-marketplace <- thin mirror, now ff-ed to origin ce917e3. BUILD ARTIFACT. Never hand-edit.
- C:/Users/digit/GriotMeta/griot-live-artifacts      <- live artifact source of truth
- C:/Users/digit/.claude/skills/griot-propagate/scripts/check.mjs <- the verifier, read-only, never writes

## Locked decisions (do not re-litigate)
D1. Version is 5.0.0. Major bump from 4.17.3. Gavin set it. Do not recompute, do not suggest 4.18.0.
D2. scripts/sync-to-marketplace.sh is Gavin-owned (D4 rule): EXECUTE it, never edit it, never reimplement it.
    It clones the marketplace remote into a temp dir and PUSHES. It has no offline mode and reads no args.
D3. The 11 blobs currently behind on ch2 are NOT fixed by hand. The release stage's sync is the only writer.
    Known-behind set: agents/codebase-analyzer.md, agents/graph-navigator.md, scripts/verify-code-intel.mjs,
    commands/create_plan.md, commands/decompose_plan.md, skills/prism-plan, prism-subagent (+references/
    review-decision-matrix.md), prism-validate, prism-decompose, spectrum.
D4. Do NOT touch the DGS #wg-data block or the drift ledger. Workgraph edits are limited to the canonical
    .prism/shared/workgraph/*.json sync that the ceremony already performs.
D5. Channels 6 (account-snapshot) and 7 (digital-griot-mcp) are OUT OF SCOPE for this ceremony. Do not
    attempt to fix them. Report only.

## Process (numbered, in order, fail-fast)
1. Emit HB_STAGE_1_START. Run the ceremony's Review and Audit gate (two-stage review + best-practices audit).
   If it fails, stop and write CEREMONY_FAILED with the reason. Do not work around a failed gate.
2. Emit HB_STAGE_2_BOOKEND. Run prism-bookend targeting version 5.0.0. It must update every version file
   (historically 13 of them) and the documentation snapshot.
3. Emit HB_STAGE_3_DOCS. Run prism-docs-update. Sync the VitePress site.
4. Emit HB_STAGE_4_RELEASE. Run prism-release. This is the stage that executes scripts/sync-to-marketplace.sh
   and pushes both the source repo and the marketplace mirror.
5. Emit HB_STAGE_5_VERIFY. Run: node C:/Users/digit/.claude/skills/griot-propagate/scripts/check.mjs --channel 2
   Then fast-forward C:/Users/digit/GriotMeta/digital-griot-marketplace to origin/main (git fetch; git merge --ff-only
   origin/main) BEFORE reading the result, because check.mjs does blob parity against that LOCAL clone and will
   report false DRIFT if the clone is stale. Re-run check after the ff.
6. Write the terminal marker.

## Success criteria (all must hold)
S1. C:/Users/digit/GriotApps/Prism/.claude-plugin/plugin.json reports version 5.0.0.
S2. git -C C:/Users/digit/GriotApps/Prism rev-list --left-right --count origin/main...HEAD returns 0 0.
S3. The marketplace remote contains a commit whose subject is a prism v5.0.0 sync.
S4. check.mjs --channel 2 prints PROPAGATE_CHECK_OK with 0 differing blobs, read AFTER the local clone is ff-ed.
S5. No file under digital-griot-marketplace was edited by hand.

## Heartbeat tokens
Append one line per token to: .prism/shared/plans/.hb-prism-ceremony
Tokens: HB_STAGE_1_START HB_STAGE_2_BOOKEND HB_STAGE_3_DOCS HB_STAGE_4_RELEASE HB_STAGE_5_VERIFY
Terminal marker file: .prism/shared/plans/.marker-prism-ceremony
Write exactly one of: CEREMONY_COMPLETE 5.0.0   |   CEREMONY_FAILED <stage> <one line reason>
