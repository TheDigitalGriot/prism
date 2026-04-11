# Simple Plan Fixture — Add a String Utility

> **For agentic workers:** REQUIRED SUB-SKILL: Use prism-subagent to implement this plan task-by-task.

**Goal:** Add a small string utility module with two functions and tests.

**Tech Stack:** TypeScript, Vitest.

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/utils/string-utils.ts` | Two utility functions |
| Create | `src/utils/string-utils.test.ts` | Unit tests |
| Modify | `src/utils/index.ts` | Export the new utilities |

---

### Task 1: Create the string utility module

**Files:**
- Create: `src/utils/string-utils.ts`

- [ ] **Step 1: Create the file with two exported functions**

```typescript
export function truncate(input: string, max: number): string {
  if (input.length <= max) return input;
  return input.slice(0, max - 1) + "…";
}

export function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
```

**Acceptance:**
- File exists at the declared path
- Both functions are exported
- truncate handles inputs shorter than max correctly
- slugify strips leading/trailing hyphens

---

### Task 2: Add unit tests

**Files:**
- Create: `src/utils/string-utils.test.ts`

- [ ] **Step 1: Write tests for both functions**

Tests should cover:
- truncate with input longer than max
- truncate with input shorter than max
- slugify with mixed case
- slugify with special characters
- slugify with leading/trailing whitespace

**Acceptance:**
- All tests pass
- Both functions have at least 3 test cases each

---

### Task 3: Wire up the export

**Files:**
- Modify: `src/utils/index.ts`

- [ ] **Step 1: Re-export the new utilities**

```typescript
export * from "./string-utils";
```

**Acceptance:**
- Both functions are importable from `src/utils`
- Type checking passes
