import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import { Broker } from "./broker";
import { Registry } from "./registry";
import type { BrokerEnvelope, ServiceDescriptor, WSHello } from "./protocol";

function open(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    ws.once("open", () => resolve());
    ws.once("error", reject);
  });
}

function nextMessage(ws: WebSocket): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    ws.once("message", (data: Buffer | ArrayBuffer | Buffer[]) => {
      try {
        resolve(JSON.parse(data.toString()) as Record<string, unknown>);
      } catch (err) {
        reject(err as Error);
      }
    });
    ws.once("error", reject);
  });
}

describe("Broker handshake (Phase 1)", () => {
  let broker: Broker | undefined;
  let ws: WebSocket | undefined;

  afterEach(async () => {
    ws?.close();
    ws = undefined;
    await broker?.close();
    broker = undefined;
  });

  it("replies to hello with a welcome carrying the live registry snapshot", async () => {
    broker = new Broker({ registry: new Registry() });
    const port = await broker.listen("127.0.0.1", 0);
    ws = new WebSocket(`ws://127.0.0.1:${port}`);
    await open(ws);

    const hello: WSHello = { type: "hello", clientId: "test-client", version: "0.0.0", caps: [] };
    ws.send(JSON.stringify(hello));

    const welcome = await nextMessage(ws);
    expect(welcome.type).toBe("welcome");
    expect(typeof welcome.sessionId).toBe("string");
    expect(welcome.services).toEqual([]);
    expect(welcome.brokerVersion).toBe("0.1.0");
  });

  it("returns SERVICE_NOT_FOUND for an unknown service", async () => {
    broker = new Broker({ registry: new Registry() });
    const port = await broker.listen("127.0.0.1", 0);
    ws = new WebSocket(`ws://127.0.0.1:${port}`);
    await open(ws);

    ws.send(JSON.stringify({ type: "hello", clientId: "t", version: "0", caps: [] } satisfies WSHello));
    await nextMessage(ws); // consume welcome

    const env: BrokerEnvelope = { id: "req-1", service: "ghost", method: "noop", ts: 1 };
    ws.send(JSON.stringify(env));

    const res = await nextMessage(ws);
    expect(res.type).toBe("response");
    expect(res.ok).toBe(false);
    expect((res.error as { code: string }).code).toBe("SERVICE_NOT_FOUND");
  });
});

interface MockFlask {
  baseUrl: string;
  close: () => Promise<void>;
}

function startMockFlask(): Promise<MockFlask> {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      if (req.method === "GET" && req.url === "/skills") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ skills: [{ name: "query", description: "", methods: ["query"] }] }));
        return;
      }
      res.writeHead(404);
      res.end();
    });
    server.listen(0, "127.0.0.1", () => {
      const port = (server.address() as AddressInfo).port;
      resolve({
        baseUrl: `http://127.0.0.1:${port}`,
        close: () => new Promise<void>((done) => server.close(() => done())),
      });
    });
  });
}

describe("Broker.init() — try-local→cloud + readiness (Phase 6)", () => {
  let broker: Broker | undefined;
  let backend: MockFlask | undefined;

  afterEach(async () => {
    await broker?.close();
    await backend?.close();
    broker = undefined;
    backend = undefined;
  });

  it("resolves to local and marks the service ready when reachable", async () => {
    backend = await startMockFlask();
    const registry = new Registry();
    const desc: ServiceDescriptor = {
      id: "knowledge",
      name: "knowledge",
      status: "stopped",
      adapterType: "flask-http",
      endpoint: { local: backend.baseUrl, cloud: "http://127.0.0.1:2" },
      capabilities: [],
      healthProbe: "GET /skills",
    };
    registry.upsert(desc);
    broker = new Broker({ registry });
    await broker.init();

    const stored = registry.get("knowledge")!;
    expect(stored.status).toBe("ready");
    expect(stored.lastProbe?.via).toBe("local");
    expect(stored.capabilities.map((c) => c.name)).toContain("query");
  });

  it("falls back to cloud (via=cloud) when the gate fails", async () => {
    const registry = new Registry();
    const desc: ServiceDescriptor = {
      id: "3d-gen",
      name: "3d-gen",
      status: "stopped",
      adapterType: "flask-http",
      endpoint: { local: "http://127.0.0.1:1", cloud: "http://127.0.0.1:2" },
      capabilities: [],
      healthProbe: "GET /skills",
      gate: { kind: "vram", min: 999 },
    };
    registry.upsert(desc);
    broker = new Broker({ registry });
    await broker.init({ gate: () => false });

    const stored = registry.get("3d-gen")!;
    expect(stored.lastProbe?.via).toBe("cloud");
  });
});
