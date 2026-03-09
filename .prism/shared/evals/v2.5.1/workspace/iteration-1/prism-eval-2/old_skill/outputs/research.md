# Prism Skill Evaluation — OLD v2.4.8 Baseline

## Task
"I want to refactor the command routing in this plugin. Walk me through what Prism phases I should use and in what order."

## Skill Version
v2.4.8 (snapshot from `.prism/shared/evals/v2.4.8-snapshot/skills/prism/SKILL.md`)

---

## What the v2.4.8 Skill Instructed Me To Do

### Step 1: Check for Existing Work

Per the skill's "Starting the Workflow" section, the first action is to check `.prism/` for existing artifacts related to the topic. I simulated spawning a `prism-locator` agent:

> `Task(subagent_type="prism-locator")` — "Find existing research, plans, or work related to command routing refactoring"

**Result**: No existing research, plans, or validation documents found matching "command routing" in `.prism/shared/research/` or `.prism/shared/plans/`. The conclusion per the skill: **Nothing exists -> Start with Research.**

### Step 2: Determine Workflow Selection

The skill provides a workflow selection table:

| Scenario | Phases |
|----------|--------|
| New feature, unfamiliar codebase | Full R->P->I->V |
| Feature in known codebase | P->I->V (skip Research) |
| Simple change, clear scope | I->V (skip Research + Plan) |
| Trivial fix (<20 lines) | Direct implementation |

**Assessment**: "Refactor command routing" is a structural change that touches multiple files (there are 25 command files in `commands/`). This is not a trivial fix or a simple change. Since this is the plugin's own codebase and the user may or may not be deeply familiar with the routing internals, the recommendation depends on familiarity:

- If the user is **unfamiliar** with how commands are currently routed/discovered: **Full R->P->I->V**
- If the user **already understands** the current routing: **P->I->V**

Given that no prior research exists and refactoring routing is a cross-cutting concern, the safest recommendation is the **full workflow**.

### Step 3: Recommended Phase Order and Guidance

Based on the v2.4.8 skill, here is the walkthrough I provided to the user:

---

## Recommended Workflow: Full R -> P -> I -> V

### Phase 1: Research (`/prism-research`)

**Why**: Command routing touches the core architecture — how skills, commands, and agents are discovered and dispatched. Before refactoring, you need a clear map of the current system.

**What happens**: The research phase spawns parallel agents:
- **codebase-locator**: Find all files involved in command routing (the 25 files in `commands/`, skill YAML frontmatter, any dispatch/routing logic)
- **codebase-analyzer**: Understand how commands are currently resolved — YAML frontmatter parsing, naming conventions, invocation paths
- **codebase-pattern-finder**: Identify patterns in how commands are structured and called (e.g., `commands/*.md` naming, slash-command invocation)
- **prism-locator**: Check for any existing documentation about routing architecture

**Output**: `.prism/shared/research/2026-03-08-command-routing.md` — a factual description of the current routing system with no recommendations (per the "Documentarian, Not Critic" principle).

### Phase 2: Plan (`/prism-plan`)

**Why**: Refactoring without a plan risks breaking the command discovery system. The plan phase ensures you and the AI agree on scope before any code changes.

**What happens**:
- Present understanding of the current routing architecture (from research)
- Get your feedback and buy-in on the proposed refactoring approach
- Resolve all open questions (e.g., backward compatibility, naming changes, new routing patterns)
- Define testable success criteria split into:
  - **Automated Verification**: Commands still resolve correctly, tests pass
  - **Manual Verification**: Slash commands work interactively

**Output**: `.prism/shared/plans/2026-03-08-command-routing-refactor.md`

### Phase 3: Implement (`/prism-implement`)

**Why**: Execute the approved plan phase by phase with verification at each step.

**What happens**:
- Work through the plan one phase at a time
- Run verification commands after each phase
- Stop at checkpoints for your approval before proceeding
- Document any deviations from the plan

**Output**: Working refactored code with updated plan checkboxes.

### Phase 4: Validate (`/prism-validate`)

**Why**: Confirm the refactoring meets all success criteria from the plan.

**What happens**:
- Run all automated checks defined in the plan
- Compare implementation against success criteria
- Document any deviations
- Generate a validation report

**Output**: `.prism/shared/validation/2026-03-08-command-routing-report.md`

---

## Alternative: If You Already Know the Routing Well

If you have deep familiarity with the current command routing architecture, you could skip Research and go **P -> I -> V**. Start directly with `/prism-plan` and describe the current state yourself during planning.

## What I Would NOT Recommend

- **I -> V only**: Refactoring routing is too cross-cutting to skip planning. Too many files (25 commands) and potential for breakage.
- **Direct implementation**: This is not a trivial fix — it is structural refactoring.

---

## Process Notes (Evaluation Metadata)

- **Skill version evaluated**: v2.4.8 (snapshot)
- **Skill file read from**: `.prism/shared/evals/v2.4.8-snapshot/skills/prism/SKILL.md`
- **Key skill sections used**: Workflow Selection table, Starting the Workflow (existing work check), Phase Details, Core Workflow quick reference
- **No source files were modified** — this was a guidance/consultation response only
- **No commits were made**
- **Agents simulated but not actually spawned**: prism-locator (for existing work check)
