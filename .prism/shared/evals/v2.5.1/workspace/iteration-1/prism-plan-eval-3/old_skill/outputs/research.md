# Prism Plan Eval — v2.4.8 (BASELINE) Skill Execution

**Date**: 2026-03-08
**Task**: "I need a plan to migrate our database from SQLite to PostgreSQL. I'm not sure about the approach yet."
**Skill Version**: v2.4.8 (OLD/BASELINE)

---

## Workflow Execution Trace

### Step 1: Load Context

**What the skill instructs**: Check for research in `.prism/shared/research/`. If it exists, spawn a `prism-analyzer` agent to extract decisions, constraints, and patterns.

**What happened**: No research document exists for a database migration topic. No prior research was found in `.prism/shared/research/` related to SQLite, PostgreSQL, or database migration. The skill's prerequisite states:

> - Research exists in `.prism/shared/research/` OR
> - Sufficient codebase understanding from current session

Since no research exists, the skill falls back to "sufficient codebase understanding from current session." A codebase search for `sqlite`, `postgres`, `database`, or `.db` found **no actual database code** in this repository (the repo is a markdown-based plugin with a Go CLI — no database layer exists).

**Observation**: The v2.4.8 skill does NOT explicitly instruct what to do when neither prerequisite is met. It does not redirect the user to run `/prism-research` first. The skill simply lists two OR conditions and proceeds. This is a gap — the user could end up planning with no foundation.

### Step 2: Present Understanding

**What the skill instructs**: Present understanding to the user in a structured format (Goal, Key Files, Patterns, Constraints, Questions) and **wait for user confirmation**.

**Simulated output the skill would produce**:

```markdown
## My Understanding

**Goal**: Migrate the application's database layer from SQLite to PostgreSQL.

**Key Files**: Unknown — no database-related files were found in the current codebase. This repository appears to be a markdown-based plugin (Prism) with a Go CLI dashboard, not an application with a database layer.

**Patterns to Follow**: N/A — no existing database patterns found.

**Constraints**:
- No database code currently exists in this repository
- The task as stated may not apply to this codebase

**Questions** (only if code can't answer):
1. Which application/repository contains the SQLite database you want to migrate?
2. What is the current SQLite schema (tables, relationships, indexes)?
3. What ORM or database access layer is currently in use (e.g., raw SQL, Prisma, TypeORM, GORM)?
4. What is the deployment environment for PostgreSQL (managed service like RDS, self-hosted, etc.)?
5. Is there existing data that needs to be migrated, or is this a fresh schema migration only?
```

**Observation**: The skill correctly identifies that it should ask questions rather than assume. However, it says "only if code can't answer" — but in this case the code literally has no database layer. The skill has no mechanism to **stop and redirect** the user when the task doesn't match the codebase. It would present questions and wait, which is reasonable but potentially wasteful.

### Step 3: Design Options

**What the skill instructs**: If multiple approaches exist, present options with pros/cons and ask the user to choose.

**Simulated output** (assuming the user clarified this is for a hypothetical app):

```markdown
## Approach Options

### Option A: Big-Bang Migration
- Pros: Single cutover, no dual-database complexity, clean break
- Cons: High risk, requires downtime, all-or-nothing

### Option B: Incremental Migration with Adapter Layer
- Pros: Lower risk, can rollback per-component, no extended downtime
- Cons: More complex, temporary dual-database state, longer timeline

### Option C: Parallel Run (Shadow Writes)
- Pros: Validates PostgreSQL behavior before cutover, zero-downtime switch
- Cons: Most complex, requires write duplication, data consistency challenges

Which approach?
```

**Observation**: The user explicitly said "I'm not sure about the approach yet." The v2.4.8 skill handles this well — Step 3 is specifically designed for when multiple approaches exist. It presents options and waits for the user to choose. This is appropriate.

### Step 4: Get Structure Approval

**What the skill instructs**: Present proposed phases at a high level and ask "Does this make sense?"

**Simulated output** (assuming Option B was chosen):

```markdown
## Proposed Phases

1. **Database Abstraction Layer**: Create adapter interface that works with both SQLite and PostgreSQL
2. **PostgreSQL Setup**: Add PostgreSQL connection, configuration, and Docker dev environment
3. **Schema Migration**: Convert SQLite schema to PostgreSQL DDL with proper types
4. **Repository Migration**: Update all data access code to use the abstraction layer
5. **Data Migration**: Build and test data migration scripts
6. **Testing**: Integration tests against PostgreSQL, regression tests
7. **Cutover**: Switch production to PostgreSQL, decommission SQLite

Does this make sense?
```

**Observation**: The skill produces a reasonable phase breakdown and waits for approval. This is the correct interactive behavior per the v2.4.8 rules.

### Step 5: Write Full Plan

**What the skill instructs**: Save to `.prism/shared/plans/YYYY-MM-DD-feature.md`, use TodoWrite to track phases. Follow the plan template.

**What would happen**: After getting approval on the phases, the skill would write a full plan document following the template in `references/plan-template.md`. It would include:
- Frontmatter (date, status: draft, etc.)
- Success criteria split into Automated and Manual
- Detailed phases with file tables, steps, and verification commands
- Risks & Mitigations table
- Edge Cases table
- Out of Scope section
- Rollback Plan
- Progress Log

The skill would also call `TodoWrite` to create trackable tasks.

---

## Evaluation: Strengths of v2.4.8

1. **Interactive by design**: The workflow has 4 explicit "wait for user" checkpoints before writing the plan. This matches the user's uncertainty ("I'm not sure about the approach yet").
2. **Options presentation**: Step 3 directly addresses the user's ambiguity by presenting approach options with pros/cons.
3. **Structured template**: The plan template is comprehensive with phases, verification, risks, edge cases, and rollback.
4. **Two-category success criteria**: Properly separates automated (CI) from manual verification.
5. **Rules are clear**: 7 explicit rules prevent common planning mistakes (no open questions, testable criteria, specific paths, etc.).

## Evaluation: Weaknesses of v2.4.8

1. **No research gate**: The skill does not enforce running `/prism-research` first when no research exists. It lists research as a soft prerequisite with an OR fallback to "sufficient codebase understanding" but has no way to assess whether that understanding is actually sufficient.
2. **No early exit/redirect**: When the task doesn't match the codebase (as here — no database code exists), the skill has no mechanism to say "stop, this isn't applicable" or redirect to a different workflow.
3. **Agent usage is underspecified**: Step 1 says to spawn `prism-analyzer` if research exists, but there's no guidance on spawning `codebase-analyzer` or `codebase-pattern-finder` during the planning phase itself to verify assumptions.
4. **TodoWrite dependency**: The skill instructs use of `TodoWrite` for tracking, but this tool may not always be available or appropriate.
5. **No complexity assessment**: The skill doesn't guide the planner to assess whether the task is small enough for a single plan or large enough to need decomposition into stories (Spectrum).
6. **Template is static**: The plan template is a fixed reference, not adaptive to the task's actual complexity or domain.

## Behavioral Summary

| Aspect | v2.4.8 Behavior |
|--------|-----------------|
| Handles user uncertainty | Yes — Step 3 presents options |
| Forces research first | No — soft prerequisite with OR fallback |
| Interactive checkpoints | 4 explicit wait points |
| Redirects on mismatch | No — proceeds regardless |
| Agent spawning | Only prism-analyzer, only if research exists |
| Plan output format | Comprehensive template with all sections |
| Complexity scaling | No — same process for small and large tasks |

## Files Referenced

- Skill: `.prism/shared/evals/v2.4.8-snapshot/skills/prism-plan/SKILL.md`
- Template: `.prism/shared/evals/v2.4.8-snapshot/skills/prism-plan/references/plan-template.md`
- Research directory checked: `.prism/shared/research/` (no relevant docs found)
