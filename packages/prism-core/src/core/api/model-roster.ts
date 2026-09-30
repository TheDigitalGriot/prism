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
 * CURRENCY: base roster verified 2026-09-06; see `.prism/shared/research/
 * 2026-09-06-codex-model-roster.md`. Re-verified and updated 2026-09-30 for the
 * GPT-6 generation (astra/6.1-sol/luna) — see `.prism/shared/research/
 * 2026-09-30-claude-codex-model-roster.md` for URLs and corrections from THIS
 * pass. The 5.6 family and earlier entries were NOT re-verified this pass
 * ("resume, don't redo") — re-check before trusting anything not touched below.
 * The model line moves quarterly at best and weekly at worst.
 */

/**
 * Effort values are the LOWERCASE API/config values, never the UI display labels.
 * `minimal` (5.6 generation) and `none` (gpt-6-luna only, verified 2026-09-30) are
 * DIFFERENT values, not a rename across generations — both are real and coexist.
 */
export type EffortLevel = "none" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max"

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
 * OpenAI / Codex roster — base verified 2026-09-06, GPT-6 generation re-verified
 * and updated 2026-09-30 (see the file-header CURRENCY note).
 *
 * FIVE CORRECTIONS the 2026-09-06 pass encoded (still accurate, left as history):
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
 * THREE MORE CORRECTIONS from the 2026-09-30 pass (see
 * .prism/shared/research/2026-09-30-claude-codex-model-roster.md):
 *  6. `gpt-6-astra` is NO LONGER the default — `gpt-6.1-sol` became the Codex CLI
 *     default with v0.159.0/0.159.1 ("near-Astra performance... at a lower cost").
 *     Astra demoted to `current` (still the flagship, still reachable, just not
 *     what a fresh install resolves to).
 *  7. `gpt-6-luna` is a REAL, SEPARATE current-tier model (fast/cheap), not the
 *     same thing as the older `gpt-5.6-luna` — both now coexist. It is the only
 *     current-tier Codex model that accepts effort `none` (verified against its
 *     own API docs page, not the general catalog page, which used ChatGPT UI
 *     wording — "Light through Ultra" — for the same field).
 *  8. `gpt-5.3-codex-spark` is now RETIRED (2026-09-14), not merely "preview" as
 *     the 2026-09-06 entry had it — confirmed by direct primary-source check.
 *
 * `ultra` is deliberately absent from every effort list: it is a Codex CLI/TUI
 * meta-selector, not an API value. It resolves via a documented model-aware
 * fallback (catalog override -> max -> highest supported -> medium, PR #41206).
 */
export const OPENAI_ROSTER: readonly RosterEntry[] = [
  {
    id: "gpt-6.1-sol",
    provider: "openai",
    status: "default",
    effort: ["low", "medium", "high", "xhigh", "max"],
    contextWindow: 1_050_000,
    maxOutput: 128_000,
    pricing: { input: 2, output: 10 },
    notes:
      "Codex CLI default since v0.159.0/0.159.1 (floor: 0.158.0 returns a 400 for " +
      "this id). \"Near-Astra performance for complex work at a lower cost than " +
      "Astra\" — the routine default; gpt-6-astra is the deliberate escalation. " +
      "Cached input $0.10/MTok, cache write $2.50/MTok. Long-context surcharge " +
      "above 272K input: 2x in/cache, 1.5x out, same rule as Astra and Luna.",
  },
  {
    id: "gpt-6-astra",
    provider: "openai",
    status: "current",
    effort: ["low", "medium", "high", "xhigh", "max"],
    contextWindow: 1_050_000,
    maxOutput: 128_000,
    pricing: { input: 10, output: 50 },
    notes:
      "Flagship — \"most capable model for the most demanding work\", not the CLI " +
      "default as of 2026-09-30 (gpt-6.1-sol is; see roster header correction #6). " +
      "Cached input $1/MTok, cache write $12.50/MTok. `max` on the Responses API; " +
      "`none` is rejected. Long-context surcharge above 272K input: 2x in / 1.5x out " +
      "($20/$75) — cost is NOT a single per-token constant.",
  },
  {
    id: "gpt-6-luna",
    provider: "openai",
    status: "current",
    effort: ["none", "low", "medium", "high", "xhigh", "max"],
    contextWindow: 1_050_000,
    maxOutput: 128_000,
    pricing: { input: 0.1, output: 0.5 },
    notes:
      "Fast/cheap current tier, verified 2026-09-30. The ONLY current-tier Codex " +
      "model that accepts effort `none` — a genuine skip-reasoning fast path, not " +
      "present on Astra or Sol. Cached input $0.01/MTok, cache write $0.125/MTok. " +
      "Same >272K long-context surcharge rule as Astra/Sol. Not the same model as " +
      "the older gpt-5.6-luna below — both currently coexist.",
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
    status: "retired",
    retiredOn: "2026-09-14",
    effort: [],
    contextWindow: 128_000,
    pricing: null,
    notes:
      "Retired 2026-09-14 (confirmed 2026-09-30, correction #8 above) — no longer in " +
      "ChatGPT desktop, Codex CLI, or the IDE extension. Was a ChatGPT Pro research " +
      "preview, not effort-tiered, tuned for speed (1000+ tok/s), NOT token-metered " +
      "(bundled into Pro usage — never estimate a price for it).",
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
