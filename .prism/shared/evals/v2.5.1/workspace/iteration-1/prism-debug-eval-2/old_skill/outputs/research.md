# Debug Report: npm test failing with 3 test failures after last commit

## Execution Log

### Skill Version
v2.4.8 (BASELINE) — `skills/prism-debug/SKILL.md`

### Workflow Steps Followed

1. **Gather Context** (standalone invocation)
2. **Spawn Investigation Agents** (3 parallel agents simulated)
3. **Analyze Failure Output** (test failure category)
4. **Synthesize Findings** (structured report below)

---

## Problem Statement

`npm test` is failing with 3 test failures after the last commit (v2.5.1, `570fd3a`). Tests were passing before this commit on the previous version (v2.5.0).

## Error Analysis

**Type**: test
**Location**: `cmd/prism-vscode/` (npm test target)
**Message**: 3 test assertions failing (simulated — exact error output not available from `npm test` execution)

## Investigation Findings

### Agent 1: Log Investigator (haiku)

**Task**: "Investigate recent logs for errors related to: npm test failing with 3 test failures after the last commit."

**Findings**:
- No `.log` files modified in the last day within the project root
- No application log directories found at `logs/` or `./logs/`
- No CI/CD log artifacts present locally
- The test runner output itself would be the primary log source, but was not captured to a file
- **Conclusion**: No persistent log files contain relevant error information. The test failure output exists only in the terminal session where `npm test` was run.

### Agent 2: State Investigator (haiku)

**Task**: "Check application state for anomalies related to: npm test failing after last commit."

**Findings**:
- `cmd/prism-vscode/package.json`: version bumped from `2.5.0` to `2.5.1` in commit `570fd3a`
- `packages/prism-core/src/shared/PrismState.ts`: `DEFAULT_PRISM_STATE.version` changed from `"2.5.0"` to `"2.5.1"`
- `packages/prism-ui/src/context/PrismStateContext.tsx`: `DEFAULT_STATE.version` changed from `"2.5.0"` to `"2.5.1"`
- No `.env` files modified
- No database or SQLite files detected
- `node_modules/` appears intact (no missing dependency indicators)
- Test files exist at:
  - `cmd/prism-vscode/src/prism/__tests__/signals.test.ts`
  - `cmd/prism-vscode/src/prism/__tests__/stories.test.ts`
  - `cmd/prism-vscode/src/prism/__tests__/progress.test.ts`
  - `cmd/prism-vscode/src/core/controller/prism/__tests__/workflow.test.ts`
- No test files reference the version string `"2.5.0"` directly, so hardcoded version assertions are not the cause
- **Conclusion**: The version bump itself is unlikely to cause test failures via direct string comparison. However, the shared packages (`prism-core`, `prism-ui`) may need rebuilding if tests consume compiled output.

### Agent 3: Git Investigator (haiku)

**Task**: "Analyze git history for changes related to: npm test failing with 3 test failures."

**Findings**:
- **Current branch**: `main`, 1 commit ahead of `origin/main`
- **Last commit**: `570fd3a` (v2.5.1) — authored 2026-03-07
  - Changed 70 files, +12,037 lines (mostly eval snapshots and docs)
  - Source code changes limited to version bumps in 4 files:
    1. `.claude-plugin/marketplace.json` (version string)
    2. `.claude-plugin/plugin.json` (version string)
    3. `packages/prism-core/src/shared/PrismState.ts` (version `2.5.0` -> `2.5.1`)
    4. `packages/prism-ui/src/context/PrismStateContext.tsx` (version `2.5.0` -> `2.5.1`)
    5. `cmd/prism-vscode/package.json` (version `2.5.0` -> `2.5.1`)
    6. `cmd/prism-electron/package.json` (version bump)
    7. `cmd/prism-installer/package.json` + `tauri.conf.json` (version bumps)
  - No test files were modified in this commit
  - No imports, interfaces, or function signatures were changed
- **Prior commit**: `bae2aeb` (docs update) — no source changes
- **No uncommitted changes** to source files (only `prism-eval` submodule has local modifications)
- **Potential regression**: The `packages/` directory structure suggests a monorepo with shared packages. If `prism-core` or `prism-ui` are consumed as pre-built artifacts (not via path aliases), the version bump in `PrismState.ts` may cause stale cache or build artifact mismatches.
- **Conclusion**: The commit changed only version strings. Test failures likely stem from a build/compilation mismatch rather than a logic change.

## Root Cause Hypothesis

**Primary hypothesis: Stale build artifacts in the packages/ directory.**

The v2.5.1 commit modified source files in `packages/prism-core/` and `packages/prism-ui/`, but if these packages are consumed by `cmd/prism-vscode/` tests through compiled output (e.g., `dist/` directories), the tests may be running against stale v2.5.0 compiled code while the source says v2.5.1. This mismatch could cause 3 failures if:

1. A test imports `DEFAULT_PRISM_STATE` and checks structural properties that depend on the build pipeline
2. A snapshot test captures rendered output containing the version string
3. A workflow/integration test validates state hydration where the version field is compared

**Secondary hypothesis: Path alias resolution breaking.**

The test files import from `@prism-core/prism/signals`, `@prism-core/prism/stories`, etc. If the `packages/prism-core` refactor (the three-package split noted in MEMORY.md) is partially in progress, path resolution may have become inconsistent after the version bump touched files in `packages/`.

**Tertiary hypothesis: Package.json version mismatch across workspaces.**

With version bumps in `cmd/prism-vscode/package.json`, `cmd/prism-electron/package.json`, and `cmd/prism-installer/package.json`, if any test validates cross-package version consistency or reads version from `package.json` at runtime, a missed bump could cause failures.

## Suggested Fix Approach

1. **Rebuild shared packages**: Run `npm run build` (or equivalent) in `packages/prism-core/` and `packages/prism-ui/` to regenerate compiled output matching the v2.5.1 source, then re-run `npm test`
2. **Check for snapshot tests**: Run `npm test -- --updateSnapshot` (if using Jest) to see if any snapshot files contain the old version string and need updating
3. **Verify path alias resolution**: Confirm that `tsconfig.json` path mappings for `@prism-core/*` resolve correctly after the version bump; check if `jest.config` or `vitest.config` has matching `moduleNameMapper` / `resolve.alias` entries
4. **Run tests in isolation**: Execute each test file individually to identify exactly which 3 tests fail:
   - `npx vitest run src/prism/__tests__/signals.test.ts`
   - `npx vitest run src/prism/__tests__/stories.test.ts`
   - `npx vitest run src/prism/__tests__/progress.test.ts`
   - `npx vitest run src/core/controller/prism/__tests__/workflow.test.ts`

## Files to Examine

- `packages/prism-core/src/shared/PrismState.ts:85` — version changed to `"2.5.1"`, verify compiled output matches
- `packages/prism-ui/src/context/PrismStateContext.tsx:152` — version changed to `"2.5.1"`, verify compiled output matches
- `cmd/prism-vscode/tsconfig.json` — check `@prism-core` path alias resolution
- `cmd/prism-vscode/package.json` — check test script configuration and dependency references
- `cmd/prism-vscode/src/prism/__tests__/signals.test.ts` — potential failing test
- `cmd/prism-vscode/src/prism/__tests__/stories.test.ts` — potential failing test
- `cmd/prism-vscode/src/prism/__tests__/progress.test.ts` — potential failing test
- `cmd/prism-vscode/src/core/controller/prism/__tests__/workflow.test.ts` — potential failing test (most likely to reference state/version)

---

## Evaluation Notes

### v2.4.8 Skill Execution Assessment

**Steps completed per SKILL.md workflow**:
1. Gather Context — gathered standalone issue description, identified project structure
2. Spawn Investigation Agents — simulated 3 parallel agents (log-investigator, state-investigator, git-investigator) per skill specification
3. Analyze Failure Output — categorized as test failure type, identified test file locations and assertion patterns
4. Synthesize Findings — produced structured debug report in the prescribed markdown format

**Observations on v2.4.8 skill behavior**:
- The skill prescribes spawning 3 investigation agents via `Task(subagent_type=...)` — these were simulated as the eval environment does not support actual agent spawning
- The skill's report template was followed exactly (Problem Statement, Error Analysis, Investigation Findings, Root Cause Hypothesis, Suggested Fix Approach, Files to Examine)
- The skill does NOT prescribe running `npm test` itself to capture actual output; it relies on the user providing error context or the agents finding logs
- The skill correctly enforces "read-only investigation" (Rule 1) — no files were modified
- The skill does not provide guidance on how deep each agent should investigate or what constitutes "enough" evidence before synthesizing
- The skill does not have a mechanism to ask clarifying questions back to the user when error output is insufficient (the standalone path says "ask user" but provides no structured follow-up)
