---
date: 2026-03-08T00:00:00Z
researcher: Claude
git_commit: 9d421a43c7248fcb633a39b45501e4804897406c
branch: main
repository: prism-plugin
topic: "Navigation System in the Prism Plugin"
tags: [research, navigation, skills, commands, agents, workflow, plugin-architecture]
status: complete
last_updated: 2026-03-08
last_updated_by: Claude
---

# Research: Navigation System in the Prism Plugin

## Research Question

How does the navigation system work in this codebase? This project is a Claude Code plugin with skills, agents, and commands.

## Summary

The Prism plugin's navigation system is a three-layer architecture of Skills, Commands, and Agents, all discovered automatically by Claude Code from markdown files with YAML frontmatter. Skills are workflow orchestrators that live in `skills/*/SKILL.md` and activate on trigger phrases in user input. Commands are single-purpose operations in `commands/*.md` invocable via `/command-name`. Agents are specialists in `agents/*.md` spawned programmatically via `Task(subagent_type="agent-name")`. Navigation between phases follows a strict Research -> Plan -> Implement -> Validate pipeline, with lateral navigation via Iterate, Debug, and Spectrum for autonomous execution.

## Workflow Steps Followed

### Step 0: Read Mentioned Files
No specific files were mentioned by the user, so this step was skipped per the skill instructions.

### Step 1: Check Existing Knowledge (prism-locator simulation)
Searched `.prism/shared/research/` for existing research about navigation. Found 31 research documents. The most relevant existing document is:
- `.prism/shared/research/2026-02-22-prism-plugin-architecture.md` -- a comprehensive architecture analysis covering the three-layer model, workflow phases, and component relationships. This provided significant historical context.

### Step 2: Locate Code (codebase-locator simulation)
Searched for navigation-related files across `skills/`, `commands/`, and `agents/` directories using grep for terms: `navigation`, `navigate`, `nav`, `routing`, `route`. Found matches in 10 skill files, 8 command files, and 4 agent files. Also examined the plugin discovery configuration at `.claude-plugin/plugin.json`.

### Step 3: Analyze Components (codebase-analyzer simulation)
Read and analyzed the following key files in full:
- `skills/prism/SKILL.md` (hub orchestrator)
- `skills/prism-research/SKILL.md` (Phase 1)
- `skills/prism-plan/SKILL.md` (Phase 2)
- `skills/prism-implement/SKILL.md` (Phase 3)
- `skills/prism-validate/SKILL.md` (Phase 4)
- `skills/prism-iterate/SKILL.md` (feedback loop)
- `skills/prism-debug/SKILL.md` (error investigation)
- `skills/prism-spectrum/SKILL.md` (autonomous execution)
- `skills/prism-eval/SKILL.md` (skill evaluation)
- `skills/prism-release/SKILL.md` (versioned releases)
- All 25 command files (frontmatter examined)
- All 11 agent files (frontmatter examined)
- `.claude-plugin/plugin.json` and `marketplace.json`
- `scripts/spectrum.sh` (autonomous orchestrator)

### Step 4: Find Patterns (codebase-pattern-finder simulation)
Identified consistent patterns across all three component layers (documented below).

### Step 5: External Research
Not needed -- this is an internal plugin architecture question.

### Step 6: Save Findings
This document.

---

## Files Discovered

| File | Purpose |
|------|---------|
| `.claude-plugin/plugin.json` | Plugin identity and version (v2.5.1) for Claude Code auto-discovery |
| `.claude-plugin/marketplace.json` | Marketplace listing metadata |
| `skills/prism/SKILL.md` | Hub skill -- central navigation reference for all phases |
| `skills/prism-research/SKILL.md` | Phase 1: Research orchestrator |
| `skills/prism-plan/SKILL.md` | Phase 2: Planning orchestrator |
| `skills/prism-implement/SKILL.md` | Phase 3: Implementation orchestrator |
| `skills/prism-validate/SKILL.md` | Phase 4: Validation orchestrator |
| `skills/prism-iterate/SKILL.md` | Feedback loop: plan update + re-implementation |
| `skills/prism-debug/SKILL.md` | Debug investigation orchestrator |
| `skills/prism-spectrum/SKILL.md` | Autonomous single-story execution |
| `skills/prism-verify/SKILL.md` | Browser-based UI verification |
| `skills/prism-prd/SKILL.md` | Product Requirements Document generator |
| `skills/prism-visual-docs/SKILL.md` | User flows and wireframes generator |
| `skills/prism-eval/SKILL.md` | Skill evaluation and benchmarking |
| `skills/prism-release/SKILL.md` | Version release pipeline |
| `skills/prism-docs-update/SKILL.md` | VitePress documentation site updater |
| `commands/research_codebase.md` | Comprehensive parallel codebase research |
| `commands/create_plan.md` | Detailed plan creation |
| `commands/implement_plan.md` | Plan execution with verification |
| `commands/validate_plan.md` | Implementation verification |
| `commands/decompose_plan.md` | Plan to stories.json conversion |
| `commands/create_handoff.md` | Session handoff document creation |
| `commands/resume_handoff.md` | Resume from handoff document |
| `commands/commit.md` | Git commit creation |
| `commands/describe_pr.md` | PR description generation |
| `commands/worktree.md` | Git worktree for parallel development |
| `commands/prism-browse.md` | Interactive headed browser session |
| `commands/prism-debug.md` | Debug investigation command |
| `commands/prism-verify.md` | Browser verification command |
| `commands/prism-screenshot.md` | Browser screenshot capture |
| `commands/cli-install.md` | CLI binary installation |
| `commands/cli-uninstall.md` | CLI binary removal |
| `commands/prism_cli.md` | Launch Prism CLI TUI |
| `commands/prism_dir_update.md` | Legacy directory migration |
| `commands/review-setup.md` | PR review environment setup |
| `commands/retroactive.md` | Post-hoc ticket and PR creation |
| `commands/iterate_plan.md` | Plan iteration |
| `commands/generate_prd.md` | PRD generation |
| `commands/generate_tech_spec.md` | Tech spec generation |
| `commands/generate_user_flows.md` | User flow generation |
| `commands/generate_pricing.md` | Pricing proposal generation |
| `agents/codebase-locator.md` | Find WHERE code lives (Haiku) |
| `agents/codebase-analyzer.md` | Understand HOW code works (Opus) |
| `agents/codebase-pattern-finder.md` | Find patterns to model after (Sonnet) |
| `agents/prism-locator.md` | Find existing .prism/ docs (Haiku) |
| `agents/prism-analyzer.md` | Extract insights from docs (Opus) |
| `agents/web-search-researcher.md` | External documentation research (Sonnet) |
| `agents/graph-navigator.md` | Knowledge graph structural analysis (Haiku) |
| `agents/log-investigator.md` | Log analysis for debug (Haiku) |
| `agents/state-investigator.md` | Application state analysis (Haiku) |
| `agents/git-investigator.md` | Git history analysis (Haiku) |
| `agents/browser-verifier.md` | Browser UI verification (Haiku) |
| `scripts/spectrum.sh` | Autonomous story execution loop |

## Component Analysis

### 1. Plugin Discovery Mechanism

**Location**: `.claude-plugin/`

**How it works**:
- Claude Code auto-discovers the plugin via `.claude-plugin/plugin.json` at the repository root
- `plugin.json:1-8` defines the plugin name ("prism"), description, version ("2.5.1"), and author
- `marketplace.json:1-20` provides marketplace listing metadata for the GitHub source repo `TheDigitalGriot/prism-plugin`
- Once the plugin is loaded, Claude Code scans the three component directories for markdown files with YAML frontmatter

### 2. Three-Layer Auto-Discovery

**Location**: `skills/`, `commands/`, `agents/`

**How it works**:

Each layer uses a different discovery convention:

**Skills** (`skills/*/SKILL.md`):
- Claude Code scans for `SKILL.md` files inside subdirectories of `skills/`
- Each SKILL.md has YAML frontmatter with `name`, `description`, and `model` fields
- The `description` field contains trigger phrases (e.g., "research this", "create a plan")
- Claude Code matches user input against these trigger phrases to activate the appropriate skill
- 14 skills exist as of v2.5.1

**Commands** (`commands/*.md`):
- Claude Code scans for `.md` files directly in `commands/`
- Each command file has YAML frontmatter with `description` and `model` fields
- Users invoke commands explicitly with `/command-name` (derived from the filename)
- 25 commands exist as of v2.5.1

**Agents** (`agents/*.md`):
- Claude Code scans for `.md` files directly in `agents/`
- Each agent file has YAML frontmatter with `name`, `description`, `tools`, and `model` fields
- Agents are NOT directly user-invocable; they are spawned by skills/commands via `Task(subagent_type="agent-name")`
- 11 agents exist as of v2.5.1

### 3. Skill Navigation (The Hub Pattern)

**Location**: `skills/prism/SKILL.md`

**How it works**:
- The `prism` skill acts as the central hub and navigation reference
- `skills/prism/SKILL.md:13-27` contains a Quick Reference table mapping every phase to its skill, command, and output location
- `skills/prism/SKILL.md:37-44` provides a Workflow Selection matrix:
  - New feature, unfamiliar codebase: Full R->P->I->V
  - Feature in known codebase: P->I->V (skip Research)
  - Simple change, clear scope: I->V (skip Research + Plan)
  - Trivial fix (<20 lines): Direct implementation
- `skills/prism/SKILL.md:48-63` describes the starting logic: spawn a `prism-locator` agent to check for existing artifacts, then navigate to the appropriate phase

**Data flow**:
```
User Request -> prism (hub) -> prism-locator agent
                            -> Determines entry point:
                               Nothing exists -> /prism-research
                               Research exists -> /prism-plan
                               Plan exists (incomplete) -> /prism-implement
                               Implementation done -> /prism-validate
```

### 4. Phase-to-Phase Navigation

**Location**: Skills layer

**How it works**:

The 4-phase pipeline navigates sequentially, with each phase referencing the next:

```
/prism-research (Phase 1)
    Output: .prism/shared/research/YYYY-MM-DD-topic.md
    Next: /prism-plan
        |
/prism-plan (Phase 2)
    Prerequisites: Research exists in .prism/shared/research/
    Output: .prism/shared/plans/YYYY-MM-DD-feature.md
    Next: /prism-implement OR /decompose_plan (for Spectrum)
        |
/prism-implement (Phase 3)
    Prerequisites: Approved plan in .prism/shared/plans/
    Output: Working code + updated plan checkboxes
    Commands after: /commit, /validate, /describe_pr
    Next: /prism-validate
        |
/prism-validate (Phase 4)
    Prerequisites: Plan + implementation exist
    Output: .prism/shared/validation/YYYY-MM-DD-report.md
    Next: Ship OR /prism-iterate (if issues found)
```

Phase transitions are driven by:
1. **File existence** -- each phase checks for prerequisite artifacts in `.prism/shared/`
2. **User approval** -- the plan phase requires explicit user buy-in at multiple steps
3. **Verification results** -- implementation phase runs quality gates before proceeding
4. **Checkboxes** -- plan documents track completion with `- [x]` markers

### 5. Lateral Navigation Paths

**Location**: `skills/prism-iterate/SKILL.md`, `skills/prism-debug/SKILL.md`

**How it works**:

Beyond the linear pipeline, navigation can branch laterally:

**Iterate loop** (`skills/prism-iterate/SKILL.md:76-78`):
```
Validate -> issues found -> /prism-iterate -> updates plan -> /prism-implement -> /prism-validate
```

**Debug branch** (`skills/prism-debug/SKILL.md:29-34`):
```
Implement (failure) -> /prism-debug -> Iterate (with findings)
```

**Verify branch** (`skills/prism-verify/SKILL.md`):
```
Implement -> /prism-verify (optional) -> /prism-validate
```

### 6. Skill-to-Agent Navigation

**Location**: All skill SKILL.md files

**How it works**:
- Skills invoke agents using `Task(subagent_type="agent-name")` syntax
- Multiple agents can run in parallel for efficiency
- Agent assignment follows a model hierarchy convention:
  - **Opus**: Deep analysis (codebase-analyzer, prism-analyzer)
  - **Sonnet**: General work (codebase-pattern-finder, web-search-researcher)
  - **Haiku**: Fast lookups (codebase-locator, prism-locator, all investigators)

**Research phase agent dispatch** (`skills/prism-research/SKILL.md:44-87`):
```
/prism-research
  -> prism-locator (check existing knowledge)
  -> graph-navigator (structural orientation, if MCP available)
  -> codebase-locator (find files)
  -> codebase-analyzer (understand code)
  -> codebase-pattern-finder (find patterns)
  -> web-search-researcher (external docs, if needed)
  -> Save to .prism/shared/research/
```

**Debug phase agent dispatch** (`skills/prism-debug/SKILL.md:59-85`):
```
/prism-debug
  -> log-investigator (analyze logs)
  -> state-investigator (check app state)
  -> git-investigator (analyze history)
  -> Synthesize findings into debug report
```

### 7. Skill-to-Command Navigation

**Location**: Skills reference commands, commands are also independently invocable

**How it works**:
- Skills reference commands by slash-name in their documentation
- `skills/prism-implement/SKILL.md:99-102` lists post-phase commands: `/commit`, `/validate`, `/describe_pr`
- `skills/prism/SKILL.md:217-224` lists document generation commands: `/generate_prd`, `/generate_user_flows`, `/generate_tech_spec`, `/generate_pricing`
- The `prism-prd` skill invokes `/generate_prd` as its implementation
- The `prism-visual-docs` skill invokes `/generate_user_flows` and optionally `/generate_tech_spec`

**Document generation flow** (`skills/prism/SKILL.md:228-234`):
```
/prism-prd -> /prism-visual-docs -> /prism-plan
(Product Reqs)  (UX Flows & Specs)   (Impl Steps)
```

### 8. Session Continuity Navigation

**Location**: `commands/create_handoff.md`, `commands/resume_handoff.md`

**How it works**:
- When context is high or a session is ending, `/create_handoff` saves work state to `.prism/shared/handoffs/YYYY-MM-DD_HH-MM-SS_description.md`
- A new session resumes via `/resume_handoff <path>` or `/resume_handoff <ticket-id>`
- The resume command reads the handoff, spawns research tasks to verify current state, presents analysis, gets user confirmation, then continues
- `commands/resume_handoff.md:14-45` handles three invocation patterns: with path, with ticket ID, or with no parameters
- The implementation phase also supports in-plan session notes (`skills/prism-implement/SKILL.md:114-122`)

### 9. Autonomous Navigation (Spectrum)

**Location**: `skills/prism-spectrum/SKILL.md`, `scripts/spectrum.sh`

**How it works**:
- Spectrum is the autonomous execution path for large features decomposed into stories
- Navigation flow: `/prism-plan` -> `/decompose_plan` -> `spectrum.sh` loop
- `scripts/spectrum.sh:1-80` spawns fresh Claude Code sessions per story (no context degradation)
- Each session invokes `/prism-spectrum` which executes exactly one story
- Navigation signals between iterations use XML tags:
  - `<spectrum-continue>` -- story complete, proceed to next
  - `<spectrum-retry>` -- quality gate failed, retry with debug context
  - `<spectrum-blocked>` -- story blocked, skip to next
  - `<spectrum-error>` -- fatal error, halt
  - `<promise>COMPLETE</promise>` -- all stories done
- State persists through `stories.json` and `progress.md` files, not AI context
- On quality gate failure, Spectrum auto-invokes debug agents before signaling retry

### 10. Trigger-Based Discovery

**Location**: All SKILL.md frontmatter `description` fields

**How it works**:
- Claude Code uses the `description` field in skill frontmatter to match user intent to skills
- Each skill declares specific trigger phrases. Examples:
  - `prism`: "help me build", "implement this feature", "fix this bug", "prism", "structured workflow"
  - `prism-research`: "research this", "understand how X works", "map out the system", "explore the codebase"
  - `prism-plan`: "create a plan", "plan the implementation", "design how to build"
  - `prism-implement`: "implement the plan", "start building", "execute phase 1"
  - `prism-validate`: "validate the plan", "verify implementation", "check if complete"
  - `prism-debug`: "debug this", "why is this failing", "investigate the error"
  - `prism-spectrum`: "spectrum", "execute story", "run spectrum"
  - `prism-release`: "release", "bump version", "new version", "cut a release"
- Commands use the `description` field for help text but are invoked explicitly by name (`/command-name`)
- Agents use `description` to document their purpose but are only spawned programmatically

## Patterns Found

### Pattern 1: YAML Frontmatter Convention

**Example at**: `skills/prism-research/SKILL.md:1-5`

```yaml
---
name: prism-research
description: Research phase for complex coding tasks...
model: sonnet
---
```

**Also used in**:
- All 14 skill files (name, description, model)
- All 25 command files (description, model)
- All 11 agent files (name, description, tools, model)

The `model` field directs Claude Code to use a specific model tier. Two skill files (`prism-release` and `prism-docs-update`) omit the `model` field.

### Pattern 2: Prerequisite File Checking

Each phase checks for the existence of specific `.prism/shared/` artifacts before proceeding:

**Example at**: `skills/prism-plan/SKILL.md:21-22`
```
Research exists in .prism/shared/research/ OR
Sufficient codebase understanding from current session
```

**Also used in**:
- `skills/prism-implement/SKILL.md:13-15` -- requires approved plan
- `skills/prism-validate/SKILL.md:14-15` -- requires plan + implementation
- `skills/prism-iterate/SKILL.md:31` -- checks plan status

### Pattern 3: Agent Parallel Dispatch

Skills spawn multiple agents simultaneously for efficiency:

**Example at**: `skills/prism-research/SKILL.md:44-87` -- up to 7 agents in parallel

**Also used in**:
- `skills/prism-debug/SKILL.md:59-85` -- 3 investigators in parallel
- `commands/research_codebase.md:37-43` -- parallel sub-agent tasks
- `skills/prism-spectrum/SKILL.md:220-226` -- 3 debug agents on failure

### Pattern 4: Interactive Checkpoint Pattern

Skills stop at defined points and wait for user approval before continuing:

**Example at**: `skills/prism-implement/SKILL.md:59-74`
```
After each phase:
## Phase [N] Complete
**Changes**: [summary]
**Verification**: [x] passed
**Next**: Phase [N+1] - [name]
Ready to proceed?
```

**Also used in**:
- `skills/prism-plan/SKILL.md:44-58` -- present understanding, wait for confirmation
- `skills/prism-plan/SKILL.md:62-74` -- design options, ask which approach
- `skills/prism-plan/SKILL.md:78-85` -- propose phases, get approval

### Pattern 5: Output File Convention

All persistent outputs follow the `YYYY-MM-DD-topic.md` naming convention and are saved to specific `.prism/shared/` subdirectories:

| Phase | Output Path |
|-------|-------------|
| Research | `.prism/shared/research/YYYY-MM-DD-topic.md` |
| Plan | `.prism/shared/plans/YYYY-MM-DD-feature.md` |
| Validation | `.prism/shared/validation/YYYY-MM-DD-report.md` |
| Handoff | `.prism/shared/handoffs/YYYY-MM-DD_HH-MM-SS_description.md` |
| Spectrum Progress | `.prism/shared/spectrum/progress.md` |

## Historical Context

From `.prism/` directory:

- `.prism/shared/research/2026-02-22-prism-plugin-architecture.md` -- Comprehensive architecture analysis documenting the three-layer model, workflow phases, model assignment matrix, and component relationships. Covers v2.1.8 with 10 skills, 22 commands, and 9 agents; current v2.5.1 has grown to 14 skills, 25 commands, and 11 agents.

## Architecture Notes

- **Pattern**: All navigation is markdown-based prompt engineering with no build step. There is no compiled router or navigation code -- navigation happens through Claude Code's skill matching, user slash-commands, and programmatic `Task()` agent spawning.
- **Convention**: Skills are named `prism-<phase>`, agents are named `<domain>-<role>`, commands use `<action>_<noun>` (underscores) or `<action>-<noun>` (hyphens).
- **Decision**: The hub skill (`prism`) acts as a navigation index, containing tables that map every phase, command, and agent. It is the single source of truth for "what exists and where."
- **Convention**: Model assignment follows a three-tier hierarchy (Opus for deep analysis, Sonnet for general work, Haiku for fast lookups) specified in each component's frontmatter.
- **Pattern**: State persistence across sessions uses files in `.prism/shared/` (committed to git) rather than AI context, enabling Spectrum's fresh-session-per-story model.

## Open Questions

- [ ] How does Claude Code's internal skill matching algorithm weight the trigger phrases in `description` fields? Is it keyword-based, semantic, or something else?
- [ ] When multiple skills have overlapping trigger phrases, what determines which one activates?
- [ ] Are there any undocumented navigation paths between components beyond what's declared in the SKILL.md files?
- [ ] How does the `tools` field in agent frontmatter restrict or enable tool access for spawned agents?

## Code References

| Reference | Description |
|-----------|-------------|
| `.claude-plugin/plugin.json:1-8` | Plugin identity for Claude Code auto-discovery |
| `skills/prism/SKILL.md:13-27` | Hub skill quick reference table (all phases) |
| `skills/prism/SKILL.md:37-44` | Workflow selection matrix |
| `skills/prism/SKILL.md:48-63` | Starting logic with prism-locator check |
| `skills/prism/SKILL.md:228-234` | Document generation flow diagram |
| `skills/prism-research/SKILL.md:22-33` | Available research agents table |
| `skills/prism-research/SKILL.md:44-87` | Research workflow steps 1-6 |
| `skills/prism-plan/SKILL.md:44-58` | Interactive understanding confirmation |
| `skills/prism-implement/SKILL.md:59-74` | Phase checkpoint pattern |
| `skills/prism-implement/SKILL.md:99-102` | Post-implementation command references |
| `skills/prism-validate/SKILL.md:17-28` | Validation workflow |
| `skills/prism-iterate/SKILL.md:76-78` | Resume implementation from iterate |
| `skills/prism-debug/SKILL.md:29-34` | Debug workflow position diagram |
| `skills/prism-debug/SKILL.md:59-85` | Parallel debug agent dispatch |
| `skills/prism-spectrum/SKILL.md:186-191` | Signal protocol tags |
| `commands/create_handoff.md:14` | Handoff file path convention |
| `commands/resume_handoff.md:14-45` | Three invocation patterns for resume |
| `scripts/spectrum.sh:36-63` | Stories and progress path derivation |
