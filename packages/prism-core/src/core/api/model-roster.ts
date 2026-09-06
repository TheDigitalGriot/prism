/**
 * Arkestra — the model roster.
 *
 * ARKESTRA is the model-governance layer ("the Governor" in speech). This file is
 * the DATA half: who exists, on which provider, at what status, with which effort
 * values. `model-policy.ts` is the DECISION half. Keeping them apart is what lets
 * `prism-model-onboard` add a model by writing data, not logic.
 *
 * WHY A SEPARATE MODULE, not `claude-sdk.ts` MODEL_IDS: that map is the Anthropic
 * SDK's alias -> API-id table and belongs to the Anthropic client. Codex ids are
 * not Anthropic aliases, and putting them there would conflate two namespaces the
 * codebase deliberately keeps apart (policy keys vs SDK aliases — see
 * model-config.md §2).
 *
 * CURRENCY: every fact here was verified 2026-09-06 against primary sources; see
 * `.prism/shared/research/2026-09-06-codex-model-roster.md` for URLs and the five
 * corrections that pass made to the planning assumptions. The model line moves
 * quarterly at best and weekly at worst — re-verify before trusting it.
 */

/** Effort values are the LOWERCASE API/config values, never the UI display labels. */
export type EffortLevel = "minimal" | "low" | "medium" | "high" | "xhigh" | "max"

export type ModelStatus = "default" | "current" | "preview" | "legacy" | "retired"

export interface RosterEntry {
  /** Exact identifier as the provider's CLI/API accepts it. */
  id: string
  provider: string
  status: ModelStatus
  /** ISO date. Present when a retirement was announced — compared, never hard-coded true/false. */
  retiredOn?: string
  effort: readonly EffortLevel[]
  contextWindow?: number
  maxOutput?: number
  /** USD per 1M tokens. `null` means genuinely not token-metered — never estimate. */
  pricing?: { input: number; output: number } | null
  notes?: string
}

/**
 * OpenAI / Codex roster — verified 2026-09-06.
 *
 * FIVE CORRECTIONS this roster encodes, each of which the planning session had wrong:
 *  1. `gpt-6-astra` is the default only since 2026-09-04 (CLI v0.153.4) — two days.
 *  2. `gpt-5.4` / `gpt-5.4-mini` are ALREADY RETIRED (2026-08-31 has passed), not
 *     "retiring". Routing must reject them.
 *  3. Effort values `light` and `extra-high` DO NOT EXIST — those are ChatGPT UI
 *     display labels. The real config values are the lowercase set below. Writing
 *     `light` into config.toml or an API payload is rejected.
 *  4. `gpt-5.2` and `gpt-5.3-codex` are also retired (2026-06-02) and were missing
 *     from the planning list entirely.
 *  5. `gpt-5.3-codex-spark` has NO per-token price — bundled into ChatGPT Pro.
 *     Its pricing is `null`, never an estimate.
 *
 * `ultra` is deliberately absent from every effort list: it is a Codex CLI/TUI
 * meta-selector, not an API value. It resolves via a documented model-aware
 * fallback (catalog override -> max -> highest supported -> medium, PR #41206).
 */
export const OPENAI_ROSTER: readonly RosterEntry[] = [
  {
    id: "gpt-6-astra",
    provider: "openai",
    status: "default",
    effort: ["low", "medium", "high", "xhigh", "max"],
    contextWindow: 1_050_000,
    maxOutput: 128_000,
    pricing: { input: 10, output: 50 },
    notes:
      "Codex CLI default since 2026-09-04 (v0.153.4). `max` on the Responses API; " +
      "`none` is rejected. Long-context surcharge above 272K input: 2x in / 1.5x out " +
      "($20/$75) — cost is NOT a single per-token constant.",
  },
  {
    id: "gpt-5.6-sol",
    provider: "openai",
    status: "current",
    effort: ["minimal", "low", "medium", "high", "xhigh"],
    contextWindow: 1_050_000,
    maxOutput: 128_000,
    pricing: { input: 5, output: 30 },
    notes: "GA 2026-07-09.",
  },
  {
    id: "gpt-5.6-terra",
    provider: "openai",
    status: "current",
    effort: ["minimal", "low", "medium", "high", "xhigh"],
    contextWindow: 1_050_000,
    maxOutput: 128_000,
    pricing: { input: 2, output: 12 },
    notes: "Designated replacement for the retired gpt-5.4.",
  },
  {
    id: "gpt-5.6-luna",
    provider: "openai",
    status: "current",
    effort: ["minimal", "low", "medium", "high", "xhigh"],
    contextWindow: 1_050_000,
    maxOutput: 128_000,
    pricing: { input: 0.2, output: 1.2 },
    notes: "Designated replacement for the retired gpt-5.4-mini. Cheapest current tier.",
  },
  {
    id: "gpt-5.3-codex-spark",
    provider: "openai",
    status: "preview",
    effort: [],
    contextWindow: 128_000,
    pricing: null,
    notes:
      "ChatGPT Pro research preview. Not effort-tiered; tuned for speed (1000+ tok/s). " +
      "NOT token-metered — bundled into Pro usage. Never estimate a price for it.",
  },
  {
    id: "gpt-5.5",
    provider: "openai",
    status: "legacy",
    effort: ["minimal", "low", "medium", "high", "xhigh"],
    notes: "Released 2026-04-23 (codename Spud).",
  },
  // ── retired: present so routing REJECTS them rather than silently attempting ──
  { id: "gpt-5.4", provider: "openai", status: "retired", retiredOn: "2026-08-31", effort: [] },
  { id: "gpt-5.4-mini", provider: "openai", status: "retired", retiredOn: "2026-08-31", effort: [] },
  { id: "gpt-5.2", provider: "openai", status: "retired", retiredOn: "2026-06-02", effort: [] },
  { id: "gpt-5.3-codex", provider: "openai", status: "retired", retiredOn: "2026-06-02", effort: [] },
]

/** Every provider's roster, keyed by provider id. */
export const ROSTERS: Readonly<Record<string, readonly RosterEntry[]>> = {
  openai: OPENAI_ROSTER,
}

/** Look a model up by exact id, across every roster. */
export function rosterEntry(id: string): RosterEntry | undefined {
  for (const list of Object.values(ROSTERS)) {
    const hit = list.find((e) => e.id === id)
    if (hit) return hit
  }
  return undefined
}

/**
 * Is this model retired as of `now`?
 *
 * A DATE COMPARISON, not a hand-maintained boolean — the generate-don't-maintain
 * rule (invariant I8). The planning session's list said gpt-5.4 was "retiring";
 * its date had already passed. A boolean would have stayed wrong; a date cannot.
 */
export function isRetired(id: string, now: Date = new Date()): boolean {
  const e = rosterEntry(id)
  if (!e) return false
  if (e.status === "retired" && !e.retiredOn) return true
  return e.retiredOn ? Date.parse(e.retiredOn) <= now.getTime() : false
}

/** Does this model accept this effort value? Unknown model => false (fail closed). */
export function supportsEffort(id: string, effort: string): boolean {
  const e = rosterEntry(id)
  return e ? (e.effort as readonly string[]).includes(effort) : false
}

/**
 * The policy key for a roster entry — the `${provider}:${model}` convention the
 * mobile lanes already emit, and which `providerOf()` parses.
 */
export function policyKeyFor(entry: RosterEntry): string {
  return `${entry.provider}:${entry.id}`
}

/**
 * A provider's downgrade chain as POLICY KEYS, most-capable first, excluding
 * anything retired.
 *
 * Mirrors how Codex itself degrades (PR #41206): stay within the provider's own
 * capability set and terminate there. It never leaves the provider — that is the
 * whole point of the Arkestra axis.
 */
export function chainFor(provider: string, now: Date = new Date()): string[] {
  const list = ROSTERS[provider]
  if (!list) return []
  const rank: Record<ModelStatus, number> = {
    default: 0,
    current: 1,
    preview: 2,
    legacy: 3,
    retired: 99,
  }
  return list
    .filter((e) => !isRetired(e.id, now) && e.status !== "preview")
    .sort((a, b) => rank[a.status] - rank[b.status])
    .map(policyKeyFor)
}
