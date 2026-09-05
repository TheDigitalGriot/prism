---
stage: fragment-connect-wire-and-package
tool: Fragment
date: 2026-09-05
lane: ICM/invariant rollout — tasks 11 (connect truly wires) + 12 (gate ships in package)
working_repo: C:\Users\digit\GriotApps\Fragment @126eeb8 (gate already wired, uncommitted)
---

# Stage contract — Fragment: make `connect` truly wire (I3b) + ship the gate in the package

## Inputs (exact paths — working vs reference)
- WORKING (edit): Fragment repo.
  - packages/create-fragment/src/engine/generators/{electron,vscode,tui,mobile}-glue.ts
  - packages/create-fragment/src/commands/connect.ts
  - each surface's ENTRY POINT under templates/<surface>/ (electron main.ts + renderer.tsx;
    vscode/tui/mobile entries — GROUND the exact file per surface).
  - packages/create-fragment/package.json ("files"), tsconfig/build.
  - scripts/verify-fragment.mjs + packages/create-fragment/src/engine/gate.ts (resolveGate).
- GROUND TRUTH (verified, honor):
  - electron-glue emits src/plugin-glue/mcp-bridge.ts (exports registerPluginHandlers, doc "Call
    this from main.ts") + drive-client.ts (exports registerDriveClicks, doc "call once from
    renderer.tsx after mount"); returns relative paths. connect.ts prints wired from those returns
    with ZERO on-disk/import verification — that is the I3b hole the gate now catches.
  - Glue-bearing surfaces = electron/vscode/tui/mobile ONLY; mcp EXCLUDED (no generator;
    detectSurfaces hardcodes the four). DO NOT wire mcp glue.

## Locked decisions (do not re-derive; do not expand scope)
1. PART A (task 11): each glue-bearing surface's connect path INJECTS the import + call into that
   surface's ENTRY POINT, IDEMPOTENTLY (skip if already present — import-presence/marker check).
   electron: registerPluginHandlers → main.ts init; registerDriveClicks() → renderer.tsx after
   mount. vscode/tui/mobile: their glue exports → their entry points (ground each surface's real
   entry file + init/mount point; match existing style; NodeNext .js import specifiers).
2. Re-running `connect` must NOT duplicate injected imports/calls (idempotent).
3. Injection keeps the workspace building (tsc / npm install exit 0) and is TypeScript-correct.
4. PART B (task 12): a PUBLISHED create-fragment install must carry the gate. Copy/relocate
   verify-fragment.mjs (and the gate.ts logic it needs) INTO packages/create-fragment/ (e.g.
   packages/create-fragment/scripts/), add it to package.json "files", and make resolveGate()
   resolve the IN-PACKAGE path FIRST with the repo path as fallback. A published-like install
   (npm pack → install the tarball, or run the gate from the packaged path) runs the gate and it
   BLOCKS on FAIL (not UNVERIFIED).
5. cl-plugin-structure: in validate, run its bundled validator over plugins/fragment-plugin +
   a scaffold; CLI-package changes follow its portability/naming conventions.
6. ADDITIVE/SCOPED: do NOT reformat unrelated files, do NOT reintroduce EOL churn (respect
   .gitattributes). Touch only the files these two tasks require.

## Process (numbered — headless executes 1-8)
1. STEP1_GROUNDING: code-intel the 4 glue generators + connect.ts + each surface entry point +
   package.json/tsconfig + resolveGate. Confirm entry files + injection points. Heartbeat.
2. STEP2_INJECT: implement idempotent import+call injection into entry points for
   electron/vscode/tui/mobile (Part A). Heartbeat.
3. STEP3_PACKAGE: implement gate-in-package (Part B). Heartbeat.
4. STEP4_BUILD: npm run build / tsc exit 0 (if npm exit 1 from EMPTY ComSpec in headless env, set
   $env:ComSpec to cmd.exe and retry — known quirk, not a compile error). Heartbeat.
5. STEP5_VALIDATE_CONNECT: scratch scaffold OUTSIDE the repo (init electron,vscode,tui,mobile) →
   connect → node scripts/verify-fragment.mjs --cmd connect: I3a PASS, I3b PASS, I3c PASS/UNVERIFIED.
   Run connect TWICE → confirm NO duplicate imports (idempotent). Heartbeat.
6. STEP6_VALIDATE_PACKAGE: npm pack (or simulate a published install) → run the gate from the
   packaged path → it computes and BLOCKS on fail. Heartbeat.
7. STEP7_CLPLUGIN: run the cl-plugin-structure bundled validator over plugins/fragment-plugin +
   a scaffold; capture PASS/FAIL. Heartbeat.
8. STEP8_DONE: emit git --no-pager diff --stat (should be scoped: the generators, connect.ts,
   4 entry points, package.json, resolveGate, the relocated gate — NO EOL churn), the connect PASS
   table, and the package-gate proof. Heartbeat DONE_1112.

## Success criteria
- I3b PASSES on a scratch scaffold after connect; connect is idempotent; workspace builds.
- The gate is carried in a published-like install and BLOCKS on fail (not UNVERIFIED).
- cl-plugin-structure validator green over fragment-plugin.
- Diff is scoped; no EOL churn; no mcp glue wired; I1 still manifest-driven.

## Heartbeat tokens (append to C:\Users\digit\GriotApps\Fragment\.prism\local\fragment-1112-progress.txt)
STEP1_GROUNDING · STEP2_INJECT · STEP3_PACKAGE · STEP4_BUILD · STEP5_VALIDATE_CONNECT · STEP6_VALIDATE_PACKAGE · STEP7_CLPLUGIN · DONE_1112
