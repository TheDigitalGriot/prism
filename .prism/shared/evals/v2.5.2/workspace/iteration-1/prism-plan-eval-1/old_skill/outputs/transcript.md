# Prism Plan Eval Transcript (v2.4.8 Baseline)

**Date**: 2026-03-08
**Task**: Create a plan for adding WebSocket support to this project
**Skill Version**: v2.4.8-snapshot (baseline)
**Research Reference**: `.prism/shared/research/2026-03-07-websocket-research.md`

---

## Step 1: Load Context

### Action: Attempted to load research document

The skill instructs: "If research document exists, spawn `prism-analyzer` agent to analyze it."

Attempted to read `.prism/shared/research/2026-03-07-websocket-research.md` -- **file does not exist**.

Since the research file referenced in the task does not exist, I proceeded with "sufficient codebase understanding from current session" (the alternative prerequisite listed in the skill).

### Codebase Analysis Performed

Instead of spawning the `prism-analyzer` agent (since there is no research doc to analyze), I manually investigated the codebase to understand the current communication architecture:

**Files examined:**
- `packages/prism-core/src/core/controller/grpc-handler.ts` -- Core request dispatch (transport-agnostic gRPC-over-postMessage pattern)
- `cmd/prism-vscode/src/hosts/vscode/VscodeWebviewProvider.ts` -- VSCode host: routes `grpc_request` messages through `handleGrpcRequest`
- `cmd/prism-electron/src/hosts/electron/ElectronIPCBridge.ts` -- Electron host: routes IPC `grpc_request` through same handler
- `cmd/prism-cli/agentbus/bus.go` -- Go event bus (transport-agnostic pub/sub)
- `cmd/prism-cli/agentbus/consumer.go` -- `EventConsumer` interface; comment already mentions WebSocket as a potential transport

**Key Findings:**
1. The `handleGrpcRequest()` function is fully transport-agnostic. It takes a `postMessage` callback and a request object. Any transport that can serialize these objects can use it.
2. VSCode uses `webview.postMessage` as transport. Electron uses `ipcMain.handle` / `webContents.send`.
3. The Go CLI uses an `EventConsumer` interface that already documents WebSocket as a potential implementation.
4. There are two registries: `_unaryRegistry` (request/response) and `_streamRegistry` (server-push).
5. The `@prism-core` alias resolves to `packages/prism-core/src/*`, confirming the three-package split is partially in place.

---

## Step 2: Present Understanding

Per the v2.4.8 workflow, I would present this to the user and wait for confirmation:

---

### My Understanding

**Goal**: Add WebSocket support to the Prism project, enabling real-time bidirectional communication between clients and the backend. This would serve as a third transport alongside VSCode's `postMessage` and Electron's IPC.

**Key Files**:
- `packages/prism-core/src/core/controller/grpc-handler.ts` -- Already transport-agnostic; WebSocket would be a new transport binding
- `cmd/prism-cli/agentbus/consumer.go` -- `EventConsumer` interface already anticipates WebSocket; needs a concrete `WebSocketConsumer` implementation
- `cmd/prism-cli/agentbus/bus.go` -- Event bus that would publish to WebSocket consumers
- `cmd/prism-vscode/src/hosts/vscode/VscodeWebviewProvider.ts` -- Reference pattern for how a host binds to `handleGrpcRequest`
- `cmd/prism-electron/src/hosts/electron/ElectronIPCBridge.ts` -- Another reference pattern

**Patterns to Follow**:
- The `handleGrpcRequest(postMessage, request)` pattern: WebSocket transport would provide its own `postMessage` (sending JSON over WS) and parse incoming WS messages into the request format
- The `EventConsumer` interface in Go: a `WebSocketConsumer` would implement `OnEvent(event Event)` and push to connected WS clients
- Host-specific bridge classes (VscodeWebviewProvider, ElectronIPCBridge) as models for a `WebSocketBridge`

**Constraints**:
- Must not break existing VSCode or Electron transports
- The gRPC-over-postMessage protocol must remain the canonical API; WebSocket is just another transport
- Go CLI's agentbus is separate from the TypeScript controller -- both need WebSocket support if full-stack coverage is desired
- No existing WebSocket dependencies in the project

**Questions** (would present to user):
1. Is WebSocket intended for the Go CLI (exposing a WS server for remote dashboards), the TypeScript side (web browser client), or both?
2. Should WebSocket support authentication/authorization, or is it local-only?
3. Is this for the Spectrum autonomous execution use case (remote monitoring) or general-purpose?

---

*[SIMULATED: Would wait for user response here before proceeding]*

**Simulated user response**: "WebSocket is for the Go CLI side -- we want to expose a WebSocket server so that web-based dashboards can connect and receive real-time updates from the agentbus. TypeScript side is not needed yet. Local-only, no auth for now. Primary use case is remote monitoring of Spectrum runs."

---

## Step 3: Design Options

Per the v2.4.8 workflow, I would present approach options:

---

### Approach Options

#### Option A: Standalone WebSocket Server
- A new `cmd/prism-cli/ws/` package with a standalone HTTP/WS server
- Implements `EventConsumer` to bridge agentbus events to WS clients
- Runs on a separate goroutine alongside the TUI
- **Pros**: Clean separation, easy to test independently, can run headless without TUI
- **Cons**: Extra port to manage, separate lifecycle from TUI

#### Option B: Integrated into Existing CLI Server
- Add WebSocket upgrade handler to the existing CLI binary
- Wire into agentbus via existing subscription mechanism
- Co-located with the TUI process
- **Pros**: Single binary, shared lifecycle, simpler deployment
- **Cons**: Tighter coupling with TUI code

#### Option C: Separate Binary
- New `cmd/prism-ws/` binary purpose-built for WebSocket serving
- Reads same `stories.json` and `.prism/` state
- **Pros**: Fully independent, can scale separately
- **Cons**: Code duplication, separate process management, doesn't share live agentbus state

**Recommendation**: Option A -- Standalone WebSocket Server package within prism-cli. It uses the existing `EventConsumer` interface cleanly, can be optionally enabled, and doesn't require a separate binary.

---

*[SIMULATED: Would wait for user to choose approach]*

**Simulated user response**: "Go with Option A."

---

## Step 4: Get Structure Approval

Per the v2.4.8 workflow, I would present proposed phases:

---

### Proposed Phases

1. **WebSocket Consumer**: Implement `WebSocketConsumer` that satisfies the `EventConsumer` interface and manages connected clients
2. **WebSocket Server**: HTTP server with WebSocket upgrade, client connection management, heartbeat/ping-pong
3. **Event Serialization**: JSON serialization of agentbus events for WebSocket transmission (leverage existing `serializer.go`)
4. **CLI Integration**: Wire WebSocket server into the prism-cli binary with `--ws-port` flag and optional `--ws` enable flag
5. **Client Protocol**: Define the JSON message protocol (subscribe/unsubscribe, event filtering) and document it
6. **Testing**: Unit tests for consumer, integration tests for server, end-to-end test with mock client

Does this make sense?

---

*[SIMULATED: Would wait for user approval]*

**Simulated user response**: "Looks good, write the full plan."

---

## Step 5: Write Full Plan

Per the v2.4.8 workflow, the full plan would be saved to `.prism/shared/plans/2026-03-08-websocket-support.md`.

**NOTE: This is a simulation -- no plan file was actually written. Below is the plan content that WOULD be saved.**

---

### Plan Content (simulated)

```markdown
---
date: 2026-03-08
author: Claude
repository: prism-plugin
branch: feat/websocket-support
ticket: N/A
status: draft
research: .prism/shared/research/2026-03-07-websocket-research.md
---

# Plan: WebSocket Support for CLI Dashboard

## Overview

**Goal**: Add a WebSocket server to the Go CLI so web-based dashboards can receive real-time agentbus events during Spectrum runs.

**Research**: .prism/shared/research/2026-03-07-websocket-research.md (not found; planned from codebase analysis)

**Complexity**: Medium

**Estimated Phases**: 6

## Success Criteria

### Automated (CI/Scripts)
- [ ] `cd cmd/prism-cli && make test` -- All tests pass including new WS tests
- [ ] `cd cmd/prism-cli && make lint` -- No lint errors
- [ ] `go vet ./...` -- No vet warnings
- [ ] WebSocket server starts and accepts connections on configured port

### Manual Verification
- [ ] A browser-based WebSocket client (e.g., websocat) can connect and receive live events
- [ ] Starting prism-cli with `--ws-port 8080` exposes WebSocket on that port
- [ ] Events from a Spectrum run appear in real-time on the WS connection
- [ ] Disconnecting a client does not crash the server or the TUI
- [ ] Multiple simultaneous clients receive the same events
- [ ] No regressions in existing TUI functionality

## Phases

### Phase 1: WebSocket Consumer

**Goal**: Implement a `WebSocketConsumer` struct that satisfies the `EventConsumer` interface

**Files to create**:
| File | Purpose |
|------|---------|
| `cmd/prism-cli/ws/consumer.go` | WebSocketConsumer implementing EventConsumer |
| `cmd/prism-cli/ws/consumer_test.go` | Unit tests |

**Steps**:
1. [ ] Create `ws/` package under `cmd/prism-cli/`
2. [ ] Define `WebSocketConsumer` struct with a broadcast channel and client registry
3. [ ] Implement `OnEvent(event Event)` -- serialize event and broadcast to all connected clients
4. [ ] Implement `Close()` -- close all client connections and clean up
5. [ ] Write unit tests verifying EventConsumer contract

**Verification**:
```bash
cd cmd/prism-cli && go test -v ./ws/...
```

**Checkpoint**: Phase 1 complete

---

### Phase 2: WebSocket Server

**Goal**: HTTP server with WebSocket upgrade endpoint and client lifecycle management

**Files to create**:
| File | Purpose |
|------|---------|
| `cmd/prism-cli/ws/server.go` | HTTP server, WS upgrade, client management |
| `cmd/prism-cli/ws/client.go` | Per-client goroutine, write pump, ping/pong |
| `cmd/prism-cli/ws/server_test.go` | Integration tests |

**Steps**:
1. [ ] Add `gorilla/websocket` (or `nhooyr.io/websocket`) dependency
2. [ ] Implement `Server` struct with `Start(port int)` and `Shutdown(ctx)`
3. [ ] Handle WebSocket upgrade at `/ws` endpoint
4. [ ] Implement per-client write pump with buffered channel
5. [ ] Add ping/pong heartbeat (30s interval, 60s timeout)
6. [ ] Handle client disconnect gracefully (remove from registry)
7. [ ] Write integration test: start server, connect client, verify event delivery

**Verification**:
```bash
cd cmd/prism-cli && go test -v ./ws/... -run TestServer
```

**Checkpoint**: Phase 2 complete

---

### Phase 3: Event Serialization

**Goal**: JSON serialization of agentbus events for WebSocket transmission

**Files to modify**:
| File | Change |
|------|--------|
| `cmd/prism-cli/agentbus/serializer.go` | Ensure JSON tags on Event types (may already exist) |

**Files to create**:
| File | Purpose |
|------|---------|
| `cmd/prism-cli/ws/protocol.go` | WebSocket message envelope (type, payload, timestamp) |

**Steps**:
1. [ ] Review existing `serializer.go` for JSON support
2. [ ] Define WS message envelope: `{"type": "event", "event_type": "...", "payload": {...}, "ts": "..."}`
3. [ ] Implement `MarshalEvent(event Event) ([]byte, error)`
4. [ ] Add JSON tags to any Event fields lacking them
5. [ ] Write serialization round-trip tests

**Verification**:
```bash
cd cmd/prism-cli && go test -v ./ws/... -run TestProtocol
```

**Checkpoint**: Phase 3 complete

---

### Phase 4: CLI Integration

**Goal**: Wire WebSocket server into prism-cli binary with command-line flags

**Files to modify**:
| File | Change |
|------|--------|
| `cmd/prism-cli/app/model.go` | Add WS server lifecycle (Init, shutdown) |
| `cmd/prism-cli/main.go` (or Cobra root cmd) | Add `--ws-port` and `--ws` flags |

**Steps**:
1. [ ] Add `--ws` boolean flag (default false) and `--ws-port` int flag (default 8765)
2. [ ] In app initialization, if `--ws` is set, create WebSocketConsumer and register with agentbus
3. [ ] Start WS server in a separate goroutine
4. [ ] Wire graceful shutdown: on TUI exit, call `server.Shutdown(ctx)`
5. [ ] Log WebSocket server URL to TUI status bar

**Verification**:
```bash
cd cmd/prism-cli && make build
./prism-cli --ws --ws-port 8765 &
# In another terminal:
websocat ws://localhost:8765/ws
```

**Checkpoint**: Phase 4 complete

---

### Phase 5: Client Protocol Documentation

**Goal**: Define and document the WebSocket message protocol

**Files to create**:
| File | Purpose |
|------|---------|
| `cmd/prism-cli/ws/README.md` | Protocol documentation |

**Steps**:
1. [ ] Document message format (JSON envelope)
2. [ ] Document available event types (from agentbus/events.go)
3. [ ] Document connection lifecycle (connect, heartbeat, disconnect)
4. [ ] Document environment variable: `PRISM_WS_PORT`
5. [ ] Add example client code snippet (JavaScript)

**Verification**:
- Manual review of documentation accuracy

**Checkpoint**: Phase 5 complete

---

### Phase 6: End-to-End Testing

**Goal**: Verify complete pipeline from agentbus publish through WebSocket to client

**Files to create**:
| File | Purpose |
|------|---------|
| `cmd/prism-cli/ws/e2e_test.go` | End-to-end test with real bus and WS server |

**Steps**:
1. [ ] Create test that starts a Bus, registers WebSocketConsumer, starts WS server
2. [ ] Connect a test WebSocket client
3. [ ] Publish events on the bus, verify they arrive at the WS client
4. [ ] Test multiple clients receiving same events
5. [ ] Test client disconnect doesn't affect other clients or the bus
6. [ ] Test server shutdown with connected clients

**Verification**:
```bash
cd cmd/prism-cli && go test -v ./ws/... -run TestE2E -count=1
```

**Checkpoint**: Phase 6 complete

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Goroutine leak on client disconnect | Medium | Medium | Defer cleanup in client goroutine; use context cancellation |
| Slow client blocking bus | Medium | High | Buffered channels with drop-on-overflow (same pattern as ChannelConsumer) |
| Port conflict with other services | Low | Low | Configurable port, clear error message on bind failure |
| TUI performance impact | Low | Medium | WS runs in separate goroutines; bus.Publish already uses goroutines |

## Edge Cases

| Case | Handling |
|------|----------|
| No clients connected | Consumer drops events silently (no-op broadcast) |
| Client sends unexpected message | Log warning, ignore (server is primarily write-only) |
| Port already in use | Return clear error, don't crash TUI |
| Rapid connect/disconnect | Client registry uses mutex, handles race conditions |
| Very large events | Set max message size limit (e.g., 1MB) |

## Out of Scope

Explicitly excluded:
- [ ] TypeScript/browser WebSocket client implementation
- [ ] Authentication or authorization on WebSocket connections
- [ ] TLS/WSS support (local-only for now)
- [ ] Event filtering or subscription topics (all events broadcast to all clients)
- [ ] Persistent event replay / history buffer
- [ ] Web-based dashboard UI

## Rollback Plan

If critical issues arise:
```bash
git revert HEAD~N..HEAD
cd cmd/prism-cli && make build
```

Steps:
1. Revert commits from this feature
2. Rebuild CLI binary
3. The `--ws` flag simply won't exist; no data migration needed

## Dependencies

**Must complete first**:
- [ ] None -- agentbus EventConsumer interface already exists

**Can parallelize with**:
- [ ] Web dashboard UI (separate concern, would consume this WS API)

## Progress Log

| Phase | Status | Started | Completed | Notes |
|-------|--------|---------|-----------|-------|
| Phase 1 | Not started | | | |
| Phase 2 | Not started | | | |
| Phase 3 | Not started | | | |
| Phase 4 | Not started | | | |
| Phase 5 | Not started | | | |
| Phase 6 | Not started | | | |
```

---

## Workflow Observations (v2.4.8 Baseline)

### What the v2.4.8 skill did well:
1. **Clear 5-step workflow**: Load Context -> Present Understanding -> Design Options -> Structure Approval -> Write Full Plan
2. **Interactive gates**: Explicit "wait for user" points at steps 2, 3, and 4
3. **Agent references**: Lists available agents (codebase-analyzer, codebase-pattern-finder, prism-analyzer)
4. **Philosophy section**: Clear principles (plans are contracts, be skeptical, be interactive)
5. **Plan template reference**: Links to a full template with all sections

### What the v2.4.8 skill lacked or left ambiguous:
1. **No fallback guidance for missing research**: The skill says "If research document exists" but doesn't specify what to do if it doesn't exist beyond the vague "sufficient codebase understanding" prerequisite
2. **No guidance on how many questions are appropriate**: Step 2 says "only if code can't answer" but doesn't scope this
3. **TodoWrite instruction**: Step 5 says "Use TodoWrite to track phases" but this is a side concern mixed into the plan-writing step
4. **No plan size guidance**: No guidance on how many phases is appropriate for different complexity levels
5. **Template is referenced but not inline**: Has to follow a link to `references/plan-template.md`, which is fine for tooling but adds a step
6. **No explicit "save and confirm" step**: After writing the plan, there's no step to confirm with the user that the final plan is acceptable

### Timing:
- Context loading: ~2 minutes (file reads, codebase investigation)
- Understanding presentation: ~1 minute
- Design options: ~1 minute
- Structure approval: ~30 seconds
- Full plan writing: ~3 minutes
- **Total simulated time**: ~8 minutes

### Files referenced during planning:
- `c:/Users/digit/Developer/prism-plugin/.prism/shared/evals/v2.4.8-snapshot/skills/prism-plan/SKILL.md`
- `c:/Users/digit/Developer/prism-plugin/.prism/shared/evals/v2.4.8-snapshot/skills/prism-plan/references/plan-template.md`
- `c:/Users/digit/Developer/prism-plugin/packages/prism-core/src/core/controller/grpc-handler.ts`
- `c:/Users/digit/Developer/prism-plugin/cmd/prism-vscode/src/hosts/vscode/VscodeWebviewProvider.ts`
- `c:/Users/digit/Developer/prism-plugin/cmd/prism-electron/src/hosts/electron/ElectronIPCBridge.ts`
- `c:/Users/digit/Developer/prism-plugin/cmd/prism-cli/agentbus/bus.go`
- `c:/Users/digit/Developer/prism-plugin/cmd/prism-cli/agentbus/consumer.go`
- `c:/Users/digit/Developer/prism-plugin/cmd/prism-cli/agentbus/events.go`
