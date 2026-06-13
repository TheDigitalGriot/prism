---
date: 2026-06-13
author: Claude (prism-plan)
status: awaiting-approval
feature: "Desktop daemon-manager — prism-electron supervises the prism-daemon broker (hybrid + bridge, Phase 1)"
direction: "Hybrid + bridge, daemon-manager first (locked 2026-06-13)"
spawn: "Electron utilityProcess.fork on an esbuilt broker bundle (locked)"
startup: "Eager — on app ready (locked)"
inputs:
  - .prism/shared/research/2026-06-13-prism-vs-paseo-surface-architecture.md  # §D + decision points
  - .prism/shared/research/2026-06-12-paseo-daemon-architecture-surface-impact.md
  - .prism/shared/handoffs/2026-06-12-daemon-memory-arc-worklist.md           # §I
reference (read-only): apps/prism-mobile/packages/desktop/src/daemon/*        # paseo pattern
---

# Desktop daemon-manager — prism-electron supervises the broker

## Goal

Make `prism-electron` **spawn + supervise** the `prism-daemon` broker (`packages/prism-daemon`, default `127.0.0.1:6780`) as a child process: track status, probe health, restart on crash, sync version, and kill on quit — surfacing live daemon state in the renderer. **Agents stay in-process.** This is Phase 1 of the hybrid path; the seam-bridge (Phase 6) is sketched but **not built** here.

This realizes "one daemon all surfaces speak" for the *new* multi-services (code-intel / design-gen / 3d-gen / knowledge) without touching the working in-process agent loop — and it does so reversibly, so a future full-managed move is a transport flip, not a rewrite.

## Locked Decisions

1. **Spawn:** Electron `utilityProcess.fork` on an esbuilt single-file broker bundle (no external node; built-in Node context; dev/prod symmetric).
2. **Startup:** Eager — start the broker on `app.ready`; crash-restart + health loop provide resilience.
3. **Status transport:** HTTP health probe against the broker's own endpoints (reuse `GET /services`, add `GET /health`). `utilityProcess` is used for lifecycle + stdio logging, not as the status channel.
4. **Adopt-don't-fight:** if `GET /health` already answers on the port before we spawn, **adopt** the running broker (mark `running`, do not spawn, do not kill on quit — "stop only what we started," per paseo's quit-lifecycle).

## What We're NOT Doing

- NOT moving `agent-run` / the `core/task` loop behind the broker (that is the deferred full-managed step).
- NOT building the seam bridge (loopback adapter) — only sketched as Phase 6.
- NOT touching VSCode, the relay, the CLI, or the mobile tree.
- NOT adding a MessagePort RPC between main and the broker child (HTTP probe is sufficient now).

## Structural Impact (graph-informed)

Graph not run: change targets are **new files** plus additive edits to known seams (`main.ts` entry, `ElectronIPCBridge` constructor, broker `handleHttp`, daemon `index.ts`). Blast radius **LOW**.

- `ElectronIPCBridge` constructor gains a `daemonManager` param — sole caller is `apps/prism-electron/src/main.ts`.
- Broker `handleHttp` + `index.ts` edits are purely additive (new route, new env fallback).
- No deletions; no dead code introduced.

---

## Phase 1 — Broker readiness surface (`@prism/daemon`)

**Goal:** give the manager a cheap, versioned health endpoint and let a packaged bundle locate its config.

**Files:**
- modify `packages/prism-daemon/src/broker.ts` — add a `GET /health` branch in `handleHttp` (before the `/services` branch). `BROKER_VERSION` is already defined in this module.
- modify `packages/prism-daemon/src/index.ts` — config path honors an env override.
- modify `packages/prism-daemon/src/registration.test.ts` — cover `/health`.

**Steps:**
1. In `handleHttp`, add:
   ```ts
   if (req.method === "GET" && url === "/health") {
     const snap = this.registry.snapshot();
     send(200, {
       ok: true,
       version: BROKER_VERSION,
       serviceCount: snap.length,
       ready: snap.filter((s) => s.status === "ready").length,
     });
     return;
   }
   ```
2. In `index.ts`, change the config constant to:
   `const CONFIG_PATH = process.env.PRISM_DAEMON_CONFIG ?? join(__dirname, "..", "services.config.json");`
3. Add a `registration.test.ts` case: boot broker → `GET /health` → `{ ok:true, version: <semver string>, serviceCount: 0, ready: 0 }`.

#### Automated Verification
- [ ] `npm run typecheck -w @prism/daemon` clean.
- [ ] `npm test -w @prism/daemon` green incl. the new `/health` test (target 35/35).

#### Manual Verification
- [ ] `node` running the daemon answers `GET http://127.0.0.1:6780/health` with the version string.

**Checkpoint:** [ ] Phase 1 complete.

---

## Phase 2 — Packaged broker bundle (esbuild) + forge wiring

**Goal:** produce a single-file broker the desktop can fork in dev and packaged builds, with its config alongside.

**Files:**
- create `apps/prism-electron/scripts/build-daemon.mjs` — esbuild bundle + copy config + write meta.
- modify `apps/prism-electron/package.json` — add `esbuild` devDep; `build:daemon`, `prestart`, `prepackage` scripts.
- modify `apps/prism-electron/forge.config.ts` — ship `daemon-dist/` via `extraResource`; `hooks.generateAssets` runs the bundle.
- create `apps/prism-electron/.gitignore` entry (or root) for `daemon-dist/` (build artifact).

**Steps:**
1. `build-daemon.mjs` (Node ESM, invokes esbuild API):
   - `entryPoints: ['../../packages/prism-daemon/src/index.ts']`, `bundle: true`, `platform: 'node'`, `format: 'cjs'`, `target: 'node20'`, `outfile: 'daemon-dist/prism-daemon.cjs'`.
   - `external: ['bufferutil', 'utf-8-validate']` (ws's optional native deps; ws runs without them).
   - copy `packages/prism-daemon/services.config.json` → `daemon-dist/services.config.json`.
   - write `daemon-dist/meta.json` = `{ "version": <read from packages/prism-daemon/package.json> }` (the expected-version oracle for version-sync).
2. `package.json` scripts: `"build:daemon": "node scripts/build-daemon.mjs"`, `"prestart": "npm run build:daemon"`, `"prepackage": "npm run build:daemon"`.
3. `forge.config.ts`: add `'daemon-dist'` to `packagerConfig.extraResource`; add `hooks: { generateAssets: async () => { /* spawn build:daemon */ } }`.

#### Automated Verification
- [ ] `npm run build:daemon -w prism-electron` produces `daemon-dist/prism-daemon.cjs`, `services.config.json`, and `meta.json`.
- [ ] Smoke: `node apps/prism-electron/daemon-dist/prism-daemon.cjs` boots and answers `GET /health` (script: start, curl, kill); exit code 0.

#### Manual Verification
- [ ] `npm start -w prism-electron` still launches the app (prestart bundle runs without error).

**Checkpoint:** [ ] Phase 2 complete.

---

## Phase 3 — `DaemonManager` + `runtime-paths` (headless-testable)

**Goal:** the supervisor state machine, with electron-specific bits injected so it unit-tests without an Electron runtime.

**Files:**
- create `apps/prism-electron/src/daemon/runtime-paths.ts` — pure path/env resolution.
- create `apps/prism-electron/src/daemon/daemon-manager.ts` — `DaemonManager` class (deps injected).
- create `apps/prism-electron/src/daemon/daemon-manager.test.ts` + `runtime-paths.test.ts`.
- modify `apps/prism-electron/package.json` — add `vitest` devDep + `"test": "vitest run"`.
- create `apps/prism-electron/vitest.config.ts`.

**Steps:**
1. `runtime-paths.ts` (pure functions, no `electron` import):
   - `resolveBrokerEntry({ isPackaged, resourcesPath, appRoot }): string` — packaged: `join(resourcesPath, 'daemon-dist', 'prism-daemon.cjs')`; dev: `join(appRoot, 'daemon-dist', 'prism-daemon.cjs')`.
   - `resolveConfigPath(brokerEntry): string` — sibling `services.config.json`.
   - `readExpectedVersion(brokerEntry): string` — read sibling `meta.json`.
2. `daemon-manager.ts` — `DaemonManager` constructed with injected deps:
   `{ fork, fetchFn, brokerEntry, configPath, port, expectedVersion }` where `fork` matches `utilityProcess.fork`'s shape and `fetchFn` defaults to global `fetch`. The module does **not** import `electron`.
   - State: `status: 'stopped'|'starting'|'running'|'error'`, `port`, `pid`, `version`, `adopted: boolean`.
   - `start()`:
     1. probe `GET /health`; if it answers → **adopt** (`status='running'`, `adopted=true`, capture version), emit, return.
     2. else `status='starting'`, emit; `fork(brokerEntry, [], { env: { ...process.env, PRISM_DAEMON_PORT: String(port), PRISM_DAEMON_CONFIG: configPath }, stdio: 'pipe' })`.
     3. poll `/health` (≤10 × 500 ms); on ok → `status='running'`, capture pid/version, emit; on timeout → `status='error'`, emit.
     4. on running: if `version !== expectedVersion` → log mismatch, `restart()` once.
   - child `exit` handler: if not `_intentionalStop` and not adopted → `scheduleRestart()` (backoff 1s→2s→4s…cap 30s, max 5 consecutive; after cap → `status='error'`).
   - `stop()`: set `_intentionalStop`; if we spawned it, `_proc.kill()`; `status='stopped'`, emit. (Adopted brokers are left running.)
   - `restart()`: `stop()` (reset intentional flag) → `start()`.
   - `getStatus()`: snapshot object. Extends `EventEmitter`; emits `'statusChange'` with the snapshot.
3. Tests (inject fakes — no electron, no real ports):
   - `runtime-paths.test.ts`: packaged vs dev path resolution; config + meta siblings.
   - `daemon-manager.test.ts`: (a) adopt when `fetchFn` reports healthy pre-spawn → never calls `fork`; (b) spawn→health-ok→`running` with version/pid; (c) health-timeout→`error`; (d) child `exit`→restart scheduled→`fork` called again; (e) version mismatch→one restart; (f) `stop()` kills + marks stopped + no restart.

#### Automated Verification
- [ ] `npm run test -w prism-electron` green (all `DaemonManager` + `runtime-paths` cases).
- [ ] `npm run lint -w prism-electron` clean (eslint already configured).
- [ ] `tsc` typecheck of `src/` clean (via the renderer/main build configs).

#### Manual Verification
- [ ] None (covered by automated state-machine tests).

**Checkpoint:** [ ] Phase 3 complete.

---

## Phase 4 — Wire into the app (main + IPC + preload + quit)

**Goal:** start the broker eagerly, expose `daemon:*` IPC, forward status to the renderer, kill on quit.

**Files:**
- modify `apps/prism-electron/src/main.ts` — construct + start `DaemonManager` on ready; `before-quit` stops it; pass it to the bridge.
- modify `apps/prism-electron/src/hosts/electron/ElectronIPCBridge.ts` — accept `daemonManager`; add `daemon:status|start|stop|restart` handlers; forward `'statusChange'` → `webContents.send('daemon:statusChange', …)`; remove the handlers in `dispose()`.
- modify `apps/prism-electron/src/preload.ts` — add `daemonStatus()` + `onDaemonStatus(cb)` convenience methods (+ Window typing).

**Steps:**
1. `main.ts`: after `app.on('ready', …)`, build the manager with real deps —
   `new DaemonManager({ fork: utilityProcess.fork, fetchFn: fetch, brokerEntry: resolveBrokerEntry({ isPackaged: app.isPackaged, resourcesPath: process.resourcesPath, appRoot: app.getAppPath() }), configPath, port: 6780, expectedVersion })` — and `void manager.start()`. Hold an app-level singleton (not per-window). Pass it into `new ElectronIPCBridge(mainWindow, manager)`.
2. `before-quit` (async, paseo `quit-lifecycle` shape): `event.preventDefault()` once, `await manager.stop()`, then `app.quit()` (guard against re-entry).
3. `ElectronIPCBridge`: constructor `(mainWindow, daemonManager)`; in `_registerHandlers` add `ipcMain.handle('daemon:status', () => daemonManager.getStatus())`, `'daemon:start'`, `'daemon:stop'`, `'daemon:restart'`; subscribe `daemonManager.on('statusChange', s => !mainWindow.isDestroyed() && mainWindow.webContents.send('daemon:statusChange', s))`; `dispose()` removes the four handlers (but does **not** stop the app-global daemon).
4. `preload.ts`: `daemonStatus: () => ipcRenderer.invoke('daemon:status')`, `onDaemonStatus: (cb) => { const w=(_,s)=>cb(s); ipcRenderer.on('daemon:statusChange', w); return () => ipcRenderer.removeListener('daemon:statusChange', w) }`; extend the `electronAPI` Window type.

#### Automated Verification
- [ ] `npm run build:daemon -w prism-electron` + `npm run lint -w prism-electron` clean.
- [ ] Main/preload typecheck clean under the forge-vite build (`npm run package -w prism-electron` reaches the build step without TS errors — may stop before full make).

#### Manual Verification
- [ ] `npm start` → broker child spawns; `GET /health` answers; main-process log shows `running` + version.
- [ ] Quitting the app terminates the broker child (no orphan `prism-daemon.cjs` process).
- [ ] Launching with a broker already on :6780 → status `running` (adopted); quitting does **not** kill that pre-existing broker.

**Checkpoint:** [ ] Phase 4 complete.

---

## Phase 5 — Renderer daemon indicator

**Goal:** show daemon state in the desktop shell.

**Files:**
- create `apps/prism-electron/webview-ui/src/daemon/useDaemonStatus.ts` — hook: `electronAPI.daemonStatus()` on mount + `onDaemonStatus` subscription.
- create `apps/prism-electron/webview-ui/src/components/common/DaemonStatusDot.tsx` — colored dot + tooltip (`running`=green, `starting`=amber pulse, `error`=red, `stopped`=dim) reusing the `StatusDot` pulse style.
- modify `apps/prism-electron/webview-ui/src/components/layout/BottomStatusBar.tsx` — render the dot + `Daemon` label in the left cluster (next to `v{version}`).

**Steps:**
1. `useDaemonStatus.ts`: `const [status,setStatus]=useState<DaemonStatus|null>(null)`; on mount `window.electronAPI.daemonStatus().then(setStatus)` + `const off = window.electronAPI.onDaemonStatus(setStatus); return off`.
2. `DaemonStatusDot.tsx`: map status→color; `title={`Daemon: ${status} (:${port})`}`.
3. `BottomStatusBar.tsx`: import + render `<DaemonStatusDot/>` + a small `Daemon` text after the version span.

#### Automated Verification
- [ ] `npm run build -w prism-webview-ui`-equivalent for the electron renderer: `tsc -b && vite build` in `webview-ui` succeeds (type-check + build clean).

#### Manual Verification
- [ ] Launch desktop → bottom-left shows a green daemon dot once `running`; killing the broker (Task Manager) flips it to red then back to green after auto-restart.
- [ ] A brokered call (`POST :6780/call` to a reachable service, or design-gen state) succeeds while the dot is green.

**Checkpoint:** [ ] Phase 5 complete.

---

## Phase 6 — Seam bridge (SKETCH ONLY — not built this pass)

**Goal (future):** register broker services into the in-process gRPC registry so the renderer's existing `grpc_request` client transparently reaches `code-intel` / `design-gen` / etc.

**Shape:** a loopback module that, for `service.method` keys not present in `_unaryRegistry`/`_streamRegistry`, forwards to the broker (`POST /call` for unary, WS `service_stream` for streaming) and relays the response through the same `grpc_response` channel. Registered once at controller init. Turns "full-managed" into a per-call transport flip later.

**Deferred** — opens after Phase 5 ships and we decide to unify the seams.

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| esbuild bundles ws's native optional deps and fails | Med | `external: ['bufferutil','utf-8-validate']`; ws falls back to pure JS |
| Port 6780 already taken by a dev-run broker | Med | Adopt-don't-fight: pre-spawn `/health` probe → adopt + don't kill on quit |
| Orphan broker process on hard-crash of Electron | Low | `utilityProcess` children are tied to the app; `before-quit` stop; adopt-logic reclaims a stray on next launch |
| `before-quit` async stop races the quit | Med | One-shot `preventDefault` + re-entry guard (paseo `quit-lifecycle` shape) |
| Packaged asar can't fork a file inside asar | Low | Bundle ships via `extraResource` → `resources/daemon-dist/` (outside asar) |
| Importing `@prism/daemon` into main bloats the main bundle | Low | Manager is electron/daemon-free; expected version read from `meta.json`, not an import |

## Edge Cases

- Broker exits cleanly (code 0) right after we asked it to stop → no restart (intentional flag set).
- Health endpoint reachable but version unpar...seable → treat as mismatch → one restart, then run as-is.
- Renderer mounts before `daemon:status` is ready → hook tolerates `null`, dot renders `stopped` until first event.
- Multiple windows (future) → daemon is app-global; only one manager; each bridge subscribes for its own window.

## Success Criteria (rollup)

#### Automated Verification
- [ ] `npm test -w @prism/daemon` green incl. `/health` (≈35/35).
- [ ] `npm run test -w prism-electron` green (DaemonManager + runtime-paths).
- [ ] `npm run build:daemon -w prism-electron` emits bundle + config + meta; bundle boots + answers `/health`.
- [ ] `npm run lint -w prism-electron` clean; renderer `tsc -b && vite build` clean.

#### Manual Verification
- [ ] Launch desktop → daemon status flips `starting`→`running` (dot green, version shown).
- [ ] A brokered service call succeeds with the daemon running.
- [ ] Quit kills the spawned broker; a pre-existing (adopted) broker is left alive.
- [ ] Kill the broker externally → auto-restart returns it to `running`.

## Commit Plan

Conventional commits, explicit paths (avoid unrelated workspace churn / `prism-eval`):
- `feat(daemon): GET /health endpoint + PRISM_DAEMON_CONFIG override` (Phase 1)
- `build(electron): esbuild broker bundle + forge extraResource wiring` (Phase 2)
- `feat(electron): DaemonManager + runtime-paths supervisor (headless-tested)` (Phase 3)
- `feat(electron): spawn/supervise broker on ready, daemon:* IPC, kill on quit` (Phase 4)
- `feat(electron): daemon status indicator in BottomStatusBar` (Phase 5)

Trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
