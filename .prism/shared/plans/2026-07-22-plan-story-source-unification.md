---
date: 2026-07-22
author: Claude
repository: prism
branch: feat/plan-story-source-unification
ticket: N/A
status: draft
research: none (source-of-truth mapped in-session from skills/ + commands/ + scripts/ + .prism/)
---

# Plan: Unify plan → story → execute on a single source of truth (stories.json)

## Overview

**Goal**: Make `stories.json` the one work-definition every executor reads — `/prism-plan` emits it, and `prism-implement`, `prism-subagent`, and `prism-spectrum` all consume it — so the plan and the story queue can never drift again.

**Research**: In-session source-of-truth map (see Context below). Confirmed against `skills/`, `commands/`, `scripts/spectrum.sh`, and `.prism/` on `GriotApps/Prism`.

**Complexity**: Medium

**Estimated Phases**: 3

### Context — the gap this closes

Today there are **three** representations of the same work, and the executors disagree on which is authoritative:

| Executor | Reads today | Should read |
|----------|-------------|-------------|
| `prism-implement` | the plan `.md` (parses phases → TodoWrite) | `stories.json` |
| `prism-subagent` | the plan `.md`, then its own `state.json` | `stories.json` (state keyed by story id) |
| `prism-spectrum` | `stories.json` ✅ | `stories.json` (already correct) |

`/prism-plan` writes a phase/step markdown to `.prism/shared/plans/` and **stops** — it never emits stories and never mentions spectrum/decompose. Getting stories requires a *separate, easily-skipped* step (`decompose_plan`, or `prism-decompose` for 500k+ specs). Result: `.prism/shared/spectrum/` sits empty and only spectrum uses stories.

**Canonical story artifact** (unchanged by this plan — we build on it):
- Path: `.prism/stories/stories.json` (flat) or `.prism/stories/<epic>/stories.json` (epic-scoped).
- Schema: `{ epic, stories: [ { id, title, description, priority, status, blockedBy, files, steps, completedAt, commitHash } ] }`.
- `scripts/spectrum.sh` already derives `progress.md` from the stories path.

**Design decisions (resolved — no open questions):**
1. **`/prism-plan` auto-emits `stories.json`** as its final step by invoking the *existing* `decompose_plan` logic (DRY — do not duplicate the plan→stories parser). Plan `.md` (human narrative) and `stories.json` (executable truth) are produced together, every time.
2. **`stories.json` is the single work-definition.** `prism-implement` and `prism-subagent` switch from parsing plan phases to reading stories. `prism-spectrum` is already correct.
3. **`plan.md` remains the human design doc.** A stable back-link (`epic` id ↔ plan filename in front-matter) ties the two so either can be found from the other.
4. **Runtime status stays per-executor but references story ids.** `state.json` (subagent) and `progress.md` (spectrum) become *status layered on stories* — they record which story id is done, not a rival task list. This is the "two kinds of source of truth" split: work-definition = unified (`stories.json`); runtime status = per-run, keyed to story ids.

## Success Criteria

### Automated (scripts)
- [ ] `node scripts/verify-story-unification.mjs` (new) passes: runs `/prism-plan` fixture → asserts `.prism/stories/stories.json` exists and is schema-valid (`epic` + `stories[]` with required keys).
- [ ] Grep guard: `prism-implement`, `implement_plan`, `prism-subagent` SKILL/command bodies contain a `stories.json` read path and **no** remaining "parse plan phases into TodoWrite/tasks" instruction as the primary source.
- [ ] `claude plugin validate .` passes clean (frontmatter/schema intact after edits).
- [ ] `scripts/spectrum.sh` still resolves `stories.json` + `progress.md` paths unchanged (no regression).

### Manual Verification
- [ ] Run one real project end-to-end: `/prism-plan` → `stories.json` auto-appears → `prism-implement`, `prism-subagent`, and `prism-spectrum` each execute from that same `stories.json`.
- [ ] Editing a story's `status` is reflected by all three executors (no divergent copy).
- [ ] `plan.md` and its `stories.json` epic are mutually discoverable via the back-link.
- [ ] A plan with zero emitted stories is flagged by `validate_plan`, not silently accepted.

## Phases

### Phase 1: Generation — `/prism-plan` emits `stories.json`

**Goal**: Every plan yields stories automatically, via the existing decompose engine (no duplicate parser).

**Files to modify**:
| File | Change |
|------|--------|
| `skills/prism-plan/SKILL.md` | Add Step 6 "Emit stories" — after writing the plan `.md`, invoke `decompose_plan` logic to write `.prism/stories/stories.json`; add `epic` id ↔ plan filename back-link to plan front-matter |
| `skills/prism-plan/references/plan-template.md` | Add `epic:` field to front-matter; note that stories are emitted from the plan's phases/steps |
| `commands/create_plan.md` | Mirror the emit-stories final step (command surface parity with the skill) |
| `commands/decompose_plan.md` | Promote to the **canonical plan→stories engine**: make it callable as the shared step (document the invariant that plan phases/steps map 1:1 to story `steps`, requirements → stories, zero dropped) |

**Files to create**:
| File | Purpose |
|------|---------|
| `.prism/shared/contracts/stories-contract.md` | The canonical `stories.json` schema + the plan↔stories mapping rules (one behavioral requirement per story; epic = one spectrum session) — single doc every skill points at |
| `scripts/verify-story-unification.mjs` | Automated check: plan fixture → stories.json exists + schema-valid |

**Steps**:
1. [ ] Write `.prism/shared/contracts/stories-contract.md` (schema + mapping rules, citing the existing `stories.json` shape).
2. [ ] Edit `skills/prism-plan/SKILL.md`: add "### 6. Emit Stories" invoking the `decompose_plan` engine to write `.prism/stories/stories.json`; add `epic` back-link to the plan front-matter block.
3. [ ] Edit `skills/prism-plan/references/plan-template.md`: add `epic:` front-matter field + a one-line "stories emitted to `.prism/stories/`" note.
4. [ ] Edit `commands/create_plan.md` to mirror the emit step.
5. [ ] Edit `commands/decompose_plan.md` to declare itself the shared engine and point at `stories-contract.md`.
6. [ ] Write `scripts/verify-story-unification.mjs`.

**Verification**:
```bash
node scripts/verify-story-unification.mjs
claude plugin validate .
```

**Checkpoint**: ⬜ Phase 1 complete

---

### Phase 2: Consumers — implement + subagent read `stories.json`

**Goal**: The two executors that parse the plan today switch to the unified stories queue; runtime status references story ids.

**Files to modify**:
| File | Change |
|------|--------|
| `skills/prism-implement/SKILL.md` | Read `.prism/stories/stories.json` as the task source (load stories → TodoWrite), grouped by `epic`/phase; keep reading `plan.md` only for narrative/context, not for task extraction |
| `commands/implement_plan.md` | Mirror: stories-first task loading |
| `skills/prism-subagent/SKILL.md` | Task list = stories from `stories.json`; `state.json` records per-story runtime status (`status`, `raised_issues`) keyed by story `id`, not a re-extracted task list |
| `skills/prism-subagent/references/state-schema.md` | Update state schema: tasks keyed by story `id`; add `stories_path` pointer; document that story definitions live in `stories.json`, state holds only run status |

**Steps**:
1. [ ] Edit `skills/prism-implement/SKILL.md`: replace "parse plan phases → TodoWrite" with "read `stories.json` → TodoWrite from stories"; cite `stories-contract.md`.
2. [ ] Edit `commands/implement_plan.md` to match.
3. [ ] Edit `skills/prism-subagent/SKILL.md`: source tasks from `stories.json`; keep the "STATE.JSON IS THE SOURCE OF TRUTH" rule but scope it to **runtime status** (story definitions come from stories.json).
4. [ ] Edit `skills/prism-subagent/references/state-schema.md`: key `tasks[]` by story `id`, add `stories_path`.

**Verification**:
```bash
# implement + subagent both operate from the same stories.json on a fixture
node scripts/verify-story-unification.mjs --check-consumers
claude plugin validate .
```

**Checkpoint**: ⬜ Phase 2 complete

---

### Phase 3: Coherence — keep plan ↔ stories in sync + guard rails

**Goal**: Iteration and validation maintain the invariant; nothing can generate a plan without stories or drift the two.

**Files to modify**:
| File | Change |
|------|--------|
| `skills/prism-iterate/SKILL.md` + `commands/iterate_plan.md` | When a plan is iterated, re-emit/patch `stories.json` so the queue tracks the edited plan (never leave stale stories) |
| `skills/prism-validate/SKILL.md` + `commands/validate_plan.md` | Add a check: plan has an `epic`, `stories.json` exists, every plan requirement maps to ≥1 story, story `id`s are stable across re-emits |
| `agents/prism-locator.md` | Teach it that a plan implies a stories file; surface both together in discovery |
| `.prism/shared/docs/` (current version doc) | One paragraph documenting the unified flow + the two-kinds-of-truth split |

**Steps**:
1. [ ] Edit `prism-iterate` skill + `iterate_plan` command: re-sync stories on plan edit (stable ids for unchanged requirements).
2. [ ] Edit `prism-validate` skill + `validate_plan` command: add the plan↔stories coverage + stable-id checks.
3. [ ] Edit `agents/prism-locator.md`: co-surface plan + stories.
4. [ ] Add the unified-flow paragraph to the current PRISM-DOCUMENTATION doc.

**Verification**:
```bash
# validate flags a plan with no stories; iterate keeps ids stable
node scripts/verify-story-unification.mjs --check-coherence
claude plugin validate .
```

**Checkpoint**: ⬜ Phase 3 complete

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing spectrum runs (path/schema change) | Low | Critical | Do **not** change the `stories.json` path or schema — this plan is additive; keep `.prism/stories/` and the current keys |
| Implement/subagent behavior shifts from phase- to story-granularity | Medium | Medium | Pilot on ONE project before rolling out; keep `plan.md` fully readable as narrative; stories carry `steps` so nothing is lost |
| `decompose_plan` maintained in two places (auto + manual) | Medium | Medium | Make `decompose_plan` the single engine both `/prism-plan` and manual invocation call — one parser, two entry points |
| Story `id` churn on plan iteration breaks in-flight runtime status | Medium | High | `prism-iterate` must preserve `id`s for unchanged requirements (hash requirement text → stable id) |

## Edge Cases

| Case | Handling |
|------|----------|
| Plan too large for one epic (>200k requirements) | Fall through to `prism-decompose` multi-epic path (already exists) — `/prism-plan` detects size and delegates |
| Plan iterated after stories already in progress | Re-emit patches stories: add/modify by stable id, never wipe completed `status`/`commitHash` |
| Manual `decompose_plan` still run standalone | Same engine, same output path — idempotent |
| Executor run before stories emitted (legacy plan) | Consumers detect missing `stories.json` and prompt to run the emit step, rather than silently parsing the plan |

## Structural Impact Analysis

Structural analysis skipped: the change surface is **skill/command markdown + one shell script + one new verify script**, not graph-indexed source functions. Blast radius is bounded to the Prism plugin's authoring/execution skills listed above; no application runtime code changes.

## Out of Scope

Explicitly excluded:
- [ ] Changing the `stories.json` schema or its `.prism/stories/` path (additive only).
- [ ] Rewriting `scripts/spectrum.sh` (it already reads stories correctly).
- [ ] The `prism-decompose` big-spec (500k+) path (already emits stories — left as-is, only referenced).
- [ ] The DGS Definitive Plan → `.prism` generation (separate workstream; this unifies Prism-internal flow only).
- [ ] Running `/prism-plan` across every Griot project (that is the *next* step, gated on this).

## Rollback Plan

If critical issues arise:
```bash
git revert HEAD~N..HEAD   # revert the skill/command/doc edits (all markdown + 1 script)
claude plugin validate .  # confirm clean state restored
```
Because every executor's *old* plan-reading path is only softened (not deleted) until Phase 3, reverting any single phase leaves a working system.

## Dependencies

**Must complete first**:
- [ ] None — self-contained within the Prism plugin.

**Can parallelize with**:
- [ ] Cinopsis fix (separate repo, no overlap).

**Blocks**:
- [ ] First-pass `/prism-plan` across every Griot project (do *after* this lands).

## Progress Log

| Phase | Status | Started | Completed | Notes |
|-------|--------|---------|-----------|-------|
| Phase 1 — Generation | ⬜ Not started | | | |
| Phase 2 — Consumers | ⬜ Not started | | | |
| Phase 3 — Coherence | ⬜ Not started | | | |

---

## Session Notes

[Space for implementation notes, discoveries, blockers]
