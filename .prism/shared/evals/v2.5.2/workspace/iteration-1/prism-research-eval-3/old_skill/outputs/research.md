---
topic: Spectrum Autonomous Execution Workflow
date: 2026-03-08
researcher: prism-research (v2.4.8 baseline)
---

# Spectrum Autonomous Execution Workflow

## Research Question

How does the Spectrum autonomous execution workflow work in this project? What are the roles of `spectrum.sh` and the `prism-spectrum` skill?

## Summary

Spectrum is an autonomous execution system that implements large features by running one story per fresh Claude Code session in a loop. The shell script `scripts/spectrum.sh` acts as the outer orchestrator: it selects stories, spawns Claude sessions, parses signal tags from output, and manages state. The `prism-spectrum` skill is the inner executor: it runs inside each Claude session, implements exactly one story, runs quality gates, commits changes, and emits signal tags back to the shell. State persists through `stories.json` (story status) and `progress.md` (accumulated learnings), not through AI context.

## Files Discovered

| File | Purpose |
|------|---------|
| `scripts/spectrum.sh` | Outer loop orchestrator — bash script that spawns Claude sessions |
| `skills/prism-spectrum/SKILL.md` | Inner executor skill — implements one story per session |
| `commands/decompose_plan.md` | Converts approved plans into `stories.json` for Spectrum |
| `cmd/prism-cli/domain/signals.go` | Go signal parser for CLI dashboard (regex-based) |
| `cmd/prism-cli/domain/signals_test.go` | Tests for signal parsing |
| `cmd/prism-cli/app/plugin_spectrum.go` | CLI TUI dashboard Spectrum screen (Bubble Tea) |
| `packages/prism-core/src/core/controller/prism/spectrum.ts` | VS Code-native Spectrum state machine (TypeScript) |
| `packages/prism-core/src/core/controller/prism/spectrum-runner.ts` | VS Code Spectrum runner |
| `skills/prism-spectrum/references/story-manifest-schema.md` | Schema for per-story manifest files |
| `skills/prism-spectrum/references/contracts-convention.md` | Cross-story contract convention |
| `agents/log-investigator.md` | Debug agent spawned on quality gate failure |
| `agents/state-investigator.md` | Debug agent spawned on quality gate failure |
| `agents/git-investigator.md` | Debug agent spawned on quality gate failure |

## Component Analysis

### 1. The Outer Loop: `scripts/spectrum.sh`

**Location**: `scripts/spectrum.sh` (518 lines, bash)

The shell script is the top-level orchestrator. It runs entirely outside of Claude and manages the iteration loop.

**Execution flow**:
1. **Prerequisites check** (lines 102-121): Verifies `claude` CLI and `jq` are installed, and `stories.json` exists.
2. **Schema validation** (lines 124-177): Validates `stories.json` has required fields (`epic`, `stories`, each story has `id`, `status`, `priority`, `blockedBy`).
3. **Lock acquisition** (lines 78-94): Creates a lockfile at `.prism/local/spectrum.lock` with PID to prevent concurrent runs. Detects and cleans stale locks.
4. **Progress initialization** (lines 257-282): Creates `progress.md` with YAML frontmatter if it does not exist.
5. **Main loop** (lines 390-492): Iterates up to `SPECTRUM_MAX_ITERATIONS` (default 50):
   - Counts remaining stories
   - Calls `select_next_story` — deterministic jq query: pending, unblocked (or blocked-by-complete), lowest priority number
   - Marks story as `in_progress` in stories.json
   - Calls `run_iteration` which invokes `claude --dangerously-skip-permissions --print` with a prompt referencing the story ID and paths
   - Parses output for signal tags via `check_signals`
   - Post-iteration verification: independently checks stories.json state — overrides signal if all complete, or detects no-progress-but-continue as retry
   - Appends progress entry
   - Handles signal outcomes (continue, retry resets to pending, error stops after 3 consecutive)
   - Pauses `SPECTRUM_PAUSE` seconds (default 2) between iterations

**Story selection** (`select_next_story`, lines 180-197): Uses jq to find stories where status is not "complete" AND (`blockedBy` is null/empty OR the blocking story is complete), sorted by priority ascending, returns the first one's ID.

**Signal protocol** (`check_signals`, lines 325-361):
- Return code 0: `<promise>COMPLETE</promise>` — all done
- Return code 1: `<spectrum-continue>` — story done, continue loop
- Return code 2: `<spectrum-retry>` — retry this story (or no signal detected)
- Return code 1 (for blocked): `<spectrum-blocked>` — skip to next available
- Return code 3: `<spectrum-error>` — fatal, stop

**Configuration via environment variables**:
- `SPECTRUM_MAX_ITERATIONS` (default 50)
- `SPECTRUM_VERBOSE` (default false) — tees Claude output to stderr
- `SPECTRUM_PAUSE` (default 2 seconds)

**Progress path derivation** (lines 41-61): Supports both flat layout (`.prism/stories/stories.json` -> `.prism/shared/spectrum/progress.md`) and epic-scoped layout (`.prism/stories/<epic>/stories.json` -> `.prism/shared/spectrum/<epic>/progress.md`).

### 2. The Inner Executor: `skills/prism-spectrum/SKILL.md`

**Location**: `skills/prism-spectrum/SKILL.md` (291 lines)

This skill runs inside each fresh Claude session. It is triggered by the prompt that `spectrum.sh` sends to `claude --print`.

**Philosophy**: Fresh start (load all context from files), one story only, quality gates mandatory, atomic commits, learn forward.

**Workflow steps**:

1. **Load State** (step 1): Read stories.json, progress.md, and CLAUDE.md completely before doing anything.
2. **Load Epic + Story Context** (step 1b): Extract `epic.decisions`, `epic.risks`, `epic.outOfScope`, `epic.references`, and story-level context (`why`, `risks`, `patterns`, `edgeCases`).
3. **Graph Verification** (step 1c, optional): If codebase-memory-mcp is available, run `index_repository`, trace call paths for `graphTargets`, check blast radius. Skip silently if unavailable.
4. **Identify Story** (step 2): Story ID comes from the prompt (pre-selected by spectrum.sh). Fallback: pick highest-priority incomplete unblocked story.
5. **Announce Story** (step 3): Output `<spectrum-story>` tag with ID, title, priority, files.
6. **Implement** (step 4): Read all files in story's `files` array first. Check for manifest file at `.prism/stories/<story-id>-manifest.json`. If manifest exists, implement requirements one at a time respecting `depends_on` ordering. Otherwise follow story `steps`. Mark steps as done.
7. **Quality Gates** (step 5): Execute all commands from `epic.qualityGates`. If any fail, run auto-debug (spawn 3 parallel debug agents: log-investigator, state-investigator, git-investigator), record findings, emit `<spectrum-retry>`.
8. **Browser Verification** (step 5b, optional): If UI files modified and playwright-cli available, screenshot and check console errors.
9. **Visual Regression** (step 5c, optional): If baselines exist, run visual regression script, spawn visual-regression-grader agent on failure.
10. **Commit** (step 6): `git add` specific files, `git commit` with story ID in message.
11. **Update State** (step 7): Set story status to "complete" with timestamp and commit hash in stories.json. Append learnings to progress.md.
12. **Signal** (step 8): Emit appropriate signal tag for spectrum.sh to parse.

### 3. Plan Decomposition: `commands/decompose_plan.md`

**Location**: `commands/decompose_plan.md` (335 lines)

This is the bridge between planning and execution. It converts an approved Prism plan into `stories.json` format. Key aspects:
- Analyzes phase complexity to determine single vs. multiple stories
- Stories must be atomic (one commit), testable, independent, and small (15-30 min AI work)
- Sets priority ranges: Foundation (1-10), Core (11-20), Integration (21-30), Tests (31-40), Polish (41-50)
- Establishes `blockedBy` dependencies
- Extracts quality gates from the plan
- Generates story manifests and cross-domain contracts if applicable
- Presents decomposition for user review before generating files

### 4. CLI Dashboard Integration

**Signal parsing in Go** (`cmd/prism-cli/domain/signals.go`): The CLI dashboard has its own signal parser using regex patterns matching the same XML-like tags. It defines `SignalType` enum (None, Complete, Continue, Retry, Blocked, Error) and parses both signals and `<spectrum-story>` announcements. Priority order: Complete > Error > Retry > Blocked > Continue.

**TUI dashboard** (`cmd/prism-cli/app/plugin_spectrum.go`): Implements a Bubble Tea model with spring physics animations (via Harmonica) for progress bars, story completion "pop" effects, active story pulse breathing, and log entry slide-in animations.

### 5. VS Code Integration

**State machine** (`packages/prism-core/src/core/controller/prism/spectrum.ts`): A TypeScript implementation of the Spectrum execution engine for VS Code. Defines states: idle, running, paused, complete, maxIterations, error. Broadcasts `SpectrumState` to the webview including current iteration, progress percentage, elapsed time, consecutive errors, last signal, and recent tool activities.

## Patterns Found

### Signal Protocol Pattern
The signal protocol uses XML-like tags embedded in Claude's text output. This same protocol is parsed by three independent implementations:
- `scripts/spectrum.sh:325-361` — bash grep-based detection
- `cmd/prism-cli/domain/signals.go:56-101` — Go regex-based parsing
- `packages/prism-core/src/core/controller/prism/spectrum.ts` — TypeScript state machine

### Fresh Context Per Iteration Pattern
Each Claude session starts from scratch. Context is never carried in AI memory. Instead:
- `stories.json` holds story status and step completion
- `progress.md` accumulates learnings across iterations
- Git commits persist actual code changes
- This prevents context window degradation over long-running features

### Deterministic Story Selection Pattern
Story selection happens outside Claude (in bash/jq), not inside the AI session. The shell picks the next story and passes it in the prompt. This prevents the AI from skipping stories or choosing different work.

### Post-Iteration Verification Pattern
`spectrum.sh` independently verifies stories.json state after each iteration (lines 432-443). It overrides Claude's signal if: (a) all stories are actually complete regardless of signal, or (b) remaining count is unchanged despite a "continue" signal (converts to retry). This adds a safety layer against incorrect signal reporting.

### Auto-Debug on Failure Pattern
When quality gates fail, the skill spawns 3 parallel debug agents (log-investigator, state-investigator, git-investigator) to gather evidence before retrying. Debug findings are recorded in progress.md so the next fresh session can act on them.

## Data Flow Diagram

```
User
  │
  ├── /prism-plan          → .prism/shared/plans/YYYY-MM-DD-feature.md
  ├── /decompose_plan      → .prism/stories/stories.json
  │                          .prism/stories/<story-id>-manifest.json
  │                          .prism/shared/spectrum/progress.md
  │
  └── ./scripts/spectrum.sh
        │
        ├── [loop iteration 1..N]
        │   ├── select_next_story (jq)
        │   ├── mark in_progress (jq)
        │   ├── claude --print "Execute story STORY-XXX..."
        │   │     └── [prism-spectrum skill]
        │   │           ├── Read stories.json, progress.md, CLAUDE.md
        │   │           ├── Implement story
        │   │           ├── Run quality gates
        │   │           ├── git commit
        │   │           ├── Update stories.json (status: complete)
        │   │           ├── Append to progress.md
        │   │           └── Emit signal tag
        │   ├── check_signals (grep)
        │   ├── post-iteration verify (jq)
        │   └── append_progress
        │
        └── Final status report
```

## Open Questions

1. How does `spectrum-runner.ts` differ from `spectrum.ts` in the VS Code integration? (Only the state machine was examined.)
2. What does the story manifest `contracts_to_read`/`contracts_to_write` mechanism look like in practice? (Schema file exists but was not read.)
3. How does the CLI dashboard receive real-time updates from the running spectrum loop? (Only the animation state was examined.)

## Workflow Steps Executed

1. **Read mentioned files**: Read `scripts/spectrum.sh` (518 lines) and `skills/prism-spectrum/SKILL.md` (291 lines) in full.
2. **Check existing knowledge**: Searched `.prism/shared/research/` for existing spectrum research — none found.
3. **Locate code**: Globbed for `*spectrum*` across the repo, found 20+ files across scripts, skills, CLI, core packages, and docs.
4. **Analyze components**: Read `commands/decompose_plan.md`, `cmd/prism-cli/domain/signals.go`, `cmd/prism-cli/app/plugin_spectrum.go`, and `packages/prism-core/src/core/controller/prism/spectrum.ts`.
5. **Find patterns**: Identified 5 key patterns (signal protocol, fresh context, deterministic selection, post-iteration verification, auto-debug).
6. **External research**: Not needed — all components are internal.
