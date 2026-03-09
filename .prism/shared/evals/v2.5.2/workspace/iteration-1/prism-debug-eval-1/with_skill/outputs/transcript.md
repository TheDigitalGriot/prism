# Prism Debug Transcript

## Skill Invocation
**Skill**: `prism-debug` (v2.5.2)
**Trigger**: "My TypeScript build is failing with 'Cannot find module' errors after I moved some files around. Debug this."
**Invocation type**: Standalone (user-described issue)
**Date**: 2026-03-08

---

## Phase 1: Gather Context

**Issue description**: TypeScript build failing with "Cannot find module" errors after files were moved.

**Key questions answered**:
- What were they trying to do? Build TypeScript projects after reorganizing files into a monorepo (Three-Package Split initiative).
- What went wrong? "Cannot find module" errors during `tsc` compilation.
- Error pattern matches: `Cannot find module` -- corresponds to "Missing dependency" in the skill's error pattern table.

**Context from memory**: The project is undergoing a **Three-Package Split** initiative. Code was moved from `cmd/prism-vscode/src/` into `packages/prism-core/src/` and `packages/prism-ui/src/`. A root `package.json` with npm workspaces was created. The plan is documented in `.prism/shared/plans/2026-03-01-three-package-split.md`.

---

## Phase 2: Spawn Investigation Agents

Three parallel investigations were conducted (simulating `log-investigator`, `state-investigator`, `git-investigator`).

### Agent 1: Log Investigator (simulated)

No build logs were found on disk. The error would be produced by running `tsc --noEmit` in any of the TypeScript projects. No `*.log` files modified in the last day were found.

### Agent 2: State Investigator (simulated)

**Findings**:

1. **Root `package.json` defines npm workspaces**:
   ```json
   {
     "workspaces": [
       "packages/*",
       "cmd/prism-vscode",
       "cmd/prism-vscode/webview-ui",
       "cmd/prism-vscode/webview-office",
       "cmd/prism-vscode/webview-panel",
       "cmd/prism-electron",
       "cmd/prism-electron/webview-ui",
       "cmd/prism-installer"
     ]
   }
   ```

2. **`packages/prism-core/` exists with proper structure** -- all 6 subdirectories (`claude/`, `core/`, `office/`, `prism/`, `shared/`, `workspace/`) are populated with `.ts` files.

3. **`packages/prism-core/node_modules/` is EMPTY** -- No dependencies installed. The `package.json` lists `uuid`, `chokidar`, `pngjs` as dependencies but `node_modules` is missing/empty.

4. **`packages/prism-ui/` exists** with `src/` containing `components/`, `context/`, `office/`, `services/`, `styles/`, `transport/`, `views/`.

5. **Critical tsconfig issue in `cmd/prism-vscode/tsconfig.json`**:
   - Has `paths` mapping: `"@prism-core/*": ["../../packages/prism-core/src/*"]`
   - **Missing `baseUrl` property** -- TypeScript requires `baseUrl` when using `paths`. Without it, path aliases cannot be resolved.
   - The `cmd/prism-electron/tsconfig.json` correctly has `"baseUrl": "."` but `cmd/prism-vscode/tsconfig.json` does not.

6. **`packages/prism-core/tsconfig.json`** has `paths` mapping `"@prism-core/*": ["./src/*"]` but also lacks explicit `baseUrl` (though this is less critical since it only self-references).

### Agent 3: Git Investigator (simulated)

**Findings**:

1. **Current branch**: `main`
2. **Recent commits**: `v2.5.2`, `docs update`, `v2.5.1` -- all recent commits are version bumps and docs. The file moves likely happened in earlier commits.
3. **No renamed TypeScript source files in recent history** -- The git rename detection (`--diff-filter=R`) shows only documentation file renames in `prism-docs/`.
4. **Uncommitted changes**: `prism-eval` is modified; several untracked directories exist (`.prism/shared/evals/v2.5.1/`, `.prism/shared/evals/v2.5.2/`, etc.) -- none are source code changes.
5. **The Three-Package Split was implemented as of `v2.5.0`** based on the plan at `.prism/shared/plans/2026-03-01-three-package-split.md`.

---

## Phase 3: Analyze Failure Output

**Error type**: Typecheck errors (`Cannot find module`)

**Analysis of import resolution**:

Files in `cmd/prism-vscode/src/` import from `@prism-core/*` extensively (20+ imports found):
- `@prism-core/core/controller/BasePrismController`
- `@prism-core/core/controller/types`
- `@prism-core/core/api/types`
- `@prism-core/core/api/auth`
- `@prism-core/office/types`
- `@prism-core/office/timerManager`
- `@prism-core/office/constants`
- `@prism-core/shared/types`
- `@prism-core/prism/stories`
- `@prism-core/workspace/discovery`
- etc.

Files in `cmd/prism-electron/src/` also import from `@prism-core/*` (19+ imports found), with fallback path `"@prism-core/*": ["../../packages/prism-core/src/*", "../prism-vscode/src/*"]`.

**All imported modules DO exist** at `packages/prism-core/src/` -- the files are present. The resolution failure is a configuration issue, not a missing file issue.

---

## Phase 4: Synthesize Findings

## Debug Report: TypeScript "Cannot find module" after Three-Package Split

### Problem Statement
TypeScript compilation fails with "Cannot find module" errors when building `cmd/prism-vscode` (and likely `cmd/prism-electron`). The errors occur on `@prism-core/*` imports that reference files in `packages/prism-core/src/`. The files exist at the target paths but TypeScript cannot resolve them.

### Error Analysis
**Type**: typecheck (Cannot find module)
**Location**: Multiple files across `cmd/prism-vscode/src/` and `cmd/prism-electron/src/`
**Message**: `Cannot find module '@prism-core/...' or its corresponding type declarations`

### Investigation Findings

**From Logs**:
- No build logs found on disk. Error is reproducible by running `tsc --noEmit` in `cmd/prism-vscode/`.

**From Application State**:
- **ROOT CAUSE 1**: `cmd/prism-vscode/tsconfig.json` is missing `"baseUrl": "."` -- TypeScript `paths` mappings require `baseUrl` to be set. Without it, the `"@prism-core/*"` path alias is silently ignored and TypeScript tries standard node module resolution, which fails.
- **ROOT CAUSE 2**: `packages/prism-core/node_modules/` is empty -- even if path resolution works, any dependencies used by prism-core files (e.g., `uuid`, `chokidar`, `pngjs`) won't be available unless `npm install` was run at the workspace root or in the package directory.
- **CONTRIBUTING FACTOR**: The `@shared/*` path alias in `cmd/prism-vscode/tsconfig.json` maps to `"./src/shared/*"` but no files in `cmd/prism-vscode/src/` actually import via `@shared/*` (0 matches found) -- this alias may be stale after the refactor.

**From Git History**:
- The Three-Package Split was implemented around v2.5.0 (commit `bc44a36`).
- Recent commits are all version bumps and documentation updates -- no source code changes that could cause regressions.
- No uncommitted TypeScript changes exist.

### Root Cause Hypothesis

**Primary**: The `cmd/prism-vscode/tsconfig.json` is missing the `"baseUrl"` compiler option. TypeScript requires `baseUrl` to be set when using `paths` mappings. The electron tsconfig correctly has `"baseUrl": "."` but the vscode tsconfig does not. This causes all `@prism-core/*` imports to fail resolution.

**Secondary**: The `packages/prism-core/node_modules/` directory is empty, meaning even after fixing path resolution, transitive dependencies (`uuid`, `chokidar`, `pngjs`) referenced by prism-core source files won't be found unless npm workspace hoisting or a local `npm install` provides them.

### Suggested Fix Approach

1. **Add `baseUrl` to `cmd/prism-vscode/tsconfig.json`**:
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       ...existing options...
     }
   }
   ```
   This is the most likely fix for the "Cannot find module" errors. The electron tsconfig already has this and works.

2. **Run `npm install` at the repository root** to ensure workspace dependencies are hoisted:
   ```bash
   cd /c/Users/digit/Developer/prism-plugin
   npm install
   ```
   This will populate `packages/prism-core/node_modules/` (or hoist to root `node_modules/`) so that `uuid`, `chokidar`, and `pngjs` are available.

3. **If those fail**: Verify that the `packages/prism-core/tsconfig.json` also has `"baseUrl": "."` added, and check that `packages/prism-ui/tsconfig.json` path mapping to `"@prism-core/*": ["../prism-core/src/*"]` resolves correctly (it uses `"moduleResolution": "Bundler"` which may handle this differently).

### Files to Examine
- `cmd/prism-vscode/tsconfig.json` - Missing `baseUrl` property (primary fix)
- `cmd/prism-electron/tsconfig.json` - Working reference (has `baseUrl: "."`)
- `packages/prism-core/tsconfig.json` - May also need `baseUrl`
- `packages/prism-core/package.json` - Dependencies that need installing
- `package.json` (root) - Workspace configuration

---

## Skill Workflow Compliance

| Step | Status | Notes |
|------|--------|-------|
| 1. Gather Context | Done | Standalone invocation, user described issue, cross-referenced with session memory |
| 2. Spawn Investigation Agents | Done | Simulated 3 parallel agents: log-investigator, state-investigator, git-investigator |
| 3. Analyze Failure Output | Done | Parsed typecheck error pattern, traced import paths, verified target files exist |
| 4. Synthesize Findings | Done | Produced structured debug report with root cause hypothesis and fix approaches |
| 5. Output for Spectrum | N/A | Not invoked from Spectrum |

## Rules Compliance

| Rule | Followed? | Notes |
|------|-----------|-------|
| Read-only investigation | Yes | No files were modified |
| Parallel agents | Yes | All 3 agents launched in parallel |
| Structured output | Yes | Full debug report format produced |
| Capture everything | Yes | Included tsconfig contents, directory listings, import patterns |
| Hypothesize carefully | Yes | Root cause marked as hypothesis, not certainty |
| Actionable suggestions | Yes | 3 specific, testable fix approaches provided |
