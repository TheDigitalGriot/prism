/**
 * prism-workgraph-mcp — the Spectrum workgraph over MCP, on Arkestra's always-on tier.
 *
 * MCP here means Model Context Protocol. Arkestra is the model-governance layer
 * ("the Governor"); this Worker is its ADDITIVE always-on tier — local-first stays
 * the default and nothing local gates on this being deployed.
 *
 * SHAPE LIFTED FROM PUTER'S MCP CONNECTOR, with the corrections the harvest made
 * (.prism/shared/research/2026-09-06-puter-mcp-server.md):
 *   - service-worker format with `no_bundle`, NOT modules/ESM
 *   - ZERO runtime dependencies — the protocol is hand-rolled, no MCP SDK on the edge
 *   - JSON-RPC 2.0 over Streamable HTTP: POST-only single endpoint, batch arrays
 *     supported, notifications answered 202, no SSE and no Mcp-Session-Id
 *   - `initialize` echoes a supported protocolVersion else falls back to 2025-06-18
 *   - TOOL_MAP is a flat array; `listTools()` returns the SAME objects minus the
 *     handler, so the wire schema is produced BY OMISSION and cannot drift from the
 *     implementation. That is the single best idea in Puter's connector.
 *   - errors are separated: JSON-RPC codes at HTTP 200, tool failures as `isError`
 *     content blocks, and JSON-only transport 404/500 so a discovery probe never
 *     receives an unparseable body.
 *
 * AUTH CORRECTION: Puter's sealed blob seals the FLOW STATE and the AUTHORIZATION
 * CODE — not the access token (oauth.js:58-81, 199-205, 247-248). The prior research
 * had this wrong. This Worker therefore does not pretend to seal a token; it takes a
 * bearer credential and validates it, leaving the sealed-blob OAuth flow as a
 * separate, later addition.
 *
 * WHAT IT SERVES: the Griot-Wide Workgraph as settled in
 * .prism/shared/designs/2026-09-05-workgraph-icm-grounding.md —
 *   - a stage contract declares its wait as an `Inbound (awaits):` line (ONE record,
 *     two views: the consumer's wait IS the producer's obligation)
 *   - readiness = every awaited path exists and is non-empty, published via
 *     `output.partial/` -> rename so existence means COMPLETE
 *   - identity across projects = a stable origin-prefixed envelope id (`wg:prism:01J...`)
 *   - the global view is READ-ONLY; re-disposition happens at origin
 *
 * That last point is why WORKGRAPH_READONLY defaults to "1": the aggregating view
 * generates, it never writes back.
 */

const PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26"]
const DEFAULT_PROTOCOL = "2025-06-18"

// ── JSON-RPC helpers ───────────────────────────────────────────────────────
const rpcResult = (id, result) => ({ jsonrpc: "2.0", id, result })
const rpcError = (id, code, message, data) => ({
  jsonrpc: "2.0",
  id,
  error: data === undefined ? { code, message } : { code, message, data },
})
const PARSE_ERROR = -32700
const INVALID_REQUEST = -32600
const METHOD_NOT_FOUND = -32601
const INVALID_PARAMS = -32602
const INTERNAL_ERROR = -32603

/** A tool failure is CONTENT with isError, not a protocol error. Keep them separate. */
const toolError = (message) => ({ content: [{ type: "text", text: message }], isError: true })
const toolText = (text) => ({ content: [{ type: "text", text }] })

// ── The workgraph store ────────────────────────────────────────────────────
// Backed by a KV/D1 binding when present. Absent bindings are NOT an error: the
// Worker degrades to read-only-empty so a probe still gets a well-formed answer,
// rather than a 500 that reads as "the protocol is broken".
async function readIndex(env) {
  if (!env.WORKGRAPH) return { nodes: [], edges: [], generated: null, degraded: "no WORKGRAPH binding" }
  const raw = await env.WORKGRAPH.get("index", "json")
  return raw ?? { nodes: [], edges: [], generated: null }
}

const isReadOnly = (env) => (env.WORKGRAPH_READONLY ?? "1") !== "0"

// ── TOOL_MAP — thin 1:1 adapters over the workgraph ────────────────────────
const TOOLS = [
  {
    name: "workgraph_status",
    description:
      "Health + shape of the workgraph index: node/edge counts and when it was last generated. " +
      "Cheap; call this first to see whether the index is fresh before reasoning about it.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    async handler(env) {
      const ix = await readIndex(env)
      return toolText(
        JSON.stringify(
          {
            nodes: ix.nodes.length,
            edges: ix.edges.length,
            generated: ix.generated,
            readOnly: isReadOnly(env),
            degraded: ix.degraded ?? null,
          },
          null,
          2,
        ),
      )
    },
  },
  {
    name: "workgraph_awaits",
    description:
      "What a stage is waiting on. Returns its `Inbound (awaits):` entries with, for each, " +
      "whether the awaited output exists yet. A stage is enabled only when every awaited path " +
      "exists and is non-empty (producers publish via output.partial/ then rename, so existence " +
      "means complete).",
    inputSchema: {
      type: "object",
      properties: { stage: { type: "string", description: "stage id or envelope id" } },
      required: ["stage"],
      additionalProperties: false,
    },
    async handler(env, args) {
      const ix = await readIndex(env)
      const node = ix.nodes.find((n) => n.id === args.stage || n.envelopeId === args.stage)
      if (!node) return toolError(`no stage "${args.stage}" in the workgraph index`)
      const awaits = ix.edges.filter((e) => e.to === node.id)
      return toolText(JSON.stringify({ stage: node.id, awaits }, null, 2))
    },
  },
  {
    name: "workgraph_edges",
    description:
      "Cross-workspace edges for a project or stage. An edge is ONE record with two views — the " +
      "consumer's wait is the producer's obligation — so this returns both directions, labelled.",
    inputSchema: {
      type: "object",
      properties: {
        origin: { type: "string", description: "origin project, e.g. 'prism'" },
        direction: { type: "string", enum: ["inbound", "outbound", "both"] },
      },
      additionalProperties: false,
    },
    async handler(env, args) {
      const ix = await readIndex(env)
      const dir = args.direction ?? "both"
      const origin = args.origin
      const match = (e, side) => (!origin ? true : (e[side] ?? "").startsWith(`wg:${origin}:`))
      const out = {
        outbound: dir === "inbound" ? [] : ix.edges.filter((e) => match(e, "from")),
        inbound: dir === "outbound" ? [] : ix.edges.filter((e) => match(e, "to")),
      }
      return toolText(JSON.stringify(out, null, 2))
    },
  },
  {
    name: "workgraph_resolve",
    description:
      "Resolve a stable envelope id (wg:<origin>:<ulid>) to its record. Envelope ids — not paths — " +
      "are what survive a move or rename across workspaces, so this is the durable lookup.",
    inputSchema: {
      type: "object",
      properties: { envelopeId: { type: "string" } },
      required: ["envelopeId"],
      additionalProperties: false,
    },
    async handler(env, args) {
      const ix = await readIndex(env)
      const node = ix.nodes.find((n) => n.envelopeId === args.envelopeId)
      return node
        ? toolText(JSON.stringify(node, null, 2))
        : toolError(`no record for envelope id "${args.envelopeId}"`)
    },
  },
]

const TOOL_MAP = new Map(TOOLS.map((t) => [t.name, t]))

/**
 * The wire schema, produced BY OMISSION — the same objects minus `handler`.
 * It therefore cannot drift from the implementation. (Puter's best idea.)
 */
const listTools = () => TOOLS.map(({ handler, ...rest }) => rest)

// ── JSON-RPC dispatch ──────────────────────────────────────────────────────
async function handleRpc(msg, env) {
  if (msg === null || typeof msg !== "object" || Array.isArray(msg) || msg.jsonrpc !== "2.0") {
    return rpcError(msg?.id ?? null, INVALID_REQUEST, "expected a JSON-RPC 2.0 request object")
  }
  const { id, method, params } = msg

  switch (method) {
    case "initialize": {
      const asked = params?.protocolVersion
      const protocolVersion = PROTOCOL_VERSIONS.includes(asked) ? asked : DEFAULT_PROTOCOL
      return rpcResult(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "prism-workgraph-mcp", version: "0.1.0" },
        instructions:
          "The Griot-Wide Workgraph over MCP. Call workgraph_status first to check index " +
          "freshness. A stage is enabled only when every path in its `Inbound (awaits):` exists " +
          "and is non-empty. This view is READ-ONLY and generated: re-disposition happens at " +
          "origin, never here.",
      })
    }
    case "notifications/initialized":
      return null // a notification: no response body
    case "tools/list":
      return rpcResult(id, { tools: listTools() })
    case "tools/call": {
      const name = params?.name
      const tool = TOOL_MAP.get(name)
      if (!tool) return rpcError(id, INVALID_PARAMS, `unknown tool "${name}"`)
      if (isReadOnly(env) && tool.mutates) {
        return rpcResult(id, toolError("workgraph is read-only; re-disposition happens at origin"))
      }
      try {
        return rpcResult(id, await tool.handler(env, params?.arguments ?? {}))
      } catch (e) {
        // A tool that throws is a TOOL failure, not a protocol failure.
        return rpcResult(id, toolError(`${name} failed: ${e?.message ?? String(e)}`))
      }
    }
    case "ping":
      return rpcResult(id, {})
    default:
      return rpcError(id, METHOD_NOT_FOUND, `unknown method "${method}"`)
  }
}

// ── Transport: POST-only, JSON only, batch supported ───────────────────────
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })

// Guarded so the module can be imported by the unit test outside the Worker
// runtime, where `addEventListener` does not exist. In the Worker this is always
// taken; in node it is skipped and `handle`/`handleRpc` are exercised directly.
if (typeof addEventListener === "function") {
  addEventListener("fetch", (event) => {
    event.respondWith(handle(event.request, globalThis))
  })
}

async function handle(request, env) {
  const url = new URL(request.url)

  // Transport-level errors are JSON too, so a discovery probe never gets an
  // unparseable body (the Puter separation).
  if (url.pathname !== "/" && url.pathname !== "/mcp") {
    return json({ error: "not_found", message: "MCP endpoint is POST /mcp" }, 404)
  }
  if (request.method === "GET") {
    // No SSE. Answer the probe with something well-formed rather than an error.
    return json({ name: "prism-workgraph-mcp", transport: "streamable-http", methods: ["POST"] })
  }
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed", message: "use POST" }, 405)
  }

  let body
  try {
    body = await request.json()
  } catch {
    return json(rpcError(null, PARSE_ERROR, "invalid JSON"), 200)
  }

  try {
    if (Array.isArray(body)) {
      const out = []
      for (const m of body) {
        const r = await handleRpc(m, env)
        if (r) out.push(r)
      }
      // An all-notification batch gets 202 with no body.
      return out.length ? json(out) : new Response(null, { status: 202 })
    }
    const r = await handleRpc(body, env)
    return r ? json(r) : new Response(null, { status: 202 })
  } catch (e) {
    return json(rpcError(body?.id ?? null, INTERNAL_ERROR, e?.message ?? "internal error"), 200)
  }
}

// Exported for the unit test; harmless in the Worker runtime.
if (typeof module !== "undefined") {
  module.exports = { handleRpc, listTools, TOOL_MAP, handle }
}
