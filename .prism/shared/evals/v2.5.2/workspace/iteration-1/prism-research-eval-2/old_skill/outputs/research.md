---
date: 2026-03-08
researcher: Claude
git_commit: 3b1ceb82b2010d270a0a458d278638119fb44b0b
branch: main
repository: prism-plugin
topic: "Agent Spawning Architecture — How Skills Invoke Agents via the Task Tool"
tags: [research, agents, skills, task-tool, architecture]
status: complete
---

# Research: Agent Spawning Architecture — How Skills Invoke Agents via the Task Tool

## Research Question

How do skills invoke agents via the Task tool in this codebase? What is the agent spawning architecture?

## Summary

Prism uses a three-layer architecture (Skills -> Commands -> Agents) where Skills are orchestrators that spawn Agents via Claude Code's `Task` tool using the `subagent_type` parameter. Each agent is a markdown prompt file in `agents/` with YAML frontmatter declaring its `name`, `description`, `tools`, and `model`. Skills reference agents by name string (matching the agent's `name` frontmatter field), pass a natural language prompt describing the task, and the Claude Code runtime handles instantiation, tool sandboxing, and model routing. There are currently 12 agents across three functional groups: Research (7 agents), Debug (3 agents), and Verification (2 agents).

## Files Discovered

| File | Purpose |
|------|---------|
| `skills/prism-research/SKILL.md` | Research orchestrator; spawns up to 7 agents |
| `skills/prism-debug/SKILL.md` | Debug orchestrator; spawns 3 investigation agents |
| `skills/prism-verify/SKILL.md` | Browser verification orchestrator; spawns 2 agents |
| `skills/prism/SKILL.md` | Root skill; documents full agent catalog |
| `skills/prism-plan/SKILL.md` | Planning skill; spawns prism-analyzer |
| `skills/prism-iterate/SKILL.md` | Iteration skill; spawns codebase-locator, codebase-analyzer, codebase-pattern-finder |
| `skills/prism-visual-docs/SKILL.md` | Visual docs skill; spawns prism-locator |
| `agents/codebase-locator.md` | Agent: finds WHERE files/components live |
| `agents/codebase-analyzer.md` | Agent: understands HOW code works |
| `agents/codebase-pattern-finder.md` | Agent: finds patterns to model after |
| `agents/prism-locator.md` | Agent: finds existing research in `.prism/` |
| `agents/prism-analyzer.md` | Agent: extracts high-value insights from docs |
| `agents/web-search-researcher.md` | Agent: researches external docs/APIs |
| `agents/graph-navigator.md` | Agent: structural analysis via knowledge graph |
| `agents/log-investigator.md` | Agent: analyzes logs for errors |
| `agents/state-investigator.md` | Agent: checks application state |
| `agents/git-investigator.md` | Agent: analyzes git history |
| `agents/browser-verifier.md` | Agent: executes playwright-cli browser checks |
| `agents/visual-regression-grader.md` | Agent: judges visual regression diffs |

## Component Analysis

### The Three-Layer Architecture

**Location**: Documented across `skills/prism/SKILL.md` and `CLAUDE.md`

**How it works**:

```
Skills (Orchestrators)  ->  Commands (Operations)  ->  Agents (Specialists)
```

- **Skills** (`skills/*/SKILL.md`): Auto-discovered workflow orchestrators with YAML frontmatter. They are entry points for workflows and invoke commands and spawn agents.
- **Commands** (`commands/*.md`): User-invocable via `/command-name`. Single-purpose prompt files.
- **Agents** (`agents/*.md`): Spawned via `Task(subagent_type="agent-name")`. Run in parallel for efficiency.

### Agent Definition Format

**Location**: `agents/*.md`

**How it works**:
Each agent is a markdown file with YAML frontmatter containing four fields:

```yaml
---
name: <agent-name>          # String identifier used in Task() calls
description: <purpose>       # When/how to use this agent
tools: <tool-list>           # Tools available to the agent (sandboxed)
model: <model-tier>          # haiku | sonnet | opus
---
```

The body of the markdown file is the agent's system prompt — instructions that define its behavior, output format, search strategies, and constraints.

**Model assignment convention** (from `CLAUDE.md`):
- **Opus**: Deep analysis (`codebase-analyzer`, `prism-analyzer`)
- **Sonnet**: General work (`codebase-pattern-finder`, `web-search-researcher`, `visual-regression-grader`)
- **Haiku**: Fast lookups (`codebase-locator`, `prism-locator`, `graph-navigator`, `log-investigator`, `state-investigator`, `git-investigator`, `browser-verifier`)

### Task Invocation Syntax

**Location**: Throughout all skill files

**How it works**:
Skills invoke agents using the Claude Code `Task` tool with two key components:

1. `subagent_type` parameter — the string name matching the agent's `name` frontmatter
2. A natural language prompt — describing the specific task for the agent

The invocation pattern documented in skill files:

```
Task(subagent_type="agent-name")
"Natural language prompt describing what to do"
```

Example from `skills/prism-research/SKILL.md:45`:
```
Task(subagent_type="prism-locator")
"Find existing research about [topic]"
```

Example from `skills/prism-debug/SKILL.md:64`:
```
Task(subagent_type="log-investigator")
"Investigate recent logs for errors related to: [issue description]
Look in common locations: logs/, ./logs/, application output
Search for: errors, warnings, stack traces, timestamps around failure
Return: Key findings with timestamps and severity"
```

### Skill-to-Agent Mapping

**Location**: Across all skill SKILL.md files

**How it works** — each skill has a defined set of agents it orchestrates:

#### prism-research (`skills/prism-research/SKILL.md`)
Spawns agents in a sequential workflow (steps 1-5):
1. `prism-locator` — check existing knowledge
2. `graph-navigator` — structural orientation (if codebase-memory-mcp available)
3. `codebase-locator` — locate code
4. `codebase-analyzer` — analyze components
5. `codebase-pattern-finder` — find patterns
6. `web-search-researcher` — external research (if needed)

#### prism-debug (`skills/prism-debug/SKILL.md`)
Spawns 3 agents **in parallel** (step 2):
- `log-investigator` — analyze logs
- `state-investigator` — check application state
- `git-investigator` — analyze git history

#### prism-verify (`skills/prism-verify/SKILL.md`)
Spawns agents sequentially:
1. `browser-verifier` — execute playwright-cli commands, return JSON results
2. `visual-regression-grader` — judge visual diffs (only if baselines exist and threshold exceeded)

#### prism-plan (`skills/prism-plan/SKILL.md`)
Spawns:
- `prism-analyzer` — extract insights from existing docs

#### prism-iterate (`skills/prism-iterate/SKILL.md`)
Spawns:
- `codebase-locator` — find relevant files
- `codebase-analyzer` — understand implementation
- `codebase-pattern-finder` — find similar patterns

#### prism (`skills/prism/SKILL.md`)
Root orchestrator; spawns:
- `prism-locator` — check for existing work

#### prism-visual-docs (`skills/prism-visual-docs/SKILL.md`)
Spawns:
- `prism-locator` — locate relevant PRD

### Parallel vs Sequential Execution

**Location**: `skills/prism-research/SKILL.md:98`, `skills/prism-debug/SKILL.md:62`

**How it works**:
- Skills explicitly document whether agents should run in parallel or sequentially.
- `prism-research` rule 3: "Run agents in parallel when searching different areas"
- `prism-debug` rule 2: "Always spawn investigation agents in parallel"
- `prism-verify` runs `browser-verifier` first, then conditionally spawns `visual-regression-grader`

### Agent Tool Sandboxing

**Location**: Agent frontmatter `tools:` field in each `agents/*.md`

**How it works**:
Each agent declares which tools it has access to in its frontmatter. This limits the agent's capabilities:

| Agent | Tools |
|-------|-------|
| `codebase-locator` | Read, Glob, Grep, Bash |
| `codebase-analyzer` | Read, Glob, Grep, Bash |
| `codebase-pattern-finder` | Read, Glob, Grep, Bash |
| `prism-locator` | Read, Glob, Grep |
| `prism-analyzer` | Read, Glob, Grep |
| `web-search-researcher` | WebSearch, WebFetch, Read |
| `graph-navigator` | codebase-memory-mcp (all 11 tools) |
| `log-investigator` | Bash |
| `state-investigator` | Bash |
| `git-investigator` | Bash |
| `browser-verifier` | Bash |
| `visual-regression-grader` | Read, Glob, Grep |

### Agent Output Contracts

**Location**: Each agent's markdown body

**How it works**:
Each agent defines its own structured output format. The calling skill collects these outputs and synthesizes them:

- **codebase-locator**: Returns categorized file listings grouped by purpose (implementation, test, config, types)
- **codebase-analyzer**: Returns analysis with file:line references, data flow, and key patterns
- **codebase-pattern-finder**: Returns concrete code examples with file:line references
- **prism-locator**: Returns categorized document listings from `.prism/` with TodoWrite suggestions
- **prism-analyzer**: Returns filtered insights: key decisions, constraints, technical specs, actionable insights
- **web-search-researcher**: Returns findings with source links, organized by relevance
- **graph-navigator**: Returns structural facts: symbols, call chains, blast radius, dead code
- **log-investigator**: Returns log findings with timestamps, patterns, severity
- **state-investigator**: Returns state findings: config status, database state, environment vars, anomalies
- **git-investigator**: Returns git state: branch, uncommitted changes, recent commits, regression points
- **browser-verifier**: Returns JSON verification result with pass/fail per check and artifact paths
- **visual-regression-grader**: Returns JSON verdict (regression/intentional/inconclusive) with confidence score

### Documentarian Principle

**Location**: All agent files contain a "CRITICAL" section at the top

**How it works**:
Every agent enforces the "Documentarian, Not Critic" principle. Each agent's markdown body begins with a block like:

```
## CRITICAL: YOUR ONLY JOB IS TO DOCUMENT AND EXPLAIN THE CODEBASE AS IT EXISTS TODAY
- DO NOT suggest improvements or changes unless the user explicitly asks for them
- DO NOT perform root cause analysis unless the user explicitly asks for them
- DO NOT critique the implementation
- ONLY describe what exists...
```

This is consistent across all research and verification agents — they describe, they do not prescribe.

## Patterns Found

### Pattern 1: Skill Orchestrator Pattern

**Example at**: `skills/prism-research/SKILL.md:44-81`

Skills define a numbered workflow where each step spawns an agent:
```
### 1. Check Existing Knowledge
Task(subagent_type="prism-locator")
"Find existing research about [topic]"

### 2. Locate Code
Task(subagent_type="codebase-locator")
"Find files related to [feature]..."
```

**Also used in**:
- `skills/prism-debug/SKILL.md:62-85`
- `skills/prism-verify/SKILL.md:75-111`
- `skills/prism-iterate/SKILL.md:96-100`

### Pattern 2: Agent Table Declaration

**Example at**: `skills/prism-research/SKILL.md:22-32`

Skills declare their available agents in a markdown table:
```markdown
## Available Agents
Invoke via Task tool with subagent_type:
| Agent | Purpose |
|-------|---------|
| `codebase-locator` | Find WHERE files/components live |
```

**Also used in**:
- `skills/prism-debug/SKILL.md:173-181`
- `skills/prism-verify/SKILL.md:25-29`
- `skills/prism/SKILL.md:253-276`

### Pattern 3: Parallel Debug Agent Spawning

**Example at**: `skills/prism-debug/SKILL.md:62-85`

Three Task() invocations placed in sequence with instructions to "Launch parallel agents to investigate different areas" — the skill explicitly tells the AI to spawn all three simultaneously.

### Pattern 4: Conditional Agent Spawning

**Example at**: `skills/prism-verify/SKILL.md:86-113`

The visual-regression-grader agent is only spawned if baselines exist AND diff exceeds threshold:
```
If any diff exceeds threshold (passed: false), spawn the grader:
   Task(subagent_type="visual-regression-grader")
```

### Pattern 5: Agent Reuse Across Skills

Several agents appear in multiple skills:
- `prism-locator`: Used by prism-research, prism, prism-visual-docs
- `codebase-locator`: Used by prism-research, prism-iterate
- `codebase-analyzer`: Used by prism-research, prism-iterate
- `codebase-pattern-finder`: Used by prism-research, prism-iterate

## Architecture Notes

- **No runtime agent registration**: Agents are discovered by Claude Code at startup through the `agents/` directory. The `name` field in YAML frontmatter is the identifier.
- **Prompt-based orchestration**: Skills are themselves prompt files. They instruct the AI on which agents to spawn and in what order. There is no procedural code orchestrating agent execution.
- **Model tiering is declarative**: The `model` field in agent frontmatter determines which Claude model runs the agent. This is a cost/quality optimization — expensive Opus for deep analysis, cheap Haiku for lookups.
- **Skills do not spawn other skills directly**: Skills invoke commands (via `/command-name`) or agents (via `Task()`), but there is no skill-to-skill invocation pattern.
- **Agent isolation**: Each agent has its own tool set. Research agents get file-reading tools. Debug agents get Bash. Web agents get WebSearch/WebFetch. This prevents scope creep.
- **No shared state between agents**: Agents communicate results back to the orchestrating skill, which synthesizes findings. Agents do not call other agents or share context directly.

## Workflow Steps Followed (v2.4.8 Baseline)

1. **Step 0 (Read Mentioned Files)**: No specific files mentioned by user; skipped.
2. **Step 1 (Check Existing Knowledge)**: Simulated `prism-locator` agent. Searched `.prism/shared/research/` for agent-related research. Found 4 documents about agents but none specifically about agent spawning architecture.
3. **Step 2 (Locate Code)**: Simulated `codebase-locator` agent. Used Glob to find all `skills/*/SKILL.md` (14 files), `agents/*.md` (12 files), and `commands/*.md` (25 files).
4. **Step 3 (Analyze Components)**: Simulated `codebase-analyzer` agent. Read all 12 agent files and 7 skill files that contain `Task(subagent_type=...)` invocations. Traced the invocation pattern, frontmatter schema, tool sandboxing, model assignment, and output contracts.
5. **Step 4 (Find Patterns)**: Simulated `codebase-pattern-finder` agent. Used Grep to find all `Task(subagent_type=` occurrences across SKILL.md files. Identified 5 recurring patterns (orchestrator pattern, table declaration, parallel spawning, conditional spawning, agent reuse).
6. **Step 5 (External Research)**: Not needed — this is internal architecture.
7. **Step 6 (Save Findings)**: Saved to this file.

## Open Questions

- [ ] How does the Claude Code runtime discover and register agents from the `agents/` directory at startup?
- [ ] Is the `tools` field in agent frontmatter enforced by Claude Code (hard sandbox) or advisory (soft convention)?
- [ ] Is the `model` field in agent frontmatter enforced by Claude Code, or does it fall back to the session's default model?
- [ ] Can agents spawn sub-agents (nested Task calls), or is spawning limited to skills only?
- [ ] How does parallel execution actually work — does Claude Code run agents concurrently, or does the AI simulate parallelism by issuing multiple Task calls?

## Code References

| Reference | Description |
|-----------|-------------|
| `skills/prism-research/SKILL.md:22-32` | Agent table declaration for research skill |
| `skills/prism-research/SKILL.md:44-81` | Sequential agent spawning workflow (steps 1-5) |
| `skills/prism-debug/SKILL.md:62-85` | Parallel agent spawning (3 debug agents) |
| `skills/prism-debug/SKILL.md:173-181` | Debug agent table with model assignments |
| `skills/prism-verify/SKILL.md:25-30` | Verify agent table |
| `skills/prism-verify/SKILL.md:75-84` | browser-verifier spawning |
| `skills/prism-verify/SKILL.md:103-111` | Conditional visual-regression-grader spawning |
| `skills/prism/SKILL.md:253-276` | Complete agent catalog in root skill |
| `agents/codebase-locator.md:1-6` | Agent frontmatter example (name, tools, model) |
| `agents/codebase-analyzer.md:1-6` | Opus-tier agent frontmatter |
| `agents/graph-navigator.md:1-6` | MCP-tools agent frontmatter |
| `CLAUDE.md:17-19` | Three-layer architecture documentation |
| `CLAUDE.md:23-24` | Model assignment convention |
