// Minimal mock MCP server over stdio (JSON-RPC 2.0, newline-delimited).
// Used by stdio-mcp.test.ts — spawned via `node <this file>`.
import { createInterface } from "node:readline";

const rl = createInterface({ input: process.stdin });

function send(obj) {
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}

rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch {
    return;
  }
  switch (msg.method) {
    case "initialize":
      send({
        jsonrpc: "2.0",
        id: msg.id,
        result: { protocolVersion: "2024-11-05", capabilities: {}, serverInfo: { name: "mock-mcp", version: "0" } },
      });
      break;
    case "tools/list":
      send({
        jsonrpc: "2.0",
        id: msg.id,
        result: {
          tools: [
            { name: "search_graph", description: "mock graph search", inputSchema: {} },
            { name: "trace_path", description: "mock trace", inputSchema: {} },
          ],
        },
      });
      break;
    case "tools/call":
      // Echo the arguments back so the test can assert the round-trip.
      send({
        jsonrpc: "2.0",
        id: msg.id,
        result: { content: [{ type: "text", text: JSON.stringify(msg.params?.arguments ?? {}) }], isError: false },
      });
      break;
    default:
      // notifications (no id) and unknown methods are ignored
      break;
  }
});
