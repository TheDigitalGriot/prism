# Prism Eval Transcript — Baseline v2.4.8

**Task**: "I want to refactor the command routing in this plugin. Walk me through what Prism phases I should use and in what order."

**Date**: 2026-03-08

---

## Step 1: Check for Existing Work (per SKILL.md "Starting the Workflow")

The baseline skill instructs to first check `.prism/` for existing artifacts:

> ```
> Task(subagent_type="prism-locator")
> "Find existing research, plans, or work related to [topic]"
> ```

**Action**: Searched `.prism/shared/research/` and `.prism/shared/plans/` for any files related to "command routing".

**Result**: No existing research, plans, or validation artifacts found for command routing. Per the skill:

> - **Nothing exists** -> Start with Research

## Step 2: Workflow Selection (per SKILL.md "Workflow Selection" table)

The baseline skill provides this decision table:

| Scenario | Phases |
|----------|--------|
| New feature, unfamiliar codebase | Full R->P->I->V |
| Feature in known codebase | P->I->V (skip Research) |
| Simple change, clear scope | I->V (skip Research + Plan) |
| Trivial fix (<20 lines) | Direct implementation |

**Analysis**: Refactoring command routing is a structural change that touches how commands are discovered and dispatched across the plugin. The `commands/` directory contains 25 command files. This is not a trivial fix or simple change — it requires understanding the current routing patterns, identifying what to change, and ensuring nothing breaks.

**Decision**: This falls under **"New feature, unfamiliar codebase"** or at minimum **"Feature in known codebase"** depending on your familiarity. Since no prior research exists, the recommended path is:

**Full R -> P -> I -> V**

## Step 3: Recommended Phase Walkthrough

### Phase 1: Research (`/prism-research`)

**Why**: Before refactoring, you need to document how command routing currently works. The skill states research should "Document the codebase without recommendations."

**What it does**:
- Spawns parallel agents: `codebase-locator` (find WHERE routing code lives), `codebase-analyzer` (understand HOW routing works), `codebase-pattern-finder` (find routing patterns across the codebase)
- Optionally spawns `prism-locator` to check for any related docs
- Output saved to `.prism/shared/research/2026-03-08-command-routing.md`

**Key questions research would answer**:
- How are the 25 command files in `commands/` currently discovered and invoked?
- What is the routing mechanism (YAML frontmatter matching, filename conventions, etc.)?
- How do skills invoke commands vs. users invoking commands directly?
- What dependencies exist between commands and the skill/agent layers?

### Phase 2: Plan (`/prism-plan`)

**Why**: Create an actionable refactoring plan with user approval at each step.

**What it does** (per the skill's "Key behaviors"):
- Present understanding of current routing first
- Get feedback before writing the full plan
- Resolve all questions about the desired routing architecture
- Define testable success criteria (both automated and manual)
- Output saved to `.prism/shared/plans/2026-03-08-command-routing-refactor.md`

**Key planning decisions**:
- What is the target routing architecture?
- Which commands need to change vs. stay the same?
- What is the migration strategy (incremental or big-bang)?
- What are the quality gates (all existing commands still work)?

### Phase 3: Implement (`/prism-implement`)

**Why**: Execute the approved plan phase by phase.

**What it does** (per the skill's "Key behaviors"):
- One phase at a time
- Run verification commands after each phase
- Stop at checkpoints for user approval
- Document any mismatches between plan and reality

**For a refactoring task, this likely involves**:
- Modifying the routing infrastructure
- Updating command files to match new routing conventions
- Ensuring backward compatibility or migrating all references

### Phase 4: Validate (`/prism-validate`)

**Why**: Verify the refactoring matches the plan's success criteria.

**What it does** (per the skill's "Key behaviors"):
- Run all automated checks
- Compare implementation against success criteria from the plan
- Document any deviations
- Generate validation report at `.prism/shared/validation/2026-03-08-command-routing-report.md`

## Step 4: Optional Phases

The baseline skill also mentions these optional phases that may be relevant:

- **`/prism-verify`** (Verify UI): If command routing affects any UI/webview behavior, run browser verification between Implement and Validate.
- **`/prism-iterate`**: If the plan needs changes mid-implementation, use this to update the plan and continue.
- **`/prism-debug`**: If quality gates fail during implementation, this spawns investigation agents to diagnose issues.

## Step 5: Spectrum Consideration

The baseline skill notes Spectrum (`/prism-spectrum`) is useful for:
- Large features with 10+ changes
- Repetitive transformations
- Well-defined, decomposable work

If the command routing refactoring involves touching many command files in a repetitive way (e.g., updating all 25 command files to a new format), Spectrum autonomous execution could be appropriate after planning:
1. `/prism-plan` to create the plan
2. `/decompose_plan` to generate `stories.json`
3. `./scripts/spectrum.sh` to execute autonomously

## Summary

**Recommended workflow**: Full **Research -> Plan -> Implement -> Validate**

| Step | Command | Purpose |
|------|---------|---------|
| 1 | `/prism-research` | Document current command routing patterns |
| 2 | `/prism-plan` | Design the refactored routing with your approval |
| 3 | `/prism-implement` | Execute the plan phase by phase |
| 4 | `/prism-validate` | Verify all commands still work correctly |

Start with `/prism-research` to build a complete picture of the current routing before making any changes.

---

## Eval Metadata

- **Skill version**: v2.4.8 (baseline snapshot)
- **Workflow followed**: SKILL.md "Starting the Workflow" -> "Workflow Selection" -> Phase Details
- **Agents referenced**: prism-locator, codebase-locator, codebase-analyzer, codebase-pattern-finder
- **No source files modified**: Simulation only
- **No commits made**: Documentation only
