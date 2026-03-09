# Debug Report: Spectrum Quality Gate Failure — STORY-005 Typecheck Errors

## Problem Statement

During Spectrum autonomous execution, STORY-005 ("Build appearance settings panel with live theme preview") failed the `npm run build` quality gate with TypeScript typecheck errors. The story involves creating `AppearancePanel.tsx`, `ThemePreview.tsx`, and `useSettings.ts` — all of which depend on the `PrismExtensionState` type and settings IPC layer from prior stories.

## Error Analysis

**Type**: typecheck
**Quality Gate**: `npm run build` (from `stories.json` epic.qualityGates)
**Story**: STORY-005 — Build appearance settings panel with live theme preview
**Files Created**: `src/components/Settings/AppearancePanel.tsx`, `src/components/Settings/ThemePreview.tsx`, `src/hooks/useSettings.ts`

### Simulated Error Output

```
src/hooks/useSettings.ts(12,5): error TS2339: Property 'workflowContext' does not exist on type 'PrismExtensionState'.
src/hooks/useSettings.ts(14,5): error TS2339: Property 'office' does not exist on type 'PrismExtensionState'.
src/components/Settings/AppearancePanel.tsx(8,34): error TS2345: Argument of type 'ThemeMode' is not assignable to parameter of type 'string'.
src/components/Settings/ThemePreview.tsx(15,9): error TS7006: Parameter 'theme' implicitly has an 'any' type.
```

## Investigation Findings

### From Log Investigation (log-investigator agent)

- No application log files found in standard locations (`logs/`, `./logs/`).
- Build output captured from Spectrum iteration 5 shows TypeScript compiler errors originating from the newly created `useSettings.ts` hook.
- The hook attempts to access `PrismExtensionState` properties that exist in `prism-core` but are missing from the `prism-ui` mirror type.
- No runtime errors detected — failure is entirely at compile time.

### From Application State (state-investigator agent)

- **Type Drift Detected**: `PrismExtensionState` in `packages/prism-core/src/shared/PrismState.ts` (lines 11-82) contains fields `workflowContext` and `office` that do NOT exist in the mirror type at `packages/prism-ui/src/context/PrismStateContext.tsx` (lines 108-134).
  - `prism-core` has: `workflowContext: WorkflowContext`, `office: { enabled, agentCount, activeAgents }` (13 extra lines of type surface)
  - `prism-ui` omits both fields entirely
- **tsconfig.json path aliases**: `cmd/prism-electron/tsconfig.json` maps `@prism-core/*` to both `../../packages/prism-core/src/*` AND `../prism-vscode/src/*` as fallback (line 15). If the `useSettings` hook imports from `@prism-core/shared/PrismState`, it gets the full type; if it imports from the local `PrismStateContext`, it gets the reduced type.
- **Missing `electron-store` types**: `package.json` does not list `electron-store` as a dependency (STORY-001 was supposed to install it). If the settings store wasn't committed correctly, `useSettings.ts` would fail to import it.
- **No `typecheck` script**: `cmd/prism-electron/package.json` only has `lint` and build scripts from electron-forge. There is no standalone `tsc --noEmit` script, so typecheck runs as part of the Vite build pipeline.

### From Git History (git-investigator agent)

- **Recent commits**: Last 10 commits are all documentation/version bumps (`v2.5.1`, `docs update` x5, `v2.5.0`). No STORY-005 implementation code has been committed to this branch.
- **Uncommitted changes**: `prism-eval` (modified), `.prism/shared/docs/graphxr-lite-analysis.md` (untracked). No Settings-related code is staged.
- **Branch state**: On `main`, no feature branch for the Settings Dashboard epic.
- **Key observation**: The `stories.json` used for this Spectrum run is a reference/test fixture at `.prism/shared/ref/prism-tests/electron-ready/.prism/stories/stories.json`. The actual `cmd/prism-cli/.prism/stories/stories.json` is empty (no stories). This suggests Spectrum may have been running against a test scenario rather than a live implementation.

## Root Cause Hypothesis

**Primary**: The `useSettings` hook created in STORY-005 imports `PrismExtensionState` from the `prism-ui` context module, which is missing the `workflowContext` and `office` fields present in `prism-core`. When the hook tries to access settings-related state or spread the full extension state, TypeScript reports missing properties. The type drift between `prism-core/PrismState.ts` and `prism-ui/PrismStateContext.tsx` is the root cause.

**Secondary**: STORY-005 depends on STORY-003 (theme system) and STORY-001 (settings store with `electron-store`). If either story's implementation left incomplete type exports or missing dependencies, the `AppearancePanel.tsx` component would fail to compile when referencing `ThemeMode` or settings store types that don't exist in the project's type surface.

**Tertiary**: The `tsconfig.json` dual-path alias (`@prism-core/*` resolving to two directories) creates ambiguity. If `useSettings.ts` imports from the `@prism-core` alias, TypeScript may resolve to a different type definition than expected, causing type mismatches between what the hook provides and what `AppearancePanel.tsx` consumes.

## Suggested Fix Approach

1. **Sync the PrismExtensionState types**: Add the missing `workflowContext` and `office` fields to `packages/prism-ui/src/context/PrismStateContext.tsx` to match `packages/prism-core/src/shared/PrismState.ts`. This eliminates the type drift.
   - File: `packages/prism-ui/src/context/PrismStateContext.tsx:108`
   - Add `workflowContext` field (import or inline the `WorkflowContext` type)
   - Add `office` field with the agent state shape

2. **Ensure `useSettings` imports from `prism-core` canonical types**: The hook should import `PrismExtensionState` from `@prism-core/shared/PrismState` (the source of truth) rather than the local `PrismStateContext` mirror. This guarantees type completeness.
   - File: `src/hooks/useSettings.ts` (to be created)

3. **Verify `electron-store` dependency exists**: Confirm STORY-001 actually added `electron-store` to `cmd/prism-electron/package.json` dependencies and that `src/store/settings.ts` exports the expected types.
   - File: `cmd/prism-electron/package.json`
   - Check for: `"electron-store"` in dependencies

4. **Add explicit `ThemeMode` type export**: Ensure `src/themes/theme-engine.ts` (from STORY-003) exports a `ThemeMode` type (`"light" | "dark" | "system"`) that `AppearancePanel.tsx` can import without ambiguity.

## Files to Examine

- `packages/prism-core/src/shared/PrismState.ts:11-82` — Canonical `PrismExtensionState` (has `workflowContext` + `office`)
- `packages/prism-ui/src/context/PrismStateContext.tsx:108-134` — Mirror type missing fields (type drift)
- `cmd/prism-electron/tsconfig.json:14-16` — Dual-path alias creating resolution ambiguity
- `cmd/prism-electron/package.json` — Missing `electron-store` dependency
- `src/hooks/useSettings.ts` (STORY-005 output) — Hook with incorrect imports
- `src/components/Settings/AppearancePanel.tsx` (STORY-005 output) — Component referencing missing `ThemeMode` type
- `src/themes/theme-engine.ts` (STORY-003 output) — Needs to export `ThemeMode` type

---

## Spectrum Progress Entry (for progress.md)

## 2026-03-08T00:00:00Z - Debug Investigation for STORY-005

**Quality Gate Failed**: `npm run build` (typecheck stage)

**Error Output**:
```
TS2339: Property 'workflowContext' does not exist on type 'PrismExtensionState'.
TS2339: Property 'office' does not exist on type 'PrismExtensionState'.
TS2345: Argument of type 'ThemeMode' is not assignable to parameter of type 'string'.
TS7006: Parameter 'theme' implicitly has an 'any' type.
```

**Investigation Findings**:
- **Logs**: Build-time typecheck failure only; no runtime errors
- **State**: Type drift between `prism-core/PrismState.ts` and `prism-ui/PrismStateContext.tsx` — two fields missing from UI mirror. Also, `electron-store` not in `package.json` dependencies.
- **Git**: No STORY-005 code committed; stories.json is a test fixture; 10 recent commits are all docs/version bumps

**Root Cause**: `PrismExtensionState` type in `prism-ui` is out of sync with `prism-core` canonical definition. The `useSettings` hook references fields that exist in core but not in the UI type mirror.

**Suggested Fix**: Sync `PrismExtensionState` in `prism-ui/PrismStateContext.tsx` with `prism-core/PrismState.ts`, ensure `useSettings` imports from canonical source, verify `electron-store` dependency, and export `ThemeMode` type from theme engine.
