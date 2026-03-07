# Prism Eval Cases Design: v2.4.8 vs v2.4.9

**Date**: 2026-03-07
**Status**: Approved
**Baseline**: `.prism/shared/evals/v2.4.8-snapshot/`
**Eval Cases**: `.prism/shared/evals/v2.4.9/skills/`

---

## Structure

```
.prism/shared/evals/
├── v2.4.8-snapshot/                          # Full skill/agent/command baseline
│   ├── skills/prism-research/SKILL.md
│   ├── skills/prism-spectrum/SKILL.md
│   ├── agents/...
│   └── commands/...
└── v2.4.9/
    └── skills/
        ├── prism-research/
        │   └── evals.json                    # 4 eval cases
        └── prism-spectrum/
            ├── evals.json                    # 4 eval cases
            └── fixtures/
                ├── stories-basic.json        # Epic context + blocked-by test
                ├── stories-graph-targets.json # Graph verification test
                ├── stories-ui.json           # Browser verification test
                └── progress.md               # Shared progress file
```

---

## What Changed in v2.4.9

### prism-research
1. `graph-navigator` agent added to available agents table
2. New **Step 1b: Structural Orientation** — spawns graph-navigator when codebase-memory-mcp is available

### prism-spectrum
1. New **Step 1b: Load Epic + Story Context** — reads epic.decisions, story.context fields
2. New **Step 1c: Graph Verification** — index_repository + trace_call_path before/after
3. Reference changed from `plan.qualityGates` to `epic.qualityGates`
4. New **Step 6b: Browser Verification** — playwright-cli for UI stories
5. New **Debug Integration** section with auto-debug flow

---

## Eval Cases: prism-research (4)

| ID | Dimension | Tests | v2.4.9 Feature |
|----|-----------|-------|----------------|
| 1 | Output quality | Research template format, file:line refs, YYYY-MM-DD naming | — (baseline) |
| 2 | Behavioral compliance | graph-navigator spawned, parallel agents, documentarian principle | Step 1b |
| 3 | Behavioral compliance | Files read first, no suggestions, agents complete before synthesis | — (core rules) |
| 4 | Regression | prism-locator used, output saved to .prism/, template sections present | — (v2.4.8 behaviors) |

## Eval Cases: prism-spectrum (4)

| ID | Dimension | Tests | v2.4.9 Feature |
|----|-----------|-------|----------------|
| 1 | Behavioral compliance | Epic context loaded, story context read, epic.qualityGates used | Step 1b |
| 2 | Behavioral compliance | Graph verification before/after, blast radius, dead code check | Step 1c |
| 3 | Output quality | Browser verification attempted for .tsx, progress.md format, signals | Step 6b |
| 4 | Regression | Fresh state load, one story, quality gates, atomic commit, correct signals | — (v2.4.8 behaviors) |

Efficiency (tokens/time) captured automatically by timing.json per run — no explicit eval case needed.

---

## Test Fixtures

The prism-spectrum evals use lightweight fixture stories that make trivial changes (add comments) so evals run fast and changes are easily reverted. Quality gates use `echo` commands to avoid build dependencies.

- **stories-basic.json**: 2 stories with blocked-by dependency, full epic context
- **stories-graph-targets.json**: 1 story with `context.graphTargets` populated
- **stories-ui.json**: 1 story modifying a `.tsx` file to trigger browser verification

---

## Execution Flow

Per the skill-creator infrastructure:

1. For each eval case, spawn **two subagents** simultaneously:
   - `with_skill` — loads current v2.4.9 SKILL.md
   - `old_skill` — loads v2.4.8-snapshot SKILL.md
2. Each subagent runs in clean context with own token/timing metrics
3. After completion:
   - **Grader** evaluates expectations against outputs → `grading.json`
   - **Comparator** does blind A/B judging → `comparison.json`
   - **Analyzer** unblinds and explains why → `analysis.json`
   - **Benchmark** aggregates stats → `benchmark.json`

---

## Future Expansion

The v2.4.9 directory mirrors the v2.4.8-snapshot structure. Future eval batches:

- `v2.4.9/agents/codebase-locator/evals.json` — graph-first search strategy
- `v2.4.9/agents/codebase-analyzer/evals.json` — trace_call_path usage
- `v2.4.9/skills/prism-release/evals.json` — expanded pipeline fidelity
- `v2.4.9/commands/*/evals.json` — command-specific behavioral tests
