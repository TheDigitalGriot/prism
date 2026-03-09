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

# Research: Agent Spawning Architecture

## Research Question

How do skills invoke agents via the Task tool in this codebase? What is the agent spawning architecture?

## Summary

Skills invoke agents using `Task(subagent_type="agent-name")` with a natural-language prompt string. Agents are defined as markdown files in `agents/*.md` with YAML frontmatter specifying name, description, allowed tools, and model tier. Skills (defined in `skills/*/SKILL.md`) act as orchestrators that spawn one or more agents, often in parallel, to perform specialized subtasks. The entire system is prompt-engineering-based with no compiled code — Claude Code's plugin infrastructure auto-discovers skills and agents from their file conventions.

## Workflow Steps Executed

### Step 0: Read Mentioned Files
No specific files mentioned by user — proceeded to agent spawning.

### Step 1: Check Existing Knowledge (simulated prism-locator)
Searched `.prism/shared/research/` for existing research on agents/Task tool. Found 26 documents referencing agents or Task. The most relevant is:
- `.prism/shared/research/2026-02-22-prism-plugin-architecture.md` — Contains section 7 "Agent Layer" with invocation patterns (lines 630-672).

### Step 2: Locate Code (simulated codebase-locator)
Found all agent and skill files:
- **11 agents** in `agents/*.md`
- **14 skills** in `skills/*/SKILL.md`
- **25 commands** in `commands/*.md`

### Step 3: Analyze Components (simulated codebase-analyzer)
Read all 11 agent files and 8 skill files that spawn agents. Traced the invocation patterns.

### Step 4: Find Patterns (simulated codebase-pattern-finder)
Identified the Task invocation pattern across all skills via grep for `Task(subagent_type`.

## Files Discovered

| File | Purpose |
|------|---------|
| `skills/prism-research/SKILL.md` | Research orchestrator — spawns 7 agents |
| `skills/prism-debug/SKILL.md` | Debug orchestrator — spawns 3 agents |
| `skills/prism-plan/SKILL.md` | Planning orchestrator — spawns 3 agents |
| `skills/prism-verify/SKILL.md` | Browser verification — spawns 1 agent |
| `skills/prism-visual-docs/SKILL.md` | Visual docs — spawns 1 agent |
| `skills/prism-iterate/SKILL.md` | Iteration — spawns 3 agents (conditionally) |
| `skills/prism/SKILL.md` | Hub skill — spawns 1 agent, routes to other skills |
| `agents/codebase-locator.md` | Find WHERE code lives (Haiku) |
| `agents/codebase-analyzer.md` | Understand HOW code works (Opus) |
| `agents/codebase-pattern-finder.md` | Find patterns to model after (Sonnet) |
| `agents/prism-locator.md` | Find docs in `.prism/` (Haiku) |
| `agents/prism-analyzer.md` | Extract insights from docs (Opus) |
| `agents/web-search-researcher.md` | External web research (Sonnet) |
| `agents/graph-navigator.md` | Knowledge graph structural analysis (Haiku) |
| `agents/browser-verifier.md` | Playwright browser checks (Haiku) |
| `agents/log-investigator.md` | Analyze log files (Haiku) |
| `agents/state-investigator.md` | Check app state/config (Haiku) |
| `agents/git-investigator.md` | Analyze git history (Haiku) |

## Component Analysis

### Agent Definition Format

**Location**: `agents/*.md`

**How it works**:
Each agent is a single markdown file with YAML frontmatter containing four fields:

```yaml
---
name: codebase-analyzer          # Identifier used in Task(subagent_type="...")
description: ...                  # When/how to use this agent
tools: Read, Glob, Grep, Bash    # Tool access granted to the agent
model: opus                      # Model tier: opus | sonnet | haiku
---
```

The body of the markdown file is the agent's system prompt — instructions for how the agent should behave, what output format to use, and constraints (particularly the "documentarian, not critic" principle for research agents).

- Frontmatter fields at: `agents/codebase-analyzer.md:1-6`
- System prompt body at: `agents/codebase-analyzer.md:8-155`

### Skill Definition Format

**Location**: `skills/*/SKILL.md`

**How it works**:
Each skill lives in its own directory and has a `SKILL.md` file with YAML frontmatter:

```yaml
---
name: prism-research
description: ...                  # Trigger phrases for auto-discovery
model: sonnet                    # Model tier for the skill itself
---
```

The skill body defines a workflow with numbered steps. Agent invocations appear as code blocks showing the `Task()` call syntax.

- Frontmatter at: `skills/prism-research/SKILL.md:1-5`
- Workflow steps at: `skills/prism-research/SKILL.md:34-88`

### Task Invocation Syntax

**How it works**:
The invocation pattern is consistent across all skills:

```
Task(subagent_type="agent-name")
"Natural language prompt describing what to do"
```

The `Task` tool is a Claude Code built-in that:
1. Looks up the agent definition by `subagent_type` name in `agents/*.md`
2. Creates a sub-conversation using the agent's specified model tier
3. Grants only the tools listed in the agent's frontmatter
4. Passes the natural-language prompt as the task description
5. Returns the agent's output to the calling skill

- Example at `skills/prism-research/SKILL.md:45-47`:
  ```
  Task(subagent_type="prism-locator")
  "Find existing research about [topic]"
  ```

- Example at `skills/prism-debug/SKILL.md:64-69`:
  ```
  Task(subagent_type="log-investigator")
  "Investigate recent logs for errors related to: [issue description]..."
  ```

### Parallel Agent Spawning

**How it works**:
Skills can spawn multiple agents simultaneously. The skill instructions indicate which agents should run in parallel versus sequentially.

**Sequential then parallel pattern** (`prism-research`):
1. First: `prism-locator` runs alone (Step 1) — checks existing knowledge
2. Then in parallel: `codebase-locator`, `codebase-analyzer`, `codebase-pattern-finder` (Steps 2-4)
3. Optionally: `web-search-researcher` (Step 5)
4. Finally: Skill synthesizes all agent outputs into research document (Step 6)

- Sequential step at: `skills/prism-research/SKILL.md:44-47`
- Parallel steps at: `skills/prism-research/SKILL.md:57-68`

**Fully parallel pattern** (`prism-debug`):
All three debug agents spawn simultaneously:
- `log-investigator`
- `state-investigator`
- `git-investigator`

- Parallel spawning at: `skills/prism-debug/SKILL.md:59-85`
- Rule enforcing parallelism at: `skills/prism-debug/SKILL.md:187`

### Model Assignment by Agent

**How it works**:
Each agent specifies its own model tier in frontmatter. This follows a convention based on task complexity:

| Model | Agents | Rationale |
|-------|--------|-----------|
| **Opus** (deepest) | `codebase-analyzer`, `prism-analyzer` | Deep analysis requiring nuanced understanding |
| **Sonnet** (balanced) | `codebase-pattern-finder`, `web-search-researcher` | General work, pattern matching, web research |
| **Haiku** (fastest) | `codebase-locator`, `prism-locator`, `graph-navigator`, `browser-verifier`, `log-investigator`, `state-investigator`, `git-investigator` | Fast lookups, file finding, investigation |

- Model assignment documented at: `.prism/shared/research/2026-02-22-prism-plugin-architecture.md:106-139`

### Tool Restrictions per Agent

**How it works**:
Each agent's `tools` frontmatter field restricts which tools the spawned sub-conversation can access:

| Agent | Tools Granted |
|-------|---------------|
| `codebase-locator` | Read, Glob, Grep, Bash |
| `codebase-analyzer` | Read, Glob, Grep, Bash |
| `codebase-pattern-finder` | Read, Glob, Grep, Bash |
| `prism-locator` | Read, Glob, Grep |
| `prism-analyzer` | Read, Glob, Grep |
| `web-search-researcher` | WebSearch, WebFetch, Read |
| `graph-navigator` | codebase-memory-mcp (all 11 tools) |
| `browser-verifier` | Bash |
| `log-investigator` | Bash |
| `state-investigator` | Bash |
| `git-investigator` | Bash |

- Tool declarations at each agent's frontmatter line 4

### Which Skills Spawn Which Agents

**Data flow — complete mapping**:

```
prism (hub skill)
  └── prism-locator

prism-research
  ├── prism-locator        (Step 1: sequential)
  ├── graph-navigator      (Step 1b: optional, if MCP available)
  ├── codebase-locator     (Step 2: parallel group)
  ├── codebase-analyzer    (Step 3: parallel group)
  ├── codebase-pattern-finder (Step 4: parallel group)
  └── web-search-researcher   (Step 5: optional)

prism-plan
  ├── prism-analyzer       (Step 1: load context)
  ├── codebase-analyzer    (ad hoc)
  └── codebase-pattern-finder (ad hoc)

prism-debug
  ├── log-investigator     (Step 2: all parallel)
  ├── state-investigator   (Step 2: all parallel)
  └── git-investigator     (Step 2: all parallel)

prism-verify
  └── browser-verifier     (Step 5)

prism-visual-docs
  └── prism-locator        (Step 1: find PRD)

prism-iterate
  ├── codebase-locator     (conditional: only if research needed)
  ├── codebase-analyzer    (conditional)
  └── codebase-pattern-finder (conditional)
```

### Skills That Do NOT Spawn Agents

The following skills operate without agent spawning:
- `prism-implement` — Executes plan steps directly, no sub-agents
- `prism-validate` — Runs verification commands directly
- `prism-spectrum` — Orchestrates `spectrum.sh` shell script
- `prism-prd` — Invokes `/generate_prd` command instead
- `prism-docs-update` — Direct documentation updates
- `prism-eval` — Evaluation framework
- `prism-release` — Release management

### Agent Output Consumption

**How it works**:
After agents complete, the calling skill synthesizes their outputs:

1. **Research synthesis**: All agent findings are combined into a single research document saved to `.prism/shared/research/YYYY-MM-DD-topic.md` (template at `skills/prism-research/references/research-template.md`)

2. **Debug synthesis**: Agent findings are combined into a structured debug report with sections for log findings, state findings, and git findings (`skills/prism-debug/SKILL.md:110-146`)

3. **Plan context loading**: The `prism-analyzer` agent's output feeds into the skill's understanding before presenting the plan to the user (`skills/prism-plan/SKILL.md:37-40`)

4. **Verification results**: The `browser-verifier` returns JSON that the skill writes to `.prism/local/verifications/` (`skills/prism-verify/SKILL.md:83-89`)

## Patterns Found

### Pattern 1: Agent Frontmatter Convention

**Example at**: `agents/codebase-locator.md:1-6`

```yaml
---
name: codebase-locator
description: Locates files... Use Task tool with subagent_type="codebase-locator"...
tools: Read, Glob, Grep, Bash
model: haiku
---
```

**Also used in**: All 11 agent files follow this exact 4-field frontmatter pattern.

### Pattern 2: "Documentarian, Not Critic" Constraint Block

**Example at**: `agents/codebase-analyzer.md:10-17`

```markdown
## CRITICAL: YOUR ONLY JOB IS TO DOCUMENT AND EXPLAIN THE CODEBASE AS IT EXISTS TODAY
- DO NOT suggest improvements or changes unless the user explicitly asks
- DO NOT perform root cause analysis unless the user explicitly asks
...
```

**Also used in**:
- `agents/codebase-locator.md:10-16`
- `agents/codebase-pattern-finder.md:10-17`
- `agents/graph-navigator.md:10-13`
- `skills/prism-research/SKILL.md:11-18`

### Pattern 3: Graph-First Strategy Block

**Example at**: `agents/codebase-analyzer.md:62-71`

```markdown
## Graph-First Strategy
When codebase-memory-mcp is available (check via list_projects), prefer
graph tools for understanding code structure:
1. Run get_graph_schema() FIRST for orientation
...
```

**Also used in**:
- `agents/codebase-locator.md:64-73`
- `agents/codebase-pattern-finder.md:172-178`

### Pattern 4: Skill Workflow Numbering

All skills follow a numbered workflow pattern (### 1., ### 2., etc.) where agent spawning appears as code blocks within specific steps. This consistent structure makes it clear when agents run sequentially vs. in parallel.

## Historical Context

From `.prism/` directory:

- `.prism/shared/research/2026-02-22-prism-plugin-architecture.md` — Comprehensive architecture document covering the three-layer system (Skills -> Commands -> Agents), agent invocation patterns (section 7.2, lines 635-672), and model assignment matrix (lines 106-139).

## Architecture Notes

- **Convention**: Agent names use `<domain>-<role>` format (e.g., `codebase-locator`, `log-investigator`)
- **Convention**: Skill names use `prism-<phase>` format (e.g., `prism-research`, `prism-debug`)
- **Pattern**: All agent markdown files include the description text "Use Task tool with subagent_type=..." to document how they are invoked
- **Pattern**: Skills that need conditional research (like `prism-iterate`) explicitly note it is optional ("Only spawn research tasks if changes require new technical understanding")
- **Decision**: Three model tiers (Opus/Sonnet/Haiku) are assigned by task complexity, not by skill vs. agent distinction
- **Design**: Agents are purely prompt-based — no compiled code, no runtime configuration, no dependency injection. The entire system is markdown prompt engineering auto-discovered by Claude Code's plugin infrastructure.

## Open Questions

- [ ] How does Claude Code's plugin infrastructure actually discover and register `agents/*.md` files at runtime?
- [ ] Is there a mechanism to pass structured data (not just strings) between skills and agents via the Task tool?
- [ ] When multiple agents are spawned "in parallel," does Claude Code actually execute them concurrently or sequentially?
- [ ] What happens if an agent's specified model tier is unavailable — does it fall back to another model?

## Code References

Quick navigation:

| Reference | Description |
|-----------|-------------|
| `agents/codebase-analyzer.md:1-6` | Agent frontmatter example |
| `agents/codebase-locator.md:1-6` | Agent frontmatter with Haiku model |
| `agents/graph-navigator.md:1-6` | Agent with MCP tools |
| `agents/browser-verifier.md:1-6` | Agent with Bash-only tools |
| `skills/prism-research/SKILL.md:20-33` | Available agents table |
| `skills/prism-research/SKILL.md:44-88` | Full workflow with Task invocations |
| `skills/prism-debug/SKILL.md:59-85` | Parallel debug agent spawning |
| `skills/prism-plan/SKILL.md:26-31` | Plan skill's available agents |
| `skills/prism-plan/SKILL.md:37-40` | Context loading via prism-analyzer |
| `skills/prism-verify/SKILL.md:29` | Browser-verifier invocation |
| `skills/prism-iterate/SKILL.md:97-101` | Conditional agent spawning |
| `skills/prism/SKILL.md:52-55` | Hub skill's prism-locator usage |
| `.prism/shared/research/2026-02-22-prism-plugin-architecture.md:84-103` | Agent layer diagram |
| `.prism/shared/research/2026-02-22-prism-plugin-architecture.md:635-672` | Agent invocation patterns |
