# Prism Skill Evaluation Transcript — Eval 2 (with_skill)

**Task**: "I want to refactor the command routing in this plugin. Walk me through what Prism phases I should use and in what order."
**Date**: 2026-03-08
**Skill Version**: v2.5.2

---

## Step 1: Read the Skill File

Read `skills/prism/SKILL.md` to understand the full Prism workflow, phases, and workflow selection criteria.

Key sections identified:
- **Core Workflow**: Research -> Plan -> Implement -> Validate
- **Workflow Selection Table**: Maps scenarios to recommended phase sequences
- **Starting the Workflow**: Check for existing artifacts first, then choose entry point
- **Phase Details**: Each phase has specific behaviors, agents, and outputs

---

## Step 2: Check for Existing Work (per SKILL.md "Starting the Workflow")

The skill instructs: "First, check `.prism/` for existing artifacts."

**Action**: Searched `.prism/shared/research/` and `.prism/shared/plans/` for anything related to "command routing" or "command refactor."

**Result**: No existing research, plans, or work related to command routing refactoring was found. The existing research documents cover other topics (CLI dashboard, electron app, VSCode extension, installer, etc.) but nothing specific to command routing within the plugin itself.

**Decision per SKILL.md**: "Nothing exists -> Start with Research"

---

## Step 3: Workflow Selection (per SKILL.md table)

The skill provides this decision matrix:

| Scenario | Phases |
|----------|--------|
| New feature, unfamiliar codebase | Full R->P->I->V |
| Feature in known codebase | P->I->V (skip Research) |
| Simple change, clear scope | I->V (skip Research + Plan) |
| Trivial fix (<20 lines) | Direct implementation |

### Analysis of "Refactor command routing"

**Why this is NOT a trivial fix or simple change:**
- "Command routing" is a cross-cutting architectural concern in Prism. Commands are defined as individual `.md` files in `commands/` (25 files found), invoked via `/command-name` syntax, and orchestrated by Skills.
- A routing refactor could affect how all 25 commands are discovered, dispatched, and executed.
- The three-layer architecture (Skills -> Commands -> Agents) means routing changes propagate through multiple layers.

**Why Research is warranted even though this is a "known" codebase:**
- Refactoring routing requires understanding the current routing mechanism in detail: how commands are discovered (auto-discovery from filenames?), how they are dispatched (Claude Code plugin infrastructure?), and what constraints exist.
- The blast radius is potentially large — touching the routing layer could break every command.
- No prior research on this topic exists in `.prism/`.

**Recommended workflow: Full R -> P -> I -> V**

---

## Step 4: Recommended Phase Walkthrough

Here is the recommended phase sequence for refactoring command routing:

### Phase 1: Research (`/prism-research`)

**Purpose**: Document the current command routing architecture without making recommendations.

**What to investigate**:
- How commands in `commands/*.md` are discovered and registered by the Claude Code plugin system
- How the YAML frontmatter in skill files affects routing
- The dispatch mechanism: what happens when a user types `/command-name`
- How skills invoke commands (the Skills -> Commands -> Agents chain)
- Any existing routing patterns, conventions, or constraints
- External dependencies (Claude Code plugin infrastructure requirements)

**Agents to spawn**:
- `codebase-locator`: Find all files involved in command routing (command definitions, skill orchestrators, any dispatch logic)
- `codebase-analyzer`: Understand how the current routing works end-to-end
- `codebase-pattern-finder`: Identify patterns across the 25 command files and how they are referenced
- `prism-locator`: Check for any existing documentation about the routing system

**Output**: `.prism/shared/research/2026-03-08-command-routing-architecture.md`

### Phase 2: Plan (`/prism-plan`)

**Purpose**: Create an actionable, user-approved refactoring plan.

**Key behaviors per SKILL.md**:
- Present current understanding of routing first (from research)
- Propose the refactoring approach and get feedback before writing the full plan
- Resolve all questions (e.g., backward compatibility? naming conventions? migration strategy?)
- Define testable success criteria in two categories:
  - **Automated Verification**: e.g., "All 25 commands remain invocable", "No broken skill-to-command references"
  - **Manual Verification**: e.g., "User can invoke `/prism-research` and it triggers the correct workflow"

**Output**: `.prism/shared/plans/2026-03-08-command-routing-refactor.md`

### Phase 3: Implement (`/prism-implement`)

**Purpose**: Execute the plan phase by phase with verification at each step.

**Key behaviors per SKILL.md**:
- One phase at a time
- Run verification commands after each phase
- Stop at checkpoints for user approval
- Document any deviations from the plan

**Important for a routing refactor**: Since this is infrastructure-level work, each implementation phase should be followed by a smoke test of affected commands to catch regressions early.

### Phase 4: Validate (`/prism-validate`)

**Purpose**: Verify the refactored routing meets all success criteria from the plan.

**Key behaviors per SKILL.md**:
- Run all automated checks defined in the plan
- Compare implementation against every success criterion
- Document any deviations
- Generate validation report

**Output**: `.prism/shared/validation/2026-03-08-command-routing-refactor-report.md`

---

## Step 5: Additional Considerations

### Spectrum — Not Recommended Here

The SKILL.md describes Spectrum for "large features with 10+ changes" and "repetitive transformations." A routing refactor is architectural and interconnected, not a set of independent stories. Each change depends on the prior one. Spectrum's fresh-context-per-story model is not ideal for tightly coupled refactoring. Stick with the manual R->P->I->V flow.

### Debug Phase — Available If Needed

If routing changes cause quality gate failures during implementation, `/prism-debug` can spawn `log-investigator`, `state-investigator`, and `git-investigator` agents to diagnose issues.

### Iterate Phase — Likely Needed

Given the cross-cutting nature of routing refactoring, `/prism-iterate` may be needed if the initial plan requires adjustments after early implementation phases reveal unexpected constraints.

---

## Summary

| Phase | Command | Why |
|-------|---------|-----|
| 1. Research | `/prism-research` | No existing research on command routing; need to document current architecture before changing it |
| 2. Plan | `/prism-plan` | Routing is cross-cutting; need user-approved plan with clear success criteria |
| 3. Implement | `/prism-implement` | Execute phase-by-phase with verification checkpoints |
| 4. Validate | `/prism-validate` | Confirm all 25 commands still work and routing meets refactored design |
| (If needed) | `/prism-iterate` | Adjust plan if implementation reveals surprises |
| (If needed) | `/prism-debug` | Diagnose any quality gate failures |

**Start command**: `/prism-research` with topic "command routing architecture"
