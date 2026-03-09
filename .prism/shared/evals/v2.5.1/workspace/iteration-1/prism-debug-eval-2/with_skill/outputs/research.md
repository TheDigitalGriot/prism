# Debug Report: npm test Failing with 3 Test Failures After Last Commit

## Problem Statement

After the last commit (v2.5.1, `570fd3a`), `npm test` is failing with 3 test failures. Tests were passing before on v2.5.0 (`bc44a36`). The user reports this as a regression introduced by the most recent commit.

## Error Analysis

**Type**: test failure (3 tests)
**Trigger**: The v2.5.1 commit (`570fd3a`, parent `bae2aeb`)
**Scope**: Changes span version bumps, agent frontmatter restructuring, and documentation additions

## Investigation Findings

### From Git History (git-investigator)

**Recent commits analyzed**:
- `570fd3a` (HEAD~1) — v2.5.1 release: version bumps + agent frontmatter + eval snapshots + docs
- `bae2aeb` — docs update (baseline where tests were passing)

**Files changed in v2.5.1 commit that could affect tests**:

1. **`cmd/prism-cli/main.go`** — Version string changed from `"2.5.0"` to `"2.5.1"`
2. **`cmd/prism-cli/app/footer.go`** — Hardcoded version in footer segment changed from `"v2.5.0"` to `"v2.5.1"`
3. **`agents/git-investigator.md`** — Restructured from heading-based format to YAML frontmatter format
4. **`agents/log-investigator.md`** — Same restructuring to YAML frontmatter
5. **`agents/state-investigator.md`** — Same restructuring to YAML frontmatter
6. **`agents/prism-analyzer.md`** — Added new principle #3 "Documentarian, Not Critic", renumbered existing #3 to #4
7. **`commands/decompose_plan.md`** — Added 28 new lines
8. **`skills/prism-spectrum/SKILL.md`** — Major rewrite (246 lines changed)

**No uncommitted changes** that would affect tests (only submodule `prism-eval` has local modifications and a new untracked eval directory).

### From Application State (state-investigator)

**Test infrastructure**: The primary test suite lives in `cmd/prism-cli/` with 24 Go test files across packages:
- `app/` — `adapter/claude_test.go`, `adapter/codex_test.go`, `adapter/cursor_test.go`, `file_finder_test.go`, `model_integration_test.go`
- `domain/` — `progress_test.go`, `signals_test.go`, `story_test.go`, `stories_extended_test.go`, `config_integration_test.go`
- `diff/` — `parser_test.go`, `renderer_test.go`
- `markdown/` — `renderer_test.go`
- `state/` — `state_test.go`
- `styles/` — `borders_test.go`
- `ui/` — `divider_test.go`, `pane_test.go`, `scrollbar_test.go`
- `watcher/` — `watcher_test.go`
- `registry/` — `registry_test.go`
- `agentbus/` — `bus_test.go`, `store_test.go`, `serializer_test.go`, `events_test.go`

**Note**: The project is a Claude Code plugin (markdown-based). There is no root `package.json` and no `npm test` script at the project root. The `npm test` command referenced by the user likely refers to one of the sub-projects (`cmd/prism-vscode/`, `cmd/prism-electron/`, or `cmd/prism-installer/`), or the Go test suite run via `make test` in `cmd/prism-cli/`.

### From Logs (log-investigator)

No log files found in the repository root or common log locations. No `.log` files modified recently. This is expected for a plugin project -- test output would appear in the terminal, not persisted logs.

## Root Cause Hypothesis

Based on the evidence, the most likely causes of 3 test failures are:

### Hypothesis 1: Hardcoded Version String in Tests (HIGH confidence)
The v2.5.1 commit changed version strings in two files:
- `cmd/prism-cli/main.go`: `version = "2.5.1"` (was `"2.5.0"`)
- `cmd/prism-cli/app/footer.go`: `Content: "v2.5.1"` (was `"v2.5.0"`)

If any tests assert against the version string (e.g., in `app/model_integration_test.go`, `state/state_test.go`, or footer rendering tests), they would fail if they still expect `"v2.5.0"` or `"2.5.0"`. **Three test files that plausibly test version-related output** could account for exactly 3 failures.

### Hypothesis 2: Agent Frontmatter Parsing Changes (MEDIUM confidence)
Three agent files were restructured from heading-based format to YAML frontmatter format:
- `agents/git-investigator.md`
- `agents/log-investigator.md`
- `agents/state-investigator.md`

If there are tests that parse agent files (e.g., in `registry/registry_test.go` or `domain/` tests), the structural change from `# Model\nhaiku` to `---\nmodel: haiku\n---` format could cause parsing failures. Exactly 3 agents were changed, which matches the 3 test failure count.

### Hypothesis 3: Spectrum/Decompose Changes (LOW confidence)
The `skills/prism-spectrum/SKILL.md` was heavily rewritten and `commands/decompose_plan.md` was extended. If `domain/signals_test.go` or `domain/stories_extended_test.go` reference expected Spectrum signal patterns or decompose output formats, changes could cause failures.

## Suggested Fix Approach

1. **First**: Run the test suite and capture exact failure output:
   ```bash
   cd cmd/prism-cli && go test -v ./... 2>&1 | grep -A 5 "FAIL"
   ```
   Or if `npm test` is in a JS sub-project:
   ```bash
   cd cmd/prism-vscode && npm test 2>&1 | grep -A 5 "FAIL"
   ```

2. **If Hypothesis 1 (version strings)**: Update test assertions from `"2.5.0"` / `"v2.5.0"` to `"2.5.1"` / `"v2.5.1"`, or refactor tests to read the version dynamically from the `version` variable.

3. **If Hypothesis 2 (agent frontmatter)**: Update the agent parsing logic or test fixtures to handle YAML frontmatter format. Check `registry/registry_test.go` for agent file parsing expectations.

4. **If Hypothesis 3 (spectrum/decompose)**: Update signal/story test fixtures to match new Spectrum SKILL.md and decompose_plan.md formats.

## Files to Examine

- `cmd/prism-cli/main.go:19` — Version string definition (`version = "2.5.1"`)
- `cmd/prism-cli/app/footer.go:165` — Hardcoded version in footer rendering
- `cmd/prism-cli/app/model_integration_test.go` — Likely tests full model rendering including footer
- `cmd/prism-cli/state/state_test.go` — May test state including version
- `cmd/prism-cli/registry/registry_test.go` — May parse agent files with expected structure
- `agents/git-investigator.md` — Restructured to YAML frontmatter (was heading-based)
- `agents/log-investigator.md` — Restructured to YAML frontmatter (was heading-based)
- `agents/state-investigator.md` — Restructured to YAML frontmatter (was heading-based)
- `cmd/prism-cli/domain/signals_test.go` — May reference Spectrum signal patterns
- `cmd/prism-cli/domain/stories_extended_test.go` — May reference decompose output format
