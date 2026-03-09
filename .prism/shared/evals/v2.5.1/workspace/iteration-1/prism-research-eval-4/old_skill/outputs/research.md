---
date: 2026-03-08
researcher: Claude
git_commit: 9d421a43c7248fcb633a39b45501e4804897406c
branch: main
repository: prism-plugin
topic: "Skill Discovery and Routing System in the Prism Plugin"
tags: [research, skills, routing, meta-skill, discovery, architecture]
status: complete
---

# Research: Skill Discovery and Routing System in the Prism Plugin

## Research Question

Map out the skill discovery and routing system in this plugin. How does the prism meta-skill route to phase-specific skills?

## Summary

The Prism plugin uses a three-layer architecture (Skills -> Commands -> Agents) where Claude Code auto-discovers skills via YAML frontmatter in `skills/*/SKILL.md` files. The `prism` meta-skill (`skills/prism/SKILL.md`) acts as the top-level router, presenting users with phase-specific skills and guiding them to the appropriate phase based on existing `.prism/` artifacts. Routing is declarative and convention-based: skill names in frontmatter map to `/skill-name` slash commands, agents are invoked via `Task(subagent_type="agent-name")`, and commands are invoked as `/command-name`. There is no imperative router code; the entire system relies on Claude Code's built-in skill discovery mechanism and the meta-skill's descriptive routing table.

## Files Discovered

| File | Purpose |
|------|---------|
| `skills/prism/SKILL.md` | Meta-skill: top-level workflow router and quick reference |
| `skills/prism/references/workflow-patterns.md` | Workflow patterns and lifecycle documentation |
| `skills/prism-research/SKILL.md` | Research phase skill |
| `skills/prism-plan/SKILL.md` | Planning phase skill |
| `skills/prism-implement/SKILL.md` | Implementation phase skill |
| `skills/prism-validate/SKILL.md` | Validation phase skill |
| `skills/prism-verify/SKILL.md` | Browser verification phase skill |
| `skills/prism-iterate/SKILL.md` | Plan iteration phase skill |
| `skills/prism-spectrum/SKILL.md` | Autonomous story execution skill |
| `skills/prism-debug/SKILL.md` | Debug investigation skill |
| `skills/prism-eval/SKILL.md` | Skill evaluation and benchmarking skill |
| `skills/prism-release/SKILL.md` | Release pipeline skill |
| `skills/prism-prd/SKILL.md` | PRD generation skill |
| `skills/prism-visual-docs/SKILL.md` | Visual docs generation skill |
| `skills/prism-docs-update/SKILL.md` | Documentation site update skill |
| `.claude-plugin/plugin.json` | Plugin manifest for Claude Code plugin system |
| `.claude-plugin/marketplace.json` | Marketplace metadata for plugin distribution |
| `.mcp.json` | MCP server configuration (codebase-memory-mcp) |
| `scripts/spectrum.sh` | Bash orchestrator that invokes `prism-spectrum` skill in a loop |
| `commands/research_codebase.md` | Command for codebase research |
| `commands/create_plan.md` | Command for plan creation |
| `commands/implement_plan.md` | Command for plan implementation |
| `commands/validate_plan.md` | Command for plan validation |
| `commands/decompose_plan.md` | Command for plan-to-stories decomposition |
| `agents/prism-locator.md` | Agent for finding .prism/ documents |
| `agents/codebase-locator.md` | Agent for finding codebase files |
| `agents/codebase-analyzer.md` | Agent for analyzing code |
| `agents/codebase-pattern-finder.md` | Agent for finding code patterns |
| `agents/prism-analyzer.md` | Agent for extracting insights from docs |
| `agents/web-search-researcher.md` | Agent for external research |
| `agents/graph-navigator.md` | Agent for structural code graph analysis |
| `agents/browser-verifier.md` | Agent for headless browser verification |
| `agents/log-investigator.md` | Agent for log analysis |
| `agents/state-investigator.md` | Agent for app state inspection |
| `agents/git-investigator.md` | Agent for git history analysis |

## Component Analysis

### 1. Skill Discovery Mechanism

**Location**: `skills/*/SKILL.md`

**How it works**:
- Claude Code auto-discovers skills by scanning the `skills/` directory for subdirectories containing a `SKILL.md` file
- Each `SKILL.md` has YAML frontmatter with three key fields:
  - `name`: The skill identifier (maps to `/skill-name` slash command)
  - `description`: Natural language trigger phrases that Claude Code uses for intent matching
  - `model`: Preferred model tier (`opus`, `sonnet`, or `haiku`)
- The `description` field contains trigger phrases like "research this", "create a plan", etc. that Claude Code matches against user input
- When a user types something matching a skill's description triggers, Claude Code activates that skill and follows its markdown instructions

**Discovery convention**: `skills/{skill-name}/SKILL.md` -> user invokes as `/{skill-name}`

**All 14 discovered skills**:

| Skill Name | Model | Trigger Phrases (subset) |
|------------|-------|--------------------------|
| `prism` | sonnet | "help me build", "implement this feature", "prism", "structured workflow" |
| `prism-research` | sonnet | "research this", "understand how X works", "map out the system" |
| `prism-plan` | opus | "create a plan", "plan the implementation", "design how to build" |
| `prism-implement` | sonnet | "implement the plan", "start building", "execute phase 1" |
| `prism-validate` | sonnet | "validate the plan", "verify implementation", "check if complete" |
| `prism-verify` | sonnet | "verify the UI", "check the browser", "visual verification" |
| `prism-iterate` | opus | "iterate on plan", "update and continue", "adjust the approach" |
| `prism-spectrum` | sonnet | "spectrum", "execute story", "run spectrum" |
| `prism-debug` | sonnet | "debug this", "why is this failing", "investigate the error" |
| `prism-eval` | sonnet | "run evals", "compare versions", "benchmark skills" |
| `prism-release` | (default) | "release", "bump version", "new version", "cut a release" |
| `prism-prd` | opus | "create a PRD", "write product requirements" |
| `prism-visual-docs` | opus | "create user flows", "design the screens", "create wireframes" |
| `prism-docs-update` | (default) | "update prism docs", "sync docs site" |

### 2. The Meta-Skill Router (`skills/prism/SKILL.md`)

**Location**: `skills/prism/SKILL.md`

**How it works**:
- The `prism` skill is the top-level entry point, triggered by broad phrases like "help me build" or "structured workflow"
- It does NOT contain imperative routing logic (no if/else code). Instead, it provides a descriptive routing table and decision framework that Claude follows
- Routing is done through a **workflow selection matrix** at `skills/prism/SKILL.md:39-44`:

```
| Scenario                            | Phases          |
| New feature, unfamiliar codebase    | Full R->P->I->V |
| Feature in known codebase           | P->I->V         |
| Simple change, clear scope          | I->V            |
| Trivial fix (<20 lines)             | Direct impl     |
```

- The meta-skill also defines a **state-based routing** mechanism at `skills/prism/SKILL.md:49-62`:
  1. First, it spawns a `prism-locator` agent to check for existing `.prism/` artifacts
  2. Based on what exists, it routes to the appropriate phase:
     - Nothing exists -> Start with `/prism-research`
     - Research exists -> Start with `/prism-plan`
     - Plan exists (incomplete) -> Resume with `/prism-implement`
     - Implementation done -> Run `/prism-validate`

- The meta-skill presents a **quick reference table** listing all phases, their corresponding skills, and their output paths

**Data flow**:
```
User request -> prism meta-skill -> prism-locator agent (check .prism/) -> route to phase skill
```

### 3. Skill-to-Agent Routing

**Location**: Each `SKILL.md` file contains agent invocation instructions

**How it works**:
- Skills invoke agents using `Task(subagent_type="agent-name")` syntax
- Agent definitions live in `agents/*.md` with YAML frontmatter containing:
  - `name`: Agent identifier (matches `subagent_type` parameter)
  - `description`: What the agent does
  - `tools`: Restricted tool set (e.g., `Read, Glob, Grep`)
  - `model`: Preferred model tier
- The `prism-research` skill spawns 5-6 agents: `prism-locator`, `codebase-locator`, `codebase-analyzer`, `codebase-pattern-finder`, `prism-analyzer`, `web-search-researcher`
- The `prism-debug` skill spawns 3 agents: `log-investigator`, `state-investigator`, `git-investigator`
- The `prism-verify` skill spawns `browser-verifier`
- Skills can run agents in parallel when searching different areas

**Agent model assignment convention**:
- Opus: Deep analysis (`codebase-analyzer`, `prism-analyzer`)
- Sonnet: General work (`codebase-pattern-finder`, `web-search-researcher`)
- Haiku: Fast lookups (`codebase-locator`, `prism-locator`)

### 4. Skill-to-Command Routing

**Location**: `commands/*.md`

**How it works**:
- Commands are user-invocable via `/command-name` slash syntax
- Commands are defined as single-purpose markdown prompt files in `commands/`
- Skills reference commands by name: e.g., the `prism-prd` skill invokes `/generate_prd`, the `prism-visual-docs` skill invokes `/generate_user_flows`
- Commands have YAML frontmatter with `description` and `model` fields (no `name` field -- the filename IS the name)
- The command filename maps to the slash command: `generate_prd.md` -> `/generate_prd`

### 5. Spectrum External Routing

**Location**: `scripts/spectrum.sh`

**How it works**:
- Spectrum is an external Bash loop that spawns fresh Claude Code sessions
- Each iteration invokes Claude CLI with a prompt that triggers the `prism-spectrum` skill: `claude --dangerously-skip-permissions --print "$prompt"` at `scripts/spectrum.sh:314`
- The prompt includes the story ID and file paths, causing Claude Code to match and activate `prism-spectrum`
- Story selection is done by `spectrum.sh` using `jq` (not by Claude): `select_next_story()` at `scripts/spectrum.sh:180-197`
- Signal protocol (`<spectrum-continue>`, `<spectrum-retry>`, `<promise>COMPLETE</promise>`) is parsed by `spectrum.sh` via grep at `scripts/spectrum.sh:325-361`

**Data flow**:
```
spectrum.sh -> selects story via jq -> builds prompt -> claude CLI -> prism-spectrum skill activates
  -> implements story -> emits signal tag -> spectrum.sh parses signal -> loops or terminates
```

### 6. Plugin Registration

**Location**: `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`

**How it works**:
- `.claude-plugin/plugin.json` registers the plugin with Claude Code's plugin system
- Contains `name`, `description`, `version`, and `author` fields
- `.claude-plugin/marketplace.json` provides distribution metadata for the plugin marketplace
- The plugin system tells Claude Code to scan `skills/`, `commands/`, and `agents/` directories

### 7. Document-Driven Phase Transitions

**Location**: `.prism/shared/` directory structure

**How it works**:
- Phase transitions are mediated through document artifacts in `.prism/shared/`
- Research outputs to `.prism/shared/research/YYYY-MM-DD-topic.md`
- Plans output to `.prism/shared/plans/YYYY-MM-DD-feature.md`
- Validation outputs to `.prism/shared/validation/YYYY-MM-DD-report.md`
- The `prism-locator` agent scans these directories to determine current state
- This enables cross-session continuity: a new session can pick up where the last left off by reading `.prism/` artifacts

## Patterns Found

### Convention-Based Discovery Pattern

**Example at**: `skills/prism-research/SKILL.md:1-5`

```yaml
---
name: prism-research
description: Research phase for complex coding tasks. Use when exploring...
model: sonnet
---
```

**Also used in**:
- All 14 skill files under `skills/*/SKILL.md`

Every skill follows the identical frontmatter pattern. The `name` field is the canonical identifier, the `description` field provides NLP trigger matching, and the `model` field sets execution tier.

### Task Delegation Pattern

**Example at**: `skills/prism/SKILL.md:53-55`

```
Task(subagent_type="prism-locator")
"Find existing research, plans, or work related to [topic]"
```

**Also used in**:
- `skills/prism-research/SKILL.md:44-46` (prism-locator)
- `skills/prism-research/SKILL.md:49-51` (codebase-locator)
- `skills/prism-research/SKILL.md:54-56` (codebase-analyzer)
- `skills/prism-research/SKILL.md:60-62` (codebase-pattern-finder)
- `skills/prism-research/SKILL.md:66-68` (web-search-researcher)
- `skills/prism-spectrum/SKILL.md:222-224` (debug agents in auto-debug flow)

### State-Based Routing Pattern

**Example at**: `skills/prism/SKILL.md:56-62`

The meta-skill checks existing artifacts to determine which phase to enter:
- Nothing exists -> Research
- Research exists -> Plan
- Plan exists (incomplete) -> Implement
- Implementation done -> Validate

This is a stateless pattern: each session re-derives the current phase from the file system.

### Document Flow Pattern

**Example at**: `skills/prism/SKILL.md:228-234`

```
prism-prd (Product Reqs) -> visual-docs (UX Flows) -> prism-plan (Impl Steps)
```

Document generation skills chain forward, each skill's output becoming the next skill's input context.

## Architecture Notes

- **No imperative router**: The entire routing system is declarative. There is no code that parses skill names and dispatches. Claude Code's built-in plugin infrastructure handles discovery and the meta-skill's natural language instructions handle routing decisions.
- **Convention**: `skills/{name}/SKILL.md` -> `/name` slash command. `commands/{name}.md` -> `/{name}` slash command. `agents/{name}.md` -> `Task(subagent_type="{name}")`.
- **Model tier assignment**: Opus for deep analysis (planning, PRDs), Sonnet for general work (research, implementation), Haiku for fast lookups (locator agents).
- **Three-layer separation**: Skills orchestrate workflows, Commands perform single operations, Agents are spawned specialists with restricted tool access.
- **External orchestration**: `spectrum.sh` sits outside the Claude Code skill system, invoking it via CLI in a loop with story-specific prompts.

## Open Questions

- [ ] How does Claude Code internally prioritize when multiple skills match a user's input? (e.g., "help me build" could match both `prism` and `prism-implement`)
- [ ] Is the `model` field in YAML frontmatter enforced by Claude Code, or is it advisory?
- [ ] What is the exact mechanism by which `.claude-plugin/plugin.json` tells Claude Code to scan `skills/`, `commands/`, and `agents/` directories?
- [ ] Can skills invoke other skills directly, or must they go through slash commands / natural language to trigger another skill?

## Code References

Quick navigation:

| Reference | Description |
|-----------|-------------|
| `skills/prism/SKILL.md:1-5` | Meta-skill YAML frontmatter |
| `skills/prism/SKILL.md:17-27` | Core workflow routing table |
| `skills/prism/SKILL.md:39-44` | Workflow selection matrix (complexity-based routing) |
| `skills/prism/SKILL.md:49-62` | State-based routing (check .prism/ artifacts) |
| `skills/prism/SKILL.md:228-234` | Document flow diagram (PRD -> Visual -> Plan) |
| `skills/prism/SKILL.md:252-276` | Full agent registry |
| `skills/prism-research/SKILL.md:22-31` | Research agent table |
| `skills/prism-research/SKILL.md:43-78` | Research workflow steps (agent invocation) |
| `skills/prism-spectrum/SKILL.md:35-43` | Spectrum state file loading |
| `scripts/spectrum.sh:300-322` | spectrum.sh iteration runner (Claude CLI invocation) |
| `scripts/spectrum.sh:180-197` | Story selection logic (jq-based) |
| `scripts/spectrum.sh:325-361` | Signal protocol parsing |
| `.claude-plugin/plugin.json:1-8` | Plugin manifest |
| `agents/prism-locator.md:1-6` | Agent YAML frontmatter pattern |
| `agents/codebase-locator.md:1-6` | Agent YAML frontmatter pattern |
| `commands/create_plan.md:1-4` | Command YAML frontmatter pattern |
