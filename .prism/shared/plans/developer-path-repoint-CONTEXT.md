# developer-path-repoint — stage contract

Stage owner: Gavin. Authored 2026-09-20 from a full-repo drift sweep plus on-disk
existence checks. Everything below is verified, not inferred.

## Inputs

WORKING SET — edit these eight sites, nothing else.

| # | Path (relative to C:\Users\digit\GriotApps\Prism) | Line | Token |
|---|---|---|---|
| 1 | skills\prism-design\SKILL.md | 174, 177 | prism-design-engine |
| 2 | apps\prism-setup\resources\plugin\skills\prism-design\SKILL.md | 174, 177 | prism-design-engine (mirror of 1) |
| 3 | apps\prism-vscode\src\hosts\vscode\PrismPanelProvider.ts | 717 | prism-design-engine |
| 4 | apps\prism-design-studio\src\server.js | 11 | prism-design-engine |
| 5 | skills\prism-brainstorm\scripts\port-griotwave.cjs | 30 | SkillsForge |
| 6 | apps\prism-setup\resources\plugin\skills\prism-brainstorm\scripts\port-griotwave.cjs | 30 | SkillsForge (mirror of 5) |
| 7 | skills\prism-brainstorm\references\griotwave.md | 8 | SkillsForge |
| 8 | apps\prism-setup\resources\plugin\skills\prism-brainstorm\references\griotwave.md | 8 | SkillsForge (mirror of 7) |

REFERENCE SET — read if useful, never edit. These name Developer/ paths that
STILL EXIST on disk, so they are accurate records, not drift.

- scripts\verify-code-intel.mjs (line 10) — the incident write-up that created the guard
- PRISM-STATE-2026-06-18.md (28-30) — frozen 0.1.69 baseline, upstream clone, dead rename experiment
- apps\prism-mobile\INSTALL-DEVICE.md (63, 101, 164) — build steps against the real frozen paseo checkout
- skills\griot-agent-architect\references\folder-architecture-routing.md (236-238) + its prism-setup mirror — clief-notes-archive lesson links
- prism-docs\docs\cli\modals.md (375), prism-docs\docs\cli\screens\workspaces.md (27, 45, 48, 51) — ASCII mockups, illustrative not addresses
- apps\prism-cli\app\adapter\claude.go (175) — slug-decoding example in a comment

## Decisions (locked)

- D1. Exactly two folder-segment substitutions, nothing else:
  - `Developer/prism-design-engine` -> `GriotApps/prism-design-engine`
  - `Developer/SkillsForge` -> `GriotMeta/SkillsForge`  (subpath unchanged: griotwave\griotwave-library\_master\griotwave.tokens.json)
- D2. Verified on disk 2026-09-20 via PowerShell Test-Path:
  ABSENT  C:\Users\digit\Developer\prism-design-engine
  ABSENT  C:\Users\digit\Developer\SkillsForge
  PRESENT C:\Users\digit\GriotApps\prism-design-engine
  PRESENT C:\Users\digit\GriotMeta\SkillsForge\griotwave\griotwave-library\_master\griotwave.tokens.json
- D3. Developer\paseo, Developer\paseo-upstream, Developer\prism-mobile,
  Developer\prism-plugin and Developer\clief-notes-archive ALL still exist.
  Every reference to them is correct history and must survive this stage untouched.
- D4. Preserve each file's existing spelling style — forward vs backslash, `~` vs
  absolute, drive letter vs not. Swap the folder segment only.
- D5. The two apps\prism-setup\resources\plugin\skills\... copies must end byte-identical
  to their skills\... originals.
- D6. No restructuring, reformatting, or rewriting of surrounding content.
- D7. No commit. This stage ends at a reviewed diff.

## Process

1. Confirm each of the eight sites is still at its stated line. Use code-intel /
   graph-navigator or a targeted read per file. Do NOT re-sweep the repo.
2. Apply D1 at the eight sites.
3. Diff each prism-setup mirror against its skills\ original. Must be identical.
4. Run the griot-agent-architect bundled validator over both skills\ and
   apps\prism-setup\resources\plugin\skills\.
5. Re-run `node scripts\verify-code-intel.mjs` and report I11 through I15.
6. Report a file-by-file diff summary.

## Success criteria

- 8 sites changed; 0 reference-set sites changed.
- Repo-wide `Developer[/\\](prism-design-engine|SkillsForge)` returns zero hits.
- All three mirror pairs byte-identical.
- Validator passes with no new findings.
- verify-code-intel.mjs shows no NEW failure. I12 is EXPECTED to still fail
  (gitnexus is 32 commits / 8 days behind HEAD) — out of scope for this stage.
- Working tree modified, nothing committed.

## Heartbeat tokens

STAGE-START / SITES-CONFIRMED / EDITS-APPLIED / MIRRORS-MATCH / VALIDATOR-DONE / GUARD-RERUN / STAGE-COMPLETE
