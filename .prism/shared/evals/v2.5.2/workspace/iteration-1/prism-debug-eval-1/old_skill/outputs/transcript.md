# Prism Debug Transcript (v2.4.8 Baseline)

**Task**: "My TypeScript build is failing with 'Cannot find module' errors after I moved some files around. Debug this."
**Skill Version**: v2.4.8-snapshot (`prism-debug/SKILL.md`)
**Date**: 2026-03-08
**Mode**: Standalone invocation (simulated)

---

## Phase 1: Gather Context

**Invocation type**: Standalone (user-described issue)
**User description**: TypeScript build failing with "Cannot find module" errors after file moves.
**Key question**: Which TypeScript project(s) are affected? What files were moved?

Identified TypeScript sub-projects in this monorepo:
1. `cmd/prism-vscode/` — VSCode extension host
2. `cmd/prism-electron/` — Electron main process
3. `cmd/prism-vscode/webview-ui/` — VSCode sidebar chat
4. `cmd/prism-vscode/webview-panel/` — VSCode bottom panel
5. `cmd/prism-vscode/webview-office/` — VSCode canvas office
6. `cmd/prism-electron/webview-ui/` — Electron IDE shell
7. `packages/prism-core/` — Shared core package
8. `packages/prism-ui/` — Shared UI components
9. `prism-eval/` — Evaluation tool (Electron app)

The monorepo uses npm workspaces (root `package.json` defines workspaces). The `packages/prism-core` and `packages/prism-ui` directories are recent creations (part of the "Three-Package Split" initiative documented in session memory).

---

## Phase 2: Spawn Investigation Agents (Simulated)

Per the v2.4.8 skill, three agents should be spawned in parallel:

### Agent 1: Log Investigator
- **Action**: Searched for `*.log` files containing "Cannot find module"
- **Finding**: No log files found with "Cannot find module" errors
- **Note**: TypeScript compilation errors typically appear on stdout/stderr, not log files

### Agent 2: State Investigator
- **Action**: Examined tsconfig.json files, package.json files, and node_modules state
- **Findings**:
  - Root `package.json` defines npm workspaces: `packages/*`, `cmd/prism-vscode`, `cmd/prism-electron`, etc.
  - `node_modules/@prism/` exists at root level with `core` and `ui` symlinks (workspace linking is working)
  - `packages/prism-core/package.json` names the package `@prism/core`
  - **VSCode tsconfig** (`cmd/prism-vscode/tsconfig.json`): Has `paths` mapping for `@prism-core/*` but does NOT have `baseUrl` set. TypeScript requires `baseUrl` when using `paths`. However, newer TS versions (5.x) allow `paths` without `baseUrl`.
  - **Electron tsconfig** (`cmd/prism-electron/tsconfig.json`): Has `baseUrl: "."` AND `paths` for `@prism-core/*` with a fallback chain: `["../../packages/prism-core/src/*", "../prism-vscode/src/*"]`
  - **prism-core tsconfig** (`packages/prism-core/tsconfig.json`): Self-referencing `paths` for `@prism-core/*`
  - **prism-ui tsconfig** (`packages/prism-ui/tsconfig.json`): Uses `moduleResolution: "Bundler"` and `module: "ESNext"` — different module strategy than the others (CommonJS)
  - **prism-eval tsconfig** (`prism-eval/tsconfig.json`): No `paths` mappings, no `@prism-core` references. Has `skipLibCheck: false` by default (not set), causing `@types/node` version mismatch errors.

### Agent 3: Git Investigator
- **Action**: Checked recent commits and uncommitted changes
- **Findings**:
  - Last 5 commits are documentation/version bumps (v2.5.0 through v2.5.2)
  - `prism-eval` has uncommitted modifications (shown in `git status` as `m prism-eval`)
  - The `packages/` directory was created as part of the Three-Package Split initiative
  - Files were moved FROM `cmd/prism-vscode/src/*` TO `packages/prism-core/src/*` and `packages/prism-ui/src/*`
  - Both `@prism-core/*` path aliases point to `packages/prism-core/src/*`

---

## Phase 3: Analyze Failure Output

Ran `tsc --noEmit` across all TypeScript sub-projects:

| Project | Result | Error Type |
|---------|--------|------------|
| `cmd/prism-vscode` | PASS | None |
| `cmd/prism-electron` | PASS | None |
| `cmd/prism-vscode/webview-ui` | PASS | None |
| `cmd/prism-vscode/webview-panel` | PASS | None |
| `cmd/prism-vscode/webview-office` | PASS | None |
| `cmd/prism-electron/webview-ui` | PASS | None |
| `packages/prism-core` | PASS | None |
| `packages/prism-ui` | FAIL | `TS18047: 'panRef.current' is possibly 'null'` (2 errors in AgentLabels.tsx) |
| `prism-eval` | FAIL | `@types/node` / `@types/babel__traverse` version incompatibility (100+ errors) |

**Key observation**: No "Cannot find module" errors were found in any project at this time. The `@prism-core/*` path aliases are resolving correctly across all projects. The errors that DO exist are:
1. `packages/prism-ui` — Strict null check issue (not a module error)
2. `prism-eval` — Type definition version mismatch (not a module error)

---

## Phase 4: Synthesize Findings — Debug Report

## Debug Report: TypeScript "Cannot find module" After File Moves

### Problem Statement
User reports TypeScript build failing with "Cannot find module" errors after moving files around, likely related to the Three-Package Split initiative that moved code from `cmd/prism-vscode/src/` into `packages/prism-core/src/` and `packages/prism-ui/src/`.

### Error Analysis
**Type**: Module resolution (reported by user) — but NOT reproduced on current HEAD
**Location**: Unable to reproduce "Cannot find module" errors in any sub-project
**Message**: All `tsc --noEmit` runs either pass or fail with unrelated errors

### Investigation Findings

**From Logs**:
- No log files contain "Cannot find module" errors
- TypeScript errors are transient (stdout/stderr only)

**From Application State**:
- npm workspace linking is functioning: `node_modules/@prism/core` and `node_modules/@prism/ui` exist as symlinks
- All `tsconfig.json` `paths` mappings resolve to existing directories
- `packages/prism-core/src/` contains the expected subdirectories: `claude/`, `core/`, `office/`, `prism/`, `shared/`, `workspace/`
- VSCode tsconfig lacks `baseUrl` but uses `paths` — works in TS 5.x but could cause issues with older tooling
- Electron tsconfig has a fallback path chain (`packages/prism-core` then `prism-vscode/src`) providing resilience

**From Git History**:
- Recent commits are version bumps and docs (v2.5.0 through v2.5.2)
- The Three-Package Split moved files from `cmd/prism-vscode/src/*` to `packages/prism-core/src/*`
- `prism-eval` has uncommitted modifications

### Root Cause Hypothesis

The "Cannot find module" errors were likely **transient** and caused by one of these scenarios:

1. **Stale node_modules**: After moving files and adding workspace references, `npm install` needs to be re-run to create/update the `@prism/core` and `@prism/ui` symlinks in `node_modules/`. If the user ran `tsc` before `npm install`, the path aliases would resolve via tsconfig but runtime/compile-time module resolution would fail.

2. **IDE cache**: TypeScript language server caches module resolution. After moving files, the TS server may report stale "Cannot find module" errors until restarted (`Developer: Restart TS Server` in VSCode).

3. **Missing `baseUrl` in VSCode tsconfig**: The `cmd/prism-vscode/tsconfig.json` has `paths` without `baseUrl`. While TS 5.x supports this, some build tooling or older TS versions require `baseUrl` to be set for `paths` to work.

4. **prism-eval has no `@prism-core` path mapping**: If code was moved that `prism-eval` imports, it would get "Cannot find module" errors since its tsconfig has no `@prism-core` path alias.

### Suggested Fix Approach
1. **Run `npm install` at repo root** — ensures workspace symlinks are current
2. **Restart TypeScript language server** in IDE (`Ctrl+Shift+P` > "TypeScript: Restart TS Server")
3. **Add `baseUrl: "."` to `cmd/prism-vscode/tsconfig.json`** for robustness with `paths`
4. **Add `skipLibCheck: true` to `prism-eval/tsconfig.json`** to fix the `@types/node` version mismatch errors
5. **Fix the null-check in `packages/prism-ui/src/office/components/ui/AgentLabels.tsx:46-47`** — add null guard for `panRef.current`

### Files to Examine
- `cmd/prism-vscode/tsconfig.json` — missing `baseUrl`, has `paths` for `@prism-core/*`
- `cmd/prism-electron/tsconfig.json` — has `baseUrl` and fallback path chain
- `packages/prism-core/tsconfig.json` — self-referencing `@prism-core/*` paths
- `packages/prism-ui/src/office/components/ui/AgentLabels.tsx:46-47` — null-check errors
- `prism-eval/tsconfig.json` — no `@prism-core` paths, missing `skipLibCheck`
- `package.json` (root) — npm workspaces configuration

---

## Execution Notes

### Workflow Steps Followed (v2.4.8)
1. **Gather Context** (Step 1) — Identified standalone invocation, understood issue description
2. **Spawn Investigation Agents** (Step 2) — Simulated three parallel agents: log-investigator, state-investigator, git-investigator
3. **Analyze Failure Output** (Step 3) — Ran `tsc --noEmit` on all 9 sub-projects, parsed error types
4. **Synthesize Findings** (Step 4) — Produced structured debug report with hypothesis and fix suggestions
5. **Output for Spectrum** (Step 5) — Not applicable (standalone invocation, not Spectrum)

### Observations About v2.4.8 Skill
- The skill correctly guides investigation into three parallel areas (logs, state, git)
- The error pattern table in the skill correctly maps "Cannot find module" to "Missing dependency — Check package.json, node_modules"
- The skill does NOT provide guidance on checking tsconfig `paths` resolution specifically
- The skill does NOT suggest running the actual build to reproduce the error
- The "Quick Reference" section provides useful command templates for investigation
- Agent model assignments (all Haiku) are appropriate for the lookup-oriented tasks
