# Stage contract — Prism closing ceremony (changelog + docs ONLY), 2026-09-03
# Run device-side in the Prism repo. HARD STOP before any release/build/tag/push.

## Context
- Repo: C:\Users\digit\GriotApps\Prism (remote prism.git). HEAD already contains local commit 3bb13c6 = the cl-plugin-structure BOM fix (parse-frontmatter.sh now strips a leading UTF-8 BOM). That commit is NOT pushed.
- Goal: produce the ceremony's DOCUMENT deliverables for that fix — a semver bump + CHANGELOG entry + docs update — as a LOCAL commit for Gavin to review and ship himself.

## Locked decisions
1. Run the ceremony's Review & Audit gate over the pending change; report the verdict. If it flags something real, note it — do not silently "fix" unrelated code.
2. Version: PATCH bump only (this is a one-line validator bugfix). Apply it wherever Prism keeps its version (VERSION, package.json, .claude-plugin/plugin.json — keep them consistent).
3. CHANGELOG: add an entry under the new version — "Fixed: cl-plugin-structure/parse-frontmatter.sh now strips a leading UTF-8 BOM before frontmatter extraction, fixing recurring false 'No frontmatter found' failures on Windows-authored (BOM'd) skills. Root fix — the skills repo also gained a pre-commit BOM-strip hook + .gitattributes (eol=lf)."
4. Docs: run prism-docs-update (or the ceremony's docs step) to reflect the version/changelog. Keep it scoped to this change.
5. HARD STOP (non-negotiable): do NOT run prism-release, do NOT build native binaries/VSIX/installers, do NOT create a git tag, do NOT create a GitHub release, do NOT git push. Everything stays as LOCAL commits in the Prism repo. If a ceremony sub-step tries to trigger a release/build/push, STOP there and report — do not proceed through that gate.
6. Commit the version + changelog + docs changes locally (may be one or more commits). Leave HEAD un-pushed.

## Process (emit each HEARTBEAT on its own line)
1. Review & Audit gate over the pending fix. HEARTBEAT: AUDIT <verdict>
2. Apply PATCH version bump (all version files consistent). HEARTBEAT: VERSION <old -> new>
3. Write the CHANGELOG entry. HEARTBEAT: CHANGELOG-DONE
4. Docs update (scoped). HEARTBEAT: DOCS-DONE
5. Local commit(s); NO push/tag/release/build. Print: DONE ver=<new> commits=<shas>. HEARTBEAT: ALL-DONE

## Success criteria
- Prism version bumped by one patch, consistent across version files.
- CHANGELOG has the entry under the new version.
- Docs reflect it.
- Only LOCAL commits; NO tag, NO push, NO GitHub release, NO native build. `git tag --contains HEAD` shows no new tag; HEAD is ahead of origin (un-pushed).

## Heartbeats: AUDIT, VERSION, CHANGELOG-DONE, DOCS-DONE, ALL-DONE
