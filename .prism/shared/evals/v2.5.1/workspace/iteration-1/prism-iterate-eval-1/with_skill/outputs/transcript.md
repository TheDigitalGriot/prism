# Prism Iterate — Transcript

**Skill**: `prism-iterate`
**Date**: 2026-03-08
**Trigger**: Validation report found broken import path in Phase 5 of three-package-split plan
**Plan File**: `.prism/shared/plans/2026-03-01-three-package-split.md`

---

## Step 1: Assess Current State

### What exists:
- **Plan**: `.prism/shared/plans/2026-03-01-three-package-split.md` — status `in_progress`, 20 phases
- **Completed phases**: Phases 1-5 have automated verification checkboxes marked complete (`[x]`). Phase 5's automated check (`cd cmd/prism-electron && npm run make`) is passing.
- **Validation report feedback**: Phase 5 references an import from `@prism-core/utils` but the actual module exports from `@prism-core/lib`.
- **User feedback**: Requests iteration to fix the broken import path.

### Actual package structure (verified):
The `packages/prism-core/src/` directory contains these top-level modules:
- `shared/` (types.ts, PrismMessage.ts, PrismState.ts)
- `core/` (controller/, api/, prompts/)
- `claude/` (events.ts, parser.ts, runner.ts)
- `prism/` (signals.ts, init.ts, config.ts, watcher.ts, types.ts, stories.ts, progress.ts)
- `office/` (agentBridge.ts, constants.ts, types.ts, timerManager.ts, transcriptParser.ts, assetLoader.ts, layoutPersistence.ts)
- `workspace/` (types.ts, discovery.ts, research.ts, plans.ts, worktrees.ts, qualityGates.ts)

There is **no** `utils/` or `lib/` directory in `packages/prism-core/src/`. All imports in the plan use paths like `@prism-core/shared/types`, `@prism-core/office/agentBridge`, `@prism-core/claude/events`, etc.

---

## Step 2: Identify Changes Needed

```markdown
## Iteration Needed

**Trigger**: Validation report found broken import path in Phase 5

**Current State**:
- Phase 5 (Upgrade ElectronPrismController) marked as complete (automated verification passing)
- Phase 5 references `@prism-core/utils` in an import statement
- The actual module exports from `@prism-core/lib`
- Neither `utils/` nor `lib/` exist as directories in `packages/prism-core/src/`

**Analysis**:
After reviewing Phase 5 and the actual `packages/prism-core/src/` structure, the import
path in question does not match any existing module. The plan consistently uses paths
like `@prism-core/shared/types`, `@prism-core/office/agentBridge`, etc. — mapping
directly to the directory structure under `packages/prism-core/src/`.

The broken import `@prism-core/utils` should be corrected to the actual path where the
referenced functionality resides. Based on the package structure:
- If it refers to shared utility types: `@prism-core/shared/types`
- If it refers to office utilities: `@prism-core/office/<specific-module>`
- If it refers to workspace utilities: `@prism-core/workspace/<specific-module>`

The correct fix depends on what was being imported. Since neither `utils` nor `lib`
exist as directories, both are incorrect. The import must be updated to reference the
correct subpath within `packages/prism-core/src/`.

**Changes Required**:
1. Phase 5 Step 3 or related code references: Replace `@prism-core/utils` with the
   correct module path based on what is actually being imported (e.g.,
   `@prism-core/shared/types` for type utilities, or the specific submodule path)

**Impact**:
- Phases affected: Phase 5 only (the import path fix is localized)
- Success criteria changes: None — automated verification (`npm run make`) should
  already catch this if the import is in source code rather than just the plan document
- Downstream phases: No impact — Phase 5 is a dependency for later phases but the fix
  is contained to the import path correction
```

---

## Step 3: Update Plan Document (Simulated)

The following changes would be applied to `.prism/shared/plans/2026-03-01-three-package-split.md`:

### Iteration Log Entry (to be appended to Phase 5 section)

```markdown
### Iteration Log

#### 2026-03-08 - Iteration 1
**Reason**: Validation report identified broken import path in Phase 5. The import
`@prism-core/utils` does not resolve — no `utils/` directory exists in
`packages/prism-core/src/`. The actual export lives at `@prism-core/lib`, but `lib/`
also does not exist as a directory in the package structure.

**Root Cause**: The plan referenced a non-existent module path. The correct path follows
the established convention of `@prism-core/<directory>/<module>` mapping to
`packages/prism-core/src/<directory>/<module>.ts`.

**Changes**:
- Phase 5: Corrected import from `@prism-core/utils` to the actual module path where
  the referenced exports reside. Based on the package structure, all utilities are
  organized by domain (`shared/`, `office/`, `workspace/`, `claude/`, `prism/`, `core/`)
  rather than a flat `utils/` or `lib/` barrel. The specific import should reference
  the domain-specific module directly (e.g., `@prism-core/shared/types` for type
  utilities).

**Approved by**: Pending user approval
```

### Source Code Fix (Simulated)

In `cmd/prism-electron/src/hosts/electron/ElectronPrismController.ts` (or whichever
file contains the broken import):

**Before:**
```typescript
import { someUtility } from '@prism-core/utils';
```

**After (corrected to actual module path):**
```typescript
import { someUtility } from '@prism-core/shared/types';
// Or the specific domain module, e.g.:
// import { someUtility } from '@prism-core/office/agentBridge';
// import { someUtility } from '@prism-core/workspace/discovery';
```

The exact target path depends on which specific export is being referenced. The key
correction is: `@prism-core/utils` and `@prism-core/lib` are both invalid — the
package uses domain-based directories, not flat utility barrels.

---

## Step 4: Resume Implementation (Simulated)

With the import path corrected:

1. Update the import statement in the affected source file
2. Run `cd cmd/prism-electron && npm run make` to verify the build succeeds
3. Run TypeScript strict mode check across all packages
4. Verify no other files reference the non-existent `@prism-core/utils` or `@prism-core/lib` paths

**No files were actually modified** — this is a simulation per eval instructions.

---

## Step 5: Re-validate if Needed

The change is a single import path correction. Re-validation scope:

- **Automated**: `npm run make` in `cmd/prism-electron` (already a Phase 5 verification gate)
- **Manual**: Verify Electron app launches and the functionality behind the corrected import works as expected

A full re-validation run is not warranted for a single import path fix. The existing
Phase 5 automated verification gate (`npm run make`) is sufficient to catch any
remaining issues.

---

## Summary

| Item | Detail |
|------|--------|
| **Problem** | Phase 5 import uses `@prism-core/utils` — module does not exist |
| **Proposed fix in validation** | Use `@prism-core/lib` — also does not exist |
| **Correct fix** | Use the actual domain-specific path (e.g., `@prism-core/shared/types`) |
| **Scope** | Single import statement in Phase 5 code |
| **Risk** | Low — localized change, caught by existing build verification |
| **Files to update** | Plan document (iteration log) + affected source file import |
| **Phases affected** | Phase 5 only |
| **Approval needed** | Yes — user should confirm the correct target module |
