---
date: 2026-03-07
author: Claude
repository: prism-plugin
branch: feat/visual-regression
ticket: N/A
status: draft
research: .prism/shared/research/2026-03-07-prism-v250-gap-analysis.md
---

# Plan: Visual Regression Testing — Closing the Tier 1/Tier 2 Gap

## Overview

**Goal**: Add pixel-level visual regression testing to Prism's validation architecture. Create a deterministic capture-and-diff script (zero LLM tokens), a Sonnet grader agent for ambiguous diffs, baseline storage in `.prism/shared/`, and wire it into both `prism-validate` (as a "Tier 1.5" gate) and `prism-spectrum` (auto-triggered for UI stories).

**Research**: `.prism/shared/research/2026-03-07-prism-v250-gap-analysis.md` (Gap 2 — Tier 1↔Tier 2 validation disconnect), `.prism/shared/docs/multi-agent-workflow/prism-upgrade-research-v5.md` (Part 5)

**Complexity**: High

**Estimated Phases**: 7

## Success Criteria

### Automated Verification
- [ ] `scripts/visual-regression.sh` captures a screenshot and diffs against a baseline, outputs JSON with `change_pct` and `diff_path`
- [ ] Script exits 0 when change is below threshold, exits 1 when above
- [ ] Script handles missing baseline gracefully (creates new baseline, exits 0)
- [ ] `visual-regression-grader` agent returns structured JSON verdict: `regression`, `intentional`, or `inconclusive`
- [ ] `prism-validate` runs visual regression gate when baselines exist for the story
- [ ] `prism-spectrum` auto-triggers visual regression after quality gates for stories modifying UI files

### Manual Verification
- [ ] Run `visual-regression.sh` against a real page — verify screenshot, diff image, and JSON output are produced
- [ ] Intentionally break a UI element, run regression — verify diff highlights the change
- [ ] Update a baseline — verify next run passes
- [ ] In a Spectrum run with a UI story, verify visual regression runs automatically

## Phases

### Phase 1: Create `visual-regression.sh` Script

**Goal**: Deterministic script that captures a screenshot via `playwright-cli`, diffs against a stored baseline, and outputs structured JSON results.

**Files to create**:
| File | Purpose |
|------|---------|
| `scripts/visual-regression.sh` | Core visual regression script (~120 lines) |

**Steps**:
1. [ ] Create `scripts/visual-regression.sh` with the following interface:
   ```bash
   # Usage: visual-regression.sh <url> <baseline-dir> <name> [--threshold 0.01] [--viewport 1280x720]
   # Output: JSON to stdout with fields: name, url, baseline_path, screenshot_path, diff_path, change_pct, threshold, passed
   # Exit: 0 if passed (change_pct <= threshold or new baseline), 1 if failed (change_pct > threshold)
   ```
2. [ ] Implement prerequisite check — verify `playwright-cli` is installed, exit with clear error if not
3. [ ] Implement screenshot capture — use `playwright-cli screenshot <url> --output <path>` with configurable viewport
4. [ ] Implement baseline check — if no baseline exists at `<baseline-dir>/<name>.png`, save current screenshot as baseline and exit 0 with `"new_baseline": true` in JSON
5. [ ] Implement pixel diff — use `playwright-cli` PDF comparison or call `npx pixelmatch` to compare current vs baseline. Output diff image to `<baseline-dir>/../diffs/<date>/<name>-diff.png`
6. [ ] Implement threshold check — calculate `change_pct` (changed pixels / total pixels). Compare against `--threshold` (default 0.01 = 1%). Output JSON result to stdout.
7. [ ] Add `set -euo pipefail`, proper temp file cleanup in a `trap EXIT`, and clear error messages for each failure mode

**Verification**:
```bash
# Capture baseline
bash scripts/visual-regression.sh http://localhost:5173 .prism/shared/validation/baselines/test test-page
# Should create baseline and output JSON with new_baseline: true

# Run again (should pass with 0% change)
bash scripts/visual-regression.sh http://localhost:5173 .prism/shared/validation/baselines/test test-page
# Should output JSON with change_pct: 0, passed: true
```

**Checkpoint**: Phase 1 complete

---

### Phase 2: Create Baseline Storage Convention

**Goal**: Establish the directory structure for visual baselines and diffs, and integrate with `init_prism.py`.

**Files to modify**:
| File | Change |
|------|--------|
| `skills/prism/scripts/init_prism.py` | Add `shared/validation/baselines/` and `shared/validation/diffs/` to directory creation (if not already added by accuracy-context-upgrade Phase 5) |

**Files to create**:
| File | Purpose |
|------|---------|
| `skills/prism-verify/references/visual-regression-patterns.md` | Documentation: baseline management, naming conventions, threshold tuning, multi-viewport patterns |

**Steps**:
1. [ ] Verify `init_prism.py` creates `shared/validation/baselines/` and `shared/validation/diffs/` (may already exist from accuracy-context-upgrade Phase 5). If not, add them.
2. [ ] Create `visual-regression-patterns.md` documenting:
   - Directory structure:
     ```
     .prism/shared/validation/
     ├── baselines/
     │   ├── <story-id>/
     │   │   ├── homepage.png
     │   │   ├── homepage-mobile.png
     │   │   └── login-form.png
     │   └── <story-id>/
     ├── diffs/
     │   └── YYYY-MM-DD/
     │       ├── homepage-diff.png
     │       └── homepage-diff.json
     └── YYYY-MM-DD-report.md
     ```
   - Naming convention: `<page-name>[-viewport].png`
   - Multi-viewport patterns: desktop (1280x720), tablet (768x1024), mobile (375x812)
   - Threshold tuning guidance: 0.001 for pixel-perfect, 0.01 for layout stability, 0.05 for rough check
   - Baseline update workflow: delete old baseline, re-run to create new one
3. [ ] Add `.prism/shared/validation/diffs/` to `.gitignore` (diffs are ephemeral; baselines are committed)

**Verification**:
```bash
python skills/prism/scripts/init_prism.py
ls .prism/shared/validation/baselines/  # Should exist
ls .prism/shared/validation/diffs/      # Should exist
```

**Checkpoint**: Phase 2 complete

---

### Phase 3: Create `visual-regression-grader` Agent

**Goal**: A Sonnet agent that judges ambiguous visual diffs — determines whether a change is a regression, an intentional change, or inconclusive.

**Files to create**:
| File | Purpose |
|------|---------|
| `agents/visual-regression-grader.md` | Sonnet agent that judges diff results against story context |

**Steps**:
1. [ ] Create `agents/visual-regression-grader.md` with YAML frontmatter:
   ```yaml
   ---
   name: visual-regression-grader
   description: Judges visual regression diff results against story context. Use Task tool with subagent_type="visual-regression-grader" when visual-regression.sh detects changes above threshold. Returns structured verdict (regression/intentional/inconclusive).
   tools: Read, Glob, Grep
   model: sonnet
   ---
   ```
2. [ ] Define the agent's input contract — it receives: diff JSON from `visual-regression.sh`, the diff image path, the story context (story ID, description, files modified), and the plan's Manual Verification criteria
3. [ ] Define the agent's output contract — structured JSON:
   ```json
   {
     "verdict": "regression|intentional|inconclusive",
     "confidence": 0.0-1.0,
     "evidence": "Explanation of judgment",
     "recommendation": "revert|update_baseline|investigate",
     "affected_elements": ["list of UI elements that changed"]
   }
   ```
4. [ ] Add behavioral constraints: read the diff image (multimodal), compare against the story's expected changes, check if modified files include CSS/layout/component files that would explain visual changes
5. [ ] Add the "documentarian, not critic" constraint — report findings factually

**Verification**:
```bash
# Agent file has valid YAML frontmatter
head -6 agents/visual-regression-grader.md  # Should show --- block with name, description, tools, model
```

**Checkpoint**: Phase 3 complete

---

### Phase 4: Wire Visual Regression into `prism-verify`

**Goal**: Extend the existing `prism-verify` skill and command to support visual regression as an additional verification type alongside screenshot/console/snapshot/network.

**Files to modify**:
| File | Change |
|------|--------|
| `skills/prism-verify/SKILL.md` | Add step between screenshot capture and cleanup: run `visual-regression.sh` if baselines exist for the context |
| `skills/prism-verify/references/verification-template.md` | Add `visual-regression` check type to the schema (lines 43-49) with fields for `baseline_path`, `diff_path`, `change_pct`, `threshold`, `verdict` |
| `skills/prism-verify/references/verification-patterns.md` | Add visual regression recipe section after DOM snapshot section (line 58) |
| `commands/prism-verify.md` | Add visual regression step to the command workflow |

**Steps**:
1. [ ] Update `verification-template.md` (lines 43-49) — add `visual-regression` to check types table:
   ```
   | visual-regression | Pixel-level comparison against stored baseline |
   ```
   Add fields to the JSON schema (lines 8-30): `baseline_path`, `diff_path`, `change_pct`, `threshold`, `verdict`, `grader_output`
2. [ ] Update `verification-patterns.md` — add a "Visual Regression" recipe section after the DOM snapshot section (after line 58):
   - How to run `visual-regression.sh` from a skill
   - How to interpret the JSON output
   - When to spawn `visual-regression-grader` (only when `change_pct > threshold`)
   - How to update baselines
3. [ ] Update `prism-verify/SKILL.md` — add a step after screenshot capture (after line 86): "If baselines exist in `.prism/shared/validation/baselines/` for the current story/context, run `scripts/visual-regression.sh` for each baseline. If any diff exceeds threshold, spawn `visual-regression-grader` agent to judge. Include results in the verification output."
4. [ ] Update `commands/prism-verify.md` — add the same visual regression step to the command workflow (after line 83, after browser-verifier agent returns)

**Verification**:
```bash
# Manual: create a baseline, then invoke /prism-verify
# Verify the verification-result.json includes visual-regression check type
```

**Checkpoint**: Phase 4 complete

---

### Phase 5: Wire Visual Regression into `prism-validate` (Tier 1.5)

**Goal**: Add visual regression as an automated gate in plan validation, bridging Tier 1 (quality gates) and Tier 2 (browser verification).

**Files to modify**:
| File | Change |
|------|--------|
| `skills/prism-validate/SKILL.md` | Add visual regression gate after automated criteria (line 48), before manual criteria (line 49) |
| `skills/prism-validate/references/validation-template.md` | Add "Visual Regression" section to the report template between Automated and Manual criteria (lines 124-127) |

**Steps**:
1. [ ] Update `prism-validate/SKILL.md` — after running automated verification commands (line 48), add:
   ```
   ### Tier 1.5: Visual Regression Gate
   If baselines exist in `.prism/shared/validation/baselines/` for any story in the plan:
   1. Start the dev server (same pattern as prism-verify)
   2. For each baseline, run `scripts/visual-regression.sh`
   3. If any diff exceeds threshold, spawn `visual-regression-grader` to judge
   4. Record results in the validation report
   5. A verdict of "regression" counts as a validation failure
   ```
2. [ ] Update `validation-template.md` — add a "Visual Regression" section between Automated Criteria (line 124) and Manual Criteria (line 127):
   ```markdown
   ### Visual Regression
   | Page | Baseline | Change % | Threshold | Verdict | Diff |
   |------|----------|----------|-----------|---------|------|
   | login-page | .prism/shared/validation/baselines/auth/login-page.png | 0.3% | 1% | pass | N/A |
   ```
3. [ ] Add a connection note: "If visual regression fails, consider running `/prism-verify` for interactive investigation before marking the plan as incomplete."

**Verification**:
```bash
# Manual: run /prism-validate on a plan with UI phases
# Verify the validation report includes a Visual Regression section
```

**Checkpoint**: Phase 5 complete

---

### Phase 6: Wire Visual Regression into `prism-spectrum`

**Goal**: Auto-trigger visual regression for Spectrum stories that modify UI files. Update story manifests with visual regression results.

**Files to modify**:
| File | Change |
|------|--------|
| `skills/prism-spectrum/SKILL.md` | After quality gates pass (implementation section), add: if story modifies UI files (`.tsx`, `.jsx`, `.css`, `.scss`, `.html`), run `visual-regression.sh` against baselines. Record results in `story-manifest.json` if it exists. |

**Steps**:
1. [ ] Add UI file detection heuristic to `prism-spectrum` — after quality gates pass, check if any files in the story's `files` array have UI extensions (`.tsx`, `.jsx`, `.vue`, `.svelte`, `.css`, `.scss`, `.html`, `.svg`)
2. [ ] If UI files detected and baselines exist: start dev server, run `visual-regression.sh` for each baseline in the story's baseline directory (`.prism/shared/validation/baselines/<story-id>/`)
3. [ ] If diff exceeds threshold: spawn `visual-regression-grader` agent. If verdict is `regression`, record in `progress.md` and emit `<spectrum-retry>` signal with reason. If verdict is `intentional`, update the baseline automatically.
4. [ ] If story manifest exists (`story-manifest.json`): update the relevant requirement's `passes` field based on visual regression result
5. [ ] Keep visual regression optional — if no baselines exist or `playwright-cli` is not installed, skip gracefully (log, don't fail)

**Verification**:
```bash
# Manual: create a Spectrum story that modifies a .tsx file
# Create baselines for the story's pages
# Run spectrum.sh and verify visual regression runs automatically
# Check progress.md for visual regression results
```

**Checkpoint**: Phase 6 complete

---

### Phase 7: Document `/loop` Continuous Validation Pattern

**Goal**: Document how to use Claude Code's `/loop` command for near-real-time visual regression during UI implementation.

**Files to modify**:
| File | Change |
|------|--------|
| `skills/prism-verify/references/visual-regression-patterns.md` | Add "Continuous Validation with /loop" section |
| `skills/prism/references/workflow-patterns.md` | Add visual regression loop as a workflow pattern |

**Steps**:
1. [ ] Add `/loop` pattern to `visual-regression-patterns.md`:
   ```
   ## Continuous Validation with /loop

   During active UI implementation, run visual regression continuously:

   /loop 5m "Run visual-regression.sh for all baselines in
   .prism/shared/validation/baselines/<story-id>/. Start dev server if
   not running. Write results to .prism/shared/validation/diffs/. If
   regressions detected, append to progress.md."

   This provides near-real-time feedback on visual regressions during
   implementation without waiting for the Validate phase.
   ```
2. [ ] Add workflow pattern to `workflow-patterns.md` — "Visual Regression Loop" alongside existing patterns (ticket lifecycle, worktree isolation, etc.)
3. [ ] Document the scheduled task variant for weekly full regression:
   ```yaml
   # ~/.claude/scheduled-tasks/visual-regression-weekly/SKILL.md
   frequency: weekly
   day: monday
   time: "09:00"
   ---
   Run visual-regression.sh for all baselines in .prism/shared/validation/baselines/.
   Generate a regression report. If regressions found, create a GitHub issue.
   ```

**Verification**:
```bash
# Manual: verify documentation is clear and complete
# Run /loop with the documented command during a UI implementation session
```

**Checkpoint**: Phase 7 complete

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `playwright-cli` not available on all systems | High | Medium | Graceful skip — all visual regression is optional. Log clear message, proceed without it. |
| Screenshot flakiness (fonts, rendering differences) | Medium | High | Configurable threshold (default 1%); document anti-flake patterns (wait for fonts, fixed viewport) |
| Baseline bloat in git (PNG files) | Medium | Medium | Keep baselines small (compress PNGs); document `.gitattributes` LFS pattern for large projects |
| `pixelmatch` or equivalent not installed | Medium | Low | Bundle or document as prerequisite; fallback to file-size comparison if unavailable |
| Dev server startup race condition | Low | Medium | Reuse prism-verify's polling pattern (30s timeout with health check) |
| Grader agent misjudges a diff | Low | Medium | Grader outputs confidence score; low confidence → flag for human review instead of auto-deciding |

## Edge Cases

| Case | Handling |
|------|----------|
| No baselines exist for a story | Skip visual regression, log info message |
| Baseline exists but page doesn't load | Script exits 1 with JSON indicating load failure, not a diff failure |
| Multiple viewports for same page | Convention: `<name>-desktop.png`, `<name>-mobile.png` — script runs each |
| Dev server already running | Detect existing server on port, reuse it |
| Baseline for a deleted page | Script notes "page not found", doesn't auto-delete baseline |
| Dark mode / theme variants | Separate baselines: `login-light.png`, `login-dark.png` |

## Out of Scope

Explicitly excluded:
- [ ] Neo4j integration for visual regression history (separate plan)
- [ ] Agent Teams for parallel visual regression across pages
- [ ] Deferred loading of visual regression components
- [ ] CSS-only regression detection (this plan covers pixel-level only)
- [ ] Cross-browser testing (Chromium only via playwright-cli)
- [ ] Performance regression testing (load times, rendering speed)

## Rollback Plan

If critical issues arise:
```bash
git revert HEAD~N..HEAD
```

Each phase is independent:
- Phase 1 (script) is standalone, always safe to revert
- Phase 2 (storage) is directory creation only
- Phase 3 (agent) is a new file, revert by deleting
- Phases 4-6 (wiring) modify existing skills — revert by reverting those files
- Phase 7 (docs) is additive only

## Dependencies

**Must complete first**:
- [ ] Accuracy-context-upgrade Phase 5 (story manifests + contracts layer) — for story-manifest.json integration in Phase 6

**Can parallelize with**:
- [ ] Accuracy-context-upgrade Phases 1-4 (spectrum.sh hardening, agent frontmatter)
- [ ] Neo4j eval dashboard plan (independent until its Phase 5 visual regression history view)

## Progress Log

| Phase | Status | Started | Completed | Notes |
|-------|--------|---------|-----------|-------|
| Phase 1: visual-regression.sh | Not started | | | |
| Phase 2: Baseline storage | Not started | | | |
| Phase 3: Grader agent | Not started | | | |
| Phase 4: Wire into prism-verify | Not started | | | |
| Phase 5: Wire into prism-validate | Not started | | | |
| Phase 6: Wire into prism-spectrum | Not started | | | |
| Phase 7: /loop documentation | Not started | | | |

---

## Session Notes

[Space for implementation notes, discoveries, blockers]
