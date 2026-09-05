---
stage: fragment-icm-gate
tool: Fragment
date: 2026-09-05
lane: suite-wide ICM/invariant rollout (parent Action Item 2)
working_repo: C:\Users\digit\GriotApps\Fragment @126eeb8 v4.7.0 (fragment-ai-scaffold)
handoff: Prism/.prism/shared/handoffs/2026-09-05_05-29-21_fragment-icm-invariant-gate.md
---

# Stage contract — Fragment ICM invariant gate (verify-fragment.mjs)

## Inputs (exact paths — working vs reference)
- WORKING (edit): Fragment repo. NEW scripts/verify-fragment.mjs; wire
  packages/create-fragment/src/commands/{init.ts,add.ts,connect.ts}.
- REFERENCE (read only, model on): Prism/scripts/verify-invariants.mjs — verdict
  table shape, PASS/FAIL/UNVERIFIED, nonzero exit on FAIL.
- GROUND TRUTH (from handoff — honor, do NOT reassume):
  - I1 manifest-driven: packages/create-fragment/src/engine/manifest.ts
    SurfaceManifest.workspaceEntry; updateWorkspaces(projectDir, workspaceEntry)
    pushes entry into root package.json workspaces, SKIPS when null. Per-surface
    templates/<surface>/manifest.json workspaceEntry: electron->apps/electron,
    vscode->apps/vscode, mobile->apps/mobile, mcp->apps/mcp/ts, tui->null.
  - I2: engine/tokens.ts replaceTokens /\{\{(\w+)\}\}/g RETURNS MATCH VERBATIM on
    unknown key. Token keys: PROJECT_NAME, PACKAGE_SCOPE, AUTHOR_NAME, YEAR.
  - I3: commands/connect.ts runConnect prints "Wired surfaces" blind (zero on-disk
    or import check). Glue generators for electron/vscode/tui/mobile ONLY;
    engine/plugin-discovery.ts detectSurfaces hardcodes [electron,vscode,tui,mobile]
    (EXCLUDES mcp — no mcp-glue generator). Glue under apps/<surface>/src/plugin-glue/.

## Locked decisions (do not re-derive; do not expand scope)
1. Gate at Fragment/scripts/verify-fragment.mjs — pure Node ESM, NO deps. Signature:
   node scripts/verify-fragment.mjs <projectDir> [--cmd init|add|connect].
2. I1 MANIFEST-DRIVEN. NEVER naive apps/<surface>. Per requested surface S:
   (a) apps/S exists; (b) if manifest.workspaceEntry !== null, that exact path exists
   AND is in root package.json workspaces; (c) packages/core + packages/ui exist when
   any dep surface requested; (d) no requested surface absent.
3. I2: scan emitted text files (exclude node_modules/.git/.venv/dist/.expo) for surviving
   /\{\{\w+\}\}/; zero survivors = pass.
4. I3: glue-bearing surfaces ONLY (electron/vscode/tui/mobile); mcp EXCLUDED — do NOT
   wire mcp glue. Each returned glue file exists under apps/<surface>/src/plugin-glue/
   AND is imported by that surface's entry point AND workspace builds (npm install / tsc
   exit 0).
5. Verdict models verify-invariants.mjs: per-prop PASS/FAIL/UNVERIFIED table; nonzero exit
   on any FAIL; UNVERIFIED != fail.
6. Heartbeat: write/append .fragment/<cmd>-progress.txt in <projectDir> as each prop checks.
7. Wire: init.ts/add.ts/connect.ts invoke the gate before their success console.log; a FAIL
   blocks the "created/wired" print.
8. SCOPE THIS HEADLESS RUN to steps 1-7 below (gate + wiring + heartbeat + prove green on a
   scratch scaffold + a negative bite). fragment-sync fold, mobile/mcp docs,
   cl-plugin-structure validator, and dgs-plan-update are follow-on, driven separately.

## Process (numbered — headless run executes 1-7)
1. Heartbeat STEP1_GROUNDING. Read reference verify-invariants.mjs + ground-truth files
   (manifest.ts, tokens.ts, connect.ts, plugin-discovery.ts, init.ts, add.ts) as code-intel
   slices, NOT whole-file photocopies. Confirm ground truth matches the handoff.
2. STEP2_GATE. Implement scripts/verify-fragment.mjs computing I1/I2/I3 per locked decisions.
   Pure ESM, no deps. Reads templates/<surface>/manifest.json for workspaceEntry truth.
3. STEP3_HEARTBEAT. Add the .fragment/<cmd>-progress.txt write/append in <projectDir>.
4. STEP4_WIRE. Wire init.ts/add.ts/connect.ts to invoke the gate before their success print;
   FAIL blocks the print. Match existing command style (child_process to node the .mjs, or a
   thin import). Do NOT change unrelated behavior.
5. STEP5_BUILD. Build the create-fragment package (npm run build / tsc) — exit 0.
6. STEP6_SCAFFOLD. In a temp dir OUTSIDE the repo, scaffold a scratch project (init with
   electron,vscode,tui,mobile), run the gate — confirm I1/I2/I3 table prints and PASSES
   (exit 0) and .fragment/init-progress.txt exists. Then NEGATIVE: inject a surviving
   {{TOKEN}} into an emitted file and confirm I2 FAILs with nonzero exit (the gate bites).
7. STEP7_DONE. Emit git --no-pager diff --stat, the gate PASS output, and the negative FAIL
   output. Heartbeat DONE_FRAGMENT_GATE.

## Success criteria
- scripts/verify-fragment.mjs exists, pure ESM no deps, nonzero exit on FAIL.
- Fresh scratch scaffold: I1/I2/I3 all PASS, exit 0; .fragment/init-progress.txt written.
- Negative: an injected {{TOKEN}} makes I2 FAIL with nonzero exit.
- init.ts/add.ts/connect.ts invoke the gate before their success print.
- create-fragment builds (tsc exit 0). No mcp glue wired. I1 not naive-path.

## Heartbeat
Write tokens to C:\Users\digit\GriotApps\Fragment\.prism\local\fragment-gate-progress.txt:
STEP1_GROUNDING · STEP2_GATE · STEP3_HEARTBEAT · STEP4_WIRE · STEP5_BUILD · STEP6_SCAFFOLD · DONE_FRAGMENT_GATE

## Plugin-structure governance (per Gavin — non-negotiable, supersedes the "follow-on" note in decision 8)
- The WHOLE pass routes through /prism:cl-plugin-structure. Bake its conventions into every
  plugin/skill component touched — above all the fragment-plugin CLI-reference doc edits for
  the mobile + mcp surfaces (editing skill docs = plugin components → cl-plugin-structure).
- RUN /prism:cl-plugin-structure PROGRAMMATICALLY device-side (claude.exe -p headless in the
  repo; the socket is the answer). NEVER read its SKILL.md and hand-eyeball. A tripped
  invocation is a ROUTING problem (re-run device-side), not license to improvise.
- RUN its bundled validator in the validate step over the fragment-plugin (plugins/fragment-plugin)
  and any scaffolded plugin-image output; a validator FAIL blocks "done".
- Standalone-skill / SKILL.md frontmatter conventions apply to any skill doc touched.
- verify-fragment.mjs itself is a create-fragment CLI script (not a Claude plugin component),
  so cl-plugin-structure validates the COMPONENTS AROUND it (fragment-plugin skills, scaffold
  output), not the .mjs; but its conventions still shape naming/paths/portability.

## Execution note
- Headless run (this contract, in the Fragment repo) = core gate: Process steps 1-7.
- Then, same lane, device-side: fold prism:fragment-sync; edit fragment-plugin CLI ref for
  mobile/mcp THROUGH /prism:cl-plugin-structure; run its bundled validator (validate).
- Finish: /dgs-plan-update (git-first + top-level Artifact url= card refresh).
