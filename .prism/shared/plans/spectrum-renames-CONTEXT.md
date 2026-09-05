# Stage Contract — Spectrum renames (Q5) + re-founding off the Ralph loop

Status: STAGED, not fired. Contract-first per Gavin. Per-rename gate: Gavin says go before any canonical flip is committed.
Author: this Cowork session, 2026-09-05. Route device-side headless (claude.exe -p) as an ICM stage-walk. Keep the plan-nod interactive in chat; only research/implement/validate go headless.

## The two halves (name them honestly)

1. THE SMALL HALF — additive rename. `icm-architect → spectrum-architect`, `prism-spectrum → spectrum`. Mechanical, validatable, reversible. New name canonical; old name kept as a resolving alias/shim so nothing breaks (I6 must show BOTH resolve).
2. THE BIG HALF — re-founding. `prism-spectrum` is currently founded on the RALPH LOOP. "Spectrum" is not just a new label; it is a re-founding of the concept. This is DESIGN work, grounded in `Prism/icm`, and it is PROPOSED for Gavin, never auto-applied. The first run produces a grounded re-founding proposal, not a rewrite.

## Inputs

WORKING (edit here, additive only):
- `C:\Users\digit\GriotApps\Prism\skills\icm-architect`  → add canonical `spectrum-architect` (dir), keep `icm-architect` as resolving alias
- `C:\Users\digit\GriotApps\Prism\skills\prism-spectrum`  → add canonical `spectrum` (dir), keep `prism-spectrum` as resolving alias
- `C:\Users\digit\GriotApps\Prism\{skills,agents,commands}` — ~31 files reference the old names (prism-spectrum: 19 files/32 lines; icm-architect: 12 files/15 lines as of 2026-09-05). Additive updates: add the new name, keep the old resolving.
- `C:\Users\digit\GriotMeta\digital-griot-marketplace\prism-plugin\skills\{icm-architect,prism-spectrum}` — packaged copies; converge with source after the rename.
- `C:\Users\digit\.claude\skills\prism-spectrum` — live standalone home; refresh from source.
- `C:\Users\digit\.claude\plugins\marketplaces\prism-marketplace\skills\{icm-architect,prism-spectrum}` — marketplace mirror.

REFERENCE (read for grounding, NEVER alter — Gavin's ruling):
- `C:\Users\digit\GriotApps\Prism\icm` — 5,347 files; the ICM/Ralph-loop methodology that grounds the griot frequency. Mentions old names in ~10 files (prism-spectrum: 4, icm-architect: 6); those stay as reference and keep resolving via the alias. READ it to ground the re-founding; do not edit a single file in it.

FROZEN (do not hand-edit — historical installs):
- `C:\Users\digit\.claude\plugins\cache\prism-marketplace\prism\{4.10.0,4.12.1,4.12.2,4.15.0}\skills\...` — version-pinned snapshots. They get the new name only when a new version is published + installed, not by editing old caches.

## Locked Decisions

- ADDITIVE ONLY. New name canonical; old name always resolves (alias dir / shim SKILL.md / kept refs). Never break the old path. I6 must pass with BOTH names.
- DO NOT ALTER `Prism/icm`. Read it freely to ground the re-founding; never edit it. The ~10 old-name refs there are reference and resolve via the alias.
- DO NOT hand-edit the 4 frozen cache snapshots.
- SMALL HALF is mechanical and may be implemented + validated in the run. BIG HALF (re-founding off the Ralph loop) is produced as a PROPOSAL only — grounded quotes from Prism/icm, the re-founding thesis, what changes conceptually — for Gavin to approve before any conceptual rewrite.
- Plugin work routes through griot-agent-architect conventions; RUN its validators (parse-frontmatter, and the plugin validator), never hand-eyeball.
- DO NOT COMMIT. Leave everything uncommitted for Gavin's review. Per-rename gate: Gavin says go before each canonical flip is committed.
- Run device-side headless (claude.exe -p) in the Prism repo. The daemon (:6767/:6780) is NOT a prerequisite — the in-process agent loads code-intel slices per step.

## Process (numbered, ICM stage-walk)

1. LOAD CONTEXT — drive the discovery agents (codebase-locator / graph-navigator over the Prism authoring surface; prism-locator over `.prism` for prior Spectrum research). Confirm the exact ref list for both names. ~2-8k tokens/step; query the graph, do not photocopy files. HEARTBEAT: STEP1_CONTEXT.
2. GROUND THE RE-FOUNDING — read the Ralph-loop material in `Prism/icm` (READ ONLY). Extract: what the Ralph loop is, how prism-spectrum is currently founded on it, and what "Spectrum" re-founds conceptually. Save grounded quotes + citations to `.prism/shared/research/2026-09-05-spectrum-refounding.md`. HEARTBEAT: STEP2_GROUND.
3. ADDITIVE RENAME — spectrum-architect (canonical) + icm-architect (alias); spectrum (canonical) + prism-spectrum (alias). Add the new dirs/SKILL.md, wire the alias so the old invocation still resolves. Additively update the ~31 authoring refs (add new, keep old). HEARTBEAT: STEP3_RENAME.
4. CONVERGE SURFACES — packaged (marketplace/prism-plugin), live home (~/.claude/skills), marketplace mirror — match source. Frozen caches untouched. HEARTBEAT: STEP4_CONVERGE.
5. VALIDATE — verify-invariants I6 shows BOTH old and new names resolve for both renames (negative control: temporarily hide the alias → I6 must FAIL, restore → PASS). Run parse-frontmatter + the plugin validator on the new skill dirs. `Prism/icm` diff = empty (prove untouched). HEARTBEAT: STEP5_VALIDATE.
6. RE-FOUNDING PROPOSAL — write the re-founding thesis (from step 2's grounding) as a proposal doc for Gavin: what Spectrum re-founds, grounded in icm quotes, what changes vs the Ralph-loop framing, open questions. DO NOT rewrite the concept yet. HEARTBEAT: STEP6_PROPOSAL.
7. REPORT — summarize: files added/aliased, I6 result, validator result, Prism/icm-untouched proof, and the re-founding proposal location. Leave everything UNCOMMITTED. HEARTBEAT: DONE_SPECTRUM_RENAME_STAGED.

## Success criteria

- Both renames additive: `spectrum-architect` and `spectrum` resolve as canonical AND `icm-architect` / `prism-spectrum` still resolve (I6 PASS, 2 new proper-name targets, negative-control verified).
- griot-agent-architect validators pass on the new skill dirs (frontmatter + plugin structure).
- `Prism/icm` byte-identical to before (git diff empty) — proven, not asserted.
- Frozen caches untouched.
- Re-founding delivered as a PROPOSAL, not an applied rewrite.
- Nothing committed; per-rename gate intact for Gavin.

## Heartbeat tokens (write to .prism/local/spectrum-progress.txt)

STEP1_CONTEXT · STEP2_GROUND · STEP3_RENAME · STEP4_CONVERGE · STEP5_VALIDATE · STEP6_PROPOSAL · DONE_SPECTRUM_RENAME_STAGED
