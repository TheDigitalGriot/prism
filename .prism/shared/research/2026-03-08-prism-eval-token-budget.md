# Prism-Eval Token Budget & Batching

**Date**: 2026-03-08
**Research Question**: Why does prism-eval exhaust the token budget, and how should the skill be updated to prevent it?

## Summary

The `prism-eval` skill (v2.5.2) instructs agents to "Launch all runs in parallel using the Agent tool with `run_in_background: true`." In practice, a comparative eval run spawns **2 agents per eval case** (one for current version, one for baseline). With 41 eval cases across 13 comparable skills, that produces **82 simultaneous agents**, each consuming 15K-75K tokens depending on skill complexity. The total token cost for a full comparative run is estimated at **2.5-3.5M tokens**, which reliably exhausts Claude's rate limits.

This has now happened in **two separate eval runs** (v2.5.1 and v2.5.2), confirming it is a structural problem in the skill design, not a one-off incident.

## Observed Token Consumption

Data from the v2.5.2 vs v2.4.8 comparative run (2026-03-08):

| Skill | Avg Tokens/Agent | Agent Count | Est. Total |
|-------|-----------------|-------------|------------|
| prism-research | 55,647 | 8 | 445K |
| prism-plan | 28,608 | 6 | 172K |
| prism-implement | 37,213 | 6 | 223K |
| prism-iterate | 25,680 | 6 | 154K |
| prism-debug | 35,448 | 4* | 142K |
| prism-spectrum | 22,817 | 4* | 91K |
| prism (meta) | 24,135 | 6 | 145K |
| **Subtotal (7 skills)** | | **40** | **~1.37M** |
| **Projected full run (13 skills)** | | **82** | **~2.7M** |

*Partial — some agents hit rate limit before producing output.

### Token Distribution by Eval Dimension

- **Research evals**: Heaviest (50K-75K tokens). Agents explore the full codebase, spawn sub-searches, read dozens of files.
- **Plan/Implement evals**: Medium (20K-40K tokens). Read plans, simulate workflow steps, produce structured output.
- **Spectrum/Debug evals**: Lightest (20K-27K tokens). Read fixture files, simulate a single story or investigation.

## Root Cause Analysis

The skill has **no token awareness**. Three compounding factors:

1. **Unbounded parallelism**: "Launch all runs in parallel" with no concurrency limit. 82 agents start simultaneously, each independently consuming context.
2. **No agent-level budget**: Each agent reads the full SKILL.md (100-300 lines), then explores the codebase freely. Research agents are especially expensive because they spawn their own sub-agents.
3. **No early termination**: When the rate limit is hit, agents fail silently with "You're out of extra usage" — their grading.json slots are empty, and the benchmark is incomplete with no structured recovery path.

## Proposed Changes to prism-eval

### Change 1: Batched Execution with Concurrency Cap

Replace the current "spawn all at once" instruction with batched execution:

```
### 4. Spawn Eval Runs

Launch runs in BATCHES to stay within token budget.

**Batch size**: Maximum 10 agents per batch (5 eval cases × 2 configs in comparative mode).

**Batch ordering** (cheapest first to maximize coverage):
1. Spectrum, Debug evals (~22K tokens/agent)
2. Plan, Iterate, Implement evals (~30K tokens/agent)
3. Research evals (~55K tokens/agent)
4. Meta-skill (prism) evals (~24K tokens/agent)

**Between batches**: Wait for ALL agents in the current batch to complete.
Capture timing data immediately. Then spawn the next batch.

**Running token estimate**: After each batch completes, sum total_tokens
from all timing.json files. If cumulative total exceeds 1.5M tokens,
STOP and warn the user:

"Token budget approaching limit (X tokens used of ~2M estimated).
Remaining evals: [list]. Continue? (y/n)"
```

### Change 2: Lightweight Grading Mode

Add a `--lightweight` or `mode: lightweight` option that skips full agent simulation for expectations that can be verified by reading the skill diff:

```
### Lightweight Mode

When the user requests lightweight evaluation or when token budget is constrained:

1. Diff the two SKILL.md versions:
   diff <baseline-snapshot>/skills/<name>/SKILL.md skills/<name>/SKILL.md

2. For each eval case, classify expectations:
   - STRUCTURAL: Can be verified from the diff alone
     (e.g., "graph-navigator agent is spawned" → check if the step exists in SKILL.md)
   - BEHAVIORAL: Requires running the skill to verify
     (e.g., "No improvement suggestions appear")

3. Grade STRUCTURAL expectations from the diff. Only spawn agents
   for BEHAVIORAL expectations.

Estimated savings: 40-60% of tokens (many expectations are structural).
```

### Change 3: Failure Recovery Protocol

Add explicit handling for rate limit failures:

```
### Handling Token Exhaustion

If an agent returns with total_tokens < 100 or output contains
"out of extra usage" or "rate limit":

1. Mark the run as `"failed": true` in timing.json
2. Do NOT grade the output — write grading.json with all expectations
   marked `"skipped": true` and reason: "Agent hit rate limit"
3. Track failed evals in a `failed_evals.json` at the workspace root
4. At the end, present:
   "X of Y evals completed. Z failed due to token exhaustion.
    Run `/prism-eval --resume` after rate limit resets to complete
    the remaining evals."

### Resume Mode

When invoked with `--resume` or "resume evals":
1. Read failed_evals.json
2. Only spawn agents for the failed eval cases
3. Merge results into the existing benchmark.json
```

### Change 4: Token Estimate Preview

Before spawning any agents, show the user an estimate:

```
### 2.5 Token Estimate (new step, after discovering eval cases)

Before spawning, calculate and present:

"Found N eval cases across M skills.
Mode: comparative (2 agents per eval = 2N total agents)

Estimated token usage:
- Research evals (R): ~55K × 2 × count = XK
- Other evals (O):    ~30K × 2 × count = YK
- Total estimate:     ~ZK tokens

This will use approximately Z% of a typical rate limit budget.
Proceed? (y/n)"
```

## Impact Assessment

| Change | Effort | Token Savings | User Impact |
|--------|--------|--------------|-------------|
| Batched execution | Low | Prevents exhaustion | Must wait longer for results |
| Lightweight mode | Medium | 40-60% reduction | Less behavioral confidence |
| Failure recovery | Low | Enables incremental runs | Better UX on failure |
| Token estimate | Low | Informed consent | No more surprises |

## Recommendation

Implement all four changes in priority order: **Change 4 → Change 1 → Change 3 → Change 2**.

The token estimate (Change 4) and batching (Change 1) are the minimum viable fix — they prevent the problem and cost very little to implement. Failure recovery (Change 3) enables graceful degradation. Lightweight mode (Change 2) is an optimization that can come later.

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `skills/prism-eval/SKILL.md` | modify | Add batching, estimates, recovery, lightweight mode |
| `cmd/prism-setup/resources/plugin/skills/prism-eval/SKILL.md` | modify | Mirror changes (setup copy) |
| `skills/prism-eval/references/eval-schemas.md` | modify | Add `failed_evals.json` schema, update `timing.json` with `failed` field |
