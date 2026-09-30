# Model roster research — Claude deltas + Codex net-new
Retrieved: 2026-09-30, by Claude (Sonnet 5), Claude Code CLI, digitalgriotpc.
Per prism-model-onboard's Iron Law: nothing below is from training-data memory. Every fact carries
a URL and this retrieval date. Resume-from: `.prism/shared/plans/2026-09-02-model-line-sept2026-CONTEXT.md`
(Claude roster "verified live 2026-09-02 — do not re-litigate"). This doc covers ONLY the stated
deltas since that contract, plus the net-new Codex line.

## Corrections to the handoff's own framing (found this session, stated loudly)

1. **GPT-5.3-Codex-Spark is RETIRED (2026-09-14), not merely "to sweep."** The handoff's Stage 3
   process listed it among models to sweep as if still live. It is gone from ChatGPT desktop,
   Codex CLI, and the IDE extension. Do not onboard it as `current`; mark `retired` if onboarded
   at all (skipped here — a retired-before-this-session model isn't in the Iron Law's mandate to
   onboard, only to not misclassify if referenced).
2. **`gpt-6-astra` and `gpt-6-luna` exist and are NOT in the handoff's sweep list at all.** The
   handoff named "gpt-6/astra" ambiguously; live research shows `gpt-6-astra` (flagship,
   most-capable) and `gpt-6-luna` (fast/cheap tier) are both real, current, separate models
   alongside `gpt-6.1-sol` (the actual CLI default). All three belong in the roster together — they
   are the current top tier of the Codex line, not a single ambiguous entry.
3. **A genuine UI-label-vs-API-value trap, caught and resolved.** OpenAI's general Codex model
   catalog page (learn.chatgpt.com/docs/models) describes `gpt-6.1-sol` and `gpt-6-astra`'s
   reasoning support as "Light through Ultra" — this is the ChatGPT **consumer UI's** effort
   selector wording, not the API's `reasoning.effort` enum. The model-specific API docs pages
   (developers.openai.com/api/docs/models/…) give the real enum: `low, medium, high, xhigh, max`
   for Sol and Astra (no `ultra`, no `none`); `gpt-6-luna` uniquely also supports `none`. Trusted
   the dedicated API docs over the general catalog page, per the Iron Law's own example of this
   exact failure mode.
4. **The 2026-09-02 contract's "dateless id = pinned snapshot" framing does not visibly apply to
   the 5.5 line.** Unlike Haiku 4.5 (documented alias→dated-snapshot: `claude-haiku-4-5` →
   `-20251001`), Anthropic's own docs for Opus 5.5 and Sonnet 5.5 list ONLY the bare dateless id
   on every platform (Claude API, Bedrock, Google Cloud, Microsoft Foundry, AWS) with no alternate
   dated variant shown anywhere on either model's page. Recording this as observed, not asserting
   it contradicts the contract — the contract's framing may still hold internally at Anthropic; it
   just isn't surfaced as a second identifier the way Haiku's is.
5. **Opus 5.5's default effort is `medium`, not `high`.** Every other current-tier model in the
   comparison table (Fable 5.1, Sonnet 5.5, Sonnet 5) defaults to `high`. This is a real,
   documented asymmetry, not an oversight to normalize away — griot-agent-architect's own
   Model Configuration section already anticipated this direction ("On Opus 5, low/medium are
   strong enough for most routine dispatch") but the confirmed value is a genuine new fact.

## Claude line — verified deltas since 2026-09-02

| Field | Claude Opus 5.5 | Claude Sonnet 5.5 |
|---|---|---|
| Model ID (Claude API) | `claude-opus-5-5` | `claude-sonnet-5-5` |
| Bedrock ID | `anthropic.claude-opus-5-5` | `anthropic.claude-sonnet-5-5` |
| Google Cloud / MS Foundry / AWS | `claude-opus-5-5` | `claude-sonnet-5-5` |
| Status | Active, "Latest" | Active, "Latest" |
| Released | 2026-09-22 | 2026-09-28 |
| Retirement | not sooner than 2027-09-22 | not sooner than 2027-09-28 |
| Context window | 1M tokens | 1M tokens |
| Max output (sync) | 128K tokens | 128K tokens |
| Max output (Batch API, beta `output-300k-2026-03-24`) | 300K tokens | 300K tokens |
| Input / Output pricing | $4 / $20 per MTok | $2 / $10 per MTok |
| Cache read | $0.20/MTok (5% of input — a special lower rate) | $0.20/MTok (10% of input, standard) |
| 5m cache write | $5/MTok | $2.50/MTok |
| 1h cache write | $8/MTok | $4/MTok |
| Thinking | Adaptive, **cannot be disabled** | Adaptive (new `between_tools` setting turns off up-front thinking, works at `high` effort or below) |
| Default effort | **`medium`** | `high` |
| Effort levels supported | low, medium, high, xhigh, max (all 5) | low, medium, high, xhigh, max (all 5) |
| Knowledge cutoff | Jun 2026 | Jun 2026 |

Breaking changes vs. predecessor (both models): forced tool use now returns an error (was
previously allowed); thinking blocks are tied to the model+conversation that produced them; the
Claude API / Google Cloud no longer accept the `computer_20251124` computer-use tool version; text
emitted between tool calls now arrives inside `thinking` blocks (empty at the default `display`
setting — a streaming consumer that shows tool-call progress text goes quiet unless it sets a
`display` value or, on Sonnet 5.5, turns off up-front thinking via `between_tools`). Opus 5.5 adds:
thinking can no longer be disabled at all (Opus 5 could disable it; 5.5 cannot). Sonnet 5.5 adds:
the advisor tool now rejects Opus 4.8, Opus 4.7, and Sonnet 5 as advisor pairings.

**Relevance to Prism's own code:** `claude-sdk.ts` never sets a `thinking` param (confirmed by the
2026-09-02 contract) — on Opus 5.5 this is a non-issue (thinking is forced on regardless); on
Sonnet 5.5 it means Prism gets Sonnet 5.5's default adaptive-thinking behavior with no
`between_tools` opt-out unless a future change adds one deliberately.

Sources (retrieved 2026-09-30):
- https://platform.claude.com/docs/en/models/opus-5-5/overview
- https://platform.claude.com/docs/en/models/sonnet-5-5/overview
- https://platform.claude.com/docs/en/models/sonnet-5/overview (for the comparison table + confirming Sonnet 5's own continuing id `claude-sonnet-5`)
- https://www.unite.ai/anthropic-ties-claude-opus-5-5-pricing-to-longer-coding-sessions/
- https://venturebeat.com/technology/anthropic-launches-claude-sonnet-5-5-with-30-cost-reduction-per-task-due-to-faster-speeds-and-fewer-tool-calls

## Codex line — net-new (first entry into Prism's roster)

| Field | gpt-6-astra | gpt-6.1-sol | gpt-6-luna |
|---|---|---|---|
| Status | Current (flagship, "most capable... most demanding work") | **Default** as of Codex CLI 0.159.0/0.159.1 | Current (fast/cheap tier) |
| Context window | 1,050,000 tokens | 1,050,000 tokens | 1,050,000 tokens |
| Max output | 128,000 tokens | 128,000 tokens | 128,000 tokens |
| Input / Output pricing | $10 / $50 per MTok | $2 / $10 per MTok | $0.10 / $0.50 per MTok |
| Cached input | $1/MTok | $0.10/MTok | $0.01/MTok |
| Cache write | $12.50/MTok | $2.50/MTok | $0.125/MTok |
| `reasoning.effort` values (verified API enum) | low, medium, high, xhigh, max | low, **medium (default)**, high, xhigh, max | **none**, low, medium, high, xhigh, max |
| Note | ">272K input tokens: 2x input/cache, 1.5x output" pricing rule, same as Sol/Luna | "Near-Astra performance... at a lower cost than Astra" — positioned as the routine default, Astra as the deliberate escalation | Only current-tier Codex model supporting `none` — a genuine "skip reasoning" fast path |

**CLI floor: Codex CLI ≥ 0.159.0** required for `gpt-6.1-sol` to resolve without a 400 error
(0.158.0 rejects it).

**Superseded but not confirmed retired:** `gpt-5.6-sol` / `gpt-5.6-terra` / `gpt-5.6-luna` (the
prior, Aug-2026 generation). OpenAI's own migration guidance for a related model (GPT-5.5) points
users toward `gpt-5.6-sol` or `gpt-6-astra` as of today, so the 5.6 family is still a live migration
target, not dead — but no `retiredOn` date is published for it anywhere found. **Per the Iron Law
("retiredOn: a date... never a boolean"), NOT marking these `retired` without a confirmed date.**
Status recorded as `legacy` if onboarded (not onboarded this pass — net-new scope is the current
tier only; the 5.6 family predates this handoff's window and isn't independently actionable here).

**Confirmed retired, for completeness (not onboarded — no live routing need):**
- `gpt-5.3-codex-spark` — retired 2026-09-14.
- `gpt-5.4`, `gpt-5.4-mini` — retired 2026-08-31.
- `gpt-5.5` (bare, non-Codex-suffixed) — scheduled retirement from ChatGPT/ChatGPT Work/Codex on
  2026-10-14 (still active today, 14 days out); stays available via direct OpenAI API key auth
  after that date. Migration path for ChatGPT-signed-in Codex users: `gpt-5.5` → `gpt-5.6-sol`.

Sources (retrieved 2026-09-30):
- https://developers.openai.com/api/docs/models/gpt-6.1-sol
- https://developers.openai.com/api/docs/models/gpt-6-astra
- https://developers.openai.com/api/docs/models/gpt-6-luna
- https://learn.chatgpt.com/docs/models (general catalog — cross-checked, NOT used for effort enum, see Correction #3)
- GitHub issue corroboration (0.159.0/0.159.1 release behavior): https://github.com/openai/codex/issues/49396, cross-referenced release-note summaries for 0.159.0/0.159.1
- https://startupfortune.com/openai-will-retire-gpt-55-from-chatgpt-and-codex-on-october-14/
- https://www.orcarouter.ai/blog/gpt-5-5-remains-available-openai-api-codex-api-key

## What this doc does NOT do
- Does not re-verify the Claude roster entries the 2026-09-02 contract already confirmed
  (Fable 5.1, Opus 4.8, Haiku 4.5) — those stand as previously verified, per "resume, don't redo."
- Does not onboard the GPT-5.6 family or any retired model as a live roster entry — net-new scope
  is the current Codex tier a fresh install would actually reach.
- Does not resolve the `griot-agent-architect` "dateless id = pinned snapshot" framing question for
  the 5.5 line (Correction #4) — flagged for whoever owns that section next, not silently reconciled.
