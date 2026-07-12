# Prism - Complete Documentation v3.5.2

> A multi-platform development workflow suite for autonomous AI-driven development.
> Includes a Charmbracelet TUI dashboard (Go), a VS Code extension (TypeScript/React),
> and an Electron desktop app (TypeScript/React).

---

## What's New in 3.5.2

### Fixed

- **Spectrum approval hook latency bomb** — `scripts/spectrum-approval.sh` was polling for 30 s before auto-approving on every PreToolUse tool call in a spectrum worker session. A 40-tool-call story could spend ~20 min in pure sleep. Fixed by:
  - Adding an **unsupervised fast-path** (default): if `SPECTRUM_SUPERVISED` is unset, the hook exits 0 immediately with zero polling overhead. Supervision is now opt-in.
  - Making the poll timeout configurable via `SPECTRUM_APPROVAL_TIMEOUT` (default: 3 s, was hardcoded 30 s).
  - Updating `hooks.json` timeout from 35 s to 10 s to match the new default.

- **Approval hook env var wiring** — `SPECTRUM_SUPERVISED`, `SPECTRUM_APPROVAL_TIMEOUT`, and `PRISM_PROJECT_DIR` were implicit, relying on ambient shell env inheritance that breaks when the Claude worker's cwd drifts. All three are now explicit inline env vars in `run_iteration()` alongside `SPECTRUM_WORKER_STORY_ID`. Both new vars documented in `spectrum.sh` header with the hook-timeout constraint.

- **Portable `TMPDIR` for worker shim path** — `SHIM_DIR` was hardcoded to `/tmp/claude-spectrum-workers`. Now uses `${TMPDIR:-${TEMP:-${TMP:-/tmp}}}` (POSIX/macOS → Git Bash/Windows → Linux/WSL fallback). Supported shells documented in script header.

### Refactored

- **`progress.md` two-tier split** — `progress.md` was read in full by every worker session, growing to 20 K+ tokens by story 30 of 50. Split into two files:
  - **`progress.md`** — curated "Codebase Patterns (Consolidated)" only. Read every session. Stays lean (< 5 KB target).
  - **`progress-log.md`** — raw per-iteration entries. Append-only, never loaded on session start.
  - `spectrum.sh` creates both via `init_progress()` and names them explicitly in the worker prompt. `SKILL.md` Step 1 guards against loading the log; Step 7 routes iteration entries to `progress-log.md` and pattern discoveries to `progress.md` only.

---

## What's New in 3.5.0

### Added

- **`prism-capture` skill** — New upstream skill for the Capture → Triage → Translate pipeline. Codifies design inspiration references before brainstorming. Outputs a capture ledger to `.prism/shared/captures/` that `prism-brainstorm` reads as pre-loaded context instead of starting blank. Includes `references/capture-sources.md` (8 design sources with ingestion strategies + translatability guide) and `references/translate-canvas.md` (HTML fragment template for side-by-side source vs Griotwave translation with fidelity cascade).

- **`prism-brand` skill** — New brand identity workflow: Phase 1 Ideation (12 divergent logo seeds, maximum spread, single-colour silhouettes first), Phase 2 Refinement (2-3 seeds developed at mid fidelity), Phase 3 System (color derivation from ember, type pairing, motion language assignment). Outputs a brand spec to `.prism/shared/designs/` that feeds `prism-design`'s §3 token baseline. Includes `references/brand-system.md` (color derivation process, type pairing rules, motion language table, design_tokens override block format).

- **Claude Design as a `prism-design` output target** — `prism-design` now asks which visual layout tool at Step 2.5 before architecture work begins: **A — Pencil.dev** (`.pen` file via Pencil MCP), **B — Claude Design** (`design_prompt.yaml` copied to clipboard, paste into Claude Design desktop or browser), or **C — Neither** (markdown sidecar only). `references/claude-design-emit.md` contains the full YAML schema, field mappings from the brainstorm ledger, and emit instructions. `references/pencil-layout.md` contains the Pencil MCP call sequence, §3 artifact reading protocol, and design_tokens usage.

- **`prism-brainstorm` source awareness** — Visual companion now asks about design sources before rendering the first screen (when work is visual or brand-driven). `references/design-sources.md` documents 8 primary sources (21st.dev, Aceternity, Codrops, Unicorn Studio, React Bits, Pinterest, Mobbin, Dribbble) with tech stacks and translatability notes. Source selections enrich `design_prompt.yaml` and tell Claude which visual vocabulary to translate into the Griotwave register.

- **Translation Canvas in visual companion** — Side-by-side source vs Griotwave translation pattern documented in `visual-companion.md`. Source pane shows the reference as-captured; translation pane applies the Griotwave register at current fidelity level. Follows the `fidelity-engine` carry-forward rules.

- **`references/griotwave.md` in `prism-brainstorm`** — Complete Griotwave design system reference: full palette ladder (void → ink → neural → bio → violet), text opacity semantic tokens (voice/echo/whisper/footstep/ghost), surface tokens, typography, motion language, ember derivation, and the three-layer bloom formula.

- **Visual companion exit ceremony protocol** — `visual-companion.md` now has a "Session Exit" section with the 4-step exit sequence: record final hi-fi screen path, populate ledger §3 Reference Artifacts with exact paths, stop server, signal completion. `prism-brainstorm` SKILL.md Step 9 references this section.

- **`idea_init` plugin pairing documentation** — `.prism/shared/docs/idea_init-plugin-pairing.md` documents the architectural relationship between prism and the `idea_init` companion app: shared infrastructure (server.cjs, frame-template, griotwave tokens), current integration points (capture ledger + design_prompt.yaml), future plugin-to-plugin integration, and source-of-truth table.

- **`prism-research/references/design-sources.md`** — Full catalog of 17 UX/UI inspiration sources with ingestion strategies, Chrome MCP as universal capture path, per-source production status, and the Figma MCP destination/not-source clarification.

### Changed

- **`prism-design` SKILL.md refactored** — Complete rewrite as a tight orchestrator (~490 tokens) following `cl-plugin-structure` progressive disclosure principles. Inline YAML schema (35 lines) extracted to `references/claude-design-emit.md`. Pencil MCP workflow extracted to `references/pencil-layout.md`. Step 6 is now two load-on-demand references, one per tool choice.

- **`prism-design` skill graph updated** — now shows `↓ writes always` for the markdown sidecar and `↓ writes one of (user's choice)` for the visual artifact (`.pen` or `-prompt.yaml`).

- **`prism-brainstorm` visual companion exit ceremony** — exit protocol moved from inline SKILL.md block to `visual-companion.md` → "Session Exit" section, following the established load-on-demand pattern. SKILL.md Step 9 is now a single reference line.

- **`fidelity-engine.md` canonical values** — Added precision table with the hand-tuned numeric values from `idea_init/view_translate.jsx`: blur (0/8/40px), saturate (100/118/140%), bloom (0/.26/.55), rim (.07/.09/.13), radius (6/14/20px). CSS variable mapping block and bloom formula (`{ember}{bloom×26 as hex}` for gradient, `bloom×60` for glow radius) added.

- **Decision ledger §3 Reference Artifacts** — upgraded from vague bullet list to structured key-value schema with named fields (`Final hi-fi screen:`, `Visual companion session:`, `Decisions state:`) plus Griotwave baseline `design_tokens` YAML block. The design_tokens block (palette, surface, typography, motion) travels with every ledger as the token baseline for `prism-design` and Claude Design.

---

## What's New in 3.4.1

### Fixed

- **`scripts/bump-version.py`** — post-bump sweep `.md` file exclusion fix; `--strict` mode gate correction for release validation.

---

## What's New in 3.4.0

### Added

- **`prism-decompose` skill** — Greenfield-style spec decomposition into epic-scoped spectrum work queues; coverage report guarantees zero behavioral requirement drop during chunking. Use before `/prism-spectrum` for large specs.
- **Code intelligence layer** — `prism-plan` runs graph-based blast-radius analysis (Step 1.5: `trace_call_path` + `search_graph`); Structural Impact template in plan output. `prism-validate` gains a fourth structural check: cross-service contracts via `search_graph(relationship="HTTP_CALLS")`.
- **Spectrum CSD-style supervision** — deterministic worker shim paths; PreToolUse approval window (30s auto-approve, filesystem IPC); `VALID_SIGNALS` constant; Controller-Worker Supervision section in `prism-spectrum/SKILL.md`.

### Changed

- **Subagent discipline** — `prism-dispatch` and `prism-subagent`: "NEVER FORWARD PARENT SESSION HISTORY" iron law and Context Isolation section. Subagent Role Audit table classifying all dispatched agents.
- **Worktrees** — `commands/worktree.md` and `prism-finish` updated to reference native `EnterWorktree`/`ExitWorktree` tools (CC ≥ v2.1.154) with git fallback.
- **`prism-plan`** — No Placeholders Gate: explicit failure-condition table with iron law prevents `TBD`/empty-criteria plans from exiting the planning phase.
- **Brainstorm engine** — wake-path unified; multi-session channel routing via session registry; Porter drift fixed; `port-griotwave.cjs` emit regenerated; `frame-template.html` regenerated from v0.3.0 tokens.

### Fixed

- **`scripts/bump-version.py`** — repo-wide drift detection; post-bump sweep for prior version strings; `--strict` mode; `update_json()` and `update_text()` gain `also_replace` parameter.

---

## What's New in 3.3.1

### Fixed

- **prism-spectrum model reverted to `sonnet[1m]`** — spectrum is the outer-loop orchestrator; the agents it spawns (codebase-analyzer, prism-analyzer, etc.) carry the deep reasoning load. Following Karpathy's two-tier delegation pattern: cheap orchestrator, expensive workers. Added rationale comment to SKILL.md to prevent reflexive Opus bumps in future releases.
- **Hook validator schema** — `scripts/validate-hook-schema.sh` now accepts both root formats Claude Code recognises: flat (`{ "EventName": [...] }`) and nested (`{ "hooks": { "EventName": [...] } }`). Also fixes empty-string matcher false-positive (`""` is valid — means "match all"), adds missing valid event types (`PostCompact`, `WorktreeCreate`, `WorktreeRemove`, `SubagentStart`), and guards arithmetic increment against `set -e` premature exit.

---

## What's New in 3.3.0

### Added

- **`skills/cl-plugin-structure/`** — cl-plugin-structure v0.7.2 bundled as a skill. Includes `references/model-config.md` (current Claude model line, effort levels, ultrathink, 1M context), `references/folder-architecture-routing.md` (routing-table pattern), `references/token-optimization-research.md`, `examples/` (3 plugin scaffolds), and `scripts/` (6 validator scripts).
- **Routing table in `CLAUDE.md`** — maps 5 core task types to per-task file loads.
- **`ultrathink` keyword** woven into `prism-brainstorm` (Step 4), `prism-iterate` (Step 2), and `prism-validate` (Iron Law).
- **9 skills cross-linked** to cl-plugin-structure references.

### Changed

- Opus pin updated: `claude-opus-4-6` → `claude-opus-4-8` in `apps/prism-vscode/src/core/api/claude-sdk.ts` and `skills/prism-eval/references/eval-schemas.md`.
- `effort: xhigh` added to 6 heavy-reasoning skills: `prism-brainstorm`, `prism-iterate`, `prism-plan`, `prism-prd`, `prism-design`, `prism-subagent`.

---

## What's New in 3.2.1

### Brainstorm Visual Companion Hardening

- **MCP channel stabilization** — switched notification method from experimental `notifications/claude/channel` to standard `notifications/message/create`, aligning with the stable MCP spec
- **Error resilience** — HTTP server startup failures and notification errors now log-and-continue instead of crashing the MCP stdio transport. The brainstorm channel stays alive even if the HTTP listener can't bind its port
- **Frame template redesign** — rewritten `frame-template.html` with improved layout, drawer toggle with collapse/expand, and section collapse with `sessionStorage` persistence
- **Selection fix** — added missing `.opt` selector to single-select deselection logic in `helper.js`, fixing a bug where option-style elements wouldn't deselect when clicking a new option
- **Drawer controls** — new `setupDrawerControls()` in helper.js adds drawer toggle, decision/parked item expand/collapse, and section collapse with state persistence across page reloads

### Research & Documentation

- Added memory and context preservation research (`code-intel/2026-04-11-memory-and-context-research.md`)
- Added Griot ecosystem knowledge architecture mapping (`research/2026-04-11-griot-ecosystem-knowledge-architecture.md`)

---

## What's New in 3.2.0

### `prism-subagent` — Same-Session Subagent-Driven Plan Execution

A new top-level skill fills the medium-tier gap between `prism-implement` (single phase, no subagents) and `prism-spectrum` (10+ stories, autonomous overnight via bash loop). For 3–10 task plans where Spectrum is overkill but `prism-implement` is too thin, `/prism-subagent` dispatches a fresh implementer subagent per task with two-stage review (`spec-reviewer` then `quality-reviewer`), bounded retries, and compaction-survivable state.

**Execution-models table now reads:**

| Scope | Skill |
|---|---|
| Single phase / quick fix | `/prism-implement` |
| **3–10 tasks, mostly independent, stay in session** | **`/prism-subagent`** ← new |
| 10+ stories, autonomous overnight | `/prism-spectrum` |
| Parallel investigation of unrelated failures | `/prism-debug` |

**Core innovations beyond generic subagent-driven development:**

- **Domain-aware context priming** — R3F / Electron / fullstack / experimental sandbox primers paste matching guidance into every implementer dispatch. R3F implementers won't allocate inside `useFrame`. Electron implementers won't bypass `contextBridge`. Fullstack implementers won't update one side of a contract without the other.
- **Diff-only reviews** — reviewers receive `git diff` + spec excerpt, never full files. ~80% token reduction on the highest-volume operation in the loop.
- **5-status protocol** — adds `NEEDS_CLARIFICATION` (asks the user) distinct from `NEEDS_CONTEXT` (controller resolves), preventing the controller from inventing product decisions under pressure.
- **Review decision matrix** — 9 task classes (`config`, `docs`, `revert`, `test-only`, `refactor`, `bugfix`, `feature`, `contract`, `experiment`) with explicit, inspectable skip rules. Config-only / docs-only skip both review stages; experiments get light review only; contract changes get extra blast-radius checks.
- **Repeated-issue detector** — every reviewer issue is normalized to a fingerprint (`kebab-case-summary:file-path`) and stored in `state.json.raised_issues`. If a reviewer raises an issue already in the set, the task halts immediately rather than entering another fix cycle. Kills the classic "implementer fixes A, breaks B, fixes B, breaks A" oscillation loop.
- **No-op spin detector** — if the implementer's diff is byte-identical to the previous cycle's diff, the controller halts immediately. Catches the failure mode where an implementer "fixes" by reverting prior work or commits empty changes.
- **Auto model escalation ladder** — per-task `model_ladder` (default `haiku → sonnet → opus`; `sonnet → opus → opus` for `feature`/`contract` classes; `haiku → haiku → sonnet` for `experiment` class). On `BLOCKED` the controller advances the ladder before retrying.
- **3-cycle hard caps** — `retry_count`, `review_cycles`, and `consecutive_escalations` all hard cap at 3. No "just one more try."
- **Reviewer isolation** — reviewers never see prior reviewers' complaints, preventing groupthink reinforcement.
- **Compaction-survivable `state.json`** — single source of truth at `.prism/local/subagent/<plan-slug>/state.json`. Recovery protocol checks git tree state vs declared task status. Controller never asks "what were we doing?" after a compact.
- **Tasks extracted ONCE** — plan is read at run start, tasks frozen into `state.json.tasks[*].spec_text`. No plan re-reads ever again.

**Skill structure (progressive disclosure per `cl-plugin-structure` guidelines):**

```
skills/prism-subagent/
├── SKILL.md                          ~700 tokens — entry point, decision flow, iron laws
└── references/                       on-demand, ~5500 tokens total
    ├── dispatch-protocol.md          implementer + spec-reviewer + quality-reviewer templates
    ├── status-protocol.md            5-status protocol + handling matrix
    ├── review-decision-matrix.md     9 task classes with skip rules
    ├── retry-ladder.md               bounded retries, model escalation, loop detectors
    ├── state-schema.md               state.json schema + compaction recovery
    └── domain-hints.md               R3F / Electron / fullstack / experimental primers
```

Reuses existing `agents/spec-reviewer.md` and `agents/quality-reviewer.md` verbatim (zero duplication with `prism-spectrum`).

### `prism-dispatch` — Generalized Parallel Fan-Out

Companion skill that codifies the parallel-agent dispatch pattern for ad-hoc use, sibling to `prism-research` (fixed agent roster) and `prism-debug` (fixed 3-agent flow). Use when facing 2+ independent problem domains that can be investigated or fixed concurrently without shared state.

**Key content:**
- When-to-use decision flow + sibling-skills disambiguation table
- 4-step pattern: identify domains → focused prompts → parallel dispatch (single message, multiple Task calls) → integrate
- Per-agent model selection guidance
- Anti-patterns: fan-out stampede (cap at 5 agents per dispatch), hidden sequential dependencies (file-overlap audit before dispatching)

### `scripts/extract-tasks.py` — Deterministic Plan-to-State Extractor

A ~280-line Python script that parses Prism plan markdown into a complete `state.json` skeleton. Replaces ~3000 tokens of LLM extraction per `prism-subagent` run with deterministic regex parsing.

**Features:**
- Regex-based task header / files / steps / acceptance parsing (matches Prism plan convention)
- Auto-classification into all 9 review classes per the review decision matrix
- Auto-detection of domain (`r3f` / `electron` / `fullstack` / `experiment` / `mixed`) via keyword scoring against plan content + file paths
- Per-task model ladder selection based on review class
- Atomic write (`.tmp` then rename) to prevent corruption mid-write
- `--stdout` mode for inspection without writing
- `--force` to overwrite, `--domain` to override auto-detection
- Exit code 3 → controller falls back to LLM extraction (plan format unfamiliar)

**Verified against 4 real Prism plans + 3 fixture plans — 100% extraction success, 0 warnings.**

### Compaction Hook Integration for `prism-subagent`

`scripts/pre-compact.py` extended with `get_active_subagent_run()` that scans `.prism/local/subagent/*/state.json` for in-flight runs. Picks the most recently updated state file with at least one non-complete task. Embeds the result into `compact-snapshot.json` as `active_subagent_run`.

`scripts/post-compact.py` extended to read `active_subagent_run` from the snapshot and surface a recovery message that names the state file path, current task, pending count, and explicit instructions to read the recovery protocol without re-extracting the plan.

**Result:** A `prism-subagent` run that gets compacted mid-execution recovers automatically via the existing PreCompact/PostCompact hooks — no manual state restoration required.

### Eval Suite for `prism-subagent` v3.2.0

New eval suite at `.prism/shared/evals/v3.2.0/skills/prism-subagent/`:

- **`evals.json`** — 8 eval cases across 6 dimensions: behavioral_compliance (extract-tasks pre-flight), loop_prevention (repeated-issue detector + no-op spin detector), token_optimization (diff-only review verification), domain_awareness (R3F primer injection), review_decision_matrix (contract class blast-radius), compaction_survival (state.json recovery), regression (iron laws presence check)
- **`fixtures/plan-simple.md`** — 3-task baseline (utility module + tests, mixed feature/test-only classes)
- **`fixtures/plan-contract.md`** — 3-task fullstack contract change (tests blast-radius detection)
- **`fixtures/plan-r3f.md`** — 3-task R3F component (tests domain auto-detection)
- **`baseline.json`** — captured baseline metrics + regression thresholds for future comparison

**Captured baseline:** all 9 fixture tasks extracted with 0 warnings; domain detection 2× fullstack + 1× r3f (correct); review classes feature/test-only/contract all classified per matrix rules; SKILL.md ~700 tokens (target <800); references total ~5500 tokens (loaded on demand).

### Research Document

Full design rationale, gap analysis, and innovation catalog at `.prism/shared/research/2026-04-10-prism-subagent-skill.md`. Documents Phase 1 (findings — superpowers SDD analysis, Prism's existing mechanisms, the two gaps), Phase 2 (solution architecture, all 12 innovations, token strategy, loop-prevention hierarchy), and Phase 3 (the four shipped enhancements with verification details).

---

## What's New in 3.1.1

### Packaging Fix — `.mcp.json` No Longer Shipped

Fixed an issue where the plugin's development-only `.mcp.json` (declaring `codebase-memory-mcp` + `chrome-devtools` for local dev) was being bundled into the release snapshot at `.claude/plugins/cache/prism-marketplace/prism/<version>/.mcp.json`. When users opened the prism-plugin repo as their working project, Claude Code saw duplicate MCP server registrations and emitted "MCP server skipped — already-configured" warnings in the plugin management UI.

**Fix**: `.mcp.json` is now gitignored. It stays on disk for local development but is no longer tracked in git or included in release snapshots. Users will no longer see the dedup warning when loading the plugin.

**Note**: This is a packaging-only patch. The plugin content (skills, agents, commands, hooks, scripts) is byte-identical to v3.1.0. The CLI binaries, VSIX extension, Electron installer, and Tauri installer from v3.1.0 remain valid — no rebuilds needed.

---

## What's New in 3.1.0

### Brainstorm Visual Companion — Major Upgrade

**Wake-on-click MCP channel** — Browser clicks on mockup options now wake Claude mid-session via a persistent `claude/channel` MCP server. No more copy/paste from browser to chat. The `brainstorm-channel` server is registered in `plugin.json` and spawns at plugin-load time. Session routing uses `session_id` in notification meta for multi-session disambiguation.

**Griotwave theming + Fidelity Engine** — The visual companion now ships with Prism's signature **neural-blue** ember from the griotwave design token library. Every rendered screen has a fidelity level (`lo`/`mid`/`hi`) controlled via `data-fidelity` attribute:

| Level | Look | When |
|---|---|---|
| `lo` | Wireframe energy — dashed borders, desaturated, no glass | Early exploration |
| `mid` | Structured — solid borders, light blur | Direction forming |
| `hi` | Full griotwave glass — backdrop blur, ember bloom | Confirmed picks, ceremonial final |

A classifier (`decide`/`clarify`/`park`) determines how user messages advance fidelity. Slash commands (`/lo` `/mid` `/hi`) provide explicit override. Carry-forward persists level across questions. Final-hi ceremonial rule ensures the last decision-confirm screen is always polished.

**Two-pane drawer** — Live-updating right-side sidebar rendering from `state/decisions.json`:
- **Decisions pane** (60%) — locked picks with back-pointers to question IDs
- **Parking lot pane** (40%) — deferred concerns with revisit notes
- Health signal: yellow warning at 5+ parked items ("session may be over-scoped")
- Live WebSocket updates via `fs.watch` on `decisions.json`

**Extension integration** — New `brainstormViewerWatcher.ts` in the VS Code extension watches `.prism/local/brainstorm/*/state/open-viewer` and auto-opens the Simple Browser when the companion server starts.

### Corrected Skill Graph — brainstorm → design

Fixed the inverted skill graph where `prism-design` called `prism-brainstorm` as a sub-step. The corrected flow:

```
prism-brainstorm  →  .prism/shared/brainstorms/<date>-<topic>.md  (decision ledger)
        ↓
prism-design      →  .prism/shared/designs/<date>-<topic>-design.md  (markdown sidecar)
                  →  .prism/shared/designs/<date>-<topic>.pen       (pencil layout)
        ↓
prism-plan → prism-implement → prism-validate
```

- `prism-brainstorm` now produces a **decision ledger** (not an architectural design doc) with locked decisions, deferred concerns, reference artifacts, and handoff notes
- `prism-design` now reads the ledger as **required upstream input** (`require_brainstorm: true` default; exploratory mode available via `require_brainstorm: false`)
- Design output is **dual**: markdown sidecar (read by `/prism-plan`) + `.pen` file (pencil MCP integration via `batch_design`)

### New Skills

- **`/prism-bookend`** — Context-aware release workflow. Analyzes commits since last version, suggests semantic version increment, creates documentation snapshot, syncs VitePress site, and triggers GitHub release. Accepts explicit version override or auto-suggests based on commit type analysis (feat → minor, fix → patch).

### New Directory

- **`.prism/shared/brainstorms/`** — Decision ledgers from `/prism-brainstorm`. Added to `init_prism.py`, `CLAUDE.md`, and `prism-init` skill.

### Token Optimization

- **Progressive disclosure for `prism-brainstorm`** — Extracted Fidelity Engine (519 words) and Drawer State (261 words) into `references/` files. Core SKILL.md trimmed from ~1800 → ~1000 tokens (44% reduction). Reference files loaded on-demand only when rendering screens or writing state.

### Bug Fixes

- **Windows cp1252 encoding crash in `init_prism.py`** — Fixed pre-existing bug where `path.write_text()` defaulted to cp1252 on Windows Python 3.14. All I/O calls now use `encoding="utf-8"`.
- **CLAUDE.md drift** — Added missing `contracts/` entry to `.prism/` directory tree.

---

## Table of Contents

### Part I — Claude Plugin Architecture (Prompt Engineering)

1. [Plugin Overview](#plugin-overview)
2. [Plugin Manifest & Distribution](#plugin-manifest--distribution)
3. [Three-Layer Architecture](#three-layer-architecture)
4. [Commands Reference](#commands-reference)
5. [Agents Reference](#agents-reference)
6. [Skills Reference](#skills-reference)
7. [Scripts & Automation](#scripts--automation)
8. [Model Assignment Convention](#model-assignment-convention)
9. [Component Invocation Graph](#component-invocation-graph)
10. [Data Flow Through .prism/](#data-flow-through-prism)
11. [Behavioral Principles](#behavioral-principles)
12. [Plugin Directory Structure](#plugin-directory-structure)
13. [Plugin Statistics](#plugin-statistics)

### Part II — CLI Dashboard (Go/Bubble Tea)

14. [Overview](#overview)
15. [Architecture](#architecture)
16. [Getting Started](#getting-started)
17. [Plugin System](#plugin-system)
18. [Screen Reference](#screen-reference)
    - [Splash Screen](#1-splash-screen)
    - [Onboarding Screen](#2-onboarding-screen)
    - [Home Screen](#3-home-screen)
    - [Research Screen](#4-research-screen)
    - [Plans Screen](#5-plans-screen)
    - [Spectrum Dashboard](#6-spectrum-execution-dashboard)
    - [Files Screen](#7-files-screen)
    - [Git Screen](#8-git-screen)
    - [Agent Screen](#9-agent-screen)
    - [Monitor Screen](#10-monitor-screen)
    - [Workspaces Screen](#11-workspaces-screen)
19. [App Shell](#app-shell)
    - [Tab Bar](#tab-bar)
    - [Sidebar](#sidebar)
    - [Footer](#footer)
20. [Modal & Dialog Systems](#modal--dialog-systems)
21. [User Flow Diagrams](#user-flow-diagrams)
22. [Execution State Machine](#execution-state-machine)
23. [Animation System](#animation-system)
24. [3D Prism Rendering Pipeline](#3d-prism-rendering-pipeline)
25. [Splash Screen Rendering Pipeline](#splash-screen-rendering-pipeline)
26. [Domain Models](#domain-models)
27. [Claude CLI Integration](#claude-cli-integration)
28. [Terminal Detection](#terminal-detection)
29. [Diff System](#diff-system)
30. [Keyboard Reference](#keyboard-reference)
31. [Styling Reference](#styling-reference)
32. [Vertical Layout & Height Budget](#vertical-layout--height-budget)
33. [Configuration](#configuration)

### Part III — VS Code Extension (TypeScript/React)

34. [VS Code Extension Overview](#vs-code-extension-overview)
35. [Extension Architecture](#extension-architecture)
36. [Extension Source Structure](#extension-source-structure)
37. [Core Orchestrator — PrismController](#core-orchestrator--prismcontroller)
38. [IPC Architecture — gRPC-over-postMessage](#ipc-architecture--grpc-over-postmessage)
39. [Sidebar Webview](#sidebar-webview)
40. [Bottom Panel Webview](#bottom-panel-webview)
41. [Native Tree Views & Status Bar](#native-tree-views--status-bar)
42. [Commands & Keybindings](#commands--keybindings)
43. [Extension Settings](#extension-settings)
44. [Workflow State Machine (VS Code)](#workflow-state-machine-vs-code)
45. [Spectrum Execution (VS Code)](#spectrum-execution-vs-code)
46. [Plugin Skill Integration](#plugin-skill-integration)
47. [Office Visualization](#office-visualization)
48. [Extension Technology Stack](#extension-technology-stack)

### Part IV — Electron Desktop App (TypeScript/React)

49. [Electron App Overview](#electron-app-overview)
50. [Electron Architecture](#electron-architecture)
51. [Electron Source Structure](#electron-source-structure)
52. [Main Process & Window Management](#main-process--window-management)
53. [Preload & Context Bridge](#preload--context-bridge)
54. [IPC Bridge — Electron Transport](#ipc-bridge--electron-transport)
55. [ElectronPrismController](#electronprismcontroller)
56. [Platform Modules (Electron)](#platform-modules-electron)
57. [Webview UI — React SPA](#webview-ui--react-spa)
58. [State Management (Electron)](#state-management-electron)
59. [Build & Packaging](#build--packaging)
60. [Security Hardening](#security-hardening)
61. [Three-Platform Feature Parity](#three-platform-feature-parity)

### Part V — Monorepo Architecture (v2.5.0)

62. [Repository Structure](#repository-structure)
63. [npm Workspaces](#npm-workspaces)
64. [packages/prism-core](#packagesprism-core)
65. [packages/prism-ui](#packagesprism-ui)
66. [Platform Shell Responsibilities](#platform-shell-responsibilities)
67. [Development Workflow](#development-workflow)
68. [Production Hardening (v2.4.1+)](#production-hardening-v241)
69. [Centralized Version Management (v2.5.0)](#centralized-version-management-v250)
70. [Unified Tauri Installer (v2.4.7+)](#unified-tauri-installer-v247)

### Part VI — VitePress Documentation Site

71. [Documentation Site Overview](#documentation-site-overview)

### Part VII — Prism Eval Dashboard (Electron)

72. [Eval Dashboard Overview](#eval-dashboard-overview)
73. [Eval Dashboard Architecture](#eval-dashboard-architecture)
74. [Eval Dashboard Screens](#eval-dashboard-screens)
75. [Eval Skill Integration](#eval-skill-integration)

---

## Overview

Prism ships as three complementary interfaces for the same 4-phase workflow (Research → Plan → Implement → Validate):

| Interface | Location | Tech Stack | Best For |
|-----------|----------|------------|----------|
| **CLI Dashboard** | `apps/prism-cli/` | Go 1.23, Bubble Tea, FauxGL | Terminal-native, full-screen TUI, Spectrum execution |
| **VS Code Extension** | `apps/prism-vscode/` | TypeScript, React 18, Vite | IDE-integrated, chat-driven, visual office & monitor |
| **Electron Desktop App** | `apps/prism-electron/` | TypeScript, React 19, Electron 40, Vite, Tailwind v4 | Standalone desktop app, V2 IDE shell, native menus |
| **Eval Dashboard** | `prism-eval/` | Electron 40, React 19, Tailwind v4, Recharts, Dagre | Skill evaluation viewer — benchmarks, traces, graphs |

All four share the same `.prism/` directory structure, `stories.json` schema, signal protocol, and Claude CLI integration. They can be used independently or side-by-side. The Electron app features a full V2 IDE shell with activity bars, collapsible rails, tabbed editors, and floating chat pill. It shares all business logic, React UI components, and the gRPC-over-postMessage protocol with the VS Code extension via a proper npm monorepo with `packages/prism-core` and `packages/prism-ui` shared packages (see Part V — Monorepo Architecture). A unified Tauri-based installer (`apps/prism-installer/`) provides native Windows `.exe` and macOS `.dmg` installers with platform-specific wizard UIs. A VitePress documentation site at `prism-docs/` provides navigable, searchable documentation across ~79 pages (see Part VI). A dedicated Eval Dashboard at `prism-eval/` visualizes skill evaluation results, benchmarks, and agent traces (see Part VII).

---

# Part I — Claude Plugin Architecture (Prompt Engineering)

The Prism Claude Code plugin is the foundation that underpins every platform — the CLI dashboard, VS Code extension, and Electron app all exist to visualize and control workflows that the plugin defines. The plugin itself is **pure markdown-based prompt engineering** with zero build step. It extends Claude Code with structured workflows, specialized agents, and orchestration skills that transform raw AI capability into a disciplined development methodology.

## Plugin Overview

The Prism plugin registers with Claude Code through a conventional directory layout that is automatically discovered at startup. It provides:

- **25 commands** — User-invocable operations via `/command-name` (4,023 lines)
- **11 agents** — Specialized subprocesses spawned via `Task(subagent_type="agent-name")` (1,491 lines)
- **14 skills** — Auto-activating workflow orchestrators with trigger patterns (2,496 lines)
- **5 scripts** — Shell, PowerShell, and Python automation (921 lines)
- **No hooks or MCP servers** — The plugin relies entirely on prompt engineering, not runtime hooks

### What Makes It Different

Unlike traditional software plugins that extend functionality through code, Prism extends Claude Code's behavior through carefully structured natural language instructions. Each `.md` file is a prompt that shapes how Claude approaches a task — what agents to spawn, what questions to ask, what output format to use, and what behavioral constraints to follow. The prompt engineering is the product.

---

## Plugin Manifest & Distribution

### `.claude-plugin/plugin.json`

```json
{
  "name": "prism",
  "description": "Structured 4-phase development workflow (Research -> Plan -> Implement -> Validate) with Spectrum-style iterative execution with TUI",
  "version": "2.5.0",
  "author": { "name": "Digital Griot Studio" }
}
```

### `.claude-plugin/marketplace.json`

```json
{
  "name": "prism-marketplace",
  "owner": { "name": "Digital Griot Studio" },
  "plugins": [{
    "name": "prism",
    "source": { "source": "github", "repo": "TheDigitalGriot/prism-plugin" },
    "description": "Structured 4-phase development workflow (Research -> Plan -> Implement -> Validate)",
    "version": "2.5.0"
  }]
}
```

| Field | Value |
|-------|-------|
| Plugin Name | `prism` |
| Version | 2.5.0 |
| Distribution | GitHub: `TheDigitalGriot/prism-plugin` |
| Build Step | None — pure markdown prompt engineering |
| Auto-Discovery | Claude Code scans `commands/`, `agents/`, `skills/*/SKILL.md` on enable |

---

## Three-Layer Architecture

The plugin follows a strict three-layer architecture where each layer has a distinct responsibility:

```
+---------------------------------------------------------------------+
|                      USER / CLAUDE CODE                             |
|  Types "/prism-research" or Claude auto-detects task context        |
+----------------------------+----------------------------------------+
                             |
                             v
+---------------------------------------------------------------------+
|  Layer 1: SKILLS  (skills/*/SKILL.md)                               |
|                                                                     |
|  Workflow orchestrators with YAML frontmatter.                      |
|  Auto-activated by trigger patterns or invoked via /skill-name.     |
|  They decide WHAT to do: which commands to invoke, which agents     |
|  to spawn, and in what order.                                       |
|                                                                     |
|  Examples: prism, prism-research, prism-plan, prism-spectrum        |
+----------------------------+----------------------------------------+
                             |
              +--------------+--------------+
              |                             |
              v                             v
+------------------------------+  +----------------------------------+
|  Layer 2: COMMANDS           |  |  Layer 3: AGENTS                 |
|  (commands/*.md)             |  |  (agents/*.md)                   |
|                              |  |                                  |
|  Single-purpose operations.  |  |  Parallel specialists.           |
|  User-invocable via          |  |  Spawned via Task() with         |
|  /command-name.              |  |  subagent_type="agent-name".     |
|  They know HOW to do one     |  |  Run concurrently to maximize    |
|  thing well.                 |  |  throughput. Each has a model     |
|                              |  |  assignment and tool set.         |
|  Examples:                   |  |                                  |
|  /create_plan                |  |  Examples:                       |
|  /commit                     |  |  codebase-locator (haiku)        |
|  /generate_prd               |  |  codebase-analyzer (opus)        |
|  /decompose_plan             |  |  web-search-researcher (sonnet)  |
+------------------------------+  +----------------------------------+
```

**Key principle**: Skills orchestrate, commands operate, agents specialize. A skill never does the work itself — it delegates to commands and agents. Commands may also spawn agents for parallel research.

---

## Commands Reference

Commands live at `commands/` and are user-invocable via `/command-name`. Each is a markdown file with YAML frontmatter specifying `description` and `model`.

### Core Workflow Commands

| # | Command | File | Lines | Model | Description |
|---|---------|------|-------|-------|-------------|
| 1 | `/create_plan` | `create_plan.md` | 442 | **opus** | Interactive plan creation with parallel research agents, phased output, two-category success criteria |
| 2 | `/research_codebase` | `research_codebase.md` | 179 | **opus** | Spawns 5+ parallel agents to document the codebase |
| 3 | `/implement_plan` | `implement_plan.md` | 85 | **sonnet** | Executes approved plans phase by phase with verification checkpoints |
| 4 | `/validate_plan` | `validate_plan.md` | 167 | **sonnet** | Validates implementation against plan, runs automated checks, generates report |
| 5 | `/iterate_plan` | `iterate_plan.md` | 249 | **opus** | Updates existing plans surgically based on feedback |
| 6 | `/decompose_plan` | `decompose_plan.md` | 334 | **opus** | Converts plans into `stories.json` with per-story manifests and cross-domain contracts |

### Session Management Commands

| # | Command | File | Lines | Model | Description |
|---|---------|------|-------|-------|-------------|
| 7 | `/create_handoff` | `create_handoff.md` | 78 | **sonnet** | Creates handoff documents at `.prism/shared/handoffs/` for session transfer |
| 8 | `/resume_handoff` | `resume_handoff.md` | 219 | **sonnet** | Resumes work from handoff documents, validates current state |
| 9 | `/commit` | `commit.md` | 44 | **haiku** | Git commits with user approval, explicitly no Claude attribution |
| 10 | `/describe_pr` | `describe_pr.md` | 91 | **sonnet** | Generates PR descriptions from diff, updates PR via `gh` |
| 11 | `/retroactive` | `retroactive.md` | 80 | **sonnet** | Creates ticket/issue and PR retroactively after experimental work |

### Document Generation Commands

| # | Command | File | Lines | Model | Description |
|---|---------|------|-------|-------|-------------|
| 12 | `/generate_prd` | `generate_prd.md` | 196 | **opus** | Product Requirements Document with 9-section template |
| 13 | `/generate_pricing` | `generate_pricing.md` | 228 | **opus** | Professional pricing proposals with Gantt charts and T-shirt sizing |
| 14 | `/generate_tech_spec` | `generate_tech_spec.md` | 252 | **opus** | Technical specs: architecture, data models, API contracts |
| 15 | `/generate_user_flows` | `generate_user_flows.md` | 230 | **opus** | User flows, wireframes (ASCII), screen inventories, responsive design |

### Debug & Verification Commands

| # | Command | File | Lines | Model | Description |
|---|---------|------|-------|-------|-------------|
| 16 | `/prism-debug` | `prism-debug.md` | 184 | **sonnet** | Spawns parallel debug investigation agents (log, state, git) |
| 17 | `/prism-verify` | `prism-verify.md` | 142 | **sonnet** | Browser UI verification via playwright-cli with structured results |
| 18 | `/prism-screenshot` | `prism-screenshot.md` | 54 | **haiku** | Captures browser screenshot of a URL |
| 19 | `/prism-browse` | `prism-browse.md` | 82 | **sonnet** | Opens interactive headed browser session for exploration |

### Infrastructure Commands

| # | Command | File | Lines | Model | Description |
|---|---------|------|-------|-------|-------------|
| 20 | `/prism_dir_update` | `prism_dir_update.md` | 145 | **sonnet** | Migrates projects from legacy `thoughts/` to `.prism/` structure |
| 21 | `/prism_cli` | `prism_cli.md` | 93 | — | Launches Prism CLI TUI dashboard |
| 22 | `/cli-install` | `cli-install.md` | 132 | **sonnet** | Installs prism-cli binary from GitHub releases, configures PATH |
| 23 | `/cli-uninstall` | `cli-uninstall.md` | 150 | **sonnet** | Removes prism-cli binary, PATH entries, optionally `~/.prism/` |
| 24 | `/worktree` | `worktree.md` | 90 | **haiku** | Creates git worktrees for parallel development |
| 25 | `/review-setup` | `review-setup.md` | 91 | **haiku** | Sets up local environment to review a colleague's branch or PR |

> **Note (v3.0.2):** Five legacy commands (`/implement_plan`, `/iterate_plan`, `/research_codebase`, `/validate_plan`, `/prism-debug` command) are deprecated in favor of their skill equivalents. They remain for backward compatibility.

### Command Frontmatter Format

```markdown
---
description: What this command does (shown in Claude Code's command palette)
model: opus|sonnet|haiku
---

# Command Title

Detailed prompt instructions that shape Claude's behavior when this command is invoked...
```

---

## Agents Reference

Agents live at `agents/` and are spawned via `Task(subagent_type="agent-name")`. They run as parallel subprocesses, each with a designated model and restricted tool set.

### Research Agents

| # | Agent | File | Lines | Model | Tools | Role |
|---|-------|------|-------|-------|-------|------|
| 1 | `codebase-locator` | `codebase-locator.md` | 122 | **haiku** | Read, Glob, Grep, Bash | Find WHERE code lives — file locations by feature. Does NOT analyze contents. |
| 2 | `codebase-analyzer` | `codebase-analyzer.md` | 143 | **opus** | Read, Glob, Grep, Bash | Understand HOW code works — traces data flow, explains logic with file:line refs. |
| 3 | `codebase-pattern-finder` | `codebase-pattern-finder.md` | 227 | **sonnet** | Read, Glob, Grep, Bash | Finds similar implementations, returns concrete code examples to model after. |
| 4 | `prism-locator` | `prism-locator.md` | 134 | **haiku** | Read, Glob, Grep | Discovers documents in `.prism/` directory, categorizes by type. |
| 5 | `prism-analyzer` | `prism-analyzer.md` | 175 | **opus** | Read, Glob, Grep | Deep-dives on `.prism/` documents, extracts decisions and actionable items. "Documentarian, Not Critic" principle enforced. |
| 6 | `web-search-researcher` | `web-search-researcher.md` | 108 | **sonnet** | WebSearch, WebFetch, Read | Researches current information from the web with source links. |

### Debug Agents

| # | Agent | File | Lines | Model | Tools | Role |
|---|-------|------|-------|-------|-------|------|
| 7 | `log-investigator` | `log-investigator.md` | 106 | **haiku** | Bash | Analyzes log files for errors, warnings, and patterns. |
| 8 | `state-investigator` | `state-investigator.md` | 121 | **haiku** | Bash | Examines application state: databases, config files, environment. |
| 9 | `git-investigator` | `git-investigator.md` | 140 | **haiku** | Bash | Analyzes git history to find changes related to a reported issue. |

### Verification Agent

| # | Agent | File | Lines | Model | Tools | Role |
|---|-------|------|-------|-------|-------|------|
| 10 | `browser-verifier` | `browser-verifier.md` | 92 | **haiku** | Bash | Executes playwright-cli commands, returns structured JSON verification results. |

### Code Intelligence Agent (v2.5.0)

| # | Agent | File | Lines | Model | Tools | Role |
|---|-------|------|-------|-------|-------|------|
| 11 | `graph-navigator` | `graph-navigator.md` | 95 | **haiku** | codebase-memory-mcp (11 graph tools) | Queries the codebase knowledge graph for structural analysis — functions, call chains, dependencies, dead code, blast radius. Never reads files directly; uses graph tools exclusively. |

### Visual Regression Agent

| # | Agent | File | Lines | Model | Tools | Role |
|---|-------|------|-------|-------|-------|------|
| 12 | `visual-regression-grader` | `visual-regression-grader.md` | ~100 | **sonnet** | Read, Glob, Grep, Bash | Grades visual regression diffs: regression, intentional, or inconclusive. |

### Review Agents (v3.0.1)

Two-stage review agents dispatched sequentially after Spectrum quality gates pass. Spec compliance is verified first, then code quality. Both are read-only — they cannot modify code.

| # | Agent | File | Lines | Model | Tools | Role |
|---|-------|------|-------|-------|-------|------|
| 13 | `spec-reviewer` | `spec-reviewer.md` | ~70 | **sonnet** | Read, Glob, Grep, Bash | Verifies implementation matches story requirements exactly. Checks for missing requirements, over-building, and scope drift. **Does NOT trust implementer self-reports** — verifies independently. |
| 14 | `quality-reviewer` | `quality-reviewer.md` | ~75 | **sonnet** | Read, Glob, Grep, Bash | Reviews code quality, architecture, and testing AFTER spec compliance passes. Checks file responsibility, decomposition, testing, production readiness. |

### Agent Frontmatter Format

```markdown
---
name: agent-name
description: Description shown in Claude Code's agent registry
tools: Read, Glob, Grep, Bash
model: opus|sonnet|haiku
---

You are a specialist at [specific capability]. Your job is to [specific task]...
```

### Agent Design Principles

1. **Single responsibility** — Each agent does one thing well (locate, analyze, find patterns, etc.)
2. **Restricted tools** — Agents only receive the tools they need; `codebase-locator` gets Glob/Grep but NOT Edit
3. **Model-appropriate** — Fast lookup tasks use Haiku, deep analysis uses Opus, general work uses Sonnet
4. **Parallel by default** — Skills spawn 3–6 agents concurrently; agents never depend on each other's output

---

## Skills Reference

Skills live at `skills/*/SKILL.md` and are auto-discovered workflow orchestrators. They activate automatically based on trigger patterns in user messages or are invoked explicitly via `/skill-name`.

### Core Workflow Skills

| # | Skill | Lines | Model | Trigger Patterns |
|---|-------|-------|-------|-----------------|
| 1 | `prism` | 276 | **sonnet** | "help me build", "implement this feature", "fix this bug", "prism", "structured workflow" |
| 2 | `prism-research` | 121 | **sonnet** | "research this", "understand how X works", "map out the system", "explore the codebase" |
| 3 | `prism-plan` | 126 | **opus** | "create a plan", "plan the implementation", "design how to build" |
| 4 | `prism-implement` | 122 | **sonnet** | "implement the plan", "start building", "execute phase 1" |
| 5 | `prism-validate` | 108 | **sonnet** | "validate the plan", "verify implementation", "check if complete" |
| 6 | `prism-iterate` | 103 | **opus** | "iterate on plan", "update and continue", "adjust the approach" |

### Specialized Skills

| # | Skill | Lines | Model | Trigger Patterns |
|---|-------|-------|-------|-----------------|
| 7 | `prism-debug` | 221 | **sonnet** | "debug this", "why is this failing", "investigate the error" |
| 8 | `prism-spectrum` | 254 | **sonnet** | "spectrum", "execute story", "run spectrum" |
| 9 | `prism-verify` | 125 | **sonnet** | "verify the UI", "check the browser", "visual verification" |
| 10 | `prism-prd` | 122 | **opus** | "create a PRD", "write product requirements", "document this product" |
| 11 | `prism-visual-docs` | 146 | **opus** | "create user flows", "design the screens", "create wireframes" |

### Design & Completion Skills (v3.0.1)

| # | Skill | Lines | Model | Trigger Patterns |
|---|-------|-------|-------|-----------------|
| 12 | `prism-brainstorm` | ~170 | **opus** | "brainstorm this", "design options", "explore approaches", "let's think about" |
| 13 | `prism-design` | ~130 | **opus** | "design this", "create a design", "design the architecture" |
| 14 | `prism-finish` | ~100 | **sonnet** | "finish this branch", "ready to merge", "create PR", "clean up branch" |

**`prism-brainstorm`** includes a browser-based **Visual Companion** with the full Griotwave fidelity engine (`lo`/`mid`/`hi` cascade), source-awareness (asks which of 8 design sources you're drawing from before rendering), Translation Canvas (side-by-side source vs Griotwave reinterpretation), and a live drawer showing decisions and parking lot. References: `references/fidelity-engine.md` (canonical CSS variable values), `references/drawer-state.md`, `references/design-sources.md`, `references/griotwave.md`.

**`prism-design`** turns a brainstorm decision ledger into an architectural spec. At Step 2.5 it asks which visual layout tool: **Pencil.dev** (`.pen` via MCP, automated) or **Claude Design** (`design_prompt.yaml` emitted to clipboard, paste into desktop or browser). The markdown sidecar is always written and is what `prism-plan` reads. References: `references/pencil-layout.md`, `references/claude-design-emit.md`.

**`prism-finish`** presents 4 structured options: merge locally, push and create PR (via `/describe_pr`), keep as-is, or discard (requires confirmation). Handles worktree cleanup.

### Capture & Brand Skills (v3.5.0)

| # | Skill | Lines | Model | Trigger Patterns |
|---|-------|-------|-------|-----------------|
| 19 | `prism-capture` | ~110 | **sonnet** | "I have references", "let me show you what I'm drawn to", "capture this inspiration", "triage my references", "let me share my inspo" |
| 20 | `prism-brand` | ~90 | **opus** | "logo ideation", "brand identity", "design system", "what should the wordmark look like" |

**`prism-capture`** handles the Capture → Triage → Translate pipeline upstream of brainstorming. Genesis stage asks for a project description and which of 8 design sources are in play. Triage stage categorizes references (active/parked/rejected). Translate stage renders each active reference as a side-by-side Translation Canvas in the visual companion. Outputs a capture ledger to `.prism/shared/captures/` that `prism-brainstorm` reads as pre-loaded context. When `idea_init` is installed, its captures land there automatically.

**`prism-brand`** is a three-phase brand identity workflow: Phase 1 generates 12 divergent logo seeds (maximum spread, no two sharing a form factor, single-colour silhouettes first); Phase 2 refines 2-3 picks at `mid` fidelity; Phase 3 builds the system (color derived from ember, type pairing, motion language). Output: brand spec in `.prism/shared/designs/` with a design_tokens override block consumed by `prism-design`.

### Setup & Utility Skills (v3.0.3)

| # | Skill | Lines | Model | Trigger Patterns |
|---|-------|-------|-------|-----------------|
| 15 | `prism-init` | 53 | **haiku** | "init prism", "set up prism", "initialize prism", "create .prism folder" |

**`prism-init`** wraps `init_prism.py` to initialize the `.prism/` directory structure in any project. Creates 15 directories including `designs/` (Figma/Pencil.dev files) and `assets/` (AI-generated images, videos, 3D models), updates `.gitignore`, and optionally adds a Prism section to `CLAUDE.md`.

### Release, Eval & Docs Skills (v2.5.0)

| # | Skill | Lines | Model | Trigger Patterns |
|---|-------|-------|-------|-----------------|
| 16 | `prism-release` | 245 | — | "release", "bump version", "new version", "cut a release" |
| 17 | `prism-eval` | 237 | **sonnet** | "run evals", "compare versions", "benchmark skills", "evaluate v2.5.0", "regression check" |
| 18 | `prism-docs-update` | 138 | — | "update prism docs", "sync docs site", "update documentation site" |

### Skill Subdirectory Contents

Each skill directory may contain supporting files:

```
skills/
├── prism/
│   ├── SKILL.md                         # 275 lines — master orchestrator
│   ├── references/
│   │   └── workflow-patterns.md         # Reusable workflow pattern library
│   └── scripts/
│       └── init_prism.py                # 185 lines — .prism/ directory initializer
├── prism-init/
│   └── SKILL.md                         # 53 lines — haiku (project init, wraps init_prism.py)
├── prism-research/
│   ├── SKILL.md                         # 113 lines
│   └── references/
│       ├── exploration-patterns.md      # Agent spawning patterns
│       └── research-template.md         # Output document template
├── prism-plan/
│   ├── SKILL.md                         # 126 lines
│   └── references/
│       └── plan-template.md             # Plan document structure
├── prism-validate/
│   ├── SKILL.md                         # 94 lines
│   └── references/
│       └── validation-template.md       # Validation report template
├── prism-verify/
│   ├── SKILL.md                         # 125 lines
│   └── references/
│       ├── verification-template.md     # Browser verification template
│       └── verification-patterns.md     # Playwright-cli patterns
├── prism-spectrum/
│   ├── SKILL.md                         # ~300 lines — manifest-aware story execution (v3.0.1: +two-stage review, +implementer status)
│   └── references/
│       ├── story-manifest-schema.md     # Per-requirement tracking schema
│       ├── contracts-convention.md      # Cross-domain contract convention
│       ├── browser-verification.md      # Browser verification reference
│       ├── visual-regression.md         # Visual regression reference
│       ├── debug-integration.md         # Auto-debug flow reference
│       ├── spec-review-prompt.md        # (v3.0.1) Spec reviewer dispatch template
│       ├── quality-review-prompt.md     # (v3.0.1) Quality reviewer dispatch template
│       └── model-selection.md           # (v3.0.1) Dynamic model selection guide
├── prism-brainstorm/                    # (v3.0.1) Interactive brainstorming
│   ├── SKILL.md                         # ~90 lines — brainstorm orchestrator with HARD-GATE
│   ├── visual-companion.md              # Browser-based visual companion guide
│   └── scripts/
│       ├── server.cjs                   # Zero-dep Node.js HTTP/WebSocket server (~354 lines)
│       ├── frame-template.html          # Prism-themed HTML frame (dark/light, indigo accent)
│       ├── helper.js                    # Client-side WebSocket + click capture (~88 lines)
│       ├── start-server.sh              # Session launcher (Windows/macOS/Linux)
│       └── stop-server.sh              # Graceful shutdown (SIGTERM→SIGKILL)
├── prism-design/                        # (v3.0.1) Design phase
│   └── SKILL.md                         # ~80 lines — bridges research → plan
├── prism-finish/                        # (v3.0.1) Branch completion
│   └── SKILL.md                         # ~100 lines — 4 options (merge/PR/keep/discard)
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
└── prism-docs-update/
    ├── SKILL.md                         # 138 lines — VitePress docs syncer
    └── references/
        └── section-mapping.md           # Monolithic doc → VitePress page mapping
```

### Skill Frontmatter Format

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

### Master Orchestrator: `prism`

The `prism` skill (275 lines) is the master orchestrator — it routes to all other skills:

```
User: "help me build a login form"
    │
    ▼
prism skill activates (trigger: "help me build")
    │
    ├── Detects task type → routes to appropriate phase
    │
    ├── If unfamiliar codebase → /prism-research
    ├── If needs design work   → /prism-brainstorm → /prism-design (v3.0.1)
    ├── If needs planning      → /prism-plan
    ├── If plan exists         → /prism-implement
    ├── If needs validation    → /prism-validate
    ├── If needs iteration     → /prism-iterate
    └── If work is complete    → /prism-finish (v3.0.1)
```

---

## Scripts & Automation

### `scripts/spectrum.sh` (518 lines)

The Spectrum iterative executor — the main autonomous execution loop that spawns fresh Claude Code sessions per story. In v2.5.1, all deterministic operations (story selection, status updates, schema validation, progress logging, lockfile management) were moved from the AI skill into this bash script for reliability.

```
┌─────────────────────────────────────────────────────────┐
│  spectrum.sh Loop (v3.0.1)                               │
│                                                          │
│  0. validate_schema() — verify stories.json structure    │
│  1. acquire_lock() — PID-based lockfile with stale check │
│  2. select_next_story() — jq: incomplete + unblocked     │
│  3. If no story remaining → EXIT SUCCESS                 │
│  4. If max iterations → EXIT LIMIT                       │
│  5. Spawn: claude --dangerously-skip-permissions         │
│            --print "/prism-spectrum"                      │
│            (includes pre-selected story ID in prompt)     │
│  6. Parse signal from output:                            │
│     • <promise>COMPLETE</promise> → check remaining      │
│     • <spectrum-continue><concerns> → log + continue ¹   │
│     • <spectrum-continue> → verify + next iteration      │
│     • <spectrum-needs-context> → log questions + skip ¹   │
│     • <spectrum-retry reason="..."> → increment err      │
│     • <spectrum-blocked reason="..."> → skip story       │
│     • <spectrum-error reason="..."> → stop               │
│  7. update_story_status() — atomic jq update + validate  │
│  8. append_progress() — timestamped logging              │
│  9. If 3+ consecutive errors → EXIT ERROR                │
│ 10. Sleep $SPECTRUM_PAUSE seconds                        │
│ 11. → Loop to step 2                                     │
│ 12. release_lock() — on EXIT trap                        │
│                                                          │
│  ¹ New in v3.0.1: concerns + needs-context signals       │
└─────────────────────────────────────────────────────────┘
```

**Key functions (v3.0.1):**

| Function | Description |
|----------|-------------|
| `validate_schema()` | Validates `.epic.name`, `.stories` array, per-story required fields |
| `select_next_story()` | jq query: incomplete + unblocked stories sorted by priority |
| `update_story_status()` | Atomic jq update with temp file + JSON validation before `mv` |
| `append_progress()` | Timestamped iteration logging to `progress.md` |
| `acquire_lock()` / `release_lock()` | Lockfile at `.prism/local/spectrum.lock` with stale PID detection |

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `SPECTRUM_MAX_ITERATIONS` | 50 | Maximum iterations before stopping |
| `SPECTRUM_VERBOSE` | (unset) | Enable verbose output |
| `SPECTRUM_PAUSE` | 2 | Seconds between iterations |

**Prerequisites:** `claude` CLI and `jq` must be installed.

### `scripts/prism-cli-install.sh` (280 lines)

Cross-platform bash installer for the prism-cli binary:
- Detects platform (darwin/linux/windows) and architecture (amd64/arm64)
- Three methods: `auto` (try download, fall back to source), `download`, `source`
- Downloads from `github.com/TheDigitalGriot/prism-plugin/releases`
- Configures PATH in `~/.zshrc`, `~/.bashrc`, `~/.bash_profile`, and PowerShell `$PROFILE`
- Initializes `~/.prism/workspaces.json` registry

### `scripts/prism-cli-install.ps1` (181 lines)

Native PowerShell installer for Windows:
- Downloads `prism-cli-windows-amd64.exe` from GitHub releases
- Configures PATH in PowerShell `$PROFILE`
- Same auto/source/download method pattern as bash version

### `skills/prism/scripts/init_prism.py` (185 lines)

Initializes the `.prism/` directory structure in any project:
- Creates 15 directories: `stories/`, `shared/{research,plans,validation,handoffs,prs,spectrum,ref,docs,contracts,designs,assets}`, `shared/validation/{baselines,diffs}`, `local/{ref,docs}`
- `shared/designs/` — Figma / Pencil.dev design files
- `shared/assets/` — AI-generated images, videos, 3D models
- Adds `.prism/local/` to `.gitignore`
- Creates `README.md` in `.prism/shared/`
- Optionally adds Prism section to `CLAUDE.md`
- Wrapped by the `/prism-init` skill (v3.0.3)

### Hook Scripts (v3.0.1)

| Script | Type | Hook Event | Description |
|--------|------|------------|-------------|
| `scripts/pre-compact.py` | Python | PreCompact | Snapshots workflow state (phase, active story, recent files) to `.prism/local/compact-snapshot.json` |
| `scripts/post-compact.py` | Python | PostCompact | Reads snapshot and outputs structured recovery context via `hookSpecificOutput.additionalContext` |
| `scripts/log-observation.py` | Python | PostToolUse (Write\|Edit\|Bash) | Appends one-line entries to `.prism/local/observations.log` for each file modification |
| `scripts/worktree-setup.sh` | Bash | WorktreeCreate | Auto-setup: gitignore verification, dependency installation, config copy, `.prism/shared` symlink |
| `scripts/worktree-cleanup.sh` | Bash | WorktreeRemove | Safety checks: warns on uncommitted changes and unpushed commits, removes `.prism/shared` symlink |
| `scripts/log-agent.py` | Python | SubagentStart / SubagentStop | Logs agent dispatches to `.prism/local/agent-log.jsonl` with timestamps, model, duration, token usage |

### Other Scripts

| Script | Type | Description |
|--------|------|-------------|
| `scripts/visual-regression.sh` | Bash | Captures screenshots via playwright-cli, diffs against baselines with pixelmatch, outputs structured JSON |
| `scripts/bump-version.py` | Python | Reads VERSION, bumps semver, updates all JSON/source files containing the version string |

---

## Hooks Reference (v3.0.1)

Prism uses 7 lifecycle hooks, all `command` type (zero LLM cost). Hooks are configured in `hooks/hooks.json`.

| Hook Event | Matcher | Script | Purpose |
|------------|---------|--------|---------|
| **PreCompact** | (all) | `pre-compact.py` | Save workflow state before context compression |
| **PostCompact** | (all) | `post-compact.py` | Restore state after context compression |
| **PostToolUse** | Write\|Edit\|Bash | `log-observation.py` | Track file modifications for session continuity |
| **WorktreeCreate** | (all) | `worktree-setup.sh` | Auto-setup dependencies, config, `.prism/` symlink |
| **WorktreeRemove** | (all) | `worktree-cleanup.sh` | Safety checks before worktree deletion |
| **SubagentStart** | (all) | `log-agent.py` | Log agent dispatch for cost tracking |
| **SubagentStop** | (all) | `log-agent.py` | Log agent completion with duration and tokens |

All hooks use `${CLAUDE_PLUGIN_ROOT}` for portable paths. Python scripts use `pathlib` for cross-platform compatibility (Windows, macOS, Linux).

---

## Model Assignment Convention

The plugin follows a strict three-tier model assignment convention. Each component is assigned the cheapest model that can reliably handle its task.

### Opus — Deep Analysis & Creative Synthesis

Used when the task requires understanding complex relationships, generating structured documents, or making architectural decisions.

| Component | Type | Why Opus |
|-----------|------|----------|
| `codebase-analyzer` | Agent | Traces multi-file data flow, explains complex logic |
| `prism-analyzer` | Agent | Extracts nuanced insights from research documents |
| `create_plan` | Command | Generates phased plans with success criteria |
| `iterate_plan` | Command | Surgical plan updates requiring architectural judgment |
| `decompose_plan` | Command | Converts plans to dependency-ordered stories |
| `research_codebase` | Command | Coordinates multi-agent research campaigns |
| `generate_prd` | Command | Creates comprehensive product requirements |
| `generate_pricing` | Command | Professional pricing proposals with Gantt charts |
| `generate_tech_spec` | Command | API contracts, data models, architecture diagrams |
| `generate_user_flows` | Command | UX documentation with wireframes |
| `prism-plan` | Skill | Interactive planning with user feedback loops |
| `prism-iterate` | Skill | Plan adjustment requiring deep understanding |
| `prism-prd` | Skill | PRD orchestration with context awareness |

### Sonnet — General Implementation Work

Used for straightforward execution, routing, and integration tasks that don't require deep synthesis.

| Component | Type | Why Sonnet |
|-----------|------|------------|
| `codebase-pattern-finder` | Agent | Pattern matching is systematic, not creative |
| `web-search-researcher` | Agent | Web research follows clear procedures |
| `implement_plan` | Command | Follows an existing plan — execution not design |
| `validate_plan` | Command | Comparison against criteria — checklist work |
| `describe_pr` | Command | Summarizes known diffs |
| `create_handoff` | Command | Structured document generation |
| `resume_handoff` | Command | Context reconstruction from artifacts |
| `retroactive` | Command | Post-hoc documentation |
| `prism-debug` | Command | Parallel agent coordination |
| `prism-verify` | Command | Browser verification coordination |
| `prism-browse` | Command | Interactive browser session |
| Infrastructure cmds | Commands | CLI install/uninstall, dir migration |
| `prism` | Skill | Master router — routes, doesn't synthesize |
| `prism-research` | Skill | Agent spawning coordination |
| `prism-implement` | Skill | Phase-by-phase execution coordination |
| `prism-validate` | Skill | Verification coordination |
| `prism-debug` | Skill | Debug agent coordination |
| `prism-spectrum` | Skill | Single-story execution with signal protocol |
| `prism-verify` | Skill | Browser verification orchestration |
| `prism-eval` | Skill | Eval runner — parallel agents, grading, benchmarking |
| `prism-visual-docs` | Skill | Visual documentation generation |
| `prism-docs-update` | Skill | Documentation update coordination |
| `prism-release` | Skill | Full release pipeline orchestration |

### Haiku — Fast Lookups & Simple Operations

Used for tasks that are fast, focused, and don't require nuanced judgment.

| Component | Type | Why Haiku |
|-----------|------|-----------|
| `codebase-locator` | Agent | File location via Glob/Grep — no analysis needed |
| `prism-locator` | Agent | Directory scanning — mechanical task |
| `log-investigator` | Agent | Log file parsing — pattern matching |
| `state-investigator` | Agent | Environment checks — straightforward |
| `git-investigator` | Agent | Git log analysis — structured data |
| `browser-verifier` | Agent | Playwright command execution — procedural |
| `graph-navigator` | Agent | Knowledge graph queries — structural lookups |
| `commit` | Command | Git commit — minimal judgment needed |
| `worktree` | Command | Git worktree creation — procedural |
| `review-setup` | Command | Branch checkout — procedural |
| `prism-screenshot` | Command | Single browser screenshot — trivial |

---

## Component Invocation Graph

### Skills → Commands

```
prism (master orchestrator)
  ├── /prism-research
  ├── /prism-plan
  ├── /prism-implement
  ├── /prism-validate
  ├── /prism-iterate
  ├── /prism-spectrum
  ├── /prism-debug
  ├── /prism-verify
  ├── /prism-prd
  └── /prism-visual-docs

prism-prd
  ├── /generate_prd
  ├── /generate_user_flows (offered as companion)
  ├── /generate_tech_spec (offered as companion)
  └── /generate_pricing (offered as companion)

prism-visual-docs
  ├── /generate_user_flows
  └── /generate_tech_spec (optional)

prism-implement
  ├── /commit (after each phase)
  ├── /validate_plan (after completion)
  └── /describe_pr (for PR creation)

prism-spectrum
  └── /prism-debug (on quality gate failure — auto-retry)

prism-release
  └── (no commands — direct Bash execution for build/tag/push/release)

prism-eval
  └── (spawns parallel eval runner agents, then grader agents)

prism-docs-update
  └── (spawns parallel agents to compare and update VitePress pages)
```

### Skills → Agents (Parallel Spawning)

```
prism-research ───────────────────────────────┐
  ├── codebase-locator        (haiku)   ────┐ │
  ├── codebase-analyzer       (opus)    ────┤ │
  ├── codebase-pattern-finder (sonnet)  ────┤ ├── All 6 in parallel
  ├── prism-locator           (haiku)   ────┤ │
  ├── prism-analyzer          (opus)    ────┤ │
  └── web-search-researcher   (sonnet)  ────┘ │
                                               │
prism-plan ────────────────────────────────────┤
  ├── codebase-analyzer       (opus)    ────┐  │
  ├── codebase-pattern-finder (sonnet)  ────┤  ├── 3 in parallel
  └── prism-analyzer          (opus)    ────┘  │
                                               │
prism-iterate ─────────────────────────────────┤
  ├── codebase-locator        (haiku)   ────┐  │
  ├── codebase-analyzer       (opus)    ────┤  ├── 3 in parallel
  └── codebase-pattern-finder (sonnet)  ────┘  │
                                               │
prism-debug ───────────────────────────────────┤
  ├── log-investigator        (haiku)   ────┐  │
  ├── state-investigator      (haiku)   ────┤  ├── 3 in parallel
  └── git-investigator        (haiku)   ────┘  │
                                               │
prism-verify ──────────────────────────────────┤
  └── browser-verifier        (haiku)          │
                                               │
prism-prd ─────────────────────────────────────┤
  └── prism-locator           (haiku)          │
                                               │
prism-visual-docs ─────────────────────────────┘
  └── prism-locator           (haiku)
```

### Commands → Agents

```
/create_plan
  ├── codebase-locator        (haiku)
  ├── codebase-analyzer       (opus)
  ├── codebase-pattern-finder (sonnet)
  ├── prism-locator           (haiku)
  └── prism-analyzer          (opus)

/research_codebase
  ├── codebase-locator        (haiku)
  ├── codebase-analyzer       (opus)
  ├── codebase-pattern-finder (sonnet)
  ├── prism-locator           (haiku)
  ├── prism-analyzer          (opus)
  └── web-search-researcher   (sonnet)

/iterate_plan
  ├── codebase-locator        (haiku)
  ├── codebase-analyzer       (opus)
  ├── codebase-pattern-finder (sonnet)
  ├── prism-locator           (haiku)
  └── prism-analyzer          (opus)

/prism-debug
  ├── log-investigator        (haiku)
  ├── state-investigator      (haiku)
  └── git-investigator        (haiku)
```

---

## Data Flow Through .prism/

The plugin's workflow produces artifacts that flow through the `.prism/` directory:

```
User request / ticket
    │
    ▼
┌──────────────────────────────────────────────────────────────┐
│  /prism-research                                              │
│  Spawns 6 agents → aggregates findings                        │
│  Output: .prism/shared/research/YYYY-MM-DD-topic.md           │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│  /prism-plan                                                  │
│  Interactive planning → user approval at each step            │
│  Output: .prism/shared/plans/YYYY-MM-DD-feature.md            │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│  /decompose_plan                                              │
│  Converts plan phases into executable stories                 │
│  Output: .prism/stories/stories.json                          │
│          .prism/stories/<story-id>-manifest.json (per story)  │
│          .prism/shared/contracts/interfaces.json (if needed)  │
└──────────────────────────────┬───────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
    Manual execution                 Autonomous execution
                │                             │
                ▼                             ▼
┌──────────────────────┐    ┌──────────────────────────────────┐
│  /prism-implement     │    │  spectrum.sh + /prism-spectrum    │
│  Phase by phase       │    │  Fresh Claude session per story   │
│  with checkpoints     │    │  Signal protocol for flow control │
│                       │    │                                    │
│                       │    │  Progress:                         │
│                       │    │  .prism/shared/spectrum/progress.md│
└──────────┬────────────┘    └──────────────┬───────────────────┘
           │                                │
           └────────────┬───────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│  /prism-validate                                              │
│  Runs automated checks, compares against plan                 │
│  Output: .prism/shared/validation/YYYY-MM-DD-report.md        │
└──────────────────────────────┬───────────────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
         All passed                       Issues found
              │                                 │
              ▼                                 ▼
┌──────────────────────┐          ┌──────────────────────────┐
│  /describe_pr         │          │  /prism-iterate           │
│  Output:              │          │  Update plan + continue   │
│  .prism/shared/prs/   │          │  → loops back to plan     │
└──────────────────────┘          └──────────────────────────┘
```

### Session Handoffs

When context window limits are reached:

```
/create_handoff  → .prism/shared/handoffs/YYYY-MM-DD_HH-MM-SS_topic.md
                          │
                    (new Claude session)
                          │
/resume_handoff  ← reads handoff + validates current state → continues work
```

---

## Behavioral Principles

The plugin enforces several key behavioral constraints through its prompt engineering:

### 1. "Documentarian, Not Critic"

All research agents are instructed to **only describe what exists**. They do NOT:
- Suggest improvements
- Critique implementation choices
- Perform root cause analysis (unless explicitly asked)
- Recommend refactoring

This prevents research from becoming opinionated, ensuring clean separation between observation (research phase) and decision-making (plan phase).

### 2. Interactive Planning

Plans are contracts, not suggestions. The planning process:
1. Present understanding of the codebase first
2. Get user buy-in before proceeding
3. Iterate on each section with feedback
4. Never write a full plan in one shot
5. Resolve all unknowns before finalizing
6. Always separate "Automated Verification" (runnable commands) from "Manual Verification" (human testing)

### 3. Fresh Context Per Iteration

Spectrum gives each story a fresh Claude session via `spectrum.sh`. Memory persists through:
- `stories.json` (status, steps, commit hashes)
- `progress.md` (accumulated learnings)
- Git commits (the actual work)

This prevents context window degradation across long-running autonomous execution.

### 4. Two-Category Success Criteria

Every plan separates verification into:

| Category | Examples | Runner |
|----------|----------|--------|
| **Automated Verification** | `npm test`, `npm run typecheck`, `npm run lint` | Claude / Spectrum |
| **Manual Verification** | "Click the login button and verify redirect" | Human tester |

### 5. Signal Protocol

Autonomous execution uses XML-like signals for flow control:

| Signal | Tag | Meaning |
|--------|-----|---------|
| Complete | `<promise>COMPLETE</promise>` | Story finished successfully |
| Continue | `<spectrum-continue>` | Success, schedule next iteration |
| Continue w/ Concerns | `<spectrum-continue><concerns>...</concerns>` | Success, but flagged doubts (v3.0.1) |
| Needs Context | `<spectrum-needs-context>` | Missing information, skip to next story (v3.0.1) |
| Retry | `<spectrum-retry reason="...">` | Transient failure, retry |
| Blocked | `<spectrum-blocked reason="...">` | Cannot proceed, skip |
| Error | `<spectrum-error reason="...">` | Fatal error, stop |

### 6. Two-Stage Review (v3.0.1)

After Spectrum quality gates pass, two reviewer agents are dispatched sequentially:

1. **Spec Compliance** (`spec-reviewer` agent) — verifies implementation matches requirements exactly. Checks for missing requirements, over-building, and scope drift. **Does not trust implementer self-reports.**
2. **Code Quality** (`quality-reviewer` agent) — reviews code quality, architecture, and testing. Only dispatched after spec compliance passes.

Review is skipped only for config-only changes, documentation-only stories, or reverts.

### 7. Implementer Status Protocol (v3.0.1)

During Spectrum execution, stories report one of four statuses:

| Status | Meaning | What Happens |
|--------|---------|-------------|
| **DONE** | Confident in quality | Proceed to quality gates → review |
| **DONE_WITH_CONCERNS** | Complete but with doubts | Log concerns, proceed to gates (review catches issues) |
| **NEEDS_CONTEXT** | Missing information | Emit signal, skip to next story |
| **BLOCKED** | Cannot complete | Emit signal with root cause |

### 8. Independent Verification / Distrust Pattern (v3.0.1)

The `prism-validate` skill independently verifies all claimed completions. It does NOT trust checkbox status in plans — it reads actual code, greps for implementing functions, and checks `git diff --stat` for unplanned changes. Output is a requirement-by-requirement verification table.

---

## Plugin Directory Structure

The complete plugin tree:

```
prism-plugin/                              # Repository root
├── .claude-plugin/
│   ├── plugin.json                        # Plugin manifest (8 lines)
│   └── marketplace.json                   # Distribution config (20 lines)
│
├── commands/                              # 25 slash commands (4,051 lines total)
│   ├── create_plan.md                     # 442 lines — opus
│   ├── research_codebase.md               # 179 lines — opus
│   ├── implement_plan.md                  #  85 lines — sonnet
│   ├── validate_plan.md                   # 167 lines — sonnet
│   ├── iterate_plan.md                    # 249 lines — opus
│   ├── decompose_plan.md                  # 334 lines — opus
│   ├── create_handoff.md                  #  78 lines — sonnet
│   ├── resume_handoff.md                  # 219 lines — sonnet
│   ├── commit.md                          #  44 lines — haiku
│   ├── describe_pr.md                     #  91 lines — sonnet
│   ├── retroactive.md                     #  80 lines — sonnet
│   ├── generate_prd.md                    # 196 lines — opus
│   ├── generate_pricing.md                # 228 lines — opus
│   ├── generate_tech_spec.md              # 252 lines — opus
│   ├── generate_user_flows.md             # 230 lines — opus
│   ├── prism-debug.md                     # 184 lines — sonnet
│   ├── prism-verify.md                    # 142 lines — sonnet
│   ├── prism-screenshot.md                #  54 lines — haiku
│   ├── prism-browse.md                    #  82 lines — sonnet
│   ├── prism_dir_update.md                # 145 lines — sonnet
│   ├── prism_cli.md                       #  93 lines — (none)
│   ├── cli-install.md                     # 132 lines — sonnet
│   ├── cli-uninstall.md                   # 150 lines — sonnet
│   ├── worktree.md                        #  90 lines — haiku
│   └── review-setup.md                    #  91 lines — haiku
│
├── agents/                                # 14 subagents (~1,750 lines total)
│   ├── codebase-locator.md                # 122 lines — haiku
│   ├── codebase-analyzer.md               # 143 lines — opus
│   ├── codebase-pattern-finder.md         # 227 lines — sonnet
│   ├── prism-locator.md                   # 134 lines — haiku
│   ├── prism-analyzer.md                  # 175 lines — opus
│   ├── web-search-researcher.md           # 108 lines — sonnet
│   ├── log-investigator.md                # 106 lines — haiku
│   ├── state-investigator.md              # 121 lines — haiku
│   ├── git-investigator.md                # 140 lines — haiku
│   ├── browser-verifier.md               #  92 lines — haiku
│   ├── graph-navigator.md                #  95 lines — haiku (knowledge graph queries)
│   ├── visual-regression-grader.md       # ~100 lines — sonnet (visual diff grading)
│   ├── spec-reviewer.md                  #  ~70 lines — sonnet (v3.0.1: spec compliance review)
│   └── quality-reviewer.md              #  ~75 lines — sonnet (v3.0.1: code quality review)
│
├── skills/                                # 18 auto-discovered skills (~2,400 lines total)
│   ├── prism/
│   │   ├── SKILL.md                       # 276 lines — sonnet (master orchestrator)
│   │   ├── references/workflow-patterns.md
│   │   └── scripts/init_prism.py          # 185 lines
│   ├── prism-init/
│   │   └── SKILL.md                       # 53 lines — haiku (project init)
│   ├── prism-research/
│   │   ├── SKILL.md                       # 121 lines — sonnet
│   │   └── references/{exploration-patterns,research-template}.md
│   ├── prism-plan/
│   │   ├── SKILL.md                       # 126 lines — opus
│   │   └── references/plan-template.md
│   ├── prism-implement/SKILL.md           # 122 lines — sonnet
│   ├── prism-validate/
│   │   ├── SKILL.md                       # 108 lines — sonnet
│   │   └── references/validation-template.md
│   ├── prism-iterate/SKILL.md             # 103 lines — opus
│   ├── prism-spectrum/SKILL.md            # 406 lines — sonnet
│   ├── prism-debug/SKILL.md               # 221 lines — sonnet
│   ├── prism-verify/
│   │   ├── SKILL.md                       # 125 lines — sonnet
│   │   └── references/{verification-template,verification-patterns}.md
│   ├── prism-prd/SKILL.md                 # 122 lines — opus
│   ├── prism-visual-docs/SKILL.md         # 146 lines — opus
│   ├── prism-release/SKILL.md             # 245 lines — full release pipeline
│   ├── prism-eval/
│   │   ├── SKILL.md                       # 237 lines — sonnet (skill eval runner)
│   │   └── references/eval-schemas.md
│   └── prism-docs-update/
│       ├── SKILL.md                       # 138 lines — VitePress docs syncer
│       └── references/section-mapping.md
│
├── scripts/                               # Automation scripts (979 lines total)
│   ├── spectrum.sh                        # 518 lines — autonomous execution loop
│   ├── prism-cli-install.sh               # 280 lines — cross-platform installer
│   └── prism-cli-install.ps1              # 181 lines — PowerShell installer
│
├── CLAUDE.md                              # 115 lines — architectural guidance
│
├── cmd/                                   # Platform implementations (Parts I–IV)
│   ├── prism-cli/                         # Go TUI dashboard
│   ├── prism-vscode/                      # VS Code extension
│   └── prism-electron/                    # Electron desktop app
│
├── packages/                              # Shared packages (Part IV)
│   ├── prism-core/                        # Platform-agnostic business logic
│   └── prism-ui/                          # Shared React components
│
├── prism-eval/                            # Eval Dashboard (Part VII) — Electron app
│   └── src/                               # 52 TS/TSX files, React 19, Tailwind v4
│
└── .prism/                                # Workflow artifacts directory
    ├── stories/                           # stories.json + per-story manifests
    ├── shared/                            # Committed: research, plans, validation
    │   ├── contracts/                     # Cross-domain interface contracts
    │   ├── designs/                       # Figma / Pencil.dev design files
    │   └── assets/                        # AI-generated images, videos, 3D models
    └── local/                             # Gitignored: per-developer artifacts
```

---

## Plugin Statistics

### Component Counts (v3.5.0)

| Category | Files | Total Lines | Change from v3.3.1 |
|----------|-------|-------------|---------------------|
| Plugin manifests | 2 | 28 | — |
| Commands | 25 | ~4,150 | — |
| Agents | 14 | ~1,750 | — |
| Skills (SKILL.md) | 20 | ~3,100 | +2 (prism-capture, prism-brand) |
| Skill references | 27 | ~3,400 | +8 (design-sources ×2, griotwave, brand-system, capture-sources, translate-canvas, claude-design-emit, pencil-layout) |
| Scripts | 11 | ~2,400 | — |
| CLAUDE.md | 1 | 115 | — |
| Hooks | 7 events | ~40 | — |
| MCP servers | 0 | 0 | — |
| **Plugin total** | **~111** | **~15,000** | **+2 skills, +8 references, idea_init pairing doc** |

### Model Assignment Distribution (v3.0.3)

| Model | Components | Typical Cost | Use Case |
|-------|------------|-------------|----------|
| **Opus** | 16 assignments | Highest | Deep analysis, planning, brainstorming, document generation |
| **Sonnet** | 26 assignments | Medium | General execution, routing, coordination, reviews |
| **Haiku** | 12 assignments | Lowest | Fast lookups, simple operations, file scanning, project init |

**Dynamic Model Selection (v3.0.1):** Skills can override agent default models at dispatch time based on task complexity. Mechanical tasks (1-2 files, clear spec) → haiku; integration tasks → sonnet; design/review → opus. See `skills/prism-spectrum/references/model-selection.md`.

### Largest Components

| Component | Type | Lines | Purpose |
|-----------|------|-------|---------|
| `create_plan.md` | Command | 442 | Interactive plan creation — most complex single prompt |
| `spectrum.sh` | Script | 518 | Shell loop with deterministic operations |
| `decompose_plan.md` | Command | 334 | Plan-to-stories with manifests and contracts |
| `prism` | Skill | 276 | Master orchestrator routing all workflows |
| `prism-spectrum` | Skill | 254 | Manifest-aware story execution with signals |
| `generate_tech_spec.md` | Command | 252 | Technical specification generation |
| `iterate_plan.md` | Command | 249 | Plan iteration with surgical edits |
| `prism-release` | Skill | 245 | Full release pipeline with eval snapshot |
| `prism-eval` | Skill | 237 | Skill evaluation runner with benchmarking |

### How the Plugin Connects to Platforms

The Claude plugin is the **brain** — the three platform implementations (CLI, VS Code, Electron) are the **body**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Claude Plugin (Part V)                         │
│   25 commands, 14 agents, 19 skills, 12 scripts, 7 hooks        │
│   Pure prompt engineering — defines workflows and behavior       │
│                                                                   │
│   Invoked by: claude CLI process                                 │
│   Output to:  .prism/shared/ directory                           │
│   Control:    XML signal protocol                                │
└──────────┬────────────────┬────────────────┬────────────────────┘
           │                │                │
           ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│  CLI (Part I) │  │ VS Code      │  │ Electron         │
│  Go TUI       │  │ (Part II)    │  │ (Part III)       │
│               │  │ TypeScript   │  │ TypeScript       │
│  Spawns       │  │              │  │                  │
│  claude CLI   │  │  Spawns      │  │  Spawns          │
│  with signal  │  │  claude CLI  │  │  claude CLI      │
│  parsing      │  │  with signal │  │  with signal     │
│               │  │  parsing     │  │  parsing         │
│  Renders:     │  │              │  │                  │
│  Stories,     │  │  Renders:    │  │  Renders:        │
│  Progress,    │  │  Stories,    │  │  V2 IDE shell,   │
│  Logs,        │  │  Chat,       │  │  Chat + Tabs,    │
│  Thinking,    │  │  Trees,      │  │  Files, Git,     │
│  Tool spinners│  │  Office,     │  │  Spectrum,       │
│  Spring anims │  │  Monitor     │  │  Office, Monitor │
└──────────────┘  └──────────────┘  └──────────────────┘

All read/write .prism/ — All parse signal protocol — All spawn claude CLI
```

The plugin's markdown files are loaded by the `claude` CLI process at session start. Every platform spawns `claude` as a child process, and the plugin's skills, commands, and agents shape how that `claude` session behaves. The platforms only provide visualization, user interaction, and process management — the actual workflow intelligence lives in the plugin's prompt engineering.

**MCP Servers (v3.0.2):** The plugin includes `codebase-memory-mcp` for structural code analysis and `chrome-devtools` (Chrome DevTools MCP, `--slim --headless --isolated`) for browser debugging escalation.

**Channels (v3.1.0):** The plugin registers `brainstorm-channel` as a stdio MCP server declaring the `claude/channel` capability. It spawns at plugin-load time and provides the wake-on-click bridge for the brainstorm visual companion — browser POSTs to the channel's HTTP endpoint trigger `notifications/claude/channel` events that wake Claude mid-session without requiring user copy/paste.

# Part II — CLI Dashboard

Prism CLI is a Go 1.23 terminal user interface that provides real-time monitoring and control of the Spectrum autonomous development workflow. It spawns Claude Code CLI sessions to execute stories from a `stories.json` file, displays streaming tool activity, tracks progress with spring-animated UI elements, and renders a procedural 3D splash screen using software rasterization.

### Key Features (CLI)

- **13 views**: Splash, Onboarding, Home menu, Research browser, Plans browser, Spectrum execution dashboard, Files browser, Git integration, Agent chat, Monitor dashboard, Browser verification, Workspaces manager
- **Plugin architecture**: 11 composable plugins with shared context, event bus, epoch-based staleness, and lifecycle management
- **Real-time execution monitoring**: Streaming Claude CLI output with tool activity extraction
- **Procedural splash screen**: Icosahedron mesh, beam particles, spectral wave field, and ANSI true-color rendering
- **3D animated prism logo**: FauxGL software rasterizer with half-block Unicode encoding
- **Spring physics animations**: Harmonica-driven progress bars, story pop effects, log slide-ins
- **Signal-based workflow control**: XML protocol for Continue, Retry, Blocked, Error, Complete
- **Multi-epic support**: Tab-based epic switching with independent story sets
- **App shell**: Powerline tab bar, context-aware sidebar, two-tier status footer
- **Terminal detection**: Auto-detects IDE (VS Code, Cursor, Windsurf), theme colors, Nerd Font support
- **Diff rendering**: Unified and side-by-side views with syntax highlighting and word-level diffs
- **Modal & dialog system**: Layered overlays with focus cycling, permission prompts, command palette
- **File watcher**: fsnotify-based real-time file change detection with debouncing and EventBus integration
- **Persisted UI state**: Per-project state persistence (open tabs, expanded dirs, diff mode) across sessions
- **Fuzzy file finder**: Project-wide fuzzy file search overlay with scoring algorithm
- **Content search**: Ripgrep-powered project-wide content search with result navigation
- **Conversation browser**: Multi-adapter session scanning (Claude Code `.jsonl` files)
- **Interactive agent chat**: Live Claude CLI streaming with thinking blocks, tool spinners, and structured content parts
- **Thinking block visualization**: Extended thinking rendered as dim italic `💭` text in real-time
- **Tool activity spinners**: Animated braille spinners (80ms tick) for running tools with status indicators
- **Enhanced status bar**: Phase name, active tool, elapsed time, and signal display during streaming
- **Uninstaller**: `--uninstall` flag for clean removal of binary, PATH entries, and global config
- **Demo mode**: 36 pre-seeded stories with auto-progression for previewing animations

### Technology Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Prism CLI v2.4.9                             │
├──────────────┬──────────────┬──────────────┬────────────┬───────────┤
│  Bubble Tea  │   Lipgloss   │  Harmonica   │  FauxGL    │  Termenv  │
│  TUI         │   Styling    │  Spring      │  3D        │  Terminal │
│  Framework   │   & Layout   │  Physics     │  Rendering │  Detect   │
├──────────────┴──────────────┴──────────────┴────────────┴───────────┤
│  Bubbles (spinner, viewport, paginator, progress, textarea)         │
├─────────────────────────────────────────────────────────────────────┤
│  Bubblezone (mouse click zones)  │  Chroma (syntax highlighting)    │
├──────────────────────────────────┴──────────────────────────────────┤
│  Cobra CLI Framework                                                │
├─────────────────────────────────────────────────────────────────────┤
│  Go 1.23.0                                                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Codebase Statistics

| Metric | Value |
|--------|-------|
| Total Lines of Code | ~27,000 |
| Production Code | ~25,211 lines |
| Test Code | ~1,800 lines (18 test files) |
| Go Files | 85 |
| Packages | 19 |
| Direct Dependencies | 8 |

---

## Architecture

### Package Structure

```
apps/prism-cli/
├── main.go                         # CLI entry point, Cobra commands, flag parsing, uninstaller (340 lines)
├── Makefile                        # Build targets (67 lines)
├── go.mod                          # Dependencies (Go 1.23.0)
├── build.sh                        # Single-platform build script
│
├── app/                            # Bubble Tea UI — Elm Architecture (27 files, ~14,000 lines)
│   ├── model.go                    # Model struct, AnimState, NewModel/NewDemoModel
│   ├── update.go                   # Update handler, message routing, state transitions
│   ├── view.go                     # View router, modal overlay compositing
│   ├── views.go                    # ActiveView enum (13 views), FileEntry, ResearchState, PlansState, EpicInfo
│   ├── view_splash.go              # Splash screen thin wrapper
│   ├── shell.go                    # App shell: tab bar + sidebar + footer layout, breadcrumbs
│   ├── sidebar.go                  # Sidebar component: logo, execution info, files, gates, epics
│   ├── footer.go                   # Two-tier footer: key hints + powerline status bar
│   ├── commands.go                 # Async Bubble Tea commands (LoadStories, DiscoverEpics, etc.)
│   ├── command_palette.go          # Command palette: fuzzy search, modal builder
│   ├── content_search.go           # Project-wide content search via ripgrep (F-5)
│   ├── file_finder.go              # Fuzzy file search overlay with scoring algorithm (F-4)
│   ├── messages.go                 # All message type definitions (~35 message types)
│   │
│   ├── plugin_home.go              # Home screen plugin (menu, 214 lines)
│   ├── plugin_research.go          # Research file browser plugin (230 lines)
│   ├── plugin_plans.go             # Plans file browser plugin + decompose (245 lines)
│   ├── plugin_spectrum.go          # Spectrum dashboard plugin (1,218 lines — LARGEST)
│   ├── plugin_files.go             # File tree browser plugin, two-pane + tabs + edit + blame (1,407 lines)
│   ├── plugin_git.go               # Git integration plugin: status, diff, stage, commit, push, pull, stash (1,530 lines)
│   ├── plugin_agent.go             # Agent chat plugin: conversations, adapters, analytics (1,051 lines)
│   ├── plugin_monitor.go           # System monitor plugin: health, history, gates, agents (917 lines)
│   ├── plugin_browser.go           # Browser verification plugin: sessions, history, artifacts (726 lines)
│   ├── plugin_workspaces.go        # Multi-project workspace + worktree + kanban manager (1,981 lines)
│   ├── plugin_onboarding.go        # First-run setup wizard + legacy migration (685 lines)
│   │
│   ├── adapter/                    # AI agent conversation scanning
│   │   ├── adapter.go              # Adapter interface, Session struct (35 lines)
│   │   ├── claude.go               # ClaudeAdapter: scans ~/.claude/projects/ .jsonl files (334 lines)
│   │   └── claude_test.go          # Adapter tests
│   │
│   └── chat/
│       └── renderer.go             # Chat message rendering (user/assistant/tool)
│
├── plugin/                         # Plugin system framework (5 files, 397 lines)
│   ├── plugin.go                   # Plugin interface (11 methods)
│   ├── registry.go                 # Plugin registry: register, activate, broadcast, reinit
│   ├── context.go                  # Shared plugin context struct (16 fields)
│   ├── events.go                   # EventBus + 11 concrete event types
│   └── messages.go                 # Inter-plugin messages (FocusPluginMsg, PluginResizeMsg)
│
├── domain/                         # Business logic — no UI dependencies (6 files, 850 lines)
│   ├── story.go                    # Story/Plan/File/Step structs, dependency resolution, CRUD
│   ├── signals.go                  # Signal parsing (Complete, Continue, Retry, Blocked, Error)
│   ├── progress.go                 # progress.md file management
│   ├── story_test.go               # Story dependency/selection tests
│   ├── signals_test.go             # Signal detection tests
│   └── progress_test.go            # Progress path derivation tests
│
├── claude/                         # Claude CLI process management (3 files, 728 lines)
│   ├── runner.go                   # Process spawning, streaming output, lifecycle
│   ├── parser.go                   # Real-time output parsing (phases, signals, gates)
│   └── events.go                   # Stream-JSON event deserialization, tool formatting
│
├── state/                          # Per-project persisted UI state (2 files, 113 lines)
│   ├── state.go                    # Store: Load/Save to ~/.config/prism-cli/state/<hash>.json
│   └── state_test.go               # State persistence tests
│
├── watcher/                        # Real-time file change detection (2 files, 235 lines)
│   ├── watcher.go                  # fsnotify wrapper: debouncing, filtering, EventBus integration
│   └── watcher_test.go             # Watcher tests
│
├── styles/                         # Visual theming (5 files, 1,455 lines)
│   ├── theme.go                    # Color palette, component styles, prism variants, theme overrides
│   ├── gradient.go                 # Gradient interpolation, braille canvas, shimmer
│   ├── powerline.go                # Powerline segments, icons (Nerd Font + ASCII fallback)
│   ├── borders.go                  # Gradient border rendering, ANSI-aware truncation
│   └── borders_test.go             # Border rendering tests
│
├── modal/                          # Modal dialog system (5 files, 1,452 lines)
│   ├── modal.go                    # Base modal: focus cycling, key/mouse handling, rendering
│   ├── input.go                    # InputSection (text input) + TextareaSection
│   ├── list.go                     # ListSection (scrollable selection)
│   ├── layout.go                   # Two-pass layout pipeline, viewport, scrollbar
│   └── section.go                  # Section interface + Text, Spacer, Buttons, Checkbox, When
│
├── dialog/                         # Dialog overlay system (3 files, 638 lines)
│   ├── dialog.go                   # Dialog interface, Action enum, Overlay stack
│   ├── confirm.go                  # Confirmation dialog (Confirm/Cancel)
│   └── permissions.go              # Permission dialog (Allow/Allow Session/Deny)
│
├── diff/                           # Diff parsing & rendering (5 files, 1,753 lines)
│   ├── parser.go                   # Unified diff parser, word-level diff computation
│   ├── renderer.go                 # Unified + side-by-side rendering with word highlights
│   ├── highlight.go                # Chroma syntax highlighting integration
│   ├── parser_test.go              # Parser tests
│   └── renderer_test.go            # Renderer tests
│
├── ui/                             # Reusable UI primitives (6 files, 399 lines)
│   ├── pane.go                     # Two-pane layout calculator
│   ├── scrollbar.go                # Vertical scrollbar renderer
│   ├── divider.go                  # Vertical divider renderer
│   ├── pane_test.go                # Pane tests
│   ├── scrollbar_test.go           # Scrollbar tests
│   └── divider_test.go             # Divider tests
│
├── registry/                       # Global workspace registry (2 files, 222 lines)
│   ├── registry.go                 # ~/.prism/workspaces.json: register, load, prune, cross-process locking
│   └── registry_test.go            # Registry tests
│
├── terminal/                       # Terminal environment detection (2 files, 999 lines)
│   ├── detect.go                   # Terminal, shell, color profile, Nerd Font, git branch detection
│   └── theme.go                    # IDE theme color extraction (accent, foreground, editor bg)
│
├── splash/                         # Procedural splash animation (2 files, 883 lines)
│   ├── splash.go                   # Icosahedron mesh, beam particles, spectral wave, ANSI render
│   └── mesh_data.go                # Embedded mesh: 444 vertices, 360 faces
│
├── markdown/                       # Markdown rendering (2 files)
│   ├── renderer.go                 # Glamour wrapper: Render(), RenderDark(), Available()
│   └── renderer_test.go            # Renderer tests
│
├── prism/                          # 3D prism rendering engine
│   ├── prism.go                    # FauxGL renderer, half-block ANSI encoding (266 lines)
│   ├── framebuffer/
│   │   └── buffer.go               # RGBA pixel buffer (63 lines)
│   ├── prism-test.obj              # Embedded 3D mesh (444 vertices, 360 faces)
│   └── prism-test.mtl              # Material definition
│
└── testdata/
    └── stories.json                # Test fixture (75 lines)
```

### Elm Architecture Pattern

The application follows the Elm Architecture (Model-Update-View), extended with a plugin system:

```
                    ┌─────────────────────────┐
                    │        User Input        │
                    │   (keyboard, mouse,      │
                    │    resize, tick)          │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │     tea.Msg (message)    │
                    │  KeyMsg, TickMsg,        │
                    │  PluginResizeMsg, etc.   │
                    └────────────┬────────────┘
                                 │
                                 ▼
┌──────────┐       ┌─────────────────────────┐       ┌──────────┐
│          │       │     Update(msg)         │       │          │
│  Model   │──────▶│  Priority chain:        │──────▶│  Model'  │
│  (state) │       │  1. Type switch          │       │ (new)    │
│          │       │  2. Key priority chain   │       │          │
└──────────┘       │  3. Plugin broadcast     │       └─────┬────┘
                   └────────────┬────────────┘             │
                                │                          ▼
                   ┌──────────────────┐       ┌──────────────────────┐
                   │   tea.Cmd        │       │     View(model)      │
                   │  (side effects)  │       │  1. Splash/Onboard   │
                   │  RunClaude,      │       │  2. Plugin content    │
                   │  LoadStories,    │       │  3. App shell wrap    │
                   │  Broadcast       │       │  4. Modal overlay     │
                   └──────────────────┘       │  5. Dialog overlay    │
                                              └──────────────────────┘
```

### Data Flow

```
stories.json           Claude CLI              Terminal Detection
    │                      │                      │
    ▼                      ▼                      ▼
┌────────┐          ┌──────────┐          ┌──────────────┐
│ domain │          │  claude/  │          │  terminal/   │
│ .Load  │          │  runner   │          │  detect      │
│ Stories│          │  .Start() │          │  .Detect()   │
└───┬────┘          └────┬─────┘          └──────┬───────┘
    │                    │                        │
    ▼                    ▼                        ▼
┌────────────────────────────────────────────────────┐
│              app/update.go                         │
│                                                    │
│  WindowSizeMsg ──▶ Resize + Broadcast              │
│  TickMsg ──▶ Animate + Broadcast                   │
│  SplashDoneMsg ──▶ View transition                 │
│  KeyMsg ──▶ Priority chain → Plugin delegate       │
│  default ──▶ Broadcast to all plugins              │
│                                                    │
│  Plugin Registry manages 10 plugins:               │
│  Home, Research, Plans, Spectrum, Files,           │
│  Git, Agent, Monitor, Workspaces, Onboarding       │
└────────────────────┬───────────────────────────────┘
                     │
                     ▼
         ┌───────────────────┐              ┌──────────────┐
         │  app/view.go      │              │              │
         │  + shell.go       │─────────────▶│   Rendered   │
         │  + sidebar.go     │              │   Terminal   │
         │  + footer.go      │              │              │
         └───────────────────┘              └──────────────┘
```

---

## Getting Started

### Build

```bash
cd apps/prism-cli

make build          # Build for current platform → bin/prism-cli
make build-all      # Cross-compile (windows/darwin/linux × amd64/arm64)
make test           # Run tests: go test -v ./...
make lint           # Run golangci-lint
make install        # Install to GOPATH/bin
make run ARGS=..    # Development run
make clean          # Remove bin/ and go clean
make help           # Display help text
```

### Run

```bash
# Direct with stories file
prism-cli .prism/stories/stories.json

# Auto-discover .prism/ in current directory
prism-cli

# Demo mode (no stories.json needed)
prism-cli --demo

# Force onboarding flow (testing)
prism-cli --onboarding

# With options
prism-cli -f stories.json -n 100 -p 5 --prism-style braille
```

### CLI Flags

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--file` | `-f` | `""` | Path to stories.json |
| `--max-iterations` | `-n` | `50` | Maximum iterations before stopping |
| `--pause` | `-p` | `2` | Seconds between iterations |
| `--demo` | | `false` | Run with simulated stories |
| `--onboarding` | | `false` | Force onboarding flow (for testing/refining the setup wizard) |
| `--prism-style` | | `gradient` | Animation style: `gradient` `simple` `braille` `ascii` |
| `--uninstall` | | `false` | Remove prism-cli binary, PATH entries, and global `~/.prism/` directory |

Auto-generated: `--version`, `--help`/`-h`

#### Uninstall System

The `--uninstall` flag provides clean removal:
1. Prompts for `yes` confirmation via stdin
2. Removes binary from `~/.prism/bin/` (both `prism-cli` and `prism-cli.exe`)
3. Cleans shell profiles (`.zshrc`, `.bashrc`, `.bash_profile`) — removes lines containing `.prism/bin` or `# Prism CLI`
4. On Windows: cleans PowerShell profile (auto-detects `pwsh.exe` or `powershell.exe`)
5. Removes entire `~/.prism/` directory (global config, not per-project)
6. Does NOT touch per-project `.prism/` directories

### Initial View Selection

```
--demo flag set           → ViewSplash → Home (demo mode)
stories.json provided     → ViewSplash → Home or Onboarding
No stories.json, .prism/  → ViewSplash → Onboarding (if needed) → Home
No .prism/ directory      → ViewSplash → Onboarding (auto-set)
Legacy thoughts/ dir      → ViewSplash → Onboarding (legacy migration)
```

The splash screen always displays first (5-second timer or any keypress to skip). After splash, the app transitions to Onboarding if `.prism/` doesn't exist or `stories.json` is missing, otherwise to Home. Legacy `thoughts/` directories trigger the onboarding migration flow.

After TUI exits, the project is auto-registered in the global workspace registry (`~/.prism/workspaces.json`) via `registry.Register()`. The terminal G0 charset is also reset (`\x1b(B\x1b[0m`) to prevent DEC Special Graphics mode from persisting into the parent shell.

---

## Plugin System

### Plugin Interface

Every screen in the TUI is implemented as a plugin conforming to `plugin.Plugin` (11 methods):

| Method | Signature | Purpose |
|--------|-----------|---------|
| `ID()` | `string` | Unique identifier (e.g. `"home"`, `"spectrum"`) |
| `Name()` | `string` | Human-readable name for tab display |
| `Icon()` | `string` | Emoji/symbol for tab bar |
| `Init(ctx *Context)` | `error` | Initialization with shared context |
| `Start()` | `tea.Cmd` | Called when first activated |
| `Stop()` | `void` | Called on deactivation |
| `Update(msg tea.Msg)` | `(Plugin, tea.Cmd)` | Bubble Tea message handler |
| `View(width, height int)` | `string` | Render content for given dimensions |
| `IsFocused()` | `bool` | Whether this plugin is the active view |
| `SetFocused(bool)` | `void` | Sets focus state |
| `KeyHints()` | `[]KeyHint` | Footer key-hint list |

### Plugin Context

Shared state passed to all plugins during `Init()`:

| Field | Type | Description |
|-------|------|-------------|
| `PrismDir` | `string` | Path to `.prism/` directory |
| `ProjectDir` | `string` | Project root directory |
| `StoriesPath` | `string` | Path to active `stories.json` |
| `Width` | `int` | Terminal width |
| `Height` | `int` | Terminal height |
| `DemoMode` | `bool` | Whether running in demo mode |
| `PrismStyle` | `string` | Prism rendering style |
| `MaxIterations` | `int` | Max Spectrum iterations |
| `Pause` | `int` | Seconds between iterations |
| `HasNerdFont` | `bool` | Terminal supports Nerd Font glyphs |
| `EventBus` | `*EventBus` | Inter-plugin pub/sub communication |
| `WorkDir` | `string` | Working directory at startup |
| `GitRoot` | `string` | Git repository root directory |
| `ConfigDir` | `string` | User config directory (`~/.config/prism-cli`) |
| `Epoch` | `uint64` | Monotonic counter incremented on project switch (for staleness detection) |
| `HasLegacyDir` | `bool` | Whether a legacy `thoughts/` directory was detected |
| `LegacyDir` | `string` | Path to legacy `thoughts/` directory (for migration) |

### Epoch-Based Staleness

`Context.Epoch` is a critical architectural pattern. When the user switches projects (via Workspaces), `Registry.Reinit()` increments the epoch. All async `tea.Cmd` results carry the epoch at which they were dispatched. Handlers compare the message epoch against the current `Context.Epoch` — if they differ, the result is from a previous project and is silently discarded. This prevents stale file lists, story data, or Claude output from a previous project from corrupting the current view.

Example: User is viewing Project A's files. An async `ListFilesCmd` was dispatched at epoch 5. Before it returns, the user switches to Project B (epoch becomes 6). When the file list result arrives with epoch 5, the handler sees `5 != 6` and discards it, preventing Project A's files from appearing in Project B's view.

### Plugin Registry

The registry manages plugin lifecycle:

1. **Registration** (`Register`): Validates ID uniqueness, calls `Init(ctx)` with panic recovery, first plugin is auto-activated
2. **Activation** (`SetActive`): Unfocuses previous, focuses new plugin
3. **Broadcast** (`Broadcast`): Routes messages to ALL plugins, collects commands
4. **Reinit** (`Reinit`): Increments `Context.Epoch`, stops all plugins, re-initializes with current context (used on project switch)

### Event Bus

Thread-safe pub/sub communication (`sync.RWMutex`) with these event types:

| Event | Type String | Fields |
|-------|-------------|--------|
| `StoryCompletedEvent` | `"story.completed"` | StoryID, StoryTitle |
| `FileChangedEvent` | `"file.changed"` | FilePath, Action |
| `BranchChangedEvent` | `"branch.changed"` | Branch |
| `EpicSwitchedEvent` | `"epic.switched"` | EpicName, StoriesPath |
| `ProjectSwitchedEvent` | `"project.switched"` | ProjectDir, PrismDir, StoriesPath |
| `AgentStatusEvent` | `"agent.status"` | AgentID, Status, Model, Activity |
| `ConversationChangedEvent` | `"conversation.changed"` | FilePath, Action |
| `QualityGateResultEvent` | `"gate.result"` | Gate, Passed, Output |
| `WorktreeChangedEvent` | `"worktree.changed"` | Action, Path |
| `BrowserVerificationEvent` | `"browser.verification"` | URL, Status, ScreenshotPath, ConsoleErrors |
| `BrowserSessionEvent` | `"browser.session"` | SessionID, Action, URL |

### Registered Plugins (in order)

| # | Plugin ID | Plugin Name | Source File | Lines |
|---|-----------|-------------|-------------|-------|
| 1 | `home` | Home | `plugin_home.go` | 214 |
| 2 | `research` | Research | `plugin_research.go` | 230 |
| 3 | `plans` | Plans | `plugin_plans.go` | 245 |
| 4 | `spectrum` | Spectrum | `plugin_spectrum.go` | 1,218 |
| 5 | `files` | Files | `plugin_files.go` | 1,407 |
| 6 | `git` | Git | `plugin_git.go` | 1,530 |
| 7 | `agent` | Agent | `plugin_agent.go` | 1,051 |
| 8 | `monitor` | Monitor | `plugin_monitor.go` | 917 |
| 9 | `browser` | Browser | `plugin_browser.go` | 726 |
| 10 | `workspaces` | Workspaces | `plugin_workspaces.go` | 1,981 |
| 11 | `onboarding` | Onboarding | `plugin_onboarding.go` | 685 |

### Tab Order

The tab bar displays 10 tabs (excluding Splash and Onboarding):

```
[1] Home  [2] Research  [3] Plans  [4] Spectrum  [5] Files  [6] Git  [7] Agent  [8] Monitor  [9] Browser  [0] Workspaces
```

---

## Screen Reference

### 1. Splash Screen

Full-screen procedural animation displayed for 5 seconds on startup (or until any key is pressed). Features a rotating icosahedron mesh, beam particle system, spectral wave field, and centered "P R I S M" title.

#### UI Layout

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║        ·  .  ,  :  -  =  +  *  #  %  @                                     ║
║     (spectral wave field fills background                                    ║
║      using ASCII density ramp)                                               ║
║                                                                              ║
║              ████████                     ═══════                            ║
║            ██████████████                  ═══════════                       ║
║          ████████████████████               ═══════════════                  ║
║            ██████████████    (beam particles with glow)                      ║
║              ████████                                                        ║
║          (icosahedron mesh                                                   ║
║           with lighting)                                                     ║
║                                                                              ║
║                         P  R  I  S  M                                       ║
║                    ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬                                  ║
║                     spectrum gradient bar                                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

#### Rendering Pipeline

1. Project 444 mesh vertices through Y/X/Z rotation + perspective
2. Rasterize 360 triangles with barycentric interpolation + back-face culling
3. Build beam light grid from particles with Gaussian glow falloff
4. Compute title layout ("P R I S M", gradient bar, subtitle)
5. Per-cell: combine wave field, beam particles, mesh overlay, halo dimming
6. Stamp title text in near-white (232, 232, 240)
7. Stamp gradient bar using 4-stop spectrum gradient
8. Convert cell grid to ANSI true-color string

#### IDE Boost Mode

When running in an IDE terminal (`BoostColors=true`), color parameters are intensified for better visibility against IDE backgrounds.

---

### 2. Onboarding Screen

A full-screen setup wizard displayed after the splash when `.prism/` directory or `stories.json` is missing. Walks through 4 steps to initialize the project.

#### Four Steps

| Step | Title | Description | Auto-detect |
|------|-------|-------------|-------------|
| 1 | Project Directory | Detect or select project directory | Yes — `os.Getwd()` |
| 2 | .prism/ Directory | Check/create .prism/ directory structure | Yes — `os.Stat` |
| 3 | Claude CLI | Verify claude CLI is installed | Yes — `exec.LookPath` |
| 4 | Stories File | Verify/create stories.json | Yes — `os.Stat` |

#### UI Layout

```
  ██▀▀█▄ ██▀▀█▄ ▀██▀ ▄██▀▀ ██▄▀▄██
  ██▄▄█▀ ██▄▄█▀  ██  ▀██▄  ██ ▀ ██
  ██     ██  ██ ▄██▄ ▄▄██▀ ██   ██

  Welcome to Prism CLI! Let's set up your project.

  ✓  Project Directory     Detected: /Users/demo/project
  ▶  .prism/ Directory     Check for .prism/ directory structure
  ○  Claude CLI            Verify claude CLI is installed
  ○  Stories File          Verify stories.json exists

  Step 2 of 4

  enter execute   j/k navigate
```

#### Key Bindings

| Key | Action |
|-----|--------|
| `Enter` / `Space` | Execute current step action |
| `j` / `↓` | Next step |
| `k` / `↑` | Previous step |

Steps auto-advance when already satisfied. On completion, emits `OnboardingCompleteMsg` to transition to Home.

#### UI Layout — Migration Flow

When `HasLegacyDir == true` (legacy `thoughts/` directory detected), the welcome text and step descriptions change:

```
  ██▀▀█▄ ██▀▀█▄ ▀██▀ ▄██▀▀ ██▄▀▄██
  ██▄▄█▀ ██▄▄█▀  ██  ▀██▄  ██ ▀ ██
  ██     ██  ██ ▄██▄ ▄▄██▀ ██   ██

  Legacy Project Detected
  Found thoughts/ directory — let's migrate to .prism/

  ▶  Project Directory     Detected: /Users/demo/project
  ○  .prism/ Directory     Migrate thoughts/ → .prism/
  ○  Claude CLI            Verify claude CLI is installed
  ○  Stories File          Verify stories.json exists

  Step 1 of 4

  enter execute   j/k navigate
```

#### UI Layout — Completed State

After all 4 steps finish successfully:

```
  ██▀▀█▄ ██▀▀█▄ ▀██▀ ▄██▀▀ ██▄▀▄██
  ██▄▄█▀ ██▄▄█▀  ██  ▀██▄  ██ ▀ ██
  ██     ██  ██ ▄██▄ ▄▄██▀ ██   ██

  ✓ Setup Complete!
  Navigating to Home...

  ✓  Project Directory     Detected: /Users/demo/project
  ✓  .prism/ Directory     Created .prism/ structure
  ✓  Claude CLI            Found: /usr/local/bin/claude
  ✓  Stories File          Found stories.json

  Progress: 4/4 steps complete
```

Automatically transitions to Home screen after a short delay.

---

### 3. Home Screen

The landing screen after splash/onboarding. Features a static ASCII PRISM logo with a 4-stop spectrum gradient and a 3-item navigation menu.

#### UI Layout

```
╭──────────────────────────────────────────────────────────────────────────────╮
│                                                                              │
│  '||''|.  '||''|.   '||'  .|'''.|  '||    ||'                              │
│   ||   ||  ||   ||   ||   ||..  '   |||  |||                               │
│   ||...|'  ||''|'    ||    ''|||.   |'|..'||                               │
│   ||       ||   |.   ||  .     '||  | '|' ||                              │
│  .||.     .||.  '|' .||. |'....|'  .|. | .||.                             │
│                                                                              │
│  [Spectrum Gradient — Blue → Teal → Green → Amber]                          │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯

  >  [1]  Research      Browse and create research documents

     [2]  Plans         View and decompose implementation plans

     [3]  Spectrum      Execute stories autonomously


      j/k navigate   enter select   q quit
```

#### Key Bindings

| Key | Action |
|-----|--------|
| `j` / `↓` | Next menu item (wraps around) |
| `k` / `↑` | Previous menu item (wraps around) |
| `Enter` / `Space` | Navigate to selected screen |
| `1` | Jump to Research |
| `2` | Jump to Plans |
| `3` | Jump to Spectrum |

#### Mouse Support

- Scroll wheel cycles menu items
- Left-click on a menu item navigates to it (zone IDs: `home:menu-0`, `home:menu-1`, `home:menu-2`)

---

### 4. Research Screen

A file browser for `.prism/shared/research/` markdown documents. Two sub-modes: **list mode** and **viewer mode**.

#### UI Layout — List Mode

```
 PRISM  > Research                                                    ← Breadcrumb
────────────────────────────────────────────────────────────────────────
> 2026-02-12  tech-stack-evaluation                                    ← CurrentStyle
    Evaluated React vs Svelte vs Solid for frontend framework.         ← DimStyle (preview)
    Recommendation: React with Next.js for SSR support.                ← DimStyle (preview)
  2026-02-08  auth-patterns                                            ← PendingStyle
  2026-02-04  database-schema-design                                   ← PendingStyle

  j/k navigate   enter view   esc home
```

#### UI Layout — Viewer Mode

```
 PRISM  > Research                                                    ← Breadcrumb
────────────────────────────────────────────────────────────────────────
# Tech Stack Evaluation                                                │
                                                                       │
## Summary                                                             │ viewport.Model
Evaluated React vs Svelte vs Solid for frontend framework...           │ (scrollable)
                                                                       │
## Findings                                                            │
...                                                                    │
────────────────────────────────────────────────────────────────────────
  esc back   j/k scroll
```

#### UI Layout — Empty State

When no research documents exist in `.prism/shared/research/`:

```
 PRISM  > Research                                                    ← Breadcrumb
────────────────────────────────────────────────────────────────────────

  No research files found.
  Add .md files to .prism/shared/research/

  j/k navigate   enter view   esc home
```

#### Key Bindings — List Mode

| Key | Action |
|-----|--------|
| `j` / `↓` | Next file (clamped, no wrap) |
| `k` / `↑` | Previous file (clamped, no wrap) |
| `Enter` | Open file in scrollable viewport |
| `Esc` / `Backspace` | Return to Home |

#### Key Bindings — Viewer Mode

| Key | Action |
|-----|--------|
| `Esc` / `Backspace` | Close viewer, return to list |
| `j` / `k` / `↑` / `↓` | Scroll viewport |
| `PgUp` / `PgDn` | Page scroll |

---

### 5. Plans Screen

Identical to Research screen but browses `.prism/shared/plans/` and adds a **decompose** command.

#### UI Layout — List Mode

```
 PRISM  > Plans                                                       ← Breadcrumb
────────────────────────────────────────────────────────────────────────
> 2026-02-28  feature-implementation                                    ← CurrentStyle
    Phase 1: Set up database schema and migrations                     ← DimStyle (preview)
    Phase 2: Implement API endpoints for CRUD operations               ← DimStyle (preview)
  2026-02-20  auth-system-redesign                                      ← PendingStyle
  2026-02-15  performance-optimization                                  ← PendingStyle

  j/k navigate   enter view   d decompose to epic   esc home
```

#### UI Layout — Viewer Mode

```
 PRISM  > Plans                                                       ← Breadcrumb
────────────────────────────────────────────────────────────────────────
# Feature Implementation Plan                                          │
                                                                       │
## Phase 1: Database Schema                                            │ viewport.Model
- Create initial migration files                                       │ (scrollable)
- Set up connection pooling                                            │
                                                                       │
## Phase 2: API Endpoints                                              │
...                                                                    │
────────────────────────────────────────────────────────────────────────
  esc back   j/k scroll
```

#### Additional Key Binding

| Key | Action |
|-----|--------|
| `d` | Decompose selected plan into an epic (creates `.prism/stories/<name>/stories.json`) |

---

### 6. Spectrum Execution Dashboard

The primary operational screen. Displays real-time execution progress with 6 sub-panels arranged vertically.

#### UI Layout — Full Dashboard

```
╭──────────────────────────────────────────────────────────────────────────────╮
│  user-auth (8/12)   dashboard (12/36)   notifications (0/9)   [tab] switch  │
╰──────────────────────────────────────────────────────────────────────────────╯
 PRISM TUI                                          Iteration: 3/50  [?] help
╭──────────────────────────────────────────────────────────────────────────────╮
│                                                                              │
│  ▀▀▄▄▀▀▄▄▀▀    '||''|.  '||''|.   '||'  .|'''.|  '||    ||'               │
│  ▄▄▀▀▄▄▀▀▄▄     ||   ||  ||   ||   ||   ||..  '   |||  |||                │
│  ▀▀▄▄▀▀▄▄▀▀     ||...|'  ||''|'    ||    ''|||.   |'|..'||                │
│  ▄▄▀▀▄▄▀▀▄▄     ||       ||   |.   ||  .     '||  | '|' ||               │
│  ▀▀▄▄▀▀▄▄▀▀    .||.     .||.  '|' .||. |'....|'  .|. | .||.              │
│                                                                              │
│  Plan: Feature Implementation  ████████████░░░░░░░░░░░░░░  12/36 (33%)      │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
╭────────────── 40% ──────────────╮╭───────────────── 60% ────────────────────╮
│ STORIES                         ││ CURRENT ACTIVITY                         │
│ ────────────────────────────    ││ ─────────────────────────────────────    │
│ ✓ DEMO-001 Initialize spri...  ││ ▸ DEMO-013: Implement auto-expandi...   │
│ ✓ DEMO-002 Implement progr...  ││                                          │
│ ✓ DEMO-003 Add story compl...  ││ Status: ⣾ Working...                    │
│ ✓ DEMO-004 Create active s...  ││                                          │
│ ✓ DEMO-005 Implement log e...  ││ Editing: .../services/user.ts           │
│ ✓ DEMO-006 Add prism logo ...  ││                                          │
│ ✓ DEMO-007 Optimize animat...  ││ Recent:                                  │
│ ✓ DEMO-008 Test all animat...  ││   Reading: .../components/Auth.tsx       │
│ ✓ DEMO-009 Create TipTap R...  ││   Bash: npm run typecheck               │
│ ✓ DEMO-010 Build FormatToo...  ││   Grep: Searching: handleSubmit         │
│ ✓ DEMO-011 Implement markd...  ││   Edit: .../utils/validation.ts         │
│ ✓ DEMO-012 Create NoteCard...  ││   Read: package.json                    │
│   ● ○ ○ [a/s]                  ││                                          │
╰─────────────────────────────────╯╰──────────────────────────────────────────╯
╭──────────────────────────────────────────────────────────────────────────────╮
│ LOG OUTPUT                                                    [z/x scroll]  │
│ ─────────────────────────────────────────────────────────────────────────── │
│ [14:32:05] INFO  Prism CLI v2.4.9                                          │
│ [14:32:05] INFO  Starting iteration 1                                      │
│ [14:32:15] OK    DEMO-009 completed (commit: abc123)                       │
│ [14:32:20] INFO  Starting iteration 2                                      │
│ [14:32:35] OK    Quality gates passed                                      │
│ [14:32:40] OK    DEMO-010 completed (commit: def456)                       │
│   ● ○                                                                       │
╰──────────────────────────────────────────────────────────────────────────────╯
 ▸ RUNNING               Elapsed: 2m 15s               [q]uit [p]ause [/]skip
```

#### UI Layout — Idle State

```
╭──────────────────────────────────────────────────────────────────────────────╮
│  user-auth (0/12)   dashboard (0/36)   notifications (0/9)   [tab] switch   │
╰──────────────────────────────────────────────────────────────────────────────╯
 PRISM TUI                                          Iteration: 0/50  [?] help
╭──────────────────────────────────────────────────────────────────────────────╮
│                                                                              │
│  ▀▀▄▄▀▀▄▄▀▀    '||''|.  '||''|.   '||'  .|'''.|  '||    ||'               │
│  ▄▄▀▀▄▄▀▀▄▄     ||   ||  ||   ||   ||   ||..  '   |||  |||                │
│  ▀▀▄▄▀▀▄▄▀▀     ||...|'  ||''|'    ||    ''|||.   |'|..'||                │
│  ▄▄▀▀▄▄▀▀▄▄     ||       ||   |.   ||  .     '||  | '|' ||               │
│  ▀▀▄▄▀▀▄▄▀▀    .||.     .||.  '|' .||. |'....|'  .|. | .||.              │
│                                                                              │
│  Plan: Feature Implementation  ░░░░░░░░░░░░░░░░░░░░░░░░░░  0/36 (0%)       │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
╭────────────── 40% ──────────────╮╭───────────────── 60% ────────────────────╮
│ STORIES                         ││ CURRENT ACTIVITY                         │
│ ────────────────────────────    ││ ─────────────────────────────────────    │
│ ○ DEMO-001 Initialize spri...  ││                                          │
│ ○ DEMO-002 Implement progr...  ││ Press Enter to start execution           │
│ ○ DEMO-003 Add story compl...  ││                                          │
│ ○ DEMO-004 Create active s...  ││                                          │
│ ○ DEMO-005 Implement log e...  ││                                          │
│ ○ DEMO-006 Add prism logo ...  ││                                          │
│ ○ DEMO-007 Optimize animat...  ││                                          │
│ ○ DEMO-008 Test all animat...  ││                                          │
│ ○ DEMO-009 Create TipTap R...  ││                                          │
│ ○ DEMO-010 Build FormatToo...  ││                                          │
│ ○ DEMO-011 Implement markd...  ││                                          │
│ ○ DEMO-012 Create NoteCard...  ││                                          │
│   ● ○ ○ [a/s]                  ││                                          │
╰─────────────────────────────────╯╰──────────────────────────────────────────╯
╭──────────────────────────────────────────────────────────────────────────────╮
│ LOG OUTPUT                                                    [z/x scroll]  │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│                                                                              │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
 ▸ IDLE                                                    [enter] start [q]uit
```

#### UI Layout — Paused State

```
╭────────────── 40% ──────────────╮╭───────────────── 60% ────────────────────╮
│ STORIES                         ││ CURRENT ACTIVITY                         │
│ ────────────────────────────    ││ ─────────────────────────────────────    │
│ ✓ DEMO-001 Initialize spri...  ││ ▸ DEMO-005: Implement log entry...      │
│ ✓ DEMO-002 Implement progr...  ││                                          │
│ ✓ DEMO-003 Add story compl...  ││ Status: ⣾ Paused                        │
│ ✓ DEMO-004 Create active s...  ││                                          │
│ ▸ DEMO-005 Implement log e...  ││                                          │
│ ○ DEMO-006 Add prism logo ...  ││ Recent:                                  │
│ ○ DEMO-007 Optimize animat...  ││   Reading: .../services/auth.ts          │
│ ○ DEMO-008 Test all animat...  ││   Bash: npm run typecheck                │
│   ● ○ ○ [a/s]                  ││                                          │
╰─────────────────────────────────╯╰──────────────────────────────────────────╯
╭──────────────────────────────────────────────────────────────────────────────╮
│ LOG OUTPUT                                                    [z/x scroll]  │
│ ─────────────────────────────────────────────────────────────────────────── │
│ [14:32:05] INFO  Prism CLI v2.4.9                                          │
│ [14:32:15] OK    DEMO-004 completed (commit: abc123)                       │
│ [14:32:20] INFO  Starting iteration 5                                      │
│   ● ○                                                                       │
╰──────────────────────────────────────────────────────────────────────────────╯
 ⏸ PAUSED                  Elapsed: 1m 45s                    [enter] resume
```

Note: Progress bar and header panels are identical to Running state but omitted for brevity. Status bar shows `⏸ PAUSED` in amber (`#F59E0B`) with frozen elapsed time.

#### UI Layout — Complete State

```
╭────────────── 40% ──────────────╮╭───────────────── 60% ────────────────────╮
│ STORIES                         ││ CURRENT ACTIVITY                         │
│ ────────────────────────────    ││ ─────────────────────────────────────    │
│ ✓ DEMO-001 Initialize spri...  ││                                          │
│ ✓ DEMO-002 Implement progr...  ││ All stories complete!                    │
│ ✓ DEMO-003 Add story compl...  ││                                          │
│ ✓ DEMO-004 Create active s...  ││                                          │
│ ✓ DEMO-005 Implement log e...  ││                                          │
│ ✓ DEMO-006 Add prism logo ...  ││                                          │
│ ✓ DEMO-007 Optimize animat...  ││                                          │
│ ✓ DEMO-008 Test all animat...  ││                                          │
│ ✓ DEMO-009 Create TipTap R...  ││                                          │
│ ✓ DEMO-010 Build FormatToo...  ││                                          │
│ ✓ DEMO-011 Implement markd...  ││                                          │
│ ✓ DEMO-012 Create NoteCard...  ││                                          │
│   ● ○ ○ [a/s]                  ││                                          │
╰─────────────────────────────────╯╰──────────────────────────────────────────╯
╭──────────────────────────────────────────────────────────────────────────────╮
│ LOG OUTPUT                                                    [z/x scroll]  │
│ ─────────────────────────────────────────────────────────────────────────── │
│ [14:35:10] OK    DEMO-012 completed (commit: xyz789)                       │
│ [14:35:12] OK    All stories complete                                      │
│   ●                                                                         │
╰──────────────────────────────────────────────────────────────────────────────╯
 ✓ COMPLETE                 Elapsed: 5m 30s                       [enter] quit
```

Note: Progress bar shows 100% filled with spectrum gradient. "All stories complete!" renders in green (`#10B981`). Status bar shows `▸ COMPLETE` in green.

#### UI Layout — Error State

```
╭────────────── 40% ──────────────╮╭───────────────── 60% ────────────────────╮
│ STORIES                         ││ CURRENT ACTIVITY                         │
│ ────────────────────────────    ││ ─────────────────────────────────────    │
│ ✓ DEMO-001 Initialize spri...  ││                                          │
│ ✓ DEMO-002 Implement progr...  ││ Error occurred                           │
│ ✓ DEMO-003 Add story compl...  ││ 3 consecutive errors on DEMO-004        │
│ ✓ DEMO-004 Create active s...  ││                                          │
│ ▸ DEMO-005 Implement log e...  ││                                          │
│ ○ DEMO-006 Add prism logo ...  ││                                          │
│   ● ○ ○ [a/s]                  ││                                          │
╰─────────────────────────────────╯╰──────────────────────────────────────────╯
╭──────────────────────────────────────────────────────────────────────────────╮
│ LOG OUTPUT                                                    [z/x scroll]  │
│ ─────────────────────────────────────────────────────────────────────────── │
│ [14:33:10] ERROR DEMO-005 failed: exit code 1                              │
│ [14:33:15] INFO  Retry 2/3 (backoff: 4s)                                   │
│ [14:33:20] ERROR DEMO-005 failed: exit code 1                              │
│ [14:33:25] ERROR Max consecutive errors reached (3)                        │
│   ●                                                                         │
╰──────────────────────────────────────────────────────────────────────────────╯
 ▸ ERROR                    Elapsed: 3m 10s                       [enter] quit
```

Note: "Error occurred" renders in red (`#EF4444`). Error detail message shown in dim text below. Status bar icon `▸` in red.

#### UI Layout — Max Iterations State

```
╭────────────── 40% ──────────────╮╭───────────────── 60% ────────────────────╮
│ STORIES                         ││ CURRENT ACTIVITY                         │
│ ────────────────────────────    ││ ─────────────────────────────────────    │
│ ✓ DEMO-001 Initialize spri...  ││                                          │
│ ✓ DEMO-002 Implement progr...  ││ Iteration limit reached                  │
│ ✓ DEMO-003 Add story compl...  ││                                          │
│ ✓ DEMO-004 Create active s...  ││                                          │
│ ✓ DEMO-005 Implement log e...  ││                                          │
│ ○ DEMO-006 Add prism logo ...  ││                                          │
│ ○ DEMO-007 Optimize animat...  ││                                          │
│   ● ○ ○ [a/s]                  ││                                          │
╰─────────────────────────────────╯╰──────────────────────────────────────────╯
╭──────────────────────────────────────────────────────────────────────────────╮
│ LOG OUTPUT                                                    [z/x scroll]  │
│ ─────────────────────────────────────────────────────────────────────────── │
│ [15:02:00] INFO  Starting iteration 50                                     │
│ [15:02:30] OK    DEMO-005 completed (commit: mno345)                       │
│ [15:02:32] WARN  Max iterations reached (50/50)                            │
│   ●                                                                         │
╰──────────────────────────────────────────────────────────────────────────────╯
 ⏸ PAUSED                  Elapsed: 30m 00s                       [enter] quit
```

Note: "Iteration limit reached" renders in amber (`#F59E0B`). Status bar shows `⏸ PAUSED` (MaxIterations uses same String() as Paused) in amber. Some stories remain pending.

#### Panel Breakdown

**Panel 1: Epic Selector** (conditional — only shown when multiple epics exist)

- Selected epic: `CurrentStyle` (bold purple)
- Unselected: `DimStyle` (gray)
- Format: ` name (completed/total) `
- Execution is sequential — one epic at a time. The epic selector switches which epic's stories are displayed and executed.

**Panel 2: Header**

- Left: `TitleStyle("PRISM TUI")`
- Right: Iteration counter + help hint in `DimStyle`

**Panel 3: Progress Bar**

- 3D prism (left) + ASCII logo (right) joined horizontally
- Progress bar: spectrum gradient `█` (filled) + `░` in `#374151` (empty)
- Bar width: `termWidth - 20` (min 20)
- Progress driven by spring-animated position (not raw percentage)

**Panel 4: Story List** (40% width)

Story icons with animated states:

| Status | Icon | Style | Animation |
|--------|------|-------|-----------|-
| Complete (settling) | `●` | Green | Scale < 0.7 during pop |
| Complete (overshoot) | `✔` | Green | Scale > 1.1 during pop |
| Complete (final) | `✓` | Green | Pop animation finished |
| Active (bright) | `▶` | Bold purple | Pulse brightness > 0.8 |
| Active (dim) | `▸` | Bold purple | Pulse brightness ≤ 0.8 |
| Blocked | `⊘` | Italic amber | Static |
| Pending | `○` | Gray | Static |

**Panel 5: Activity Panel** (60% width)

State-dependent content:

| State | Activity Panel Content |
|-------|----------------------|
| Idle | "Press Enter to start execution" (dim) |
| Running | Story info + spinner + tool activity + recent activities |
| Paused | Story info + "Paused" status |
| Complete | "All stories complete!" (green) |
| MaxIterations | "Iteration limit reached" (amber) |
| Error | "Error occurred" (red) + error message |

**Panel 6: Log Panel**

Log level formatting:

| Level | Badge | Style |
|-------|-------|-------|
| Info | `INFO ` | Blue `#3B82F6` |
| Success | `OK   ` | Green `#10B981` |
| Warning | `WARN ` | Amber `#F59E0B` |
| Error | `ERROR` | Bold red `#EF4444` |
| Claude Output | `     ` | Gray `#6B7280` |

Format: `[HH:MM:SS] LEVEL MESSAGE` — New entries slide in from the right via spring animation.

**Panel 7: Status Bar**

Three columns: State icon + name | Elapsed time | Control hints

| State | Icon | Color |
|-------|------|-------|
| Running | `▸` | Green `#10B981` |
| Paused | `⏸` | Amber `#F59E0B` |
| Complete | `▸` | Green `#10B981` |
| MaxIterations | `⏸` | Amber `#F59E0B` |
| Error | `▸` | Red `#EF4444` |
| Idle | `▸` | Gray `#6B7280` |

#### Spectrum Key Bindings

| Key | Action | State Required |
|-----|--------|----------------|
| `a` | Stories previous page | Any |
| `s` | Stories next page | Any |
| `z` | Logs previous page | Any |
| `x` | Logs next page | Any |
| `Tab` | Next epic | Multi-epic only |
| `Shift+Tab` | Previous epic | Multi-epic only |
| `Enter` / `Space` | Start execution | Idle |
| `Space` | Pause execution | Running |
| `/` | Skip current story | Running |
| `Enter` / `Space` | Resume execution | Paused |
| `Enter` / `Space` | Quit | Complete / MaxIterations / Error |

---

### 7. Files Screen

A two-pane file tree browser with preview. Left pane shows an expandable directory tree with git status badges; right pane shows file content with line numbers, syntax highlighting, multi-tab support, inline editing, and git blame annotations.

#### Features

- **Syntax highlighting** (F-1): Chroma-based highlighting for 100+ languages
- **Git status badges** (F-2): Modified (M/yellow), Added (A/green), Deleted (D/red), Untracked (?/gray) indicators on tree items
- **Multi-tab support** (F-3): Open multiple files in tabs, switch with `h`/`l`, close with `x`, max 10 tabs
- **Fuzzy file finder** (F-4): `Ctrl+D` opens a project-wide fuzzy file search overlay. File cache built asynchronously via `git ls-files` (or `filepath.Walk` fallback). Scoring: +10 per character match, +5 consecutive bonus, +8 separator boundary, +6 camelCase boundary, +15 filename start, -2 per gap. Shorter paths preferred as tiebreaker
- **Content search** (F-5): `Ctrl+S` opens a ripgrep-powered project-wide content search (`rg --json --max-count 30`). Results show file:line:text with navigation. Displays install instructions if `rg` binary not found
- **Inline file editing** (F-6): `e` opens a full textarea editor, `Ctrl+S` saves, `Esc` cancels
- **Git blame view** (F-7): `b` toggles blame annotations (short hash, author, relative age) alongside code

#### UI Layout

```
╭───────────── 30% ───────────────╮╭──────────────── 70% ──────────────────────╮
│ FILES                            ││ [main.go] [view.go] [model.go]            │
│ ──────────────────────────────  ││ main.go [go]                              │
│ ▼ prism-plugin/                 ││ ──────────────────────────────────────    │
│   ▼ cmd/                        ││   1 │ package main                        │
│     ▼ prism-cli/                ││   2 │                                      │
│       ▶ app/                    ││   3 │ import (                             │
│       ▶ claude/                 ││   4 │   "fmt"                              │
│     > README.md             M   ││   5 │   "os"                               │
│   ▶ .prism/                     ││   6 │ )                                    │
│   > go.mod                  M   ││                                            │
│                                  ││                                            │
│                        ▐ (scroll)││                                            │
╰──────────────────────────────────╯╰──────────────────────────────────────────╯

Blame mode (`b` in preview pane):
╭──────────────── 70% ──────────────────────────────────────╮
│ abcdef12 JohnDoe   3d │    1 │ package main               │
│ abcdef12 JohnDoe   3d │    2 │                             │
│ 1234abcd Alice     2mo │    3 │ import (                    │
│ 1234abcd Alice     2mo │    4 │   "fmt"                     │
╰───────────────────────────────────────────────────────────╯
```

#### UI Layout — Filter Mode

Activated with `/` in the tree pane. The tree header is replaced with a search input and the tree is filtered to matching files:

```
╭───────────── 30% ───────────────╮╭──────────────── 70% ──────────────────────╮
│ [Filter: mod                   ]││ [main.go] [view.go] [model.go]            │
│ ──────────────────────────────  ││ model.go [go]                             │
│   > model.go                M   ││ ──────────────────────────────────────    │
│   > go.mod                  M   ││   1 │ package main                        │
│                                  ││   2 │                                      │
│                                  ││   3 │ type Model struct {                 │
│                                  ││   4 │   Width  int                        │
│                                  ││   5 │   Height int                        │
│                                  ││   6 │ }                                   │
│                                  ││                                            │
╰──────────────────────────────────╯╰──────────────────────────────────────────╯
```

Footer hints change to: `esc cancel search • enter apply filter`

#### UI Layout — Edit Mode

Activated with `e` in the preview pane. The preview content is replaced with an editable textarea:

```
╭───────────── 30% ───────────────╮╭──────────────── 70% ──────────────────────╮
│ FILES                            ││ [main.go] [view.go] [model.go]            │
│ ──────────────────────────────  ││ model.go [go] — EDITING                   │
│ ▼ prism-plugin/                 ││ ──────────────────────────────────────    │
│   ▼ cmd/                        ││ package main                              │
│     ▼ prism-cli/                ││                                            │
│       ▶ app/                    ││ type Model struct {                        │
│       ▶ claude/                 ││   Width  int                               │
│     > README.md             M   ││   Height int█                              │
│   ▶ .prism/                     ││   Ready  bool                              │
│   > go.mod                  M   ││ }                                          │
│                                  ││                                            │
╰──────────────────────────────────╯╰──────────────────────────────────────────╯
  ctrl+s save • esc cancel edit
```

The tree pane is dimmed (inactive border). Cursor (`█`) visible in textarea. Tab bar remains at top of preview pane.

#### Key Bindings

**Tree Pane (left):**

| Key | Action |
|-----|--------|
| `j` / `↓` | Move cursor down, load preview |
| `k` / `↑` | Move cursor up, load preview |
| `Enter` / `Space` | Toggle directory expand/collapse, or open in tab |
| `x` | Close active tab |
| `/` | Enter filter mode (filename search) |
| `Tab` | Switch to preview pane |
| `Esc` / `Backspace` | Focus Home |

**Preview Pane (right):**

| Key | Action |
|-----|--------|
| `j` / `↓` | Scroll preview down |
| `k` / `↑` | Scroll preview up |
| `h` / `←` | Previous tab |
| `l` / `→` | Next tab |
| `b` | Toggle git blame annotations |
| `e` | Enter edit mode |
| `x` | Close active tab |
| `Esc` | Switch back to tree pane |

**Edit Mode** (`e` from preview pane):

| Key | Action |
|-----|--------|
| `Ctrl+S` | Save file to disk |
| `Esc` | Cancel editing, discard changes |

**Filter Mode:** Captures all keystrokes for search query. `Esc` cancels, `Enter` applies, `Backspace` deletes.

**Global overlays (from Files Screen):**

| Key | Action |
|-----|--------|
| `Ctrl+D` | Open fuzzy file finder overlay (F-4) |
| `Ctrl+S` | Open content search overlay (F-5) |

---

### 8. Git Screen

A full-featured two-pane git integration view with staging, commit, push/pull, branch management, stash, discard, conflict resolution, and commit detail inspection.

#### Features

| ID | Feature | Description |
|----|---------|-------------|
| G-1 | Push Menu | Push to remote with branch selection via modal (`P`) |
| G-2 | Pull Menu | Pull from remote with branch selection via modal (`L`) |
| G-3 | Branch Picker | Load and switch branches via modal (`b`) |
| G-4 | Stash Management | Stash push/pop/list/apply/drop via modal (`S`) |
| G-5 | Conflict Resolution | Detect UU/AA/DD/AU/UA/DU/UD conflict markers; display "Conflicts" section at top of sidebar with `!` icon; `s` stages conflict files as resolved |
| G-6 | File Watcher | Auto-refresh on EventBus `"file.changed"` events; sets `needsRefresh` flag |
| G-7 | Commit Detail | `Enter` on a commit in the sidebar loads its full diff in the right pane |
| G-8 | Discard Changes | `d` on modified/untracked file opens confirmation dialog, then runs `git checkout --` or `rm` |

#### UI Layout

```
╭───────────── 30% ───────────────╮╭──────────────── 70% ──────────────────────╮
│ GIT                              ││ DIFF                                      │
│ ──────────────────────────────  ││ ──────────────────────────────────────    │
│  main ↑0 ↓0                    ││ diff --git a/model.go b/model.go          │
│                                  ││ @@ -25,6 +25,8 @@                         │
│ ── Conflicts (2) ───────────    ││  25  type Model struct {                   │
│   ! package.json                 ││  26    Width  int                          │
│   ! config.go                    ││+ 27    Height int                          │
│                                  ││+ 28    Ready  bool                         │
│ ── Staged ──────────────────    ││  29  }                                     │
│   ● model.go                    ││                                            │
│   ● view.go                     ││                                            │
│                                  ││                                            │
│ ── Modified ────────────────    ││                                            │
│   ● sidebar.go                  ││ [CONFLICT] package.json                    │
│   ● footer.go                   ││  (staged = mark as resolved)               │
│                                  ││                                            │
│ ── Untracked ───────────────    ││                                            │
│   ● README.md                   ││                                            │
│                                  ││                                            │
│ ── Recent Commits ──────────    ││                                            │
│   dff2646 minor TUI fixes       ││                                            │
│   66277bc continue sidecar...   ││                                            │
╰──────────────────────────────────╯╰──────────────────────────────────────────╯
```

Sidebar sections appear in order: Conflicts (if any), Staged, Modified, Untracked, Recent Commits. The diff pane shows unified or side-by-side diffs with syntax highlighting, word-level change detection, and dual-gutter line numbers.

#### UI Layout — Commit Detail View

When `Enter` is pressed on a commit in the Recent Commits section, the right pane switches from diff to commit detail:

```
╭───────────── 30% ───────────────╮╭──────────────── 70% ──────────────────────╮
│ GIT                              ││ COMMIT DETAIL                             │
│ ──────────────────────────────  ││ ──────────────────────────────────────    │
│  main ↑0 ↓0                    ││ Commit: dff2646a3b1c9e7f2d8a4b6e         │
│                                  ││ Author: John Doe <john@example.com>      │
│ ── Staged ──────────────────    ││ Date:   2026-02-28 14:32:05              │
│   ● model.go                    ││                                            │
│                                  ││ minor TUI fixes                           │
│ ── Modified ────────────────    ││                                            │
│   ● sidebar.go                  ││ ── Changed Files ─────────────────────    │
│                                  ││  M model.go          +12 -4              │
│ ── Recent Commits ──────────    ││  M view.go            +3  -1              │
│ > dff2646 minor TUI fixes       ││  A sidebar_test.go    +45 -0              │
│   66277bc continue sidecar...   ││                                            │
╰──────────────────────────────────╯╰──────────────────────────────────────────╯
```

#### UI Layout — Side-by-Side Diff

Toggled with `v` from the diff pane. The right pane splits into old (left) and new (right) columns:

```
╭───────────── 30% ───────────────╮╭──────────────── 70% ──────────────────────╮
│ GIT                              ││ model.go — SIDE BY SIDE                   │
│ ──────────────────────────────  ││ ──────────────────────────────────────    │
│  main ↑0 ↓0                    ││ OLD                  │ NEW                 │
│                                  ││ ─────────────────── │ ──────────────────  │
│ ── Staged ──────────────────    ││ 25  type Model st…  │ 25  type Model st…  │
│   ● model.go                    ││ 26    Width  int     │ 26    Width  int    │
│                                  ││                      │+27    Height int    │
│ ── Modified ────────────────    ││                      │+28    Ready  bool   │
│   ● sidebar.go                  ││ 27  }                │ 29  }               │
│                                  ││                      │                     │
│ ── Recent Commits ──────────    ││                      │                     │
│   dff2646 minor TUI fixes       ││                      │                     │
│   66277bc continue sidecar...   ││                      │                     │
╰──────────────────────────────────╯╰──────────────────────────────────────────╯
```

#### UI Layout — Full-Width Diff (Sidebar Hidden)

When sidebar is toggled off, the diff pane uses the full terminal width:

```
╭──────────────────────────────────────────────────────────────────────────────╮
│ model.go                                                                     │
│ ──────────────────────────────────────────────────────────────────────────── │
│ diff --git a/model.go b/model.go                                            │
│ @@ -25,6 +25,8 @@                                                           │
│  25  type Model struct {                                                     │
│  26    Width  int                                                            │
│+ 27    Height int                                                            │
│+ 28    Ready  bool                                                           │
│  29  }                                                                       │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
```

#### Key Bindings

**Sidebar (left pane):**

| Key | Action |
|-----|--------|
| `j` / `↓` | Move cursor down through files/commits |
| `k` / `↑` | Move cursor up through files/commits |
| `s` | Stage/unstage file (or mark conflict as resolved) |
| `c` | Open commit modal |
| `d` | Discard changes for file at cursor (G-8) |
| `P` | Open push modal (G-1) |
| `L` | Open pull modal (G-2) |
| `b` | Open branch picker (G-3) |
| `S` | Open stash menu (G-4) |
| `r` | Refresh git status + commits |
| `Enter` | Load diff for file, or view commit detail (G-7) |
| `Tab` | Switch to diff pane |
| `Esc` / `Backspace` | Focus Home (or exit commit detail view) |

**Diff Pane (right pane):**

| Key | Action |
|-----|--------|
| `j` / `↓` | Scroll diff down |
| `k` / `↑` | Scroll diff up |
| `v` | Toggle unified/side-by-side diff view |
| `Tab` / `Esc` | Switch back to sidebar |

---

### 9. Agent Screen

An interactive chat interface with conversation history browsing, real-time streaming, thinking block visualization, tool activity tracking, and text input. Uses the **adapter system** (`app/adapter/`) to scan AI agent conversation files from disk and spawns live Claude CLI sessions for interactive chat. Supports wide mode (sidebar + chat) and compact mode (chat only).

#### Adapter System

The Agent screen uses a pluggable `Adapter` interface to discover conversation sessions:

| Adapter | ID | Data Source | Format |
|---------|----|-------------|--------|
| `ClaudeAdapter` | `"claude"` | `~/.claude/projects/` | `.jsonl` per session |

Each adapter implements: `ID()`, `Name()`, `Available()`, `ScanSessions()`, `LoadMessages(path)`. Additional adapters (Codex, Cursor, Gemini CLI, etc.) can be added by implementing the `Adapter` interface. Currently only Claude Code sessions are discovered.

**Session** metadata includes: ID, Title (first user message excerpt), Path, ProjectPath, CreatedAt, UpdatedAt, MessageCount, TokenCount, Model.

The sidebar groups sessions by date (Today, Yesterday, This Week, etc.). `ClaudeAdapter.decodeProjectPath()` converts Claude's directory encoding (`c--Users-digit-Developer-prism-plugin`) back to filesystem paths.

#### Structured Content Parts (v2.4.1)

Messages use a structured `ContentPart` system for rich rendering of tool calls, thinking blocks, and agent spawns:

```go
type ContentPart struct {
    Type     PartType   // PartText, PartToolCall, PartToolResult, PartThinking, PartAgent
    Text     string     // For text/thinking content
    ToolName, ToolInput, ToolOutput, ToolStatus, ToolID string  // For tools
    AgentID, AgentName, AgentType string                        // For agents
    AgentParts []ContentPart                                    // Nested agent content
}
```

**Message rendering** (`chat/renderer.go`) supports:
- **User messages**: `"> "` prompt prefix with blue styling
- **Assistant messages**: Left accent bar (`▎`) with dark background, Glamour markdown rendering + structured parts below
- **Tool messages**: Compact single-line with animated status: `⠋ ToolName` (running spinner) → `✓ ToolName` (complete) → `✗ ToolName` (error)
- **Thinking blocks**: Dim italic text with `💭` prefix, rendered as Claude reasons through problems
- **Agent spawns**: `▸ AgentDescription` with collapsible nested parts and indentation

The `RenderParts(parts []ContentPart, width int, collapsed bool) string` function renders structured parts with proper styling, called from `plugin_agent.go` when MarkdownMode is enabled.

#### Streaming & Activity Visualization (v2.4.1)

The Agent screen now supports real-time streaming with live visualization of Claude's internal activity:

| Feature | Description |
|---------|-------------|
| **Incremental streaming** | Text appears character-by-character via `--output-format stream-json` |
| **Thinking blocks** | Extended thinking content renders as dim italic `💭 text...` in real-time |
| **Tool spinners** | Running tools show animated braille spinner (`⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏`) at 80ms tick rate |
| **Agent tracking** | Subagent spawns tracked via `AgentTracker` with status (running/complete/error) |
| **Signal detection** | Spectrum signals (`<spectrum-continue>`, `<spectrum-retry>`, etc.) displayed in separator bar |

**Enhanced Status Separator Bar** (displayed between messages during streaming):

```
Research | ⬤ streaming… · Read src/main.go | 1.2k in / 0.5k out | 5s | [signal]
─────────  ──────────────────────────────   ──────────────────   ──   ────────
 Phase       Active tool name                 Token counts       Time   Signal
```

**Streaming internals** (`plugin_agent.go`):
- `upsertStreamingMessage()` — creates or updates the last assistant message with accumulated stream text
- `appendPart()` — adds structured parts (tool calls, thinking, agents) to current message
- `updateToolPartStatus()` — finds tool parts by ID and updates status with render cache invalidation
- Streaming messages bypass the render cache to show real-time updates

#### UI Layout — Wide Mode

```
╭──────── 1/3 ────────╮╭─────────────── 2/3 ──────────────────────────────────╮
│ CONVERSATIONS        ││                                                       │
│ ────────────────    ││   How do I implement authentication?                  │
│ ── Today ─────────  ││                          ┌──────────────────────────┐ │
│ > Fix auth bug       ││                          │ ▎ Use OAuth2 + JWT.     │ │
│   Add dark mode      ││                          │ ▎ Here's the approach:  │ │
│ ── Yesterday ─────  ││                          │ ▎ 💭 Considering the... │ │
│   Refactor API       ││                          │ ▎ ✓ Read auth.ts       │ │
│                      ││                          │ ▎ ⠋ Edit routes.ts     │ │
│                      ││                          └──────────────────────────┘ │
│                      ││ Research | ⬤ streaming… · Edit routes.ts | 12s      │
│                      ││ ┌──────────────────────────────────────────────────┐  │
│                      ││ │ Type a message... (Ctrl+Enter to send)          │  │
│                      ││ └──────────────────────────────────────────────────┘  │
╰──────────────────────╯╰──────────────────────────────────────────────────────╯
```

#### UI Layout — Compact Mode

When `WideMode == false` or terminal width < 60 columns, the sidebar is hidden and the chat fills the full width:

```
╭──────────────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   How do I implement authentication?                                        │
│                          ┌──────────────────────────────────────────────┐    │
│                          │ ▎ Use OAuth2 + JWT. Here's the approach:    │    │
│                          │ ▎                                           │    │
│                          │ ▎ 💭 Let me think about the best...        │    │
│                          │ ▎ ✓ Read auth.ts                           │    │
│                          │ ▎ ✓ Read middleware.ts                     │    │
│                          │ ▎ ⠹ Edit routes.ts                        │    │
│                          │ ▎                                           │    │
│                          │ ▎ 1. Set up passport.js middleware          │    │
│                          └──────────────────────────────────────────────┘    │
│ Implement | ⬤ streaming… · Edit routes.ts | 8s                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Type a message... (Ctrl+Enter to send)                                  │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
╰──────────────────────────────────────────────────────────────────────────────╯
```

#### UI Layout — Analytics View

Toggle with `a`. In wide mode, the analytics panel replaces the chat pane (sidebar stays visible):

```
╭──────── 1/3 ────────╮╭─────────────── 2/3 ──────────────────────────────────╮
│ CONVERSATIONS        ││ Usage Analytics                                      │
│ ────────────────    ││ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│ ── Today ─────────  ││ 12 sessions  |  1,247 messages  |  Feb 4 - Feb 28   │
│ > Fix auth bug       ││                                                      │
│   Add dark mode      ││ Model Usage                                          │
│ ── Yesterday ─────  ││ ──────────────────────────────────────────────────   │
│   Refactor API       ││ Opus     ████████████████████░░░░  847,231 tokens    │
│                      ││ Sonnet   ████████████░░░░░░░░░░░░  512,108 tokens    │
│                      ││ Haiku    ████░░░░░░░░░░░░░░░░░░░░  128,450 tokens    │
│                      ││                                                      │
│                      ││ Estimated Cost                                       │
│                      ││ ──────────────────────────────────────────────────   │
│                      ││ Opus:   $31.78   Sonnet: $3.84   Haiku: $0.05       │
│                      ││ Total:  $35.67                                       │
╰──────────────────────╯╰──────────────────────────────────────────────────────╯
```

#### Analytics Mode

Toggle with `a`. Shows token usage and cost breakdown by model for the loaded conversation:

| Model | Input Cost | Output Cost | Per |
|-------|-----------|-------------|-----|
| Opus | $15.00 | $75.00 | 1M tokens |
| Sonnet | $3.00 | $15.00 | 1M tokens |
| Haiku | $0.25 | $1.25 | 1M tokens |

Displays total tokens consumed and estimated cost. When analytics mode is active, the chat pane is replaced with the analytics panel (`plugin_agent.go:760-764`).

#### Key Bindings

| Key | Action |
|-----|--------|
| `Ctrl+B` | Toggle wide/compact mode |
| `Ctrl+Enter` | Send message |
| `j` / `k` | Navigate conversations (sidebar) or scroll messages (chat) |
| `Enter` | Load selected conversation |
| `m` | Toggle Glamour/lite markdown rendering (now also renders structured parts) |
| `a` | Toggle analytics view |
| `Tab` | Toggle sidebar ↔ input focus |
| `Esc` / `Backspace` | Focus Home |

---

### 10. Monitor Screen

Three-panel system health dashboard with multi-panel focus navigation, quality gate execution, output inspection, execution history detail, and agent health tracking.

#### Features

| ID | Feature | Description |
|----|---------|-------------|
| M-1 | Multi-Panel Focus | `Tab`/`Shift+Tab` cycles focus: Health → History → Gates → Health. Focused panel gets purple highlight border. `j`/`k` navigate within focused panel |
| M-2 | Quality Gate Execution | `Enter` runs selected gate; `R` runs all gates. Gate status: pass/fail/pending/running/unknown |
| M-3 | Gate Output Modal | `o` opens modal showing full command output for selected gate |
| M-4 | History Detail Modal | `Enter` on a history entry opens a detail modal with story info, duration, result, and timestamp |
| M-5 | Agent Health | Subscribes to EventBus `"agent.status"` events. Shows active agents in health panel with status icons (● active, ◉ thinking, ○ waiting, ⏸ paused), agent type, and worktree basename |

#### UI Layout

```
╭──────── 1/3 ────────╮╭──────── 1/3 ─────────╮╭──────── 1/3 ────────────────╮
│ SYSTEM HEALTH        ││ EXECUTION HISTORY     ││ QUALITY GATES               │
│ ────────────────    ││ ──────────────────    ││ ───────────────────────    │
│                      ││                       ││                             │
│ Goroutines: 12       ││ ✓ STORY-001  15s  2m ││ ● Lint       pass           │
│ Memory: 24MB / 48MB  ││ ✓ STORY-002  22s  5m ││ ● Tests      pass           │
│ GC Count: 8          ││ ✗ STORY-003  10s  8m ││ ● Build      pass           │
│ GC Pause: 1.2ms      ││ ✓ STORY-004  18s 12m ││                             │
│                      ││ ⊘ STORY-005  5s  15m ││                             │
│ Status: ● Healthy    ││                       ││                             │
│                      ││                       ││                             │
│ ── Agents ────────  ││                       ││                             │
│ ● implement (feat…)  ││                       ││                             │
│ ◉ research  (fix…)   ││                       ││                             │
╰──────────────────────╯╰───────────────────────╯╰─────────────────────────────╯

  Last refresh: 14:32:05
```

Auto-refreshes every 5 seconds. Subscribes to `"story.completed"`, `"agent.status"`, and `"browser.verification"` EventBus events. When terminal width < 85 columns, panels stack vertically instead of side-by-side.

#### UI Layout — Stacked Mode (< 85 cols)

```
╭──────────────────────────────────────────────────────────╮
│ SYSTEM HEALTH                                            │
│ ─────────────────────────────────────────────────────── │
│ Goroutines: 12     Memory: 24MB / 48MB                  │
│ GC Count: 8        GC Pause: 1.2ms                      │
│ Status: ● Healthy                                        │
│ ── Agents ────                                           │
│ ● implement (feat…)   ◉ research (fix…)                 │
╰──────────────────────────────────────────────────────────╯
╭──────────────────────────────────────────────────────────╮
│ EXECUTION HISTORY                                        │
│ ─────────────────────────────────────────────────────── │
│ ✓ STORY-001  15s  2m ago                                │
│ ✓ STORY-002  22s  5m ago                                │
│ ✗ STORY-003  10s  8m ago                                │
╰──────────────────────────────────────────────────────────╯
╭──────────────────────────────────────────────────────────╮
│ QUALITY GATES                                            │
│ ─────────────────────────────────────────────────────── │
│ ● Lint       pass                                        │
│ ● Tests      pass                                        │
│ ● Build      pass                                        │
╰──────────────────────────────────────────────────────────╯

  Last refresh: 14:32:05 │ Panel: Health │ Tab to switch panels
```

Each panel takes full terminal width. Panel height = `(contentHeight - 2) / 3`. Focused panel has purple border (`#7C3AED`).

#### Key Bindings

| Key | Panel | Action |
|-----|-------|--------|
| `Tab` | Any | Cycle focus forward: Health → History → Gates |
| `Shift+Tab` | Any | Cycle focus backward |
| `r` | Any | Manual refresh (system stats) |
| `R` | Gates | Run all quality gates (M-2) |
| `j` / `↓` | History | Navigate execution entries (wraps) |
| `k` / `↑` | History | Navigate execution entries (wraps) |
| `Enter` | History | Open history detail modal (M-4) |
| `j` / `↓` | Gates | Navigate quality gates (wraps) |
| `k` / `↑` | Gates | Navigate quality gates (wraps) |
| `Enter` | Gates | Run selected gate (M-2) |
| `o` | Gates | View gate output modal (M-3) |
| `Esc` / `Backspace` | Any | Focus Home |

---

### 11. Browser Screen

A Playwright browser verification dashboard that monitors automated browser sessions, tracks verification history, and manages screenshot/artifact files. Three-panel layout.

#### Types

- **`BrowserSessionInfo`**: SessionID, URL, CreatedAt, Action (`"created"`, `"closed"`, `"error"`)
- **`BrowserVerificationRecord`**: StoryID, CheckType (`"screenshot"`, `"console"`, `"snapshot"`, `"network"`), Status (`"pass"`, `"fail"`), ArtifactPath, Details, Timestamp
- **`BrowserArtifact`**: Path, Name, Size, Timestamp, StoryID

#### UI Layout

```
╭──────── 1/3 ────────╮╭──────── 1/3 ─────────╮╭──────── 1/3 ────────────────╮
│ SESSIONS             ││ HISTORY               ││ ARTIFACTS                   │
│ ────────────────    ││ ──────────────────    ││ ───────────────────────    │
│                      ││                       ││                             │
│ ● abc123  localhost  ││ ✓ STORY-001 screenshot││ screenshot-001.png  45KB   │
│   Created 2m ago     ││ ✓ STORY-001 console   ││ snapshot-002.html   12KB   │
│                      ││ ✗ STORY-002 network   ││ console-003.log     3KB    │
│ ○ def456  localhost  ││ ✓ STORY-003 snapshot  ││                             │
│   Closed  5m ago     ││                       ││                             │
│                      ││                       ││                             │
╰──────────────────────╯╰───────────────────────╯╰─────────────────────────────╯
```

#### Event Subscriptions

- `"browser.verification"` — Adds records to history panel
- `"browser.session"` — Adds/updates entries in sessions panel

Periodic artifact scanning runs every 10 seconds to discover new files on disk.

#### Key Bindings

| Key | Panel | Action |
|-----|-------|--------|
| `Tab` | Any | Cycle focus: Sessions → History → Artifacts |
| `Shift+Tab` | Any | Cycle focus backward |
| `j` / `↓` | Any | Navigate items within focused panel |
| `k` / `↑` | Any | Navigate items within focused panel |
| `Enter` | Sessions | View session details |
| `Enter` | History | View verification details |
| `Enter` | Artifacts | Open artifact preview |
| `r` | Any | Refresh panels |
| `Esc` / `Backspace` | Any | Focus Home |

---

### 12. Workspaces Screen

A multi-project workspace manager with three view modes: **Projects** (`.prism/` scanning), **Worktrees** (git worktree management), and **Kanban** (agent status board). Two-pane layout with tabbed preview (Info/Stories/Progress).

#### Features

| ID | Feature | Description |
|----|---------|-------------|
| W-1 | Worktree List | `w` toggles to worktree view showing `git worktree list --porcelain` output with path, branch, HEAD hash, bare/main/prunable flags |
| W-2 | Create Worktree | `n` in worktree view opens modal to create a new worktree (branch name + path input) |
| W-3 | Delete Worktree | `d` in worktree view opens confirmation dialog; cannot delete main worktree; optional branch deletion |
| W-4 | Kanban Board | `v` toggles to kanban view showing worktrees grouped by agent status in 5 vertical columns (Active, Thinking, Waiting, Done, Paused). Subscribes to EventBus `"agent.status"` events |

#### UI Layout — Projects View

```
╭───────────── 40% ───────────────╮╭──────────────── 60% ──────────────────────╮
│ WORKSPACES                       ││  [Info]  Stories  Progress                 │
│ ──────────────────────────────  ││ ──────────────────────────────────────    │
│ ● prism-plugin                  ││ Project: prism-plugin                      │
│   main ↑0 ↓0                    ││ Path: ~/Developer/prism-plugin             │
│                                  ││ Branch: main                               │
│ ○ sidecar                       ││                                            │
│   feat/new-feature               ││ Progress: ████████████░░░░  67%           │
│                                  ││                                            │
│ ○ client-app                    ││ Epics: 3                                   │
│   main                           ││   user-auth (8/12)                         │
│                                  ││   dashboard (12/36)                        │
│                                  ││   notifications (0/9)                      │
╰──────────────────────────────────╯╰──────────────────────────────────────────╯
```

#### UI Layout — Worktrees View

```
╭───────────── 40% ───────────────╮╭──────────────── 60% ──────────────────────╮
│ WORKTREES                        ││ Worktree Detail                            │
│ ──────────────────────────────  ││ ──────────────────────────────────────    │
│ > ~/Developer/prism-plugin       ││ Path: ~/Developer/prism-plugin             │
│   main [main]                    ││ Branch: main                               │
│                                  ││ HEAD: d6b2723                              │
│   ~/Developer/prism-plugin-fix   ││ Type: Main worktree                        │
│   fix/auth-bug                   ││                                            │
│                                  ││                                            │
│   ~/Developer/prism-plugin-feat  ││                                            │
│   feat/kanban                    ││                                            │
╰──────────────────────────────────╯╰──────────────────────────────────────────╯
```

#### UI Layout — Kanban Board View

```
╭────────────────────────────────────────────────────────────────────────────╮
│ KANBAN                                                                      │
│ ────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│ ── Active ─────────  ── Thinking ──────  ── Waiting ───────               │
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│ │ ● feat/kanban    │  │ ◉ fix/auth-bug  │  │ ○ feat/ui-theme │             │
│ │   implement      │  │   research      │  │   (no agent)    │             │
│ └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
│ ── Done ───────────  ── Paused ────────                                   │
│ ┌─────────────────┐  (empty)                                               │
│ │ ✓ fix/css-bug    │                                                        │
│ │   validate       │                                                        │
│ └─────────────────┘                                                        │
╰────────────────────────────────────────────────────────────────────────────╯
```

Cards show status icon (● active, ◉ thinking, ○ waiting, ✓ done, ⏸ paused), branch name, and agent type. Columns are rendered vertically with h/l navigation between columns and j/k within.

#### UI Layout — Epics View

When `Enter` is pressed on a project, the sidebar switches to show that project's epics:

```
╭───────────── 40% ───────────────╮╭──────────────── 60% ──────────────────────╮
│ WORKSPACES › prism-plugin        ││  [Info]  Stories  Progress                 │
│ ──────────────────────────────  ││ ──────────────────────────────────────    │
│ > user-auth              8/12   ││ Epic: user-auth                            │
│   dashboard             12/36   ││ Stories: 8 complete / 12 total             │
│   notifications          0/9    ││                                            │
│                                  ││ Path: .prism/stories/user-auth/            │
│                                  ││                                            │
│                                  ││                                            │
│                                  ││                                            │
╰──────────────────────────────────╯╰──────────────────────────────────────────╯
```

Project name shown in sidebar header. `Esc` returns to the projects list.

#### UI Layout — Preview: Stories Tab

When the `[Stories]` tab is active in the preview pane:

```
╭──────────────── 60% ──────────────────────╮
│  Info  [Stories]  Progress                 │
│ ──────────────────────────────────────    │
│ ✓ STORY-001  Setup database schema        │
│ ✓ STORY-002  Implement user model         │
│ ✓ STORY-003  Add authentication API       │
│ ✓ STORY-004  Build login page             │
│ ● STORY-005  Create session middleware     │
│ ○ STORY-006  Add password reset           │
│ ○ STORY-007  Implement OAuth2             │
│ ○ STORY-008  Add rate limiting            │
│                                            │
│ 4/8 complete                               │
╰──────────────────────────────────────────╯
```

#### UI Layout — Preview: Progress Tab

When the `[Progress]` tab is active in the preview pane:

```
╭──────────────── 60% ──────────────────────╮
│  Info  Stories  [Progress]                 │
│ ──────────────────────────────────────    │
│ Overall: ████████████░░░░  50%            │
│                                            │
│ Last Updated: 2026-02-28 14:32            │
│ Iterations Used: 12                        │
│                                            │
│ Recent Completions:                        │
│   STORY-004  Build login page    (2m ago) │
│   STORY-003  Add authentication  (8m ago) │
│                                            │
╰──────────────────────────────────────────╯
```

#### Key Bindings

**Projects View** (left pane):

| Key | Action |
|-----|--------|
| `j`/`k` | Navigate projects |
| `Enter` | Enter epics view (if project has epics) |
| `w` | Switch to worktrees view (W-1) |
| `Tab` | Switch to preview pane |
| `r` | Rescan projects |
| `Esc` | Focus Home |

**Epics View** (left pane, within a project):

| Key | Action |
|-----|--------|
| `j`/`k` | Navigate epics |
| `Enter` | Switch to selected epic |
| `Tab` | Switch to preview pane |
| `Esc` | Return to projects view |

**Worktrees View** (left pane):

| Key | Action |
|-----|--------|
| `j`/`k` | Navigate worktrees |
| `n` | Create new worktree (W-2) |
| `d` | Delete selected worktree (W-3) |
| `Enter` | Switch to worktree directory |
| `v` | Switch to kanban view (W-4) |
| `w` | Switch to projects view |
| `Tab` | Switch to preview pane |
| `r` | Refresh worktree list |
| `Esc` | Focus Home |

**Kanban View:**

| Key | Action |
|-----|--------|
| `h` / `←` | Move to previous column |
| `l` / `→` | Move to next column |
| `j` / `↓` | Move down within column |
| `k` / `↑` | Move up within column |
| `Enter` | Select card, show detail in preview pane |
| `v` | Switch to list (worktrees) view |
| `w` | Switch to projects view |

**Preview Pane** (right):

| Key | Action |
|-----|--------|
| `[` / `]` | Switch tabs (Info/Stories/Progress) |
| `j`/`k` | Scroll content |
| `Tab` | Toggle sidebar/preview focus |
| `Esc` | Return to sidebar |

Scans parent directory siblings for `.prism/` directories to discover projects.

---

## App Shell

For all non-splash, non-onboarding views, content is wrapped in an "app shell" consisting of a tab bar, optional sidebar, and two-tier footer.

### Tab Bar

Two rendering modes depending on terminal width:

**Powerline Tab Bar** (3 lines, when terminal is wide enough):

```
 ╲  Home      ╲  Research  ╲  Spectrum  ╲  Files    ╲ ╲╲╲╲
  ╲  Home      ╲  Research  ╲  Spectrum  ╲  Files    ╲╲╲╲
   ╲  Home      ╲  Research  ╲  Spectrum  ╲  Files    ╲╲╲
```

- Active tab: white text on `Primary` (#7C3AED) background
- Inactive tabs: dim text on `#2c2d3a` background
- Diagonal slant separators create a distinctive visual edge
- Mouse clickable via `bubblezone` (zone IDs: `tab-0` through `tab-8`)

**Compact Tab Bar** (1 line, narrow terminals):

```
 1:Home │ 2:Research │ 3:Plans │ 4:Spectrum │ 5:Files │ 6:Git
─────────────────────────────────────────────────────────────────
```

### Sidebar

Fixed width: **38 characters**. Auto-shown when terminal width >= **120** characters. Toggled with `Ctrl+D`.

```
  ╲╲ ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱
 ╲╲ ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱
╲╲ ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱
╭────────────────────────────────────╮
│  ██▀▀█▄ ██▀▀█▄ ▀██▀ ▄██▀▀ ██▄▀▄██│
│  ██▄▄█▀ ██▄▄█▀  ██  ▀██▄  ██ ▀ ██│
│  ██     ██  ██ ▄██▄ ▄▄██▀ ██   ██│
│  ──────────────────────────────── │
│                                    │
│  ▸ RUNNING                         │
│    Iteration 3/50                  │
│    67% (8/12)                      │
│                                    │
│  ├─ MODIFIED FILES ───────────    │
│    model.go              +12 -3   │
│    view.go               +45 -8   │
│    sidebar.go             mod      │
│                                    │
│  ├─ QUALITY GATES ────────────    │
│    ● Lint                 pass     │
│    ● Tests                pass     │
│    ● Build                pass     │
│                                    │
│  ├─ EPICS ────────────────────    │
│    ● user-auth           8/12     │
│    ○ dashboard          12/36     │
│    ○ notifications       0/9      │
╰────────────────────────────────────╯
```

**Sidebar sections:**

1. **Branded header**: 3-line gradient PRISM block logo
2. **Execution info**: State icon, iteration counter, story progress
3. **Modified Files**: From Git plugin (staged + modified files with diff stats)
4. **Quality Gates**: From Monitor plugin (pass/fail status icons)
5. **Epics**: From Spectrum plugin (active/inactive indicators with progress)

### Footer

Two-tier footer spanning full terminal width.

**Tier 1: Key Hints** (context-aware)

```
[1-9] switch tabs  [tab/shift+tab] cycle  [j/k] navigate  [ctrl+d] details  [?] help  [q] quit  ╲╲╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱
```

Key hints include view-specific hints from the active plugin's `KeyHints()` method. Right edge has decorative slash pattern matching sidebar width.

**Tier 2: Powerline Status Bar**

```
 IMPLEMENT ╲ ⚡ Spectrum ╲  main ╲ STORY-003 ╲                ╱ v2.4.9 ╱ 3✓ 0✗ ╱ 8/12 ╱ iter 3 ╱ 🕒 2m 15s
```

Left segments:
1. Workflow phase pill (Research=Blue, Plan=Teal, Implement=Green, Validate=Amber)
2. Active plugin icon + name
3. Git branch name (from Git plugin)
4. Current story ID (from Spectrum plugin, when width >= 100)

Right segments:
1. Version (`v2.4.9`)
2. Quality gate counts (pass/fail, when width >= 80)
3. Story progress (completed/total)
4. Iteration counter (when width >= 90)
5. Elapsed time (when Spectrum is running)

---

## Modal & Dialog Systems

### Modal System

Modals are centered overlays with dimmed background. The compositing pipeline works row-by-row: rows within the modal's Y range use `compositeRow()` to insert modal content into a dimmed background; rows above/below are fully dimmed.

**Section types available:**
- `TextSection` — Static text, word-wrapped
- `SpacerSection` — Blank line
- `ButtonsSection` — Row of buttons (Normal/Primary/Danger variants)
- `InputSection` — Single-line text input
- `TextareaSection` — Multi-line text input
- `ListSection` — Scrollable selection list
- `CheckboxSection` — Toggleable checkbox
- `WhenSection` — Conditional section

**Modal variants:** Default (purple border), Danger (red), Warning (amber), Info (blue)

**Focus cycling:** Tab/Shift+Tab cycles through focusable elements using modular arithmetic.

### Command Palette

Activated with `Ctrl+P` or `:`. Provides fuzzy search across all plugin commands.

```
╭────────────────────── Command Palette ──────────────────────╮
│  [Search: sp                                               ]│
│                                                              │
│  > [Spectrum] Focus — Open Spectrum dashboard               │
│    [Spectrum] Start — Begin story execution                  │
│    [Spectrum] Stop — Stop execution                          │
│    [Spectrum] Next Story — Go to next story page             │
│    [Spectrum] Switch Epic — Switch to next epic              │
│                                                              │
│  ↑/↓ navigate • enter execute • esc close                   │
╰──────────────────────────────────────────────────────────────╯
```

### Dialog System

Dialogs are layered above modals in z-order. Two dialog types:

**Confirmation Dialog:**
- Two buttons: Confirm + Cancel
- Quick keys: `y` for confirm, `n` for cancel
- Variant-colored border

**Permission Dialog:**
- Three buttons: Allow + Allow Session + Deny
- Scrollable preview area (max 8 lines)
- Quick keys: `a` for allow, `s` for allow session, `d`/`n` for deny
- Amber border with "Permission Required" title

#### Confirmation Dialog Layout

```
╭────────────────── Confirm ──────────────────╮
│                                              │
│  Are you sure you want to proceed?           │
│                                              │
│           [ Confirm ]  [ Cancel ]            │
│                                              │
│  y confirm • n cancel                        │
╰──────────────────────────────────────────────╯
```

Variant-colored border: Default (purple `#7C3AED`), Danger (red `#EF4444`), Warning (amber `#F59E0B`), Info (blue `#3B82F6`).

#### Permission Dialog Layout

```
╭──────────────── Permission Required ────────────────╮
│                                                      │
│  Tool: Bash                                          │
│  Command: npm run typecheck                          │
│                                                      │
│  ┌────────────────────────────────────────────┐      │
│  │ $ npm run typecheck                        │      │
│  │                                            │      │
│  │ (scrollable preview — max 8 lines)         │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  [ Allow ]  [ Allow Session ]  [ Deny ]              │
│                                                      │
│  a allow • s session • d deny                        │
╰──────────────────────────────────────────────────────╯
```

Amber border (`#F59E0B`). Preview area scrolls with `↑`/`k` when content exceeds 8 lines.

### Global Overlays

#### File Finder (`Ctrl+D`)

Source: `file_finder.go:127-150` — `BuildModal()`, width 70.

```
╭───────────────────────── Find File ─────────────────────────╮
│  [Type to search files...: mod                             ]│
│                                                              │
│  > apps/prism-cli/app/model.go                               │
│    apps/prism-cli/app/model_test.go                          │
│    apps/prism-cli/modal/modal.go                             │
│    go.mod                                                    │
│                                                              │
│  ↑/↓ navigate • enter open • esc close                      │
╰──────────────────────────────────────────────────────────────╯
```

File cache built asynchronously via `git ls-files` (or `filepath.Walk` fallback). Fuzzy scoring: +10 per character match, +5 consecutive, +8 separator boundary, +6 camelCase, +15 filename start, -2 per gap.

#### Content Search (`Ctrl+S`)

Source: `content_search.go:152-188` — `BuildModal()`, width 80.

```
╭─────────────────────── Content Search ───────────────────────────╮
│  [Search content...: handleSubmit                               ]│
│                                                                   │
│  > src/components/Form.tsx:42  const handleSubmit = async () =>  │
│    src/utils/validation.ts:15  export function handleSubmit...   │
│    src/hooks/useForm.ts:28     return { handleSubmit, errors }   │
│    tests/form.test.ts:55       test("handleSubmit validates...   │
│                                                                   │
│  ↑/↓ navigate • enter open • esc close                           │
╰──────────────────────────────────────────────────────────────────╯
```

Powered by ripgrep (`rg --json --max-count 30`). If `rg` is not installed, displays install instructions instead of search results.

#### Help Modal (`?`)

```
╭──────────────────────────── Help ────────────────────────────╮
│                                                               │
│  GLOBAL KEYS                                                  │
│  ──────────────────────────────────────────                  │
│  q / Ctrl+C     Quit application                             │
│  Ctrl+P / :     Command palette                              │
│  Ctrl+D         File finder                                  │
│  Ctrl+S         Content search                               │
│  ?              Toggle this help                             │
│  1-9            Switch to tab                                │
│  Tab            Next tab                                      │
│                                                               │
│  CURRENT SCREEN                                               │
│  ──────────────────────────────────────────                  │
│  (context-specific keys shown here)                          │
│                                                               │
│  esc close                                                    │
╰───────────────────────────────────────────────────────────────╯
```

Content is scrollable when key list exceeds available height. Shows both global and context-specific keys for the currently active screen.

### Git Screen Modals

#### Commit Modal (`c`)

Source: `plugin_git.go:1053-1065` — `openCommitModal()`, width 60.

```
╭────────────────── Commit Changes ──────────────────╮
│                                                      │
│  Enter commit message:                               │
│                                                      │
│  ┌────────────────────────────────────────────┐      │
│  │ fix: resolve auth timeout on retry         │      │
│  │                                            │      │
│  │ Increased timeout from 5s to 30s for       │      │
│  │ OAuth token refresh.                       │      │
│  │                                            │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│         [ Commit ]  [ Cancel ]                       │
│                                                      │
│  tab cycle • enter confirm • esc cancel              │
╰──────────────────────────────────────────────────────╯
```

#### Push Modal (`P`)

Source: `plugin_git.go:1069-1087` — `openPushModal()`, width 50.

```
╭──────────────────── Push ────────────────────╮
│                                               │
│  Branch: main (2 ahead)                       │
│                                               │
│  [ Push ]  [ Force Push ]  [ Set Upstream ]   │
│  [ Cancel ]                                   │
│                                               │
│  tab cycle • enter select • esc cancel        │
╰───────────────────────────────────────────────╯
```

"Force Push" button uses Danger variant (red text).

#### Pull / Fetch Modal (`L`)

Source: `plugin_git.go:1090-1107` — `openPullModal()`, width 50.

```
╭──────────────── Pull / Fetch ────────────────╮
│                                               │
│  Branch: main (1 behind)                      │
│                                               │
│  [ Fetch ]  [ Pull ]  [ Pull (rebase) ]       │
│  [ Cancel ]                                   │
│                                               │
│  tab cycle • enter select • esc cancel        │
╰───────────────────────────────────────────────╯
```

"Pull" button uses Primary variant (highlighted).

#### Branch Picker Modal (`b`)

Source: `plugin_git.go:1111-1133` — `openBranchPickerModal()`, width 60, max 10 visible.

```
╭──────────────── Switch Branch ───────────────────╮
│                                                    │
│  Select a branch to checkout:                      │
│                                                    │
│  * main                                            │
│    feature/auth-flow                               │
│    feature/dark-mode                               │
│    fix/timeout-issue                               │
│    develop                                         │
│    staging                                         │
│                                                    │
│        [ Checkout ]  [ Cancel ]                    │
│                                                    │
│  j/k navigate • enter select • esc cancel          │
╰────────────────────────────────────────────────────╯
```

Current branch marked with `*`. List scrolls when more than 10 branches.

#### Stash Menu Modal (`S`)

Source: `plugin_git.go:1298-1311` — `openStashMenuModal()`, width 50.

```
╭──────────────────── Stash ───────────────────╮
│                                               │
│  Save or manage stashes:                      │
│                                               │
│  [ Stash ]  [ Stash (+untracked) ]            │
│  [ View Stashes ]  [ Cancel ]                 │
│                                               │
│  tab cycle • enter select • esc cancel        │
╰───────────────────────────────────────────────╯
```

"Stash" button uses Primary variant. "View Stashes" loads the stash list asynchronously before opening the Stash List modal.

#### Stash List Modal

Source: `plugin_git.go:1350-1373` — `openStashListModal()`, width 70, max 8 visible.

```
╭─────────────────────── Stash List ────────────────────────╮
│                                                            │
│  Select a stash and choose an action:                      │
│                                                            │
│  > stash@{0} (main): WIP on auth refactor                 │
│    stash@{1} (develop): save before rebase                 │
│    stash@{2} (main): experiment with caching               │
│                                                            │
│  [ Apply ]  [ Pop ]  [ Drop ]  [ Cancel ]                  │
│                                                            │
│  j/k navigate • enter select • esc cancel                  │
╰────────────────────────────────────────────────────────────╯
```

"Apply" button Primary, "Drop" button Danger. List scrolls at 8+ stashes.

#### Stash Drop Confirm

Source: `plugin_git.go:1376-1388` — `openStashDropConfirmModal()`, width 55, Danger variant.

```
╭──────────────────── Drop Stash ──────────────────╮  [red border]
│                                                    │
│  Are you sure you want to drop stash@{0}?          │
│                                                    │
│  WIP on auth refactor                              │
│                                                    │
│  This action cannot be undone.                     │
│                                                    │
│           [ Drop ]  [ Cancel ]                     │
│                                                    │
╰────────────────────────────────────────────────────╯
```

Red border (`#EF4444`). "Drop" button Danger variant.

#### Discard Changes Dialog (`d`)

Source: `plugin_git.go:1443-1458` — `openDiscardConfirmModal()`, width 55, Danger variant.

```
╭──────────────── Discard Changes ─────────────────╮  [red border]
│                                                    │
│  Are you sure you want to discard changes to:      │
│                                                    │
│    model.go                                        │
│                                                    │
│  This action cannot be undone.                     │
│                                                    │
│          [ Discard ]  [ Cancel ]                   │
│                                                    │
╰────────────────────────────────────────────────────╯
```

For untracked files, text reads "delete untracked file" instead of "discard changes to".

#### Git Error Modal

Source: `plugin_git.go:1136-1145` — `openErrorModal()`, width 60, Danger variant.

```
╭──────────────────── Git Error ───────────────────╮  [red border]
│                                                    │
│  fatal: Could not read from remote repository.     │
│                                                    │
│  Please make sure you have the correct access      │
│  rights and the repository exists.                 │
│                                                    │
│                    [ OK ]                           │
│                                                    │
╰────────────────────────────────────────────────────╯
```

### Workspaces Modals

#### Create Worktree Modal (`n`)

Source: `plugin_workspaces.go:1848-1863` — `openCreateWorktreeModal()`, width 60.

```
╭──────────────── Create Worktree ─────────────────╮
│                                                    │
│  Create a new git worktree with a new branch.      │
│                                                    │
│  Branch name:                                      │
│  ┌──────────────────────────────────────────┐      │
│  │ feature/my-branch                        │      │
│  └──────────────────────────────────────────┘      │
│                                                    │
│          [ Create ]  [ Cancel ]                    │
│                                                    │
│  enter submit • tab cycle • esc cancel             │
╰────────────────────────────────────────────────────╯
```

Input field has purple border (`#7C3AED`). Enter in the input field triggers create directly.

#### Delete Worktree Dialog (`d`)

Source: `plugin_workspaces.go:1866-1885` — `openDeleteWorktreeConfirm()`, width 60, Danger variant.

```
╭──────────────── Delete Worktree? ────────────────╮  [red border]
│                                                    │
│  This will remove the worktree at:                 │
│  ~/Developer/prism-plugin-fix                      │
│  Branch: fix/auth-bug                              │
│                                                    │
│  This action cannot be undone.                     │
│                                                    │
│          [ Delete ]  [ Cancel ]                    │
│                                                    │
╰────────────────────────────────────────────────────╯
```

Cannot delete the main worktree — the `d` key is ignored when the main worktree is selected.

#### Workspaces Error Modal

Source: `plugin_workspaces.go:1888-1896` — `openErrorModal()`, width 50, Danger variant.

```
╭──────────────────── Error ───────────────────╮  [red border]
│                                               │
│  Failed to create worktree: branch already    │
│  exists.                                      │
│                                               │
│                  [ OK ]                       │
│                                               │
╰───────────────────────────────────────────────╯
```

### Monitor Modals

#### Gate Output Modal (`o`)

Source: `plugin_monitor.go:840-878` — `openGateOutputModal()`, width 80. Variant: Info (blue) for pass, Danger (red) for fail.

```
╭─────────────────── Gate Output: npm test ────────────────────────╮
│                                                                   │
│  npm test — PASS                                                  │
│  Command: npm test                                                │
│  Last run: 45s ago                                                │
│                                                                   │
│  > prism@2.4.9 test                                               │
│  > jest --coverage                                                │
│                                                                   │
│  PASS  src/utils/validation.test.ts                               │
│  PASS  src/components/Form.test.tsx                               │
│  PASS  src/hooks/useAuth.test.ts                                  │
│                                                                   │
│  Test Suites: 3 passed, 3 total                                   │
│  Tests:       12 passed, 12 total                                 │
│  Coverage:    87.3%                                               │
│                                                                   │
│                         [ Close ]                                 │
│                                                                   │
╰───────────────────────────────────────────────────────────────────╯
```

Output is scrollable when it exceeds the modal height. If no output was captured, shows "(no output captured)".

#### History Detail Modal (`Enter` on history entry)

Source: `plugin_monitor.go:881-910` — `openHistoryDetailModal()`. Variant: Info (blue) for success, Danger (red) for error, Warning (amber) for blocked.

```
╭────────────────── Execution Detail ──────────────────╮
│                                                       │
│  Story:     STORY-004                                 │
│  Name:      Build login page                         │
│  Result:    SUCCESS                                   │
│  Duration:  18.245s                                   │
│  Timestamp: 2026-02-28 14:32:05                       │
│                                                       │
│                    [ Close ]                          │
│                                                       │
╰───────────────────────────────────────────────────────╯
```

### Spectrum Permission Dialog

During Spectrum execution, when Claude requests tool use and `--dangerously-skip-permissions` is not set:

```
╭────────────── Permission Required ──────────────╮  [amber border]
│                                                   │
│  Tool: Bash                                       │
│  Command: npm run test                            │
│                                                   │
│  ┌─────────────────────────────────────────┐      │
│  │ $ npm run test                          │      │
│  │                                         │      │
│  │ (scrollable — ↑/k to scroll)            │      │
│  └─────────────────────────────────────────┘      │
│                                                   │
│  [ Allow ]  [ Allow Session ]  [ Deny ]           │
│                                                   │
│  a allow • s session • d deny                     │
╰───────────────────────────────────────────────────╯
```

Rendered via the Dialog system (`dialog/permissions.go`), layered above any active modal. Preview area scrolls when content exceeds 8 lines.

---

## User Flow Diagrams

### Complete Navigation Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                         APPLICATION START                           │
│                                                                     │
│   Always ─────────────────────────────────────▶ Splash (5s/key)    │
│                                                    │                │
│                                    ┌───────────────┴──────────┐    │
│                                    │                          │    │
│                             NeedsOnboarding?            No     │    │
│                                    │                          │    │
│                                    ▼                          ▼    │
│                              Onboarding              Home          │
│                                    │                                │
│                              [complete]                             │
│                                    │                                │
│                                    ▼                                │
│                                  Home                               │
└─────────────────────────────────────────────────────────────────────┘

                         ┌──────────────────┐
                         │                  │
              ┌──────────│      HOME        │──────────────────┐
              │          │  [1] [2] [3]     │                  │
              │          │  j/k  enter      │                  │
              │          └──────┬─┬─────────┘                  │
              │                 │ │                             │
         [1] │           [2]  │ │   [3]                       │
              │                │ │                             │
              ▼                ▼ ▼                             ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────────┐
   │  RESEARCH    │ │    PLANS     │ │         SPECTRUM              │
   │  (List)      │ │  (List)      │ │  (Idle → Running → Complete) │
   └──────┬───────┘ └──────┬───────┘ └──────────────────────────────┘
          │                │
     [enter]          [enter]
          │                │
          ▼                ▼
   ┌──────────────┐ ┌──────────────┐
   │  RESEARCH    │ │    PLANS     │
   │  (Viewer)    │ │  (Viewer)    │
   └──────────────┘ └──────────────┘

Tab / Number keys switch between all 9 tabs:
  [1]Home [2]Research [3]Plans [4]Spectrum [5]Files [6]Git [7]Agent [8]Monitor [9]Workspaces

Additional screens (not in number-key shortcuts):
  Browser — accessible via Command Palette (: → "Browser Focus")

Full-screen overlays (not in tab order):
  [Ctrl+P] or [:] → Command Palette
  [Ctrl+D] → File Finder
  [Ctrl+S] → Content Search
  [?] → Help Modal
  [c] in Git → Commit Modal
```

### Back Navigation Logic

```
Current View          esc / backspace Action
─────────────────     ───────────────────────────────────────
Splash                (any key skips to next view)
Onboarding            (no back — must complete or key through)
Home                  (no effect)
Research (list)       → Home
Research (viewer)     → Research (list)
Plans (list)          → Home
Plans (viewer)        → Plans (list)
Spectrum (idle)       → Home
Spectrum (running)    → (blocked — cannot leave while running)
Spectrum (paused)     → (blocked — cannot leave while paused)
Spectrum (complete)   → Home (via quit)
Files (tree)          → Home
Files (preview)       → Files (tree)
Git (sidebar)         → Home
Git (diff)            → Git (sidebar)
Agent                 → Home
Monitor               → Home
Workspaces (projects) → Home
Workspaces (epics)    → Workspaces (projects)
Workspaces (preview)  → Workspaces (sidebar)
```

### Within-Screen Workflows

Multi-step user workflows showing how screens, modals, and state transitions connect.

#### Git Commit Workflow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────────────┐
│ Git Sidebar   │     │ Git Sidebar   │     │ Commit Modal             │
│              │     │              │     │                          │
│ (files       │ [s] │ (files       │ [c] │ Textarea: commit msg     │
│  listed)     │────▶│  staged)     │────▶│ [Commit] [Cancel]        │
│              │     │              │     │                          │
└──────────────┘     └──────────────┘     └────────┬─────────────────┘
                                                    │
                                              [Commit]
                                                    │
                                                    ▼
                                          ┌──────────────────┐
                                          │ git commit -m... │
                                          │ (executes async) │
                                          └────────┬─────────┘
                                                    │
                                                    ▼
                                          ┌──────────────────┐
                                          │ Modal closes     │
                                          │ Status refreshes │
                                          └──────────────────┘
```

If no files are staged when `c` is pressed, the commit modal still opens (user can type message but commit will fail).

#### Git Push/Pull Workflow

```
┌──────────────┐  [P]  ┌────────────────────────────────────────┐
│ Git Sidebar   │──────▶│ Push Modal                             │
│              │       │ Branch: main (2 ahead)                 │
└──────────────┘       │ [Push] [Force Push] [Set Upstream]     │
                        └──────────┬─────────────────────────────┘
                                   │ [Push]
                                   ▼
                        ┌────────────────────┐
                        │ git push origin... │──▶ Modal closes ──▶ Status refreshes
                        └────────────────────┘

┌──────────────┐  [L]  ┌────────────────────────────────────────┐
│ Git Sidebar   │──────▶│ Pull / Fetch Modal                     │
│              │       │ Branch: main (1 behind)                │
└──────────────┘       │ [Fetch] [Pull] [Pull (rebase)]         │
                        └──────────┬─────────────────────────────┘
                                   │ [Pull]
                                   ▼
                        ┌────────────────────┐
                        │ git pull origin... │──▶ Modal closes ──▶ Status refreshes
                        └────────────────────┘
```

#### Git Stash Workflow

```
┌──────────────┐  [S]  ┌────────────────────────────────┐
│ Git Sidebar   │──────▶│ Stash Menu                     │
│              │       │ [Stash] [+untracked] [View] [X]│
└──────────────┘       └───┬──────┬──────┬──────────────┘
                           │      │      │
                    [Stash]│      │      │[View Stashes]
                           │      │      │
                           ▼      │      ▼
                 ┌──────────┐     │   ┌────────────────────────────────┐
                 │ git stash│     │   │ Stash List Modal               │
                 │ push     │     │   │ > stash@{0}: WIP on auth...   │
                 │ ──▶ done │     │   │   stash@{1}: save before...   │
                 └──────────┘     │   │ [Apply] [Pop] [Drop] [Cancel] │
                                  │   └───┬──────┬──────┬─────────────┘
                           [+untracked]   │      │      │
                                  │  [Apply]  [Pop]  [Drop]
                                  ▼       │      │      │
                        ┌──────────┐      ▼      ▼      ▼
                        │ stash    │   applied  popped  ┌───────────────────┐
                        │ push -u  │                    │ Drop Confirm      │
                        │ ──▶ done │                    │ [red border]      │
                        └──────────┘                    │ [Drop] [Cancel]   │
                                                        └─────┬─────────────┘
                                                              │ [Drop]
                                                              ▼
                                                        git stash drop
```

#### Workspaces Worktree Lifecycle

```
┌─────────────────┐  [n]  ┌──────────────────────────┐
│ Worktrees View   │──────▶│ Create Worktree Modal    │
│ (sidebar list)   │       │ Branch: feature/...      │
└─────────────────┘       │ [Create] [Cancel]        │
       │                   └────────┬─────────────────┘
       │                            │ [Create]
       │                            ▼
       │                   ┌──────────────────┐
       │                   │ git worktree add │──▶ List refreshes
       │                   └──────────────────┘
       │
       │  [d]  ┌──────────────────────────┐
       │──────▶│ Delete Confirm Dialog    │
       │       │ [red border]             │
       │       │ [Delete] [Cancel]        │
       │       └────────┬─────────────────┘
       │                │ [Delete]
       │                ▼
       │       ┌───────────────────┐
       │       │ git worktree      │──▶ List refreshes
       │       │ remove <path>     │
       │       └───────────────────┘
       │
       │  [Enter]
       └──────────▶ cd to worktree directory
```

#### Spectrum Execution Lifecycle (User Perspective)

```
┌──────────┐  [Enter]  ┌──────────────┐         ┌─────────────────────┐
│   IDLE    │─────────▶│   RUNNING    │────────▶│ Permission Dialog?  │
│ "Press    │          │   ⣾ Working  │  (tool) │ [Allow] [Session]   │
│  Enter"   │          │              │◀────────│ [Deny]              │
└──────────┘          └──────┬───┬───┘ (allow)  └─────────────────────┘
                              │   │
                        (story│   │[p]
                        done) │   │
                              │   ▼
                              │ ┌──────────┐  [p]  ┌──────────────┐
                              │ │ PAUSED   │──────▶│   RUNNING    │
                              │ │ ⏸ Paused │       │   (resume)   │
                              │ └──────────┘       └──────────────┘
                              │
                              ▼
                     ┌────────────────────┐    (all stories done)
                     │ Story pop animation│──────────────────────▶ ┌──────────┐
                     │ Next story starts  │                        │ COMPLETE │
                     │ ─▶ back to RUNNING │                        │ ✓ Done   │
                     └────────────────────┘                        │ [Enter]  │
                                                                   │ ──▶ quit │
                              (3 errors)                            └──────────┘
                     ┌──────────────┐        (50 iterations)  ┌────────────────┐
                     │    ERROR     │                          │ MAX ITERATIONS │
                     │ ✗ Error msg  │                          │ ⏸ Limit hit    │
                     │ [Enter] quit │                          │ [Enter] quit   │
                     └──────────────┘                          └────────────────┘
```

#### Files Edit Workflow

```
┌──────────────┐ [Enter] ┌────────────────┐  [Tab]  ┌────────────────┐
│ Files Tree    │────────▶│ File opens in  │────────▶│ Preview pane   │
│ (select file) │         │ preview tab    │         │ (focused)      │
└──────────────┘         └────────────────┘         └───────┬────────┘
                                                            │ [e]
                                                            ▼
                                                   ┌────────────────┐
                                                   │ EDIT MODE      │
                                                   │ Textarea with  │
                                                   │ file content   │
                                                   │ (cursor active)│
                                                   └───┬────────┬───┘
                                                       │        │
                                                [Ctrl+S]    [Esc]
                                                       │        │
                                                       ▼        ▼
                                              ┌───────────┐ ┌───────────┐
                                              │ File saved│ │ Changes   │
                                              │ ──▶ back  │ │ discarded │
                                              │ to preview│ │ ──▶ back  │
                                              └───────────┘ │ to preview│
                                                            └───────────┘
```

#### Files Search-to-Navigate Workflows

```
┌───────────────┐  [Ctrl+D]  ┌───────────────────────────────────────┐
│ Any Screen     │───────────▶│ File Finder Overlay                   │
│               │            │ [Filter: mod                         ]│
└───────────────┘            │ > apps/prism-cli/app/model.go          │
                              │   go.mod                              │
                              └──────────────┬────────────────────────┘
                                             │ [Enter] select file
                                             ▼
                              ┌───────────────────────────────────────┐
                              │ Navigate to Files screen              │
                              │ Selected file opens in preview tab    │
                              └───────────────────────────────────────┘

┌───────────────┐  [Ctrl+S]  ┌───────────────────────────────────────┐
│ Any Screen     │───────────▶│ Content Search Overlay                │
│               │            │ [Search: handleSubmit                ]│
└───────────────┘            │ > Form.tsx:42  const handleSubmit... │
                              │   useForm.ts:28  return { handle...  │
                              └──────────────┬────────────────────────┘
                                             │ [Enter] select result
                                             ▼
                              ┌───────────────────────────────────────┐
                              │ Navigate to Files screen              │
                              │ File opens at matching line           │
                              └───────────────────────────────────────┘
```

---

## Execution State Machine

### State Diagram

```
                                ┌──────────────┐
                                │              │
                                │    IDLE      │
                                │              │
                                └──────┬───────┘
                                       │
                                  [Enter pressed]
                                       │
                                       ▼
                                ┌──────────────┐
               ┌───────────────▶│              │◀──────────────────┐
               │                │   RUNNING    │                   │
               │      ┌────────▶│              │◀────────┐         │
               │      │         └──┬───┬───┬───┘         │         │
               │      │            │   │   │             │         │
               │   [resume]        │   │   │          [retry]   [continue]
               │      │            │   │   │          [blocked]    │
               │      │         [p]│   │   │[Claude      │         │
               │      │            │   │   │ finished]   │         │
               │      │            ▼   │   │             │         │
               │   ┌──────┐        │   │   ▼             │         │
               │   │      │        │   │ ┌────────────┐  │         │
               │   │PAUSED│◀───────┘   │ │Parse Signal│──┘         │
               │   │      │            │ └──────┬─────┘            │
               │   └──┬───┘            │        │                  │
               │      │                │   ┌────┴────────────┐     │
               │   [p/enter]           │   │     │     │     │     │
               │      │                │   ▼     ▼     ▼     ▼     │
               └──────┘                │ Error Retry Block Continue │
                                       │   │     │     │     │     │
                                       │   │     │     └─────┴─────┘
                                       │   │     │
                                       │   │  ┌──┴────────┐
                                       │   │  │ > 3       │
                                       │   │  │ retries?  │
                                [max   │   │  └──┬────┬───┘
                                iter]  │   │     │    │
                                       │   │   YES   NO
                                       │   │     │    │
                                       │   │     │    └──▶ Continue ──▶ RUNNING
                                       │   │     │
                            ┌──────────┘   │     │
                            │              │     │
                            ▼              ▼     ▼
                   ┌──────────────┐  ┌──────────────┐
                   │     MAX      │  │              │
                   │  ITERATIONS  │  │    ERROR     │
                   │              │  │              │
                   └──────┬───────┘  └──────┬───────┘
                          │                 │
                     [Enter]           [Enter]
                          │                 │
                          ▼                 ▼
                   ┌──────────────┐  ┌──────────────┐
                   │   COMPLETE   │  │     QUIT     │
                   └──────┬───────┘  └──────────────┘
                          │
                     [Enter]
                          │
                          ▼
                   ┌──────────────┐
                   │     QUIT     │
                   └──────────────┘
```

### State Descriptions

| State | String | Behavior |
|-------|--------|----------|
| `StateIdle` | `"IDLE"` | Waiting for user to press Enter to start |
| `StateRunning` | `"RUNNING"` | Claude CLI active, processing stories |
| `StatePaused` | `"PAUSED"` | Execution paused, can resume with `p` |
| `StateComplete` | `"COMPLETE"` | All stories finished successfully |
| `StateMaxIterations` | `"PAUSED"` | Iteration limit reached (soft stop) |
| `StateError` | `"ERROR"` | Fatal error, cannot continue |

### Signal Protocol

Signals are XML-like tags emitted in Claude's output text, parsed via regex:

| Signal | Tag | Priority | Action |
|--------|-----|----------|--------|
| Complete | `<promise>COMPLETE</promise>` | 1 (highest) | If 0 remaining → Complete; if remaining > 0 → override & continue |
| Error | `<spectrum-error reason="...\">...</spectrum-error>` | 2 | Fatal → Error state |
| Retry | `<spectrum-retry reason="...\">...</spectrum-retry>` | 3 | Increment error counter; retry if under limit (3) |
| Blocked | `<spectrum-blocked reason="...\">...</spectrum-blocked>` | 4 | Log warning, skip to next unblocked story |
| Continue | `<spectrum-continue>...</spectrum-continue>` | 5 | Success, schedule next iteration after pause |
| NeedsContext | `<spectrum-needs-context>...</spectrum-needs-context>` | 5 | Story requires additional context before proceeding; prompts user |
| None | (no match) | 6 | Assume continue |

### Iteration Lifecycle

```
┌─ Iteration N ──────────────────────────────────────────────────────┐
│                                                                     │
│  1. Check max iterations ─── exceeded? ──▶ StateMaxIterations      │
│                │                                                    │
│                ▼                                                    │
│  2. Increment counter, create output channel                       │
│                │                                                    │
│                ▼                                                    │
│  3. RunClaudeStreamingCmd() ──▶ spawn `claude` CLI process         │
│     + ListenToOutput()        ├── stream stdout/stderr             │
│                               ├── parse JSON events                │
│                               └── emit ToolActivityMsg             │
│                │                                                    │
│                ▼                                                    │
│  4. ClaudeFinishedMsg received                                     │
│                │                                                    │
│          ┌─────┴─────┐                                              │
│       error?      success?                                          │
│          │            │                                             │
│          ▼            ▼                                             │
│  5a. Inc errors   5b. ParseSignal()                                │
│      backoff          ReloadStoriesCmd()                            │
│      retry            SignalDetectedMsg                             │
│                │                                                    │
│                ▼                                                    │
│  6. handleSignal() ──▶ determine next action                       │
│                │                                                    │
│          ┌─────┴──────────────────┐                                 │
│      continue?              terminal?                               │
│          │                      │                                   │
│          ▼                      ▼                                   │
│  7. Pause (N seconds)    Complete/Error                             │
│          │                                                          │
│          ▼                                                          │
│  8. StartNextIterationMsg ──▶ Loop to step 1                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Animation System

All animations are driven by a 100ms tick (`TickMsg`) and use Harmonica spring physics for organic motion.

### Spring Configuration

| Animation | Stiffness | Damping | FPS | Initial | Target | Character |
|-----------|-----------|---------|-----|---------|--------|-----------|-
| Progress Bar | 6.0 | 0.7 | 60 | 0.0 | `ProgressPercent()` | Snappy, slight overshoot |
| Story Pop | 8.0 | 0.5 | 60 | 0.3 (start scale) | 1.0 (normal) | Very bouncy |
| Log Slide-In | 5.0 | 0.8 | 60 | 20.0 (x-offset) | 0.0 (settled) | Smooth, minimal overshoot |
| Ray Length | 4.0 | 0.3 | 60 | `{6,5,4,3}` | Random 4–8 | Bouncy, organic |

### Animation Update Loop (per 100ms tick)

```
TickMsg received
    │
    ├── 1. Splash.Tick()                 (if splash active — advance mesh/particles)
    │
    ├── 2. Prism.Tick()                  (advance 3D rotation)
    │
    ├── 3. PrismTick++ → PrismFrame      (every 3 ticks → cycle 4 spectrum colors)
    │
    ├── 4. ShimmerPhase += 0.08          (sine wave, wraps at 2π)
    │       └── prism body brightness oscillation
    │
    ├── 5. RayLengths lerp toward targets (linear 0.1 rate, re-target randomly)
    │
    └── 6. Broadcast to all plugins:
            ├── Spectrum:
            │   ├── Spinner.Update()              (advance frame)
            │   ├── ProgressSpring.Update()       (pos, vel → target)
            │   ├── StoryPopSpring.Update()       (per-story scale → 1.0)
            │   │       └── cleanup when |scale - 1.0| < 0.01
            │   ├── PulsePhase += 0.15            (sine wave, wraps at 2π)
            │   │       └── active story icon brightness
            │   ├── LogSlideSpring.Update()       (per-entry offset → 0.0)
            │   └── RaySpring.Update()            (per-ray length → target)
            └── All other plugins (no-op for most)
```

### Continuous Animations

| Animation | Increment/Tick | Full Cycle | Effect |
|-----------|----------------|------------|--------|
| Pulse | +0.15 rad | ~4.2 seconds | Active story icon brightness oscillation (0.2 → 1.0) |
| Shimmer | +0.08 rad | ~7.85 seconds | Prism body brightness modulation (0.85 → 1.0) |
| Prism Frame | +1 every 300ms | 1.2 seconds | 4-color spectrum rotation on text prism |
| 3D Rotation | 0.6 rad/sec Y-axis | ~10.5 seconds | Full rotation of 3D prism model |

---

## 3D Prism Rendering Pipeline

### Pipeline Overview

```
┌─────────────────┐
│  Embedded OBJ   │  444 vertices, 360 triangular faces
│  (go:embed)     │  Blender 4.2.16 LTS export
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  FauxGL Loader  │  LoadOBJ() → Mesh
│  BiUnitCube()   │  Normalize to [-1, +1] cube
└────────┬────────┘
         │
         ▼
┌─────────────────┐  Camera: eye(0,0,3) center(0,0,0) up(0,1,0)
│  Scene Setup    │  FOV: 50°  Aspect: w/h  Near: 0.1  Far: 100
│  Projection     │  Clear: RGB(0.05, 0.04, 0.08) dark purple-black
└────────┬────────┘
         │
         ▼
┌─────────────────┐  Y-spin: angle = t × 0.6 rad/s
│  Model Transform│  X-tilt: 0.3 ± 0.15 × sin(angle × 0.7)
│  (animated)     │  Z-roll: ±0.1 × sin(angle × 0.5)
└────────┬────────┘  Matrix order: Rz × Ry × Rx
         │
         ▼
┌─────────────────┐  Key: dir(0.6, 0.5, 1) color(0.9, 0.92, 1.0) @0.85
│  Two-Light      │  Fill: dir(-0.4, -0.3, 0.5) color(1.0, 0.85, 0.7) @0.3
│  Lambertian     │
└────────┬────────┘  Fragment: Σ(color × intensity × max(0, N·L))
         │
         ▼
┌─────────────────┐
│  ctx.DrawMesh() │  Rasterize 360 triangles → pixel buffer
└────────┬────────┘
         │
         ▼
┌─────────────────┐  Each terminal row = 2 pixel rows
│  Half-Block     │  Top pixel → foreground ANSI color
│  ANSI Encoding  │  Bottom pixel → background ANSI color
│                 │  Character: ▀ (U+2580)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Terminal Output │  ANSI 24-bit color: \x1b[38;2;R;G;Bm
│  (string)       │  Optimization: skip redundant color codes
└─────────────────┘
```

### Resize Behavior

```
Terminal Width    Prism Columns    Formula
─────────────    ─────────────    ───────────────────────
< 80              20              min(max(width/4, 20), 40)
80                20              80/4 = 20
100               25              100/4 = 25
120               30              120/4 = 30
160               40              max = 40
200               40              clamped at 40

Prism rows: always 5 (fixed)
```

### Text Prism Fallback Variants

When the 3D renderer is unavailable (`m.Prism == nil`), a text-based prism is used:

```
Style: gradient (default, 1 line) — Spring-animated ray lengths with gradient
─◁◆▷▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

Style: simple (1 line)
-<>====

Style: braille (3 lines)
  ─⢀⣠⣤⣄⡀
━━⣾⣿⣿⣿⣷
  ⠈⠉⠛⠛⠛⠛⠛⠛

Style: ascii (5 lines)
        ╱╲
   ━━━╱  ╲
      ╱    ╲━━━
     ╱______╲══════
               ▬▬▬▬▬▬

Style: fancy (1 line)
─◁◆▷▬▬▬▬

Style: compact (1 line)
─◆▬▬
```

---

## Splash Screen Rendering Pipeline

The splash screen (`splash/splash.go`) is a fully procedural animation rendered to ANSI true-color.

### Components

| Component | Parameters | Description |
|-----------|-----------|-------------|
| Icosahedron mesh | 444 verts, 360 faces, pos(0.36, 0.50), scale 0.11 | Rotating 3D wireframe mesh |
| Beam particles | 200 particles, 4 rays, width 0.015 | Horizontal light beam |
| Spectral wave field | freq 34.0/26.0, speed 1.0 | Background wave pattern |
| Title | "P R I S M" | Centered text in near-white |
| Gradient bar | 4-stop spectrum gradient | Horizontal bar below title |

### Spectral Gradient (used throughout)

```
#3B82F6 ───▶ #14B8A6 ───▶ #22C55E ───▶ #F59E0B
 Blue          Teal         Green        Amber
```

### ASCII Density Ramp

```
{ ' ', '.', ',', ':', '-', '=', '+', '*', '#', '%', '@' }
```

11 characters from empty to full density, used for wave field and mesh rendering.

### Rendering Phases

1. Rotate and project 444 mesh vertices (Y/X/Z rotation + perspective distance 3.5)
2. Rasterize 360 triangles with barycentric interpolation + back-face culling
3. Build beam light grid from particle positions with Gaussian glow
4. Compute layout for title, bar, and subtitle (centered)
5. Per-cell compositing: wave field + beam particles + mesh overlay + halo dimming
6. Stamp title (232, 232, 240 near-white)
7. Stamp gradient bar
8. Stamp subtitle with atmospheric offset
9. Convert to ANSI string (batch same-color runs, reset per line)

---

## Domain Models

### stories.json Schema

```json
{
  "plan": {
    "name": "Feature Implementation",
    "source": ".prism/shared/plans/2026-02-12-feature.md",
    "createdAt": "2026-02-12T14:00:00Z",
    "qualityGates": ["npm run typecheck", "npm run lint", "npm test"]
  },
  "stories": [
    {
      "id": "STORY-001",
      "title": "Setup database schema",
      "description": "Create initial migration files for PostgreSQL",
      "priority": 1,
      "status": "complete",
      "blockedBy": null,
      "files": [
        { "path": "db/migrations/001_initial.sql", "action": "create" },
        { "path": "db/schema.go", "action": "modify" }
      ],
      "steps": [
        { "description": "Design schema", "done": true },
        { "description": "Write migration", "done": true }
      ],
      "completedAt": "2026-02-12T14:30:00Z",
      "commitHash": "abc123"
    }
  ]
}

> **Note**: `stories.json` is re-read from disk after each iteration via `ReloadStoriesCmd`. External edits are picked up on the next reload, but concurrent writes are not locked. The `commitHash` field is populated when `MarkStoryComplete()` receives a commit reference, but automated extraction from Claude output is not yet implemented.
```

### Story Status Lifecycle

```
                ┌─────────┐
                │ pending  │
                └────┬────┘
                     │
            GetNextStory()
           (priority-sorted,
            unblocked only)
                     │
                     ▼
              ┌────────────┐
              │ in_progress │
              └──────┬─────┘
                     │
          MarkStoryComplete()
            (sets status,
             records commit,
             marks all steps done)
                     │
                     ▼
              ┌────────────┐
              │  complete   │
              └────────────┘
```

### Dependency Resolution

```go
func GetNextStory():
    candidates = stories.filter(s =>
        s.Status != "complete" &&
        !s.IsBlocked(stories)     // blockedBy story must be complete
    )
    sort(candidates, by: Priority ascending)  // lower number = higher priority
    return candidates[0]  // or nil if empty
```

### .prism/ Directory Convention

```
.prism/
├── stories/                              # Story files
│   ├── stories.json                      # Legacy flat layout
│   ├── epic-a/
│   │   └── stories.json                  # Epic-scoped
│   └── epic-b/
│       └── stories.json
├── shared/                               # Committed to repo
│   ├── research/
│   │   └── YYYY-MM-DD-topic.md
│   ├── plans/
│   │   └── YYYY-MM-DD-feature.md
│   ├── spectrum/
│   │   ├── progress.md                   # Legacy flat
│   │   ├── epic-a/
│   │   │   └── progress.md               # Epic-scoped
│   │   └── epic-b/
│   │       └── progress.md
│   ├── validation/
│   ├── docs/
│   ├── handoffs/
│   ├── prs/
│   └── ref/
└── local/                                # Gitignored
```

**Progress file path derivation**:

| stories.json Location | progress.md Location |
|------------------------|---------------------|
| `.prism/stories/stories.json` | `.prism/shared/spectrum/progress.md` |
| `.prism/stories/<epic>/stories.json` | `.prism/shared/spectrum/<epic>/progress.md` |

---

## Claude CLI Integration

### Command Invocation

**Streaming mode** (used during execution):

```bash
claude \
  --dangerously-skip-permissions \
  --print \
  --output-format stream-json \
  --verbose \
  "Execute the next story from {storiesPath} using the /prism-spectrum workflow. \
   Progress file: {progressPath}"
```

**Non-streaming mode** (fallback):

```bash
claude \
  --dangerously-skip-permissions \
  --print \
  "Execute the next story from {storiesPath} using the /prism-spectrum workflow. \
   Progress file: {progressPath}"
```

### Streaming Pipeline

```
claude CLI (child process)
    │
    ├── stdout ──▶ goroutine 1 ──▶ streamOutput()
    │                                  │
    └── stderr ──▶ goroutine 2 ──▶ streamOutput()
                                       │
                              ┌────────┴────────┐
                              │  bufio.Scanner   │  1MB buffer
                              │  (line by line)  │
                              └────────┬────────┘
                                       │
                              ┌────────┴────────┐
                              │ ParseStreamEvent │  JSON → StreamEvent
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                   │
           ┌────────┴────────┐ ┌──────┴───────┐ ┌────────┴────────┐
           │ ExtractTool      │ │ Bridge       │ │ Bridge          │
           │ Activity()       │ │ Thinking     │ │ stream_event    │
           │ (tool formatting)│ │ Blocks       │ │ (text/thinking  │
           └────────┬────────┘ │ (💭 content) │ │  deltas)        │
                    │          └──────┬───────┘ └────────┬────────┘
                    │                 │                   │
                    └────────────┬────┴───────────────────┘
                                 │
                        ┌────────┴────────┐
                        │  EventBus       │  Publishes typed events:
                        │  (agentbus)     │  TextDelta, ThinkingDelta,
                        │                 │  ToolCallStart/Complete,
                        │                 │  AgentSpawnStart/Finish,
                        │                 │  SignalDetected
                        └────────┬────────┘
                                 │
                        ┌────────┴────────┐
                        │  Bubble Tea      │  ToolActivityMsg →
                        │  Update()        │  update UI in real-time
                        └─────────────────┘
```

### Event Types (v2.4.1)

The streaming pipeline produces typed events via `agentbus/events.go`:

| Event | Source | Description |
|-------|--------|-------------|
| `EventTextDelta` | `stream_event` | Incremental text content from Claude |
| `EventThinkingDelta` | `"thinking"` content block | Extended thinking/reasoning content |
| `EventToolCallStart` | `tool_use` content block | Tool invocation begins (name, input) |
| `EventToolCallComplete` | `tool_result` | Tool execution finished (output, status) |
| `EventAgentSpawnStart` | `Task` tool use | Subagent spawned (ID, name, type) |
| `EventAgentSpawnFinish` | Agent task completion | Subagent finished (result, status) |
| `EventSignalDetected` | Signal parser | Spectrum signal found in output |

### ContentBlock Extensions (v2.4.1)

`claude/events.go` `ContentBlock` struct now includes:

```go
type ContentBlock struct {
    Type      string `json:"type"`       // "text", "tool_use", "tool_result", "thinking"
    Text      string `json:"text"`
    ID        string `json:"id"`
    Name      string `json:"name"`
    Input     any    `json:"input"`
    Content   string `json:"content"`
    Thinking  string `json:"thinking"`   // NEW: Extended thinking content
    Signature string `json:"signature"`  // NEW: Thinking signature/metadata
}
```

### Tool Activity Formatting

| Tool | Display Format | Example |
|------|---------------|---------|-
| Read | `Reading: .../shortened/path.ts` | `Reading: .../services/auth.ts` |
| Edit | `Editing: .../shortened/path.ts` | `Editing: .../components/Form.tsx` |
| Write | `Writing: .../shortened/path.ts` | `Writing: .../config/db.ts` |
| Bash | `Running: command` (50 char max) | `Running: npm run typecheck` |
| Glob | `Finding: pattern` | `Finding: **/*.test.ts` |
| Grep | `Searching: pattern` (40 char max) | `Searching: handleSubmit` |
| Task | `Agent: description` (50 char max) | `Agent: Analyzing codebase...` |
| WebFetch | `Fetching: URL` (50 char max) | `Fetching: https://docs.example.com` |
| WebSearch | `Web search...` | `Web search...` |
| TodoWrite | `Updating tasks...` | `Updating tasks...` |
| AskUserQuestion | `Asking question...` | `Asking question...` |

### Output Parser Event Detection

The `OutputParser` maintains a buffer of all output and fires events on:

| Event | Detection | Source |
|-------|-----------|--------|
| Story Announced | `<spectrum-story>ID: STORY-NNN` tag | `parser.go:52` |
| Phase Changed | Keywords: "research", "implementing", "quality gate", etc. | `parser.go:65` |
| Quality Gate Started | "Running quality gates", "npm run typecheck/lint/test" | `parser.go:75` |
| Commit Created | "git commit", "feat(STORY-" keywords (conventional commits) | `parser.go:86` |
| Signal Detected | Full buffer regex scan for `<promise>` or `<spectrum-*>` | `parser.go:94` |

### Error Handling

| Scenario | Behavior |
|----------|----------|
| Claude CLI not in PATH | `exec.Command` fails immediately, TUI transitions to Error state with no automatic retry or PATH search fallback |
| Claude process error | Increment `ConsecutiveErrs`, backoff = `errs × 2s`, retry |
| 3+ consecutive errors | Transition to `StateError`, stop execution |
| Signal: error | Immediate `StateError` |
| Signal: retry | Increment errors, retry if under limit (3) |
| Signal: complete (but stories remain) | Override signal, log warning, continue |
| Max iterations reached | Transition to `StateMaxIterations` |
| Claude timeout | 30 minutes per session |

### Process Termination

- **Windows**: `taskkill /F /T /PID <pid>` (tree kill)
- **Unix**: `cmd.Process.Kill()` (direct kill)

---

## Terminal Detection

The terminal detection system (`terminal/`) automatically identifies the user's environment and adapts the UI accordingly.

### Detection Capabilities

| Detection | Method | Fallback |
|-----------|--------|----------|
| Terminal type | Environment variables (priority-ordered) | `"Terminal"` |
| Shell | `PSModulePath`/`COMSPEC` (Windows), `$SHELL` (Unix) | `"unknown"` |
| Color profile | `COLORTERM` env, `termenv` profile | `"TrueColor"` |
| Background color | OSC 11, settings.json, theme file, lookup table | `#0A0910` |
| Nerd Font | IDE settings.json `fontFamily` contains "Nerd" | `false` |
| Git branch | `.git/HEAD` parsing | `""` |
| Accent color | IDE color customizations, theme file, lookup table | `#607088` |
| Editor background | IDE color customizations, theme file, lookup table | `#2c2d3a` |

### Supported Terminals

| Terminal | Detection Method |
|----------|-----------------|
| Cursor | `CURSOR_TRACE_ID` / `CURSOR_EXTENSION_HOST_ROLE` |
| Windsurf | `WINDSURF_PID` |
| VS Code | `VSCODE_PID` / `TERM_PROGRAM=vscode` |
| Windows Terminal | `WT_SESSION` |
| WezTerm | `WEZTERM_PANE` |
| iTerm2 | `ITERM_SESSION_ID` / `TERM_PROGRAM=iTerm.app` |
| Alacritty | `ALACRITTY_WINDOW_ID` |
| Kitty | `KITTY_WINDOW_ID` |
| Hyper | `TERM_PROGRAM=Hyper` |
| Terminal.app | `TERM_PROGRAM=Apple_Terminal` |
| ConEmu | `ConEmuPID` |

### Theme Adaptation

For IDE terminals (VS Code, Cursor, Windsurf), the system:

1. Reads `settings.json` (platform-specific path, JSONC-comment-stripped)
2. Extracts `workbench.colorTheme` and `colorCustomizations`
3. Finds matching theme extension files for accent/background colors
4. Falls back to a lookup table of 19 known themes
5. Applies `styles.ApplyTheme(accentHex)` to override Primary color and rebuild cached styles
6. Applies `styles.ApplySecondary(editorBgHex)` to match inactive tab backgrounds
7. Computes atmosphere color for splash screen blending

---

## Diff System

The diff system (`diff/`) provides parsing and rendering of unified diffs with syntax highlighting.

### Features

- **Unified and side-by-side** view modes
- **Word-level diffs** for consecutive add/remove pairs
- **Syntax highlighting** via Chroma (monokai theme)
- **Line numbers** with dual-gutter (old + new)
- **Horizontal scrolling** and **word wrapping** modes

### Diff Colors

| Element | Color | Background |
|---------|-------|------------|
| Added line | Green `#10B981` | Dark green `#1a3a2a` |
| Removed line | Red `#EF4444` | Dark red `#3a1a1a` |
| Context line | Gray `#6B7280` | — |
| Word diff (add) | Green, Bold | Dark green `#1a3a2a` |
| Word diff (remove) | Red, Bold | Dark red `#3a1a1a` |
| Hunk header | Blue `#3B82F6`, Bold | — |
| Line numbers | Gray `#6B7280` | — |

---

## File Watcher

The `watcher/` package provides real-time file change detection using `fsnotify`, enabling auto-refresh across plugins.

### Architecture

```
Project Directory
    │
    ▼
┌──────────────────┐
│  fsnotify.Watcher │  Recursive directory watching
│  (all subdirs)    │  Auto-adds newly created directories
└────────┬─────────┘
         │
    fs event
         │
         ▼
┌──────────────────┐
│  Ignore Filter    │  Skips: .git, node_modules, vendor,
│                   │  dist, build, __pycache__, .cache,
│                   │  hidden dirs (except .prism)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Debounce         │  Per-path timer (default 500ms)
│  (time.Timer map) │  Resets on repeated events
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  EventBus.Publish │  FileChangedEvent{FilePath, Action}
│                   │  Action: "created", "modified", "deleted"
└──────────────────┘
```

### Configuration

- **Default debounce**: 500ms
- **Functional options**: `WithDebounce(duration)`, `WithIgnoreFunc(fn)`
- **Thread-safe**: Uses `sync.Mutex` for timer map access
- **Lifecycle**: `Start()` walks directory tree, `Stop()` cancels all timers and closes watcher

Subscribers: Git plugin (auto-refresh status), Files plugin (tree refresh), Browser plugin (artifact scanning).

---

## Persisted UI State

The `state/` package provides per-project UI state persistence across sessions.

### Storage

State files are stored at `~/.config/prism-cli/state/<project-hash>.json`. The hash is SHA-256 of the project directory path (first 12 hex characters).

### Schema

```go
type ProjectState struct {
    ActivePlugin string                    // Last active tab
    Files        FilesPersistedState       // Open tabs, expanded directories, sidebar width
    Git          GitPersistedState         // Sidebar width, diff view mode
    Workspaces   WorkspacesPersistedState  // Linked tasks (worktree path → story ID)
}
```

### Operations

| Method | Description |
|--------|-------------|
| `NewStore(configDir)` | Creates store rooted at config directory; empty `configDir` makes all operations no-ops |
| `Load(projectDir)` | Reads state for project; returns zero-value on missing/corrupt file |
| `Save(projectDir, state)` | Writes state atomically as indented JSON |

Thread-safe via `sync.RWMutex`.

---

## Global Workspace Registry

The `registry/` package manages `~/.prism/workspaces.json` for cross-directory project discovery.

### Schema

```json
{
  "projects": [
    {
      "path": "/Users/demo/project",
      "name": "project",
      "lastAccessed": "2026-03-02T14:00:00Z",
      "version": "2.5.0"
    }
  ]
}
```

### Operations

| Function | Description |
|----------|-------------|
| `Register(projectDir, version)` | Add/update project entry (called on TUI exit from `main.go`) |
| `LoadAll()` | Read all registered projects |
| `Prune()` | Remove entries where `.prism/` no longer exists on disk |

### Cross-Process Safety

Uses an exclusive lockfile at `~/.prism/workspaces.json.lock`:
- Retries up to 10 times with 50ms delay
- Removes stale lock and retries once on failure
- Windows paths are lowercased via `normalizePath()` for case-insensitive deduplication

The Workspaces plugin reads from this registry to discover projects across different directories (not just siblings).

---

## Keyboard Reference

### Global Keys (All Screens)

| Key | Action |
|-----|--------|
| `q` / `Ctrl+C` | Quit application |
| `?` | Toggle help modal |
| `Ctrl+P` / `:` | Open command palette |
| `Ctrl+D` | Open fuzzy file finder overlay (F-4) |
| `Ctrl+S` | Open content search overlay (F-5) |
| `1`–`9` | Switch to tab N |
| `Tab` | Next tab (unless Spectrum has multiple epics) |
| `Shift+Tab` | Previous tab (unless Spectrum has multiple epics) |

### Input Priority Chain

When a key is pressed, it is processed in this strict order:

1. **Splash skip** — Any key during splash ends it immediately
2. **Onboarding passthrough** — All keys go to onboarding plugin
3. **Quit** — `q` / `Ctrl+C` always quit
4. **Dialog** — If a dialog is open, keys route to dialog
5. **Modal** — If a modal is open, keys route to modal
6. **Global keys** — Help, command palette, file finder, content search, tab switching
7. **Active plugin** — Remaining keys delegated to the focused plugin

### Home Screen

| Key | Action |
|-----|--------|
| `j` / `↓` | Next menu item (wraps) |
| `k` / `↑` | Previous menu item (wraps) |
| `Enter` / `Space` | Navigate to selected screen |
| `1`–`3` | Jump to Research / Plans / Spectrum |

### Research / Plans — List Mode

| Key | Action |
|-----|--------|
| `j` / `↓` | Next file |
| `k` / `↑` | Previous file |
| `Enter` | Open file in viewport |
| `d` | **Plans only**: Decompose plan to epic |
| `Esc` / `Backspace` | Return to Home |

### Research / Plans — Viewer Mode

| Key | Action |
|-----|--------|
| `Esc` / `Backspace` | Close viewer, return to list |
| `j` / `k` / `↑` / `↓` | Scroll content |
| `PgUp` / `PgDn` | Page scroll |

### Spectrum Dashboard

| Key | State | Action |
|-----|-------|--------|
| `Enter` / `Space` | Idle | Start execution |
| `Space` / `p` | Running | Pause execution |
| `p` | Paused | Resume execution |
| `/` | Running | Skip current story |
| `Enter` / `Space` | Paused | Resume |
| `a` / `s` | Any | Stories page prev/next |
| `z` / `x` | Any | Logs page prev/next |
| `Tab` / `Shift+Tab` | Multi-epic | Switch epic |
| `Enter` / `Space` | Terminal state | Quit |

### Files Screen

| Key | Pane | Action |
|-----|------|--------|
| `j` / `k` | Tree | Navigate files |
| `Enter` / `Space` | Tree | Toggle expand / open in tab |
| `x` | Tree/Preview | Close active tab |
| `/` | Tree | Enter filter mode |
| `Ctrl+D` | Any | Open fuzzy file finder (F-4) |
| `Ctrl+S` | Any (not editing) | Open content search (F-5) |
| `Tab` | Any | Toggle tree/preview pane |
| `j` / `k` | Preview | Scroll content |
| `h` / `l` | Preview | Previous / next tab |
| `b` | Preview | Toggle git blame annotations |
| `e` | Preview | Enter edit mode |
| `Ctrl+S` | Edit mode | Save file |
| `Esc` | Edit mode | Cancel edit |
| `Esc` | Tree | Focus Home |
| `Esc` | Preview | Focus tree pane |

### Git Screen

| Key | Pane | Action |
|-----|------|--------|
| `Tab` | Any | Toggle sidebar/diff pane |
| `s` | Sidebar | Stage/unstage file (or resolve conflict) |
| `c` | Any | Open commit modal |
| `d` | Sidebar | Discard changes (G-8) |
| `P` | Any | Push modal (G-1) |
| `L` | Any | Pull modal (G-2) |
| `b` | Any | Branch picker (G-3) |
| `S` | Any | Stash menu (G-4) |
| `r` | Any | Refresh status + commits |
| `v` | Diff | Toggle unified/side-by-side |
| `j` / `k` | Both | Navigate / scroll |
| `Enter` | Sidebar | Load diff for file, or commit detail (G-7) |
| `Esc` | Sidebar | Focus Home (or exit commit detail) |
| `Esc` | Diff | Focus sidebar |

### Agent Screen

| Key | Action |
|-----|--------|
| `Ctrl+B` | Toggle wide/compact mode |
| `Ctrl+Enter` | Send message |
| `j` / `k` | Navigate conversations (sidebar) or scroll messages (chat) |
| `Enter` | Load selected conversation |
| `m` | Toggle Glamour/lite markdown rendering |
| `a` | Toggle analytics view |
| `Tab` | Toggle sidebar ↔ input focus |
| `Esc` | Focus Home |

### Monitor Screen

| Key | Panel | Action |
|-----|-------|--------|
| `Tab` | Any | Cycle focus: Health → History → Gates |
| `Shift+Tab` | Any | Cycle focus backward |
| `r` | Any | Manual refresh |
| `R` | Gates | Run all quality gates (M-2) |
| `j` / `k` | History/Gates | Navigate entries (wraps) |
| `Enter` | History | Open detail modal (M-4) |
| `Enter` | Gates | Run selected gate (M-2) |
| `o` | Gates | View gate output (M-3) |
| `Esc` | Any | Focus Home |

### Browser Screen

| Key | Panel | Action |
|-----|-------|--------|
| `Tab` | Any | Cycle focus: Sessions → History → Artifacts |
| `Shift+Tab` | Any | Cycle focus backward |
| `j` / `k` | Any | Navigate items within panel |
| `Enter` | Sessions | View session details |
| `Enter` | History | View verification details |
| `Enter` | Artifacts | Open artifact preview |
| `r` | Any | Refresh panels |
| `Esc` | Any | Focus Home |

### Workspaces Screen

| Key | Mode | Action |
|-----|------|--------|
| `j` / `k` | Projects/Epics/Worktrees | Navigate items |
| `Enter` | Projects | Enter epics view |
| `Enter` | Epics | Switch to selected epic |
| `Enter` | Worktrees | Switch to worktree directory |
| `w` | Any sidebar | Toggle to projects view |
| `v` | List/Kanban | Toggle worktrees list ↔ kanban board |
| `n` | Worktrees | Create new worktree (W-2) |
| `d` | Worktrees | Delete selected worktree (W-3) |
| `h` / `l` | Kanban | Navigate columns |
| `j` / `k` | Kanban | Navigate cards within column |
| `Enter` | Kanban | Select card, show detail |
| `[` / `]` | Preview | Switch tabs (Info/Stories/Progress) |
| `j` / `k` | Preview | Scroll content |
| `Tab` | Any | Toggle sidebar/preview |
| `r` | Sidebar | Rescan / refresh |
| `Esc` | Projects | Focus Home |
| `Esc` | Epics | Return to projects |

---

## Styling Reference

### Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#7C3AED` | Purple — Titles, active items, header bg, focused borders |
| Secondary | `#2c2d3a` | Editor bg — Inactive elements, tab bar inactive bg |
| Success | `#10B981` | Green — Completed items, success logs |
| Warning | `#F59E0B` | Amber — Blocked items, warnings, paused state |
| Error | `#EF4444` | Red — Error messages, error state |
| Info | `#3B82F6` | Blue — Info logs, panel titles |
| Dim | `#6B7280` | Gray — Borders, pending items, hints |
| Background | `#1F2937` | Dark gray — Background elements, modal bg |
| White | `#FFFFFF` | White — Header text |
| BorderNormal | `#4B5563` | Inactive borders |
| BorderActive | `= Primary` | Focused borders |
| Highlight | `#06B6D4` | Cyan — Current activity, highlighted text |

### Spectrum Gradient (4-Stop)

```
#3B82F6 ───▶ #14B8A6 ───▶ #22C55E ───▶ #F59E0B
 Blue          Teal         Green        Amber
```

Used for: Progress bar fill, ASCII logo, prism rays, sidebar logo, gradient bar.

### Workflow Phase Colors

| Phase | Color | Hex |
|-------|-------|-----|
| Research | Blue | `#3B82F6` |
| Plan | Teal | `#14B8A6` |
| Implement | Green | `#22C55E` |
| Validate | Amber | `#F59E0B` |
| Idle | Gray | `#4B5563` |

### Component Styles

| Style | Properties |
|-------|------------|
| `TitleStyle` | Bold, FG: Purple `#7C3AED`, Padding(0,1) |
| `HeaderStyle` | Bold, FG: White, BG: Purple `#7C3AED`, Padding(0,1), MarginBottom(1) |
| `PanelStyle` | Border: Rounded, BorderFG: Gray `#6B7280`, Padding(0,1) |
| `StoriesTitleStyle` | Bold, FG: Blue `#3B82F6` |
| `ActivityTitleStyle` | Bold, FG: Teal `#14B8A6` |
| `LogTitleStyle` | Bold, FG: Green `#22C55E` |
| `CompleteStyle` | FG: Green `#10B981` |
| `CurrentStyle` | Bold, FG: Purple `#7C3AED` |
| `PendingStyle` | FG: Gray `#6B7280` |
| `BlockedStyle` | Italic, FG: Amber `#F59E0B` |
| `HighlightStyle` | FG: Cyan `#06B6D4` |
| `DimStyle` | FG: Gray `#6B7280` |
| `ErrorStyle` | Bold, FG: Red `#EF4444` |
| `StatusBarStyle` | FG: Gray `#6B7280`, Padding(0,1) |
| `SidebarStyle` | Border: Rounded, BorderFG: Purple `#7C3AED`, Padding(0,1) |
| `SidebarBrandStyle` | Bold, FG: Purple `#7C3AED` |
| `SidebarTitleStyle` | FG: White `#FFFFFF` |
| `AppHeaderStyle` | Bold, FG: White, BG: Purple `#7C3AED`, Padding(0,1) |
| `FooterStyle` | FG: Gray `#6B7280`, Padding(0,1) |

### Icons

| Icon | Character | Color | Usage |
|------|-----------|-------|-------|
| Check | `✓` | Green `#10B981` | Completed stories |
| Play | `▸` | Purple `#7C3AED` | Active story, running state |
| Pending | `○` | Gray `#6B7280` | Pending stories |
| Blocked | `⊘` | Amber `#F59E0B` | Blocked stories |
| Error | `✗` | Red `#EF4444` | Failed items |

### Nerd Font Icons

When Nerd Font is detected, the following glyphs are used for tab bar, sidebar, and footer:

| Context | Nerd Font | ASCII Fallback |
|---------|-----------|----------------|
| Separator (right) | `\uE0BC` | `▶` |
| Separator (left) | `\uE0BA` | `◀` |
| Home | `\uF015` | `1` |
| Search | `\uF002` | `2` |
| List | `\uF03A` | `3` |
| Bolt | `\uF0E7` | `4` |
| Folder | `\uF07B` | `5` |
| Git Branch | `\uE0A0` | `6` |
| User | `\uF007` | `7` |
| Chart | `\uF080` | `8` |
| Grid | `\uF009` | `9` |

### Theme Override System

When running in an IDE terminal, detected accent and editor background colors override the defaults:

- `ApplyTheme(accentHex)` — Overrides `Primary`, rebuilds TitleStyle, HeaderStyle, CurrentStyle, ProgressBarStyle, SidebarStyle, SidebarBrandStyle, PlayIcon, AppHeaderStyle, TabBorderColor
- `ApplySecondary(editorBgHex)` — Overrides `Secondary` and `TabBarInactiveBg`

---

## Vertical Layout & Height Budget

### Critical: lipgloss `Height()` Semantic

**`Height(h)` sets the INNER (content) height, not the outer frame height.**

Despite the v1 migration guide claiming Width/Height are "outer dimensions including borders and padding," the actual implementation in lipgloss (v1.1.1-pre) applies `Height()` to content BEFORE `applyBorder()`:

```go
// lipgloss style.go Render() order of operations:
// 1. alignTextVertical(str, verticalAlign, height, nil)  ← pads content to `height` lines
// 2. alignTextHorizontal(str, horizontalAlign, width, st)
// 3. s.applyBorder(str)                                   ← adds 2 lines (top + bottom border)
// 4. MaxHeight truncation (AFTER border)
```

This means for any style with `Border(lipgloss.RoundedBorder())`:

| Code | Inner Lines | Outer Lines |
|------|-------------|-------------|
| `style.Height(h).Render(content)` | `h` | `h + 2` |
| `style.Height(h - 2).Render(content)` | `h - 2` | `h` |

**Rule: To get a bordered panel of exactly `h` outer lines, use `Height(h - 2)`.**

Additionally, `alignTextVertical` does NOT truncate — if content exceeds the Height setting, the content is returned as-is, and the border wraps around the full content. Use `MaxHeight()` if truncation is needed.

### App Shell Chrome Heights

```
Terminal Height (m.Height)
├── Tab Bar:  3 lines (PowerlineTabHeight) or 2 lines (CompactTabHeight)
├── Content:  m.Height - tabBarHeight - FooterHeight  (via contentHeight())
└── Footer:   3 lines (FooterHeight)
    ├── Tier 1: Key hints (BorderTop + content = 2 lines)
    └── Tier 2: Powerline status bar (1 line)
```

Constants in `shell.go`:
```go
const (
    FooterHeight       = 3  // key hints border+content (2) + powerline bar (1)
    PowerlineTabHeight = 3  // 3-line diagonal slant tab bar
    CompactTabHeight   = 2  // 1-line tabs + separator rule
)
```

### Per-Plugin Height Budgets

Each plugin receives `(width, height)` where `height = contentHeight()`. The plugin must render exactly `height` visual lines.

**Spectrum** (`plugin_spectrum.go`):
```
height
├── header (measured):         3 lines (PanelStyle border around 1-line content)
├── progressBar (measured):    3 lines (PanelStyle border around 1-line content)
├── mainPanels (dynamic):      dynamicHeight * 60%
│   ├── storyList:             PanelStyle.Height(h-2) → outer = h
│   └── activityPanel:         PanelStyle.Height(h-2) → outer = h
├── logPanel (dynamic):        dynamicHeight - mainPanelHeight
│   └── PanelStyle.Height(h-2) → outer = h
└── statusBar:                 1 line (no border)

fixedHeight = epicHeight + headerHeight + progressHeight + 1
dynamicHeight = height - fixedHeight
```

**Monitor** (`plugin_monitor.go`):
```
height
├── breadcrumb:     1 line (renderBreadcrumb)
├── blank:          1 line
├── 3 panels:       contentHeight = height - 4  (JoinHorizontal)
│   ├── healthPanel:    Height(cH-2) → outer = cH
│   ├── historyPanel:   Height(cH-2) → outer = cH
│   └── gatesPanel:     Height(cH-2) → outer = cH
├── blank:          1 line
└── footer:         1 line
```

**Agent** (`plugin_agent.go`):
```
height
├── breadcrumb:      1 line
├── blank:           1 line
└── wideMode/compact:  height - 2
    ├── sidebar:       Height(h-2) → outer = h  (pad content to h-2 lines)
    └── chatArea:      h lines total
        ├── historyBordered:  Height(historyH) inner → outer = historyH + 2
        ├── blank:            1 line
        └── inputBordered:    5 lines (3 content + 2 border, no Height set)
        historyH = h - 8  →  (h-8+2) + 1 + 5 = h
```

### Panel Height Pattern (Correct)

When creating bordered panels that must fill a specific outer height:

```go
// CORRECT: outer = height lines
styles.PanelStyle.Width(width).Height(height - 2).Render(content)

// WRONG: outer = height + 2 lines (overflows!)
styles.PanelStyle.Width(width).Height(height).Render(content)
```

For manual border styles (not using PanelStyle):
```go
// CORRECT:
lipgloss.NewStyle().
    Border(lipgloss.RoundedBorder()).
    Width(width).
    Height(height - 2).  // inner = height-2, outer = height
    Render(content)

// Pad content to fill inner area:
for len(lines) < height-2 {
    lines = append(lines, "")
}
```

### Resize Handler Consistency

The `PluginResizeMsg.Height` carries `contentHeight()` (total content area). Plugin resize handlers must subtract the same overhead as their `View()` method to derive the viewport height:

```go
// Agent example:
// View: breadcrumb(2) + history_border(2) + blank(1) + input(5) = 10
case plugin.PluginResizeMsg:
    viewportHeight := msg.Height - 10
```

---

## Configuration

### Default Values

| Parameter | Default | Source |
|-----------|---------|--------|
| Max Iterations | 50 | `main.go:126` CLI flag |
| Pause Between Iterations | 2 seconds | `main.go:127` CLI flag |
| Max Consecutive Errors | 3 | `plugin_spectrum.go:148` |
| Stories Per Page | 12 | `plugin_spectrum.go:151` |
| Logs Per Page | 6 | `plugin_spectrum.go:152` |
| Log Capacity | 1000 pre-allocated | `plugin_spectrum.go:153` |
| Recent Output Buffer | 10 max | `plugin_spectrum.go:154` |
| Recent Activities Displayed | 5 | `plugin_spectrum.go` view |
| Tick Interval | 100ms | `update.go:490` |
| Splash Duration | 5 seconds | `update.go:497` |
| Claude Timeout | 30 minutes | `runner.go:78` |
| Output Channel Buffer | 100 messages | Spectrum plugin |
| 3D Prism Default Size | 24 cols × 5 rows | `model.go:150` |
| 3D Prism Min Width | 20 columns | `update.go:69` |
| 3D Prism Max Width | 40 columns | `update.go:71` |
| 3D Prism Width Formula | `termWidth / 4` | `update.go:67` |
| Scanner Buffer Size | 1 MB | `runner.go:207` |
| Sidebar Width | 38 characters | `sidebar.go:13` |
| Sidebar Breakpoint | 120 columns | `sidebar.go:16` |
| Monitor Auto-refresh | 5 seconds | `plugin_monitor.go` |
| Files Max Depth | 3 levels | `plugin_files.go` |
| Workspace Scan | Parent directory siblings | `plugin_workspaces.go` |
| Watcher Debounce | 500ms | `watcher.go` |
| Watcher Artifact Scan | 10 seconds | `plugin_browser.go` |
| State Storage | `~/.config/prism-cli/state/` | `state.go` |
| Workspace Registry | `~/.prism/workspaces.json` | `registry.go` |
| Version | 2.5.0 | `main.go:19` |

### Pagination Configuration

| Paginator | Items/Page | Style | Active Dot | Inactive Dot |
|-----------|-----------|-------|------------|--------------|-
| Stories | 12 | Dots | `●` | `○` |
| Logs | 6 | Dots | `●` | `○` |

### Responsive Breakpoints

| Terminal Width | Behavior |
|---------------|----------|
| < 120 | No sidebar, compact tab bar if needed |
| >= 120 | Sidebar auto-shown (toggleable with Ctrl+D) |
| >= 80 | Footer shows quality gate counts |
| >= 90 | Footer shows iteration counter |
| >= 100 | Footer shows current story ID |
| (no max) | No maximum terminal width is enforced. Panels scale proportionally at any width |

### Demo Mode

Activated with `--demo` flag. Provides:
- 36 pre-seeded stories (12 complete, 24 pending) across 3 pages
- 3 demo epics: `user-auth` (8/12), `dashboard` (12/36), `notifications` (0/9)
- 4 research files and 3 plan files with preview text
- Auto-completion timing: 2000–3500ms per story
- Activity cycling: 300–600ms random intervals
- 16 rotating fake tool activities
- Demo file tree with realistic preview content
- Demo git status with branch, staged/modified/untracked files
- Demo chat messages (user, assistant, tool calls)
- Demo execution history and quality gates
- Demo workspace projects

---

## Build & Cross-Compilation

### Makefile Targets

| Target | Command | Description |
|--------|---------|-------------|
| `build` | `go build -ldflags "-X main.version=$(VERSION)"` | Current platform |
| `build-all` | Cross-compile loop | 5 targets: {windows,darwin,linux} × {amd64,arm64} |
| `test` | `go test -v ./...` | Run all tests |
| `lint` | `golangci-lint run` | Static analysis |
| `clean` | `rm -rf bin/ && go clean` | Remove artifacts |
| `install` | `go install` | Install to GOPATH/bin |
| `run` | `go run . $(ARGS)` | Development run |
| `help` | Display targets | Help text |

### Version Injection

The CLI version is injected at build time via `-ldflags`. The source of truth is the `VERSION` file at the repository root (see [Centralized Version Management](#centralized-version-management-v243)):

```bash
VERSION := $(shell cat ../../VERSION 2>/dev/null || git describe --tags --always --dirty 2>/dev/null || echo "dev")
LDFLAGS := -X main.version=$(VERSION)
```

### Dependencies

**Direct (8):**
1. `github.com/charmbracelet/bubbles v0.20.0` — Bubble Tea components
2. `github.com/charmbracelet/bubbletea v1.3.4` — TUI framework
3. `github.com/charmbracelet/harmonica v0.2.0` — Spring physics
4. `github.com/charmbracelet/lipgloss v1.1.1-pre` — Terminal styling (unreleased commit)
5. `github.com/charmbracelet/x/ansi v0.8.0` — ANSI utilities
6. `github.com/fogleman/fauxgl v0.0.0` — 3D rendering
7. `github.com/muesli/termenv v0.16.0` — Terminal environment detection
8. `github.com/spf13/cobra v1.8.1` — CLI framework

**Notable indirect:** Chroma v2 (syntax highlighting), Glamour (markdown rendering), bubblezone (mouse zones), fsnotify v1.9.0 (file watcher), clipboard, colorprofile, cellbuf

---
---

# Part III — VS Code Extension

## VS Code Extension Overview

The Prism VS Code Extension (`apps/prism-vscode/`) brings the full 4-phase workflow directly into the IDE. It provides a sidebar chat interface, tree views for research/plans/stories, Spectrum autonomous execution, an Office pixel-art visualization, a Monitor dashboard, and Workspaces management — all without leaving VS Code.

### Key Features (VS Code)

- **Sidebar chat**: Interactive Claude chat with streaming tool visualization, phase-aware system prompts
- **Spectrum execution**: Autonomous story execution with real-time progress, logs, and signal handling
- **Native tree views**: Research, Plans, and Stories tree providers in the activity bar with context menus
- **Bottom panel**: Three-view system (Monitor, Office, Workspaces) in a unified panel
- **Office visualization**: Pixel-art office with animated agent characters, furniture placement editor
- **Plugin skill routing**: Seamless bridging between SDK chat and CLI plugin skills (`/prism-research`, `/prism-plan`, etc.)
- **Workflow state machine**: Validated phase transitions (Idle → Research → Plan → Implement → Validate)
- **Status bar integration**: Workflow phase, story progress, and Spectrum status indicators
- **33 commands**: Workflow phases, Spectrum control, tree operations, Office/Monitor actions
- **7 configurable settings**: Model selection, Spectrum parameters, auto-approval options

### Extension Metadata

| Field | Value |
|-------|-------|
| Name | Prism |
| Version | 2.5.0 |
| Publisher | prism |
| Categories | AI, Programming Languages, Other |
| Min VS Code | 1.109.0 |
| Activation | `onView:prism.sidebar`, `onStartupFinished` |
| Entry Point | `./dist/extension.js` |

---

## Extension Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        VS Code Extension Host                       │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    PrismController                          │   │
│  │  (Central orchestrator — state, workflow, chat, spectrum)   │   │
│  │                                                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │   │
│  │  │ Workflow      │  │ Spectrum     │  │ Plugin/Mode    │   │   │
│  │  │ StateMachine  │  │ Engine       │  │ Bridge         │   │   │
│  │  └──────────────┘  └──────────────┘  └────────────────┘   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │   │
│  │  │ Stories      │  │ Claude       │  │ Agent          │   │   │
│  │  │ Manager      │  │ Runner       │  │ Bridge         │   │   │
│  │  └──────────────┘  └──────────────┘  └────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                          │                                         │
│          gRPC-over-postMessage (bidirectional IPC)                  │
│                          │                                         │
│    ┌─────────────────────┴─────────────────────┐                   │
│    │                     │                     │                   │
│    ▼                     ▼                     ▼                   │
│  ┌───────────┐   ┌─────────────┐   ┌──────────────────┐          │
│  │ Sidebar   │   │ Bottom      │   │ Native Tree      │          │
│  │ Webview   │   │ Panel       │   │ Views + Status   │          │
│  │ (React)   │   │ (React)     │   │ Bar              │          │
│  │           │   │             │   │                  │          │
│  │ • Chat    │   │ • Monitor   │   │ • Research tree  │          │
│  │ • Spectrum│   │ • Office    │   │ • Plans tree     │          │
│  │ • Welcome │   │ • Workspaces│   │ • Stories tree   │          │
│  └───────────┘   └─────────────┘   └──────────────────┘          │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    .prism/ Directory                         │   │
│  │  (shared with CLI — research, plans, stories, spectrum)     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Input (chat, commands, tree clicks)
    │
    ▼
┌──────────────────────────────────────────────────────────────┐
│  PrismController                                              │
│                                                                │
│  Message Router:                                               │
│    ChatService.sendMessage ──▶ ClaudeRunner / PluginBridge    │
│    WorkflowService.transition ──▶ WorkflowStateMachine        │
│    SpectrumService.start ──▶ SpectrumEngine                   │
│    PluginService.executeSkill ──▶ PluginBridge                │
│                                                                │
│  State Broadcast:                                              │
│    updateState() ──▶ all subscribers via gRPC streams          │
│                                                                │
│  Events:                                                       │
│    onDidChangeFile ──▶ Tree providers refresh                  │
│    onDidChangeState ──▶ Status bar update                      │
│    onDidStartSession ──▶ AgentBridge                           │
│    onDidUpdateStory ──▶ Stories tree refresh                   │
│    onDidEndSpectrumStory ──▶ Monitor history                   │
└──────────────────────────────────────────────────────────────┘
```

---

## Extension Source Structure

```
apps/prism-vscode/
├── package.json                          # Extension manifest, commands, views, settings
├── tsconfig.json                         # TypeScript configuration
├── esbuild.mjs                           # Build script (aliases @prism-core → ../../packages/prism-core/src)
├── jest.config.js                        # Test config (note: some collectCoverageFrom paths are stale)
├── dist/                                 # Compiled extension bundle
├── media/                                # Icons and assets
├── assets/                               # Office game assets (copied to dist/assets/ via esbuild)
│   ├── char_0.png – char_5.png          # Character sprite PNGs
│   ├── floors.png                       # Floor tile sheet
│   ├── walls.png                        # Wall tile sheet
│   ├── default-layout.json             # Default office layout
│   └── furniture/                       # 33 furniture PNGs + furniture-catalog.json
│
├── src/
│   ├── extension.ts                      # Main entry point — activation, registration
│   │
│   ├── hosts/vscode/                     # VS Code integration layer
│   │   ├── VscodeWebviewProvider.ts      # Sidebar webview provider
│   │   ├── PrismPanelProvider.ts         # Bottom panel provider (Monitor/Office/Workspaces)
│   │   └── OfficeViewProvider.ts         # Office-specific logic
│   │
│   ├── providers/                        # Native tree view providers
│   │   ├── research-tree.ts             # Research documents tree
│   │   ├── plans-tree.ts                # Plans tree with context menus
│   │   ├── stories-tree.ts              # Stories tree with color-coded status
│   │   └── workflow-status.ts           # Status bar items
│   │
│   ├── core/                             # Core business logic
│   │   ├── controller/
│   │   │   └── index.ts                 # PrismController (central orchestrator, extends BasePrismController from @prism-core)
│   │   ├── api/                         # API types and Claude SDK
│   │   ├── task/                        # Task execution subsystem (see below)
│   │   └── webview/                     # Webview provider base class
│   │
│   ├── office/                           # Office agent management (VSCode-specific)
│   │   ├── agentManager.ts             # Agent lifecycle
│   │   └── fileWatcher.ts              # JSONL file watcher for Office agent terminals (249 lines)
│   │
│   ├── prism/                            # .prism/ directory handling (VSCode-specific tests only)
│   │   └── __tests__/
│   │       ├── signals.test.ts          # Imports from @prism-core
│   │       ├── stories.test.ts
│   │       └── progress.test.ts
│   │
│   └── core/controller/prism/__tests__/
│       └── workflow.test.ts              # Workflow state machine tests (imports @prism-core)
│
│   # NOTE: The following directories moved to packages/prism-core/:
│   #   src/core/controller/prism/   → packages/prism-core/src/core/controller/prism/
│   #   src/core/prompts/            → packages/prism-core/src/core/prompts/
│   #   src/claude/                  → packages/prism-core/src/claude/
│   #   src/office/agentBridge.ts    → packages/prism-core/src/office/agentBridge.ts
│   #   src/office/assetLoader.ts    → packages/prism-core/src/office/assetLoader.ts
│   #   src/office/layoutPersistence.ts → packages/prism-core/src/office/layoutPersistence.ts
│   #   src/prism/                   → packages/prism-core/src/prism/
│   #   src/shared/                  → packages/prism-core/src/shared/
│   # All consumed via @prism-core/* path aliases.
│
├── webview-ui/                           # Sidebar React webview (thin shell)
│   ├── src/
│   │   ├── main.tsx                     # React root
│   │   ├── App.tsx                      # View switcher (imports from @prism-ui)
│   │   ├── Providers.tsx                # PrismStateContextProvider wrapper
│   │   ├── vscode.ts                    # VSCode postMessage transport adapter
│   │   ├── lib/utils.ts                # Utilities
│   │   ├── index.css
│   │   └── theme/
│   │       ├── spectral.css
│   │       └── theme.css
│   └── vite.config.ts
│
│   # NOTE: The following moved to packages/prism-ui/:
│   #   ChatView.tsx          → packages/prism-ui/src/views/ChatView.tsx
│   #   SpectrumView.tsx      → packages/prism-ui/src/views/SpectrumView.tsx
│   #   WelcomeView.tsx       → packages/prism-ui/src/components/WelcomeView.tsx
│   #   PhaseIndicator.tsx    → packages/prism-ui/src/components/workflow/PhaseIndicator.tsx
│   #   ChatRow.tsx/ToolRow.tsx → packages/prism-ui/src/components/chat/
│   #   MarkdownBlock.tsx     → packages/prism-ui/src/components/common/MarkdownBlock.tsx
│   #   SpectrumControls.tsx  → packages/prism-ui/src/components/spectrum/
│   #   StoryList.tsx         → packages/prism-ui/src/components/spectrum/StoryList.tsx
│   #   PrismStateContext.tsx → packages/prism-ui/src/context/PrismStateContext.tsx
│   #   services/grpc-client*.ts → packages/prism-ui/src/services/
│   # All consumed via @prism-ui/* path aliases.
│
├── webview-panel/                        # Bottom panel React webview
│   ├── src/
│   │   ├── MonitorView.tsx              # Quality gates, execution history
│   │   └── WorkspacesView.tsx           # Project browser, worktrees
│   └── vite.config.ts
│
│   # NOTE: Office components moved to packages/prism-ui/src/office/:
│   #   OfficeCanvas.tsx   → packages/prism-ui/src/office/components/OfficeCanvas.tsx
│   #   engine/            → packages/prism-ui/src/office/engine/
│   #   office/editor/     → packages/prism-ui/src/office/editor/
│   #   sprites/           → packages/prism-ui/src/office/sprites/
│   #   layout/            → packages/prism-ui/src/office/layout/
│
└── webview-office/                       # Standalone Office webview app (NEW)
    ├── package.json                     # React 19.2.4, Vite 6.4.1
    ├── vite.config.ts                   # Dev port 5174
    ├── tsconfig.json
    └── src/
        └── main.tsx                     # Sets up OfficeApp via @prism-ui with VSCode postMessage transport
```

### `src/core/task/` — Task Execution Subsystem

The task subsystem handles tool execution during chat sessions:

```
src/core/task/
├── index.ts              # Task module entry
├── task-state.ts         # Task state management
├── message-state.ts      # Message state management
└── tools/
    ├── coordinator.ts    # Tool coordinator
    ├── types.ts          # Tool type definitions
    └── handlers/
        ├── read-file.ts
        ├── write-file.ts
        ├── edit-file.ts
        ├── execute-command.ts
        ├── search-files.ts
        ├── list-files.ts
        ├── ask-followup.ts
        └── attempt-completion.ts
```

### Walkthroughs

The extension defines a walkthrough `prism.gettingStarted` in `package.json` with 4 steps:

| Step | Description |
|------|-------------|
| `welcome` | Welcome to Prism |
| `init-prism` | Initialize `.prism/` directory |
| `configure-claude` | Configure Claude CLI |
| `first-research` | Run your first research |

---

## Core Orchestrator — PrismController

The `PrismController` is the central hub that ties together all extension functionality.

### Responsibilities

| Area | Components | Description |
|------|-----------|-------------|
| **State** | `updateState()`, `PrismExtensionState` | Atomic state updates, broadcast to all webview subscribers via gRPC streams |
| **Workflow** | `WorkflowStateMachine` | Phase transitions with validation (Idle → Research → Plan → Implement → Validate) |
| **Stories** | `StoriesManager` | Load/save `stories.json`, resolve dependencies, track progress |
| **Chat** | `ClaudeRunner`, tool handlers | Spawn Claude CLI with `--output-format stream-json`, handle tool use recursively |
| **Spectrum** | `SpectrumEngine`, `SpectrumRunner` | Execution loop state machine, per-iteration CLI subprocess management |
| **Skills** | `ModeBridge`, `PluginBridge` | Switch between SDK chat and CLI plugin mode, route skill invocations |
| **Files** | `PrismWatcher` | Monitor `.prism/` directory for changes, fire `onDidChangeFile` events |
| **Office** | `AgentBridge` | Connect Spectrum sessions to Office agent characters |

### Extension State Model (`PrismExtensionState`)

The full state is broadcast to all webview subscribers on every update:

| Category | Fields | Description |
|----------|--------|-------------|
| **Workspace** | `hasPrismDir`, `hasStoriesJson`, `prismDir`, `storiesPath` | `.prism/` detection |
| **Workflow** | `workflowPhase`, `workflowContext` | Current phase + active document/story |
| **Stories** | `stories[]`, `plan`, `completedCount`, `remainingCount` | Story data + progress |
| **Chat** | `chatMessages[]`, `isChatStreaming`, `hasActiveTask`, `pendingApprovalToolUseId` | Conversation state |
| **CLI** | `chatMode` (`sdk`/`plugin`), `activePluginSkill`, `hasClaudeCli` | CLI bridge state |
| **Spectrum** | `executionState`, `currentIteration`, `currentStoryId`, `progress`, `elapsedMs`, `consecutiveErrors`, `lastSignalType`, `recentActivities[]`, `logs[]` | Full execution state |
| **Office** | `office.enabled`, `office.agentCount`, `office.activeAgents[]` | Agent tracking |
| **Config** | `defaultModel`, `planningModel` | Model selections |

### Events

| Event | Trigger | Consumers |
|-------|---------|-----------|
| `onDidChangeFile` | `.prism/` file added/changed/deleted | Tree providers |
| `onDidChangeState` | Any state update | Status bar, webviews |
| `onDidStartSession` | Claude session begins | AgentBridge |
| `onDidUpdateStory` | Story status changes | Stories tree |
| `onDidEndSpectrumStory` | Story iteration completes | Monitor history |

---

## IPC Architecture — gRPC-over-postMessage

Communication between the extension host and webviews uses a gRPC-inspired protocol over VS Code's `postMessage` API.

### Pattern

1. Extension host defines gRPC service interfaces
2. Webview sends binary-like requests via `postMessage`
3. Host responds with serialized state objects
4. Streaming RPCs push state updates on every `updateState()` call

### Services

| Service | Methods | Type | Description |
|---------|---------|------|-------------|
| **StateService** | `subscribeToState()` | Streaming | Push state on init + every update |
| | `getState()` | Unary | Get current state once |
| **UiService** | `initializeWebview()` | Unary | Called on webview mount |
| | `initPrism()` | Unary | Initialize `.prism/` from UI |
| **WorkflowService** | `transition()` | Unary | Attempt phase change |
| | `getAvailableTransitions()` | Unary | List allowed next phases |
| **ChatService** | `sendMessage()` | Unary | Send user text, start streaming |
| | `abortTask()` | Unary | Stop active chat/plugin |
| | `clearMessages()` | Unary | Reset chat history |
| | `approveToolUse()` | Unary | Approve pending tool use |
| | `setApiKey()` | Unary | No-op (using CLI) |
| **PluginService** | `executeSkill()` | Unary | Run Prism plugin skill via CLI |
| **SpectrumService** | `start()` | Unary | Begin autonomous execution |
| | `pause()` / `resume()` | Unary | Pause/resume loop |
| | `stop()` | Unary | Halt execution |
| | `skipStory()` | Unary | Skip current story |
| | `reset()` | Unary | Reset Spectrum state |
| **TaskService** | `readFile()`, `writeFile()`, `editFile()` | Unary | File operations during chat |
| | `executeCommand()`, `searchFiles()`, `listFiles()` | Unary | Tool operations |
| | `askFollowup()`, `attemptCompletion()` | Unary | Task lifecycle |

---

## Sidebar Webview

Built with React 18 + Vite + Tailwind CSS. Provides the primary interaction surface in the activity bar.

### Views

| View | Component | Description |
|------|-----------|-------------|
| **Chat** | `ChatView.tsx` | Streaming Claude chat with phase-aware system prompts, tool visualization, markdown rendering |
| **Spectrum** | `SpectrumView.tsx` | Real-time dashboard with story progress, activity feed, logs, start/pause/stop controls |
| **Welcome** | `WelcomeView.tsx` | First-time onboarding when `.prism/` is not detected |

### Chat View Features

- Streaming assistant responses with typing indicator
- Tool call visualization (Read, Edit, Write, Bash, Glob, Grep, etc.)
- Phase indicator with spectral glow effect
- Markdown rendering with syntax highlighting
- Tool approval flow for pending permissions
- Automatic skill detection in user messages (routes to CLI)

### Spectrum View Features

- Story list with color-coded status badges (complete/active/pending/blocked)
- Progress bar with percentage
- Real-time activity feed (last 50 tool calls)
- Log output (last 200 entries)
- Start/Pause/Resume/Stop controls
- Iteration counter and elapsed time

---

## Bottom Panel Webview

A unified React webview hosting three views in the bottom panel area.

### Monitor View (`MonitorView.tsx`)

| Feature | Description |
|---------|-------------|
| Quality Gates | Display gate status (pass/fail/pending/running), run individual or all gates |
| Execution History | Chronological list of story executions with duration, result, timestamp |
| Gate Results | Detailed output for each quality gate run |

### Office View (`OfficeApp.tsx`)

A pixel-art office visualization showing AI agent characters at work:

| Feature | Description |
|---------|-------------|
| Canvas rendering | 2D Canvas with game loop for smooth animation |
| Agent characters | Animated sprites representing active Claude sessions |
| Furniture placement | Editable layout with desk, chair, and equipment tiles |
| Agent status | Status icons (active, thinking, waiting, paused) synced with Spectrum |
| Layout persistence | Serialized to disk for cross-session consistency |

### Workspaces View (`WorkspacesView.tsx`)

| Feature | Description |
|---------|-------------|
| Project browser | Scan for `.prism/` directories in sibling folders |
| Branch detection | Show current git branch per project |
| Worktree management | Create/delete git worktrees |
| Epic tracking | Stories grouped by epic folder |

---

## Native Tree Views & Status Bar

### Research Tree (`research-tree.ts`)

- Lists `.prism/shared/research/` markdown files
- Shows date, topic name parsed from filename
- Context menu: Open, Delete, Refresh
- Auto-refreshes on `onDidChangeFile` events

### Plans Tree (`plans-tree.ts`)

- Lists `.prism/shared/plans/` markdown files
- Context menu: Open, Decompose to stories, Implement, Delete, Refresh
- Decompose action generates `.prism/stories/<name>/stories.json`

### Stories Tree (`stories-tree.ts`)

- Displays `stories.json` entries with color-coded status icons
- Expandable items show individual steps with done/pending markers
- Context menu: Execute story, Mark complete, Refresh
- Status colors match CLI conventions (green=complete, purple=active, gray=pending, amber=blocked)

### Status Bar Items

| Item | Position | Content |
|------|----------|---------|
| Workflow Phase | Left | Current phase with color-coded icon |
| Story Progress | Left | `N/M stories` completion counter |
| Spectrum Status | Right | Running/Paused/Complete indicator |

---

## Commands & Keybindings

### Workflow Phase Commands

| Command | Keybinding | Description |
|---------|------------|-------------|
| `prism.research` | `Ctrl+Shift+R` | Start Research phase |
| `prism.plan` | `Ctrl+Shift+Alt+P` | Start Plan phase |
| `prism.implement` | `Ctrl+Shift+I` | Start Implement phase |
| `prism.validate` | `Ctrl+Shift+V` | Start Validate phase |

### Spectrum Execution Commands

| Command | Keybinding | Description |
|---------|------------|-------------|
| `prism.spectrum.start` | `Ctrl+Shift+S` | Begin autonomous execution |
| `prism.spectrum.pause` | — | Pause execution |
| `prism.spectrum.stop` | — | Stop execution |

### Initialization & Navigation

| Command | Description |
|---------|-------------|
| `prism.openSidebar` | Focus Prism sidebar |
| `prism.initPrism` | Initialize `.prism/` directory structure |

### Plugin Skill Commands

| Command | Skill | Description |
|---------|-------|-------------|
| `prism.commit` | `/commit` | Create a Prism commit |
| `prism.decompose` | `/decompose_plan` | Convert plan to stories.json |
| `prism.handoff` | `/create_handoff` | Create session handoff document |
| `prism.describePR` | `/describe_pr` | Generate PR description |

### Research Tree Commands

| Command | Description |
|---------|-------------|
| `prism.research.open` | Open research document |
| `prism.research.delete` | Delete research document |
| `prism.research.refresh` | Refresh research list |

### Plans Tree Commands

| Command | Description |
|---------|-------------|
| `prism.plans.open` | Open plan document |
| `prism.plans.decompose` | Decompose plan to stories |
| `prism.plans.implement` | Implement from plan |
| `prism.plans.delete` | Delete plan |
| `prism.plans.refresh` | Refresh plans list |

### Stories Tree Commands

| Command | Description |
|---------|-------------|
| `prism.stories.execute` | Run specific story |
| `prism.stories.markComplete` | Mark story as complete |
| `prism.stories.refresh` | Refresh stories list |

### Office & Monitor Commands

| Command | Description |
|---------|-------------|
| `prism.office.show` | Show Office view |
| `prism.office.launchAgent` | Launch new agent terminal |
| `prism.office.exportLayout` | Export office layout |
| `prism.monitor.runGate` | Run single quality gate |
| `prism.monitor.runAllGates` | Run all quality gates |

### Workspaces Commands

| Command | Description |
|---------|-------------|
| `prism.workspaces.openProject` | Open project folder |
| `prism.workspaces.newWorktree` | Create git worktree |
| `prism.workspaces.deleteWorktree` | Delete worktree |

---

## Extension Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `prism.defaultModel` | enum | `"sonnet"` | Claude model for implementation work |
| `prism.planningModel` | enum | `"opus"` | Claude model for research/planning |
| `prism.spectrum.maxIterations` | number | `50` | Max iterations before stopping |
| `prism.spectrum.pauseSeconds` | number | `2` | Pause between iterations (seconds) |
| `prism.autoApprove.readFile` | boolean | `true` | Auto-approve file reads |
| `prism.autoApprove.listFiles` | boolean | `true` | Auto-approve directory listing |
| `prism.autoApprove.searchFiles` | boolean | `true` | Auto-approve file searches |

---

## Workflow State Machine (VS Code)

The extension implements the same 4-phase workflow as the CLI, with validated transitions:

```
              ┌──────────────────────────────────────┐
              │                                      │
              │    ┌──────┐                          │
              │    │ IDLE │                          │
              │    └──┬───┘                          │
              │       │                              │
              │  ┌────┴─────┬──────────┬──────────┐  │
              │  ▼          ▼          ▼          ▼  │
              │ Research → Plan → Implement → Validate
              │  │          │          │          │  │
              │  └──────────┴──────────┴──────────┘  │
              │       (any phase can return to Idle)  │
              └──────────────────────────────────────┘
```

Each phase transition is validated by the `WorkflowStateMachine`. The active phase determines:
- System prompts sent to Claude
- Status bar indicator color
- Available actions in the sidebar

---

## Spectrum Execution (VS Code)

The VS Code extension runs Spectrum through the same signal protocol as the CLI.

### Execution States

| State | Description |
|-------|-------------|
| `idle` | Waiting to start |
| `running` | Claude CLI active, processing stories |
| `paused` | Execution paused by user |
| `complete` | All stories finished |
| `maxIterations` | Iteration limit reached |
| `error` | Fatal error, cannot continue |

### SpectrumEngine

Manages the execution loop state machine. On each iteration:

1. Check max iterations — exceeded? → `maxIterations` state
2. Select next story via `StoriesManager.getNextStory()`
3. Spawn Claude CLI via `SpectrumRunner`
4. Stream output, parse tools and signals
5. Handle signal: Continue → pause, then next iteration; Complete → check remaining; Error → stop
6. Update stories.json on disk

### SpectrumRunner

Per-iteration CLI subprocess manager:
- Spawns `claude` with `--dangerously-skip-permissions --print --output-format stream-json`
- Streams stdout/stderr through output parser
- Detects signals (`<spectrum-continue>`, `<spectrum-retry>`, `<spectrum-blocked>`, `<spectrum-error>`, `<promise>COMPLETE</promise>`)
- Fires events: `recentActivities[]`, `logs[]`, signal detection

---

## Plugin Skill Integration

### ModeBridge

Detects when user messages reference Prism plugin skills and switches from SDK chat mode to CLI plugin mode:

| Chat Mode | Description |
|-----------|-------------|
| `sdk` | Direct Claude Agent SDK chat (default) |
| `plugin` | CLI-based skill execution (auto-detected or manual) |

### PluginBridge

Routes skill invocations to the Claude CLI:

| Skill Name | CLI Command |
|------------|-------------|
| `prism-research` | `/prism-research` |
| `prism-plan` | `/prism-plan` |
| `prism-implement` | `/prism-implement` |
| `prism-validate` | `/prism-validate` |
| `commit` | `/commit` |
| `decompose_plan` | `/decompose_plan` |
| `create_handoff` | `/create_handoff` |
| `describe_pr` | `/describe_pr` |

### Skill Detection Flow

```
User types message in chat
    │
    ▼
ModeBridge.detectSkillTrigger(message)
    │
    ├── No match → SDK chat mode (Claude Agent SDK)
    │
    └── Match found → Switch to plugin mode
        │
        ▼
    PluginBridge.executeSkill(skillName)
        │
        ▼
    ClaudeRunner.spawn("claude ... /skill-name")
        │
        ▼
    OutputParser → stream tools + signals to UI
```

---

## Office Visualization

The Office view provides a pixel-art visualization of AI agents working in a virtual office.

### Components

| Component | File | Description |
|-----------|------|-------------|
| Office Canvas | `OfficeCanvas.tsx` | Main 2D Canvas renderer with game loop |
| Engine | `engine/` | Game loop tick, character animation, matrix effects |
| Sprites | `sprites/` | Character sprite sheets, PNG decoding, animation frames |
| Layout | `layout/` | Furniture catalog, tile mapping, serialization |
| Editor | `office/editor/` | Interactive furniture placement editor |

### Agent States

| State | Icon | Description |
|-------|------|-------------|
| Active | `●` | Currently executing tool calls |
| Thinking | `◉` | Claude is generating response |
| Waiting | `○` | Idle, waiting for next task |
| Paused | `⏸` | Execution paused |

### Agent Lifecycle

1. Spectrum starts a story iteration → `AgentBridge` creates agent
2. Agent character appears in Office at assigned desk
3. Agent status updates in real-time as tools execute
4. Story completes → agent transitions to "done" state
5. Next iteration → new agent or reuse existing

---

## Extension Technology Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Prism VS Code Extension v2.4.9                          │
├──────────────┬──────────────┬──────────────┬───────────────┬────────────────┤
│  Extension   │  Sidebar     │  Bottom      │  Office       │  Build         │
│  Host        │  Webview     │  Panel       │  Webview      │  Tools         │
├──────────────┼──────────────┼──────────────┼───────────────┼────────────────┤
│ TypeScript   │ React 18     │ React 18     │ React 19.2.4  │ esbuild        │
│ VS Code API  │ Vite 6.4.1   │ Vite 6.4.1   │ Vite 6.4.1    │ TypeScript     │
│ Node.js      │ Tailwind v4  │ Tailwind v4  │ Tailwind v4   │ Jest           │
│ Anthropic SDK│ React        │ Canvas 2D    │ Port 5174     │ VS Code Test   │
│              │  Virtuoso    │ PNG.js       │               │  CLI           │
│              │ React        │              │               │                │
│              │  Markdown    │              │               │                │
├──────────────┴──────────────┴──────────────┴───────────────┴────────────────┤
│  @prism-core/* (packages/prism-core) │ @prism-ui/* (packages/prism-ui)      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Claude CLI (child process — shared with Prism CLI)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  .prism/ Directory (shared — research, plans, stories, spectrum)            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Activation Flow (`extension.ts`)

1. Create `VscodeWebviewProvider` → instantiates `PrismController`
2. Register tree view providers (Research, Plans, Stories)
3. Register status bar items
4. Register sidebar webview provider
5. Create `PrismPanelProvider` → register bottom panel webview
6. Register 40+ commands with handlers
7. Subscribe to file watcher changes → refresh trees
8. Subscribe to state changes → update UI

### CLI ↔ Extension ↔ Electron Feature Parity

| Feature | CLI Dashboard | VS Code Extension | Electron Desktop App |
|---------|--------------|-------------------|---------------------|
| 4-Phase Workflow | Tab-based navigation | Commands + sidebar chat | Chat-driven + native menu |
| Research Browser | Two-mode file viewer | Native tree view + markdown preview | Research discovery via `prism:getResearch` IPC |
| Plans Browser | Two-mode file viewer + decompose | Native tree view + context menu | Plans discovery via `prism:getPlans` IPC |
| Stories View | Paginated list in Spectrum | Native tree view with expandable steps | Shared React component + `StoriesPanel` |
| Spectrum Execution | Full-screen dashboard | Sidebar + bottom panel | Full React dashboard + `SpectrumPanel` |
| Chat / Agent | Compact TUI chat | Full chat with streaming markdown | Shared ChatView (streaming) |
| Git Integration | Two-pane staging + diff | Delegates to VS Code's built-in git | `GitPanel` + `GitGraphView` via `prism:gitStatus`/`prism:gitLog`/`prism:gitBranchInfo` IPC |
| File Browser | Two-pane with tabs + edit + blame | Delegates to VS Code's file explorer | `FilesPanel` + `FileContentView` via `prism:fileTree`/`prism:readFile` IPC |
| Monitor | Three-panel health dashboard | Bottom panel quality gates + history | `MonitorPanel` with `prism:executeGate`/`prism:cancelGate` IPC |
| Workspaces | Projects + worktrees + kanban | Bottom panel project browser | `WorkspacePanel` via `prism:discoverProjects`/`prism:listWorktrees`/`prism:createWorktree` IPC |
| Office | — | Pixel-art agent visualization | Full office subsystem (`ElectronAgentManager`, `ElectronOfficeProvider`, `electronOfficeTransport`) |
| Splash / 3D | Procedural 3D animation | — | — |
| Spring Animations | Harmonica physics | CSS transitions | CSS transitions |
| Window State | — | VS Code manages | Custom persistence (JSON) |
| CLI Arg Launch | `prism-cli path` | — | `prism-electron path` |
| Native Menu | — | VS Code menus | File → Open Project, Edit, View, Window |

---

# Part IV — Electron Desktop App

The Prism Electron app is a standalone desktop application that runs the same React UI and business logic as the VS Code extension, but independent of any IDE. It uses Electron's IPC model as the transport layer instead of VS Code's `postMessage`, and replaces all VS Code API dependencies with pure Node.js equivalents.

## Electron App Overview

The Electron app was built by wiring the existing platform-agnostic prism-vscode core + React UI into Electron's IPC model, then replacing the 8 VS Code-coupled files with Electron equivalents.

### What's Shared (from prism-vscode / packages)

- All business logic: workflow state machine, spectrum engine, stories manager, signal parser (via `@prism-core`)
- All Claude CLI integration: runner, parser, events (via `@prism-core`)
- All React UI components: ChatView, SpectrumView, WelcomeView, MarkdownBlock, and all sub-components (via `@prism-ui`)
- Office canvas engine: sprites, game loop, layout serialization, character FSM (via `@prism-ui`)
- The complete gRPC-over-postMessage protocol (unchanged)
- Service clients: StateService, ChatService, WorkflowService, PluginService, SpectrumService (via `@prism-ui`)

### What Differs (platform shell)

| Concern | VS Code | Electron |
|---------|---------|----------|
| IPC transport | `webview.postMessage` / `onDidReceiveMessage` | `ipcMain.handle()` / `ipcRenderer.invoke()` |
| Workspace detection | `vscode.workspace.workspaceFolders` | `dialog.showOpenDialog` + stored project dir |
| File watching | `vscode.FileSystemWatcher` | `chokidar` |
| File I/O | `vscode.workspace.fs.stat()` | Node.js `fs/promises` |
| Config storage | VS Code settings API | Plain JSON file in `app.getPath('userData')` |
| Event system | `vscode.EventEmitter` | Node.js `EventEmitter` |
| Context keys | `vscode.commands.executeCommand('setContext', ...)` | Not applicable (no-op) |

### Key Features (Electron)

- **V2 IDE shell** with ActivityBar, ContentRail, TabBar, BottomPanel, and BottomStatusBar
- Full Prism chat interface with streaming Claude CLI responses (pinned chat tab)
- Spectrum autonomous execution dashboard with real-time story updates
- **6 activity panels**: Files, Stories, Git (left rail); Monitor, Spectrum, Workspaces (right rail)
- **Tab-based editor**: StoryDetailView, FileContentView, GitGraphView with pinned chat
- **FloatingChatPill**: Pulsing gradient pill for quick access when not on chat tab
- Native OS menu bar (File → Open Project, standard Edit/View/Window)
- Window state persistence (bounds, last project directory) + layout state persistence
- CLI argument support: `prism-electron /path/to/project`
- Context-isolated renderer with Electron Fuses security hardening
- Distributable installers via Electron Forge (Squirrel Windows, ZIP macOS, deb/rpm Linux)

### Technology Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Prism Electron v2.4.9                            │
├──────────────┬──────────────┬──────────────┬────────────────────────┤
│  Electron 40 │ React 19.2.4 │   Vite 6.0   │   Tailwind CSS 4.2    │
│  (Chromium)  │   (UI)       │   (Build)    │   (Styling)           │
├──────────────┴──────────────┴──────────────┴────────────────────────┤
│  @prism-core/* — Shared business logic from packages/prism-core    │
│  @prism-ui/*  — Shared React components from packages/prism-ui     │
├─────────────────────────────────────────────────────────────────────┤
│  chokidar (file watching) │ uuid (request IDs) │ electron-forge     │
├─────────────────────────────────────────────────────────────────────┤
│  TypeScript 5.4.5 │ ESLint │ Prettier                              │
└─────────────────────────────────────────────────────────────────────┘
```

> **Note**: The root `package.json` declares React 19, but `webview-ui/package.json` pins React 18.3.1.

---

## Electron Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Electron Main Process                       │
│                                                                     │
│  ┌─────────────┐    ┌──────────────────────────────────────────┐   │
│  │   main.ts   │───▶│         ElectronIPCBridge                │   │
│  │  (window +  │    │  ┌────────────────────────────────────┐  │   │
│  │   menu +    │    │  │    ElectronPrismController         │  │   │
│  │   lifecycle)│    │  │                                    │  │   │
│  └─────────────┘    │  │  WorkflowStateMachine              │  │   │
│                     │  │  StoriesManager                    │  │   │
│  ┌─────────────┐    │  │  PrismWatcher (chokidar)           │  │   │
│  │ preload.ts  │    │  │  ClaudeRunner                      │  │   │
│  │ (context    │    │  │  ModeBridge                         │  │   │
│  │  bridge)    │    │  │  SpectrumEngine + SpectrumRunner    │  │   │
│  └──────┬──────┘    │  └────────────────────────────────────┘  │   │
│         │           └──────────────────────────────────────────┘   │
│         │                          │                                │
│─────────┼──────────────────────────┼────────────────────────────────│
│         │    contextBridge         │  ipcMain ↕ ipcRenderer        │
│─────────┼──────────────────────────┼────────────────────────────────│
│         ▼                          ▼                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Renderer Process (React SPA)              │   │
│  │                                                             │   │
│  │  ┌──────────┐   ┌───────────────┐   ┌──────────────────┐   │   │
│  │  │electron.ts│──▶│grpc-client-   │──▶│  PrismState      │   │   │
│  │  │(transport)│   │base.ts        │   │  Context         │   │   │
│  │  └──────────┘   └───────────────┘   └────────┬─────────┘   │   │
│  │                                               │             │   │
│  │  ┌────────────────────────────────────────────┴──────────┐  │   │
│  │  │        React Component Tree (V2 IDE Shell)             │  │   │
│  │  │  AppShell → ActivityBar + ContentRail + TabBar +      │  │   │
│  │  │  Center (ChatView|StoryDetail|FileContent|GitGraph)   │  │   │
│  │  │  + BottomPanel + StatusBar + FloatingChatPill         │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User types message in ChatView
         │
         ▼
ChatServiceClient.sendMessage(text)    [webview-ui/src/services/grpc-client.ts]
         │
         ▼
ProtoBusClient.makeUnaryRequest()      [webview-ui/src/services/grpc-client-base.ts]
         │  Generate UUID4 request_id
         │  Post via electronApi.postMessage()
         ▼
window.electronAPI.invoke('grpc_request', payload)    [webview-ui/src/electron.ts]
         │
    ═══════════════  IPC boundary (contextBridge)  ═══════════════
         │
         ▼
ipcMain.handle('grpc_request')         [src/hosts/electron/ElectronIPCBridge.ts]
         │
         ▼
handleGrpcRequest() → route to handler [src/hosts/electron/ElectronPrismController.ts]
         │  'ChatService.sendMessage' handler
         ▼
ClaudeRunner.runStreaming()             [@prism-core/claude/runner.ts]
         │  Spawns claude CLI process
         │  Streams text + tool events
         ▼
controller.updateState() → _broadcastState()
         │
         ▼
mainWindow.webContents.send('grpc_response', msg)
         │
    ═══════════════  IPC boundary (contextBridge)  ═══════════════
         │
         ▼
window.electronAPI.on('grpc_response') [webview-ui/src/electron.ts]
         │  Re-dispatch as window MessageEvent
         ▼
grpc-client-base.ts listener           [matching request_id]
         │
         ▼
PrismStateContext re-renders → ChatView updates
```

---

## Electron Source Structure

```
apps/prism-electron/
├── src/                               # Main process (Node.js + TypeScript)
│   ├── main.ts                        # App lifecycle, window, menu, CLI args (111 lines)
│   ├── preload.ts                     # contextBridge: electronAPI + office IPC (62 lines)
│   ├── window-state.ts                # Window bounds + lastProjectDir persistence (58 lines)
│   ├── renderer.tsx                   # Renderer entry (minimal, unused — webview-ui is root)
│   ├── App.tsx                        # Placeholder (webview-ui/src/App.tsx is real app)
│   │
│   ├── hosts/electron/                # Platform shell (mirrors hosts/vscode/)
│   │   ├── ElectronIPCBridge.ts      # ipcMain handler registration + controller wiring (511 lines)
│   │   └── ElectronPrismController.ts # VSCode-free controller (thin — extends BasePrismController, 45 lines)
│   │
│   ├── auth/                          # Authentication (NEW)
│   │   └── ElectronSecretStorage.ts  # SecretStore via Electron safeStorage API (102 lines)
│   │
│   ├── office/                        # Office subsystem (NEW — 692 lines combined)
│   │   ├── ElectronAgentManager.ts   # Spawns Claude CLI, watches JSONL transcripts (386 lines)
│   │   └── ElectronOfficeProvider.ts # Orchestrates office: assets, agents, messages, layout (306 lines)
│   │
│   └── prism/                         # Electron-specific Prism domain modules
│       │   # NOTE: config.ts (79 lines), watcher.ts (72 lines), init.ts (50 lines)
│       │   # have moved to packages/prism-core/src/prism/ and are consumed via @prism-core/*.
│       │   # This directory may be empty or contain thin wrappers.
│
├── webview-ui/                        # React SPA (separate Vite build root, dev port 5174)
│   ├── src/
│   │   ├── main.tsx                   # React root entry
│   │   ├── App.tsx                    # Top-level IDE shell (AppShell + view switcher)
│   │   ├── Providers.tsx              # PrismStateContextProvider
│   │   ├── electron.ts               # Transport adapter (replaces vscode.ts)
│   │   │
│   │   ├── services/                  # gRPC clients (imported from @prism-ui or local)
│   │   │   ├── grpc-client-base.ts
│   │   │   └── grpc-client.ts
│   │   │
│   │   ├── context/
│   │   │   ├── PrismStateContext.tsx  # Global state (hydrated from main process)
│   │   │   └── LayoutContext.tsx      # IDE shell layout state management (233 lines, NEW)
│   │   │
│   │   ├── views/                     # View components (NEW)
│   │   │   ├── FileContentView.tsx   # File content viewer with syntax highlighting (215 lines)
│   │   │   ├── GitGraphView.tsx      # Visual git commit graph (309 lines)
│   │   │   └── StoryDetailView.tsx   # Story details with progress bars + file lists (291 lines)
│   │   │
│   │   ├── components/
│   │   │   ├── layout/               # IDE shell layout components (NEW — 8 files)
│   │   │   │   ├── ActivityBar.tsx   # Vertical icon bar, left rail (200 lines)
│   │   │   │   ├── AppShell.tsx      # Top-level IDE layout shell (178 lines)
│   │   │   │   ├── BottomPanel.tsx   # Collapsible bottom panel area (211 lines)
│   │   │   │   ├── BottomStatusBar.tsx # Status bar at bottom (101 lines)
│   │   │   │   ├── ContentRail.tsx   # Content panel for tree views (138 lines)
│   │   │   │   ├── FloatingChatPill.tsx # Floating chat trigger button (63 lines)
│   │   │   │   ├── HeaderBar.tsx     # Top header with phase buttons (392 lines)
│   │   │   │   └── TabBar.tsx        # Tab bar for editor area (164 lines)
│   │   │   │
│   │   │   ├── panels/               # Panel components (NEW — 6 files)
│   │   │   │   ├── FilesPanel.tsx    # File tree panel
│   │   │   │   ├── GitPanel.tsx      # Git status panel
│   │   │   │   ├── MonitorPanel.tsx  # Quality gates panel
│   │   │   │   ├── SpectrumPanel.tsx # Spectrum execution panel
│   │   │   │   ├── StoriesPanel.tsx  # Stories list panel
│   │   │   │   └── WorkspacePanel.tsx # Workspace management panel
│   │   │   │
│   │   │   ├── chat/                  # ChatRow, ChatTextArea, ToolRow (via @prism-ui)
│   │   │   ├── spectrum/             # ActivityLog, ProgressBar, StoryList, Controls (via @prism-ui)
│   │   │   ├── workflow/             # PhaseIndicator (via @prism-ui)
│   │   │   └── common/               # MarkdownBlock, shared UI (via @prism-ui)
│   │   │
│   │   ├── office/                    # Office transport (NEW)
│   │   │   └── electronOfficeTransport.ts  # Wires canvas office to Electron IPC (36 lines)
│   │   │
│   │   ├── lib/                       # Utilities (cn, formatters)
│   │   └── theme/                     # theme.css (--prism-* vars), spectral.css
│   │
│   ├── package.json                   # React SPA dependencies
│   ├── vite.config.ts                 # Vite SPA config (port 5174, @prism-ui alias)
│   └── tsconfig.json                  # React/JSX TypeScript config (@prism-ui/* alias)
│
├── package.json                       # Main app dependencies + scripts
├── forge.config.ts                    # Electron Forge config (extraResource: ['../prism-vscode/assets'])
├── tsconfig.json                      # Main process config (paths: @prism-core/* dual fallback)
├── vite.main.config.mts               # Vite config for main process (prismCoreAliasPlugin)
├── vite.preload.config.mts            # Vite config for preload script
└── vite.renderer.config.mts           # Vite config for renderer (root: webview-ui/, @prism-ui alias)
```

### Import Strategy

The Electron app imports shared business logic using TypeScript path aliases with a **dual-path fallback** — it checks `packages/prism-core/src` first, then falls back to `../prism-vscode/src`:

```json
// tsconfig.json
{
  "paths": {
    "@prism-core/*": ["../../packages/prism-core/src/*", "../prism-vscode/src/*"]
  }
}
```

```typescript
// vite.main.config.mts — custom plugin with dual resolution
function prismCoreAliasPlugin() {
  // Checks packages/prism-core/src first, falls back to ../prism-vscode/src
}
```

Additionally, a **`@prism-ui/*` alias** provides access to shared React components:

```json
// webview-ui/tsconfig.json
{
  "paths": {
    "@prism-ui/*": ["../../../packages/prism-ui/src/*"]
  }
}
```

Both `webview-ui/vite.config.ts` and `vite.renderer.config.mts` set up the same `@prism-ui` alias. This means both apps remain independently buildable while sharing all platform-agnostic code.

---

## Main Process & Window Management

### `src/main.ts`

The main process handles Electron app lifecycle, window creation, native menus, and CLI argument handling.

#### Bootstrap Flow

1. Check for Squirrel Windows installer events (`electron-squirrel-startup`)
2. Load saved window state from `prism-window-state.json`
3. Create `BrowserWindow` with saved bounds (fallback: 1200×800)
4. Wire `ElectronIPCBridge` to the window
5. Load initial project from CLI argument or last saved project dir
6. Set native application menu
7. Load renderer (Vite dev server URL or packaged HTML)

#### Window Configuration

```typescript
const mainWindow = new BrowserWindow({
  width: savedState?.width ?? 1200,
  height: savedState?.height ?? 800,
  x: savedState?.x,
  y: savedState?.y,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,    // Security: renderer can't access Node.js
    nodeIntegration: false,    // Security: no require() in renderer
  },
});
```

#### Native Menu

```
File
├── Open Project…    (CmdOrCtrl+O)  →  bridge.openProject()
├── ─────────────
└── Quit             (CmdOrCtrl+Q)  →  app.quit()

Edit     →  Standard editMenu role (cut/copy/paste/undo/redo)
View     →  Standard viewMenu role (reload/devtools/zoom)
Window   →  Standard windowMenu role (minimize/close)
```

#### CLI Argument Support

```bash
# Open project directly
prism-electron /path/to/project

# Packaged: args start at argv[1]
# Dev mode: args start at argv[2] (after electron + entry script)
```

The first valid filesystem path in `argv` is treated as the initial project directory. Falls back to `lastProjectDir` from saved state.

#### Window Lifecycle

- `close` event: Save window bounds + current project dir to `prism-window-state.json`
- `closed` event: Dispose `ElectronIPCBridge` (terminates Claude processes)
- `window-all-closed`: Quit on Windows/Linux; stay open on macOS (Darwin convention)
- `activate`: Recreate window on macOS dock click when no windows exist

#### DevTools

```typescript
if (!app.isPackaged) {
  mainWindow.webContents.openDevTools();
}
```

DevTools only open in development mode. Production builds suppress them.

---

## Preload & Context Bridge

### `src/preload.ts`

The preload script runs in a privileged context between main and renderer. It exposes a minimal, safe API via `contextBridge`:

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  send:   (channel: string, data: unknown) => ipcRenderer.send(channel, data),
  on:     (channel: string, cb: (data: unknown) => void) => {
    const wrapped = (_: Electron.IpcRendererEvent, data: unknown) => cb(data);
    ipcRenderer.on(channel, wrapped);
    return () => ipcRenderer.removeListener(channel, wrapped);
  },
  invoke: (channel: string, data?: unknown) => ipcRenderer.invoke(channel, data),
});
```

#### API Surface

| Method | Pattern | Usage |
|--------|---------|-------|
| `send(channel, data)` | Fire-and-forget | Rarely used in Prism |
| `on(channel, callback)` | Listen for events | `grpc_response` stream from main |
| `invoke(channel, data)` | Request-response | `grpc_request`, `prism:openProject`, `shell:openExternal`, etc. |
| `officeMessage(callback)` | Listen for events | Subscribe to office messages from main process |
| `officeAction(msg)` | Fire-and-forget | Send office actions to main process |

#### Type Declaration

```typescript
declare global {
  interface Window {
    electronAPI: {
      send: (channel: string, data: unknown) => void;
      on: (channel: string, cb: (data: unknown) => void) => () => void;
      invoke: (channel: string, data?: unknown) => Promise<unknown>;
      officeMessage: (callback: (data: unknown) => void) => () => void;
      officeAction: (msg: unknown) => void;
    };
  }
}
```

---

## IPC Bridge — Electron Transport

### `src/hosts/electron/ElectronIPCBridge.ts`

The IPC Bridge does what `VscodeWebviewProvider.ts` does in the VS Code extension: instantiates the controller, registers IPC handlers, and wires bidirectional communication.

#### Registered IPC Handlers

**Core handlers:**

| Channel | Method | Purpose |
|---------|--------|---------|
| `grpc_request` | `handle` | Routes gRPC requests to `handleGrpcRequest()` → controller handlers |
| `grpc_request_cancel` | `handle` | Removes streaming subscriber by `request_id` |
| `prism:openProject` | `handle` | Opens native folder picker → `setProjectDir()` |
| `shell:openExternal` | `handle` | Opens external URLs in system browser |

**File and Git handlers:**

| Channel | Method | Purpose |
|---------|--------|---------|
| `prism:readFile` | `handle` | Read file content (with path traversal protection) |
| `prism:fileTree` | `handle` | Recursive file tree (depth-limited) |
| `prism:gitStatus` | `handle` | Git status via child_process |
| `prism:gitLog` | `handle` | Git log with formatted output |
| `prism:gitBranchInfo` | `handle` | Branch + ahead/behind info |

**Workspace and project handlers:**

| Channel | Method | Purpose |
|---------|--------|---------|
| `prism:discoverProjects` | `handle` | Workspace discovery (50-entry cap) |
| `prism:addWorkspace` | `handle` | Add workspace directory |
| `prism:browseAndAddWorkspace` | `handle` | Browse + add workspace |
| `prism:switchProject` | `handle` | Switch active project directory |
| `prism:listWorktrees` | `handle` | List git worktrees |
| `prism:createWorktree` | `handle` | Create git worktree |
| `prism:deleteWorktree` | `handle` | Delete git worktree |

**Quality gate handlers:**

| Channel | Method | Purpose |
|---------|--------|---------|
| `prism:executeGate` | `handle` | Quality gate execution with AbortController |
| `prism:cancelGate` | `handle` | Cancel running quality gate |

**Research and plans handlers:**

| Channel | Method | Purpose |
|---------|--------|---------|
| `prism:getResearch` | `handle` | Research file discovery |
| `prism:getPlans` | `handle` | Plans file discovery |

**API key management handlers:**

| Channel | Method | Purpose |
|---------|--------|---------|
| `prism:getApiKey` | `handle` | Retrieve stored API key |
| `prism:setApiKey` | `handle` | Store API key (via ElectronSecretStorage) |
| `prism:deleteApiKey` | `handle` | Remove stored API key |
| `prism:validateApiKey` | `handle` | Validate API key with Anthropic |

**Layout persistence handlers:**

| Channel | Method | Purpose |
|---------|--------|---------|
| `prism:saveLayoutState` | `handle` | Persist IDE layout state |
| `prism:loadLayoutState` | `handle` | Restore IDE layout state |

#### Bidirectional Communication

```
Renderer → Main:  ipcRenderer.invoke('grpc_request', payload)
                  → ipcMain.handle('grpc_request', handler)

Main → Renderer:  mainWindow.webContents.send('grpc_response', msg)
                  → ipcRenderer.on('grpc_response', callback)
```

#### Response Routing

The bridge creates a `postMessage` function that routes all responses through the Electron IPC channel:

```typescript
this.controller.setPostMessageFn(async (msg) => {
  mainWindow.webContents.send('grpc_response', msg);
});
```

This replaces `webview.postMessage(msg)` from the VS Code extension with an equivalent Electron pattern.

#### Project Management

The bridge tracks the current project directory and exposes:
- `openProject()`: Show native folder picker → set project dir
- `setProjectDir(dir)`: Directly set project dir (used by CLI args and saved state)
- `currentProjectDir`: Getter for current project path

---

## ElectronPrismController

### `src/hosts/electron/ElectronPrismController.ts`

A thin platform shell (45 lines) that extends `BasePrismController` from `packages/prism-core/`. The bulk of orchestration logic (state management, services, handler routing) now lives in the base class. This file provides only Electron-specific overrides.

### VSCode API Replacements

| VSCode API | Electron Replacement |
|-----------|---------------------|
| `vscode.EventEmitter` | Node.js `EventEmitter` |
| `vscode.workspace.workspaceFolders` | Stored `_projectDir` string via `setProjectDir()` |
| `vscode.workspace.fs.stat()` | `fs.stat()` from `fs/promises` |
| `vscode.FileSystemWatcher` | `PrismWatcher` (chokidar) |
| `vscode.commands.executeCommand('setContext', ...)` | No-op (context keys not applicable) |
| `vscode.window.showInformationMessage` | Not needed (UI handles all messaging) |

### Services

| Service | Class | Purpose |
|---------|-------|---------|
| Workflow | `WorkflowStateMachine` | Research → Plan → Implement → Validate state machine |
| Stories | `StoriesManager` | Load/parse stories.json, track completion |
| Watcher | `PrismWatcher` | chokidar-based file system monitoring for `.prism/` |
| Chat | `ClaudeRunner` | Spawn Claude CLI for chat sessions |
| Skills | `ModeBridge` | Route `/skill-name` commands to Claude CLI |
| Spectrum | `SpectrumEngine` + `SpectrumRunner` | Autonomous story execution loop |

### Handler Registry

All handlers are registered in `_registerHandlers()` and dispatched via `handleGrpcRequest()`:

#### StateService

| Handler | Type | Description |
|---------|------|-------------|
| `subscribeToState` | Streaming | Push state updates indefinitely to subscriber |
| `getState` | Unary | One-shot state fetch |

#### UiService

| Handler | Type | Description |
|---------|------|-------------|
| `initializeWebview` | Unary | Trigger `.prism/` detection, push initial state |
| `initPrism` | Unary | Create `.prism/` directory structure |

#### WorkflowService

| Handler | Type | Description |
|---------|------|-------------|
| `transition` | Unary | Move to next workflow phase |
| `getAvailableTransitions` | Unary | Query valid transitions from current state |

#### ChatService

| Handler | Type | Description |
|---------|------|-------------|
| `sendMessage` | Unary | Route message to Claude CLI or plugin skill |
| `abortTask` | Unary | Terminate running chat session |
| `clearMessages` | Unary | Reset chat history |

#### PluginService

| Handler | Type | Description |
|---------|------|-------------|
| `executeSkill` | Unary | Run `/skill-name` via ModeBridge → Claude CLI |
| `terminateSkill` | Unary | Stop running skill |
| `checkCli` | Unary | Verify Claude CLI is on PATH |
| `getSkills` | Unary | List available Prism plugin skills |

#### SpectrumService

| Handler | Type | Description |
|---------|------|-------------|
| `start` | Unary | Begin autonomous story execution loop |
| `pause` | Unary | Pause execution |
| `resume` | Unary | Resume paused execution |
| `stop` | Unary | Stop execution |
| `skipStory` | Unary | Mark current story as SKIPPED, advance |
| `reset` | Unary | Reset execution state |

### State Management

The controller maintains a `PrismExtensionState` object and broadcasts changes to all subscribers:

```typescript
async updateState(partial: Partial<PrismExtensionState>): Promise<void> {
  Object.assign(this._state, partial);
  this._broadcastState();
}
```

Subscribers are tracked by `request_id`. Dead subscribers are auto-cleaned on send failure.

### Key Methods

| Method | Purpose |
|--------|---------|
| `setProjectDir(dir)` | Set active project, trigger `.prism/` re-detection, start watcher |
| `updateState(partial)` | Merge partial state, broadcast to all subscribers |
| `setPhase(phase)` | Force workflow phase transition |
| `_detectPrismDir()` | Check for `.prism/`, detect stories.json, start file watcher |
| `_onPrismFileChange(event)` | React to stories.json changes, reload stories |
| `_runChatSession(text)` | Spawn ClaudeRunner, stream text + tool events |
| `_startSpectrumLoop(config)` | Initialize SpectrumEngine, begin iteration loop |
| `dispose()` | Terminate all runners, close watchers, clean up subscribers |

---

## Platform Modules (Electron)

> **Note**: The `src/prism/config.ts` (79 lines), `src/prism/watcher.ts` (72 lines), and `src/prism/init.ts` (50 lines) modules have been extracted to `packages/prism-core/src/prism/` and are now consumed via `@prism-core/*` aliases. The descriptions below document their functionality as it exists in the shared package.

### `src/prism/config.ts` — Directory Detection

Replaces `vscode.workspace.fs.stat()` with pure Node.js:

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

export async function detectPrismDir(projectDir: string): Promise<string | undefined> {
  const candidate = path.join(projectDir, '.prism');
  try {
    await fs.stat(candidate);
    return candidate;
  } catch {
    return undefined;
  }
}

export async function detectStoriesPath(prismDir: string): Promise<string | undefined> {
  const candidate = path.join(prismDir, 'stories', 'stories.json');
  try {
    await fs.stat(candidate);
    return candidate;
  } catch {
    return undefined;
  }
}
```

Also provides `getPrismConfig(prismDir)` which builds a `PrismConfig` object with all subdirectory paths (research, plans, validation, spectrum, handoffs, etc.).

### `src/prism/watcher.ts` — File Watching

Replaces `vscode.FileSystemWatcher` with chokidar:

```typescript
export class PrismWatcher extends EventEmitter {
  private _watcher: FSWatcher | null = null;

  start(prismDir: string): void {
    this.dispose();
    this._watcher = chokidar.watch(prismDir, {
      ignoreInitial: true,
      awaitWriteFinish: true,
      persistent: false,
    });
    this._watcher.on('all', (event, filePath) => {
      const type = this._classify(prismDir, filePath);
      this.emit('change', { type, filePath });
    });
  }
}
```

File changes are classified into categories:

| Category | Pattern | Triggers |
|----------|---------|----------|
| `stories` | `stories/*` | Stories reload |
| `research` | `shared/research/*` | Research list refresh |
| `plans` | `shared/plans/*` | Plans list refresh |
| `validation` | `shared/validation/*` | Validation refresh |
| `spectrum` | `shared/spectrum/*` | Spectrum progress update |
| `other` | Everything else | No specific action |

### `src/prism/init.ts` — Directory Initialization

Creates the full `.prism/` directory structure:

```
.prism/
├── stories/
├── shared/
│   ├── research/
│   ├── plans/
│   ├── validation/
│   ├── spectrum/
│   ├── handoffs/
│   ├── prs/
│   ├── docs/
│   └── ref/
└── local/            ← .gitignore written here
```

Extracted from prism-vscode's `prism/init.ts` to avoid a transitive `vscode` import (the original file co-locates `initPrismDirInWorkspace` which depends on `vscode.workspace`).

---

## Webview UI — React SPA

### Transport Adapter (`webview-ui/src/electron.ts`)

The transport adapter is a drop-in replacement for VS Code's `vscode.ts`. It bridges the React SPA to Electron's IPC system using a re-dispatch pattern:

```typescript
// Inbound: Main → Renderer
window.electronAPI.on('grpc_response', (data) => {
  // Re-dispatch as a standard window "message" event
  // so grpc-client-base.ts works without modification
  window.dispatchEvent(new MessageEvent('message', { data }));
});

// Outbound: Renderer → Main
export const electronApi = {
  postMessage: (message: unknown) => {
    const msg = message as { type: string; grpc_request?: unknown; grpc_request_cancel?: unknown };
    if (msg.type === 'grpc_request') {
      window.electronAPI.invoke('grpc_request', msg.grpc_request);
    } else if (msg.type === 'grpc_request_cancel') {
      window.electronAPI.invoke('grpc_request_cancel', msg.grpc_request_cancel);
    }
  },
};
```

The re-dispatch pattern is key: by converting IPC responses into standard `window.dispatchEvent(new MessageEvent(...))` events, the entire `grpc-client-base.ts` works without any modification. The only change needed was swapping the import from `../vscode` to `../electron`.

### gRPC Client Base (`webview-ui/src/services/grpc-client-base.ts`)

The `ProtoBusClient` abstract base implements unary and streaming RPC over the postMessage protocol:

#### Unary Requests
1. Generate UUID4 `request_id`
2. Set up `window.addEventListener('message', handler)`
3. Post request via `electronApi.postMessage()`
4. Wait for response with matching `request_id`
5. Resolve/reject promise, remove listener

#### Streaming Requests
1. Same setup as unary
2. Keep listener active until `is_streaming === false`
3. Call `callbacks.onResponse()` for each message
4. Call `callbacks.onComplete()` on stream end
5. Return unsubscribe function (removes listener + sends cancel)

### Service Clients (`webview-ui/src/services/grpc-client.ts`)

Stateless client classes extending `ProtoBusClient`:

| Client | Methods |
|--------|---------|
| `StateServiceClient` | `subscribeToState()` (streaming), `getState()` (unary) |
| `UiServiceClient` | `initializeWebview()`, `initPrism()` |
| `WorkflowServiceClient` | `transition(transition)`, `getAvailableTransitions()` |
| `ChatServiceClient` | `sendMessage(text)`, `abortTask()`, `clearMessages()`, `approveToolUse()` |
| `PluginServiceClient` | `executeSkill()`, `terminateSkill()`, `checkCli()`, `getSkills()` |
| `SpectrumServiceClient` | `start()`, `pause()`, `resume()`, `stop()`, `skipStory()`, `reset()` |

### View Switcher (`webview-ui/src/App.tsx`)

The top-level component routes between views based on state:

```
No .prism/ dir detected  →  WelcomeView (with "Open Project…" button)
Chat mode active         →  ChatView (message list + input + phase selector)
Spectrum active          →  SpectrumView (progress bar + story list + logs)
```

### Theme (`webview-ui/src/theme/`)

All VS Code CSS custom properties (`--vscode-sideBar-background`, `--vscode-foreground`, etc.) were replaced with Prism-specific custom properties:

```css
:root {
  --prism-bg: #1a1b2e;
  --prism-fg: #e2e8f0;
  --prism-font-family: 'Inter', system-ui, -apple-system, sans-serif;
  --prism-font-size: 13px;
  --prism-input-bg: #252640;
  --prism-input-border: #3a3b5c;
  --prism-button-bg: #6366f1;
  --prism-button-fg: #ffffff;
  /* ... spectral theme colors */
}
```

The `spectral.css` file was also cleaned: `body.vscode-light` and `body.vscode-high-contrast` selectors were removed since the Electron app uses a single dark theme.

---

## State Management (Electron)

### PrismExtensionState

The global state object mirrors the VS Code extension's state model exactly:

```typescript
interface PrismExtensionState {
  // Config
  version: string;
  didHydrateState: boolean;
  hasClaudeCli: boolean;

  // Project
  hasPrismDir: boolean;
  hasStoriesJson: boolean;
  prismDir?: string;
  storiesPath?: string;

  // Workflow
  workflowPhase: 'idle' | 'research' | 'plan' | 'implement' | 'validate';
  defaultModel: string;
  planningModel: string;

  // Stories
  stories: PrismStory[];
  plan?: PrismPlan;
  completedCount: number;
  remainingCount: number;

  // Chat
  chatMessages: PrismChatMessage[];
  isChatStreaming: boolean;
  hasActiveTask: boolean;
  pendingApprovalToolUseId?: string;

  // CLI Mode
  chatMode: 'sdk' | 'plugin';
  activePluginSkill: string | null;

  // Spectrum
  spectrum: PrismSpectrumState;
}
```

### State Flow

```
ElectronPrismController
    │
    ├── updateState({ chatMessages: [...] })
    │       │
    │       ▼
    │   Object.assign(this._state, partial)
    │       │
    │       ▼
    │   _broadcastState()
    │       │
    │       ▼
    │   for each subscriber (by request_id):
    │       mainWindow.webContents.send('grpc_response', {
    │         request_id,
    │         service: 'StateService',
    │         method: 'subscribeToState',
    │         payload: this._state,
    │         is_streaming: true
    │       })
    │
    ▼
PrismStateContext (React)
    │
    ├── onResponse callback updates state ref
    │       │
    │       ▼
    │   setState(newState)  →  React re-render
    │       │
    │       ▼
    │   ChatView / SpectrumView / WelcomeView re-render
```

### Hydration

The `didHydrateState` flag prevents a flash of default state on startup:

1. Renderer mounts → calls `UiServiceClient.initializeWebview()`
2. Main process detects `.prism/`, loads stories, resolves Claude CLI
3. Main pushes full state with `didHydrateState: true`
4. React components show loading state until `didHydrateState` is `true`

---

## Build & Packaging

### Scripts

```bash
cd apps/prism-electron

npm start           # Dev mode: Electron Forge + Vite HMR
npm run package     # Build production app (no installer)
npm run make        # Build distributable installers
npm run lint        # ESLint check
```

### Vite Build Targets

Electron Forge's Vite plugin builds three separate targets:

| Target | Config | Input | Output |
|--------|--------|-------|--------|
| Main process | `vite.main.config.mts` | `src/main.ts` | `.vite/build/main.js` |
| Preload script | `vite.preload.config.mts` | `src/preload.ts` | `.vite/build/preload.js` |
| Renderer (SPA) | `vite.renderer.config.mts` | `webview-ui/index.html` | `.vite/renderer/main_window/` |

### Forge Config (`forge.config.ts`)

```typescript
// Plugins
plugins: [
  new VitePlugin({
    build: [
      { entry: 'src/main.ts', config: 'vite.main.config.mts', target: 'main' },
      { entry: 'src/preload.ts', config: 'vite.preload.config.mts', target: 'preload' },
    ],
    renderer: [
      { name: 'main_window', config: 'vite.renderer.config.mts' },
    ],
  }),
  new FusesPlugin({ /* security hardening */ }),
],

// Makers (installers)
makers: [
  MakerSquirrel,    // Windows: .exe + .nupkg + RELEASES
  MakerZIP,         // macOS: .zip
  MakerDeb,         // Linux: .deb
  MakerRPM,         // Linux: .rpm
]
```

### Build Output

```
out/
├── Prism-win32-x64/              # Packaged app (npm run package)
│   ├── Prism.exe
│   ├── resources/
│   │   ├── app.asar              # Bundled source (.vite/build + .vite/renderer)
│   │   └── assets/               # extraResource (office sprites, etc.)
│   └── ...
└── make/
    └── squirrel.windows/x64/     # Installer (npm run make)
        ├── Prism-2.4.9 Setup.exe
        ├── prism_electron-2.4.9-full.nupkg
        └── RELEASES
```

### Renderer Vite Config

The renderer has its own Vite configuration. The SPA source lives in `webview-ui/` but the Vite root stays at the project directory so the Forge Vite plugin outputs to `.vite/renderer/` at the project root — which gets packaged into the ASAR correctly.

```typescript
// vite.renderer.config.mts
export default defineConfig({
  // No custom root — keeps .vite/renderer/ output at project root for ASAR packaging
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'webview-ui/src') },
  },
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, 'webview-ui/index.html'),
    },
  },
});
```

> **v2.4.3 fix**: Previously `root: './webview-ui'` caused the renderer build output to land in `webview-ui/.vite/renderer/` instead of `.vite/renderer/`. The ASAR packager only included `.vite/` from the project root, resulting in a white screen on launch. The `loadFile` path in `main.ts` now uses `../renderer/main_window/webview-ui/index.html` to match the new output location.

---

## Security Hardening

### Context Isolation

The Electron app enforces strict process isolation:

| Setting | Value | Effect |
|---------|-------|--------|
| `contextIsolation` | `true` | Renderer cannot access Node.js APIs directly |
| `nodeIntegration` | `false` | No `require()` available in renderer |
| `sandbox` | default | Renderer runs in Chromium sandbox |

All communication between renderer and main process goes through the `contextBridge` preload script.

### Electron Fuses

Compile-time security toggles via `@electron/fuses`:

| Fuse | Setting | Effect |
|------|---------|--------|
| `RunAsNode` | Disabled | Prevents `ELECTRON_RUN_AS_NODE` env var abuse |
| `EnableCookieEncryption` | Enabled | Encrypts cookies at rest |
| `EnableNodeOptionsEnvironmentVariable` | Disabled | Blocks `NODE_OPTIONS` injection |
| `EnableNodeCliInspectArguments` | Disabled | Blocks `--inspect` debugging in production |
| `OnlyLoadAppFromAsar` | Enabled | Only loads code from ASAR bundle (no filesystem bypass) |

### IPC Channel Restrictions

The preload script only forwards specific, known IPC channels. The renderer cannot send arbitrary messages to the main process — it can only use `send`, `on`, and `invoke` through the `electronAPI` bridge.

---

## Three-Platform Feature Parity

### Architecture Comparison

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Shared (.prism/ directory)                           │
│                                                                             │
│  stories.json │ research/ │ plans/ │ validation/ │ spectrum/ │ handoffs/    │
└─────────────────────────────────────────────────────────────────────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  CLI (Go)    │   │  VS Code (TS)    │   │  Electron (TS)   │
│              │   │                  │   │                  │
│  Bubble Tea  │   │  webview.postMsg │   │  ipcMain/Render  │
│  TUI         │   │  + VSCode APIs   │   │  + Node.js APIs  │
│              │   │                  │   │                  │
│  Terminal    │   │  IDE-embedded    │   │  Standalone      │
│  rendering   │   │  panels         │   │  window          │
└──────────────┘   └──────────────────┘   └──────────────────┘
```

### Code Sharing Between VS Code and Electron

The Electron app shares approximately 90% of its codebase with the VS Code extension:

| Layer | Shared? | Notes |
|-------|---------|-------|
| Workflow state machine | Yes | Imported via `@prism-core/core/controller/prism/workflow` |
| Stories manager | Yes | Imported via `@prism-core/core/controller/prism/stories` |
| Signal parser | Yes | Imported via `@prism-core/prism/signals` |
| Claude runner | Yes | Imported via `@prism-core/claude/runner` |
| gRPC handler | Yes | Imported via `@prism-core/core/controller/grpc-handler` |
| Base controller | Yes | Imported via `@prism-core/core/controller/BasePrismController` |
| Spectrum engine/runner | Yes | Imported via `@prism-core/core/controller/prism/spectrum*` |
| ModeBridge (skills) | Yes | Imported via `@prism-core/core/controller/prism/mode-bridge` |
| React components | Yes | Imported via `@prism-ui/*` (ChatView, SpectrumView, all sub-components) |
| gRPC clients | Yes | Imported via `@prism-ui/services/*` |
| State context | Yes | Imported via `@prism-ui/context/PrismStateContext` |
| Office engine | Yes | Imported via `@prism-ui/office/*` |
| CSS bridge | Yes | `@prism-ui/styles/bridge.css` maps `--prism-*` tokens per platform |
| Platform shell | New | `ElectronIPCBridge` (511 lines), `ElectronPrismController` (45 lines) |
| Auth | New | `ElectronSecretStorage` (102 lines, OS-level encryption via safeStorage) |
| Office subsystem | New | `ElectronAgentManager` (386 lines), `ElectronOfficeProvider` (306 lines) |
| IDE shell | New | Layout components (8 files), panel components (6 files), view components (3 files) |
| Theme CSS | Thin shell | `webview-ui/src/theme/` with `--prism-*` custom properties |


---

# Part V — Monorepo Architecture (v2.5.0)

The repository was restructured from two independent applications with fragile path aliases into a proper npm workspaces monorepo in v2.3.5, with continued refinements through v2.5.0. Shared packages (`@prism/core`, `@prism/ui`) contain all business logic and React components. A unified Tauri-based installer replaced the legacy NSIS approach in v2.4.7. The `prism-eval` Electron app and three new skills (`prism-eval`, `prism-release`, `prism-docs-update`) were added in v2.5.0.

---

## Repository Structure

```
prism-plugin/
├── packages/
│   ├── prism-core/          # @prism/core — Shared Node.js/TypeScript business logic
│   └── prism-ui/            # @prism/ui — Shared React component library
├── cmd/
│   ├── prism-vscode/        # VS Code extension (thin platform shell)
│   ├── prism-electron/      # Electron desktop app (thin platform shell)
│   ├── prism-cli/           # Go TUI dashboard (standalone)
│   └── prism-installer/     # Tauri v2 cross-platform installer (Rust + React 19)
├── prism-docs/              # VitePress documentation site
├── package.json             # Root — npm workspaces config
└── .prism/                  # Shared workflow artifacts
```

## npm Workspaces

Root `package.json` registers 8 workspaces — run `npm install` from the repo root:

```json
{
  "name": "prism-plugin",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/prism-vscode",
    "apps/prism-vscode/webview-ui",
    "apps/prism-vscode/webview-office",
    "apps/prism-vscode/webview-panel",
    "apps/prism-electron",
    "apps/prism-electron/webview-ui",
    "apps/prism-installer"
  ]
}
```

---

## packages/prism-core

**Package name**: `@prism/core`  
**Purpose**: Platform-agnostic business logic — zero vscode or electron imports.

**TypeScript path alias**: `@prism-core/*` → `../../packages/prism-core/src/*`

### Contents

| Directory | Files | Description |
|-----------|-------|-------------|
| `src/shared/` | `types.ts`, `PrismMessage.ts`, `PrismState.ts` | `WorkflowPhase` enum, `WORKFLOW_PHASE_COLORS`, `WORKFLOW_PHASE_LABELS`, GrpcRequest/Response types, `PrismExtensionState`, `DEFAULT_PRISM_STATE` |
| `src/core/api/` | `types.ts`, `auth.ts` | Stream chunk types, conversation message types, tool definitions, UI chat types; `SecretStore` interface, API key helpers |
| `src/core/controller/` | `BasePrismController.ts`, `grpc-handler.ts`, `types.ts` | Abstract base controller (866 lines, extends EventEmitter), transport-agnostic gRPC handler with `registerUnary`/`registerStream`/`clearHandlers`, `PostMessageFn`/`AgentSessionData`/`UpdatedStoryData` types |
| `src/core/controller/prism/` | `workflow.ts`, `spectrum.ts`, `spectrum-runner.ts`, `stories.ts`, `plugin-bridge.ts`, `mode-bridge.ts` | `WorkflowStateMachine`, `SpectrumEngine`, `SpectrumRunner`, `StoriesManager`, `PluginBridge` (with `SKILL_MAP`, `WORKFLOW_SKILLS`), `ModeBridge` (with `detectSkillTrigger()`) |
| `src/core/prompts/` | `system-prompt.ts`, `phase-research.ts`, `phase-plan.ts`, `phase-implement.ts`, `phase-validate.ts` | `buildSystemPrompt()` function, per-phase instruction constants |
| `src/claude/` | `events.ts`, `parser.ts`, `runner.ts` | Stream event types, `OutputParser` class with signal/tool/phase detection, `ClaudeRunner` class (443 lines — CLI process spawner, prompt builders, `checkClaudeCli()`) |
| `src/prism/` | `signals.ts`, `types.ts`, `stories.ts`, `progress.ts`, `config.ts`, `init.ts`, `watcher.ts` | Signal parsing (`parseSignal`, `containsSignal`), domain model (`Plan`, `Story`, `StoriesFile`), story file I/O + queries, `ProgressFile` class, `PrismConfig` + directory detection, `.prism/` initialization, `PrismWatcher` (chokidar) |
| `src/office/` | `agentBridge.ts`, `assetLoader.ts`, `layoutPersistence.ts`, `transcriptParser.ts`, `timerManager.ts`, `types.ts`, `constants.ts` | `AgentBridge`, asset loading functions, layout read/write/watch, JSONL transcript processing, agent timer management, `PostMessageFn`/`AgentState`/`PersistedAgent` types, 31 timing/display/parsing constants |
| `src/workspace/` | `types.ts`, `discovery.ts`, `worktrees.ts`, `qualityGates.ts`, `research.ts`, `plans.ts` | `ProjectInfo`/`WorktreeInfo`/`EpicInfo` types, project discovery (50-entry cap, git timeouts), worktree create/delete, gate execution with `AbortSignal`, research/plans file discovery with frontmatter parsing |

### Infrastructure Notes

- `package.json` declares `"main": "src/index.ts"` and `"types": "src/index.ts"` but **`src/index.ts` does not exist** — this should be created or the declarations removed
- `tsconfig.json` has `noEmit: true` — no compiled output is produced, no `dist/` directory exists
- Dependencies: `uuid`, `chokidar`, `pngjs`
- DevDependencies: `typescript`, `@types/node`, `@types/uuid`, `@types/pngjs`
- Scripts: `build` and `typecheck` both run `tsc --noEmit`
- Zero test files across 42 source files

### Key Patterns

**BasePrismController** uses Node.js `EventEmitter` as drop-in for `vscode.EventEmitter`:
```typescript
controller.on('stateChange', (state) => ...)
controller.on('sessionStart', (data) => ...)
controller.on('storyUpdate', (data) => ...)
controller.on('spectrumStoryEnd', (data) => ...)
controller.on('fileChange', (path) => ...)
```

**Transport-agnostic gRPC handler**:
```typescript
handleGrpcRequest(
  postMessage: (msg: unknown) => Promise<void>,  // injected by platform
  request: GrpcRequest
)
```

---

## packages/prism-ui

**Package name**: `@prism/ui`  
**Purpose**: Shared React components and canvas office engine.

**TypeScript path alias**: `@prism-ui/*` → `../../../packages/prism-ui/src/*` (consumers are 3 levels deep from repo root)

### Contents

| Directory | Files | Description |
|-----------|-------|-------------|
| `src/context/` | `PrismStateContext.tsx` | `PrismStateContextProvider`, `usePrismState` hook, re-exports all state types |
| `src/transport/` | `types.ts` | `WebviewTransport` interface (postMessage, getState, setState) |
| `src/services/` | `grpc-client-base.ts`, `grpc-client.ts` | `ProtoBusClient` abstract class with `WebviewTransport` injection, unary + streaming; 6 concrete clients: StateService, UiService, WorkflowService, ChatService, PluginService, SpectrumService |
| `src/views/` | `ChatView.tsx`, `SpectrumView.tsx` | Main chat interface (Virtuoso virtual scrolling, phase indicator, suggestion chips), Spectrum dashboard (controls, progress, stories, signals, activity log) |
| `src/components/` | `WelcomeView.tsx` | Onboarding / first-run view when `.prism/` not detected |
| `src/components/common/` | `MarkdownBlock.tsx` | react-markdown renderer with remark-gfm, rehype-highlight, custom overrides for code blocks, tables, links |
| `src/components/chat/` | `ChatRow.tsx`, `ChatTextArea.tsx`, `ToolRow.tsx` | Message type dispatcher (user/assistant/tool_use/tool_result/completion/error), auto-resizing input with Enter-to-send, tool use + result row renderers |
| `src/components/workflow/` | `PhaseIndicator.tsx` | Phase indicator (icon + label + animated dots) and `PhaseTransition` buttons |
| `src/components/spectrum/` | `SpectrumControls.tsx`, `ProgressBar.tsx`, `StoryList.tsx`, `ActivityLog.tsx`, `SignalStatus.tsx` | Start/Pause/Resume/Stop/Skip buttons, animated spectral gradient bar, compact story list with status icons, timestamped log with auto-scroll, signal badge + error count |
| `src/styles/` | `bridge.css`, `tokens.ts` | 342-line CSS variable bridge (`[data-platform="vscode"]` / `[data-platform="electron"]`), typed `PRISM_TOKENS` constant + `PrismPlatform` type |
| `src/office/` | `OfficeApp.tsx`, `OfficeErrorBoundary.tsx`, `transport.ts`, `types.ts`, `office-constants.ts`, `colorize.ts`, `floorTiles.ts`, `wallTiles.ts`, `toolUtils.ts`, `notificationSound.ts` | Top-level office component, error boundary with retry, `OfficeTransport` interface, all type defs (`SpriteData = string[][]`, `Character`, `OfficeLayout`, `EditTool`, etc.), 117 lines of game constants, sprite HSL colorization, tile data, tool status mapping, Web Audio notifications |
| `src/office/engine/` | `officeState.ts`, `gameLoop.ts`, `renderer.ts`, `characters.ts`, `matrixEffect.ts` | `OfficeState` class (layout, characters, tiles, seats), rAF loop, canvas tile/character rendering, character FSM + BFS pathfinding, spawn/despawn visual effect |
| `src/office/sprites/` | `spriteData.ts`, `spriteCache.ts` | Hand-drawn sprite arrays (string[][]), render cache |
| `src/office/layout/` | `furnitureCatalog.ts`, `layoutSerializer.ts`, `tileMap.ts` | Furniture catalog + metadata, layout-to-tile conversion, walkability + BFS pathfinding |
| `src/office/editor/` | `EditorToolbar.tsx`, `editorActions.ts`, `editorState.ts` | UI toolbar for edit mode, paint/place/remove/move/rotate actions, editor state management |
| `src/office/hooks/` | `useExtensionMessages.ts`, `useEditorActions.ts`, `useEditorKeyboard.ts` | Extension-to-office message bridge, editor action handlers, keyboard shortcuts in edit mode |
| `src/office/components/` | `OfficeCanvas.tsx`, `ToolOverlay.tsx` | Main canvas element, HTML overlay for tool activity display |
| `src/office/components/ui/` | `AgentLabels.tsx`, `ZoomControls.tsx`, `BottomToolbar.tsx`, `SettingsModal.tsx`, `DebugView.tsx`, `StoryLabels.tsx` | Agent name labels, zoom +/- buttons, bottom action bar, settings dialog, debug info panel, story context labels |
| `src/office/fonts/` | `FSPixelSansUnicode-Regular.ttf` | Pixel font for office UI |

### Infrastructure Notes

- `package.json` declares `"main": "src/index.ts"` and `"types": "src/index.ts"` but **`src/index.ts` does not exist**
- Dependencies: `react-markdown`, `react-virtuoso`, `rehype-highlight`, `remark-gfm`, `highlight.js`, `class-variance-authority`, `clsx`, `lucide-react`, `tailwind-merge`, `uuid`
- Peer deps: `react`, `react-dom`
- Scripts: `typecheck` runs `tsc --noEmit`
- Zero test files, no Storybook

### CSS Variable Bridge

13 shared components use `--prism-*` tokens mapped by platform:

```css
[data-platform="vscode"] {
  --prism-editor-background: var(--vscode-editor-background, #1e1e1e);
}
[data-platform="electron"] {
  --prism-editor-background: #0f1419;
}
```

### Office Canvas Engine

The office is a pure software renderer — no PNG images at runtime:
```
SpriteData = string[][]   // 2D array of hex colours, '' = transparent
```

**Platform transport adapter** (`src/office/transport.ts`):
```typescript
interface OfficeTransport {
  postMessage(msg: unknown): void
  onMessage(handler: (msg: unknown) => void): () => void
}
// VS Code:  setOfficeTransport({ postMessage: vscode.postMessage, ... })
// Electron: setOfficeTransport({ postMessage: electronAPI.send, ... })
```

---

## Platform Shell Responsibilities

| Responsibility | VS Code | Electron |
|----------------|---------|----------|
| Window | `vscode.WebviewViewProvider` | `BrowserWindow` + `ipcMain` |
| Terminal/process | `vscode.Terminal` | `child_process.spawn` |
| Secret storage | `vscode.SecretStorage` | `safeStorage` (`ElectronSecretStorage`) |
| File watching | `vscode.workspace.createFileSystemWatcher` | `chokidar` |
| Tree views | `vscode.TreeDataProvider` | React panels in `ContentRail` |
| Status bar | `vscode.StatusBarItem` | `BottomStatusBar.tsx` |

---

## Development Workflow

```bash
# Install all workspaces
npm install

# Type-check shared packages
cd packages/prism-core && npm run typecheck
cd packages/prism-ui   && npm run typecheck

# Build VS Code extension
cd apps/prism-vscode && npm run compile
cd apps/prism-vscode/webview-ui && npm run build

# Build Electron app
cd apps/prism-electron && npm run make
```

---

## Production Hardening (v2.4.1+)

| Area | Hardening |
|------|-----------|
| **Office renderer** | React `OfficeErrorBoundary` wraps `OfficeApp` in both platforms — canvas crash shows fallback UI with Retry |
| **Claude CLI detection** | `ElectronAgentManager` detects `ENOENT` spawn errors and shows user-friendly install instructions |
| **JSONL detection timeout** | 10-second timeout warns renderer if Claude transcript file never appears |
| **Layout persistence** | Validates parsed JSON is a non-null object; renames corrupted files to `.corrupted.<timestamp>` |
| **Layout watcher** | Validates external layout changes before forwarding to renderer |
| **Quality gate cancellation** | `executeGate` accepts `AbortSignal`; `prism:cancelGate` IPC; Cancel button in `MonitorPanel` |
| **Workspace discovery** | 50-entry sibling directory cap; graceful `git` not found; 5s/10s/15s git command timeouts |


## Centralized Version Management (v2.5.0)

Prior to v2.4.3, version strings were hardcoded in 14+ files across the monorepo and bumped manually. This was error-prone and versions frequently drifted. The bump script was updated in v2.4.7 to replace `apps/prism-setup` references with the Tauri installer.

### VERSION File

A single `VERSION` file at the repository root is the source of truth:

```
2.5.0
```

### Bump Script (`scripts/bump-version.py`)

```bash
python scripts/bump-version.py patch           # 2.5.0 -> 2.5.1
python scripts/bump-version.py minor           # 2.5.0 -> 2.6.0
python scripts/bump-version.py major           # 2.5.0 -> 3.0.0
python scripts/bump-version.py --set 2.6.0     # explicit version
```

The script reads the current version from `VERSION`, computes the new version, then updates all production version locations:

**JSON files** (update `"version"` field):

| # | File | What is Updated |
|---|------|-----------------|
| 1 | `VERSION` | Root source of truth |
| 2 | `.claude-plugin/plugin.json` | `"version"` JSON field |
| 3 | `.claude-plugin/marketplace.json` | `"version"` JSON field |
| 4 | `apps/prism-vscode/package.json` | `"version"` JSON field |
| 5 | `apps/prism-electron/package.json` | `"version"` JSON field |
| 6 | `apps/prism-installer/package.json` | `"version"` JSON field |
| 7 | `apps/prism-installer/src-tauri/tauri.conf.json` | `"version"` JSON field |

**Text files** (find-and-replace of old → new):

| # | File | What is Updated |
|---|------|-----------------|
| 8 | `apps/prism-cli/main.go` | `var version = "X.Y.Z"` |
| 9 | `apps/prism-cli/app/footer.go` | `"vX.Y.Z"` hardcoded TUI footer |
| 10 | `packages/prism-core/src/shared/PrismState.ts` | `DEFAULT_PRISM_STATE.version` |
| 11 | `packages/prism-ui/src/context/PrismStateContext.tsx` | `DEFAULT_STATE.version` |

> **Deprecated**: `apps/prism-setup/` (Electron-based NSIS installer) entries are commented out in the script but kept for rollback.

### Where Version Appears to Users

| Platform | Location | Source |
|----------|----------|--------|
| **CLI** | TUI footer (bottom-right powerline) | `footer.go:165` hardcoded string |
| **CLI** | `--version` flag | `main.go:19` via Cobra |
| **Electron** | Bottom status bar (24px, bottom-left) | `PrismState.ts` → `usePrismState().version` |
| **VS Code** | Panel status bar (22px, right side) | Controller state via `initialState` message |
| **VS Code** | Extensions panel | `package.json` `"version"` field |
| **Installer** | Title bar and version display | `tauri.conf.json` `"version"` field, read via `@tauri-apps/api/app` |

### Release Workflow Integration

The `/prism-release` skill uses the bump script:

```bash
# Step 1: Bump (one command updates all version files)
python scripts/bump-version.py patch --root .

# Step 2: Build
cd apps/prism-cli && make build-all

# Step 3: Commit + tag
git add -A && git commit -m "vX.Y.Z" && git tag vX.Y.Z
git push && git push origin vX.Y.Z

# Step 4: GitHub release (triggers installer CI)
gh release create vX.Y.Z apps/prism-cli/bin/* ...
```


## Unified Tauri Installer (v2.4.7+)

Replaced the native NSIS-only Windows installer (`installer/`, v2.4.3) and the earlier Electron-based setup wizard (`apps/prism-setup/`) with a unified Tauri v2 cross-platform installer at `apps/prism-installer/`. The same Rust + React 19 codebase produces native Windows `.exe` (via NSIS bundler) and macOS `.dmg` installers with platform-specific wizard UIs.

### Installer Architecture

```
apps/prism-installer/
├── src/                              # React 19 frontend
│   ├── App.tsx                       # Platform router → WindowsInstaller | MacInstaller
│   ├── hooks/
│   │   ├── usePlatform.ts            # @tauri-apps/plugin-os platform detection
│   │   └── useInstaller.ts           # Step/component/directory state
│   ├── constants.ts                  # 4 component definitions (CLI, VSCode, Plugin, Desktop)
│   ├── layouts/
│   │   ├── WindowsChrome.tsx         # Custom title bar with min/max/close buttons
│   │   ├── MacWindow.tsx             # macOS traffic light window chrome
│   │   └── Sidebar.tsx               # macOS step sidebar
│   ├── screens/
│   │   ├── windows/                  # 6-step Windows wizard
│   │   │   ├── WelcomeStep.tsx
│   │   │   ├── ComponentsStep.tsx
│   │   │   ├── DirectoryStep.tsx
│   │   │   ├── PreflightStep.tsx     # Multi-strategy detection results
│   │   │   ├── ProgressStep.tsx      # Sequential install with per-component progress
│   │   │   └── FinishStep.tsx
│   │   └── macos/                    # 6-step macOS wizard
│   │       ├── IntroStep.tsx
│   │       ├── LicenseStep.tsx
│   │       ├── DestinationStep.tsx
│   │       ├── TypeStep.tsx
│   │       ├── InstallingStep.tsx
│   │       └── SummaryStep.tsx
│   └── components/
│       └── NavButtons.tsx
├── src-tauri/
│   ├── tauri.conf.json               # 520×600 frameless window, center, NSIS/DMG bundles
│   ├── Cargo.toml                    # Tauri 2, tokio, reqwest, serde, winreg (Windows)
│   └── src/
│       ├── main.rs                   # Entry: --uninstall → headless uninstall, else Tauri UI
│       ├── lib.rs                    # Plugin registration + 14 Tauri command handlers
│       ├── detect.rs                 # Multi-tier detection: Registry → Filesystem → PATH
│       ├── install_cli.rs            # Binary copy + PATH config + ~/.prism/ init
│       ├── install_extension.rs      # VSIX install into all detected editors
│       ├── install_plugin.rs         # claude plugin install or file copy fallback
│       ├── download.rs               # Streaming download from GitHub Releases with progress
│       └── uninstall.rs              # Remove binary, PATH, registry + Add/Remove Programs
└── package.json                      # React 19, Tailwind v4, Vite 6, @tauri-apps/* v2
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Rust + Tauri v2 | System access, IPC, window management |
| **Frontend** | React 19 + Tailwind v4 + Vite 6 | Wizard UI (platform-specific layouts) |
| **HTTP** | reqwest + rustls-tls | Streaming download (no OpenSSL dependency) |
| **Async** | tokio (full features) | Async download, file I/O |
| **Windows** | winreg, winapi | Registry access, PATH broadcast, disk space |
| **Bundler** | Tauri NSIS (Windows), DMG (macOS) | Native installer output |

### Tauri Commands (14 handlers)

```
detect_editors, detect_claude_cli, detect_claude_code, detect_all_tools,
detect_existing_prism, detect_os_info, detect_disk_space, run_preflight,
install_cli, install_all_extensions, install_plugin,
download_desktop_app, run_downloaded_installer,
uninstall, open_terminal
```

### Detection Engine (`detect.rs`)

The detection system uses a **three-tier strategy** per editor (VS Code, Cursor, Windsurf):

| Tier | Strategy | Platform |
|------|----------|----------|
| 1 | **Registry scan** — HKLM/HKCU/WOW6432Node Uninstall keys | Windows |
| 2 | **Filesystem probe** — Known install paths (`Program Files`, `AppData\Local\Programs`, Squirrel `app-X.Y.Z`) | Windows |
| 3 | **PATH lookup** — `where.exe` (Windows) or `which` (macOS) | Both |
| — | **App bundle check** — `/Applications/` and `~/Applications/`, version from `package.json` or `Info.plist` | macOS |

**Data model**:
- `InstallMethod` enum: `SystemInstall`, `UserInstall`, `SquirrelInstall`, `NpmGlobal`, `Unknown`
- `DetectedTool`: name, version, path, install location, install method, CLI availability, metadata map
- `DetectionReport`: editors + claude_code + node_available + npm_prefix
- `PreflightResult`: full detection + OS info + disk info

**Claude Code detection**: Checks npm global prefix → `node_modules/@anthropic-ai/claude-code/package.json`, then PATH lookup via `which claude`, then Windows config-dir fallback at `%APPDATA%\Claude\claude-code`.

### Wizard Flows

**Windows** (6 steps): Welcome → Components → Directory → Preflight → Progress → Finish

| Step | Description |
|------|-------------|
| Welcome | Branding, version, PRISM wordmark |
| Components | 4 checkboxes (CLI required + checked, VSCode + Plugin checked, Desktop unchecked ~130MB) |
| Directory | Install path, defaults to `%LOCALAPPDATA%\Prism` |
| Preflight | Sequential detection with animated reveal (OS, disk, editors, Claude Code, existing Prism) |
| Progress | Per-component progress bars with log panel (Consolas font, auto-scroll) |
| Finish | Installed summary, checkbox to open terminal, Close button |

**macOS** (6 steps): Introduction → License → Destination → Installation Type → Installing → Summary

- Two-panel layout: sidebar with step list (numbered circles, blue current, green completed) + content area
- macOS traffic light buttons (red/yellow/green circles with hover symbols)
- Per-component progress bars with colorized log (green ✓, amber →, red ✕)

### Install Components

| Component | Size | Default | Description |
|-----------|------|---------|-------------|
| **Prism CLI** | ~2 MB | Required | Binary to `<install_dir>/bin/`, PATH config, `~/.prism/` init |
| **VS Code Extension** | ~8 MB | Checked | VSIX installed into ALL detected editors (VS Code, Cursor, Windsurf) |
| **Claude Code Plugin** | ~1 MB | Checked | `claude plugin install` or file copy fallback to `~/.claude/` |
| **Prism Desktop App** | ~130 MB | Unchecked | Streaming download from GitHub Releases, silent installer execution |

### CI/CD Pipeline (`.github/workflows/prism-installer-release.yml`)

```
prepare (ubuntu)       → build-windows (windows) + build-macos (macos)  → release
  Cross-compile CLI       Stage resources into src-tauri/resources/          Upload .exe + .dmg
  Package VSIX            npm run tauri build -- --bundles nsis|dmg          to GitHub Release
  Copy plugin files       (Rust + React frontend compilation)
```

**4 jobs**: `prepare` → `build-windows` + `build-macos` (parallel) → `release`

Triggers: `push tags v*` + `workflow_dispatch`

### Uninstall Support

The installer binary doubles as the uninstaller. On Windows:
- `prism-installer.exe --uninstall` triggers headless uninstall (no UI)
- Removes CLI binary, PATH entry, registry keys (`HKCU\Software\Prism`, Add/Remove Programs)
- Registered as `UninstallString` in Windows Add/Remove Programs

### Legacy Installers

| Installer | Location | Status |
|-----------|----------|--------|
| **NSIS scripts** | `installer/` | Legacy — `.nsi` scripts and built `.exe` files still on disk |
| **Electron setup** | `apps/prism-setup/` | Deprecated (v2.4.6) — not in npm workspaces, version no longer bumped |


---

# Part VI — VitePress Documentation Site

The monolithic documentation file was split into a navigable VitePress site at `prism-docs/` in v2.4.4. The site provides the same content organized across ~75 pages with full-text search, syntax highlighting, and spectral-themed styling.

## Documentation Site Overview

### Structure

```
prism-docs/
├── docs/
│   ├── index.md              # Hero landing page
│   ├── overview.md           # Three-platform overview table
│   ├── plugin/               # Part I — 13 pages (commands, agents, skills, etc.)
│   ├── cli/                  # Part II — 27 pages (architecture, screens, styling)
│   │   └── screens/         # 11 sub-pages (splash, home, agent, git, etc.)
│   ├── vscode/              # Part III — 15 pages (controller, IPC, sidebar, etc.)
│   ├── electron/            # Part IV — 13 pages (main process, IPC bridge, etc.)
│   └── monorepo/            # Part V — 7 pages (workspaces, prism-core, prism-ui)
├── package.json
└── .vitepress/
    └── config.mts           # Sidebar, nav, spectral theme config
```

### Theme

- Dark background: `#0a0a0f`
- Brand color: `#6366f1` (spectral blue)
- Top gradient bar across header
- Dual mode: light + dark (same brand colors)
- MiniSearch local full-text search
- Code syntax highlighting with line numbers

### Development

```bash
cd prism-docs
npm run docs:dev      # Dev server on port 5173
npm run docs:build    # Static HTML output to .vitepress/dist/
npm run docs:preview  # Preview built site
```

### Page Count by Section

| Section | Pages | Coverage |
|---------|-------|----------|
| Plugin (Part I) | 13 | Commands, agents, skills, scripts, behavioral principles |
| CLI (Part II) | 27 | Architecture, 11 screen references, styling, keyboard, layout |
| VS Code (Part III) | 15 | Controller, IPC, sidebar, panel, trees, office |
| Electron (Part IV) | 13 | Main process, IPC bridge, V2 UI, state management, security |
| Monorepo (Part V) | 7 | Workspaces, prism-core, prism-ui, platform shells |
| Eval Dashboard (Part VII) | 4 | Overview, architecture, screens, skill integration |
| **Total** | **~79** | Full content from this documentation file |

---

# Part VII — Prism Eval Dashboard (Electron)

The Prism Eval Dashboard is a standalone Electron desktop application for running, viewing, and comparing skill evaluations across plugin versions. It works in tandem with the `prism-eval` skill and the `prism-release` pipeline to provide a visual quality assurance layer for prompt engineering.

## Eval Dashboard Overview

| Property | Value |
|----------|-------|
| Location | `prism-eval/` |
| Runtime | Electron 40, React 19, TypeScript |
| Build | Electron Forge + Vite |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Layout | Dagre (DAG layout for agent traces) |
| Source files | 52 TypeScript/TSX files (~1,278 lines) |
| Window title | "Prism Admin — Eval Dashboard" |

### Purpose

When the `prism-eval` skill runs evaluations, it produces structured JSON output (`benchmark.json`, `grading.json`, `timing.json`) under `.prism/shared/evals/`. The Eval Dashboard reads these workspaces and presents the data across five interactive screens, enabling developers to:

- Monitor aggregate skill health across versions
- Drill into individual eval case pass/fail grades with evidence
- Replay agent execution traces as DAG visualizations
- Compare benchmark metrics (pass rate, tokens, time) between versions
- Visualize the skill dependency graph

---

## Eval Dashboard Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Main Process (src/main.ts)                             │
│  ├── Window management (1024×680 min, state persisted)  │
│  ├── IPC: eval:selectDirectory → file picker dialog     │
│  └── IPC: eval:loadWorkspace → EvalDataService          │
├─────────────────────────────────────────────────────────┤
│  Preload (src/preload.ts)                               │
│  └── contextBridge: electronAPI.selectDirectory/load     │
├─────────────────────────────────────────────────────────┤
│  Renderer (React 19 SPA)                                │
│  ├── AppShell (Sidebar + TopBar + content area)         │
│  ├── DataContext (workspace data provider)              │
│  ├── NavigationContext (screen routing)                 │
│  ├── EvalContext (eval selection state)                 │
│  ├── TraceContext (trace playback state)                │
│  └── 5 screens (see below)                             │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
.prism/shared/evals/<version>/workspace/iteration-N/
    │
    ├── benchmark.json          ──→  Benchmarks screen
    ├── <skill>-eval-<id>/
    │   ├── eval_metadata.json  ──→  EvalExplorer (assertions)
    │   ├── grading.json        ──→  EvalExplorer (pass/fail)
    │   ├── timing.json         ──→  Benchmarks (token/time)
    │   └── with_skill/
    │       └── outputs/        ──→  EvalExplorer (full output)
    │
    └── WorkspaceSelector ──→ user picks iteration directory
```

The `EvalDataService` (main process) reads the workspace directory, parses all JSON files, and sends structured data to the renderer via IPC.

---

## Eval Dashboard Screens

### 1. Mission Control

The operational overview screen. Displays:

- **Stat cards**: Average pass rate, total evals run, skills improved, total tokens consumed
- **Skill Performance Table**: All skills with pass rate, eval count, delta, token usage
- **Version Progression**: Line chart showing pass rate trend across versions
- **Live Feed**: Chronological event log of eval runs (EVAL, TOOL, SPAWN, BENCH, COMPARE, GRADE events)
- **Delta Indicators**: Color-coded arrows showing improvement/regression per skill

### 2. Eval Explorer

Drill-down into individual eval cases:

- **Skill Filter Chips**: Filter by skill name
- **Eval Cards**: Each eval case showing prompt, with-skill score vs old-skill score, comparator verdict
- **Eval Detail Panel**: Slide-out panel with full prompt, expectations list (pass/fail with evidence), output preview
- **Expectations Panel**: Individual assertion rows with pass/fail badges and evidence quotes

### 3. Agent Traces

DAG-based visualization of agent execution:

- **DagCanvas**: Renders agent execution as a directed acyclic graph using Dagre layout
- **DagNode**: Individual agent steps (color-coded by status: complete/running/pending)
- **DagEdge**: Dependency arrows between steps
- **Playback Controls**: Step through trace execution chronologically
- **Step Detail Panel**: Selected step's tools used, duration, and output

### 4. Benchmarks

Version-to-version metric comparison:

- **Version Cards**: Side-by-side cards for current vs baseline versions
- **Metric Comparison**: Pass rate, mean tokens ± stddev, mean time ± stddev
- **Skill Breakdown**: Per-skill comparison table with delta highlighting
- **Outgrowth Warning**: Alerts when token usage grows disproportionately to quality gains

### 5. Skill Graph

Interactive visualization of skill relationships:

- **GraphCanvas**: Force-directed or hierarchical layout of skills, commands, and agents
- **GraphNode**: Nodes sized by line count, colored by model assignment
- **GraphLegend**: Model color key (Opus/Sonnet/Haiku)
- **Node Detail Panel**: Click a node to see connections, line count, trigger patterns

---

## Eval Skill Integration

The Eval Dashboard is the visual frontend for the `prism-eval` skill workflow:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│ prism-release │────▶│  prism-eval  │────▶│  Eval Dashboard  │
│ (Step 7-8:   │     │  (Skill)     │     │  (Electron app)  │
│  snapshot +  │     │  Runs evals, │     │  Visualizes      │
│  eval gen)   │     │  grades,     │     │  benchmark.json, │
│              │     │  benchmarks) │     │  grading.json,   │
└──────────────┘     └──────────────┘     │  timing.json)    │
                                          └──────────────────┘
```

### Eval Lifecycle

1. **`/prism-release`** creates a version snapshot (`.prism/shared/evals/v2.5.0-snapshot/`) and generates `evals.json` for each skill
2. **`prism-eval`** skill runs eval cases — spawns parallel agents, captures timing, grades outputs, builds `benchmark.json`
3. **Eval Dashboard** reads the workspace directory, presents results across all 5 screens
4. Developer reviews pass rates, identifies regressions, and iterates on skills

### Eval Data Schema

Eval cases are defined in `.prism/shared/evals/<version>/skills/<skill>/evals.json`:

```json
{
  "skill": "prism-research",
  "version": "v2.5.0",
  "baseline": "../../../v2.4.9-snapshot/skills/prism-research/SKILL.md",
  "evals": [
    {
      "id": 1,
      "dimension": "output_quality|behavioral_compliance|regression",
      "prompt": "Research the authentication system in this codebase",
      "expected_output": "Structured research document with file:line references",
      "expectations": [
        "Output follows research template format",
        "Contains file:line references, not just file paths",
        "Does not suggest improvements (documentarian principle)"
      ]
    }
  ]
}
```

### Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Desktop runtime | Electron | 40.0.0 |
| UI framework | React | 19.2.4 |
| Build tooling | Electron Forge + Vite | 7.11.1 / 5.4.21 |
| Styling | Tailwind CSS | v4.2.1 |
| Charts | Recharts | 3.8.0 |
| DAG layout | Dagre | 0.8.5 |
| Language | TypeScript | ~4.5.4 |

---

