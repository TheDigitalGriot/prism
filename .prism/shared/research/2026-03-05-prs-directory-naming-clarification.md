---
title: "prs/ Directory Naming — Intentional vs. Typo Investigation"
date: 2026-03-05
topic: directory-structure
status: complete
---

# prs/ Directory Naming — Clarification

## Research Question

Is `.prism/shared/prs/` a typo for `.prism/shared/prd/` (Product Requirements Documents), or is it intentional?

## Summary

**`prs/` is intentional.** It stands for **Pull Request descriptions**, not Product Requirements Documents. The directory stores AI-generated PR description files produced by the `/describe_pr` command. PRDs (Product Requirements Documents) are not stored in a dedicated directory — they are saved to `.prism/shared/plans/` by the `prism-prd` skill. The naming is consistent across 31+ files in the codebase.

---

## Files Discovered

| File | Role |
|------|------|
| [skills/prism/scripts/init_prism.py](../../../skills/prism/scripts/init_prism.py) | Creates `.prism/shared/prs/` directory on initialization |
| [commands/describe_pr.md](../../../commands/describe_pr.md) | Writes PR descriptions to `.prism/shared/prs/{number}_description.md` |
| [skills/prism-prd/SKILL.md](../../../skills/prism-prd/SKILL.md) | PRD orchestration skill — saves to `.prism/shared/plans/`, NOT `prs/` |
| [agents/prism-locator.md](../../../agents/prism-locator.md) | Documents directory structure; lists `prs/ # PR descriptions` |
| [commands/prism_dir_update.md](../../../commands/prism_dir_update.md) | Migration: `thoughts/shared/prs/*` → `.prism/shared/prs/` |
| [CLAUDE.md](../../../CLAUDE.md) | Documents `prs/ # PR descriptions` in directory structure |
| [prism-docs/docs/plugin/data-flow.md](../../../prism-docs/docs/plugin/data-flow.md) | Data flow diagram shows `/describe_pr` → `.prism/shared/prs/` |
| [packages/prism-core/src/core/controller/prism/plugin-bridge.ts](../../../packages/prism-core/src/core/controller/prism/plugin-bridge.ts) | Maps `prism.describePR` VSCode command → `describe_pr` skill |

---

## Component Analysis

### 1. init_prism.py — Directory Creation

**File**: `skills/prism/scripts/init_prism.py`

The Python initialization script defines the full `.prism/` directory structure at **line 23**:

```python
directories = [
    ".prism/stories",
    ".prism/shared/research",
    ".prism/shared/plans",
    ".prism/shared/validation",
    ".prism/shared/handoffs",
    ".prism/shared/prs",          # line 29 — Pull Request descriptions
    ".prism/shared/spectrum",
    ".prism/shared/ref",
    ".prism/shared/docs",
    ".prism/local/ref",
    ".prism/local/docs",
]
```

The README it generates (line 80) documents the intent:

```
│   ├── prs/           # PR descriptions
```

**Note**: The terminal output printed by `init_prism.py` (lines 155–164) omits `prs/` from the printed directory tree, though the directory is still created. Only `research/`, `plans/`, `validation/`, `spectrum/`, `ref/`, and `docs/` appear in the print statements.

A duplicate copy of this script also exists at `cmd/prism-setup/resources/plugin/skills/prism/scripts/init_prism.py` with identical content.

---

### 2. describe_pr.md — Consumer of prs/

**File**: `commands/describe_pr.md`
**Model**: sonnet

This command generates a PR description by reading the diff, analyzing changes, and writing output. It reads from and writes to `.prism/shared/prs/`:

- **Line 38** — Check for existing file:
  ```
  Check if `.prism/shared/prs/{number}_description.md` already exists (create directory if needed)
  ```

- **Line 75** — Save output:
  ```
  Write the completed description to `.prism/shared/prs/{number}_description.md`
  ```

- **Line 80** — Apply to GitHub PR:
  ```
  gh pr edit {number} --body-file .prism/shared/prs/{number}_description.md
  ```

File naming convention: `{pr_number}_description.md` (e.g., `42_description.md`).

---

### 3. prism-prd Skill — Separate System for PRDs

**File**: `skills/prism-prd/SKILL.md`
**Model**: opus
**Trigger phrases**: "create a PRD", "write product requirements", "document this product", "define the product spec"

PRDs are saved to **`.prism/shared/plans/`**, not `prs/`:

```
.prism/shared/plans/[DATE]-[PRODUCT-NAME]-PRD.md
```

Example from SKILL.md line 61: `.prism/shared/plans/2025-02-04-acme-app-PRD.md`

The PRD workflow integrates with the broader prism pipeline:
```
prism-prd → research → plan → validate
```

The `prism-prd` skill invokes `/generate_prd`, which is a separate command from `/describe_pr`.

---

### 4. Naming Consistency Across Codebase

`prs/` appears with the label "PR descriptions" in all documentation sources:

| Location | Line | Content |
|----------|------|---------|
| `CLAUDE.md` | 70 | `├── prs/              # PR descriptions` |
| `agents/prism-locator.md` | 47 | `│   ├── prs/           # PR descriptions` |
| `init_prism.py` README block | 80 | `│   ├── prs/           # PR descriptions` |
| `prism-docs/docs/cli/domain-models.md` | 105 | `├── prs/` |
| `prism-docs/docs/electron/platform-modules.md` | 89 | `├── prs/` |

---

## Patterns Found

### prs/ Invocation Graph

```
User runs /describe_pr
        │
        ▼
commands/describe_pr.md (sonnet)
        │
        ├── gh pr diff {number}           # Reads PR diff
        ├── gh pr view {number} ...       # Reads PR metadata
        │
        ▼
.prism/shared/prs/{number}_description.md   # Output artifact
        │
        ▼
gh pr edit {number} --body-file ...          # Applies to GitHub
```

### PRD Invocation Graph (separate system)

```
User triggers prism-prd skill
        │
        ▼
skills/prism-prd/SKILL.md (opus)
        │
        ├── /generate_prd command
        │
        ▼
.prism/shared/plans/YYYY-MM-DD-name-PRD.md  # Output artifact
```

---

## Key Distinctions

| | `prs/` | PRD (Product Requirements) |
|--|--------|-----------------------------|
| **Full name** | Pull Request descriptions | Product Requirements Documents |
| **Directory** | `.prism/shared/prs/` | `.prism/shared/plans/` |
| **Produced by** | `/describe_pr` command | `/prism-prd` skill + `/generate_prd` command |
| **File pattern** | `{pr_number}_description.md` | `YYYY-MM-DD-name-PRD.md` |
| **Model** | sonnet | opus |
| **Purpose** | Document a GitHub PR for review/merge | Define product requirements before implementation |
| **Workflow phase** | End of implementation | Before research phase |

---

## Open Questions

None. Naming is confirmed intentional with consistent documentation across the codebase.
