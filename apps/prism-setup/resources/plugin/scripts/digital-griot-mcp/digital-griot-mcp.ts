#!/usr/bin/env bun
/**
 * digital-griot-mcp.ts — Persistent MCP channel + tool server for the Digital Griot
 * ecosystem bus. Registered in `.claude-plugin/plugin.json` so Claude Code spawns it
 * at plugin-load time over stdio.
 *
 * This server was generalized from the prism-brainstorm-only `brainstorm-channel`. It is
 * now the ONE shared wire that multiple Griot surfaces POST to on 127.0.0.1:52342. The
 * core relay is surface-agnostic: it forwards any wake POST with arbitrary string `meta`.
 * Surfaces disambiguate via `meta` (there is no per-surface branch in the relay):
 *
 *   - prism-brainstorm POSTs { content, session_id, choice, element_id }        (unchanged)
 *   - prism-gavel      POSTs { content, session_id, skill:"gavel",
 *                              verb:"scan|open|commit|verify", card_id, use, role, stage }
 *
 * The `skill` meta key (when present) tells Claude, on wake, which surface fired the
 * event — a plain gavel wake carries `skill:"gavel"`. All of these are underscore/alpha
 * keys, so they pass through `sanitizeMeta` unchanged (hyphenated keys are dropped).
 *
 * Architecture (Option C — persistent + session routing):
 *   Browser click → POST http://127.0.0.1:52342/channel → MCP notification → Claude wakes
 *
 * The HTTP server runs alongside the MCP stdio transport in the same Bun process.
 * Browser POSTs include `session_id` so Claude can disambiguate which session generated
 * the click.
 *
 * In addition to the wake relay, this server exposes six real MCP tools for prism-gavel
 * (gavel_state, gavel_decide, gavel_open, gavel_scan, gavel_commit, gavel_verify) so
 * other clients (Desktop, CLI) can drive the gavel cockpit directly. Tool DEFINITIONS
 * (name/description/inputSchema) are complete; the deep handler bodies are wired in S4.
 *
 * Env:
 *   BRAINSTORM_CHANNEL_PORT  Override the HTTP port (default: 52342).
 *                            NOTE: env var name and default 52342 are the PORT CONTRACT
 *                            the brainstorm popout (server.cjs/helper.js) depends on —
 *                            do not rename or change the default.
 *
 * Browser POST shape:
 *   {
 *     "session_id": "1234-1775635488",
 *     "content": "user clicked Option B",
 *     "choice": "B",
 *     "id": "fidelity-progression",
 *     ...other string fields become meta keys
 *   }
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"

const DEFAULT_PORT = 52342
const CHANNEL_PORT =
  Number.parseInt(process.env.BRAINSTORM_CHANNEL_PORT ?? "", 10) || DEFAULT_PORT

const server = new Server(
  { name: "digital-griot-mcp", version: "1.0.0" },
  {
    capabilities: { tools: {} },
    instructions:
      "Shared Digital Griot wake channel + tool server. Receives wake events from Griot " +
      "browser viewers (prism-brainstorm, prism-gavel). Each notification's `session_id` " +
      "meta key identifies which session generated the click; the `skill` meta key (when " +
      "present, e.g. `gavel`) identifies which surface fired it. The `content` field is a " +
      "human-readable summary. When you receive a wake event, read the events file for that " +
      "session and resume: a brainstorm event → resume the brainstorm session; a gavel event " +
      "(skill=gavel) → run the requested gavel `verb`. This server also exposes the gavel_* " +
      "MCP tools for driving the Gavel cockpit directly.",
  },
)

// ---------------------------------------------------------------------------
// Gavel MCP tools (S2c). Real tool DEFINITIONS on the shared digital-griot-mcp
// server; the deep read/write handler bodies land in S4. The six tools mirror
// the Gavel cockpit's ITEMS/RESOLVE data model (decision store).
// ---------------------------------------------------------------------------

const GAVEL_TOOLS = [
  {
    name: "gavel_state",
    description:
      "Read the Gavel decision store: return undecided cards (or all) plus counts by axis. " +
      "Sources ITEMS/RESOLVE from griot-live-artifacts. Use before a decide/commit pass to " +
      "see what is still undecided.",
    inputSchema: {
      type: "object",
      properties: {
        axis: {
          type: "string",
          description:
            "Optional axis/group to scope the read to (matches the cockpit's AXES/keyOf grouping).",
        },
        filter: {
          type: "string",
          enum: ["undecided", "all"],
          description: "Which cards to return. Default: undecided.",
          default: "undecided",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "gavel_decide",
    description:
      "Record a decision on one card in the local cockpit state (use / role / stage / note). " +
      "Does NOT commit to griot-live-artifacts — batch decisions, then gavel_commit writes them.",
    inputSchema: {
      type: "object",
      properties: {
        card_id: { type: "string", description: "The card/item id being decided." },
        use: {
          type: "string",
          description: "The chosen use for this card (the cockpit's uB/use-button value).",
        },
        role: {
          type: "string",
          enum: ["scaffold", "component", "pattern"],
          description: "The card's role (the cockpit's rB/role-button value).",
        },
        stage: {
          type: "string",
          description: "The lifecycle stage for this card (the cockpit's sB/stage-button value).",
        },
        note: {
          type: "string",
          description: "Freeform note attached to this card (the cockpit's noteMap entry).",
        },
      },
      required: ["card_id"],
      additionalProperties: false,
    },
  },
  {
    name: "gavel_open",
    description:
      "Open a card's repository or ▶video URL in the browser (via Chrome MCP). Resolves the URL " +
      "from the card's repoMeta/VIDT/RESMAP link layer.",
    inputSchema: {
      type: "object",
      properties: {
        card_id: { type: "string", description: "The card/item id to open." },
      },
      required: ["card_id"],
      additionalProperties: false,
    },
  },
  {
    name: "gavel_scan",
    description:
      "Route a card to griot-potluck-search — answer 'does our potluck already solve this?' — " +
      "and surface matching existing repos/tools for the card.",
    inputSchema: {
      type: "object",
      properties: {
        card_id: { type: "string", description: "The card/item id to scan against the potluck." },
      },
      required: ["card_id"],
      additionalProperties: false,
    },
  },
  {
    name: "gavel_commit",
    description:
      "Write a decided batch of cards to the plan via dgs-plan-update (which owns the Rule-2 " +
      "anti-clobber sync gate and the artifact refresh). MUST route through dgs-plan-update — " +
      "never writes griot-live-artifacts directly.",
    inputSchema: {
      type: "object",
      properties: {
        card_ids: {
          type: "array",
          items: { type: "string" },
          description: "The ids of the decided cards to commit as a batch.",
          minItems: 1,
        },
      },
      required: ["card_ids"],
      additionalProperties: false,
    },
  },
  {
    name: "gavel_verify",
    description:
      "Verify/resolve a card: resolve its slug + stars and promote its RESOLVE status " +
      "(v = verified, u = unresolved, x = rejected).",
    inputSchema: {
      type: "object",
      properties: {
        card_id: { type: "string", description: "The card/item id to verify." },
        slug: {
          type: "string",
          description: "Optional explicit repo slug to resolve against (owner/name).",
        },
      },
      required: ["card_id"],
      additionalProperties: false,
    },
  },
] as const

// tools/list — advertise the six gavel tools.
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: GAVEL_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}))

// tools/call — S4 wires the deep read/write bodies. For now every tool returns a
// structured "not-yet-wired" result so callers get a typed, honest response.
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  const known = GAVEL_TOOLS.some((t) => t.name === name)
  if (!known) {
    return {
      isError: true,
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
    }
  }
  // TODO(S4): wire the real handler bodies:
  //   gavel_state  → parse ITEMS(undecided)/RESOLVE from griot-live-artifacts (git HEAD) → STATE_DIR json
  //   gavel_decide → mutate local cockpit state (batched); no wake
  //   gavel_open   → open repoMeta(d) URL via Chrome MCP
  //   gavel_scan   → run griot-potluck-search on the card
  //   gavel_commit → route the decided batch through dgs-plan-update (Rule-2 sync gate)
  //   gavel_verify → resolve slug + stars → promote v/u/x in RESOLVE
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            ok: false,
            status: "not_yet_wired",
            tool: name,
            args: args ?? {},
            todo: "S4 — handler body not yet implemented",
          },
          null,
          2,
        ),
      },
    ],
  }
})

// Meta keys must be /^[A-Za-z0-9_]+$/ — hyphens are silently dropped by Claude Code.
const META_KEY_RE = /^[A-Za-z0-9_]+$/

// B1b: Session registry for multi-session routing.
// Maps session_id → true for active brainstorm sessions.
// If empty (single-session), all wake notifications fire unconditionally (backward compat).
const sessionRegistry = new Map<string, boolean>()

// B1d: Passive mode — set true if the claude/channel capability probe fails.
// In passive mode the events file still gets written by server.cjs (full local logging),
// but the MCP wake notification is suppressed. Requires Claude Code >= v2.1.80.
let passiveMode = false

function sanitizeMeta(input: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (!input || typeof input !== "object") return out
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (k === "content") continue
    if (!META_KEY_RE.test(k)) continue
    if (typeof v === "string") out[k] = v
    else if (typeof v === "number" || typeof v === "boolean") out[k] = String(v)
  }
  return out
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

let httpServer: ReturnType<typeof Bun.serve> | null = null
try {
  httpServer = Bun.serve({
  port: CHANNEL_PORT,
  hostname: "127.0.0.1",
  async fetch(req) {
    const url = new URL(req.url)

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    if (url.pathname === "/health" && req.method === "GET") {
      return new Response(JSON.stringify({ ok: true, port: CHANNEL_PORT }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      })
    }

    // B1d: Status endpoint — exposes passiveMode so frame-template.html helper.js
    // can render a drawer indicator when active wake is unavailable.
    if (url.pathname === "/status" && req.method === "GET") {
      return new Response(
        JSON.stringify({ ok: true, passive: passiveMode, port: CHANNEL_PORT }),
        { headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
      )
    }

    // B1b: Session registration endpoints.
    // POST /register  {session_id: string} — claim this session's routing slot.
    // POST /unregister {session_id: string} — release when brainstorm session ends.
    if (url.pathname === "/register" && req.method === "POST") {
      let body: Record<string, unknown>
      try { body = (await req.json()) as Record<string, unknown> } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        })
      }
      const sid = typeof body.session_id === "string" ? body.session_id : null
      if (sid) sessionRegistry.set(sid, true)
      return new Response(JSON.stringify({ ok: true, session_id: sid }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      })
    }

    if (url.pathname === "/unregister" && req.method === "POST") {
      let body: Record<string, unknown>
      try { body = (await req.json()) as Record<string, unknown> } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        })
      }
      const sid = typeof body.session_id === "string" ? body.session_id : null
      if (sid) sessionRegistry.delete(sid)
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      })
    }

    if (url.pathname !== "/channel" || req.method !== "POST") {
      return new Response("Not Found", { status: 404, headers: CORS_HEADERS })
    }

    let body: Record<string, unknown>
    try {
      body = (await req.json()) as Record<string, unknown>
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      })
    }

    // sanitizeMeta forwards ALL string meta keys unchanged (surface-agnostic relay).
    // brainstorm keys (choice, element_id) and gavel keys (skill, verb, card_id, use,
    // role, stage) are all underscore/alpha, so they pass through as-is — the surface
    // is disambiguated by `meta`, not by any branch here.
    const meta = sanitizeMeta(body)

    // B1b: Session routing — if registry has entries, only fire for the registered session.
    // If registry is empty, fire unconditionally (single-session backward compat).
    const targetSession = typeof body.session_id === "string" ? body.session_id : null
    if (sessionRegistry.size > 0 && targetSession && !sessionRegistry.has(targetSession)) {
      // Wake signal targeted at a different session — silently drop.
      return new Response(JSON.stringify({ ok: true, routed: false }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      })
    }

    // B1d: Passive mode — events file is still written by server.cjs WS handler
    // (canonical event log). Wake notification is suppressed until capability is confirmed.
    if (passiveMode) {
      return new Response(JSON.stringify({ ok: true, passive: true }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      })
    }

    // B1a: Wake signal only — the events file at $STATE_DIR/events is the canonical
    // event log. Claude reads events on wake; the notification content is a minimal
    // wake signal, not the event payload.
    try {
      await server.notification({
        method: "notifications/message/create",
        params: {
          content: "Griot viewer interaction — read events file for details",
          meta,
        },
      })
    } catch (err) {
      // Log but don't crash — the notification failing shouldn't break the HTTP response.
      // Common causes: stdio transport not connected yet, Claude Code doesn't support
      // this notification method, or the MCP connection was dropped.
      console.error("[digital-griot-mcp] notification failed:", String(err))
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    })
  },
})
} catch (err) {
  // Port already in use or other startup failure — log but don't crash the MCP process.
  // The stdio transport should still work even if the HTTP listener fails.
  console.error("[digital-griot-mcp] HTTP server failed to start:", String(err))
}

const transport = new StdioServerTransport()
await server.connect(transport)

// B1d: Capability probe — verify claude/channel notification is supported.
// Falls back to passive mode on runtimes < v2.1.80.
// In passive mode: events file still gets written by server.cjs (full local logging),
// but the MCP wake notification is suppressed.
try {
  await server.notification({
    method: "notifications/message/create",
    params: {
      content: "digital-griot-mcp: capability probe",
      meta: { type: "probe" },
    },
  })
  // If we reach here, the channel is functional.
} catch {
  passiveMode = true
  console.error(
    "[digital-griot-mcp] claude/channel not available — passive mode active (Claude Code < v2.1.80). " +
    "Events file will still be written; send a message to Claude to read your selections.",
  )
}
