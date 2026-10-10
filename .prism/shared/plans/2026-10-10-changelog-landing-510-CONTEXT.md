# changelog-landing-510 stage: review the combined changelog diff, commit one per batch, then the Prism closing ceremony to v5.1.0

Ruled by Gavin 2026-10-10 00:41: review-then-commit with spec-reviewer + quality-reviewer over the combined diff, one commit per batch, then prism-closing-ceremony with the FULL release (push, GitHub release, both mirror syncs) at version 5.1.0.

## Inputs
- Working (repo): C:\Users\digit\GriotApps\Prism, base HEAD d31793d, branch main.
- Working (the uncommitted diff, from two batches that shared a working tree):
  - B1 haiku-5-5: apps/prism-vscode/src/core/api/claude-sdk.ts, plus Haiku 5.5 / cache-price hunks in skills/griot-agent-architect/SKILL.md and skills/griot-agent-architect/references/model-config.md.
  - B2 architect-frontmatter: skills/griot-agent-architect/SKILL.md, references/model-config.md, references/hook-events.md, references/mcp-patterns.md, examples/advanced-plugin.md.
- Working (batch contracts, the spec to review against): .prism/shared/plans/2026-10-10-changelog-haiku-5-5-CONTEXT.md and .prism/shared/plans/2026-10-10-changelog-architect-frontmatter-CONTEXT.md.
- Working (each batch's own DONE report): .prism/changelog-haiku-5-5.DONE and .prism/changelog-architect-frontmatter.DONE.
- Working (headless answers, already written): .prism/local/release-answers.json (version 5.1.0, full push).
- Reference (pull via codebase-analyzer, never inline): skills/prism-closing-ceremony/SKILL.md, skills/prism-release/SKILL.md Step 6.5, skills/prism-release/references/answers-resolution.md, scripts/pre-release-audit.mjs.

## Decisions (locked - do not re-litigate, do not ask)
1. Review first: dispatch the spec-reviewer agent (diff vs the two batch contracts) then the quality-reviewer agent over the combined diff. Fix every High finding in place. Medium and Low are recorded in the RESULT, not fixed.
2. One commit per batch. B1 commit first, then B2. Split shared files by hunk: write git diff to a patch, keep only the hunks that belong to the batch, git apply --cached, commit; repeat. A hunk that mixes both batches goes in the B2 commit and the B2 message names the B1 lines inside it. No Claude attribution lines (prism:commit convention).
3. Version is 5.1.0, not 5.0.5. Gavin ruled it. The answers file already says so; bookend must not re-derive it.
4. Full release: push, GitHub release, nativeBuilds, and BOTH mirror syncs (sync-prism-plugin.sh then sync-to-marketplace.sh). This was an explicit ask, so the mixdown release gate is satisfied.
5. Clean tree before the ceremony: move the three .prism/changelog-*.DONE markers into .prism/local/. The untracked file apps/prism-mobile/_cinopsis_batch2_proof.mjs belongs to another session: git stash push -u -- that path before the ceremony and git stash pop it after, then confirm it is back byte-identical. Never delete it.
6. Run the ceremony headless: PRISM_NONINTERACTIVE=1 is set by the launcher. Use prism-closing-ceremony; it chains bookend, docs-update, release with their own gates. Add no bypass to any gate. If review.overrideHigh would be needed, stop and write BLOCKED.
7. Push natively; judge success only by local HEAD == origin/main and the tag v5.1.0 present on origin.

## Process
1. Heartbeat landing-start. git status; record base HEAD.
2. Spec review, then quality review (agents). Fix High findings. Heartbeat review-done.
3. Split and commit B1, then B2. Heartbeat commits-done with both shas.
4. Clean the tree per decision 5. Heartbeat tree-clean.
5. Run prism-closing-ceremony. Heartbeat ceremony-done.
6. Restore the stashed proof file, verify. Run node scripts/pre-release-audit.mjs and capture the section 5 mirror lines. Heartbeat verified.
7. Write .prism/shared/plans/2026-10-10-changelog-landing-510-RESULT.md: review findings table (severity, file:line, fixed or recorded), both batch commit shas, ceremony commit + tag, GitHub release URL, mirror audit lines, ref-equality proof, proof-file restore check.

## Success criteria
- Spec and quality reviews ran; zero unresolved High.
- Two batch commits on main, then the v5.1.0 release commit and tag, all on origin (local HEAD == origin/main).
- pre-release-audit section 5 PASS for both mirrors at 5.1.0.
- apps/prism-mobile/_cinopsis_batch2_proof.mjs present and unchanged.
- RESULT written.

## Heartbeat
Append one timestamped line per step to .prism/changelog-landing-510-progress.txt. Tokens: landing-start, review-done, commits-done, tree-clean, ceremony-done, verified, DONE.
On block: BLOCKED-<short reason>, then stop.
TERMINAL MARKER: the final act is writing exactly one of .prism/local/changelog-landing-510.DONE or .prism/local/changelog-landing-510.BLOCKED containing the final heartbeat token and the release tag or the block reason.
