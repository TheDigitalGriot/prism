---
date: 2026-03-08
researcher: Claude
git_commit: 3b1ceb82b2010d270a0a458d278638119fb44b0b
branch: main
repository: prism-plugin
topic: "Navigation system in the Prism Claude Code plugin"
tags: [research, navigation, skills, commands, agents, workflow, routing]
status: complete
---

# Research: Navigation System in the Prism Claude Code Plugin

## Research Question

How does the navigation system work in this codebase? This project is a Claude Code plugin with skills, agents, and commands.

## Summary

The Prism plugin implements a three-layer navigation architecture: Skills (orchestrators) invoke Commands (operations) and spawn Agents (specialists). Navigation is driven by Claude Code's auto-discovery mechanism -- YAML frontmatter in markdown files declares trigger patterns, model assignments, and descriptions that determine when each component activates. The core workflow follows a linear phase progression (Research -> Plan -> Implement -> Validate) with branch paths for debugging, iteration, document generation, and autonomous execution.

## Files Discovered

| File | Purpose |
|------|---------|
| `.claude-plugin/plugin.json` | Plugin metadata (name, version, description) |
| `skills/prism/SKILL.md` | Root orchestrator skill -- entry point and quick reference for all phases |
| `skills/prism-research/SKILL.md` | Research phase orchestrator |
| `skills/prism-plan/SKILL.md` | Planning phase orchestrator |
| `skills/prism-implement/SKILL.md` | Implementation phase orchestrator |
| `skills/prism-validate/SKILL.md` | Validation phase orchestrator |
| `skills/prism-iterate/SKILL.md` | Plan iteration/update orchestrator |
| `skills/prism-spectrum/SKILL.md` | Autonomous story execution orchestrator |
| `skills/prism-debug/SKILL.md` | Debug investigation orchestrator |
| `skills/prism-verify/SKILL.md` | Browser/visual verification orchestrator |
| `skills/prism-prd/SKILL.md` | PRD generation orchestrator |
| `skills/prism-visual-docs/SKILL.md` | Visual documentation orchestrator |
| `skills/prism-eval/SKILL.md` | Skill evaluation/benchmarking orchestrator |
| `skills/prism-release/SKILL.md` | Release pipeline orchestrator |
| `skills/prism-docs-update/SKILL.md` | VitePress documentation sync orchestrator |
| `commands/research_codebase.md` | Direct command for codebase research |
| `commands/create_plan.md` | Direct command for plan creation |
| `commands/implement_plan.md` | Direct command for plan implementation |
| `commands/validate_plan.md` | Direct command for plan validation |
| `commands/decompose_plan.md` | Convert plans to stories.json for Spectrum |
| `commands/commit.md` | Git commit workflow |
| `commands/describe_pr.md` | PR description generation |
| `commands/create_handoff.md` | Session handoff document creation |
| `commands/resume_handoff.md` | Resume from handoff document |
| `commands/generate_prd.md` | Standalone PRD generation |
| `commands/generate_user_flows.md` | UX flow documentation |
| `commands/generate_tech_spec.md` | Technical specification |
| `commands/generate_pricing.md` | Pricing proposal |
| `commands/worktree.md` | Git worktree management |
| `commands/prism-browse.md` | Browser interaction |
| `commands/prism-screenshot.md` | Screenshot capture |
| `commands/prism-debug.md` | Debug command |
| `commands/prism-verify.md` | Verify command |
| `commands/cli-install.md` | CLI installation |
| `commands/cli-uninstall.md` | CLI uninstallation |
| `commands/prism_cli.md` | CLI dashboard |
| `commands/prism_dir_update.md` | Prism directory update |
| `commands/iterate_plan.md` | Plan iteration command |
| `commands/review-setup.md` | Review setup |
| `commands/retroactive.md` | Retroactive documentation |
| `agents/codebase-locator.md` | Find WHERE files/components live |
| `agents/codebase-analyzer.md` | Understand HOW code works |
| `agents/codebase-pattern-finder.md` | Find patterns to model after |
| `agents/prism-locator.md` | Find existing docs in .prism/ |
| `agents/prism-analyzer.md` | Extract insights from docs |
| `agents/web-search-researcher.md` | External documentation research |
| `agents/graph-navigator.md` | Structural analysis via knowledge graph |
| `agents/browser-verifier.md` | Playwright-based browser verification |
| `agents/visual-regression-grader.md` | Visual regression diff judgment |
| `agents/log-investigator.md` | Analyze logs for errors |
| `agents/state-investigator.md` | Check application state |
| `agents/git-investigator.md` | Analyze git history |

## Component Analysis

### Layer 1: Skills (Orchestrators)

**Location**: `skills/*/SKILL.md`

**How auto-discovery works**: Each skill file has YAML frontmatter with three key fields:
- `name`: The skill identifier (e.g., `prism-research`), used as the slash command name
- `description`: Contains natural language trigger patterns (e.g., "research this", "understand how X works") that Claude Code uses to match user intent
- `model`: Specifies which AI model runs the skill (`opus` for deep analysis, `sonnet` for general work)

**14 skills exist** as of v2.5.2:
1. `prism` -- Root orchestrator and quick reference for the entire workflow
2. `prism-research` -- Research phase (model: sonnet)
3. `prism-plan` -- Planning phase (model: opus)
4. `prism-implement` -- Implementation phase (model: sonnet)
5. `prism-validate` -- Validation phase (model: sonnet)
6. `prism-iterate` -- Plan iteration (model: opus)
7. `prism-spectrum` -- Autonomous story execution (model: sonnet)
8. `prism-debug` -- Debug investigation (model: sonnet)
9. `prism-verify` -- Browser verification (model: sonnet)
10. `prism-prd` -- PRD generation (model: opus)
11. `prism-visual-docs` -- Visual documentation (model: opus)
12. `prism-eval` -- Skill evaluation (model: sonnet)
13. `prism-release` -- Release pipeline (no model specified)
14. `prism-docs-update` -- Documentation sync (no model specified)

**Navigation pattern**: Skills navigate to other components by:
- Invoking commands via slash-command syntax: `/prism-research`, `/generate_prd`
- Spawning agents via Task tool: `Task(subagent_type="codebase-locator")`
- Referencing other skills in "next step" guidance at the end of their workflow

### Layer 2: Commands (Operations)

**Location**: `commands/*.md`

**How commands are invoked**: Users type `/command-name` directly. Commands have YAML frontmatter with:
- `description`: What the command does
- `model`: Which AI model runs it

**25 commands exist** as of v2.5.2. These are single-purpose operations that perform one specific task. Commands do not invoke other commands or skills directly -- they are leaf-level operations.

**Key navigation-relevant commands**:
- `research_codebase.md` -- The direct command equivalent of the research skill
- `create_plan.md` -- The direct command equivalent of the plan skill
- `implement_plan.md` -- The direct command equivalent of the implement skill
- `validate_plan.md` -- The direct command equivalent of the validate skill
- `decompose_plan.md` -- Bridge between planning and Spectrum execution

### Layer 3: Agents (Specialists)

**Location**: `agents/*.md`

**How agents are spawned**: Skills and commands invoke agents via `Task(subagent_type="agent-name")`. Agents have YAML frontmatter with:
- `name`: Agent identifier matching the `subagent_type` parameter
- `description`: Agent purpose
- `tools`: Which tools the agent can use (Read, Glob, Grep, Bash)
- `model`: AI model assignment (`haiku` for fast lookups, `sonnet` for general work)

**12 agents exist** as of v2.5.2, organized into functional groups:

**Research agents** (used by prism-research, research_codebase):
- `codebase-locator` (haiku) -- file discovery
- `codebase-analyzer` (not specified) -- code understanding
- `codebase-pattern-finder` (not specified) -- pattern discovery
- `prism-locator` (haiku) -- .prism/ document discovery
- `prism-analyzer` (not specified) -- document insight extraction
- `web-search-researcher` (not specified) -- external research
- `graph-navigator` (not specified) -- structural analysis

**Debug agents** (used by prism-debug, prism-spectrum):
- `log-investigator` (haiku) -- log analysis
- `state-investigator` (haiku) -- state checking
- `git-investigator` (haiku) -- git history analysis

**Verification agents** (used by prism-verify, prism-validate):
- `browser-verifier` (haiku) -- headless browser checks
- `visual-regression-grader` (sonnet) -- visual diff judgment

### Navigation Flow: Core Workflow

**Data flow through phases**:

```
User triggers skill via natural language or /command
         |
         v
prism (root skill) determines starting phase
         |
    +-----------+-----------+-----------+
    |           |           |           |
    v           v           v           v
Research    Plan       Implement   Validate
    |           |           |           |
    v           v           v           v
.prism/     .prism/     Working     .prism/
shared/     shared/     code +      shared/
research/   plans/      plan        validation/
                        checkboxes
```

**Phase transition logic** (from `skills/prism/SKILL.md:48-62`):
1. Root skill spawns `prism-locator` agent to check for existing artifacts
2. Based on findings:
   - Nothing exists -> Navigate to `/prism-research`
   - Research exists -> Navigate to `/prism-plan`
   - Plan exists (incomplete) -> Navigate to `/prism-implement`
   - Implementation done -> Navigate to `/prism-validate`

**Inter-phase navigation**: Each skill explicitly names the next skill to invoke at the end of its workflow. For example:
- `prism-research` saves output, then user invokes `/prism-plan`
- `prism-plan` saves plan, then user invokes `/prism-implement`
- `prism-implement` completes phases, then offers `/commit`, `/validate`, `/describe_pr`
- `prism-validate` produces report, marking workflow complete

### Navigation Flow: Branch Paths

**Iteration loop** (`skills/prism-iterate/SKILL.md`):
```
Implement or Validate (finds issues)
    |
    v
prism-iterate (update plan)
    |
    v
prism-implement (resume from updated phase)
    |
    v
prism-validate (re-verify if significant changes)
```

**Debug loop** (`skills/prism-debug/SKILL.md:30-35`):
```
Implement (failure) -> Debug (investigate) -> Iterate (with findings)
```

**Spectrum autonomous loop** (`skills/prism-spectrum/SKILL.md`):
```
prism-plan -> /decompose_plan -> spectrum.sh
                                    |
                                    v
                              [per story loop]
                              Load state -> Implement -> Quality gates -> Commit
                                    |              |
                                    |         (on failure)
                                    |              v
                                    |         prism-debug (auto)
                                    |              |
                                    v              v
                              <spectrum-continue>  <spectrum-retry>
```

**Document generation path** (`skills/prism/SKILL.md:229-234`):
```
prism-prd -> prism-visual-docs -> prism-plan
(PRD)        (UX Flows/Specs)    (Implementation)
```

### Navigation Flow: Verification Side-Path

**Browser verification** (`skills/prism-verify/SKILL.md`):
```
prism-implement (completes phase)
    |
    v
prism-verify (optional, between implement and validate)
    |
    +-> browser-verifier agent (screenshots, console checks)
    +-> visual-regression-grader agent (if baselines exist)
    |
    v
prism-validate
```

### Plugin Registration

**Location**: `.claude-plugin/plugin.json`

The plugin registers with Claude Code via a minimal JSON manifest at `.claude-plugin/plugin.json:1-8`. It declares only `name`, `description`, `version`, and `author`. The actual component discovery happens through Claude Code's convention-based directory scanning:
- `skills/*/SKILL.md` files are auto-discovered as skills
- `commands/*.md` files are auto-discovered as slash commands
- `agents/*.md` files are auto-discovered as spawnable agents

No explicit routing table or registry exists. Navigation is convention-based.

### Model Assignment Convention

**How model selection navigates between capability tiers** (from `CLAUDE.md`):
- **Opus**: Deep analysis tasks -- `prism-plan`, `prism-iterate`, `prism-prd`, `prism-visual-docs`, `create_plan`, `research_codebase`
- **Sonnet**: General work -- `prism-research`, `prism-implement`, `prism-validate`, `prism-spectrum`, `prism-debug`, `prism-verify`, `prism-eval`
- **Haiku**: Fast lookups -- `codebase-locator`, `prism-locator`, `log-investigator`, `state-investigator`, `git-investigator`, `browser-verifier`, `commit`

### State Persistence Between Navigations

Navigation state persists through the filesystem, not in-memory:
- `.prism/shared/research/` -- Research artifacts bridge Research -> Plan
- `.prism/shared/plans/` -- Plan documents bridge Plan -> Implement -> Validate
- `.prism/shared/validation/` -- Validation reports mark workflow completion
- `.prism/shared/handoffs/` -- Session handoff documents enable cross-session navigation
- `.prism/shared/spectrum/progress.md` -- Accumulated learnings bridge Spectrum iterations
- `.prism/stories/stories.json` -- Story state bridges Spectrum story executions
- Plan checkbox markers (`- [x]`) -- Track progress within implementation

## Patterns Found

### Pattern: Frontmatter-Based Auto-Discovery

**Example at**: `skills/prism-research/SKILL.md:1-5`

```yaml
---
name: prism-research
description: Research phase for complex coding tasks. Use when exploring a codebase...
model: sonnet
---
```

**Also used in**:
- Every file in `skills/*/SKILL.md` (14 files)
- Every file in `commands/*.md` (25 files)
- Every file in `agents/*.md` (12 files)

### Pattern: Task-Based Agent Spawning

**Example at**: `skills/prism-research/SKILL.md:44-46`

```
Task(subagent_type="prism-locator")
"Find existing research about [topic]"
```

**Also used in**:
- `skills/prism/SKILL.md:53-55`
- `skills/prism-plan/SKILL.md:37-39`
- `skills/prism-debug/SKILL.md:64-85`
- `skills/prism-spectrum/SKILL.md:257-262`
- `skills/prism-prd/SKILL.md:33-35`
- `skills/prism-visual-docs/SKILL.md:32-34`
- `skills/prism-verify/SKILL.md:77-84`
- `commands/research_codebase.md:38-41`
- `commands/create_plan.md:52-56`

### Pattern: Parallel Agent Dispatching

Skills spawn multiple agents simultaneously for different research areas. This is a core navigation pattern for the research and debug phases.

**Example at**: `skills/prism-debug/SKILL.md:62-85` -- spawns `log-investigator`, `state-investigator`, and `git-investigator` in parallel.

**Also used in**:
- `skills/prism-research/SKILL.md:98` -- "Run agents in parallel when searching different areas"
- `commands/research_codebase.md:34-36` -- "Spawn parallel sub-agent tasks"

### Pattern: Explicit Next-Step Guidance

Each skill ends by naming the next skill or command to invoke, creating an explicit navigation chain.

**Example at**: `skills/prism-prd/SKILL.md:67-80` -- offers `/generate_user_flows`, `/generate_tech_spec`, `/prism-research`, or `/prism-plan` as next steps.

**Also used in**:
- `skills/prism-implement/SKILL.md:99-102` -- offers `/commit`, `/validate`, `/describe_pr`
- `skills/prism-visual-docs/SKILL.md:82-94` -- offers `/prism-plan`, `/prism-implement`, `/generate_pricing`
- `skills/prism-iterate/SKILL.md:77-81` -- directs to `/prism-implement` then `/prism-validate`

### Pattern: Signal-Based Navigation (Spectrum)

The Spectrum autonomous execution uses XML-like signal tags instead of slash commands for navigation between iterations.

**Example at**: `skills/prism-spectrum/SKILL.md:223-227`

```xml
<spectrum-continue>STORY_COMPLETE: [STORY-XXX]</spectrum-continue>
<promise>COMPLETE</promise>
<spectrum-retry reason="QUALITY_GATE_FAILED">[details]</spectrum-retry>
<spectrum-blocked reason="...">[details]</spectrum-blocked>
<spectrum-error reason="...">[details]</spectrum-error>
```

These signals are parsed by `scripts/spectrum.sh` to determine loop continuation.

## Historical Context

No existing research about the navigation system was found in `.prism/shared/research/`.

## Architecture Notes

- **Convention over configuration**: No routing table exists. Directory structure (`skills/`, `commands/`, `agents/`) and YAML frontmatter drive all navigation.
- **User-driven phase transitions**: The plugin does not automatically transition between phases. Users explicitly invoke the next skill/command based on guidance provided by the current phase.
- **Exception: Spectrum**: The only automated navigation occurs in Spectrum mode, where `spectrum.sh` loops through stories and spawns fresh Claude sessions per iteration.
- **Exception: Debug auto-invocation**: When Spectrum encounters quality gate failures, `/prism-debug` runs automatically before emitting a retry signal.
- **State via filesystem**: All navigation state persists through markdown files in `.prism/`, not through in-memory state or session variables.

## Open Questions

- [ ] How does Claude Code's plugin loader discover and register skills/commands/agents from the directory conventions? (Internal Claude Code mechanism, not visible in this repo)
- [ ] How does the `description` field matching work for natural language triggers? (Claude Code internal routing)
- [ ] Is there a priority or conflict resolution when multiple skills match a user prompt?

## Code References

| Reference | Description |
|-----------|-------------|
| `.claude-plugin/plugin.json:1-8` | Plugin registration manifest |
| `skills/prism/SKILL.md:37-45` | Workflow selection matrix (full/partial/skip) |
| `skills/prism/SKILL.md:48-62` | Phase transition logic based on existing artifacts |
| `skills/prism/SKILL.md:229-234` | Document generation flow diagram |
| `skills/prism-research/SKILL.md:1-5` | Frontmatter auto-discovery example |
| `skills/prism-research/SKILL.md:22-31` | Agent dispatch table |
| `skills/prism-debug/SKILL.md:30-35` | Debug workflow position diagram |
| `skills/prism-spectrum/SKILL.md:219-227` | Signal protocol for autonomous navigation |
| `skills/prism-prd/SKILL.md:14-19` | PRD -> Research -> Plan flow diagram |
| `skills/prism-visual-docs/SKILL.md:14-19` | PRD -> Visual Docs -> Plan flow diagram |
| `agents/codebase-locator.md:1-6` | Agent frontmatter with tools/model assignment |
| `agents/prism-locator.md:1-6` | Prism document discovery agent |
| `CLAUDE.md` | Model assignment convention (Opus/Sonnet/Haiku) |

## Workflow Steps Followed (v2.4.8 Baseline Skill)

1. **Step 0 (Read mentioned files)**: No specific files mentioned by user -- skipped.
2. **Step 1 (Check existing knowledge)**: Searched `.prism/shared/` for existing research about navigation. No prior research found.
3. **Step 2 (Locate code)**: Used Glob to discover all 14 skills, 25 commands, and 12 agents. Used Grep to find navigation-related references across all three layers.
4. **Step 3 (Analyze components)**: Read all 14 skill files fully to trace navigation flows, phase transitions, agent dispatching patterns, and inter-component references. Read key commands and agents to understand the full routing picture.
5. **Step 4 (Find patterns)**: Identified 5 core navigation patterns: frontmatter auto-discovery, Task-based agent spawning, parallel agent dispatch, explicit next-step guidance, and signal-based Spectrum navigation.
6. **Step 5 (External research)**: Not needed -- all navigation is internal to the plugin.
7. **Step 6 (Save findings)**: Saved to this document.
