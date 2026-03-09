---
date: 2026-03-08
researcher: Claude
git_commit: 9d421a43c7248fcb633a39b45501e4804897406c
branch: main
repository: prism-plugin
topic: "Navigation System in the Prism Plugin"
tags: [research, navigation, skills, agents, commands, workflow, routing]
status: complete
---

# Research: Navigation System in the Prism Plugin

## Research Question

How does the navigation system work in this codebase? This project is a Claude Code plugin with skills, agents, and commands. Document the navigation/routing mechanisms that connect these components.

## Summary

Prism's navigation system is a three-layer architecture (Skills -> Commands -> Agents) where navigation is driven by Claude Code's auto-discovery mechanism via YAML frontmatter in markdown files. Skills at `skills/*/SKILL.md` are auto-discovered and activated by trigger phrases in their `description` field; commands at `commands/*.md` are user-invocable via `/command-name` slash syntax; and agents at `agents/*.md` are spawned programmatically via `Task(subagent_type="agent-name")`. The hub skill (`skills/prism/SKILL.md`) acts as the central routing table, directing users to the correct phase-specific skill based on workflow state.

## Files Discovered

| File | Purpose |
|------|---------|
| `.claude-plugin/plugin.json` | Plugin metadata (name, version, description) |
| `skills/prism/SKILL.md` | Hub skill — central routing table for the 4-phase workflow |
| `skills/prism-research/SKILL.md` | Research phase orchestrator |
| `skills/prism-plan/SKILL.md` | Planning phase orchestrator |
| `skills/prism-implement/SKILL.md` | Implementation phase orchestrator |
| `skills/prism-validate/SKILL.md` | Validation phase orchestrator |
| `skills/prism-iterate/SKILL.md` | Iteration phase (plan updates + re-implementation) |
| `skills/prism-spectrum/SKILL.md` | Autonomous multi-story execution |
| `skills/prism-debug/SKILL.md` | Debug investigation orchestrator |
| `skills/prism-verify/SKILL.md` | Browser-based UI verification |
| `skills/prism-prd/SKILL.md` | PRD generation orchestrator |
| `skills/prism-visual-docs/SKILL.md` | Visual documentation generation |
| `skills/prism-eval/SKILL.md` | Skill evaluation and version comparison |
| `skills/prism-release/SKILL.md` | Release pipeline orchestrator |
| `skills/prism-docs-update/SKILL.md` | VitePress docs sync |
| `commands/create_plan.md` | Interactive plan creation command |
| `commands/implement_plan.md` | Plan execution command |
| `commands/decompose_plan.md` | Plan-to-stories decomposition |
| `commands/commit.md` | Git commit creation |
| `commands/create_handoff.md` | Session handoff document creation |
| `commands/resume_handoff.md` | Resume from handoff document |
| `commands/validate_plan.md` | Plan validation command |
| `commands/describe_pr.md` | PR description generation |
| `commands/research_codebase.md` | Codebase research command |
| `commands/worktree.md` | Git worktree management |
| `agents/codebase-locator.md` | File location agent (haiku) |
| `agents/codebase-analyzer.md` | Code analysis agent |
| `agents/codebase-pattern-finder.md` | Pattern discovery agent |
| `agents/prism-locator.md` | .prism/ document finder (haiku) |
| `agents/prism-analyzer.md` | .prism/ document insight extractor |
| `agents/web-search-researcher.md` | External research agent |
| `agents/graph-navigator.md` | Structural graph analysis agent |
| `agents/log-investigator.md` | Log analysis agent (haiku) |
| `agents/state-investigator.md` | App state analysis agent (haiku) |
| `agents/git-investigator.md` | Git history analysis agent (haiku) |
| `agents/browser-verifier.md` | Headless browser verification agent (haiku) |
| `scripts/spectrum.sh` | Autonomous execution loop script |
| `CLAUDE.md` | Project-wide instructions and conventions |

## Component Analysis

### Layer 1: Auto-Discovery via YAML Frontmatter

**Location**: All `skills/*/SKILL.md`, `commands/*.md`, `agents/*.md`

**How it works**:
- Every skill, command, and agent file starts with a YAML frontmatter block delimited by `---`
- The `name` field defines the identifier (e.g., `name: prism-research`)
- The `description` field contains trigger phrases that Claude Code uses to match user intent
- The `model` field assigns the AI model tier: `opus` for deep analysis, `sonnet` for general work, `haiku` for fast lookups
- The optional `tools` field (agents only) restricts which tools the agent can use

**Skill discovery**: Claude Code auto-discovers skills from `skills/*/SKILL.md`. When a user's message matches trigger phrases in a skill's description, that skill activates.

**Command discovery**: Claude Code auto-discovers commands from `commands/*.md`. Users invoke them directly via `/command-name` syntax (e.g., `/create_plan`, `/commit`).

**Agent discovery**: Agents at `agents/*.md` are NOT directly user-invocable. They are spawned programmatically by skills/commands via `Task(subagent_type="agent-name")`.

### Layer 2: Hub Skill (Central Router)

**Location**: `skills/prism/SKILL.md`

**How it works**:
- The hub skill activates on broad trigger phrases: "help me build", "implement this feature", "fix this bug", "prism", "structured workflow"
- It acts as a routing table that maps workflow state to the appropriate phase skill
- Entry point: `skills/prism/SKILL.md:1-4` — YAML frontmatter with broad triggers
- Routing logic: `skills/prism/SKILL.md:48-62` — checks `.prism/` for existing artifacts to determine where to start

**Decision flow**:
```
User triggers "prism" or similar
  → Hub skill checks .prism/ via prism-locator agent
    → Nothing exists        → Route to /prism-research
    → Research exists       → Route to /prism-plan
    → Plan exists (partial) → Route to /prism-implement
    → Implementation done   → Route to /prism-validate
```

**Workflow selection** (`skills/prism/SKILL.md:37-44`):
```
New feature, unfamiliar codebase  → R->P->I->V (full)
Feature in known codebase         → P->I->V (skip Research)
Simple change, clear scope        → I->V (skip Research + Plan)
Trivial fix (<20 lines)           → Direct implementation
```

### Layer 3: Phase-Specific Skills

**Location**: `skills/prism-research/`, `skills/prism-plan/`, `skills/prism-implement/`, `skills/prism-validate/`

**How they work**:
Each phase skill has its own trigger phrases and workflow. The navigation between phases is sequential and documented:

1. **prism-research** (`skills/prism-research/SKILL.md:3`): Triggers on "research this", "understand how X works", "map out the system". Spawns parallel agents (codebase-locator, codebase-analyzer, codebase-pattern-finder, prism-locator, web-search-researcher). Outputs to `.prism/shared/research/`.

2. **prism-plan** (`skills/prism-plan/SKILL.md:3`): Triggers on "create a plan", "plan the implementation". Loads research, presents understanding, gets iterative approval. Outputs to `.prism/shared/plans/`.

3. **prism-implement** (`skills/prism-implement/SKILL.md:3`): Triggers on "implement the plan", "start building", "execute phase 1". Reads plan, executes phase by phase with verification checkpoints. Updates plan checkboxes.

4. **prism-validate** (`skills/prism-validate/SKILL.md:3`): Triggers on "validate the plan", "verify implementation". Compares code against plan, runs verification commands. Outputs to `.prism/shared/validation/`.

### Layer 4: Agent Invocation Pattern

**Location**: All agent files in `agents/`

**How it works**:
- Skills and commands spawn agents via `Task(subagent_type="agent-name")` with a prompt string
- Agents run in parallel when researching different areas (`skills/prism-research/SKILL.md:98`)
- Each agent has restricted tool access via the `tools` field (e.g., `tools: Read, Glob, Grep, Bash`)
- Model assignment follows a convention: opus for deep analysis, sonnet for general work, haiku for fast lookups

**Research agents** (spawned by prism-research):
- `codebase-locator` (haiku) — finds WHERE files live
- `codebase-analyzer` — understands HOW code works
- `codebase-pattern-finder` — finds patterns to model after
- `prism-locator` (haiku) — finds existing .prism/ documents
- `prism-analyzer` — extracts insights from .prism/ docs
- `web-search-researcher` — researches external APIs/docs
- `graph-navigator` — structural analysis via knowledge graph

**Debug agents** (spawned by prism-debug):
- `log-investigator` (haiku) — analyzes log files
- `state-investigator` (haiku) — checks application state
- `git-investigator` (haiku) — analyzes git history

**Verification agent** (spawned by prism-verify):
- `browser-verifier` (haiku) — executes playwright-cli commands

### Layer 5: Command Navigation

**Location**: `commands/*.md`

**How it works**:
- Commands are single-purpose operations invoked via `/command-name`
- Skills reference commands to delegate specific operations
- Commands can also be invoked standalone by the user

**Command-to-skill mapping**:
| Command | Invoked By |
|---------|-----------|
| `/research_codebase` | `prism-research` |
| `/create_plan` | `prism-plan` |
| `/implement_plan` | `prism-implement` |
| `/validate_plan` | `prism-validate` |
| `/iterate_plan` | `prism-iterate` |
| `/decompose_plan` | `prism-spectrum` (pre-step) |
| `/commit` | `prism-implement` (post-phase) |
| `/describe_pr` | `prism-implement` (post-completion) |
| `/create_handoff` | Any skill at context limit |
| `/resume_handoff` | Session start |
| `/generate_prd` | `prism-prd` |
| `/generate_user_flows` | `prism-visual-docs` |
| `/generate_tech_spec` | `prism-visual-docs` |
| `/generate_pricing` | `prism-prd` |

### Layer 6: Spectrum Autonomous Navigation

**Location**: `scripts/spectrum.sh`, `skills/prism-spectrum/SKILL.md`

**How it works**:
- `spectrum.sh` is a bash script that orchestrates autonomous execution outside Claude's context
- It spawns fresh Claude CLI sessions per story (no context degradation)
- Story selection is deterministic: `spectrum.sh:180-197` uses jq to find the highest-priority pending unblocked story
- Each iteration calls `claude --dangerously-skip-permissions --print "$prompt"` (`spectrum.sh:314`)
- Navigation between stories uses signal protocol tags in Claude's output:
  - `<spectrum-continue>` — story complete, continue to next
  - `<spectrum-retry>` — quality gate failed, retry same story
  - `<spectrum-blocked>` — story blocked, try next
  - `<spectrum-error>` — fatal error, stop
  - `<promise>COMPLETE</promise>` — all stories done

**State persistence**: `stories.json` tracks story status; `progress.md` accumulates learnings across iterations.

### Layer 7: Session Handoff Navigation

**Location**: `commands/create_handoff.md`, `commands/resume_handoff.md`

**How it works**:
- When context reaches 40-60%, skills consider phase transitions (`skills/prism/SKILL.md:239-243`)
- At >60% context, `/create_handoff` saves state to `.prism/shared/handoffs/`
- New sessions resume via `/resume_handoff <handoff-file-path>`
- Handoff documents contain: tasks, critical references, recent changes, learnings, artifacts, and next steps

### Layer 8: Document Generation Sub-workflow

**Location**: `skills/prism-prd/SKILL.md`, `skills/prism-visual-docs/SKILL.md`

**How it works**:
- `prism-prd` orchestrates PRD creation, then offers next steps: `/generate_user_flows`, `/generate_tech_spec`, `/generate_pricing`
- `prism-visual-docs` locates the PRD, generates user flows and optionally tech specs
- Document flow: `prism-prd` -> `prism-visual-docs` -> `prism-plan`

## Patterns Found

### Pattern: YAML Frontmatter Trigger Matching

**Example at**: `skills/prism-research/SKILL.md:1-5`

```yaml
---
name: prism-research
description: Research phase for complex coding tasks. Use when exploring a codebase before planning implementation. Triggers on "research this", "understand how X works", "map out the system", "explore the codebase", or when starting unfamiliar work.
model: sonnet
---
```

**Also used in**:
- `skills/prism-plan/SKILL.md:1-5`
- `skills/prism-implement/SKILL.md:1-5`
- `skills/prism-validate/SKILL.md:1-5`
- All 14 skill files, all 25 command files, all 11 agent files

### Pattern: Task(subagent_type) Invocation

**Example at**: `skills/prism-research/SKILL.md:44-46`

```
Task(subagent_type="prism-locator")
"Find existing research about [topic]"
```

**Also used in**:
- `skills/prism/SKILL.md:53-55` — hub skill spawns prism-locator
- `skills/prism-plan/SKILL.md:37-39` — plan skill spawns prism-analyzer
- `skills/prism-debug/SKILL.md:64-86` — debug skill spawns 3 investigators in parallel
- `skills/prism-verify/SKILL.md:75-81` — verify skill spawns browser-verifier

### Pattern: Phase Checkpoint Stop-and-Confirm

**Example at**: `skills/prism-implement/SKILL.md:59-72`

```markdown
## Phase [N] Complete

**Changes**: [summary]
**Verification**: [x] passed

**Next**: Phase [N+1] - [name]

Ready to proceed?
```

**Also used in**:
- `commands/implement_plan.md:51-63` — pause for manual verification
- `skills/prism-plan/SKILL.md:76-85` — get structure approval before writing

### Pattern: .prism/ Directory as Navigation State

**Example at**: `skills/prism/SKILL.md:48-62`

The hub skill uses the presence/absence of files in `.prism/` subdirectories to determine which workflow phase to route to:
- `.prism/shared/research/` — research artifacts
- `.prism/shared/plans/` — plan documents
- `.prism/shared/validation/` — validation reports
- `.prism/shared/handoffs/` — session handoff documents
- `.prism/stories/stories.json` — Spectrum execution state

### Pattern: Signal Protocol for External Orchestration

**Example at**: `scripts/spectrum.sh:324-361`

```bash
if echo "$output" | grep -q '<promise>COMPLETE</promise>'; then
    return 0  # Complete
fi
if echo "$output" | grep -q '<spectrum-continue>'; then
    return 1  # Continue
fi
```

**Also used in**:
- `skills/prism-spectrum/SKILL.md:186-191` — signal emission from skill side
- `scripts/spectrum.sh:436-478` — signal handling in orchestrator

## Historical Context

From `.prism/` directory:

- `.prism/shared/research/2026-02-22-prism-plugin-architecture.md` — Comprehensive architecture analysis (v2.1.8) covering all three layers, component counts (10 skills, 22 commands, 9 agents at that time)
- `.prism/shared/research/2026-03-07-prism-v250-gap-analysis.md` — Recent gap analysis of v2.5.0

## Architecture Notes

- **Convention**: All skills live in `skills/<skill-name>/SKILL.md` — the directory name is the skill identifier
- **Convention**: All commands live in `commands/<command-name>.md` — the filename (without .md) is the slash command name
- **Convention**: All agents live in `agents/<agent-name>.md` — the filename (without .md) is the subagent_type identifier
- **Pattern**: Model tier assignment: Opus for deep analysis/planning, Sonnet for general execution, Haiku for fast lookups
- **Pattern**: Parallel agent spawning for efficiency — research skills spawn multiple agents simultaneously
- **Pattern**: File-based state persistence — all navigation state lives in `.prism/` directory, enabling cross-session continuity
- **Decision**: No build step for the plugin itself — 100% markdown-based prompt engineering
- **Decision**: Fresh context per Spectrum iteration — memory persists through files and git commits, not AI context

## Open Questions

- [ ] How does Claude Code's internal plugin loader parse and prioritize overlapping trigger phrases between skills? (e.g., if both `prism` hub skill and `prism-research` match a user query)
- [ ] Is there a maximum number of agents that can be spawned in parallel, or is this limited by the Claude API?
- [ ] How does the `prism-eval` skill's comparative mode interact with the navigation system when evaluating different skill versions?

## Code References

Quick navigation:

| Reference | Description |
|-----------|-------------|
| `skills/prism/SKILL.md:1-4` | Hub skill frontmatter with broad triggers |
| `skills/prism/SKILL.md:48-62` | State-based routing logic |
| `skills/prism/SKILL.md:37-44` | Workflow selection table |
| `skills/prism/SKILL.md:239-243` | Context management thresholds |
| `skills/prism-research/SKILL.md:1-5` | Research skill trigger phrases |
| `skills/prism-research/SKILL.md:44-46` | Agent spawning pattern |
| `skills/prism-research/SKILL.md:98` | Parallel agent execution rule |
| `skills/prism-plan/SKILL.md:37-39` | Plan loads research via prism-analyzer |
| `skills/prism-implement/SKILL.md:59-72` | Phase checkpoint pattern |
| `skills/prism-debug/SKILL.md:60-86` | Parallel debug investigation agents |
| `skills/prism-spectrum/SKILL.md:82-83` | Deterministic story selection |
| `skills/prism-spectrum/SKILL.md:186-191` | Signal protocol emission |
| `scripts/spectrum.sh:180-197` | jq-based story selection |
| `scripts/spectrum.sh:300-322` | Claude CLI invocation per iteration |
| `scripts/spectrum.sh:324-361` | Signal protocol parsing |
| `commands/create_handoff.md:14-15` | Handoff file naming convention |
| `agents/codebase-locator.md:1-6` | Agent frontmatter with tools restriction |
| `.claude-plugin/plugin.json:1-8` | Plugin identity and version |
