---
title: Skills Reference
description: All 28 Prism skills — auto-discovered workflow orchestrators with YAML frontmatter trigger patterns.
outline: [2, 3]
---

# Skills Reference

Skills live at `skills/*/SKILL.md` and are auto-discovered workflow orchestrators. They activate automatically based on trigger patterns in user messages or are invoked explicitly via `/skill-name`.

## Core Workflow Skills

| # | Skill | Lines | Model | Trigger Patterns |
|---|-------|-------|-------|-----------------|
| 1 | `prism` | 276 | **sonnet** | "help me build", "implement this feature", "fix this bug", "prism", "structured workflow" |
| 2 | `prism-research` | 121 | **sonnet** | "research this", "understand how X works", "map out the system", "explore the codebase" |
| 3 | `prism-plan` | 126 | **opus** | "create a plan", "plan the implementation", "design how to build" |
| 4 | `prism-implement` | 122 | **sonnet** | "implement the plan", "start building", "execute phase 1" |
| 5 | `prism-validate` | 108 | **sonnet** | "validate the plan", "verify implementation", "check if complete" |
| 6 | `prism-iterate` | 103 | **opus** | "iterate on plan", "update and continue", "adjust the approach" |

## Specialized Skills

| # | Skill | Lines | Model | Trigger Patterns |
|---|-------|-------|-------|-----------------|
| 7 | `prism-debug` | 221 | **sonnet** | "debug this", "why is this failing", "investigate the error" |
| 8 | `prism-spectrum` | 254 | **sonnet** | "spectrum", "execute story", "run spectrum" |
| 9 | `prism-verify` | 125 | **sonnet** | "verify the UI", "check the browser", "visual verification" |
| 10 | `prism-prd` | 122 | **opus** | "create a PRD", "write product requirements", "document this product" |
| 11 | `prism-visual-docs` | 146 | **opus** | "create user flows", "design the screens", "create wireframes" |
| 12 | `prism-bookend` | ~80 | **sonnet** | "bookend", "wrap up this release", "finalize release", "close out the version" |

**`prism-bookend`** (v3.1.0) orchestrates the end-of-release ritual: re-analyzes the diff since the last release tag, suggests the correct semver bump, generates a CHANGELOG entry from conventional commits, and offers to run `/prism-release`. Distinct from `/prism-finish` (branch → main) — bookend operates on the full release scope.

### Design & Completion Skills (v3.0.1)

| # | Skill | Lines | Model | Trigger Patterns |
|---|-------|-------|-------|-----------------|
| 13 | `prism-capture` | 112 | **sonnet** | "I have references", "let me show you what I'm drawn to", "capture this inspiration", "triage my references", "let me share my inspo" |
| 14 | `prism-brainstorm` | ~90 | **opus** | "brainstorm this", "design options", "explore approaches", "let's think about" |
| 15 | `prism-brand` | 97 | **opus** | "logo ideation", "brand identity", "design system", "what should the wordmark look like" |
| 16 | `prism-design` | ~80 | **opus** | "design this", "create a design", "design the architecture" |
| 17 | `prism-finish` | ~100 | **sonnet** | "finish this branch", "ready to merge", "create PR", "clean up branch" |

**`prism-capture`** codifies design inspiration into a structured capture ledger that `prism-brainstorm` reads as pre-loaded context instead of starting from scratch. Three stages — Genesis (what + where) → Triage (categorize as active / reference / parked) → Translate (render source vs Griotwave side-by-side in the visual companion). Outputs to `.prism/shared/captures/YYYY-MM-DD-<topic>.md`. Precedes `prism-brainstorm`.

**`prism-brainstorm`** includes a browser-based **Visual Companion** — a zero-dependency Node.js HTTP/WebSocket server that serves interactive HTML mockups for A/B design choices. User clicks are captured as JSONL events.

**`prism-brand`** is a three-phase brand identity workflow: Ideation (12 divergent single-colour logo seeds at `lo` fidelity) → Refinement (2–3 seeds developed) → System (color, type, and motion tokens locked). Each phase gates on explicit user approval. Writes a brand spec to `.prism/shared/designs/YYYY-MM-DD-<topic>-brand.md` that `prism-design` consumes. Follows `prism-brainstorm`; precedes `prism-design`.

**`prism-design`** bridges research and planning — it produces architectural decisions, interface contracts, and visual documentation that the planning phase turns into tasks.

**`prism-finish`** presents 4 structured options: merge locally, push and create PR, keep as-is, or discard (requires confirmation).

### Setup & Utility Skills (v3.0.3)

| # | Skill | Lines | Model | Trigger Patterns |
|---|-------|-------|-------|-----------------|
| 18 | `prism-init` | 53 | **haiku** | "init prism", "set up prism", "initialize prism", "create .prism folder" |

**`prism-init`** wraps `init_prism.py` to initialize the `.prism/` directory structure in any project. Creates 15 directories including `designs/` (Figma/Pencil.dev files) and `assets/` (AI-generated images, videos, 3D models), updates `.gitignore`, and optionally adds a Prism section to `CLAUDE.md`.

### Release, Eval & Docs Skills (v2.5.0)

| # | Skill | Lines | Model | Trigger Patterns |
|---|-------|-------|-------|-----------------|
| 19 | `prism-release` | 245 | — | "release", "bump version", "new version", "cut a release" |
| 20 | `prism-eval` | 237 | **sonnet** | "run evals", "compare versions", "benchmark skills", "evaluate v2.5.0", "regression check" |
| 21 | `prism-docs-update` | 138 | — | "update prism docs", "sync docs site", "update documentation site" |
| 22 | `prism-closing-ceremony` | 35 | — | "closing ceremony", "close out the release", "run the ceremonies", "docs + bookend + release", "ship vX.Y.Z" |

**`prism-closing-ceremony`** runs the full end-of-cycle ceremony in one fail-fast pass instead of four separate asks: a **Review & Audit gate** — an independent two-stage `spec-reviewer` → `quality-reviewer` review of the diff since the last version tag plus the deterministic `pre-release-audit.mjs` best-practices audit, which must come back clean — then `prism-bookend` → `prism-docs-update` → `prism-release` in that order. Each sub-skill's own gates (push, GitHub release, native builds) are honored.

### Subagent Execution Skills (v3.2.0)

| # | Skill | Lines | Model | Trigger Patterns |
|---|-------|-------|-------|-----------------|
| 23 | `prism-subagent` | ~85 | **opus** | "subagent execute", "drive this plan with subagents", "dispatch implementers", "subagent driven development" |
| 24 | `prism-dispatch` | ~140 | **sonnet** | "fan out", "parallel agents", "investigate in parallel", "multiple unrelated failures", "split this work across agents" |

**`prism-subagent`** fills the medium-tier execution gap between `prism-implement` (single phase) and `prism-spectrum` (10+ stories, autonomous overnight). For 3–10 task plans where Spectrum is overkill, it dispatches a fresh implementer subagent per task with two-stage review (`spec-reviewer` then `quality-reviewer`), bounded retries, and compaction-survivable `state.json`. Innovations include domain-aware context priming (R3F / Electron / fullstack / experimental primers), diff-only reviews, a 5-status protocol with `NEEDS_CLARIFICATION` distinct from `NEEDS_CONTEXT`, a 9-class review decision matrix with explicit skip rules, repeated-issue and no-op spin loop detectors, automatic model escalation ladders, and 3-cycle hard caps on retries. Reuses `agents/spec-reviewer.md` and `agents/quality-reviewer.md` verbatim. **v3.4.0:** Iron law added — "NEVER FORWARD PARENT SESSION HISTORY" with subagent role audit table classifying all dispatched agents as cross-entity role executors.

**`prism-dispatch`** generalizes the parallel agent fan-out pattern for ad-hoc use, sibling to `prism-research` (fixed agent roster) and `prism-debug` (fixed 3-agent flow). Use when facing 2+ independent problem domains that can be investigated or fixed concurrently without shared state. Includes when-to-use decision flow, sibling-skills disambiguation table, per-agent model selection guidance, and explicit anti-patterns (fan-out stampede capped at 5 agents per dispatch; hidden sequential dependencies via file-overlap audit). **v3.4.0:** Context Isolation section added with "cold prompt test" — every subagent prompt must be fully actionable cold, with no parent session history baked in.

**Execution-models table:**

| Scope | Skill |
|---|---|
| Single phase / quick fix | `/prism-implement` |
| 3–10 tasks, mostly independent, stay in session | `/prism-subagent` |
| 10+ stories, autonomous overnight | `/prism-spectrum` |
| Large spec → epics → spectrum | `/prism-decompose` → `/prism-spectrum` |
| Parallel investigation of unrelated failures | `/prism-debug` |

### Greenfield Decomposition Skills (v3.4.0)

| # | Skill | Lines | Model | Trigger Patterns |
|---|-------|-------|-------|-----------------|
| 25 | `prism-decompose` | ~120 | **opus** | "decompose this spec", "turn this into stories", "epic this", "break down this spec" |

**`prism-decompose`** (v3.4.0) turns a large specification (500k+ tokens) into a structured spectrum work queue. Process: read full spec → parse every behavioral requirement → bundle into epics (each ≤200K context for a single spectrum run) → emit `stories.json` + `coverage.md` per epic. The coverage report is mandatory — it maps every spec requirement to a story ID, guaranteeing zero requirement drop during chunking. Graph-informed risk ordering: when `codebase-memory-mcp` is available, blast radius from `trace_call_path` determines story ordering within each epic. Distinct from the `decompose_plan` command (which turns an approved Prism plan into stories.json) — `prism-decompose` handles large, unstructured external specs.

### Plugin Authoring & Distribution Skills

| # | Skill | Lines | Model | Trigger Patterns |
|---|-------|-------|-------|-----------------|
| 26 | `cl-plugin-structure` | 285 | — | "create a plugin", "scaffold a plugin", "plugin structure", "set up plugin.json", "add a skill/command/hook/MCP server", "marketplace" |
| 27 | `fragment-sync` | 56 | — | "sync fragment", "update fragment", "fragment fell behind", "conform fragment", "fragment is stale" |
| 28 | `prism-sideload` | 40 | — | "sideload", "upload plugin to Cowork", "Cowork won't update the plugin", "/prism-sideload" |

**`cl-plugin-structure`** is the plugin-authoring gold standard for Claude Code and Cowork — it covers the `.claude-plugin/plugin.json` + marketplace manifest, component organization (agents, skills, slash commands, hooks, MCP/LSP servers, channels), agent/command/hook frontmatter, the `.local.md` per-project settings pattern, portable paths, per-surface compatibility (Claude Code vs Cowork), the local stdio-server hygiene standard, and bundled validator scripts. Ships 12 reference docs, three worked examples (minimal / standard / advanced), and six validator scripts.

**`fragment-sync`** reconciles **Fragment** (the `create-fragment` scaffolder / `fragment-plugin`) back to the current `cl-plugin-structure` / Prism standard whenever it drifts. It is the spec → generator conformance bridge — `cl-plugin-structure` is the source of truth, Fragment is downstream — driven by a conformance checklist (items B1–B10, including B10's local stdio MCP-server hygiene standard) so scaffolded projects keep emitting "Prism-image" output.

**`prism-sideload`** builds a lean, Cowork-uploadable sideload zip of the Prism plugin (tracked components at `HEAD`, via `build-sideload.py`) to bypass Cowork's GitHub-sync path — which caches plugin content server-side and routinely ignores new commits, version bumps, and description edits. Runs in Claude Code (needs Bash + git); the zip is uploaded by hand in Claude Desktop's Cowork UI.

## Skill Subdirectory Contents

Each skill directory may contain supporting files:

```
skills/
├── prism/
│   ├── SKILL.md                         # 276 lines — master orchestrator
│   ├── references/
│   │   └── workflow-patterns.md         # Reusable workflow pattern library
│   └── scripts/
│       └── init_prism.py                # 185 lines — .prism/ directory initializer
├── prism-init/
│   └── SKILL.md                         # 53 lines — haiku (project init, wraps init_prism.py)
├── prism-research/
│   ├── SKILL.md                         # 121 lines
│   └── references/
│       ├── exploration-patterns.md      # Agent spawning patterns
│       └── research-template.md         # Output document template
├── prism-plan/
│   ├── SKILL.md                         # 126 lines
│   └── references/
│       └── plan-template.md             # Plan document structure
├── prism-validate/
│   ├── SKILL.md                         # 108 lines
│   └── references/
│       └── validation-template.md       # Validation report template
├── prism-verify/
│   ├── SKILL.md                         # 125 lines
│   └── references/
│       ├── verification-template.md     # Browser verification template
│       └── verification-patterns.md     # Playwright-cli patterns
├── prism-spectrum/
│   ├── SKILL.md                         # 406 lines — manifest-aware story execution
│   └── references/
│       ├── story-manifest-schema.md     # Per-requirement tracking schema
│       └── contracts-convention.md      # Cross-domain contract convention
├── prism-debug/SKILL.md                 # 221 lines
├── prism-implement/SKILL.md             # 122 lines
├── prism-iterate/SKILL.md               # 103 lines
├── prism-prd/SKILL.md                   # 122 lines
├── prism-visual-docs/SKILL.md           # 146 lines
├── prism-release/SKILL.md              # 245 lines — full release pipeline
├── prism-eval/
│   ├── SKILL.md                         # 237 lines — skill evaluation runner
│   └── references/
│       └── eval-schemas.md              # evals.json and benchmark.json schemas
├── prism-docs-update/
│   ├── SKILL.md                         # 138 lines — VitePress docs syncer
│   └── references/
│       └── section-mapping.md           # Monolithic doc → VitePress page mapping
├── prism-subagent/                      # v3.2.0 — same-session subagent-driven execution
│   ├── SKILL.md                         # ~85 lines — opus, decision flow + iron laws
│   └── references/                      # ~5500 tokens, on-demand
│       ├── dispatch-protocol.md         # implementer + reviewer dispatch templates
│       ├── status-protocol.md           # 5-status handling matrix
│       ├── review-decision-matrix.md    # 9 task classes with skip rules
│       ├── retry-ladder.md              # bounded retries + loop detectors
│       ├── state-schema.md              # state.json schema + recovery protocol
│       └── domain-hints.md              # R3F / Electron / fullstack / experimental
├── prism-dispatch/                      # v3.2.0 — generalized parallel fan-out
│   └── SKILL.md                         # ~140 lines — sonnet, ad-hoc parallel dispatch
├── prism-bookend/                       # v3.1.0 — end-of-release ritual
│   └── SKILL.md                         # ~80 lines — sonnet, release wrap-up + semver suggestion
├── prism-decompose/                     # v3.4.0 — Greenfield spec decomposition
│   └── SKILL.md                         # ~120 lines — opus, 500k+ spec → epic story queues
├── prism-capture/                       # design-inspiration capture (pre-brainstorm)
│   ├── SKILL.md                         # 112 lines — sonnet, Genesis → Triage → Translate
│   └── references/
│       ├── capture-sources.md           # source-selection guidance
│       └── translate-canvas.md          # translation-canvas fragment + fidelity rules
├── prism-brand/                         # brand identity workflow (post-brainstorm)
│   ├── SKILL.md                         # 97 lines — opus, Ideation → Refinement → System
│   └── references/
│       └── brand-system.md              # color derivation, type, motion, design_tokens
├── prism-closing-ceremony/              # one-pass Review & Audit → bookend → docs → release
│   ├── SKILL.md                         # 35 lines — sequential, fail-fast ceremony
│   └── references/
│       └── review-audit-gate.md         # two-stage review + best-practices audit
├── prism-sideload/                      # Cowork sideload zip (bypasses stale GitHub-sync)
│   ├── SKILL.md                         # 40 lines — build + hand-upload flow
│   ├── references/
│   │   └── cowork-sync-bug.md           # background + open-issue links
│   └── scripts/
│       └── build-sideload.py            # archives tracked plugin components at HEAD
├── fragment-sync/                       # reconcile Fragment generator to the standard
│   ├── SKILL.md                         # 56 lines — spec → generator conformance bridge
│   └── references/
│       └── conformance-checklist.md     # B1–B10 conformance items
└── cl-plugin-structure/                 # plugin-authoring gold standard (Claude Code + Cowork)
    ├── SKILL.md                         # 285 lines — plugin.json, components, hooks, MCP, stdio hygiene
    ├── CLAUDE.md                        # routing-table example
    ├── README.md
    ├── examples/                        # minimal · standard · advanced plugin examples
    ├── references/                      # 12 docs — manifest, components, hooks, MCP, Cowork compat…
    └── scripts/                         # 6 validators — hooks, agents, settings, frontmatter
```

## Skill Frontmatter Format

```markdown
---
name: skill-name
description: When to use this skill and trigger patterns
model: opus|sonnet|haiku
---

# Skill Title

Orchestration instructions: which agents to spawn, which commands to invoke,
what order to execute, how to present results to the user...
```

## Master Orchestrator: `prism`

The `prism` skill (276 lines) is the master orchestrator — it routes to all other skills:

```
User: "help me build a login form"
    │
    ▼
prism skill activates (trigger: "help me build")
    │
    ├── Detects task type → routes to appropriate phase
    │
    ├── If needs design work   → /prism-brainstorm → /prism-design
    ├── If unfamiliar codebase → /prism-research
    ├── If needs planning      → /prism-plan
    ├── If plan exists         → /prism-implement
    ├── If needs validation    → /prism-validate
    ├── If needs iteration     → /prism-iterate
    └── If work is complete    → /prism-finish
```
