---
topic: Spectrum Autonomous Execution Workflow
date: 2026-03-08
type: research
status: complete
---

# Research: Spectrum Autonomous Execution Workflow

## Research Question

How does the Spectrum autonomous execution workflow work in this project? What are the roles of `spectrum.sh` and the `prism-spectrum` skill, and how do they coordinate?

## Summary

Spectrum is an autonomous loop system for executing large feature implementations as a sequence of small, atomic stories. The bash script `spectrum.sh` acts as the outer orchestrator: it selects the next story, spawns a fresh Claude Code session to implement it, parses signal tags from the output, updates state, and loops. The `prism-spectrum` skill is the inner executor: it runs inside each Claude session, implements exactly one story, runs quality gates, commits, and emits a signal tag for the outer loop to parse. State persists entirely through files on disk (`stories.json` and `progress.md`) and git commits, not through AI context.

## Workflow Steps Followed

1. **Read Mentioned Files** (Step 0): Read `scripts/spectrum.sh` and `skills/prism-spectrum/SKILL.md` in full.
2. **Check Existing Knowledge** (Step 1): Searched `.prism/shared/research/` for existing spectrum research. No dedicated spectrum research document was found (only eval outputs from prior versions).
3. **Locate Code** (Step 2): Found related files via Glob/Grep: `commands/decompose_plan.md`, `agents/git-investigator.md`, `agents/log-investigator.md`, `agents/state-investigator.md`, `skills/prism-spectrum/references/story-manifest-schema.md`, `skills/prism-spectrum/references/contracts-convention.md`.
4. **Analyze Components** (Steps 3-4): Read decompose_plan command, story-manifest-schema, and contracts-convention to understand the full pipeline.

## Files Discovered

| File | Purpose |
|------|---------|
| `scripts/spectrum.sh` | Outer bash orchestrator loop (518 lines) |
| `skills/prism-spectrum/SKILL.md` | Inner per-session story executor skill (255 lines) |
| `commands/decompose_plan.md` | Converts approved plans into `stories.json` for Spectrum |
| `skills/prism-spectrum/references/story-manifest-schema.md` | Per-story requirement manifest schema |
| `skills/prism-spectrum/references/contracts-convention.md` | Cross-domain contract file convention |
| `agents/git-investigator.md` | Debug agent spawned on quality gate failure |
| `agents/log-investigator.md` | Debug agent spawned on quality gate failure |
| `agents/state-investigator.md` | Debug agent spawned on quality gate failure |

## Component Analysis

### 1. The Pipeline: Plan to Execution

The full pipeline is:

```
/prism-plan (create plan) --> /decompose_plan (generate stories.json) --> spectrum.sh (autonomous loop)
```

Each step produces artifacts consumed by the next.

### 2. spectrum.sh — The Outer Loop (`scripts/spectrum.sh`)

**Role**: Bash orchestrator that runs the autonomous loop. It never touches implementation; it only manages story selection, session spawning, and state transitions.

**Startup sequence** (lines 364-383):
1. `check_prerequisites` — Verifies `claude` CLI and `jq` are installed, and `stories.json` exists.
2. `validate_schema` — Validates JSON structure: checks for `epic`, `stories` top-level fields, and required per-story fields (`id`, `status`, `priority`, `blockedBy`).
3. `acquire_lock` — Creates `.prism/local/spectrum.lock` with PID to prevent concurrent runs. Detects stale locks by checking if the PID is still alive.
4. `init_progress` — Creates `progress.md` with YAML frontmatter if it does not exist.

**Story selection** (`select_next_story`, lines 180-197):
- Deterministic, no AI involvement.
- Filters stories: status != "complete", and either unblocked or blocked by a story that IS complete.
- Sorts by `priority` (ascending).
- Picks the first (lowest priority number = highest priority).

**Iteration loop** (lines 390-492):
1. Marks story as `in_progress` in `stories.json`.
2. Spawns a fresh Claude session via `claude --dangerously-skip-permissions --print "$prompt"`.
3. The prompt tells Claude which story ID to execute and which files to use.
4. Captures all output and parses it for signal tags.
5. Performs post-iteration state verification (checks `stories.json` independently of Claude's signal).
6. Handles signals: COMPLETE (break), continue (next iteration), retry (reset to pending), error (stop after 3 consecutive).
7. Appends progress entry to `progress.md`.
8. Pauses `SPECTRUM_PAUSE` seconds (default 2) between iterations.

**Signal protocol** (lines 325-361):
| Signal Tag | Return Code | Meaning |
|------------|-------------|---------|
| `<promise>COMPLETE</promise>` | 0 | All stories done |
| `<spectrum-continue>` | 1 | Story completed, continue loop |
| `<spectrum-retry>` | 2 | Story failed, retry in next iteration |
| `<spectrum-blocked>` | 1 | Story blocked, try next available |
| `<spectrum-error>` | 3 | Fatal error, stop |
| No signal detected | 2 | Treated as retry with warning |

**Post-iteration verification** (lines 431-443):
- Independently checks remaining story count after Claude finishes.
- Overrides signal to COMPLETE if all stories are done (regardless of what Claude said).
- Overrides "continue" to "retry" if remaining count did not change (no progress detected).

**Safety features**:
- Lockfile prevents concurrent spectrum runs (lines 78-94).
- Maximum consecutive errors threshold (default 3) stops runaway failures (lines 482-485).
- Maximum total iterations cap (default 50) prevents infinite loops (line 390).
- Atomic JSON updates: writes to `.tmp` file, validates with `jq`, then moves (lines 200-219).

**Configuration** (environment variables):
| Variable | Default | Purpose |
|----------|---------|---------|
| `SPECTRUM_MAX_ITERATIONS` | 50 | Maximum loop iterations |
| `SPECTRUM_VERBOSE` | false | Tee Claude output to stderr |
| `SPECTRUM_PAUSE` | 2 | Seconds between iterations |

**Progress path derivation** (lines 41-61):
- Flat layout: `.prism/stories/stories.json` maps to `.prism/shared/spectrum/progress.md`
- Epic-scoped: `.prism/stories/<epic>/stories.json` maps to `.prism/shared/spectrum/<epic>/progress.md`

### 3. prism-spectrum Skill — The Inner Executor (`skills/prism-spectrum/SKILL.md`)

**Role**: Runs inside each spawned Claude session. Implements exactly one story with quality verification and atomic commits.

**Philosophy** (5 principles):
1. Fresh Start — Load all context from files, never assume prior context.
2. One Story — Execute exactly the story specified by spectrum.sh.
3. Quality Gates — Must pass typecheck/lint/test before commit.
4. Atomic Commits — One story = one commit.
5. Learn Forward — Capture learnings for future iterations in progress.md.

**Workflow steps**:

1. **Load State** (Step 1): Read stories.json, progress.md, and CLAUDE.md completely.
2. **Load Epic + Story Context** (Step 1b): Extract `epic.decisions`, `epic.risks`, `epic.outOfScope`, `epic.references`, and per-story `context.why`, `context.risks`, `context.patterns`, `context.edgeCases`.
3. **Graph Verification** (Step 1c, optional): If codebase-memory-mcp is available, index the repository, trace call paths for `graphTargets`, check blast radius. After implementing, re-index and check for dead code.
4. **Identify Story** (Step 2): Use the story ID from the prompt. Story selection is deterministic by spectrum.sh.
5. **Announce Story** (Step 3): Output `<spectrum-story>` tag with ID, title, priority, files.
6. **Implement** (Step 4): Read all files in the story's `files` array first. Check for a manifest file; if it exists, implement one requirement at a time (respecting `depends_on`), skipping already-passing requirements. Otherwise, follow story `steps`.
7. **Quality Gates** (Step 5): Execute all commands from `epic.qualityGates`. On failure, spawn 3 debug agents in parallel (log-investigator, state-investigator, git-investigator), record findings, emit `<spectrum-retry>`.
8. **Browser Verification** (Step 5b, optional): If UI files were modified and playwright-cli is available, start dev server, take screenshots, check console errors.
9. **Commit** (Step 6): `git add` specific files, `git commit` with story ID in message.
10. **Update State** (Step 7): Set story status to "complete" in stories.json, append learnings to progress.md.
11. **Signal** (Step 8): Emit appropriate signal tag for spectrum.sh to parse.

**Debug integration** (auto-debug flow):
On quality gate failure, three agents are spawned in parallel:
- `log-investigator` — checks logs for related errors
- `state-investigator` — checks app state for anomalies
- `git-investigator` — checks recent changes that might cause failure

Findings are synthesized into a root cause hypothesis and recorded in progress.md. The retry signal includes structured XML with error details, root cause, suggested fix, and file references.

### 4. decompose_plan Command (`commands/decompose_plan.md`)

**Role**: Bridge between the planning phase and Spectrum execution. Converts an approved plan into the `stories.json` format.

**Key capabilities**:
- Analyzes phase complexity to determine single vs. multi-story decomposition.
- Establishes dependency ordering (Types -> Implementation -> Integration -> Tests -> Polish).
- Extracts quality gates from the plan's verification commands.
- Enriches stories with context fields (`why`, `risks`, `edgeCases`, `patterns`, `graphTargets`).
- Generates per-story manifest files with requirement-level tracking.
- Initializes cross-domain contracts when stories share interfaces.
- Presents decomposition for user review before generating files.

**Story sizing guide**: If you cannot describe the implementation in 2-3 sentences, split it.

### 5. Story Manifests (`story-manifest-schema.md`)

Per-story JSON files that enable cross-session progress persistence at the requirement level. Each story step maps to a requirement with its own gate command. When a manifest exists, prism-spectrum implements one requirement at a time, skipping those already passing. This handles the case where a story spans multiple sessions (e.g., quality gate failure mid-story).

### 6. Contracts Convention (`contracts-convention.md`)

Cross-domain interface contracts stored in `.prism/shared/contracts/`. Since Spectrum executes stories in separate sessions with no shared context, contracts formalize interfaces between domains. Git is the transport layer: the writing story commits the contract, the reading story loads it in a later session.

Contract types: `interfaces.json`, `api-endpoints.json`, `component-props.json`, `dependencies.json`, `test-obligations.json`.

### 7. stories.json Schema

```json
{
  "epic": {
    "name": "...",
    "source": "path/to/plan.md",
    "qualityGates": ["npm test"],
    "decisions": ["..."],
    "references": ["..."],
    "outOfScope": ["..."],
    "risks": ["..."]
  },
  "stories": [{
    "id": "STORY-001",
    "title": "...",
    "description": "...",
    "priority": 1,
    "status": "pending|in_progress|complete",
    "blockedBy": null,
    "files": [{"path": "...", "action": "create|modify|delete"}],
    "steps": [{"description": "...", "done": false}],
    "context": {
      "why": "...",
      "risks": ["..."],
      "edgeCases": ["..."],
      "patterns": ["..."],
      "graphTargets": ["qualified::name#Function"]
    }
  }]
}
```

## Key Design Patterns

### Fresh Context Per Iteration
Each story gets a new Claude session. Memory persists through files (`stories.json`, `progress.md`) and git commits, not AI context. This prevents context degradation over long feature implementations.

### Deterministic Story Selection
`spectrum.sh` selects stories deterministically (lowest priority number among unblocked pending stories). The AI does not choose which story to work on.

### Post-Iteration Verification
`spectrum.sh` independently verifies state after each iteration, overriding Claude's signals when they contradict reality (e.g., "continue" but no progress detected).

### Layered Error Handling
1. Quality gate failures trigger auto-debug with 3 parallel investigator agents.
2. Debug findings are recorded in progress.md for the next session.
3. Retry signals include structured XML with root cause and suggested fix.
4. Consecutive error limit (3) prevents infinite retry loops.
5. Maximum iteration limit (50) prevents runaway execution.

### Two-Tier State Tracking
- **Story level**: `stories.json` tracks overall story status (pending/in_progress/complete).
- **Requirement level**: `<story-id>-manifest.json` tracks individual requirements within a story, enabling cross-session progress persistence.

## Data Flow Diagram

```
                        +-----------------+
                        |  /prism-plan    |
                        |  (create plan)  |
                        +--------+--------+
                                 |
                                 v
                        +-----------------+
                        | /decompose_plan |
                        | (generate JSON) |
                        +--------+--------+
                                 |
                    +------------+------------+
                    |                         |
                    v                         v
          stories.json              progress.md (init)
          manifests/*.json          contracts/*.json (optional)
                    |
                    v
            +---------------+
            | spectrum.sh   |  <-- outer loop
            | (bash script) |
            +-------+-------+
                    |
        +-----------+-----------+
        |  for each iteration:  |
        |                       |
        |  1. select_next_story |
        |  2. update in_progress|
        |  3. spawn claude      +--------+
        |  4. parse signals     |        |
        |  5. verify state      |        v
        |  6. append progress   |  +-------------+
        |  7. loop or break     |  | claude CLI   |
        +-------+---------------+  | (fresh sess) |
                |                  +------+------+
                |                         |
                |                  +------+------+
                |                  | prism-spectrum|  <-- inner executor
                |                  | (skill)       |
                |                  +------+------+
                |                         |
                |                  1. load state files
                |                  2. read story context
                |                  3. announce story
                |                  4. implement (from manifest or steps)
                |                  5. run quality gates
                |                  6. git commit
                |                  7. update stories.json
                |                  8. emit signal tag
                |                         |
                +<------------------------+
                |
                v
          Final status report
```

## Open Questions

- How are browser gates from `decompose_plan` (Step 6b) consumed? The `prism-spectrum` skill checks for UI file modifications but does not reference `epic.browserGates` directly.
- What happens if a story's manifest file is partially completed (some requirements passing) but the story itself is reset to "pending" by spectrum.sh on retry? The manifest persists with `passes: true` on completed requirements, so prism-spectrum should skip them on retry.
- The contracts convention defines 5 contract file types but no automated validation that consuming stories match the contract shape.
