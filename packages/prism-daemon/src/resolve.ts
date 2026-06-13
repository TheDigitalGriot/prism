/**
 * try-local → cloud endpoint resolution. A service may declare a local endpoint,
 * a cloud endpoint, and a capability gate (e.g. VRAM). The broker prefers local
 * when the gate passes and local is reachable; otherwise it falls back to cloud.
 *
 * This is the daemon embodiment of the pattern the 3D-gen research validated:
 * run locally when the box can (6GB GGUF), fall back to cloud (RunPod/HF) when it can't.
 *
 * Spec: .prism/shared/designs/2026-06-12-daemon-broker-design.md (§6)
 */
import { execSync } from "node:child_process";
import type { ServiceDescriptor } from "./protocol";

export interface ResolvedEndpoint {
  url: string;
  via: "local" | "cloud";
}

export interface ResolveOptions {
  /** Reachability probe for a URL (injectable for tests). */
  probe?: (url: string, timeoutMs: number) => Promise<boolean>;
  /** Capability gate evaluation (injectable for tests). */
  gate?: (desc: ServiceDescriptor) => boolean;
  timeoutMs?: number;
}

/** Best-effort available VRAM in GB. Override via PRISM_VRAM_GB for non-CUDA hosts / tests. */
export function availableVramGb(): number {
  const override = Number(process.env.PRISM_VRAM_GB);
  if (Number.isFinite(override) && override > 0) return override;
  try {
    const out = execSync("nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits", {
      timeout: 2000,
      stdio: ["ignore", "pipe", "ignore"],
    }).toString();
    const firstMb = parseInt(out.trim().split(/\r?\n/)[0] ?? "0", 10);
    return Number.isFinite(firstMb) ? firstMb / 1024 : 0;
  } catch {
    return 0;
  }
}

export function passesGate(desc: ServiceDescriptor): boolean {
  const gate = desc.gate;
  if (!gate) return true;
  switch (gate.kind) {
    case "vram":
      return availableVramGb() >= (gate.min ?? 0);
    case "binary":
      return true; // resolved at spawn time by the adapter
    case "custom":
      return true;
    default:
      return true;
  }
}

async function defaultProbe(url: string, timeoutMs: number): Promise<boolean> {
  if (url.startsWith("http")) {
    try {
      const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(timeoutMs) });
      return res.status < 500;
    } catch {
      return false;
    }
  }
  // ws:// and other transports: the per-adapter probe decides real readiness.
  return true;
}

export async function resolveEndpoint(desc: ServiceDescriptor, opts: ResolveOptions = {}): Promise<ResolvedEndpoint> {
  const timeoutMs = opts.timeoutMs ?? 1500;
  const gate = opts.gate ?? passesGate;
  const probe = opts.probe ?? defaultProbe;
  const { local, cloud } = desc.endpoint;

  if (local && gate(desc)) {
    if (await probe(local, timeoutMs)) return { url: local, via: "local" };
  }
  if (cloud) return { url: cloud, via: "cloud" };
  if (local) return { url: local, via: "local" }; // best-effort; the adapter probe will mark error
  throw new Error(`resolveEndpoint: service '${desc.id}' has no endpoint`);
}
