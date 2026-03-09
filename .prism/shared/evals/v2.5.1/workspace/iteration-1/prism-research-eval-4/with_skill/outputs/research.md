---
date: 2026-03-08
researcher: Claude
git_commit: 9d421a43c7248fcb633a39b45501e4804897406c
branch: main
repository: prism-plugin
topic: "Skill Discovery and Routing System — How the Prism Meta-Skill Routes to Phase-Specific Skills"
tags: [research, skills, routing, discovery, meta-skill, architecture]
status: complete
---

# Research: Skill Discovery and Routing System

## Research Question

Map out the skill discovery and routing system in this plugin. How does the prism meta-skill route to phase-specific skills?

## Summary

Prism uses a convention-based skill discovery system built on Claude Code's native plugin architecture. Each skill is a `SKILL.md` file inside `skills/<name>/` with YAML frontmatter containing `name`, `description`, and `model` fields. Claude Code auto-discovers all `SKILL.md` files in the `skills/` directory at startup. The `prism` meta-skill (`skills/prism/SKILL.md`) acts as an orchestrator that routes to 13 phase-specific skills via slash-command references (e.g., `/prism-research`) and a state-based decision tree that checks `.prism/` directory artifacts to determine which phase to enter. There is no programmatic router or registry — routing is entirely prompt-engineered through markdown instructions and Claude's natural language understanding of the `description` field triggers.

## Files Discovered

| File | Purpose |
|------|---------|
| `skills/prism/SKILL.md` | Meta-skill orchestrator — routes to all phase skills |
| `skills/prism-research/SKILL.md` | Research phase skill |
| `skills/prism-plan/SKILL.md` | Planning phase skill |
| `skills/prism-implement/SKILL.md` | Implementation phase skill |
| `skills/prism-validate/SKILL.md` | Validation phase skill |
| `skills/prism-iterate/SKILL.md` | Iteration phase skill |
| `skills/prism-verify/SKILL.md` | Browser verification phase skill |
| `skills/prism-spectrum/SKILL.md` | Autonomous story execution skill |
| `skills/prism-debug/SKILL.md` | Debug investigation skill |
| `skills/prism-prd/SKILL.md` | PRD generation skill |
| `skills/prism-visual-docs/SKILL.md` | Visual documentation skill |
| `skills/prism-docs-update/SKILL.md` | VitePress docs sync skill |
| `skills/prism-eval/SKILL.md` | Skill evaluation/benchmarking skill |
| `skills/prism-release/SKILL.md` | Release pipeline skill |
| `commands/research_codebase.md` | Command-level research entry point |
| `commands/create_plan.md` | Command-level planning entry point |
| `commands/implement_plan.md` | Command-level implementation entry point |
| `commands/validate_plan.md` | Command-level validation entry point |
| `commands/decompose_plan.md` | Command to convert plans to stories |
| `agents/prism-locator.md` | Agent that discovers existing `.prism/` artifacts |
| `scripts/spectrum.sh` | Bash orchestrator that spawns Claude sessions with `/prism-spectrum` |

## Component Analysis

### 1. Skill Discovery Mechanism

**Location**: `skills/*/SKILL.md` (14 skill files total)

**How it works**:
- Claude Code's plugin system auto-discovers all files matching the `skills/*/SKILL.md` convention at startup
- Each SKILL.md has YAML frontmatter with three fields:
  - `name`: The slash-command name (e.g., `prism-research` becomes `/prism-research`)
  - `description`: Natural language description including trigger phrases (e.g., "Triggers on 'research this', 'understand how X works'")
  - `model`: Which Claude model to use (`opus`, `sonnet`, or `haiku`)
- There is NO central registry, manifest file, or programmatic skill loader
- Discovery is purely convention-based: any directory under `skills/` containing a `SKILL.md` file becomes an available skill

**Trigger matching**:
- Claude Code matches user input against the `description` field using semantic understanding
- Each skill's description includes explicit trigger phrases after "Triggers on" (e.g., `"Triggers on 'create a plan', 'plan the implementation'"`)
- Users can also invoke skills directly via slash commands: `/prism-research`, `/prism-plan`, etc.
- The Skill tool in Claude Code's runtime loads the SKILL.md content when a match is found

### 2. The Prism Meta-Skill (Router)

**Location**: `skills/prism/SKILL.md`

**How it works**:
- The `prism` skill has the broadest trigger description: "Triggers on 'help me build', 'implement this feature', 'fix this bug', 'prism', 'structured workflow', or complex multi-step tasks"
- It acts as a decision-tree router, NOT a programmatic dispatcher
- Routing is done through markdown instructions that tell Claude which phase to enter

**Routing decision tree** (from `skills/prism/SKILL.md:46-61`):

```
Step 1: Spawn prism-locator agent to check .prism/ for existing artifacts

Step 2: Based on findings, route to appropriate phase:
  - Nothing exists         -> /prism-research  (start fresh)
  - Research exists         -> /prism-plan      (skip to planning)
  - Plan exists (incomplete)-> /prism-implement  (resume implementation)
  - Implementation done     -> /prism-validate   (verify the work)
```

**Workflow selection table** (from `skills/prism/SKILL.md:39-44`):

| Scenario | Phases Selected |
|----------|----------------|
| New feature, unfamiliar codebase | Full R->P->I->V |
| Feature in known codebase | P->I->V (skip Research) |
| Simple change, clear scope | I->V (skip Research + Plan) |
| Trivial fix (<20 lines) | Direct implementation (no phases) |

**Key insight**: The meta-skill references phase skills by their slash-command names (e.g., `/prism-research`), which Claude interprets as "invoke that skill." The actual invocation happens through Claude Code's Skill tool at runtime.

### 3. Phase-Specific Skills and Their Connections

**Location**: `skills/prism-*/SKILL.md`

**Core workflow chain**:
```
/prism-research  ->  /prism-plan  ->  /prism-implement  ->  /prism-validate
                                            |
                                      /prism-verify (optional, between Implement and Validate)
                                            |
                                      /prism-iterate (if plan needs changes)
```

**Document generation chain** (parallel path):
```
/prism-prd  ->  /prism-visual-docs  ->  /prism-plan
```

**Autonomous execution chain**:
```
/prism-plan  ->  /decompose_plan (command)  ->  spectrum.sh  ->  /prism-spectrum (per story)
                                                                       |
                                                                 /prism-debug (on failure)
```

**How phases connect to each other**:
- Each phase skill reads from and writes to the `.prism/shared/` directory
- Research writes to `.prism/shared/research/` which Plan reads
- Plan writes to `.prism/shared/plans/` which Implement reads
- Implement modifies code, Validate reads the plan and compares against git state
- There is no explicit "next phase" pointer — transitions are prompt-instructed and artifact-driven

### 4. Three-Layer Architecture (Skills -> Commands -> Agents)

**How it works**:
```
Skills (Orchestrators)  ->  Commands (Operations)  ->  Agents (Specialists)
```

- **Skills** invoke commands via slash-command references in their markdown
  - Example: `prism-prd` invokes `/generate_prd` command
  - Example: `prism-visual-docs` invokes `/generate_user_flows` and `/generate_tech_spec`
- **Skills** spawn agents via `Task(subagent_type="agent-name")`
  - Example: `prism-research` spawns `codebase-locator`, `codebase-analyzer`, `prism-locator`, etc.
  - Example: `prism-debug` spawns `log-investigator`, `state-investigator`, `git-investigator`
- **Commands** are user-invocable via `/command-name` and are single-purpose
- **Agents** run in isolated Task contexts with restricted tool access (defined by `tools:` frontmatter)

### 5. Model Assignment Strategy

**Location**: Across all SKILL.md frontmatter `model:` fields

| Model | Assigned To | Reasoning |
|-------|------------|-----------|
| `opus` | prism-plan, prism-iterate, prism-prd, prism-visual-docs, research_codebase (command), create_plan (command), decompose_plan (command) | Deep analysis tasks |
| `sonnet` | prism (meta-skill), prism-research, prism-implement, prism-validate, prism-spectrum, prism-debug, prism-eval, prism-verify | General implementation work |
| `haiku` | prism-locator (agent), codebase-locator (agent) | Fast lookups |

### 6. Spectrum External Routing

**Location**: `scripts/spectrum.sh:307-316`

**How it works**:
- `spectrum.sh` is a Bash script that runs outside of Claude Code
- For each story, it constructs a prompt: `"Execute story $story_id from $STORIES_FILE using the /prism-spectrum workflow. Progress file: $PROGRESS_FILE."`
- It spawns a fresh Claude Code session via `claude --dangerously-skip-permissions --print "$prompt"`
- This is the only place where skill routing happens outside of Claude's natural language processing — the script explicitly names `/prism-spectrum` in the prompt
- On quality gate failures, `/prism-debug` is invoked within the same session by the `prism-spectrum` skill's instructions

### 7. Agent Discovery and Invocation

**Location**: `agents/*.md` (11 agent files)

**How it works**:
- Agents are markdown files in `agents/` with YAML frontmatter (`name`, `description`, `tools`, `model`)
- Skills reference agents by name using `Task(subagent_type="agent-name")` syntax
- Each agent has a restricted `tools:` list (e.g., prism-locator only gets `Read, Glob, Grep`)
- There is no central agent registry — skills hardcode agent names in their markdown

## Patterns Found

### Pattern: Trigger Phrase Convention

**Example at**: `skills/prism-research/SKILL.md:3`

All skills use a consistent description pattern:
```
description: [Purpose sentence]. Use when [use case]. Triggers on "[phrase1]", "[phrase2]", "[phrase3]"...
```

**Also used in**:
- `skills/prism-plan/SKILL.md:3`
- `skills/prism-implement/SKILL.md:3`
- `skills/prism-validate/SKILL.md:3`
- `skills/prism-debug/SKILL.md:3`
- All 14 skill files follow this pattern

### Pattern: Artifact-Based State Machine

**Example at**: `skills/prism/SKILL.md:50-61`

Phase transitions are determined by checking for artifacts in `.prism/`:
```
Nothing in .prism/shared/research/  -> Research
Files in research/ but not plans/   -> Plan
Files in plans/ with unchecked boxes -> Implement
All boxes checked                    -> Validate
```

**Also used in**:
- `skills/prism-iterate/SKILL.md:28-30` (checks for existing plans)
- `skills/prism-implement/SKILL.md:13-15` (requires approved plan)
- `skills/prism-validate/SKILL.md:13-14` (requires plan + implementation)

### Pattern: Parallel Agent Spawning

**Example at**: `skills/prism-research/SKILL.md:22-33`

Skills spawn multiple agents in parallel for efficiency:
```
Task(subagent_type="prism-locator")     # Check existing docs
Task(subagent_type="codebase-locator")  # Find code
Task(subagent_type="codebase-analyzer") # Analyze code
```

**Also used in**:
- `skills/prism-debug/SKILL.md` (spawns log/state/git investigators in parallel)

### Pattern: Command Delegation from Skills

**Example at**: `skills/prism-prd/SKILL.md:27-30`

Skills invoke commands as building blocks:
```
Skill: prism-prd       -> invokes command: /generate_prd
Skill: prism-visual-docs -> invokes commands: /generate_user_flows, /generate_tech_spec
Skill: prism-spectrum   -> uses plans from: /decompose_plan
```

## Architecture Notes

- **No build step**: The entire skill/command/agent system is pure markdown. Claude Code's runtime reads and interprets these files natively.
- **Convention over configuration**: File placement (`skills/*/SKILL.md`, `commands/*.md`, `agents/*.md`) is the only "configuration." There is no manifest, registry, or routing table.
- **Prompt-engineered routing**: The meta-skill's routing logic exists as natural language instructions in markdown, not as code. Claude interprets the decision tree based on the prompt content.
- **Artifact-driven state**: Phase transitions rely on filesystem state (`.prism/shared/` directory contents), not in-memory state or database records.
- **Slash-command convention**: Skill names map directly to slash commands. `name: prism-research` becomes `/prism-research`. This mapping is handled by Claude Code's plugin runtime.
- **Dual entry points**: Most phases have both a skill and a command. The skill is the orchestrator (with agent spawning and workflow logic), the command is the direct operation (for users who want to skip orchestration).

## Historical Context

From `.prism/` directory:

- `.prism/shared/research/2026-02-22-prism-plugin-architecture.md` — Comprehensive architecture analysis (v2.1.8) covering all components, counts, and relationships

## Workflow Steps Followed

1. **Read SKILL.md** (`skills/prism-research/SKILL.md`) — understood the research workflow
2. **Read research template** (`skills/prism-research/references/research-template.md`) — understood output format
3. **Step 1 (Check Existing Knowledge)**: Simulated `prism-locator` agent — found existing research at `.prism/shared/research/2026-02-22-prism-plugin-architecture.md`
4. **Step 2 (Locate Code)**: Simulated `codebase-locator` agent — globbed `skills/*/SKILL.md` (14 files), `commands/*.md` (25 files), `agents/*.md` (11 files)
5. **Step 3 (Analyze Components)**: Simulated `codebase-analyzer` agent — read the meta-skill `skills/prism/SKILL.md` fully, read all 14 skill frontmatters, read 4 command files, read `prism-locator` agent, read `spectrum.sh` routing logic
6. **Step 4 (Find Patterns)**: Simulated `codebase-pattern-finder` agent — identified trigger phrase convention, artifact-based state machine, parallel agent spawning, command delegation patterns
7. **Step 5 (External Research)**: Not needed — this is an internal architecture question
8. **Step 6 (Save Findings)**: Saved to this file

## Open Questions

- [ ] How does Claude Code's runtime prioritize when multiple skill descriptions match a user query? (e.g., "help me build" matches both `prism` and `prism-implement`)
- [ ] Is there a precedence order among skills, or does Claude Code present a disambiguation choice?
- [ ] How does the Skill tool handle the transition when one skill references another via slash-command (e.g., does the first skill's context persist)?

## Code References

| Reference | Description |
|-----------|-------------|
| `skills/prism/SKILL.md:1-3` | Meta-skill frontmatter with broadest trigger description |
| `skills/prism/SKILL.md:39-44` | Workflow selection decision table |
| `skills/prism/SKILL.md:50-61` | State-based routing logic (artifact check) |
| `skills/prism/SKILL.md:86-96` | Phase details with slash-command references |
| `skills/prism-research/SKILL.md:3` | Example trigger phrase pattern |
| `skills/prism-research/SKILL.md:22-33` | Agent spawning table |
| `scripts/spectrum.sh:307` | External routing — spectrum constructs `/prism-spectrum` prompt |
| `scripts/spectrum.sh:314` | Claude CLI invocation with `--print` flag |
| `agents/prism-locator.md:1-6` | Agent frontmatter with restricted tools |
