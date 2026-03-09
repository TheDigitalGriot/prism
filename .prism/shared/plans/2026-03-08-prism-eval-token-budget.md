---
date: 2026-03-08
author: Claude
repository: prism-plugin
branch: main
ticket: N/A
status: draft
research: .prism/shared/research/2026-03-08-prism-eval-token-budget.md
---

# Plan: Prism-Eval Token Budget & Batching

## Overview

**Goal**: Update the prism-eval skill to prevent token exhaustion by adding batched execution, token estimates, failure recovery, and a lightweight grading mode.

**Research**: [2026-03-08-prism-eval-token-budget.md](../research/2026-03-08-prism-eval-token-budget.md)

**Complexity**: Medium

**Estimated Phases**: 6

## Success Criteria

### Automated (CI/Scripts)
- [ ] Both copies of SKILL.md are identical: `diff skills/prism-eval/SKILL.md cmd/prism-setup/resources/plugin/skills/prism-eval/SKILL.md`
- [ ] eval-schemas.md contains `failed_evals.json` schema
- [ ] eval-schemas.md timing.json schema includes `failed` field
- [ ] eval-schemas.md grading.json schema includes `skipped` field
- [ ] SKILL.md contains "Batch size" instruction
- [ ] SKILL.md contains "Token Estimate" step
- [ ] SKILL.md contains "Resume Mode" section
- [ ] SKILL.md contains "Lightweight Mode" section

### Manual Verification
- [ ] Reading the skill end-to-end, the workflow flows naturally from estimate → batch → capture → detect failure → grade → benchmark
- [ ] A user reading the token estimate step would understand the cost before proceeding
- [ ] The resume mode instructions are clear enough to recover a partial run without re-running completed evals
- [ ] The lightweight mode instructions clearly distinguish structural vs behavioral expectations

## Phases

### Phase 1: Token Estimate Preview

**Goal**: Add a new Step 2.5 between "Discover Eval Cases" and "Set Up Workspace" that calculates estimated token cost and asks the user to confirm.

**Files to modify**:
| File | Change |
|------|--------|
| `skills/prism-eval/SKILL.md` | Insert new "### 2.5 Token Estimate" section after Step 2 |

**Steps**:
1. [ ] Read current SKILL.md Step 2 ending and Step 3 beginning to identify exact insertion point
2. [ ] Write new Step 2.5 with:
   - Token cost lookup table by eval dimension (research: ~55K, plan/implement/iterate: ~30K, spectrum/debug: ~22K, meta: ~24K)
   - Formula: single mode = sum(estimates), comparative = sum(estimates) × 2
   - User confirmation prompt with estimated total and percentage of ~2M budget
   - Instruction to proceed only after user confirms
3. [ ] Renumber: Steps 3→3.5, 4→4.5 etc. is NOT needed — keep as "2.5" to minimize diff

**Verification**:
```bash
grep -c "Token Estimate" skills/prism-eval/SKILL.md
# Expected: 1
```

**Checkpoint**: ⬜ Phase 1 complete

---

### Phase 2: Batched Execution

**Goal**: Rewrite Step 4 ("Spawn Eval Runs") to use batched execution with a concurrency cap of 10 agents and cheapest-first ordering.

**Files to modify**:
| File | Change |
|------|--------|
| `skills/prism-eval/SKILL.md` | Replace Step 4 content with batched execution logic |

**Steps**:
1. [ ] Replace the opening instruction "Launch all runs in parallel" with "Launch runs in BATCHES to stay within token budget"
2. [ ] Add batch size rule: "Maximum 10 agents per batch (5 eval cases × 2 configs in comparative mode)"
3. [ ] Add batch ordering instruction (cheapest first):
   - Tier 1: spectrum, debug evals (~22K/agent)
   - Tier 2: plan, iterate, implement, meta evals (~30K/agent)
   - Tier 3: research evals (~55K/agent)
4. [ ] Add inter-batch protocol: "Wait for ALL agents in current batch to complete. Capture timing data. Then spawn next batch."
5. [ ] Add running token budget check: after each batch, sum all timing.json total_tokens. If cumulative > 1.5M, warn user and ask to continue
6. [ ] Keep the existing agent prompt templates (single-version and comparative) unchanged — only the spawning strategy changes
7. [ ] Update Rule 1 from "Parallel execution — spawn all eval runs simultaneously" to "Batched execution — spawn eval runs in batches of ≤10 agents, cheapest first"

**Verification**:
```bash
grep -c "BATCHES" skills/prism-eval/SKILL.md
# Expected: 1
grep "spawn all eval runs simultaneously" skills/prism-eval/SKILL.md
# Expected: no output (old rule removed)
```

**Checkpoint**: ⬜ Phase 2 complete

---

### Phase 3: Failure Recovery

**Goal**: Add failure detection to Step 5 (Capture Timing), introduce `failed_evals.json` tracking, and add resume mode to Step 1 (Parse the Request).

**Files to modify**:
| File | Change |
|------|--------|
| `skills/prism-eval/SKILL.md` | Add failure detection to Step 5, add resume to Step 1 |

**Steps**:
1. [ ] Extend Step 5 ("Capture Timing") with failure detection logic:
   - If `total_tokens < 100` or agent output contains "out of extra usage" or "rate limit": mark as failed
   - Write `timing.json` with `"failed": true`
   - Append to `failed_evals.json` at workspace root with eval_dir, config, and reason
2. [ ] Add a note to Step 6 (Grade Outputs): "For failed runs, write grading.json with all expectations marked `skipped: true` and reason. Do NOT grade empty output."
3. [ ] Add to Step 9 (Present Results): "If any evals failed, append: 'X of Y evals failed due to token exhaustion. Run with --resume after rate limit resets.'"
4. [ ] Add "Resume Mode" subsection to Step 1 (Parse the Request):
   - Trigger: user says "resume evals" or "--resume"
   - Read `failed_evals.json` from the most recent iteration workspace
   - Only spawn agents for failed eval cases
   - After completion, merge new grading/timing into existing benchmark.json
   - Regenerate eval-viewer.html

**Verification**:
```bash
grep -c "failed_evals.json" skills/prism-eval/SKILL.md
# Expected: ≥3
grep -c "Resume Mode" skills/prism-eval/SKILL.md
# Expected: 1
```

**Checkpoint**: ⬜ Phase 3 complete

---

### Phase 4: Lightweight Mode

**Goal**: Add a new section for structural-only grading that classifies expectations and skips full agent simulation where possible.

**Files to modify**:
| File | Change |
|------|--------|
| `skills/prism-eval/SKILL.md` | Add "## Lightweight Mode" section after "Creating New Version Snapshots" |

**Steps**:
1. [ ] Add new section "## Lightweight Mode" with trigger description: user says "lightweight evals", "quick compare", or token estimate exceeds 1.5M
2. [ ] Define expectation classification:
   - **STRUCTURAL**: Can be verified by reading the SKILL.md text (e.g., "graph-navigator agent is spawned" → grep for "graph-navigator" in skill file)
   - **BEHAVIORAL**: Requires running the skill to verify (e.g., "No improvement suggestions appear in output")
3. [ ] Add workflow:
   - Step 1: Diff the two SKILL.md versions
   - Step 2: For each eval case, classify each expectation as STRUCTURAL or BEHAVIORAL
   - Step 3: Grade STRUCTURAL expectations by reading the skill file directly (no agent needed)
   - Step 4: Only spawn agents for eval cases that have ≥1 BEHAVIORAL expectation
   - Step 5: Merge structural and behavioral grades into the same grading.json
4. [ ] Add note about limitations: "Lightweight mode has lower confidence for behavioral assertions. Use full mode for release-quality benchmarks."
5. [ ] Add estimated savings: "Typically reduces token usage by 40-60%"

**Verification**:
```bash
grep -c "Lightweight Mode" skills/prism-eval/SKILL.md
# Expected: ≥1
grep -c "STRUCTURAL" skills/prism-eval/SKILL.md
# Expected: ≥2
grep -c "BEHAVIORAL" skills/prism-eval/SKILL.md
# Expected: ≥2
```

**Checkpoint**: ⬜ Phase 4 complete

---

### Phase 5: Schema Updates

**Goal**: Update `eval-schemas.md` with new fields and new schema for `failed_evals.json`.

**Files to modify**:
| File | Change |
|------|--------|
| `skills/prism-eval/references/eval-schemas.md` | Add failed field, skipped field, new schema |

**Steps**:
1. [ ] Update `timing.json` schema to include optional `"failed": true` field with description
2. [ ] Update `grading.json` schema to show the `"skipped"` variant:
   ```json
   {"text": "assertion", "passed": false, "skipped": true, "reason": "Agent hit rate limit"}
   ```
3. [ ] Add new `## failed_evals.json` section with schema:
   ```json
   {
     "failed_at": "2026-03-08T12:00:00Z",
     "evals": [
       {
         "eval_dir": "prism-debug-eval-2",
         "config": "with_skill",
         "reason": "Token exhaustion",
         "total_tokens": 499
       }
     ]
   }
   ```
4. [ ] Update the workspace directory structure diagram to include `failed_evals.json` at the iteration root level
5. [ ] Also update the corresponding file at `cmd/prism-setup/resources/plugin/skills/prism-eval/references/eval-schemas.md` if it exists (check first)

**Verification**:
```bash
grep -c "failed_evals.json" skills/prism-eval/references/eval-schemas.md
# Expected: ≥2
grep "skipped" skills/prism-eval/references/eval-schemas.md
# Expected: at least 1 match
```

**Checkpoint**: ⬜ Phase 5 complete

---

### Phase 6: Sync & Verify

**Goal**: Mirror all changes to the setup copy and verify both files match.

**Files to modify**:
| File | Change |
|------|--------|
| `cmd/prism-setup/resources/plugin/skills/prism-eval/SKILL.md` | Copy from skills/ |
| `cmd/prism-setup/resources/plugin/skills/prism-eval/references/eval-schemas.md` | Copy from skills/ (if exists) |

**Steps**:
1. [ ] Copy `skills/prism-eval/SKILL.md` → `cmd/prism-setup/resources/plugin/skills/prism-eval/SKILL.md`
2. [ ] Check if `cmd/prism-setup/resources/plugin/skills/prism-eval/references/eval-schemas.md` exists
3. [ ] If yes, copy `skills/prism-eval/references/eval-schemas.md` → that path
4. [ ] Run diff to confirm both pairs are identical
5. [ ] Read the final SKILL.md end-to-end and verify workflow coherence:
   - Step 1 includes resume mode
   - Step 2 discovers evals
   - Step 2.5 shows token estimate
   - Step 3 sets up workspace
   - Step 4 spawns in batches
   - Step 5 captures timing with failure detection
   - Step 6 grades (skipping failed)
   - Steps 7-9 unchanged
   - Lightweight Mode section exists
   - Rules updated

**Verification**:
```bash
diff skills/prism-eval/SKILL.md cmd/prism-setup/resources/plugin/skills/prism-eval/SKILL.md
# Expected: no output (identical)
```

**Checkpoint**: ⬜ Phase 6 complete

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Token estimates are wrong for new skills | Medium | Low | Estimates are soft guidance, not hard limits. User confirms before proceeding. |
| Batch ordering changes eval viewer output | Low | Low | Ordering doesn't affect grading or benchmark schema, only execution order. |
| Resume mode merges stale data | Low | Medium | Resume reads existing benchmark.json and only replaces failed entries. Timestamp in failed_evals.json provides staleness signal. |
| Lightweight mode misclassifies expectations | Medium | Medium | Clearly document that STRUCTURAL checks are textual grep-level verification, not semantic understanding. Default to BEHAVIORAL when uncertain. |

## Edge Cases

| Case | Handling |
|------|----------|
| All evals in a batch fail (total rate limit hit) | Stop immediately, write failed_evals.json, do not spawn next batch |
| User resumes but failed_evals.json doesn't exist | Tell user no failed evals found; offer to run a fresh eval |
| Lightweight mode finds 0 BEHAVIORAL expectations for an eval | Grade all expectations structurally; note in benchmark that eval was lightweight-only |
| Single-version mode (not comparative) | Batch size is 10 agents (not 5×2), no old_skill runs, lightweight mode not applicable |
| Token estimate is under 500K | Skip the confirmation prompt, proceed directly |

## Out of Scope

Explicitly excluded:
- [ ] Programmatic token tracking (would require executable code, not markdown)
- [ ] Automatic retry on failure (user must explicitly resume)
- [ ] Per-agent token budgets (Claude can't enforce mid-conversation)
- [ ] Changes to the eval viewer HTML generator
- [ ] Changes to benchmark.json top-level schema (only adding fields to sub-schemas)
- [ ] Changes to evals.json format (expectations stay as string arrays)

## Rollback Plan

If issues arise:
```bash
git diff HEAD~1 skills/prism-eval/SKILL.md  # review changes
git checkout HEAD~1 -- skills/prism-eval/SKILL.md skills/prism-eval/references/eval-schemas.md
cp skills/prism-eval/SKILL.md cmd/prism-setup/resources/plugin/skills/prism-eval/SKILL.md
```

All changes are to markdown prompt files only — no build artifacts, no runtime dependencies.

## Dependencies

**Must complete first**:
- [x] Research document: `.prism/shared/research/2026-03-08-prism-eval-token-budget.md`

**Can parallelize with**:
- [ ] Nothing — this is a standalone skill update

## Progress Log

| Phase | Status | Started | Completed | Notes |
|-------|--------|---------|-----------|-------|
| Phase 1: Token Estimate Preview | ⬜ Not started | | | |
| Phase 2: Batched Execution | ⬜ Not started | | | |
| Phase 3: Failure Recovery | ⬜ Not started | | | |
| Phase 4: Lightweight Mode | ⬜ Not started | | | |
| Phase 5: Schema Updates | ⬜ Not started | | | |
| Phase 6: Sync & Verify | ⬜ Not started | | | |

---

## Session Notes

[Space for implementation notes, discoveries, blockers]
