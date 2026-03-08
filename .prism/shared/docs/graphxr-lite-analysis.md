# GraphXR-Lite Analysis for Prism Context Visualization

**Date:** 2026-03-07  
**Context:** Prism v2.5.0 — Eval Dashboard Skill Graph, VS Code Extension, Electron Desktop App  
**Related:** Neo4j Eval Dashboard Plan (Phase 5: Graph Explorer), codebase-memory-mcp integration

---

## What is GraphXR-Lite?

GraphXR-Lite is **not** a stripped-down SDK or embeddable library. It's a collection of **Docker Compose stacks** that bundle the full GraphXR web application alongside a graph database. The repo at `Kineviz/graphxr-lite` contains three folders — `neo4j/`, `memgraph/`, `puppygraph/` — each with a `docker-compose.yml` and sample datasets. You run `docker-compose up -d` and get the full GraphXR browser interface connected to your database of choice.

The entire repo is 9 commits, ~60% Python scripts (for data loading) and ~40% shell scripts. There is **zero visualization source code** — GraphXR itself is a proprietary, closed-source web application that runs as a Docker image.

### What you get with GraphXR-Lite

- One-command Docker deployment of GraphXR + a graph database
- Pre-configured sample datasets (Movie Graph for Neo4j, Game of Thrones for Memgraph, cloud security for PuppyGraph)
- The full GraphXR browser UI at `localhost:3000` (or whichever port the stack exposes)
- Direct Cypher/Gremlin querying through the GraphXR interface

### What you do NOT get

- Any embeddable components, widgets, or React libraries
- Source code for the visualization engine
- An SDK you can import into your own application
- A JavaScript/TypeScript API you can call from a VS Code webview or Electron renderer
- License to redistribute GraphXR as part of your own product

---

## Full GraphXR vs. GraphXR-Lite

The naming is misleading. "Lite" doesn't mean fewer features — it means "quick local deployment." Both run the **same GraphXR application**. The differences are about licensing and deployment context:

| Aspect | GraphXR-Lite (Docker stacks) | GraphXR Full (SaaS / Enterprise) |
|--------|------------------------------|----------------------------------|
| **Visualization** | Same browser UI | Same browser UI |
| **Database support** | Neo4j, Memgraph, PuppyGraph | Same + Spanner Graph, enterprise connectors |
| **Grove notebooks** | Included (Observable-style JS notebooks with D3, Vega-Lite, Plotly) | Same |
| **VR/WebXR support** | Included (beta, Chrome only) | Same |
| **Graph analytics** | Path finding, centrality, community detection, degree analysis | Same + enterprise extensions |
| **Geospatial** | Timeline filtering, map overlays, coordinate plotting | Same |
| **GraphXR API** | `@kineviz/graphxr-api` — available in Grove notebooks only, not embeddable | Same |
| **Collaboration** | Local only | Shared projects, controlled access, team features |
| **Deployment** | Local Docker, no auth | On-prem, private cloud, air-gapped, SSO |
| **Enterprise extensions** | Not available | RDBMS connectors, document source connectors, custom right-click menus |
| **SightXR** | Not included | Separate product — AI-powered knowledge graph builder with Kuzu-Wasm in-browser |
| **Support/SLA** | None (community) | Enterprise support contracts |
| **Embeddable?** | No | No (it's always a standalone web app) |

**Key takeaway:** GraphXR-Lite is a deployment convenience, not a feature tier. The full product adds enterprise licensing, collaboration, and connectors — but neither version is embeddable into your own application.

---

## Why GraphXR-Lite Won't Work for Prism

Prism needs graph visualization **inside** its own UI surfaces:

1. **VS Code Extension** — React webview in a sidebar/panel (constrained WebView, no arbitrary iframe origins)
2. **Electron Desktop App** — React SPA renderer (Electron security: `contextIsolation`, CSP headers)
3. **TUI Dashboard** — Go/Bubble Tea terminal (no browser at all; the Skill Graph screen at `prism-eval` uses custom SVG)

GraphXR can't serve any of these because:

- **It's a standalone web app**, not a component library. You'd have to iframe it, which VS Code webviews explicitly block for external origins.
- **No npm package for the rendering engine.** The `@kineviz/graphxr-api` is a Grove-internal API for notebooks that run *within* GraphXR — it cannot be imported into your React app.
- **Licensing prohibits redistribution.** GraphXR is proprietary; embedding it in an open-source or distributed product would require a commercial agreement with Kineviz.
- **Docker dependency.** Requiring users to run a Docker stack just for visualization defeats Prism's "install and go" philosophy (your Tauri installer is 38 MB; adding Docker + Neo4j + GraphXR is 500+ MB).

---

## What You Should Do Instead: Build Your Own Graph Visualization Layer

Yes — use the Lite repo and the resources you've gathered as **reference material and design inspiration**, then build a custom visualization layer using web 3D technologies you already know. Here's the architecture I'd recommend:

### Recommended Stack for Prism Graph Visualization

| Layer | Technology | Why |
|-------|-----------|-----|
| **3D rendering** | React Three Fiber (R3F) + Three.js | You already have deep R3F expertise; spectral color palette maps perfectly to node/edge materials |
| **Force simulation** | `3d-force-graph` or `d3-force-3d` | GPU-accelerated force-directed layouts; works with R3F scene |
| **2D fallback** | `@react-sigma/core` (Sigma.js) or `cytoscape.js` | For the VS Code sidebar where 3D is overkill |
| **Graph database** | Neo4j (Docker, optional) | Already in your Neo4j Eval Dashboard plan; Bolt driver for TypeScript |
| **Embedded alternative** | Kuzu-Wasm | Runs entirely in-browser, zero infrastructure; SightXR uses this pattern |
| **Data layer** | Graphiti/Zep pattern | Temporal knowledge graph for agent memory — bi-temporal model tracks validity intervals |

### Architecture by Platform

```
┌──────────────────────────────────────────────────────────────────┐
│  packages/prism-graph (new shared package in monorepo)           │
│  ├── GraphStore.ts         — Zustand store: nodes, edges, layout │
│  ├── GraphLayout.ts        — Force simulation engine wrapper     │
│  ├── neo4j/                — Neo4j Bolt driver + Cypher helpers  │
│  ├── kuzu/                 — Kuzu-WASM embedded graph DB         │
│  └── types.ts              — GraphNode, GraphEdge, LayoutConfig  │
├──────────────────────────────────────────────────────────────────┤
│  VS Code Extension (sidebar webview)                             │
│  └── GraphPanel.tsx         — 2D Sigma.js / Cytoscape canvas     │
│      ├── Force-directed or hierarchical layout                   │
│      ├── Click-to-expand node neighborhoods                      │
│      └── Spectral color coding by node type                      │
├──────────────────────────────────────────────────────────────────┤
│  Electron Desktop App (tabbed editor area)                       │
│  └── GraphExplorer.tsx      — Full R3F 3D scene                  │
│      ├── 3d-force-graph for physics simulation                   │
│      ├── OrbitControls for camera                                │
│      ├── Bloom post-processing for spectral glow                 │
│      ├── Raycasting for node selection                           │
│      └── Detail panel (slide-out) for node properties            │
├──────────────────────────────────────────────────────────────────┤
│  Eval Dashboard (existing + enhanced)                            │
│  └── GraphCanvas.tsx (existing) → enhanced with Neo4j queries    │
│      ├── Current: custom SVG radial layout                       │
│      ├── New: Cypher query panel (Phase 5 of Neo4j plan)         │
│      └── New: Graphiti temporal edges for decision traces        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Key Patterns from Your Resources (and How They Apply)

### 1. Context Graphs (Neo4j blog — Will Lyon)

The central insight: traditional databases capture the **State Clock** (what's true now), but AI agents need the **Event Clock** (what happened, when, and why). A context graph captures decision traces — the full reasoning chain behind every significant decision.

**Direct application to Prism:** Your eval dashboard already tracks decisions (pass/fail grades, assertion evidence, trial metadata). The Neo4j plan adds cross-run queryability. But the *real* opportunity is making the Prism plugin itself a context graph — every RPIV cycle, every story execution, every agent spawn becomes a traceable decision node with causal edges:

```
(:Story)-[:RESEARCHED_BY]->(:ResearchDoc)
(:ResearchDoc)-[:INFORMED]->(:Plan)
(:Plan)-[:DECOMPOSED_INTO]->(:Story)
(:Story)-[:EXECUTED_BY {model, tokens, duration}]->(:Trial)
(:Trial)-[:PRODUCED]->(:Diff)
(:Trial)-[:GRADED_BY]->(:GraderResult {evidence, assertion})
(:GraderResult)-[:APPLIED_POLICY]->(:QualityGate)
```

This turns Prism from "a workflow tool that runs agents" into "a system that remembers *why* every decision was made" — exactly the context graph thesis.

### 2. Graphiti / Zep (Temporal Knowledge Graph Memory)

Graphiti is the most directly applicable pattern for Prism's agent memory needs. Key features that map to Prism:

- **Bi-temporal model**: `t_valid` (when a fact was true) + `t_ingested` (when Prism learned it). This lets you ask "what did Prism know about this codebase at the time it made this plan?"
- **Incremental updates**: No batch recomputation — new eval results, agent outputs, and code changes integrate immediately
- **Hybrid retrieval**: Semantic embeddings + BM25 keyword search + graph traversal. P95 latency of 300ms.
- **MCP server**: Graphiti has a production MCP server — you could integrate it directly as a Prism MCP tool

**Practical integration path:**

```
Prism Plugin (Claude Code)
  ↓ writes episodes (research findings, plan decisions, implementation results)
Graphiti MCP Server
  ↓ builds temporal knowledge graph
Neo4j / Kuzu
  ↓ queryable from
Prism Eval Dashboard (Graph Explorer screen)
  + VS Code Extension (context panel)
  + Electron App (full 3D graph explorer)
```

### 3. SightXR + Kuzu-Wasm (Embedded Graph + Visual Analytics)

The SightXR pattern is particularly interesting for Prism because Kuzu-Wasm runs **entirely in the browser** — no Docker, no server, no infrastructure. The flow is:

1. Drag-and-drop data ingestion (PDFs, CSVs, JSON)
2. GenAI extracts entities and relationships (POLE schema or custom)
3. Kuzu-Wasm stores the graph in-browser
4. Interactive visualization with hierarchical trees, force layouts, keyword search
5. Cypher queries directly on the embedded DB

**For Prism, this means:** Your VS Code extension and Electron app could embed Kuzu-Wasm to store the project's knowledge graph locally — no Neo4j Docker required for basic usage. Neo4j becomes the optional "power user" backend for cross-project analytics, while Kuzu-Wasm handles single-project graph exploration out of the box.

### 4. Neo4j MCP Server + Data Modeling

The Neo4j MCP server enables natural language querying of graph data, auto-generated graph models, and memory persistence. Combined with the Neo4j data modeling MCP server, you could:

- Let Claude Code agents directly query the project's knowledge graph during RPIV cycles
- Auto-model new data structures discovered during research phases
- Persist agent memory as graph relationships (not just flat `.prism/` JSON files)

---

## Recommended Implementation Sequence

Given your existing Neo4j Eval Dashboard plan (8 phases) and current Prism v2.5.0 architecture:

### Phase A: Shared Graph Package (Foundation)

Create `packages/prism-graph` in the monorepo with:
- TypeScript types for graph nodes/edges (compatible with Neo4j and Kuzu)
- Zustand store for graph state management
- Layout engine abstraction (force-directed, hierarchical, radial)
- Color mapping using spectral palette

### Phase B: Enhanced Eval Dashboard Graph (Existing Plan Phase 5)

Upgrade the Skill Graph screen from custom SVG to a proper graph visualization:
- Use Sigma.js or Cytoscape.js for 2D (lightweight, fast)
- Add the Cypher query panel from your Neo4j plan
- Wire to `packages/prism-graph` store

### Phase C: VS Code Graph Panel

Add a graph visualization panel to the VS Code extension:
- 2D Sigma.js canvas in a webview panel
- Shows project context: skills, agents, commands, and their relationships
- Reads from `.prism/` JSON (no Neo4j required)
- Optional: Kuzu-Wasm for richer querying

### Phase D: Electron 3D Graph Explorer

Full R3F 3D graph explorer in the Electron app:
- `3d-force-graph` physics simulation
- Spectral bloom effects on nodes (matching Prism's atmospheric rendering)
- Click-to-trace decision history (context graph pattern)
- Optional Neo4j backend for cross-project analytics

### Phase E: Graphiti Integration (Agent Memory)

Wire Graphiti's MCP server into the Prism plugin:
- Agent episodes → Graphiti → Neo4j/Kuzu temporal graph
- Query agent memory from the visualization layer
- Temporal replay: "show me the state of knowledge at iteration 3"

---

## Library Comparison for Graph Visualization

| Library | Type | Best For | Bundle Size | 3D? | Prism Fit |
|---------|------|----------|-------------|-----|-----------|
| `3d-force-graph` | WebGL | Full 3D force graph | ~200 KB | Yes | Electron main graph |
| `react-force-graph-3d` | R3F wrapper | React integration | ~220 KB | Yes | Electron main graph |
| `@react-sigma/core` | Canvas 2D | Large graphs, fast rendering | ~80 KB | No | VS Code panel |
| `cytoscape.js` | Canvas 2D | Rich layouts, analysis | ~400 KB | No | Eval Dashboard |
| `d3-force` | SVG/Canvas | Custom 2D simulations | ~30 KB | No | Lightweight option |
| `ngraph.forcelayout` | Any | Pure computation (no rendering) | ~15 KB | — | Layout engine only |
| `@neo4j-nvl/react` | Canvas 2D | Neo4j-native rendering | ~150 KB | No | Direct Neo4j use |
| `reagraph` | R3F | 3D graph + R3F | ~250 KB | Yes | Good alternative |

**My recommendation:** `react-force-graph-3d` for Electron (it wraps `3d-force-graph` with React bindings), `@react-sigma/core` for VS Code (canvas-based, handles large graphs well), and keep the existing custom SVG approach for the Eval Dashboard Skill Graph until Phase B.

---

## Summary

| Question | Answer |
|----------|--------|
| What is GraphXR-Lite? | Docker deployment stacks, not an embeddable library |
| Can I embed it in VS Code/Electron? | No — it's a proprietary standalone web app |
| What's missing vs. full? | Enterprise features, collaboration, support — not visualization capabilities |
| Should I use it as a foundation? | No for embedding; Yes as design inspiration and for testing Neo4j graph models |
| What should I build with? | R3F + `3d-force-graph` (Electron 3D), Sigma.js (VS Code 2D), Kuzu-Wasm (embedded DB), Graphiti (agent memory) |
| How does this fit the Neo4j plan? | Phases 5-6 of your existing plan become the seam where custom visualization replaces the "use Neo4j Browser" escape hatch |

The context graph pattern from your Neo4j resources is the strategic vision — Prism doesn't just run workflows, it captures *why* every decision was made. GraphXR-Lite is a useful tool for prototyping your Neo4j schema (spin it up, load eval data, explore in the GraphXR UI), but the production visualization layer should be custom-built with the web 3D stack you already know.
