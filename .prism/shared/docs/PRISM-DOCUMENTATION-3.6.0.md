# Prism - Complete Documentation v3.6.0

> A multi-platform development workflow suite for autonomous AI-driven development.
> Includes a Charmbracelet TUI dashboard (Go), a VS Code extension (TypeScript/React),
> an Electron desktop app (TypeScript/React), a vendored Expo mobile surface, and a
> sovereign multi-service daemon-broker that every surface speaks to.

---

## What's New in 3.6.0 — The Daemon Arc

3.6.0 introduces the **Prism daemon-broker**: one sovereign, self-hosted hub that fronts
every backend service (agents, code-intelligence, design generation, knowledge, 3D, video,
notebooks) behind a single client protocol — and wires the desktop to supervise it. This is
the "one daemon all surfaces speak to" foundation, built so Fragment can extract
broker + adapters + relay + clients for every Griot tool.

> **Sovereignty invariant:** every donor (paseo, open-design, Graphify, codebase-memory-mcp)
> is *absorbed* into a Prism-owned package — never a runtime dependency traffic routes through.

### Added — Daemon-broker (`packages/prism-daemon`)

- **Multi-service broker** normalizing N backend protocols → ONE WebSocket client protocol.
  Wire envelope `BrokerEnvelope { id, service, method, payload, caps, stream, ts }` with a
  `WSHello → WSWelcome` handshake that ships the live service registry, plus push frames
  (`service_update`, `service_stream`, `permission_request`). Append-only schema discipline.
- **Four adapter families**, one per protocol shape:
  - **WebSocketAdapter** — the broker's clean generic dialect.
  - **PaseoWebSocketAdapter** (`websocket-paseo`) — speaks the *real* paseo daemon's dialect
    (hello/welcome + `<cmd>_request`/`<cmd>_response` requestId-correlated RPCs + push frames),
    so `agent-run` targets the live paseo daemon at `:6767`.
  - **RestAdapter** — config-driven multi-route REST (design-gen across the design-studio
    relay `:7457` + engine `:7456`).
  - **StdioMcpAdapter** — stdio MCP servers (code-intel / codebase-memory-mcp).
  - **FlaskHttpAdapter** — ONE adapter for every Python/Flask backend (knowledge/Graphify,
    3d-gen/Lucid, cinopsis, notebooks), parameterized by endpoint + manifest.
- **7 registered services** (`services.config.json`): agent-run, code-intel, design-gen,
  knowledge, 3d-gen, cinopsis, notebooks.
- **try-local→cloud** resolution with a VRAM gate (`PRISM_VRAM_GB` / `nvidia-smi`), boot
  readiness probing (`broker.init()`), and a 15 s health loop with `service_update` broadcast.
- **HTTP control plane** — `GET /services`, `GET /health` (`{ ok, version, serviceCount, ready }`),
  `POST /register`, `POST /deregister`, `POST /call` (unary over plain HTTP, so surfaces never
  bundle `ws`). `PRISM_DAEMON_CONFIG` env override for a bundled config path. Broker self-port **6780**.

### Added — Surface clients

- **`@prism/daemon-client`** (TypeScript) — `DaemonClient` (connect/call/stream/onServiceUpdate)
  for VS Code / Electron / mobile-web, with its own minimal protocol mirror (no runtime dep on the broker).
- **`apps/prism-cli/daemon`** (Go) — a hand-written `coder/websocket` client; the Go TUI is a
  first-class real-time broker client with no Node dependency. Cross-language conformance proven.
- **`prism-cli daemon ls`** — new Cobra subcommand: dials the broker and prints the live service
  registry (status badge / id / name / method count).

### Added — Desktop daemon-manager (`apps/prism-electron`)

- The Electron app now **spawns and supervises the broker** as a child process via
  `utilityProcess.fork` on an esbuilt single-file bundle (`scripts/build-daemon.mjs` →
  `daemon-dist/prism-daemon.cjs`, shipped outside the asar via forge `extraResource`).
- **DaemonManager** (headless-testable, injected `fork`/`fetch`): adopt-an-existing-broker,
  spawn + health-poll, crash-restart with backoff, version-sync via `meta.json`, and
  kill-on-quit (only the broker it started; adopted brokers are left alive).
- `daemon:status|start|stop|restart` IPC + a live **daemon status dot** in the bottom status bar
  (running = green, starting = amber pulse, error = red, stopped = dim).

### Added — Seam bridge & E2EE relay

- **Seam bridge** (`@prism/core` `grpc-handler`) — an injectable `BrokerForwarder`: `service.method`
  keys with no local handler forward to the broker, so the renderer's existing gRPC client
  transparently reaches brokered services. The in-process gRPC seam and the over-the-wire broker
  share one `service.method` envelope shape — turning a future "full-managed" move into a
  transport flip, not a rewrite.
- **`packages/prism-relay`** (`@prism/relay`) — sovereign extraction of paseo's zero-knowledge
  relay: Curve25519 ECDH + NaCl box (XSalsa20-Poly1305), `createClientChannel` / `createDaemonChannel`
  / `EncryptedChannel`. `RelayClient` + `broker.connectRelay({ daemonKeyPair })` now encrypt every
  channel end-to-end (clear-mode back-compat preserved); `pairingInfo` ships the daemon public key
  for QR pairing.

### Changed

- **Design-engine handlers** (`PrismPanelProvider.ts`) migrated to **broker-preferred /
  direct-fallback**: `requestDesignEngineState→design-gen.state`, `launchDesignEngine→launch`,
  `stopDesignEngine→stop`, `sendDesignPrompt→design-gen.send`, via a `_brokerCall()` helper to
  `POST :6780/call`. Falls back to the original direct connection when the broker is down.
  `openDesignArtifact`/`openFile` stay client-local.
- **Sovereign Fork Registry** updated — `@prism/relay` registered as an extracted sovereign fork
  alongside the paseo / open-design donors.

### Testing

- `@prism/daemon` **40/40** vitest · `@prism/relay` **4/4** (ECDH round-trip + handshake both
  directions) · `@prism/core` seam bridge **4/4** · `prism-electron` **13/13** (supervisor state
  machine) · Go CLI `build`/`vet` + live `daemon ls`. code-intel proven vs the LIVE
  codebase-memory-mcp; Go client proven vs the LIVE TS daemon; full E2EE relay round-trip proven.

### New workspace packages

- `packages/prism-daemon` — the broker.
- `packages/prism-daemon-client` — TypeScript surface client.
- `packages/prism-relay` — sovereign E2EE relay.

### Deferred (tracked, non-blocking)

- Full-managed move (agent-run behind the broker) — now a transport flip via the seam bridge.
- QR-pairing UI + live Cloudflare relay-server verification.
- VS Code-side broker forwarder (Electron side shipped).
- Graphify sovereign fork; code-intel capability build (hybrid search, graph→SKILL.md, `/prism-wiki`);
  prism-mobile v0.1.95 refresh.

---

## Architecture (v3.6.0)

```
Surfaces:  CLI (Go/Bubble Tea) · VS Code (TS/React) · Electron (TS/React, reuses VS Code src) · Mobile (vendored Expo)
                                  │
              in-process gRPC seam (grpc-handler, postMessage/IPC)  ─┐
                                  │                                  ├─ same {service,method,payload} envelope
              over-the-wire broker (WebSocket :6780 + HTTP /call)  ─┘
                                  │
   ┌──────────────┬──────────────┼───────────────┬───────────────┐
 agent-run     code-intel     design-gen      knowledge        3d-gen / cinopsis / notebooks
 (paseo WS)    (stdio MCP)    (REST relay)    (Flask HTTP)      (Flask HTTP, try-local→cloud)
                                  │
                          relay (E2EE, @prism/relay) → off-LAN clients via QR pairing
```

The Electron desktop supervises the broker (spawn / health / restart / version-sync / quit).

---

## Prior Releases

See `PRISM-DOCUMENTATION-3.5.2.md` and earlier for the full cumulative history (Spectrum
hardening, brainstorm visual companion, prism-subagent, prism-capture/brand, and the
Research → Plan → Implement → Validate core).
