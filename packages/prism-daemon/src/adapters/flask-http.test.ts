import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { FlaskHttpAdapter } from "./flask-http";
import { createAdapter } from "./index";
import type { ServiceDescriptor } from "../protocol";

interface MockFlask {
  baseUrl: string;
  close: () => Promise<void>;
}

/** A backend in the FlaskHttpAdapter convention: GET /skills + POST /{method}. */
function startMockFlask(): Promise<MockFlask> {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      if (req.method === "GET" && req.url === "/skills") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ skills: [{ name: "query", description: "graph query", methods: ["query"] }] }));
        return;
      }
      if (req.method === "POST") {
        let body = "";
        req.on("data", (c: Buffer) => (body += c.toString()));
        req.on("end", () => {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify({ echo: body ? JSON.parse(body) : null, path: req.url }));
        });
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

function descFor(baseUrl: string): ServiceDescriptor {
  return {
    id: "knowledge",
    name: "knowledge",
    status: "stopped",
    adapterType: "flask-http",
    endpoint: { local: baseUrl },
    capabilities: [],
    healthProbe: "GET /skills",
  };
}

describe("FlaskHttpAdapter (Phase 5)", () => {
  let backend: MockFlask | undefined;

  afterEach(async () => {
    await backend?.close();
    backend = undefined;
  });

  it("probes the discovery endpoint and parses the skills manifest", async () => {
    backend = await startMockFlask();
    const adapter = new FlaskHttpAdapter(descFor(backend.baseUrl));
    const probe = await adapter.probe();
    expect(probe.ok).toBe(true);
    expect(probe.manifest?.map((m) => m.name)).toContain("query");
  });

  it("call() POSTs to /{method} and returns the JSON result", async () => {
    backend = await startMockFlask();
    const adapter = new FlaskHttpAdapter(descFor(backend.baseUrl));
    const result = (await adapter.call("query", { q: "auth" })) as { echo: unknown; path: string };
    expect(result.echo).toEqual({ q: "auth" });
    expect(result.path).toBe("/query");
  });

  it("probe() returns ok:false on a dead endpoint (no hang)", async () => {
    const adapter = new FlaskHttpAdapter(descFor("http://127.0.0.1:1"));
    const probe = await adapter.probe();
    expect(probe.ok).toBe(false);
  });

  it("ONE adapter class instantiates for all four Flask services", () => {
    for (const id of ["knowledge", "3d-gen", "cinopsis", "notebooks"]) {
      const adapter = createAdapter({
        id,
        name: id,
        status: "stopped",
        adapterType: "flask-http",
        endpoint: { local: "http://127.0.0.1:9" },
        capabilities: [],
        healthProbe: "GET /skills",
      });
      expect(adapter.type).toBe("flask-http");
    }
  });
});
