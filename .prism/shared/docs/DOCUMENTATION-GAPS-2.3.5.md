# Documentation Gap Report — PRISM-DOCUMENTATION-2.3.5.md

**Date**: 2026-03-02
**Scope**: Parts III, IV, V
**Method**: Deep codebase analysis of `cmd/prism-vscode`, `cmd/prism-electron`, `packages/prism-core`, `packages/prism-ui`

---

## Root Cause

The documentation was written before the **Three-Package Split** was executed. That split extracted ~90 files from `cmd/prism-vscode/src/` and the webview apps into two new shared packages:

- `packages/prism-core/` (42 TypeScript files — platform-agnostic business logic)
- `packages/prism-ui/` (47+ TypeScript/CSS files — shared React components + office engine)

Both VSCode and Electron now consume these via `@prism-core/*` and `@prism-ui/*` path aliases. The docs still describe the pre-split monolithic layout.

---

# Part III — VS Code Extension (line 3737)

## Version & Metadata Updates

| Field | Doc Value (line 3761) | Correct Value |
|-------|----------------------|---------------|
| Version | 2.1.8 | **2.3.0** |
| Total commands (line 3753) | "24 commands" | **33 commands** |

The Extension Metadata table at line 3758 needs the version bumped. The "24 commands" claim at line 3753 should say "33 commands". All 33 are individually documented correctly in the commands section — only the summary count is wrong.

## Source Structure Rewrite (line 3843)

The entire source tree at lines 3846–3933 needs rewriting. Files have moved to packages. Here is the **actual current structure**:

### Files that NO LONGER exist under `cmd/prism-vscode/src/` (moved to `packages/prism-core/src/`):

| Documented path | New location |
|-----------------|-------------|
| `src/core/controller/prism/workflow.ts` | `packages/prism-core/src/core/controller/prism/workflow.ts` |
| `src/core/controller/prism/spectrum.ts` | `packages/prism-core/src/core/controller/prism/spectrum.ts` |
| `src/core/controller/prism/spectrum-runner.ts` | `packages/prism-core/src/core/controller/prism/spectrum-runner.ts` |
| `src/core/controller/prism/stories.ts` | `packages/prism-core/src/core/controller/prism/stories.ts` |
| `src/core/controller/prism/plugin-bridge.ts` | `packages/prism-core/src/core/controller/prism/plugin-bridge.ts` |
| `src/core/controller/prism/mode-bridge.ts` | `packages/prism-core/src/core/controller/prism/mode-bridge.ts` |
| `src/claude/runner.ts` | `packages/prism-core/src/claude/runner.ts` |
| `src/claude/parser.ts` | `packages/prism-core/src/claude/parser.ts` |
| `src/claude/events.ts` | `packages/prism-core/src/claude/events.ts` |
| `src/office/agentBridge.ts` | `packages/prism-core/src/office/agentBridge.ts` |
| `src/office/assetLoader.ts` | `packages/prism-core/src/office/assetLoader.ts` |
| `src/office/layoutPersistence.ts` | `packages/prism-core/src/office/layoutPersistence.ts` |
| `src/prism/stories.ts` | `packages/prism-core/src/prism/stories.ts` |
| `src/shared/PrismState.ts` | `packages/prism-core/src/shared/PrismState.ts` |
| `src/shared/types.ts` | `packages/prism-core/src/shared/types.ts` |
| `src/shared/PrismMessage.ts` | `packages/prism-core/src/shared/PrismMessage.ts` |
| `src/core/prompts/system.ts` | `packages/prism-core/src/core/prompts/system-prompt.ts` (renamed) |

### Files that NO LONGER exist under `webview-ui/src/` (moved to `packages/prism-ui/src/`):

| Documented path | New location |
|-----------------|-------------|
| `webview-ui/src/ChatView.tsx` | `packages/prism-ui/src/views/ChatView.tsx` |
| `webview-ui/src/SpectrumView.tsx` | `packages/prism-ui/src/views/SpectrumView.tsx` |
| `webview-ui/src/WelcomeView.tsx` | `packages/prism-ui/src/components/WelcomeView.tsx` |
| `webview-ui/src/PhaseIndicator.tsx` | `packages/prism-ui/src/components/workflow/PhaseIndicator.tsx` |
| `webview-ui/src/ChatRow.tsx` / `ToolRow.tsx` | `packages/prism-ui/src/components/chat/ChatRow.tsx` / `ToolRow.tsx` |
| `webview-ui/src/MarkdownBlock.tsx` | `packages/prism-ui/src/components/common/MarkdownBlock.tsx` |
| `webview-ui/src/SpectrumControls.tsx` | `packages/prism-ui/src/components/spectrum/SpectrumControls.tsx` |
| `webview-ui/src/StoryList.tsx` | `packages/prism-ui/src/components/spectrum/StoryList.tsx` |
| `webview-ui/src/PrismStateContext.tsx` | `packages/prism-ui/src/context/PrismStateContext.tsx` |
| `webview-ui/src/services/grpc-client.ts` | `packages/prism-ui/src/services/grpc-client.ts` |
| `webview-ui/src/services/grpc-client-base.ts` | `packages/prism-ui/src/services/grpc-client-base.ts` |

### Files that NO LONGER exist under `webview-panel/src/` (moved to `packages/prism-ui/src/office/`):

| Documented path | New location |
|-----------------|-------------|
| `webview-panel/src/OfficeCanvas.tsx` | `packages/prism-ui/src/office/components/OfficeCanvas.tsx` |
| `webview-panel/src/engine/` | `packages/prism-ui/src/office/engine/` |
| `webview-panel/src/office/editor/` | `packages/prism-ui/src/office/editor/` |
| `webview-panel/src/sprites/` | `packages/prism-ui/src/office/sprites/` |
| `webview-panel/src/layout/` | `packages/prism-ui/src/office/layout/` |

### What `webview-ui/src/` actually contains now (thin shell):

```
webview-ui/src/
├── main.tsx            # React root
├── App.tsx             # View switcher (imports from @prism-ui)
├── Providers.tsx        # PrismStateContextProvider wrapper
├── vscode.ts           # VSCode postMessage transport adapter
├── lib/utils.ts         # Utilities
├── index.css
└── theme/
    ├── spectral.css
    └── theme.css
```

## Undocumented Additions to Part III

### 1. `webview-office/` — Third Webview App

A separate webview app exists at `cmd/prism-vscode/webview-office/` that is not listed in the Part III source structure. It has its own `package.json`, `vite.config.ts`, `tsconfig.json`. Uses React 19.2.4, Vite 6.4.1, runs on dev port 5174. Sets up `OfficeApp` via `@prism-ui` with a VSCode `postMessage` transport layer.

### 2. `src/core/task/` — Task Execution Subsystem (10 files)

Entirely undocumented. The docs mention `src/core/task/` as a directory but describe none of its contents:

```
src/core/task/
├── index.ts              # Task module entry
├── task-state.ts         # Task state management
├── message-state.ts      # Message state management
└── tools/
    ├── coordinator.ts    # Tool coordinator
    ├── types.ts          # Tool type definitions
    └── handlers/
        ├── read-file.ts
        ├── write-file.ts
        ├── edit-file.ts
        ├── execute-command.ts
        ├── search-files.ts
        ├── list-files.ts
        ├── ask-followup.ts
        └── attempt-completion.ts
```

### 3. `src/office/fileWatcher.ts`

249-line VSCode-specific JSONL file watcher for Office agent terminals. Not documented.

### 4. `assets/` Directory

Office game assets at `cmd/prism-vscode/assets/`: 6 character PNGs (`char_0.png`–`char_5.png`), `floors.png`, `walls.png`, `default-layout.json`, and `furniture/` with 33 furniture PNGs + `furniture-catalog.json`. Copied to `dist/assets/` via esbuild.

### 5. Walkthroughs

`package.json` defines a walkthrough `prism.gettingStarted` with 4 steps (welcome, init-prism, configure-claude, first-research). Not mentioned in docs.

### 6. Test Files

4 test files under `src/` that import from `@prism-core/`:
- `src/core/controller/prism/__tests__/workflow.test.ts`
- `src/prism/__tests__/signals.test.ts`
- `src/prism/__tests__/stories.test.ts`
- `src/prism/__tests__/progress.test.ts`

### 7. Build Config Note

`esbuild.mjs` now has `@prism-core` alias pointing to `../../packages/prism-core/src`. The `jest.config.js` has stale `collectCoverageFrom` referencing files that no longer exist locally.

## Technology Stack Update (line 4359)

| Component | Doc Value | Correct Value |
|-----------|-----------|---------------|
| Extension version in stack diagram | 2.1.8 | **2.3.0** |
| Vite (all webviews) | not specified | **6.4.1** |
| webview-office React | not listed | **React 19.2.4** |
| webview-office port | not listed | **5174** |

---

# Part IV — Electron Desktop App (line 4416)

## Dependency Version Corrections

| Dependency | Doc Value (line 4460–4468) | Correct Value |
|------------|---------------------------|---------------|
| TypeScript | 4.5 | **5.4.5** |
| Vite | 5.4 | **6.0.0** |
| React (webview-ui) | 19 (implied from root) | **18.3.1** (root has 19, but webview-ui pins 18) |

Electron 40, Tailwind 4.2, chokidar, uuid, electron-forge are all correct.

## Alias Strategy Update (line 4622)

The import strategy section claims `@prism-core/*` maps to `../prism-vscode/src/*`. The actual mapping is now **dual-path fallback**:

```json
// tsconfig.json — actual
{
  "paths": {
    "@prism-core/*": ["../../packages/prism-core/src/*", "../prism-vscode/src/*"]
  }
}
```

The Vite config (`vite.main.config.mts`) implements the same dual resolution via a custom `prismCoreAliasPlugin()` that checks `packages/prism-core/src` first, then falls back to `../prism-vscode/src`.

Additionally, a **new `@prism-ui/*` alias system** exists (entirely undocumented):
- `webview-ui/tsconfig.json` maps `@prism-ui/*` → `../../../packages/prism-ui/src/*`
- `webview-ui/vite.config.ts` and `vite.renderer.config.mts` both set up the same alias

## Source Structure Rewrite (line 4564)

### Line Count Corrections

| File | Doc Claims | Actual Lines |
|------|-----------|-------------|
| `src/main.ts` | 65 | **111** |
| `src/preload.ts` | 22 | **62** |
| `src/window-state.ts` | 50 | **58** |
| `src/hosts/electron/ElectronIPCBridge.ts` | 80 | **511** |
| `src/hosts/electron/ElectronPrismController.ts` | ~650 | **45** |

The controller shrank because logic was extracted to `BasePrismController` in `packages/prism-core/`. The IPC bridge grew because it absorbed 25+ new IPC handlers.

### `src/prism/` Directory Is Empty

The 3 files documented under `src/prism/` (config.ts, watcher.ts, init.ts) moved to `packages/prism-core/src/prism/`. Their actual line counts there: config.ts=79 (doc said 45), watcher.ts=72 (doc said 55), init.ts=50 (doc said 40).

### `webview-ui/src/` Components Moved

The doc claims views/, services/, context/ exist locally. They all moved to `packages/prism-ui/` and are consumed via `@prism-ui/*`. The `components/chat/`, `components/spectrum/`, `components/workflow/` dirs don't exist locally either.

## Undocumented Additions to Part IV

### 1. `src/auth/ElectronSecretStorage.ts` (102 lines)

Implements `SecretStore` interface using Electron's `safeStorage` API (OS-level encryption). Stores secrets at `<userData>/prism-secrets.enc`. Has plaintext fallback for headless/CI.

### 2. `src/office/` Directory (692 lines combined)

Two substantial undocumented modules:

| File | Lines | Description |
|------|-------|-------------|
| `ElectronAgentManager.ts` | 386 | Spawns Claude CLI processes, watches JSONL transcripts, forwards agent activity via `office:message` IPC |
| `ElectronOfficeProvider.ts` | 306 | Orchestrates office subsystem: loads assets, manages agent lifecycle, dispatches messages, subscribes to controller events, watches layout file |

### 3. `webview-ui/src/office/electronOfficeTransport.ts` (36 lines)

Wires shared canvas office to Electron's contextBridge IPC: outgoing via `window.electronAPI.officeAction`, incoming via `window.electronAPI.officeMessage`.

### 4. IDE Shell Layout Components

Entirely new `webview-ui/src/components/layout/` directory (8 files):

| Component | Lines | Description |
|-----------|-------|-------------|
| `ActivityBar.tsx` | 200 | Vertical icon bar (left rail) |
| `AppShell.tsx` | 178 | Top-level IDE layout shell |
| `BottomPanel.tsx` | 211 | Collapsible bottom panel area |
| `BottomStatusBar.tsx` | 101 | Status bar at bottom |
| `ContentRail.tsx` | 138 | Content panel for tree views |
| `FloatingChatPill.tsx` | 63 | Floating chat trigger button |
| `HeaderBar.tsx` | 392 | Top header with phase buttons |
| `TabBar.tsx` | 164 | Tab bar for editor area |

### 5. Panel Components

New `webview-ui/src/components/panels/` directory (6 files):

| Component | Description |
|-----------|-------------|
| `FilesPanel.tsx` | File tree panel |
| `GitPanel.tsx` | Git status panel |
| `MonitorPanel.tsx` | Quality gates panel |
| `SpectrumPanel.tsx` | Spectrum execution panel |
| `StoriesPanel.tsx` | Stories list panel |
| `WorkspacePanel.tsx` | Workspace management panel |

### 6. New View Components

New `webview-ui/src/views/` directory (3 files):

| View | Lines | Description |
|------|-------|-------------|
| `FileContentView.tsx` | 215 | File content viewer with syntax highlighting via `prism:readFile` IPC |
| `GitGraphView.tsx` | 309 | Visual git commit graph via `prism:gitLog` / `prism:gitBranchInfo` IPC |
| `StoryDetailView.tsx` | 291 | Story details with progress bars, steps, file lists |

### 7. Layout State Management

`webview-ui/src/context/LayoutContext.tsx` (233 lines) — Full layout state management (reducer pattern) for the IDE shell: left/right panels, tab system, bottom panel, collapse state, persisted via IPC.

### 8. New Preload Methods

`preload.ts` now includes two additional IPC methods:
- `officeMessage(callback)` — subscribe to office messages from main process
- `officeAction(msg)` — send office actions to main process

### 9. New IPC Handlers in ElectronIPCBridge

The bridge grew from 80 to 511 lines. Undocumented handlers:

| Channel | Purpose |
|---------|---------|
| `shell:openExternal` | Open URLs in default browser |
| `prism:readFile` | Read file content (with path traversal protection) |
| `prism:gitStatus` | Git status via child_process |
| `prism:gitLog` | Git log with formatted output |
| `prism:gitBranchInfo` | Branch + ahead/behind info |
| `prism:fileTree` | Recursive file tree (depth-limited) |
| `prism:saveLayoutState` / `prism:loadLayoutState` | Layout persistence |
| `prism:discoverProjects` | Workspace discovery |
| `prism:addWorkspace` / `prism:browseAndAddWorkspace` | Workspace management |
| `prism:listWorktrees` / `prism:createWorktree` / `prism:deleteWorktree` | Worktree management |
| `prism:switchProject` | Switch active project directory |
| `prism:executeGate` / `prism:cancelGate` | Quality gate execution with AbortController |
| `prism:getResearch` / `prism:getPlans` | Research/plan file discovery |
| `prism:getApiKey` / `prism:setApiKey` / `prism:deleteApiKey` / `prism:validateApiKey` | API key management |

### 10. Forge Config Addition

`forge.config.ts` includes `extraResource: ['../prism-vscode/assets']` to bundle office assets (character sprites, floor/wall tiles, furniture) from the VSCode extension directory.

### 11. Webview Dev Server Port

`webview-ui/vite.config.ts` sets port **5174**. Not documented anywhere.

---

# Part V — Monorepo Architecture (line 5352)

## packages/prism-core (line 5396)

### Corrections

| Issue | Doc says | Correct |
|-------|----------|---------|
| Auth interface name (line 5408) | `ISecretStorage` adapter | **`SecretStore`** (at `src/core/api/auth.ts:12`) |
| `src/prism/` description (line 5411) | "Spectrum signal protocol constants" | **7 files**: signals.ts, types.ts, stories.ts, progress.ts, config.ts, init.ts, watcher.ts |
| `src/claude/` description (line 5410) | "Claude event types and JSONL parser" | **Also contains `runner.ts`** — 443-line ClaudeRunner class |
| `src/core/controller/` description (line 5409) | Lists 4 items | **Missing 5 files**: StoriesManager, PluginBridge, SpectrumRunner, ModeBridge, types.ts |

### Expanded Contents Table

Replace the contents table at line 5405 with:

| Directory | Files | Description |
|-----------|-------|-------------|
| `src/shared/` | `types.ts`, `PrismMessage.ts`, `PrismState.ts` | `WorkflowPhase` enum, `WORKFLOW_PHASE_COLORS`, `WORKFLOW_PHASE_LABELS`, GrpcRequest/Response types, `PrismExtensionState`, `DEFAULT_PRISM_STATE` |
| `src/core/api/` | `types.ts`, `auth.ts` | Stream chunk types, conversation message types, tool definitions, UI chat types; `SecretStore` interface, API key helpers |
| `src/core/controller/` | `BasePrismController.ts`, `grpc-handler.ts`, `types.ts` | Abstract base controller (866 lines, extends EventEmitter), transport-agnostic gRPC handler with `registerUnary`/`registerStream`/`clearHandlers`, `PostMessageFn`/`AgentSessionData`/`UpdatedStoryData` types |
| `src/core/controller/prism/` | `workflow.ts`, `spectrum.ts`, `spectrum-runner.ts`, `stories.ts`, `plugin-bridge.ts`, `mode-bridge.ts` | `WorkflowStateMachine`, `SpectrumEngine`, `SpectrumRunner`, `StoriesManager`, `PluginBridge` (with `SKILL_MAP`, `WORKFLOW_SKILLS`), `ModeBridge` (with `detectSkillTrigger()`) |
| `src/core/prompts/` | `system-prompt.ts`, `phase-research.ts`, `phase-plan.ts`, `phase-implement.ts`, `phase-validate.ts` | `buildSystemPrompt()` function, per-phase instruction constants |
| `src/claude/` | `events.ts`, `parser.ts`, `runner.ts` | Stream event types, `OutputParser` class with signal/tool/phase detection, `ClaudeRunner` class (443 lines — CLI process spawner, prompt builders, `checkClaudeCli()`) |
| `src/prism/` | `signals.ts`, `types.ts`, `stories.ts`, `progress.ts`, `config.ts`, `init.ts`, `watcher.ts` | Signal parsing (`parseSignal`, `containsSignal`), domain model (`Plan`, `Story`, `StoriesFile`), story file I/O + queries, `ProgressFile` class, `PrismConfig` + directory detection, `.prism/` initialization, `PrismWatcher` (chokidar) |
| `src/office/` | `agentBridge.ts`, `assetLoader.ts`, `layoutPersistence.ts`, `transcriptParser.ts`, `timerManager.ts`, `types.ts`, `constants.ts` | `AgentBridge`, asset loading functions, layout read/write/watch, JSONL transcript processing, agent timer management, `PostMessageFn`/`AgentState`/`PersistedAgent` types, 31 timing/display/parsing constants |
| `src/workspace/` | `types.ts`, `discovery.ts`, `worktrees.ts`, `qualityGates.ts`, `research.ts`, `plans.ts` | `ProjectInfo`/`WorktreeInfo`/`EpicInfo` types, project discovery (50-entry cap, git timeouts), worktree create/delete, gate execution with `AbortSignal`, research/plans file discovery with frontmatter parsing |

### Infrastructure Notes to Add

- `package.json` declares `"main": "src/index.ts"` and `"types": "src/index.ts"` but **`src/index.ts` does not exist** — this should be created or the declarations removed
- `tsconfig.json` has `noEmit: true` — no compiled output is produced, no `dist/` directory exists
- Dependencies: `uuid`, `chokidar`, `pngjs`
- DevDependencies: `typescript`, `@types/node`, `@types/uuid`, `@types/pngjs`
- Scripts: `build` and `typecheck` both run `tsc --noEmit`
- Zero test files across 42 source files

---

## packages/prism-ui (line 5436)

### Corrections

| Issue | Doc says | Correct |
|-------|----------|---------|
| Path alias (line 5441) | `../../packages/prism-ui/src/*` | **`../../../packages/prism-ui/src/*`** (consumers are 3 levels deep) |
| `src/components/chat/` (line 5448) | ChatView, ChatMessage, ChatInput, ChatScrollButton, FloatingSpectrumPill | **Actual: ChatRow.tsx, ChatTextArea.tsx, ToolRow.tsx** (3 files) |
| `src/components/spectrum/` (line 5449) | SpectrumPanel, PhaseProgress, StoryCard, StoryItem, StoryList, SpectrumStatus | **Actual: SpectrumControls.tsx, ProgressBar.tsx, StoryList.tsx, ActivityLog.tsx, SignalStatus.tsx** (5 files) |
| `src/components/views/` (line 5450) | WelcomeView, ResearchView, PlansView | **Directory does not exist.** WelcomeView is at `src/components/WelcomeView.tsx`. ResearchView and PlansView **do not exist anywhere.** |
| `src/hooks/` (line 5451) | useGrpcClient, useMessages | **Directory does not exist.** Neither hook exists anywhere in the package. |

### Expanded Contents Table

Replace the contents table at line 5445 with:

| Directory | Files | Description |
|-----------|-------|-------------|
| `src/context/` | `PrismStateContext.tsx` | `PrismStateContextProvider`, `usePrismState` hook, re-exports all state types |
| `src/transport/` | `types.ts` | `WebviewTransport` interface (postMessage, getState, setState) |
| `src/services/` | `grpc-client-base.ts`, `grpc-client.ts` | `ProtoBusClient` abstract class with `WebviewTransport` injection, unary + streaming; 6 concrete clients: StateService, UiService, WorkflowService, ChatService, PluginService, SpectrumService |
| `src/views/` | `ChatView.tsx`, `SpectrumView.tsx` | Main chat interface (Virtuoso virtual scrolling, phase indicator, suggestion chips), Spectrum dashboard (controls, progress, stories, signals, activity log) |
| `src/components/` | `WelcomeView.tsx` | Onboarding / first-run view when `.prism/` not detected |
| `src/components/common/` | `MarkdownBlock.tsx` | react-markdown renderer with remark-gfm, rehype-highlight, custom overrides for code blocks, tables, links |
| `src/components/chat/` | `ChatRow.tsx`, `ChatTextArea.tsx`, `ToolRow.tsx` | Message type dispatcher (user/assistant/tool_use/tool_result/completion/error), auto-resizing input with Enter-to-send, tool use + result row renderers |
| `src/components/workflow/` | `PhaseIndicator.tsx` | Phase indicator (icon + label + animated dots) and `PhaseTransition` buttons |
| `src/components/spectrum/` | `SpectrumControls.tsx`, `ProgressBar.tsx`, `StoryList.tsx`, `ActivityLog.tsx`, `SignalStatus.tsx` | Start/Pause/Resume/Stop/Skip buttons, animated spectral gradient bar, compact story list with status icons, timestamped log with auto-scroll, signal badge + error count |
| `src/styles/` | `bridge.css`, `tokens.ts` | 342-line CSS variable bridge (`[data-platform="vscode"]` / `[data-platform="electron"]`), typed `PRISM_TOKENS` constant + `PrismPlatform` type |
| `src/office/` | `OfficeApp.tsx`, `OfficeErrorBoundary.tsx`, `transport.ts`, `types.ts`, `office-constants.ts`, `colorize.ts`, `floorTiles.ts`, `wallTiles.ts`, `toolUtils.ts`, `notificationSound.ts` | Top-level office component, error boundary with retry, `OfficeTransport` interface (setter/getter), all type defs (`SpriteData = string[][]`, `Character`, `OfficeLayout`, `EditTool`, etc.), 117 lines of game constants, sprite HSL colorization, tile data, tool status mapping, Web Audio notifications |
| `src/office/engine/` | `officeState.ts`, `gameLoop.ts`, `renderer.ts`, `characters.ts`, `matrixEffect.ts` | `OfficeState` class (layout, characters, tiles, seats), rAF loop, canvas tile/character rendering, character FSM + BFS pathfinding, spawn/despawn visual effect |
| `src/office/sprites/` | `spriteData.ts`, `spriteCache.ts` | Hand-drawn sprite arrays (string[][]), render cache |
| `src/office/layout/` | `furnitureCatalog.ts`, `layoutSerializer.ts`, `tileMap.ts` | Furniture catalog + metadata, layout-to-tile conversion, walkability + BFS pathfinding |
| `src/office/editor/` | `EditorToolbar.tsx`, `editorActions.ts`, `editorState.ts` | UI toolbar for edit mode, paint/place/remove/move/rotate actions, editor state management |
| `src/office/hooks/` | `useExtensionMessages.ts`, `useEditorActions.ts`, `useEditorKeyboard.ts` | Extension-to-office message bridge, editor action handlers, keyboard shortcuts in edit mode |
| `src/office/components/` | `OfficeCanvas.tsx`, `ToolOverlay.tsx` | Main canvas element, HTML overlay for tool activity display |
| `src/office/components/ui/` | `AgentLabels.tsx`, `ZoomControls.tsx`, `BottomToolbar.tsx`, `SettingsModal.tsx`, `DebugView.tsx`, `StoryLabels.tsx` | Agent name labels, zoom +/- buttons, bottom action bar, settings dialog, debug info panel, story context labels |
| `src/office/fonts/` | `FSPixelSansUnicode-Regular.ttf` | Pixel font for office UI |

### Infrastructure Notes to Add

- `package.json` declares `"main": "src/index.ts"` and `"types": "src/index.ts"` but **`src/index.ts` does not exist**
- Dependencies: `react-markdown`, `react-virtuoso`, `rehype-highlight`, `remark-gfm`, `highlight.js`, `class-variance-authority`, `clsx`, `lucide-react`, `tailwind-merge`, `uuid`
- Peer deps: `react`, `react-dom`
- Scripts: `typecheck` runs `tsc --noEmit`
- Zero test files, no Storybook

---

## Additional Part V Sections Needing Updates

### Platform Shell Responsibilities Table (line 5488)

This table is correct but should add a row for **Secret storage**:

| Responsibility | VS Code | Electron |
|----------------|---------|----------|
| Secret storage | `vscode.SecretStorage` | `safeStorage` (`ElectronSecretStorage`) |

(This row appears in the doc but was easy to miss as correct.)

### Development Workflow Section (line 5501)

The npm commands are correct. No changes needed.

### Production Hardening Section (line 5521)

This section references `ElectronAgentManager` and mentions JSONL detection timeout, quality gate cancellation, workspace discovery caps — all correct. However, the section heading says "v2.4.0" but the document title is "v2.3.5". Consider aligning these.

### Feature Parity Table (line 4393)

The CLI ↔ Extension ↔ Electron feature parity table at lines 4393–4413 in Part III should be updated:
- The Electron column shows "— (deferred)" for many features that now have implementations (Workspaces, Monitor, Git, Files) via the new panel components and IPC handlers
- Office is listed as "— (out of scope)" for Electron but a full office subsystem now exists (`ElectronAgentManager`, `ElectronOfficeProvider`, `electronOfficeTransport`)

---

## Summary of All Changes by Priority

### Critical (structural accuracy)
1. Rewrite Part III source tree to reflect package split
2. Rewrite Part IV source tree to reflect package split
3. Expand Part V `prism-core` contents table (currently 7 rows → should be ~10 with full file lists)
4. Fix Part V `prism-ui` contents table (wrong component names, nonexistent directories)
5. Update `@prism-core/*` alias to show dual-path fallback
6. Add `@prism-ui/*` alias documentation

### Important (version/count corrections)
7. Version 2.1.8 → 2.3.0
8. Command count 24 → 33
9. TypeScript 4.5 → 5.4.5 (Electron)
10. Vite 5.4 → 6.0.0 (Electron)
11. Electron webview-ui React 19 → 18 (root has 19, webview-ui pins 18)
12. Fix line counts for ElectronIPCBridge (80→511) and ElectronPrismController (~650→45)
13. Fix `ISecretStorage` → `SecretStore`
14. Fix path alias depth (`../../` → `../../../`)

### Additions (new undocumented features)
15. Document `webview-office/` as third webview app (Part III)
16. Document `src/core/task/` subsystem — 10 files (Part III)
17. Document `src/auth/ElectronSecretStorage.ts` (Part IV)
18. Document `src/office/` Electron subsystem — 692 lines (Part IV)
19. Document IDE shell layout components — 8 files (Part IV)
20. Document panel components — 6 files (Part IV)
21. Document new view components — 3 files (Part IV)
22. Document LayoutContext.tsx (Part IV)
23. Document 25+ new IPC handlers in ElectronIPCBridge (Part IV)
24. Document `src/core/prompts/` — 5 files (Part V prism-core)
25. Document `src/claude/runner.ts` (Part V prism-core)
26. Document full `src/prism/` contents — 7 files (Part V prism-core)
27. Document full office sub-structure in prism-ui — 30+ files (Part V prism-ui)
28. Update feature parity table — Electron now has Workspaces, Monitor, Git, Files, Office

### Cleanup
29. Fix or remove missing `src/index.ts` references in both packages
30. Note stale `jest.config.js` coverage paths in VSCode extension
31. Align "v2.4.0" Production Hardening header with "v2.3.5" doc version
