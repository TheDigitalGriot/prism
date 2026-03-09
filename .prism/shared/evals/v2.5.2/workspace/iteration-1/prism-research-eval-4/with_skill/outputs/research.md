---
date: 2026-03-08
researcher: Claude
git_commit: 3b1ceb82b2010d270a0a458d278638119fb44b0b
branch: main
repository: prism-plugin
topic: "Skill Discovery and Routing System in the Prism Plugin"
tags: [research, skills, routing, discovery, meta-skill, claude-code-plugin]
status: complete
---

# Research: Skill Discovery and Routing System in the Prism Plugin

## Research Question

Map out the skill discovery and routing system in this plugin. How does the prism meta-skill route to phase-specific skills?

## Summary

The Prism plugin uses Claude Code's native skill discovery mechanism based on YAML frontmatter in `SKILL.md` files within `skills/*/` directories. The `prism` meta-skill (`skills/prism/SKILL.md`) acts as a top-level router that documents all phase-specific skills and their trigger patterns, but routing itself is handled by Claude Code's `Skill` tool matching user intent against each skill's `description` field. There is no programmatic router -- the system relies on description-based semantic matching by Claude Code, with the meta-skill providing a reference table and decision framework for phase selection.

## Files Discovered

| File | Purpose |
|------|---------|
| `skills/prism/SKILL.md` | Meta-skill: top-level workflow orchestrator and routing reference |
| `skills/prism-research/SKILL.md` | Research phase skill |
| `skills/prism-plan/SKILL.md` | Planning phase skill |
| `skills/prism-implement/SKILL.md` | Implementation phase skill |
| `skills/prism-validate/SKILL.md` | Validation phase skill |
| `skills/prism-verify/SKILL.md` | Browser UI verification skill |
| `skills/prism-iterate/SKILL.md` | Plan iteration skill |
| `skills/prism-spectrum/SKILL.md` | Autonomous story execution skill |
| `skills/prism-debug/SKILL.md` | Debug investigation skill |
| `skills/prism-prd/SKILL.md` | PRD generation skill |
| `skills/prism-visual-docs/SKILL.md` | Visual documentation skill |
| `skills/prism-eval/SKILL.md` | Skill evaluation/benchmarking skill |
| `skills/prism-release/SKILL.md` | Version release pipeline skill |
| `skills/prism-docs-update/SKILL.md` | Documentation site update skill |
| `commands/research_codebase.md` | Command-level research (parallel to skill) |
| `commands/create_plan.md` | Command-level planning (parallel to skill) |
| `commands/implement_plan.md` | Command-level implementation (parallel to skill) |
| `commands/validate_plan.md` | Command-level validation (parallel to skill) |
| `commands/decompose_plan.md` | Story decomposition command |
| `commands/prism-debug.md` | Command-level debug (parallel to skill) |
| `agents/prism-locator.md` | Agent for finding existing .prism/ documents |
| `agents/codebase-locator.md` | Agent for finding code files |
| `agents/codebase-analyzer.md` | Agent for understanding code |
| `agents/codebase-pattern-finder.md` | Agent for finding patterns |
| `agents/prism-analyzer.md` | Agent for extracting insights from docs |
| `.prism/shared/ref/docs/plugins.md` | Claude Code plugin documentation |
| `.prism/shared/ref/docs/slash-commands.md` | Claude Code slash commands documentation |
| `.prism/shared/ref/docs/sub-agents.md` | Claude Code subagents documentation |

## Component Analysis

### 1. Claude Code Skill Discovery Mechanism

**Location**: Built into Claude Code runtime (not in plugin source)

**How it works**:
- Claude Code scans `skills/*/SKILL.md` files at the plugin root (`skills/prism/SKILL.md:1-5`)
- Each `SKILL.md` must have YAML frontmatter with `name` and `description` fields
- The `description` field contains trigger phrases that Claude Code uses for semantic matching
- When a user message matches a skill's description, Claude Code's `Skill` tool invokes that skill
- Skills are auto-discovered -- no registration step is needed beyond placing a `SKILL.md` in the correct directory structure

**Discovery hierarchy** (from `.prism/shared/ref/docs/slash-commands.md:396-400`):
| Type | Location | Requirements |
|------|----------|-------------|
| Custom slash commands | `.claude/commands/` or `~/.claude/commands/` | Must have `description` frontmatter |
| Agent Skills | `.claude/skills/` or `~/.claude/skills/` | Must not have `disable-model-invocation: true` |

For plugins, skills live at `<plugin-root>/skills/` and commands at `<plugin-root>/commands/`.

**Key mechanism** (from `.prism/shared/ref/docs/slash-commands.md:390-392`):
The `Skill` tool provides unified access to both slash commands and skills. Claude matches user intent against each item's description and invokes the best match. A character budget of 15,000 characters (configurable via `SLASH_COMMAND_TOOL_CHAR_BUDGET`) limits how many skill descriptions fit in context.

### 2. The Prism Meta-Skill (Router)

**Location**: `skills/prism/SKILL.md`

**How it works**:
- The meta-skill's `description` field triggers on broad phrases: "help me build", "implement this feature", "fix this bug", "prism", "structured workflow", or complex multi-step tasks (`skills/prism/SKILL.md:3`)
- It does NOT contain code that programmatically routes to sub-skills
- Instead, it serves as a **reference document** and **decision framework** that Claude reads when the meta-skill activates

**Routing logic** (embedded in the skill's prose, `skills/prism/SKILL.md:37-63`):

1. **Workflow Selection Table** (`skills/prism/SKILL.md:39-44`):
   - New feature, unfamiliar codebase: Full R->P->I->V
   - Feature in known codebase: P->I->V (skip Research)
   - Simple change, clear scope: I->V (skip Research + Plan)
   - Trivial fix (<20 lines): Direct implementation

2. **Existing Work Check** (`skills/prism/SKILL.md:50-61`):
   - Spawns `prism-locator` agent to find existing artifacts in `.prism/`
   - Nothing exists -> Start with Research (`/prism-research`)
   - Research exists -> Start with Plan (`/prism-plan`)
   - Plan exists (incomplete) -> Resume Implementation (`/prism-implement`)
   - Implementation done -> Run Validation (`/prism-validate`)

3. **Phase Reference Table** (`skills/prism/SKILL.md:17-27`):
   Lists all 8 core phases with their skill names and output locations

**Data flow**:
```
User request
  → Claude Code Skill tool matches "prism" meta-skill description
    → Meta-skill content loaded into context
      → Claude reads workflow selection table
        → Claude reads existing work check logic
          → Claude invokes appropriate phase skill via Skill tool
            (e.g., /prism-research, /prism-plan, /prism-implement)
```

### 3. Phase-Specific Skills (14 total)

**Location**: `skills/*/SKILL.md`

Each phase-specific skill has its own `description` field with trigger phrases. This means they can be invoked in two ways:

1. **Direct invocation**: User says something matching the skill's trigger phrases (e.g., "research this" triggers `prism-research` directly)
2. **Routed via meta-skill**: User says something broad (e.g., "help me build X"), meta-skill activates, Claude determines the correct phase and invokes the appropriate sub-skill

**Skill inventory with trigger phrases and model assignments**:

| Skill | Model | Trigger Phrases |
|-------|-------|-----------------|
| `prism` (meta) | sonnet | "help me build", "implement this feature", "fix this bug", "prism", "structured workflow" |
| `prism-research` | sonnet | "research this", "understand how X works", "map out the system", "explore the codebase" |
| `prism-plan` | opus | "create a plan", "plan the implementation", "design how to build" |
| `prism-implement` | sonnet | "implement the plan", "start building", "execute phase 1" |
| `prism-validate` | sonnet | "validate the plan", "verify implementation", "check if complete" |
| `prism-verify` | sonnet | "verify the UI", "check the browser", "visual verification" |
| `prism-iterate` | opus | "iterate on plan", "update and continue", "adjust the approach" |
| `prism-spectrum` | sonnet | "spectrum", "execute story", "run spectrum" |
| `prism-debug` | sonnet | "debug this", "why is this failing", "investigate the error" |
| `prism-prd` | opus | "create a PRD", "write product requirements", "document this product" |
| `prism-visual-docs` | opus | "create user flows", "design the screens", "map user journeys" |
| `prism-eval` | sonnet | "run evals", "compare versions", "benchmark skills" |
| `prism-release` | (default) | "release", "bump version", "new version", "cut a release" |
| `prism-docs-update` | (default) | "update prism docs", "sync docs site" |

### 4. Three-Layer Architecture

**Location**: Documented in `CLAUDE.md` and visible across the codebase

```
Skills (Orchestrators)  →  Commands (Operations)  →  Agents (Specialists)
```

**Skills** (`skills/*/SKILL.md`): Auto-discovered workflow orchestrators. Entry points invoked by Claude Code's `Skill` tool based on description matching. They define workflows and invoke commands and agents.

**Commands** (`commands/*.md`): User-invocable via `/command-name`. Single-purpose prompt files. Some mirror skills (e.g., `/research_codebase` parallels `prism-research`), while others are standalone operations (e.g., `/decompose_plan`, `/create_handoff`).

**Agents** (`agents/*.md`): Spawned via `Task(subagent_type="agent-name")`. Run in separate context windows. Cannot spawn other agents (subagents cannot nest). Used for parallel execution within skills.

### 5. Dual-Path Invocation Pattern

**How it works**:
Skills and their corresponding commands exist in parallel. For example:
- Skill `prism-research` (`skills/prism-research/SKILL.md`) **and** command `/research_codebase` (`commands/research_codebase.md`) both handle research
- Skill `prism-plan` **and** command `/create_plan` both handle planning
- Skill `prism-implement` **and** command `/implement_plan` both handle implementation

The skill path is model-invoked (automatic discovery based on context), while the command path is user-invoked (explicit `/command` syntax). Both paths use the same underlying agents (e.g., `codebase-locator`, `codebase-analyzer`).

### 6. Agent Dispatch Within Skills

**Location**: Each skill's SKILL.md defines its available agents

**How it works**:
- Skills list available agents in a table format
- Agents are invoked via `Task(subagent_type="agent-name")`
- Each agent has frontmatter specifying: name, description, tools, model
- Model assignment follows a convention: Opus for deep analysis, Sonnet for general work, Haiku for fast lookups

**Research agents** (used by `prism-research`):
- `graph-navigator` -- Structural analysis via knowledge graph
- `codebase-locator` -- Find WHERE code lives (Haiku)
- `codebase-analyzer` -- Understand HOW code works (Sonnet)
- `codebase-pattern-finder` -- Find patterns to follow (Sonnet)
- `prism-locator` -- Find existing docs (Haiku)
- `prism-analyzer` -- Extract insights from docs (Opus)
- `web-search-researcher` -- External research (Sonnet)

**Debug agents** (used by `prism-debug`):
- `log-investigator` -- Analyze logs
- `state-investigator` -- Check app state
- `git-investigator` -- Analyze git history

**Verify agents** (used by `prism-verify`):
- `browser-verifier` -- Headless browser checks

### 7. Document Flow Routing

**Location**: `skills/prism-prd/SKILL.md:13-18`, `skills/prism-visual-docs/SKILL.md:13-18`

Beyond the core R->P->I->V flow, a secondary routing chain exists for document generation:

```
prism-prd  ──>  prism-visual-docs  ──>  prism-plan
(Product Reqs)   (UX Flows & Specs)     (Impl Steps)
```

Each skill in this chain suggests the next step, creating a guided document-first workflow that feeds into the standard planning phase.

## Patterns Found

### Pattern: YAML Frontmatter for Skill Registration

**Example at**: `skills/prism-research/SKILL.md:1-5`

```yaml
---
name: prism-research
description: Research phase for complex coding tasks. Use when exploring a codebase before planning implementation. Triggers on "research this", "understand how X works", "map out the system", "explore the codebase", or when starting unfamiliar work.
model: sonnet
---
```

**Also used in**: All 14 skill files follow this exact pattern. The `description` field serves double duty: it tells Claude Code when to invoke the skill (semantic matching), and it tells users what the skill does.

### Pattern: Existing Work Check as Router

**Example at**: `skills/prism/SKILL.md:48-61`

```
Task(subagent_type="prism-locator")
"Find existing research, plans, or work related to [topic]"

Based on findings:
- Nothing exists -> Start with Research
- Research exists -> Start with Plan
- Plan exists (incomplete) -> Resume Implementation
- Implementation done -> Run Validation
```

This pattern uses `.prism/` directory state as routing input. The filesystem becomes the state machine.

### Pattern: Parallel Agent Dispatch

**Example at**: `skills/prism-research/SKILL.md:22-33`

Skills declare available agents in a table, then their workflow sections show when to invoke each one. Multiple agents run in parallel (e.g., `codebase-locator` and `prism-locator` can run simultaneously in step 1-2 of research).

### Pattern: Dual-Path (Skill + Command)

The same workflow is accessible via both model-invoked skills and user-invoked commands:
- `skills/prism-research/SKILL.md` <-> `commands/research_codebase.md`
- `skills/prism-plan/SKILL.md` <-> `commands/create_plan.md`
- `skills/prism-implement/SKILL.md` <-> `commands/implement_plan.md`
- `skills/prism-validate/SKILL.md` <-> `commands/validate_plan.md`
- `skills/prism-debug/SKILL.md` <-> `commands/prism-debug.md`

## Architecture Notes

- **No programmatic router**: The routing system is entirely prompt-based. The meta-skill's prose content tells Claude which phase to invoke, and Claude Code's `Skill` tool handles the actual invocation based on description matching.
- **Flat skill namespace**: All 14 skills sit at the same level in `skills/*/`. There is no hierarchy in the filesystem; the hierarchy exists only in the prose of the meta-skill.
- **Character budget constraint**: Claude Code's `Skill` tool has a 15,000-character budget for skill descriptions. With 14 skills, each averaging ~200 characters in description, the total is approximately 2,800 characters -- well within budget.
- **Model assignment convention**: Opus for deep analysis (plan, iterate, prd, visual-docs, prism-analyzer agent), Sonnet for general work (research, implement, validate, spectrum, debug), Haiku for fast lookups (prism-locator, codebase-locator agents).
- **State-driven routing**: The `.prism/shared/` directory structure serves as a state machine. The presence or absence of research docs, plans, and validation reports determines which phase to enter next.

## Open Questions

- [ ] How does Claude Code handle conflicts when both the meta-skill (`prism`) and a phase-specific skill (e.g., `prism-research`) match a user's message? Does the more specific skill take priority?
- [ ] Is there a mechanism for the meta-skill to explicitly invoke a sub-skill via the `Skill` tool, or does it rely on Claude autonomously deciding to call the Skill tool again?
- [ ] What happens when the 15,000-character Skill tool budget is exceeded -- which skills get dropped from context?

## Code References

| Reference | Description |
|-----------|-------------|
| `skills/prism/SKILL.md:3` | Meta-skill description with trigger phrases |
| `skills/prism/SKILL.md:17-27` | Core workflow phase reference table |
| `skills/prism/SKILL.md:39-44` | Workflow selection decision matrix |
| `skills/prism/SKILL.md:48-61` | Existing work check routing logic |
| `skills/prism/SKILL.md:86-187` | Phase detail sections with agent lists |
| `skills/prism-research/SKILL.md:1-5` | Example skill frontmatter pattern |
| `skills/prism-research/SKILL.md:22-33` | Agent dispatch table pattern |
| `skills/prism-prd/SKILL.md:13-18` | Document flow routing chain |
| `.prism/shared/ref/docs/slash-commands.md:390-401` | Skill tool invocation mechanism |
| `.prism/shared/ref/docs/slash-commands.md:441-448` | Character budget for Skill tool |
| `.prism/shared/ref/docs/plugins.md:199-228` | Plugin skill discovery structure |
| `.prism/shared/ref/docs/sub-agents.md:1-17` | Subagent delegation mechanism |
| `agents/prism-locator.md:1-6` | Agent frontmatter pattern |
| `CLAUDE.md:19-23` | Three-layer architecture definition |
