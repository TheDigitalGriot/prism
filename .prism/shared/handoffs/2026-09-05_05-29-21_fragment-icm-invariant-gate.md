---
date: 2026-09-05T05:29:21-04:00
researcher: Claude
git_commit: 126eeb8ad877d921117add11cd01fa51d1d683fc
branch: main
working_repo: C:\Users\digit\GriotApps\Fragment (fragment-ai-scaffold v4.7.0, @126eeb8)
handoff_home_repo: C:\Users\digit\GriotApps\Prism (@183cb851, where .prism lives)
topic: "Fragment · ICM invariant gate (verify-fragment.mjs) Handoff"
tags: [handoff, icm, invariants, fragment, verify-fragment, cl-plugin-structure]
status: planned
parent_handoff: .prism/shared/handoffs/2026-09-05_icm-invariant-rollout_HANDOFF.md
recon_artifact: https://claude.ai/code/artifact/f9862d5f-bbfe-43b8-a86c-ec7c9a01fd71
---

# Handoff: Ship Fragment's ICM invariant gate (verify-fragment.mjs)

## Task(s)
**Planned — the dedicated Fragment lane** of the suite-wide ICM/invariant rollout
(parent handoff Action Item 2). Fragment is foundational (it emits what Prism is), so it
gets its own session. Scope, all in ONE session so it ships:

1. **Add `verify-fragment.mjs`** — a computable gate run after `init` / `add` / `connect`
   that turns today's "created/wired" prints into a verdict over three invariants (I1/I2/I3
   below), modelled on `Prism/scripts/verify-invariants.mjs`.
2. **Heartbeat** — write `.fragment/<cmd>-progress.txt` into the scaffolded project as the
   gate checks, append per-proposition.
3. **Fold in the fragment-sync reconciliation** (the `prism:fragment-sync` skill) in the
   same session so Fragment still emits a current "Prism-image."
4. **Document the `mobile` and `mcp` surfaces** in the fragment-plugin CLI reference (both
   are VALID_SURFACES with templates+generators but undocumented).
5. **Route through `/prism:cl-plugin-structure`** (touches plugin/skill components) and run
   its bundled validator in the validate step. **Finish with `/dgs-plan-update`** to flip the
   Fragment node + the suite "preference-to-invariant shift" item to shipped.

Status: recon + full read-only codebase discovery DONE (this session). No code written yet.

## Critical References
- `Prism/scripts/verify-invariants.mjs` — the I1–I8 reference implementation to model the
  gate's shape + verdict output + exit-code contract on.
- `Prism/.prism/shared/research/2026-09-05_icm-invariant-recon.md` → section `### Fragment
  (6/12 — FOUNDATIONAL, own session)` — the invariants + the one move + findings.
- `Prism/.prism/shared/handoffs/2026-09-05_icm-invariant-rollout_HANDOFF.md` — the parent
  program (Action Item 2 = this lane; Action Item 1 = fix Prism I7 `when`-key first).

## Recent Changes
None. This session did read-only discovery against the live Fragment repo (`@126eeb8`).

## Learnings (verified against the live repo — the gate MUST honor these)

**THE headline: I1 is manifest-driven, NOT naive `apps/<surface>`.** A path-assuming gate
false-fails two surfaces. Ground truth:
- `packages/create-fragment/src/engine/manifest.ts` — `SurfaceManifest.workspaceEntry`;
  `updateWorkspaces(projectDir, workspaceEntry)` pushes that entry into root
  `package.json` `workspaces` (skips when entry is null).
- Per-surface `templates/<surface>/manifest.json` `workspaceEntry`:
  `electron→apps/electron`, `vscode→apps/vscode`, `mobile→apps/mobile`,
  **`mcp→apps/mcp/ts`** (NOT `apps/mcp`), **`tui→null`** (no workspace entry at all).
  electron/vscode/mobile also declare `dependencies: ["core","ui"]`.
- So I1 per requested surface S: (a) `apps/S/` dir exists; (b) if manifest.workspaceEntry
  !== null, that exact path exists AND is in root package.json workspaces; (c) packages/core
  + packages/ui exist when any dep surface was requested; (d) no requested surface absent.

**init monolith** — `packages/create-fragment/src/commands/init.ts` `runInit` (5 numbered
comments): (1) base→project root, (2) core→`packages/core`, (3) ui→`packages/ui`,
(4) each surface→`apps/<surface>`, read manifest, `updateWorkspaces` if entry, (5)
`npm install`. `VALID_SURFACES` = `[electron,vscode,tui,mobile,mcp]` (duplicated at
`init.ts:17` and `add.ts:16`).

**I2 token pattern** — `packages/create-fragment/src/engine/tokens.ts` `replaceTokens`
uses `/\{\{(\w+)\}\}/g` and RETURNS THE MATCH VERBATIM on an unknown key. So an unreplaced
`{{FOO}}` survives into emitted files. Token map keys: `PROJECT_NAME, PACKAGE_SCOPE,
AUTHOR_NAME, YEAR`. I2 = scan emitted text files (exclude node_modules/.git/.venv/dist/
.expo) for any surviving `{{WORD}}`; zero survivors = pass.

**I3 target — `connect.ts` blind print** — `packages/create-fragment/src/commands/
connect.ts` `runConnect`: calls the glue generators, collects returned relative file paths
into `files`, then `console.log("Wired surfaces")` straight from those return values — ZERO
on-disk-exists or import-by-entry-point check. `surfaceDir = join(projectDir,'apps',surface)`.
- `src/engine/plugin-discovery.ts` `detectSurfaces` hardcodes `[electron,vscode,tui,mobile]`
  — **EXCLUDES mcp** (correct: there is no mcp-glue generator). Glue generators exist only
  for electron/vscode/tui/mobile (`src/engine/generators/{electron,vscode,tui,mobile}-glue.ts`).
- `electron-glue.ts` emits `src/plugin-glue/mcp-bridge.ts` (exports `registerPluginHandlers`,
  doc says "Call this from main.ts") + `drive-client.ts` (exports `registerDriveClicks`, doc
  says "call once from renderer.tsx after mount"). `mcp-bridge.ts` imports
  `../../../packages/core/src/shared/types.js` — a real cross-package path the
  workspace-build half of I3 must resolve.
- So I3 (glue-bearing surfaces only = electron/vscode/tui/mobile): every returned glue file
  exists under `apps/<surface>/src/plugin-glue/` AND is imported by that surface's entry
  point (no zero-caller glue) AND the workspace `tsc`-builds / `npm install` exits 0.

**Layout facts** — Fragment root `package.json` v4.7.0, `workspaces:["packages/*"]`, one
package `create-fragment` (npm bins: `create-fragment`, `fragment`). Templates:
`templates/{base,core,ui,electron,vscode,tui,mobile,mcp}`. `fragment-plugin` is a git
submodule (`plugins/fragment-plugin`, v4.4.0; skills: `fragment`, `fragment-connect`,
`fragment-status`; `agents/connector-agent.md`; `scripts/`).

**fragment-sync lives in prism-plugin, not fragment-plugin** —
`GriotMeta/digital-griot-marketplace/prism-plugin/skills/fragment-sync/` (SKILL.md +
references). Device-side rollout infra exists at
`GriotMeta/_channel-rollout/{instructions-fragment-sync.md,launcher-fragment-sync.ps1}`.

**Gavin's npm note (verbatim intent):** `create-fragment` is published on npm and both
`fragment` + `fragment-sync` are live and analyzed on both sides. Treat the PUBLISHED CLI as
the surface under test, not just the repo working tree.

## Artifacts
- THIS handoff: `.prism/shared/handoffs/2026-09-05_05-29-21_fragment-icm-invariant-gate.md`
- (planned) `Fragment/scripts/verify-fragment.mjs`
- (planned) `.fragment/<cmd>-progress.txt` heartbeat emitted into scaffolded projects
- (planned) CLI-reference edits in `fragment-plugin` skills for mobile/mcp
- Recon visual artifact: https://claude.ai/code/artifact/f9862d5f-bbfe-43b8-a86c-ec7c9a01fd71

## Action Items & Next Steps (execution order)
1. **Write the stage-CONTEXT** at `.prism/shared/plans/fragment-icm-gate-CONTEXT.md`
   (Inputs: working repo `GriotApps/Fragment@126eeb8` vs reference `Prism/scripts/
   verify-invariants.mjs` · locked Decisions below · numbered Process · Success criteria =
   I1/I2/I3 compute + heartbeat + green scratch scaffold · Heartbeat tokens).
2. **Implement `Fragment/scripts/verify-fragment.mjs`** — pure Node ESM, no deps. Signature
   `node scripts/verify-fragment.mjs <projectDir> [--cmd init|add|connect]`. Computes:
   - I1 (manifest-driven, per rules above), I2 (surviving `{{token}}` scan), I3 (glue exists
     + imported-by-entry-point + workspace builds). Emit a per-proposition PASS/FAIL/
     UNVERIFIED table matching verify-invariants.mjs; **exit nonzero on any FAIL.**
   - Write/append `.fragment/<cmd>-progress.txt` in `<projectDir>` as each prop is checked.
3. **Wire the gate into the commands** — `init.ts`/`add.ts`/`connect.ts` invoke the gate
   before their success `console.log`; a failed verdict blocks the "created/wired" print.
4. **Fold in `prism:fragment-sync`** reconciliation (run device-side) so scaffolds stay a
   current Prism-image; capture any drift it fixes in the validate notes.
5. **Document mobile/mcp** in the fragment-plugin CLI reference skills.
6. **Route the whole pass through `/prism:cl-plugin-structure`** and run its bundled
   validator; **then `/dgs-plan-update`** to flip the Fragment node to shipped + record the
   new invariant coverage (git-first loop; card refresh is the top-level `Artifact` tool with
   `url=`, NOT the deprecated `update_artifact`).

## Other Notes
- **Method:** device-side `claude.exe -p` headless in the Fragment repo, ICM stage-walk per
  the agent-ontology CLAUDE.md; thin router prompt → the stage-CONTEXT; code-intel slices
  (graph-navigator / codebase-analyzer), never photocopy whole files. Keep to ONE tool's gate.
- **Locked decision defaults** (from the Fragment session, correct if wrong): gate at
  `Fragment/scripts/verify-fragment.mjs`; standalone runnable + invoked by the three commands;
  nonzero exit on fail; heartbeat into the scaffolded project's `.fragment/`.
- **Do NOT** naive-path I1, and **do NOT** try to wire mcp glue (no generator; excluded from
  detectSurfaces by design).
- Recon agent id for a deeper Fragment pass (continuation): `a648bd147856f2735`.
