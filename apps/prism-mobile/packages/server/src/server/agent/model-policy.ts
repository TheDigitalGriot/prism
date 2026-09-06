/**
 * Model Control Plane — in-package mirror for the Paseo custom-provider lanes.
 *
 * The mobile server is a SEPARATE npm-workspace monorepo (NodeNext ESM,
 * `rootDir: ./src`) with no dependency on the outer Prism repo's
 * `packages/prism-core`, so it cannot import that TypeScript module across the
 * repo boundary. Per the Model Control Plane design — "reuse `resolveModelDecision`
 * / `emitModelEvent` wherever TypeScript can import it; mirror the logic minimally
 * otherwise" (the same rule the shell hook follows) — this file mirrors
 * `packages/prism-core/src/core/api/model-policy.ts` minimally.
 *
 * It reads the SAME store (`<root>/.prism/local/model-policy.json`), resolves a
 * decision with the SAME downgrade chain, and appends the SAME
 * `{ type: "model-decision", ... }` event to the SAME `$STATE_DIR/events` file, so
 * a decision made on a mobile provider lane surfaces in the CLI statusline and the
 * VS Code receipts view alongside every other surface. Keep this in sync with the
 * canonical core module if that policy shape ever changes.
 */

import fs from "node:fs";
import path from "node:path";

export type ApprovalMode = "ask" | "allow" | "deny" | "skip";

interface ModelPolicyEntry {
  mode: ApprovalMode;
  /** ARKESTRA provider axis. Absent => inferred from the key. */
  provider?: string;
}

interface Policy {
  headlessDefault: ApprovalMode;
  models: Record<string, ModelPolicyEntry>;
  surfaces: Record<string, Record<string, ModelPolicyEntry>>;
}

export interface ModelDecision {
  model: string;
  requested: string;
  mode: ApprovalMode;
  downgradedFrom?: string;
  reason: string;
  /** Provider the decision resolved within — never crossed implicitly. */
  provider?: string;
  /** FAIL-CLOSED: nothing may run. Callers MUST check this. */
  blocked?: boolean;
}

export interface ModelEvent {
  type: "model-decision";
  requested: string;
  resolved: string;
  mode: ApprovalMode;
  surface?: string;
  downgradedFrom?: string;
  ts: string;
}

interface ModelDecisionInput {
  requested: string;
  surface?: string;
  projectRoot: string;
  env?: Record<string, string | undefined>;
}

// Mirrors packages/prism-core/src/core/api/model-policy.ts. The bare policy key
// `opus` was renamed `opus48` so a policy key can never silently mean "whichever
// Opus is current" — SDK aliases are a separate namespace.
const DOWNGRADE_CHAIN = ["fable5", "opus5", "opus48"] as const;
const FLOOR_MODEL = "opus48";

// ARKESTRA provider axis — mirrors packages/prism-core/src/core/api/model-policy.ts.
// A chain walks WITHIN one provider and terminates at that provider's floor, or it
// fails closed. It must NEVER borrow another provider's chain: the old
// `DOWNGRADE_CHAIN.indexOf(requested) === -1 -> start = 0` sent `gpt:gpt-6-astra`
// and `local:griotmodel` to `opus5` — billing the wrong account, and pushing a
// LOCAL request into the cloud. These lanes emit `${provider}:${model}` keys via
// policyKeyForModel below, so that defect was reachable here first.
const PROVIDER_CHAINS: Readonly<Record<string, readonly string[]>> = {
  anthropic: DOWNGRADE_CHAIN,
};
const PROVIDER_FLOORS: Readonly<Record<string, string>> = {
  anthropic: FLOOR_MODEL,
};
const DEFAULT_PROVIDER = "anthropic";

export function providerOf(key: string, policy?: Policy): string {
  const explicit = policy?.models?.[key]?.provider;
  if (explicit) return explicit;
  const i = key.indexOf(":");
  if (i > 0) return key.slice(0, i);
  if ((DOWNGRADE_CHAIN as readonly string[]).includes(key)) return DEFAULT_PROVIDER;
  return "unknown";
}
const VALID_MODES: ReadonlySet<string> = new Set(["ask", "allow", "deny", "skip"]);

function normalizeMode(value: unknown): ApprovalMode | undefined {
  return typeof value === "string" && VALID_MODES.has(value) ? (value as ApprovalMode) : undefined;
}

function defaultPolicy(): Policy {
  return {
    headlessDefault: "allow",
    // opus5 = "allow": Opus 5 is the routine ceiling, governed by the effort dial
    // plus the xhigh|max one-shot confirm, never by a model-level gate.
    models: { opus5: { mode: "allow" }, fable5: { mode: "ask" } },
    surfaces: {},
  };
}

function coerceModels(value: unknown): Record<string, ModelPolicyEntry> {
  const out: Record<string, ModelPolicyEntry> = {};
  if (typeof value === "object" && value !== null) {
    for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
      if (typeof raw === "object" && raw !== null) {
        const mode = normalizeMode((raw as { mode?: unknown }).mode);
        // `provider` must survive the read or the Arkestra axis is inert.
        const rawP = (raw as { provider?: unknown }).provider;
        const provider = typeof rawP === "string" && rawP.trim() ? rawP.trim() : undefined;
        if (mode) out[key] = provider ? { mode, provider } : { mode };
      }
    }
  }
  return out;
}

function coerceSurfaces(value: unknown): Record<string, Record<string, ModelPolicyEntry>> {
  const out: Record<string, Record<string, ModelPolicyEntry>> = {};
  if (typeof value === "object" && value !== null) {
    for (const [surface, raw] of Object.entries(value as Record<string, unknown>)) {
      const models = coerceModels(raw);
      if (Object.keys(models).length) out[surface] = models;
    }
  }
  return out;
}

function readModelPolicy(projectRoot: string): Policy {
  const base = defaultPolicy();
  try {
    const file = path.join(projectRoot, ".prism", "local", "model-policy.json");
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
    if (typeof parsed !== "object" || parsed === null) return base;
    const p = parsed as Record<string, unknown>;
    return {
      headlessDefault: normalizeMode(p.headlessDefault) ?? base.headlessDefault,
      models: { ...base.models, ...coerceModels(p.models) },
      surfaces: coerceSurfaces(p.surfaces),
    };
  } catch {
    return base;
  }
}

function effectiveMode(policy: Policy, model: string, surface?: string): ApprovalMode {
  if (surface) {
    const override = policy.surfaces[surface]?.[model]?.mode;
    if (override) return override;
  }
  return policy.models[model]?.mode ?? "allow";
}

/** Returns null to FAIL CLOSED — never falls back to another provider's chain. */
function nextRunnable(policy: Policy, requested: string, surface?: string): string | null {
  const provider = providerOf(requested, policy);
  const chain = PROVIDER_CHAINS[provider];
  if (!chain || chain.length === 0) return null;
  const idx = chain.indexOf(requested);
  const start = idx < 0 ? 0 : idx + 1;
  for (let i = start; i < chain.length; i++) {
    const candidate = chain[i];
    if (providerOf(candidate, policy) !== provider) continue;
    const mode = effectiveMode(policy, candidate, surface);
    if (mode === "allow" || mode === "skip") return candidate;
  }
  return PROVIDER_FLOORS[provider] ?? null;
}

/**
 * Resolve a single model request against the policy, applying its approval mode.
 * Synchronous + headless (this dispatch lane has no interactive confirm): an "ask"
 * model auto-resolves per `headlessDefault` (env may override). Emit the event
 * separately with `emitModelEvent`.
 */
export function resolveModelDecision(input: ModelDecisionInput): ModelDecision {
  const { requested, surface, projectRoot } = input;
  const env = input.env ?? process.env;
  const policy = readModelPolicy(projectRoot);
  const mode = effectiveMode(policy, requested, surface);

  function downgrade(reason: string): ModelDecision {
    const model = nextRunnable(policy, requested, surface);
    if (model === null) {
      return {
        model: requested,
        requested,
        mode,
        provider: providerOf(requested, policy),
        blocked: true,
        reason: `${reason} - BLOCKED: provider has no runnable downgrade; not crossing providers`,
      };
    }
    return {
      model,
      requested,
      mode,
      provider: providerOf(requested, policy),
      downgradedFrom: requested,
      reason,
    };
  }

  switch (mode) {
    case "allow":
      return { model: requested, requested, mode, reason: "allowed" };
    case "skip":
      return { model: requested, requested, mode, reason: "skipped approvals" };
    case "deny":
      return downgrade(`denied: downgraded ${requested}`);
    default: {
      const headless = normalizeMode(env.PRISM_MODEL_HEADLESS_DEFAULT) ?? policy.headlessDefault;
      if (headless === "deny") {
        return downgrade(`ask -> headlessDefault=deny: downgraded ${requested}`);
      }
      return { model: requested, requested, mode, reason: `ask -> headlessDefault=${headless}` };
    }
  }
}

function resolveStateDir(projectRoot: string, env: Record<string, string | undefined>): string {
  if (env.GAVEL_STATE_DIR) return env.GAVEL_STATE_DIR;
  if (env.GAVEL_DIR) return path.join(env.GAVEL_DIR, "state");
  const base = path.join(projectRoot, ".prism", "local", "gavel");
  try {
    if (fs.existsSync(base)) {
      const sessions = fs
        .readdirSync(base)
        .map((d) => path.join(base, d, "state"))
        .filter((p) => fs.existsSync(p))
        .map((p) => ({ p, m: fs.statSync(p).mtimeMs }))
        .sort((x, y) => y.m - x.m);
      if (sessions.length) return sessions[0].p;
    }
  } catch {
    // fall through to the deterministic fallback
  }
  return path.join(base, "_mcp", "state");
}

/**
 * Append one JSONL model-decision line to the digital-griot `$STATE_DIR/events`
 * file. Never throws — a failed emit must not break dispatch. Returns the events
 * file path on success, or `null` on failure.
 */
export function emitModelEvent(
  projectRoot: string,
  event: Omit<ModelEvent, "type" | "ts">,
  env: Record<string, string | undefined> = process.env,
): string | null {
  try {
    const file = path.join(resolveStateDir(projectRoot, env), "events");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const line: ModelEvent = {
      type: "model-decision",
      requested: event.requested,
      resolved: event.resolved,
      mode: event.mode,
      surface: event.surface,
      downgradedFrom: event.downgradedFrom,
      ts: new Date().toISOString(),
    };
    // O_APPEND handle: the kernel positions each write at EOF atomically, so two
    // concurrent emitters cannot interleave partial lines. The bus previously had
    // NO concurrency guarantee at all, and a torn line is unparseable JSONL —
    // silently truncating the decision history the cockpit reads.
    const fd = fs.openSync(file, "a");
    try {
      fs.writeSync(fd, `${JSON.stringify(line)}\n`);
    } finally {
      fs.closeSync(fd);
    }
    return file;
  } catch {
    return null;
  }
}

/**
 * Map a provider + requested model id to a policy model id. Known premium
 * Anthropic ids fold onto the shared chain keys (fable5 / opus5); every other lane
 * (gemini, gpt, local GriotModel, kimi, ...) gets a stable `${provider}:${model}`
 * key so it becomes governable by adding an entry to the same policy file.
 */
export function policyKeyForModel(provider: string, model: string): string {
  // Fable matches by PREFIX. An exact "claude-fable-5" test silently fails to gate
  // point releases like "claude-fable-5-1", letting a premium model run ungated.
  if (model === "fable" || model === "claude-fable-5" || model.startsWith("claude-fable-5-"))
    return "fable5";
  if (model === "opus5" || model === "claude-opus-5") return "opus5";
  if (model === "opus48" || model === "claude-opus-4-8") return "opus48";
  return `${provider}:${model}`;
}
