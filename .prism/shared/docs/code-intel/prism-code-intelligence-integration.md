# Prism × codebase-memory-mcp Integration Architecture

> Code Intelligence Layer for the Prism Development Workflow Suite
> Version 0.1 — Draft Specification

---

## 1. Executive Summary

This document defines how **codebase-memory-mcp** integrates into the Prism ecosystem as the code intelligence layer — providing structural awareness, impact analysis, and token-efficient codebase navigation across all three Prism platforms (CLI, VS Code, Electron) and the Claude plugin's story-driven workflow.

The integration is designed around a single principle: **the knowledge graph should be a first-class participant in the story lifecycle**, not a bolted-on lookup tool. Every phase of the Prism workflow (Research → Plan → Implement → Validate) benefits from structural understanding, and the graph should be automatically maintained as agents modify code.

---

## 2. Why codebase-memory-mcp

| Criterion | codebase-memory-mcp | jCodeMunch | Code-Index-MCP |
|-----------|---------------------|------------|----------------|
| Language | **Go** (native to Prism CLI) | Python | Python |
| Data model | Knowledge graph (nodes + edges) | Flat symbol index (JSON) | Plugin-based index |
| Dependency analysis | Call chains, transitive impact, HTTP links | None | Dependency tracking |
| Persistence | SQLite WAL (survives restarts) | JSON files | SQLite + FTS5 |
| Incremental reindex | Content-hash based | Full reindex | File watcher |
| Languages | 12 | 7 | 48 |
| External dependencies | None (single binary) | Python + pip | Python + Voyage AI key |
| Token efficiency | ~99.2% reduction (3.4K vs 412K) | ~80-99% reduction | Sub-100ms queries |
| Change impact | `detect_changes` with risk classification | None | None |
| Dead code detection | Built-in with entry point exclusion | None | None |
| Community detection | Louvain clustering | None | None |

**Decision**: codebase-memory-mcp wins on stack alignment (Go), graph-based reasoning (critical for agent workflows), zero dependencies, and persistence model that maps directly to Prism's story lifecycle.

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRISM ECOSYSTEM                                  │
│                                                                          │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐        │
│  │  CLI (Go)    │   │  VS Code     │   │  Electron            │        │
│  │  Bubble Tea  │   │  Extension   │   │  Desktop App         │        │
│  └──────┬───────┘   └──────┬───────┘   └──────────┬───────────┘        │
│         │                  │                       │                     │
│         └──────────────────┼───────────────────────┘                     │
│                            │                                             │
│                   ┌────────▼────────┐                                    │
│                   │  Claude CLI     │                                    │
│                   │  (child proc)   │                                    │
│                   └────────┬────────┘                                    │
│                            │                                             │
│              ┌─────────────┼─────────────┐                               │
│              │             │             │                                │
│              ▼             ▼             ▼                                │
│  ┌────────────────┐ ┌───────────┐ ┌──────────────────────┐              │
│  │ Prism Plugin   │ │ Other MCP │ │ codebase-memory-mcp  │              │
│  │ (25 cmds,      │ │ Servers   │ │                      │              │
│  │  10 agents,    │ │           │ │  ┌────────────────┐  │              │
│  │  11 skills)    │ │           │ │  │ Knowledge Graph │  │              │
│  │                │ │           │ │  │ (SQLite WAL)   │  │              │
│  └────────────────┘ └───────────┘ │  └────────────────┘  │              │
│                                   └──────────────────────┘              │
│                                                                          │
│  Shared State: .prism/ directory, stories.json, signal protocol          │
└─────────────────────────────────────────────────────────────────────────┘
```

The MCP server runs as a **stdio process** alongside the Claude CLI. Every Claude session (whether spawned by the CLI, VS Code, or Electron) can access the graph. The graph persists in `~/.cache/codebase-memory-mcp/` across sessions, meaning Spectrum's fresh-context-per-story approach gets free structural memory without burning context tokens.

---

## 4. Tool-to-Lifecycle Mapping

### 4.1 The 11 MCP Tools

codebase-memory-mcp exposes 11 tools organized in three groups. Each maps to specific moments in Prism's 4-phase workflow.

#### Indexing Tools

| Tool | Description | Prism Lifecycle Touchpoint |
|------|-------------|---------------------------|
| `index_repository` | Index a repo into the graph (incremental via content hash) | **Session start**, **post-implement**, **Spectrum iteration start** |
| `list_projects` | List indexed projects with timestamps and node/edge counts | **Onboarding**, **workspace switching**, **staleness checks** |
| `delete_project` | Remove a project and all graph data | **Workspace cleanup**, **project archival** |

#### Query Tools

| Tool | Description | Prism Lifecycle Touchpoint |
|------|-------------|---------------------------|
| `search_graph` | Structured search with filters (label, name pattern, file glob, relationship type, degree, entry point exclusion) | **Research agents**, **planning**, **dead code analysis**, **validation** |
| `trace_call_path` | BFS traversal from/to a function — returns call chains with signatures | **Impact analysis before implementation**, **blast radius for stories**, **debugging** |
| `query_graph` | Execute Cypher-like graph queries (read-only) | **Complex architectural queries**, **cross-service analysis**, **custom reporting** |
| `get_graph_schema` | Node/edge counts, relationship patterns, sample names | **Research phase orientation**, **onboarding**, **project health monitoring** |
| `get_code_snippet` | Read source code for a function by qualified name | **Implementation reference**, **pattern finding**, **code review** |

#### File Access Tools

| Tool | Description | Prism Lifecycle Touchpoint |
|------|-------------|---------------------------|
| `search_code` | Grep-like text search within indexed project files | **Text-level search (complements graph for string literals, config values)** |
| `read_file` | Read any file from indexed project (optional line range) | **Direct file access during implementation** |
| `list_directory` | List files/directories with glob filtering | **File discovery, directory navigation** |

---

### 4.2 Phase-by-Phase Integration

#### PHASE 1: Research (`prism-research` skill)

The research phase currently spawns 6 parallel agents. The graph transforms what these agents can accomplish.

```
CURRENT (without graph):
  codebase-locator    → Glob/Grep to find WHERE code lives
  codebase-analyzer   → Read files to understand HOW code works
  codebase-pattern-finder → Grep for similar implementations
  prism-locator       → Scan .prism/ directory
  prism-analyzer      → Deep-dive .prism/ documents
  web-search-researcher → External research

WITH GRAPH:
  codebase-locator    → search_graph(label="Function", name_pattern="...") 
                         search_graph(label="Route")
                         list_directory(path="...", glob="*.go")
                         ~200 tokens instead of ~40,000

  codebase-analyzer   → get_graph_schema() for orientation
                         trace_call_path(direction="both") for understanding
                         query_graph() for cross-service flows
                         ~3,400 tokens instead of ~412,000

  codebase-pattern-finder → search_graph(label="Function", file_pattern="...")
                            get_code_snippet(qualified_name="...")
                            ~500 tokens per pattern instead of ~15,000
```

**Agent prompt modification** — Add to `codebase-locator.md`, `codebase-analyzer.md`, and `codebase-pattern-finder.md`:

```markdown
## Graph-First Strategy

When codebase-memory-mcp is available (check via list_projects), ALWAYS prefer
graph tools over Glob/Grep for structural questions:

1. Run get_graph_schema() FIRST to understand what's indexed
2. Use search_graph() for symbol discovery (functions, classes, routes)
3. Use trace_call_path() for understanding relationships
4. Fall back to Grep/Glob ONLY for text content (string literals, comments, config)
```

**Estimated token savings for Research phase**: 85-95% reduction across a typical 6-agent research campaign.

---

#### PHASE 2: Plan (`prism-plan` skill, `/create_plan` command)

Planning benefits from impact analysis — knowing the blast radius before designing changes.

**Current flow**:
1. Spawn codebase-analyzer, codebase-pattern-finder, prism-analyzer in parallel
2. Present understanding to user
3. Iterate on plan sections
4. Finalize with success criteria

**Enhanced flow with graph**:
1. `index_repository` (ensure graph is current)
2. `get_graph_schema()` — quick orientation
3. `search_graph(label="Function", name_pattern="...target...")` — identify change targets
4. `trace_call_path(function_name="TargetFunc", direction="inbound", depth=3)` — **blast radius**
5. `search_graph(relationship="CALLS", direction="inbound", max_degree=0, exclude_entry_points=true)` — dead code that can be safely removed
6. Present structural understanding with concrete impact numbers to user
7. Plan phases become **risk-ordered** based on graph analysis

**New data in plan output** — Plans should include a "Structural Impact" section:

```markdown
## Structural Impact (auto-generated)

### Change Targets
- `auth/handler.go::LoginHandler#Function` — 4 direct callers, 12 transitive
- `auth/middleware.go::ValidateToken#Function` — 7 direct callers, 31 transitive

### Blast Radius: MEDIUM
- 2 direct files affected
- 5 transitive files potentially affected
- 0 cross-service HTTP dependencies

### Dead Code (safe to remove)
- `auth/legacy.go::OldValidate#Function` — 0 callers, not an entry point
```

---

#### PHASE 3: Implement (`prism-implement` skill, `/prism-spectrum` skill)

This is where the graph becomes critical for both manual implementation and Spectrum autonomous execution.

**Pre-implementation gate** (new step):
```
Before modifying any file, the implementing agent SHOULD:
1. trace_call_path(function_name="target", direction="inbound") 
2. Verify the blast radius matches what the plan predicted
3. If blast radius has changed (new callers since planning), PAUSE and report
```

**During Spectrum execution** — each story iteration:

```
┌─────────────────────────────────────────────────────────┐
│  Spectrum Story Iteration (enhanced)                     │
│                                                          │
│  1. index_repository (incremental — only changed files)  │
│  2. Read stories.json, select next story                 │
│  3. trace_call_path for story targets                    │
│     → Verify blast radius matches plan                   │
│  4. Implement changes                                    │
│  5. index_repository (capture new state)                 │
│  6. search_graph(max_degree=0) → check for new dead code │
│  7. Run quality gates                                    │
│  8. Emit signal (COMPLETE/CONTINUE/RETRY/BLOCKED/ERROR)  │
│  9. Write progress to progress.md                        │
│                                                          │
│  NEW: Progress.md now includes graph metrics:            │
│  - Nodes added/removed this iteration                    │
│  - New relationships created                             │
│  - Dead code introduced (regression check)               │
└─────────────────────────────────────────────────────────┘
```

**Story-level graph awareness** — Add to `prism-spectrum` SKILL.md:

```markdown
## Graph-Aware Execution

Before implementing each story:
1. Run `index_repository` to ensure the graph reflects the latest code state
2. Run `trace_call_path` for each function the story modifies
3. If any function has MORE callers than the plan expected → emit 
   <spectrum-blocked reason="Blast radius changed: X now has Y callers (plan expected Z)">

After implementing each story:
4. Run `index_repository` again to capture changes
5. Run dead code detection — if new dead code was introduced, log it in progress.md
6. Include graph delta in the COMPLETE signal metadata
```

---

#### PHASE 4: Validate (`prism-validate` skill)

Validation gains structural verification capabilities beyond just running tests.

**New validation checks**:

| Check | Graph Tool | What It Catches |
|-------|-----------|-----------------|
| No new dead code | `search_graph(max_degree=0, exclude_entry_points=true)` | Functions orphaned by refactoring |
| Dependency integrity | `trace_call_path` for all modified functions | Broken call chains |
| Cross-service contracts | `query_graph` for HTTP_CALLS edges | Broken API contracts between services |
| Architectural boundaries | `search_graph(file_pattern="...", relationship="CALLS")` | Violations of module boundaries |
| Complexity check | `search_graph(min_degree=10)` | Functions with too many callers (refactoring candidates) |

**Enhanced validation report** — Add to `.prism/shared/validation/`:

```markdown
## Structural Validation Results

### Dead Code: PASS ✓
- No new dead functions introduced (baseline: 3, current: 3)

### Dependency Integrity: PASS ✓  
- All 12 modified functions have valid call chains
- No broken transitive dependencies

### Cross-Service: PASS ✓
- 4 HTTP_CALLS edges verified (confidence > 0.5)
- No unmatched route handlers

### Boundary Violations: WARNING ⚠
- `ui/renderer.go::FormatOutput` calls `db/query.go::RawSQL` directly
  (bypasses service layer — consider routing through `service/data.go`)
```

---

## 5. Plugin Modifications

### 5.1 New Agent: `graph-navigator`

A new lightweight agent specialized in graph queries, assigned to Haiku for cost efficiency.

```markdown
---
name: graph-navigator
description: Queries the codebase knowledge graph for structural information. 
  Fast, cheap structural lookups — functions, call chains, dependencies, dead code.
tools: codebase-memory-mcp (all 11 tools)
model: haiku
---

# Graph Navigator Agent

You are a structural code analyst. You query the codebase knowledge graph to answer
structural questions about the codebase. You NEVER read files directly — you use
the graph tools exclusively.

## Your capabilities:
- Find functions, classes, routes by name or pattern
- Trace call chains (who calls what, what calls who)
- Detect dead code (zero-caller functions)
- Identify cross-service HTTP dependencies
- Report blast radius for proposed changes
- Assess architectural boundary violations

## Output format:
Always return structured findings as markdown with:
- Symbol qualified names (for cross-reference)
- File paths with line numbers
- Relationship counts (direct + transitive)
- Risk classification (CRITICAL/HIGH/MEDIUM/LOW) when relevant

## When to use Cypher:
Use query_graph with Cypher for multi-hop patterns that can't be expressed
with search_graph or trace_call_path alone. Examples:
- "Functions that call X which also call Y"
- "All paths from module A to module B"
- "HTTP routes with no handler functions"
```

**Where it gets spawned**:

| Skill/Command | When | Purpose |
|---------------|------|---------|
| `prism-research` | Parallel with other agents | Structural orientation, function discovery |
| `prism-plan` / `create_plan` | Before planning begins | Blast radius for change targets |
| `prism-spectrum` | Each story iteration start | Pre-implementation verification |
| `prism-validate` | Validation phase | Structural regression checks |
| `prism-debug` | Alongside other investigators | Call chain analysis for bug isolation |

### 5.2 Modified Commands

#### `/research_codebase` — Add graph-navigator to agent spawn

```markdown
## Agent Spawning (updated)

Spawn these agents in parallel:
1. graph-navigator (haiku) — structural analysis via knowledge graph
2. codebase-locator (haiku) — file locations by feature (text search fallback)
3. codebase-analyzer (opus) — deep analysis of HOW code works
4. codebase-pattern-finder (sonnet) — similar implementations
5. prism-locator (haiku) — .prism/ directory scan
6. prism-analyzer (opus) — .prism/ document analysis
7. web-search-researcher (sonnet) — external research
```

#### `/create_plan` — Add impact analysis section

Add to the plan template:

```markdown
## Structural Impact Analysis

> Auto-generated by graph-navigator. Do not edit manually.

### Change Targets
[List of functions/classes being modified with caller counts]

### Blast Radius
[Risk classification with transitive dependency counts]

### Dead Code Candidates
[Functions safe to remove based on zero-caller analysis]

### Cross-Service Dependencies
[HTTP_CALLS edges that cross service boundaries]
```

#### `/decompose_plan` — Graph-informed story ordering

The graph can inform story dependency ordering:

```markdown
## Enhanced Decomposition

When decomposing a plan into stories:
1. Run trace_call_path for each change target in the plan
2. Order stories so that CALLEE changes come BEFORE CALLER changes
   (modify the function before modifying its callers)
3. Group stories by module community (Louvain clustering) when possible
4. Flag stories that touch cross-service boundaries as higher risk
```

### 5.3 CLAUDE.md Addition

Add to the project's `CLAUDE.md`:

```markdown
## Code Intelligence (codebase-memory-mcp)

This project uses codebase-memory-mcp for structural code analysis. When available:

- **ALWAYS prefer graph tools over Glob/Grep for structural questions**
- Run `index_repository` at the start of research and after implementation phases
- Use `trace_call_path` before modifying any function to verify blast radius
- Use `search_graph(max_degree=0, exclude_entry_points=true)` to check for dead code
- Use `get_graph_schema` for quick project orientation
- Fall back to Grep/Glob only for text content (strings, comments, config values)

Graph queries cost ~500 tokens. File-by-file exploration costs ~80,000 tokens.
Always use the graph first.
```

---

## 6. CLI Dashboard Integration

### 6.1 New Plugin: `plugin_graph.go`

A new TUI plugin for the CLI dashboard that visualizes the knowledge graph.

**Tab position**: Between Monitor [8] and Browser [9]

```
[1] Home  [2] Research  [3] Plans  [4] Spectrum  [5] Files  
[6] Git   [7] Agent     [8] Monitor  [9] Graph  [0] Workspaces
```

**Views**:

```
┌─ Graph ─────────────────────────────────────────────────────────────┐
│                                                                      │
│  Project: prism-plugin     Nodes: 2,348    Edges: 3,853             │
│  Last indexed: 2m ago      Languages: Go, TypeScript, React         │
│                                                                      │
│  ┌─ Modules ──────────────┐  ┌─ Details ──────────────────────────┐ │
│  │                        │  │                                     │ │
│  │  ▼ cmd/prism-cli/      │  │  Function: plugin_spectrum.go       │ │
│  │    ▼ app/              │  │  ::SpectrumPlugin.executeStory      │ │
│  │      ► model.go (12)   │  │                                     │ │
│  │      ▶ update.go (8)   │  │  Callers (inbound): 3               │ │
│  │      ► views.go (5)    │  │    ├─ Update() in update.go         │ │
│  │      ▶ plugin_spec (23)│  │    ├─ Start() in plugin_spectrum.go │ │
│  │    ▼ domain/           │  │    └─ handleKey() in plugin_spec.go │ │
│  │      ► story.go (15)   │  │                                     │ │
│  │      ► signals.go (8)  │  │  Calls (outbound): 7                │ │
│  │    ▼ claude/           │  │    ├─ runner.Start()                 │ │
│  │      ► runner.go (10)  │  │    ├─ domain.LoadStories()          │ │
│  │      ► parser.go (6)   │  │    ├─ domain.SelectNext()           │ │
│  │                        │  │    └─ ... 4 more                     │ │
│  │                        │  │                                     │ │
│  │  Legend:                │  │  Risk: MEDIUM                       │ │
│  │  (N) = symbol count    │  │  Transitive impact: 31 functions    │ │
│  │  ▶ = has dead code     │  │                                     │ │
│  └────────────────────────┘  └─────────────────────────────────────┘ │
│                                                                      │
│  g index  / search  d dead-code  i impact  c cypher  r refresh      │
└──────────────────────────────────────────────────────────────────────┘
```

**Key bindings**:

| Key | Action |
|-----|--------|
| `g` | Re-index repository (incremental) |
| `/` | Search symbols by name pattern |
| `d` | Show dead code analysis |
| `i` | Show impact analysis for selected function |
| `c` | Open Cypher query input |
| `r` | Refresh graph stats |
| `Enter` | Expand/collapse tree node or view function details |
| `Tab` | Switch focus between tree and detail panes |

**EventBus integration** — New events:

| Event | Type String | Fields |
|-------|-------------|--------|
| `GraphIndexedEvent` | `"graph.indexed"` | ProjectPath, NodeCount, EdgeCount, Duration |
| `GraphQueryEvent` | `"graph.query"` | QueryType, ResultCount, TokensSaved |
| `BlastRadiusEvent` | `"graph.blast_radius"` | FunctionName, DirectCallers, TransitiveImpact, Risk |

### 6.2 Spectrum Plugin Enhancement

The existing `plugin_spectrum.go` (1,218 lines) gains graph awareness:

**Before each story execution** — display blast radius in the sidebar:

```
┌─ Sidebar ────────────┐
│                       │
│  ● Executing          │
│  Story 3/7            │
│                       │
│  Target Functions:    │
│  ├─ LoginHandler (4)  │
│  ├─ ValidateToken (7) │
│  └─ RefreshSession (2)│
│                       │
│  Blast Radius: MED    │
│  Direct: 13 callers   │
│  Transitive: 31 funcs │
│                       │
│  Dead Code: 1 found   │
│  └─ OldValidate (0)   │
│                       │
│  Graph: 2,348 nodes   │
│  Last idx: <1m ago    │
└───────────────────────┘
```

### 6.3 Monitor Plugin Enhancement

The existing `plugin_monitor.go` (917 lines) gains graph health metrics:

```
┌─ Graph Health ─────────────────────┐
│                                     │
│  Index Age: 2m 14s    Status: ●    │
│  Nodes: 2,348  Edges: 3,853       │
│  Dead Code: 3 functions            │
│  High Fan-Out: 2 functions (>10)   │
│  Cross-Service: 4 HTTP links       │
│                                     │
│  Token Savings This Session:       │
│  Graph queries: 12 (6,800 tok)     │
│  Avoided reads: ~480,000 tok       │
│  Efficiency: 98.6% reduction       │
└─────────────────────────────────────┘
```

---

## 7. VS Code / Electron Integration

Both share `packages/prism-core` and `packages/prism-ui`, so graph integration happens once in shared code.

### 7.1 Sidebar Webview — Graph Summary Panel

Add a collapsible "Code Graph" section to the sidebar webview:

- Index status indicator (green/yellow/red based on age)
- Node/edge counts
- Quick actions: Re-index, Search, Impact Analysis
- Dead code count badge

### 7.2 Bottom Panel — Graph Explorer Tab

Add a "Graph" tab alongside existing tabs in the bottom panel:

- Interactive call chain visualization (tree view)
- Blast radius overlay on file tree
- Cypher query console

### 7.3 Native Tree View — Impact Annotations

The VS Code extension's native tree view can show inline annotations:

```
src/
├── auth/
│   ├── handler.go          [4 callers, 2 HTTP routes]
│   ├── middleware.go        [7 callers, CRITICAL impact]
│   └── legacy.go           [⚠ DEAD CODE: 0 callers]
├── service/
│   └── order.go            [12 callers, 3 cross-service]
```

---

## 8. MCP Server Configuration

### 8.1 Per-Project `.mcp.json`

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

### 8.2 Global `~/.claude/settings.json` (for all projects)

```json
{
  "mcpServers": {
    "codebase-memory-mcp": {
      "type": "stdio",
      "command": "/usr/local/bin/codebase-memory-mcp"
    }
  }
}
```

### 8.3 Installer Integration (`sections/plugin.nsh`)

Add codebase-memory-mcp binary to the NSIS installer:

1. Download pre-built binary from GitHub releases (like prism-cli)
2. Install to `$INSTDIR\bin\codebase-memory-mcp.exe`
3. Add to `.mcp.json` template during plugin installation
4. WSL2 note: CGO requires Linux build on Windows

---

## 9. Data Flow: Graph Through a Complete Story Lifecycle

```
User: "help me build OAuth login"
    │
    ▼
prism skill activates → routes to /prism-research
    │
    ├── graph-navigator (haiku):
    │     index_repository(repo_path=".")
    │     get_graph_schema()                    → "2,348 nodes, Go/TS/React"
    │     search_graph(name_pattern=".*auth.*") → 12 functions found
    │     search_graph(label="Route")           → 8 REST routes found
    │     trace_call_path("LoginHandler", "both", 3) → call chain map
    │     OUTPUT: structural map with caller counts
    │
    ├── codebase-locator (haiku):
    │     search_code(query="TODO auth")        → text search for TODOs
    │     OUTPUT: file locations
    │
    ├── codebase-analyzer (opus):
    │     get_code_snippet("auth.LoginHandler") → source code
    │     get_code_snippet("auth.ValidateToken") → source code  
    │     OUTPUT: deep analysis with graph context
    │
    └── [remaining agents run in parallel]
    
    ▼
/prism-plan (with graph-informed context)
    │
    ├── trace_call_path("LoginHandler", "inbound") → 4 callers
    ├── trace_call_path("ValidateToken", "inbound") → 7 callers  
    ├── search_graph(max_degree=0, exclude_entry_points=true) → 1 dead func
    ├── Plan includes "Structural Impact" section
    ├── Stories ordered by dependency graph (callees before callers)
    │
    ▼
/decompose_plan → stories.json
    │
    ▼
spectrum.sh + /prism-spectrum (per story):
    │
    │  ┌─ Story Iteration ──────────────────────────────────┐
    │  │                                                      │
    │  │  1. index_repository (incremental)                   │
    │  │  2. trace_call_path for story targets                │
    │  │  3. Verify blast radius matches plan                 │
    │  │  4. Implement changes                                │
    │  │  5. index_repository (capture new state)             │
    │  │  6. Dead code check                                  │
    │  │  7. Quality gates (tests, lint, typecheck)           │
    │  │  8. Signal: COMPLETE / CONTINUE / RETRY / BLOCKED    │
    │  │  9. Graph delta logged to progress.md                │
    │  │                                                      │
    │  └──────────────────────────────────────────────────────┘
    │  (repeat for each story)
    │
    ▼
/prism-validate
    │
    ├── Dead code check (before vs after)
    ├── Dependency integrity verification
    ├── Cross-service contract validation  
    ├── Architectural boundary check
    ├── Validation report includes structural section
    │
    ▼
Done — PR created with structural impact summary
```

---

## 10. Implementation Phases

### Phase 1: Foundation (Week 1-2)

- [ ] Install codebase-memory-mcp binary into development environment
- [ ] Add `.mcp.json` configuration to prism-plugin repository
- [ ] Add CLAUDE.md graph-first instructions
- [ ] Create `graph-navigator` agent markdown (`agents/graph-navigator.md`)
- [ ] Test graph queries against the prism-plugin codebase itself
- [ ] Document token savings benchmarks

### Phase 2: Plugin Integration (Week 2-3)

- [ ] Modify `prism-research` skill to spawn `graph-navigator`
- [ ] Modify `/create_plan` command to include Structural Impact section
- [ ] Modify `/decompose_plan` to use graph for story ordering
- [ ] Modify `prism-spectrum` skill for pre-story blast radius checks
- [ ] Modify `prism-validate` skill for structural validation checks
- [ ] Update research agent prompts with graph-first strategy

### Phase 3: CLI Dashboard (Week 3-4)

- [ ] Create `plugin_graph.go` with tree + detail pane views
- [ ] Add graph events to EventBus (`GraphIndexedEvent`, `BlastRadiusEvent`)
- [ ] Enhance `plugin_spectrum.go` sidebar with blast radius display
- [ ] Enhance `plugin_monitor.go` with graph health metrics
- [ ] Add graph tab to tab bar
- [ ] Wire key bindings (search, dead code, impact, cypher)

### Phase 4: VS Code / Electron (Week 4-5)

- [ ] Add graph summary to sidebar webview (prism-ui shared component)
- [ ] Add Graph Explorer tab to bottom panel
- [ ] Add impact annotations to native tree view
- [ ] Wire graph refresh to file save events

### Phase 5: Installer & Distribution (Week 5-6)

- [ ] Add codebase-memory-mcp binary to NSIS installer
- [ ] Add to GitHub releases workflow
- [ ] Cross-platform build (Linux/macOS via Go, Windows via WSL2/cross-compile)
- [ ] Update VitePress documentation site with graph integration guide

---

## 11. Open Questions

1. **Windows support**: codebase-memory-mcp requires CGO (tree-sitter). Windows builds need either cross-compilation from Linux or WSL2. Should the installer handle WSL2 detection, or should we pursue a pure-Go tree-sitter alternative?

2. **Graph freshness during Spectrum**: Should `index_repository` run at the START of every Spectrum iteration, or only when `detect_changes` reports modified files? The incremental reindex is fast (~1-2s for small changes), but adds latency to each iteration.

3. **Multi-project graphs**: Prism's Workspaces plugin manages multiple projects. Should each project have an independent graph, or should there be a cross-project graph for monorepo scenarios? Current architecture uses per-project SQLite databases.

4. **Kaleidoscope integration**: The Louvain community detection in codebase-memory-mcp could feed directly into a 3D visualization. Should the Graph plugin in the CLI include a basic community view, or should this wait for the Kaleidoscope project?

5. **Graph in handoffs**: Should `create_handoff` include graph state (node/edge counts, key relationships) in the handoff document? This would help the next session orient faster without re-querying.

---

## 12. Success Metrics

| Metric | Baseline (no graph) | Target (with graph) |
|--------|---------------------|---------------------|
| Research phase tokens | ~400K per campaign | ~40K per campaign |
| Time to understand unfamiliar codebase | ~15 min agent work | ~3 min agent work |
| Dead code detected before merge | 0 (not checked) | 100% of new dead code caught |
| Blast radius surprises during implementation | ~20% of stories | <5% of stories |
| Cross-service contract breaks | Caught by tests only | Caught before implementation |
| Token cost per Spectrum iteration | ~50K tokens avg | ~8K tokens avg |
