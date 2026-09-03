# Stage contract — bring cl-plugin-structure's validators to standard THROUGH /prism:cl-plugin-structure
# 2026-09-03. Remediation: the BOM fix was hand-scripted; redo/validate it the right way + close the 3 audit residuals.
# Run device-side in the Prism repo. HARD STOP before any tag/push/release/build (same as the ceremony).

## Why
The v4.13.1 BOM fix to parse-frontmatter.sh was applied by a raw PowerShell script, not through cl-plugin-structure. Bring the change under the tool's own conventions + validator, and close the 3 residuals its Review & Audit gate logged for v4.13.1 (High: sibling validators still BOM-intolerant; Medium: prism-setup mirror stale; Low: GNU-only sed strip).

## Inputs (Prism repo: C:\Users\digit\GriotApps\Prism)
- skills\cl-plugin-structure\scripts\parse-frontmatter.sh  (already BOM-fixed; make the strip PORTABLE)
- skills\cl-plugin-structure\scripts\validate-agent.sh      (still raw-parses: head -1 must-be --- at ~:33, sed extraction ~:48)
- skills\cl-plugin-structure\scripts\validate-settings.sh   (still raw-parses ~:55)
- apps\prism-setup\resources\plugin\skills\cl-plugin-structure\scripts\parse-frontmatter.sh  (stale mirror)
- Deployed copies to keep swept: C:\Users\digit\.agents\skills\{cl-plugin-structure,plugin-settings}\scripts\parse-frontmatter.sh ; C:\Users\digit\.claude\skills\plugin-settings\scripts\parse-frontmatter.sh

## Locked decisions (ADD/adjust in place; follow cl-plugin-structure conventions)
1. Load /prism:cl-plugin-structure and treat these validator scripts as the tool to bring up to standard.
2. PORTABLE BOM strip (fixes the GNU-only residual): replace the GNU-sed `sed '1s/^\xEF\xBB\xBF//'` form with a portable one that works under BSD/macOS sed too — e.g. strip the 3 BOM bytes via `LC_ALL=C sed '1s/^\xEF\xBB\xBF//'` only if confirmed portable, otherwise use `printf`/`dd`/`tail -c +4`-guarded logic or `awk 'NR==1{sub(/^\xef\xbb\xbf/,"")}1'` — pick the form cl-plugin-structure's own patterns favor. Apply to parse-frontmatter.sh (source + all deployed copies + the prism-setup mirror).
3. HIGH residual: apply the SAME leading-BOM tolerance to validate-agent.sh (both the head -1 "must start with ---" check AND the sed extraction) and validate-settings.sh, so a BOM-prefixed file no longer hard-fails one script downstream.
4. MEDIUM residual: update apps\prism-setup\resources\plugin\skills\cl-plugin-structure\scripts\parse-frontmatter.sh to match the fixed source.
5. VALIDATE via cl-plugin-structure's bundled validators + a BOM'd sample: parse-frontmatter.sh, validate-agent.sh, validate-settings.sh all exit 0 on a BOM'd valid file and still reject a genuinely malformed one. Run `pre-release-audit.mjs` if present.
6. CHANGELOG: under a new PATCH entry (4.13.1 -> 4.13.2), note "closed the three BOM residuals logged in 4.13.1 (portable strip; validate-agent/validate-settings BOM tolerance; prism-setup mirror synced), routed through /prism:cl-plugin-structure." Bump version consistently across surfaces (reuse the bookend logic). Docs update scoped.
7. HARD STOP: LOCAL commits only. NO tag, NO push, NO GitHub release, NO native build. Leave staged for Gavin.

## Process (emit HEARTBEATs)
1. Load cl-plugin-structure. HEARTBEAT: CLPS-LOADED
2. Portable strip in parse-frontmatter.sh (source + copies + mirror). HEARTBEAT: PORTABLE-DONE
3. BOM tolerance in validate-agent.sh + validate-settings.sh. HEARTBEAT: SIBLINGS-DONE
4. Validate all three on BOM'd + malformed samples via the bundled validators. HEARTBEAT: VALIDATED <results>
5. Version bump + CHANGELOG + docs (bookend logic), LOCAL commit(s), NO tag/push/release/build. HEARTBEAT: CEREMONY <old->new>
6. Print: DONE ver=<new> commits=<shas> validators=<pass/fail>. HEARTBEAT: ALL-DONE

## Success criteria
- parse-frontmatter.sh strip is portable; validate-agent.sh + validate-settings.sh tolerate a leading BOM; prism-setup mirror matches.
- All three validators exit 0 on a BOM'd valid file, still reject malformed.
- Version bumped to 4.13.2 across surfaces; CHANGELOG closes the 3 residuals; docs updated.
- LOCAL commits only; NO tag, NO push, NO release, NO build.

## Heartbeats: CLPS-LOADED, PORTABLE-DONE, SIBLINGS-DONE, VALIDATED, CEREMONY, ALL-DONE
