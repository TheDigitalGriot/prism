# Debug Report: TypeScript "Cannot find module" Errors After File Moves

## Problem Statement
TypeScript build is failing with "Cannot find module" errors after files were reorganized. The codebase underwent a major refactoring where shared source files were extracted from `cmd/prism-vscode/src/` into a new `packages/prism-core/src/` package as part of a "Three-Package Split" architecture initiative.

## Error Analysis
**Type**: typecheck (Cannot find module)
**Location**: Multiple files across `cmd/prism-vscode/src/` and `cmd/prism-electron/src/`
**Message**: `Cannot find module '@prism-core/...'` (and potentially `@shared/...`)

## Investigation Findings

### From Logs
- No build log files found in the repository (no `*.log` files in project root or cmd directories)
- Build scripts use `tsc --noEmit` for typechecking in `packages/prism-core/package.json`
- No captured error output available; diagnosis based on configuration analysis

### From Application State

**Finding 1: `packages/prism-core/` has no `node_modules/`**
- `packages/prism-core/package.json` declares dependencies on `uuid`, `chokidar`, `pngjs` and devDependencies on `typescript`, `@types/node`, `@types/uuid`, `@types/pngjs`
- The `node_modules/` directory does NOT exist under `packages/prism-core/`
- This means `npm install` was never run for the prism-core package
- Any file in prism-core that imports `uuid`, `chokidar`, or `pngjs` will fail with "Cannot find module"

**Finding 2: `packages/prism-core/src/index.ts` does not exist**
- `package.json` declares `"main": "src/index.ts"` and `"types": "src/index.ts"`
- No `index.ts` barrel export file exists at the package root
- This would cause errors if any consumer tries to import `@prism/core` directly (though current imports use deep paths like `@prism-core/office/types`)

**Finding 3: `cmd/prism-vscode/src/shared/` is an empty directory**
- The vscode tsconfig.json still defines `"@shared/*": ["./src/shared/*"]`
- The `src/shared/` directory exists but is completely empty (all files were moved to `packages/prism-core/src/shared/`)
- No current imports use `@shared/` (0 matches), so this is a stale config entry rather than an active error source

**Finding 4: Path alias resolution depends on tsconfig `paths` only (no npm workspaces)**
- No root `package.json` exists; no npm workspaces are configured
- `cmd/prism-vscode/tsconfig.json` maps `@prism-core/*` to `../../packages/prism-core/src/*` (correct relative path)
- `cmd/prism-electron/tsconfig.json` maps `@prism-core/*` to `["../../packages/prism-core/src/*", "../prism-vscode/src/*"]` (fallback chain)
- `packages/prism-core/tsconfig.json` maps `@prism-core/*` to `./src/*` (self-referencing for internal compilation)
- Path aliases are type-only; at runtime, a bundler or build step must also resolve these paths

**Finding 5: Import counts show heavy cross-package dependency**
- 44 `@prism-core/` import occurrences across 19 files in `cmd/prism-vscode/src/`
- 20 `@prism-core/` import occurrences across 5 files in `cmd/prism-electron/src/`
- All resolve to `packages/prism-core/src/` which exists and has the expected module structure (core/, claude/, office/, prism/, shared/, workspace/)

### From Git History
- Recent commits are documentation updates (`docs update`, `v2.5.1` tag)
- The Three-Package Split plan was written on 2026-03-01 and is "awaiting user approval"
- The `packages/prism-core/` directory was created around 2026-03-01 based on file timestamps
- No git-tracked renames of TypeScript source files appear in the last 10 commits (only doc file renames)
- This suggests the file moves may have been done as add+delete rather than git mv, or occurred in earlier commits

## Root Cause Hypothesis

The most likely root cause is a combination of two issues:

1. **Missing `node_modules/` in `packages/prism-core/`**: The package declares dependencies (`uuid`, `chokidar`, `pngjs`, `typescript`) but `npm install` was never run. When TypeScript compiles files in `prism-core/src/` that import these third-party modules, it will emit "Cannot find module" errors. Since both `cmd/prism-vscode` and `cmd/prism-electron` resolve `@prism-core/*` to these files, the errors cascade to all consumers.

2. **No npm workspace linkage**: There is no mechanism (workspaces, symlinks, or package-level dependency) connecting the three packages. The tsconfig `paths` configuration handles type resolution for `@prism-core/*` imports during compilation, but if either consumer's TypeScript compilation transitively checks `prism-core` files that import third-party modules, those modules won't resolve because `prism-core` has no `node_modules/`.

A secondary (lower probability) cause: if any source files were moved but their import paths were not updated to use `@prism-core/` instead of relative paths, those imports would break.

## Suggested Fix Approach

1. **Install dependencies for `packages/prism-core/`**:
   ```bash
   cd packages/prism-core
   npm install
   ```
   This is the most likely immediate fix -- it installs the third-party modules that prism-core source files depend on.

2. **Create `packages/prism-core/src/index.ts`** barrel export:
   ```typescript
   // Re-export all public modules
   export * from './shared/types';
   export * from './shared/PrismMessage';
   // ... etc for each submodule
   ```
   This aligns with the `package.json` main/types declaration.

3. **Consider setting up npm workspaces** by creating a root `package.json`:
   ```json
   {
     "name": "prism-plugin",
     "private": true,
     "workspaces": ["packages/*", "cmd/prism-vscode", "cmd/prism-electron"]
   }
   ```
   This would allow `npm install` at the root to link all packages and install all dependencies.

4. **Clean up stale `@shared/*` path alias** in `cmd/prism-vscode/tsconfig.json`:
   - Remove `"@shared/*": ["./src/shared/*"]` since `src/shared/` is empty and no imports use it
   - Or remove the empty `src/shared/` directory entirely

5. **If relative imports still exist**, search for any `from '../../../` style imports that cross package boundaries and convert them to `@prism-core/` aliases.

## Files to Examine
- `packages/prism-core/package.json` - needs `npm install` run
- `packages/prism-core/tsconfig.json` - verify path alias self-reference
- `packages/prism-core/src/index.ts` - missing, should be created
- `cmd/prism-vscode/tsconfig.json:14-17` - stale `@shared/*` path alias
- `cmd/prism-electron/tsconfig.json:14-15` - fallback path chain for `@prism-core/*`
- `cmd/prism-vscode/src/shared/` - empty directory (files moved to prism-core)
