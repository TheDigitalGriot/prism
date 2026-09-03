# Prism v4.13.0 — Documentation Snapshot

**Released:** 2026-09-02
**Theme:** The Sept 2026 Claude model line — a source-of-truth update across five surfaces, one security fix, and one restored decision.

---

## 1. What shipped

### The model line

Every id below was verified live against `platform.claude.com` on 2026-09-02, not recalled.

| Tier | API ID | Alias | $/MTok (in/out) | Context | Max out | Effort |
|---|---|---|---|---|---|---|
| Fable 5.1 | `claude-fable-5-1` | *none* — pin the id | $10 / $50 | 1M | 128K | all five, default `high` |
| **Opus 5** | `claude-opus-5` | `opus`, `best` | $5 / $25 | 1M | 128K | all five, default `high` |
| Opus 4.8 | `claude-opus-4-8` | `opus48` (legacy) | $5 / $25 | 1M | 128K | all five |
| **Sonnet 5** | `claude-sonnet-5` | `sonnet` | **$2 / $10** | 1M | 128K | all five (`xhigh` is new) |
| Haiku 4.5 | `claude-haiku-4-5-20251001` | `haiku` | $1 / $5 | 200K | 64K | **none** |

Mapping applied:

```
claude-opus-4-8    ->  claude-opus-5      (opus/best alias flip LANDED)
claude-sonnet-4-6  ->  claude-sonnet-5    ($3/$15 -> $2/$10, a 33% CUT)
claude-fable-5     ->  claude-fable-5-1
claude-haiku-4-5-20251001                 (unchanged)
opus (policy key)  ->  opus48             (namespace disambiguation)
```

Sonnet 5 is the only tier that got **cheaper**, while also gaining native 1M context and `xhigh` — neither of which Sonnet 4.6 had. Cost ratios were re-baselined accordingly: Sonnet is now **2x** haiku, not the stale 3-5x.

### Minimum Claude Code versions

Corrected against primary GitHub release tags rather than inference:

| Model / feature | Minimum |
|---|---|
| Fable 5.1 | **v2.1.257** |
| Opus 5 | **v2.1.219** |
| Sonnet 5 | **v2.1.197** |
| Haiku 4.5 | *not documented in any changelog entry* |
| bare `effort: max` | *not documented; predates `xhigh`* |

The last two are recorded as **NOT FOUND** rather than guessed — a wrong minimum in the docs is worse than an honest gap.

---

## 2. Security fix — the Fable gate bypass

`scripts/fable-gate.sh` matched Fable by **exact string**:

```sh
case "$MODEL" in
  fable|claude-fable-5) POLICY_MODEL="fable5" ;;
```

`claude-fable-5-1` does not match that. Renaming the model without widening the pattern would have let Fable 5.1 dispatch **completely ungated**, silently defeating the HITL policy that protects the capped weekly Max allowance. The grep fail-safe had the same flaw (its regex closed on `claude-fable-5"`).

Fixed by matching Fable by **prefix** in all three places the logic is mirrored:

- `scripts/fable-gate.sh` — shell `case` glob `claude-fable-5-*`
- `scripts/fable-gate.sh` — grep fail-safe `claude-fable-5(-[0-9]+)*`
- `apps/prism-mobile/.../model-policy.ts` — `policyKeyForModel` prefix test

Verified against four live cases:

| Input | Decision |
|---|---|
| `claude-fable-5-1` | `ask` 🔒 (was ungated) |
| `claude-fable-5` (legacy) | `ask` — no regression |
| `claude-opus-5` | `allow` ⭐ |
| `sonnet` | *(no output)* — ungoverned passthrough intact |

A `currency-check` step (§9.7 of `model-config.md`) now requires re-verifying the prefix match whenever a point release ships.

---

## 3. Restored decision — no model gate on Opus 5

Three planning documents locked the same call:

| Source | Decision |
|---|---|
| `icm-fuse-CONTEXT.md:34-39` | "**NO Fable-style model gate on Opus 5.** Optional light confirm on effort xhigh/max only." |
| `icm-fuse-opus5-PLAN.md:212-213` | "**Do not** add Opus 5 to `fable-gate.sh`'s gated set; **do not** create an `opus5.flag`." |
| `OPUS5-INCORPORATION-PLAN.md:144` | "Opus 5 requires **no new gate**" |

The shipped code nevertheless defaulted `opus5` to `"ask"` in `model-policy.ts`, `model-policy.example.json`, `fable-gate.sh`, and `statusline-model.sh`. That was **drift**, not a design choice.

`opus5` now defaults to `"allow"`. Model-decision bus events still fire on every dispatch, so un-gating **does not reduce visibility** — it removes a confirm prompt that contradicted the recorded decision. Fable 5.1 keeps its gate. Opus 5's only guard remains the `xhigh|max` one-shot confirm, which is a per-call effort control, not a model-level gate.

A regression test now locks this in: with a default policy, a denied `fable5` lands on `opus5` rather than falling through to the legacy floor.

---

## 4. Namespace split — two different `opus`es

Conflating these is how the drift above started.

| Namespace | Where | Keys |
|---|---|---|
| **Policy keys** | `model-policy.ts`, `fable-gate.sh`, `statusline-model.sh`, mobile `model-policy.ts` | `fable5`, `opus5`, `opus48` — **no bare `opus`** |
| **SDK aliases** | `claude-sdk.ts` `MODEL_IDS` | `opus` (→ Opus 5), `opus5`, `opus48`, `sonnet`, `haiku`, `fable` |

Downgrade chain: `fable5 → opus5 → opus48`.

The bare `opus` survives only as the user-facing SDK alias that agent frontmatter depends on. In the policy namespace it is now `opus48`, so a policy key can never silently mean "whichever Opus is current."

---

## 5. Cost correctness — the `maxTokens` truncation risk

Prism's SDK handler **never sends a `thinking` parameter**. Anthropic's migration guide is explicit about what that means across the boundary:

> "On Claude Opus 4.8, requests run without thinking unless you set `thinking: {"type": "adaptive"}`. On Claude Opus 5, the same requests run with adaptive thinking on by default."

Thinking tokens bill as **output** *and* count against `max_tokens`. So the previous `maxTokens ?? 8192` default — tuned against a no-thinking baseline — risked **truncating responses mid-flight**, not merely costing more. Raised to `32768`.

Two further documented consequences, now in `model-config.md §4`:

- **`high` is not comparable across models.** Anthropic re-allocated the tokens behind each effort label; porting a setting between tiers on faith is invalid. Re-sweep instead.
- **Effort no longer shortens visible output on Opus 5.** It controls thinking volume only, so cost control now needs two levers: `effort` for thinking, and an explicit concision instruction for visible text.

Anthropic's recommended start dropped from `xhigh` (Opus 4.7/4.8) to `high` with `low`/`medium` "liberally as your primary control for token cost." `codebase-analyzer` and `prism-analyzer` moved `high → medium` accordingly. Opus 4.8 and Opus 5 share the same tokenizer, so there is **no** tokenizer differential between them — any delta is behavioral.

---

## 6. Mythos 5.1 — confirmed, and deliberately not routable

`claude-mythos-5-1` is a real API id (confirmed in Anthropic's effort and pricing docs; identical to Fable 5.1 in capability, price, and API surface). It is absent from the public models-overview table because it is **invitation-only under Project Glasswing**, for vetted US cybersecurity and life-sciences organizations.

It is therefore recorded as a **non-routable footnote in `model-config.md §1` only** — deliberately kept out of the tier table, `MODEL_IDS`, and the policy chain. The note exists so a future currency check does not repeat the investigation from scratch.

---

## 7. Other fixes

- **Mobile runtime-model normalizer.** The regex required a minor segment (`{major}-{minor}`), so it returned `null` for major-only ids like `claude-opus-5` and `claude-sonnet-5` — stranding the entire current model line on that surface. The minor segment is now optional, with a regression test.
- **Version drift.** v4.12.0–4.12.2 bumped only `plugin.json`/`marketplace.json`, leaving root `VERSION` at 4.12.1 and every app (vscode, electron, mobile, installer, tauri, CLI, prism-core, prism-ui) pinned at **4.11.0**. `bump-version.py` keys off root `VERSION` and silently skipped every file not holding the old string, so this was caught by auditing each location rather than trusting the script's "all version strings consistent" report. All nine locations are now consistent at 4.13.0.
- **CHANGELOG gap.** v4.12.2 shipped without a CHANGELOG entry; backfilled.
- **`CLAUDE.md` encoding corruption** (separate commit). A prior session rewrote it with the PowerShell `Set-Content -Encoding utf8` BOM gotcha, prepending a BOM and mangling 21 em-dashes and 10 arrows into mojibake. Claude Code was loading the corrupted file as project instructions. Restored and the intended import re-added as UTF-8 without a BOM.

---

## 8. Verification performed

| Gate | Result |
|---|---|
| `claude plugin validate .` | ✅ PASS |
| `scripts/tests/test_porter_check.sh` | ✅ PASS (tokens unavailable → skip) |
| `fable-gate.sh` live cases | ✅ 4/4 correct |
| Mobile server tests | ✅ 36/36 |
| Mobile app tests | ✅ 64/64 |
| Version consistency (9 locations) | ✅ all 4.13.0 |
| Stale-id sweep (live paths) | ✅ only deliberate legacy pins remain |

**Not run locally:** `packages/cli/tests/15-provider.test.ts` was updated but is a CLI integration suite that spawns a daemon; per the mobile repo's own rules, full-suite verification routes to CI. Mobile `npm run typecheck` reports 13 pre-existing errors in four **unmodified** files (`relay-transport.ts`, `daemon-client-relay-e2ee-transport.ts`, `daemon-keypair.ts`, `diff-highlighter.ts`) — the documented stale-workspace-declaration class from unbuilt `@thedigitalgriot/relay` and `@thedigitalgriot/highlight`. That repo's CLAUDE.md explicitly forbids patching those to silence them.

---

## 9. Files changed

**Docs / skills:** `skills/cl-plugin-structure/{SKILL.md, references/model-config.md}`, `skills/prism-spectrum/{SKILL.md, references/model-selection.md}`, `skills/fragment-sync/references/conformance-checklist.md`, `prism-docs/docs/plugin/scripts.md`, `README.md`, `apps/prism-mobile/docs/custom-providers.md`

**Runtime:** `packages/prism-core/src/core/api/model-policy.ts`, `apps/prism-vscode/src/core/api/{claude-sdk.ts, fable-gate.ts}`, `apps/prism-vscode/src/providers/model-status.ts`, `apps/prism-vscode/src/extension.ts`, `apps/prism-mobile/packages/server/src/server/agent/{model-policy.ts, providers/claude-agent.ts, providers/claude/claude-models.ts}`

**Shell / config:** `scripts/fable-gate.sh`, `scripts/statusline-model.sh`, `model-policy.example.json`

**Agents:** `agents/codebase-analyzer.md`, `agents/prism-analyzer.md` (effort only)

**Tests:** vscode `model-policy.test.ts` / `fable-gate.test.ts`; mobile `claude-models.test.ts`, `claude-agent.test.ts`, `15-provider.test.ts`; app `use-form-preferences.test.ts`, `resolve-agent-form.test.ts`, `providers-section.test.tsx`

**Mirror:** nine files synced into `apps/prism-setup/resources/plugin/` (only the files changed here — the mirror carries pre-existing drift in ~15 other skills, left untouched).

**Deliberately untouched:** `.prism/shared/{evals,docs,research,handoffs}`, and the `prism-gavel` shipped-roadmap entries in `frame.html` — rewriting those would falsify a historical record.

---

*Stage contract: `.prism/shared/plans/2026-09-02-model-line-sept2026-CONTEXT.md`*
*Sources: [Models overview](https://platform.claude.com/docs/en/models/overview) · [Pricing](https://platform.claude.com/docs/en/about-claude/pricing) · [Effort](https://platform.claude.com/docs/en/build-with-claude/effort) · [Model IDs and versioning](https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions) · [Migrating to Opus 5](https://platform.claude.com/docs/en/models/opus-5/migration-guide) · Claude Code release tags v2.1.197 / v2.1.219 / v2.1.257*
