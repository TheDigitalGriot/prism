---
date: 2026-03-08
researcher: Claude
git_commit: 3b1ceb82b2010d270a0a458d278638119fb44b0b
branch: main
repository: prism-plugin
topic: "Agent Spawning Architecture — How Skills Invoke Agents via the Task Tool"
tags: [research, agents, skills, task-tool, architecture, spawning]
status: complete
---

# Research: Agent Spawning Architecture — How Skills Invoke Agents via the Task Tool

## Research Question

How do skills invoke agents via the Task tool in the Prism plugin codebase? What is the agent spawning architecture?

## Summary

Prism uses a three-layer architecture where **Skills** (orchestrators) invoke **Agents** (specialists) via the Claude Code `Task` tool with a `subagent_type` parameter matching the agent's `name` frontmatter field. Each agent is defined as a standalone markdown file in `agents/` with YAML frontmatter declaring its name, description, allowed tools, and preferred model tier. Skills contain inline `Task(subagent_type="agent-name")` calls within their workflow steps, often spawning multiple agents in parallel for efficiency. There are 12 agents and 14 skills in the current codebase.

## Files Discovered

| File | Purpose |
|------|---------|
| `agents/codebase-locator.md` | File/component location agent (haiku) |
| `agents/codebase-analyzer.md` | Code analysis and data flow tracing agent (opus) |
| `agents/codebase-pattern-finder.md` | Pattern discovery and example extraction agent (sonnet) |
| `agents/graph-navigator.md` | Knowledge graph structural analysis agent (haiku) |
| `agents/prism-locator.md` | .prism/ document discovery agent (haiku) |
| `agents/prism-analyzer.md` | Deep document insight extraction agent (opus) |
| `agents/web-search-researcher.md` | External web research agent (sonnet) |
| `agents/browser-verifier.md` | Playwright-based UI verification agent (haiku) |
| `agents/visual-regression-grader.md` | Visual diff judgment agent (sonnet) |
| `agents/log-investigator.md` | Log file analysis agent (haiku) |
| `agents/state-investigator.md` | Application state examination agent (haiku) |
| `agents/git-investigator.md` | Git history analysis agent (haiku) |
| `skills/prism/SKILL.md` | Master orchestrator skill — references all agents |
| `skills/prism-research/SKILL.md` | Research phase skill — spawns 7 agents |
| `skills/prism-debug/SKILL.md` | Debug skill — spawns 3 investigation agents |
| `skills/prism-verify/SKILL.md` | UI verification skill — spawns browser-verifier and visual-regression-grader |
| `skills/prism-spectrum/SKILL.md` | Autonomous execution skill — spawns visual-regression-grader and investigation agents |
| `skills/prism-visual-docs/SKILL.md` | Document generation skill — spawns prism-locator |
| `skills/prism-validate/SKILL.md` | Validation skill — spawns visual-regression-grader |

## Component Analysis

### Agent Definition Format

**Location**: `agents/*.md`

**How it works**:
Every agent is a standalone markdown file with YAML frontmatter containing four fields:

```yaml
---
name: codebase-locator          # The identifier used in Task(subagent_type="...")
description: ...                # Describes when/how to use this agent
tools: Read, Glob, Grep, Bash   # Tools the agent is allowed to use
model: haiku                    # Preferred model tier (haiku/sonnet/opus)
---
```

The body of the markdown file serves as the agent's system prompt. It defines:
- The agent's role and responsibilities
- The "documentarian, not critic" constraint (present on all agents)
- Specific search/analysis strategies
- Required output format
- Explicit "What NOT to Do" sections

**Agent definition at**: `agents/codebase-locator.md:1-6` (frontmatter example)

### The Task Invocation Mechanism

**Location**: Skills reference agents inline via `Task(subagent_type="...")` syntax

**How it works**:
Skills invoke agents by calling Claude Code's built-in `Task` tool with two key pieces:
1. `subagent_type` — matches the `name` field in an agent's YAML frontmatter
2. A natural language prompt describing the specific work to do

The invocation syntax used in skill markdown is:
```
Task(subagent_type="codebase-locator")
"Find files related to [feature]. Look for [patterns, names]"
```

This is not executable code; it is a prompt instruction telling the Claude session running the skill to call the Task tool with these parameters. Claude Code's plugin system auto-discovers agents from the `agents/` directory.

**Example at**: `skills/prism-research/SKILL.md:59-60`

### Model Assignment Convention

**Location**: Agent frontmatter `model` field across all `agents/*.md` files

**How it works**:
Agents are assigned to model tiers based on task complexity:

| Model | Assignment | Agents |
|-------|-----------|--------|
| `opus` | Deep analysis requiring thoroughness | `codebase-analyzer`, `prism-analyzer` |
| `sonnet` | General-purpose work | `codebase-pattern-finder`, `web-search-researcher`, `visual-regression-grader` |
| `haiku` | Fast, cheap lookups | `codebase-locator`, `graph-navigator`, `prism-locator`, `browser-verifier`, `log-investigator`, `state-investigator`, `git-investigator` |

**Referenced at**: `CLAUDE.md:29-31` (Model Assignment Convention section)

### Parallel Agent Spawning

**Location**: Multiple skill files

**How it works**:
Skills are instructed to spawn agents in parallel when they are investigating different areas. This is a workflow optimization — independent agents run concurrently rather than sequentially.

- `prism-research` (SKILL.md:106, rule #3): "Run agents in parallel when searching different areas"
- `prism-debug` (SKILL.md:59-85): Spawns `log-investigator`, `state-investigator`, and `git-investigator` simultaneously in step 2
- `prism-debug` (SKILL.md:183, rule #2): "Always spawn investigation agents in parallel"

### Skill-to-Agent Mapping

**Location**: Across all `skills/*/SKILL.md` files

**How it works**:
Each skill has a defined set of agents it can spawn. The mapping is:

| Skill | Agents Spawned |
|-------|---------------|
| `prism-research` | `prism-locator`, `graph-navigator`, `codebase-locator`, `codebase-analyzer`, `codebase-pattern-finder`, `prism-analyzer`*, `web-search-researcher` |
| `prism-debug` | `log-investigator`, `state-investigator`, `git-investigator` |
| `prism-verify` | `browser-verifier`, `visual-regression-grader` |
| `prism-validate` | `visual-regression-grader` |
| `prism-spectrum` | `visual-regression-grader`, `log-investigator`, `state-investigator`, `git-investigator` |
| `prism-visual-docs` | `prism-locator` |
| `prism` (master) | References all agents (delegates to phase-specific skills) |

*`prism-analyzer` is listed in `prism-research`'s Available Agents table at line 31 but is not shown in the numbered workflow steps.

**Key references**:
- `skills/prism-research/SKILL.md:20-33` — Available Agents table
- `skills/prism-debug/SKILL.md:172-181` — Agents table
- `skills/prism/SKILL.md:252-276` — Complete agent registry

### Agent Tool Permissions

**Location**: Agent frontmatter `tools` field

**How it works**:
Each agent declares which tools it is allowed to use. This constrains the agent's capabilities:

| Agent | Permitted Tools |
|-------|----------------|
| `codebase-locator` | Read, Glob, Grep, Bash |
| `codebase-analyzer` | Read, Glob, Grep, Bash |
| `codebase-pattern-finder` | Read, Glob, Grep, Bash |
| `graph-navigator` | codebase-memory-mcp (all 11 tools) |
| `prism-locator` | Read, Glob, Grep |
| `prism-analyzer` | Read, Glob, Grep |
| `web-search-researcher` | WebSearch, WebFetch, Read |
| `browser-verifier` | Bash |
| `visual-regression-grader` | Read, Glob, Grep |
| `log-investigator` | Bash |
| `state-investigator` | Bash |
| `git-investigator` | Bash |

### Agent Categorization

**Location**: `skills/prism/SKILL.md:252-276`

**How it works**:
The master prism skill organizes agents into two functional groups:

1. **Research Agents** (7 agents): `graph-navigator`, `codebase-locator`, `codebase-analyzer`, `codebase-pattern-finder`, `prism-locator`, `prism-analyzer`, `web-search-researcher`

2. **Debug Agents** (3 agents): `log-investigator`, `state-investigator`, `git-investigator`

Two additional agents (`browser-verifier`, `visual-regression-grader`) are used for UI verification but are not listed in the master skill's agent tables — they are referenced only within `prism-verify`, `prism-validate`, and `prism-spectrum`.

## Patterns Found

### Pattern 1: Ordered Workflow with Sequential Agent Steps

**Example at**: `skills/prism-research/SKILL.md:42-88`

The research skill defines a numbered sequence of agent spawns:
1. Check existing knowledge (`prism-locator`)
2. Structural orientation (`graph-navigator`)
3. Locate code (`codebase-locator`)
4. Analyze components (`codebase-analyzer`)
5. Find patterns (`codebase-pattern-finder`)
6. External research (`web-search-researcher`) — conditional ("if needed")
7. Save findings

Each step builds on the prior step's output, creating a pipeline from broad discovery to specific analysis.

**Also used in**:
- `skills/prism-debug/SKILL.md:39-106` — sequential gather-context then parallel-investigate then synthesize

### Pattern 2: Conditional Agent Spawning

**Example at**: `skills/prism-research/SKILL.md:49` (step 1b)

The `graph-navigator` agent is only spawned "if codebase-memory-mcp available." The `web-search-researcher` is spawned only "if needed" (step 5, line 77). This shows that agent spawning is conditional based on available infrastructure or task requirements.

**Also used in**:
- `skills/prism-spectrum/SKILL.md:184` — `visual-regression-grader` spawned only when visual diffs exceed threshold

### Pattern 3: Prompt Parameterization via Natural Language

**Example at**: `skills/prism-research/SKILL.md:59-60`

```
Task(subagent_type="codebase-locator")
"Find files related to [feature]. Look for [patterns, names]"
```

Skills use bracket placeholders (`[feature]`, `[topic]`, `[issue description]`) in their agent prompts. The orchestrating skill fills these in at runtime based on the user's request. This allows the same agent definition to handle any domain.

**Also used in**:
- `skills/prism-debug/SKILL.md:64-85` — all three investigation agents receive `[issue description]` context

### Pattern 4: Structured Output Contracts

**Example at**: `agents/browser-verifier.md:55-70`

Some agents define strict output formats (JSON for `browser-verifier`, JSON for `visual-regression-grader`). Other agents use markdown-based output formats. The calling skill expects these formats to process agent results.

**Also used in**:
- `agents/visual-regression-grader.md:60-69` — JSON verdict output
- `agents/codebase-locator.md:78-104` — markdown file listing format

## Architecture Notes

- **Pure markdown architecture**: The entire agent spawning system is prompt-engineered markdown. There is no TypeScript, Python, or Go code that handles agent dispatch. Claude Code's built-in plugin system reads the `agents/` directory, matches `subagent_type` to frontmatter `name`, and executes the agent's markdown body as a system prompt.

- **Three-layer hierarchy**: Skills (orchestrators) -> Commands (user-invokable operations) -> Agents (spawned specialists). Skills invoke agents via Task; commands are invoked via `/command-name` by the user or by skills.

- **"Documentarian, not critic" universal constraint**: Every single agent contains a `CRITICAL` section forbidding suggestions, critiques, or recommendations. This is the most prominent cross-cutting concern in the agent architecture.

- **No inter-agent communication**: Agents do not call other agents. Only skills spawn agents. Agent results flow back to the skill, which synthesizes them into a final output. This is a hub-and-spoke pattern, not a mesh.

- **Auto-discovery**: Claude Code discovers agents automatically from the `agents/` directory. No registration or configuration file is needed beyond the frontmatter.

## Open Questions

- [ ] How does Claude Code's Task tool runtime actually match `subagent_type` to agent files? Is it purely by the `name` frontmatter field, or does file naming also matter?
- [ ] Is the `tools` frontmatter field enforced by Claude Code at runtime, or is it advisory for the agent prompt?
- [ ] Is the `model` frontmatter field enforced to route to specific model tiers, or is it advisory?
- [ ] Can agents be nested (an agent spawning another agent via Task)? The architecture appears to forbid this, but is it technically possible?
- [ ] How does `prism-analyzer` get invoked? It is listed in the research skill's Available Agents table but has no numbered workflow step.

## Code References

| Reference | Description |
|-----------|-------------|
| `agents/codebase-locator.md:1-6` | Agent frontmatter definition example |
| `skills/prism-research/SKILL.md:20-33` | Available Agents table for research |
| `skills/prism-research/SKILL.md:42-88` | Numbered agent workflow steps |
| `skills/prism-research/SKILL.md:106` | Parallel spawning rule |
| `skills/prism-debug/SKILL.md:59-85` | Parallel investigation agent spawning |
| `skills/prism-debug/SKILL.md:172-181` | Debug agents table |
| `skills/prism/SKILL.md:252-276` | Master agent registry |
| `skills/prism/SKILL.md:276` | Universal invocation syntax: `Task(subagent_type="agent-name")` |
| `skills/prism-verify/SKILL.md:30` | Verify skill agent invocation |
| `skills/prism-spectrum/SKILL.md:258-260` | Spectrum debug agent spawning |
| `CLAUDE.md:25-31` | Three-layer architecture and model assignment convention |

## Workflow Steps Executed

1. **Step 0 (Read Mentioned Files)**: No specific files mentioned by user; skipped.
2. **Step 1 (Check Existing Knowledge)**: Simulated `prism-locator` — searched `.prism/shared/research/` for existing research on agents/task/spawn topics. Found 4 agent-related documents, none directly covering spawning architecture.
3. **Step 1b (Structural Orientation)**: Skipped — codebase-memory-mcp not available.
4. **Step 2 (Locate Code)**: Simulated `codebase-locator` — used Glob to find all 12 agent files in `agents/` and 14 skill files in `skills/*/SKILL.md`. Used Grep to find all 40+ `Task(subagent_type=` references across the codebase.
5. **Step 3 (Analyze Components)**: Simulated `codebase-analyzer` — read all 12 agent definition files and 5 key skill files to trace the invocation mechanism, model assignment, tool permissions, and output contracts.
6. **Step 4 (Find Patterns)**: Simulated `codebase-pattern-finder` — identified 4 recurring patterns: ordered workflow steps, conditional spawning, prompt parameterization, and structured output contracts.
7. **Step 5 (External Research)**: Not needed — this is an internal architecture question.
8. **Step 6 (Save Findings)**: Saved to this file.
