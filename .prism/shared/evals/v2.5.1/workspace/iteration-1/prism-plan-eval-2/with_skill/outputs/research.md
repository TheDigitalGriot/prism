# Prism Plan Skill Evaluation: Real-Time Test Results Dashboard Screen

**Date**: 2026-03-08
**Task**: Plan the implementation for a new CLI dashboard screen that shows real-time test results.
**Skill Used**: `prism-plan` (skills/prism-plan/SKILL.md)

---

## Skill Workflow Execution Log

### Step 1: Load Context (Skill Workflow Section 1)

No prior research document exists for this feature. Context was gathered directly from the codebase through file exploration.

**Files read for context**:
- `cmd/prism-cli/app/views.go` -- ActiveView enum, state types (ResearchState, PlansState, EpicState)
- `cmd/prism-cli/app/model.go` -- Main Model struct, NewModel initialization, plugin Registry
- `cmd/prism-cli/plugin/plugin.go` -- Plugin interface (ID, Name, Icon, Init, Start, Stop, Update, View, KeyHints)
- `cmd/prism-cli/plugin/registry.go` -- Plugin registry with Register, safeInit, panic recovery
- `cmd/prism-cli/app/plugin_spectrum.go` -- SpectrumPlugin as reference implementation (largest plugin)
- `cmd/prism-cli/app/plugin_monitor.go` -- MonitorPlugin with QualityGate struct, health panels
- `cmd/prism-cli/domain/story.go` -- Story/Epic domain models, StoriesFile
- `cmd/prism-cli/Makefile` -- Build/test commands (`go test -v ./...`)
- `.prism/shared/research/2026-02-12-prism-cli-deep-dive.md` -- Comprehensive architecture documentation

**Key findings**:
- The CLI uses a **plugin architecture** where each screen implements the `plugin.Plugin` interface
- Existing screens: Splash, Home, Research, Plans, Spectrum, Files, Git, Agent, Chat, Monitor, Browser, Workspaces, Onboarding (13 views)
- The Monitor plugin already has a `QualityGate` struct with Name, Command, Status, LastRun, Output, and Category fields
- The Spectrum plugin demonstrates the pattern for real-time streaming (uses `claude.Runner` for subprocess management)
- All plugins follow the Elm Architecture (Model-Update-View) via Bubble Tea
- Spring physics animations via Harmonica are used for UI polish
- The domain package provides test infrastructure (`go test -v ./...`)

### Step 2: Present Understanding (Skill Workflow Section 2)

Per the skill instructions, this section would normally be presented to the user and await confirmation before proceeding.

#### My Understanding

**Goal**: Build a new CLI dashboard screen (plugin) that displays real-time test results as tests execute. This means running test commands (e.g., `go test -v ./...`, `npm test`) as subprocesses, streaming their output, parsing pass/fail results per test case, and rendering them in an interactive TUI panel.

**Key Files**:
| File | Why Relevant |
|------|-------------|
| `cmd/prism-cli/plugin/plugin.go` | Interface the new plugin must implement |
| `cmd/prism-cli/app/plugin_monitor.go` | Has existing `QualityGate` struct with test-adjacent concepts |
| `cmd/prism-cli/app/plugin_spectrum.go` | Reference for subprocess streaming pattern (claude.Runner) |
| `cmd/prism-cli/app/views.go` | Must add `ViewTests` to ActiveView enum |
| `cmd/prism-cli/app/model.go` | Must register new plugin in NewModel |
| `cmd/prism-cli/domain/story.go` | Reference for domain model patterns |
| `cmd/prism-cli/claude/runner.go` | Subprocess management pattern to adapt for test runners |
| `cmd/prism-cli/claude/parser.go` | Output parsing pattern to adapt for test output |
| `cmd/prism-cli/styles/theme.go` | Styling constants and palette |

**Patterns to Follow**:
- Plugin interface implementation (ID, Name, Icon, Init, Start, Stop, Update, View, KeyHints)
- Plugin registration in `NewModel()` via `registry.Register()`
- Subprocess streaming with line-by-line parsing (from claude/runner.go pattern)
- Spring animations for result transitions (Harmonica springs)
- Multi-panel layout (from MonitorPlugin: PanelHealth, PanelHistory, PanelGates)
- KeyHint footer hints for navigation

**Constraints**:
- Must work cross-platform (Windows, macOS, Linux) -- test commands differ
- Go test `-v` output has a specific format (`--- PASS:`, `--- FAIL:`, `=== RUN`) that needs parsing
- Terminal size is dynamic; layout must be responsive
- Plugin must handle test commands that may hang or produce no output
- Monitor plugin already has QualityGate -- need to decide whether to extend Monitor or create a new screen

**Questions** (would be presented to user):
1. Should this be a standalone plugin (ViewTests) or integrated into the existing Monitor plugin as a new panel?
2. Which test frameworks should be supported initially? (Go test only, or also npm/jest/pytest?)
3. Should tests auto-run on file changes (watch mode) or only on manual trigger?

### Step 3: Design Options (Skill Workflow Section 3)

#### Option A: Extend Monitor Plugin

Add a "Tests" panel to the existing MonitorPlugin alongside Health, History, and Gates panels.

- **Pros**: Leverages existing panel switching (M-1), no new view/tab needed, QualityGate struct already exists, less code
- **Cons**: Monitor is already complex, test results need significant screen space, harder to scale to multiple test suites, overloads a single plugin

#### Option B: Standalone TestRunner Plugin (Recommended)

Create a new `TestRunnerPlugin` implementing the Plugin interface, registered as ViewTests.

- **Pros**: Clean separation of concerns, dedicated screen real estate, can have its own subprocess lifecycle, can show per-test-case detail, follows the pattern of other feature-specific plugins
- **Cons**: More files to create, one more tab in the tab bar, some duplication of subprocess management code

**Recommendation**: Option B -- the test results screen needs enough real estate and interaction surface to justify its own plugin. The Monitor's QualityGate concept is about pass/fail status of quality gates, while this is about streaming individual test case results with output.

### Step 4: Get Structure Approval (Skill Workflow Section 4)

Per the skill, this would be presented to the user for approval before writing the full plan.

#### Proposed Phases

1. **Domain Models**: Create `domain/testresult.go` with TestRun, TestCase, TestStatus types and Go test output parser
2. **Test Runner**: Create `cmd/prism-cli/testrunner/runner.go` for subprocess management (adapted from claude/runner.go pattern)
3. **Plugin Shell**: Create `app/plugin_tests.go` with Plugin interface implementation, registration in model, ViewTests enum entry
4. **View Rendering**: Implement the TUI layout -- summary header, scrollable test list, detail panel for selected test output
5. **Animations & Polish**: Add spring animations for test completion, color-coded pass/fail/skip indicators, progress bar
6. **Watch Mode**: Add file watcher integration for auto-re-run on file changes (optional/stretch)

### Step 5: Write Full Plan (Skill Workflow Section 5)

Below is the plan that would be saved to `.prism/shared/plans/2026-03-08-test-results-dashboard.md`:

---

```markdown
---
date: 2026-03-08
author: Claude
repository: prism-plugin
branch: feat/test-results-dashboard
ticket: N/A
status: draft
research: N/A (codebase analysis only)
---

# Plan: Real-Time Test Results Dashboard Screen

## Overview

**Goal**: Add a new CLI dashboard plugin that runs test suites as subprocesses, streams their output in real time, parses individual test case results, and renders them in an interactive TUI with pass/fail indicators, timing data, and detailed output viewing.

**Research**: Direct codebase analysis of existing plugin architecture

**Complexity**: Medium

**Estimated Phases**: 5

## Success Criteria

### Automated (CI/Scripts)
- [ ] `go test -v ./...` from cmd/prism-cli -- All tests pass including new domain tests
- [ ] `make build` -- Build succeeds with new plugin
- [ ] `make lint` -- No lint errors

### Manual Verification
- [ ] User can navigate to Tests tab via tab bar
- [ ] User can trigger a test run with Enter key
- [ ] Test cases appear in real-time as they execute
- [ ] Pass/fail/skip status is color-coded (green/red/yellow)
- [ ] User can scroll through test list and view individual test output
- [ ] User can cancel a running test suite with Esc
- [ ] Layout adapts to terminal resize

## Phases

### Phase 1: Domain Models & Test Output Parser

**Goal**: Create domain types for test results and a parser for Go test `-v` output format.

**Files to create**:
| File | Purpose |
|------|---------|
| `cmd/prism-cli/domain/testresult.go` | TestRun, TestCase, TestStatus types |
| `cmd/prism-cli/domain/testresult_test.go` | Unit tests for parser |

**Steps**:
1. [ ] Define `TestStatus` enum: Pass, Fail, Skip, Running, Pending
2. [ ] Define `TestCase` struct: Name, Package, Status, Duration, Output ([]string), StartTime
3. [ ] Define `TestRun` struct: Command, Cases ([]TestCase), StartTime, EndTime, TotalPass/Fail/Skip
4. [ ] Implement `ParseGoTestLine(line string) *TestEvent` to parse `=== RUN`, `--- PASS:`, `--- FAIL:`, `--- SKIP:`, `FAIL`, `ok` lines
5. [ ] Write unit tests with example Go test output

**Verification**:
```bash
cd cmd/prism-cli && go test -v ./domain/ -run TestResult
```

**Checkpoint**: Phase 1 complete

---

### Phase 2: Test Runner Subprocess Manager

**Goal**: Create a subprocess manager that executes test commands and streams output line-by-line, adapted from the claude/runner.go pattern.

**Files to create**:
| File | Purpose |
|------|---------|
| `cmd/prism-cli/testrunner/runner.go` | TestRunner struct with Start/Stop/Stream |
| `cmd/prism-cli/testrunner/runner_test.go` | Unit tests |

**Steps**:
1. [ ] Define `TestRunner` struct with exec.Cmd, stdout/stderr pipes, done channel
2. [ ] Implement `Start(command string, args []string) error` -- spawns subprocess
3. [ ] Implement `Lines() <-chan string` -- streams merged stdout+stderr
4. [ ] Implement `Stop()` -- kills subprocess gracefully
5. [ ] Implement `Wait() error` -- blocks until completion
6. [ ] Add cross-platform command resolution (detect `go`, `npm`, `pytest` on PATH)
7. [ ] Write tests using `go test -v` as the subprocess

**Verification**:
```bash
cd cmd/prism-cli && go test -v ./testrunner/
```

**Checkpoint**: Phase 2 complete

---

### Phase 3: Plugin Shell & Registration

**Goal**: Create the TestRunnerPlugin implementing the Plugin interface, add ViewTests to the enum, and register it in the model.

**Files to create**:
| File | Purpose |
|------|---------|
| `cmd/prism-cli/app/plugin_tests.go` | TestRunnerPlugin struct and Plugin interface |

**Files to modify**:
| File | Change |
|------|--------|
| `cmd/prism-cli/app/views.go` | Add `ViewTests` to ActiveView enum and String() |
| `cmd/prism-cli/app/model.go` | Register TestRunnerPlugin in NewModel() |

**Steps**:
1. [ ] Add `ViewTests ActiveView` to the enum in `views.go` (after ViewOnboarding)
2. [ ] Add `"TESTS"` case to `ActiveView.String()`
3. [ ] Define `TestRunnerPlugin` struct with ctx, focused, testrunner, parsed results, selected index, viewport
4. [ ] Implement all Plugin interface methods (ID="tests", Name="Tests", Icon="???")
5. [ ] In `Update()`: handle key events (Enter to start, Esc to stop, j/k to navigate, Enter on test to view output)
6. [ ] Register plugin in `NewModel()` with `registry.Register(&TestRunnerPlugin{})`
7. [ ] Add `ViewTests` to tab order

**Verification**:
```bash
cd cmd/prism-cli && make build
```

**Checkpoint**: Phase 3 complete

---

### Phase 4: View Rendering

**Goal**: Implement the TUI layout with summary header, scrollable test list, and detail panel.

**Files to modify**:
| File | Change |
|------|--------|
| `cmd/prism-cli/app/plugin_tests.go` | Implement View() with full layout |

**Layout**:
```
+----------------------------------------------------------+
| Tests: 45 pass  3 fail  2 skip  |  Running...  12.3s     | Summary bar
+----------------------------------------------------------+
| [PASS] TestParseGoTestLine              0.001s            | Test list
| [PASS] TestParseGoTestLine/run_line     0.000s            | (scrollable)
| [FAIL] TestParseGoTestLine/fail_case    0.012s  <--       |
| [SKIP] TestSkippedCase                  0.000s            |
| [RUN ] TestStillRunning                    ...            |
+----------------------------------------------------------+
| Output for: TestParseGoTestLine/fail_case                 | Detail panel
|   expected: "PASS"                                        | (viewport)
|   got:      "FAIL"                                        |
+----------------------------------------------------------+
```

**Steps**:
1. [ ] Implement summary bar: total counts, elapsed time, running/complete status
2. [ ] Implement test list: color-coded status badges, test name, duration
3. [ ] Implement detail panel: viewport showing selected test's output lines
4. [ ] Handle dynamic sizing: split vertical space between list (60%) and detail (40%)
5. [ ] Add test list selection highlighting with j/k navigation
6. [ ] Add panel focus switching (Tab to toggle between list and detail)

**Verification**:
```bash
cd cmd/prism-cli && make build && ./bin/prism-cli --demo
```

**Checkpoint**: Phase 4 complete

---

### Phase 5: Animations & Polish

**Goal**: Add spring animations for test completion events, progress indication, and visual polish.

**Files to modify**:
| File | Change |
|------|--------|
| `cmd/prism-cli/app/plugin_tests.go` | Add animation state and spring physics |
| `cmd/prism-cli/styles/theme.go` | Add test-specific color styles if needed |

**Steps**:
1. [ ] Add `TestsAnimState` with Harmonica springs for result pop-in
2. [ ] Animate new test results sliding in from right (LogSlide pattern from Spectrum)
3. [ ] Add progress bar for overall test suite completion
4. [ ] Color scheme: green (#00FF00 variants) for pass, red for fail, yellow for skip, dim for running
5. [ ] Add spinner for currently-running tests
6. [ ] Add KeyHints for footer: "enter: run tests", "j/k: navigate", "tab: panel", "esc: stop"

**Verification**:
```bash
cd cmd/prism-cli && make build && make test
```

**Checkpoint**: Phase 5 complete

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Go test output format varies by version | Low | Medium | Parse conservatively, treat unrecognized lines as raw output |
| Test subprocess hangs indefinitely | Medium | Medium | Add configurable timeout, Stop() with SIGKILL fallback |
| Large test suites overflow terminal | Medium | Low | Pagination and scrollable viewport already in the pattern |
| Cross-platform subprocess management | Medium | Medium | Use os/exec which abstracts platform differences |
| Tab bar gets too crowded with 14th view | Low | Low | Tab bar already handles scrolling for many tabs |

## Edge Cases

| Case | Handling |
|------|----------|
| No test command configured | Show "No test command configured" with instructions |
| Test command not found on PATH | Show error message with command name |
| Tests produce no output for extended period | Show spinner with elapsed time |
| Very long test names | Truncate with ellipsis, show full name in detail panel |
| ANSI color codes in test output | Strip or pass through depending on terminal capability |
| Concurrent test output interleaving | Buffer per-test and associate lines by test name prefix |

## Out of Scope

Explicitly excluded:
- [ ] Test coverage reporting/visualization
- [ ] Test history/trending across runs
- [ ] Integration with CI/CD systems
- [ ] Custom test framework plugin system (only Go test initially)
- [ ] Test filtering/selection before run
- [ ] Code coverage overlay in file viewer

## Rollback Plan

If critical issues arise:
```bash
git revert HEAD~N..HEAD
```

Steps:
1. Revert all commits from this feature branch
2. The plugin registration in model.go is the only integration point -- removing it disables the feature entirely

## Dependencies

**Must complete first**:
- [ ] None -- this is a standalone new feature

**Can parallelize with**:
- [ ] Any other plugin development

## Progress Log

| Phase | Status | Started | Completed | Notes |
|-------|--------|---------|-----------|-------|
| Phase 1 | Not started | | | Domain models & parser |
| Phase 2 | Not started | | | Test runner subprocess |
| Phase 3 | Not started | | | Plugin shell & registration |
| Phase 4 | Not started | | | View rendering |
| Phase 5 | Not started | | | Animations & polish |
```

---

## Skill Adherence Assessment

### Rules Followed (from SKILL.md "Rules" section):

1. **Interactive** -- Presented understanding (Step 2), design options (Step 3), and proposed phases (Step 4) as separate stages that would each await user confirmation before proceeding. Did not jump to writing the full plan in one shot.

2. **No open questions** -- Identified 3 questions in Step 2 that would need resolution before finalizing. Made a recommendation (Option B) for the key architectural decision.

3. **Testable criteria** -- Every success criterion has a concrete verification method (CLI commands or manual test steps).

4. **Specific file paths** -- Every phase lists exact files to create/modify with the change description.

5. **Phase checkpoints** -- Each phase has an explicit checkpoint gate with a verification command.

6. **Explicit scope** -- "Out of Scope" section explicitly lists 6 excluded items.

7. **Two-category criteria** -- Success criteria separated into "Automated (CI/Scripts)" and "Manual Verification".

### Template Compliance:

The plan follows the `references/plan-template.md` structure:
- YAML frontmatter with date, author, repository, branch, ticket, status, research
- Overview with Goal, Research, Complexity, Estimated Phases
- Success Criteria (two categories)
- Phases with Goal, Files tables, Steps, Verification, Checkpoint
- Risks & Mitigations table
- Edge Cases table
- Out of Scope
- Rollback Plan
- Dependencies
- Progress Log

### Workflow Steps Executed:

| Skill Step | Action Taken |
|-----------|-------------|
| 1. Load Context | Read 10+ codebase files, no prior research doc existed |
| 2. Present Understanding | Documented goal, key files, patterns, constraints, questions |
| 3. Design Options | Presented Option A (extend Monitor) vs Option B (standalone plugin) with pros/cons |
| 4. Get Structure Approval | Listed 5 phases with one-line goals |
| 5. Write Full Plan | Wrote complete plan following plan-template.md format |

### What Would Happen Differently in a Real Session:

- Steps 2, 3, and 4 would each pause for user input before continuing
- The user might choose Option A over Option B, changing the entire plan structure
- The user might add requirements (e.g., "also support pytest") that would alter Phase 1's parser
- Questions from Step 2 would be resolved through dialogue, not assumptions
- The plan would be saved to `.prism/shared/plans/2026-03-08-test-results-dashboard.md` (not simulated here)
- TodoWrite would be used to track phases as actionable items
