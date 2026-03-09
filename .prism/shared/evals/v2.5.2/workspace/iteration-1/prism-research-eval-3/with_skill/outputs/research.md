---
date: 2026-03-08
researcher: Claude
git_commit: 3b1ceb82b2010d270a0a458d278638119fb44b0b
branch: main
repository: prism-plugin
topic: "Spectrum Autonomous Execution Workflow"
tags: [research, spectrum, autonomous-execution, prism-spectrum, stories]
status: complete
---

# Research: Spectrum Autonomous Execution Workflow

## Research Question

How does the Spectrum autonomous execution workflow work in this project? What are the roles of `spectrum.sh` and the `prism-spectrum` skill?

## Summary

Spectrum is an autonomous execution system that implements large features by decomposing them into stories and executing one story per fresh Claude CLI session in a loop. The shell script `scripts/spectrum.sh` is the outer orchestrator that manages the iteration loop, story selection, signal parsing, and state persistence. The `prism-spectrum` skill (`skills/prism-spectrum/SKILL.md`) defines the inner workflow that each Claude session follows to implement a single story, run quality gates, commit changes, and emit a continuation signal. There is also a TypeScript implementation (`packages/prism-core/`) that mirrors the shell loop for VS Code-native execution.

## Files Discovered

| File | Purpose |
|------|---------|
| `scripts/spectrum.sh` | Bash outer loop orchestrator — spawns Claude sessions, parses signals, manages state |
| `skills/prism-spectrum/SKILL.md` | Inner per-session skill — implements one story with quality gates and atomic commits |
| `commands/decompose_plan.md` | Command to convert a Prism plan into `stories.json` for Spectrum consumption |
| `packages/prism-core/src/core/controller/prism/spectrum.ts` | TypeScript state machine (`SpectrumEngine`) for VS Code-native Spectrum execution |
| `packages/prism-core/src/core/controller/prism/spectrum-runner.ts` | TypeScript single-iteration executor (`SpectrumRunner`) using `PluginBridge` to spawn Claude CLI |
| `skills/prism-spectrum/references/story-manifest-schema.md` | Schema for per-story manifest files |
| `skills/prism-spectrum/references/contracts-convention.md` | Convention for cross-domain contracts between stories |
| `agents/log-investigator.md` | Debug agent spawned on quality gate failure |
| `agents/state-investigator.md` | Debug agent spawned on quality gate failure |
| `agents/git-investigator.md` | Debug agent spawned on quality gate failure |
| `agents/visual-regression-grader.md` | Agent for evaluating visual regression diffs |

## Component Analysis

### 1. spectrum.sh — The Outer Loop Orchestrator

**Location**: `scripts/spectrum.sh`

**How it works**:

The script implements a controlled iteration loop that spawns fresh Claude Code sessions to execute stories one at a time. Key phases:

1. **Prerequisites check** (`check_prerequisites`, line 102): Verifies `claude` CLI and `jq` are installed, and that the stories file exists.

2. **Schema validation** (`validate_schema`, line 124): Validates `stories.json` has required top-level fields (`epic`, `stories`), that `.stories` is an array, and that each story has `id`, `status`, `priority`, and `blockedBy` fields.

3. **Lockfile management** (`acquire_lock`, line 78): Uses a PID-based lockfile at `.prism/local/spectrum.lock` to prevent concurrent Spectrum runs. Detects stale locks by checking if the recorded PID is still alive.

4. **Progress initialization** (`init_progress`, line 257): Creates the progress markdown file with YAML frontmatter if it doesn't exist.

5. **Story selection** (`select_next_story`, line 180): Deterministic selection using `jq` — finds all stories that are not `"complete"` and whose `blockedBy` is either null, empty, or references a completed story, then sorts by `.priority` and picks the first.

6. **Iteration execution** (`run_iteration`, line 301): Marks the story as `in_progress`, then spawns a fresh Claude CLI session:
   ```
   claude --dangerously-skip-permissions --print "$prompt"
   ```
   The prompt instructs Claude to "Execute story STORY-XXX from PATH using the /prism-spectrum workflow."

7. **Signal parsing** (`check_signals`, line 325): Parses the Claude output for XML-style signal tags:
   - `<promise>COMPLETE</promise>` — all stories done (return 0)
   - `<spectrum-continue>` — story finished, continue loop (return 1)
   - `<spectrum-retry>` — retry the same story (return 2)
   - `<spectrum-blocked>` — story blocked, try next (return 1)
   - `<spectrum-error>` — fatal error (return 3)
   - No signal detected — treated as retry (return 2)

8. **Post-iteration verification** (line 431): Independently checks `stories.json` state after each iteration. If all stories are complete, overrides the signal. If remaining count is unchanged but Claude said "continue," treats it as a retry.

9. **Error thresholds** (line 482): Stops after 3 consecutive errors (`max_consecutive_errors`).

10. **Progress logging** (`append_progress`, line 222): Appends an entry to `progress.md` with iteration number, story ID, outcome, and progress counts.

**Configuration via environment variables**:
- `SPECTRUM_MAX_ITERATIONS` (default: 50) — cap on total iterations
- `SPECTRUM_VERBOSE` (default: false) — enables tee to stderr for real-time output
- `SPECTRUM_PAUSE` (default: 2 seconds) — delay between iterations

**Progress path derivation** (`derive_progress_path`, line 41): Supports two layouts:
- Flat: `.prism/stories/stories.json` maps to `.prism/shared/spectrum/progress.md`
- Epic-scoped: `.prism/stories/<epic>/stories.json` maps to `.prism/shared/spectrum/<epic>/progress.md`

**Data flow**:
```
spectrum.sh main() → check_prerequisites → validate_schema → acquire_lock → init_progress
  └─ while loop:
       select_next_story (jq) → update_story_status("in_progress")
       → run_iteration (claude CLI) → check_signals (grep)
       → post-iteration verification → append_progress
       → handle signal (continue / retry / error / complete)
```

### 2. prism-spectrum Skill — The Inner Session Workflow

**Location**: `skills/prism-spectrum/SKILL.md`

**How it works**:

This skill defines what each fresh Claude session does when executing a single story. It follows a strict 8-step workflow:

1. **Load State** (step 1): Reads `stories.json`, `progress.md`, and `CLAUDE.md` completely. Parses story counts and statuses.

2. **Load Epic + Story Context** (step 1b): Extracts `epic.decisions`, `epic.risks`, `epic.outOfScope`, `epic.references`, and the story's `context.why`, `context.risks`, `context.patterns`, `context.edgeCases`.

3. **Graph Verification** (step 1c, optional): If `codebase-memory-mcp` is available, runs `index_repository`, traces call paths for `graphTargets`, and checks blast radius. Can emit `<spectrum-blocked>` if blast radius has changed.

4. **Identify Story** (step 2): Uses the story ID provided in the prompt by `spectrum.sh`. Does not pick a different story.

5. **Announce Story** (step 3): Outputs `<spectrum-story>` XML tag with ID, title, priority, and files.

6. **Implement Story** (step 4): Reads all files in the story's `files` array first. Checks for a manifest file at `.prism/stories/<story-id>-manifest.json`. If manifest exists, implements one requirement at a time respecting `depends_on` ordering and runs each requirement's `gate` command. Otherwise follows the story's `steps` array.

7. **Run Quality Gates** (step 5): Executes all commands from `epic.qualityGates`. On failure, spawns 3 debug agents in parallel (`log-investigator`, `state-investigator`, `git-investigator`), records findings, and emits `<spectrum-retry>`.

8. **Browser Verification** (step 5b, optional): For UI file changes, uses `playwright-cli` to take screenshots and check console errors.

9. **Visual Regression** (step 5c, optional): Checks for baselines at `.prism/shared/validation/baselines/{story-id}/`, runs `scripts/visual-regression.sh`, and spawns `visual-regression-grader` agent on diff.

10. **Commit Changes** (step 6): Atomic commit with message format `[STORY-XXX] Story title`.

11. **Update State Files** (step 7): Sets story status to `"complete"` with `completedAt` and `commitHash`. Appends learnings to `progress.md`.

12. **Signal Continuation** (step 8): Emits one of the signal tags that `spectrum.sh` parses.

**Philosophy**: Fresh context per iteration (no context degradation), one story per invocation, quality gates mandatory, atomic commits, and learning forward through `progress.md`.

### 3. decompose_plan Command — Plan-to-Stories Conversion

**Location**: `commands/decompose_plan.md`

**How it works**:

Converts an approved Prism plan into `stories.json`. Key aspects:

- **Sizing**: Each story should be completable in 15-30 minutes of AI work, describable in 2-3 sentences.
- **Priority ranges**: Foundation (1-10), Core Implementation (11-20), Integration (21-30), Tests (31-40), Documentation (41-50).
- **Dependencies**: Set `blockedBy` when Story B modifies files created by Story A, imports from Story A, or tests Story A.
- **Context enrichment**: Extracts `decisions`, `references`, `outOfScope`, `risks` from the plan into the `epic` object, and per-story `context` with `why`, `risks`, `edgeCases`, `patterns`, `graphTargets`.
- **Manifests**: Generates per-story manifest files at `.prism/stories/<story-id>-manifest.json`.
- **Contracts**: Creates `.prism/shared/contracts/interfaces.json` when cross-domain dependencies exist.

### 4. TypeScript Implementation — VS Code-Native Spectrum

**Location**: `packages/prism-core/src/core/controller/prism/`

**How it works**:

Two classes mirror the shell-based workflow for use within the VS Code extension and Electron app:

**SpectrumEngine** (`spectrum.ts`):
- Full state machine with states: `idle`, `running`, `paused`, `complete`, `maxIterations`, `error`
- Tracks: current iteration, current story ID, progress percentage, elapsed time, consecutive errors, last signal type/content, recent tool activities (last 50), execution logs (last 200)
- Provides state transitions: `start()`, `pause()`, `resume()`, `stop()`, `complete()`, `error()`, `reset()`
- Broadcasts state changes via `_onStateChange` callback for webview updates
- Runs an elapsed-time timer that pushes state every second

**SpectrumRunner** (`spectrum-runner.ts`):
- Executes single iterations via `PluginBridge.executeSpectrum()`
- Uses `StoriesManager` for story selection and status updates
- Uses `parseSignal()` from `@prism-core/prism/signals` to parse Claude output
- Emits events: `story_started`, `story_complete`, `story_blocked`, `story_retry`, `story_error`, `all_complete`, `no_next_story`, `tool_activity`, `log`
- Appends entries to `ProgressFile` on completion

### 5. Signal Protocol

**Used across all implementations**:

| Signal Tag | Meaning | spectrum.sh Action |
|---|---|---|
| `<promise>COMPLETE</promise>` | All stories done | Break loop, exit 0 |
| `<spectrum-continue>STORY_COMPLETE: STORY-XXX</spectrum-continue>` | Story completed, more remain | Continue to next iteration |
| `<spectrum-retry reason="...">details</spectrum-retry>` | Story failed, should retry | Reset story to pending, increment error count |
| `<spectrum-blocked reason="...">details</spectrum-blocked>` | Story is blocked | Try next available story |
| `<spectrum-error reason="...">details</spectrum-error>` | Fatal error | Stop execution |

### 6. stories.json Schema

**Location**: Created by `/decompose_plan`, consumed by both `spectrum.sh` and `prism-spectrum`

**Structure**:
- `epic`: Contains `name`, `source` (path to plan), `qualityGates` (array of commands), `decisions`, `references`, `outOfScope`, `risks`
- `stories[]`: Each has `id`, `title`, `description`, `priority` (lower = first), `status` (`pending`/`in_progress`/`complete`), `blockedBy` (null or story ID), `files[]` (with `path` and `action`), `steps[]` (with `description` and `done`), and optional `context` (`why`, `risks`, `edgeCases`, `patterns`, `graphTargets`)

### 7. Debug Integration

**Triggered when**: Quality gates fail during `prism-spectrum` execution (step 5).

**How it works**:
1. Captures full error output (messages, file:line refs, stack traces)
2. Spawns 3 agents in parallel:
   - `log-investigator` — checks logs for related errors
   - `state-investigator` — checks app state for anomalies
   - `git-investigator` — checks recent changes that might cause failure
3. Synthesizes findings into root cause hypothesis
4. Records in `progress.md` for the next iteration to read
5. Emits `<spectrum-retry>` with structured debug context (error, root_cause, suggested_fix, files)

## Patterns Found

### Fresh Context Pattern

**Example at**: `scripts/spectrum.sh:306-307`

Each iteration spawns a completely fresh Claude session via `claude --print`. No context carries between sessions. State persists exclusively through files (`stories.json`, `progress.md`, git commits).

**Also used in**:
- `skills/prism-spectrum/SKILL.md:36-43` (Load State step reads everything fresh)
- `packages/prism-core/src/core/controller/prism/spectrum-runner.ts:125` (PluginBridge.executeSpectrum spawns new session)

### Deterministic Story Selection Pattern

**Example at**: `scripts/spectrum.sh:180-197`

Story selection is done by the shell script (not by the AI), using a `jq` query that filters for unblocked pending stories sorted by priority. This prevents the AI from making non-deterministic choices.

**Also used in**:
- `packages/prism-core/src/core/controller/prism/spectrum-runner.ts:99` (StoriesManager.getNextStory)
- `skills/prism-spectrum/SKILL.md:83` ("do not pick a different story")

### Post-Iteration State Verification Pattern

**Example at**: `scripts/spectrum.sh:431-443`

The shell script independently verifies the stories.json state after each iteration, not trusting the AI's signal alone. If all stories are complete but the signal wasn't "complete," it overrides. If no progress was made but the signal was "continue," it downgrades to "retry."

### Lockfile Concurrency Protection Pattern

**Example at**: `scripts/spectrum.sh:78-94`

PID-based lockfile at `.prism/local/spectrum.lock` prevents multiple Spectrum runs. Detects stale locks by checking `kill -0` on the stored PID.

## Historical Context

From `.prism/` directory:

- `.prism/shared/docs/update/prism-v2-update/spectrum-migration-summary.md` — Documentation about migrating Spectrum to the new architecture
- Branch `feat/spectrum-migration` exists in git history

## Architecture Notes

- **Two runtimes**: Spectrum can run either as a shell script (`spectrum.sh` for CLI users) or as a TypeScript engine (`SpectrumEngine` + `SpectrumRunner` for VS Code/Electron users). Both implement the same loop logic and signal protocol.
- **Convention**: Stories are sized for 15-30 minutes of AI work each, with priority ranges (1-10 foundation, 11-20 core, 21-30 integration, 31-40 tests, 41-50 polish).
- **Decision**: `--dangerously-skip-permissions` is used for autonomous operation — Spectrum is designed for unattended execution.
- **Pattern**: The signal protocol uses XML-style tags embedded in Claude's text output, parsed via grep (shell) or `parseSignal()` (TypeScript).
- **Convention**: Epic-scoped layouts are supported (`stories/<epic>/stories.json`) alongside flat layouts.

## Open Questions

- [ ] How does `PluginBridge.executeSpectrum()` spawn the Claude CLI process? (referenced in spectrum-runner.ts:125 but bridge code not examined)
- [ ] What does `parseSignal()` from `@prism-core/prism/signals` look like? (TypeScript signal parsing logic)
- [ ] How does the VS Code webview consume the `SpectrumEngine` state for the dashboard UI?
- [ ] What is the full schema of the story manifest files? (referenced but not read in this research)

## Code References

Quick navigation:

| Reference | Description |
|-----------|-------------|
| `scripts/spectrum.sh:1-518` | Full outer loop orchestrator |
| `scripts/spectrum.sh:180-197` | Story selection logic (jq query) |
| `scripts/spectrum.sh:299-322` | Single iteration execution (Claude CLI spawn) |
| `scripts/spectrum.sh:325-361` | Signal parsing (grep-based) |
| `scripts/spectrum.sh:431-443` | Post-iteration state verification |
| `scripts/spectrum.sh:78-94` | Lockfile concurrency protection |
| `skills/prism-spectrum/SKILL.md:1-290` | Full inner session workflow |
| `skills/prism-spectrum/SKILL.md:36-43` | Load State step |
| `skills/prism-spectrum/SKILL.md:98-112` | Implementation rules |
| `skills/prism-spectrum/SKILL.md:116-137` | Quality gates and auto-debug |
| `skills/prism-spectrum/SKILL.md:219-227` | Signal emission definitions |
| `skills/prism-spectrum/SKILL.md:248-275` | Debug integration with 3 parallel agents |
| `commands/decompose_plan.md:1-335` | Plan-to-stories conversion command |
| `packages/prism-core/src/core/controller/prism/spectrum.ts:112-353` | SpectrumEngine state machine class |
| `packages/prism-core/src/core/controller/prism/spectrum-runner.ts:48-259` | SpectrumRunner single-iteration executor |

## Workflow Steps Followed

1. **Read mentioned files first** (Step 0): Read `scripts/spectrum.sh` and `skills/prism-spectrum/SKILL.md` fully before analysis.
2. **Check existing knowledge** (Step 1): Searched `.prism/shared/research/` for existing spectrum research — none found.
3. **Locate code** (Step 2): Used Glob to find all spectrum-related files across the repository.
4. **Analyze components** (Step 3): Read and analyzed `spectrum.sh`, `SKILL.md`, `decompose_plan.md`, `spectrum.ts`, and `spectrum-runner.ts`.
5. **Find patterns** (Step 4): Identified fresh context, deterministic selection, post-iteration verification, and lockfile patterns.
6. **Save findings** (Step 6): Output saved to this file.
