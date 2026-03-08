---
date: 2026-03-07
author: Claude
repository: prism-plugin
branch: feat/neo4j-eval-dashboard
ticket: N/A
status: draft
research: .prism/shared/research/2026-03-07-prism-v250-gap-analysis.md
---

# Plan: Neo4j-Backed Eval Dashboard

## Overview

**Goal**: Add a Neo4j graph backbone to the Prism Eval Dashboard as an optional queryable layer on top of the existing JSON file pipeline. Add pass@k/pass^k metrics, capability→regression eval graduation, a Cypher query panel, and a visual regression history view. The existing JSON workflow continues to work unchanged — Neo4j adds cross-run queryability.

**Research**: `.prism/shared/research/2026-03-07-prism-v250-gap-analysis.md` (Gap 3 — token usage, eval evolution), `.prism/shared/docs/multi-agent-workflow/prism-upgrade-research-v5.md` (Part 8)

**Complexity**: High

**Estimated Phases**: 8

## Current Eval Dashboard Architecture (Reference)

The eval dashboard at `prism-eval/` is an Electron 40 app (React 19, Vite, Tailwind v4) with:
- **5 screens**: Mission Control, Eval Explorer, Agent Traces, Benchmarks, Skill Graph
- **Data pipeline**: `EvalDataService.ts` reads flat JSON files (`benchmark.json`, `grading.json`, `timing.json`, `evals.json`, `traces.json`) from a user-selected workspace directory via IPC
- **Context architecture**: 4 React contexts (DataContext, EvalContext, NavigationContext, TraceContext) with reducer pattern
- **Visualizations**: All custom SVG — no Recharts or Dagre used despite being installed as dependencies
- **Mock data fallback**: `mock-data.ts` provides demo data; real data overlays when a workspace is loaded
- **Integration seam**: `EvalDataService.ts:loadWorkspace()` is the single data entry point, called via `main.ts:58` IPC handler

## Success Criteria

### Automated Verification
- [ ] `scripts/neo4j-import.py` imports eval workspace JSON into Neo4j and creates correct node/relationship structure
- [ ] Import script is idempotent — re-importing the same workspace doesn't create duplicates
- [ ] Neo4j query returns the same pass rates as the existing JSON-based dashboard
- [ ] Pass@k and pass^k calculations match expected values for test data
- [ ] `npm run build` in `prism-eval/` succeeds with Neo4j additions
- [ ] Dashboard loads correctly without Neo4j running (graceful degradation)

### Manual Verification
- [ ] Neo4j query panel returns results for all 6 documented query types (trace explorer, eval timeline, anomaly detection, dependency graph, visual regression history, cross-run contamination)
- [ ] Pass@k/pass^k charts display correctly in the Benchmarks screen
- [ ] Capability→regression graduation tracking works in Eval Explorer
- [ ] All existing screens continue to work identically with mock data and real workspaces

## Phases

### Phase 1: Neo4j Infrastructure Setup

**Goal**: Add Neo4j as an optional dependency with Docker setup, driver configuration, and graceful degradation when unavailable.

**Files to create**:
| File | Purpose |
|------|---------|
| `prism-eval/docker-compose.yml` | Neo4j container with volume persistence |
| `prism-eval/src/services/Neo4jService.ts` | Neo4j driver wrapper with connection management and graceful fallback |
| `prism-eval/docs/neo4j-setup.md` | Setup instructions for Docker and local Neo4j |

**Files to modify**:
| File | Change |
|------|--------|
| `prism-eval/package.json` | Add `neo4j-driver` dependency |

**Steps**:
1. [ ] Create `docker-compose.yml` for Neo4j:
   ```yaml
   services:
     neo4j:
       image: neo4j:5-community
       ports:
         - "7474:7474"  # Browser
         - "7687:7687"  # Bolt
       volumes:
         - neo4j-data:/data
       environment:
         - NEO4J_AUTH=neo4j/prism-eval
   volumes:
     neo4j-data:
   ```
2. [ ] Add `neo4j-driver` to `prism-eval/package.json` dependencies
3. [ ] Create `Neo4jService.ts` with:
   - Connection management: `connect()`, `disconnect()`, `isConnected()`
   - Graceful degradation: `isAvailable()` returns false if Neo4j isn't running (connection timeout 3s)
   - Query helper: `run(cypher, params)` wraps `session.run()` with error handling
   - Schema initialization: `initSchema()` creates indexes and constraints on first connect
4. [ ] Create `docs/neo4j-setup.md` with Docker and local installation instructions

**Verification**:
```bash
cd prism-eval
docker compose up -d
npm run build  # Should succeed
# App should load normally even without Neo4j running
```

**Checkpoint**: Phase 1 complete

---

### Phase 2: Create Neo4j Import Script

**Goal**: A Python script that reads eval workspace JSON and writes nodes/relationships to Neo4j, using the graph model from research-v5 Part 8.3.

**Files to create**:
| File | Purpose |
|------|---------|
| `scripts/neo4j-import.py` | Reads eval JSON workspace, writes to Neo4j graph |

**Steps**:
1. [ ] Create `scripts/neo4j-import.py` with CLI interface:
   ```bash
   # Usage: python scripts/neo4j-import.py <workspace-dir> [--neo4j-uri bolt://localhost:7687] [--neo4j-auth neo4j/prism-eval]
   ```
2. [ ] Implement node creation for all 8 node types:
   ```
   (:EvalSuite {version, dimension, skill, timestamp})
   (:Task {id, prompt, expected_output, skill_name})
   (:Trial {timestamp, token_count, latency, cost, model, passed})
   (:Step {tool_name, input_summary, output_summary, duration, order})
   (:Agent {name, model, type})
   (:GraderResult {score, evidence, grader_type, assertion_text, passed})
   (:Requirement {id, description, verified_by, passes})
   (:Baseline {path, story_id, timestamp, hash})
   ```
3. [ ] Implement relationship creation:
   ```
   (:EvalSuite)-[:CONTAINS]->(:Task)
   (:Task)-[:HAS_TRIAL]->(:Trial)
   (:Trial)-[:HAS_STEP]->(:Step)-[:NEXT]->(:Step)
   (:Trial)-[:GRADED_BY]->(:GraderResult)
   (:Agent)-[:EXECUTED]->(:Trial)
   (:Task)-[:GRADUATED_TO {date}]->(:Task)  # capability → regression
   ```
4. [ ] Read JSON files from workspace:
   - `evals.json` → Task nodes
   - `grading.json` → GraderResult nodes + relationships
   - `timing.json` → Trial node properties (token_count, latency)
   - `benchmark.json` → EvalSuite node + metric properties
   - `traces.json` → Step nodes + NEXT chains
5. [ ] Implement idempotency — use `MERGE` with unique keys (suite version + task ID + trial timestamp) to prevent duplicates on re-import
6. [ ] Add `--dry-run` flag that prints Cypher statements without executing

**Verification**:
```bash
# Import a real workspace
python scripts/neo4j-import.py .prism/shared/evals/v2.5.0/workspace/iteration-1/

# Verify in Neo4j browser (localhost:7474):
# MATCH (n) RETURN labels(n), count(n)
```

**Checkpoint**: Phase 2 complete

---

### Phase 3: Add Pass@k and Pass^k Metrics

**Goal**: Add proper consistency measurement to the eval dashboard — pass@k (probability of at least one success in k trials) and pass^k (probability all k trials succeed).

**Files to modify**:
| File | Change |
|------|--------|
| `prism-eval/src/types/index.ts` | Add `passAtK` and `passHatK` fields to relevant interfaces |
| `prism-eval/src/services/EvalDataService.ts` | Compute pass@k and pass^k from trial data when loading workspace |
| `prism-eval/src/screens/Benchmarks.tsx` | Add pass@k / pass^k comparison view |
| `prism-eval/src/components/benchmarks/ConsistencyChart.tsx` | New component: dual-line chart showing pass@k vs pass^k divergence across k values |
| `prism-eval/src/data/mock-data.ts` | Add mock pass@k/pass^k data |

**Files to create**:
| File | Purpose |
|------|---------|
| `prism-eval/src/components/benchmarks/ConsistencyChart.tsx` | SVG chart showing pass@k vs pass^k across k=1..10 |

**Steps**:
1. [ ] Add types to `types/index.ts`:
   ```typescript
   interface ConsistencyMetrics {
     passAtK: number[];   // pass@k for k=1..10
     passHatK: number[];  // pass^k for k=1..10
     k: number;           // number of trials
   }
   ```
2. [ ] Implement computation in `EvalDataService.ts`:
   ```
   pass@k = 1 - C(n-c, k) / C(n, k)   where n=total trials, c=passing trials
   pass^k = (c/n)^k
   ```
3. [ ] Create `ConsistencyChart.tsx` — dual-line SVG chart:
   - X axis: k (1-10)
   - Y axis: probability (0-100%)
   - Blue line: pass@k (approaches 100% as k increases)
   - Red line: pass^k (falls toward 0% as k increases)
   - Highlighted intersection area showing the "consistency gap"
   - Follow the spectral theme (`spectral.css` custom properties)
4. [ ] Add to Benchmarks screen — place below `MetricComparison`, above `SkillBreakdown`
5. [ ] Update mock data with sample pass@k/pass^k arrays

**Verification**:
```bash
cd prism-eval && npm run build  # Should succeed
# Manual: open dashboard, navigate to Benchmarks, verify consistency chart renders
```

**Checkpoint**: Phase 3 complete

---

### Phase 4: Add Capability → Regression Eval Graduation

**Goal**: Track eval lifecycle — tasks start as "capability" evals (expected low pass rate), graduate to "regression" evals once they consistently pass.

**Files to modify**:
| File | Change |
|------|--------|
| `prism-eval/src/types/index.ts` | Add `evalType: 'capability' \| 'regression'` and `graduatedAt?: string` to `EvalCase` interface |
| `prism-eval/src/screens/EvalExplorer.tsx` | Add graduation badges and filter by eval type |
| `prism-eval/src/components/eval-explorer/EvalCard.tsx` | Show capability/regression badge |
| `prism-eval/src/components/eval-explorer/SkillFilterChips.tsx` | Add capability/regression filter chips |
| `skills/prism-eval/SKILL.md` | Add graduation logic: if a capability eval passes 3+ consecutive runs, mark as regression |
| `skills/prism-eval/references/eval-schemas.md` | Add `evalType` and `graduatedAt` fields to evals.json schema |

**Files to create**:
| File | Purpose |
|------|---------|
| `prism-eval/src/components/eval-explorer/GraduationBadge.tsx` | Visual badge showing capability → regression transition |

**Steps**:
1. [ ] Add `evalType` and `graduatedAt` to `EvalCase` in `types/index.ts`
2. [ ] Create `GraduationBadge.tsx` — shows "capability" (amber) or "regression" (green) badge with optional graduation date tooltip
3. [ ] Update `EvalCard.tsx` — display the graduation badge
4. [ ] Update `SkillFilterChips.tsx` — add "Capability" and "Regression" filter chips
5. [ ] Update `prism-eval` SKILL.md — add graduation logic to the grading step: "After grading, check each eval's history. If a capability eval has passed in 3 or more consecutive runs, graduate it to regression by setting `evalType: 'regression'` and `graduatedAt: <date>` in evals.json."
6. [ ] Update `eval-schemas.md` — document the new fields
7. [ ] In Neo4j import script, add `GRADUATED_TO` relationship when `graduatedAt` is present

**Verification**:
```bash
cd prism-eval && npm run build
# Manual: verify capability/regression badges appear on eval cards
# Manual: verify filter chips work
```

**Checkpoint**: Phase 4 complete

---

### Phase 5: Add Neo4j Query Panel to Dashboard

**Goal**: Add a Cypher query panel to the Eval Dashboard for ad-hoc graph queries across eval runs.

**Files to create**:
| File | Purpose |
|------|---------|
| `prism-eval/src/screens/GraphExplorer.tsx` | New screen (Screen 6): Cypher query panel with results table and graph view |
| `prism-eval/src/components/graph-explorer/CypherEditor.tsx` | Cypher query input with syntax highlighting and saved queries |
| `prism-eval/src/components/graph-explorer/ResultsTable.tsx` | Tabular display of query results |
| `prism-eval/src/components/graph-explorer/QueryPresets.tsx` | Preset queries from research-v5 Part 8.3 |

**Files to modify**:
| File | Change |
|------|--------|
| `prism-eval/src/App.tsx` | Add GraphExplorer to screen router |
| `prism-eval/src/context/NavigationContext.tsx` | Add `'graph-explorer'` to ScreenId type |
| `prism-eval/src/components/layout/Sidebar.tsx` | Add Graph Explorer nav item |
| `prism-eval/src/main.ts` | Add `eval:neo4jQuery` IPC handler that runs Cypher via Neo4jService |
| `prism-eval/src/preload.ts` | Expose `neo4jQuery` method via evalAPI |

**Steps**:
1. [ ] Add `eval:neo4jQuery` IPC handler to `main.ts` — receives Cypher string + params, runs via `Neo4jService.run()`, returns serialized results. Returns error object if Neo4j is unavailable.
2. [ ] Expose `neo4jQuery` in `preload.ts` context bridge
3. [ ] Add `'graph-explorer'` to `ScreenId` type in `NavigationContext.tsx`
4. [ ] Add nav item in `Sidebar.tsx` — with a "requires Neo4j" indicator badge if not connected
5. [ ] Create `QueryPresets.tsx` with the 6 preset queries from research-v5:
   ```
   1. Trace Explorer: MATCH path = (t:Trial)-[:HAS_STEP*]->(s:Step) WHERE t.id = $trialId RETURN path
   2. Eval Timeline: MATCH (t:Task)-[:HAS_TRIAL]->(tr:Trial) RETURN t.id, collect(tr.passed) ORDER BY tr.timestamp
   3. Anomaly Detector: MATCH (tr:Trial) WHERE tr.token_count > 5 * $median RETURN tr
   4. Dependency Graph: MATCH (r:Requirement)-[:DEPENDS_ON]->(r2:Requirement) RETURN r, r2
   5. Visual Regression History: MATCH (b:Baseline)-[:DIFF_DETECTED]->(d:DiffResult) RETURN b.story_id, count(d), avg(d.change_pct)
   6. Cross-Run Analysis: MATCH (a:Agent)-[:EXECUTED]->(tr:Trial) RETURN a.name, a.model, count(tr), avg(tr.token_count)
   ```
6. [ ] Create `CypherEditor.tsx` — textarea with monospace font, "Run Query" button, preset selector dropdown. Basic syntax highlighting via regex (keywords blue, strings green, params amber).
7. [ ] Create `ResultsTable.tsx` — renders Neo4j records as a scrollable table with sortable columns. Handles node/relationship results by showing properties.
8. [ ] Create `GraphExplorer.tsx` screen — layout: presets sidebar (200px) + editor (top 40%) + results (bottom 60%). Show "Neo4j not connected" placeholder with setup instructions when `Neo4jService.isAvailable()` returns false.
9. [ ] Add screen to `App.tsx` router

**Verification**:
```bash
cd prism-eval && npm run build
# Manual: navigate to Graph Explorer screen
# Without Neo4j: verify "not connected" placeholder with setup instructions
# With Neo4j: run a preset query, verify results render in table
```

**Checkpoint**: Phase 5 complete

---

### Phase 6: Add Visual Regression History View

**Goal**: Query Neo4j for baseline evolution and diff patterns over time, rendering a visual history per component.

**Files to create**:
| File | Purpose |
|------|---------|
| `prism-eval/src/components/graph-explorer/RegressionTimeline.tsx` | Timeline component showing baseline changes and diff frequency per story/component |

**Files to modify**:
| File | Change |
|------|--------|
| `scripts/neo4j-import.py` | Add Baseline and DiffResult node import from `.prism/shared/validation/baselines/` and `.prism/shared/validation/diffs/` |
| `prism-eval/src/screens/GraphExplorer.tsx` | Add "Visual Regression" tab alongside the Cypher query tab |

**Steps**:
1. [ ] Update `neo4j-import.py` — add baseline import:
   - Scan `.prism/shared/validation/baselines/` for PNG files
   - Create `(:Baseline {path, story_id, timestamp, hash})` nodes (hash = file MD5 for change detection)
   - Scan `.prism/shared/validation/diffs/` for diff JSON files
   - Create `(:DiffResult {change_pct, threshold, verdict, timestamp})` nodes
   - Create `(:Baseline)-[:DIFF_DETECTED]->(:DiffResult)` relationships
2. [ ] Create `RegressionTimeline.tsx`:
   - Horizontal timeline SVG per story/component
   - Dots for each baseline version (green = pass, red = regression, amber = intentional change)
   - Tooltip showing change percentage and verdict
   - Sparkline of change percentages over time
   - Query: `MATCH (b:Baseline)-[:DIFF_DETECTED]->(d:DiffResult) WHERE b.story_id = $storyId RETURN b, d ORDER BY d.timestamp`
3. [ ] Add "Visual Regression" tab to GraphExplorer screen — shows `RegressionTimeline` for all stories with baselines

**Verification**:
```bash
# Import baselines and diffs
python scripts/neo4j-import.py .prism/shared/evals/v2.5.0/workspace/iteration-1/ --include-baselines

# Manual: open Graph Explorer → Visual Regression tab
# Verify timeline renders with baseline history
```

**Checkpoint**: Phase 6 complete

---

### Phase 7: Add Anomaly Detection

**Goal**: Surface trials with abnormal token usage or tool call patterns — the "eval awareness" signal from Anthropic's BrowseComp research (38x median token usage in eval-aware runs).

**Files to create**:
| File | Purpose |
|------|---------|
| `prism-eval/src/components/mission-control/AnomalyAlert.tsx` | Alert component showing detected anomalies on Mission Control |

**Files to modify**:
| File | Change |
|------|--------|
| `prism-eval/src/screens/MissionControl.tsx` | Add anomaly alert section below stat cards |
| `prism-eval/src/services/EvalDataService.ts` | Add `detectAnomalies()` function that computes median token usage and flags 5x+ outliers |

**Steps**:
1. [ ] Add `detectAnomalies()` to `EvalDataService.ts`:
   - Compute median `token_count` across all trials
   - Flag trials where `token_count > 5 * median`
   - Compute median `latency` and flag 5x+ outliers
   - Return array of `{trialId, metric, value, median, multiplier}`
2. [ ] Create `AnomalyAlert.tsx` — compact alert card with:
   - Count of anomalous trials
   - Expandable list showing trial ID, metric, and multiplier
   - Click navigates to the trial in Agent Traces screen
   - Color: amber/red from spectral theme
3. [ ] Add to `MissionControl.tsx` — show between stat cards and the two-column layout (only if anomalies detected)
4. [ ] If Neo4j is available, also run the graph query for cross-run anomaly patterns:
   ```cypher
   MATCH (tr:Trial)
   WITH percentileDisc(tr.token_count, 0.5) AS median
   MATCH (tr:Trial) WHERE tr.token_count > 5 * median
   RETURN tr.id, tr.token_count, median, tr.token_count / median AS multiplier
   ORDER BY multiplier DESC
   ```

**Verification**:
```bash
cd prism-eval && npm run build
# Manual: verify anomaly alert appears on Mission Control when outlier trials exist
# Manual: click through to Agent Traces screen
```

**Checkpoint**: Phase 7 complete

---

### Phase 8: Integrate Neo4j Import into `prism-eval` Workflow

**Goal**: Wire the Neo4j import into the `prism-eval` skill so imports happen automatically after eval runs complete.

**Files to modify**:
| File | Change |
|------|--------|
| `skills/prism-eval/SKILL.md` | Add step after benchmark aggregation: "If Neo4j is available, run `scripts/neo4j-import.py` on the workspace to populate the graph." |
| `skills/prism-eval/references/eval-schemas.md` | Document Neo4j node types and relationships |

**Steps**:
1. [ ] Update `prism-eval/SKILL.md` — after Step 7 (aggregate benchmark), add:
   ```
   ### Step 7b: Neo4j Import (Optional)
   If Neo4j is running (check with `neo4j status` or curl localhost:7474):
   1. Run `python scripts/neo4j-import.py <workspace>` to import eval results to the graph
   2. If baselines exist, add `--include-baselines` flag
   3. Log success/skip — never fail the eval pipeline due to Neo4j issues
   ```
2. [ ] Update `eval-schemas.md` — add a "Neo4j Graph Model" section documenting all 8 node types, their properties, and relationships
3. [ ] Ensure the import step is purely optional — if `neo4j-import.py` fails or Neo4j is unavailable, log a warning and continue

**Verification**:
```bash
# Manual: run /prism-eval with Neo4j running
# Verify import happens automatically after benchmark aggregation
# Run /prism-eval without Neo4j — verify it completes without errors
```

**Checkpoint**: Phase 8 complete

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Neo4j Docker dependency intimidates non-technical users | High | Medium | Make entirely optional; all screens work without it; clear setup docs |
| Neo4j driver adds significant bundle size to Electron app | Medium | Medium | Lazy-load the driver; only import when Graph Explorer screen is opened |
| Import script performance on large eval histories | Medium | Low | Use `MERGE` with UNWIND for batch operations; add `--limit` flag |
| Cypher injection via query panel | Low | Medium | Query panel is local-only (no remote access); add parameterized query patterns |
| Graph schema evolution as eval format changes | Medium | Medium | Version the schema in `initSchema()`; add migration scripts |
| Recharts/Dagre already installed but unused — adding more unused dependencies | Low | Low | Actually use them or remove; ConsistencyChart could use Recharts instead of custom SVG |

## Edge Cases

| Case | Handling |
|------|----------|
| Neo4j not installed | All screens work normally; Graph Explorer shows setup instructions |
| Neo4j running but empty | Graph Explorer shows "No data imported" with import instructions |
| Import script run twice on same workspace | `MERGE` ensures idempotency — no duplicates |
| Very large eval history (1000+ trials) | Import script batches in chunks of 100; add progress indicator |
| Multiple eval versions imported | EvalSuite nodes are keyed by version; queries can filter by version |
| Workspace directory structure doesn't match expected format | `readJsonSafe` returns null; import script logs which files were skipped |

## Out of Scope

Explicitly excluded:
- [ ] Neo4j cloud deployment (local/Docker only)
- [ ] Real-time streaming of eval results to Neo4j (batch import only)
- [ ] Graph-based eval case generation (reading graph to produce new evals)
- [ ] Agent Teams coordination queries (not yet implemented)
- [ ] Replacing the existing JSON pipeline (additive only)
- [ ] Custom graph visualization beyond the existing radial layout (use Neo4j Browser for advanced graph viz)

## Rollback Plan

If critical issues arise:
```bash
git revert HEAD~N..HEAD
```

Rollback is safe at any phase:
- Phase 1: Remove docker-compose.yml and Neo4jService.ts; remove neo4j-driver from package.json
- Phase 2: Delete neo4j-import.py
- Phases 3-4: Revert type changes and new components (backward-compatible; new fields are optional)
- Phase 5-6: Remove GraphExplorer screen and nav item
- Phase 7: Remove AnomalyAlert component
- Phase 8: Revert skill changes

The existing JSON pipeline is never modified — only extended. Removing Neo4j leaves the dashboard exactly as it was before.

## Dependencies

**Must complete first**:
- [ ] Visual regression testing plan Phase 2 (baseline storage convention) — for Phase 6 visual regression history

**Can parallelize with**:
- [ ] Accuracy-context-upgrade plan (fully independent)
- [ ] Visual regression testing plan Phases 1-5 (independent until Phase 6)

## Progress Log

| Phase | Status | Started | Completed | Notes |
|-------|--------|---------|-----------|-------|
| Phase 1: Neo4j infrastructure | Not started | | | |
| Phase 2: Import script | Not started | | | |
| Phase 3: Pass@k / pass^k metrics | Not started | | | |
| Phase 4: Capability → regression graduation | Not started | | | |
| Phase 5: Neo4j query panel | Not started | | | |
| Phase 6: Visual regression history | Not started | | | |
| Phase 7: Anomaly detection | Not started | | | |
| Phase 8: prism-eval integration | Not started | | | |

---

## Session Notes

[Space for implementation notes, discoveries, blockers]
