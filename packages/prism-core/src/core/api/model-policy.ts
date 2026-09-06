/**
 * Model Control Plane — policy store + enforcement seam + bus events.
 *
 * Generalizes the single boolean `fable.flag` into a per-model APPROVAL MODE,
 * like an agentic permission tool. Each policy-listed model carries one of four
 * modes:
 *
 *   - ask   — interactive surfaces prompt a one-shot confirm; a headless run
 *             (no `confirm` fn) auto-resolves per `headlessDefault` and ALWAYS
 *             logs a bus event.
 *   - allow — the model runs; a bus event is emitted (monitored, not blocked).
 *   - deny  — the model does NOT run; it is downgraded to the next freely
 *             runnable model in the chain (fable5 -> opus5 -> opus48) and a
 *             bus event names the downgrade.
 *   - skip  — bypass all approvals (like --dangerously-skip-permissions): runs,
 *             still emits a bus event.
 *
 * The store lives at `<projectRoot>/.prism/local/model-policy.json` (gitignored,
 * like `fable.flag`). When absent, this module derives a back-compat policy from
 * a legacy `fable.flag` so nothing regresses. A committed
 * `model-policy.example.json` documents the shape.
 *
 * Reader robustness mirrors `fable-flag.ts`: any missing / malformed input
 * degrades to safe defaults (opus5 = "allow", fable5 = "ask") rather than throwing.
 *
 * Headless auto-resolution is the injection seam for `scripts/resolve-answer.mjs`
 * (the release-cycle answer-injection helper): a surface may supply a `confirm`
 * fn that consults it, while `resolveModelDecision` itself falls back to
 * `headlessDefault` (optionally overridden by `PRISM_MODEL_HEADLESS_DEFAULT`).
 *
 * Types are exported for reuse by the later surfaces (statusline / tray / vscode
 * / mobile).
 */
import * as fs from "fs"
import * as path from "path"
import { chainFor } from "./model-roster"

/**
 * OpenAI/Codex chain + floor, derived from the roster at module load.
 *
 * Derived, not hand-listed: `chainFor` excludes anything whose `retiredOn` date
 * has passed, so a retired id can never sit in a live chain. gpt-5.4 and
 * gpt-5.4-mini retired 2026-08-31 and drop out automatically — the planning
 * session still listed them as "retiring".
 */
const OPENAI_CHAIN: readonly string[] = chainFor("openai")
const OPENAI_FLOOR: string = OPENAI_CHAIN[OPENAI_CHAIN.length - 1] ?? "openai:gpt-5.6-luna"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Per-model approval mode — the agentic-permission verb applied to a request. */
export type ApprovalMode = "ask" | "allow" | "deny" | "skip"

/**
 * A single model's policy entry.
 *
 * `provider` is the ARKESTRA axis. It is optional for back-compat: the three
 * legacy Anthropic keys (fable5 / opus5 / opus48) carry no provider field and
 * resolve to "anthropic" implicitly. Everything else should declare one, or use
 * the `${provider}:${model}` key convention the mobile lanes already emit.
 */
export interface ModelPolicyEntry {
  mode: ApprovalMode
  /** e.g. "anthropic" | "openai" | "local". Inferred from the key when absent. */
  provider?: string
}

/** The resolved policy store. */
export interface Policy {
  version: number
  /** Mode applied when an "ask" model is hit in a headless run (no confirm). */
  headlessDefault: ApprovalMode
  /** Per-model policy. Keys are policy model ids ("fable5", "opus5", "opus48"). */
  models: Record<string, ModelPolicyEntry>
  /** Optional per-surface override: surface -> { model -> { mode } }. */
  surfaces: Record<string, Record<string, ModelPolicyEntry>>
}

/** Input to a single decision. `confirm` undefined => headless auto-resolve. */
export interface ModelDecisionInput {
  /** Requested policy model id (e.g. "fable5", "opus5"). */
  requested: string
  /** Surface asking (e.g. "vscode", "tray"); selects a per-surface override. */
  surface?: string
  /** Project root used to read the policy store. */
  projectRoot: string
  /** Environment (defaults to process.env). */
  env?: Record<string, string | undefined>
  /**
   * Injectable one-shot confirm. Resolves `true` to run, `false` to deny.
   * `undefined` => headless: auto-resolve per `headlessDefault`.
   */
  confirm?: (ctx: {
    requested: string
    surface?: string
    mode: ApprovalMode
  }) => boolean | Promise<boolean>
  /**
   * The request carries its OWN credential (BYOK, an inbound key, an external
   * provider key, or a local endpoint). Such a request is never failed over —
   * lifted from Weave Router's `shouldFailover` (`fallback.go:427-438`), which
   * returns false for exactly these cases.
   *
   * Why it matters here: downgrading a credential-bound request either bills the
   * wrong account (a Codex request landing on the Max subscription) or breaks
   * local-first (a local GriotModel request escaping to a cloud model). When set,
   * a denied model BLOCKS rather than downgrading.
   */
  credentialBound?: boolean
}

/** The outcome of applying a model's mode. */
export interface ModelDecision {
  /** Policy model id the request should actually run as (after any downgrade). */
  model: string
  /** The policy model id that was requested. */
  requested: string
  /** The mode that governed this decision. */
  mode: ApprovalMode
  /** Set when the request was downgraded away from `requested`. */
  downgradedFrom?: string
  /** Human-readable rationale for the decision (for events / logs). */
  reason: string
  /** The provider the decision resolved within. Never crossed implicitly. */
  provider?: string
  /**
   * FAIL-CLOSED signal. `true` means nothing may run: the model was denied and
   * its provider offers no runnable downgrade. Callers MUST check this — the
   * alternative (silently switching provider) is the defect this axis exists to
   * prevent. `model` still carries the requested id, for logging only.
   */
  blocked?: boolean
}

/** A model-decision bus event (one JSONL line under `$STATE_DIR/events`). */
export interface ModelEvent {
  type: "model-decision"
  requested: string
  resolved: string
  mode: ApprovalMode
  surface?: string
  downgradedFrom?: string
  /** Provider the decision resolved within — never crossed implicitly. */
  provider?: string
  /** True when the request failed closed and nothing may run. */
  blocked?: boolean
  ts: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Downgrade chain, most-capable first. A denied (or unconfirmed) model walks
 * FORWARD to the first entry that runs freely ("allow"/"skip"), terminating at
 * the always-allowed floor `opus48` (Opus 4.8), which is never policy-listed.
 *
 * NAMESPACE NOTE: these are POLICY keys, not SDK aliases. The bare key `opus`
 * was renamed to `opus48` so a policy key can never silently mean "whichever
 * Opus is current" — the SDK alias `opus` (claude-sdk.ts MODEL_IDS) resolves to
 * Opus 5 and is a separate namespace. See cl-plugin-structure/references/
 * model-config.md §2.
 */
export const DOWNGRADE_CHAIN = ["fable5", "opus5", "opus48"] as const

/** The always-runnable floor the chain terminates at. */
export const FLOOR_MODEL = "opus48"

// ---------------------------------------------------------------------------
// The provider axis (Arkestra)
// ---------------------------------------------------------------------------

/**
 * ARKESTRA — the model-governance layer. (Everyday name: "the Governor". The
 * former name "Model Control Plane" was retired 2026-09-06; it collided with MCP,
 * which means Model Context Protocol.)
 *
 * THE DEFECT THIS FIXES, reproduced by executing the old logic:
 *
 *   requested=gpt:gpt-6-astra   -> downgraded to: opus5
 *   requested=local:griotmodel  -> downgraded to: opus5
 *
 * `nextRunnable` did `DOWNGRADE_CHAIN.indexOf(requested)`, which returns -1 for
 * any provider-prefixed key, so `start` became 0 and the walk began at the TOP of
 * the ANTHROPIC chain. Consequences: a Codex request silently became an Anthropic
 * request billed to the Max subscription, and — far worse — a denied LOCAL model
 * escaped to a CLOUD model, breaking the local-first guarantee and sending data
 * off-device. It never even reached the floor; it stopped at the first freely
 * runnable entry.
 *
 * THE RULE, taken from Weave Router (`fallback.go:427-438`, where `shouldFailover`
 * returns false for BYOK / inbound / external-key requests): a request never
 * crosses providers implicitly. A chain walks WITHIN one provider and terminates
 * at that provider's own floor, or it fails closed. Weave Router's `rosterIDFor`
 * likewise returns "" for an unmapped model rather than guessing a provider —
 * that is the discipline the old `indexOf(...) === -1 -> start = 0` broke.
 */

/**
 * Per-provider downgrade chains, most-capable first.
 *
 * `anthropic` is the existing `DOWNGRADE_CHAIN`, unchanged and still exported
 * under its own name — Anthropic behaviour is byte-identical to before this axis
 * existed, and the cross-copy conformance gate still matches it.
 *
 * A provider with no chain here is NOT an error; it means "no downgrade path is
 * declared", and a denied model of that provider fails closed rather than
 * borrowing someone else's chain.
 */
export const PROVIDER_CHAINS: Readonly<Record<string, readonly string[]>> = {
  anthropic: DOWNGRADE_CHAIN,
  // OpenAI/Codex, derived from the roster so a retired id can never appear in a
  // chain: `chainFor` filters by a DATE comparison, not a stale boolean.
  // gpt-6-astra -> 5.6 sol -> terra -> luna. Terminates at luna; never crosses.
  openai: OPENAI_CHAIN,
}

/** Per-provider floor. A chain terminates HERE or nowhere — never in another provider. */
export const PROVIDER_FLOORS: Readonly<Record<string, string>> = {
  anthropic: FLOOR_MODEL,
  // The cheapest current tier; the last entry the openai chain can reach.
  openai: OPENAI_FLOOR,
}

/** The provider assumed for the three legacy keys that predate this axis. */
export const DEFAULT_PROVIDER = "anthropic"

/**
 * Resolve a policy key's provider. Precedence:
 *   1. an explicit `provider` on the policy entry
 *   2. the `${provider}:${model}` key convention (as `policyKeyForModel` emits)
 *   3. "anthropic" for the three legacy chain keys
 *   4. "unknown" — which has no chain, so it fails closed
 */
export function providerOf(key: string, policy?: Policy): string {
  const explicit = policy?.models?.[key]?.provider
  if (explicit) return explicit
  const i = key.indexOf(":")
  if (i > 0) return key.slice(0, i)
  if ((DOWNGRADE_CHAIN as readonly string[]).includes(key)) return DEFAULT_PROVIDER
  return "unknown"
}

/**
 * Safe defaults when no store and no legacy flag exist.
 *
 * `opus5` defaults to "allow", NOT "ask": Opus 5 is the routine ceiling and is
 * governed by the effort dial plus the xhigh|max one-shot confirm, never by a
 * model-level gate (locked in icm-fuse-CONTEXT.md, icm-fuse-opus5-PLAN.md, and
 * OPUS5-INCORPORATION-PLAN.md). A bus event is still emitted on every decision,
 * so un-gating does not reduce visibility. Only `fable5` carries the HITL gate.
 */
const DEFAULT_MODE: ApprovalMode = "ask"
const DEFAULT_OPUS5_MODE: ApprovalMode = "allow"
const DEFAULT_HEADLESS: ApprovalMode = "allow"

const VALID_MODES: ReadonlySet<string> = new Set(["ask", "allow", "deny", "skip"])

// ---------------------------------------------------------------------------
// Reader
// ---------------------------------------------------------------------------

function normalizeMode(value: unknown): ApprovalMode | undefined {
  return typeof value === "string" && VALID_MODES.has(value)
    ? (value as ApprovalMode)
    : undefined
}

/** Safe-default policy: opus5 = "allow", fable5 = "ask", allow headless, no overrides. */
function defaultPolicy(): Policy {
  return {
    version: 1,
    headlessDefault: DEFAULT_HEADLESS,
    models: {
      opus5: { mode: DEFAULT_OPUS5_MODE },
      fable5: { mode: DEFAULT_MODE },
    },
    surfaces: {},
  }
}

/**
 * Back-compat: derive a policy from a legacy `.prism/local/fable.flag` when the
 * new store is absent. `enabled:true` -> fable5 "ask" (gated), else "deny"
 * (silently downgraded), so the old fable behavior is preserved exactly.
 * Returns `null` when no readable flag exists.
 */
function policyFromLegacyFlag(projectRoot: string): Policy | null {
  try {
    const flagPath = path.join(projectRoot, ".prism", "local", "fable.flag")
    const raw = fs.readFileSync(flagPath, "utf8")
    const parsed = JSON.parse(raw) as unknown
    const enabled =
      typeof parsed === "object" &&
      parsed !== null &&
      (parsed as { enabled?: unknown }).enabled === true
    const base = defaultPolicy()
    base.models.fable5 = { mode: enabled ? "ask" : "deny" }
    return base
  } catch {
    return null
  }
}

function coerceEntry(value: unknown): ModelPolicyEntry | undefined {
  if (typeof value !== "object" || value === null) return undefined
  const mode = normalizeMode((value as { mode?: unknown }).mode)
  if (!mode) return undefined
  // `provider` must survive the read or the Arkestra axis is inert: an explicit
  // provider would be silently dropped and the key-prefix fallback used instead.
  // Caught by "an explicit provider on the entry overrides the key prefix".
  const rawProvider = (value as { provider?: unknown }).provider
  const provider =
    typeof rawProvider === "string" && rawProvider.trim() ? rawProvider.trim() : undefined
  return provider ? { mode, provider } : { mode }
}

function coerceModels(value: unknown): Record<string, ModelPolicyEntry> {
  const out: Record<string, ModelPolicyEntry> = {}
  if (typeof value === "object" && value !== null) {
    for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
      const entry = coerceEntry(raw)
      if (entry) out[key] = entry
    }
  }
  return out
}

function coerceSurfaces(
  value: unknown,
): Record<string, Record<string, ModelPolicyEntry>> {
  const out: Record<string, Record<string, ModelPolicyEntry>> = {}
  if (typeof value === "object" && value !== null) {
    for (const [surface, raw] of Object.entries(
      value as Record<string, unknown>,
    )) {
      const models = coerceModels(raw)
      if (Object.keys(models).length) out[surface] = models
    }
  }
  return out
}

/**
 * Read the model policy for the given project.
 *
 * Precedence:
 *   1. `<projectRoot>/.prism/local/model-policy.json`  (validated, defaults filled)
 *   2. legacy `<projectRoot>/.prism/local/fable.flag`  (derived, back-compat)
 *   3. safe defaults                          (opus5 = "allow", fable5 = "ask")
 *
 * Never throws: any missing / malformed input degrades to the next fallback.
 */
export function readModelPolicy(projectRoot: string): Policy {
  try {
    const policyPath = path.join(
      projectRoot,
      ".prism",
      "local",
      "model-policy.json",
    )
    const raw = fs.readFileSync(policyPath, "utf8")
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("model-policy.json is not an object")
    }
    const p = parsed as Record<string, unknown>
    const base = defaultPolicy()
    const models = coerceModels(p.models)
    return {
      version: typeof p.version === "number" ? p.version : base.version,
      headlessDefault: normalizeMode(p.headlessDefault) ?? base.headlessDefault,
      // Fill any missing default models so opus5 / fable5 always resolve.
      models: { ...base.models, ...models },
      surfaces: coerceSurfaces(p.surfaces),
    }
  } catch {
    // Store absent or malformed — try the legacy flag, then safe defaults.
    return policyFromLegacyFlag(projectRoot) ?? defaultPolicy()
  }
}

// ---------------------------------------------------------------------------
// Decision
// ---------------------------------------------------------------------------

/** Effective mode for a model under a surface (surface override wins). */
function effectiveMode(
  policy: Policy,
  model: string,
  surface?: string,
): ApprovalMode {
  if (surface) {
    const surfMode = policy.surfaces[surface]?.[model]?.mode
    if (surfMode) return surfMode
  }
  // Non-policy-listed models (e.g. the "opus48" floor) run freely.
  return policy.models[model]?.mode ?? "allow"
}

/**
 * Walk the requested model's OWN provider chain to the first model that runs
 * freely ("allow"/"skip"), terminating at that provider's floor.
 *
 * Returns `null` when the provider has no declared chain, or when its chain is
 * exhausted with nothing runnable. `null` means FAIL CLOSED — the caller must
 * not run anything. It must never mean "fall back to Anthropic": that is exactly
 * the defect documented above the PROVIDER_CHAINS table.
 */
function nextRunnable(
  policy: Policy,
  requested: string,
  surface?: string,
): string | null {
  const provider = providerOf(requested, policy)
  const chain = PROVIDER_CHAINS[provider]
  // No chain for this provider -> no downgrade path. Fail closed; do NOT borrow
  // another provider's chain.
  if (!chain || chain.length === 0) return null

  const idx = chain.indexOf(requested)
  const start = idx < 0 ? 0 : idx + 1
  for (let i = start; i < chain.length; i++) {
    const candidate = chain[i]
    // A chain must never leave its provider. Defensive: a mis-declared entry
    // that points elsewhere is skipped rather than silently crossing.
    if (providerOf(candidate, policy) !== provider) continue
    const mode = effectiveMode(policy, candidate, surface)
    if (mode === "allow" || mode === "skip") return candidate
  }
  const floor = PROVIDER_FLOORS[provider]
  return floor ?? null
}

/**
 * Resolve a single model request against the policy, applying its approval
 * mode. Pure (no I/O beyond reading the policy store; no event emission — call
 * `emitModelEvent` separately). `confirm` undefined => headless auto-resolve.
 */
export async function resolveModelDecision(
  input: ModelDecisionInput,
): Promise<ModelDecision> {
  const { requested, surface, projectRoot, confirm, credentialBound } = input
  const env = input.env ?? (typeof process !== "undefined" ? process.env : {})
  const policy = readModelPolicy(projectRoot)
  const mode = effectiveMode(policy, requested, surface)
  const provider = providerOf(requested, policy)

  const downgrade = (reason: string): ModelDecision => {
    // A credential-bound request is never failed over — downgrading it would
    // bill the wrong account or push a local request into the cloud.
    if (credentialBound) {
      return {
        model: requested,
        requested,
        mode,
        provider,
        blocked: true,
        reason: `${reason} — BLOCKED: credential-bound request is never failed over`,
      }
    }
    const model = nextRunnable(policy, requested, surface)
    if (model === null) {
      return {
        model: requested,
        requested,
        mode,
        provider,
        blocked: true,
        reason: `${reason} — BLOCKED: provider "${provider}" has no runnable downgrade; not crossing providers`,
      }
    }
    return { model, requested, mode, provider, downgradedFrom: requested, reason }
  }

  switch (mode) {
    case "allow":
      return { model: requested, requested, mode, provider, reason: "allowed" }
    case "skip":
      return { model: requested, requested, mode, provider, reason: "skipped approvals" }
    case "deny":
      return downgrade(`denied: downgraded ${requested} -> next runnable`)
    case "ask": {
      if (confirm) {
        const ok = await confirm({ requested, surface, mode })
        return ok
          ? { model: requested, requested, mode, provider, reason: "confirmed" }
          : downgrade(`denied via confirm: downgraded ${requested}`)
      }
      // Headless: auto-resolve per headlessDefault (env may override).
      const headless =
        normalizeMode(env.PRISM_MODEL_HEADLESS_DEFAULT) ?? policy.headlessDefault
      if (headless === "deny") {
        return downgrade(`ask -> headlessDefault=deny: downgraded ${requested}`)
      }
      return {
        model: requested,
        requested,
        mode,
        provider,
        reason: `ask -> headlessDefault=${headless}`,
      }
    }
    default:
      return { model: requested, requested, mode, provider, reason: "allowed" }
  }
}

// ---------------------------------------------------------------------------
// Bus events
// ---------------------------------------------------------------------------

/**
 * Resolve the digital-griot state dir, mirroring `digital-griot-mcp.ts`
 * `resolveStateDir` precedence so a model event lands in the same events file
 * the cockpit reads. Precedence: GAVEL_STATE_DIR -> GAVEL_DIR/state -> newest
 * gavel session under the project's .prism/local/gavel sessions -> _mcp fallback.
 */
export function resolveStateDir(
  projectRoot: string,
  env: Record<string, string | undefined> = typeof process !== "undefined"
    ? process.env
    : {},
): string {
  if (env.GAVEL_STATE_DIR) return env.GAVEL_STATE_DIR
  if (env.GAVEL_DIR) return path.join(env.GAVEL_DIR, "state")
  const base = path.join(projectRoot, ".prism", "local", "gavel")
  try {
    if (fs.existsSync(base)) {
      const sessions = fs
        .readdirSync(base)
        .map((d) => path.join(base, d, "state"))
        .filter((p) => fs.existsSync(p))
        .map((p) => ({ p, m: fs.statSync(p).mtimeMs }))
        .sort((x, y) => y.m - x.m)
      if (sessions.length) return sessions[0].p
    }
  } catch {
    // fall through to the deterministic fallback
  }
  return path.join(base, "_mcp", "state")
}

/** Absolute path to the events file for a project. */
export function resolveEventsFile(
  projectRoot: string,
  env?: Record<string, string | undefined>,
): string {
  return path.join(resolveStateDir(projectRoot, env), "events")
}

/**
 * Append one JSONL line to the digital-griot `$STATE_DIR/events` file. Never
 * throws — a failed emit must not break model resolution. Returns the events
 * file path on success, or `null` on failure.
 */
export function emitModelEvent(
  projectRoot: string,
  event: Omit<ModelEvent, "type" | "ts"> & { type?: "model-decision"; ts?: string },
  env?: Record<string, string | undefined>,
): string | null {
  try {
    const file = resolveEventsFile(projectRoot, env)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    const line: ModelEvent = {
      type: "model-decision",
      requested: event.requested,
      resolved: event.resolved,
      mode: event.mode,
      surface: event.surface,
      downgradedFrom: event.downgradedFrom,
      provider: event.provider,
      blocked: event.blocked,
      ts: event.ts ?? new Date().toISOString(),
    }
    fs.appendFileSync(file, JSON.stringify(line) + "\n", "utf8")
    return file
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Writer
// ---------------------------------------------------------------------------

/**
 * Persist a policy to `<projectRoot>/.prism/local/model-policy.json` (pretty
 * JSON, trailing newline), creating `.prism/local` if needed. The single write
 * path reused by any surface that lets a user change a model's approval mode
 * (VS Code chip, tray, mobile) so the store's location stays defined in one
 * place. Unlike `emitModelEvent`, this THROWS on failure — a lost policy write
 * must be surfaced to the user, not swallowed. Returns the written file path.
 */
export function writeModelPolicy(projectRoot: string, policy: Policy): string {
  const file = path.join(projectRoot, ".prism", "local", "model-policy.json")
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(policy, null, 2) + "\n", "utf8")
  return file
}

/**
 * Convenience: set a single model's approval mode and persist. Reads the current
 * policy (or its safe default / legacy-derived fallback), updates
 * `models[model].mode`, writes it back, and returns the persisted policy.
 */
export function setModelMode(
  projectRoot: string,
  model: string,
  mode: ApprovalMode,
): Policy {
  const policy = readModelPolicy(projectRoot)
  policy.models = { ...policy.models, [model]: { mode } }
  writeModelPolicy(projectRoot, policy)
  return policy
}
