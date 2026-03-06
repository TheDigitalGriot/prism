---
date: 2026-03-05
author: Claude
repository: prism-plugin
branch: main
ticket: N/A
status: draft
research: .prism/shared/research/2026-03-05-epic-schema-evolution.md
---

# Epic Schema Evolution + Code Intelligence Integration

## Overview

**Goal**: Rename the stories.json top-level key from `plan` to `epic`, add enrichment fields for decision/structural context, and integrate codebase-memory-mcp across all 4 Prism workflow phases — so every Spectrum session has the same architectural intelligence that makes prism-implement great, at ~5% of the token cost.

**Research**: `.prism/shared/research/2026-03-05-epic-schema-evolution.md`

**Related Spec**: `.prism/shared/docs/code-intel/prism-code-intelligence-integration.md`

**Complexity**: High (30+ files across Go, TypeScript, React, Bash, Markdown)

**Estimated Phases**: 14

## Success Criteria

### Automated Verification
- [ ] Go tests pass: `cd cmd/prism-cli && make test`
- [ ] Go lint passes: `cd cmd/prism-cli && make lint`
- [ ] Go builds: `cd cmd/prism-cli && make build`
- [ ] TS tests pass: `cd cmd/prism-vscode && npm test`
- [ ] No `"plan":` JSON key in any stories.json fixture: `grep -r '"plan":' --include="stories.json" .`
- [ ] No `Plan ` struct/interface in domain types (except comments): verify `Plan` renamed to `Epic` in `story.go` and `types.ts`

### Manual Verification
- [ ] `/decompose_plan` produces both `stories-v1.json` and `stories-v2.json` for A/B comparison
- [ ] `stories-v2.json` includes `epic.decisions`, `epic.risks`, `story.context` fields
- [ ] `spectrum.sh` correctly reads `.epic.name` via jq
- [ ] MonitorPanel renders quality gates from `epic.qualityGates`
- [ ] StoriesPanel displays `epic.name`
- [ ] `prism-spectrum` skill references `epic.*` and `story.context` in its workflow
- [ ] `graph-navigator` agent exists and is invocable
- [ ] `.mcp.json` configures codebase-memory-mcp (graceful if binary not installed)

## What We're NOT Doing

- CLI dashboard `plugin_graph.go` (Graph tab UI) — follow-up plan
- Spectrum plugin sidebar blast radius display — follow-up plan
- Monitor plugin graph health metrics panel — follow-up plan
- VSCode/Electron graph UI components — follow-up plan
- NSIS installer integration for codebase-memory-mcp binary — follow-up plan
- Backward-compatible dual parsing of `"plan":`/`"epic:"` — clean rename, all fixtures migrated

---

## Phase 1: Go Type Definitions

**Goal**: Rename `Plan` struct to `Epic`, add `StoryContext` struct, add enrichment fields.

**Files to modify**:
| File | Change |
|------|--------|
| `cmd/prism-cli/domain/story.go:11-22` | Rename `Plan` → `Epic`, JSON tag `"plan"` → `"epic"`, add enrichment fields |
| `cmd/prism-cli/domain/story.go:25-36` | Add `Context *StoryContext` field to `Story` struct |

**Steps**:
1. [x] Rename `Plan` struct to `Epic` in `story.go:17`
2. [x] Change `StoriesFile.Plan` field to `StoriesFile.Epic` with JSON tag `"epic"` at `story.go:12`
3. [x] Add enrichment fields to `Epic` struct: `Decisions []string`, `References []string`, `OutOfScope []string`, `Risks []string` — all with `json:",omitempty"`
4. [x] Create `StoryContext` struct with fields: `Why string`, `Risks []string`, `EdgeCases []string`, `Patterns []string`, `GraphTargets []string` — all with `json:",omitempty"`
5. [x] Add `Context *StoryContext` field to `Story` struct with `json:"context,omitempty"`

**Verification**:
```bash
cd cmd/prism-cli && go build ./...
```

**Checkpoint**: [x] Phase 1 complete

---

## Phase 2: Go Domain Logic

**Goal**: Update all Go code that references `sf.Plan` to use `sf.Epic`.

**Files to modify**:
| File | Change |
|------|--------|
| `cmd/prism-cli/domain/story.go:97-176` | All methods referencing `Plan` (mostly unchanged — they operate on Story, not Plan) |
| `cmd/prism-cli/domain/progress.go` | `planName` parameter references → `epicName` |
| `cmd/prism-cli/app/commands.go:16-66` | `sf.Plan.Name` → `sf.Epic.Name` in LoadStoriesCmd, ReloadStoriesCmd |
| `cmd/prism-cli/app/plugin_workspaces.go:921,1773` | `LoadStoriesFile()` consumers |

**Steps**:
1. [x] In `progress.go`: rename `planName` parameter to `epicName` in `Initialize()` method, update YAML frontmatter from `plan:` to `epic:`
2. [x] In `commands.go:16-40`: change `sf.Plan.Name` → `sf.Epic.Name` in `LoadStoriesCmd()`
3. [x] In `commands.go:43-66`: change `sf.Plan.Name` → `sf.Epic.Name` in `ReloadStoriesCmd()`
4. [x] In `plugin_workspaces.go`: update any `sf.Plan` references to `sf.Epic` (none found — clean)
5. [x] Search for any remaining `\.Plan\.` or `\.Plan ` references in `cmd/prism-cli/` and update (also fixed `"plan":` → `"epic":` in DecomposePlanCmd JSON scaffold)

**Verification**:
```bash
cd cmd/prism-cli && go build ./...
```

**Checkpoint**: [x] Phase 2 complete

---

## Phase 3: TypeScript Type Definitions

**Goal**: Rename `Plan` interface to `Epic`, add `StoryContext` interface, add enrichment fields.

**Files to modify**:
| File | Change |
|------|--------|
| `packages/prism-core/src/prism/types.ts:7-12` | Rename `Plan` → `Epic`, add enrichment fields |
| `packages/prism-core/src/prism/types.ts:27-39` | Add `context?: StoryContext` to `Story` |
| `packages/prism-core/src/prism/types.ts:42-45` | `StoriesFile.plan` → `StoriesFile.epic` |

**Steps**:
1. [x] Rename `Plan` interface to `Epic` at `types.ts:7`
2. [x] Add enrichment fields to `Epic`: `decisions?: string[]`, `references?: string[]`, `outOfScope?: string[]`, `risks?: string[]`
3. [x] Create `StoryContext` interface: `why?: string`, `risks?: string[]`, `edgeCases?: string[]`, `patterns?: string[]`, `graphTargets?: string[]`
4. [x] Add `context?: StoryContext` to `Story` interface
5. [x] Change `StoriesFile` from `plan: Plan` to `epic: Epic` at `types.ts:42-45`

**Verification**:
```bash
cd packages/prism-core && npx tsc --noEmit 2>&1 | head -20
```

**Checkpoint**: [x] Phase 3 complete

---

## Phase 4: TypeScript Domain Logic

**Goal**: Update all TS code that references `plan` to use `epic`.

**Files to modify**:
| File | Change |
|------|--------|
| `packages/prism-core/src/prism/stories.ts:1-5` | Update re-exports: `Plan` → `Epic` |
| `packages/prism-core/src/prism/progress.ts` | Update `planName` → `epicName` in `initialize()` |
| `packages/prism-core/src/shared/PrismState.ts:2,34,94` | `Plan` → `Epic`, `plan:` → `epic:` |
| `packages/prism-core/src/core/controller/BasePrismController.ts:583-595` | `sf.plan` → `sf.epic` in `_loadStories()` |
| `packages/prism-core/src/core/controller/prism/stories.ts` | StoriesManager — passthrough, update any `plan` refs |
| `packages/prism-core/src/core/controller/prism/spectrum-runner.ts` | Update any `plan` state refs |

**Steps**:
1. [x] In `stories.ts:1-5`: update import and re-export from `Plan` to `Epic` (also added `StoryContext`)
2. [x] In `progress.ts`: rename `planName` parameter to `epicName`, update YAML frontmatter template from `plan:` to `epic:`
3. [x] In `PrismState.ts:2`: update import `Plan` → `Epic`
4. [x] In `PrismState.ts:34`: change `plan: Plan | undefined` to `epic: Epic | undefined`
5. [x] In `PrismState.ts:94`: change `plan: undefined` to `epic: undefined` in defaults
6. [x] In `BasePrismController.ts:587-588`: change `plan: sf.plan` to `epic: sf.epic` in `_loadStories()`
7. [x] In `BasePrismController.ts:798`: change `this._state.plan.name` to `this._state.epic.name`
8. [x] In `stories.ts` (StoriesManager): no `plan` property references found (clean)
9. [x] In `spectrum-runner.ts`: no `plan` state references found (clean)
10. [x] Global search for remaining `.plan` references in `packages/prism-core/src/` — only workflow phase "Plan" references remain (correct, not the type)

**Verification**:
```bash
cd packages/prism-core && npx tsc --noEmit 2>&1 | head -20
```

**Checkpoint**: [x] Phase 4 complete

---

## Phase 5: Go Tests + Fixtures

**Goal**: Update all Go test files and JSON fixture files.

**Files to modify**:
| File | Change |
|------|--------|
| `cmd/prism-cli/domain/story_test.go` | Struct field references if any |
| `cmd/prism-cli/domain/stories_extended_test.go:34-49` | `"plan":` → `"epic":` in `sampleStoriesJSON()` |
| `cmd/prism-cli/domain/stories_extended_test.go:206-218` | `TestExtendedPlanFieldParsed` → `TestExtendedEpicFieldParsed` |
| `cmd/prism-cli/domain/config_integration_test.go:53-60` | `"plan":` → `"epic":` in fixture JSON |
| `cmd/prism-cli/domain/progress_test.go` | Update `planName` references if any |
| `cmd/prism-cli/testdata/stories.json` | `"plan":` → `"epic":` |
| `cmd/prism-cli/.prism/stories/stories.json` | `"plan":` → `"epic":` |

**Steps**:
1. [x] In `stories_extended_test.go:36`: change `"plan":` → `"epic":` in `sampleStoriesJSON()`
2. [x] In `stories_extended_test.go:206`: rename test function `TestExtendedPlanFieldParsed` → `TestExtendedEpicFieldParsed`
3. [x] In `stories_extended_test.go:209-217`: update field assertions from `sf.Plan.Name` to `sf.Epic.Name` etc.
4. [x] In `config_integration_test.go:54`: change `"plan":` → `"epic":` in fixture
5. [x] In `story_test.go`: no `Plan` struct references (clean)
6. [x] In `progress_test.go`: no `planName` references (clean)
7. [x] In `testdata/stories.json`: change `"plan":` → `"epic":` at top level
8. [x] In `cmd/prism-cli/.prism/stories/stories.json`: change `"plan":` → `"epic":` at top level
Also: [x] In `stories_extended_test.go:352`: change `"plan":` → `"epic":` in `TestExtendedEmptyStoriesFile`

**Verification**:
```bash
cd cmd/prism-cli && make test
```

**Checkpoint**: [x] Phase 5 complete

---

## Phase 6: TypeScript Tests

**Goal**: Update all TS test files.

**Files to modify**:
| File | Change |
|------|--------|
| `cmd/prism-vscode/src/prism/__tests__/stories.test.ts` | `plan:` → `epic:` in all fixtures, `Plan` → `Epic` in imports |
| `cmd/prism-vscode/src/prism/__tests__/progress.test.ts` | Update if `planName` referenced |
| `cmd/prism-vscode/src/prism/__tests__/signals.test.ts` | Likely no changes (signals don't reference plan) |

**Steps**:
1. [x] In `stories.test.ts`: update all `plan: { name: ...` to `epic: { name: ...` in inline fixtures (16 occurrences)
2. [x] In `stories.test.ts`: no `Plan` type import (tests import from `@prism-core/prism/stories` which re-exports — clean)
3. [x] In `stories.test.ts:294`: update `result.plan.name` → `result.epic.name` assertion
4. [x] In `progress.test.ts`: no `planName` references (tests path derivation only — clean)
5. [x] Verify `signals.test.ts` has no `plan` references (confirmed clean)

**Verification**:
```bash
cd cmd/prism-vscode && npm test
```
Note: `npm test` / `npx jest` fails with module resolution errors for ALL test suites (pre-existing @prism-core alias issue). `npx tsc --noEmit` passes clean in packages/prism-core.

**Checkpoint**: [x] Phase 6 complete

---

## Phase 7: React UI Components

**Goal**: Update React components that destructure `plan` from state.

**Files to modify**:
| File | Change |
|------|--------|
| `cmd/prism-electron/webview-ui/src/components/panels/MonitorPanel.tsx:29,76,176,180,201` | `plan` → `epic` |
| `cmd/prism-electron/webview-ui/src/components/panels/StoriesPanel.tsx:204` | `plan.name` → `epic.name` |

**Steps**:
1. [x] In `MonitorPanel.tsx:29`: change destructuring from `{ spectrum, stories, plan }` to `{ spectrum, stories, epic }`
2. [x] In `MonitorPanel.tsx:76`: change `plan.qualityGates` → `epic.qualityGates`
3. [x] In `MonitorPanel.tsx:176`: change `plan.qualityGates.length` → `epic.qualityGates.length`
4. [x] In `MonitorPanel.tsx:180`: change `plan?.qualityGates && plan.qualityGates.length > 0` → `epic?.qualityGates && epic.qualityGates.length > 0`
5. [x] In `MonitorPanel.tsx:201`: change `plan.qualityGates.map` → `epic.qualityGates.map`
6. [x] In `StoriesPanel.tsx:110,194-205`: change destructuring `plan` → `epic`, `plan.name` → `epic.name`, `{plan && (` → `{epic && (`
7. [x] Search for remaining `plan.` references — only workflow phase "plan" color key at line 120 (correct, not the type)
Also: [x] In `packages/prism-ui/src/context/PrismStateContext.tsx`: renamed `PrismPlan` → `PrismEpic`, `plan: PrismPlan | undefined` → `epic: PrismEpic | undefined`, `plan: undefined` → `epic: undefined` (discovered during verification — not in original plan)

**Verification**:
```bash
cd cmd/prism-electron/webview-ui && npx tsc --noEmit 2>&1 | head -20
```
Result: Clean (no errors)

**Checkpoint**: [x] Phase 7 complete

---

## Phase 8: Reference Fixtures + Shell Script

**Goal**: Update JSON reference fixtures and spectrum.sh.

**Files to modify**:
| File | Change |
|------|--------|
| `.prism/shared/ref/prism-tests/electron-ready/.prism/stories/stories.json` | `"plan":` → `"epic":` |
| `.prism/shared/ref/prism-tests/electron-update/thoughts/shared/ralph/stories.json` | `"plan":` → `"epic":` |
| `scripts/spectrum.sh:107-108` | `get_plan_name()` → `get_epic_name()`, jq `.plan.name` → `.epic.name` |

**Steps**:
1. [x] In electron-ready fixture: change `"plan":` → `"epic":` at top level
2. [x] In electron-update fixture: change `"plan":` → `"epic":` at top level
3. [x] In `spectrum.sh:107`: rename function `get_plan_name()` → `get_epic_name()`
4. [x] In `spectrum.sh:108`: change jq query `.plan.name` → `.epic.name`
5. [x] In `spectrum.sh`: update all callers of `get_plan_name` → `get_epic_name` (search for `plan_name` variable)
6. [x] Search for any remaining `.plan.` jq queries in `spectrum.sh`

**Verification**:
```bash
bash -n scripts/spectrum.sh  # Syntax check
grep -n '\.plan' scripts/spectrum.sh  # Should return nothing
```

**Checkpoint**: [x] Phase 8 complete

---

## Phase 9: Graph Infrastructure

**Goal**: Create graph-navigator agent, add `.mcp.json` config, add graph-first instructions to CLAUDE.md.

**Files to create**:
| File | Purpose |
|------|---------|
| `agents/graph-navigator.md` | New agent for structural graph queries |
| `.mcp.json` | MCP server config for codebase-memory-mcp |

**Files to modify**:
| File | Change |
|------|--------|
| `CLAUDE.md` | Add Code Intelligence section, update stories.json schema docs |

**Steps**:
1. [x] Create `agents/graph-navigator.md` with:
   - Frontmatter: `name: graph-navigator`, `model: haiku`, description about structural code analysis
   - Capabilities: find functions/classes/routes, trace call chains, detect dead code, blast radius, boundary violations
   - Output format: qualified names, file:line, relationship counts, risk classification
   - Cypher guidance for multi-hop patterns
2. [x] Create `.mcp.json` at project root:
   ```json
   {
     "mcpServers": {
       "codebase-memory-mcp": {
         "type": "stdio",
         "command": "codebase-memory-mcp"
       }
     }
   }
   ```
3. [x] In `CLAUDE.md`: update stories.json schema section — replace `"plan":` with `"epic":` in the example, add context fields
4. [x] In `CLAUDE.md`: add new section "## Code Intelligence (codebase-memory-mcp)" with graph-first usage instructions

**Verification**:
```bash
test -f agents/graph-navigator.md && echo "Agent exists"
test -f .mcp.json && echo "MCP config exists"
grep 'epic' CLAUDE.md | head -5  # Verify schema updated
```

**Checkpoint**: [x] Phase 9 complete

---

## Phase 10: Research Agent Prompts (Graph-First Strategy)

**Goal**: Add graph-first strategy section to the three research agents so they prefer graph tools over Glob/Grep for structural questions.

**Files to modify**:
| File | Change |
|------|--------|
| `agents/codebase-locator.md` | Add "Graph-First Strategy" section |
| `agents/codebase-analyzer.md` | Add "Graph-First Strategy" section |
| `agents/codebase-pattern-finder.md` | Add "Graph-First Strategy" section |

**Steps**:
1. [x] In `codebase-locator.md`: add after "Search Strategy" section (line ~39):
   ```markdown
   ## Graph-First Strategy

   When codebase-memory-mcp is available (check via list_projects), prefer
   graph tools over Glob/Grep for structural questions:

   1. Run get_graph_schema() FIRST to understand what's indexed
   2. Use search_graph() for symbol discovery (functions, classes, routes)
   3. Use list_directory() for file/directory discovery
   4. Fall back to Grep/Glob ONLY for text content (string literals, comments, config)
   ```
2. [x] In `codebase-analyzer.md`: add after "Analysis Strategy" section (line ~39):
   ```markdown
   ## Graph-First Strategy

   When codebase-memory-mcp is available (check via list_projects), prefer
   graph tools for understanding code structure:

   1. Run get_graph_schema() FIRST for orientation
   2. Use trace_call_path(direction="both") to understand relationships
   3. Use get_code_snippet() to read specific functions by qualified name
   4. Use query_graph() for cross-service flow analysis
   5. Fall back to Read tool ONLY for detailed implementation analysis
   ```
3. [x] In `codebase-pattern-finder.md`: add after "Search Strategy" section (line ~39):
   ```markdown
   ## Graph-First Strategy

   When codebase-memory-mcp is available (check via list_projects), prefer
   graph tools for finding patterns:

   1. Use search_graph(label="Function", file_pattern="...") for similar implementations
   2. Use get_code_snippet(qualified_name="...") to read specific patterns
   3. Use search_graph(relationship="CALLS") for integration patterns
   4. Fall back to Grep/Glob ONLY for text patterns (string literals, config values)
   ```

**Verification**:
```bash
grep -l "Graph-First Strategy" agents/*.md | wc -l  # Should be 3
```

**Checkpoint**: [x] Phase 10 complete

---

## Phase 11: Research Phase Integration

**Goal**: Update prism-research skill and research_codebase command to spawn graph-navigator alongside existing agents.

**Files to modify**:
| File | Change |
|------|--------|
| `skills/prism-research/SKILL.md:22-31` | Add graph-navigator to Available Agents table |
| `commands/research_codebase.md:34-43` | Add graph-navigator to parallel agent spawn |

**Steps**:
1. [x] In `prism-research/SKILL.md:22-31`: add row to Available Agents table:
   ```
   | `graph-navigator` | Structural analysis via knowledge graph |
   ```
2. [x] In `prism-research/SKILL.md`: add new step between "Check Existing Knowledge" and "Locate Code":
   ```markdown
   ### 1b. Structural Orientation (if codebase-memory-mcp available)

   ```
   Task(subagent_type="graph-navigator")
   "Index repository and provide structural overview: schema, key modules, function counts, relationship patterns for [topic]"
   ```
   ```
3. [x] In `research_codebase.md:34-43`: add graph-navigator to the agent list description:
   ```
   - Use the **graph-navigator** agent for structural analysis via knowledge graph (symbol discovery, call chains, dependencies)
   ```

**Verification**:
```bash
grep "graph-navigator" skills/prism-research/SKILL.md && echo "Research skill updated"
grep "graph-navigator" commands/research_codebase.md && echo "Research command updated"
```

**Checkpoint**: [x] Phase 11 complete

---

## Phase 12: Plan Phase Integration

**Goal**: Update plan template to include Structural Impact section, update create_plan to use graph-navigator for blast radius analysis.

**Files to modify**:
| File | Change |
|------|--------|
| `skills/prism-plan/references/plan-template.md:109-130` | Add Structural Impact section after Edge Cases |
| `commands/create_plan.md:49-56` | Add graph-navigator to research agent spawn |

**Steps**:
1. [x] In `plan-template.md`: add new section after "Edge Cases" (line ~117):
   ```markdown
   ## Structural Impact Analysis

   > Auto-generated by graph-navigator when codebase-memory-mcp is available.
   > Omit this section if graph is not indexed.

   ### Change Targets
   - `[qualified_name]` — [N] direct callers, [M] transitive

   ### Blast Radius: [LOW | MEDIUM | HIGH | CRITICAL]
   - [N] direct files affected
   - [M] transitive files potentially affected
   - [N] cross-service HTTP dependencies

   ### Dead Code Candidates
   - `[qualified_name]` — 0 callers, not an entry point
   ```
2. [x] In `create_plan.md:49-56`: add graph-navigator to agent list:
   ```
   - Use the **graph-navigator** agent for structural impact analysis (blast radius, call chains, dead code)
   ```
3. [x] In `create_plan.md`: add instruction to populate Structural Impact section:
   ```markdown
   **If codebase-memory-mcp is available:**
   - Spawn graph-navigator to run trace_call_path for each change target
   - Populate the "Structural Impact Analysis" section with blast radius data
   - Order plan phases by risk (higher blast radius = later phase)
   ```

**Verification**:
```bash
grep "Structural Impact" skills/prism-plan/references/plan-template.md && echo "Template updated"
grep "graph-navigator" commands/create_plan.md && echo "Create plan updated"
```

**Checkpoint**: [x] Phase 12 complete

---

## Phase 13: Implement Phase — Producer (Decompose) + Consumer (Spectrum)

**Goal**: Enhance `/decompose_plan` to extract enrichment fields and produce dual output. Enhance `prism-spectrum` to consume enrichment + graph verification.

**Files to modify**:
| File | Change |
|------|--------|
| `commands/decompose_plan.md` | Add enrichment extraction, dual output, graph-informed ordering |
| `skills/prism-spectrum/SKILL.md` | Add epic/context consumption, graph pre/post checks |
| `cmd/prism-setup/resources/plugin/skills/prism-spectrum/SKILL.md` | Mirror changes from main SKILL.md |

**Steps**:

**Decompose (Producer):**
1. [x] In `decompose_plan.md`: add new section after "Extract Quality Gates" (step 6):
   ```markdown
   ### 6c. Extract Epic Context (Enrichment)

   From the plan document, extract:
   1. **decisions** — from "Design Decisions", "Resolved Decisions", "Approach" sections
   2. **references** — from "Reference Implementations", "References" sections
   3. **outOfScope** — from "Out of Scope", "What We're NOT Doing" sections
   4. **risks** — from "Risks & Mitigations" section (brief summaries, not full table)
   ```
2. [x] In `decompose_plan.md`: add new section after story creation (step 7):
   ```markdown
   ### 7b. Extract Story Context

   For each story, derive:
   1. **why** — the design decision driving this story's approach (1 sentence)
   2. **risks** — plan risks that apply to this story's files
   3. **edgeCases** — from the plan's edge case table, filtered to this story
   4. **patterns** — reference implementations relevant to this story
   5. **graphTargets** — qualified function/class names from step descriptions
      (if codebase-memory-mcp available, use search_graph to get qualified names)
   ```
3. [x] In `decompose_plan.md`: add graph-informed ordering section:
   ```markdown
   ### 7c. Graph-Informed Ordering (if codebase-memory-mcp available)

   1. Run trace_call_path for each change target identified in the plan
   2. Order stories so CALLEE changes come BEFORE CALLER changes
   3. Populate graphTargets with qualified names from graph search results
   4. Flag stories touching cross-service boundaries as higher risk
   ```
4. [x] In `decompose_plan.md`: update output section (step 9) — replace `"plan":` with `"epic":` in the JSON template, add enrichment fields to the template
5. [x] In `decompose_plan.md`: add dual output section:
   ```markdown
   ### 9b. Generate Comparison Files (for A/B token measurement)

   Generate TWO files:
   1. `.prism/stories/stories-v1.json` — Current schema (epic key, no context fields)
   2. `.prism/stories/stories-v2.json` — Enriched schema (epic + all context fields)

   Copy the enriched version as the primary `.prism/stories/stories.json`.
   ```

**Spectrum (Consumer):**
6. [x] In `prism-spectrum/SKILL.md`: update State Files table — replace `plan.qualityGates` with `epic.qualityGates`
7. [x] In `prism-spectrum/SKILL.md`: add new step after "Load State" (step 1):
   ```markdown
   ### 1b. Load Epic + Story Context

   After loading state files, extract contextual intelligence:

   1. Read `epic.decisions`, `epic.risks`, `epic.outOfScope`, `epic.references`
      — these are the human-approved architectural decisions. Follow them.
   2. Read current story's `context.why` — understand WHY this story exists
   3. Read `context.risks` — be aware of known pitfalls
   4. Read `context.patterns` — follow referenced implementation patterns
   5. Read `context.edgeCases` — handle these explicitly

   If epic or context fields are absent, proceed with current behavior (implement from steps only).
   ```
8. [x] In `prism-spectrum/SKILL.md`: add graph verification section:
   ```markdown
   ### 1c. Graph Verification (if codebase-memory-mcp available)

   Before implementing:
   1. Run `index_repository` to ensure graph reflects latest code state
   2. For each function in `story.context.graphTargets`:
      - Run `trace_call_path(function_name, direction="inbound")`
      - Record current caller count
   3. If any target has significantly MORE callers than expected
      → emit `<spectrum-blocked reason="Blast radius changed: [target] now has [N] callers">`

   After implementing:
   4. Run `index_repository` again to capture changes
   5. Run `search_graph(max_degree=0, exclude_entry_points=true)` → dead code check
   6. Log graph delta in progress.md entry (nodes added/removed, new dead code)

   If codebase-memory-mcp is not available, skip all graph steps silently.
   ```
9. [x] In bundled setup SKILL.md (`cmd/prism-setup/resources/plugin/skills/prism-spectrum/SKILL.md`): mirror the key changes — `plan.qualityGates` → `epic.qualityGates`, add context loading note

**Verification**:
```bash
grep "epic" commands/decompose_plan.md | head -5
grep "epic.qualityGates" skills/prism-spectrum/SKILL.md
grep "Graph Verification" skills/prism-spectrum/SKILL.md
grep "stories-v1" commands/decompose_plan.md  # Dual output
```

**Checkpoint**: [x] Phase 13 complete

---

## Phase 14: Validate Phase + Documentation

**Goal**: Add structural validation checks to prism-validate, update all documentation.

**Files to modify**:
| File | Change |
|------|--------|
| `skills/prism-validate/SKILL.md` | Add structural validation section |
| `commands/validate_plan.md` | Add graph-based validation checks |
| `CLAUDE.md:79-104` | Update stories.json schema docs |
| `skills/prism/SKILL.md` | Update schema example, add code intel note |
| `skills/prism/references/workflow-patterns.md` | Update Spectrum workflow docs |

**Steps**:

**Validate:**
1. [x] In `prism-validate/SKILL.md`: add new section after "Check Success Criteria" (step 3):
   ```markdown
   ### 3b. Structural Validation (if codebase-memory-mcp available)

   Run graph-based verification to catch issues tests might miss:

   | Check | How | What It Catches |
   |-------|-----|-----------------|
   | No new dead code | `search_graph(max_degree=0, exclude_entry_points=true)` | Orphaned functions from refactoring |
   | Dependency integrity | `trace_call_path` for all modified functions | Broken call chains |
   | Boundary violations | `search_graph(file_pattern, relationship="CALLS")` | Cross-boundary calls |

   Include results in the validation report under "## Structural Validation Results".

   If codebase-memory-mcp is not available, skip with note: "Structural validation skipped: graph not indexed".
   ```
2. [x] In `validate_plan.md:61-83`: add graph validation to Step 2, spawning graph-navigator alongside other research tasks

**Documentation:**
3. [x] In `CLAUDE.md:79-104`: replace the stories.json schema example — `"plan":` → `"epic":`, add `context` field examples (done in Phase 9)
4. [x] In `CLAUDE.md`: update "Spectrum Autonomous Execution" section references (no `plan` refs found — section refers to `stories.json` generically)
5. [x] In `skills/prism/SKILL.md`: added `graph-navigator` to Research Agents table; no `plan` schema references in file
6. [x] In `skills/prism/references/workflow-patterns.md`: updated Spectrum file descriptions (epic context, graph deltas)
7. [x] Search all remaining markdown files for `plan.qualityGates` or `"plan":` references in stories.json context and update
   - Updated `cmd/prism-setup/resources/plugin/commands/decompose_plan.md` (`"plan":` → `"epic":`, `plan:` → `epic:` in progress frontmatter)
   - Remaining `"plan":` refs are in `.prism/shared/research/` (historical docs) and `.prism/shared/docs/PRISM-DOCUMENTATION-*` (versioned snapshots) — correctly left as-is

**Verification**:
```bash
grep "Structural Validation" skills/prism-validate/SKILL.md && echo "Validate updated"
grep -r '"plan":' CLAUDE.md skills/prism/ commands/ | grep -v "plan.md\|plan-template\|create_plan\|decompose_plan\|plan:" | head -5  # Should be minimal
```

**Checkpoint**: [x] Phase 14 complete

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Rename breaks live stories.json files | Low | Low | All fixtures in-repo, no external consumers |
| codebase-memory-mcp binary not available | Medium | Low | All graph integration conditional — "if available" checks |
| Enrichment fields bloat stories.json | Low | Low | ~200 tokens per story, all optional fields |
| GraphTargets stale by Spectrum execution | Medium | Medium | Graph verifies at runtime, emits blocked signal |
| Windows CGO issues for codebase-memory-mcp | Medium | Low | Graceful degradation — enrichment works without graph |
| Dual output adds decomposition complexity | Low | Low | Clear separation — v1 is just v2 with context fields stripped |

## Edge Cases

| Case | Handling |
|------|----------|
| Old stories.json with `"plan":` key | Will fail to parse — must migrate all files in Phase 5/6/8 |
| Plan has no "Risks & Mitigations" section | `epic.risks` array is empty — valid |
| Plan has no "Out of Scope" section | `epic.outOfScope` array is empty — valid |
| Story has no `context` field | Spectrum skips enrichment steps — backward compatible |
| Graph not indexed for this project | `list_projects` returns empty — all graph steps skipped silently |
| GraphTarget function was renamed since plan | `trace_call_path` returns no results — log warning, don't block |

## Out of Scope

- CLI dashboard `plugin_graph.go` (full Graph tab with tree/detail panes)
- Spectrum plugin sidebar blast radius display
- Monitor plugin graph health metrics
- VSCode/Electron graph UI components (sidebar, bottom panel, tree annotations)
- NSIS installer integration for codebase-memory-mcp binary
- Cross-project / monorepo graph support
- Kaleidoscope 3D visualization integration

## Rollback Plan

The schema rename is the only breaking change. If issues arise:
1. Global find-replace `"epic":` → `"plan":` in all JSON fixtures
2. Rename `Epic` → `Plan` in Go/TS types
3. Enrichment fields and graph integration are purely additive — can be removed without affecting core functionality

## Dependencies

**Must complete first**: None — this plan has no external blockers.

**Can parallelize with**: Follow-up CLI dashboard / VSCode UI graph visualization plan.

## Progress Log

| Phase | Status | Started | Completed | Notes |
|-------|--------|---------|-----------|-------|
| Phase 1: Go Types | Not started | | | |
| Phase 2: Go Domain | Not started | | | |
| Phase 3: TS Types | Not started | | | |
| Phase 4: TS Domain | Not started | | | |
| Phase 5: Go Tests | Not started | | | |
| Phase 6: TS Tests | Not started | | | |
| Phase 7: React UI | Not started | | | |
| Phase 8: Fixtures + Shell | Not started | | | |
| Phase 9: Graph Infrastructure | Not started | | | |
| Phase 10: Agent Prompts | Not started | | | |
| Phase 11: Research Phase | Not started | | | |
| Phase 12: Plan Phase | Not started | | | |
| Phase 13: Implement Phase | Not started | | | |
| Phase 14: Validate + Docs | Not started | | | |
