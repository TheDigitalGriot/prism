# docs-reconcile stage - Prism v4.17.4 -> v4.17.5 (2026-10-05)

One job: reconcile the VitePress page-level docs (prism-docs/**, esp. plugin/*.md) against the code delta shipped in v4.17.4 and since v4.17.3. The earlier docs pass only updated CHANGELOG, snapshot and site version. Repo: C:\Users\digit\GriotApps\Prism.

## Inputs
- Working: prism-docs/ pages that describe plugin skills, agents, commands, scripts, versions.
- Reference (pull via code-intel graph-navigator / codebase-analyzer, never inline whole files): git diff v4.17.3..HEAD --stat limited to skills/ commands/ agents/ hooks/ scripts/; PRISM-DOCUMENTATION-4.17.4.md; skills/prism-docs-update/SKILL.md (follow its page-mapping rules).

## Decisions (locked)
- Docs only: edit prism-docs/ pages. Do NOT touch skills/, scripts/, VERSION, or version files. Do NOT bump versions, tag, or push.
- Update in place; never strip existing content. Only add/adjust what the code delta makes stale or missing.
- Every claim you add must be checkable against a path in the repo.
- Commit once at the end: "docs: reconcile plugin pages with the v4.17.x code delta" (add the Co-Authored-By trailers per repo convention: Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>).

## Process
1. List skills/agents/commands/scripts added or changed since v4.17.3 (stat + names only).
2. Map each to its docs page per prism-docs-update; list pages with a gap.
3. Patch each gap in place.
4. Build or lint the docs site if a script exists (npm run docs:build or equivalent) and fix breakage you caused.
5. git status shows only prism-docs/ edits; commit.

## Success
Every changed skill/agent/command has an accurate docs entry; docs build passes; one commit; tree clean.

## Heartbeat
Append timestamped lines to .prism/docs-reconcile-progress.txt. Tokens: start, delta-listed, gaps-mapped, patched=N, build-pass, committed=<hash>, DONE. On block: BLOCKED-<reason> then stop.