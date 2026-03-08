# Agent Teams Research — Reddit GitHub Catalogue & Prism Implications

**Date:** 2026-03-07  
**Sources:** 5 Reddit threads (r/ClaudeCode, r/ClaudeAI), synthesized  
**Prism Version:** v2.5.0

---

## Thread Overview

| Thread | Sub | Core Finding |
|--------|-----|-------------|
| "Convince me that agent teams are not pointless" | r/ClaudeCode | Critique of team overhead vs. subagents. No GitHub repos surfaced. The strongest argument *for* teams came from a long comment describing multi-tier orchestration (director → managers → workers), not from the post itself. |
| "Claude Agent Teams hype — isn't this just multiagent?" | r/ClaudeCode | No concrete repos linked. Accessible content pointed at related-post tiles, not thread-body recommendations. |
| "How are you combining Agent Skills + SubAgents?" | r/ClaudeAI | **Most productive thread for repos.** Practitioners sharing real skill + subagent composition patterns. |
| "I reverse engineered how Agent Teams works under the hood" | r/ClaudeCode | Technical deep-dive into the teams protocol internals. Yielded the most strategically important repos. |
| "Agent teams are strikingly effective at creating prompts" | r/ClaudeCode | Success stories. One directly applicable skill repo. |

**Key takeaway from the threads as a whole:** The community does *not* make a strong case that agent teams are universally better than subagents. They do surface specific patterns — dynamic orchestration policy, script-backed deterministic skills, portable MCP-based team transport, and human-in-the-loop intervention — that fit Prism's existing architecture naturally.

---

## GitHub Catalogue (Repos Actually Linked in Threads)

### 1. `solatis/claude-config`

**Found in:** "How are you combining Agent Skills + SubAgents?"  
**Link:** [github.com/solatis/claude-config](https://github.com/solatis/claude-config)

**What it solves:** Cited as a reliable pattern for having a subagent invoke a specific script with specific arguments from a parent skill. The linked file is a substantial `incoherence.py` workflow script inside a skills directory — a script-backed skill pattern rather than pure prose-only prompting.

**Prism relevance:** Prism currently emphasizes markdown prompt engineering with no runtime hooks or MCP servers. This repo suggests a pragmatic upgrade path for cases where a Prism skill should delegate to deterministic local scripts for repeatable workflows, especially around validation, orchestration guards, or structured reconciliation. Fits especially well with `prism-validate`, `prism-eval`, and `prism-spectrum`, where scripted guardrails could reduce prompt drift.

**Priority:** Near-term. Low integration cost for high reliability gains in deterministic workflow steps.

---

### 2. `cipherstash/cipherpowers`

**Found in:** "How are you combining Agent Skills + SubAgents?"  
**Link:** [github.com/cipherstash/cipherpowers](https://github.com/cipherstash/cipherpowers)

**What it solves:** Production-used setup with specialized subagents reinforcing required skills. The key architectural clue is its explicit 3-layer split: commands as thin dispatch, agents as execution enforcement, and skills as reusable workflow knowledge.

**Prism relevance:** This is the closest philosophical match to Prism in the wild. Same layered separation — skills orchestrate, commands do one thing well, agents are parallel specialists. Less a "feature import" and more a strong external validation of Prism's architecture. The actionable takeaway: keep commands thin and push more reusable logic into shared skill references, rather than duplicating orchestration logic across commands and agents.

**Priority:** Near-term. Architectural validation + reference for keeping commands lean as Prism grows.

---

### 3. `cs50victor/claude-code-teams-mcp`

**Found in:** "I reverse engineered how Agent Teams works under the hood"  
**Link:** [github.com/cs50victor/claude-code-teams-mcp](https://github.com/cs50victor/claude-code-teams-mcp)  
**Stack:** Python 3.12+, MCP server via `uvx`, requires tmux + Claude Code CLI on PATH  
**Size:** 13 commits, 1 star, MIT

**What it solves:** A Python MCP server that reimplements Claude Code's internal agent teams protocol as 13 standalone MCP tools. Built from a gist where the author reverse-engineered Claude Code's internals. Installs with a single line in `.mcp.json` and works with Claude Code, OpenCode, or any MCP-speaking client.

**The 13 tools:**

| Tool | What it does |
|------|-------------|
| `team_create` | Creates team directory + config. One team per server session. |
| `team_delete` | Deletes team and all data. Fails if teammates still active. |
| `spawn_teammate` | Launches Claude Code in a tmux split pane with unique agent ID (`name@team`) and color. |
| `send_message` | Direct messages, broadcasts, shutdown/plan approval responses. |
| `read_inbox` / `poll_inbox` | Read agent inboxes. Poll supports long-polling up to 30s. |
| `read_config` | Read team config and member list. |
| `task_create` / `task_update` / `task_list` / `task_get` | Full task CRUD: auto-incrementing IDs, status tracking, ownership, dependency management (`blocks`/`blockedBy`). |
| `force_kill_teammate` | Forcibly kills a tmux pane and cleans up. |
| `process_shutdown_approved` | Graceful teammate removal after shutdown approval. |

**Concurrency approach:** Atomic writes via `tempfile` + `os.replace` for config. `fcntl` file locks for inbox operations. Includes `stress_test_lifecycle.py`.

**Storage layout mirrors Claude Code's native layout:**

```
~/.claude/teams/<team-name>/config.json
~/.claude/teams/<team-name>/inboxes/<agent>.json
~/.claude/tasks/<team-name>/<id>.json
```

**Prism relevance:** **Most strategically important repo for Prism**, for two distinct reasons:

*As a protocol reference:* The 13-tool taxonomy is a clean decomposition of what "team orchestration" actually means at the primitive level. If Prism ever needs to formalize what a "Prism Teams Protocol" looks like, this repo provides the concrete vocabulary: create/delete teams, spawn/kill members, message/poll inboxes, CRUD tasks with dependencies. That's the full surface area.

*As an actual adoption path:* Since Prism v2.5.0 already has `graph-navigator` depending on `codebase-memory-mcp`, adding a second MCP server isn't a philosophical shift — it's just another `.mcp.json` entry. You could experiment with this server *today* alongside the Prism plugin without changing any existing markdown prompt engineering. The interesting design question is whether Prism would use this as-is for team coordination, or fork/rewrite it to use `.prism/` artifacts instead of `~/.claude/teams/` — so that team state is project-scoped and inspectable alongside research docs, plans, and stories.

**Known limitation:** Requires tmux for teammate spawning. The tmux dependency means it won't work inside the Prism TUI directly (Bubble Tea owns the terminal), so for CLI dashboard integration you'd need the "session layout adapter" pattern from the `wezcld` entry (#4). This is a real constraint, not a theoretical one.

**Priority:** v3 platform evolution. Defines the portability story for Prism orchestration across all four platform shells.

---

### 4. `afewyards/wezcld`

**Found in:** Comments on the reverse-engineering thread  
**Link:** [github.com/afewyards/wezcld](https://github.com/afewyards/wezcld)

**What it solves:** A WezTerm shim for Claude Code agent teams — translates iTerm2-style pane commands into WezTerm CLI operations so team panes can run in WezTerm rather than iTerm2.

**Prism relevance:** Prism already ships a terminal-first CLI/TUI experience and multiple platform shells. For Prism CLI specifically, this is a portability pattern: terminal multiplexer abstractions should be adapter-based, not hardwired to one pane manager. The design idea is valuable for a future Prism "session layout adapter" that could target tmux, WezTerm, or internal pane orchestration in the CLI dashboard.

**Priority:** v3 platform evolution. Lower urgency but architecturally sound — prevents terminal lock-in as Prism CLI gains multi-pane capabilities.

---

### 5. `iloom-ai/iloom-cli` — Issue #492

**Found in:** Comments on the reverse-engineering thread  
**Link:** [github.com/iloom-ai/iloom-cli/issues/492](https://github.com/iloom-ai/iloom-cli/issues/492)

**What it solves:** Explores support for Claude's tasks system in a way that allows user feedback into a running session from outside — external injection of guidance into an in-progress agent.

**Prism relevance:** Lines up directly with the part of Prism that would benefit most from live external intervention: `prism-spectrum` and long-running autonomous execution. Prism already uses a signal protocol (`<promise>`, `<spectrum-continue>`, `<spectrum-retry>`, etc.) and persistent `.prism/` artifacts to keep fresh context per iteration. The next step would be a "human interrupt / inject feedback" channel into running stories, rather than waiting for the next full iteration boundary.

**Priority:** Medium-term. Directly strengthens Spectrum's autonomous execution model with human-in-the-loop capability.

---

### 6. `ZoranSpirkovski/creating-agent-teams`

**Found in:** "Agent teams are strikingly effective at creating prompts"  
**Link:** [github.com/ZoranSpirkovski/creating-agent-teams](https://github.com/ZoranSpirkovski/creating-agent-teams)  
**Stack:** Pure markdown Claude Code plugin (`.claude-plugin/plugin.json` + `skills/` directory)  
**Size:** 3 commits, 22 stars, 4 forks, MIT

**What it solves:** A Claude Code plugin with a single skill focused on the *decision* of when and how to create agent teams. It's not an execution framework — it's a routing/decision skill with supporting reference material.

**Plugin structure:**

```
.claude-plugin/plugin.json              # Plugin metadata
skills/creating-agent-teams/
  ├── SKILL.md                          # Core decision framework
  ├── research.md                       # Model comparisons, patterns reference
  └── agent-prompt-template.md          # Templates for spawning agents
```

**Agent roster it defines:**

| Agent | Model | Type | Role |
|-------|-------|------|------|
| Orchestrator | Opus | general-purpose | Coordinates, never implements |
| Explorer | Haiku | Explore | Finds files, patterns, conventions |
| Frontend | Sonnet | general-purpose | React/UI implementation |
| Backend | Sonnet | general-purpose | Server-side logic |
| API | Sonnet | general-purpose | Endpoints, contracts |
| Reviewer | Sonnet | code-reviewer | Quality gate |

**Two communication modes:**

- **Hub-and-Spoke** (default): all communication flows through the Orchestrator
- **Discussion Mode**: agents debate peer-to-peer for investigation/architecture decisions

**The decision framework** (the core value) helps determine: is this a single-agent task, a parallel-subagent task, or a full-team task? What model tier for each role? What agent type? How to compose the team with proper communication patterns? And what common mistakes to avoid (token waste, scope creep, coordination overhead).

**Install:** Plugin marketplace (`/plugin marketplace add ZoranSpirkovski/creating-agent-teams`), clone to plugins dir, or legacy clone to skills dir.

**Prism relevance:** This is even more directly applicable than the original write-up suggested, because it is **structurally identical** to what Prism would need to build:

| This plugin | Prism equivalent |
|------------|-----------------|
| `.claude-plugin/plugin.json` | Prism's own `plugin.json` |
| `SKILL.md` as the decision framework | Prism's `prism` master skill (275 lines) |
| `research.md` as a reference doc | Prism's `references/` pattern in skill subdirectories |
| `agent-prompt-template.md` | Prism's agent frontmatter format |
| Opus orchestrator / Haiku explorer / Sonnet workers | Prism's three-tier model convention |
| Hub-and-Spoke vs Discussion Mode | *(Prism doesn't have this yet)* |

The part Prism doesn't have is the **routing decision logic** — the heuristic that looks at a task and decides "single agent" vs "parallel subagents" vs "full team." Prism's `prism` master skill currently routes by *workflow phase* (research → plan → implement → validate), not by *task complexity*. Adding a complexity-based routing layer on top of the phase routing would be the integration path.

The communication mode distinction (hub-and-spoke vs discussion) is also new for Prism and maps to the "domain team contracts" idea from the multi-tier orchestration model section of this doc. Hub-and-spoke = Prism's current model where the skill orchestrates everything through commands and agents. Discussion mode = the missing peer-to-peer layer for when domain leads need to negotiate interfaces.

**Concrete borrowing opportunity:** The `agent-prompt-template.md` file is worth reading directly. If it contains well-structured spawn templates, those could inform how Prism formalizes its agent frontmatter to include team context (team name, communication mode, peer agents) alongside the existing model/tools/role fields.

**Priority:** Near-term. Highest immediate applicability — adds a routing heuristic to Prism's existing orchestrator model.

---

### 7. `shim52/claude-code-agent-teams-join`

**Found in:** Comments on one of the agent teams threads  
**Link:** [github.com/shim52/claude-code-agent-teams-join](https://github.com/shim52/claude-code-agent-teams-join)

**What it solves:** When a Claude Code session ends — terminal closed, crash, timeout, rate limit — any agent teams it created become orphaned. The team files persist on disk at `~/.claude/teams/`, but no session can lead them anymore. You lose your team setup, prompts, and member configs. This repo is a small TypeScript npm package (`npx claude-team-join --install`) that drops three skills into `~/.claude/skills/`:

- **`team-join`** — Rejoins an orphaned team by making the current session the new lead.
- **`team-list`** — Shows all teams, their members, and whether the lead session is alive or stale.
- **`team-members`** — Returns the full config (name, role, prompt, model) for each teammate so they can be re-spawned identically.

Once installed, you say "rejoin the my-project team" in natural language and Claude Code matches the skill automatically.

**Prism relevance:** Directly relevant to Spectrum's biggest operational pain point. When `spectrum.sh` spawns fresh Claude Code sessions per story and one crashes or hits a rate limit, any team state from that session is lost. If Prism evolves toward agent teams for Spectrum execution (the "hierarchical domain teams" direction from the research), **session recovery becomes a first-class concern** — not a nice-to-have.

The three primitives it implements map to things Prism could use:

- **`team-list`** (discover what exists) → a Prism command that inspects `~/.claude/teams/` to show active/orphaned Spectrum sessions
- **`team-join`** (take over leadership) → resumable Spectrum execution after a crash
- **`team-members`** (reconstruct the original team config) → replay the exact agent roster from a story's metadata

This is the missing "session resilience" piece that none of the other 6 repos address.

**Priority:** Medium-term, but becomes near-term the moment Prism adopts agent teams for Spectrum. Essential for production reliability of long-running autonomous execution.

---

## Practical Ranking for Prism

### Most helpful right now (v2.5.x → v2.6.0)

| Repo | What to borrow |
|------|---------------|
| `creating-agent-teams` | Dynamic routing heuristic: single-shot → subagents → full team. Add to the top-level `prism` skill. |
| `cipherpowers` | Validation that Prism's 3-layer architecture is production-sound. Keep commands thin, push reusable logic into skill references. |
| `solatis/claude-config` | Script-backed skills for deterministic steps. Target `prism-validate`, `prism-eval`, and `prism-spectrum` guardrails. |

### Most helpful for Prism v3 platform evolution

| Repo / Issue | What it enables |
|-------------|----------------|
| `claude-code-teams-mcp` | Portable orchestration layer via MCP. Unifies Claude plugin, CLI, VS Code, and Electron behind one team transport. |
| `claude-code-agent-teams-join` | Session resilience for agent teams — discover orphaned teams, rejoin as lead, re-spawn teammates from persisted config. Essential for crash recovery during long Spectrum runs. |
| `iloom-cli` #492 | Human-in-the-loop injection into running Spectrum executions. |
| `wezcld` | Adapter-based terminal multiplexer abstraction for Prism CLI multi-pane. |

---

## The Multi-Tier Orchestration Model (from the "convince me" thread)

The most architecturally significant finding was not a repo but a detailed comment describing a multi-tier orchestration model. This is more relevant to Prism than most of the GitHub links because it describes the missing organizational pattern Prism may want next.

### The model

```
Director (abstract strategic intent only — never holds codebase)
  └── Domain Managers (coordinate subdomains, exchange contracts)
        └── Worker Agents (implementation, research, verification)
              └── Commands (deterministic operations)
```

With cross-layer communication via structured artifacts: interfaces, data contracts, migration assumptions, expected behaviors, test obligations, risks/blockers.

### How it maps to Prism's existing layers

| Current Prism Layer | Multi-Tier Equivalent | Gap |
|--------------------|-----------------------|-----|
| `prism` master skill | Director | Already a router, not a synthesizer. Minimal gap. |
| *(not yet explicit)* | Domain team leads | **Missing layer.** Currently skills route directly to agents. |
| Specialist agents | Worker agents | Already in place (11 agents, parallel spawning). |
| Commands | Deterministic operations | Already in place (25 commands). |

### What Prism would need to add

**A. Team-lead agents as a fourth conceptual layer.** Let `prism-implement` or `prism-spectrum` decompose large initiatives into domain programs rather than just task fragments. Both are already phase-oriented, making them natural homes for this evolution.

**B. Mission/execution context separation.** The top-level `prism` or `prism-plan` owns mission, constraints, and success criteria. Team leads own domain decomposition. Worker agents own local code and execution detail. This reduces context pollution and aligns with the existing rule that skills orchestrate rather than directly doing work.

**C. Structured cross-team contracts under `.prism/shared/`.** Instead of raw inter-agent messaging, Prism could use inspectable, replayable, eventually-visualizable artifacts:

```
.prism/shared/contracts/
├── interfaces.json       # API shapes between domains
├── dependencies.json     # Cross-domain dependency graph
├── risks.json            # Blockers and assumptions
└── test-obligations.json # What each domain must verify
```

This fits Prism's existing artifact-driven philosophy. The `.prism/` directory is already the persistent knowledge layer — contracts would be a natural extension.

**D. Evals as the sanity-check layer.** The commenter describes external codex sessions reviewing plans. Prism already has the stronger native infrastructure: `prism-eval` + the Eval Dashboard with pass/fail evidence, trace DAGs, benchmark comparison, and outgrowth warnings. Express the same idea as pre-execution review, post-plan review, post-implementation eval, and regression/cost-growth checks.

**E. Pause/resume budgeting.** `prism-spectrum` already has signal-driven execution. A mature implementation could support checkpoint after each team milestone, safe pause on budget threshold, resume from artifact state, and "what changed while paused" reconciliation. The `claude-code-agent-teams-join` repo (entry #7 above) provides a concrete reference for the "resume" half of this — discovering orphaned teams and re-spawning their exact configuration from persisted state.

---

## Design Principle

> **Prism should evolve from "parallel specialist agents" into "hierarchical domain teams with shared contracts and resumable execution."**

Not "more agents." Not "bigger context." Not "agent teams" as branding.

The real win is: abstract mission at the top, domain coordination in the middle, narrow execution at the bottom, structured communication across layers, evals and checkpoints as control.

That model fits the Prism Claude Plugin ecosystem as it exists today — it extends it by one organizational layer.

---

## HumanLayer Origins: 12-Factor Agents & the RPIV Lineage

### Context

HumanLayer's two repos — `humanlayer/12-factor-agents` (16.8k stars, 273 commits) and `humanlayer/humanlayer` (8.1k stars) — are the upstream origin of Prism's RPIV workflow. Understanding this lineage matters because the 12 factors provide the theoretical grounding for *why* Prism's architecture works, and HumanLayer's `.claude/` directory is the direct ancestor of Prism's plugin structure.

**Links:**
- [12-factor-agents](https://github.com/humanlayer/12-factor-agents) — The principles document (Apache 2.0 code, CC BY-SA 4.0 content)
- [humanlayer/humanlayer `.claude/`](https://github.com/humanlayer/humanlayer/tree/main/.claude) — The reference implementation of RPIV as Claude Code commands + agents
- [AI Engineer World's Fair talk (17 min)](https://www.youtube.com/watch?v=8kMaTybvDUw)
- [Deep dive video](https://www.youtube.com/watch?v=rmvDxxNubIg)

### The 12 Factors and How Prism Implements Them

The 12-factor agents manifesto answers: "What principles make LLM-powered software good enough for production customers?" Dex (HumanLayer's creator) argues that most production AI agents are *not* the "here's your prompt, here's a bag of tools, loop until done" pattern — they're mostly deterministic code with LLM steps at key decision points.

Here's how each factor maps to Prism v2.5.0:

| Factor | Principle | Prism Implementation | Gap |
|--------|-----------|---------------------|-----|
| **1. Natural Language → Tool Calls** | LLMs choose what to do; deterministic code executes it | Prism's agents use `Task(subagent_type=...)` to invoke parallel specialists. Commands are deterministic operations. | Minimal — this is Prism's core model. |
| **2. Own Your Prompts** | Don't let a framework hide your prompts. You need full control. | Prism is *entirely* prompt engineering — 25 commands, 11 agents, 14 skills, all visible `.md` files. No framework abstraction. | **None.** Prism's "pure markdown, zero build step" philosophy is a direct expression of this factor. |
| **3. Own Your Context Window** | The most important skill is context engineering — controlling what goes into the window at each step. | Prism's RPIV phases each start with a clean context: Research produces a doc, Plan reads that doc (not raw files), Implement reads the plan (not the research). The `.prism/` artifact directory is the persistent context layer between sessions. | Partially implemented. Prism's Spectrum already starts fresh sessions per story, but doesn't yet enforce explicit context budgets (HumanLayer targets 40–60% utilization). |
| **4. Tools Are Structured Outputs** | Tool calls are just structured JSON the LLM emits. Don't over-abstract them. | Prism's signal protocol (`<promise>COMPLETE</promise>`, `<spectrum-continue>`, etc.) treats LLM outputs as structured control signals parsed by `spectrum.sh`. | Well-aligned. |
| **5. Unify Execution State and Business State** | The agent's state should live alongside business data, not in a separate orchestration layer. | `.prism/stories/stories.json` *is* both the execution manifest and the business decomposition. Progress lives in `.prism/shared/spectrum/progress.md`. | Well-aligned. Story status is the execution state. |
| **6. Launch/Pause/Resume** | Agents must be pausable and resumable with simple APIs. | `spectrum.sh` has pause via `SPECTRUM_PAUSE`, resume from `stories.json` state, and signal-driven flow control. | Partial. Current pause is between iterations, not mid-story. The research doc's recommendation for checkpoint/budget-aware pausing (section E) and the `claude-code-agent-teams-join` repo (#7) for session recovery directly address this gap. |
| **7. Contact Humans with Tool Calls** | Agents should reach out to humans *as a tool*, not just wait for human input. | Prism's current model is human-initiated (user invokes `/prism-research`, approves plans, etc.). No agent-initiated human contact. | **Gap.** This is what HumanLayer itself exists to solve. The `iloom-cli` #492 pattern (human feedback injection into running sessions) is the closest thing in the research doc. |
| **8. Own Your Control Flow** | Don't let the LLM decide the overall shape of execution. Use deterministic control flow with LLM decision points. | Prism's skills define the control flow (Research → Plan → Implement → Validate). LLMs make decisions *within* each phase but don't decide the phase order. `spectrum.sh` is a deterministic bash loop with LLM calls inside it. | **Strong alignment.** This is arguably Prism's biggest architectural strength vs. pure agent-loop systems. |
| **9. Compact Errors into Context** | When errors occur, fold them back into the context window rather than losing them. | Spectrum's signal protocol feeds errors back: `<spectrum-retry reason="...">` increments an error counter; 3+ consecutive errors trigger exit. `prism-debug` spawns parallel investigation agents. | Implemented, though the error compaction into the *next* story's context could be more explicit. |
| **10. Small, Focused Agents** | Many small agents beat one large agent. | Prism's 11 agents are each tightly scoped: `codebase-locator` only finds files (Haiku), `codebase-analyzer` only traces logic (Opus), etc. | **Strong alignment.** Prism's model assignment convention (cheapest model per task) is an extension of this principle. |
| **11. Trigger from Anywhere** | Meet users where they are — CLI, IDE, web, cron, webhook. | Prism runs in CLI (Bubble Tea), VS Code, and Electron. Same `.prism/` state, same signal protocol, same stories. | Well-aligned across three platforms. |
| **12. Stateless Reducer** | Each agent invocation should be a pure function: `(state, event) → (new_state, side_effects)`. | Each Spectrum iteration starts a fresh Claude Code session with only `stories.json` + the signal protocol as input. The session produces artifacts and a signal, then exits. The next iteration reads the updated state. | **Strong alignment.** Spectrum's fresh-session-per-story model is essentially a stateless reducer pattern. |

### HumanLayer's `.claude/` Directory vs. Prism's Plugin

HumanLayer's reference implementation uses the same structural primitives as Prism — they share a common ancestor:

| HumanLayer `.claude/` | Prism Plugin | Relationship |
|-----------------------|-------------|-------------|
| `commands/research_codebase.md` | `commands/research_codebase.md` | **Direct lineage.** Prism's version (179 lines) evolved from HumanLayer's, adding model assignment frontmatter and the prism-locator/prism-analyzer agents for `.prism/` document discovery. |
| `commands/create_plan.md` | `commands/create_plan.md` | **Direct lineage.** Prism's version (442 lines) is substantially expanded with two-category success criteria, phased output structure, and parallel research agents. |
| `commands/implement_plan.md` | `commands/implement_plan.md` | Direct lineage. |
| `commands/validate_plan.md` | `commands/validate_plan.md` | Direct lineage. HumanLayer's original was RPI (3-phase). Prism added the V (Validate) to make RPIV. |
| `commands/create_handoff.md` | `commands/create_handoff.md` | Direct lineage — session transfer documents. |
| `commands/commit.md` | `commands/commit.md` | Direct lineage. |
| `agents/codebase-analyzer.md` | `agents/codebase-analyzer.md` | Direct lineage. Prism added model assignment (Opus) and tool restrictions. |
| `agents/codebase-locator.md` | `agents/codebase-locator.md` | Direct lineage. Prism assigned Haiku for cost efficiency. |
| `agents/codebase-pattern-finder.md` | `agents/codebase-pattern-finder.md` | Direct lineage. |
| `agents/thoughts-analyzer.md` | `agents/prism-analyzer.md` | **Renamed + evolved.** `thoughts/` → `.prism/`, but same role: deep-dive on persistent documents. |
| `agents/thoughts-locator.md` | `agents/prism-locator.md` | **Renamed + evolved.** Same pattern. |
| `agents/web-search-researcher.md` | `agents/web-search-researcher.md` | Direct lineage. |
| `thoughts/` directory | `.prism/` directory | **Renamed + restructured.** HumanLayer uses `thoughts/shared/` with symlinks for cross-repo sharing. Prism uses `.prism/shared/` with a richer subdirectory structure (research, plans, validation, handoffs, prs, spectrum, ref, docs). |

### What HumanLayer Has That Prism Doesn't (Yet)

**The `thoughts` symlink pattern.** HumanLayer's `thoughts/` directory can be symlinked across repos so teams share research and plans globally. Prism's `.prism/` is project-scoped. For multi-repo projects (like Prism's own monorepo with CLI, VS Code, Electron, and installer), a cross-project shared context layer could be valuable.

**`npx humanlayer thoughts init`.** A one-command setup that creates the directory structure and symlinks. Prism has `init_prism.py` (174 lines) but it's not as streamlined for first-time setup.

**Factor 7 (contact humans with tool calls).** HumanLayer's core product is an SDK for agents to *request* human approval, feedback, or escalation as a tool call. Prism's human interaction is entirely human-initiated (user invokes commands, approves plans). Adding agent-initiated human contact would close the loop for autonomous Spectrum runs that hit ambiguity.

**The community adoption cascade.** HumanLayer's RPIV pattern has been forked/adapted into at least 5 independent repos: `acampb/claude-rpi-framework`, `coalesce-labs/catalyst`, `teambrilliant/claude-research-plan-implement`, `jeffh/claude-plugins`, and others. Prism is the most evolved descendant but doesn't yet have the same ecosystem of forks building on it. Publishing Prism's plugin to the Claude Code marketplace (which is already in `marketplace.json`) would position it as the "next generation" of the HumanLayer workflow.

### How This Connects to the Agent Teams Research

The 12 factors provide the *why* behind the agent teams research findings:

| Research Finding | 12-Factor Grounding |
|-----------------|-------------------|
| Dynamic routing heuristic (single → subagent → team) | **Factor 10** (small, focused agents) + **Factor 8** (own your control flow). The routing decision is deterministic code, not LLM choice. |
| Script-backed skills for guardrails | **Factor 8** (own your control flow). Deterministic scripts at verification points prevent prompt drift. |
| Structured cross-team contracts in `.prism/shared/` | **Factor 5** (unify execution and business state). Contracts are both the coordination mechanism and the project artifact. |
| Human-in-the-loop injection during Spectrum | **Factor 7** (contact humans with tool calls). The missing factor in Prism's current architecture. |
| Session recovery via `claude-code-agent-teams-join` | **Factor 6** (launch/pause/resume). Team state must be recoverable for production reliability. |
| Portable orchestration via MCP (`claude-code-teams-mcp`) | **Factor 11** (trigger from anywhere). Same team protocol, any client. |

---

## Concrete First Steps

1. **Add a routing heuristic to the `prism` skill** — single-shot task → one agent; independent parallel discovery → subagents; high-ambiguity collaborative synthesis → full team mode. Builds directly on existing orchestrator.

2. **Introduce optional script-backed skills** for deterministic steps — `solatis/claude-config` pattern. Target `prism-validate`, `prism-eval`, `prism-spectrum` guardrails to reduce prompt drift.

3. **Define the "Prism Teams Protocol" spec** — `claude-code-teams-mcp` shows value in decoupling team orchestration from one runtime. Unifies Claude plugin, CLI, VS Code, and Electron behind one portable orchestration layer.

4. **Add live human feedback into `prism-spectrum`** — human interrupt/inject channel during autonomous runs, building on existing signal protocol and `.prism/` artifacts.

5. **Plan session resilience for team-based Spectrum** — `claude-code-agent-teams-join` solves orphaned team recovery. When Prism adopts agent teams, build equivalent discover/rejoin/re-spawn primitives into the Spectrum runner so long autonomous runs survive crashes and rate limits without losing team state.
