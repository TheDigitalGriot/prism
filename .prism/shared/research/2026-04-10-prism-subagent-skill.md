---
date: 2026-04-10
topic: prism-subagent skill — same-session subagent-driven plan execution
status: implemented (v1)
related:
  - .prism/shared/research/2026-04-06-superpowers-vs-prism-audit.md
  - .prism/shared/research/2026-04-06-plugin-structure-ecosystem-audit.md
  - skills/prism-subagent/SKILL.md
---

# Prism Subagent Skill — Research & Design

## Research Question

Does the prism plugin ecosystem have a mechanism that mirrors superpowers'
`subagent-driven-development` skill — fresh implementer subagents per task with two-stage
review inside a single session? If not, where is the gap and what should fill it?

## Summary

Prism has all the *components* (parallel fan-out, two-stage review agents, fresh-context
execution), but they were locked inside specific skills (`prism-research`, `prism-debug`,
`prism-spectrum`). No skill bridged the medium tier between `prism-implement` (single
phase, no subagents) and `prism-spectrum` (10+ stories, requires `decompose_plan` and
the `spectrum.sh` outer loop). We built `prism-subagent` to fill that gap, reusing
existing review agents and adding seven loop-prevention innovations beyond generic SDD.

## Phase 1: Findings

### Superpowers' Two Skills (Parallel vs Sequential)

Superpowers cleanly separates two patterns:

**`subagent-driven-development`** — sequential, same-session, plan-execution loop
- Controller reads plan once, extracts ALL task text, then per task dispatches:
  1. Implementer subagent (fresh context, full task text pasted in)
  2. Spec reviewer subagent (compliance check)
  3. Code quality reviewer subagent (architecture + quality)
- Implementer reports one of 4 statuses: `DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED`
- **Forbids parallel implementers** — write conflict avoidance is structural, not advisory
- Reference: `.prism/shared/ref/superpowers/skills/subagent-driven-development/`

**`dispatching-parallel-agents`** — parallel, fan-out, investigation/debug pattern
- Used when 2+ **independent** problem domains exist (e.g., 6 test failures across
  3 unrelated files)
- Dispatch one agent per domain concurrently. Controller integrates results.
- Don't use when failures are related, share state, or are exploratory.
- Reference: `.prism/shared/ref/superpowers/skills/dispatching-parallel-agents/`

### Prism's Existing Mechanisms

| Need | Prism mechanism | File |
|---|---|---|
| Parallel research fan-out | `prism-research` spawns 5 agents concurrently (codebase-locator, codebase-analyzer, codebase-pattern-finder, web-search-researcher, graph-navigator) | [skills/prism-research/SKILL.md](../../skills/prism-research/SKILL.md) |
| Parallel debug investigation | `prism-debug` 3-agent flow (log-investigator, state-investigator, git-investigator) | [skills/prism-debug/SKILL.md](../../skills/prism-debug/SKILL.md) |
| Single-story execution + 2-stage review | `prism-spectrum` Stage 1 (`spec-reviewer`) + Stage 2 (`quality-reviewer`) | [skills/prism-spectrum/SKILL.md](../../skills/prism-spectrum/SKILL.md) lines 210-251 |
| Multi-story autonomous loop | `spectrum.sh` + `prism-spectrum` (fresh Claude session per story) | [scripts/spectrum.sh](../../scripts/spectrum.sh) |
| Plain plan execution in current session | `prism-implement` — phase-by-phase, no subagents, no review loop, no implementer status protocol | [skills/prism-implement/SKILL.md](../../skills/prism-implement/SKILL.md) |

### The Two Gaps

**Gap 1 — No same-session subagent-driven execution.** Prism owned the review *agents*
([agents/spec-reviewer.md](../../agents/spec-reviewer.md),
[agents/quality-reviewer.md](../../agents/quality-reviewer.md)) and the review *prompts*
([skills/prism-spectrum/references/spec-review-prompt.md](../../skills/prism-spectrum/references/spec-review-prompt.md),
[skills/prism-spectrum/references/quality-review-prompt.md](../../skills/prism-spectrum/references/quality-review-prompt.md)),
but they were bound to Spectrum, which requires `stories.json` and the bash outer loop.
There was no skill that could take a plan from `.prism/shared/plans/` and execute it
task-by-task in the current session with fresh subagents and the review loop. CLAUDE.md
even listed this row in the execution-models table — and pointed to
`superpowers:subagent-driven-development` instead of owning it.

**Gap 2 — No general parallel-dispatch pattern.** Prism's parallelism was hard-coded into
specific skills (research has 5 fixed agent types, debug has 3). The pattern was implicit
but never lifted to a reusable skill the way superpowers does with `dispatching-parallel-agents`.

### Why Building It Made Sense

90% of the infrastructure already existed:
- Two reviewer agents — reused verbatim
- Review dispatch templates — reused with minor adjustments
- A working two-stage review loop — proven in Spectrum
- Conventions around `.prism/shared/plans/`, `.prism/local/`, conventional commits
- Compaction-survival patterns from Spectrum's progress.md / state-on-disk discipline

Building was mostly composition, not new code.

## Phase 2: Solution — `prism-subagent` v1

### Skill Layout

```
skills/prism-subagent/
├── SKILL.md                              ~700 tokens — entry point, decision flow, iron laws
└── references/                           on-demand, ~5500 tokens total
    ├── dispatch-protocol.md              implementer + spec-reviewer + quality-reviewer templates
    ├── status-protocol.md                5-status protocol + handling matrix
    ├── review-decision-matrix.md         9 task classes with skip rules
    ├── retry-ladder.md                   bounded retries, model escalation, loop detectors
    ├── state-schema.md                   state.json schema + compaction recovery
    └── domain-hints.md                   R3F / Electron / fullstack / experimental primers
```

### Execution Tier Mapping (post-build)

| Scope | Skill |
|---|---|
| Single phase / quick fix | `prism-implement` |
| 3–10 tasks, mostly independent, stay in session | **`prism-subagent`** ← new |
| 10+ stories, autonomous overnight | `prism-spectrum` |
| Parallel investigation of unrelated failures | `prism-debug` |

### Core Loop

1. **Pre-flight** — load plan, classify domain, extract tasks ONCE → write `state.json`
2. **Per task** (sequential, never parallel implementers):
   1. Consult review-decision-matrix → which stages apply
   2. Dispatch implementer (full task text inlined, never plan path)
   3. Handle status: `DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | NEEDS_CLARIFICATION | BLOCKED`
   4. Dispatch spec-reviewer with diff + spec excerpt only
   5. Dispatch quality-reviewer with diff + story context
   6. On reviewer ❌ → bounded fix loop
   7. Update state.json, mark complete
3. **Final pass** — single full-implementation reviewer → hand off to `prism-finish`

### Innovations Over Generic SDD

| # | Innovation | Why |
|---|---|---|
| 1 | **Domain-aware context priming** | R3F / Electron / fullstack / experimental primers head off domain-specific failure modes pre-implementation |
| 2 | **Diff-only reviews** | Reviewers receive `git diff` + spec excerpt, never full files. ~80% token reduction on the highest-volume operation |
| 3 | **5-status protocol** | `NEEDS_CLARIFICATION` distinct from `NEEDS_CONTEXT` prevents the controller from inventing product decisions under pressure |
| 4 | **Review decision matrix** | 9 task classes with explicit, inspectable skip rules (config/docs/refactor/feature/contract/experiment/etc.) |
| 5 | **Issue-fingerprint repeated-issue detector** | Killer-loop defense: if a reviewer raises an issue already in `raised_issues`, halt instead of cycling |
| 6 | **No-op spin detector** | If implementer's diff is byte-identical to previous cycle's, halt — they're not making progress |
| 7 | **Auto model escalation ladder** | Per-task `model_ladder` (haiku→sonnet→opus default; sonnet→opus→opus for `feature`/`contract`; haiku-heavy for `experiment`) |
| 8 | **Bounded retries (3 hard cap)** | No "just one more try." Hard caps on `retry_count`, `review_cycles`, `consecutive_escalations` |
| 9 | **Reviewer isolation** | Reviewers never see prior reviewers' complaints — prevents groupthink reinforcement |
| 10 | **Compaction-survivable state.json** | Single file at `.prism/local/subagent/<plan-slug>/state.json`. Recovery checks git tree state vs declared task status. Never asks "what were we doing?" |
| 11 | **`contract`-class blast-radius check** | After spec+quality on contract tasks, controller greps/graph-traces for callers and flags any outside the declared file list |
| 12 | **Tasks extracted ONCE** | Plan is read at run start, tasks frozen into `state.json.tasks[*].spec_text`. No plan re-reads ever again |

### Token Optimization Strategy (per cl-plugin-structure principles)

- **Cold start**: SKILL.md only, ~700 tokens
- **First dispatch**: dispatch-protocol + status-protocol + review-decision-matrix + relevant domain-hint section, ~3000 tokens, loaded once for the run
- **State persistence**: surgical mutations (append fingerprint, bump counter), no log accumulation
- **Reviewer dispatches**: diff + spec excerpt (200–500 tokens) instead of full files (5000–15000 tokens). Multiplied across 6–12 reviewer dispatches per run, this dominates the token budget
- **Plan re-reads**: zero after extraction. Naive controllers re-read the plan file per task

### Loop Prevention Hierarchy

The skill bounds three nested loops, each capable of spinning forever if unbounded:

1. **Per-task retry loop** — `retry_count` hard cap at 3, model escalates each cycle
2. **Per-task review loop** — `review_cycles` hard cap at 3, repeated-issue detector + no-op spin detector halt early
3. **Cross-task escalation loop** — `consecutive_escalations` ≥ 3 → the plan itself is wrong, halt the run

This is the most important quality lever. The single biggest failure mode of long
subagent runs is unbounded retries that look like progress while burning hours of tokens.

### Reused Components (Zero Duplication)

- [agents/spec-reviewer.md](../../agents/spec-reviewer.md) — verbatim reuse, same agent Spectrum uses
- [agents/quality-reviewer.md](../../agents/quality-reviewer.md) — verbatim reuse
- Conventional commit conventions from `prism-spectrum`
- `.prism/local/` gitignore from existing patterns
- Status-protocol shape borrows from Spectrum's signal tags (`<spectrum-blocked>`, `<spectrum-needs-context>`)

## Phase 3: Enhancements (shipped 2026-04-11)

All four enhancements completed in a follow-up session.

### Enhancement 1 — `scripts/extract-tasks.py` ✅ shipped

**Built:** ~280-line Python script that parses Prism plan markdown into a valid
`state.json` skeleton. Tested against 4 real plans + 3 fixture plans, all extracted
correctly.

**Features delivered:**
- Regex-based task header / files / steps / acceptance parsing (matches Prism plan convention)
- Auto-classification into 9 review classes per [review-decision-matrix](../../skills/prism-subagent/references/review-decision-matrix.md)
- Auto-detection of domain (r3f / electron / fullstack / experiment / mixed) from plan content + file paths
- Per-task model ladder selection based on review class
- Atomic write (`.tmp` then rename) to prevent corruption
- `--stdout` mode for inspection without writing
- `--force` to overwrite, `--domain` to override auto-detection
- Exit code 3 → controller falls back to LLM extraction (plan format unfamiliar)

**Wired into:** `skills/prism-subagent/SKILL.md` "Core Loop" step 1 — controller now calls
`python ${CLAUDE_PLUGIN_ROOT}/scripts/extract-tasks.py <plan-path>` instead of doing
the extraction itself.

**Verified against:**
- `2026-04-06-plan-d-hook-infrastructure.md` → 6 tasks, correct classification
- `plan-simple.md` (fixture) → 3 tasks, mixed feature/test-only
- `plan-contract.md` (fixture) → 3 tasks, **contract class detected** for 2/3
- `plan-r3f.md` (fixture) → 3 tasks, **domain auto-detected as r3f**

### Enhancement 2 — `prism-dispatch` skill ✅ shipped

**Built:** [skills/prism-dispatch/SKILL.md](../../skills/prism-dispatch/SKILL.md). Codifies
the parallel-fan-out pattern for ad-hoc use, sibling to `prism-research` (fixed agent
roster) and `prism-debug` (fixed 3-agent flow).

**Key content:**
- Decision flow for "should I parallelize?"
- Sibling-skills disambiguation table (when to use which fan-out skill)
- 4-step pattern: identify domains → focused prompts → parallel dispatch (single message, multiple Task calls) → integrate
- Model selection per agent (don't put everything on opus)
- Common mistakes table
- Two anti-patterns: fan-out stampede (cap at 5), hidden sequential dependencies (file-overlap audit)
- Iron laws

**Integration points:**
- Cross-references from `prism-research`, `prism-debug`, `prism-subagent` (final-pass parallelization)

### Enhancement 3 — PreCompact / PostCompact integration ✅ shipped

**Built:** Extended [scripts/pre-compact.py](../../scripts/pre-compact.py) and
[scripts/post-compact.py](../../scripts/post-compact.py) to detect and resume
in-flight `prism-subagent` runs.

**PreCompact additions:**
- New `get_active_subagent_run()` function scans `.prism/local/subagent/*/state.json`
- Picks the most recently updated state file with at least one non-complete task
- Returns `{state_path, plan_slug, current_task, in_progress_count, pending_count, domain}`
- Embedded into the existing `compact-snapshot.json` as `active_subagent_run` field

**PostCompact additions:**
- Reads `active_subagent_run` from snapshot
- Surfaces a recovery message that names the state file path, current task, and pending count
- Explicitly instructs: "Resume by reading {path} — follow state-schema.md recovery protocol. Do NOT re-extract the plan."

**Verified:** Ran extract-tasks on a real plan, then ran pre-compact + post-compact
and confirmed the recovery message correctly identifies the active run.

### Enhancement 4 — Eval suite ✅ shipped

**Built:** [.prism/shared/evals/v3.2.0/skills/prism-subagent/](../../.prism/shared/evals/v3.2.0/skills/prism-subagent/) with:

- `evals.json` — 8 eval cases across 6 dimensions:
  1. behavioral_compliance — extract-tasks pre-flight
  2. loop_prevention — repeated-issue detector
  3. loop_prevention — no-op spin detector
  4. token_optimization — diff-only review verification
  5. domain_awareness — R3F primer injection
  6. review_decision_matrix — contract class blast-radius
  7. compaction_survival — state.json recovery
  8. regression — iron laws presence check
- `fixtures/plan-simple.md` — 3-task baseline (utility module + tests)
- `fixtures/plan-contract.md` — 3-task contract change (full-stack with shared types)
- `fixtures/plan-r3f.md` — 3-task R3F component (tests domain detection)
- `baseline.json` — captured baseline metrics for regression detection

**Baseline metrics captured (2026-04-11):**
- All 9 fixture tasks extracted correctly across 3 plans
- Domain detection: 2× fullstack, 1× r3f (correct)
- Review classes: feature, test-only, contract all classified per matrix rules
- 0 warnings on any extraction
- SKILL.md token estimate: ~700 (target <800)
- References total: ~5500 tokens (loaded on demand)

## Original Planned Enhancements (preserved for reference)

These were the descriptions before implementation. Kept here so future readers can
compare what was planned to what shipped.

### Enhancement 2 — `prism-dispatch` Skill (Generalized Parallel Fan-Out)

**Problem:** Prism's parallel-agent pattern is hard-coded into `prism-research` (5 fixed
agent types) and `prism-debug` (3 fixed agent types). There's no general skill that
guides "I have N independent problem domains, fan out N agents."

**Solution:** A small skill (≤500 tokens SKILL.md, 1-2 references) that codifies the
pattern from superpowers' `dispatching-parallel-agents` but in Prism vocabulary. Used
ad-hoc whenever the user encounters multiple unrelated failures, multiple subsystems
to investigate, etc.

**Where it fits:** `skills/prism-dispatch/SKILL.md`. Cross-references from
`prism-research`, `prism-debug`, and `prism-subagent` (for the final-pass reviewer
dispatch, which could be parallelized across files).

### Enhancement 3 — PreCompact Hook Integration

**Problem:** v1 recovery scans `.prism/local/subagent/` for the most recent state file
to find an in-flight run. Cheap but wasteful.

**Solution:** When `prism-subagent` is active, the existing PreCompact hook writes the
current state.json path to `.prism/local/compact-snapshot.json`. PostCompact reads this
and resumes immediately instead of scanning.

**Where it fits:** Extend the existing `hooks/precompact.*` and `hooks/postcompact.*`
to read/write a `subagent_active` field. Skill checks this on entry to detect resumption.

### Enhancement 4 — Eval Suite for `prism-subagent`

**Problem:** No regression detection. We don't know if a future edit to the skill makes
runs more expensive, more loop-prone, or less accurate.

**Solution:** A benchmark harness under `prism-eval` that:
1. Runs `prism-subagent` against a fixture plan with known correct outcome
2. Measures: total tokens, retry count distribution, review-cycle distribution, halt
   triggers fired, final-pass review pass rate, wall-clock time
3. Compares against a baseline snapshot (committed)
4. Fails CI on regressions beyond a threshold

**Where it fits:** `skills/prism-eval/` already exists. Add a `subagent-bench/` fixture
directory with 2-3 small plans of varying complexity (single feature, contract change,
R3F prototype). Document baseline numbers in the research dir for future comparison.

## Open Questions (for follow-up research, not blockers)

1. Should `prism-subagent` ever permit parallel implementers when the file scopes are
   provably disjoint? Generic SDD says never (write conflicts). Counter: a graph-traced
   blast radius check could prove disjointness. Trade-off: complexity vs throughput.
2. Should the final-pass reviewer dispatch be parallelized across cumulative diff
   slices? (This is the natural place for `prism-dispatch` integration.)
3. Should `state.json` be committable for forensics? Currently `.prism/local/` is
   gitignored. Trade-off: useful retros vs PR noise.
4. Should the issue-fingerprint normalizer be LLM-based or rule-based? Rule-based is
   cheaper but more false positives; LLM-based is accurate but burns a small dispatch
   per fingerprint computation.

## Files Created/Modified

| File | Action | Purpose |
|---|---|---|
| `skills/prism-subagent/SKILL.md` | created | entry point |
| `skills/prism-subagent/references/dispatch-protocol.md` | created | implementer + reviewer templates |
| `skills/prism-subagent/references/status-protocol.md` | created | 5-status handling matrix |
| `skills/prism-subagent/references/review-decision-matrix.md` | created | 9-class skip rules |
| `skills/prism-subagent/references/retry-ladder.md` | created | loop prevention |
| `skills/prism-subagent/references/state-schema.md` | created | state.json schema + recovery |
| `skills/prism-subagent/references/domain-hints.md` | created | R3F/Electron/fullstack/experimental primers |
| `CLAUDE.md` | updated | execution-models table now points to `/prism-subagent`; additional-skills list documents it |
| `scripts/extract-tasks.py` | created | Enhancement 1 — deterministic plan-to-state.json extractor |
| `skills/prism-dispatch/SKILL.md` | created | Enhancement 2 — generalized parallel fan-out skill |
| `scripts/pre-compact.py` | modified | Enhancement 3 — detect active prism-subagent runs |
| `scripts/post-compact.py` | modified | Enhancement 3 — surface recovery instructions for active runs |
| `.prism/shared/evals/v3.2.0/skills/prism-subagent/evals.json` | created | Enhancement 4 — 8 eval cases across 6 dimensions |
| `.prism/shared/evals/v3.2.0/skills/prism-subagent/fixtures/plan-simple.md` | created | Enhancement 4 — 3-task baseline fixture |
| `.prism/shared/evals/v3.2.0/skills/prism-subagent/fixtures/plan-contract.md` | created | Enhancement 4 — contract-class fixture |
| `.prism/shared/evals/v3.2.0/skills/prism-subagent/fixtures/plan-r3f.md` | created | Enhancement 4 — R3F domain-detection fixture |
| `.prism/shared/evals/v3.2.0/skills/prism-subagent/baseline.json` | created | Enhancement 4 — captured baseline metrics |

Validated with `claude plugin validate .` — passes clean.

## See Also

- [2026-04-06 superpowers vs prism audit](2026-04-06-superpowers-vs-prism-audit.md) — original gap analysis that motivated this work
- [skills/prism-subagent/SKILL.md](../../skills/prism-subagent/SKILL.md) — implementation entry point
- [agents/spec-reviewer.md](../../agents/spec-reviewer.md) — reused verbatim
- [agents/quality-reviewer.md](../../agents/quality-reviewer.md) — reused verbatim
- [skills/prism-spectrum/SKILL.md](../../skills/prism-spectrum/SKILL.md) — parent pattern this skill borrows from
