# Prism Plan Eval Transcript (v2.4.8 Baseline)

**Task**: "Plan the implementation for a new CLI dashboard screen that shows real-time test results."
**Skill version**: v2.4.8-snapshot
**Date**: 2026-03-08
**Evaluation**: prism-plan-eval-2, iteration-1

---

## Workflow Execution

### Step 1: Load Context

Per the v2.4.8 skill workflow, Step 1 is "Load Context" -- check for research documents and spawn a `prism-analyzer` agent if research exists.

**Action**: Checked `.prism/shared/research/` for relevant research. Found `2026-02-12-prism-cli-deep-dive.md` and `2026-02-22-playwright-cli-integration-analysis.md` as potentially relevant, but no specific research document on "real-time test results dashboard screen" exists.

**Decision**: No dedicated research document exists for this feature. Proceeding with codebase understanding from direct file inspection instead (per the prerequisite: "Sufficient codebase understanding from current session").

**Codebase analysis performed** (manual, no prism-analyzer agent spawned since no research doc to analyze):

- Read `cmd/prism-cli/plugin/plugin.go` -- the Plugin interface all screens implement (ID, Name, Icon, Init, Start, Stop, Update, View, IsFocused, SetFocused, KeyHints)
- Read `cmd/prism-cli/plugin/registry.go` -- how plugins are registered and managed
- Read `cmd/prism-cli/plugin/context.go` -- shared Context struct passed to all plugins
- Read `cmd/prism-cli/app/model.go` -- the main Bubble Tea model; found 11 plugins currently registered (home, research, plans, spectrum, files, git, agent, monitor, browser, workspaces, onboarding)
- Read `cmd/prism-cli/app/plugin_spectrum.go` -- reference implementation of a complex plugin with animations, log lines, story tracking
- Read `cmd/prism-cli/app/plugin_monitor.go` -- most relevant existing plugin; has ExecutionRecord, QualityGate structs, system health monitoring, and execution history tracking
- Read `cmd/prism-cli/domain/story.go` -- domain types for stories with status tracking

---

### Step 2: Present Understanding

Per the v2.4.8 skill, Step 2 is "Present Understanding" and then **wait for user confirmation**. Since this is an eval simulation, I present the understanding and document it, then proceed as if the user confirmed.

---

## My Understanding

**Goal**: Build a new CLI dashboard plugin screen ("Tests" or "Test Results") that displays real-time test execution results. This would show test suite output as tests run, with pass/fail/skip counts, individual test case status, and timing information -- all updating live in the TUI.

**Key Files**:
- `cmd/prism-cli/plugin/plugin.go` -- Plugin interface to implement (8 methods)
- `cmd/prism-cli/plugin/context.go` -- Context struct providing project dir, terminal dimensions, event bus
- `cmd/prism-cli/plugin/registry.go` -- Registration system for adding new plugins
- `cmd/prism-cli/app/model.go:234-244` -- Where plugins are registered; new plugin would be added here
- `cmd/prism-cli/app/plugin_monitor.go` -- Closest existing pattern; has QualityGate struct with Status, Command, Output fields
- `cmd/prism-cli/app/plugin_spectrum.go` -- Reference for live-updating views with animations
- `cmd/prism-cli/domain/` -- Where domain types (test result parsing) would go

**Patterns to Follow**:
- Every plugin lives in `cmd/prism-cli/app/plugin_<name>.go`
- Plugins implement the `plugin.Plugin` interface
- Bubble Tea `tea.Cmd` pattern for async operations (running tests, watching output)
- Lipgloss for styling, `modal` package for list/section layouts
- Animation via `harmonica.Spring` for smooth transitions
- `plugin.EventBus` for inter-plugin communication (e.g., notifying Monitor when tests complete)

**Constraints**:
- Must work cross-platform (Windows/macOS/Linux) since the CLI targets all three
- Terminal rendering -- no scrollback abuse; must fit in allocated `(width, height)` from `View()`
- Test output parsing must handle multiple frameworks (Go `go test`, npm `jest`/`vitest`, etc.)
- Real-time streaming requires careful goroutine management and Bubble Tea message passing

**Questions** (only if code can't answer):
1. Which test frameworks should be supported initially? (Go's `go test -json` is the most structured; npm test runners vary widely)
2. Should this replace the existing QualityGate functionality in Monitor, or complement it?

**[SIMULATED]**: User confirms understanding, answers: "Start with Go test support (`go test -json`), complement Monitor (don't replace it)."

---

### Step 3: Design Options

Per the v2.4.8 skill, Step 3 is "Design Options (if multiple approaches)".

---

## Approach Options

### Option A: Standalone Test Plugin with Built-in Runner
- The plugin spawns `go test -json ./...` directly, parses JSON output line-by-line, and renders results in real-time
- Pros: Self-contained, simple mental model, full control over test execution
- Cons: Duplicates some of Monitor's QualityGate runner logic; two places that run tests

### Option B: Shared Test Runner in `domain/` with Plugin as View
- Extract a `domain/testrunner` package that handles spawning tests and parsing output. The new Tests plugin is a view layer; Monitor's QualityGate can also use the same runner.
- Pros: DRY, reusable across plugins, cleaner separation of concerns
- Cons: More files to create, slightly more complex initial implementation

### Option C: File-Watcher Triggered Tests
- Watch for file changes (using existing `watcher/` package) and auto-run tests on save, streaming results to the screen
- Pros: "Watch mode" UX, no manual trigger needed
- Cons: Higher complexity, could be layered on top of A or B later

**[SIMULATED]**: User picks Option B ("Shared Test Runner in domain/ with Plugin as View") with note: "We can add file-watching (Option C) as a future enhancement."

---

### Step 4: Get Structure Approval

Per the v2.4.8 skill, Step 4 is "Get Structure Approval" with proposed phases.

---

## Proposed Phases

1. **Phase 1: Domain Layer -- Test Runner & JSON Parser**: Create `domain/testrunner.go` with Go test JSON output parsing and async execution
2. **Phase 2: Plugin Scaffold -- Tests Plugin**: Create `app/plugin_tests.go` implementing the Plugin interface with basic structure
3. **Phase 3: Real-Time View Rendering**: Build the TUI view with pass/fail/skip counters, test case list with status icons, and timing
4. **Phase 4: Interactive Controls**: Add keybindings for re-run, filter (pass/fail/all), scroll through test list, expand/collapse packages
5. **Phase 5: Integration & Polish**: Register plugin in model.go, add EventBus integration with Monitor, add animations, write tests

Does this make sense?

**[SIMULATED]**: User approves phase structure.

---

### Step 5: Write Full Plan

Per the v2.4.8 skill, Step 5 is "Write Full Plan" and save to `.prism/shared/plans/YYYY-MM-DD-feature.md`.

**NOTE**: Since this is an eval simulation, the plan is documented here rather than saved to the plans directory. No source files are modified.

---

## Plan: CLI Dashboard -- Real-Time Test Results Screen

```
---
date: 2026-03-08
author: Claude
repository: prism-plugin
branch: feature/cli-test-results-screen
ticket: N/A
status: draft
research: N/A (codebase analysis from current session)
---
```

### Overview

**Goal**: Add a new "Tests" plugin screen to the Prism CLI dashboard that streams real-time test execution results, showing pass/fail/skip counts, individual test cases, and timing information.

**Research**: Direct codebase analysis -- no dedicated research document.

**Complexity**: Medium

**Estimated Phases**: 5

### Success Criteria

#### Automated (CI/Scripts)
- [ ] `cd cmd/prism-cli && make test` -- All existing + new tests pass
- [ ] `cd cmd/prism-cli && make lint` -- No lint errors
- [ ] `go vet ./...` -- No vet issues
- [ ] `go build .` -- Build succeeds on all platforms

#### Manual Verification
- [ ] Navigate to Tests tab via keyboard (tab key or number shortcut)
- [ ] Press `r` to run tests; output streams in real-time
- [ ] Pass/fail/skip counters update as each test completes
- [ ] Individual test cases show status icons (checkmark/X/skip)
- [ ] Scrolling through long test lists works correctly
- [ ] Filter toggle (pass/fail/all) works
- [ ] No regressions in Monitor plugin or other existing screens

### Phases

#### Phase 1: Domain Layer -- Test Runner & JSON Parser

**Goal**: Create a reusable test runner that executes `go test -json` and parses output into structured results.

**Files to create**:
| File | Purpose |
|------|---------|
| `cmd/prism-cli/domain/testrunner.go` | Test execution + JSON output parsing |
| `cmd/prism-cli/domain/testrunner_test.go` | Unit tests with sample JSON output |

**Steps**:
1. [ ] Define `TestEvent` struct matching `go test -json` output format (Time, Action, Package, Test, Output, Elapsed)
2. [ ] Define `TestResult` struct aggregating events per test (Name, Package, Status, Duration, Output lines)
3. [ ] Define `TestSuite` struct holding all results (PackageResults map, Counts for pass/fail/skip, StartTime, Duration)
4. [ ] Implement `RunTests(ctx context.Context, dir string, args ...string) (<-chan TestEvent, error)` -- spawns `go test -json` and streams parsed events
5. [ ] Implement `ParseTestEvent(line []byte) (*TestEvent, error)` -- parses single JSON line
6. [ ] Write unit tests using captured `go test -json` output in `testdata/`

**Verification**:
```bash
cd cmd/prism-cli && go test -v ./domain/ -run TestRunner
```

**Checkpoint**: Phase 1 complete -- test runner works in isolation

---

#### Phase 2: Plugin Scaffold -- Tests Plugin

**Goal**: Create the Tests plugin implementing the Plugin interface with basic lifecycle management.

**Files to create**:
| File | Purpose |
|------|---------|
| `cmd/prism-cli/app/plugin_tests.go` | Tests plugin implementation |

**Files to modify**:
| File | Change |
|------|--------|
| `cmd/prism-cli/app/model.go:~230-244` | Add `testsPlugin` creation and `registry.Register(testsPlugin)` |

**Steps**:
1. [ ] Create `TestsPlugin` struct with fields: ctx, focused, suite (TestSuite), running (bool), eventChan, selectedIndex, filterMode
2. [ ] Implement `ID() string` returning `"tests"`
3. [ ] Implement `Name() string` returning `"Tests"`
4. [ ] Implement `Icon() string` returning appropriate icon
5. [ ] Implement `Init(ctx *Context) error` -- store context
6. [ ] Implement `Start() tea.Cmd` -- return nil (no auto-start)
7. [ ] Implement `Stop()` -- cancel any running test process
8. [ ] Implement `Update(msg tea.Msg) (Plugin, tea.Cmd)` -- handle key presses and test event messages
9. [ ] Implement `View(width, height int) string` -- placeholder "press r to run tests"
10. [ ] Implement `IsFocused()/SetFocused()` -- standard focus tracking
11. [ ] Implement `KeyHints()` returning `[{Key: "r", Description: "run tests"}, ...]`
12. [ ] Register plugin in `model.go` between existing plugins

**Verification**:
```bash
cd cmd/prism-cli && go build . && go test -v ./app/ -run TestTests
```

**Checkpoint**: Phase 2 complete -- plugin appears in tab bar, renders placeholder

---

#### Phase 3: Real-Time View Rendering

**Goal**: Build the live-updating TUI view that shows test results as they stream in.

**Files to modify**:
| File | Change |
|------|--------|
| `cmd/prism-cli/app/plugin_tests.go` | Full View() implementation with real-time rendering |

**Steps**:
1. [ ] Create header section: "Tests" title + run status (idle/running/complete) + elapsed time
2. [ ] Create summary bar: `PASS: 42  FAIL: 2  SKIP: 3  TOTAL: 47` with colored counts
3. [ ] Create package-grouped test list: package header rows + indented test rows with status icons
4. [ ] Add Bubble Tea spinner for running state
5. [ ] Implement `tea.Cmd` that reads from `eventChan` and dispatches `TestEventMsg` to Update
6. [ ] In Update, accumulate events into `TestSuite`, trigger re-render
7. [ ] Style with Lipgloss: green for pass, red for fail, yellow for skip, dim for pending

**Verification**:
```bash
cd cmd/prism-cli && go build .
# Manual: run the CLI in a Go project, navigate to Tests tab, press r
```

**Checkpoint**: Phase 3 complete -- tests stream results in real-time

---

#### Phase 4: Interactive Controls

**Goal**: Add keyboard navigation and filtering to the test results view.

**Files to modify**:
| File | Change |
|------|--------|
| `cmd/prism-cli/app/plugin_tests.go` | Add key handlers and filter logic |

**Steps**:
1. [ ] Add `j/k` navigation through test case list (move selectedIndex)
2. [ ] Add `enter` to expand/collapse test output (show captured stdout/stderr)
3. [ ] Add `f` to cycle filter mode: all -> failures only -> passes only -> skipped only -> all
4. [ ] Add `r` to re-run all tests (cancel current run if active, start new)
5. [ ] Add `R` (shift+r) to re-run only failed tests
6. [ ] Add `q` or `esc` to cancel running tests
7. [ ] Update `KeyHints()` to reflect current state (different hints when running vs idle)
8. [ ] Add scrollbar using existing `ui.Scrollbar` component

**Verification**:
```bash
cd cmd/prism-cli && go build .
# Manual: verify all keybindings work as documented in KeyHints
```

**Checkpoint**: Phase 4 complete -- full interactivity working

---

#### Phase 5: Integration & Polish

**Goal**: Connect to EventBus, add animations, write comprehensive tests.

**Files to create**:
| File | Purpose |
|------|---------|
| `cmd/prism-cli/testdata/go_test_json_pass.txt` | Sample passing test JSON output |
| `cmd/prism-cli/testdata/go_test_json_mixed.txt` | Sample mixed results JSON output |

**Files to modify**:
| File | Change |
|------|--------|
| `cmd/prism-cli/app/plugin_tests.go` | Add spring animations for count transitions, EventBus publishing |
| `cmd/prism-cli/app/plugin_monitor.go` | Listen for test completion events from EventBus |
| `cmd/prism-cli/domain/testrunner_test.go` | Add comprehensive edge case tests |

**Steps**:
1. [ ] Publish `TestsCompleteEvent` on EventBus when test run finishes (with summary counts)
2. [ ] In Monitor plugin, subscribe to `TestsCompleteEvent` to update QualityGate status
3. [ ] Add `harmonica.Spring` animation for pass/fail count number transitions
4. [ ] Add slide-in animation for new test results appearing (similar to Spectrum's LogSlideSpring)
5. [ ] Add test data files with captured `go test -json` output
6. [ ] Write unit tests for JSON parsing edge cases (malformed lines, build errors, no-test packages)
7. [ ] Write unit tests for filter logic and view rendering

**Verification**:
```bash
cd cmd/prism-cli && make test && make lint
```

**Checkpoint**: Phase 5 complete -- all tests pass, animations smooth, Monitor integration working

---

### Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `go test -json` output format varies by Go version | Low | Medium | Pin to documented format; handle unknown fields gracefully |
| Large test suites overwhelm terminal rendering | Medium | Medium | Virtual scrolling; only render visible rows |
| Test process hangs indefinitely | Medium | High | Context with timeout; cancel button in UI |
| Cross-platform process spawning differences | Low | Medium | Use `exec.CommandContext` consistently; test on Windows CI |
| Goroutine leak from abandoned test runs | Medium | High | Always cancel context on Stop(); use WaitGroup |

### Edge Cases

| Case | Handling |
|------|----------|
| No Go project in current directory | Show "No Go module found" message with hint |
| Build errors before tests run | Parse build error events from JSON stream; display as error banner |
| Test panics | Capture panic output from JSON stream; mark test as "panic" status |
| Empty test suite (no test files) | Show "No tests found" with package path |
| Very long test names | Truncate with ellipsis; show full name on hover/expand |
| Concurrent test output interleaving | JSON format handles this (each line is atomic) |
| Tests that write to stderr directly | Captured in `Output` field of JSON events |

### Out of Scope

Explicitly excluded:
- [ ] Non-Go test frameworks (jest, vitest, pytest) -- future enhancement
- [ ] File-watcher auto-run mode -- future enhancement (Option C from design)
- [ ] Test coverage visualization -- separate feature
- [ ] Test history/trends across runs -- separate feature
- [ ] Custom test command configuration -- use quality gates in Monitor for that
- [ ] Integration with CI/CD systems

### Rollback Plan

If critical issues arise:
```bash
git revert HEAD~N..HEAD  # Revert all commits from this feature branch
```

Steps:
1. Revert commits from the feature branch
2. Remove the plugin registration line from `model.go` (single line change)
3. The rest of the codebase is unaffected since this is an additive plugin

### Dependencies

**Must complete first**:
- [ ] None -- this is a standalone new plugin

**Can parallelize with**:
- [ ] Any other CLI dashboard work (plugins are independent)

### Progress Log

| Phase | Status | Started | Completed | Notes |
|-------|--------|---------|-----------|-------|
| Phase 1 | Not started | | | Domain layer |
| Phase 2 | Not started | | | Plugin scaffold |
| Phase 3 | Not started | | | View rendering |
| Phase 4 | Not started | | | Interactive controls |
| Phase 5 | Not started | | | Integration & polish |

---

## Skill Execution Notes

### What the v2.4.8 Skill Did

1. **Load Context (Step 1)**: Checked for research docs -- none found for this topic. Fell back to "sufficient codebase understanding from current session" prerequisite. Did NOT spawn a `prism-analyzer` agent (no research doc to analyze). Performed manual codebase analysis by reading key files.

2. **Present Understanding (Step 2)**: Presented Goal, Key Files, Patterns, Constraints, and Questions. The skill says to "Wait for user confirmation" -- in this eval simulation, we document the understanding and simulate user confirmation.

3. **Design Options (Step 3)**: Presented three approach options (A: Standalone, B: Shared Runner, C: File-Watcher). Simulated user selection of Option B.

4. **Get Structure Approval (Step 4)**: Proposed 5 phases with one-line goals. Simulated user approval.

5. **Write Full Plan (Step 5)**: Wrote the full plan following the template from `references/plan-template.md`. Included all required sections: Success Criteria (automated AND manual), Phases with specific files and steps, Verification per phase, Risks & Mitigations, Edge Cases, Out of Scope, Rollback Plan, Dependencies, Progress Log.

### Observations About v2.4.8 Skill

- The skill references `TodoWrite` in Step 5 ("Use TodoWrite to track phases") but does not provide detailed instructions on how to use it
- The skill's workflow is straightforward 5-step linear process: Load Context -> Present Understanding -> Design Options -> Structure Approval -> Write Full Plan
- No explicit guidance on how deep the codebase analysis should go in the absence of research
- The skill relies on agents (`codebase-analyzer`, `codebase-pattern-finder`, `prism-analyzer`) but only mentions spawning `prism-analyzer` in Step 1, and only when research exists
- The plan template is comprehensive and well-structured
- The "interactive" philosophy is central -- multiple checkpoints requiring user buy-in before proceeding

### Files Read During Analysis

- `cmd/prism-cli/plugin/plugin.go` -- Plugin interface definition
- `cmd/prism-cli/plugin/registry.go` -- Plugin registration and lifecycle
- `cmd/prism-cli/plugin/context.go` -- Shared context struct
- `cmd/prism-cli/app/model.go` -- Main model, plugin registration (lines 234-244)
- `cmd/prism-cli/app/plugin_spectrum.go` -- Complex plugin reference (animations, live updates)
- `cmd/prism-cli/app/plugin_monitor.go` -- Closest existing plugin (QualityGate, ExecutionRecord)
- `cmd/prism-cli/app/sidebar.go` -- Sidebar rendering pattern
- `cmd/prism-cli/domain/story.go` -- Domain type patterns

### Files That Would Be Created/Modified (Simulated)

**Created**:
- `cmd/prism-cli/domain/testrunner.go`
- `cmd/prism-cli/domain/testrunner_test.go`
- `cmd/prism-cli/app/plugin_tests.go`
- `cmd/prism-cli/testdata/go_test_json_pass.txt`
- `cmd/prism-cli/testdata/go_test_json_mixed.txt`

**Modified**:
- `cmd/prism-cli/app/model.go` (add plugin registration)
- `cmd/prism-cli/app/plugin_monitor.go` (EventBus subscription)
