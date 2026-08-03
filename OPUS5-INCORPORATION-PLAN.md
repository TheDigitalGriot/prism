# Opus 5 Incorporation Plan

> **Scope:** Analysis + incorporation plan **only**. No source files were modified in producing this
> document. Written against `prism` @ 4.8.0, using the `cl-plugin-structure` gold standard.
> **Date:** 2026-08-03

---

## 0. The model being added

| Attribute | Value |
|---|---|
| Model | **Opus 5** |
| Full ID | `claude-opus-5` |
| Context | 1M tokens |
| Max output | 128k |
| Pricing | **$5 / $25** per MTok (in / out) — identical to Opus 4.8 |
| Effort | `low · medium · high (default) · xhigh · max` — **the effort dial is the cost/capability lever** |
| Position in hierarchy | Above Fable 5 (`claude-fable-5`, long-running, HITL-gated) → Haiku 4.5 (`claude-haiku-4-5`, cheap/fast) → local offload lanes (Ollama `:11434`, DeepSeek V4-Flash, Kimi K3) |

**Central design consequence:** because Opus 5 bills the same as Opus 4.8 and is subscription-billable,
it needs **no new HITL gate**. It flows through the existing subscription-first auth path like
Opus/Sonnet/Haiku. Cost is governed by the **effort dial**, not by a flag+modal. Fable 5's gate stays
exactly as-is (it protects a *capped weekly allowance* and a *distinct API surface*, not raw capability).

---

## 1. Where model IDs and tier/routing logic live

Model routing in this repo is split across **three independent surfaces** plus a bundled duplicate and
frozen snapshots. Each must be treated separately — an edit to one does not propagate.

### Surface A — Plugin (Claude Code agents / skills / commands)

Routing here is **alias-based frontmatter**, not code. Nothing hardcodes `claude-opus-*` as a runtime
constant; agents declare `model: opus|sonnet|haiku` (or a pinned ID) and Claude Code resolves it.

| Concern | File | Notes |
|---|---|---|
| Model line facts (tier table, pricing, context, effort) | `skills/cl-plugin-structure/references/model-config.md` | §1 table (`:25-30`), aliases §2, effort §4, currency-check §9 |
| Tier/routing **guidance** (which model per task) | `skills/prism-spectrum/references/model-selection.md` | Haiku/Sonnet/Opus/Fable tiers (`:7-34`), agent-default table (`:54-67`), cost ratios (`:71-79`) |
| Skill body model summary | `skills/cl-plugin-structure/SKILL.md` | "Model Configuration" section (tier table + Fable gate callout) |
| Fable HITL gate (shell) | `scripts/fable-gate.sh` | PreToolUse gate; only `fable`/`claude-fable-5` gated (`:42-44`), flag ON→ask, OFF→deny |
| Gate wiring | `hooks/hooks.json` | `PreToolUse` matcher `"Task"` → `fable-gate.sh` (`:25-34`) |
| Agent model defaults | `agents/*.md` frontmatter | `model:` (alias) + optional `effort:` |

### Surface B — App runtime (`prism-vscode` extension + `prism-core`)

This is the only surface with **hardcoded model IDs in executable code**.

| Concern | File : line | What it is |
|---|---|---|
| **Model ID map** | `apps/prism-vscode/src/core/api/claude-sdk.ts:24-29` | `MODEL_IDS = { opus:"claude-opus-4-8", sonnet:"claude-sonnet-4-6", haiku:"claude-haiku-4-5-20251001", fable:"claude-fable-5" }` |
| Model name type | `apps/prism-vscode/src/core/api/claude-sdk.ts:31` | `type ModelName = keyof typeof MODEL_IDS` |
| Model selection + stream call | `apps/prism-vscode/src/core/api/claude-sdk.ts:77`, `:105-113` | `this._model = MODEL_IDS[options.model ?? "sonnet"]`; stream sends `model`, `max_tokens`, `system`, `messages`, `tools` — **no effort / output_config today** |
| Handler options | `apps/prism-vscode/src/core/api/claude-sdk.ts:37-46` | `{ apiKey?, model?, maxTokens? }` — no `effort` field yet |
| Auth resolution | `packages/prism-core/src/core/api/auth.ts:97-108` | `resolveAnthropicAuth()` — subscription-first |
| Metered opt-in flag | `packages/prism-core/src/core/api/auth.ts:69` | `ALLOW_METERED_ENV = "GRIOT_ALLOW_METERED"` |
| OAuth token env | `packages/prism-core/src/core/api/auth.ts:57` | `CLAUDE_CODE_OAUTH_TOKEN` |
| Fable gate (modal) | `apps/prism-vscode/src/core/api/fable-gate.ts:27-52` | `resolveGatedModel()` — non-Fable passes through unchanged (`:32-34`); Fable falls back to `"opus"` on deny/disabled |
| Fable flag reader | `apps/prism-vscode/src/core/api/fable-flag.ts:19-35` | `isFableEnabled()` reads `.prism/local/fable.flag` |
| Task factory (wires gate) | `apps/prism-vscode/src/core/task/index.ts:324-336` | `createTask()` → `resolveGatedModel()` → `new PrismApiHandler({ model })` |

### Surface C — Paseo daemon / mobile (`prism-mobile`)

| Concern | File : line | What it is |
|---|---|---|
| **Claude model registry** | `apps/prism-mobile/.../providers/claude/claude-models.ts:18-61` | `CLAUDE_MODELS[]` — UI-facing list (id, label, description, `isDefault`, `thinkingOptions`). Currently tops out at Opus 4.7 |
| Effort/thinking option sets | `apps/prism-mobile/.../claude/claude-models.ts:3-16` | `CLAUDE_THINKING_OPTIONS` and `CLAUDE_OPUS_4_7_THINKING_OPTIONS` (adds `xhigh`) |
| Runtime ID normalizer | `apps/prism-mobile/.../claude/claude-models.ts:71-95` | `normalizeClaudeRuntimeModelId()` — regex only matches `opus|sonnet|haiku`; **would need `opus-5` handling** |
| Local / custom lanes | `apps/prism-mobile/docs/custom-providers.md` | `agents.providers` config: `extends:"claude"` + `ANTHROPIC_BASE_URL` (OpenAI/Anthropic-compatible), or `extends:"acp"` |

### Duplicate + frozen copies (do not miss / do not touch)

- **Bundled plugin duplicate — must stay in sync:** `apps/prism-setup/resources/plugin/` mirrors the
  plugin (`.../skills/cl-plugin-structure/...`, `.../skills/prism-spectrum/references/model-selection.md`,
  `.../scripts/fable-gate.sh`, `.../hooks/hooks.json`). The setup app ships this copy — a model change to
  the live plugin **must** be re-copied here or the installed plugin drifts.
- **Frozen eval snapshots — leave alone:** `.prism/shared/evals/v*-snapshot/**` are time-capsules
  (`model-config.md` §9 rule). Do not edit.
- **Historical research/docs — leave alone:** `.prism/shared/research/`, `.prism/shared/docs/`,
  `CHANGELOG.md` history. Intentionally dated.

---

## 2. How to add Opus 5 and expose the effort dial

### Decision first: alias vs pinned ID

Per `model-config.md` §2, dateless IDs are **pinned snapshots** from 4.6 onward. Two paths:

- **Recommended:** keep alias-based agents (`model: opus`) pointing at the family alias and let the
  provider resolve `opus → claude-opus-5` once Anthropic rolls the alias forward. Pin the runtime map
  (Surface B) explicitly to `claude-opus-5`.
- Alternatively add a distinct `opus5` key everywhere if Opus 4.8 must remain reachable in parallel
  (useful for A/B eval). This is the safer, more explicit route and is assumed below.

### Surface A — Plugin (docs + guidance edits only)

1. `skills/cl-plugin-structure/references/model-config.md` — add the Opus 5 row to the §1 table
   (`claude-opus-5`, 1M, 128k out, $5/$25, effort `low…max` default `high`), note alias resolution in §3,
   and add it to the effort matrix §4. Update the "routine ceiling" language (Opus 5 becomes the ceiling).
2. `skills/prism-spectrum/references/model-selection.md` — add an Opus 5 tier note and update the
   "Opus is the routing ceiling" lines (`:57`, `:67`) + cost-ratio block (`:71-79`).
3. `skills/cl-plugin-structure/SKILL.md` — update the Model Configuration tier table.
4. Agents that should ride the ceiling already use `model: opus` (alias) — **no per-agent edit needed**
   if the alias rolls forward. Only pinned-ID agents (if any) need a bump — audit per §9.
5. **Effort dial (plugin):** already first-class — set `effort: high` (Opus 5 default) or `xhigh`/`max`
   in agent/skill frontmatter. Document that `max` is session-only (existing convention). No code change.

### Surface B — App runtime (code edits)

1. `claude-sdk.ts:24-29` — add to `MODEL_IDS`:
   - If parallel: `opus5: "claude-opus-5"` (keeps `opus: "claude-opus-4-8"`), **or**
   - If replacing the ceiling: `opus: "claude-opus-5"`.
   `ModelName` (`:31`) updates automatically from the map keys.
2. **Expose the effort dial (new):** extend `PrismApiHandlerOptions` (`:37-46`) with
   `effort?: "low"|"medium"|"high"|"xhigh"|"max"`, store it, and pass it on the stream call
   (`:105-113`) via the SDK's `output_config`/effort param (default `"high"` when unset). This is the
   concrete "expose the dial" change — today the handler sends no effort at all.
3. Thread `effort` through `CreateTaskOptions` / `createTask()` (`task/index.ts:315-336`) so callers/UI
   can set it, mirroring how `model` already flows.
4. Consider raising the default `maxTokens` ceiling (`claude-sdk.ts:78`, currently `8192`) toward Opus 5's
   128k where long outputs are expected — bounded per call, not globally.

### Surface C — Paseo daemon / mobile

1. `claude-models.ts:18-61` — prepend an Opus 5 entry to `CLAUDE_MODELS` (`id:"claude-opus-5"`,
   `label:"Opus 5"`, `isDefault:true`, `thinkingOptions: CLAUDE_OPUS_4_7_THINKING_OPTIONS` — the
   `xhigh`-inclusive set); move `isDefault` off Opus 4.6. Add a `[1m]` variant if the 1M UX is surfaced.
2. `normalizeClaudeRuntimeModelId()` regex (`:83`) — extend the family group to include `opus-5` /
   the `claude-opus-5` shape so runtime init messages normalize correctly.
3. Local lanes: no code — config only (see §4).

### Then: propagate the duplicate

Re-copy the changed plugin files into `apps/prism-setup/resources/plugin/`. Do **not** touch
`.prism/shared/evals/**`.

---

## 3. HITL gating alignment (resolveAnthropicAuth / GRIOT_ALLOW_METERED)

**Opus 5 requires no new gate.** Rationale, tied to the existing policy:

- `resolveAnthropicAuth()` (`auth.ts:97-108`) is **model-agnostic**: subscription OAuth token wins;
  metered API key is used **only** when `GRIOT_ALLOW_METERED` is explicitly set; otherwise `mode:"none"`
  → actionable error. Opus 5 inherits this unchanged — a Griot tool still never silently bills the API.
- The Fable gate exists because Fable draws on a **capped weekly Max allowance** and has a **distinct API
  surface** (always-on thinking, `refusal` stop reason, new tokenizer, 30-day retention). Opus 5 shares
  neither property — same price as Opus 4.8, same Opus-family API surface (the `refusal` handler at
  `claude-sdk.ts:169-176` already covers it). So Opus 5 must **pass through** `resolveGatedModel()`
  untouched — which it already does: `if (requested !== "fable") return requested` (`fable-gate.ts:32-34`).
- **Governance lever = the effort dial, not a flag/modal.** Where Fable is gated by `.prism/local/fable.flag`
  + modal + `fable-gate.sh`, Opus 5's cost is governed by `effort` (default `high`). Keep `effort: max`
  session-only (existing convention) as the one deliberate escalation — no new flag file needed.

**Explicit non-goals (to avoid over-building):**

- Do **not** add Opus 5 to `fable-gate.sh`'s gated set (`:42-44`) — it is not Fable-class-metered.
- Do **not** create an `opus5.flag`. The metered escape hatch (`GRIOT_ALLOW_METERED`) already covers the
  only billing-risk case (no subscription token present).
- **Optional hardening (flag for decision):** if you want a ceiling guard on the *most expensive* Opus 5
  calls, gate `effort: xhigh|max` behind a confirm — but this is a lighter, effort-level gate, categorically
  different from Fable's model-level gate, and is a *net-new* policy, not required for correctness.

---

## 4. Where the local lanes slot for offload

**Honest constraint up front:** Claude Code plugin frontmatter (`model:`) resolves **Anthropic aliases
only**. It cannot dispatch to `localhost:11434`, DeepSeek, or K3. Therefore local offload is an
**app/daemon-surface concern**, driven by provider config — not by plugin routing.

| Lane | Where it slots | Mechanism |
|---|---|---|
| **Ollama** (`:11434`), DeepSeek V4-Flash | Paseo custom provider | `agents.providers.<id>` with `extends:"claude"` + `env.ANTHROPIC_BASE_URL` pointed at the local OpenAI/Anthropic-compatible endpoint; `models:[…]` lists the local model IDs (`custom-providers.md` "Extending a built-in provider") |
| **Kimi K3** (API) / batch | Paseo custom provider or ACP | `extends:"claude"` + base URL, or `extends:"acp"` + `command` for an ACP-speaking local agent |
| App runtime (`prism-vscode`) | `ANTHROPIC_BASE_URL` override + `GRIOT_ALLOW_METERED` semantics | The handler already honors env-based auth; a local base-URL provider profile is the offload path. No local model appears in `MODEL_IDS` — it is a *provider*, not a tier key |

**Routing intent (guidance layer):** in `model-selection.md`, document local lanes as the tier **below
Haiku** for mechanical/batch/free-token work (the brainstorm's "local/batch tier" —
`.prism/shared/brainstorms/2026-07-18-multi-model-fleet-orchestration.md`, AirLLM/llmfit/Kimi K3 row).
But make explicit that this guidance is realized through **provider config**, not `model:` frontmatter, on
the fleet-orchestration surface — not inside the Claude Code plugin. This keeps the "my tools first /
don't route around the seam" principle honest: the seam is the provider registry, and that is where the
offload lane is made legible.

---

## 5. cl-plugin-structure gold-standard steps that apply

| Gold-standard step | Where it applies here |
|---|---|
| **Model Configuration** section (tier table, aliases, effort) | Primary target — update `model-config.md` §1/§3/§4, `SKILL.md` table, `model-selection.md`. Opus 5 becomes the routine ceiling |
| **§2 Aliases vs pinned IDs** rule | Decide alias-forward (`model: opus`) vs explicit `claude-opus-5` pin. Runtime map (Surface B) must be pinned; frontmatter should stay alias where auto-update is wanted |
| **§4 Effort levels** | Document Opus 5's `low…max`, default `high`; wire `effort` through the app handler (the "expose the dial" code change) |
| **§9 Currency-Check Protocol** | Run the audit: `grep -rE 'claude-(opus|sonnet|haiku|fable)-[0-9a-z]'` over runtime code; verify pinned IDs; confirm min Claude Code version; leave `.prism/shared/**` snapshots alone |
| **Token-optimization principle** (cheapest model that works) | Re-baseline `model-selection.md` cost ratios and the Spectrum smart-selection math now that the ceiling is cheaper |
| **Agent frontmatter rules** | `model:` + `effort:` are the only touch points for agents; most ride the alias and need no edit |
| **fragment-sync conformance** (B8/B9 model-line checks) | Reconcile generator/spec to the new model line via `/prism:fragment-sync`; the conformance checklist references the model IDs (`skills/fragment-sync/references/conformance-checklist.md`) |
| **MANDATORY `claude plugin validate .`** | Run after any plugin.json / frontmatter / hooks edit — authoritative for both Claude Code and Cowork |
| **Bundled-duplicate sync** | Re-copy changed plugin files into `apps/prism-setup/resources/plugin/` |
| **`/prism:cl-plugin-structure` for the change itself** | Per the standing rule: any change to a Griot-suite plugin's model routing goes through this skill (this document is its output) |

---

## 6. Open decisions (need Gavin's call before implementing)

1. **Replace vs parallel:** does `opus` (alias + `MODEL_IDS.opus`) *become* `claude-opus-5`, or does Opus
   5 get its own `opus5` key so 4.8 stays reachable for eval A/B? (Recommend: parallel `opus5` key first,
   promote later.)
2. **"Sits above Fable 5" reframe:** if Opus 5 is the new ceiling *above* Fable, Fable's remaining
   justification is purely its capped-allowance + distinct-API-surface, not capability. Confirm Fable
   stays gated-as-is (recommended — no change) vs. is repositioned in the routing docs.
3. **Optional `xhigh|max` effort confirm** on the app surface — adopt the light effort-level guard, or
   leave cost governance entirely to the dial default? (Recommend: default only; no new gate.)
4. **`maxTokens` default** — raise `claude-sdk.ts:78` from `8192` toward 128k for long-output flows, or
   keep low and let callers opt up?

---

## 7. Verification & rollout order

1. **Docs/guidance (Surface A)** — lowest risk; `model-config.md`, `model-selection.md`, `SKILL.md`.
2. **App runtime (Surface B)** — `MODEL_IDS` + effort plumbing; run `apps/prism-vscode` typecheck +
   `auth-resolve` / `fable-gate` tests (`apps/prism-vscode/src/core/api/__tests__/`).
3. **Paseo (Surface C)** — `claude-models.ts` registry + normalizer; run the collocated
   `claude-models.test.ts` **single file only** (repo rule: never the full mobile suite).
4. **Duplicate sync** — re-copy into `apps/prism-setup/resources/plugin/`.
5. **`claude plugin validate .`** — must pass clean.
6. **`/prism:fragment-sync`** — reconcile generator conformance (B8/B9).
7. **Currency check §9** — final grep sweep; confirm no stray `claude-opus-4-8` pin left where the
   ceiling should now resolve to Opus 5.

**Do not:** edit `.prism/shared/evals/**` snapshots, historical research/docs, or add a Fable-style flag
for Opus 5.
