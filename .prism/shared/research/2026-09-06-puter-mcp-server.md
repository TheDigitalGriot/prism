---
date: 2026-09-06
topic: Puter MCP server (Cloudflare Worker) — reference architecture for the Prism MCP server
repo_analyzed: C:\Users\digit\GriotSandbox\xplatform-harvest\puter
component: src/mcp-connector
status: documentarian (describes what exists)
---

# Puter MCP Server — Implementation Reference

All claims below carry `file:line`. Paths are relative to
`C:\Users\digit\GriotSandbox\xplatform-harvest\puter\src\mcp-connector\` unless
otherwise noted.

## Architecture

### Location and shape

The entire MCP server is one directory, ~3,000 lines total including its README:

| Path | Lines | Role |
|---|---|---|
| `src/index.js` | 10 | Entry point: boots router, registers MCP + OAuth routes |
| `src/s2w-router.js` | 218 | Forked service-worker router; builds the per-request Puter SDK instance from the bearer token |
| `src/mcp.js` | 230 | Hand-rolled JSON-RPC 2.0 dispatcher (the whole MCP protocol layer) |
| `src/oauth.js` | 277 | OAuth 2.0 authorization server (sealed-blob, stateless) |
| `src/tools.js` | 1385 | `TOOLS` array + `TOOL_MAP` + handlers (44 tools) |
| `mcpb/server/index.cjs` | 132 | Local stdio <-> remote HTTP proxy for MCPB hosts |
| `template/puter-portable.template` | 73 | Preamble that defines `init_puter_portable` and inlines puter.js |
| `scripts/buildPreamble.mjs` | 56 | `#include` preprocessor producing the deployable script |
| `webpack.config.cjs` | 62 | Bundles `src/index.js` into the preamble part |
| `wrangler.toml` | 27 | Cloudflare Worker deploy config |

### Deployment — prior claim CONFIRMED (stateless Cloudflare Worker), with two corrections

- It is a Cloudflare Worker: `wrangler.toml:1` (`name = "puter-mcp"`),
  `wrangler.toml:5` (`compatibility_date = "2025-01-01"`),
  `package.json:11` (`"deploy": "npm run build && wrangler deploy"`).
- **Correction 1 — it is NOT a modules-format ESM worker.** It deploys as a
  *sloppy-mode service worker* with wrangler bundling disabled:
  `wrangler.toml:13` sets `no_bundle = true`, and `wrangler.toml:7-12` explains
  why — the preamble is assembled by a C-style `#include` preprocessor so
  `puter.js` is concatenated RAW; bundling would transpile to strict-mode ESM,
  which forbids the `with` statement used by `init_puter_portable`
  (`template/puter-portable.template:58`). The request entry point is a classic
  `self.addEventListener('fetch', ...)` (`src/s2w-router.js:209-215`), not
  `export default { fetch }`.
- **Correction 2 — there is no MCP SDK dependency at all.** `package.json:14-19`
  lists only `terser-webpack-plugin`, `webpack`, `webpack-cli`, `wrangler` as
  devDependencies and no runtime dependencies. The MCP protocol layer is
  hand-written in `src/mcp.js`.
- Hosted publicly at `https://mcp.puter.com` (`../docs/src/mcp.md:10`), added to
  clients via `claude mcp add --transport http --scope user puter https://mcp.puter.com/`
  (`../docs/src/mcp.md:24`) and `codex mcp add puter --url https://mcp.puter.com/`
  (`../docs/src/mcp.md:36`) — i.e. the same endpoint serves Claude Code and Codex.

### Build pipeline

1. `webpack` bundles `src/index.js` (router + mcp + oauth + tools) to
   `dist/webpackPreamplePart.js` — `webpack.config.cjs:10-19`, target
   `webworker` (`webpack.config.cjs:21`), function names preserved
   (`webpack.config.cjs:33-41`).
2. `scripts/buildPreamble.mjs` recursively expands `#include "..."` lines
   (`scripts/buildPreamble.mjs:25-50`) in `template/puter-portable.template`,
   inlining `../puter-js/dist/puter.js` (`template/puter-portable.template:59`,
   `:67`) and the webpack output (`template/puter-portable.template:73`), and
   writes `dist/workerPreamble.js` with a version banner of
   `puterJsVersion+gitSha` (`scripts/buildPreamble.mjs:15-23`, `:53-55`).
3. `wrangler.toml:4` points `main` at that file.

### Runtime request path

`src/index.js:6-10`: `initS2w()` -> `registerMcpRoutes(globalThis.router)` ->
`registerOAuthRoutes(globalThis.router)`.

Routes registered (`src/mcp.js:224-230`, `src/oauth.js:267-277`):

```
POST /            POST /mcp                        -> mcpPost   (JSON-RPC)
GET  /  GET /mcp  GET /health                      -> mcpInfo   (discovery/health)
GET  /.well-known/oauth-authorization-server[/mcp] -> RFC 8414 metadata
GET  /.well-known/oauth-protected-resource[/mcp]   -> RFC 9728 metadata
POST /register    GET /authorize
GET  /oauth/callback   POST /token
```

The router is a regex route-matcher built per registration
(`src/s2w-router.js:11-55`), dispatched in `route(event)`
(`src/s2w-router.js:131-205`), with CORS preflight handling
(`src/s2w-router.js:104-130`) and `Access-Control-Allow-Origin: *` injected on
any response missing it (`src/s2w-router.js:190-195`). Unknown paths/methods
return **JSON** 404s rather than text, explicitly so MCP OAuth discovery probes
can parse the body (`src/s2w-router.js:57-66`, `:152-156`, `:202-204`).

### Per-request identity (the key structural move)

`src/s2w-router.js:69-74` extracts the bearer token with
`/^Bearer\s+(.+)$/i`. `src/s2w-router.js:135-145` then builds a **fresh, real
puter.js SDK instance for that one request**:

```js
event.requestor = { puter: init_puter_portable(token, globalThis.puter_endpoint || 'https://api.puter.com', 'userPuter') };
event.user = event.requestor;
```

`init_puter_portable` (`template/puter-portable.template:44-71`) snapshots
globals into a fresh `goodContext` object (`:46-56`) and evaluates the raw
puter.js source inside `with (goodContext) { ... }` (`:58-60`) so concurrent
requests never share auth token or caches, then calls `setAPIOrigin` /
`setAuthToken` on that isolated instance (`:62-63`). Per-request overhead that
puter.js normally amortizes over a page session is stubbed out first
(`:30-39`): `request_rao_`, `cacheWhoami_`, and `fs.initializeSocket` become
no-ops and the fs socket is disconnected.

Header/config surface: `puter_endpoint`, `puter_gui_origin`, `OVERRIDE_ORIGIN`
are Worker vars (`wrangler.toml:15-22`); `OAUTH_SECRET` is a wrangler *secret*
(`wrangler.toml:24-27`).

## Protocol handling

**Transport: JSON-RPC 2.0 over Streamable HTTP — CONFIRMED.** Declared at
`src/mcp.js:1-2` and advertised as `transport: 'streamable-http'` in the
discovery body (`src/mcp.js:210`). Single endpoint, POST only for RPC. There is
**no SSE/GET stream and no `Mcp-Session-Id` header anywhere** in the codebase.

### Version negotiation

- `PROTOCOL_VERSION = '2025-06-18'` (`src/mcp.js:13`).
- `SUPPORTED_PROTOCOL_VERSIONS = {'2025-06-18','2025-03-26','2024-11-05'}` (`src/mcp.js:14`).
- `SERVER_INFO = { name, title, version }` (`src/mcp.js:16-20`).

### POST handler (`mcpPost`, `src/mcp.js:156-198`)

1. `const userPuter = event.user && event.user.puter` (`:157`).
2. **If absent, return 401 before parsing the body** (`:163-177`) with
   `WWW-Authenticate: Bearer resource_metadata="<origin>/.well-known/oauth-protected-resource"`
   (`:173`) — this is the signal that starts the client's OAuth flow. Note this
   gate applies to *every* JSON-RPC method, including `initialize` and
   `tools/list`; the README's unauthenticated curl examples
   (`README.md:294-301`) differ from this behavior.
3. Parse JSON; on failure return `-32700 PARSE_ERROR` (`:179-184`).
4. **Batch support**: an array payload is dispatched with `Promise.all`, empty
   batches rejected `-32600`, and a batch of only notifications returns HTTP
   **202 with no body** (`:186-193`).
5. Single message: `handleMessage`; `null` (notification) -> HTTP 202 (`:195-197`).

All RPC responses are HTTP **200** with `Cache-Control: no-store`
(`src/mcp.js:145-153`) — the comment at `:148-151` states per-user results must
never be cached by a CDN in front of the Worker.

### Message dispatch (`handleMessage`, `src/mcp.js:50-102`)

Shape validation first (`jsonrpc === '2.0'` and `typeof method === 'string'`),
else `-32600` (`:51-53`). `isNotification = id === undefined` (`:56`).

| Method | Location | Behavior |
|---|---|---|
| `initialize` | `:60-78` | Echoes the client's `protocolVersion` if supported, else falls back to `2025-06-18` (`:61-64`); returns `capabilities: { tools: { listChanged: false } }` (`:67`), `serverInfo`, and a prose `instructions` string that teaches the tool families and tells the agent to read `puter_docs_get "Workers/router"` before writing worker code (`:69-76`) |
| `ping` | `:80-81` | `{}` |
| `notifications/initialized`, `notifications/cancelled`, `notifications/roots/list_changed` | `:83-86` | return `null` -> no response body |
| `tools/list` | `:88-89` | `rpcResult(id, { tools: listTools() })` — no cursor/pagination |
| `tools/call` | `:91-92` | delegates to `handleToolCall` |
| default | `:94-96` | notification -> `null`; otherwise `-32601 Method not found: <method>` |

Any thrown error inside the switch becomes `-32603 INTERNAL_ERROR` (`:98-101`).

### `tools/call` (`handleToolCall`, `src/mcp.js:104-130`)

- Unknown tool -> **protocol** error `-32602 INVALID_PARAMS` (`:106-109`).
- Missing auth -> **tool** error (`isError: true` content block) rather than a
  protocol error, "so MCP clients display it inline" (`:111-114`). Given the
  401 gate at `:163`, this branch is defensive.
- `await tool.handler(userPuter, args)` (`:118`), `args = params.arguments || {}` (`:116`).
- Result shaping (`:120-126`): if the handler returned an object with a string
  `text` property, that string is used raw; otherwise the value is
  `JSON.stringify(value, null, 2)` via `asText` (`tools.js:1383-1385`). The
  response is `{ content: [{ type: 'text', text }] }`, and a handler-supplied
  `_meta` is attached to the *result* object (`:125`).

### Discovery / health (`mcpInfo`, `src/mcp.js:204-221`)

Returns `{ name, description, transport: 'streamable-http', tools: [names] }`.
This is the only endpoint marked cacheable —
`Cache-Control: public, max-age=300` (`:218`) — explicitly so a
"respect-origin" CDN policy caches this and nothing else (`:200-203`).

## TOOL_MAP pattern

```js
export const TOOLS = [ /* 44 entries */ ];                                  // tools.js:239-1373
export const TOOL_MAP = new Map(TOOLS.map((t) => [t.name, t]));             // tools.js:1375
export function listTools() {                                              // tools.js:1378-1380
    return TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
}
export function asText(value) {                                            // tools.js:1383-1385
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}
```

**One flat array is the single source of truth.** `TOOL_MAP` is a derived
lookup for `tools/call`; `listTools()` is the same array with `handler`
stripped — the wire schema is produced by *omission*, never by a parallel
registry. No decorators, no per-tool files, no registration calls.

A tool entry is exactly four fields: `name`, `description`, `inputSchema`
(hand-written JSON Schema — no zod/typebox anywhere), and `async handler(puter, args)`.

**Is it a thin 1:1 adapter over the SDK? Mostly yes, deliberately.** Canonical
1:1 example (`tools.js:286-300`):

```js
{
    name: 'fs_stat',
    description: 'Get metadata (name, size, type, timestamps, uid) for a file or directory in Puter. Equivalent to PuterJS puter.fs.stat(path).',
    inputSchema: {
        type: 'object',
        properties: {
            path: { type: 'string', description: `Path to a file or directory. ${HOME_PATH_NOTE}` },
            return_size: { type: 'boolean', default: true, description: 'Compute size for directories.' },
        },
        required: ['path'],
    },
    async handler(puter, { path, return_size }) {
        return puter.fs.stat(path, { returnSize: return_size !== false });
    },
},
```

Observable conventions across the 44 tools:

- **Prefix families as the namespace**: `whoami`, `fs_*` (12), `hosting_*` (5),
  `workers_*` (5), `kv_*` (11), `apps_*` (6), `puter_docs_*` (2) — definitions at
  `tools.js:242,259,287,302,341,442,461,478,497,516,530,568,614,639,651,668,697,718,745,777,788,805,842,870,882,906,970,1020,1038,1067,1088,1116,1134,1176,1199,1221,1241,1269,1297,1315,1335,1350`.
- **snake_case wire args mapped to SDK camelCase in the handler** (e.g.
  `return_size -> returnSize` at `tools.js:298`; `dedupe_name` /
  `create_missing_parents -> dedupeName` / `createMissingParents` at
  `tools.js:333-337`).
- **Every description ends with the SDK equivalence** ("Equivalent to PuterJS
  `puter.fs.read(path)`") — `tools.js:265`, `:288`, `:308`, `:675`, `:701`.
- **A shared note constant injected into path descriptions**: `HOME_PATH_NOTE`
  (`tools.js:235`) is interpolated into every path field (`:269`, `:292`,
  `:312`, `:685`).
- **`whoami` is positioned as the orientation call** — its description tells the
  agent to call it first to learn `home_directory` so it can build valid paths,
  and the handler *adds* the derived `home_directory: /<username>` field the SDK
  does not return (`tools.js:249-254`).
- **The escape hatch when the SDK is not enough**: `postApi(puter, endpoint,
  payload)` (`tools.js:127-154`) does a raw `fetch` to
  `${puter.APIOrigin}${endpoint}` with `Authorization: Bearer ${puter.authToken}`
  (`:128-135`), parses JSON-or-text, and throws an `Error` carrying `.status`
  on non-OK (`:145-152`). Used by the upload and KV tools.
- **Handlers may bypass JSON encoding** by returning `{ _meta, text }` —
  `fs_read_file` (`tools.js:276-284`) and `puter_docs_get` (`tools.js:1370`).
- **Capability withholding is explicit**: KV `flush` is deliberately not
  exposed because "wiping a whole store is not something an agent should be able
  to do in one call" (`README.md:113-114`).
- **Egress allowlists inside handlers**: docs fetches are restricted to
  `docs.puter.com` against SSRF (`tools.js:75-90`, throw at `:82`), and
  `workers_exec` may only target `https://*.puter.work` because it attaches the
  caller's auth header (`tools.js:92-108`, throw at `:105`).

## Sealed-blob auth (step by step)

**Prior claim CONFIRMED and refined.** It is AES-GCM sealing, but what is sealed
is the *OAuth flow state and the authorization code* — not the access token. The
access token that flows on every MCP request is the caller's **raw Puter token**,
and the Worker never stores it.

The Worker *is* the authorization server (`src/oauth.js:1-18`). It serves RFC
8414 authorization-server metadata (`src/oauth.js:124-137`), RFC 9728
protected-resource metadata (`:139-145`), and RFC 7591 dynamic client
registration (`:253-264`).

### Crypto primitives (`src/oauth.js:41-86`)

- `secretString()` (`:29-30`) = `globalThis.OAUTH_SECRET`, falling back to
  `'puter-mcp-dev-insecure-secret-change-me'` for local `wrangler dev` only
  (documented as must-not-be-production at `:26-28` and `wrangler.toml:24-27`).
- `aesKey()` (`:58-61`): `SHA-256(secret)` ->
  `crypto.subtle.importKey('raw', hash, {name:'AES-GCM'}, false, ['encrypt','decrypt'])`.
  Derived fresh per call; no key caching.
- `seal(obj)` (`:63-72`): random 12-byte IV via `crypto.getRandomValues`;
  `encrypt({name:'AES-GCM', iv}, key, utf8(JSON.stringify(obj)))`; output is
  **`IV || ciphertext`** concatenated into one `Uint8Array` and base64url-encoded
  (`b64urlEncode`, `:43-47`, using `btoa` plus `+/=` substitution).
- `unseal(blob)` (`:74-81`): base64url-decode, `raw.slice(0,12)` is the IV,
  `raw.slice(12)` the ciphertext, decrypt, `JSON.parse`. Any tamper or wrong key
  makes `decrypt` throw — callers wrap it in try/catch and return
  `invalid_request` / `invalid_grant`.
- `sha256b64url(str)` (`:83-86`) for PKCE S256 verification.
- TTLs: `FLOW_TTL_MS = 10 min` (`:21`), `CODE_TTL_MS = 5 min` (`:22`), both
  enforced against a `ts` field *inside* the sealed payload.

### The full flow

1. **Client POSTs to `/mcp` with no token.** `mcpPost` returns 401 plus
   `WWW-Authenticate: Bearer resource_metadata="<origin>/.well-known/oauth-protected-resource"`
   (`src/mcp.js:163-176`).
2. **Client fetches metadata.** `/.well-known/oauth-protected-resource` returns
   `{ resource: origin, authorization_servers: [origin] }`
   (`src/oauth.js:139-145`); `/.well-known/oauth-authorization-server` returns
   endpoints plus `code_challenge_methods_supported: ['S256','plain']` and
   `token_endpoint_auth_methods_supported: ['none']` (`:126-136`). Both
   path-suffixed `/mcp` variants are also registered because some clients probe
   them (`:270-272`).
3. **Optional `POST /register`** (`:253-264`) returns a synthesized
   `client_id: puter-mcp-<uuid>` with `client_id_issued_at`; **nothing is
   persisted** — the comment at `:251-252` states security rests on PKCE plus
   the `redirect_uri` sealed into the flow blob.
4. **`GET /authorize`** (`:150-176`): requires `response_type=code` and
   `redirect_uri`, else 400 `invalid_request` (`:158-163`). Then **seal #1**:

   ```js
   const flow = await seal({ redirectUri, clientState, codeChallenge, codeChallengeMethod, ts: Date.now() });  // :165-171
   ```

   The blob is placed in the callback URL as a query param
   (`callbackUrl = ${origin}/oauth/callback?flow=<sealed>`, `:173`) and the
   browser is 302'd to
   `${guiOrigin()}/?action=authme&redirectURL=<encoded callbackUrl>` (`:174-175`).
   **The sealed blob IS the session** — it rides the redirect chain through
   puter.com and comes back.
5. **`GET /oauth/callback`** (`:179-206`): Puter returns with `?token=…&flow=…`.
   `unseal(flowBlob)` inside try/catch -> 400 on failure (`:184-189`); TTL check
   `Date.now() - flow.ts > FLOW_TTL_MS` -> 400 (`:190-192`); no token means the
   user declined, so redirect to the client's `redirect_uri` with
   `error=access_denied` and the original `state` (`:194-197`). Otherwise
   **seal #2**:

   ```js
   const code = await seal({ token, codeChallenge: flow.codeChallenge, codeChallengeMethod: flow.codeChallengeMethod, ts: Date.now() });  // :199-204
   ```

   The OAuth **authorization code is itself the sealed envelope containing the
   Puter token**; the browser is redirected to
   `flow.redirectUri?code=<sealed>&state=<clientState>` (`:205`).
6. **`POST /token`** (`:218-249`): accepts form-encoded *or* JSON bodies
   (`parseForm`, `:208-215`); requires `grant_type=authorization_code` else
   `unsupported_grant_type` (`:220-222`); `unseal(code)` -> `invalid_grant` on
   failure (`:227-232`); TTL check against `CODE_TTL_MS` -> `invalid_grant`
   (`:233-235`); **PKCE enforced only if the client supplied a challenge**
   (`:238-245`) — S256 compares `sha256b64url(verifier)` to the sealed
   `codeChallenge`, plain compares directly. On success:

   ```js
   return json(200, { access_token: payload.token, token_type: 'Bearer', scope: 'puter' });  // :248
   ```

   `:247` states it plainly: "The access token IS the Puter token — the bearer
   path consumes it as-is." No refresh token is ever issued.
7. **Every subsequent MCP call** carries `Authorization: Bearer <puter token>`,
   which `src/s2w-router.js:135-145` turns back into a fresh SDK instance.

### Cache-control discipline around auth

`NO_STORE` (`src/oauth.js:95-98`) = `Cache-Control: no-store, no-cache,
must-revalidate, max-age=0` plus `Pragma: no-cache`, applied to every OAuth JSON
response (`:100-105`) *and* every 302 (`:107-112`). The comment at `:89-94`
gives the reason: without it a caching layer in front of the Worker can replay
one user's `/authorize` redirect — and their stale callback port / code — to
everyone.

### Origin handling

`originOf(request)` (`src/oauth.js:32-39`) uses the request's own origin, except
that a `workers.dev` origin is replaced by `OVERRIDE_ORIGIN` when set — so the
issuer and endpoints advertised in metadata match the public hostname
(`mcp.puter.com`, commented at `wrangler.toml:20`) rather than the internal
`*.workers.dev` one.

## Statelessness

Nothing is persisted anywhere. There is **no KV namespace, no Durable Object, no
D1, no R2 binding** in `wrangler.toml` (the whole file is 27 lines and declares
only `name`, `main`, `compatibility_date`, `no_bundle`, and a commented
`[vars]`). The four mechanisms that make that work:

1. **Identity is re-derived per request** from the `Authorization` header — a
   whole SDK instance is constructed and thrown away each time
   (`src/s2w-router.js:135-145`; `template/puter-portable.template:44-64`).
   `src/s2w-router.js:1-7` names this as difference #1 from the upstream router:
   there is no `globalThis.me` / worker-owned instance.
2. **Session state travels sealed in URLs.** The `flow` blob rides the
   authorize -> puter.com -> callback redirect chain (`src/oauth.js:165-175`);
   the `code` blob rides callback -> client -> token (`:199-205`). Both are
   self-authenticating (AES-GCM) and self-expiring (`ts` plus TTL), so the Worker
   needs no lookup table.
3. **No MCP session layer.** Streamable HTTP is used in its stateless mode:
   `initialize` returns no session identifier and no `Mcp-Session-Id` header is
   ever emitted or read (`src/mcp.js:65-77`, `:145-153`); a fresh isolate can
   serve any request. `capabilities.tools.listChanged` is `false` (`:67`) —
   there is nothing to notify about, and no server-to-client stream to notify on.
4. **Multi-step operations carry their handle client-side.** The upload trio is
   the proof: `fs_start_upload` calls `/fs/startBatchWrite` via `postApi`
   (`tools.js:392-403`) and returns `upload_id` (the Puter API `sessionId`), the
   presigned `url`, `expires_at`, and a ready-to-run `curl` `upload_command`
   (`tools.js:424-438`); the client PUTs the bytes straight to storage; then
   `fs_complete_upload` (`tools.js:454-458`) or `fs_abort_upload`
   (`tools.js:472-475`) pass that id straight back to the Puter API. All durable
   state lives in Puter's backend, none in the Worker.

The MCPB stdio proxy is the mirror image of this: it holds only `PUTER_MCP_URL`
and `PUTER_TOKEN` env vars (`mcpb/server/index.cjs:26-27`), attaches the token
per request (`:54`), forwards each newline-delimited JSON-RPC line concurrently
(`:119-127`), and treats HTTP 202 or an empty body as "nothing to relay"
(`:115`).

## Error handling

Four distinct error surfaces, kept separate on purpose.

**1. JSON-RPC protocol errors** — constants at `src/mcp.js:23-27`
(`-32700 PARSE_ERROR`, `-32600 INVALID_REQUEST`, `-32601 METHOD_NOT_FOUND`,
`-32602 INVALID_PARAMS`, `-32603 INTERNAL_ERROR`). Built by
`rpcError(id, code, message, data)` (`src/mcp.js:33-37`), which coerces a
missing id to `null` (`:36`) and omits `data` when undefined (`:35`). Emitted
for: malformed message shape (`:51-53`), unparseable body (`:183`), empty batch
(`:188`), unknown method (`:96`), unknown tool name (`:108`), and any uncaught
throw in dispatch (`:100`). **All of these return HTTP 200** (`jsonResponse`,
`:146`) — the sole non-200 JSON-RPC response is the 401 auth challenge (`:167`).

**2. Tool-execution errors** — `toolError(message)` (`src/mcp.js:39-41`) returns
`{ content: [{ type: 'text', text: message }], isError: true }` wrapped in a
*successful* `rpcResult` (`:128`). A handler throwing never becomes a protocol
error; it becomes an `isError` content block the model reads and reacts to.

**3. SDK error normalization** — `formatPuterError(err)` (`src/mcp.js:133-143`)
flattens the several shapes puter.js rejects with: string passthrough (`:135`),
`err.message` plus `(err.code)` when present (`:136`), `err.error` as string or
`.message` or stringified (`:137`), then `JSON.stringify` with a final
`'Tool execution failed'` fallback (`:138-142`). Handlers additionally throw
pre-formatted, actionable messages — e.g. the too-large-upload path aborts the
server-side session first, then throws a message telling the agent exactly what
to do instead (`tools.js:412-421`), and `postApi` extracts
`body.message || body.error?.message || body.error` before throwing
(`tools.js:145-152`).

**4. Transport-level errors** — `jsonError(status, message)`
(`src/s2w-router.js:59-66`) returns `{ error: { code, message } }` as JSON with
CORS for 404s (`:155`, `:204`) and for any exception escaping a handler
(`:198-200`), specifically so a client's discovery probe never receives a
non-JSON body it would choke on (`:57-58`, `:153-155`).

## Lift notes for the Prism MCP server

Observations about what this reference provides, mapped to the shape of a
Prism-verbs MCP server on a Worker.

1. **The whole protocol layer is 230 lines with zero dependencies.** `src/mcp.js`
   handles `initialize` / `ping` / three notification kinds / `tools/list` /
   `tools/call` / batching / errors. An MCP SDK is not required to serve Claude
   Code and Codex.
2. **One flat `TOOLS` array plus a derived `TOOL_MAP` plus a `listTools()` that
   strips `handler`** is the entire registry. The wire contract cannot drift
   from the implementation because it is the same object minus one key
   (`tools.js:239`, `:1375`, `:1378-1380`).
3. **`handler(context, args)` is the only signature.** Here `context` is the
   caller's SDK instance; the Prism analogue is whatever per-request handle the
   verbs need. Nothing else is passed, and nothing is captured in a closure over
   request state.
4. **The `{ text }` vs JSON return convention** (`src/mcp.js:120-126`) lets a
   handler emit raw markdown/text (docs, file contents) while everything else is
   pretty-printed JSON automatically — one branch, no per-tool serialization.
5. **`_meta` for out-of-band data** (`src/mcp.js:125`, `tools.js:283`) —
   pagination info (`total_bytes`, `offset`) and provenance (`source: url`)
   travel there instead of inside the text block.
6. **Sealed-blob OAuth is ~100 lines of real logic** (`src/oauth.js:41-86`
   crypto plus `:150-249` endpoints) and buys full statelessness: seal the flow
   into the redirect URL, seal the token into the authorization code, hand the
   upstream token back as `access_token`. Both blobs are AES-GCM over
   `SHA-256(secret)` with `IV||ciphertext` base64url, and both carry their own
   `ts` for expiry.
7. **The 401 plus `WWW-Authenticate: Bearer resource_metadata="…"` handshake**
   (`src/mcp.js:167-174`) is the single line that makes
   `claude mcp add --transport http` self-authenticate with no pasted token; the
   two `.well-known` documents (`src/oauth.js:124-145`) plus the `/mcp`-suffixed
   duplicates (`:270-272`) are the rest of it.
8. **Bearer and OAuth are the same code path.** OAuth only *produces* a bearer
   token (`src/oauth.js:247-248`); the MCP layer knows nothing about OAuth. A
   bearer-only server can gain the OAuth bridge later without touching the
   protocol or tool layers.
9. **Cache-control is a deliberate two-tier policy**: `no-store` on every
   per-caller and OAuth response (`src/mcp.js:151`, `src/oauth.js:95-98`),
   `public, max-age=300` on exactly one public endpoint — the discovery /
   tool-name listing (`src/mcp.js:218`), with the reasoning written inline
   (`:200-203`).
10. **Bulk data goes out of band, not through the conversation.** The
    `fs_start_upload` -> client `curl` PUT -> `fs_complete_upload` pattern
    (`tools.js:387-475`, `README.md:35-64`) keeps large payloads out of both the
    Worker and the model context, and the tool description itself instructs the
    agent when to prefer it (`tools.js:342-348`).
11. **Tool descriptions are the documentation surface.** They name the SDK
    equivalent, cross-reference sibling tools ("use fs_start_upload instead"),
    and `initialize.instructions` (`src/mcp.js:69-76`) tells the agent to read
    the docs tool before writing code. Two tools exist purely to serve
    authoritative docs to the agent (`puter_docs_index`, `puter_docs_get`,
    `tools.js:1335`, `:1350`).
12. **Deliberate capability withholding and egress allowlists** are enforced in
    handlers, not config: no `kv_flush` (`README.md:113-114`), docs fetch pinned
    to one host (`tools.js:78-84`), `workers_exec` pinned to `*.puter.work`
    because it forwards credentials (`tools.js:92-107`).
13. **Deployment nuance if a raw SDK is inlined**: `no_bundle = true` plus
    service-worker format exists only because `with` is needed for per-request
    isolation (`wrangler.toml:7-13`, `template/puter-portable.template:58`). A
    server whose verbs are plain ESM has no such constraint and can use the
    standard modules format.
14. **The same endpoint serves both target clients** — Claude Code via
    `claude mcp add --transport http` (`../docs/src/mcp.md:24`) and Codex via
    `codex mcp add --url` (`../docs/src/mcp.md:36`), plus Cursor (`:57`) and
    OpenCode (`:78`) — with no per-client branching in the server.
15. **An MCPB bundle bridges hosts that only speak stdio** with a 132-line
    zero-dependency Node proxy (`mcpb/server/index.cjs`) whose entire job is
    stdin line -> HTTP POST with the bearer header -> stdout (`:46-71`,
    `:87-117`), configured by two `user_config` fields
    (`mcpb/manifest.json:73-88`).

## Corrections to prior research

| Prior claim | Verdict | Evidence |
|---|---|---|
| Stateless Cloudflare Worker | **Confirmed** | `wrangler.toml:1-13`; no storage bindings anywhere; `src/s2w-router.js:1-7` |
| JSON-RPC 2.0 over Streamable HTTP | **Confirmed** | `src/mcp.js:1-2`, `:210`; POST-only, no SSE, no `Mcp-Session-Id` |
| Sealed-blob OAuth (AES-GCM) | **Confirmed, refined** | `src/oauth.js:63-81`; what is sealed is the flow blob and the authorization code — the access token returned is the caller's raw Puter token (`:247-248`) |
| (implied) modules-format ESM Worker | **Corrected** | Service-worker format, `no_bundle = true` (`wrangler.toml:7-13`), `self.addEventListener('fetch')` (`src/s2w-router.js:209-215`) |
| (implied) built on the MCP SDK | **Corrected** | Zero runtime dependencies (`package.json:14-19`); protocol hand-rolled in `src/mcp.js` |
| (implied) thin 1:1 SDK adapter | **Mostly confirmed** | Most handlers are one SDK call (`tools.js:297-299`, `:690-694`); uploads and KV drop to raw REST via `postApi` (`tools.js:127-154`), and a few handlers add derived fields, decoding, or validation (`tools.js:249-254`, `:276-284`, `:97-108`) |
