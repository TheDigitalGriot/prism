---
title: "Griot Creative Ecosystem — Knowledge Architecture & Tool Boundaries"
date: 2026-04-11
last_updated: 2026-04-11
status: complete
scope: cross-ecosystem
companion_docs:
  - .prism/shared/docs/code-intel/2026-04-11-memory-and-context-research.md
  - C:/Users/digit/Developer/llm-knowledbase/.prism/shared/research/karpathy-llm-wiki-ecosystem-mapping.md
  - C:/Users/digit/Developer/SkillsForge/griotwave/.prism/shared/research/2026-04-10-refractive-design-system.md
  - C:/Users/digit/Developer/valence-context-platform/.prism/shared/research/2026-03-10-platform-deep-dive.md
  - C:/Users/digit/Developer/SkillsForge/cl-context-unifier/docs/superpowers/specs/2026-04-03-context-unifier-design.md
---

# Griot Creative Ecosystem — Knowledge Architecture & Tool Boundaries

## Research Questions

1. **Valence vs Context-Unifier** — What does each actually do? Where do their scopes overlap, where do they diverge, and what is the cleanest boundary between them?
2. **Shared ideology** — How do Synaptiq, the Karpathy LLM Wiki research, HASH.ai's refractive design system, and the recent memory/context research (code-intelligence videos + 8 tools) all converge on a single underlying thesis?
3. **Ecosystem map** — Where do each of the Griot tools fit within that thesis, and which roles are occupied vs vacant?

## Summary

Valence is a **read-path observability platform** that parses agent session logs into a queryable graph (Neo4j + ClickHouse + Postgres) with 35+ tRPC routers covering traces, cost, cross-agent correlation, and orchestration across git worktrees. Context-Unifier is a **write-path knowledge consolidation tool** that extracts scattered project knowledge from Claude memory files, session JSONL, Claude.ai projects, and codebase docs, merges them with newest-wins conflict resolution, and syncs consolidated markdown back into every AI environment (Cursor, Claude Project KB, etc.). They overlap only in the "Inspector" stream of Context-Unifier, which re-implements a small slice of Valence's trace analytics. The research across Karpathy's LLM wiki pattern, HASH.ai's "design is epistemology" thesis, the refractive design system, Synaptiq's agentic knowledge graph, and the 7-video + 8-tool memory research all converge on the same ideology: **agent-native, layered, selective-retrieval knowledge infrastructure where each tool occupies a discrete stage in a Capture → Store → Structure → Use → Observe pipeline, with the "refraction metaphor" (glass bending light to reveal structure beneath) literally embodying the information architecture**.

---

## 1. Valence — Deep Map

**Location**: `C:\Users\digit\Developer\valence-context-platform\`
**Tagline**: AI Agent Observability & Orchestration Platform
**Current state**: v2 active codebase (Superset fork) + v1 archived (`agentlens/`, Langfuse fork). All implementation phases A–F marked **Done** in README timeline.

### Architecture

Monorepo with three generations of code:
- **v2 active** (`valence/`) — Electron flagship built on a Superset fork, Bun runtime, Turborepo, Biome
- **v1 archived** (`agentlens/` + `agentlens-electron/`) — Langfuse fork with Next.js 15 + tRPC + BullMQ + Prisma + Redis + ClickHouse; the Electron shell was explicitly described as "a passive viewer, not an active participant" in `SUPERSET-FORK-PLAN.md:8-12`
- **Reference material** (`.prism/shared/ref/`) — 10 cloned repos: Superset, claude-devtools, Composio, Aperant, Optio, Hermes, HolyClaude, hooks-observability, context-graph-demo, parallel-code

### v2 Apps + Packages

| Path | Purpose |
|---|---|
| `valence/apps/desktop/` | Electron flagship |
| `valence/apps/api/` | Lightweight HTTP backend |
| `valence/apps/streams/` | AI chat backend for trace analysis |
| `valence/apps/mobile/` | Expo mobile dashboard |
| `valence/apps/web/` | Browser client |
| `valence/apps/docs/` | Documentation site |
| `valence/packages/observability/` | Session parsing + analysis engine (ported from claude-devtools) |
| `valence/packages/adapters/` | Universal agent adapter layer (Composio pattern) |
| `valence/packages/db/` | Drizzle ORM (Postgres) + Neo4j + ClickHouse clients |
| `valence/packages/local-db/` | SQLite local-first data |
| `valence/packages/ui/` | Shared shadcn/ui + Tailwind components |
| `valence/packages/auth/`, `chat/`, `desktop-mcp/`, `host-service/`, `macos-process-metrics/`, `mcp/`, `pane-layout/`, `shared/`, `trpc/`, `workspace-client/`, `workspace-fs/` | Supporting infrastructure |

### Core Data Model

**Observability domain** ([`valence/packages/observability/src/types/domain.ts:52-65`](C:/Users/digit/Developer/valence-context-platform/valence/packages/observability/src/types/domain.ts)): `Project` represents `~/.claude/projects/<encoded-dir>/`, with `id`, `path`, `name`, `sessions: string[]`, `createdAt`, `mostRecentSession`.

**Message classification** (same file, `:26-43`): `MessageType`: user | assistant | system | summary | file-history-snapshot | queue-operation. `MessageCategory`: user | system | hardNoise | ai | compact.

**PostgreSQL relational model** ([`valence/packages/db/src/schema/schema.ts`](C:/Users/digit/Developer/valence-context-platform/valence/packages/db/src/schema/schema.ts)): 25+ tables including `taskStatuses`, `tasks`, `integrationConnections`, `subscriptions`, `devicePresence`, `agentCommands`, `projects`, `v2Projects`, `v2Devices`, `v2Workspaces`, `secrets`, `chatSessions`, `sessionHosts`, etc.

**Neo4j graph** ([`valence/packages/db/src/neo4j.ts:1-43`](C:/Users/digit/Developer/valence-context-platform/valence/packages/db/src/neo4j.ts)): Stores the "context graph" — sessions, repos, tools, agents, and community-analysis structure. Default `bolt://localhost:7687`, user `neo4j`, password `valence`.

**ClickHouse** ([`valence/packages/db/src/clickhouse.ts:1-34`](C:/Users/digit/Developer/valence-context-platform/valence/packages/db/src/clickhouse.ts)): Default `http://localhost:8123`. Used for high-volume trace analytics.

### Observability Engine Detail (`valence/packages/observability/src/`)

- **`parsing/`** — `SessionParser.ts`, `ClaudeMdReader.ts`, `AgentConfigReader.ts`, `MessageClassifier.ts`, `GitIdentityResolver.ts`
- **`analysis/`** — `ChunkBuilder.ts`, `ChunkFactory.ts`, `SubagentDetailBuilder.ts`, `ToolExecutionBuilder.ts`, `ToolResultExtractor.ts`, `ToolSummaryFormatter.ts`, `ConversationGroupBuilder.ts`, `SemanticStepExtractor.ts`, `SemanticStepGrouper.ts`, `ProcessLinker.ts`
- **`discovery/`** — `ProjectScanner`, `ProjectPathResolver`, `SessionSearcher`, `SearchTextCache`, `SearchTextExtractor`, `SessionContentFilter`, `SubagentLocator`, `SubagentResolver`, `SubprojectRegistry`, `WorktreeGrouper`
- **`security/`** — `bash-validator.ts`, `command-parser.ts`, `denylist.ts`, `path-containment.ts`, `secret-scanner.ts`, `tool-input-validator.ts`
- **`export/`** — trajectory exporter, ShareGPT JSONL for RL training
- **`notifications/`, `error/`, `infrastructure/`, `constants/`, `utils/`, `types/`**

### Adapter Layer (Composio pattern)

Two abstract base classes:

- **`BaseIngestionAdapter`** ([`valence/packages/adapters/src/base/BaseIngestionAdapter.ts:11-59`](C:/Users/digit/Developer/valence-context-platform/valence/packages/adapters/src/base/BaseIngestionAdapter.ts)) — passive, post-hoc. Abstract `discover()`, `parse()`, optional `watch()` / `stop()`, `healthCheck()`.
- **`BaseInterceptAdapter`** ([`valence/packages/adapters/src/base/BaseInterceptAdapter.ts:13-54`](C:/Users/digit/Developer/valence-context-platform/valence/packages/adapters/src/base/BaseInterceptAdapter.ts)) — active, real-time. Abstract `onEvent()`, `startListening()`, `stopListening()`, optional `registerHooks()`.

Production adapters: `ClaudeCodeLogAdapter` + `ClaudeCodeHookAdapter` (12-hook real-time set ported from disler/claude-code-hooks-multi-agent-observability). Stub adapters: Codex OTel, Cursor logs.

### tRPC Router Surface

35 routers registered in [`valence/apps/desktop/src/lib/trpc/routers/index.ts:43-85`](C:/Users/digit/Developer/valence-context-platform/valence/apps/desktop/src/lib/trpc/routers/index.ts):

- **Inherited from Superset (~25)**: analytics, auth, autoUpdate, browser, browserHistory, cache, changes, chatRuntimeService, chatService, config, external, filesystem, hostServiceManager, hotkeys, modelProviders, notifications, permissions, ports, projects, resourceMetrics, ringtone, settings, terminal, uiState, window, workspaces, menu
- **Observability**: traces, contextGraph, liveDashboard, costAnalytics, crossAgent, export, scheduledReports
- **Agent Management**: adapters, mcpObservatory, evals, prompts, workflows

### What Valence Orchestrates

From [`valence/README.md:31-36`](C:/Users/digit/Developer/valence-context-platform/valence/README.md):
- Multiple coding agents running simultaneously across isolated git worktrees (inherited from Superset)
- Real-time event streams + notifications for all agents
- Built-in diff viewer for reviewing changes
- Kanban and swim-lane views for task progress
- One-click handoff to editor or terminal

Supported agents: Claude Code (full observability), Codex CLI (orchestration + stub OTel adapter), Cursor Agent (orchestration + stub log adapter), Gemini CLI, GitHub Copilot, "any CLI agent."

### Privacy Posture

[`valence/README.md:303-307`](C:/Users/digit/Developer/valence-context-platform/valence/README.md): "Local-first. Your data stays on your machine. Neo4j, ClickHouse, and SQLite all run locally." Source-available under Elastic License 2.0.

---

## 2. Context-Unifier — Deep Map

**Location**: `C:\Users\digit\Developer\SkillsForge\cl-context-unifier\`
**Tagline**: Multi-surface knowledge consolidation across AI coding environments
**Current state**: Design spec complete, working slice of Porter MCP server + Channel Adapter + Claude plugin + three host apps (Electron, VS Code, Go TUI)

### Architecture

Split into **two streams** connected by a transport-agnostic event bus:

- **Porter** (write-path) — extract, consolidate, diff, sync
- **Inspector** (read-path) — parse, index, search, analyze

### Project Structure

```
cl-context-unifier/
├── docs/superpowers/specs/2026-04-03-context-unifier-design.md  (508-line master spec)
├── docs/superpowers/plans/                                        (Phase 1-7 + Fragment 1-6)
├── plugins/context-unifier/                                       (Claude Code plugin)
│   ├── skills/{context-extract, context-sync, context-diff, context-status, context-inspect}/
│   ├── agents/{porter-agent.md, inspector-agent.md}
│   └── hooks/hooks.json (SessionStart/Stop/PreCompact/PostCompact)
├── servers/
│   ├── porter-engine/server.py      (Python FastMCP)
│   └── channel-adapter/src/index.ts  (TypeScript MCP, claude/channel)
└── porter/                           (sub-monorepo, npm workspaces)
    ├── packages/core/                (@porter/core: bus, controller, types)
    ├── packages/ui/                  (@porter/ui: React, gRPC-over-postMessage)
    ├── apps/electron/                (Claude Agent SDK chat host)
    ├── apps/vscode/                  (esbuild + webview-ui + webview-panel)
    ├── apps/tui/                     (Go Bubble Tea + Cobra)
    └── plugin-glue/                  (wiring shims for each host)
```

### Porter MCP Server — Tools ([`servers/porter-engine/server.py`](C:/Users/digit/Developer/SkillsForge/cl-context-unifier/servers/porter-engine/server.py))

| Tool | Line | Behavior |
|---|---|---|
| `extract(project_path, source="all")` | `:27` | Globs `~/.claude/projects/*<name>*/memory/*.md` + `CLAUDE.md` + `README.md` + `docs/**/*.md`. Captures first 500 chars per entry. Writes raw to `${UNIFIER_DATA}/last_extraction.json`. |
| `consolidate(project_path)` | `:82` | Reads `last_extraction.json`, flattens entries, writes `<project>/context/consolidated.md` with provenance headers. |
| `diff(project_path)` | `:122` | Lists `<project>/context/*.md` with line counts and mtime. |
| `sync(project_path, target="all")` | `:145` | `cursorrules`: concatenates all context files into `<project>/.cursorrules`. `claude-project`: copies non-`raw*` files into `<project>/context/kb_package/`. |
| `status(project_path)` | `:190` | Marks files as `fresh` (<3 days) or `stale` based on mtime. |

`DATA_DIR` defaults to `~/.unifier` ([`server.py:23`](C:/Users/digit/Developer/SkillsForge/cl-context-unifier/servers/porter-engine/server.py)). Stale threshold: 3 days.

### Channel Adapter

MCP server `context-unifier-channel` declaring experimental capabilities `claude/channel` and `claude/channel/permission` ([`servers/channel-adapter/src/index.ts:18-22`](C:/Users/digit/Developer/SkillsForge/cl-context-unifier/servers/channel-adapter/src/index.ts)).

Exposes `push_insight` with categories: **architecture | decision | preference | tool | cross-project**. Appends `session.insight` events to `${UNIFIER_DATA}/events.jsonl`. Exports `pushChannelNotification(eventType, summary, meta)` for `notifications/claude/channel` messages.

Helper functions in `channel.ts`:
- `pushContextUpdate` — event_type `porter.consolidation.complete`
- `pushDriftWarning` — `inspector.drift.detected`

### Claude Plugin Agents

- **`porter-agent`** ([`plugins/context-unifier/agents/porter-agent.md:5-7`](C:/Users/digit/Developer/SkillsForge/cl-context-unifier/plugins/context-unifier/agents/porter-agent.md)): model **opus**, `maxTurns: 12`, `disallowedTools: Write, Edit`. Runs extract→consolidate→sync pipeline. Critical rules: **newest wins on contradictions, preserve rationale, ≤100 lines per file, absolute dates, maintain provenance**.
- **`inspector-agent`**: read-only analytics, model **haiku**

### Shared Core ([`porter/packages/core/src/`](C:/Users/digit/Developer/SkillsForge/cl-context-unifier/porter/packages/core/src/))

- **EventBus** (`bus/event-bus.ts`) — typed handlers via `Map<string, Set<EventHandler>>`, synchronous dispatch, returns unsubscribe function
- **BaseController** (`controller/BaseController.ts`) — abstract class extending EventEmitter. Subclasses implement `getWorkspaceRoot()`. gRPC handlers registered for `StateService`, `ChatService`, `TimelineService`
- **AppState shape** (`shared/state.ts`, `shared/types.ts`):
  ```ts
  AppState = {
    projectName, version,
    models: { claude, codex, gemini → ModelConnection },
    chat: { activeModel, viewMode: 'focused'|'unified', messages: per-model arrays },
    timeline: { filter: 'all'|model, entries: ToolCall[] }
  }
  ```

### Key Architectural Decisions

From [`docs/superpowers/specs/2026-04-03-context-unifier-design.md`](C:/Users/digit/Developer/SkillsForge/cl-context-unifier/docs/superpowers/specs/2026-04-03-context-unifier-design.md):

- Transport-agnostic event bus (not Claude Channels as backbone) — `:489-490`
- Porter/Inspector split (write-path vs read-path) — `:491`
- Hybrid stack: Python Porter, TS UI/channel, Go TUI — `:492`
- Opus for porter-agent (consolidation needs nuance), Haiku for inspector — `:493`
- Electron as first-class citizen alongside VS Code — `:494`
- Prism-style architecture: gRPC-over-postMessage, BaseController, raw TS imports — `:495`
- Three automation levels: manual / approval / full-auto, per-project — `:496`
- Newest-wins contradiction resolution + provenance tracking
- `events.jsonl` append-only, 30-day retention, replay on adapter reconnect — `:213`
- Cross-session broadcast via channel adapter when one session pushes via reply tool — `:241`

---

## 2b. Brand Ecosystem Hub — Supporting Tool Map

**Location**: `C:\Users\digit\Developer\SkillsForge\brand-pitch-generator\brand-ecosystem-hub\`
**Tagline**: Agentic brand identity generation across the Griot ecosystem
**Current state**: v0.0.1, early-dev. Working multi-surface scaffold with seed brand profiles for every active Griot product.

### Architecture

A Fragment-scaffolded monorepo with the same `packages/core` + `packages/ui` + `apps/{electron, vscode, tui}` shape as Context-Unifier's `porter/`:

```
brand-ecosystem-hub/
├── packages/
│   ├── core/src/        (bus, controller, shared — the BaseController pattern)
│   └── ui/              (shared React components)
├── apps/
│   ├── electron/        (Electron Forge + Vite flagship, better-sqlite3 persistence)
│   ├── vscode/          (VS Code extension)
│   └── tui/             (Bubble Tea TUI)
└── data/
    └── seed/
        ├── fragment.brand-profile.yaml
        ├── lucid.brand-profile.yaml
        ├── prism.brand-profile.yaml
        ├── skillforge.brand-profile.yaml
        ├── sonar.brand-profile.yaml
        ├── synaptiq.brand-profile.yaml
        └── valence.brand-profile.yaml
```

### Brand profile data model

Each seed YAML carries the same schema (seen in `prism.brand-profile.yaml`):

```yaml
product:
  name: Prism
  description: "AI development orchestration platform"
name_origin:
  field: "Optics"
  meaning: "Structured light decomposition — revealing hidden spectra through precision"
visual:
  colors:
    primary: "#7C5CFC"
    secondary: "#2DD4BF"
    dark_bg: "#0A0A0F"
  typography:
    primary: "Inter"
voice:
  tone: "Precise, authoritative, structured"
```

Seven brand profiles ship in the seed — one per currently-tracked Griot product (Prism, Valence, Fragment, Lucid, Sonar, Synaptiq, SkillForge).

### Electron App Surface

From [`apps/electron/src/services/`](C:/Users/digit/Developer/SkillsForge/brand-pitch-generator/brand-ecosystem-hub/apps/electron/src/services/):

- `ai.ts` — Claude/AI integration for naming, voice, visual suggestions
- `batch.ts` — batch generation of brand concepts
- `nameSuggestion.ts` + `naming-analysis.ts` — name generation with semantic analysis
- `creativeDirections.ts` — creative direction exploration
- `ecosystem-context.ts` + `ecosystemConstraints.ts` — cross-product constraint resolution (so two Griot products don't collide on color, voice, or metaphor)
- `color-utils.ts` — color palette derivation
- `lucidHandoff.ts` — **explicit handoff pipeline to Lucid** for asset generation once a brand is finalized
- `promptTemplate.ts` — template library for brand exploration prompts
- `yaml.ts` + `seed.ts` — YAML profile read/write + seeding
- `exporters/` — brand profile export pipelines
- `db.ts` — better-sqlite3 local persistence

**Component directories** ([`apps/electron/src/components/`](C:/Users/digit/Developer/SkillsForge/brand-pitch-generator/brand-ecosystem-hub/apps/electron/src/components/)): `ai-chat`, `batch`, `brand`, `brand-page`, `command-palette`, `compare`, `generation`, `graph`, `grid`, `layout`, `workspace`. A graph view suggests the hub visualizes brand relationships across the ecosystem — not just manages them individually.

### Technology Stack

- **Shell**: Electron Forge + Vite, TailwindCSS v4, React 19, Testing Library + Vitest
- **Persistence**: better-sqlite3 (native — hence the `rebuild:electron` / `rebuild:node` scripts in `apps/electron/package.json`)
- **Shared core pattern**: Matches Context-Unifier's `@porter/core` and the Fragment template — BaseController, event bus, gRPC-over-postMessage
- **Monorepo**: npm workspaces with `packages/*`, `apps/electron`, `apps/vscode` (tui added later)
- **Architecture lineage**: Fragment-scaffolded, which means it shares plumbing with Context-Unifier and any other future Fragment-based multi-surface tool

### Role in the Ecosystem

Brand Ecosystem Hub is distinct from Griotwave:

- **Griotwave** is *the design language* — refractive glass, ember bloom, beacon channel, the v0.3 visual vocabulary. It tells you what the aesthetic rules are.
- **Brand Ecosystem Hub** is *the identity generator* — name origins, color palettes, voice tones, cross-product constraints. It tells you what each individual product's brand expression is within the language.

The `lucidHandoff.ts` service makes the downstream flow explicit: once a brand concept is finalized in the hub, it hands off to **Lucid** for asset generation (Remotion videos, 3D renders, slide decks). This is the first explicit cross-tool pipeline in the Griot ecosystem that the research has surfaced — most other cross-tool flows are still conceptual.

### Where it sits in the Knowledge Pipeline

Brand Ecosystem Hub does not occupy a Capture/Store/Structure/Use/Observe stage — it is **support infrastructure** that produces artifacts consumed by other stages:

- Every product's visual language (from Hub) feeds **Griotwave** (which defines how those colors and typefaces render as glass and bloom)
- Every product's naming lineage (from Hub) feeds **Prism** research docs and every tool's README
- Every finalized brand package (from Hub) feeds **Lucid** via `lucidHandoff.ts` for asset production

It is the *source of truth for identity*, the way Prism is the source of truth for development workflow structure.

---

## 3. Valence vs Context-Unifier — Boundary Analysis

### Direction of Data Flow

```
            ┌─────────────────────────────────┐
            │   AI Environments (sources)     │
            │   Claude Code, Cursor, Codex,   │
            │   Gemini, Claude.ai Projects    │
            └────┬───────────────────────┬────┘
                 │                       │
     ┌───────────┴───┐           ┌───────┴────────────┐
     │   VALENCE     │           │  CONTEXT-UNIFIER   │
     │               │           │                    │
     │   READ-PATH   │           │    WRITE-PATH      │
     │   (observe)   │           │    (distribute)    │
     │               │           │                    │
     │   Sessions    │           │   Consolidated     │
     │   ↓ parse     │           │   markdown         │
     │   Traces      │           │   ↑ merge          │
     │   ↓ index     │           │   Extracted        │
     │   Graph DB    │           │   entries          │
     │   ↓ query     │           │   ↑ extract        │
     │   Dashboards  │           │   Raw sources      │
     └───────────────┘           └────────────────────┘
          ▲                                 │
          │                                 ▼
       User views                    AI Environments
       historical                    (.cursorrules,
       agent behavior                 Claude Project KB,
                                      CLAUDE.md, docs/)
```

### Comparison Matrix

| Dimension | Valence | Context-Unifier |
|---|---|---|
| **Primary direction** | Read-path dominant (observe → analyze) | Write-path dominant (extract → merge → distribute) |
| **Output target** | PostgreSQL / Neo4j / ClickHouse / dashboards | Filesystem markdown + `.cursorrules` + Claude Project KB |
| **Storage** | Database-backed (Drizzle + Neo4j + ClickHouse) | Filesystem as single source of truth + `events.jsonl` append log |
| **Temporal focus** | Backward: what did agents do? | Forward: what should agents know? |
| **Parser stream** | `@valence/observability` — heavyweight multi-phase (parse, analyze, discover, security) | Simple glob + first-500-char extraction in FastMCP |
| **Adapter pattern** | `BaseIngestionAdapter` + `BaseInterceptAdapter` (Composio pattern) | Push (Claude channel) + poll (future Codex/Gemini) |
| **Host shells** | Electron (Superset fork), tRPC backend, Expo mobile, web client, docs site | Electron (Forge+Vite), VS Code extension, Go Bubble Tea TUI |
| **Real-time layer** | tRPC subscriptions / WebSocket (v1 Langfuse-style) | `claude/channel` MCP capability + `events.jsonl` replay |
| **State model** | Postgres relational + Neo4j graph + ClickHouse trace analytics | In-memory `AppState` + append-only event log |
| **Router surface** | 35+ tRPC routers | 5 MCP tools (extract/consolidate/diff/sync/status) + 1 channel tool (push_insight) |
| **License** | Elastic License 2.0 (from Superset fork) | Not specified in spec |
| **Scale posture** | Platform — observability for a team's worth of agent activity | Personal — knowledge consolidation across one developer's tools |

### Where They Overlap

Both projects touch session JSONL parsing. Both define adapter interfaces for multi-AI ingestion. Both ship Electron as a first-class surface. The overlap is concentrated in Context-Unifier's **Inspector** stream (not yet built) which replicates a thin slice of Valence's trace analytics — token usage, cost per model, session search, drift detection.

Six specific overlap markers:

1. **Session JSONL parsing** — both ingest `~/.claude/projects/*/*.jsonl`. Unifier uses it for context extraction ([`server.py:48`](C:/Users/digit/Developer/SkillsForge/cl-context-unifier/servers/porter-engine/server.py)); Valence uses it via `@valence/observability` session parsing.
2. **Inspector stream** in Unifier spec ([`:162-202`](C:/Users/digit/Developer/SkillsForge/cl-context-unifier/docs/superpowers/specs/2026-04-03-context-unifier-design.md)) overlaps with Valence's trace analytics.
3. **Adapter pattern** — both define multi-AI environment ingestion interfaces.
4. **Electron shell as flagship** — both call out Electron as first-class.
5. **Reference materials** — Unifier's `.prism/shared/ref/Claude-Code-History-VSCode/` is the same kind of session-history analytics tool that informs Valence's observability.
6. **Cross-project linking** — Unifier's `cross-project.md` concept overlaps with Valence's Neo4j cross-agent graph.

### Where They Diverge (The Cleanest Boundary)

**Valence is the mirror; Context-Unifier is the memo pad.**

- **Valence observes what happened** — every session, every tool call, every cost dollar, every cross-agent correlation. It is authoritative for *history*. Its data model is a graph of behavior.
- **Context-Unifier prepares what should happen next** — distilled architecture decisions, preferences, cross-project conventions, tool mentions. It is authoritative for *intent*. Its data model is a library of facts.

A concrete test: if a developer wants to answer "what did my agents spend last week?" — Valence. If they want to answer "what are my conventions for error handling in this codebase?" — Context-Unifier.

### Should They Be Combined?

This document is strictly descriptive — it documents what exists and what each tool's boundary is. The determination of whether to combine, keep separate, or reshape scope is a user decision. What this research makes explicit is:

1. The write-path and read-path scopes are genuinely distinct — they answer different questions about different time directions.
2. The Inspector stream of Context-Unifier is the smallest overlap, and is currently unimplemented in Unifier but fully built in Valence.
3. Both share identical plumbing for session JSONL ingestion and Electron shell packaging.
4. Context-Unifier's "newest wins + provenance + ≤100 lines per file" doctrine is a policy layer that Valence's raw observability store does not have.
5. Valence's Neo4j graph + ClickHouse analytics + tRPC router surface is orders of magnitude larger than Unifier's MCP tool count.

These are the facts. Any merge or boundary decision rests on whether a single product can serve both temporal directions without compromising clarity.

---

## 4. The Shared Ideology — Convergence Across All Research

Across six independent research streams, a single thesis repeats. Each stream approaches it from a different angle, but the underlying shape is identical.

### Stream 1 — Karpathy's LLM Wiki Pattern

Karpathy's three-layer architecture ([`karpathy-llm-wiki-ecosystem-mapping.md`](C:/Users/digit/Developer/llm-knowledbase/.prism/shared/research/karpathy-llm-wiki-ecosystem-mapping.md)):

- **Layer 1** — Rules (`CLAUDE.md`)
- **Layer 2** — Wiki (flat markdown knowledge base, Obsidian-style)
- **Layer 3** — Idea files (ephemeral task context)

Plus the **Lint Cycle**: agents flag outdated/contradictory/missing wiki pages after each task. The thesis: direct file reads with good structure outperform RAG at personal scale; pages are concise, factual, linkable, not verbose.

### Stream 2 — The Code-Intelligence Research (7 videos + 8 tools)

Nine cross-video signals, now published in [`memory-and-context-research.md`](./.prism/shared/docs/code-intel/2026-04-11-memory-and-context-research.md):

1. Index once, query cheap (~70x token reduction)
2. Selective retrieval beats cumulative context (Kimi attention-residuals)
3. Graph-derived skills and wikis (GitNexus `--skills` pattern)
4. Architecture as memory scaffold (OpenClaw)
5. LLM wiki vs vector RAG (scale breakpoint)
6. Shared memory between agents (Byterover)
7. Attention residual blocks
8. Dataview-style frontmatter dashboards
9. CLAUDE.md as the integration seam

### Stream 3 — HASH.ai and the Refractive Design System

From [`2026-04-10-refractive-design-system.md`](C:/Users/digit/Developer/SkillsForge/griotwave/.prism/shared/research/2026-04-10-refractive-design-system.md):

HASH explicitly frames **design as epistemology, not aesthetics**. Their ecosystem chains:

- **Block Protocol (Þ)** — composable data blocks, typed entities, universal URL addressability
- **HASH.ai** — self-building AI-native knowledge graph with "embeddings propose, graphs decide" — vectors flow through auditable graph validation before becoming durable relationships
- **Intent / UI-IR System** — compiler architecture for UI designed to support AI-generated interfaces
- **Avatar components for agents** — agents as first-class participatory actors in the interface
- **hEngine** — Rust-based distributed simulation engine for millions of agents
- **ARIA Safeguarded AI** — formally verifiable agent behavior, high-trust human-agent collaboration

The **refractive design system** is the terminal output layer of this pipeline. Glass surfaces + SVG `backdrop-filter` + mathematically computed displacement maps (Snell's Law) = structured information layered and visible through translucency. The aesthetic *literally embodies* the information architecture.

### Stream 4 — Synaptiq (the Agentic Knowledge Graph Evolution)

Synaptiq's differentiation from Obsidian ([`karpathy-llm-wiki-ecosystem-mapping.md:96-111`](C:/Users/digit/Developer/llm-knowledbase/.prism/shared/research/karpathy-llm-wiki-ecosystem-mapping.md)):

- **Manual cross-linking** → File references with typed relationships
- **Graph view (read-only)** → Interactive node graph (read-write, drag, group)
- **Passive storage** → Agentic (nodes trigger workflows, update themselves)
- **List view + node view** — switchable modes for focused lookup vs exploratory thinking

Synaptiq nodes are not just pages — they are live references an agent reads during work, visual anchors showing concept relationships, and trigger points for downstream actions. This is Karpathy's wiki made **agent-native and participatory**.

Current implementation: `synaptiq-ai-electron` in `C:/Users/digit/Developer/Milanote-AI/synaptiq-ai-electron/` — Electron 40 + React 19 + Claude Agent SDK + Python (pyautogui/pywin32) for Milanote GUI automation. v2 design research underway; focus on canvas-native UI and real-time Milanote sync protocol.

### Stream 5 — Atomic (kenforthewin/atomic) as a Synaptiq Reference Implementation

From the non-video research:

- **`atomic-core`** — Rust, transport-agnostic, all business logic in one library
- **Storage** — single SQLite file with `sqlite-vec` + FTS5
- **Search** — hybrid BM25 + vector + Reciprocal Rank Fusion
- **Clients** — `atomic-server` (78 REST routes, WebSocket, embedded MCP, OAuth 2.0 + PKCE), Tauri v2 desktop, native SwiftUI iOS, React web UI, browser extension

Atomic is the reference architecture for what Synaptiq is described as: agentic note-taking with visual nodes and knowledge-graph structure.

### Stream 6 — The Prism Code Intelligence Integration Spec

From [`prism-code-intelligence-integration.md`](./.prism/shared/docs/code-intel/prism-code-intelligence-integration.md):

- `codebase-memory-mcp` as the knowledge graph layer for Prism's research → plan → implement → validate workflow
- Every phase pulls structural context from the graph, then filters
- Plans include auto-generated "Structural Impact" sections with blast radius
- Stories are decomposed in dependency order (callees before callers)
- Validation adds dead-code and cross-service contract checks

Prism's `.prism/shared/` directory structure **already implements** Karpathy's three-layer architecture:
- Layer 1 (rules) → `CLAUDE.md`
- Layer 2 (wiki) → `.prism/shared/research/` + `.prism/shared/docs/`
- Layer 3 (ideas) → `.prism/shared/plans/` + `.prism/stories/`

Plus a fourth layer Karpathy doesn't address: **Handoffs** (`.prism/shared/handoffs/`) for context transfer between sessions.

### The Unifying Thesis

All six streams converge on this shape:

```
                    AGENT-NATIVE KNOWLEDGE INFRASTRUCTURE
                    
    ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
    │ CAPTURE │ ───► │  STORE  │ ───► │STRUCTURE│ ───► │   USE   │ ───► │ OBSERVE │
    └────┬────┘      └────┬────┘      └────┬────┘      └────┬────┘      └────┬────┘
         │                │                │                │                │
         │                │                │                │                │
    Raw knowledge    Graph of typed   Phase-aware      Selective        Behavioral
    (multi-modal)    relationships    project context  retrieval        telemetry
                     +  wiki pages    (.prism/)        per phase
                                                       
    Oracle           Synaptiq          Prism            Prism            Valence
    Sonar            HASH.ai          (.prism/        (phase agents,
    Context-         Atomic           shared/)         CLAUDE.md,
    Unifier                                            per-phase
                                                       manifests)
```

Each stage has **one or more Griot tools occupying it**. No stage is empty. And — critically — each tool treats agents as first-class participants, not as post-hoc observers of human work.

### The Five Invariants Across All Streams

No matter which research stream you start from, these five invariants appear:

1. **Knowledge is layered, not flat.** Rules → Wiki → Ideas → Telemetry. Each layer has a different cadence, a different read/write pattern, and a different retrieval strategy.

2. **Selective retrieval beats cumulative context.** Cumulative context is linear — memory grows with every phase. Selective retrieval is branching — each phase pulls only the slice it needs. Kimi's attention-residual block design, Prism's per-phase agents, and Context-Unifier's `newest wins + ≤100 lines` doctrine are the same rule at different scales.

3. **Agents are participants, not observers.** Every tool in the ecosystem exposes a surface for agent interaction — MCP tools (Context-Unifier, GitNexus), channel notifications (Unifier's claude/channel), graph queries (codebase-memory-mcp), event bus (Valence hooks), avatar components (HASH). Design systems include agent avatars as first-class entities.

4. **Design is epistemology.** HASH's refractive glass, griotwave's refraction/bloom/beacon language, Synaptiq's visual node graph, Prism's CLI Bubble Tea dashboard — the *aesthetic* carries the *information structure*. You see **through** layers because the knowledge **is** layered. Glass is not decoration; it's the diagram.

5. **Local-first + agent-native + graph-aware.** Every production-grade tool in the research surfaces all three: local data (Atomic's single SQLite, Valence's "your data stays on your machine", Unifier's filesystem source-of-truth, codebase-memory-mcp's `~/.cache/`), agent-native APIs (MCP everywhere), graph models (Neo4j, Leiden/Louvain communities, typed entity graphs).

---

## 5. Griot Ecosystem Map — Role Coverage

Mapping each tool in the Griot ecosystem onto the five-stage pipeline, with role coverage status:

| Stage | Stage Description | Tool(s) | Role Coverage |
|---|---|---|---|
| **CAPTURE** | Multi-modal ingestion from live sources | **Oracle** (video/MP4 → structured), **Sonar** (live audio → transcripts), **Context-Unifier Porter** (AI-environment extraction) | Strong — three angles |
| **STORE** | Durable, typed, graph-aware knowledge | **Synaptiq** (agentic node graph, in development), **Atomic** (reference impl available) | Active development |
| **STRUCTURE** | Phase-aware project context | **Prism** (`.prism/shared/`, 4-phase workflow, skills/commands/agents) | Mature |
| **USE** | Selective retrieval + agent consumption | **Prism** (phase agents, CLAUDE.md, per-phase manifests), **codebase-memory-mcp** (graph queries) | Mature; growing |
| **OBSERVE** | Behavioral telemetry + feedback loop | **Valence** (full observability platform), Prism hooks (narrow) | Strong — Valence is the flagship |
| *Support* | Scaffolding | **Fragment** (multi-surface project scaffolding, npm workspaces, Electron/VS Code/TUI) | Mature |
| *Support* | Asset creation | **Lucid** (Remotion video + 3D asset pipeline) | Active |
| *Support* | Skill/plugin management | **SkillForge** (concept — monorepo housing griotwave + context-unifier research + cl-plugin-structure) | Concept |
| *Support* | Design language | **Griotwave** (visual language v0.3 + griotwave-vite-ts component library) | Research complete |
| *Support* | Brand identity system | **Brand Ecosystem Hub** (multi-surface Electron + VS Code + TUI monorepo; seeds brand profiles for every Griot product) | Early dev (v0.0.1) |
| *Support* | Ecosystem command center | **Griot Hub** (early Electron monorepo, v0.0.1, Red Desktop Protocol v1) | Early stage |
| *Utility* | Quick assist | **Quiz Assistant** (Electron floater, screen region analysis via Claude Max) | Stable v1.0 |

### Where Valence and Context-Unifier Sit

- **Valence** owns the **OBSERVE** stage outright. No other tool competes.
- **Context-Unifier** spans **CAPTURE** (via Porter extract) + **STRUCTURE** (via consolidated markdown output) + a thin slice of **USE** (via `claude/channel` notifications for real-time context injection).
- Context-Unifier's unbuilt **Inspector** stream reaches into **OBSERVE** territory — this is the only genuine overlap with Valence.

### Complete Ecosystem Diagram

```
                                    GRIOT CREATIVE ECOSYSTEM
                                    
                              ┌──────────────────────────────┐
                              │        GRIOT HUB             │
                              │   Ecosystem command center   │
                              │   (early stage)              │
                              └──────────────┬───────────────┘
                                             │
        ┌────────────────────────────────────┼────────────────────────────────────┐
        │                                    │                                    │
        ▼                                    ▼                                    ▼
  ┌──────────┐                        ┌──────────┐                        ┌──────────┐
  │ CAPTURE  │                        │  STORE   │                        │ OBSERVE  │
  │          │                        │          │                        │          │
  │ Oracle   │                        │ Synaptiq │                        │ Valence  │
  │ Sonar    │────────── knowledge ──►│ Atomic   │◄── telemetry ──────────│          │
  │ C-U      │                        │ (HASH)   │                        │          │
  │ Porter   │                        │          │                        │          │
  └──────────┘                        └────┬─────┘                        └──────────┘
                                           │
                                           ▼
                                     ┌──────────┐
                                     │STRUCTURE │
                                     │          │
                                     │  Prism   │
                                     │ (.prism/ │
                                     │  shared/)│
                                     └────┬─────┘
                                          │
                                          ▼
                                     ┌──────────┐
                                     │   USE    │
                                     │          │
                                     │  Prism   │
                                     │ agents   │
                                     │ +        │
                                     │ codebase-│
                                     │ memory-  │
                                     │   mcp    │
                                     └──────────┘
  
  SUPPORT LAYER (shared infrastructure)
  ├── Fragment — multi-surface scaffolding (Electron/VSCode/TUI)
  ├── Lucid — Remotion asset pipeline  
  ├── Griotwave — design language (refractive, ember bloom, beacon)
  ├── Brand Ecosystem Hub — brand identity generator (YAML brand profiles per product)
  ├── SkillForge — skill/plugin management (concept)
  └── Quiz Assistant — utility floater
```

---

## 6. How The Recent Research Aligns With The Full Stack

The recent memory/context research ([`2026-04-11-memory-and-context-research.md`](./.prism/shared/docs/code-intel/2026-04-11-memory-and-context-research.md)) produced nine cross-video signals and identified five GitNexus gaps for Prism. Each of these maps cleanly onto the ecosystem stages above.

### Direct Mappings

| Research finding | Ecosystem role | Occupied by |
|---|---|---|
| Index-once / query-cheap | STRUCTURE | Prism + codebase-memory-mcp |
| Selective retrieval per phase | USE | Prism phase agents |
| Graph-derived skills (GitNexus `--skills`) | STRUCTURE | Prism `scripts/prism-sync-skills.py` (gap — to be built) |
| Live-stats CLAUDE.md injection | USE | Prism (gap — to be built) |
| Hybrid BM25 + vector + RRF | STORE | Synaptiq / Atomic pattern |
| `detect_changes` behavioral gate | OBSERVE | Prism PostToolUse hook (gap) + Valence |
| `/prism-wiki` generation | STRUCTURE | Prism (gap) |
| Auto Review worktree pattern (just-every/code) | USE | Prism `/prism-subagent` (gap) |
| Cross-model review via MCP (multicli) | USE | Prism + Valence adapter layer |
| Session retrospection (code-insights) | OBSERVE | Valence natively does this |
| DeepWiki MCP | CAPTURE | Oracle augmentation (optional tool) |
| Atomic architecture | STORE | Synaptiq reference implementation |

Every finding has a home. The ecosystem is already the right shape — the gaps are tactical build items, not architectural misses.

### The Refraction Metaphor — Why Griotwave Matters

Griotwave is not just a visual language. Its design choices *literally encode* the information architecture:

- **Glass / frosted surfaces** — you see *through* layers because knowledge is layered
- **Refraction / Snell's Law displacement** — light bends as it crosses a boundary; information bends as it crosses a phase boundary (Research → Plan → Implement → Validate)
- **Ambient ember blobs** — the ambient knowledge context (other tools' outputs) that a surface depends on
- **Bloom stack** (three concentric shadows) — each tool surfaces three layers of relationship (immediate dependency, transitive impact, environmental resonance)
- **Beacon channel** — reserved for broadcast tools (Oracle, Sonar) — the only products that reach *outward* to capture
- **Ghost grid** — the substrate, the neutral background on which all knowledge is placed
- **Z-stack order** (canvas → ambient → grid → glass → overlays → content → floating) — the exact order knowledge becomes visible in a Prism session

This is what HASH.ai means by "design is epistemology, not aesthetics." The griotwave design system is the information architecture of the ecosystem rendered as pixels. Building the visual ecosystem documentation on top of it is not incidental — it is the point. The visualization uses the same metaphor as the underlying system.

---

## 7. Open Questions

These remain unresolved and are appropriate topics for follow-up research or design brainstorming:

1. **Synaptiq data model** — How does a "wiki page" become a "node"? What metadata does it carry? The Karpathy research raised this (section 6.4) and it has not yet been answered.
2. **Cross-project linking** — How does a Synaptiq node reference a specific `.prism/` research doc in a specific repo? Concretely: URL scheme, symlink, import alias, or content hash?
3. **When does Inspector get built?** — Context-Unifier's Inspector stream is planned but unimplemented. When it ships, does it replicate Valence's trace router, or does it query Valence's tRPC directly (turning Valence into a dependency)?
4. **Context-Unifier boundary decision** — Does Porter eventually absorb cross-project promotion (moving project-level insights up to Synaptiq), or does Synaptiq pull from Porter? One of these directions must win.
5. **Griot Hub's role** — Is Griot Hub the orchestrator that calls into each tool, or a dashboard that reflects their state? The Red Desktop Protocol v1 naming suggests the former; the v0.0.1 maturity leaves the answer open.
6. **Refraction as literal rendering** — Can the griotwave visual system be extended so that the *actual UI* of each tool shows information layering through real SVG refraction? HASH's `@hashintel/refractive` proves this is technically feasible.

---

## 8. Source Index

### Primary research files read
- `C:/Users/digit/Developer/llm-knowledbase/.prism/shared/research/karpathy-llm-wiki-ecosystem-mapping.md`
- `C:/Users/digit/Developer/SkillsForge/griotwave/.prism/shared/research/2026-04-10-refractive-design-system.md`
- `C:/Users/digit/Developer/prism-plugin/.prism/shared/docs/code-intel/2026-04-11-memory-and-context-research.md`
- `C:/Users/digit/Developer/prism-plugin/.prism/shared/docs/code-intel/prism-code-intelligence-integration.md`
- `C:/Users/digit/Developer/SkillsForge/cl-context-unifier/docs/superpowers/specs/2026-04-03-context-unifier-design.md`
- `C:/Users/digit/Developer/valence-context-platform/README.md`
- `C:/Users/digit/Developer/valence-context-platform/SUPERSET-FORK-PLAN.md`
- `C:/Users/digit/Developer/valence-context-platform/valence/README.md`
- `C:/Users/digit/Developer/SkillsForge/griotwave/griotwave-library/_master/griotwave-visual-language-v0.3.md`

### Key source code references
- Valence: `valence/packages/observability/src/`, `valence/packages/adapters/src/base/`, `valence/packages/db/src/`, `valence/apps/desktop/src/lib/trpc/routers/`
- Context-Unifier: `servers/porter-engine/server.py`, `servers/channel-adapter/src/index.ts`, `porter/packages/core/src/`, `plugins/context-unifier/agents/`
- Griotwave: `griotwave-vite-ts/src/styles/tokens.css`, `griotwave-vite-ts/src/components/HubCard.tsx`, `griotwave-vite-ts/src/components/Ambient.tsx`
- Synaptiq: `C:/Users/digit/Developer/Milanote-AI/synaptiq-ai-electron/src/main/`

### Companion artifact
A standalone Vite + TypeScript interactive visualization of this ecosystem has been created at `C:/Users/digit/Developer/griot-ecosystem-viz/` — using ported griotwave primitives to render the tool map, knowledge pipeline, Valence/Context-Unifier boundary, and research convergence visually.
