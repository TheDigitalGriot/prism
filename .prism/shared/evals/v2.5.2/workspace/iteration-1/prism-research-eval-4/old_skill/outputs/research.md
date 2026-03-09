---
date: 2026-03-08T00:00:00Z
researcher: Claude
git_commit: 3b1ceb82b2010d270a0a458d278638119fb44b0b
branch: main
repository: prism-plugin
topic: "Skill Discovery and Routing System in the Prism Plugin"
tags: [research, skills, routing, discovery, meta-skill, architecture, plugin-system]
status: complete
---

# Research: Skill Discovery and Routing System in the Prism Plugin

## Research Question

Map out the skill discovery and routing system in this plugin. How does the prism meta-skill route to phase-specific skills?

## Summary

The Prism plugin uses Claude Code's native convention-based auto-discovery system: any `SKILL.md` file inside `skills/*/` with YAML frontmatter is automatically registered as a skill. The `prism` meta-skill (`skills/prism/SKILL.md`) acts as a hub that documents the full workflow and references all phase-specific skills, but routing is not programmatic -- it relies on Claude's natural language understanding of trigger phrases in each skill's `description` frontmatter field, combined with the meta-skill's quick-reference table that maps scenarios to the appropriate phase entry point.

## Files Discovered

| File | Purpose |
|------|---------|
| `skills/prism/SKILL.md` | Meta-skill hub: documents the full R->P->I->V workflow and all phase skills |
| `skills/prism-research/SKILL.md` | Phase 1: Research skill with agent orchestration |
| `skills/prism-plan/SKILL.md` | Phase 2: Interactive planning skill |
| `skills/prism-implement/SKILL.md` | Phase 3: Plan execution skill |
| `skills/prism-validate/SKILL.md` | Phase 4: Validation skill |
| `skills/prism-verify/SKILL.md` | Phase 3.5: Browser verification skill |
| `skills/prism-iterate/SKILL.md` | Iteration skill for plan adjustments |
| `skills/prism-debug/SKILL.md` | Debug investigation skill |
| `skills/prism-spectrum/SKILL.md` | Autonomous story execution skill |
| `skills/prism-prd/SKILL.md` | Product requirements document generation |
| `skills/prism-visual-docs/SKILL.md` | User flows and wireframe generation |
| `skills/prism-eval/SKILL.md` | Skill evaluation and version comparison |
| `skills/prism-release/SKILL.md` | Version release pipeline |
| `skills/prism-docs-update/SKILL.md` | VitePress documentation sync |
| `.claude-plugin/plugin.json` | Plugin metadata (name, version, author) |
| `.claude-plugin/marketplace.json` | Marketplace listing for GitHub discovery |
| `CLAUDE.md` | Project-level instructions loaded by Claude Code |
| `commands/*.md` | 25 command files, invocable via `/command-name` |
| `agents/*.md` | 12 agent files, spawned via `Task(subagent_type="...")` |

## Component Analysis

### 1. Skill Discovery Mechanism

**Location**: `skills/*/SKILL.md` (convention-based, 14 skills total)

**How it works**:
- Claude Code auto-discovers skills by scanning the `skills/` directory for subdirectories containing `SKILL.md` files
- Each `SKILL.md` has YAML frontmatter with three key fields:
  - `name`: The skill identifier (used as `/skill-name` slash command)
  - `description`: Natural language trigger phrases that Claude matches against user intent
  - `model`: Which Claude model to use (`opus`, `sonnet`, or implicitly `haiku` for agents)
- There is no manifest file, no registration code, and no routing configuration -- discovery is purely convention-based
- The `.claude-plugin/plugin.json` provides only plugin-level metadata (name: `prism`, version: `2.5.2`), not individual skill registration

**Discovery flow**:
```
Claude Code startup
  -> Scans skills/*/SKILL.md
  -> Parses YAML frontmatter (name, description, model)
  -> Registers each as an invocable skill
  -> User input matched against description trigger phrases
  -> Best-matching skill activated
```

### 2. The Prism Meta-Skill (Hub/Router)

**Location**: `skills/prism/SKILL.md`

**How it works**:
- The meta-skill named `prism` serves as the central hub for the entire workflow
- Its `description` field triggers on broad phrases: "help me build", "implement this feature", "fix this bug", "prism", "structured workflow", or "complex multi-step tasks"
- When activated, it provides Claude with a comprehensive routing table that maps scenarios to phase-specific skills

**Routing logic** (lines 38-44 of `skills/prism/SKILL.md`):

The meta-skill defines a "Workflow Selection" table:
| Scenario | Phases |
|----------|--------|
| New feature, unfamiliar codebase | Full R->P->I->V |
| Feature in known codebase | P->I->V (skip Research) |
| Simple change, clear scope | I->V (skip Research + Plan) |
| Trivial fix (<20 lines) | Direct implementation |

**Routing mechanism** (lines 48-62):
- The meta-skill instructs Claude to first spawn a `prism-locator` agent to check `.prism/` for existing artifacts
- Based on what the locator finds, it routes to the appropriate phase:
  - **Nothing exists** -> Start with `/prism-research`
  - **Research exists** -> Start with `/prism-plan`
  - **Plan exists (incomplete)** -> Resume with `/prism-implement`
  - **Implementation done** -> Run `/prism-validate`

This is not programmatic routing -- it is prompt-based guidance that relies on Claude's judgment to select the correct phase entry point.

### 3. Trigger Phrase Matching

**Location**: YAML `description` field in each `SKILL.md`

**How it works**:
- Each skill has carefully crafted trigger phrases in its description
- Claude Code uses these descriptions to match user intent to the appropriate skill
- There is overlap between the meta-skill and phase-specific skills, allowing both direct invocation and hub-mediated routing

**Trigger phrase map**:

| Skill | Key Trigger Phrases |
|-------|-------------------|
| `prism` | "help me build", "implement this feature", "fix this bug", "prism", "structured workflow" |
| `prism-research` | "research this", "understand how X works", "map out the system", "explore the codebase" |
| `prism-plan` | "create a plan", "plan the implementation", "design how to build" |
| `prism-implement` | "implement the plan", "start building", "execute phase 1" |
| `prism-validate` | "validate the plan", "verify implementation", "check if complete" |
| `prism-iterate` | "iterate on plan", "update and continue", "adjust the approach" |
| `prism-debug` | "debug this", "why is this failing", "investigate the error" |
| `prism-spectrum` | "spectrum", "execute story", "run spectrum" |
| `prism-verify` | "verify the UI", "check the browser", "visual verification" |
| `prism-prd` | "create a PRD", "write product requirements", "document this product" |
| `prism-visual-docs` | "create user flows", "design the screens", "map user journeys" |
| `prism-eval` | "run evals", "compare versions", "benchmark skills" |
| `prism-release` | "release", "bump version", "new version", "cut a release" |
| `prism-docs-update` | "update prism docs", "sync docs site" |

### 4. Three-Layer Component Architecture

**Location**: Documented in `CLAUDE.md:28-31` and implemented across `skills/`, `commands/`, `agents/`

**How it works**:
```
Skills (Orchestrators)  ->  Commands (Operations)  ->  Agents (Specialists)
```

- **Skills** (14 files in `skills/*/SKILL.md`): Auto-discovered workflow orchestrators. Entry points for workflows. They invoke commands and spawn agents.
- **Commands** (25 files in `commands/*.md`): User-invocable via `/command-name`. Single-purpose prompt files. Skills often delegate to commands (e.g., `prism-prd` skill invokes `/generate_prd` command).
- **Agents** (12 files in `agents/*.md`): Spawned via `Task(subagent_type="agent-name")`. Run in parallel. Each has specific tools and model assignments.

**Invocation chains observed**:
- `prism` (skill) -> spawns `prism-locator` (agent) -> routes to `prism-research` (skill)
- `prism-research` (skill) -> spawns `codebase-locator`, `codebase-analyzer`, etc. (agents)
- `prism-prd` (skill) -> invokes `/generate_prd` (command)
- `prism-visual-docs` (skill) -> invokes `/generate_user_flows` (command) and optionally `/generate_tech_spec` (command)
- `prism-plan` (skill) -> spawns `codebase-analyzer`, `prism-analyzer` (agents)
- `prism-debug` (skill) -> spawns `log-investigator`, `state-investigator`, `git-investigator` (agents)
- `prism-verify` (skill) -> spawns `browser-verifier`, `visual-regression-grader` (agents)

### 5. Skill-to-Skill Routing Connections

**Location**: Documented within each skill's workflow sections

**How it works**:
- Skills reference each other as next steps, creating implicit flow chains
- The meta-skill (`prism`) documents the complete flow: Research -> Plan -> Implement -> Verify -> Validate
- Individual skills embed "next phase" guidance in their text

**Document generation flow** (from `skills/prism/SKILL.md:228-234`):
```
prism-prd  -->  prism-visual-docs  -->  prism-plan
(Product)       (UX Flows & Specs)      (Impl Steps)
```

**Core workflow flow**:
```
prism-research  -->  prism-plan  -->  prism-implement  -->  prism-verify  -->  prism-validate
(Phase 1)            (Phase 2)       (Phase 3)             (Phase 3.5)       (Phase 4)
         \                                    |
          \                                   v
           \                            prism-iterate  (feedback loop back to plan)
            \                                 |
             \                                v
              \                         prism-debug  (diagnostic when things fail)
               \
                --> prism-spectrum  (autonomous multi-story execution)
```

### 6. Model Assignment Convention

**Location**: YAML `model` field in each `SKILL.md` and `agents/*.md`

| Model | Usage | Skills/Agents |
|-------|-------|---------------|
| Opus | Deep analysis, planning | `prism-plan`, `prism-iterate`, `prism-prd`, `prism-visual-docs`, `codebase-analyzer`, `prism-analyzer` |
| Sonnet | General work, implementation | `prism`, `prism-research`, `prism-implement`, `prism-validate`, `prism-debug`, `prism-spectrum`, `prism-eval`, `codebase-pattern-finder`, `web-search-researcher` |
| Haiku | Fast lookups | `prism-locator`, `codebase-locator`, `browser-verifier` |

### 7. Command Discovery System

**Location**: `commands/*.md`

**How it works**:
- Commands are auto-discovered from `commands/*.md` (no SKILL.md wrapper needed)
- Each has YAML frontmatter with `description` and `model` fields
- Invoked via `/command-name` (the filename minus `.md`)
- Commands are the operational layer -- they do the actual work that skills orchestrate

**Relationship to skills**:
- Some commands have parallel skill equivalents (e.g., `commands/research_codebase.md` and `skills/prism-research/SKILL.md` both cover research)
- Skills add workflow orchestration on top of what commands do raw
- The command version (`/research_codebase`) is more detailed and standalone
- The skill version (`prism-research`) is more concise and agent-oriented

## Patterns Found

### Pattern 1: Frontmatter-Based Discovery

**Example at**: `skills/prism-research/SKILL.md:1-5`

```yaml
---
name: prism-research
description: Research phase for complex coding tasks. Use when exploring a codebase...
model: sonnet
---
```

**Also used in**: All 14 skill files, all 25 command files, all 12 agent files

### Pattern 2: Agent Delegation via Task()

**Example at**: `skills/prism/SKILL.md:53-55`

```
Task(subagent_type="prism-locator")
"Find existing research, plans, or work related to [topic]"
```

**Also used in**:
- `skills/prism-research/SKILL.md:44-46` (prism-locator)
- `skills/prism-research/SKILL.md:50-52` (codebase-locator)
- `skills/prism-debug/SKILL.md` (log-investigator, state-investigator, git-investigator)
- `skills/prism-verify/SKILL.md:30` (browser-verifier, visual-regression-grader)

### Pattern 3: Conditional Phase Entry

**Example at**: `skills/prism/SKILL.md:56-62`

The meta-skill checks for existing artifacts and routes accordingly:
- Nothing exists -> Research
- Research exists -> Plan
- Plan exists -> Implement
- Implementation done -> Validate

This pattern ensures work is never repeated unnecessarily.

### Pattern 4: Skill-Command Duality

Some operations exist at both the skill and command layers:
- `skills/prism-research/SKILL.md` <-> `commands/research_codebase.md`
- `skills/prism-plan/SKILL.md` <-> `commands/create_plan.md`
- `skills/prism-implement/SKILL.md` <-> `commands/implement_plan.md`
- `skills/prism-validate/SKILL.md` <-> `commands/validate_plan.md`
- `skills/prism-debug/SKILL.md` <-> `commands/prism-debug.md`

The skill versions are orchestrators (shorter, delegate to agents); the command versions are standalone operators (longer, more detailed instructions).

## Historical Context

From `.prism/` directory:

- `.prism/shared/research/2026-02-22-prism-plugin-architecture.md` - Prior comprehensive architecture analysis (v2.1.8) documenting the three-layer model, all skills, commands, and agents with visual diagrams
- `.prism/shared/research/2026-03-07-prism-v250-gap-analysis.md` - Gap analysis for v2.5.0

## Architecture Notes

- **No programmatic routing**: The entire routing system is prompt-based. There is no code, no router, no state machine -- just YAML frontmatter descriptions and natural language instructions in markdown files.
- **Convention over configuration**: `skills/*/SKILL.md` is the only pattern needed for skill registration. No manifest, no imports, no build step.
- **Hub-and-spoke model**: The `prism` meta-skill serves as a hub that references all phase skills, but each phase skill can also be invoked directly via its trigger phrases.
- **Agent-mediated routing**: The meta-skill uses the `prism-locator` agent to inspect `.prism/` state before deciding which phase to enter, making routing context-aware.
- **Model-stratified**: Opus handles complex reasoning (planning, PRDs), Sonnet handles general work (research, implementation), Haiku handles fast lookups (locators).

## Open Questions

- [ ] How does Claude Code resolve conflicts when multiple skill descriptions match the same user input? (e.g., "help me research this" could match both `prism` and `prism-research`)
- [ ] Is there a priority or specificity ranking among skills, or is it purely based on description match quality?
- [ ] When the meta-skill routes to a phase skill, does it invoke it as a new skill activation or does it simply follow the phase skill's instructions inline?
- [ ] What happens when a user says "prism" -- does the meta-skill always win, or could a phase-specific skill intercept?

## Code References

| Reference | Description |
|-----------|-------------|
| `skills/prism/SKILL.md:1-5` | Meta-skill YAML frontmatter with trigger phrases |
| `skills/prism/SKILL.md:15-27` | Quick reference table mapping phases to skills and outputs |
| `skills/prism/SKILL.md:38-44` | Workflow selection table (scenario -> phases) |
| `skills/prism/SKILL.md:48-62` | State-based routing via prism-locator agent |
| `skills/prism/SKILL.md:228-234` | Document generation flow diagram |
| `skills/prism-research/SKILL.md:1-5` | Example phase skill frontmatter |
| `skills/prism-research/SKILL.md:20-31` | Available agents table |
| `CLAUDE.md:28-31` | Three-layer architecture description |
| `.claude-plugin/plugin.json` | Plugin metadata (v2.5.2) |
| `.claude-plugin/marketplace.json` | GitHub marketplace listing |
