---
date: 2026-09-06
topic: Prism-side landing zone for a cross-app interop bus (paired-token lift)
scope: scripts/digital-griot-mcp, skills/prism-{gavel,brainstorm}/scripts, packages/prism-daemon*, apps/prism-electron/src/daemon
status: documentary - describes what exists today, no recommendations
---

# Prism interop landing zone - current seam

All paths relative to `C:\Users\digit\GriotApps\Prism`.

---

## 1. digital-griot-mcp server shape

**File:** `scripts/digital-griot-mcp/digital-griot-mcp.ts` (1233 lines, `#!/usr/bin/env bun`).

### Construction

`scripts/digital-griot-mcp/digital-griot-mcp.ts:62-76`

```ts
const server = new Server(
  { name: "digital-griot-mcp", version: "1.0.0" },
  {
    capabilities: { tools: {} },
    instructions: "Shared Digital Griot wake channel + tool server. ...",
  },
)
```

- **Name/version:** `digital-griot-mcp` / `1.0.0` - `:63`.
- **Declared capabilities:** `{ tools: {} }` and nothing else - `:65`. **CONFIRMED: there is no
  `experimental` key and no `experimental["claude/channel"]` anywhere in the file.** A grep for
  `experimental` in this file returns zero hits. This is the "passive bus" transport described in
  `skills/griot-agent-architect/SKILL.md:188` and
  `skills/fragment-sync/references/conformance-checklist.md:35`.
- **Instructions string:** `:66-74`. Tells the client that each notification's `session_id` meta key
  identifies the session and the `skill` meta key identifies the surface, that `content` is a
  human-readable summary, and that **on wake Claude reads the events file for that session** -
  brainstorm event -> resume brainstorm; gavel event (`skill=gavel`) -> run the requested `verb`.
- **Transport:** `StdioServerTransport`, connected at `:1211-1212`.

### The channel is declared in the plugin manifest, not in server capabilities

`.claude-plugin/plugin.json:22-35` registers the server and separately declares a `channels` array:

```json
"mcpServers": { "digital-griot-mcp": { "type": "stdio", "command": "bun",
  "args": ["${CLAUDE_PLUGIN_ROOT}/scripts/digital-griot-mcp/digital-griot-mcp.ts"] } },
"channels": [ { "server": "digital-griot-mcp" } ]
```

The channel association lives in the **plugin manifest**; the server object itself advertises only
`tools`.

### Wake notification + passive-mode probe

- The wake notification method actually emitted is `notifications/message/create` with
  `{ content, meta }` - `:1157-1163`. Failure is caught and logged to stderr only (`:1164-1169`).
- A capability probe fires one `notifications/message/create` right after `server.connect()`
  (`:1218-1225`). On throw it sets `passiveMode = true` (`:1228`) and logs
  "claude/channel not available - passive mode active (Claude Code < v2.1.80)" (`:1229-1232`).
- `passiveMode` is declared at `:1029`; when true the `/channel` POST short-circuits with
  `{ ok: true, passive: true }` and **suppresses the notification** (`:1147-1151`). The events file
  is still written - by `server.cjs`, not by this process (`:1145-1146`).

### Embedded HTTP listener (same Bun process)

- Port contract: `DEFAULT_PORT = 52342` (`:58`), overridable by `BRAINSTORM_CHANNEL_PORT` (`:59-60`).
  The header comment at `:32-36` marks the env-var name and default as a hard contract that
  `server.cjs`/`helper.js` depend on.
- `CHANNEL_SERVE_OPTIONS` (`:1059-1175`) binds `127.0.0.1` only (`:1061`), with wildcard CORS
  headers (`:1043-1047`).

| Method + path | Lines | Behavior |
|---|---|---|
| `OPTIONS *` | `:1065-1067` | 204 + CORS |
| `GET /health` | `:1069-1073` | `{ ok: true, port }` |
| `GET /status` | `:1077-1082` | `{ ok, passive, port }` - drives the drawer indicator |
| `POST /register` | `:1087-1099` | `sessionRegistry.set(session_id, true)` |
| `POST /unregister` | `:1101-1113` | `sessionRegistry.delete(session_id)` |
| `POST /channel` | `:1115-1173` | sanitize meta -> session route filter -> passive check -> wake notification |
| anything else | `:1115-1117` | 404 |

- `bindChannel()` (`:1182-1207`) retries every `REBIND_DELAY_MS = 3000` (`:1177`) when the port is
  taken, so a losing instance stands by and reclaims `:52342` when the winner exits. The retry timer
  is `unref()`-ed (`:1205`). Bind failure never kills the stdio transport (`:1180-1181`).

---

## 2. Tool inventory

`tools/list` handler: `:976-982` - maps over the `GAVEL_TOOLS` const array (`:84-299`) returning
`{name, description, inputSchema}`. `tools/call` dispatch: `:985-1016` (switch `:989-1006`,
catch-all `errJson` `:1007-1015`, unknown-tool branch `:1004-1005`).

**Seven tools total** (six gavel + one assertion facade). No registration, bus, or identity tool.

| Tool | Def | Handler | Required | Optional |
|---|---|---|---|---|
| `gavel_state` | `:85-122` | `handleGavelState` `:559-626` | - | `axis`, `filter` (`undecided`/`all`, default `undecided`), `state_dir`, `project_dir` |
| `gavel_decide` | `:123-157` | `handleGavelDecide` `:786-822` | `card_id` | `use`, `role` (`scaffold`/`component`/`pattern`), `stage`, `note`, `state_dir` |
| `gavel_open` | `:158-175` | `handleGavelOpen` `:629-655` | `card_id` | `state_dir` |
| `gavel_scan` | `:176-193` | `handleGavelScan` `:658-686` | `card_id` | `state_dir` |
| `gavel_commit` | `:194-226` | `handleGavelCommit` `:741-783` | - | `card_ids[]`, `batch` (object), `state_dir` |
| `gavel_verify` | `:227-248` | `handleGavelVerify` `:689-738` (async) | `card_id` | `slug`, `state_dir` |
| `griot_assert` | `:249-298` | `handleGriotAssert` `:881-973` | `claim` | `expression`, `expect`, `target`, `result{actual,passed,rung}`, `state_dir` |

### What each handler does

- **`gavel_state`** - `git show HEAD:live/dgs-definitive-plan.html` (`:352-355`), parses the
  `ITEMS`/`RESOLVE`/`APPS`/`VERTS` array literals (`:417-429`), filters `type === "oss-inspo"`
  (`:566-570`), computes per-axis counts via a `keyOf` mirror of the cockpit (`:573-600`), then
  `mkdirSync` + `writeFileSync` the whole payload to `$STATE_DIR/gavel-cards.json` (`:621-623`).
  Returns the payload plus `state_dir` and `written`.
- **`gavel_decide`** - read-modify-write of `$STATE_DIR/gavel-cards.json`. Errors if the file is
  missing (`:790-798`) or corrupt (`:800-804`); finds the card by `_id` (`:805`); mutates
  `decision`/`role`/`stage`/`note` (`:809-812`); writes the whole store back (`:813`). No wake,
  no artifact write.
- **`gavel_open`** - resolve-and-return. Loads cards (`:631`), runs `repoMeta()` (`:636`), returns
  `{action:"open_in_chrome", url, label, tier, stars, external, video_url, instruction}`. Opens
  nothing itself (`:651-653`).
- **`gavel_scan`** - resolve-and-return. Returns `{action:"run_potluck_search",
  skill:"griot-potluck-search", query, context{question,tool,app,detail,slug}}` (`:666-685`).
- **`gavel_commit`** - **the only reader of the events file.** With no `batch` argument it opens
  `$STATE_DIR/events`, splits on newline, and scans **backwards** for the last line whose
  `verb === "commit"` that carries `.batch` (`:746-763`); malformed lines are skipped silently
  (`:758-760`). Returns `{action:"run_dgs_plan_update", route:"dgs-plan-update", dry_run:true,
  hitl_required:true, state_dir, source, card_ids, batch}` (`:766-782`). Never writes
  griot-live-artifacts.
- **`gavel_verify`** - resolves a slug from arg -> `card.slug` -> RESOLVE row (`:695-699`); a
  non-`owner/name` slug returns verdict `u` (`:716-718`); otherwise
  `fetch("https://api.github.com/repos/"+slug)` with an optional `GITHUB_TOKEN` bearer (`:720-726`);
  200 -> `v` + stars, 404 -> `x`, anything else or a throw -> `u` (`:727-737`). `write: false` -
  never writes back (`:705`, `:711-713`).
- **`griot_assert`** - two phases. **Phase 1 (no `result`)** `:891-924`: `resolveAssertRung()` picks
  `mcp`/`bridge`/`cli`/`none` from environment facts only (`:845-870`) and returns rung + action +
  instruction. **Phase 2 (with `result`)** `:926-972`: verdict is `unverified` when `rung==="none"`,
  else `pass` when `passed===true`, else `fail` (`:928`); then write-through - `appendFileSync` a
  JSON line to `$dir/assertions.jsonl` (`:945-947`) and a Markdown row to `$dir/assertions.md`,
  creating the table header if absent (`:951-961`).

Shared helpers: `okJson` (`:554-556`), `errJson` (`:824-826`), `loadGavelCards` (`:461-494`),
`findCard` (`:496-498`), `repoMeta` (`:521-552`), `resmapOf` (`:517-519`).

---

## 3. File bus mechanics

### `resolveStateDir()` - precedence

`scripts/digital-griot-mcp/digital-griot-mcp.ts:434-454`. In order:

1. explicit `args.state_dir` (non-empty string) - `:436`
2. `process.env.GAVEL_STATE_DIR` - `:437`
3. `path.join(process.env.GAVEL_DIR, "state")` - `:438`
4. newest gavel session: `<projectDir>/.prism/local/gavel/*/state`, sorted by `mtimeMs` descending,
   first hit wins - `:439-452`. `projectDir` itself resolves `args.project_dir` ->
   `process.env.PRISM_PROJECT_DIR` -> `process.cwd()` (`:439-442`).
5. fallback `<projectDir>/.prism/local/gavel/_mcp/state` - `:453`

A separate resolver exists for assertions: `assertEvidenceDir()` `:873-879` - `args.state_dir` ->
`GRIOT_ASSERT_DIR` -> `<CLAUDE_PROJECT_DIR|cwd>/.prism/local/assertions`.

### Where the session dirs come from

`skills/prism-gavel/scripts/start-server.sh`:

- `SESSION_ID` is shell pid + unix seconds - `:78`. **Not a uuid.**
- `SESSION_DIR` is `${PROJECT_DIR}/.prism/local/gavel/${SESSION_ID}`, else `/tmp/prism-gavel-...` - `:80-84`
- `STATE_DIR="${SESSION_DIR}/state"`, plus `PID_FILE` and `LOG_FILE` - `:86-88`
- `mkdir -p "${SESSION_DIR}/content" "$STATE_DIR"` - `:91`
- spawn passes `GAVEL_DIR="$SESSION_DIR"` into `node server.cjs` - `:111` (foreground) / `:116` (nohup)

`skills/prism-brainstorm/scripts/start-server.sh` is the same shape with
`.prism/local/brainstorm/${SESSION_ID}` (`:81`) and `BRAINSTORM_DIR` (`:113`, `:119`).

### `$SCREEN_DIR` - the content peer

`$SCREEN_DIR` is the **documented name for the session's `content/` directory**; it is not an env
var the servers read. In code it is `CONTENT_DIR`:

- gavel `skills/prism-gavel/scripts/server.cjs:95` - `CONTENT_DIR = path.join(SESSION_DIR, 'content')`
- exposed under the `screen_dir` key in `$STATE_DIR/server-info` - gavel `server.cjs:422`, written `:425`
- brainstorm `skills/prism-brainstorm/scripts/server.cjs:80`, `:460`, `:463` - identical shape
- the `open-viewer` URL file is written alongside - gavel `server.cjs:427`
- convention documented at `skills/prism-brainstorm/visual-companion.md:51-55` and
  `skills/griot-agent-architect/references/channel-patterns.md:40`
- screens are served newest-mtime-first: `getNewestScreen()` gavel `server.cjs:151-161`, used `:168-170`

### `$STATE_DIR/events` - who writes, who reads

**Written by the popout `server.cjs` over WebSocket, never by the MCP server.**

- gavel `handleMessage()` `skills/prism-gavel/scripts/server.cjs:282-297` - parses the WS text frame
  and **only if `event.choice || event.verb`** appends one JSON line to `$STATE_DIR/events`
  (`:293-295`).
- brainstorm `skills/prism-brainstorm/scripts/server.cjs:313-327` - same, gated on `event.choice`
  only (`:323`), append at `:325`.
- **Truncation:** when a *new* screen file appears in `CONTENT_DIR`, the watcher deletes the events
  file wholesale - gavel `server.cjs:369-373` (`fs.unlinkSync(eventsFile)`), brainstorm
  `server.cjs:405`. The events log is therefore per-screen, not per-session.

**Read by:** `digital-griot-mcp.ts:747-762` (`gavel_commit` only). Nothing else in the repo reads it.

### JSONL event shapes

Gavel verb event, produced at `skills/prism-gavel/scripts/helper.js:98-101` and appended by
`server.cjs:295` - fields: `type:"verb"`, `skill:"gavel"`, `verb` (one of open / scan / verify /
commit), `card_id`, `card_title`, `batch` (only when `verb === "commit"`, from
`window.__gavelPayload()`, `helper.js:99-101`), and `timestamp` stamped in `sendEvent()`
(`helper.js:71`).

Brainstorm choice event, `skills/prism-brainstorm/scripts/helper.js:857-866`, appended at
`server.cjs:325` - a click payload carrying `choice: target.dataset.choice` plus a `timestamp`. A
programmatic form with `type:'choice'`, `value`, and spread metadata is exposed at `helper.js:916`.

### The wake POST (browser -> `:52342/channel`)

- gavel `helper.js:107-113` posts `content`, `session_id`, `skill:"gavel"`, `verb`, `card_id`
- brainstorm `helper.js:872-877` posts `content`, `session_id`, `choice`, `element_id`
- The channel URL is discovered from injected meta tags, not an env var - the port and session id
  arrive as `brainstorm-channel-port` and `brainstorm-session-id` meta tags (gavel
  `server.cjs:133-142`), read back in `helper.js:25-33`.
- `sanitizeMeta()` `digital-griot-mcp.ts:1031-1041` drops `content`, drops any key failing
  `META_KEY_RE` (`:1019`, alphanumeric plus underscore), and stringifies string / number / boolean
  values only. Hyphenated keys are silently dropped (`:1018`).

**Note the split:** the wake POST carries only small string meta; the large `batch` travels through
the events *file* (documented in `helper.js:94-97`).

---

## 4. Identity - what exists today (the gap)

**There is no per-connection identity, no token, and no instance id on the MCP bus today.**

What *does* exist, and its exact nature:

| Thing | Where | What it actually is |
|---|---|---|
| `SESSION_ID` (origin) | `skills/prism-gavel/scripts/start-server.sh:78` | shell pid + unix seconds. Becomes the session directory name (`:81`). Not a uuid, not secret, not verified. |
| `SESSION_ID` (server view) | `skills/prism-gavel/scripts/server.cjs:98` | `path.basename(SESSION_DIR)` - re-derived from the directory name. |
| session id on the wire | `server.cjs:133-135` -> `helper.js:30` -> POST body `session_id` (`helper.js:109`) | a plain string in an HTML meta tag, echoed back in a wildcard-CORS POST body. Any local page can send any value. |
| `sessionRegistry` | `digital-griot-mcp.ts:1024` | `new Map<string, boolean>()` - **string -> `true`**. Populated by unauthenticated `POST /register` (`:1087-1099`), cleared by `POST /unregister` (`:1101-1113`). |
| routing use | `digital-griot-mcp.ts:1135-1143` | if the map is non-empty **and** the POST carries a `session_id` **and** it is not in the map, the wake is dropped (`routed:false`). If the map is empty, **every** wake fires unconditionally - explicit backward-compat behavior (`:1023`, `:1136`). |
| MCP-side identity | - | **None.** The `ListToolsRequestSchema` / `CallToolRequestSchema` handlers (`:976`, `:985`) receive no caller identity; there is one stdio peer per spawned process and nothing correlates a tool call to a channel POST. |
| tool-arg identity | `GAVEL_TOOLS` `:84-299` | no tool takes a `session_id`, `token`, `instance_id`, or `client_id`. Identity is inferred purely from **which directory** `resolveStateDir()` lands on. |
| uuid anywhere in this file | - | **Zero.** No `randomUUID`, no `crypto` import. Imports are `Server`, `StdioServerTransport`, MCP types, `node:child_process`, `node:fs`, `node:path` (`:48-56`). |
| token / auth anywhere in this file | - | **Zero**, except `GITHUB_TOKEN` at `:725`, which is an outbound GitHub API credential and unrelated to bus identity. |

**Properties of the current design, as built:**

- The `sessionRegistry` is an allow-list keyed on a self-asserted, guessable string, with an open
  registration endpoint and `Access-Control-Allow-Origin: *` (`:1044`).
- One MCP process owns port `:52342` for **all** concurrent Claude Code sessions (`:1051-1058`); the
  losers hold zero listeners and stand by (`:1194-1206`). A wake therefore reaches whichever process
  won the bind, not necessarily the session that owns the popout.
- Correlating an inbound wake to an outbound tool call is done by the model reading the events file,
  per the `instructions` string (`:70-73`), not by any wire-level correlation id.

---

## 5. Concurrency

**No locking, no atomic rename, no fsync, no ordering guarantee anywhere on the file bus.**
A grep for `flock`, `lockfile`, `renameSync`, `O_EXCL`, and `proper-lockfile` across
`scripts/digital-griot-mcp/`, `skills/prism-gavel/scripts/`, and `skills/prism-brainstorm/scripts/`
returns **zero hits**.

What each writer does:

| Writer | Call site | Mode |
|---|---|---|
| gavel popout events | `skills/prism-gavel/scripts/server.cjs:295` | `fs.appendFileSync(eventsFile, line)` |
| brainstorm popout events | `skills/prism-brainstorm/scripts/server.cjs:325` | `fs.appendFileSync(eventsFile, line)` |
| assertion ledger | `digital-griot-mcp.ts:946` | `fs.appendFileSync(jsonl, line, "utf-8")` |
| assertion md twin | `digital-griot-mcp.ts:956-960` | `appendFileSync` after a conditional `writeFileSync` header (`:952-954`) - check-then-write, not atomic |
| card store, full rewrite | `digital-griot-mcp.ts:623` | `fs.writeFileSync(outFile, ...)` - truncate + write, no temp file |
| card store, read-modify-write | `digital-griot-mcp.ts:801` read, `:813` write | last writer wins; two concurrent `gavel_decide` calls can lose a ruling |

Observed properties as built:

1. **Two appenders to `$STATE_DIR/events`.** Each popout process is single-threaded and appends one
   whole line per `appendFileSync`, so a single process does not interleave within a line. Two
   *different* processes pointed at the same `STATE_DIR` (a restarted popout, or a brainstorm and a
   gavel server sharing a dir) append with `O_APPEND` semantics and no coordination; ordering
   between them is whatever the OS delivers.
2. **Malformed lines are tolerated on read.** `gavel_commit` wraps each `JSON.parse` in a try/catch
   and skips bad lines (`digital-griot-mcp.ts:751-760`).
3. **Reader semantics are last-wins, backwards.** `gavel_commit` scans from the end and takes the
   first `verb === "commit"` line carrying a `batch` (`:750-757`) - later events shadow earlier ones.
4. **The log is truncated out from under readers.** A new HTML file in `CONTENT_DIR` triggers
   `fs.unlinkSync(eventsFile)` on a 100 ms debounce (gavel `server.cjs:358-380`, unlink at `:372`;
   brainstorm `server.cjs:405`). There is no coordination with an in-flight `gavel_commit` read.
5. **Port bind is a real race, and it is handled.** `bindChannel()` `digital-griot-mcp.ts:1182-1207`
   catches the bind failure, logs the transition once, and re-attempts every 3 s so a survivor
   reclaims `:52342`. The comment at `:1051-1058` records the prior failure mode - live processes,
   zero listeners, a dead wake channel.
6. **STATE_DIR selection is mtime-based and therefore racy by construction.** `resolveStateDir()`
   step 4 sorts sessions by `mtimeMs` (`:449-451`); with two live popouts the newest-touched
   directory wins whichever tool call happens next.
7. **`fs.watch` debounces.** `STATE_DIR` watcher for `decisions.json` at 100 ms (gavel
   `server.cjs:347-355`); `CONTENT_DIR` watcher for `*.html` at 100 ms (`:358-380`).

---

## 6. Daemon / broker - SPEC vs BUILT

### The broker WAS built. It exists.

The design doc `.prism/shared/designs/2026-06-12-daemon-broker-design.md` (334 lines) specifies the
broker, and **`packages/prism-daemon/` implements it.** Files present:

```
packages/prism-daemon/src/broker.ts        438 lines
packages/prism-daemon/src/registry.ts       38
packages/prism-daemon/src/protocol.ts      173
packages/prism-daemon/src/session.ts        23
packages/prism-daemon/src/router.ts         61
packages/prism-daemon/src/resolve.ts        83
packages/prism-daemon/src/relay.ts         150
packages/prism-daemon/src/index.ts          87
packages/prism-daemon/src/adapters/{websocket,paseo-websocket,rest,stdio-mcp,flask-http,types,index}.ts
packages/prism-daemon/services.config.json
packages/prism-daemon-client/src/{client,protocol,agent-run,index}.ts
```

`ServiceDescriptor` - `packages/prism-daemon/src/protocol.ts:54-69`.
`BrokerEnvelope` - `packages/prism-daemon/src/protocol.ts:81-91`.
`Registry` class - `packages/prism-daemon/src/registry.ts:7-38` (upsert / get / has / remove /
snapshot / setStatus).

### Spec-to-build map

| Spec section | Spec'd | Built | Evidence |
|---|---|---|---|
| 3.1 Envelope | `BrokerEnvelope` | YES | `protocol.ts:81-91`; guard `isEnvelope` `:161-165` |
| 3.2 Handshake | hello / welcome | YES | `broker.ts:321-332`; `WSHello` `protocol.ts:73-78`, `WSWelcome` `:103-109` |
| 3.3 Message types | response / service_update / stream / permission | PARTIAL | `BrokerResponse` `protocol.ts:118-124`, `ServiceUpdate` `:126-131`, `ServiceStreamMessage` `:133-139` are emitted; `PermissionRequest` `:141-146` and `PermissionResponse` `:93-97` are **typed but never emitted or handled** in `broker.ts` |
| 3.4 Binary multiplexing | yes | NO | no binary frame handling in `broker.ts` |
| 4 Registry + SKILL.md discovery | `registry.ts` + `discovery.ts` | PARTIAL | `registry.ts` exists; **`packages/prism-daemon/src/discovery.ts` does NOT exist** - probing is folded into the adapters (`adapter.probe()`, used `broker.ts:237`, `:282`) |
| 5 Adapter contract, 4 families | 4 | YES (5) | `src/adapters/` has websocket, paseo-websocket, rest, stdio-mcp, flask-http; factory `createAdapter` used `broker.ts:94`, `:230` |
| 6 try-local-then-cloud | `resolve.ts` | YES | `resolve.ts` (83 lines), called `broker.ts:120` |
| 7 Relay | E2EE relay | YES | `relay.ts`; `connectRelay` `broker.ts:364-375`, Curve25519 / NaCl via `@prism/relay` (`broker.ts:19`) |
| 8 Registration, static + dynamic | both | YES | static `loadConfig()` `index.ts:37-48` over `services.config.json`; dynamic `POST /register` `broker.ts:177-186` -> `register()` `:215-246`; `POST /deregister` `:187-196` -> `:248-257` |
| 9 Routed call | envelope -> adapter | YES | `Router.route` via `broker.ts:337`; HTTP shortcut `POST /call` `:197-207` |
| 11 Error handling | `BrokerErrorCode` | YES | `protocol.ts:17-25`; helpers `errorResponse` / `okResponse` `:167-173` |
| 12 Security - localhost binding | yes | YES | `listen(host = "127.0.0.1", port = 6780)` `broker.ts:416` |
| 12 Security - **optional broker password / auth** | yes | **NO** | a grep for `password` / `authenticate` across `packages/prism-daemon/src` and `packages/prism-daemon-client/src` returns **only** the unused `"UNAUTHORIZED"` enum member at `protocol.ts:25`. No auth path exists. |
| 12 Security - capability gating at the wire boundary | `session.supports()` | PARTIAL | `Session.supports()` exists (`session.ts:20-22`) but **has zero call sites** in `broker.ts`; `welcome.capabilities` is hard-coded `[]` (`broker.ts:330`) |
| 13 Module boundaries | listed | YES minus `discovery.ts` | see above |

### Broker runtime facts

- Default bind `127.0.0.1:6780` - `index.ts:17-18`, `broker.ts:416`. Config path from
  `PRISM_DAEMON_CONFIG` or `services.config.json` beside the dist (`index.ts:19`).
- HTTP control plane - `broker.ts:150-212`: `GET /health` (`:157-166`, returns
  `{ok, version, serviceCount, ready}`), `GET /services` (`:167-170`), `GET /pairing` (`:171-176`),
  `POST /register` (`:177-186`), `POST /deregister` (`:187-196`), `POST /call` (`:197-207`), else
  404 (`:208`).
- `BROKER_VERSION = "0.1.0"` - `broker.ts:33`.
- Health loop: `startHealthLoop(intervalMs = 15_000)` `broker.ts:300-304`; `runHealthCheck()`
  `:277-298` re-probes every adapter and broadcasts a `service_update` on status change.
- Registered services (`packages/prism-daemon/services.config.json`): `agent-run`
  (`websocket-paseo`, `ws://127.0.0.1:6767`), `code-intel` (`stdio-mcp`, spawns
  `codebase-memory-mcp`), `design-gen` (`rest`, `:7457` / `:7456`), `knowledge` (`stdio-mcp`, spawns
  `graphify-mcp`), `3d-gen` (`flask-http`, `:7520` local plus a cloud endpoint, vram gate min 24),
  `cinopsis` (`flask-http`, `:5123`), `notebooks` (`flask-http`, `:8888`).
  **`digital-griot-mcp` is NOT in this config - the file bus is not a brokered service today.**

### Broker session model (the connection registry that exists)

- `Session` - `packages/prism-daemon/src/session.ts:5-23`: `sessionId`, `clientId`, `version`, a
  private `caps: Set<string>`, and a `subscriptions: Set<string>`. `supports(cap)` at `:20-22`.
- Sessions map - `broker.ts:74`: `private readonly sessions = new Map<string, Session>()`.
- Created on hello: `new Session(randomUUID(), msg.clientId, msg.version, msg.caps ?? [])` -
  `broker.ts:323`, stored `:324`, welcome shipped with `sessionId` plus the registry snapshot
  `:325-331`.
- Torn down on socket close - `broker.ts:341-344` (`dispose`), wired at `:355`.
- Transport-agnostic: `createSessionHandler(send)` `broker.ts:310-347` is shared by the direct WS
  path (`onConnection` `:349-356`) and by relay channels (`connectRelay` -> `onChannel` `:371`).
- `outbound: Set<(obj:unknown)=>void>` `broker.ts:76` is the broadcast fan-out (`:270-272`).
- `sessionCount` getter - `broker.ts:412-414`.

### There IS a `token` - and it is inert

`broker.ts:387-389`:

```ts
pairingInfo(relayUrl: string): { relayUrl: string; token: string; pubKey: string } {
  return { relayUrl, token: randomUUID(), pubKey: exportPublicKey(this.ensureRelayKeyPair().publicKey) };
}
```

The token is **minted fresh on every call and never stored, never compared, never checked.** A grep
for `token` across `packages/prism-daemon/src`, `packages/prism-daemon-client/src`, and
`packages/prism-relay/src` (excluding tests) returns only `broker.ts:174`, `:387`, `:388`.
`GET /pairing` (`:171-176`) hands it out; nothing consumes it. The real pairing secret in use is the
Curve25519 public key (`ensureRelayKeyPair()` `:378-381`).

### Daemon lifecycle (Electron)

`apps/prism-electron/src/daemon/daemon-manager.ts` (265 lines) - deliberately Electron-free; `fork`
and `fetchFn` are injected (`:5-8`, `:35-44`).

- Status machine `DaemonStatusKind = "stopped" | "starting" | "running" | "error"` - `:14`.
  `DaemonStatus` carries `status`, `port`, `pid`, `version`, `adopted`, `versionMismatch`, `message`
  - `:16-26`.
- `start()` `:137-160`: returns early if already running or starting (`:138-140`); **probes first
  and adopts** an existing broker on the port rather than fighting it (`:143-157`, sets
  `adopted: true`, `pid: null`); otherwise calls `_spawnAndProbe()`.
- `_spawnAndProbe()` `:162-211`: forks `brokerEntry` with `env.PRISM_DAEMON_PORT` and
  `env.PRISM_DAEMON_CONFIG` (`:167-174`); binds the exit handler to *that* child so a stale child's
  late exit is ignored (`:181-183`); polls `_probeHealth()` up to `probeAttempts` (default 10,
  `:92`) every `probeIntervalMs` (default 500 ms, `:93`). On a version mismatch it restarts **once**
  to self-heal (`:198-204`). Timeout sets `status: "error"`, `message: "health probe timed out"`
  (`:209`).
- `_probeHealth()` `:120-134`: `GET http://127.0.0.1:<port>/health` with a 1500 ms
  `AbortSignal.timeout`, requires `body.ok`, reads `body.version` (`:126-129`).
- Crash restart: `_onChildExit` `:213-221` -> `_scheduleRestart` `:223-235`, backoff
  `[1000,2000,4000,8000,16000]` capped at the last (`:94`, `:228`), `maxRestarts` default 5 (`:95`),
  gives up with `status:"error"` (`:224-227`).
- `restart()` `:245-253` and `stop()` `:256-264` both detach `_proc` first and **only kill a child
  we spawned - adopted brokers are left alive** (`:251`, `:261`).
- State held: `_proc`, `_intentionalStop`, `_restartCount`, `_versionRestartUsed`, `_restartTimer`,
  `_status` - `:77-82`. Emits `"statusChange"` on every mutation (`:111-114`).
- Wiring: `apps/prism-electron/src/main.ts:23-45` constructs it lazily with `utilityProcess.fork`
  (`:32-36`), `port: Number(process.env.PRISM_DAEMON_PORT ?? 6780)` (`:40`), and
  `expectedVersion: readExpectedVersion(daemonDist)` (`:41`). Started at `main.ts:136`
  (`void getDaemonManager().start()`), handed to the IPC bridge at `main.ts:64`, consumed by
  `apps/prism-electron/src/hosts/electron/ElectronIPCBridge.ts:21`, `:81`.
- Client side: `packages/prism-daemon-client/src/client.ts:41-51` - `DaemonClient` holds
  `sessionId`, `brokerVersion`, a live `services` map, a `pending` map, stream `sinks`, and update
  handlers; hello is sent on open (`:71-79`), with a 5 s connect timeout (`:19`, `:59-63`).

**Plainly stated:** the broker is **BUILT and wired into the Electron app**, but it has **no
authentication, no capability gating in practice, and no discovery module**, and the
`digital-griot-mcp` file bus is **not registered with it in any form.**

---

## 7. Landing-zone notes: where a paired-token registry would attach

Purely descriptive - these are the existing seams that already carry the shapes such a registry
would need. No recommendation is attached to any of them.

**On the MCP / file-bus side (`scripts/digital-griot-mcp/digital-griot-mcp.ts`):**

1. `sessionRegistry` at `:1024` is the only in-process map today: `Map<string, boolean>`. Its two
   mutators are `POST /register` `:1095` and `POST /unregister` `:1109`; its single consumer is the
   routing filter at `:1138`. The value type is `boolean` - there is no descriptor object to hang a
   token, peer identity, or expiry on.
2. The `/register` and `/unregister` handlers (`:1087-1113`) already parse a JSON body and already
   pull `body.session_id` (`:1094`, `:1108`) - the only fields read.
3. `POST /channel` reads `body.session_id` at `:1137`, before the drop/forward decision at
   `:1138-1143`.
4. `sanitizeMeta()` `:1031-1041` is the sole gate on what crosses into the notification `meta` bag,
   and its key filter is `META_KEY_RE` (`:1019`) - an underscore-cased token key passes through
   unchanged; a hyphenated one is dropped silently.
5. The tool schemas in `GAVEL_TOOLS` (`:84-299`) all set `additionalProperties: false` (`:120`,
   `:155`, `:173`, `:191`, `:224`, `:246`, `:296`) - any new tool argument must be declared in the
   schema or it is rejected.
6. `resolveStateDir()` `:434-454` is the single funnel every gavel handler uses to decide *which*
   session's files it touches; today the only per-call inputs to that decision are `args.state_dir`
   (`:436`) and `args.project_dir` (`:440`).
7. `handleGriotAssert` phase 2 (`:941-961`) is the existing write-through pattern on this server:
   `mkdirSync` plus `appendFileSync` JSONL plus a Markdown twin.
8. `CORS_HEADERS` `:1043-1047` is wildcard-origin, and `bindChannel()` `:1182-1207` means exactly
   one process on the machine owns `:52342` at a time while every other holds a live 3 s retry timer.

**On the broker side (`packages/prism-daemon/`):**

9. `Session` (`session.ts:5-23`) is the per-connection record: `sessionId` (`randomUUID()` at
   `broker.ts:323`), `clientId` and `version` from `WSHello`, a `caps` set, and a `subscriptions`
   set. It has no token, expiry, or peer field.
10. `WSHello` (`protocol.ts:73-78`) carries `type`, `clientId`, `version`, optional `caps` - the
    handshake's entire input surface. `protocol.ts:1-9` states the schema is **append-only**: add
    fields, never remove, never optional-to-required, never narrow.
11. `WSWelcome` (`protocol.ts:103-109`) returns `brokerVersion`, `sessionId`, `services`,
    `capabilities`; `capabilities` is emitted hard-coded as `[]` at `broker.ts:330`.
12. `Session.supports(cap)` (`session.ts:20-22`) exists with zero call sites in `broker.ts` - the
    wire-boundary capability gate named in spec 12 is present as an API, unused.
13. `"UNAUTHORIZED"` is a declared `BrokerErrorCode` (`protocol.ts:25`) with zero emitters.
14. `pairingInfo()` (`broker.ts:387-389`) already returns a `{relayUrl, token, pubKey}` triple over
    `GET /pairing` (`:171-176`); the token is regenerated per request and never persisted or checked.
15. `Registry` (`registry.ts:7-38`) is the service map; `broker.sessions` (`broker.ts:74`) is the
    connection map. They are separate structures with no cross-reference.
16. `createSessionHandler(send)` (`broker.ts:310-347`) is the one place LAN WS and relay channels
    converge - the hello branch is `:321-334`, the envelope branch `:335-338`.
17. `register()` / `deregister()` (`broker.ts:215-246`, `:248-257`) plus `services.config.json` are
    the two existing ways a service enters the registry; that config has no `digital-griot-mcp`
    entry, and `adapterType: "stdio-mcp"` (`protocol.ts:13`) is the family that already spawns MCP
    servers (`code-intel`, `knowledge`).
18. `DaemonManager` (`apps/prism-electron/src/daemon/daemon-manager.ts:64-265`) supervises exactly
    one broker per app, adopts a pre-existing one (`:143-157`), and never kills what it did not
    spawn (`:251`, `:261`).

---

## Files read for this document

- `scripts/digital-griot-mcp/digital-griot-mcp.ts` (slices 1-120, 120-330, 330-570, 550-840, 840-1040, 1015-1234)
- `skills/prism-gavel/scripts/server.cjs` (60-180, 255-390), `helper.js` (14-124), `start-server.sh` (60-120)
- `skills/prism-brainstorm/scripts/server.cjs` (300-350), `helper.js` (grep), `start-server.sh` (grep), `visual-companion.md` (49-55)
- `.claude-plugin/plugin.json` (22-36), `.mcp.json`
- `packages/prism-daemon/src/broker.ts` (1-120, 150-400, 400-438), `registry.ts`, `session.ts`, `protocol.ts`, `index.ts`, `services.config.json`
- `packages/prism-daemon-client/src/client.ts` (1-80)
- `apps/prism-electron/src/daemon/daemon-manager.ts` (full), `apps/prism-electron/src/main.ts` (1-70)
- `.prism/shared/designs/2026-06-12-daemon-broker-design.md` (outline, 205-334)
