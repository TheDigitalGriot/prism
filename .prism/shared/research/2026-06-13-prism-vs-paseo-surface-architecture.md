---
date: 2026-06-13
researcher: Claude (prism-research)
topic: "Prism vs Paseo — per-surface UI / surface-architecture comparison (rendering, state, transport, navigation, theming)"
status: complete
last_updated: 2026-06-13
tags: [surfaces, ui, cli, vscode, electron, mobile, web, paseo, rendering, state, transport, navigation, theming, daemon-broker]
companion: ".prism/shared/research/2026-06-12-paseo-daemon-architecture-surface-impact.md"
sources:
  prism: "C:/Users/digit/Developer/prism-plugin (apps/ + packages/)"
  paseo_vendored: "apps/prism-mobile (paseo fork v0.1.69, rebranded — used for read-only comparison)"
  paseo_fork: "C:/Users/digit/Developer/paseo (frozen tested baseline — DO NOT MODIFY)"
---

# Prism vs Paseo — Per-Surface Surface/UI Architecture

## Research Question

For **each surface** (CLI, VSCode, Electron/Desktop, Mobile, Web), document what exists in **Prism's** UI + surface architecture versus the **paseo** equivalent, across five dimensions: **rendering stack · state model · daemon/transport client · navigation · theming**.

> Scope note: documentary map. Describes what each project has; does not prescribe which to adopt. Companion doc covers the daemon internals + surface *impact*; this one covers the *UI/surface* layer of each client.

## Summary

The two projects sit at **opposite ends of a "shared UI vs shared runtime" axis**:

- **Paseo** has **one UI codebase** (`packages/app`, Expo/React-Native) compiled to four targets (iOS, Android, browser-web, Electron-web), and **one daemon-client library** (`packages/server/src/client`, TypeScript) that every surface imports to reach an external daemon over WebSocket. Surfaces are **thin**: the daemon owns all state; clients render a streamed timeline. The CLI is a non-TUI Commander tool; the desktop is an Electron shell that loads the same web build and supervises the daemon subprocess. **No VSCode extension exists.**

- **Prism** has **three independent UI codebases** — a Go/Bubble-Tea **TUI** (`apps/prism-cli`), a TypeScript/React **VSCode extension** (`apps/prism-vscode`, three React webviews), and an **Electron** app (`apps/prism-electron`) that *reuses the VSCode extension's source* via path aliases — plus a **vendored paseo app** for mobile (`apps/prism-mobile`, rebranded only). UI sharing runs **VSCode ↔ Electron** through `@prism-core` (logic) and `@prism-ui` (React components); the CLI is standalone Go; mobile is a separate Expo tree. Prism's cross-surface seam has historically been **in-process** — a gRPC-style `handleGrpcRequest(postMessage, request)` ([grpc-handler.ts](apps/prism-vscode/src/core/controller/grpc-handler.ts)) that VSCode speaks over `postMessage` and Electron over IPC — with agents run **in-process** (Claude Agent SDK), not via a daemon.

The just-completed **daemon-broker** (`packages/prism-daemon` + `packages/prism-daemon-client` + `apps/prism-cli/daemon`) is the first **over-the-wire runtime seam** that spans Prism's otherwise-separate surfaces — Prism's structural analog to paseo's daemon-client, but multi-service rather than agent-only.

---

## 1 · Surface inventory — who has what

| Surface | Prism | Paseo |
|---|---|---|
| **CLI** | ✅ `apps/prism-cli` — Go, Bubble Tea full-screen **TUI** | ✅ `packages/cli` — TS, Commander **non-TUI** command tool |
| **VSCode extension** | ✅ `apps/prism-vscode` — TS + 3 React webviews | ❌ none |
| **Electron / Desktop** | ✅ `apps/prism-electron` — Forge+Vite, **reuses VSCode src** | ✅ `packages/desktop` — Electron shell, **loads the Expo web build** + daemon-manager |
| **Mobile** | ⟳ `apps/prism-mobile` — **vendored paseo app**, rebranded | ✅ `packages/app` — Expo / React Native |
| **Web** | ◐ webviews are web-tech but **not a standalone web app** | ✅ Expo **web target** (`react-native-web`) + **PWA** (Cloudflare Pages) |

Legend: ✅ native to the project · ⟳ vendored from the other · ◐ partial / embedded only · ❌ absent.

---

## 2 · Per-surface deep comparison

### 2.1 CLI

| Dimension | Prism (`apps/prism-cli`, Go) | Paseo (`packages/cli`, TS) |
|---|---|---|
| **Rendering stack** | Bubble Tea (TUI runtime) · Bubbles (widgets) · Lipgloss (styling) · Harmonica (spring physics) · Glamour + Chroma (markdown/syntax) · **FauxGL** (3D prism logo) · bubblezone (mouse zones) · termenv. A full-screen, animated TUI. | Commander (arg parsing) · `@clack/prompts` (interactive prompts) · chalk (ANSI color). **Line-oriented**, no full-screen UI. |
| **State model** | `state/state.go` + `domain/` (story/progress/signals parsing) + `agentbus/` (in-process event bus: events, consumer, permission, question, session, store). | Effectively **stateless** — the daemon owns state; the CLI issues commands + renders responses. |
| **Daemon / transport** | Dual: `watcher/watcher.go` (**fsnotify** file-watch of `stories.json`/`.prism/`) **and**, new, `daemon/client.go` (**`coder/websocket`** Go client → the Prism broker, Phase 8). | `ws` WebSocket → imports `@thedigitalgriot/server` **daemon-client** directly (shares the same TS client as the app). |
| **Navigation** | **Plugin model**: `plugin/plugin.go` defines a `Plugin` interface (ID/Name/Icon/Init/Start/Stop/Update/View/IsFocused/KeyHints); screens are plugins — `plugin_home`, `plugin_monitor`, `plugin_plans`, `plugin_research`, `plugin_workspaces`, `plugin_agent`, `plugin_browser`, `plugin_git`, `plugin_files`, `plugin_onboarding` — registered in `plugin/registry.go`, shown as a **tab bar** with `command_palette.go` + `file_finder.go`. | **Subcommands** (Commander): `agent`, `daemon`, `permit`, `provider`, `worktree`, `loop`, `chat`, `terminal`, `schedule`, `onboard`, `open`. |
| **Provider adapters** | `app/adapter/` — `claude.go`, `codex.go`, `cursor.go` behind `adapter.go`; `claude/runner.go`+`parser.go`+`conversation.go`. | Adapters live in the **daemon** (`packages/server/providers`: Claude / Codex / OpenCode), not the CLI. |
| **Theming** | `styles/` — `theme.go`, `borders.go`, `gradient.go`, `powerline.go` + `terminal/theme.go` + `terminal/detect.go` (terminal background detection). | chalk color constants. |

Shape: Prism's CLI is a **rich standalone TUI application** (its own renderer, navigation, theme engine, provider adapters, 3D logo); paseo's CLI is a **thin command wrapper** over the daemon-client.

### 2.2 VSCode extension

| Dimension | Prism (`apps/prism-vscode`, TS) | Paseo |
|---|---|---|
| **Rendering stack** | Three React webviews, each Vite-built: `webview-ui` (**React 18**, Tailwind 4, react-virtuoso, react-markdown + rehype-highlight + remark-gfm, lucide-react, cva/clsx/tailwind-merge) · `webview-panel` (**React 19**, minimal) · `webview-office` (**React 19**, the agent "desk"). | — (no VSCode surface) |
| **State model** | `core/controller/` (`BasePrismController` → `PrismController`) + `core/controller/state/subscribeToState.ts`; an **in-process agent task engine** `core/task/` (Cline/Roo-style: `message-state`, `task-state`, `tools/coordinator` + handlers `read-file`/`write-file`/`edit-file`/`execute-command`/`list-files`/`search-files`/`ask-followup`/`attempt-completion`); webview-local React state. | — |
| **Daemon / transport** | **gRPC-style `handleGrpcRequest(postMessage, request)`** ([grpc-handler.ts](apps/prism-vscode/src/core/controller/grpc-handler.ts)) over the host↔webview `postMessage` seam (`onDidReceiveMessage`), wired in `hosts/vscode/` (`PrismPanelProvider`, `VscodeWebviewProvider`, `OfficeViewProvider`). Agents run **in-process** via `core/api/claude-sdk.ts`. New: design-engine ops now also reach the **broker** over `POST :6780/call` (Phase 3B). | — |
| **Navigation** | VSCode **TreeView providers** (`providers/plans-tree`, `research-tree`, `stories-tree`, `workflow-status`) for the activity-bar sidebar, plus webview panels (monitor / office / design) switched inside `PrismPanelProvider`. | — |
| **Theming** | Tailwind 4 + VSCode theme CSS variables inside the webviews. | — |

Shape: Prism's VSCode surface is a **full Cline-derived extension** (in-process tool-handler agent loop) with three React webviews + native tree views. Paseo has **no analog** — its "IDE" story is "open in editor" deep-links, not an extension.

### 2.3 Electron / Desktop

| Dimension | Prism (`apps/prism-electron`) | Paseo (`packages/desktop`) |
|---|---|---|
| **Rendering stack** | Electron Forge + `@electron-forge/plugin-vite` + React 19 + Tailwind 4. Renderer **reuses the VSCode webview UIs**. | Electron + electron-builder. **No bespoke UI** — loads the **Expo web build** (`PASEO_WEB_PLATFORM=electron`, Metro prefers `.electron.*`). |
| **State / logic reuse** | Deep reuse via aliases: `@prism-core/*` → `packages/prism-core/src` **then falls back to** `apps/prism-vscode/src` ([tsconfig.json](apps/prism-electron/tsconfig.json), [vite.main.config.mts](apps/prism-electron/vite.main.config.mts)); `@prism-ui` → `packages/prism-ui/src`. Shares `BasePrismController`, the `office/` subsystem (`ElectronAgentManager` uses `@prism-core/office/{timerManager,transcriptParser,assetLoader,layoutPersistence,constants}`), and `workspace/` discovery. | Imports `@thedigitalgriot/cli` + `@thedigitalgriot/server`. |
| **Daemon / transport** | `ElectronIPCBridge` wraps the **same** `handleGrpcRequest` (the gRPC seam) over Electron **IPC** instead of `postMessage` — so VSCode and Electron speak one protocol to shared controllers. Agents in-process. | **`daemon-manager`** spawns + supervises the daemon **subprocess** (`node-entrypoint-launcher`, `runtime-paths`, `local-transport`), then the renderer talks WS to it. electron-updater + electron-log for releases. |
| **Navigation / theming** | Inherited from the reused VSCode webviews. | Inherited from the Expo app (Expo Router + unistyles). |

Shape: both wrap a desktop shell, but the **reuse target differs** — Prism's Electron **reuses the VSCode extension's source**; paseo's Electron **reuses the Expo web build** and additionally **owns the daemon process** (the "managed desktop" model).

### 2.4 Mobile

| Dimension | Prism (`apps/prism-mobile`) | Paseo (`packages/app`) |
|---|---|---|
| **Relationship** | **Vendored paseo fork v0.1.69**, rebranded **only** in `packages/app/app.config.js` (name/slug/scheme/bundle-id/EAS project). Same code as the right column. | The source. |
| **Rendering stack** | Expo 54 · React Native 0.81 · React 19.1 · `react-native-svg` · `lucide-react-native` · `@gorhom/bottom-sheet` · `@dnd-kit` · **xterm** (`@xterm/*`) for the terminal view. | identical |
| **State model** | `zustand` + `@tanstack/react-query` + the `Stream` timeline model (compaction / gap-detection / seq-dedup); `DaemonRegistryContext` (saved daemons) + `SessionContext` (active daemon client). | identical |
| **Daemon / transport** | `packages/server/src/client` daemon-client — direct **WS** or **E2EE relay** transport (`packages/relay`, ECDH + AES-256-GCM, QR pairing). | identical |
| **Navigation** | **Expo Router** (`/h/[serverId]/agents`, `/h/[serverId]/workspace/[workspaceId]`) + `@react-navigation/native`. | identical |
| **Theming** | **`react-native-unistyles`** + `react-native-reanimated`; four runtime gates (`isWeb`/`isNative`/`getIsElectron()`/`useIsCompactFormFactor()`). | identical |

Shape: mobile is the **one surface Prism doesn't author** — it *is* paseo's app, so every dimension matches; Prism owns only the brand layer.

### 2.5 Web

| Dimension | Prism | Paseo |
|---|---|---|
| **Standalone web app** | None. The React webviews are web-tech but **hosted inside** VSCode/Electron, not served as a site. | The Expo app's **web target** via `react-native-web`. |
| **Delivery** | n/a | **PWA** (`public/manifest.json`, service worker, icons) deployed with `wrangler` to **Cloudflare Pages** (`deploy:web`). |
| **Rendering** | React 18/19 in a webview iframe. | Same Expo component tree, DOM-rendered. |

Shape: paseo gets web "for free" from the one-codebase-four-targets model; Prism has no first-class browser surface (its web tech is embedded UI only).

---

## 3 · Cross-cutting dimension matrices

### Rendering stack
| Surface | Prism | Paseo |
|---|---|---|
| CLI | Bubble Tea / Lipgloss / Harmonica / Glamour / FauxGL (Go TUI) | Commander / clack / chalk (line tool) |
| VSCode | React 18+19, Vite, Tailwind 4 | — |
| Electron | React 19 (reuses VSCode webviews) | Expo web build |
| Mobile | Expo / RN (vendored) | Expo / RN |
| Web | — | Expo web (`react-native-web`) + PWA |

### State model
| | Prism | Paseo |
|---|---|---|
| Where state lives | **Per-surface**: CLI `state/`+`agentbus`; VSCode/Electron `BasePrismController`+`core/task`; mobile zustand/Stream | **Daemon-owned**; clients hold view/session state only |
| Cross-surface sharing | `@prism-core` (VSCode↔Electron); CLI + mobile separate | One `daemon-client` + one `Stream` model shared by all clients |

### Daemon / transport client
| | Prism | Paseo |
|---|---|---|
| Historical seam | **In-process gRPC** `handleGrpcRequest(postMessage \| IPC)` | **Over-the-wire WS** `daemon-client` |
| Agent execution | **In-process** (Claude Agent SDK in the extension) | **Daemon subprocess** owns agents |
| Remote access | new broker `relay` bridge (Phase 7, clear-text today) | `packages/relay` E2EE + QR pairing |
| New convergence | `packages/prism-daemon` broker + `prism-daemon-client` (TS) + `apps/prism-cli/daemon` (Go) | (paseo already converged here) |

### Navigation
| Surface | Prism | Paseo |
|---|---|---|
| CLI | Plugin/tab model (`Plugin` interface + registry) | Commander subcommands |
| VSCode | TreeView providers + webview panel switch | — |
| Mobile | Expo Router (vendored) | Expo Router |

### Theming
| Surface | Prism | Paseo |
|---|---|---|
| CLI | `styles/` (theme/borders/gradient/powerline) + terminal bg detection | chalk colors |
| VSCode/Electron | Tailwind 4 + VSCode theme vars | — |
| Mobile | `react-native-unistyles` (vendored) | `react-native-unistyles` |

---

## 4 · Shared-code topology

**Prism**
- `packages/prism-core` — non-UI shared TS (PrismState, `office/` subsystem, `workspace/` discovery, `core/controller` incl. `grpc-handler` + `BasePrismController`). Consumed by VSCode (directly) and Electron (via `@prism-core` alias that falls back into `apps/prism-vscode/src`).
- `packages/prism-ui` — shared **React** components (markdown/virtuoso/highlight/icons/cva). Consumed by VSCode webviews + Electron renderer (`@prism-ui`).
- `apps/prism-cli` — **standalone Go**; shares nothing with the TS surfaces except, now, the **wire protocol** via `daemon/client.go`.
- `apps/prism-mobile` — **vendored paseo**, isolated tree (deliberately excluded from the npm-workspaces `apps` list).
- **New unifying layer:** `packages/prism-daemon` (broker) + `packages/prism-daemon-client` (TS, own minimal protocol mirror) + `apps/prism-cli/daemon` (Go client).

**Paseo**
- `packages/server/src/client` — the **one** daemon-client (transport-pluggable: WS / E2EE relay), imported by CLI + app + desktop.
- `packages/app` — the **one** UI tree → 4 targets via Metro platform-extension resolution.
- `packages/relay` — E2EE relay (zero-knowledge, Cloudflare Workers).

---

## 5 · Structural deltas (descriptive)

1. **Shared UI vs shared runtime.** Paseo shares the *UI* (one Expo tree) and reaches an external daemon. Prism shares *logic* (`@prism-core`) and *components* (`@prism-ui`) between VSCode↔Electron, runs agents *in-process*, and authors each surface's UI separately (Go TUI, React webviews, vendored Expo).
2. **Transport orientation.** Prism's established seam is **in-process request/response** (gRPC-over-postMessage/IPC); paseo's is **over-the-wire pub/sub** (WS timeline streaming). The new daemon-broker adds the over-the-wire dimension to Prism.
3. **CLI weight.** Prism's CLI is a heavyweight TUI *application*; paseo's CLI is a lightweight *command client* of the daemon.
4. **VSCode asymmetry.** Prism has a full Cline-style extension with an in-process tool-handler agent loop; paseo has none.
5. **Electron reuse target.** Prism Electron reuses the *VSCode extension source*; paseo desktop reuses the *Expo web build* and *manages the daemon process*.
6. **Provider adapters.** Both are multi-provider — Prism CLI: Claude/Codex/Cursor (`app/adapter`); paseo daemon: Claude/Codex/OpenCode (`packages/server/providers`); Prism VSCode runs Claude in-process.
7. **Mobile + Web.** Prism has no native mobile or standalone web; paseo's one-codebase model yields both (+ PWA).

## 6 · How the daemon-broker maps onto the surfaces

- The broker is Prism's **daemon-client analog**, generalized from "agent-run" to **N services** (agent-run / code-intel / design-gen / knowledge / 3d-gen / cinopsis / notebooks).
- `prism-daemon-client` (TS) is the client for VSCode / Electron / (vendored) mobile-web; `apps/prism-cli/daemon` (Go) is the client for the TUI — paseo got one TS client for all surfaces because all its surfaces are TS; Prism needs **two clients** (TS + Go) because the CLI is Go (the central cross-language fact from the companion doc's Open Questions).
- The broker's wire envelope (`BrokerEnvelope { id, service, method, payload, caps }`, `WSHello`/`WSWelcome`) is **modeled on paseo's daemon-client handshake**, extended with the `service` dimension — i.e., the convergence layer borrows paseo's proven protocol shape and adds multi-service routing.

---

## Open Questions

- [ ] Does the VSCode/Electron in-process agent loop (`core/task`) stay in-process, or move behind the broker's `agent-run` service so all surfaces share one execution path?
- [ ] Should `prism-ui` (React) and the vendored Expo app converge any components, or stay separate (webview-React vs React-Native)?
- [ ] Does Prism gain a first-class **web** surface (serve `prism-ui`/webviews standalone), matching paseo's web/PWA target?
- [ ] Theming convergence: is there a shared design-token source feeding CLI `styles/`, webview Tailwind, and mobile unistyles, or do the three theme engines stay independent?
- [ ] CLI parity: which paseo daemon-client features (live attach, permission round-trip, terminal mux) does `apps/prism-cli/daemon` adopt next?

## Appendix — primary files read

- Prism CLI: `apps/prism-cli/go.mod`, `plugin/plugin.go`, `app/*` (plugin_*.go, model/update/view), `styles/*`, `daemon/client.go`.
- Prism VSCode: `apps/prism-vscode/{webview-ui,webview-panel,webview-office}/package.json`, `src/core/controller/*`, `src/core/task/*`, `src/hosts/vscode/*`, `src/providers/*`.
- Prism Electron: `apps/prism-electron/{package.json,tsconfig.json,forge.config.ts,vite.*.config.mts}`, `src/hosts/electron/ElectronIPCBridge.ts`, `src/office/Electron*`.
- Shared: `packages/prism-ui/package.json`, `packages/prism-core/package.json`.
- Paseo (vendored): `apps/prism-mobile/packages/{app,cli,desktop}/package.json`.
- Companion: `.prism/shared/research/2026-06-12-paseo-daemon-architecture-surface-impact.md`.

---

## Follow-up Research [2026-06-13] — surface deep-dive (VSCode · CLI · Electron desktop)

File-level pass on the three Prism-authored surfaces, weighted toward the **desktop** app, to ground build decisions.

### A · The two seams are the same shape

The single most important structural fact for any "wire surfaces together" decision:

| | In-process seam (today) | Over-the-wire seam (new) |
|---|---|---|
| Where | [grpc-handler.ts](packages/prism-core/src/core/controller/grpc-handler.ts) (Cline-derived) | `packages/prism-daemon` broker |
| Envelope | `{ service, method, message, request_id, is_streaming }` | `BrokerEnvelope { id, service, method, payload, stream }` |
| Dispatch | `service.method` → unary `_unaryRegistry` / stream `_streamRegistry` | `service` → adapter → `method` |
| Transport | `postMessage` (VSCode) / IPC (Electron) | WebSocket (+ HTTP `POST /call`) |
| Used by | VSCode webviews, Electron renderer | CLI (Go), TS daemon-client, design-gen (Phase 3B) |

Both are **`service.method` dispatch with unary + streaming + request-id correlation**. The broker is the same contract moved across a process boundary. This is why convergence is cheap: a surface's existing `grpc_request` client and a broker call differ only in transport.

### B · VSCode surface (file-level)

- **Entry** [extension.ts](apps/prism-vscode/src/extension.ts): one `VscodeWebviewProvider`; three `registerTreeDataProvider` (`prism.research`/`prism.plans`/`prism.stories`); two `registerWebviewViewProvider` (sidebar + main/office); ~20 `registerCommand`s (`prism.research|plan|implement|validate|spectrum[.start|.pause|.stop]`, `initPrism`, `commit`, `decompose`, `handoff`, `describePR`, `office.show|launchAgent|exportLayout`, `monitor.runGate`).
- **Brain is shared** in `packages/prism-core`: `core/controller/{BasePrismController,grpc-handler}` + `core/controller/prism/{spectrum,spectrum-runner,workflow,stories,plugin-bridge,mode-bridge}` + `claude/{runner,parser,events}` + `core/prompts/{phase-research,phase-plan,phase-implement,phase-validate,system-prompt}` + `office/agentBridge` + `workspace/*` + `shared/PrismState`.
- **Agents run in-process** (`core/api/claude-sdk.ts` + `claude/runner`), driven by the in-process `core/task` tool-handler loop. No daemon.
- **Cline heritage**: a reference copy lives at `.prism/shared/ref/cline/src/core/controller/grpc-handler.ts`.

### C · CLI surface (file-level)

- **Entry** [main.go](apps/prism-cli/main.go): Cobra `prism-cli [stories-file]`; flags `-f/-n/-p/--demo/--onboarding/--prism-style{gradient|simple|braille|ascii}/--uninstall`. Resolves `prismDir`/`projectDir`, launches `app.NewModel(...)` as a Bubble Tea program (`WithAltScreen`, `WithMouseCellMotion`, `zone.NewGlobal()`). Includes a full **uninstaller** (cleans bash/zsh + PowerShell PATH, removes `~/.prism/bin` + global dir) and a **demo mode**.
- **Navigation** = the `Plugin` interface ([plugin/plugin.go](apps/prism-cli/plugin/plugin.go)) + registry; screens are plugins (home/monitor/plans/research/workspaces/agent/browser/git/files/onboarding) shown as tabs.
- **Self-contained**: own Bubble Tea Model/Update/View (`app/`), own theme engine (`styles/`), own provider adapters (`app/adapter/{claude,codex,cursor}`), own event bus (`agentbus/`), own 3D renderer (`prism/` + `splash/`), own file watcher (`watcher/`). Reimplements in Go what `prism-core` does in TS.
- **New seam**: `daemon/client.go` (`coder/websocket`) is the CLI's broker client — the only thing it shares with the TS surfaces (the wire protocol, not code).

### D · Electron desktop — Prism vs Paseo (the emphasis)

**Prism Electron** ([main.ts](apps/prism-electron/src/main.ts), [ElectronIPCBridge.ts](apps/prism-electron/src/hosts/electron/ElectronIPCBridge.ts), [preload.ts](apps/prism-electron/src/preload.ts)):
- Single `BrowserWindow` (contextIsolation on, nodeIntegration off). Restores window bounds + last project (or CLI-arg dir). Loads renderer from `webview-ui/index.html` (or Vite dev server). Native File/Edit/View/Window menu. Squirrel startup handling.
- `ElectronIPCBridge` constructs an `ElectronPrismController` (extends `BasePrismController`) **in-process** and routes one `grpc_request` IPC channel into the shared `handleGrpcRequest`; forwards controller events (`stateChange`/`sessionStart`/`storyUpdate`/`spectrumStoryEnd`/`fileChange`) to the renderer via `webContents.send`. Adds ~25 bespoke `prism:*` handlers done natively in main: `openProject` (dialog), `readFile`, `gitStatus`/`gitLog`/`gitBranchInfo` (`execSync git`), `fileTree`, `save/loadLayoutState`, `discoverProjects`/`addWorkspace`/`browseAndAddWorkspace`, `listWorktrees`/`createWorktree`/`deleteWorktree`, `switchProject`, `executeGate`/`cancelGate` (AbortController), `getResearch`/`getPlans`, API-key CRUD (`ElectronSecretStorage`).
- `preload.ts` exposes `electronAPI { send, on, invoke, officeMessage, officeAction }`.
- **Renderer** `webview-ui/` is its own React app shell — `AppShell` + `ActivityBar` + `TabBar` + `BottomPanel`/`BottomStatusBar` + panels (`Monitor`/`Spectrum`/`Stories`/`Workspace`/`Files`/`Git`) + views (`FileContent`/`GitGraph`/`StoryDetail`) + `LayoutContext`; reuses `@prism-core` logic and `@prism-ui` components but is layout-distinct from the VSCode webviews.
- **Net:** an in-process desktop IDE. No daemon subprocess, no auto-update, no multi-instance, no custom protocol (loads `file://`), no in-app browser, no CLI passthrough.

**Paseo desktop** ([packages/desktop](apps/prism-mobile/packages/desktop/src)) — the "managed daemon" reference:
- **`daemon/daemon-manager.ts`**: detached daemon subprocess via `spawnProcess` (from `@thedigitalgriot/server`); status struct `{ status, serverId, listen, version }`; **version-mismatch → `restartDaemon()`**; pid liveness checks (`process.kill(pid, 0)`, process-group kill `-pid`); `powerMonitor` awareness; IPC handlers `start_/stop_/restart_desktop_daemon` + `open/send/close_local_daemon_transport` (socket/pipe via `local-transport.ts`). `quit-lifecycle.ts` stops the managed daemon on quit only if the desktop started it.
- **`main.ts`** is a much larger shell: `inheritLoginShellEnv()` (resolve user shell PATH so spawned node/claude resolve), **single-instance lock + `second-instance` deep-link routing**, **CLI passthrough** (`runCliPassthroughIfRequested` — the desktop binary *is* the CLI), a custom privileged `paseo://` protocol serving the Expo `app-dist` with SPA fallback, in-app **browser webviews** (`webviewTag`, partition isolation, nav guards, shortcut forwarding), `window-manager` (chrome/theme/resize/context-menu), **dev worktree userData isolation**, AppImage no-sandbox + `PASEO_ELECTRON_FLAGS`, native menu/dialogs/notifications/opener, `auto-updater` + `skill-sync` + `cli-install-path` integrations, `arm64-translation` (Rosetta) detection.

| Desktop dimension | Prism Electron | Paseo desktop |
|---|---|---|
| Agent/runtime | **in-process** (`BasePrismController`) | **detached daemon subprocess** (managed) |
| Daemon supervision | none | spawn / version-sync / restart / pid+group kill / quit-lifecycle |
| Renderer↔backend | gRPC-over-IPC + `prism:*` invokes | `local-transport` (socket/pipe) + custom protocol |
| Renderer source | bespoke `webview-ui` (reuses `@prism-core`/`@prism-ui`) | the **Expo web build** (`app-dist`) |
| Instancing | single window, no lock | single-instance lock + deep links + dev worktree isolation |
| One binary = GUI+CLI | no | **yes** (CLI passthrough) |
| Updates | none in-app | electron-updater auto-update + skill-sync |
| In-app browser | no | yes (sandboxed webviews) |
| Shell env | inherits process env | `inheritLoginShellEnv()` |

### E · Decision points (for the build phase)

1. **Desktop daemon model.** Keep Prism Electron in-process (broker optional), or adopt paseo's managed-daemon shell (Electron spawns/supervises the broker as a subprocess so all surfaces share one running daemon)? Hybrid: in-process controller stays, daemon-manager supervises the broker for the *new* multi-services (code-intel/design-gen/3d-gen).
2. **Seam unification.** Keep in-process `handleGrpcRequest` and the broker separate, or bridge them — register broker services into the gRPC registry (or vice-versa) so the existing webview `grpc_request` client transparently reaches broker services via a loopback adapter.
3. **First build target.** Desktop daemon-manager (port paseo's pattern, the user's emphasis) · seam bridge (one envelope everywhere) · or the worklist §I follow-ups (paseo-dialect shim · `prism daemon ls` + panel wiring).
4. **Borrowables from paseo desktop** (independently useful regardless of 1–3): `inheritLoginShellEnv`, single-instance lock + deep-link routing, CLI passthrough (one binary), custom app protocol, dev worktree userData isolation, auto-update.
