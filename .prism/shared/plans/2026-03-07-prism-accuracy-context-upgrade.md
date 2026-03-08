---
date: 2026-03-07
author: Claude
repository: prism-plugin
branch: feat/accuracy-context-upgrade
ticket: N/A
status: draft
research: .prism/shared/research/2026-03-07-prism-v250-gap-analysis.md
---

# Plan: Prism Accuracy & Context Upgrade (Research-v5 Immediate Tier)

## Overview

**Goal**: Implement the three zero-dependency upgrade recommendations from the gap analysis — script-backed Spectrum operations, agent frontmatter standardization, and story manifests with contracts layer — to close accuracy gaps (80% → 100% on deterministic operations), reduce `prism-spectrum` context by ~120 lines, and add structured cross-session coordination state.

**Research**: `.prism/shared/research/2026-03-07-prism-v250-gap-analysis.md`

**Complexity**: Medium

**Estimated Phases**: 6

## Success Criteria

### Automated Verification
- [ ] `spectrum.sh` passes all existing tests: `bash scripts/tests/test_install.sh`
- [ ] New `spectrum.sh` functions pass dedicated unit tests (story selection, status update, schema validation)
- [ ] `jq` story selection produces identical results to manual selection on sample `stories.json`
- [ ] `stories.json` with missing fields or invalid schema is rejected before loop entry
- [ ] All 11 agent `.md` files have valid YAML frontmatter (parseable `---` blocks)
- [ ] `decompose_plan` generates valid `story-manifest.json` alongside `stories.json`

### Manual Verification
- [ ] Run `spectrum.sh` against a test `stories.json` — observe deterministic story picking (no LLM involvement)
- [ ] Signal detection works correctly: COMPLETE, continue, retry, blocked, error, and no-signal-fallback
- [ ] `prism-spectrum` skill still functions correctly with reduced line count
- [ ] `/decompose_plan` on an existing plan produces both `stories.json` and `story-manifest.json`
- [ ] `.prism/shared/contracts/` directory is created by `init_prism.py`

## Phases

### Phase 1: Script-back `spectrum.sh` Deterministic Operations

**Goal**: Move story selection, status updates, and post-iteration state checks from LLM to deterministic `jq` functions in `spectrum.sh`.

**Files to modify**:
| File | Change |
|------|--------|
| `scripts/spectrum.sh` | Add `select_next_story()`, `update_story_status()`, `validate_schema()`, `append_progress()` functions; update `run_iteration()` to pre-select story and pass ID to Claude; add post-iteration `jq` state check alongside signal parsing |

**Steps**:
1. [ ] Add `validate_schema()` function (~line 94, after `check_prerequisites`) — validates `stories.json` has `.epic.name`, `.stories` array, each story has `id`, `status`, `priority`, `blockedBy` fields. Exit with clear error if invalid.
2. [ ] Add `select_next_story()` function (~line 104, after `count_total`) — `jq` query: filter stories where `status != "complete"`, exclude stories whose `blockedBy` references an incomplete story, sort by `.priority`, take first. Return story ID or empty string if none available.
3. [ ] Add `update_story_status()` function — takes story ID and new status, uses `jq` to update in-place: `.stories[] | select(.id == $ID) .status = $STATUS`. Write to temp file, validate JSON, then `mv` to original.
4. [ ] Add `append_progress()` function — takes iteration number, story ID, outcome string. Appends timestamped entry to `$PROGRESS_FILE` via `cat >>`.
5. [ ] Update `run_iteration()` (line 155) — call `select_next_story()` first. If empty, return COMPLETE signal directly (no Claude invocation needed). Pass selected story ID in the Claude prompt: `"Execute story $STORY_ID from $STORIES_FILE..."`.
6. [ ] Add post-iteration state verification after `check_signals()` (line 253) — re-read `stories.json` via `count_remaining`. If `remaining == 0`, override signal to COMPLETE regardless of what Claude emitted. If remaining unchanged from before iteration, treat as retry.
7. [ ] Call `validate_schema` in `main()` after `check_prerequisites` (line 213).

**Verification**:
```bash
# Schema validation rejects bad input
echo '{"bad": true}' > /tmp/test-stories.json
bash scripts/spectrum.sh /tmp/test-stories.json  # Should exit with schema error

# Story selection picks lowest priority pending unblocked story
# (manual check with sample stories.json)
```

**Checkpoint**: Phase 1 complete

---

### Phase 2: Harden `spectrum.sh` Error Handling

**Goal**: Fix the 4 error handling gaps identified in the gap analysis — exit code swallowing, missing signal fallback, no lockfile, no post-iteration verification.

**Files to modify**:
| File | Change |
|------|--------|
| `scripts/spectrum.sh` | Fix `run_iteration` exit code handling, improve no-signal behavior, add lockfile, log iteration outcomes |

**Steps**:
1. [ ] Fix `run_iteration()` exit code (line 249) — replace `output=$(run_iteration) || true` with proper exit code capture: `local iter_exit=0; output=$(run_iteration) || iter_exit=$?`. If `iter_exit != 0`, log the exit code and treat as retry (not silent continue).
2. [ ] Improve no-signal fallback (line 207-208) — instead of silently returning "continue", log a warning: `warn "No signal detected in output ($(echo "$output" | wc -c) bytes). Treating as retry."` and return 2 (retry) instead of 1 (continue).
3. [ ] Add lockfile mechanism — create `$PROJECT_DIR/.prism/local/spectrum.lock` with PID at start of `main()`. Check for existing lock and exit if another instance is running. Remove lock in a `trap EXIT`.
4. [ ] Add iteration outcome logging — after each iteration, append a one-line summary to `$PROGRESS_FILE` via `append_progress()`: timestamp, iteration number, story ID, signal received, remaining count.

**Verification**:
```bash
# Lockfile prevents concurrent runs
bash scripts/spectrum.sh &
bash scripts/spectrum.sh  # Should exit with "already running" error
kill %1

# No-signal now warns and retries instead of silently continuing
```

**Checkpoint**: Phase 2 complete

---

### Phase 3: Reduce `prism-spectrum` Skill

**Goal**: Remove mechanical JSON/signal instructions from `prism-spectrum` SKILL.md now that `spectrum.sh` handles them deterministically. Reduce from ~406 to ~280 lines.

**Files to modify**:
| File | Change |
|------|--------|
| `skills/prism-spectrum/SKILL.md` | Remove story selection logic (now in spectrum.sh), remove JSON status update instructions (now in spectrum.sh), simplify signal emission section (spectrum.sh verifies post-hoc), remove stories.json manipulation examples |

**Steps**:
1. [ ] Read the full `prism-spectrum/SKILL.md` and identify all sections that describe deterministic operations now handled by `spectrum.sh`.
2. [ ] Remove/simplify the story selection section — replace detailed priority/blocker logic with: "The story to execute is provided in your prompt by spectrum.sh. Focus on implementation, not selection."
3. [ ] Remove/simplify JSON status update instructions — replace with: "spectrum.sh handles status updates after your session. Focus on implementation and committing code."
4. [ ] Simplify signal emission section — keep the signal tag list but remove the detailed verification logic (spectrum.sh now does post-hoc state verification). Reduce to: "Emit the appropriate signal tag at the end of your response. spectrum.sh will independently verify story completion state."
5. [ ] Remove the `stories.json` re-reading and counting instructions (lines ~233-258) — this is now done by `spectrum.sh` post-iteration.
6. [ ] Verify the skill still correctly describes: implementation workflow, quality gate execution, debug agent spawning on failure, commit protocol, progress.md context.

**Verification**:
```bash
# Line count check
wc -l skills/prism-spectrum/SKILL.md  # Target: ~280 lines (down from ~406)

# Manual: invoke /prism-spectrum in a test session and verify it still runs the implementation workflow correctly
```

**Checkpoint**: Phase 3 complete

---

### Phase 4: Standardize Agent Frontmatter

**Goal**: Add YAML frontmatter to the 3 debug investigators and add the "documentarian, not critic" constraint to `prism-analyzer`.

**Files to modify**:
| File | Change |
|------|--------|
| `agents/git-investigator.md` | Add YAML frontmatter with `name`, `description`, `tools: Bash`, `model: haiku` |
| `agents/log-investigator.md` | Add YAML frontmatter with `name`, `description`, `tools: Bash`, `model: haiku` |
| `agents/state-investigator.md` | Add YAML frontmatter with `name`, `description`, `tools: Bash`, `model: haiku` |
| `agents/prism-analyzer.md` | Add "documentarian, not critic" note to behavioral constraints |

**Steps**:
1. [ ] Add YAML frontmatter to `git-investigator.md` — prepend `---` block with `name: git-investigator`, `description: Analyzes git history to find changes related to a reported issue. Use Task tool with subagent_type="git-investigator" for git state and history analysis during debug investigations.`, `tools: Bash`, `model: haiku`. Remove the `## Model` heading and its `haiku` content (lines 5-6) since model is now in frontmatter.
2. [ ] Add YAML frontmatter to `log-investigator.md` — same pattern. `name: log-investigator`, description about log analysis, `tools: Bash`, `model: haiku`. Remove `## Model` section.
3. [ ] Add YAML frontmatter to `state-investigator.md` — same pattern. `name: state-investigator`, description about application state examination, `tools: Bash`, `model: haiku`. Remove `## Model` section.
4. [ ] Add documentarian constraint to `prism-analyzer.md` — after the "Filter Aggressively" section (~line 20), add a note: "When analyzing research documents, describe findings factually. Do not critique the codebase, suggest improvements, or editorialize beyond what the document states. Your role is to extract and relay insights, not to generate new opinions about the code."

**Verification**:
```bash
# All 11 agents now have YAML frontmatter
for f in agents/*.md; do head -1 "$f"; done
# All should output "---"
```

**Checkpoint**: Phase 4 complete

---

### Phase 5: Create Story Manifest Schema + Contracts Layer

**Goal**: Define the `story-manifest.json` schema, create the `.prism/shared/contracts/` directory convention, and update `init_prism.py` to include the new directories.

**Files to modify**:
| File | Change |
|------|--------|
| `skills/prism/scripts/init_prism.py` | Add `.prism/shared/contracts/` and `.prism/shared/validation/baselines/` to directory creation list |

**Files to create**:
| File | Purpose |
|------|---------|
| `skills/prism-spectrum/references/story-manifest-schema.md` | JSON schema documentation for `story-manifest.json` |
| `skills/prism-spectrum/references/contracts-convention.md` | Convention documentation for `.prism/shared/contracts/` directory |

**Steps**:
1. [ ] Create `story-manifest-schema.md` — document the JSON schema for `story-manifest.json`:
   ```json
   {
     "story_id": "string (matches stories.json story ID)",
     "requirements": [{
       "id": "REQ-NNN",
       "description": "string",
       "depends_on": ["REQ-NNN"],
       "owns_files": ["src/path/to/file.ts"],
       "gate": "npm test -- --grep 'pattern'",
       "contracts_to_read": ["interfaces.json"],
       "contracts_to_write": ["api-endpoints.json"],
       "passes": false
     }],
     "last_session": {
       "timestamp": "ISO-8601",
       "commit": "short-hash",
       "requirements_passing": 0,
       "requirements_total": 0
     }
   }
   ```
2. [ ] Create `contracts-convention.md` — document the contracts directory structure:
   ```
   .prism/shared/contracts/
   ├── interfaces.json       # Type shapes between domains
   ├── api-endpoints.json    # Endpoint contracts
   ├── component-props.json  # UI component prop contracts
   ├── dependencies.json     # Cross-domain dependency graph
   └── test-obligations.json # What each domain must verify
   ```
   Include lifecycle documentation: proposed → agreed → verified.
3. [ ] Update `init_prism.py` (line 35, directory list) — add `shared/contracts` and `shared/validation/baselines` to the directories created during initialization.

**Verification**:
```bash
# init_prism.py creates new directories
python skills/prism/scripts/init_prism.py --help  # Verify it runs
ls -la .prism/shared/contracts/  # Should exist after running
ls -la .prism/shared/validation/baselines/  # Should exist after running
```

**Checkpoint**: Phase 5 complete

---

### Phase 6: Update `/decompose_plan` for Manifest Generation

**Goal**: Extend the `/decompose_plan` command to generate `story-manifest.json` files alongside `stories.json`, and update `prism-spectrum` to read manifests when available.

**Files to modify**:
| File | Change |
|------|--------|
| `commands/decompose_plan.md` | Add Step 7: generate `story-manifest.json` per story from phase steps and success criteria |
| `skills/prism-spectrum/SKILL.md` | Add manifest-aware requirement tracking — if `story-manifest.json` exists for the current story, track per-requirement pass/fail |

**Steps**:
1. [ ] Add manifest generation step to `decompose_plan.md` — after story creation (Step 6), add Step 7: "For each story, generate a companion `story-manifest.json` at `.prism/stories/<story-id>-manifest.json` (or `.prism/stories/<epic>/<story-id>-manifest.json` for epic-scoped). Map each story step to a requirement with `id`, `description`, `depends_on` (from step ordering), `owns_files` (from story files list), and `gate` (from epic quality gates or phase verification commands)."
2. [ ] Add manifest consumption to `prism-spectrum` SKILL.md — in the "Implement Story" section, add: "If a manifest file exists at `.prism/stories/<story-id>-manifest.json`, read it and implement one requirement at a time. After each requirement, run its `gate` command. Update `passes: true` in the manifest on success. This enables cross-session tracking of partial story progress."
3. [ ] Add contracts initialization to `decompose_plan.md` — after manifest generation: "If any story has cross-domain dependencies (multiple stories touching the same interfaces), create `.prism/shared/contracts/interfaces.json` with the shared type shapes identified during decomposition."

**Verification**:
```bash
# Manual: run /decompose_plan on an existing plan
# Verify both stories.json and story-manifest.json files are created
# Verify manifest requirements map to story steps
```

**Checkpoint**: Phase 6 complete

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `spectrum.sh` script changes break existing workflows | Medium | High | Phase 2 adds tests; keep old signal parsing as fallback alongside new state verification |
| `prism-spectrum` skill reduction removes necessary instructions | Low | High | Careful diff review; manual test run before committing |
| Story manifest schema is too rigid for diverse projects | Medium | Medium | Keep manifests optional — `prism-spectrum` works with or without them |
| Agent frontmatter changes affect Claude Code discovery | Low | Low | YAML frontmatter is the standard format; this fixes an inconsistency |
| `decompose_plan` manifest generation adds complexity to already-large command (306 lines) | Medium | Medium | Keep manifest generation as a clearly separated step; consider extracting to a script if over 400 lines |

## Edge Cases

| Case | Handling |
|------|----------|
| `stories.json` with no pending stories | `select_next_story()` returns empty; `spectrum.sh` exits with COMPLETE |
| Story blocked by another story that was skipped | `select_next_story()` treats skipped/blocked stories as non-complete; blocked story stays in queue |
| `story-manifest.json` doesn't exist for a story | `prism-spectrum` falls back to current behavior (implement all steps, no per-requirement tracking) |
| Multiple stories depend on the same contract | First story creates the contract; subsequent stories read it. No locking needed (sequential execution in Spectrum) |
| `init_prism.py` run on a project that already has `.prism/` | `mkdir -p` with `exist_ok=True` handles idempotently |
| Agent frontmatter migration on projects using old agents | YAML frontmatter is additive; old agent behavior preserved, just formalized |

## Out of Scope

Explicitly excluded:
- [ ] Deferred loading (`defer_loading: true`) — blocked on Claude Code API
- [ ] Programmatic Tool Calling (PTC) — blocked on Claude Code API
- [ ] Agent Teams integration — experimental, API unstable
- [ ] Visual regression testing (`visual-regression.sh`) — separate plan
- [ ] Neo4j eval backbone — separate plan
- [ ] `/loop` continuous validation — depends on visual regression
- [ ] Scheduled tasks integration — depends on validation architecture
- [ ] Agent deferral (deferring specialist agents) — blocked on Claude Code API

## Rollback Plan

If critical issues arise:
```bash
git revert HEAD~N..HEAD  # Revert all commits from this feature branch
```

Each phase produces independent commits, so partial rollback is possible:
- Phase 1-2 (spectrum.sh) can be reverted independently of Phase 3-6
- Phase 4 (agent frontmatter) is purely additive and safe
- Phase 5-6 (manifests/contracts) are new files only — revert by removing

## Dependencies

**Must complete first**:
- [ ] None — all phases use zero-dependency techniques

**Can parallelize with**:
- [ ] Visual regression testing plan (independent concern)
- [ ] Neo4j eval backbone plan (independent concern)

## Progress Log

| Phase | Status | Started | Completed | Notes |
|-------|--------|---------|-----------|-------|
| Phase 1: Script-back spectrum.sh | Not started | | | |
| Phase 2: Harden error handling | Not started | | | |
| Phase 3: Reduce prism-spectrum | Not started | | | |
| Phase 4: Standardize agent frontmatter | Not started | | | |
| Phase 5: Story manifest + contracts | Not started | | | |
| Phase 6: Update decompose_plan | Not started | | | |

---

## Session Notes

[Space for implementation notes, discoveries, blockers]
