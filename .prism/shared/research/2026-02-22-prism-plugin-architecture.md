---
date: 2026-02-22T00:00:00Z
researcher: Claude
repository: prism-plugin
branch: main
topic: "Complete Prism Plugin Architecture Analysis"
tags: [research, architecture, skills, commands, agents, cli, scripts, plugin-structure]
status: complete
last_updated: 2026-02-22
last_updated_by: Claude
---

# Prism Plugin — Complete Architecture Analysis

## Research Question

Full architectural breakdown of the Prism Claude Code plugin: skills, commands, agents, scripts, CLI dashboard, and all inter-component relationships with visual diagrams.

---

## 1. Executive Summary

**Prism** is a Claude Code plugin (v2.1.8) implementing a structured 4-phase development workflow: **Research → Plan → Implement → Validate**. For large features, **Spectrum** autonomous execution runs one story per fresh Claude session in a loop. The plugin is 100% markdown-based prompt engineering (no build step for the plugin itself), complemented by a Go-based TUI dashboard for visual execution monitoring.

```
┌─────────────────────────────────────────────────────────────┐
│                    PRISM PLUGIN v2.1.8                       │
│                                                             │
│   "Structured 4-Phase Development Workflow for Claude Code" │
│                                                             │
│   Skills (10)  ·  Commands (22)  ·  Agents (9)             │
│   Scripts (6)  ·  CLI Dashboard (Go TUI)                    │
│                                                             │
│   Author: Digital Griot Studio                                   │
│   Repo:   TheDigitalGriot/prism-plugin                      │
│   License: MIT                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Three-Layer Architecture

Prism follows a strict three-layer component model where each layer has a distinct role:

```
┌───────────────────────────────────────────────────────────────────┐
│                    LAYER 1: SKILLS (Orchestrators)                │
│                                                                   │
│   Auto-discovered from skills/*/SKILL.md                          │
│   Activate on trigger phrases · Invoke commands · Spawn agents    │
│   Model: Opus (planning) or Sonnet (general)                      │
│                                                                   │
│   ┌──────────┐ ┌─────────┐ ┌───────────┐ ┌──────────┐           │
│   │  prism   │ │research │ │   plan    │ │implement │           │
│   │  (hub)   │ │ Phase 1 │ │  Phase 2  │ │ Phase 3  │           │
│   └──────────┘ └─────────┘ └───────────┘ └──────────┘           │
│   ┌──────────┐ ┌─────────┐ ┌───────────┐ ┌──────────┐           │
│   │validate  │ │ iterate │ │  debug    │ │ spectrum │           │
│   │ Phase 4  │ │Feedback │ │  Triage   │ │Autonomous│           │
│   └──────────┘ └─────────┘ └───────────┘ └──────────┘           │
│   ┌──────────┐ ┌───────────────┐                                 │
│   │   prd    │ │  visual-docs  │                                 │
│   │ Product  │ │  UX & Flows   │                                 │
│   └──────────┘ └───────────────┘                                 │
├───────────────────────────────────────────────────────────────────┤
│                    LAYER 2: COMMANDS (Operations)                 │
│                                                                   │
│   Auto-discovered from commands/*.md                              │
│   User-invocable via /command-name · Single-purpose operations    │
│   22 total commands                                               │
│                                                                   │
│   Research: /research_codebase                                    │
│   Planning: /create_plan  /iterate_plan  /decompose_plan          │
│   Implement: /implement_plan  /commit  /worktree                  │
│   Validate: /validate_plan  /describe_pr                          │
│   Document: /generate_prd /generate_tech_spec /generate_user_flows│
│   Session:  /create_handoff  /resume_handoff                      │
│   Debug:    /prism-debug  /retroactive                            │
│   CLI:      /cli-install  /cli-uninstall  /prism_cli              │
│   Migrate:  /prism_dir_update  /review-setup                      │
│   Pricing:  /generate_pricing                                     │
├───────────────────────────────────────────────────────────────────┤
│                    LAYER 3: AGENTS (Specialists)                  │
│                                                                   │
│   Auto-discovered from agents/*.md                                │
│   Spawned via Task(subagent_type="name") · Parallel execution     │
│   9 total agents                                                  │
│                                                                   │
│   ┌─────────────────── RESEARCH ────────────────────┐            │
│   │ codebase-locator (Haiku)  — Find WHERE          │            │
│   │ codebase-analyzer (Opus)  — Understand HOW      │            │
│   │ codebase-pattern-finder (Sonnet) — Find PATTERNS │            │
│   │ prism-locator (Haiku) — Find .prism/ docs        │            │
│   │ prism-analyzer (Opus) — Extract INSIGHTS         │            │
│   │ web-search-researcher (Sonnet) — External info   │            │
│   └──────────────────────────────────────────────────┘            │
│   ┌──────────────────── DEBUG ──────────────────────┐            │
│   │ log-investigator (Haiku)   — Analyze logs        │            │
│   │ state-investigator (Haiku) — Check app state     │            │
│   │ git-investigator (Haiku)   — Analyze git history │            │
│   └──────────────────────────────────────────────────┘            │
└───────────────────────────────────────────────────────────────────┘
```

### Model Assignment Convention

```
┌──────────────────────────────────────────────────────────┐
│                  MODEL ASSIGNMENT MATRIX                  │
├────────────┬─────────────────────────────────────────────┤
│            │                                             │
│   OPUS     │  Deep analysis, planning, document gen      │
│  (Smartest)│  • prism-plan, prism-iterate                │
│            │  • prism-prd, prism-visual-docs              │
│            │  • codebase-analyzer, prism-analyzer         │
│            │  • create_plan, iterate_plan                 │
│            │  • generate_prd, generate_tech_spec          │
│            │  • generate_user_flows, generate_pricing     │
│            │  • decompose_plan, research_codebase         │
├────────────┼─────────────────────────────────────────────┤
│            │                                             │
│   SONNET   │  General work, implementation, research     │
│  (Balanced)│  • prism (hub), prism-research              │
│            │  • prism-implement, prism-validate           │
│            │  • prism-debug, prism-spectrum               │
│            │  • codebase-pattern-finder                   │
│            │  • web-search-researcher                     │
│            │  • implement_plan, validate_plan             │
│            │  • describe_pr, cli-install/uninstall        │
├────────────┼─────────────────────────────────────────────┤
│            │                                             │
│   HAIKU    │  Fast lookups, discovery, investigation     │
│  (Fastest) │  • codebase-locator, prism-locator          │
│            │  • log-investigator, state-investigator      │
│            │  • git-investigator                          │
│            │  • commit, review-setup, worktree            │
└────────────┴─────────────────────────────────────────────┘
```

---

## 3. Core Workflow — The 4 Phases

### 3.1 Complete Workflow Diagram

```
                        ┌─────────────────────┐
                        │     USER REQUEST     │
                        │  "Help me build X"   │
                        └──────────┬──────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
          ┌─────────────┐ ┌──────────────┐ ┌──────────┐
          │  /prism-prd  │ │/prism-research│ │  /prism  │
          │ (if new      │ │  (Phase 1)   │ │  (hub)   │
          │  product)    │ │              │ │ navigate │
          └──────┬──────┘ └──────┬───────┘ └─────┬────┘
                 │               │               │
                 ▼               │               │
     ┌───────────────────┐      │               │
     │/prism-visual-docs │      │               │
     │ (UX flows, specs) │      │               │
     └────────┬──────────┘      │               │
              │                 │               │
              └────────┬────────┘               │
                       │                        │
                       ▼                        │
              ┌────────────────┐                │
              │  /prism-plan   │◄───────────────┘
              │   (Phase 2)    │
              │  Interactive   │
              │  planning with │
              │  user approval │
              └───────┬────────┘
                      │
           ┌──────────┼──────────┐
           │          │          │
           ▼          │          ▼
   ┌──────────────┐   │   ┌──────────────────┐
   │/prism-implement│  │   │ /decompose_plan  │
   │  (Phase 3)    │  │   │ (for Spectrum)   │
   │  Manual exec  │  │   └────────┬─────────┘
   └───────┬──────┘   │            │
           │          │            ▼
           │          │   ┌────────────────┐
           │          │   │ spectrum.sh    │
           │          │   │ Autonomous     │
           │          │   │ story loop     │
           │          │   └────────┬───────┘
           │          │            │
           │          │            ▼
           │          │   ┌────────────────┐
           │          │   │/prism-spectrum  │
           │          │   │ 1 story/session │
           │          │   └────────┬───────┘
           │          │            │
           └──────────┼────────────┘
                      │
                      ▼
              ┌────────────────┐
              │ /prism-validate│
              │   (Phase 4)    │
              │  Verify vs plan│
              └───────┬────────┘
                      │
              ┌───────┴───────┐
              │               │
              ▼               ▼
       ┌───────────┐   ┌──────────────┐
       │   PASS    │   │  ISSUES?     │
       │  /commit  │   │/prism-iterate │
       │/describe_pr│  │ Update plan   │
       └───────────┘   │ Re-implement  │
                       └──────────────┘
```

### 3.2 Phase Details

#### Phase 1: Research (`/prism-research`)

**Trigger phrases**: "research this", "understand how X works", "map out the system", "explore the codebase"
**Model**: Sonnet
**Critical rule**: "Document What IS, Not What SHOULD BE" — no suggestions, critiques, or improvements

```
┌─────────────────────── RESEARCH PHASE ──────────────────────────┐
│                                                                  │
│  1. Read mentioned files FIRST (full Read, no limit)             │
│  2. Check existing knowledge ─────► prism-locator (Haiku)        │
│  3. Locate code ──────────────────► codebase-locator (Haiku)     │
│  4. Analyze components ───────────► codebase-analyzer (Opus)     │
│  5. Find patterns ────────────────► codebase-pattern-finder (Son)│
│  6. External research (optional) ─► web-search-researcher (Son)  │
│  7. Save ──► .prism/shared/research/YYYY-MM-DD-topic.md          │
│                                                                  │
│  Agents run IN PARALLEL when searching different areas           │
│                                                                  │
│  Output template: research-template.md                           │
│  Reference: exploration-patterns.md (bash patterns for discovery)│
└──────────────────────────────────────────────────────────────────┘
```

#### Phase 2: Plan (`/prism-plan`)

**Trigger phrases**: "create a plan", "plan the implementation", "design how to build"
**Model**: Opus
**Critical rule**: Interactive — present understanding first, get buy-in at each step, never write full plan in one shot

```
┌──────────────────────── PLAN PHASE ─────────────────────────────┐
│                                                                  │
│  1. Load context ──► prism-analyzer (extract decisions)          │
│  2. Present understanding ──► Goal, Key Files, Patterns, Q's    │
│  3. Design options (if multiple) ──► Compare A vs B with Pros/Con│
│  4. Get structure approval ──► "Phase 1: X, Phase 2: Y, OK?"    │
│  5. Write full plan ──► .prism/shared/plans/YYYY-MM-DD-*.md     │
│                                                                  │
│  ┌─────────── SUCCESS CRITERIA (always two categories) ────────┐│
│  │ Automated Verification:           Manual Verification:       ││
│  │   [ ] npm test                      [ ] Feature works in UI  ││
│  │   [ ] npm run typecheck             [ ] Performance OK       ││
│  │   [ ] npm run lint                  [ ] Edge cases handled   ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  "What We're NOT Doing" section required in every plan           │
│  All open questions must be RESOLVED before finalizing           │
│  Output template: plan-template.md                               │
└──────────────────────────────────────────────────────────────────┘
```

#### Phase 3: Implement (`/prism-implement`)

**Trigger phrases**: "implement the plan", "start building", "execute phase 1"
**Model**: Sonnet
**Critical rule**: Follow the plan phase-by-phase, stop at checkpoints for approval

```
┌──────────────────── IMPLEMENT PHASE ────────────────────────────┐
│                                                                  │
│  For each phase in plan:                                         │
│                                                                  │
│    1. Read ALL phase files (before changes)                      │
│    2. Implement steps exactly as planned                         │
│    3. Mark checkbox [x] in plan document                         │
│    4. Run ALL verification commands                              │
│    5. Update checkpoint in plan                                  │
│    6. ▶ STOP — Get user approval before next phase               │
│                                                                  │
│  On mismatch with plan:                                          │
│    ┌──────────────────────────────────────────┐                  │
│    │ Plan said: X                              │                  │
│    │ Found: Y                                  │                  │
│    │ Impact: Z                                 │                  │
│    │ Options: A) Adapt  B) Update  C) Discuss  │                  │
│    └──────────────────────────────────────────┘                  │
│    Never silently deviate from the plan.                         │
│                                                                  │
│  Context management: Save session notes if >60% context          │
└──────────────────────────────────────────────────────────────────┘
```

#### Phase 4: Validate (`/prism-validate`)

**Trigger phrases**: "validate the plan", "verify implementation", "check if complete"
**Model**: Sonnet
**Critical rule**: Run ALL verification commands, don't trust checkboxes

```
┌──────────────────── VALIDATE PHASE ─────────────────────────────┐
│                                                                  │
│  1. Load plan + git state (git log, git diff, tests)             │
│  2. Verify each phase:                                           │
│     • Check completion status                                    │
│     • Verify actual code matches plan                            │
│     • Run verification commands                                  │
│  3. Check success criteria (automated + manual)                  │
│  4. Document deviations                                          │
│  5. Generate report ──► .prism/shared/validation/YYYY-MM-DD-*.md │
│                                                                  │
│  ┌────────── VALIDATION REPORT ──────────┐                       │
│  │ Phases:    [N/M] complete             │                       │
│  │ Automated: [N/M] passing              │                       │
│  │ Manual:    [N/M] verified             │                       │
│  │ Status:    PASS / FAIL / PARTIAL      │                       │
│  └───────────────────────────────────────┘                       │
│                                                                  │
│  Output template: validation-template.md                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Spectrum Autonomous Execution

Spectrum enables large features (10+ stories) to be implemented autonomously, with each story executed in a fresh Claude session.

### 4.1 Spectrum Architecture

```
┌──────────────────────── SPECTRUM FLOW ──────────────────────────┐
│                                                                  │
│  SETUP (Manual)                                                  │
│  ────────────────                                                │
│  /prism-plan ──► Create approved plan                            │
│  /decompose_plan ──► Generate stories.json from plan             │
│                                                                  │
│  EXECUTION (Autonomous Loop)                                     │
│  ────────────────────────────                                    │
│                                                                  │
│  ┌─── spectrum.sh ──────────────────────────────────────────┐   │
│  │                                                           │   │
│  │   Iteration 1                                             │   │
│  │   ┌──────────────────────────────────────────────────┐   │   │
│  │   │  claude --dangerously-skip-permissions --print    │   │   │
│  │   │  "Execute next story from stories.json            │   │   │
│  │   │   using /prism-spectrum workflow"                  │   │   │
│  │   │                                                    │   │   │
│  │   │  /prism-spectrum ──► Load state                    │   │   │
│  │   │                 ──► Pick next story                │   │   │
│  │   │                 ──► Implement                      │   │   │
│  │   │                 ──► Run quality gates              │   │   │
│  │   │                 ──► Commit if passing              │   │   │
│  │   │                 ──► Update stories.json            │   │   │
│  │   │                 ──► Update progress.md             │   │   │
│  │   │                 ──► Output signal                  │   │   │
│  │   └───────────────────────┬──────────────────────────┘   │   │
│  │                           │                               │   │
│  │                           ▼                               │   │
│  │   ┌─── Signal Parsing ────────────────────────────────┐  │   │
│  │   │                                                    │  │   │
│  │   │  <promise>COMPLETE</promise> ──► EXIT (all done)   │  │   │
│  │   │  <spectrum-continue>         ──► NEXT ITERATION    │  │   │
│  │   │  <spectrum-retry>            ──► RETRY (max 3)     │  │   │
│  │   │  <spectrum-blocked>          ──► SKIP, CONTINUE    │  │   │
│  │   │  <spectrum-error>            ──► FATAL, STOP       │  │   │
│  │   │                                                    │  │   │
│  │   └────────────────────────────────────────────────────┘  │   │
│  │                                                           │   │
│  │   Iteration 2, 3, ... N (fresh session each time)         │   │
│  │   (max: SPECTRUM_MAX_ITERATIONS, default 50)              │   │
│  │                                                           │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  STATE FILES                                                     │
│  ───────────                                                     │
│  .prism/stories/stories.json    ─ Story definitions & status     │
│  .prism/shared/spectrum/progress.md  ─ Learnings & patterns      │
│                                                                  │
│  ENVIRONMENT VARIABLES                                           │
│  ──────────────────────                                          │
│  SPECTRUM_MAX_ITERATIONS  (default: 50)                          │
│  SPECTRUM_VERBOSE         (default: false)                       │
│  SPECTRUM_PAUSE           (default: 2s)                          │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 stories.json Schema

```json
{
  "plan": {
    "name": "Feature Name",
    "source": ".prism/shared/plans/2026-02-22-feature.md",
    "createdAt": "2026-02-22T00:00:00Z",
    "qualityGates": ["npm run typecheck", "npm run lint", "npm test"]
  },
  "stories": [
    {
      "id": "STORY-001",
      "title": "Brief action-oriented title",
      "description": "What this story accomplishes",
      "priority": 1,
      "status": "pending",
      "blockedBy": null,
      "files": [
        { "path": "src/auth.ts", "action": "create" },
        { "path": "src/types.ts", "action": "modify" }
      ],
      "steps": [
        { "description": "Create auth interface", "done": false },
        { "description": "Implement login method", "done": false }
      ]
    }
  ]
}
```

### 4.3 Story Priority Convention

```
Priority 1-10:   Foundation (types, interfaces, config)
Priority 11-20:  Core Implementation
Priority 21-30:  Integration
Priority 31-40:  Tests
Priority 41-50:  Documentation & Polish
```

### 4.4 Debug Integration in Spectrum

When quality gates fail during Spectrum execution:

```
┌─── Quality Gate Failure ───────────────────────────────────┐
│                                                             │
│  1. DO NOT commit                                           │
│  2. Capture full error output                               │
│  3. Spawn parallel debug agents:                            │
│     ┌──────────────────────────────────┐                   │
│     │ log-investigator    ──► Logs     │  (parallel)       │
│     │ state-investigator  ──► State    │  (parallel)       │
│     │ git-investigator    ──► History  │  (parallel)       │
│     └──────────────────────────────────┘                   │
│  4. Synthesize findings into debug report                   │
│  5. Record findings in progress.md                          │
│  6. Output: <spectrum-retry reason="QUALITY_GATE_FAILED">   │
│             [root cause + suggested fix]                     │
│             </spectrum-retry>                                │
│  7. Exit (spectrum.sh retries in fresh session)             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Complete Skills Inventory

### 5.1 Skills Overview Table

| # | Skill | Model | Phase | Triggers | Key Agents Spawned |
|---|-------|-------|-------|----------|-------------------|
| 1 | `prism` | Sonnet | Hub | "help me build", "prism" | Navigation only |
| 2 | `prism-research` | Sonnet | 1 | "research this", "explore" | locator, analyzer, pattern-finder, prism-locator, web-search |
| 3 | `prism-plan` | Opus | 2 | "create a plan" | prism-analyzer, codebase-analyzer |
| 4 | `prism-implement` | Sonnet | 3 | "implement the plan" | None (optional debug) |
| 5 | `prism-validate` | Sonnet | 4 | "validate the plan" | None |
| 6 | `prism-iterate` | Opus | Feedback | "iterate on plan" | Conditional research agents |
| 7 | `prism-debug` | Sonnet | Debug | "debug this", "why failing" | log/state/git investigators |
| 8 | `prism-spectrum` | Sonnet | Autonomous | "spectrum", "execute story" | Debug agents on failure |
| 9 | `prism-prd` | Opus | Document | "create a PRD" | prism-locator, web-search |
| 10 | `prism-visual-docs` | Opus | Document | "create user flows" | prism-locator |

### 5.2 Skills Directory Structure

```
skills/
├── prism/                             # Hub / Orchestrator
│   ├── SKILL.md                       # (264 lines)
│   ├── references/
│   │   └── workflow-patterns.md       # (275 lines) Real-world patterns
│   └── scripts/
│       └── init_prism.py              # (175 lines) Directory initializer
│
├── prism-research/                    # Phase 1: Research
│   ├── SKILL.md                       # (114 lines)
│   └── references/
│       ├── exploration-patterns.md    # (178 lines) Bash search patterns
│       └── research-template.md       # (125 lines) Output template
│
├── prism-plan/                        # Phase 2: Plan
│   ├── SKILL.md                       # (127 lines)
│   └── references/
│       └── plan-template.md           # (186 lines) Output template
│
├── prism-implement/                   # Phase 3: Implement
│   └── SKILL.md                       # (123 lines)
│
├── prism-validate/                    # Phase 4: Validate
│   ├── SKILL.md                       # (95 lines)
│   └── references/
│       └── validation-template.md     # (190 lines) Output template
│
├── prism-iterate/                     # Feedback Loop
│   └── SKILL.md                       # (104 lines)
│
├── prism-debug/                       # Debug Investigation
│   └── SKILL.md                       # (222 lines)
│
├── prism-spectrum/                    # Autonomous Execution
│   └── SKILL.md                       # (354 lines) — LARGEST skill
│
├── prism-prd/                         # PRD Generation
│   └── SKILL.md                       # (123 lines)
│
└── prism-visual-docs/                 # UX Documentation
    └── SKILL.md                       # (147 lines)
```

---

## 6. Complete Commands Inventory

### 6.1 Commands by Category

```
┌──────────────────────── COMMANDS (22 Total) ─────────────────────────┐
│                                                                       │
│  ╔══════════════ CORE WORKFLOW ═══════════════╗                       │
│  ║ /research_codebase  (Opus)   → Research    ║  Spawns 6 agents     │
│  ║ /create_plan        (Opus)   → Planning    ║  Spawns 5 agents     │
│  ║ /iterate_plan       (Opus)   → Iteration   ║  Conditional agents  │
│  ║ /implement_plan     (Sonnet) → Building    ║  No agents           │
│  ║ /validate_plan      (Sonnet) → Validation  ║  Conditional agents  │
│  ║ /decompose_plan     (Opus)   → Stories     ║  No agents           │
│  ╚════════════════════════════════════════════╝                       │
│                                                                       │
│  ╔══════════════ DOCUMENT GENERATION ═════════╗                       │
│  ║ /generate_prd       (Opus)   → PRD         ║  Optional web search │
│  ║ /generate_tech_spec (Opus)   → Tech Spec   ║  No agents           │
│  ║ /generate_user_flows(Opus)   → UX Flows    ║  No agents           │
│  ║ /generate_pricing   (Opus)   → Pricing     ║  No agents           │
│  ╚════════════════════════════════════════════╝                       │
│                                                                       │
│  ╔══════════════ SESSION MANAGEMENT ══════════╗                       │
│  ║ /create_handoff     (Sonnet) → Save state  ║  No agents           │
│  ║ /resume_handoff     (Sonnet) → Restore     ║  Conditional agents  │
│  ║ /commit             (Haiku)  → Git commit  ║  No agents           │
│  ║ /describe_pr        (Sonnet) → PR desc     ║  No agents           │
│  ║ /retroactive        (Sonnet) → Post-hoc    ║  No agents           │
│  ╚════════════════════════════════════════════╝                       │
│                                                                       │
│  ╔══════════════ DEBUG & INVESTIGATION ═══════╗                       │
│  ║ /prism-debug        (Sonnet) → Debug       ║  3 parallel agents   │
│  ╚════════════════════════════════════════════╝                       │
│                                                                       │
│  ╔══════════════ TOOLING & SETUP ═════════════╗                       │
│  ║ /cli-install        (Sonnet) → Install CLI ║  No agents           │
│  ║ /cli-uninstall      (Sonnet) → Remove CLI  ║  No agents           │
│  ║ /prism_cli          (N/A)    → Launch TUI  ║  No agents           │
│  ║ /prism_dir_update   (Sonnet) → Migrate     ║  No agents           │
│  ║ /review-setup       (Haiku)  → PR review   ║  No agents           │
│  ║ /worktree           (Haiku)  → Git worktree║  No agents           │
│  ╚════════════════════════════════════════════╝                       │
└───────────────────────────────────────────────────────────────────────┘
```

### 6.2 Command Output Locations

| Command | Output Path |
|---------|------------|
| `/research_codebase` | `.prism/shared/research/YYYY-MM-DD-topic.md` |
| `/create_plan` | `.prism/shared/plans/YYYY-MM-DD-feature.md` |
| `/iterate_plan` | Updates existing plan in `.prism/shared/plans/` |
| `/validate_plan` | `.prism/shared/validation/YYYY-MM-DD-report.md` |
| `/decompose_plan` | `.prism/stories/stories.json` + `.prism/shared/spectrum/progress.md` |
| `/create_handoff` | `.prism/shared/handoffs/YYYY-MM-DD_HH-MM-SS_desc.md` |
| `/describe_pr` | `.prism/shared/prs/{number}_description.md` |
| `/generate_prd` | `[PRODUCT]-PRD.md` (user-specified location) |
| `/generate_tech_spec` | `[PRODUCT]-TECHNICAL-SPEC.md` |
| `/generate_user_flows` | `[PRODUCT]-USER-FLOWS.md` |
| `/generate_pricing` | `[PROJECT]-PRICING.md` |

---

## 7. Complete Agents Inventory

### 7.1 Agent Capabilities Matrix

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AGENT MATRIX                                  │
├──────────────────────┬────────┬──────────────────┬──────────────────┤
│ Agent                │ Model  │ Tools            │ Role             │
├──────────────────────┼────────┼──────────────────┼──────────────────┤
│ codebase-locator     │ Haiku  │ Read,Glob,Grep,  │ Find WHERE       │
│                      │        │ Bash             │ code lives       │
├──────────────────────┼────────┼──────────────────┼──────────────────┤
│ codebase-analyzer    │ Opus   │ Read,Glob,Grep,  │ Understand HOW   │
│                      │        │ Bash             │ code works       │
├──────────────────────┼────────┼──────────────────┼──────────────────┤
│ codebase-pattern-    │ Sonnet │ Read,Glob,Grep,  │ Find PATTERNS    │
│ finder               │        │ Bash             │ to model after   │
├──────────────────────┼────────┼──────────────────┼──────────────────┤
│ prism-locator        │ Haiku  │ Read,Glob,Grep   │ Find .prism/     │
│                      │        │                  │ documents        │
├──────────────────────┼────────┼──────────────────┼──────────────────┤
│ prism-analyzer       │ Opus   │ Read,Glob,Grep   │ Extract INSIGHTS │
│                      │        │                  │ from docs        │
├──────────────────────┼────────┼──────────────────┼──────────────────┤
│ web-search-          │ Sonnet │ WebSearch,       │ External web     │
│ researcher           │        │ WebFetch,Read    │ research         │
├──────────────────────┼────────┼──────────────────┼──────────────────┤
│ log-investigator     │ Haiku  │ Bash             │ Analyze log      │
│                      │        │                  │ files            │
├──────────────────────┼────────┼──────────────────┼──────────────────┤
│ state-investigator   │ Haiku  │ Bash             │ Check app state  │
│                      │        │                  │ & config         │
├──────────────────────┼────────┼──────────────────┼──────────────────┤
│ git-investigator     │ Haiku  │ Bash             │ Analyze git      │
│                      │        │                  │ history          │
└──────────────────────┴────────┴──────────────────┴──────────────────┘
```

### 7.2 Agent Invocation Patterns

```
Research Phase (parallel spawning):
──────────────────────────────────

  /prism-research
      │
      ├──► Task(subagent_type="prism-locator")
      │    "Find existing research about [topic]"
      │
      ├──► Task(subagent_type="codebase-locator")       ┐
      │    "Find files related to [feature]"             │
      │                                                   │  Parallel
      ├──► Task(subagent_type="codebase-analyzer")       │
      │    "Analyze [component]. Trace data flow."       │
      │                                                   │
      ├──► Task(subagent_type="codebase-pattern-finder") │
      │    "Find similar implementations to [feature]"   ┘
      │
      └──► Task(subagent_type="web-search-researcher")
           "Research [library]. Find docs and examples."


Debug Phase (parallel spawning):
────────────────────────────────

  /prism-debug
      │
      ├──► Task(subagent_type="log-investigator")        ┐
      │    "Investigate logs for: [error description]"    │
      │                                                   │  Parallel
      ├──► Task(subagent_type="state-investigator")      │
      │    "Check state for anomalies: [issue context]"  │
      │                                                   │
      └──► Task(subagent_type="git-investigator")        ┘
           "Analyze git history for: [potential causes]"
```

### 7.3 Key Agent Principle: Documentarian, Not Critic

All research agents follow this core constraint:

```
┌──────────────────────────────────────────────────────────────┐
│                "DOCUMENTARIAN, NOT CRITIC"                     │
│                                                               │
│  ✓ DOCUMENT what exists                                       │
│  ✓ DESCRIBE where things live                                 │
│  ✓ EXPLAIN how code works                                     │
│  ✓ MAP component interactions                                 │
│  ✓ INCLUDE file:line references                               │
│                                                               │
│  ✗ DO NOT suggest improvements                                │
│  ✗ DO NOT critique implementation                             │
│  ✗ DO NOT perform root cause analysis (unless asked)          │
│  ✗ DO NOT propose enhancements                                │
│  ✗ DO NOT comment on code quality                             │
│  ✗ DO NOT identify anti-patterns                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. Scripts & Automation

### 8.1 Scripts Inventory

```
scripts/
├── spectrum.sh                  # (313 lines) Autonomous story loop
├── prism-cli-install.sh         # (281 lines) Cross-platform installer (Bash)
├── prism-cli-install.ps1        # (182 lines) Windows installer (PowerShell)
└── tests/
    ├── test_install.sh          # (456 lines) Pure-bash test suite
    └── prism-cli-install.bats   # (393 lines) BATS test suite

skills/prism/scripts/
└── init_prism.py                # (175 lines) .prism/ directory initializer
```

### 8.2 spectrum.sh Flow

```
spectrum.sh [stories-file]
│
├─ check_prerequisites()
│  ├─ Verify: claude CLI exists
│  ├─ Verify: jq exists
│  └─ Verify: stories.json exists
│
├─ derive_progress_path()
│  ├─ Flat:  .prism/stories/stories.json  →  .prism/shared/spectrum/progress.md
│  └─ Epic:  .prism/stories/epic/stories.json  →  .prism/shared/spectrum/epic/progress.md
│
├─ init_progress()
│  └─ Create progress.md with YAML frontmatter if missing
│
└─ LOOP (max SPECTRUM_MAX_ITERATIONS):
   │
   ├─ count_remaining()  ──► If 0, exit success
   ├─ print_banner()     ──► Show iteration N / remaining / total
   ├─ run_iteration()    ──► claude --dangerously-skip-permissions --print ...
   ├─ check_signals()    ──► Parse output for XML signal tags
   │
   ├─ COMPLETE    → Exit 0 (all done)
   ├─ CONTINUE    → Sleep SPECTRUM_PAUSE, next iteration
   ├─ RETRY       → Increment error counter (max 3 consecutive)
   ├─ BLOCKED     → Continue to next iteration
   └─ ERROR       → Exit 1 (fatal)
```

### 8.3 Installer Architecture

```
┌──────────────── INSTALLATION PATHS ─────────────────────────┐
│                                                              │
│  /cli-install (command)                                      │
│      │                                                       │
│      ├─ Detect platform                                      │
│      │                                                       │
│      ├─ Unix/macOS/Linux:                                    │
│      │  └─ bash scripts/prism-cli-install.sh [auto|source|download]
│      │     ├─ download_release()  ──► GitHub releases        │
│      │     ├─ build_from_source() ──► go build (if Go 1.22+)│
│      │     ├─ setup_path()        ──► .zshrc/.bashrc         │
│      │     └─ init_workspaces()   ──► ~/.prism/workspaces.json
│      │                                                       │
│      └─ Windows:                                             │
│         └─ powershell scripts/prism-cli-install.ps1 [-Method]│
│            ├─ Get-Release         ──► Invoke-WebRequest      │
│            ├─ Build-FromSource    ──► go build               │
│            ├─ Set-PathProfile     ──► PowerShell $PROFILE    │
│            └─ Initialize-Workspaces ──► ~/.prism/            │
│                                                              │
│  Binary Location: ~/.prism/bin/prism-cli[.exe]               │
│  Release URL: github.com/TheDigitalGriot/prism-plugin/releases
└──────────────────────────────────────────────────────────────┘
```

---

## 9. CLI Dashboard (cmd/prism-cli/)

### 9.1 Technology Stack

| Technology | Purpose |
|-----------|---------|
| Go 1.23 | Language |
| Bubble Tea | TUI framework (Elm-style MVU) |
| Lipgloss | Terminal styling & layout |
| Harmonica | Spring physics animations |
| FauxGL | 3D prism rendering |
| Cobra | CLI command framework |
| BubbleZone | Mouse click zone detection |
| Glamour | Markdown rendering |
| fsnotify | File system watching |

### 9.2 Architecture Diagram

```
┌─────────────────────── PRISM CLI ARCHITECTURE ──────────────────────┐
│                                                                      │
│  ┌─── main.go ────────────────────────────────────────────────────┐ │
│  │ Cobra Root Command → Flag Parsing → Path Resolution            │ │
│  │ → Terminal Detection → Splash Screen → Plugin Registry Init    │ │
│  └───────────────────────────────────┬────────────────────────────┘ │
│                                      │                              │
│  ┌─── app/ (Core Application) ───────┴─────────────────────────┐   │
│  │                                                              │   │
│  │  ┌── Model ────────────────────────────────────────────────┐│   │
│  │  │ Registry, ActiveView, Config, UIState, Anim, Watchers  ││   │
│  │  └────────────────────────────────────────────────────────┘│   │
│  │                                                              │   │
│  │  ┌── Update Loop ───────────────────────────────────────────┐│  │
│  │  │ Priority: Splash > Onboarding > Dialog > Modal > Global  ││  │
│  │  │           > Plugin-Specific                              ││  │
│  │  │                                                          ││  │
│  │  │ Messages: Init, Tick, Claude*, Signal*, Story*, Navigate ││  │
│  │  └──────────────────────────────────────────────────────────┘│  │
│  │                                                              │   │
│  │  ┌── View System ──────────────────────────────────────────┐│   │
│  │  │ App Shell (Tabs + Sidebar + Footer)                     ││   │
│  │  │  ├─ Tab Bar (Powerline or Compact)                      ││   │
│  │  │  ├─ Plugin Content Area (responsive width)              ││   │
│  │  │  ├─ Sidebar (≥120 cols: logo, exec info, files, gates) ││   │
│  │  │  └─ Footer (key hints + powerline accent bar)           ││   │
│  │  │ Modal Overlay (centered, dimmed background)             ││   │
│  │  │ Dialog Layer (permission/confirmation — highest z)      ││   │
│  │  └────────────────────────────────────────────────────────┘│   │
│  │                                                              │   │
│  │  ┌── Plugins (10) ─────────────────────────────────────────┐│   │
│  │  │ Home · Research · Plans · Spectrum · Files              ││   │
│  │  │ Git · Agent · Monitor · Workspaces · Onboarding        ││   │
│  │  └────────────────────────────────────────────────────────┘│   │
│  │                                                              │   │
│  │  ┌── Overlays ─────────────────────────────────────────────┐│   │
│  │  │ Command Palette (:)  · File Finder (Ctrl+P)            ││   │
│  │  │ Content Search (Ctrl+S)  · Help Modal (?)              ││   │
│  │  └────────────────────────────────────────────────────────┘│   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─── Supporting Packages ──────────────────────────────────────┐   │
│  │                                                               │   │
│  │  domain/        Story parsing, signal detection, progress     │   │
│  │  claude/        Runner, streaming, event parsing, output parse│   │
│  │  plugin/        Plugin interface, registry, context, events   │   │
│  │  prism/         3D FauxGL renderer + framebuffer              │   │
│  │  splash/        Full-screen animated splash with mesh data    │   │
│  │  styles/        Theme, gradients, powerline, borders, icons   │   │
│  │  terminal/      Font detection, IDE detection, color probing  │   │
│  │  modal/         Modal system (sections, inputs, lists)        │   │
│  │  dialog/        Permission dialogs, confirmations             │   │
│  │  ui/            Panes, dividers, scrollbars                   │   │
│  │  diff/          Unified diff parser + syntax highlighting     │   │
│  │  markdown/      Glamour-based markdown rendering              │   │
│  │  state/         Persistent state management                   │   │
│  │  registry/      Global project registry (workspaces.json)     │   │
│  │  watcher/       fsnotify file system watcher                  │   │
│  └───────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### 9.3 Plugin System

```
Plugin Interface
────────────────

type Plugin interface {
    ID() string                            // "home", "spectrum", etc.
    Name() string                          // Display name
    Icon() string                          // Tab emoji/icon
    Init(ctx *Context) error               // Initialize with shared context
    Start() tea.Cmd                        // Called when activated
    Stop()                                 // Called when deactivated
    Update(msg tea.Msg) (Plugin, tea.Cmd)  // Handle messages
    View(width, height int) string         // Render content
    IsFocused() bool                       // Is this plugin active?
    SetFocused(focused bool)               // Set focus state
    KeyHints() []KeyHint                   // Footer key hints
}

Plugin Registry
───────────────

  Register() → Enforces unique IDs
  Broadcast() → Send message to ALL plugins
  SetActive() → Switch visible plugin
  Reinit() → On project switch (new epoch)
  UpdateContext() → Refresh shared state
```

### 9.4 Ten Registered Plugins

```
Tab #  Plugin ID      Lines    Purpose
─────  ──────────     ─────    ───────────────────────────────────
  1    home           ~200     Dashboard with shortcuts
  2    research       ~300     Browse .prism/shared/research/*.md
  3    plans          ~300     Browse .prism/shared/plans/*.md
  4    spectrum       1218     Autonomous execution dashboard
  5    files          1407     Project file tree + viewer + editor
  6    git            1530     Git status, stage, diff, commit, branch
  7    agent          1051     Chat interface for Claude interaction
  8    monitor        ~200     Execution history + quality gate status
  9    workspaces     1981     Multi-project management + worktrees
 10    onboarding     ~400     Interactive setup wizard
```

### 9.5 Spectrum Plugin Detail (Largest)

```
┌──────── SPECTRUM PLUGIN (1218 lines) ────────────────────────────┐
│                                                                   │
│  ┌── Story List ──────────────────────────────────────────────┐  │
│  │ STORY-001  ✓ Create type definitions          [complete]   │  │
│  │ STORY-002  ✓ Implement auth service           [complete]   │  │
│  │ STORY-003  ▶ Add password validation          [in_progress]│  │
│  │ STORY-004  · Integration tests                [pending]    │  │
│  │ STORY-005  · API documentation                [pending]    │  │
│  │                                        Page 1/1 (12/page) │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌── Progress Bar (spring physics) ──────────────────────────┐   │
│  │ ████████████████████░░░░░░░░░░░░░░░░░░░ 60% (3/5)        │   │
│  │ ↑ overshoots then settles via harmonica.Spring            │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌── Live Log ────────────────────────────────────────────────┐  │
│  │ 14:23:01  Reading: src/auth/validator.ts                   │  │
│  │ 14:23:03  Editing: src/auth/validator.ts                   │  │
│  │ 14:23:05  Running: npm run typecheck                       │  │
│  │ 14:23:08  Agent: codebase-analyzer                         │  │
│  │ 14:23:12  ✓ Quality gates passed                           │  │
│  │ 14:23:14  [STORY-003] committed: abc1234                   │  │
│  │                                        Page 1/1 (6/page)  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Animations:                                                      │
│  • Progress bar: Spring overshoot on story completion             │
│  • Story pop: Scale 0.8 → 1.2 → 1.0 on completion               │
│  • Log slide-in: New entries slide from right                     │
│  • Pulse: Active story "breathes" via sine wave                   │
│  • Shimmer: Brightness oscillation on accent elements             │
└───────────────────────────────────────────────────────────────────┘
```

### 9.6 Claude Runner — Streaming Architecture

```
┌──────── CLAUDE RUNNER (claude/ package) ────────────────────────┐
│                                                                  │
│  RunClaudeStreamingCmd()                                         │
│  │                                                               │
│  ├─ Construct command:                                           │
│  │  claude --dangerously-skip-permissions --print                │
│  │         --output-format stream-json --verbose                 │
│  │         "Execute next story from <path>..."                   │
│  │                                                               │
│  ├─ Spawn subprocess with piped I/O                              │
│  │                                                               │
│  ├─ Stream-JSON Event Parsing:                                   │
│  │  ┌─────────────────────────────────────────────┐             │
│  │  │ Event Type     │ Extracted Info              │             │
│  │  ├────────────────┼────────────────────────────┤             │
│  │  │ assistant      │ Text content, thinking      │             │
│  │  │ tool_use       │ Tool name, file path, cmd   │             │
│  │  │ tool_result    │ Return value                │             │
│  │  │ result         │ Final output, cost, tokens  │             │
│  │  └─────────────────────────────────────────────┘             │
│  │                                                               │
│  ├─ Tool Activity Humanization:                                  │
│  │  Read   → "Reading: filename"                                 │
│  │  Edit   → "Editing: filename"                                 │
│  │  Write  → "Writing: filename"                                 │
│  │  Bash   → "Running: command..."                               │
│  │  Glob   → "Finding: pattern"                                  │
│  │  Grep   → "Searching: pattern"                                │
│  │  Task   → "Agent: description"                                │
│  │                                                               │
│  ├─ Output Parser (Phase Detection):                             │
│  │  "research"/"exploring" → Research Phase                      │
│  │  "planning"/"designing" → Planning Phase                      │
│  │  "implementing"/"editing" → Implementation Phase              │
│  │  "quality gate"/"npm run" → Quality Gates Phase               │
│  │  "commit"/"git add" → Committing Phase                        │
│  │                                                               │
│  └─ Signal Detection (Regex):                                    │
│     <promise>COMPLETE</promise>  → SignalComplete                │
│     <spectrum-continue>          → SignalContinue                │
│     <spectrum-retry>             → SignalRetry                   │
│     <spectrum-blocked>           → SignalBlocked                 │
│     <spectrum-error>             → SignalError                   │
└──────────────────────────────────────────────────────────────────┘
```

### 9.7 3D Prism Renderer

```
┌──────── 3D PRISM RENDERER (prism/ package) ─────────────────────┐
│                                                                  │
│  Embedded Assets:                                                │
│  • prism-test.obj (3D mesh, via //go:embed)                      │
│  • prism-test.mtl (materials, via //go:embed)                    │
│                                                                  │
│  Pipeline:                                                       │
│  1. Load OBJ/MTL from embedded data to temp dir                  │
│  2. Parse with FauxGL → normalize to unit cube                   │
│  3. Each frame (30 FPS):                                         │
│     a. Set up 3D projection matrix                               │
│     b. Compute rotation (0.6 rad/s + 0.15 tilt)                 │
│     c. Apply dual lighting:                                      │
│        • Key: Cool (0.9, 0.92, 1.0) @ 0.85 intensity            │
│        • Fill: Warm (1.0, 0.85, 0.7) @ 0.3 intensity            │
│     d. Render to pixel buffer                                    │
│     e. Encode as half-block characters (▀▄)                      │
│     f. Output ANSI 24-bit true color                             │
│                                                                  │
│  Each terminal row = 2 pixels vertically                         │
│  Color: \x1b[38;2;R;G;Bm (fg) + \x1b[48;2;R;G;Bm (bg)         │
└──────────────────────────────────────────────────────────────────┘
```

### 9.8 Build System

```
Makefile targets:
─────────────────

  make build       → Build for current platform
  make build-all   → Cross-compile for 6 targets:
                     windows/amd64, windows/arm64
                     darwin/amd64,  darwin/arm64
                     linux/amd64,   linux/arm64
  make test        → go test -v ./...
  make lint        → golangci-lint run
  make install     → Install to $GOPATH/bin
  make run ARGS=.. → Development run
  make clean       → Remove build artifacts

Version injection: -ldflags "-X main.version=2.1.8"
```

---

## 10. Plugin Directory Structure

### 10.1 Full File Tree

```
prism-plugin/
├── .claude-plugin/
│   ├── plugin.json                    # Plugin manifest (name, version, description)
│   └── marketplace.json               # Marketplace metadata
│
├── .claude/
│   └── settings.local.json            # Local permission overrides
│
├── CLAUDE.md                          # Project-level instructions for Claude
├── CHANGELOG.md                       # Version history
├── README.md                          # Full documentation
├── .gitignore                         # Excludes .prism/shared/ref/, bin/, *.exe
│
├── agents/                            # 9 agent definitions
│   ├── codebase-analyzer.md
│   ├── codebase-locator.md
│   ├── codebase-pattern-finder.md
│   ├── git-investigator.md
│   ├── log-investigator.md
│   ├── prism-analyzer.md
│   ├── prism-locator.md
│   ├── state-investigator.md
│   └── web-search-researcher.md
│
├── commands/                          # 22 command files
│   ├── cli-install.md
│   ├── cli-uninstall.md
│   ├── commit.md
│   ├── create_handoff.md
│   ├── create_plan.md
│   ├── decompose_plan.md
│   ├── describe_pr.md
│   ├── generate_prd.md
│   ├── generate_pricing.md
│   ├── generate_tech_spec.md
│   ├── generate_user_flows.md
│   ├── implement_plan.md
│   ├── iterate_plan.md
│   ├── prism_cli.md
│   ├── prism_dir_update.md
│   ├── prism-debug.md
│   ├── research_codebase.md
│   ├── resume_handoff.md
│   ├── retroactive.md
│   ├── review-setup.md
│   ├── validate_plan.md
│   └── worktree.md
│
├── skills/                            # 10 skill directories
│   ├── prism/
│   │   ├── SKILL.md
│   │   ├── references/workflow-patterns.md
│   │   └── scripts/init_prism.py
│   ├── prism-debug/SKILL.md
│   ├── prism-implement/SKILL.md
│   ├── prism-iterate/SKILL.md
│   ├── prism-plan/
│   │   ├── SKILL.md
│   │   └── references/plan-template.md
│   ├── prism-prd/SKILL.md
│   ├── prism-research/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── exploration-patterns.md
│   │       └── research-template.md
│   ├── prism-spectrum/SKILL.md
│   ├── prism-validate/
│   │   ├── SKILL.md
│   │   └── references/validation-template.md
│   └── prism-visual-docs/SKILL.md
│
├── scripts/                           # Automation scripts
│   ├── spectrum.sh
│   ├── prism-cli-install.sh
│   ├── prism-cli-install.ps1
│   └── tests/
│       ├── test_install.sh
│       └── prism-cli-install.bats
│
├── cmd/                               # Applications
│   ├── prism-cli/                     # Go TUI Dashboard (~84 .go files)
│   │   ├── main.go
│   │   ├── Makefile
│   │   ├── go.mod
│   │   ├── app/                       # Core application
│   │   │   ├── model.go, update.go, view.go, views.go
│   │   │   ├── shell.go, sidebar.go, footer.go
│   │   │   ├── plugin_home.go
│   │   │   ├── plugin_research.go
│   │   │   ├── plugin_plans.go
│   │   │   ├── plugin_spectrum.go    # 1218 lines (largest)
│   │   │   ├── plugin_files.go       # 1407 lines
│   │   │   ├── plugin_git.go         # 1530 lines
│   │   │   ├── plugin_agent.go       # 1051 lines
│   │   │   ├── plugin_monitor.go
│   │   │   ├── plugin_workspaces.go  # 1981 lines
│   │   │   ├── plugin_onboarding.go
│   │   │   ├── messages.go, commands.go
│   │   │   ├── command_palette.go, file_finder.go
│   │   │   ├── content_search.go
│   │   │   ├── adapter/              # Claude integration
│   │   │   └── chat/                 # Chat rendering
│   │   ├── domain/                    # Story, signal, progress parsing
│   │   ├── claude/                    # Runner, events, parser
│   │   ├── plugin/                    # Plugin interface & registry
│   │   ├── prism/                     # 3D renderer + framebuffer
│   │   ├── splash/                    # Animated splash screen
│   │   ├── styles/                    # Theme, gradients, icons
│   │   ├── terminal/                  # Capability detection
│   │   ├── modal/                     # Modal system
│   │   ├── dialog/                    # Permission dialogs
│   │   ├── ui/                        # Reusable components
│   │   ├── diff/                      # Diff parsing & highlighting
│   │   ├── markdown/                  # Glamour markdown rendering
│   │   ├── state/                     # Persistent state
│   │   ├── registry/                  # Global workspace registry
│   │   └── watcher/                   # File system watcher
│   │
│   └── prism-electron/                # Electron desktop app (supplementary)
│
├── .prism/                            # Prism framework storage
│   ├── stories/                       # stories.json files
│   ├── shared/                        # Committed to repo
│   │   ├── research/                  # YYYY-MM-DD-topic.md
│   │   ├── plans/                     # YYYY-MM-DD-feature.md
│   │   ├── validation/                # YYYY-MM-DD-report.md
│   │   ├── handoffs/                  # Session handoff documents
│   │   ├── prs/                       # PR descriptions
│   │   ├── spectrum/                  # progress.md (execution state)
│   │   ├── ref/                       # Reference materials (gitignored)
│   │   └── docs/                      # Project documentation
│   └── local/                         # Gitignored, per-developer
│
├── .crush/                            # Crush framework integration
│   ├── commands/
│   └── logs/
│
└── .github/
    └── workflows/                     # CI/CD pipelines
```

---

## 11. Document Generation Flow

```
┌──────────── DOCUMENT GENERATION WORKFLOW ────────────────────────┐
│                                                                   │
│  1. Product Requirements                                          │
│     /prism-prd → /generate_prd                                    │
│     Output: [PRODUCT]-PRD.md                                      │
│                                                                   │
│  2. Visual Documentation (optional, from PRD)                     │
│     /prism-visual-docs → /generate_user_flows                     │
│                        → /generate_tech_spec                      │
│     Output: [PRODUCT]-USER-FLOWS.md                               │
│             [PRODUCT]-TECHNICAL-SPEC.md                           │
│                                                                   │
│  3. Pricing (optional, from PRD)                                  │
│     /generate_pricing                                             │
│     Output: [PROJECT]-PRICING.md                                  │
│                                                                   │
│  4. Implementation Plan (from PRD + visual docs)                  │
│     /prism-plan → /create_plan                                    │
│     Output: .prism/shared/plans/YYYY-MM-DD-feature.md             │
│                                                                   │
│  ┌────────────────────────────────────────────────┐               │
│  │    PRD ──────────► User Flows ──┐              │               │
│  │     │               Tech Spec ──┤              │               │
│  │     │               Pricing ────┤              │               │
│  │     └───────────────────────────┴──► Plan      │               │
│  └────────────────────────────────────────────────┘               │
└───────────────────────────────────────────────────────────────────┘
```

---

## 12. .prism/ Directory — The AI's Long-Term Memory

```
┌────────── .prism/ — Persistent Knowledge Store ─────────────────┐
│                                                                  │
│  .prism/stories/                                                 │
│  └── stories.json              ← Task definitions for Spectrum   │
│  └── <epic>/stories.json       ← Epic-scoped stories             │
│                                                                  │
│  .prism/shared/  (committed to repo)                             │
│  ├── research/                 ← Phase 1 output                  │
│  │   └── YYYY-MM-DD-topic.md  ← Codebase exploration findings   │
│  ├── plans/                    ← Phase 2 output                  │
│  │   └── YYYY-MM-DD-feature.md ← Implementation contracts       │
│  ├── validation/               ← Phase 4 output                 │
│  │   └── YYYY-MM-DD-report.md  ← Verification reports           │
│  ├── handoffs/                 ← Session continuity              │
│  │   └── YYYY-MM-DD_HH-MM-SS_desc.md ← Context transfer docs   │
│  ├── prs/                      ← PR documentation               │
│  │   └── {number}_description.md                                 │
│  ├── spectrum/                 ← Autonomous execution state      │
│  │   └── progress.md           ← Accumulated learnings           │
│  │   └── <epic>/progress.md    ← Epic-scoped learnings           │
│  ├── ref/                      ← Reference materials (gitignored)│
│  └── docs/                     ← Project documentation           │
│                                                                  │
│  .prism/local/  (gitignored, per-developer)                      │
│  └── ref/, docs/               ← Personal notes & references     │
│                                                                  │
│  KEY PRINCIPLE:                                                   │
│  "Files are the AI's long-term memory."                          │
│  Memory persists through files and git commits,                  │
│  not AI context.                                                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 13. Context Management Strategy

```
┌──────── CONTEXT WINDOW MANAGEMENT ──────────────────────────────┐
│                                                                  │
│  ┌─────────────────────────────────────────────────┐            │
│  │  0%─────────40%────────60%─────────────100%     │            │
│  │  │           │          │                │      │            │
│  │  │  SAFE     │ CONSIDER │   SAVE STATE   │      │            │
│  │  │ Continue  │ Phase    │   Start fresh   │      │            │
│  │  │ working   │ transition│   session      │      │            │
│  │  │           │          │                │      │            │
│  └─────────────────────────────────────────────────┘            │
│                                                                  │
│  < 40%  → Continue working freely                                │
│  40-60% → Consider phase transition or handoff                   │
│  > 60%  → Save state to .prism/, start fresh session             │
│                                                                  │
│  SPECTRUM SOLUTION:                                              │
│  Fresh Claude session per story = no context degradation         │
│  State persists through files (stories.json, progress.md)        │
│  Each iteration gets clean context window                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## 14. Inter-Component Communication

### 14.1 Full Dependency Graph

```
┌──────────── COMPONENT DEPENDENCY GRAPH ─────────────────────────┐
│                                                                  │
│  SKILLS invoke COMMANDS:                                         │
│  ─────────────────────                                           │
│  prism-prd         → /generate_prd                               │
│  prism-visual-docs → /generate_user_flows, /generate_tech_spec   │
│  prism-implement   → /commit, /validate_plan, /describe_pr       │
│                                                                  │
│  SKILLS spawn AGENTS via Task():                                 │
│  ────────────────────────────────                                │
│  prism-research    → locator, analyzer, pattern-finder,          │
│                      prism-locator, prism-analyzer, web-search   │
│  prism-plan        → prism-analyzer, codebase-analyzer,          │
│                      codebase-pattern-finder                     │
│  prism-debug       → log-investigator, state-investigator,       │
│                      git-investigator                            │
│  prism-spectrum    → (debug agents on quality gate failure)       │
│  prism-prd         → prism-locator, web-search-researcher        │
│  prism-visual-docs → prism-locator                               │
│                                                                  │
│  COMMANDS spawn AGENTS via Task():                               │
│  ─────────────────────────────────                               │
│  /research_codebase → locator, analyzer, pattern-finder,         │
│                       prism-locator, prism-analyzer, web-search  │
│  /create_plan       → locator, analyzer, prism-locator,          │
│                       pattern-finder                             │
│  /iterate_plan      → locator, analyzer, pattern-finder,         │
│                       prism-locator, prism-analyzer (conditional)│
│  /prism-debug       → log/state/git investigators (parallel)     │
│  /validate_plan     → parallel validation agents (conditional)   │
│  /resume_handoff    → artifact context agents (conditional)      │
│                                                                  │
│  SCRIPTS orchestrate SKILLS:                                     │
│  ───────────────────────────                                     │
│  spectrum.sh        → prism-spectrum (via claude CLI)             │
│                                                                  │
│  CLI runs SCRIPTS:                                               │
│  ─────────────────                                               │
│  prism-cli          → spectrum.sh (via claude subprocess)         │
│  /cli-install       → prism-cli-install.sh / .ps1                │
└──────────────────────────────────────────────────────────────────┘
```

### 14.2 Data Flow Through .prism/

```
┌──────────── DATA FLOW THROUGH .prism/ ──────────────────────────┐
│                                                                  │
│  /prism-research ──────write──────► .prism/shared/research/      │
│        │                                    │                    │
│        └─── prism-locator reads ◄───────────┘                    │
│                                                                  │
│  /prism-plan ──────────write──────► .prism/shared/plans/         │
│        │                                    │                    │
│        └─── prism-analyzer reads ◄──────────┘                    │
│                                                                  │
│  /decompose_plan ──────write──────► .prism/stories/stories.json  │
│                    ────write──────► .prism/shared/spectrum/       │
│                                           progress.md            │
│                                                                  │
│  spectrum.sh ──────────read───────► .prism/stories/stories.json  │
│  (via prism-spectrum)                                            │
│                    ────read/write──► .prism/shared/spectrum/      │
│                                           progress.md            │
│                    ────write──────► .prism/stories/stories.json   │
│                                     (update status)              │
│                                                                  │
│  /prism-validate ──────write──────► .prism/shared/validation/    │
│                                                                  │
│  /create_handoff ──────write──────► .prism/shared/handoffs/      │
│  /resume_handoff ──────read───────► .prism/shared/handoffs/      │
│                                                                  │
│  /describe_pr ─────────write──────► .prism/shared/prs/           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 15. Key Principles Summary

```
┌──────────── PRISM CORE PRINCIPLES ──────────────────────────────┐
│                                                                  │
│  1. DOCUMENTARIAN, NOT CRITIC                                    │
│     All research agents only describe what exists.               │
│     No suggestions, critiques, or improvements unless asked.     │
│                                                                  │
│  2. INTERACTIVE PLANNING                                         │
│     Present understanding first → get feedback → iterate.        │
│     Never write a full plan in one shot.                         │
│     Resolve ALL unknowns before finalizing.                      │
│                                                                  │
│  3. TWO-CATEGORY SUCCESS CRITERIA                                │
│     Automated Verification: runnable commands (npm test, etc.)   │
│     Manual Verification: human testing (UI works, etc.)          │
│                                                                  │
│  4. FRESH CONTEXT PER ITERATION                                  │
│     Spectrum gives each story a new Claude session.              │
│     Memory persists through files, not AI context.               │
│                                                                  │
│  5. QUALITY GATES MANDATORY                                      │
│     No commits without passing all verification.                 │
│     Auto-debug when gates fail in Spectrum.                      │
│                                                                  │
│  6. ONE THING AT A TIME                                          │
│     One phase per implement session.                             │
│     One story per Spectrum session.                              │
│     Stop at checkpoints for approval.                            │
│                                                                  │
│  7. EXPLICIT SCOPE                                               │
│     Always define "What We're NOT Doing".                        │
│     Track open questions via TodoWrite.                          │
│                                                                  │
│  8. FILES ARE MEMORY                                             │
│     .prism/ directory is the AI's long-term memory.              │
│     Everything important persists as markdown files.             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 16. Version History

| Version | Date | Key Changes |
|---------|------|-------------|
| 2.1.8 | Current | Latest stable release |
| 2.0.0 | 2026-02-10 | BREAKING: Renamed `ralph` → `spectrum`, `thoughts/` → `.prism/`, added CLI dashboard with 3D rendering |

---

## Code References

- Plugin manifest: `.claude-plugin/plugin.json`
- Main hub skill: `skills/prism/SKILL.md`
- Spectrum executor: `skills/prism-spectrum/SKILL.md` (354 lines — largest skill)
- CLI entry point: `cmd/prism-cli/main.go`
- Spectrum plugin: `cmd/prism-cli/app/plugin_spectrum.go` (1218 lines)
- Workspaces plugin: `cmd/prism-cli/app/plugin_workspaces.go` (1981 lines — largest plugin)
- Signal detection: `cmd/prism-cli/domain/signals.go`
- Claude runner: `cmd/prism-cli/claude/runner.go`
- Spectrum orchestrator: `scripts/spectrum.sh` (313 lines)
- Directory initializer: `skills/prism/scripts/init_prism.py` (175 lines)

---

## Open Questions

- No hooks (`hooks/hooks.json`) or MCP servers (`.mcp.json`) are currently configured — potential future extension points
- The `cmd/prism-electron/` directory exists for an Electron desktop app but was not deeply analyzed in this research
- The `.crush/` directory contains Crush framework integration commands and logs — a separate integration worth documenting
