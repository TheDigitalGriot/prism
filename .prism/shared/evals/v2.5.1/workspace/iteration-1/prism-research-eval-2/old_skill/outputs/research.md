---
date: 2026-03-08
researcher: Claude
git_commit: 9d421a43c7248fcb633a39b45501e4804897406c
branch: main
repository: prism-plugin
topic: "Agent Spawning Architecture — How Skills Invoke Agents via the Task Tool"
tags: [research, agents, skills, task-tool, architecture, spawning]
status: complete
---

# Research: Agent Spawning Architecture — How Skills Invoke Agents via the Task Tool

## Research Question

How do skills invoke agents via the Task tool in this codebase? What is the agent spawning architecture?

## Summary

Prism uses a three-layer architecture (Skills -> Commands -> Agents) where agents are spawned by skills using `Task(subagent_type="agent-name")` syntax. Each agent is a standalone markdown file in `agents/` with YAML frontmatter defining its name, description, allowed tools, and model assignment. Skills orchestrate agents by spawning them with natural-language prompts, often in parallel. There are 11 agents total, divided into research agents (7) and debug agents (4, including browser-verifier), each assigned to a specific model tier (Opus for deep analysis, Sonnet for general work, Haiku for fast lookups).

## Methodology (v2.4.8 Skill Workflow)

Following the v2.4.8 `prism-research` SKILL.md workflow:

1. **Step 0 — Read Mentioned Files**: No specific files mentioned; skipped.
2. **Step 1 — Check Existing Knowledge**: Simulated `Task(subagent_type="prism-locator")` — searched `.prism/shared/research/` for existing research on agent spawning. Found `2026-02-22-prism-plugin-architecture.md` which covers the three-layer architecture at a high level but does not deep-dive into the Task invocation mechanism.
3. **Step 2 — Locate Code**: Simulated `Task(subagent_type="codebase-locator")` — used Glob to find all 11 agent files in `agents/` and all 14 skill files in `skills/*/SKILL.md`. Used Grep to find all `Task(subagent_type=` invocations across the codebase.
4. **Step 3 — Analyze Components**: Simulated `Task(subagent_type="codebase-analyzer")` — read all 11 agent markdown files and 8 skill files to trace how spawning works, what frontmatter fields are used, and how prompts are structured.
5. **Step 4 — Find Patterns**: Simulated `Task(subagent_type="codebase-pattern-finder")` — identified spawning patterns across skills (parallel vs sequential, prompt structure, model assignment conventions).
6. **Step 5 — External Research**: Not needed (internal architecture question).
7. **Step 6 — Save Findings**: This document.

## Files Discovered

| File | Purpose |
|------|---------|
| `agents/codebase-locator.md` | Agent: find WHERE files/components live (Haiku) |
| `agents/codebase-analyzer.md` | Agent: understand HOW code works (Opus) |
| `agents/codebase-pattern-finder.md` | Agent: find patterns to model after (Sonnet) |
| `agents/prism-locator.md` | Agent: find existing docs in `.prism/` (Haiku) |
| `agents/prism-analyzer.md` | Agent: extract insights from docs (Opus) |
| `agents/web-search-researcher.md` | Agent: external web research (Sonnet) |
| `agents/graph-navigator.md` | Agent: structural analysis via knowledge graph (Haiku) |
| `agents/browser-verifier.md` | Agent: browser screenshots/verification (Haiku) |
| `agents/git-investigator.md` | Agent: git history analysis (Haiku) |
| `agents/log-investigator.md` | Agent: log file analysis (Haiku) |
| `agents/state-investigator.md` | Agent: app state/config analysis (Haiku) |
| `skills/prism-research/SKILL.md` | Skill: spawns 5-7 research agents |
| `skills/prism-debug/SKILL.md` | Skill: spawns 3 debug agents in parallel |
| `skills/prism-plan/SKILL.md` | Skill: spawns prism-analyzer, codebase-analyzer, codebase-pattern-finder |
| `skills/prism-verify/SKILL.md` | Skill: spawns browser-verifier agent |
| `skills/prism-iterate/SKILL.md` | Skill: conditionally spawns research agents |
| `skills/prism-spectrum/SKILL.md` | Skill: spawns debug agents on quality gate failure |
| `skills/prism/SKILL.md` | Root orchestrator skill, spawns prism-locator for routing |
| `skills/prism-prd/SKILL.md` | Skill: spawns prism-locator for context check |
| `skills/prism-visual-docs/SKILL.md` | Skill: spawns prism-locator for context check |
| `CLAUDE.md` | Documents the three-layer architecture and agent invocation convention |

## Component Analysis

### 1. Agent Definition Structure

**Location**: `agents/*.md`

Each agent is a single markdown file with two parts:

**YAML Frontmatter** (lines 1-6 typically):
```yaml
---
name: codebase-locator
description: Locates files, directories, and components...
tools: Read, Glob, Grep, Bash
model: haiku
---
```

- `name`: The identifier used in `Task(subagent_type="<name>")`
- `description`: Natural-language description of the agent's purpose; also serves as Claude's system prompt context
- `tools`: Comma-separated list of tools the agent is allowed to use
- `model`: Which AI model tier runs this agent (`haiku`, `sonnet`, or `opus`)

**Markdown Body** (remaining lines): The agent's full system prompt, including:
- Core responsibilities
- Search/analysis strategy
- Output format specification
- Important guidelines and anti-patterns
- "CRITICAL" preamble enforcing the "documentarian, not critic" principle

### 2. Agent Invocation Mechanism

**Location**: All skill files in `skills/*/SKILL.md`

Agents are invoked by skills using the `Task` tool with the syntax:
```
Task(subagent_type="agent-name")
"Natural language prompt describing what to do"
```

This is a Claude Code built-in capability. The `Task` tool:
1. Looks up the agent by `subagent_type` matching the `name` field in agent frontmatter
2. Loads the agent's markdown as the system prompt
3. Restricts the agent to only the tools listed in `tools` frontmatter
4. Runs the agent on the model specified in `model` frontmatter
5. Passes the natural-language string as the user prompt
6. Returns the agent's output back to the calling skill

### 3. Model Assignment Convention

**Location**: `CLAUDE.md:33-35`, agent frontmatter

| Model | Purpose | Agents |
|-------|---------|--------|
| `opus` | Deep analysis requiring reasoning | `codebase-analyzer`, `prism-analyzer` |
| `sonnet` | General-purpose work | `codebase-pattern-finder`, `web-search-researcher` |
| `haiku` | Fast, cheap lookups | `codebase-locator`, `prism-locator`, `graph-navigator`, `browser-verifier`, `git-investigator`, `log-investigator`, `state-investigator` |

### 4. Spawning Patterns by Skill

#### prism-research (SKILL.md:44-82)

Sequential workflow with up to 7 agents:
1. `prism-locator` — Check existing knowledge
2. `graph-navigator` — Structural orientation (v2.5.1 only, not in v2.4.8)
3. `codebase-locator` — Find relevant files
4. `codebase-analyzer` — Analyze components
5. `codebase-pattern-finder` — Find patterns
6. `web-search-researcher` — External research (if needed)

Rule 3 states: "Run agents in parallel when searching different areas" — steps 2-5 can run concurrently when they target different areas.

#### prism-debug (SKILL.md:59-85)

Always spawns 3 agents in parallel:
```
Task(subagent_type="log-investigator")
Task(subagent_type="state-investigator")
Task(subagent_type="git-investigator")
```

Rule 2: "Always spawn investigation agents in parallel"

#### prism-plan (SKILL.md:37-40)

Spawns `prism-analyzer` first to load research context, then optionally uses `codebase-analyzer` and `codebase-pattern-finder` for deeper investigation.

#### prism-verify (SKILL.md:76-83)

Spawns a single `browser-verifier` agent with structured prompt:
```
Task(subagent_type="browser-verifier")
"Session: verify-{story-id or timestamp}
URL: {target-url}
Output path: .prism/local/verifications/{YYYY-MM-DD}-{context}/
Checks: screenshot, console-errors"
```

#### prism-spectrum (SKILL.md:220-227)

On quality gate failure, spawns the same 3 debug agents as prism-debug:
```
Task(subagent_type="log-investigator")
Task(subagent_type="state-investigator")
Task(subagent_type="git-investigator")
```

#### prism-iterate (SKILL.md:97-101)

Conditionally spawns research agents only if changes require new technical understanding:
```
Task(subagent_type="codebase-locator")
Task(subagent_type="codebase-analyzer")
Task(subagent_type="codebase-pattern-finder")
```

#### prism (root skill, SKILL.md:53-54)

Spawns `prism-locator` to check for existing work and route to the appropriate phase.

### 5. Agent Tool Permissions

Each agent is sandboxed to specific tools via the `tools` frontmatter:

| Agent | Allowed Tools |
|-------|---------------|
| `codebase-locator` | Read, Glob, Grep, Bash |
| `codebase-analyzer` | Read, Glob, Grep, Bash |
| `codebase-pattern-finder` | Read, Glob, Grep, Bash |
| `prism-locator` | Read, Glob, Grep |
| `prism-analyzer` | Read, Glob, Grep |
| `web-search-researcher` | WebSearch, WebFetch, Read |
| `graph-navigator` | codebase-memory-mcp (all 11 tools) |
| `browser-verifier` | Bash |
| `git-investigator` | Bash |
| `log-investigator` | Bash |
| `state-investigator` | Bash |

Note: `prism-locator` and `prism-analyzer` lack Bash access — they can only read files, not execute commands. The debug agents (`git-investigator`, `log-investigator`, `state-investigator`) have only Bash access — they run shell commands but cannot use the Read/Grep/Glob tools directly.

### 6. Agent Groupings

Agents are organized into two functional groups:

**Research Agents** (used by prism-research, prism-plan, prism-iterate):
- `graph-navigator` — structural code graph queries
- `codebase-locator` — file/directory discovery
- `codebase-analyzer` — implementation analysis
- `codebase-pattern-finder` — pattern extraction
- `prism-locator` — `.prism/` document discovery
- `prism-analyzer` — document insight extraction
- `web-search-researcher` — external web research

**Debug/Verification Agents** (used by prism-debug, prism-spectrum, prism-verify):
- `log-investigator` — log file error analysis
- `state-investigator` — application state/config anomaly detection
- `git-investigator` — git history regression analysis
- `browser-verifier` — headless browser screenshot/DOM verification

### 7. The "Documentarian, Not Critic" Principle

**Location**: All agent files, consistently at the top of the markdown body

Every research agent includes a `CRITICAL` section enforcing read-only, non-judgmental behavior:
- DO NOT suggest improvements
- DO NOT critique implementation
- DO NOT perform root cause analysis
- ONLY describe what exists

This principle is reinforced in:
- `CLAUDE.md:27` — "Documentarian, Not Critic"
- `skills/prism-research/SKILL.md:11-18` — "Document What IS, Not What SHOULD BE"
- Each individual agent's markdown body

## Patterns Found

### Pattern 1: Parallel Agent Spawning

Skills spawn multiple agents simultaneously when the agents target different areas of investigation. This is explicitly called out in:
- `skills/prism-research/SKILL.md:98` — "Run agents in parallel when searching different areas"
- `skills/prism-debug/SKILL.md:188` — "Always spawn investigation agents in parallel"

### Pattern 2: Context-Passing via Natural Language Prompts

Agent prompts are natural-language strings that include:
- What to search/analyze
- Where to look (specific directories/files)
- What format to return results in

Example from `skills/prism-debug/SKILL.md:64-68`:
```
Task(subagent_type="log-investigator")
"Investigate recent logs for errors related to: [issue description]
Look in common locations: logs/, ./logs/, application output
Search for: errors, warnings, stack traces, timestamps around failure
Return: Key findings with timestamps and severity"
```

### Pattern 3: Agent Results Flow Back to Skills for Synthesis

Skills wait for all spawned agents to complete (Rule 6 in prism-research: "Wait for completion — Wait for ALL agents before synthesizing"), then combine agent outputs into a structured document (research report, debug report, validation report).

### Pattern 4: Conditional Agent Spawning

Some agents are only spawned when needed:
- `web-search-researcher` — "if needed" for external research
- `graph-navigator` — only when `codebase-memory-mcp` is available
- `browser-verifier` — only when `playwright-cli` is installed
- Research agents in `prism-iterate` — "Only spawn research tasks if changes require new technical understanding"

## Architecture Notes

- The entire agent system is prompt-engineering-based — there is no build step, no compiled code, no runtime framework. Agents are markdown files interpreted by Claude Code's built-in Task tool.
- Agent discovery is automatic via Claude Code's plugin system: any `.md` file in the `agents/` directory with proper YAML frontmatter is available as a `subagent_type`.
- Skill discovery works the same way: any `SKILL.md` file in `skills/*/` directories with YAML frontmatter is auto-discovered.
- The `model` field in agent frontmatter controls cost/quality tradeoffs. Haiku agents are used for fast, cheap lookups. Opus agents are reserved for deep analysis requiring sophisticated reasoning.

## Historical Context

From `.prism/` directory:
- `.prism/shared/research/2026-02-22-prism-plugin-architecture.md` — Previous comprehensive architecture analysis covering the three-layer model, all skills/commands/agents, and their relationships.

## Open Questions

- [ ] How does Claude Code's Task tool implementation actually resolve `subagent_type` to agent markdown files? (Internal to Claude Code runtime, not visible in codebase)
- [ ] Is there a limit on the number of parallel agents that can be spawned simultaneously?
- [ ] How is agent output size bounded or truncated when returned to the calling skill?
- [ ] What happens if an agent's specified `model` is unavailable — does it fall back?

## Code References

| Reference | Description |
|-----------|-------------|
| `CLAUDE.md:31` | Defines agent invocation syntax: `Task(subagent_type="agent-name")` |
| `CLAUDE.md:33-35` | Model assignment convention (Opus/Sonnet/Haiku) |
| `skills/prism-research/SKILL.md:22-31` | Available agents table for research |
| `skills/prism-debug/SKILL.md:172-180` | Available agents table for debug |
| `skills/prism/SKILL.md:252-276` | Complete agent roster with invoke syntax |
| `skills/prism-spectrum/SKILL.md:220-227` | Debug agent spawning on quality gate failure |
| `agents/codebase-locator.md:1-6` | Example agent YAML frontmatter |
| `agents/codebase-analyzer.md:1-6` | Opus-tier agent frontmatter |
| `agents/web-search-researcher.md:1-6` | Sonnet-tier agent with web tools |
