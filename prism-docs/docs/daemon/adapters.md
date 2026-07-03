---
title: Adapters
description: The four adapter families that normalize N backend protocols into the broker's one client protocol.
outline: [2, 3]
---

# Adapters

Every brokered service speaks its own native protocol; an **adapter** normalizes it to the
broker's `Adapter` contract:

```ts
interface Adapter {
  probe(): Promise<ProbeResult>
  call(method: string, payload: unknown): Promise<unknown>
  stream(method: string, payload: unknown): AsyncIterable<StreamEvent>
  describe(): Promise<SkillManifestEntry[]>
  connect(): Promise<void>
  disconnect(): Promise<void>
}
```

`createAdapter(descriptor)` maps `adapterType` → implementation. There are **four families**
(five implementations):

## WebSocketAdapter (`websocket`)

The broker's clean generic dialect:

```
client → { type:"hello", clientId, version }
server → { type:"welcome", capabilities? }
client → { type:"request", id, method, payload, stream? }
server → { type:"response", id, ok, result?, error? }
server → { type:"stream", id, seq, kind, event }   (repeated)
server → { type:"stream_end", id }
```

## PaseoWebSocketAdapter (`websocket-paseo`)

Speaks the **real paseo daemon's** dialect (the live agent daemon at `:6767`), so `agent-run`
targets it directly — a sovereign absorption of paseo's protocol, not a dependency.

The daemon mounts its WebSocket on **`/ws`** (a bare-host URL is rejected at the upgrade), and it
completes the hello with a **`server_info`** status frame — *not* a `welcome`:

```
client → { type:"hello", clientId, clientType, protocolVersion, appVersion? }   (dial …:6767/ws)
server → { type:"session", message:{ type:"status", payload:{ status:"server_info", version, serverId } } }
client → { type:`${method}_request`,  requestId, ...payload }
server → { type:`${method}_response`, requestId, ... }       (requestId-correlated)
server → push frames (timeline / turn_* / agent_*)           (surfaced via stream())
```

`call("fetch_agents", {})` sends `fetch_agents_request` and awaits `fetch_agents_response`;
`stream("timeline", …)` forwards every push frame whose `type === "timeline"`.

> **3.8.0 fix:** the adapter previously dialed the bare URL and awaited a `welcome` frame the daemon
> never sends, so `agent-run` was stuck in `error`. It now normalizes a path-less endpoint to `/ws`
> and accepts the `server_info` frame as connection-complete (the `welcome` branch is kept for any
> clean-dialect daemon) → `agent-run` reports `ready` in `prism-cli daemon ls`.

## RestAdapter (`rest`)

Config-driven, multi-route REST. Built for **design-gen**: lifecycle on the prism-design-studio
relay (`:7457` → `/status`, `/launch`, `/stop`) and work on the engine (`:7456` → `/api/chat`),
with readiness probed at `/api/skills`. Methods map to routes via `descriptor.routes`:

```json
"routes": {
  "state":  { "verb": "GET",  "url": "http://127.0.0.1:7457/status" },
  "launch": { "verb": "POST", "url": "http://127.0.0.1:7457/launch" },
  "stop":   { "verb": "POST", "url": "http://127.0.0.1:7457/stop" },
  "send":   { "verb": "POST", "url": "http://127.0.0.1:7456/api/chat" }
}
```

## StdioMcpAdapter (`stdio-mcp`)

Spawns and speaks to a stdio **MCP** server — used for **code-intel** (codebase-memory-mcp).
Unlike paseo, code-intel needs no dialect shim: MCP is already a standard. Probed via
`tools/list`; proven against the LIVE binary on Windows.

## FlaskHttpAdapter (`flask-http`)

**One** adapter for every Python/Flask-style HTTP backend — `knowledge` (Graphify / Synaptiq),
`3d-gen` (Lucid / ComfyUI), `cinopsis` (video → structured), and `notebooks` (Jupyter) — all
parameterized by endpoint + manifest. Convention:

```
probe  → {healthProbe}            e.g. "GET /skills"   (JSON { skills:[…] } or { tools:[…] })
call   → POST {baseUrl}/{method}  JSON body = payload, JSON response = result
stream → single POST result as one frame
```

This one adapter covering four services is the shared-substrate payoff: Cinopsis (Flask),
notebooks (Jupyter/Python), and 3d-gen (ComfyUI) all ride the same code.
