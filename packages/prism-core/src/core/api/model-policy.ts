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
 *             runnable model in the chain (fable5 -> opus5 -> opus/4.8) and a
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
 * degrades to safe defaults (opus5 + fable5 = "ask") rather than throwing.
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Per-model approval mode — the agentic-permission verb applied to a request. */
export type ApprovalMode = "ask" | "allow" | "deny" | "skip"

/** A single model's policy entry. */
export interface ModelPolicyEntry {
  mode: ApprovalMode
}

/** The resolved policy store. */
export interface Policy {
  version: number
  /** Mode applied when an "ask" model is hit in a headless run (no confirm). */
  headlessDefault: ApprovalMode
  /** Per-model policy. Keys are policy model ids ("opus5", "fable5", ...). */
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
}

/** A model-decision bus event (one JSONL line under `$STATE_DIR/events`). */
export interface ModelEvent {
  type: "model-decision"
  requested: string
  resolved: string
  mode: ApprovalMode
  surface?: string
  downgradedFrom?: string
  ts: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Downgrade chain, most-capable first. A denied (or unconfirmed) model walks
 * FORWARD to the first entry that runs freely ("allow"/"skip"), terminating at
 * the always-allowed floor `opus` (Opus 4.8), which is never policy-listed.
 */
export const DOWNGRADE_CHAIN = ["fable5", "opus5", "opus"] as const

/** The always-runnable floor the chain terminates at. */
export const FLOOR_MODEL = "opus"

/** Safe defaults when no store and no legacy flag exist. */
const DEFAULT_MODE: ApprovalMode = "ask"
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

/** Safe-default policy: opus5 + fable5 = "ask", allow headless, no overrides. */
function defaultPolicy(): Policy {
  return {
    version: 1,
    headlessDefault: DEFAULT_HEADLESS,
    models: {
      opus5: { mode: DEFAULT_MODE },
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
  return mode ? { mode } : undefined
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
 *   3. safe defaults                                    (opus5 + fable5 = "ask")
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
  // Non-policy-listed models (e.g. the "opus" floor) run freely.
  return policy.models[model]?.mode ?? "allow"
}

/**
 * Walk the downgrade chain forward from `requested` to the first model that
 * runs freely ("allow"/"skip"), terminating at the always-allowed floor.
 */
function nextRunnable(
  policy: Policy,
  requested: string,
  surface?: string,
): string {
  const idx = DOWNGRADE_CHAIN.indexOf(requested as (typeof DOWNGRADE_CHAIN)[number])
  const start = idx < 0 ? 0 : idx + 1
  for (let i = start; i < DOWNGRADE_CHAIN.length; i++) {
    const candidate = DOWNGRADE_CHAIN[i]
    const mode = effectiveMode(policy, candidate, surface)
    if (mode === "allow" || mode === "skip") return candidate
  }
  return FLOOR_MODEL
}

/**
 * Resolve a single model request against the policy, applying its approval
 * mode. Pure (no I/O beyond reading the policy store; no event emission — call
 * `emitModelEvent` separately). `confirm` undefined => headless auto-resolve.
 */
export async function resolveModelDecision(
  input: ModelDecisionInput,
): Promise<ModelDecision> {
  const { requested, surface, projectRoot, confirm } = input
  const env = input.env ?? (typeof process !== "undefined" ? process.env : {})
  const policy = readModelPolicy(projectRoot)
  const mode = effectiveMode(policy, requested, surface)

  const downgrade = (reason: string): ModelDecision => {
    const model = nextRunnable(policy, requested, surface)
    return { model, requested, mode, downgradedFrom: requested, reason }
  }

  switch (mode) {
    case "allow":
      return { model: requested, requested, mode, reason: "allowed" }
    case "skip":
      return { model: requested, requested, mode, reason: "skipped approvals" }
    case "deny":
      return downgrade(`denied: downgraded ${requested} -> next runnable`)
    case "ask": {
      if (confirm) {
        const ok = await confirm({ requested, surface, mode })
        return ok
          ? { model: requested, requested, mode, reason: "confirmed" }
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
        reason: `ask -> headlessDefault=${headless}`,
      }
    }
    default:
      return { model: requested, requested, mode, reason: "allowed" }
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
      ts: event.ts ?? new Date().toISOString(),
    }
    fs.appendFileSync(file, JSON.stringify(line) + "\n", "utf8")
    return file
  } catch {
    return null
  }
}
