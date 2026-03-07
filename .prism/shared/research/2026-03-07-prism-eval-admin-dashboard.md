# Research: Prism Eval Admin Dashboard

**Date**: 2026-03-07
**Topic**: Electron-based admin dashboard for visualizing evals, benchmarks, comparators, and agent traces from the skill-creator plugin infrastructure
**Target Directory**: `prism-eval/` (Electron starter)

---

## Research Question

What is the current state of the prism-eval/ Electron starter, what patterns should the admin dashboard follow from the existing Electron app, and how do the PRD spec, prototype, and skill-creator eval infrastructure define the implementation scope?

---

## Summary

The prism-eval/ directory contains a **blank Electron + React 19 + TypeScript + Vite starter** (Electron Forge). Zero business logic exists — it's ready for development. The PRD spec defines a 5-screen "Spectral Observatory" dashboard (Mission Control, Eval Explorer, Agent Traces, Benchmarks, Skill Graph) that visualizes JSON output files from the skill-creator plugin. A complete JSX prototype (~74KB, 2000+ lines) with mock data demonstrates all screens. The existing cmd/prism-electron/ app provides well-established patterns for IPC, state management, CSS theming, and component architecture that the eval dashboard should follow for consistency.

---

## Files Discovered

### Input Documents

| File | Purpose | Size |
|------|---------|------|
| `.prism/shared/docs/2026-03-06-skill-creator-eval-analysis.md` | Skill-creator eval infrastructure analysis, v2.4.8 vs v2.4.9 comparison plan | ~12KB |
| `.prism/shared/ref/prism-eval/prism-admin-dashboard-spec.md` | Full UI/UX spec — 13 sections, 5 screens, data model, interaction patterns, animation spec | ~28KB |
| `.prism/shared/ref/prism-eval/prism-admin-dashboard.jsx` | Interactive JSX prototype with all 5 screens and mock data | ~74KB |
| `.prism/shared/ref/prism-testing-suite/README.md` | Existing test infrastructure for CLI installer and Go packages | ~5KB |

### prism-eval/ Electron Starter

| File | Purpose |
|------|---------|
| `prism-eval/package.json` | Electron 40 + React 19 + TypeScript + Vite + Electron Forge |
| `prism-eval/forge.config.ts` | Forge config with Vite plugin, Squirrel/ZIP/DEB/RPM makers |
| `prism-eval/tsconfig.json` | ESNext target, commonjs module, react-jsx, strict mode |
| `prism-eval/vite.main.config.mts` | Main process Vite config (empty) |
| `prism-eval/vite.preload.config.mts` | Preload Vite config (empty) |
| `prism-eval/vite.renderer.config.mts` | Renderer Vite config (react plugin only) |
| `prism-eval/src/main.ts` | Boilerplate Electron window creation (800x600) |
| `prism-eval/src/preload.ts` | Empty preload (commented docs link) |
| `prism-eval/src/renderer.tsx` | React entry point (renders App) |
| `prism-eval/src/App.tsx` | "Hello World" placeholder |
| `prism-eval/src/index.css` | Minimal body styles |
| `prism-eval/index.html` | HTML entry point |

### Baseline Snapshot (already captured)

| Directory | Purpose |
|-----------|---------|
| `.prism/shared/evals/v2.4.8-snapshot/agents/` | 10 agent markdown files from v2.4.8 |
| `.prism/shared/evals/v2.4.8-snapshot/skills/` | 13 skill directories from v2.4.8 |
| `.prism/shared/evals/v2.4.8-snapshot/commands/` | 25 command files from v2.4.8 |
| `.prism/shared/evals/v2.4.8-snapshot/scripts/` | 5 script files from v2.4.8 |

---

## Component Analysis

### 1. PRD Spec: Five-Screen Architecture

The spec defines 5 screens with the "Spectral Observatory" design language:

**Screen 1 — Mission Control** (`spec:121-186`)
- Stat cards row (avg pass rate, total evals, skills improved, total tokens)
- Skill performance table with PassRateRing, delta indicators, type badges (CAP/PREF)
- Live feed (event stream from eval runs)
- Version progression bar chart

**Screen 2 — Eval Explorer** (`spec:189-241`)
- Master-detail split: eval list (left) + eval detail panel (right)
- Skill filter chips
- Score comparison cards (with_skill vs old_skill vs no_skill)
- Comparator verdict callout
- Expectations pass/fail rows with evidence

**Screen 3 — Agent Trace Visualizer** (`spec:245-349`)
- DAG flow visualization of the eval pipeline (Orchestrator → fork → Grader → Comparator → Analyzer → Aggregator)
- Playback controls (play/pause, timeline scrubber, speed 1x/2x/4x)
- Step detail panel with agent card, timing, tool calls
- Node states: inactive, active, running (pulsing glow)

**Screen 4 — Benchmark Comparator** (`spec:354-416`)
- Version cards (Current vs Baseline vs No Skill)
- Metric comparison bars (pass rate, tokens, time) with deltas
- Model outgrowth warning panel
- Per-skill breakdown table

**Screen 5 — Skill Graph** (`spec:420-485`)
- Force-directed or radial graph of the 13-skill ecosystem
- Nodes sized by pass rate, colored by type (capability uplift vs encoded preference)
- Node detail panel with outgrowth status
- Central prism meta-router node

### 2. Prototype JSX: Complete Mock Implementation

The 2000+ line prototype implements all 5 screens as a single-file React component with:

- **SPECTRAL color system**: 16 semantic tokens matching the spec
- **Mock data**: 13 skills, 6 eval cases, 10 trace steps, benchmark comparison data
- **Shared components**: SpectralBar, Badge, StatCard, PassRateRing, DeltaIndicator, ExpectationRow
- **Navigation**: Sidebar + top bar breadcrumbs, screen state managed via `useState`
- **Agent Trace playback**: Full timeline implementation with `setInterval`, speed controls, scrubber
- **Skill Graph**: SVG radial layout with central node + 13 orbiting skill nodes
- **Animations**: CSS keyframes for pulsing glow, live feed entries

### 3. Existing Electron App Patterns (cmd/prism-electron/)

The existing prism-electron app provides these reusable patterns:

**IPC Architecture** (`ElectronIPCBridge.ts`):
- `contextBridge.exposeInMainWorld('electronAPI', { send, on, invoke })`
- Channel naming: `prism:<noun><Verb>` (e.g., `prism:openProject`)
- All handlers registered in a single bridge class with `dispose()` cleanup

**State Management** (no external library):
- Global server state: React Context + `useState` + subscription (`PrismStateContext.tsx`)
- Local UI state: React Context + `useReducer` with typed discriminated union actions (`LayoutContext.tsx`)
- Persistence: debounced `invoke` calls to main process, plain `fs` read/write to `userData`

**CSS/Theme Architecture**:
- Shared `--prism-*` CSS custom properties defined in `bridge.css` and `spectral.css`
- Tailwind v4 with `@tailwindcss/vite` plugin (no postcss config)
- `@theme` block maps `--prism-*` tokens to Tailwind utility names
- Components use inline `style={{}}` with `var(--prism-*)` references
- `cn()` helper (clsx + tailwind-merge) for conditional classes

**Layout Pattern** (`AppShell.tsx`):
- Fixed sidebar + flexible content area
- Activity bars (44px), content rails (260px, collapsible), tab bar, bottom panel
- Flexbox layout with `flexShrink: 0` for fixed panels
- Rail collapse via CSS transition on width

**Component Patterns**:
- `CollapsibleSection` accordion wrapper (chevron rotation, `defaultOpen` prop)
- Provider hierarchy: outer `PrismStateContextProvider` → inner `LayoutProvider`
- Transport registration before React render

**Window State** (`window-state.ts`):
- Plain `fs.readFileSync/writeFileSync` to `app.getPath('userData')/prism-window-state.json`
- Stores `{ x, y, width, height, lastProjectDir }`

### 4. Data Sources: Skill-Creator JSON Files

The dashboard consumes these JSON files produced by the skill-creator plugin:

| File | Schema | Screen(s) |
|------|--------|-----------|
| `evals/evals.json` | `{ skill_name, evals: [{ id, prompt, expected_output, files, expectations }] }` | Eval Explorer |
| `timing.json` | `{ total_tokens, duration_ms, total_duration_seconds }` | Agent Traces, Benchmarks |
| `grading.json` | `{ expectations: [{ text, passed, evidence }], summary, execution_metrics, claims, eval_feedback }` | Eval Explorer |
| `comparison.json` | `{ winner, reasoning, rubric: { A/B: { content, structure, scores } }, output_quality, expectation_results }` | Eval Explorer |
| `analysis.json` | `{ comparison_summary, winner_strengths, loser_weaknesses, improvement_suggestions, transcript_insights }` | Eval Explorer |
| `benchmark.json` | `{ metadata, runs: [{ eval_id, configuration, result }], run_summary: { with/without_skill: { mean, stddev } }, notes }` | Benchmarks, Mission Control |
| `history.json` | `{ started_at, skill_name, current_best, iterations: [{ version, pass_rate, grading_result }] }` | Mission Control, Benchmarks |
| `feedback.json` | `{ reviews: [{ run_id, feedback, timestamp }], status }` | Future integration |

### 5. Skill-Creator Eval Infrastructure Mapping

From the eval analysis document, the dashboard visualizes the full skill-creator pipeline:

| Skill-Creator Concept | Dashboard Visualization |
|----------------------|------------------------|
| Multi-agent eval runs | Agent Trace Visualizer (DAG flow) |
| Blind A/B comparison | Eval Explorer comparator verdict |
| Grader agent output | Eval Explorer expectations panel |
| Benchmark aggregation | Benchmark Comparator screen |
| Version progression | Mission Control version bar chart |
| Model outgrowth detection | Benchmark outgrowth warning panel |
| Token/timing metrics | Stat cards, timing sections throughout |
| Capability vs preference taxonomy | Skill Graph node colors, Mission Control type badges |

---

## Patterns Found

### Pattern 1: Three-Vite-Config Electron Architecture
- `vite.main.config.mts` — main process (Node.js target)
- `vite.preload.config.mts` — preload (sandboxed Node)
- `vite.renderer.config.mts` — renderer (browser target, React plugin)
- `forge.config.ts` wires all three together
- **prism-eval/ already has this pattern** from the starter template

### Pattern 2: Spectral Color System Consistency
- The prototype uses the exact same SPECTRAL color tokens as cmd/prism-electron/
- `--prism-*` CSS variables map to the same hex values
- The eval dashboard should use the same `bridge.css` / `spectral.css` approach
- Tailwind v4 `@theme` block for utility class mapping

### Pattern 3: Context + useReducer State Management
- No external state library in the project
- Global state via React Context + `useState` (read from external source)
- Local UI state via React Context + `useReducer` (typed actions)
- State persistence via debounced IPC calls to main process
- This pattern should be adopted for the eval dashboard's state slices

### Pattern 4: File-Watching Data Layer
- The dashboard reads JSON files from skill-creator workspaces
- Main process uses `fs.watch` or `fs.readFile` to load data
- Renderer receives data via IPC invoke/push pattern
- Live feed can tail a JSONL event file during active eval runs

---

## Technology Stack Comparison

| Aspect | prism-eval/ (current) | cmd/prism-electron/ (reference) | PRD spec recommendation |
|--------|----------------------|-------------------------------|------------------------|
| Electron | 40.0.0 | 33.x | N/A |
| React | 19.2.4 | 18 (webview-ui) / 19 (main) | N/A |
| TypeScript | ~4.5.4 | 5.x | N/A |
| Vite | 5.4.21 | 5.x | N/A |
| Tailwind | Not installed | 4.x with @tailwindcss/vite | Should install |
| State mgmt | None | Context + useReducer | Zustand or Context + useReducer |
| Routing | None | Custom screen state | Custom (sidebar + breadcrumbs) |
| Charts | None | None | Recharts or D3 |
| DAG layout | None | None | dagre or elkjs |
| Fonts | System | JetBrains Mono + DM Sans | JetBrains Mono + DM Sans |

---

## Open Questions

1. **Data directory**: Where will the skill-creator workspace files live? Options: (a) `.prism/shared/evals/<workspace>/`, (b) user-selected directory via file dialog, (c) configurable in settings
2. **Live feed source**: Will eval runs emit JSONL events to a file, or should the dashboard shell out to `claude -p` and capture stdout?
3. **Shared packages**: Should prism-eval/ import from `packages/prism-ui/` for shared components (MarkdownBlock, spectral CSS), or remain standalone?
4. **Monaco editor**: The spec mentions Monaco for diff views — significant dependency. Is this needed for prototype phase, or can it be deferred?
5. **Canvas vs SVG**: Agent Traces spec suggests moving from SVG to Canvas/WebGL for performance. For phase 1, SVG with dagre is simpler. Confirm approach.
6. **Force-directed graph library**: d3-force vs @react-three-fiber for Skill Graph. d3-force is simpler; R3F enables richer visuals but adds complexity.
