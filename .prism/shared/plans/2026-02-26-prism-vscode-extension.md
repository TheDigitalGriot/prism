---
date: 2026-02-26T00:00:00Z
planner: Claude
repository: prism-plugin
branch: main
feature: "Prism VS Code Extension"
tags: [plan, vscode, extension, typescript, react, webview]
status: draft
last_updated: 2026-02-26
last_updated_by: Claude
research: .prism/shared/research/2026-02-26-prism-vscode-extension-architecture.md
---

# Implementation Plan: Prism VS Code Extension

## Goal

Build a full-featured VS Code extension at `cmd/prism-vscode/` that delivers the Prism 4-phase development workflow (Research → Plan → Implement → Validate), Spectrum autonomous execution, and a Cline-quality chat interface — serving as the IDE-first companion to the existing terminal-first Prism CLI.

## Key Decisions

| Decision | Choice | Impact |
|----------|--------|--------|
| AI Connection | **Hybrid** — Claude Agent SDK for interactive chat, `claude` CLI subprocess for Spectrum | Best of both worlds: rich streaming for chat, full plugin support for Spectrum |
| Feature Scope | **Full chat + Prism workflow** — Cline-quality chat with tool visualization, approval flows, markdown rendering, plus all Prism workflow features | Polished product from v1 |
| Plugin Compatibility | **Reuse Prism plugin** — Extension spawns Claude sessions that load existing skills/commands/agents | No logic duplication, single source of truth for workflow |
| Working Directory | `cmd/prism-vscode/` | Parallel to `cmd/prism-cli/` and `cmd/prism-electron/` |

## What We're NOT Doing

- Not forking Cline wholesale (too much baggage) — we adapt proven patterns into a clean implementation
- Not supporting 42 API providers — Claude only via Agent SDK
- Not reimplementing the Prism workflow logic — we reuse the existing Claude Code plugin
- Not building a standalone app — this is VS Code only
- Not replacing the CLI — this is a complementary tool for IDE-first users
- Not building MCP server management UI — we'll support MCP but not a full config UI in v1
- Not implementing Cline's checkpoint/diff system in v1

---

## Phase 1: Foundation & Scaffold

**Goal**: Working VS Code extension that activates, registers a sidebar webview, and renders a React "Hello Prism" page with proper IPC bridge.

### Phase 1.1: Project Scaffold

- [x] Initialize `cmd/prism-vscode/` with `yo code` (TypeScript extension)
- [x] Set up `package.json` with extension manifest:
  - `activationEvents`: `["onView:prism-sidebar", "onStartupFinished"]`
  - `viewsContainers.activitybar`: Prism icon entry
  - `views.prism-sidebar`: Main sidebar view
  - `commands`: `prism.openSidebar`, `prism.research`, `prism.plan`, `prism.implement`, `prism.validate`, `prism.spectrum`
- [x] Set up TypeScript config (`tsconfig.json`) targeting ES2022, Node module resolution
- [x] Set up esbuild config (`esbuild.mjs`) for extension bundling (adapt from Cline)
- [x] Set up `.vscodeignore` to exclude source files from VSIX package

**Files to create**:
```
cmd/prism-vscode/
├── package.json
├── tsconfig.json
├── esbuild.mjs
├── .vscodeignore
└── .gitignore
```

### Phase 1.2: Extension Host Entry Point

- [x] Create `src/extension.ts` with `activate()` / `deactivate()` lifecycle
- [x] Register `PrismSidebarProvider` as a `WebviewViewProvider`
- [x] Register initial commands (placeholders)
- [x] Detect `.prism/` directory in workspace
- [x] Set extension context for conditional UI (`prism.hasPrismDir`, `prism.hasStoriesJson`)

**Files to create**:
```
src/
├── extension.ts
└── core/
    └── webview/
        └── WebviewProvider.ts      # Abstract base (adapted from Cline pattern)
```

### Phase 1.3: Webview UI Scaffold

- [x] Initialize `webview-ui/` with React 18, Vite, TypeScript
- [x] Install and configure: `tailwindcss`, `@tailwindcss/vite`, `shadcn/ui` components
- [x] Create `theme.css` with VS Code CSS variable mappings (from Cline) + Prism spectral colors
- [x] Create `App.tsx` with basic view routing
- [x] Create `PrismProviders.tsx` with `PrismStateContextProvider`
- [x] Verify hot-reload works in development via Vite dev server

**Files to create**:
```
webview-ui/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.mjs
├── components.json          # shadcn/ui config
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── Providers.tsx
    ├── index.css
    ├── main.css
    ├── theme/
    │   ├── theme.css         # VS Code variables + Prism spectral colors
    │   └── spectral.css      # Prism gradient system
    └── lib/
        └── utils.ts          # cn() helper (clsx + tailwind-merge)
```

### Phase 1.4: IPC Bridge

- [x] Define Prism proto/message types in `src/shared/`:
  - `PrismMessage.ts` — `grpc_request` / `grpc_response` types
  - `PrismState.ts` — `PrismExtensionState` interface (workflow phase, stories, chat messages, config)
- [x] Create `src/core/controller/grpc-handler.ts` — request dispatcher (adapted from Cline)
- [x] Create `webview-ui/src/services/grpc-client-base.ts` — `ProtoBusClient` (adapted from Cline)
- [x] Create initial service definitions:
  - `StateService` — `subscribeToState`, `getState`
  - `UiService` — `initializeWebview`
- [x] Wire up: webview `postMessage` → extension host handler → state broadcast → webview subscription
- [x] Verify round-trip: webview sends init → host responds with state → webview renders state

**Files to create**:
```
src/shared/
├── PrismMessage.ts           # Message types (grpc_request/response)
├── PrismState.ts             # Extension state interface
└── types.ts                  # Shared enums, workflow phase types

src/core/controller/
├── index.ts                  # PrismController
├── grpc-handler.ts           # Request dispatcher
└── state/
    └── subscribeToState.ts   # State subscription handler

src/hosts/vscode/
└── VscodeWebviewProvider.ts  # VS Code webview implementation

webview-ui/src/
├── services/
│   ├── grpc-client-base.ts   # ProtoBusClient base class
│   └── grpc-client.ts        # Generated/manual service clients
└── context/
    └── PrismStateContext.tsx  # Central state management
```

### Phase 1 Verification

**Automated**:
- [x] `npm run compile` — extension builds without errors
- [x] `npm run build:webview` — webview builds without errors
- [ ] Extension activates in Extension Development Host

**Manual**:
- [ ] Prism icon appears in activity bar
- [ ] Sidebar shows React webview with "Hello Prism" and spectral gradient
- [ ] State round-trip verified in console (webview init → host state → webview update)

---

## Phase 2: Prism Core Services

**Goal**: Extension detects and manages `.prism/` directory, parses stories.json, tracks workflow state, watches for file changes.

### Phase 2.1: .prism/ Directory Integration

- [x] Create `src/prism/config.ts` — detect `.prism/` in workspace root
- [x] Create `src/prism/init.ts` — initialize `.prism/` directory structure (port `init_prism.py` logic)
- [x] Create `src/prism/watcher.ts` — file system watcher for `.prism/` changes:
  - Watch `stories.json` for status updates
  - Watch `shared/research/` for new research docs
  - Watch `shared/plans/` for new/updated plans
  - Watch `shared/validation/` for validation reports
  - Watch `shared/spectrum/progress.md` for progress updates
- [x] Emit VS Code events on file changes → update extension state

**Files to create**:
```
src/prism/
├── config.ts                 # .prism/ detection and path resolution
├── init.ts                   # Directory initialization
└── watcher.ts                # FileSystemWatcher setup
```

### Phase 2.2: Domain Models (Port from CLI)

- [x] Create `src/prism/stories.ts` — stories.json parser:
  - `Story`, `Plan`, `StoryFile`, `Step` interfaces (match CLI's `domain/story.go`)
  - `loadStories()`, `saveStories()`, `getNextStory()`, `updateStoryStatus()`
  - Dependency resolution (`blockedBy` field)
  - Epic support (nested directories)
- [x] Create `src/prism/signals.ts` — signal protocol parser:
  - Parse `<promise>COMPLETE</promise>`, `<spectrum-continue>`, `<spectrum-retry>`, `<spectrum-blocked>`, `<spectrum-error>`
  - Priority ordering (Complete > Error > Retry > Blocked > Continue)
  - Same regex patterns as CLI's `domain/signals.go`
- [x] Create `src/prism/progress.ts` — progress.md management:
  - Create/read/update progress files
  - Parse YAML frontmatter
  - Derive progress path from stories path (flat vs epic)

**Files to create**:
```
src/prism/
├── stories.ts                # stories.json CRUD + dependency resolution
├── signals.ts                # Signal protocol parser
└── progress.ts               # progress.md management
```

### Phase 2.3: Workflow State Machine

- [x] Create `src/core/controller/prism/workflow.ts` — 4-phase state machine:
  ```typescript
  enum WorkflowPhase { Idle, Research, Plan, Implement, Validate }
  enum WorkflowTransition { StartResearch, StartPlan, StartImplement, StartValidate, Complete, Reset }
  ```
  - Track current phase, active plan, active story
  - Phase transition validation (Research → Plan → Implement → Validate)
  - Phase-specific context (which research doc, which plan, which stories)
  - Emit state changes to webview via state subscription
- [x] Integrate workflow state into `PrismExtensionState`

**Files to create**:
```
src/core/controller/prism/
├── workflow.ts               # Workflow state machine
├── spectrum.ts               # Spectrum execution state (placeholder for Phase 5)
└── stories.ts                # Stories state management
```

### Phase 2 Verification

**Automated**:
- [x] Unit tests for stories.ts (load, save, dependency resolution, next story selection)
- [x] Unit tests for signals.ts (all signal types, priority ordering, edge cases)
- [x] Unit tests for workflow.ts (phase transitions, invalid transitions rejected)

**Manual**:
- [ ] Extension detects existing `.prism/` directory
- [ ] File changes in `.prism/` trigger state updates in webview
- [ ] Workflow phase shown in webview debug output

---

## Phase 3: Chat UI & Claude Agent SDK

**Goal**: Full Cline-quality chat interface with streaming AI responses, tool-use visualization, approval flows, and markdown rendering — connected to Claude via the Agent SDK.

### Phase 3.1: Claude Agent SDK Integration

- [x] Install `@anthropic-ai/sdk` (standard Anthropic Node.js SDK)
- [x] Create `src/core/api/claude-sdk.ts` — `PrismApiHandler`:
  - Implements streaming message creation
  - Handles Max subscription authentication
  - Configures model selection (Opus for planning, Sonnet for implementation)
  - Returns `AsyncGenerator<ApiStreamChunk>` compatible stream
- [x] Create `src/core/api/types.ts` — stream chunk types:
  - `TextChunk`, `ToolCallChunk`, `UsageChunk`, `InputJsonDeltaChunk`
- [x] Create API key management:
  - Store in VS Code SecretStorage
  - Settings UI for API key entry (inline in ChatView)
  - Validation on entry

**Files to create**:
```
src/core/api/
├── claude-sdk.ts             # Claude Agent SDK wrapper
├── types.ts                  # Stream chunk types
└── auth.ts                   # API key management via SecretStorage
```

### Phase 3.2: Task Execution Engine

- [x] Create `src/core/task/index.ts` — `PrismTask` class (adapted from Cline's Task):
  - Recursive API request cycle: `_recursiveApiRequest()`
  - Stream processing: accumulate text, parse tool calls
  - Phase-aware system prompt injection (different prompts per workflow phase)
  - Context management (conversation history, token tracking)
- [x] Create `src/core/task/message-state.ts` — conversation state:
  - `apiMessages` — API-level message array
  - `chatMessages` — UI-level message array (equivalent to Cline's `clineMessages`)
- [x] Create `src/core/task/task-state.ts` — runtime flags:
  - Streaming state, abort flags, tool execution tracking
  - Workflow phase context

**Files to create**:
```
src/core/task/
├── index.ts                  # PrismTask — main conversation loop
├── message-state.ts          # Conversation state management
├── task-state.ts             # Runtime flags
└── stream-handler.ts         # Stream processing (from Cline pattern)
```

### Phase 3.3: Tool System

- [x] Create `src/core/task/tools/types.ts` — tool interfaces:
  - `PrismTool` type (8 tools relevant to Prism)
  - `IToolHandler` interface with `execute()`
  - `PRISM_TOOL_DEFINITIONS` — Anthropic tool schemas
- [x] Create `src/core/task/tools/coordinator.ts` — tool executor coordinator
- [x] Create tool handlers:
  - `ReadFileHandler` — read file contents
  - `WriteFileHandler` — create/overwrite files
  - `EditFileHandler` — replace in file
  - `ExecuteCommandHandler` — run shell commands (with rg/grep fallback)
  - `SearchFilesHandler` — search file contents
  - `ListFilesHandler` — list directory contents
  - `AskFollowupHandler` — ask user a question
  - `AttemptCompletionHandler` — signal task completion
- [x] Create approval flow:
  - `APPROVAL_REQUIRED_TOOLS` set (write, edit, execute)
  - Webview approval UI (Allow / Deny) in ToolUseRow
  - `ChatService.approveToolUse` gRPC handler

**Files to create**:
```
src/core/task/tools/
├── types.ts                  # Tool interfaces and enum
├── coordinator.ts            # Tool executor coordinator
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

### Phase 3.4: Chat Webview UI

- [x] Create `webview-ui/src/views/ChatView.tsx` — main chat interface:
  - Always-mounted (never unmounted, preserves state)
  - Virtualized message list via `react-virtuoso`
  - Input area with auto-resize textarea
  - API key setup screen for first-time users
  - Phase-aware suggestions in empty state
- [x] Create `webview-ui/src/components/chat/ChatRow.tsx` — message renderer:
  - User messages with right-aligned bubbles
  - Assistant text with markdown rendering + streaming cursor
  - Tool use blocks with collapsible details + approval buttons
  - Completion and error displays
- [x] Create `webview-ui/src/components/chat/ToolRow.tsx` — tool visualization:
  - Collapsible tool input with status colors (pending/approved/denied)
  - Tool result preview with expand/collapse
  - Allow / Deny approval buttons inline
- [x] Create `webview-ui/src/components/common/MarkdownBlock.tsx` — markdown renderer:
  - `react-markdown` with `rehype-highlight` and `remark-gfm`
  - Syntax highlighting via highlight.js (github-dark theme)
  - Custom VS Code variable-aware styling
- [x] Create `webview-ui/src/components/chat/ChatTextArea.tsx` — input component:
  - Multi-line with auto-resize (max 200px)
  - Enter to send, Shift+Enter for newline

**Files to create**:
```
webview-ui/src/
├── views/
│   └── ChatView.tsx
├── components/
│   ├── chat/
│   │   ├── ChatRow.tsx
│   │   ├── ChatTextArea.tsx
│   │   ├── ToolRow.tsx
│   │   ├── ToolGroupRow.tsx
│   │   ├── ApprovalButtons.tsx
│   │   ├── TaskHeader.tsx
│   │   └── hooks/
│   │       ├── useChatState.ts
│   │       └── useScrollBehavior.ts
│   ├── common/
│   │   ├── MarkdownBlock.tsx
│   │   ├── CodeBlock.tsx
│   │   └── DiffView.tsx
│   └── ui/                   # shadcn/ui components
│       ├── button.tsx
│       ├── input.tsx
│       ├── dialog.tsx
│       ├── tooltip.tsx
│       ├── progress.tsx
│       ├── badge.tsx
│       └── separator.tsx
```

### Phase 3.5: Phase-Aware Chat Context

- [x] Create `src/core/prompts/system-prompt.ts` — dynamic system prompt builder:
  - Base Prism context (always included)
  - Phase-specific instructions:
    - **Research**: "Document what IS, not what SHOULD BE"
    - **Plan**: Interactive planning rules + success criteria template
    - **Implement**: Follow-the-plan rules + checkpoint instructions
    - **Validate**: Verification checklist + deviation reporting
  - Workspace context (`.prism/` state, active plan, stories)
- [x] Create phase indicator in chat UI:
  - `PhaseIndicator` — colored banner with progress dots per phase
  - `PhaseTransition` — buttons for valid phase transitions
  - Integrated into ChatView header

**Files to create**:
```
src/core/prompts/
├── system-prompt.ts          # Dynamic system prompt builder
├── phase-research.ts         # Research phase instructions
├── phase-plan.ts             # Plan phase instructions
├── phase-implement.ts        # Implement phase instructions
└── phase-validate.ts         # Validate phase instructions

webview-ui/src/components/workflow/
├── PhaseIndicator.tsx        # Current phase banner with color
├── PhaseTransition.tsx       # Phase transition buttons
└── PhaseArtifacts.tsx        # Quick links to phase documents
```

### Phase 3 Verification

**Automated**:
- [x] `npm run compile` passes (zero TypeScript errors)
- [x] `npm run build:webview` passes (521 modules, 561KB bundle)
- [x] All 75 existing unit tests pass (stories, signals, progress, workflow)
- [ ] Tool handler unit tests (each handler tested in isolation)
- [ ] Message parsing tests (text, tool calls, streaming)

**Manual**:
- [ ] Chat sends message → receives streaming response → renders markdown
- [ ] Tool use blocks render with appropriate visualization
- [ ] Approval flow works (Allow → tool executes → result shown)
- [ ] Phase indicator shows correct phase
- [ ] Phase-specific system prompt verified (check AI behavior per phase)

---

## Phase 4: Claude CLI Integration (Prism Plugin Bridge)

**Goal**: Extension can spawn Claude CLI sessions that load the existing Prism plugin, enabling reuse of all skills, commands, and agents.

### Phase 4.1: Claude CLI Runner

- [x] Create `src/claude/runner.ts` — CLI process management (adapted from CLI's `claude/runner.go`):
  - `runClaudeSession()` — spawn `claude` with Prism plugin loaded
  - `runClaudeStreaming()` — spawn with `--output-format stream-json` for real-time output
  - Stream-JSON event parsing (tool_use, text, result events)
  - Process lifecycle management (start, pause, kill)
  - Platform-specific termination (taskkill on Windows, kill on Unix)
- [x] Create `src/claude/parser.ts` — output parser:
  - Tool activity extraction (Reading, Editing, Running, Agent, etc.)
  - Phase detection from output keywords
  - Quality gate status detection
  - Signal detection (spectrum protocol)
- [x] Create `src/claude/events.ts` — event types:
  - `ClaudeStreamEvent` — parsed stream-json events
  - `ToolActivityEvent` — humanized tool activity
  - `PhaseEvent` — workflow phase detection
  - `SignalEvent` — spectrum signal detection

**Files to create**:
```
src/claude/
├── runner.ts                 # CLI process management
├── parser.ts                 # Output parsing
└── events.ts                 # Event types
```

### Phase 4.2: Prism Plugin Command Bridge

- [x] Create `src/core/controller/prism/plugin-bridge.ts`:
  - `executeSkill(skillName, args)` — spawn Claude with skill trigger phrase
  - `executeCommand(commandName, args)` — spawn Claude with `/command-name`
  - Map VS Code commands to Prism plugin skills:
    - `prism.research` → `/prism-research`
    - `prism.plan` → `/prism-plan`
    - `prism.implement` → `/prism-implement`
    - `prism.validate` → `/prism-validate`
    - `prism.spectrum` → `/prism-spectrum`
    - `prism.decompose` → `/decompose_plan`
    - `prism.commit` → `/commit`
    - `prism.handoff` → `/create_handoff`
    - `prism.describePR` → `/describe_pr`
  - Capture streaming output and route to webview
  - Handle skill completion signals

**Files to create**:
```
src/core/controller/prism/
└── plugin-bridge.ts          # Prism plugin skill/command execution
```

### Phase 4.3: Hybrid Chat Mode

- [x] Implement mode switching in `PrismController`:
  - **SDK Mode** (default for interactive chat): Direct Claude Agent SDK connection
  - **Plugin Mode** (for workflow commands): Spawns Claude CLI with Prism plugin
  - Seamless switching: when user invokes `/prism-research` in chat, switch to Plugin Mode
  - Output bridging: CLI streaming output → webview chat messages
- [x] Create `src/core/controller/prism/mode-bridge.ts`:
  - Convert CLI stream events to chat messages
  - Convert tool activities to tool-use visualization
  - Handle approval delegation (CLI approval → webview approval UI)

**Files to create**:
```
src/core/controller/prism/
└── mode-bridge.ts            # SDK ↔ CLI mode bridging
```

### Phase 4 Verification

**Automated**:
- [x] CLI runner spawns and captures output
- [x] Signal parser correctly identifies all signal types (reuses existing signals.ts with 75 passing tests)
- [x] Tool activity parser extracts all tool types
- [x] `npm run compile` — zero TypeScript errors
- [x] `npm run build:webview` — builds successfully (561KB bundle)

**Manual**:
- [ ] `/prism-research` in chat triggers CLI session with research skill
- [ ] Streaming output from CLI shows in chat UI
- [ ] Tool activities display in real-time
- [ ] Skill completion returns to SDK mode

---

## Phase 5: Tree Views & Status Bar

**Goal**: Native VS Code tree views for Research docs, Plans, and Stories. Status bar showing workflow phase and progress.

### Phase 5.1: Research Tree View

- [x] Create `src/providers/research-tree.ts` — `ResearchTreeDataProvider`:
  - Lists files from `.prism/shared/research/`
  - Shows date, topic, and tags from YAML frontmatter
  - Opens files in editor on click (or in webview markdown preview)
  - Refresh on file system changes
  - Context menu: "Open", "Delete", "Open in Editor"

### Phase 5.2: Plans Tree View

- [x] Create `src/providers/plans-tree.ts` — `PlansTreeDataProvider`:
  - Lists files from `.prism/shared/plans/`
  - Shows date, feature name, and completion status
  - Checkbox-style progress (phases completed / total)
  - Context menu: "Open", "Decompose to Stories", "Implement", "Delete"
  - Inline action buttons for quick operations

### Phase 5.3: Stories Tree View

- [x] Create `src/providers/stories-tree.ts` — `StoriesTreeDataProvider`:
  - Lists stories from `stories.json`
  - Color-coded status icons:
    - Pending: gray circle
    - In Progress: blue spinner
    - Complete: green checkmark
    - Blocked: amber lock
  - Expandable to show steps with checkboxes
  - Epic support (multiple stories.json files)
  - File decorations showing which files each story touches
  - Context menu: "Execute Story", "Mark Complete", "Mark Blocked", "View Details"

### Phase 5.4: Status Bar

- [x] Create `src/providers/workflow-status.ts` — status bar items:
  - **Phase indicator**: Colored text showing current phase ($(beaker) Research | $(list-tree) Plan | $(code) Implement | $(check-all) Validate)
  - **Story progress**: "3/12 stories" with progress percentage
  - **Quality gates**: "$(check) 3/3 gates" or "$(x) 1/3 gates"
  - **Spectrum status**: "$(play) Running" | "$(debug-pause) Paused" | "$(check) Complete"
  - Click actions: Phase → open phase selector, Progress → open Spectrum, Gates → run gates

**Files to create**:
```
src/providers/
├── research-tree.ts          # Research TreeDataProvider
├── plans-tree.ts             # Plans TreeDataProvider
├── stories-tree.ts           # Stories TreeDataProvider
└── workflow-status.ts        # Status bar items
```

### Phase 5.5: package.json View Contributions

- [x] Add to `package.json`:
  ```json
  {
    "viewsContainers": {
      "activitybar": [{
        "id": "prism",
        "title": "Prism",
        "icon": "media/prism-icon.svg"
      }]
    },
    "views": {
      "prism": [
        { "type": "webview", "id": "prism.sidebar", "name": "Prism" },
        { "id": "prism.research", "name": "Research" },
        { "id": "prism.plans", "name": "Plans" },
        { "id": "prism.stories", "name": "Stories" }
      ]
    }
  }
  ```

### Phase 5 Verification

**Automated**:
- [x] Tree views render without errors (`tsc --noEmit` passes clean)
- [x] File watcher triggers refresh correctly (wired via `onDidChangePrismFile`)

**Manual**:
- [ ] Research tree shows `.prism/shared/research/` files with metadata
- [ ] Plans tree shows plans with completion status
- [ ] Stories tree shows stories with correct status icons and colors
- [ ] Status bar shows phase, progress, gates
- [ ] Clicking status bar items performs correct actions

---

## Phase 6: Spectrum Execution Dashboard

**Goal**: Full Spectrum autonomous execution engine with real-time webview dashboard, matching the CLI's Spectrum plugin functionality.

### Phase 6.1: Spectrum Execution Engine

- [x] Create `src/core/controller/prism/spectrum.ts` — Spectrum state machine:
  - States: `Idle`, `Running`, `Paused`, `Complete`, `MaxIterations`, `Error`
  - Transitions matching CLI's state machine exactly
  - Iteration lifecycle: check max → increment → spawn Claude CLI → receive result → parse signal → handle signal → pause → next
  - Error handling: consecutive error tracking, backoff, max retries (3)
  - Configuration: `maxIterations` (50), `pause` (2s), `verbose` (false)
- [x] Create `src/core/controller/prism/spectrum-runner.ts` — iteration executor:
  - Spawns `claude --dangerously-skip-permissions --print --output-format stream-json`
  - Passes prompt: "Execute the next story from {storiesPath} using the /prism-spectrum workflow"
  - Captures streaming output for real-time UI
  - Detects signals from output
  - Manages story state updates in `stories.json`
  - Updates `progress.md` with accumulated learnings

**Files created**:
```
src/core/controller/prism/
├── spectrum.ts               # SpectrumEngine state machine (full implementation)
└── spectrum-runner.ts        # SpectrumRunner iteration executor
```

### Phase 6.2: Spectrum Webview Dashboard

- [x] Create `webview-ui/src/views/SpectrumView.tsx` — main dashboard:
  - Layout: Header + Progress + StoryList + ActivityLog + StatusBar
  - Real-time updates via existing StateService.subscribeToState (spectrum field)
  - Responsive layout (adapts to panel width)
- [x] Create spectrum components:
  - `StoryList.tsx` — story list with animated status transitions
  - `ProgressBar.tsx` — animated progress bar with spectral gradient
  - `ActivityLog.tsx` — timestamped tool activity log with auto-scroll
  - `SignalStatus.tsx` — signal visualization (continue, retry, blocked, error, complete)
  - `SpectrumControls.tsx` — Start/Pause/Resume/Stop/Skip buttons

**Files created**:
```
webview-ui/src/
├── views/
│   └── SpectrumView.tsx
└── components/spectrum/
    ├── StoryList.tsx
    ├── ProgressBar.tsx
    ├── ActivityLog.tsx
    ├── SignalStatus.tsx
    └── SpectrumControls.tsx
```

### Phase 6.3: Spectrum gRPC Service

- [x] Create Spectrum-specific gRPC service handlers (in PrismController._registerHandlers()):
  - `SpectrumService.start` — begin execution
  - `SpectrumService.pause` — pause execution
  - `SpectrumService.resume` — resume execution
  - `SpectrumService.stop` — stop execution
  - `SpectrumService.skipStory` — skip current story
  - `SpectrumService.reset` — reset to idle
- [x] Expanded `SpectrumState` interface:
  ```typescript
  interface SpectrumState {
    executionState: 'idle' | 'running' | 'paused' | 'complete' | 'maxIterations' | 'error';
    currentIteration: number;
    maxIterations: number;
    currentStoryId: string | null;
    progress: number; // 0-100
    elapsedMs: number;
    startedAt: number | null;
    consecutiveErrors: number;
    lastSignalType: string;
    lastSignalContent: string;
    recentActivities: SpectrumActivity[];
    logs: LogEntry[];
  }
  ```
- [x] Updated `PrismExtensionState.spectrum` with richer fields
- [x] Updated `PrismStateContext.tsx` with full spectrum types
- [x] Added `SpectrumServiceClient` to `webview-ui/src/services/grpc-client.ts`

### Phase 6.4: Integration

- [x] Wired `SpectrumEngine` + `SpectrumRunner` into `PrismController`
- [x] Async execution loop: `_startSpectrumLoop()` + `_runSpectrumLoop()`
- [x] Connected to `StoriesManager` for story status updates
- [x] Connected to `WorkflowStatusBar` (already renders Spectrum state via existing `spectrum` field)
- [x] Updated `App.tsx` with chat ↔ spectrum view routing
- [x] Added `prism.spectrum.start` command to `extension.ts`

### Phase 6 Verification

**Automated**:
- [x] `npm run compile` — zero TypeScript errors
- [x] `npm run build:webview` — 527 modules, 573KB bundle, zero errors
- [x] `npx jest` — 75 tests pass (all existing tests)

**Manual**:
- [ ] Start Spectrum → stories execute sequentially
- [ ] Real-time progress bar updates
- [ ] Tool activity log streams in real-time
- [ ] Pause/Resume works correctly
- [ ] Signal detection handles all signal types
- [ ] Error recovery with retry logic

**Checkpoint**: [x] Phase 6 complete

---

## Phase 7: Polish & Integration

**Goal**: Onboarding, full command registration, keyboard shortcuts, spectral theme, packaging.

### Phase 7.1: Onboarding Walkthrough

- [ ] Create VS Code walkthrough contribution in `package.json`:
  - Step 1: "Welcome to Prism" — overview
  - Step 2: "Set Up .prism/" — detect or create directory
  - Step 3: "Configure Claude" — API key or CLI setup
  - Step 4: "Your First Research" — guided first workflow
- [ ] Create welcome view in webview for first-time users

### Phase 7.2: Commands & Keybindings

- [ ] Register all commands with handlers:
  ```
  prism.research          Ctrl+Shift+R    Start Research phase
  prism.plan              Ctrl+Shift+P    Start Plan phase (note: won't conflict with command palette)
  prism.implement         Ctrl+Shift+I    Start Implement phase
  prism.validate          Ctrl+Shift+V    Start Validate phase
  prism.spectrum.start    Ctrl+Shift+S    Start/Resume Spectrum
  prism.spectrum.pause                    Pause Spectrum
  prism.spectrum.stop                     Stop Spectrum
  prism.commit                            Prism-style commit
  prism.decompose                         Decompose plan to stories
  prism.handoff                           Create handoff document
  prism.describePR                        Generate PR description
  prism.openSidebar                       Open Prism sidebar
  prism.initPrism                         Initialize .prism/ directory
  ```

### Phase 7.3: Spectral Theme Polish

- [ ] Finalize spectral color system in theme.css:
  - Phase-specific colors throughout the UI
  - Smooth color transitions between phases
  - Dark/light theme variants
  - Prism icon for activity bar (SVG with spectral gradient)
- [ ] Prism logo in sidebar header
- [ ] Animated phase transition effects in webview

### Phase 7.4: Settings

- [ ] Add extension settings to `package.json`:
  ```json
  {
    "prism.claudeApiKey": { "type": "string", "description": "Claude API key for Agent SDK" },
    "prism.defaultModel": { "type": "string", "enum": ["opus", "sonnet"], "default": "sonnet" },
    "prism.planningModel": { "type": "string", "enum": ["opus", "sonnet"], "default": "opus" },
    "prism.spectrum.maxIterations": { "type": "number", "default": 50 },
    "prism.spectrum.pauseSeconds": { "type": "number", "default": 2 },
    "prism.autoApprove.readFile": { "type": "boolean", "default": true },
    "prism.autoApprove.listFiles": { "type": "boolean", "default": true },
    "prism.autoApprove.searchFiles": { "type": "boolean", "default": true }
  }
  ```

### Phase 7.5: Packaging & Distribution

- [ ] Create `media/` directory with extension icons
- [ ] Create `.vsixmanifest` if needed
- [ ] Build script: `npm run package` → produces `.vsix`
- [ ] README with screenshots and feature overview
- [ ] CHANGELOG.md

### Phase 7 Verification

**Automated**:
- [ ] All commands register without conflict
- [ ] `vsce package` produces valid VSIX
- [ ] Extension installs cleanly from VSIX

**Manual**:
- [ ] Onboarding walkthrough completes successfully
- [ ] All keyboard shortcuts work
- [ ] Spectral colors display correctly in dark and light themes
- [ ] Settings persist and apply correctly
- [ ] Extension works on macOS, Windows, and Linux

---

## Success Criteria

### Automated Verification
- [ ] `npm run compile` — zero TypeScript errors
- [ ] `npm run build:webview` — zero build errors
- [ ] `npm test` — all unit tests pass
- [ ] `vsce package` — produces valid VSIX
- [ ] Extension activates without errors in Extension Development Host

### Manual Verification
- [ ] Chat experience matches Cline quality (streaming, tool vis, approval flow)
- [ ] 4-phase workflow works end-to-end (Research → Plan → Implement → Validate)
- [ ] Spectrum dashboard runs stories autonomously with real-time updates
- [ ] Tree views show accurate `.prism/` state
- [ ] Status bar reflects current workflow state
- [ ] Prism plugin skills/commands work via CLI bridge
- [ ] Theme colors adapt correctly to VS Code light/dark themes
- [ ] Extension works on Windows, macOS, and Linux

---

## Dependencies & Risks

| Risk | Mitigation |
|------|-----------|
| Claude Agent SDK may have breaking changes | Pin version, test regularly |
| CLI subprocess spawning differs by OS | Platform-specific kill (already solved in CLI) |
| Webview state loss on panel hide | Use `retainContextWhenHidden: true` |
| Large chat histories may slow rendering | React-virtuoso handles virtualization |
| Conflicting keybindings | Use `Ctrl+Shift+` prefix to avoid conflicts |
| gRPC-over-postMessage complexity | Start with simple request/response, add streaming incrementally |

## Estimated Story Count for Spectrum

If decomposed into stories for autonomous execution:

- Phase 1 (Foundation): ~8 stories
- Phase 2 (Prism Core): ~6 stories
- Phase 3 (Chat & AI): ~15 stories
- Phase 4 (CLI Bridge): ~6 stories
- Phase 5 (Tree Views): ~6 stories
- Phase 6 (Spectrum Dashboard): ~10 stories
- Phase 7 (Polish): ~8 stories
- **Total: ~59 stories**

---

## Open Questions (Resolved)

1. ~~AI connection approach~~ → **Hybrid** (SDK + CLI)
2. ~~Feature scope~~ → **Full chat + Prism workflow**
3. ~~Plugin compatibility~~ → **Reuse existing Prism plugin**
