---
date: 2026-02-27T00:00:00Z
topic: "Prism VSCode Panel Unification — Office + Monitor + Workspaces"
status: complete
author: Claude Opus 4.6
tags: [vscode, extension, monitor, workspaces, office, pixel-office, webview, split-panel, draggable-divider]
---

# Research: Prism Panel Unification — Office + Monitor + Workspaces

**Date**: 2026-02-27
**Research Question**: How to redesign the Prism bottom panel into a unified split-panel layout with Monitor↔Office toggle on the left, Workspaces on the right, and a draggable divider — while migrating the Pixel Office from the sidebar into the panel.

---

## Summary

The Prism VSCode extension currently has THREE separate webviews: Monitor (bottom panel tab), Workspaces (bottom panel tab), and Office (sidebar). The user wants to combine all into ONE unified "Prism" bottom panel tab with a split layout: [Monitor|Office toggle] | [draggable divider] | [Workspaces]. The user has provided a complete JSX prototype (`prism-panel.jsx`) and implementation guide (`prism-panel-implementation-prompt.md`) in `.prism/shared/ref/vscode-panel/`. The key insight is that the SVG-based simplified Office scene (not the full canvas engine) is what goes into the panel.

---

## Files Discovered

### Reference Materials (User-Provided)

| Path | Description |
|------|-------------|
| `.prism/shared/ref/vscode-panel/prism-panel.jsx` | Complete React JSX prototype of the target design (798 lines) |
| `.prism/shared/ref/vscode-panel/prism-panel-implementation-prompt.md` | Detailed implementation guide with architecture, component hierarchy, divider behavior, message types, migration steps |

### Current Extension Structure

| Path | Description |
|------|-------------|
| `cmd/prism-vscode/src/extension.ts` | Main extension activation — registers all three providers |
| `cmd/prism-vscode/src/hosts/vscode/MonitorViewProvider.ts` | Serves webview-panel with data-view="monitor" (373 lines) |
| `cmd/prism-vscode/src/hosts/vscode/WorkspacesViewProvider.ts` | Serves webview-panel with data-view="workspaces" (24KB, 612 lines) |
| `cmd/prism-vscode/src/hosts/vscode/OfficeViewProvider.ts` | Serves webview-office sidebar (21KB, full canvas engine) |
| `cmd/prism-vscode/package.json` | Contributes `prism.monitorView` and `prism.workspacesView` as panel tabs, `prism.officeView` in sidebar |

### Current Webview Apps

| Path | Description |
|------|-------------|
| `cmd/prism-vscode/webview-panel/` | Vite React app — MonitorView.tsx + WorkspacesView.tsx as separate routes via `data-view` attribute |
| `cmd/prism-vscode/webview-panel/src/main.tsx` | Routes on `data-view` attr: "monitor" → MonitorView, "workspaces" → WorkspacesView |
| `cmd/prism-vscode/webview-panel/src/views/MonitorView.tsx` | System health, execution history, quality gates, agent kanban (225 lines) |
| `cmd/prism-vscode/webview-panel/src/views/WorkspacesView.tsx` | Projects, stories, worktrees (197 lines) |
| `cmd/prism-vscode/webview-panel/src/components/` | StatusIcon, ProgressBar, KanbanBoard, AgentCard, DataTable, ProjectCard, WorktreeRow, NewWorktreeDialog |
| `cmd/prism-vscode/webview-panel/src/theme/panel.css` | VSCode CSS variables + Prism spectral colors |
| `cmd/prism-vscode/webview-office/` | Full canvas-based Pixel Office (separate React app, ~3000+ lines total) |
| `cmd/prism-vscode/webview-office/src/App.tsx` | Root: OfficeCanvas + EditorToolbar + ZoomControls + ToolOverlay + StoryLabels |
| `cmd/prism-vscode/webview-office/src/constants.ts` | Tile sizes, animation speeds, zoom settings, rendering constants |
| `cmd/prism-vscode/webview-office/src/office/` | Canvas engine: components/, editor/, engine/, layout/, sprites/ |

---

## Component Analysis

### 1. Current Panel Setup (TWO separate tabs)

**package.json** registers two views in `viewsContainers.panel["prism-panel"]`:
- `prism.monitorView` → served by `MonitorViewProvider` → loads `webview-panel` with `data-view="monitor"`
- `prism.workspacesView` → served by `WorkspacesViewProvider` → loads `webview-panel` with `data-view="workspaces"`

Each provider independently:
1. Reads `dist/webview-panel/index.html`
2. Injects `data-view="monitor"` or `data-view="workspaces"` into root div
3. Rewrites asset URLs with `asWebviewUri`
4. Injects CSP

**main.tsx** currently routes on `data-view` to render either `<MonitorView />` or `<WorkspacesView />`.

### 2. Office Sidebar (separate webview-office app)

The `OfficeViewProvider` serves `webview-office/` which is a completely separate React app with:
- **Canvas-based rendering**: `OfficeCanvas` component using HTML Canvas API
- **Full animation engine**: Character walk animations, agent seating logic, matrix effects
- **Editor mode**: Undo/redo, furniture placement, tile painting, rotation
- **Asset loading**: Sprite sheets, floor tiles, wall tiles, character sprites loaded via base64
- **Zoom/Pan**: Scroll-based zoom (1x-10x), pan controls
- **Agent management**: `agentManager.ts` handles spawn/kill/JSONL polling/terminal integration
- **Layout persistence**: JSON layout file, file watcher for cross-window sync

### 3. JSX Prototype Analysis (`prism-panel.jsx`)

The prototype implements the target design using:
- **Theme constants** (`T`): `#1a1d23` bg, `#3B82F6` blue, `#14B8A6` teal, `#22C55E` green, `#F59E0B` amber
- **SVG-based Office scene**: NOT canvas. Uses `<svg viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice">` with inline SVG primitives
- **PixelAgent**: SVG `<g>` with body rect, head rect, eyes, hair, status dot + pulse animation, name label, activity bubble
- **Furniture**: SVG-based `PixelDesk`, `PixelPlant`, `PixelServer` components
- **Zones**: DEVELOPMENT BAY, SERVER ROOM, PLANNING ZONE, BREAK ROOM, QUEUE — agents placed by `agent.zone` property
- **Root `PrismPanel`**: Single component with split layout, drag state, agent state
- **Draggable divider**: `dividerPos` state (default 55%), clamped 25%-80%, `window` mousemove/mouseup listeners while dragging
- **View toggle**: `leftView` state: "monitor" | "office", rendered in 32px header bar with ◈/⌂ icons
- **Status bar**: 22px bottom strip with "PRISM Idle", story count, project name

### 4. Message Types (from implementation guide)

**Webview → Extension:**
```typescript
| { type: 'dividerPositionChanged'; value: number }
| { type: 'viewToggleChanged'; value: 'monitor' | 'office' }
| { type: 'runQualityGate'; gate: string }
| { type: 'openProject'; projectId: string }
| { type: 'openWorktree'; worktreeId: string }
| { type: 'openStory'; storyId: string }
| { type: 'ready' }
```

**Extension → Webview:**
```typescript
| { type: 'initialState'; dividerPos: number; activeView: 'monitor' | 'office'; agents: Agent[]; stories: Story[]; project: Project; worktrees: Worktree[]; systemHealth: SystemHealth; executionHistory: ExecutionEntry[]; qualityGates: QualityGate[] }
| { type: 'agentsUpdated'; agents: Agent[] }
| { type: 'storiesUpdated'; stories: Story[] }
| { type: 'qualityGateResult'; gate: string; status: 'passed' | 'failed'; output?: string }
```

### 5. WorkspacesViewProvider Key Methods

- `discoverProjects()`: Scans sibling `.prism/` dirs + `~/.prism/workspaces.json`
- `getWorktrees()`: `git worktree list --porcelain` parsing
- `createWorktree()`: `git worktree add -b <branch> <path>`
- `deleteWorktree()`: `git worktree remove <path>` + optional branch delete
- File watchers: parent dir + `~/.prism/workspaces.json`
- Push pattern: `pushState()` → `postMessage({ type: 'workspacesState', state })`

---

## Architecture for the New Unified Panel

### What Changes

| Component | Current State | New State |
|-----------|--------------|-----------|
| `prism.monitorView` tab | Separate panel tab | **Removed** |
| `prism.workspacesView` tab | Separate panel tab | **Removed** |
| `prism.officeView` sidebar | Separate sidebar | **Removed** |
| `prism.mainView` tab | Does not exist | **New unified panel tab** |
| `MonitorViewProvider.ts` | Active | **Replaced by PrismPanelProvider** |
| `WorkspacesViewProvider.ts` | Active | **Merged into PrismPanelProvider** |
| `OfficeViewProvider.ts` | Active sidebar | **Removed** |
| `webview-panel/src/main.tsx` | Routes on data-view | **Renders `<PrismPanel>` directly** |
| `webview-panel/src/PrismPanel.tsx` | Does not exist | **New root component** |
| `webview-office/` | Separate app | **Stays (full engine still there), but sidebar removed** |

### New Webview Component Hierarchy

```
PrismPanel (root — replaces data-view routing)
├── TabBar (mimics VS Code bottom panel tabs — visual only)
├── MainContent (flex row, ref=containerRef)
│   ├── LeftPanel (width = dividerPos%)
│   │   ├── ViewToggleHeader (32px, with ◈Monitor / ⌂Office buttons)
│   │   ├── MonitorView (existing, shown when toggle="monitor")
│   │   └── OfficeView (new SVG-based, shown when toggle="office")
│   │       ├── OfficeScene (SVG 400x280 viewBox)
│   │       ├── PixelAgent components
│   │       └── PixelFurniture components (Desk, Plant, Server)
│   ├── DraggableDivider (5px, grip dots, hover hit target)
│   └── RightPanel (flex:1, minWidth:200px)
│       ├── WorkspacesHeader (32px)
│       └── WorkspacesView (existing)
└── StatusBar (22px, PRISM status, story count, project name)
```

### New Provider: `PrismPanelProvider.ts`

Merges all three providers:
- **Monitor logic**: quality gate execution (from MonitorViewProvider)
- **Workspaces logic**: project discovery, worktree management (from WorkspacesViewProvider)
- **Office logic**: receives agent state from controller and maps to SVG agent data (simplified from OfficeViewProvider)
- **Unified state**: sends `initialState` on webview ready, pushes diffs on changes
- **Persistence**: `context.workspaceState` for divider position + active view toggle

---

## Patterns Found

### Draggable Divider (from prototype `prism-panel.jsx:519-545`)
```typescript
const handleMouseDown = useCallback((e) => {
  e.preventDefault();
  setIsDragging(true);
}, []);
// attach to window while dragging:
window.addEventListener("mousemove", handleMouseMove);
window.addEventListener("mouseup", handleMouseUp);
// clamp: Math.min(80, Math.max(25, pct))
```

### View Toggle Header (from prototype `prism-panel.jsx:628-681`)
```tsx
{["monitor", "office"].map(view => (
  <button onClick={() => setLeftView(view)}
    style={{ background: leftView === view ? T.bgCard : "transparent" }}>
    <span>{view === "monitor" ? "◈" : "⌂"}</span>
    {view === "monitor" ? "Monitor" : "Office"}
  </button>
))}
```

### PixelAgent SVG Component (from prototype `prism-panel.jsx:29-76`)
- SVG `<g>` group with transform for positioning
- Status indicator circle at top-right of head
- `<animate>` element for active agent pulse ring
- Activity bubble: rounded rect + text

### Zone Assignment (from prototype `prism-panel.jsx:511-517`)
```typescript
{ id: "claude-1", name: "CLAUDE", color: T.amber, status: "active", zone: "dev", activity: "implementing" },
{ id: "claude-2", name: "REVIEW", color: T.teal, status: "thinking", zone: "dev", activity: "code review" },
{ id: "claude-3", name: "TEST", color: T.green, status: "waiting", zone: "planning" },
{ id: "claude-4", name: "DOCS", color: T.blue, status: "idle", zone: "break" },
{ id: "claude-5", name: "LINT", color: T.purple, status: "idle", zone: "queue" },
```
Zone derived from status: active/thinking → dev, waiting → planning, idle → break, unassigned → queue.

---

## Open Questions

1. Should the full `webview-office/` canvas engine remain in the codebase (for possible future reintroduction) or be deleted?
2. Should the `OfficeViewProvider` registration be fully removed from `extension.ts`, or just the sidebar view entry from `package.json`?
3. Does the SVG-based Office need to show the actual editor (furniture placement) or just the visualization?
4. Should the existing `MonitorViewProvider.ts` and `WorkspacesViewProvider.ts` be deleted or archived?
