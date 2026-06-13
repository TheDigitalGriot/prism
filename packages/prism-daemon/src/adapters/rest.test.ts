import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { RestAdapter } from "./rest";
import type { ServiceDescriptor } from "../protocol";

interface Mock {
  url: string;
  close: () => Promise<void>;
}

function startHttp(handler: (req: IncomingMessage, res: ServerResponse) => void): Promise<Mock> {
  return new Promise((resolve) => {
    const server = createServer(handler);
    server.listen(0, "127.0.0.1", () => {
      const port = (server.address() as AddressInfo).port;
      resolve({ url: `http://127.0.0.1:${port}`, close: () => new Promise<void>((d) => server.close(() => d())) });
    });
  });
}

// design-studio relay (:7457 in prod): /status /launch /stop
function startMockRelay(): Promise<Mock> {
  return startHttp((req, res) => {
    res.setHeader("content-type", "application/json");
    if (req.method === "GET" && req.url === "/status") return void res.end(JSON.stringify({ running: false, port: 7456, relay: 7457 }));
    if (req.method === "POST" && req.url === "/launch") return void res.end(JSON.stringify({ status: "starting", port: 7456 }));
    if (req.method === "POST" && req.url === "/stop") return void res.end(JSON.stringify({ status: "stopped" }));
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "not found" }));
  });
}

// prism-design-engine (:7456 in prod): /api/skills /api/chat
function startMockEngine(): Promise<Mock> {
  return startHttp((req, res) => {
    res.setHeader("content-type", "application/json");
    if (req.method === "GET" && req.url === "/api/skills") {
      return void res.end(JSON.stringify({ skills: [{ name: "prototype", description: "HTML prototype", methods: ["prototype"] }] }));
    }
    if (req.method === "POST" && req.url === "/api/chat") {
      let body = "";
      req.on("data", (c: Buffer) => (body += c.toString()));
      req.on("end", () => res.end(JSON.stringify({ echo: body ? JSON.parse(body) : null })));
      return;
    }
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "not found" }));
  });
}

describe("RestAdapter — design-gen multi-endpoint routing (Phase 3A)", () => {
  let relay: Mock | undefined;
  let engine: Mock | undefined;

  afterEach(async () => {
    await relay?.close();
    await engine?.close();
    relay = engine = undefined;
  });

  function descFor(relayUrl: string, engineUrl: string): ServiceDescriptor {
    return {
      id: "design-gen",
      name: "design-gen",
      status: "stopped",
      adapterType: "rest",
      endpoint: { local: relayUrl },
      capabilities: [],
      healthProbe: `GET ${engineUrl}/api/skills`,
      routes: {
        state: { verb: "GET", url: `${relayUrl}/status` },
        launch: { verb: "POST", url: `${relayUrl}/launch` },
        stop: { verb: "POST", url: `${relayUrl}/stop` },
        chat: { verb: "POST", url: `${engineUrl}/api/chat` },
      },
    };
  }

  it("probes readiness at the engine's /api/skills and parses the manifest", async () => {
    relay = await startMockRelay();
    engine = await startMockEngine();
    const adapter = new RestAdapter(descFor(relay.url, engine.url));
    const probe = await adapter.probe();
    expect(probe.ok).toBe(true);
    expect(probe.manifest?.map((m) => m.name)).toContain("prototype");
  });

  it("routes lifecycle methods to the relay", async () => {
    relay = await startMockRelay();
    engine = await startMockEngine();
    const adapter = new RestAdapter(descFor(relay.url, engine.url));
    expect(await adapter.call("state", undefined)).toMatchObject({ running: false });
    expect(await adapter.call("launch", {})).toMatchObject({ status: "starting" });
    expect(await adapter.call("stop", {})).toMatchObject({ status: "stopped" });
  });

  it("routes chat to the engine and round-trips the brief", async () => {
    relay = await startMockRelay();
    engine = await startMockEngine();
    const adapter = new RestAdapter(descFor(relay.url, engine.url));
    const result = (await adapter.call("chat", { brief: "a landing page", design_system: "griotwave" })) as { echo: unknown };
    expect(result.echo).toEqual({ brief: "a landing page", design_system: "griotwave" });
  });
});
