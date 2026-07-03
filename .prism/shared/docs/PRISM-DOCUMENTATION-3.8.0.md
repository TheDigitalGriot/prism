# Prism - Complete Documentation v3.8.0

> A multi-platform development workflow suite for autonomous AI-driven development.
> Includes a Charmbracelet TUI dashboard (Go), a VS Code extension (TypeScript/React),
> an Electron desktop app (TypeScript/React), a vendored Expo mobile surface, and a
> sovereign multi-service daemon-broker that every surface speaks to.

---

## What's New in 3.8.0 — Surfaces Go Live

3.8.0 turns the deferred infrastructure of the Explorer/Daemon arcs into *working* surfaces.
The **`agent-run` broker service actually connects** to the live agent daemon (`error → ready`),
the **mobile app builds and installs on-device** (EAS iOS dev client, per-variant icons), and the
**Architecture Explorer becomes a native part of the docs site** rather than a bolted-on page.

> **Continuity:** 3.7.0 shipped the Explorer as a standalone GitHub Pages artifact and the
> `AgentRunClient` seam; 3.8.0 makes the Explorer a first-class page in the docs shell and gets
> the broker's paseo-dialect adapter talking to the real daemon.

### Added — Native Architecture Explorer

- The Explorer (three views: **Runtime / Workflows / Plugin**) is ported from a standalone
  `public/architecture.html` into a **native VitePress component** (`ArchitectureExplorer.vue`).
  It now lives **inside the docs shell** — top nav, spectral bar, theme toggle — and follows the
  site's light/dark palette via CSS variables, with **all canvas functionality preserved**:
  pan / zoom / fit / reset / expand and click-to-open node drawers.
- The 3-view dataset is extracted to a typed data module; the page is client-only (SSR-safe) and
  full-bleed beneath the nav. Old `/architecture.html` links resolve to the new `/architecture`.

### Fixed — Daemon `agent-run` reaches the live daemon

- The **`PaseoWebSocketAdapter`** dialed the bare daemon URL and awaited a `welcome` frame, but the
  paseo daemon mounts its WebSocket on **`/ws`** and completes the hello with a **`server_info`**
  status frame — never a `welcome`. Both layers are now handled: the adapter normalizes a path-less
  endpoint to `/ws` and accepts the `server_info` frame as connection-complete (the `welcome` branch
  is kept for any clean-dialect daemon). Result: **`agent-run` flips `error → ready`** and shows
  `ready` in `prism-cli daemon ls`. Guarded by a regression test.
- **`prism-cli daemon ls`** — the Go WebSocket client's read limit (coder/websocket's 32 KiB default)
  was smaller than the broker's welcome frame (the full registry snapshot with capability manifests,
  ~45 KiB), so the CLI failed with *"message too big"*. Raised the client read limit to 1 MiB.

### Added — Mobile surface goes on-device

- **Per-variant app icons** — the development build (**"Prism Debug"**, `…prism.debug`) uses a
  **blue** icon; production (**"Prism"**, `…prism`) uses a **green** icon. Selected in
  `app.config.js` via `variant.icon`, so name, bundle id, and icon all track the variant.
- **Always-on droplet deploy** — `apps/prism-mobile/deploy/` (Dockerfile `node:22-bookworm`, a
  Coolify `docker-compose`, RUNBOOK, `.env.example`) runs the agent daemon **laptop-independently**
  on the DigitalOcean droplet, fronted by the live Cloudflare relay (`prism.digitalgriot.studio/relay`).
- **EAS iOS dev-client pipeline verified end-to-end** — the vendored paseo daemon builds under
  Node 22 (native `node-pty` / `better-sqlite3` ABI), binds `:6767`, and the dev client installs on a
  registered device.

### Fixed — Distribution & hygiene

- **Tauri installer build** — a pre-existing Rust borrow-after-move (`apps/prism-installer/src-tauri/
  src/detect.rs`, macOS editor detect) had broken the installer CI since the detect.rs change after
  3.6.0. Fixed, so the release again ships the **macOS DMG** and **Windows installer** alongside the
  CLI binaries.
- **Repo hygiene** — stopped tracking VitePress build output (`prism-docs/docs/.vitepress/dist/` +
  `cache/`); these are rebuilt by `docs:build` and the docs-deploy CI, and were polluting release
  commits.

### Verified (no code change)

- **GitHub Pages** enabled (Settings → Pages → GitHub Actions); the `docs-deploy` workflow builds
  VitePress fresh and publishes the site, so the native Explorer is live at
  `…github.io/prism-plugin/architecture`.

---

## Architecture (v3.8.0)

```
Surfaces:  CLI (Go/Bubble Tea) · VS Code (TS/React) · Electron (TS/React, reuses VS Code src) · Mobile (vendored Expo)
                                  │
              in-process gRPC seam (grpc-handler, postMessage/IPC)  ─┐
                                  │                                  ├─ same {service,method,payload} envelope
              over-the-wire broker (WebSocket :6780 + HTTP /call)  ─┘   (VS Code + Electron both forward here)
                                  │
   ┌──────────────┬──────────────┼───────────────┬───────────────┐
 agent-run     code-intel     design-gen      knowledge        3d-gen / cinopsis / notebooks
 (paseo WS →   (stdio MCP)    (REST relay)    (Graphify,        (Flask HTTP, try-local→cloud)
  /ws + server_info,                          stdio-MCP)
  error→ready)
                                  │
                          relay (E2EE, @prism/relay) → off-LAN clients via QR pairing
                                  │
              Architecture Explorer (Runtime / Workflows / Plugin) — native VitePress page in the docs shell
```

`agent-run` now completes the paseo handshake (`/ws` + `server_info`) and reports `ready`. The
Electron desktop supervises the broker (spawn / health / restart / version-sync / quit); the VS Code
extension adopts it. The mobile surface can run the same daemon container on the always-on droplet.

---

## Prior Releases

See `PRISM-DOCUMENTATION-3.7.0.md` (the Explorer Arc), `PRISM-DOCUMENTATION-3.6.0.md` (the Daemon
Arc), and `PRISM-DOCUMENTATION-3.5.2.md` and earlier for the full cumulative history (Spectrum
hardening, brainstorm visual companion, prism-subagent, and the Research → Plan → Implement →
Validate core).
