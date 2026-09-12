# STAGE CONTRACT - prism-codex-plan-sync propagation-gate fold-in (2026-09-12)

## Inputs (exact paths)
- WORKING FILE A (edit in place): C:\Users\digit\GriotApps\Prism\skills\prism-codex-plan-sync\references\mechanics.md  (84 lines)
- WORKING FILE B (one targeted correction only): C:\Users\digit\GriotApps\Prism\skills\prism-codex-plan-sync\SKILL.md  (86 lines)
- REFERENCE, the doctrine just locked: C:\Users\digit\GriotMeta\griot-ontology\claude\CLAUDE.md -> section THE UNGATED PROPAGATION TARGET, invariant I11
- REFERENCE, conventions + validator: the griot-agent-architect skill (Prism v4.17.0)

## Locked decisions
- D1 ADD IN PLACE ONLY. Never strip, reorder or reword existing content. Both files are correct; you are extending and making one factual correction.
- D2 This is a PLUGIN skill, so griot-agent-architect conventions and its bundled validator apply.
- D3 Do not touch forward.md or reverse.md.
- D4 Do not change the frontmatter model or effort fields.

## Process (numbered)
1. Read both working files fully. Emit STAGE2-READ.
2. Invoke griot-agent-architect for plugin-skill conventions. Emit STAGE2-ARCH.
3. In mechanics.md, REPLACE the section heading Codex artifact freshness and generalise it, keeping its existing two sentences intact inside the new section. New section name: Propagation targets - every copy needs a gate (invariant I11). Add above the existing sentences:
   - The law: a propagation target is any copy that something WRITES TO and nothing CHECKS. Before claiming a codex or plan is synced, ENUMERATE every target holding a copy of what changed and NAME the gate for each. A target with no named gate is STALE BY DEFAULT. This is invariant I11 in the ontology; four instances have been found, the fourth measured 2026-09-12.
   - This skill's own targets, as a list: the codex HTML in griot-live-artifacts (gate: git commit), the live gallery card (gate: the top-level Artifact publish), .prism/shared/plans/<plan>.md (gate: the epic back-link), .prism/stories/stories.json (gate: stable STORY-NNN ids), and the DGS master ITEMS[] decision row (gate: the dgs-plan-update loop).
   Emit STAGE2-LAW.
4. CORRECTION, both files. The call named SendUserFile then update_artifact is DEAD - update_artifact and create_artifact are deprecated and frequently unmounted in cloud. The live socket is the TOP-LEVEL Artifact tool: republish the same file path to keep the URL, or pass url= to update from another conversation. Fix this in mechanics.md (the Codex artifact freshness sentences) and in SKILL.md (the Reverse section, the phrase re-push the codex artifact). Keep the surrounding sentence structure; change only the call being named. State explicitly that BOTH halves are required: the griot-live-artifacts commit AND the Artifact publish. Emit STAGE2-FIX.
5. Run the griot-agent-architect bundled validator against the skill. Emit STAGE2-VALIDATE with its verdict.
6. Report final line counts for both files and list every section touched. Emit STAGE2-DONE.

## Success criteria
- mechanics.md line count strictly INCREASED from 84; SKILL.md not decreased from 86.
- The strings invariant I11, STALE BY DEFAULT, and Artifact all appear in mechanics.md.
- Neither file still contains the token update_artifact.
- All other sections of mechanics.md remain, in the same order.
- forward.md and reverse.md are untouched.
- The validator passes.

## Heartbeat
Append each token on its own line to C:\Users\digit\GriotApps\Prism\.prism\local\stage2-progress.txt.
Tokens in order: STAGE2-READ STAGE2-ARCH STAGE2-LAW STAGE2-FIX STAGE2-VALIDATE STAGE2-DONE