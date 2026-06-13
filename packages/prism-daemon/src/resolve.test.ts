import { afterEach, describe, expect, it } from "vitest";
import { availableVramGb, passesGate, resolveEndpoint } from "./resolve";
import type { ServiceDescriptor } from "./protocol";

function svc(over: Partial<ServiceDescriptor> = {}): ServiceDescriptor {
  return {
    id: "s",
    name: "s",
    status: "stopped",
    adapterType: "flask-http",
    endpoint: {},
    capabilities: [],
    healthProbe: "GET /skills",
    ...over,
  };
}

const up = async (): Promise<boolean> => true;
const down = async (): Promise<boolean> => false;

describe("resolveEndpoint (Phase 6)", () => {
  it("uses local when the gate passes and local is reachable", async () => {
    const r = await resolveEndpoint(svc({ endpoint: { local: "http://local", cloud: "http://cloud" } }), { probe: up });
    expect(r).toEqual({ url: "http://local", via: "local" });
  });

  it("falls back to cloud when local is unreachable", async () => {
    const r = await resolveEndpoint(svc({ endpoint: { local: "http://local", cloud: "http://cloud" } }), { probe: down });
    expect(r).toEqual({ url: "http://cloud", via: "cloud" });
  });

  it("falls back to cloud when the gate fails (e.g. insufficient VRAM)", async () => {
    const desc = svc({ endpoint: { local: "http://local", cloud: "http://cloud" }, gate: { kind: "vram", min: 24 } });
    const r = await resolveEndpoint(desc, { probe: up, gate: () => false });
    expect(r).toEqual({ url: "http://cloud", via: "cloud" });
  });

  it("returns local (best-effort) when no cloud is configured", async () => {
    const r = await resolveEndpoint(svc({ endpoint: { local: "http://local" } }), { probe: down });
    expect(r).toEqual({ url: "http://local", via: "local" });
  });

  it("throws when no endpoint is configured", async () => {
    await expect(resolveEndpoint(svc({ endpoint: {} }))).rejects.toThrow(/no endpoint/);
  });
});

describe("passesGate / VRAM gate (Phase 6)", () => {
  const prev = process.env.PRISM_VRAM_GB;
  afterEach(() => {
    if (prev === undefined) delete process.env.PRISM_VRAM_GB;
    else process.env.PRISM_VRAM_GB = prev;
  });

  it("passes when available VRAM >= min (env override)", () => {
    process.env.PRISM_VRAM_GB = "24";
    expect(availableVramGb()).toBe(24);
    expect(passesGate(svc({ gate: { kind: "vram", min: 24 } }))).toBe(true);
  });

  it("fails when available VRAM < min", () => {
    process.env.PRISM_VRAM_GB = "6";
    expect(passesGate(svc({ gate: { kind: "vram", min: 24 } }))).toBe(false);
  });

  it("passes when there is no gate", () => {
    expect(passesGate(svc())).toBe(true);
  });
});
