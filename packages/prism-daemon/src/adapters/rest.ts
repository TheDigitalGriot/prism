/**
 * RestAdapter — for HTTP/REST services whose methods map to specific, possibly
 * multi-endpoint routes. Built for design-gen: lifecycle on the prism-design-studio
 * relay (:7457 → /status /launch /stop) and work on the engine (:7456 → /api/chat),
 * with readiness probed at the engine's /api/skills.
 *
 * Config-driven via `descriptor.routes` so it stays generic:
 *   routes: { <method>: { verb, url } }   (url may be absolute or a path on endpoint.local)
 * Unmapped methods fall back to POST {baseUrl}/{method}.
 *
 * Spec: .prism/shared/designs/2026-06-12-daemon-broker-design.md (§5, RestAdapter)
 */
import type { ServiceDescriptor, SkillManifestEntry } from "../protocol";
import type { Adapter, ProbeResult, StreamEvent } from "./types";

const PROBE_TIMEOUT_MS = 1500;
const CALL_TIMEOUT_MS = 120_000; // design generation can be slow

export class RestAdapter implements Adapter {
  readonly type = "rest" as const;
  private readonly baseUrl: string;
  private readonly probeVerb: string;
  private readonly probeUrl: string;
  private readonly routes: Record<string, { verb: string; url: string }>;
  private capabilities: SkillManifestEntry[] = [];

  constructor(private readonly desc: ServiceDescriptor) {
    const url = desc.endpoint.local ?? desc.endpoint.cloud;
    if (!url) throw new Error(`RestAdapter: service '${desc.id}' has no endpoint`);
    this.baseUrl = url.replace(/\/+$/, "");
    const parts = (desc.healthProbe || "GET /status").trim().split(/\s+/);
    this.probeVerb = parts.length > 1 ? parts[0]!.toUpperCase() : "GET";
    this.probeUrl = this.resolveUrl(parts.length > 1 ? parts[1]! : parts[0]!);
    this.routes = desc.routes ?? {};
  }

  private resolveUrl(target: string): string {
    if (/^https?:\/\//.test(target)) return target;
    return `${this.baseUrl}${target.startsWith("/") ? target : `/${target}`}`;
  }

  async connect(): Promise<void> {}

  private async fetchJson(verb: string, url: string, body: unknown, timeoutMs: number): Promise<{ status: number; json: unknown }> {
    const init: RequestInit = { method: verb, signal: AbortSignal.timeout(timeoutMs) };
    if (body !== undefined && verb !== "GET") {
      init.headers = { "content-type": "application/json" };
      init.body = JSON.stringify(body);
    }
    const res = await fetch(url, init);
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

  async probe(): Promise<ProbeResult> {
    const start = Date.now();
    try {
      const { status, json } = await this.fetchJson(this.probeVerb, this.probeUrl, undefined, PROBE_TIMEOUT_MS);
      const ok = status >= 200 && status < 300;
      if (ok && json && typeof json === "object") {
        const raw = (json as { skills?: unknown; tools?: unknown }).skills ?? (json as { tools?: unknown }).tools;
        if (Array.isArray(raw)) {
          this.capabilities = raw.map((entry): SkillManifestEntry => {
            if (typeof entry === "string") return { name: entry, description: "", methods: [entry] };
            const s = entry as { name?: unknown; description?: unknown; methods?: unknown };
            const name = typeof s.name === "string" ? s.name : String(s.name ?? "");
            return {
              name,
              description: typeof s.description === "string" ? s.description : "",
              methods: Array.isArray(s.methods) ? (s.methods as string[]) : [name],
            };
          });
        }
      }
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
    const route = this.routes[method];
    const verb = (route?.verb ?? "POST").toUpperCase();
    const url = route ? this.resolveUrl(route.url) : this.resolveUrl(`/${method}`);
    const { status, json } = await this.fetchJson(verb, url, verb === "GET" ? undefined : (payload ?? {}), CALL_TIMEOUT_MS);
    if (status < 200 || status >= 300) {
      throw new Error(`RestAdapter: '${this.desc.id}' ${method} → HTTP ${status}`);
    }
    return json;
  }

  async *stream(method: string, payload: unknown): AsyncGenerator<StreamEvent> {
    const result = await this.call(method, payload);
    yield { seq: 0, kind: "result", data: result };
  }

  async disconnect(): Promise<void> {}
}
