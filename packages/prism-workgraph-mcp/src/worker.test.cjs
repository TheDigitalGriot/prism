/**
 * Protocol tests for the Spectrum-workgraph MCP Worker.
 *
 * Runs in plain node — no wrangler, no network. `handleRpc` is exercised directly,
 * which is why worker.js guards its `addEventListener` registration.
 *
 * Usage: node packages/prism-workgraph-mcp/src/worker.test.cjs
 */
const { handleRpc, TOOL_MAP } = require("./worker.js")

const env = { WORKGRAPH_READONLY: "1" }
let pass = 0
let fail = 0
const t = (name, check) => {
  try {
    if (check()) {
      pass++
      console.log("  ok   " + name)
    } else {
      fail++
      console.log("  FAIL " + name)
    }
  } catch (e) {
    fail++
    console.log("  FAIL " + name + " -> " + e.message)
  }
}

;(async () => {
  const init = await handleRpc(
    { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } },
    env,
  )
  t("initialize echoes a supported protocolVersion", () => init.result.protocolVersion === "2025-06-18")

  const init2 = await handleRpc(
    { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "1999-01-01" } },
    env,
  )
  t("initialize falls back on an unknown version", () => init2.result.protocolVersion === "2025-06-18")
  t("tools.listChanged is false", () => init.result.capabilities.tools.listChanged === false)

  const list = await handleRpc({ jsonrpc: "2.0", id: 2, method: "tools/list" }, env)
  t("tools/list returns every tool", () => list.result.tools.length === TOOL_MAP.size)
  // The wire schema is produced BY OMISSION, so it cannot drift from the impl.
  t("the wire schema OMITS handler (cannot drift)", () => list.result.tools.every((x) => !("handler" in x)))
  t("every tool carries an inputSchema", () => list.result.tools.every((x) => x.inputSchema?.type === "object"))

  const bad = await handleRpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "nope" } }, env)
  t("unknown tool -> JSON-RPC INVALID_PARAMS", () => bad.error?.code === -32602)

  const nom = await handleRpc({ jsonrpc: "2.0", id: 4, method: "frobnicate" }, env)
  t("unknown method -> METHOD_NOT_FOUND", () => nom.error?.code === -32601)

  const notif = await handleRpc({ jsonrpc: "2.0", method: "notifications/initialized" }, env)
  t("a notification produces no response", () => notif === null)

  const st = await handleRpc({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "workgraph_status" } }, env)
  t("status degrades gracefully with no binding", () => {
    const p = JSON.parse(st.result.content[0].text)
    return p.nodes === 0 && p.degraded !== null
  })

  const miss = await handleRpc(
    { jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "workgraph_awaits", arguments: { stage: "ghost" } } },
    env,
  )
  // A tool failure must be CONTENT with isError, never a protocol-level error.
  t("a tool failure is isError CONTENT, not a protocol error", () => miss.result.isError === true && !miss.error)

  t("read-only is the default", () => {
    const p = JSON.parse(st.result.content[0].text)
    return p.readOnly === true
  })

  const junk = await handleRpc("not-an-object", env)
  t("a malformed request -> INVALID_REQUEST", () => junk.error?.code === -32600)

  console.log(`\n  ${pass} passed, ${fail} failed`)
  process.exit(fail ? 1 : 0)
})()
