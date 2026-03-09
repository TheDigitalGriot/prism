# Prism Skill Evaluation: Command Routing Refactor Guidance

**Date**: 2026-03-08
**Task**: "I want to refactor the command routing in this plugin. Walk me through what Prism phases I should use and in what order."
**Skill Used**: `skills/prism/SKILL.md`

---

## Steps Followed

### Step 1: Read the Skill File

Read `skills/prism/SKILL.md` to understand the full Prism workflow. The skill defines:

- **4 core phases**: Research -> Plan -> Implement -> Validate
- **Workflow selection matrix** based on scenario complexity
- **Starting workflow**: Check `.prism/` for existing artifacts first
- **Available agents** for each phase

### Step 2: Check for Existing Work (per skill instructions, lines 48-61)

The skill instructs: "First, check `.prism/` for existing artifacts." I searched for existing research, plans, or work related to "command routing" across the `.prism/` directory and the broader codebase.

**Findings**:
- No existing research documents about command routing
- No existing plans about command routing
- No prior implementation work on this topic
- The `.prism/shared/research/` directory contains 31 research documents on other topics
- The `.prism/shared/plans/` directory contains 30 plans on other topics

**Conclusion per skill logic**: "Nothing exists" -> Start with Research

### Step 3: Classify the Scenario (per Workflow Selection table, lines 39-44)

The skill provides four scenario categories:

| Scenario | Phases |
|----------|--------|
| New feature, unfamiliar codebase | Full R->P->I->V |
| Feature in known codebase | P->I->V (skip Research) |
| Simple change, clear scope | I->V (skip Research + Plan) |
| Trivial fix (<20 lines) | Direct implementation |

**Analysis of "refactor command routing"**:
- "Refactor" implies restructuring existing code, not a new feature
- "Command routing" touches the core architecture of the plugin (25 command files in `commands/`, 14 skill files in `skills/*/SKILL.md`, plus the three-layer architecture of Skills -> Commands -> Agents)
- This is a cross-cutting concern affecting how all commands are discovered and invoked
- The blast radius is significant: changes could affect every skill and command

**Classification**: This falls under "New feature, unfamiliar codebase" or at minimum "Feature in known codebase" -- the refactor scope is broad and the routing mechanism is architectural. Since no prior research exists on command routing specifically, the full workflow is recommended.

### Step 4: Recommended Phase Order

Based on the skill's workflow selection and the analysis above:

## Recommended Workflow: Full R -> P -> I -> V

### Phase 1: Research (`/prism-research`)

**Why needed**: Command routing is architectural. Before refactoring, you need to document how routing currently works across all three layers (Skills, Commands, Agents).

**What to investigate**:
- How Claude Code discovers and loads `commands/*.md` files (the auto-discovery mechanism)
- How `skills/*/SKILL.md` frontmatter triggers skill invocation
- How agents are spawned via `Task(subagent_type="agent-name")`
- Current routing paths: which skills invoke which commands, which commands spawn which agents
- Any pain points or duplication in the current routing

**Agents to use** (from skill lines 90-95):
- `codebase-locator` -- Find all files involved in command routing
- `codebase-analyzer` -- Understand how the routing mechanism works
- `codebase-pattern-finder` -- Identify patterns and inconsistencies in current routing
- `prism-locator` -- Check if any existing docs describe routing internals

**Output**: `.prism/shared/research/2026-03-08-command-routing-refactor.md`

### Phase 2: Plan (`/prism-plan`)

**Why needed**: Refactoring routing affects every command and skill. A plan ensures you don't break the plugin's core functionality.

**Key behaviors** (from skill lines 101-105):
- Present your understanding of current routing first
- Get user feedback before writing the full plan
- Resolve all questions about scope (which parts of routing to refactor, which to leave alone)
- Define testable success criteria (both automated and manual)

**Output**: `.prism/shared/plans/2026-03-08-command-routing-refactor.md`

### Phase 3: Implement (`/prism-implement`)

**Why needed**: Execute the plan phase by phase with verification checkpoints.

**Key behaviors** (from skill lines 109-115):
- One phase at a time
- Run verification commands after each phase
- Stop at checkpoints for user approval
- Document any deviations from the plan

### Phase 4: Validate (`/prism-validate`)

**Why needed**: Verify the refactored routing works correctly across all commands and skills.

**Key behaviors** (from skill lines 131-136):
- Run all automated checks
- Compare against success criteria from the plan
- Verify no commands or skills were broken
- Generate validation report

**Output**: `.prism/shared/validation/2026-03-08-command-routing-report.md`

### Optional: Spectrum Consideration

If the plan reveals the refactor can be decomposed into 10+ independent stories (e.g., migrating each command one at a time to a new routing pattern), consider using `/decompose_plan` followed by `spectrum.sh` for autonomous execution. This is especially useful if the refactor is mechanical and repetitive.

---

## Summary of Guidance Provided

The user asked which Prism phases to use for a command routing refactor. Following the skill's workflow:

1. **Checked for existing work** -- none found on this topic
2. **Classified the scenario** -- broad architectural refactor, full workflow needed
3. **Recommended full R->P->I->V** with specific guidance on what each phase should cover
4. **Noted Spectrum as optional** if the work decomposes into many similar stories

The skill's workflow selection matrix and "Check for Existing Work" decision tree were the primary decision-making tools used.
