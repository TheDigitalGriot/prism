---
date: 2026-03-08T00:00:00Z
researcher: Claude
git_commit: 3b1ceb82b2010d270a0a458d278638119fb44b0b
branch: main
repository: prism-plugin
topic: "Navigation System in the Prism Plugin"
tags: [research, navigation, skills, commands, agents, workflow, auto-discovery, routing]
status: complete
---

# Research: Navigation System in the Prism Plugin

## Research Question

How does the navigation system work in this codebase? This project is a Claude Code plugin with skills, agents, and commands. Research how users and the system navigate between these components.

## Summary

The Prism plugin uses a three-layer navigation system: **Skills** (auto-discovered orchestrators), **Commands** (user-invocable operations), and **Agents** (spawnable specialists). Navigation is driven by YAML frontmatter metadata in markdown files — Claude Code's runtime auto-discovers skills from `skills/*/SKILL.md` via `description` field trigger phrases, commands from `commands/*.md` via `/command-name` slash invocations, and agents via `Task(subagent_type="agent-name")` spawning. There is no explicit routing table or registry; the entire navigation graph is implicit in the markdown files' frontmatter and cross-references.

## Files Discovered

| File | Purpose |
|------|---------|
| `skills/*/SKILL.md` (14 files) | Skill definitions with YAML frontmatter (name, description, model) |
| `commands/*.md` (25 files) | Command definitions with YAML frontmatter (description, model) |
| `agents/*.md` (12 files) | Agent definitions with YAML frontmatter (name, description, tools, model) |
| `.claude-plugin/plugin.json` | Plugin registration metadata (name, version, author) |
| `skills/prism/SKILL.md` | Hub skill — primary entry point and workflow router |
| `skills/prism/scripts/init_prism.py` | Initializes `.prism/` directory structure |
| `scripts/spectrum.sh` | External shell orchestrator for autonomous multi-story execution |
| `CLAUDE.md` | Project-level instructions loaded by Claude Code runtime |

## Component Analysis

### 1. Auto-Discovery Mechanism (Skills)

**Location**: `skills/*/SKILL.md`

**How it works**:
- Claude Code scans `skills/*/SKILL.md` files at plugin load time
- Each SKILL.md has YAML frontmatter with three fields: `name`, `description`, `model`
- The `description` field contains **trigger phrases** that Claude Code matches against user input
- When a trigger matches, Claude Code activates the skill using the specified `model` (opus/sonnet/haiku)
- Example from `skills/prism-research/SKILL.md:3`: `description: "... Triggers on 'research this', 'understand how X works', 'map out the system' ..."`

**All 14 skills and their trigger phrases**:

| Skill | Key Triggers | Model |
|-------|-------------|-------|
| `prism` | "help me build", "implement this feature", "prism" | sonnet |
| `prism-research` | "research this", "understand how X works", "explore the codebase" | sonnet |
| `prism-plan` | "create a plan", "plan the implementation" | opus |
| `prism-implement` | "implement the plan", "start building", "execute phase 1" | sonnet |
| `prism-validate` | "validate the plan", "verify implementation" | sonnet |
| `prism-iterate` | "iterate on plan", "update and continue" | opus |
| `prism-debug` | "debug this", "why is this failing" | sonnet |
| `prism-spectrum` | "spectrum", "execute story", "run spectrum" | sonnet |
| `prism-verify` | "verify the UI", "check the browser" | sonnet |
| `prism-prd` | "create a PRD", "write product requirements" | opus |
| `prism-visual-docs` | "create user flows", "design the screens" | opus |
| `prism-docs-update` | "update prism docs", "sync docs site" | (default) |
| `prism-eval` | "run evals", "compare versions", "benchmark skills" | sonnet |
| `prism-release` | "release", "bump version", "new version" | (default) |

### 2. Command Invocation (Commands)

**Location**: `commands/*.md`

**How it works**:
- Commands are invoked via slash syntax: `/command-name` (filename without `.md`)
- Each command file has YAML frontmatter with `description` and `model`
- The filename determines the invocation path (e.g., `commands/commit.md` -> `/commit`)
- Commands are single-purpose operations — they do not orchestrate workflows
- Skills reference commands by name in their markdown body (e.g., `skills/prism-implement/SKILL.md:100` references `/commit`, `/validate`, `/describe_pr`)

**All 25 commands**:

| Command | Invocation | Model |
|---------|-----------|-------|
| `commit.md` | `/commit` | haiku |
| `research_codebase.md` | `/research_codebase` | opus |
| `create_plan.md` | `/create_plan` | opus |
| `implement_plan.md` | `/implement_plan` | sonnet |
| `validate_plan.md` | `/validate_plan` | sonnet |
| `iterate_plan.md` | `/iterate_plan` | opus |
| `decompose_plan.md` | `/decompose_plan` | opus |
| `describe_pr.md` | `/describe_pr` | sonnet |
| `create_handoff.md` | `/create_handoff` | sonnet |
| `resume_handoff.md` | `/resume_handoff` | sonnet |
| `generate_prd.md` | `/generate_prd` | opus |
| `generate_pricing.md` | `/generate_pricing` | opus |
| `generate_tech_spec.md` | `/generate_tech_spec` | opus |
| `generate_user_flows.md` | `/generate_user_flows` | opus |
| `prism_dir_update.md` | `/prism_dir_update` | sonnet |
| `prism_cli.md` | `/prism_cli` | (none) |
| `cli-install.md` | `/cli-install` | sonnet |
| `cli-uninstall.md` | `/cli-uninstall` | sonnet |
| `prism-debug.md` | `/prism-debug` | sonnet |
| `prism-screenshot.md` | `/prism-screenshot` | haiku |
| `prism-browse.md` | `/prism-browse` | sonnet |
| `prism-verify.md` | `/prism-verify` | sonnet |
| `retroactive.md` | `/retroactive` | sonnet |
| `review-setup.md` | `/review-setup` | haiku |
| `worktree.md` | `/worktree` | haiku |

### 3. Agent Spawning (Agents)

**Location**: `agents/*.md`

**How it works**:
- Agents are spawned from skills/commands via the Task tool: `Task(subagent_type="agent-name")`
- Each agent file has YAML frontmatter with `name`, `description`, `tools`, and `model`
- The `tools` field restricts which tools the agent can access (e.g., `Read, Glob, Grep, Bash`)
- Agents run in parallel when searching different areas
- The `name` field in the frontmatter matches the `subagent_type` parameter

**All 12 agents**:

| Agent | Purpose | Model | Tools |
|-------|---------|-------|-------|
| `codebase-locator` | Find WHERE files live | haiku | Read, Glob, Grep, Bash |
| `codebase-analyzer` | Understand HOW code works | sonnet | (varies) |
| `codebase-pattern-finder` | Find patterns to model after | sonnet | (varies) |
| `prism-locator` | Find existing `.prism/` docs | haiku | Read, Glob, Grep |
| `prism-analyzer` | Extract insights from docs | opus | (varies) |
| `graph-navigator` | Structural analysis via knowledge graph | (varies) | (varies) |
| `web-search-researcher` | Research external docs/APIs | sonnet | (varies) |
| `log-investigator` | Analyze logs for errors | haiku | (varies) |
| `state-investigator` | Check app state and config | haiku | (varies) |
| `git-investigator` | Analyze git history | haiku | (varies) |
| `browser-verifier` | Headless browser checks | (varies) | (varies) |
| `visual-regression-grader` | Compare visual snapshots | (varies) | (varies) |

### 4. Hub Skill — The Primary Router

**Location**: `skills/prism/SKILL.md`

**How it works**:
- The `prism` skill acts as the central hub and workflow router
- It contains a workflow selection table (`skills/prism/SKILL.md:39-44`) that maps scenarios to phase sequences:
  - New feature, unfamiliar codebase -> Full R->P->I->V
  - Feature in known codebase -> P->I->V (skip Research)
  - Simple change, clear scope -> I->V (skip Research + Plan)
  - Trivial fix (<20 lines) -> Direct implementation
- It checks for existing work by spawning `prism-locator` agent
- Based on findings, it routes to the appropriate phase skill:
  - Nothing exists -> Start with `/prism-research`
  - Research exists -> Start with `/prism-plan`
  - Plan exists (incomplete) -> Resume with `/prism-implement`
  - Implementation done -> Run `/prism-validate`

**Data flow**:
```
User request -> prism (hub) -> prism-locator agent -> routing decision
                                                     |
                    +-------+-------+-------+--------+
                    |       |       |       |
                    v       v       v       v
               research   plan  implement validate
```

### 5. Phase-to-Phase Navigation

**How it works**:
- Phases navigate to each other through **file-based state** in `.prism/shared/`
- There are no explicit programmatic transitions between skills
- Each phase reads from and writes to specific directories:
  - Research saves to `.prism/shared/research/` -> Plan reads from it
  - Plan saves to `.prism/shared/plans/` -> Implement reads from it
  - Implement updates plan checkboxes -> Validate reads from plans
  - Validate saves to `.prism/shared/validation/` -> Iterate reads from it
- The user manually invokes the next phase by using the appropriate slash command or trigger phrase

**Phase navigation chain**:
```
/prism-research                /prism-plan                /prism-implement           /prism-validate
      |                              |                            |                         |
      v                              v                            v                         v
.prism/shared/research/   ->  .prism/shared/plans/   ->  Plan checkboxes    ->  .prism/shared/validation/
      YYYY-MM-DD-topic.md          YYYY-MM-DD-plan.md        updated                  YYYY-MM-DD-report.md
```

### 6. Spectrum Autonomous Navigation

**Location**: `scripts/spectrum.sh`, `skills/prism-spectrum/SKILL.md`

**How it works**:
- `spectrum.sh` is an external bash loop that spawns fresh Claude Code sessions
- It reads `.prism/stories/stories.json` for the work backlog
- Story selection is deterministic via `jq`: pending, unblocked, lowest priority number (`spectrum.sh:181-197`)
- Each iteration invokes: `claude --dangerously-skip-permissions --print "$prompt"` (`spectrum.sh:314-316`)
- The prompt tells Claude to use `/prism-spectrum` with a specific story ID
- Navigation signals are embedded in Claude's text output and parsed by grep:
  - `<promise>COMPLETE</promise>` — all done
  - `<spectrum-continue>` — story complete, continue loop
  - `<spectrum-retry>` — retry same story
  - `<spectrum-blocked>` — skip to next
  - `<spectrum-error>` — fatal, stop
- State persists through files: `stories.json` (status updates) and `progress.md` (learnings)

**Data flow**:
```
spectrum.sh -> select_next_story() -> claude CLI -> /prism-spectrum skill
     ^                                                    |
     |                                                    v
     +---- check_signals() <---- text output <---- signal tags
     |
     v
stories.json (status update) + progress.md (learnings)
```

### 7. Document Generation Navigation

**Location**: `skills/prism/SKILL.md:228-234`

**How it works**:
- A secondary navigation flow exists for document generation
- Three skills chain together: `prism-prd` -> `prism-visual-docs` -> `prism-plan`
- `prism-prd` invokes the `/generate_prd` command
- `prism-visual-docs` invokes `/generate_user_flows` and optionally `/generate_tech_spec`
- Output from each flows to `.prism/shared/plans/` and feeds the next stage

```
prism-prd -----> prism-visual-docs -----> prism-plan
(Product Reqs)   (UX Flows & Specs)      (Impl Steps)
```

### 8. Debug Navigation

**Location**: `skills/prism-debug/SKILL.md:29-34`

**How it works**:
- Debug inserts into the workflow when implementation fails
- Navigation path: `Implement (failure)` -> `Debug` -> `Iterate`
- In Spectrum context, debug is auto-triggered on quality gate failure
- Debug spawns 3 parallel agents: `log-investigator`, `state-investigator`, `git-investigator`
- Debug output feeds into `<spectrum-retry>` signal for the next iteration

### 9. Model Assignment as Navigation Constraint

**How it works**:
- The `model` field in YAML frontmatter constrains which AI model handles each component
- This creates an implicit routing layer — heavier analysis goes to more capable models:
  - **Opus**: Deep analysis — `prism-plan`, `prism-iterate`, `prism-prd`, `prism-visual-docs`, `prism-analyzer` agent
  - **Sonnet**: General work — `prism-research`, `prism-implement`, `prism-validate`, `prism-spectrum`, `prism-debug`
  - **Haiku**: Fast lookups — `codebase-locator`, `prism-locator`, `commit`, `review-setup`, `worktree`, `prism-screenshot`

## Patterns Found

### Pattern: YAML Frontmatter Convention

**Example at**: `skills/prism-research/SKILL.md:1-5`

```yaml
---
name: prism-research
description: Research phase for complex coding tasks. Use when exploring... Triggers on "research this", "understand how X works"...
model: sonnet
---
```

**Also used in**:
- All 14 `skills/*/SKILL.md` files
- All 25 `commands/*.md` files
- All 12 `agents/*.md` files

Agents additionally have a `tools` field restricting their tool access.

### Pattern: File-Based State Transfer

**Example at**: `skills/prism/SKILL.md:17-23`

```markdown
| Phase | Skill | Output |
|-------|-------|--------|
| Research | `/prism-research` | `.prism/shared/research/YYYY-MM-DD-topic.md` |
| Plan | `/prism-plan` | `.prism/shared/plans/YYYY-MM-DD-feature.md` |
```

State transfer between phases happens entirely through the filesystem. Each phase writes to a known directory, and the next phase reads from it. There is no in-memory state passing.

### Pattern: Task() Agent Spawning

**Example at**: `skills/prism-research/SKILL.md:45-47`

```
Task(subagent_type="prism-locator")
"Find existing research about [topic]"
```

**Also used in**:
- `skills/prism/SKILL.md:53-55` — spawns `prism-locator`
- `skills/prism-debug/SKILL.md:63-85` — spawns 3 investigation agents in parallel
- `skills/prism-spectrum/SKILL.md:184-189` — spawns `visual-regression-grader`
- `commands/research_codebase.md:36-43` — spawns multiple research agents

### Pattern: Signal Protocol for External Orchestration

**Example at**: `scripts/spectrum.sh:329-361`

```bash
if echo "$output" | grep -q '<promise>COMPLETE</promise>'; then
    return 0  # Complete
fi
if echo "$output" | grep -q '<spectrum-continue>'; then
    return 1  # Continue
fi
```

Text-based signal tags in Claude's output are the communication channel between the AI and the shell orchestrator. The signals are: `<promise>COMPLETE</promise>`, `<spectrum-continue>`, `<spectrum-retry>`, `<spectrum-blocked>`, `<spectrum-error>`.

## Historical Context

From `.prism/` directory:

- `.prism/shared/research/2026-02-22-prism-plugin-architecture.md` — Previous comprehensive architecture analysis (v2.1.8) covering the three-layer model, all skills/commands/agents, and inter-component relationships
- `.prism/shared/research/2026-02-26-vscode-extension-cli-migration.md` — Research on VSCode extension and CLI integration

## Architecture Notes

- **No explicit routing table**: Navigation is entirely implicit. Claude Code discovers skills from filesystem conventions (`skills/*/SKILL.md`), commands from `commands/*.md`, and agents from `agents/*.md`. There is no central registry, router, or configuration file that lists all components.
- **Convention**: Skills are named `prism-<phase>`, agents are named `<domain>-<role>`, commands are named `<action>_<noun>`.
- **Convention**: The `description` field serves double duty — it describes the component AND contains trigger phrases for auto-discovery.
- **Pattern**: Heavier cognitive tasks (planning, iterating) use Opus; general work uses Sonnet; fast lookups use Haiku.
- **Pattern**: Skills orchestrate by invoking commands and spawning agents. Commands execute single operations. Agents are specialists with restricted tool access.
- **Decision**: State transfer between phases uses the filesystem (`.prism/shared/`) rather than in-memory context, enabling fresh Claude sessions (critical for Spectrum).

## Open Questions

- [ ] How does Claude Code's runtime actually parse YAML frontmatter and match trigger phrases against user input? The plugin convention is documented but the runtime implementation is external to this repo.
- [ ] Is there a priority or conflict resolution mechanism when multiple skills match the same user input?
- [ ] How does the `model` field in frontmatter interact with Claude Code's model selection — does it override the user's selected model or serve as a hint?

## Code References

| Reference | Description |
|-----------|-------------|
| `skills/prism/SKILL.md:39-44` | Workflow selection table (scenario -> phase routing) |
| `skills/prism/SKILL.md:50-56` | Hub skill checking for existing work via prism-locator |
| `skills/prism/SKILL.md:228-234` | Document generation navigation flow diagram |
| `skills/prism-research/SKILL.md:1-5` | YAML frontmatter example with trigger phrases |
| `skills/prism-research/SKILL.md:44-47` | Agent spawning via Task() |
| `skills/prism-implement/SKILL.md:99-103` | Cross-references to commands (`/commit`, `/validate`, `/describe_pr`) |
| `skills/prism-debug/SKILL.md:29-34` | Debug workflow position diagram |
| `skills/prism-spectrum/SKILL.md:219-227` | Signal protocol definitions |
| `scripts/spectrum.sh:181-197` | Deterministic story selection via jq |
| `scripts/spectrum.sh:306-307` | Claude CLI invocation with prompt |
| `scripts/spectrum.sh:329-361` | Signal detection via grep |
| `agents/codebase-locator.md:1-6` | Agent frontmatter with tools restriction |
| `.claude-plugin/plugin.json:1-8` | Plugin registration metadata |
| `commands/research_codebase.md:36-43` | Parallel agent spawning from command |
| `skills/prism/scripts/init_prism.py:23-38` | .prism/ directory structure creation |

## Workflow Steps Executed

1. **Step 0 (Read Mentioned Files)**: No specific files mentioned by user.
2. **Step 1 (Check Existing Knowledge)**: Simulated `prism-locator` agent — searched `.prism/shared/research/` for navigation-related docs. Found `2026-02-22-prism-plugin-architecture.md` as relevant prior research. No direct navigation-system research existed.
3. **Step 2 (Locate Code)**: Simulated `codebase-locator` agent — used Glob to find all `skills/*/SKILL.md` (14), `commands/*.md` (25), `agents/*.md` (12). Found `scripts/spectrum.sh` and `.claude-plugin/plugin.json`.
4. **Step 3 (Analyze Components)**: Simulated `codebase-analyzer` agent — read and analyzed frontmatter patterns across all skill/command/agent files. Traced cross-references between skills, commands, and agents. Analyzed spectrum.sh signal protocol.
5. **Step 4 (Find Patterns)**: Simulated `codebase-pattern-finder` agent — identified YAML frontmatter convention, file-based state transfer pattern, Task() spawning pattern, and signal protocol pattern.
6. **Step 5 (External Research)**: Not needed — all navigation is internal to the plugin.
7. **Step 6 (Save Findings)**: Saved to this document.
