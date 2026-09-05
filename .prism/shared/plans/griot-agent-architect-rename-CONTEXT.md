---
stage: griot-agent-architect-rename
tool: Prism / marketplace (cl-plugin-structure skill)
date: 2026-09-05
lane: tooling-governance — task 9. ADDITIVE rename, code-intel method (NOT brand-namespace-sweep).
single_writer: Prism repo (this session)
---

# Stage contract — additive rename: cl-plugin-structure → griot-agent-architect

## Method correction (honor)
brand-namespace-sweep is a BRAND-AVAILABILITY checker (domains/handles) — WRONG tool. This is a
code-intel-driven ADDITIVE rename. Use graph/codebase grounding + surgical edits. The architect
skill (cl-plugin-structure itself) governs plugin-structure conformance; run its (bug-fixed) validator.

## Inputs (exact paths)
- SOURCE skill: GriotApps/Prism/skills/cl-plugin-structure/ (SKILL.md + scripts/references)
- PACKAGED skill: GriotMeta/digital-griot-marketplace/prism-plugin/skills/cl-plugin-structure/
- REGISTRATION: GriotMeta/digital-griot-marketplace/prism-plugin/.claude-plugin/marketplace.json (+ plugin.json)
- INSTALLED CACHE: ~/.claude/plugins/cache/prism-marketplace/... (9 locations incl apps/prism-setup/resources/plugin/skills/) — the RUNNING copy.
- VALIDATOR BUG: the skill's bundled validate-agent.sh: `((warning_count++))` returns falsy at 0 → aborts under `set -euo pipefail` (spurious exit 1). FIX it.
- Footprint: 336 refs (Prism 225 mostly docs/handoffs/CHANGELOG = HISTORY; marketplace 24; live-artifacts 23; _mp 19; Fragment 10; …).

## Locked decisions (do NOT re-derive; do NOT expand scope)
1. ADDITIVE ONLY. griot-agent-architect becomes the NEW CANONICAL; cl-plugin-structure REMAINS a
   working, resolving DEPRECATION ALIAS. BOTH `prism:griot-agent-architect` and
   `prism:cl-plugin-structure` must resolve after. Never delete the old name (trips I6).
2. Distinguish AUTHORITATIVE LIVE refs (skill dir + SKILL.md frontmatter, marketplace/plugin.json
   registration, command/agent/hook invocations, griot-suite-context roster, ~/.claude/CLAUDE.md
   plugin rule, other skills' required-step mentions) from HISTORICAL PROSE (CHANGELOG, handoffs,
   past research). Update the AUTHORITATIVE live refs to the new name; LEAVE history as-is (do not
   churn 336 files).
3. CANONICAL skill = full cl-plugin-structure content, `name: griot-agent-architect`, updated
   description, VALIDATOR BUG FIXED. ALIAS skill = thin SKILL.md keeping cl-plugin-structure's
   triggers/description so it still resolves, body redirects to griot-agent-architect (still works).
4. Apply across SOURCE + PACKAGED. For the INSTALLED CACHE: do NOT hand-edit the 9 cache dirs
   (fragile, a re-sync overwrites them). Refresh the cache via the proper plugin re-sync/re-install
   mechanism. If no safe headless re-sync path exists, FLAG it (leave cache for a griot-plugin-update
   step) rather than fragile hand-edits.
5. Leave Prism/icm/ untouched (MIT port, Gavin ruled: as-is).
6. DO NOT COMMIT. Implement + validate + emit diffs; Gavin/the session reviews and commits.
7. If ADDITIVE cannot be guaranteed (old stops resolving), or pre-release-audit/I6 fails, HALT and
   report — never leave a broken plugin-resolution state.

## Process (numbered — headless executes)
1. STEP1_GROUND: code-intel enumerate cl-plugin-structure across the surfaces; classify each ref
   authoritative-live vs historical-prose; locate the validator bug. Heartbeat.
2. STEP2_CANONICAL: create skills/griot-agent-architect/ (SOURCE + PACKAGED) = full content,
   name:griot-agent-architect, description updated, validator bug FIXED. Heartbeat.
3. STEP3_ALIAS: make skills/cl-plugin-structure/ a resolving deprecation alias (SOURCE + PACKAGED). Heartbeat.
4. STEP4_REGISTER: register griot-agent-architect in marketplace.json/plugin.json; keep the old registered. Heartbeat.
5. STEP5_REFS: additively update AUTHORITATIVE live refs (griot-suite-context roster, CLAUDE.md plugin
   rule, command/agent/hook invocations, other skills' required-step mentions) to prefer the new name.
   Leave history. Heartbeat.
6. STEP6_CACHE: refresh the installed cache via a safe re-sync mechanism, or FLAG it. Heartbeat.
7. STEP7_VALIDATE: run the bug-fixed validator over the plugin; run pre-release-audit.mjs (CLEAN);
   run verify-invariants.mjs (I6 PASS, no new failures); confirm BOTH prism:griot-agent-architect and
   prism:cl-plugin-structure resolve. Record a griot_assert verdict. Heartbeat.
8. STEP8_DONE: emit git --no-pager diff --stat for Prism AND marketplace; the both-resolve proof;
   audit + I6 results; the cache disposition. Heartbeat DONE_ARCHITECT_RENAME.

## Success criteria
- BOTH names resolve (prism:griot-agent-architect canonical + prism:cl-plugin-structure alias).
- Validator bug fixed (validate-agent.sh no longer spurious-aborts at 0 warnings).
- pre-release-audit.mjs CLEAN; verify-invariants I6 PASS, no new failures.
- Diffs scoped to authoritative refs + the two skill dirs + registration; history untouched; icm/ untouched.
- Cache either safely refreshed or explicitly flagged for griot-plugin-update.
- NOT committed (left for review).

## Heartbeat tokens (append to C:\Users\digit\GriotApps\Prism\.prism\local\architect-rename-progress.txt)
STEP1_GROUND · STEP2_CANONICAL · STEP3_ALIAS · STEP4_REGISTER · STEP5_REFS · STEP6_CACHE · STEP7_VALIDATE · DONE_ARCHITECT_RENAME
