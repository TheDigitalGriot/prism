import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { StdioMcpAdapter } from "./stdio-mcp";
import type { ServiceDescriptor } from "../protocol";

const MOCK = join(__dirname, "__fixtures__", "mock-mcp-server.mjs");

function descFor(spawnCmd: string): ServiceDescriptor {
  return {
    id: "code-intel",
    name: "code-intel",
    status: "stopped",
    adapterType: "stdio-mcp",
    endpoint: {},
    capabilities: [],
    healthProbe: "tools/list",
    spawnCmd,
  };
}

describe("StdioMcpAdapter (Phase 4)", () => {
  let adapter: StdioMcpAdapter | undefined;

  afterEach(async () => {
    await adapter?.disconnect();
    adapter = undefined;
  });

  it("initializes and exposes tools/list as the discovery manifest", async () => {
    adapter = new StdioMcpAdapter(descFor(`node ${MOCK}`));
    const probe = await adapter.probe();
    expect(probe.ok).toBe(true);
    expect(probe.manifest?.map((m) => m.name)).toContain("search_graph");
  });

  it("call() invokes tools/call and returns the result", async () => {
    adapter = new StdioMcpAdapter(descFor(`node ${MOCK}`));
    const result = (await adapter.call("search_graph", { q: "auth" })) as { content: Array<{ text: string }> };
    expect(JSON.parse(result.content[0]!.text)).toEqual({ q: "auth" });
  });

  it("stream() surfaces the unary result as a single frame", async () => {
    adapter = new StdioMcpAdapter(descFor(`node ${MOCK}`));
    const frames: unknown[] = [];
    for await (const ev of adapter.stream("trace_path", { fn: "x" })) frames.push(ev.data);
    expect(frames).toHaveLength(1);
  });

  it("probe() returns ok:false when the binary is missing (no hang)", async () => {
    adapter = new StdioMcpAdapter(descFor("this-binary-does-not-exist-prism-xyz"));
    const probe = await adapter.probe();
    expect(probe.ok).toBe(false);
  });
});
