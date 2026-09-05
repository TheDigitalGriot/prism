---
stage: griot-ontology-rename
tool: agent-ontology repo (the doctrine substrate)
date: 2026-09-05
lane: tooling-governance — task 10. ADDITIVE rename. THE most sensitive op in the program.
---

# Stage contract — additive rename: agent-ontology → griot-ontology (the doctrine)

## THE inviolable rule
Every Griot repo root and ~/.claude/CLAUDE.md import the doctrine by ABSOLUTE PATH:
`@C:\Users\digit\GriotMeta\agent-ontology\claude\CLAUDE.md`. That exact path MUST keep resolving to
the full doctrine after this run, or ~15 repos + the CLI global lose the frequency simultaneously.
If you cannot GUARANTEE + PROVE that, HALT and report — never leave a half-migrated doctrine.

## Inputs (grounded)
- REPO: GriotMeta/agent-ontology/ — its OWN git repo (HEAD cb5e81f). Contents:
  claude/CLAUDE.md (canonical), claude/desktop-preferences.md (Tier-1), propagate.ps1, README.md, .bak files.
- propagate.ps1: $canonical = the absolute agent-ontology path; copies it to ~/.claude/CLAUDE.md (full copy,
  backed up) AND prepends `@$canonical` into every GriotApps/GriotProducts repo-root CLAUDE.md (idempotent).
- Footprint: 30 git-tracked refs across repos (Prism 9, live-artifacts 5, .claude 4, dg-skills 4, Cinopsis 3,
  agent-ontology home 2, +) — classify authoritative-live vs historical-prose like the architect rename did.
- griot-suite-context (roster) references agent-ontology. The memory system is SEPARATE (do not touch).

## Locked decisions (do NOT re-derive; do NOT expand scope)
1. ADDITIVE ONLY. griot-ontology becomes the NEW CANONICAL name; the OLD absolute path
   C:\Users\digit\GriotMeta\agent-ontology\claude\CLAUDE.md MUST keep resolving to the doctrine.
   Preferred mechanism: create the canonical under a griot-ontology identity and make the old
   agent-ontology path a REDIRECT/SHIM (e.g. agent-ontology/claude/CLAUDE.md becomes `@<griot-ontology
   canonical>` so the nested @import loads the doctrine) — SINGLE source of truth = griot-ontology,
   nothing deleted, git history preserved (prefer git mv). Pick the git-cleanest safe form; if a shim
   via nested @import cannot be PROVEN to resolve, keep agent-ontology as a full working copy instead
   (accept temporary dual-content) rather than break resolution.
2. PROVE old-path resolution: after the change, demonstrate that a repo-root CLAUDE.md carrying the
   old `@...agent-ontology...` import still loads the full doctrine (trace the @import chain to the
   canonical body; a negative-control style proof like the architect rename used for I6).
3. propagate.ps1: retarget $canonical to the griot-ontology path; keep idempotent + non-destructive.
   DO NOT run propagate across the 15 repos in this pass. Leave every existing @agent-ontology import
   as-is (it resolves via the shim). Flag re-propagate as Gavin's follow-on (his action, like /griot-plugin-update).
4. Update AUTHORITATIVE-LIVE refs to griot-ontology (README, propagate.ps1 comments, griot-suite-context
   roster). Leave HISTORY (CHANGELOG, .prism/shared/**, handoffs, dated ledgers) and the 15 repo @imports.
5. Do NOT touch the memory system, Prism/icm/, or any separate repo whose own name is agent-ontology
   (check for one like the architect rename found a separate cl-plugin-structure marketplace).
6. Do NOT COMMIT. Implement + validate + emit diffs; leave for review.
7. If additive/old-path-resolution cannot be guaranteed, or verify-invariants/audit regress, HALT + report.

## Process (numbered — headless executes)
1. STEP1_GROUND: enumerate agent-ontology refs across surfaces; classify live vs history; confirm the
   @import mechanism + propagate.ps1; check for a separate agent-ontology-named repo. Heartbeat.
2. STEP2_CANONICAL: establish griot-ontology as canonical (git-clean, history-preserving), content updated
   internally (README/propagate identity → griot-ontology). Heartbeat.
3. STEP3_SHIM: make the old agent-ontology absolute path resolve to the canonical (shim/redirect). Nothing deleted. Heartbeat.
4. STEP4_PROPAGATE_SCRIPT: retarget propagate.ps1 $canonical to griot-ontology; do NOT execute it across repos. Heartbeat.
5. STEP5_REFS: additively update authoritative-live refs; leave history + the 15 repo @imports. Heartbeat.
6. STEP6_PROVE: PROVE the old @import path still loads the full doctrine (trace/negative-control). Heartbeat.
7. STEP7_VALIDATE: verify-invariants.mjs (I6 PASS, no new failures) + pre-release-audit if applicable;
   record a griot_assert verdict. Heartbeat.
8. STEP8_DONE: emit git --no-pager diff --stat (agent-ontology repo + any others touched); the old-path
   resolution proof; NOT committed. Heartbeat DONE_GRIOT_ONTOLOGY_RENAME.

## Success criteria
- griot-ontology is the canonical identity; the OLD absolute agent-ontology path STILL RESOLVES to the
  full doctrine (PROVEN, not asserted).
- propagate.ps1 retargeted; NOT executed across repos; re-propagate flagged for Gavin.
- Authoritative refs updated; history + the 15 repo @imports + memory untouched.
- verify-invariants I6 PASS, no new failures. NOT committed (left for review).

## Heartbeat tokens (append to C:\Users\digit\GriotApps\Prism\.prism\local\griot-ontology-progress.txt)
STEP1_GROUND · STEP2_CANONICAL · STEP3_SHIM · STEP4_PROPAGATE_SCRIPT · STEP5_REFS · STEP6_PROVE · STEP7_VALIDATE · DONE_GRIOT_ONTOLOGY_RENAME
