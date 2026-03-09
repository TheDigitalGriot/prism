---
date: 2026-03-08
researcher: Claude
git_commit: 9d421a43c7248fcb633a39b45501e4804897406c
branch: main
repository: prism-plugin
topic: "Spectrum Autonomous Execution Workflow"
tags: [research, spectrum, autonomous-execution, spectrum.sh, prism-spectrum]
status: complete
---

# Research: Spectrum Autonomous Execution Workflow

## Research Question

Understand how the Spectrum autonomous execution workflow works in this project. Research the spectrum.sh script and prism-spectrum skill.

## Summary

Spectrum is an autonomous execution system that runs one story per fresh Claude Code session in a loop. The shell script `scripts/spectrum.sh` acts as the outer orchestrator — it selects stories, spawns Claude CLI processes, parses signal tags from output, and manages state. The `prism-spectrum` skill defines the inner workflow that each Claude session follows: load state, implement one story, run quality gates, commit, update state, and emit a signal. The system also has a VS Code-native implementation via `SpectrumEngine` and `SpectrumRunner` in `packages/prism-core/`.

## Files Discovered

| File | Purpose |
|------|---------|
| `scripts/spectrum.sh` | Outer loop orchestrator — spawns fresh Claude sessions per story |
| `skills/prism-spectrum/SKILL.md` | Inner workflow skill — single-story execution per session |
| `commands/decompose_plan.md` | Converts Prism plans into stories.json for Spectrum consumption |
| `packages/prism-core/src/core/controller/prism/spectrum.ts` | VS Code-native SpectrumEngine state machine |
| `packages/prism-core/src/core/controller/prism/spectrum-runner.ts` | VS Code-native per-iteration CLI subprocess manager |
| `agents/log-investigator.md` | Debug agent spawned on quality gate failure |
| `agents/state-investigator.md` | Debug agent spawned on quality gate failure |
| `agents/git-investigator.md` | Debug agent spawned on quality gate failure |
| `skills/prism-spectrum/references/story-manifest-schema.md` | Schema for per-story manifest files |
| `skills/prism-spectrum/references/contracts-convention.md` | Cross-domain contract convention |
| `prism-docs/docs/vscode/spectrum.md` | Documentation for VS Code Spectrum integration |
| `prism-docs/docs/cli/screens/spectrum.md` | Documentation for CLI Spectrum screen |

## Component Analysis

### spectrum.sh — Outer Loop Orchestrator

**Location**: `scripts/spectrum.sh`

**How it works**:

1. **Prerequisites check** (`spectrum.sh:102-121`): Verifies `claude` CLI and `jq` are installed, and that `stories.json` exists.
2. **Schema validation** (`spectrum.sh:124-177`): Validates stories.json has required fields (`epic`, `stories` array, and each story has `id`, `status`, `priority`, `blockedBy`).
3. **Lock acquisition** (`spectrum.sh:78-94`): Uses a PID-based lockfile at `.prism/local/spectrum.lock` to prevent concurrent Spectrum runs. Detects and cleans up stale locks.
4. **Story selection** (`spectrum.sh:180-197`): Deterministic jq query selects the highest-priority pending story that is not blocked by an incomplete story. No LLM involvement in selection.
5. **Iteration execution** (`spectrum.sh:301-322`): Spawns `claude --dangerously-skip-permissions --print` with a prompt directing Claude to execute a specific story using the `/prism-spectrum` workflow.
6. **Signal detection** (`spectrum.sh:324-361`): Parses Claude's stdout for XML signal tags and maps them to return codes (0=complete, 1=continue, 2=retry, 3=error).
7. **Post-iteration verification** (`spectrum.sh:431-443`): Independently checks stories.json state after each iteration. If remaining count is 0, overrides signal to COMPLETE. If remaining is unchanged but Claude said "continue", treats as retry.
8. **Error tracking** (`spectrum.sh:482-485`): Stops after 3 consecutive errors (`max_consecutive_errors=3`).
9. **Progress logging** (`spectrum.sh:222-239`): Appends iteration outcome to the progress file.

**Configuration** (environment variables):
- `SPECTRUM_MAX_ITERATIONS`: default 50
- `SPECTRUM_VERBOSE`: default false (when true, tees Claude output to stderr)
- `SPECTRUM_PAUSE`: default 2 seconds between iterations

**Data flow**:
```
spectrum.sh → selects story from stories.json
           → spawns claude CLI with prompt referencing story ID
           → claude runs prism-spectrum skill
           → claude emits signal tag in output
           → spectrum.sh parses signal
           → updates stories.json status
           → appends to progress.md
           → loops or stops
```

**Progress path derivation** (`spectrum.sh:41-61`): Supports two layouts:
- Flat: `.prism/stories/stories.json` maps to `.prism/shared/spectrum/progress.md`
- Epic-scoped: `.prism/stories/<epic>/stories.json` maps to `.prism/shared/spectrum/<epic>/progress.md`

### prism-spectrum Skill — Inner Session Workflow

**Location**: `skills/prism-spectrum/SKILL.md`

**Philosophy** (5 principles at `SKILL.md:13-17`):
1. Fresh Start — each session loads all context from files (no prior context)
2. One Story — execute exactly one story per invocation
3. Quality Gates — must pass typecheck/lint/test before commit
4. Atomic Commits — one story = one commit
5. Learn Forward — capture learnings for future iterations

**Workflow steps**:

1. **Load State** (`SKILL.md:36-49`): Read stories.json, progress.md, and CLAUDE.md. Parse story statuses.
2. **Load Epic + Story Context** (`SKILL.md:51-62`): Extract `epic.decisions`, `epic.risks`, `epic.outOfScope`, `epic.references`, and the story's `context.why`, `context.risks`, `context.patterns`, `context.edgeCases`.
3. **Graph Verification** (`SKILL.md:64-79`): If codebase-memory-mcp is available, run `index_repository` and `trace_call_path` for each `graphTargets` entry. Emit `<spectrum-blocked>` if blast radius has changed. After implementation, run dead code check.
4. **Identify Story** (`SKILL.md:83`): Use the story ID provided in the prompt by spectrum.sh.
5. **Announce Story** (`SKILL.md:88-96`): Output `<spectrum-story>` tag with ID, title, priority, files.
6. **Implement Story** (`SKILL.md:98-113`): Read all files in the story's `files` array. Check for a manifest file at `.prism/stories/<story-id>-manifest.json`. If it exists, implement one requirement at a time respecting `depends_on` ordering. Otherwise, follow the story's `steps`.
7. **Run Quality Gates** (`SKILL.md:114-137`): Execute all commands from `epic.qualityGates`. On failure, run auto-debug investigation (3 parallel agents: log-investigator, state-investigator, git-investigator), record findings, emit `<spectrum-retry>`.
8. **Browser Verification** (`SKILL.md:139-159`): If UI files were modified, attempt Playwright-based screenshot and console error checks.
9. **Commit Changes** (`SKILL.md:161-175`): Atomic commit with `[STORY-XXX]` prefix.
10. **Update State Files** (`SKILL.md:177-181`): Set story status to "complete" in stories.json, append learnings to progress.md.
11. **Signal Continuation** (`SKILL.md:183-191`): Emit one of five signal tags.

### Signal Protocol

| Signal | Meaning | spectrum.sh Behavior |
|--------|---------|---------------------|
| `<spectrum-continue>` | Story completed, more remain | Continue to next iteration |
| `<promise>COMPLETE</promise>` | All stories done | Stop loop successfully |
| `<spectrum-retry reason="...">` | Retriable failure | Reset story to pending, retry |
| `<spectrum-blocked reason="...">` | Story cannot proceed | Try next available story |
| `<spectrum-error reason="...">` | Fatal error | Increment error counter, may stop |

### decompose_plan Command — Story Generation

**Location**: `commands/decompose_plan.md`

**How it works**: Converts an approved Prism plan into Spectrum-compatible `stories.json`. Key aspects:
- Analyzes phase complexity to determine story boundaries (`decompose_plan.md:28-40`)
- Stories must be atomic, testable, independent, and small (15-30 min AI work) (`decompose_plan.md:42-58`)
- Establishes dependency ordering: Types/Interfaces (1-10) -> Implementation (11-20) -> Integration (21-30) -> Tests (31-40) -> Polish (41-50) (`decompose_plan.md:68-84`)
- Generates story manifests (per-story requirement breakdown) (`decompose_plan.md:256-267`)
- Optionally generates cross-domain contracts (`decompose_plan.md:269-278`)
- Presents decomposition for user review before generating files (`decompose_plan.md:167-210`)

### SpectrumEngine — VS Code Native Implementation

**Location**: `packages/prism-core/src/core/controller/prism/spectrum.ts`

**How it works**: TypeScript state machine that mirrors spectrum.sh logic for VS Code:
- Six execution states: idle, running, paused, complete, maxIterations, error (`spectrum.ts:20-26`)
- `SpectrumState` interface tracks iteration count, current story, progress percentage, elapsed time, consecutive errors, signal history, recent tool activities (last 50), and execution logs (last 200) (`spectrum.ts:41-63`)
- `SpectrumConfig` mirrors shell env vars: maxIterations (50), pauseMs (2000), verbose (false), maxConsecutiveErrors (3) (`spectrum.ts:84-100`)
- `SpectrumEngine` class manages state transitions: start, pause, resume, stop, complete, error, reset (`spectrum.ts:112-353`)
- Elapsed time tracked via 1-second interval timer (`spectrum.ts:328-333`)
- Signal recording resets consecutive error count on success, increments on error (`spectrum.ts:268-286`)

### Debug Integration

**Location**: Referenced in `skills/prism-spectrum/SKILL.md:212-239`

**How it works**: When quality gates fail during Spectrum execution:
1. Capture full error output
2. Spawn 3 debug agents in parallel: `log-investigator`, `state-investigator`, `git-investigator`
3. Synthesize findings into root cause hypothesis
4. Record in progress.md with error output, investigation findings, root cause, suggested fix
5. Include debug context in `<spectrum-retry>` signal XML so the next fresh session can act on it

## Patterns Found

### Fresh Context Per Iteration Pattern

**Example at**: `scripts/spectrum.sh:306-307`

The prompt sent to each Claude session includes the story ID and file paths, so the fresh session can load all state from disk:
```bash
local prompt="Execute story $story_id from $STORIES_FILE using the /prism-spectrum workflow. Progress file: $PROGRESS_FILE. The story has been pre-selected — do not pick a different story."
```

**Also used in**:
- `skills/prism-spectrum/SKILL.md:36-43` — "Read ALL state files completely before doing anything"
- `skills/prism-spectrum/SKILL.md:1-5` — Philosophy: "Fresh Start: Each session starts clean"

### Deterministic Story Selection Pattern

**Example at**: `scripts/spectrum.sh:180-197`

Story selection is done entirely in jq with no LLM involvement — selects pending stories whose blockers are all complete, sorted by priority:
```bash
jq -r '[.stories[] | select(.status != "complete") | select((.blockedBy == null) or ...)] | sort_by(.priority) | first | .id // empty'
```

### Post-Iteration State Verification Pattern

**Example at**: `scripts/spectrum.sh:431-443`

spectrum.sh independently verifies story state after each iteration rather than trusting Claude's signal. If remaining stories dropped to 0, it overrides any signal to COMPLETE. If remaining is unchanged but Claude said "continue", it treats as retry.

### Lockfile Concurrency Protection Pattern

**Example at**: `scripts/spectrum.sh:78-94`

PID-based lockfile prevents concurrent Spectrum runs. Detects stale locks by checking if the stored PID is still alive via `kill -0`.

## Historical Context

From `.prism/` directory:
- `.prism/shared/docs/update/prism-v2-update/spectrum-migration-summary.md` — Spectrum migration summary document
- No existing research documents found specifically about Spectrum

## Architecture Notes

- **Two implementations**: Spectrum exists as both a shell script (for CLI/terminal use) and a TypeScript state machine (for VS Code extension use). Both follow the same signal protocol.
- **State persistence through files**: Because each iteration gets a fresh Claude session, all state persists through `stories.json` (story status) and `progress.md` (accumulated learnings). No in-memory state carries between iterations.
- **Defensive verification**: spectrum.sh does not trust Claude's signal output blindly — it independently checks stories.json state after each iteration and can override signals.
- **Three-tier architecture**: `decompose_plan` (plan -> stories) -> `spectrum.sh` (story orchestration loop) -> `prism-spectrum` (single-story execution per session).
- **Error recovery**: Retry mechanism with debug context propagation. Failed stories are reset to "pending" and debug findings are written to progress.md so the next fresh session can read them.

## Open Questions

- [ ] How does `spectrum-runner.ts` handle the streaming JSON output format (`--output-format stream-json`) differently from spectrum.sh's plain text parsing?
- [ ] What is the full content of `contracts-convention.md` and how are cross-domain contracts used in practice?
- [ ] How does the VS Code Spectrum UI (referenced in `prism-docs/docs/cli/screens/spectrum.md`) visualize the execution state?

## Code References

Quick navigation:

| Reference | Description |
|-----------|-------------|
| `scripts/spectrum.sh:1-518` | Full Spectrum shell orchestrator |
| `scripts/spectrum.sh:180-197` | Story selection via jq (deterministic, no LLM) |
| `scripts/spectrum.sh:301-322` | Single iteration execution (spawns Claude CLI) |
| `scripts/spectrum.sh:324-361` | Signal detection from Claude output |
| `scripts/spectrum.sh:364-492` | Main loop with error tracking and post-iteration verification |
| `skills/prism-spectrum/SKILL.md:1-255` | Full prism-spectrum skill definition |
| `skills/prism-spectrum/SKILL.md:36-79` | State loading + graph verification |
| `skills/prism-spectrum/SKILL.md:98-113` | Implementation with manifest support |
| `skills/prism-spectrum/SKILL.md:114-159` | Quality gates + browser verification |
| `skills/prism-spectrum/SKILL.md:183-191` | Signal emission protocol |
| `skills/prism-spectrum/SKILL.md:212-239` | Debug integration on quality gate failure |
| `commands/decompose_plan.md:1-335` | Plan-to-stories decomposition command |
| `packages/prism-core/src/core/controller/prism/spectrum.ts:112-353` | SpectrumEngine class (VS Code state machine) |
| `packages/prism-core/src/core/controller/prism/spectrum.ts:20-26` | SpectrumExecutionState type |
| `packages/prism-core/src/core/controller/prism/spectrum.ts:41-63` | SpectrumState interface |

## Workflow Simulation Notes

This research was conducted following the v2.4.8 `prism-research` skill workflow:

1. **Step 0 (Read Mentioned Files)**: Read `scripts/spectrum.sh` and `skills/prism-spectrum/SKILL.md` in full before any analysis.
2. **Step 1 (Check Existing Knowledge)**: Simulated prism-locator agent — searched `.prism/shared/research/` for existing Spectrum research. None found. Found migration summary at `.prism/shared/docs/update/prism-v2-update/spectrum-migration-summary.md`.
3. **Step 2 (Locate Code)**: Simulated codebase-locator agent — used Glob for `**/spectrum*` pattern, found 13 spectrum-related files across scripts, skills, packages, and docs.
4. **Step 3 (Analyze Components)**: Simulated codebase-analyzer agent — read and analyzed spectrum.sh (518 lines), SKILL.md (255 lines), decompose_plan.md (335 lines), and spectrum.ts (353 lines).
5. **Step 4 (Find Patterns)**: Simulated codebase-pattern-finder agent — identified 4 key patterns: fresh context per iteration, deterministic story selection, post-iteration state verification, lockfile concurrency protection.
6. **Step 5 (External Research)**: Not needed — all components are internal to the project.
7. **Step 6 (Save Findings)**: Output saved to this file.

No source files were modified during this research.
