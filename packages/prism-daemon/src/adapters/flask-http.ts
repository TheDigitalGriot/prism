/**
 * FlaskHttpAdapter — ONE adapter for every Python/Flask-style HTTP backend:
 * knowledge (Graphify/Synaptiq), 3d-gen (Lucid), cinopsis, notebooks. Parameterized
 * by endpoint + a discovery probe; no per-service code.
 *
 * Convention:
 *   probe   -> {healthProbe}             e.g. "GET /skills" (JSON { skills:[...] } or { tools:[...] })
 *   call    -> POST {baseUrl}/{method}   JSON body = payload, JSON response = result
 *   stream  -> single POST result as one frame (SSE streaming is a later refinement)
 *
 * Spec: .prism/shared/designs/2026-06-12-daemon-broker-design.md (§5, FlaskHttpAdapter)
 */
import type { ServiceDescriptor, SkillManifestEntry } from "../protocol";
import type { Adapter, ProbeResult, StreamEvent } from "./types";

const PROBE_TIMEOUT_MS = 1500;
const CALL_TIMEOUT_MS = 60_000;

interface SkillLike {
  name?: unknown;
  description?: unknown;
  methods?: unknown;
}

export class FlaskHttpAdapter implements Adapter {
  readonly type = "flask-http" as const;
  private readonly baseUrl: string;
  private readonly probeMethod: string;
  private readonly probePath: string;
  private capabilities: SkillManifestEntry[] = [];

  constructor(private readonly desc: ServiceDescriptor) {
    const url = desc.endpoint.local ?? desc.endpoint.cloud;
    if (!url) throw new Error(`FlaskHttpAdapter: service '${desc.id}' has no endpoint`);
    this.baseUrl = url.replace(/\/+$/, "");
    const parts = (desc.healthProbe || "GET /skills").trim().split(/\s+/);
    if (parts.length > 1) {
      this.probeMethod = parts[0]!.toUpperCase();
      this.probePath = parts[1]!;
    } else {
      this.probeMethod = "GET";
      this.probePath = parts[0]!;
    }
  }

  async connect(): Promise<void> {
    // HTTP is stateless; readiness is established lazily via probe().
  }

  private async fetchJson(
    method: string,
    path: string,
    body: unknown,
    timeoutMs: number,
  ): Promise<{ status: number; json: unknown }> {
    const init: RequestInit = { method, signal: AbortSignal.timeout(timeoutMs) };
    if (body !== undefined && method !== "GET") {
      init.headers = { "content-type": "application/json" };
      init.body = JSON.stringify(body);
    }
    const res = await fetch(`${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`, init);
    const text = await res.text();
    let json: unknown = text;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = text;
      }
    }
    return { status: res.status, json };
  }

  private extractCapabilities(json: unknown): void {
    if (!json || typeof json !== "object") return;
    const raw = (json as { skills?: unknown; tools?: unknown }).skills ?? (json as { tools?: unknown }).tools;
    if (!Array.isArray(raw)) return;
    this.capabilities = raw.map((entry): SkillManifestEntry => {
      if (typeof entry === "string") return { name: entry, description: "", methods: [entry] };
      const s = entry as SkillLike;
      const name = typeof s.name === "string" ? s.name : String(s.name ?? "");
      return {
        name,
        description: typeof s.description === "string" ? s.description : "",
        methods: Array.isArray(s.methods) ? (s.methods as string[]) : [name],
      };
    });
  }

  async probe(): Promise<ProbeResult> {
    const start = Date.now();
    try {
      const { status, json } = await this.fetchJson(this.probeMethod, this.probePath, undefined, PROBE_TIMEOUT_MS);
      const ok = status >= 200 && status < 300;
      if (ok) this.extractCapabilities(json);
      return { ok, via: "local", latencyMs: Date.now() - start, manifest: this.capabilities };
    } catch {
      return { ok: false, via: "local", latencyMs: Date.now() - start };
    }
  }

  async describe(): Promise<SkillManifestEntry[]> {
    await this.probe();
    return this.capabilities;
  }

  async call(method: string, payload: unknown): Promise<unknown> {
    const { status, json } = await this.fetchJson("POST", `/${method}`, payload ?? {}, CALL_TIMEOUT_MS);
    if (status < 200 || status >= 300) {
      throw new Error(`FlaskHttpAdapter: '${this.desc.id}' ${method} → HTTP ${status}`);
    }
    return json;
  }

  async *stream(method: string, payload: unknown): AsyncGenerator<StreamEvent> {
    const result = await this.call(method, payload);
    yield { seq: 0, kind: "result", data: result };
  }

  async disconnect(): Promise<void> {
    // nothing to tear down for stateless HTTP
  }
}
