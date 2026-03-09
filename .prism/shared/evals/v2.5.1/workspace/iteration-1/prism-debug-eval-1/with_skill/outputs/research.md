# Debug Report: TypeScript "Cannot find module" Errors After File Move

## Workflow Execution

**Skill Used**: `prism-debug` (skills/prism-debug/SKILL.md)
**Invocation Type**: Standalone (user-described issue)
**Date**: 2026-03-08

---

## Step 1: Gather Context

**Issue Description**: TypeScript build failing with "Cannot find module" errors after files were moved around.

**User Context**:
- Files were recently moved/reorganized
- Build now produces "Cannot find module" errors
- This is a TypeScript project with multiple sub-packages

---

## Step 2: Investigation Agents (Parallel)

### Agent 1: Log Investigator

**Findings**:
- No `.log` files found in recent modification window
- No build output logs cached on disk
- The error pattern "Cannot find module" is a TypeScript compilation error (TS2307), not a runtime error
- This is a compile-time issue, so logs would appear in terminal output during `tsc` or bundler invocation

### Agent 2: State Investigator

**Findings**:

1. **Missing `node_modules` in packages/**:
   - `packages/prism-core/node_modules` -- DOES NOT EXIST
   - `packages/prism-ui/node_modules` -- DOES NOT EXIST
   - `packages/prism-core/package.json` declares dependencies (`uuid`, `chokidar`, `pngjs`) that have never been installed
   - `packages/prism-ui/package.json` declares dependencies (`react-markdown`, `react-virtuoso`, `lucide-react`, etc.) that have never been installed

2. **Missing `baseUrl` in tsconfig.json files** (CRITICAL):
   - `packages/prism-core/tsconfig.json` uses `paths: { "@prism-core/*": ["./src/*"] }` but has **NO `baseUrl`** set
   - `packages/prism-ui/tsconfig.json` uses `paths: { "@prism-core/*": ["../prism-core/src/*"] }` but has **NO `baseUrl`** set
   - `cmd/prism-vscode/tsconfig.json` uses `paths` but has **NO `baseUrl`** set
   - `cmd/prism-electron/tsconfig.json` DOES have `"baseUrl": "."` -- this is the only one configured correctly
   - TypeScript **requires `baseUrl` to be set** for `paths` mappings to resolve. Without it, all `@prism-core/*` imports will fail with "Cannot find module"

3. **No npm workspaces configured**:
   - No root `package.json` exists
   - No workspace linking between packages
   - Each package is an island with no way to resolve cross-package imports at runtime

4. **Path alias configuration across projects**:

   | Project | `baseUrl` | `paths` | Status |
   |---------|-----------|---------|--------|
   | `packages/prism-core` | MISSING | `@prism-core/* -> ./src/*` | BROKEN |
   | `packages/prism-ui` | MISSING | `@prism-core/* -> ../prism-core/src/*` | BROKEN |
   | `cmd/prism-vscode` | MISSING | `@prism-core/* -> ../../packages/prism-core/src/*` | BROKEN |
   | `cmd/prism-electron` | `"."` | `@prism-core/* -> ../../packages/prism-core/src/*, ../prism-vscode/src/*` | OK (typecheck only) |

### Agent 3: Git Investigator

**Findings**:

1. **Recent commits** (last 10):
   ```
   9d421a4 docs update
   570fd3a v2.5.1
   bae2aeb docs update
   95d1a62 docs update
   f925103 docs update
   84cc77d docs update
   6c1bdf2 v2.5.0 eval snapshot and eval cases
   bc44a36 v2.5.0
   76fcc6b eval changes
   b9ca149 eval changes
   ```

2. **Recent changes to `packages/`** (last 5 commits):
   - `packages/prism-core/src/shared/PrismState.ts` -- 2 lines changed
   - `packages/prism-ui/src/context/PrismStateContext.tsx` -- 2 lines changed
   - These are minor edits, not the file moves that caused the issue

3. **Current working tree state**:
   - Modified (unstaged): `prism-eval`
   - Untracked: `.prism/shared/evals/v2.5.1/`
   - No uncommitted changes to TypeScript source files

4. **Branch**: `main` -- no divergence from remote

---

## Step 3: Analyze Failure Output

**Error Type**: TypeScript TS2307 -- "Cannot find module"

**Pattern Match** (from SKILL.md error patterns table):
| Pattern | Likely Cause | Investigation Focus |
|---------|--------------|---------------------|
| Cannot find module | Missing dependency | Check package.json, node_modules |

**Specific Analysis for Typecheck Errors**:

The "Cannot find module" errors after file moves are caused by a combination of:

1. **Path alias resolution failure**: `@prism-core/*` imports cannot resolve because `baseUrl` is missing from 3 of 4 tsconfig.json files. TypeScript's `paths` mapping is relative to `baseUrl`, and without it, the compiler ignores path mappings entirely.

2. **Missing dependencies**: `packages/prism-core` and `packages/prism-ui` have never had `npm install` run (no `node_modules` directories). Any imports of third-party packages (`uuid`, `chokidar`, `react-markdown`, etc.) from within those packages will fail.

3. **Self-referencing imports**: `packages/prism-core` imports from `@prism-core/*` which maps to itself (`./src/*`). This is a valid pattern but requires `baseUrl` to work.

---

## Step 4: Synthesize Findings

### Problem Statement
TypeScript build fails with "Cannot find module" errors across `packages/prism-core`, `packages/prism-ui`, `cmd/prism-vscode`, and potentially `cmd/prism-electron` after files were reorganized into a three-package split architecture.

### Error Analysis
**Type**: typecheck (TS2307)
**Location**: Any file importing via `@prism-core/*` alias
**Message**: `Cannot find module '@prism-core/...' or its corresponding type declarations`

### Investigation Findings

**From Logs**:
- No build logs on disk; error appears during `tsc --noEmit` or bundler typecheck
- Error is compile-time, not runtime

**From Application State**:
- **CRITICAL**: `baseUrl` missing from `packages/prism-core/tsconfig.json`, `packages/prism-ui/tsconfig.json`, and `cmd/prism-vscode/tsconfig.json`
- `node_modules` missing from both `packages/prism-core` and `packages/prism-ui`
- No npm workspace linking configured
- 40+ files import via `@prism-core/*` alias across the codebase

**From Git History**:
- Recent commits are docs/eval changes, not the file moves
- The three-package split (`packages/prism-core`, `packages/prism-ui`) appears to be a relatively new addition per the project memory
- The `cmd/prism-electron/tsconfig.json` has dual fallback paths (`../../packages/prism-core/src/*` and `../prism-vscode/src/*`), suggesting awareness of the migration

### Root Cause Hypothesis

The primary root cause is **missing `baseUrl` in tsconfig.json** for 3 of 4 TypeScript projects. When files were moved into the `packages/` directory structure, the `paths` aliases were added but `baseUrl` was not set. TypeScript requires `baseUrl` as the anchor point for resolving `paths` mappings. Without it, the compiler falls back to standard module resolution and cannot find the aliased paths.

A secondary contributing factor is **missing `node_modules`** in the packages directories, which would cause additional "Cannot find module" errors for third-party dependencies.

### Suggested Fix Approach

1. **Add `baseUrl` to all tsconfig.json files that use `paths`** (highest priority):
   - `packages/prism-core/tsconfig.json`: Add `"baseUrl": "."`
   - `packages/prism-ui/tsconfig.json`: Add `"baseUrl": "."`
   - `cmd/prism-vscode/tsconfig.json`: Add `"baseUrl": "."`
   - Note: Verify that existing `paths` values are correct relative to the `baseUrl`

2. **Install dependencies in packages/**:
   ```bash
   cd packages/prism-core && npm install
   cd packages/prism-ui && npm install
   ```

3. **Consider setting up npm workspaces** (longer-term):
   - Create a root `package.json` with `"workspaces": ["packages/*", "cmd/*"]`
   - This enables cross-package linking and shared dependency hoisting

4. **If those fail, verify path correctness**:
   - With `baseUrl: "."` in `packages/prism-ui/tsconfig.json`, the path `"@prism-core/*": ["../prism-core/src/*"]` resolves correctly
   - With `baseUrl: "."` in `cmd/prism-vscode/tsconfig.json`, the path `"@prism-core/*": ["../../packages/prism-core/src/*"]` resolves correctly
   - Verify each path by tracing from the tsconfig location + baseUrl to the target

### Files to Examine

- `packages/prism-core/tsconfig.json` -- Add `baseUrl`
- `packages/prism-ui/tsconfig.json` -- Add `baseUrl`
- `cmd/prism-vscode/tsconfig.json` -- Add `baseUrl`
- `cmd/prism-electron/tsconfig.json` -- Already has `baseUrl`, verify paths still correct after moves
- `packages/prism-core/package.json` -- Dependencies need installing
- `packages/prism-ui/package.json` -- Dependencies need installing

---

## Methodology Notes

This investigation followed the `prism-debug` skill workflow:
1. **Gather Context** -- Identified standalone invocation, collected issue description
2. **Spawn Investigation Agents** -- Simulated 3 parallel agents (log-investigator, state-investigator, git-investigator) by running their investigation scopes concurrently
3. **Analyze Failure Output** -- Matched error pattern to known causes, parsed typecheck error specifics
4. **Synthesize Findings** -- Combined all agent results into structured debug report with root cause hypothesis and actionable fix approach

**Read-only investigation**: No source files were modified during this debug session.
