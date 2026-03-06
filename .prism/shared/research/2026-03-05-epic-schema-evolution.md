# Research: Epic Schema Evolution + Code Intelligence Integration

**Date**: 2026-03-05
**Scope**: stories.json schema rename (`plan` → `epic`), enrichment fields, codebase-memory-mcp integration across ALL 4 Prism phases (research, plan, implement/spectrum, validate)
**Related**: `.prism/shared/docs/code-intel/prism-code-intelligence-integration.md` (parent spec)
**Token Comparison**: Dual output from `/decompose_plan` — `stories-v1.json` (current schema) + `stories-v2.json` (enriched) for A/B measurement

---

## 1. Problem Statement

The Prism workflow has two execution paths from plan to code:

| Path | Entry | Context | Quality |
|------|-------|---------|---------|
| **prism-implement** | Reads plan markdown directly | Full architectural context (decisions, risks, edge cases, narrative) | Excellent — knows WHY |
| **Spectrum** | Reads decomposed stories.json | Thin: title, description, file list, steps | Variable — knows WHAT but not WHY |

The `/decompose_plan` command performs a **lossy one-way transformation**. Stories lose:

- **Decision context** — why this approach was chosen over alternatives
- **Risk awareness** — what could go wrong and mitigations
- **Edge cases** — unusual scenarios per change target
- **Reference implementations** — patterns studied during research
- **Out of scope** — what NOT to do (prevents scope creep in autonomous mode)
- **Structural context** — call chains, blast radius, dead code (requires re-reading files)
- **Phase-level verification** — only top-level `qualityGates` survive
- **Manual verification criteria** — no analog in stories.json

The `plan.source` field points back to the original plan, but **prism-spectrum never reads it** — it only reads stories.json, progress.md, and CLAUDE.md.

### Two Types of Context Loss

| Type | What's Lost | Solution |
|------|-------------|----------|
| **Decision context** | Why this approach, risks, edge cases, references | **Enriched stories** — embed in `epic` + `story.context` fields |
| **Structural context** | Call chains, blast radius, dead code, dependencies | **codebase-memory-mcp** — graph persists in SQLite across sessions |

Neither alone is sufficient. Together they give each fresh Spectrum session ~90% of prism-implement's context at ~5% of the token cost.

---

## 2. Current Schema Analysis

### stories.json Structure (v1 — current)

```json
{
  "plan": {
    "name": "string",
    "source": "string (path to plan)",
    "createdAt": "string (ISO timestamp, optional)",
    "qualityGates": ["string[]"]
  },
  "stories": [{
    "id": "STORY-XXX",
    "title": "string",
    "description": "string",
    "priority": "number",
    "status": "pending | in_progress | complete",
    "blockedBy": "string | null",
    "files": [{ "path": "string", "action": "create | modify | delete" }],
    "steps": [{ "description": "string", "done": "boolean" }],
    "completedAt": "string (optional)",
    "commitHash": "string (optional)"
  }]
}
```

### Type Definitions

**Go** — `cmd/prism-cli/domain/story.go`:
- `StoriesFile` (line 11): `Plan Plan` + `Stories []Story`
- `Plan` (line 17): `Name`, `Source`, `CreatedAt`, `QualityGates`
- `Story` (line 25): 10 fields, `BlockedBy *string`, optional fields via `omitempty`

**TypeScript** — `packages/prism-core/src/prism/types.ts`:
- `StoriesFile` (line 42): `plan: Plan` + `stories: Story[]`
- `Plan` (line 7): `name`, `source`, `createdAt?`, `qualityGates`
- `Story` (line 27): 10 fields, `blockedBy: string | null`, optional via `?`

### Full Reference List

#### Core type definitions
- `packages/prism-core/src/prism/types.ts` — canonical TS interfaces
- `cmd/prism-cli/domain/story.go` — canonical Go structs

#### Domain logic
- `packages/prism-core/src/prism/stories.ts` — TS domain (load, save, getNext, mark)
- `cmd/prism-cli/domain/story.go` — Go domain (same operations)

#### Controllers & state
- `packages/prism-core/src/core/controller/BasePrismController.ts:583-595` — `_loadStories()` reads `sf.plan`
- `packages/prism-core/src/core/controller/prism/stories.ts` — StoriesManager class
- `packages/prism-core/src/core/controller/prism/spectrum-runner.ts` — Spectrum iteration executor
- `packages/prism-core/src/shared/PrismState.ts:34` — `plan: Plan | undefined` in extension state

#### Progress file management
- `packages/prism-core/src/prism/progress.ts` — TS progress path derivation + initialization
- `cmd/prism-cli/domain/progress.go` — Go progress file handler, uses `planName`

#### CLI application
- `cmd/prism-cli/app/commands.go:16-40` — `LoadStoriesCmd()` extracts `sf.Plan.Name`
- `cmd/prism-cli/app/commands.go:43-66` — `ReloadStoriesCmd()` returns `sf.Plan.Name`
- `cmd/prism-cli/app/plugin_workspaces.go:921,1773` — `LoadStoriesFile()`

#### React UI components
- `cmd/prism-electron/webview-ui/src/components/panels/MonitorPanel.tsx:29,76,176,180,201` — destructures `plan`, reads `plan.qualityGates`
- `cmd/prism-electron/webview-ui/src/components/panels/StoriesPanel.tsx:204` — displays `plan.name`

#### Shell scripts
- `scripts/spectrum.sh:108` — `jq -r '.plan.name // "Unknown Plan"'`

#### Test files
- `cmd/prism-cli/domain/story_test.go` — Go unit tests (inline fixtures)
- `cmd/prism-cli/domain/stories_extended_test.go:34-49` — `sampleStoriesJSON()` with `"plan":` key
- `cmd/prism-cli/domain/config_integration_test.go:53-60` — fixture JSON with `"plan":` key
- `cmd/prism-cli/domain/progress_test.go` — progress path derivation
- `cmd/prism-vscode/src/prism/__tests__/stories.test.ts` — TS domain tests with `plan:` fixtures
- `cmd/prism-vscode/src/prism/__tests__/progress.test.ts` — TS progress tests

#### Fixture files
- `cmd/prism-cli/testdata/stories.json` — 4-story demo fixture
- `cmd/prism-cli/.prism/stories/stories.json` — minimal live file
- `.prism/shared/ref/prism-tests/electron-ready/.prism/stories/stories.json` — 8-story reference
- `.prism/shared/ref/prism-tests/electron-update/thoughts/shared/ralph/stories.json` — 6-story reference

#### Skills, commands, documentation
- `skills/prism-spectrum/SKILL.md:106` — references `plan.qualityGates`
- `commands/decompose_plan.md:191-198` — generates `"plan":` object
- `CLAUDE.md:79-104` — documents stories.json schema
- `skills/prism/SKILL.md` — documents `.prism/stories/` location
- `skills/prism/references/workflow-patterns.md` — Spectrum workflow docs
- `commands/prism_cli.md` — CLI auto-detection
- `cmd/prism-setup/resources/plugin/skills/prism-spectrum/SKILL.md` — bundled skill copy

---

## 3. Proposed Schema (v2 — enriched)

### Rename: `plan` → `epic`

The top-level key `"plan"` becomes `"epic"`. Rationale:
- An epic IS the semantic container for stories (matches PM terminology)
- Maps to Jira Epics, Linear Projects, GitHub Milestones
- Already have epic-scoped directory layout: `.prism/stories/<epic>/stories.json`
- "Plan" was always a misnomer — it's metadata ABOUT the plan, not the plan itself
- Future-proofs for PM board integration (labels, milestone, externalId)

### Enrichment: `epic.*` context fields + `story.context`

```json
{
  "epic": {
    "name": "Agent Chat Redesign",
    "source": ".prism/shared/plans/2026-03-04-agent-chat-redesign.md",
    "createdAt": "2026-03-04T10:00:00Z",
    "qualityGates": ["make test", "make lint"],
    "decisions": [
      "Persistent Claude CLI subprocess, not one-shot --print",
      "Event bus architecture for cross-platform (CLI/VSCode/Electron)"
    ],
    "references": [
      "OpenCode: event bus, SQLite sessions, Dialog stack"
    ],
    "outOfScope": [
      "VSCode/Electron UI implementation (CLI only)"
    ],
    "risks": [
      "Claude CLI subprocess may not support persistent mode on all platforms"
    ]
  },

  "stories": [
    {
      "id": "STORY-001",
      "title": "Create agentbus event bus package",
      "description": "Thread-safe pub/sub event bus with discriminated event types",
      "priority": 1,
      "status": "pending",
      "blockedBy": null,
      "files": [
        { "path": "cmd/prism-cli/agentbus/bus.go", "action": "create" },
        { "path": "cmd/prism-cli/agentbus/events.go", "action": "create" }
      ],
      "steps": [
        { "description": "Create Bus struct with sync.RWMutex", "done": false },
        { "description": "Define EventType enum with 18 event types", "done": false }
      ],
      "context": {
        "why": "Decouples agent execution from UI rendering — same events consumed by CLI, VSCode, Electron",
        "risks": ["Backpressure if subscribers are slow — use buffered channel per subscriber"],
        "edgeCases": ["Subscriber panics must not crash publisher — recover in goroutine"],
        "patterns": ["Follow OpenCode's Bus pattern: typed events, not interface{}"],
        "graphTargets": ["agentbus.Bus", "agentbus.Event"]
      }
    }
  ]
}
```

### Token Budget Per Spectrum Session

| Context Source | Tokens | Purpose |
|---|---|---|
| `epic.*` enrichment | ~300-500 | Shared decisions, risks, references — read once |
| `story.context` | ~100-200 | Per-story "why", risks, patterns — for current work |
| Graph queries (`index_repository` + `trace_call_path`) | ~500-1500 | Structural blast radius, call chains — on demand |
| `progress.md` | ~500-2000 | Accumulated learnings — read once |
| **Total added** | **~1.5K-4K** | **<8% of a typical ~50K session** |

Compare: reading the full plan document would cost ~15K-30K tokens.

### Backward Compatibility

All enrichment fields are **optional**:
- Go: `omitempty` on new struct fields
- TS: `?` optional properties
- Old stories.json files with `"plan":` key: require migration (simple find-replace) or backward-compatible parsing

**Approach chosen**: Clean rename — no backward-compatible dual parsing. All existing fixtures and live files will be migrated in the plan. The schema is internal to Prism, not a public API.

---

## 4. Type Changes

### Go Struct (v2)

```go
type StoriesFile struct {
    Epic    Epic    `json:"epic"`
    Stories []Story `json:"stories"`
}

type Epic struct {
    Name         string   `json:"name"`
    Source       string   `json:"source"`
    CreatedAt    string   `json:"createdAt,omitempty"`
    QualityGates []string `json:"qualityGates"`
    // Enrichment fields (populated by /decompose_plan)
    Decisions    []string `json:"decisions,omitempty"`
    References   []string `json:"references,omitempty"`
    OutOfScope   []string `json:"outOfScope,omitempty"`
    Risks        []string `json:"risks,omitempty"`
}

type StoryContext struct {
    Why          string   `json:"why,omitempty"`
    Risks        []string `json:"risks,omitempty"`
    EdgeCases    []string `json:"edgeCases,omitempty"`
    Patterns     []string `json:"patterns,omitempty"`
    GraphTargets []string `json:"graphTargets,omitempty"`
}

type Story struct {
    ID          string        `json:"id"`
    Title       string        `json:"title"`
    Description string        `json:"description"`
    Priority    int           `json:"priority"`
    Status      string        `json:"status"`
    BlockedBy   *string       `json:"blockedBy"`
    Files       []File        `json:"files"`
    Steps       []Step        `json:"steps"`
    Context     *StoryContext `json:"context,omitempty"`
    CompletedAt *string       `json:"completedAt,omitempty"`
    CommitHash  *string       `json:"commitHash,omitempty"`
}
```

### TypeScript Interfaces (v2)

```typescript
export interface Epic {
  name: string
  source: string
  createdAt?: string
  qualityGates: string[]
  // Enrichment fields
  decisions?: string[]
  references?: string[]
  outOfScope?: string[]
  risks?: string[]
}

export interface StoryContext {
  why?: string
  risks?: string[]
  edgeCases?: string[]
  patterns?: string[]
  graphTargets?: string[]
}

export interface Story {
  id: string
  title: string
  description: string
  priority: number
  status: string
  blockedBy: string | null
  files: StoryFile[]
  steps: Step[]
  context?: StoryContext
  completedAt?: string
  commitHash?: string
}

export interface StoriesFile {
  epic: Epic
  stories: Story[]
}
```

---

## 5. Producer: Enhanced `/decompose_plan`

The decompose command currently extracts phases, steps, files, and quality gates. Enhanced decomposition adds:

### Epic-Level Extraction
From the plan markdown, extract:
1. **decisions** — from "Design Decisions", "Resolved Decisions", or "Approach" sections
2. **references** — from "Reference Implementations", "References", or "Studied" mentions
3. **outOfScope** — from "Out of Scope", "What We're NOT Doing" sections
4. **risks** — from "Risks & Mitigations", "Risks" sections

### Story-Level Context Extraction
For each story, derive from the plan:
1. **why** — the design decision that drives this story's approach
2. **risks** — plan-level risks filtered to this story's files
3. **edgeCases** — from the plan's edge case table, filtered to this story
4. **patterns** — reference implementations relevant to this story
5. **graphTargets** — function/class names extracted from step descriptions and file targets

### Graph-Informed Story Ordering (when codebase-memory-mcp available)
1. Run `trace_call_path` for each change target in the plan
2. Order stories so CALLEE changes come BEFORE CALLER changes
3. Group stories by module community (Louvain clustering) when possible
4. Populate `graphTargets` with qualified function names from graph search

---

## 6. Consumer: Enhanced `prism-spectrum`

### New Step: Load Epic + Story Context (after Load State)

```
1. Read stories file → pick next story (unchanged)
2. NEW: Extract epic.decisions, epic.risks, epic.outOfScope, epic.references
3. NEW: Extract story.context.why, story.context.risks, etc.
4. NEW: If codebase-memory-mcp available:
   a. Run index_repository (incremental)
   b. For each graphTarget in story.context.graphTargets:
      - trace_call_path → get current caller count
   c. If blast radius exceeds expectations → <spectrum-blocked>
5. Read progress.md → accumulated learnings (unchanged)
6. Implement story (unchanged, but now with decision context)
7. Quality gates (unchanged)
8. NEW: If codebase-memory-mcp available:
   a. Run index_repository (capture new state)
   b. search_graph(max_degree=0, exclude_entry_points=true) → dead code check
   c. Log graph delta in progress.md entry
9. Commit (unchanged)
10. Signal (unchanged)
```

### Graph as Autonomous HumanLayer Proxy

The `graphTargets` field creates a contract between plan (human-approved) and graph (live truth):
- At decomposition: plan says "LoginHandler has 4 callers"
- At execution: `trace_call_path("LoginHandler")` verifies
- If diverged: `<spectrum-blocked>` — human's approved blast radius no longer valid

This is structural verification acting as autonomous proxy for human judgment.

---

## 7. What's IN This Plan vs Follow-Up

### IN this plan (unified: schema + all 4 phases)

| Change | Files |
|--------|-------|
| Rename `Plan` → `Epic` (Go struct + JSON tag) | `cmd/prism-cli/domain/story.go` |
| Rename `Plan` → `Epic` (TS interface) | `packages/prism-core/src/prism/types.ts` |
| Add `StoryContext` types | Both Go + TS |
| Update all Go domain references | `story.go`, `progress.go`, `commands.go` |
| Update all TS domain references | `stories.ts`, `progress.ts`, `BasePrismController.ts`, `PrismState.ts`, `StoriesManager`, `spectrum-runner.ts` |
| Update React UI | `MonitorPanel.tsx`, `StoriesPanel.tsx` |
| Update shell script | `spectrum.sh` (jq query) |
| Update all Go tests + fixtures | 4 test files + testdata |
| Update all TS tests | 3 test files |
| Update all JSON fixture files | 4 fixture files |
| Enhance `/decompose_plan` prompt | `commands/decompose_plan.md` (dual output: v1 + v2) |
| Enhance `prism-spectrum` prompt | `skills/prism-spectrum/SKILL.md` |
| Create `graph-navigator` agent | `agents/graph-navigator.md` |
| Add `.mcp.json` for codebase-memory-mcp | `.mcp.json` (project root) |
| Enhance `/research_codebase` | `commands/research_codebase.md` (add graph-navigator to agent spawn) |
| Enhance `prism-research` skill | `skills/prism-research/SKILL.md` (graph-navigator in parallel agents) |
| Enhance `prism-plan` / `create_plan` | Add Structural Impact section to plan template |
| Enhance `prism-validate` skill | Structural validation checks (dead code, dependency integrity) |
| Update research agent prompts | Graph-first strategy in `codebase-locator.md`, `codebase-analyzer.md`, `codebase-pattern-finder.md` |
| Update `CLAUDE.md` schema docs + graph instructions | `CLAUDE.md` |
| Update workflow documentation | `skills/prism/SKILL.md`, `workflow-patterns.md` |
| Update bundled setup skill | `cmd/prism-setup/resources/plugin/skills/prism-spectrum/SKILL.md` |

### Follow-up (separate plan — UI/visualization/distribution)

| Section | Scope |
|---------|-------|
| 6.1 CLI `plugin_graph.go` | Full Graph tab in TUI dashboard |
| 6.2 Spectrum plugin sidebar | Blast radius display during execution |
| 6.3 Monitor plugin | Graph health metrics |
| 7.x VSCode/Electron | Graph summary, explorer tab, impact annotations |
| 8.3 Installer | NSIS integration for codebase-memory-mcp binary |

---

## 8. HumanLayer + Ralph Loop Verification

### HumanLayer Preserved

| Gate | Before | After |
|------|--------|-------|
| Plan approval | Human approves plan | Same |
| Decomposition review | Human sees titles + files | **Enhanced**: human sees decisions, risks, graphTargets per story |
| Autonomous execution | Spectrum runs without human | Same, but graph acts as structural proxy for human judgment |
| Blast radius check | Not checked | **New**: graph verifies caller counts match plan expectations |

### Ralph Loop Preserved

| Property | Status |
|----------|--------|
| Fresh context per story | Unchanged — enrichment is IN the files, not in session memory |
| Signal protocol | Unchanged — same 5 signals |
| Atomic commits | Unchanged — one story = one commit |
| Progress accumulation | Enhanced — now includes graph delta metrics |
| `spectrum.sh` orchestrator | Unchanged — only jq key path changes |

---

## 9. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Rename breaks live stories.json files | LOW | All fixtures are in-repo; no external consumers |
| codebase-memory-mcp not installed | LOW | All graph integration is conditional ("if available") |
| Enrichment fields bloat stories.json | LOW | ~200 tokens per story, optional fields |
| GraphTargets stale by execution time | MEDIUM | Graph verifies at runtime, emits blocked signal |
| Windows CGO issues for codebase-memory-mcp | MEDIUM | Graceful degradation — enrichment works without graph |
