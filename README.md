# Prism

**A structured 4-phase development workflow for Claude Code**

> Research → Plan → Implement → Validate

Prism transforms complex coding tasks into focused, quality work through specialized agents and systematic documentation. Rather than jumping straight into code, Prism guides AI through deliberate phases—researching the codebase, creating approved plans, implementing with verification, and validating against success criteria.

**Key Features:**
- 🔬 **Parallel Research Agents** — Multiple specialized agents explore code simultaneously
- 📋 **Interactive Planning** — Plans are contracts, reviewed and approved before implementation
- ✅ **Quality Gates** — Automated verification at every stage
- 🔄 **Spectrum Autonomous Execution** — Multi-story feature development with fresh context per iteration

## Installation

### From GitHub Marketplace

```bash
# Add the marketplace
/plugin marketplace add TheDigitalGriot/prism

# Install the plugin
/plugin install prism@prism-marketplace
```

### Local Development

```bash
claude --plugin-dir /path/to/prism-plugin
```

## Requirements

- **Claude Code v2.1.257 or later** — required for Fable 5.1 (`claude-fable-5-1`), the gated escalation tier. Lower floors if you do not use Fable: **v2.1.219** for Opus 5 (the routine ceiling), **v2.1.197** for Sonnet 5, **v2.1.217** for the deterministic subagent caps, **v2.1.154** for native `EnterWorktree`/`ExitWorktree` support, and **v2.1.111** for `effort: xhigh` skills (`prism-brainstorm`, `prism-plan`, `prism-prd`, `prism-design`, `prism-subagent`, `prism-iterate`). v2.1.80+ required for brainstorm active wake mode. Run `claude update` if on an older version.
- **codebase-memory-mcp on PATH** (new in v3.4.0) — enables the graph-first intelligence layer (`graph-navigator` agent, blast-radius analysis in `prism-plan`, structural validation in `prism-validate`, graph verification in `prism-spectrum`). Without it, all graph steps no-op gracefully. Verify: `codebase-memory-mcp --version` (should return `0.6.0+`).
- **bun** — required for the `digital-griot-mcp` MCP server (the shared Griot wake channel behind the visual companion wake mode). Install: `npm install -g bun` or `curl -fsSL https://bun.sh/install | bash`.
- **jq** — required for `spectrum.sh` JSON parsing. Install: `brew install jq` (macOS) or `apt install jq` (Linux).
- **Max / Team / Enterprise plan recommended** for `prism-spectrum` (uses `sonnet[1m]` for 1M context autonomous execution). Pro users require usage credits for 1M context.

## Usage

### Automatic Workflow

Say "help me build [feature]" or "implement [task]" to trigger the full Prism workflow.

### Core Workflow Skills

| Command | Purpose |
|---------|---------|
| `/prism:prism` | Main orchestrator - routes to appropriate phase |
| `/prism:prism-research` | Research phase - document codebase |
| `/prism:prism-plan` | Create implementation plan |
| `/prism:prism-implement` | Execute approved plan |
| `/prism:prism-validate` | Verify implementation against plan |
| `/prism:prism-iterate` | Update plan based on feedback |
| `/prism:prism-spectrum` | Autonomous story execution (used with spectrum.sh) |
| `/prism:prism-debug` | Debug investigation with parallel agents |
| `/prism:prism-subagent` | Same-session subagent execution with two-stage review |
| `/prism:prism-dispatch` | Route a task to the right execution model |
| `/prism:prism-decompose` | Convert an approved plan into executable stories |
| `/prism:prism-finish` | Wrap a branch — cleanup, PR description, handoff |
| `/prism:prism-init` | Scaffold the `.prism/` directory in a project |

### Release & Ceremony Skills

The end-of-cycle arc. `prism-closing-ceremony` runs the whole sequence in one pass.

| Skill | Purpose |
|---------|---------|
| `/prism:prism-closing-ceremony` | Review & Audit gate → bookend → docs-update → release, fail-fast |
| `/prism:prism-bookend` | Analyze commits, propose the semver bump, update the doc snapshot |
| `/prism:prism-docs-update` | Sync the VitePress site from a `PRISM-DOCUMENTATION-*.md` snapshot |
| `/prism:prism-release` | Build all artifacts, commit, tag, push, publish the GitHub release |
| `/prism:prism-sideload` | Build a Cowork sideload zip |
| `/prism:prism-eval` | Run skill evals against a version snapshot |

### Plugin & Standards Skills

| Skill | Purpose |
|---------|---------|
| `/prism:griot-agent-architect` | The plugin- and agent-architecture gold standard — manifests, components, model config _(alias: `/prism:cl-plugin-structure`, still resolves)_ |
| `/prism:fragment-sync` | Reconcile Fragment's scaffolder to the current Prism standard |
| `/prism:icm-architect` | Build ICM workspaces + headless stage contracts |
| `/prism:prism-gavel` | Decision cockpit — the browser-driven gavel surface |
| `/prism:prism-brand` | Brand matrix and identity work |
| `/prism:prism-capture` | Capture a session into structured `.prism/` artifacts |
| `/prism:prism-verify` | Browser verification via Playwright |
| `/prism:prism-visual-docs` | Visual documentation generation |
| `/prism:prism-codex-plan-sync` | Sync plans across the Codex surface |

### Spectrum Autonomous Execution

For large features with 10+ changes, use Spectrum-style iterative execution:

```bash
# 1. Create and approve a plan
/prism:prism-plan

# 2. Decompose plan into atomic stories
/prism:decompose_plan

# 3. Run autonomous execution
./scripts/spectrum.sh
```

Spectrum spawns fresh Claude sessions in a loop, executing one story per iteration with quality gates. Memory persists through files, not AI context.

| Command | Purpose |
|---------|---------|
| `/prism:prism-spectrum` | Single-story execution (called by spectrum.sh) |
| `/prism:decompose_plan` | Convert plan into stories.json |

### Debug Skill

Investigate issues during implementation or when quality gates fail:

| Command | Purpose |
|---------|---------|
| `/prism:prism-debug` | Spawn parallel debug investigation agents |

Debug automatically integrates with Spectrum - when quality gates fail, investigation runs before retry.

### Document Generation Skills

These skills orchestrate document generation commands with workflow integration:

| Command | Purpose | Invokes |
|---------|---------|---------|
| `/prism:prism-prd` | Generate PRD with workflow context | `/generate_prd` |
| `/prism:prism-visual-docs` | Generate UX documentation | `/generate_user_flows`, `/generate_tech_spec` |

### Document Generation Commands

Standalone commands for generating project documentation:

| Command | Purpose |
|---------|---------|
| `/prism:generate_prd` | Generate Product Requirements Document |
| `/prism:generate_tech_spec` | Generate Technical Specification |
| `/prism:generate_user_flows` | Generate User Flows & wireframes |
| `/prism:generate_pricing` | Generate MVP pricing proposal |

### Git & Session Commands

| Command | Purpose |
|---------|---------|
| `/prism:commit` | Git commit workflow |
| `/prism:describe_pr` | Generate PR description |
| `/prism:create_handoff` | Create session handoff document |
| `/prism:resume_handoff` | Resume from handoff |
| `/prism:worktree` | Set up git worktree |
| `/prism:review-setup` | Set up PR review environment |
| `/prism:retroactive` | Create ticket/PR after work done |

## Architecture

### Three-Layer Model

```
User Request
     │
     ▼
┌──────────────────┐
│     SKILLS       │  Auto-discovered based on context
│  (Orchestrators) │  Invoke commands & agents
└────────┬─────────┘
         ▼
┌──────────────────┐
│    COMMANDS      │  User-invocable via /command
│  (Operations)    │  Single-file focused prompts
└────────┬─────────┘
         ▼
┌──────────────────┐
│     AGENTS       │  Specialized workers via Task()
│  (Specialists)   │  Research, analysis, pattern finding
└──────────────────┘
```

### Workflow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  prism-prd  │────▶│  research   │────▶│    plan     │────▶│  implement  │
│  (Optional) │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
       │                                                           │
       ▼                                                    ┌──────┴──────┐
┌─────────────┐                                             │             │
│ visual-docs │                                             ▼             ▼
│  (Optional) │                                      ┌───────────┐ ┌───────────┐
└─────────────┘                                      │  Manual   │ │ Spectrum  │
                                                     │  Path     │ │   Path    │
                                                     └─────┬─────┘ └─────┬─────┘
                                                           │             │
                                                           └──────┬──────┘
                                                                  ▼
                                                           ┌─────────────┐
                                                           │  validate   │
                                                           └──────┬──────┘
                                                                  │
                                                                  ▼
                                                           ┌─────────────┐
                                                           │   iterate   │
                                                           │ (if needed) │
                                                           └─────────────┘
```

### Spectrum Autonomous Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    spectrum.sh (Bash Loop)                    │
│                                                              │
│  for iteration in 1..MAX_ITERATIONS; do                      │
│      claude --skill prism-spectrum                           │
│      if output contains "<promise>COMPLETE</promise>"        │
│          break                                               │
│  done                                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Fresh Claude Session (per iteration)            │
│                                                              │
│  1. Load state from files (stories.json, progress.md)       │
│  2. Pick highest priority incomplete story                   │
│  3. Implement story                                          │
│  4. Run quality gates (typecheck, lint, test)                │
│  5. If fail → auto-debug → retry signal                      │
│  6. If pass → commit → update state → continue signal        │
└─────────────────────────────────────────────────────────────┘
```

### Document Generation Flow

Skills orchestrate commands for document generation:

```
Skills (Orchestrators)              Commands (Generators)
─────────────────────              ────────────────────
prism-prd          ──────────────▶ /generate_prd

prism-visual-docs  ──────────────▶ /generate_user_flows
                   ──────────────▶ /generate_tech_spec

(standalone)       ──────────────▶ /generate_pricing
```

### Agents

#### Research Agents

| Agent | Purpose | Model |
|-------|---------|-------|
| `codebase-locator` | Find WHERE code lives | haiku |
| `codebase-analyzer` | Understand HOW code works | opus |
| `codebase-pattern-finder` | Find patterns to model after | sonnet |
| `prism-locator` | Find existing docs in .prism/ | haiku |
| `prism-analyzer` | Extract insights from docs | opus |
| `web-search-researcher` | Research external docs/APIs | sonnet |

#### Debug Agents

| Agent | Purpose | Model |
|-------|---------|-------|
| `log-investigator` | Analyze logs for errors | haiku |
| `state-investigator` | Check app state and config | haiku |
| `git-investigator` | Analyze git history | haiku |

#### Review & Verification Agents

The two-stage review pair used by `prism-subagent` and the closing ceremony.

| Agent | Purpose | Model |
|-------|---------|-------|
| `spec-reviewer` | Stage 1 — does the diff match the story exactly? | sonnet |
| `quality-reviewer` | Stage 2 — architecture, testing, maintainability | sonnet |
| `browser-verifier` | Screenshots + console-error assertions via Playwright | haiku |
| `visual-regression-grader` | Judge a visual diff: regression vs intentional | sonnet |
| `graph-navigator` | Structural queries over the code graph | haiku |

> Agents declare **aliases** (`opus` / `sonnet` / `haiku`), never pinned model IDs, so a
> family roll-forward never requires touching agent frontmatter. See
> [Model Assignment](https://prism.digitalgriot.studio/plugin/model-assignment).

## Key Principles

### "Documentarian, Not Critic"

All research agents follow this philosophy:
- DO NOT suggest improvements unless explicitly asked
- DO NOT critique the implementation or identify problems
- ONLY describe what exists, where it exists, how it works

### Two-Category Success Criteria

Plans always separate:
- **Automated Verification**: Commands that can be run (`npm test`, `make check`)
- **Manual Verification**: Human testing required (UI, performance, edge cases)

### Interactive Planning

Plans are contracts:
- Present understanding first
- Get user buy-in at each step
- Never write full plan in one shot
- Resolve ALL unknowns before finalizing

## Prism Directory

Prism uses a `.prism/` directory for persistent documentation:

```
project/
└── .prism/
    ├── stories/           # Task definitions
    │   └── stories.json   # Story definitions and status
    ├── shared/            # Committed to repo
    │   ├── research/      # YYYY-MM-DD-topic.md
    │   ├── plans/         # YYYY-MM-DD-feature.md (PRDs, specs, flows)
    │   ├── validation/    # YYYY-MM-DD-report.md
    │   ├── handoffs/      # Session handoff docs
    │   ├── prs/           # PR descriptions
    │   ├── spectrum/      # Execution state
    │   │   └── progress.md    # Accumulated learnings
    │   ├── ref/           # Reference materials
    │   └── docs/          # Project documentation
    └── local/             # Gitignored, per-developer
```

Initialize with:
```bash
python skills/prism/scripts/init_prism.py
```

## Spectrum Execution

For autonomous multi-story execution:

### Quick Start

```bash
# 1. Create a plan
/prism:prism-plan "Add user authentication"

# 2. Decompose into stories
/prism:decompose_plan .prism/shared/plans/2026-02-04-auth.md

# 3. Run autonomous execution
./scripts/spectrum.sh
```

### Configuration

```bash
# Custom iteration limit (default: 50)
SPECTRUM_MAX_ITERATIONS=20 ./scripts/spectrum.sh

# Verbose output
SPECTRUM_VERBOSE=true ./scripts/spectrum.sh

# Custom stories file
./scripts/spectrum.sh path/to/stories.json
```

### How It Works

1. **Fresh Context**: Each iteration spawns a new Claude session (no context degradation)
2. **File-Based Memory**: State persists in `stories.json` and `progress.md`
3. **Quality Gates**: Must pass typecheck/lint/test before commit
4. **Auto-Debug**: On failure, spawns debug agents to diagnose issues
5. **Atomic Commits**: One story = one commit
6. **Learning Accumulation**: Insights persist for future iterations

## License

MIT
