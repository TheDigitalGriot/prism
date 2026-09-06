---
date: 2026-09-06
researcher: Claude (Claude Code, Opus 5) — web-search-researcher agent, device-side
topic: "Codex model roster + effort tiers — verified today, for the Arkestra provider axis"
tags: [arkestra, codex, model-roster, effort, provider-axis, research]
status: complete
---

# OpenAI Codex CLI Model Roster — Verified 2026-09-06

> Checked today against primary/near-primary sources. All identifiers are the exact
> lowercase API/CLI strings unless noted. This exists because the planning session's
> roster was a **hypothesis**; five parts of it turned out to be wrong, and each wrong
> part would have been hard-coded into **Arkestra**'s routing.

## Model table

| Identifier | Status (2026-09-06) | Effort values | Context / max output | Pricing (in/out per 1M) | Access |
|---|---|---|---|---|---|
| `gpt-6-astra` | **Default** — bundled default only since 2026-09-04 (CLI v0.153.4); reachable but not default from v0.153.1 (2026-09-03) | `low`, `medium`, `high`, `xhigh` (Chat Completions); `max` also on Responses API. `none` rejected. | 1,050,000 total (922K input / 128K output) | $10 / $50; long-context surcharge 2x in / 1.5x out above 272K input ($20/$75); cache read $1.00, cache write $12.50 | ChatGPT Pro/Business/Enterprise (Enterprise needs admin opt-in) + metered API |
| `gpt-5.6-sol` | Current (GA 2026-07-09) | `minimal`,`low`,`medium`,`high`,`xhigh` | 1.05M / 128K | $5 / $30 | ChatGPT + API + Codex + Copilot |
| `gpt-5.6-terra` | Current — replacement for `gpt-5.4` | same | 1.05M / 128K | $2 / $12 | ChatGPT + API + Codex |
| `gpt-5.6-luna` | Current — replacement for `gpt-5.4-mini` | same | 1.05M / 128K | $0.20 / $1.20 | ChatGPT + API + Codex |
| `gpt-5.3-codex-spark` | **Preview** (research preview, ~2026-02-13) | not effort-tiered; tuned for speed (1000+ tok/s), minimal/targeted edits | 128K | **No standalone token price** — bundled into ChatGPT Pro usage; API to design partners only | ChatGPT Pro only |
| `gpt-5.5` | Legacy (2026-04-23, codename "Spud") | `minimal`..`xhigh` | pre-1M generation | not published | Plus/Pro/Business/Enterprise + API |
| `gpt-5.4` | **RETIRED 2026-08-31** | — | — | — | reject in routing |
| `gpt-5.4-mini` | **RETIRED 2026-08-31** | — | — | — | reject in routing |
| `gpt-5.2` | Retired (2026-06-02 announcement, forced migration to `gpt-5.5`) | — | — | — | reject in routing |
| `gpt-5.3-codex` | Retired (same announcement) | — | — | — | reject in routing |

## Effort configuration — exact syntax

`~/.codex/config.toml`:

```toml
model = "gpt-6-astra"
model_reasoning_effort = "high"        # minimal | low | medium | high | xhigh (max on Responses-API models)
model_reasoning_summary = "auto"       # auto | concise | detailed | none
model_supports_reasoning_summaries = true
plan_mode_reasoning_effort = "high"    # none | minimal | low | medium | high | xhigh
agents.default_subagent_reasoning_effort = "medium"
```

- Per-session flags: `codex -m gpt-6-astra --reasoning-effort xhigh`
- One-off override: `codex -c model_reasoning_effort="high"` (also `-c model=...`)
- Runtime TUI: `/model`, `/effort high`; Shift+Down cycles effort and can land on the
  TUI-only rung **Ultra**.

## Codex HAS a documented floor / downgrade — mirror it, do not invent one

Codex CLI PR #41206 ("Make Ultra reasoning fallback model-aware", stable v0.150.0,
2026-08-26): **Ultra is a CLI/TUI selector, not a universal API value.** When a model
lacks a literal `ultra` level the CLI falls back in this order:

```
model's catalog override (if any)  ->  max  ->  highest supported non-ultra effort  ->  medium
```

Older CLI builds without this metadata keep the prior naive fallback.

**Why this matters for Arkestra:** Codex already models "requested level not available
on this model → walk down to something this model supports." That is precisely the
per-provider downgrade shape Arkestra needs, and it terminates *within the model's own
capability set* rather than crossing to another provider — the exact property missing
from Prism's Anthropic-only chain (see `2026-09-06-arkestra-prism-seams.md`, FINDING 2).

## Corrections to the prior hypothesis

1. **`gpt-6-astra` as default — TRUE, but only just.** Bundled default since 2026-09-04
   (v0.153.4), two days ago. On 2026-09-05 the answer would have differed. Any
   "what is default" assertion needs a date attached.
2. **`gpt-5.4` / `gpt-5.4-mini` status is WRONG.** The hypothesis said "retiring"
   (future). The retirement date 2026-08-31 has **already passed**. They are **retired**,
   and routing should reject these ids outright.
3. **Effort tier spelling is WRONG.** The hypothesis's
   `light / medium / high / extra-high / max / ultra` conflates two different things:
   - capitalized **ChatGPT UI display labels** ("Astra Extra High", "Sol Light"), used
     only in the web app's power-mode picker; and
   - the actual lowercase **API / config.toml values**:
     `minimal, low, medium, high, xhigh, max`.
   `light` and `extra-high` are **not valid** `model_reasoning_effort` strings — writing
   them into config.toml or an API payload is rejected. `ultra` is real but only as the
   TUI meta-selector described above.
4. **Two retired ids were missing entirely** — `gpt-5.2` and `gpt-5.3-codex`, both
   deprecated/retired per the 2026-06-02 announcement. Old configs may still name them,
   so the store should carry them as explicitly retired.
5. **`gpt-5.3-codex-spark` pricing** — "Pro preview" was right, but it is not
   token-metered at all in this preview. A pricing field must be null/N-A, never estimated.

## Implications for the Arkestra roster entries

- Store the effort values as the **lowercase API set**, never the UI labels.
- Carry a `status` field (`default|current|preview|legacy|retired`) so retired ids are
  rejected rather than silently attempted.
- Carry `retiredOn` where announced, so the check is a date comparison rather than a
  hand-maintained boolean that goes stale (the same generate-don't-maintain rule as I8).
- `gpt-6-astra`'s long-context surcharge (2x in / 1.5x out above 272K input) means cost
  is **not** a single per-token constant — a cost-aware routing decision needs the
  input-size breakpoint, or it will under-predict on large contexts.

## Sources (all retrieved 2026-09-06)

- Models | ChatGPT Learn — https://learn.chatgpt.com/docs/models
- ChatGPT & Codex changelog — https://learn.chatgpt.com/docs/changelog
- Configuration Reference — https://learn.chatgpt.com/docs/config-file/config-reference
- Config basics — https://learn.chatgpt.com/docs/config-file/config-basic
- GPT-6 Astra announcement | OpenAI — https://openai.com/index/gpt-6-astra/ (403 on fetch; corroborated via search snippets)
- GPT-6 Astra System Card — https://deploymentsafety.openai.com/gpt-6-astra
- openai/codex releases — https://github.com/openai/codex/releases (v0.153.0–0.153.4)
- PR #41206 "Make Ultra reasoning fallback model-aware" — https://github.com/openai/codex/pull/41206
- Issue #32874 (Shift+Down / Ultra rung) — https://github.com/openai/codex/issues/32874
- Introducing GPT-5.3-Codex-Spark | OpenAI — https://openai.com/index/introducing-gpt-5-3-codex-spark/
- Introducing GPT-5.5 | OpenAI — https://openai.com/index/introducing-gpt-5-5/
- GPT-5.6 pricing (Sol/Terra/Luna) — https://www.cloudzero.com/blog/gpt-5-6-pricing/ ; https://www.finout.io/blog/gpt-5.6-pricing-2026-sol-terra-and-luna-tiers-explained
- OpenRouter model pages — https://openrouter.ai/openai/gpt-6-astra ; https://openrouter.ai/openai/gpt-5.6-terra
- Codex Knowledge Base (config syntax, Astra default nuance, Ultra trade-off) — https://codex.danielvaughan.com/2026/09/04/gpt-6-astra-codex-cli-integration-guide-critical-cyber-threshold/ ; https://codex.danielvaughan.com/2026/09/03/gpt-6-astra-codex-cli-configuration-context-notes-safety/ ; https://codex.danielvaughan.com/2026/07/24/codex-cli-ultra-mode-trade-off-reasoning-budgets-subagent-cost-task-routing/
- gpt-5.2 / gpt-5.3-codex deprecation — https://securityonline.info/openai-legacy-model-deprecation-gpt-5-3-codex/
