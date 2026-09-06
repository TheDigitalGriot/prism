---
date: 2026-09-06
researcher: Claude (Claude Code, Opus 5) — codebase-analyzer
topic: "Arkestra grafts: Weave Router (model routing) + open-connector (stateless edge, vault, multi-transport)"
tags: [arkestra, governor, model-policy, provider-axis, routing, cloudflare-workers, credential-vault, research]
status: complete
repos:
  - C:\Users\digit\GriotSandbox\xplatform-harvest\router
  - C:\Users\digit\GriotSandbox\xplatform-harvest\open-connector
---

# Arkestra grafts — source analysis

> **Documentarian only.** Everything below describes what exists in the two harvest
> repos today, with `file:line` references. The final section maps those mechanisms
> onto Arkestra's known shape (`.prism/shared/research/2026-09-06-arkestra-prism-seams.md`)
> without prescribing a rewrite of anything outside that mapping.

---

# PART A — Weave Router

Module path `weave-os/router`. Go. The routing core is a three-ring layout described at
`internal/router/AGENTS.md:5-20`: `internal/router` is I/O-free value types + the
`Router` interface; `internal/router/catalog` is the single source of truth for model
data; `internal/router/cluster` is the primary scorer (adapter tier, does FS I/O at
boot); `internal/proxy` is the dispatch/failover ring.

## A1. The routing decision — how a model is picked per request

### The interface

`router.Router` is a single method — `internal/router/router.go:383-385`:

```go
type Router interface {
    Route(ctx context.Context, req Request) (Decision, error)
}
```

`Request` (`internal/router/router.go:84-208`) is the whole signal surface. The fields
that feed the decision:

| Signal | Field | Line |
|---|---|---|
| Explicit pin | `ForceModel` | `router.go:89` |
| Cluster pin | `ForceCluster` | `router.go:99` |
| Token count | `EstimatedInputTokens` | `router.go:100` |
| Task shape | `HasTools`, `HasImages` | `router.go:110`, `router.go:113` |
| Prompt content | `PromptText` (embedded) | `router.go:121` |
| Harness identity | `ClientApp` (`claude-code`, `codex`, `cursor`, `api`) | `router.go:107` |
| Hard compat contract | `TranslationRequirements` | `router.go:117` |
| **Provider gating** | `EnabledProviders map[string]struct{}` | `router.go:145` |
| **Per-key provider aliases** | `CustomBindings map[string][]string` | `router.go:150` |
| **Gateway-exclusive mode** | `GatewayProviders map[string]struct{}` | `router.go:153` |
| Hard model deny | `ExcludedModels` (allowlist desugars into it) | `router.go:157`, `router.go:162` |
| Physical-constraint deny | `SafetyExcludedModels` | `router.go:168` |
| **Soft** deployment deny | `AutomaticExcludedModels` | `router.go:175` |
| Ranked preference | `PreferredModels []string` | `router.go:180` |
| Quality/price dial | `RoutingKnobs *Overrides` | `router.go:184` |
| Subscription headroom | `SubsidizedModelCostFactor map[string]float64` | `router.go:203` |

`Decision` is `{Provider, Model, Effort, Reason, Metadata}` —
`internal/router/router.go:260-273`. **Provider is a first-class field of the decision,
alongside Model.** `Decision.ServedIdentity()` (`router.go:279-284`) returns
`model` or `model:effort` — an effort change counts as a model switch because it
invalidates thinking-block signatures and the prompt-cache prefix.

### The algorithm (cluster scorer)

`Scorer.Route` — `internal/router/cluster/scorer.go:462-980`. Ordered stages:

1. **Embed the prompt.** `TailTruncate(req.PromptText, s.cfg.MaxPromptChars)` at
   `scorer.go:467`; the embed call is raced against `EmbedTimeout` in a goroutine
   (`scorer.go:473-497`) because hugot/ONNX cannot be cancelled. Embed failure,
   panic, or dim mismatch all return `ErrClusterUnavailable` → HTTP 503
   (`scorer.go:499-518`). There is **no fail-open default model**; the reasoning is
   recorded at `internal/router/cluster/CLAUDE.md:80` ("Don't add fail-open fallbacks…
   every request that should have hit the cluster scorer instead got
   `claude-haiku-4-5`, masking real regressions").

2. **Provider re-resolution per request** (`scorer.go:520-552`). When
   `req.EnabledProviders != nil`, every boot-time candidate is re-walked through
   `RequestBindings.resolve(model, defaultProvider, enabled)`; a model with no
   resolvable binding is dropped from the pool entirely, and the surviving
   `resolvedProvider[model]` map is what `Decision.Provider` is read from later
   (`scorer.go:916-919`). Empty pool with gateways set → `ErrGatewayServesNoDeployedModel`
   (400, `scorer.go:536-543`); empty pool otherwise → `ErrNoEligibleProvider`
   (`scorer.go:544-551`).

3. **Hard model exclusion** (`scorer.go:555-581`). Emptying the pool is a **failure**,
   not a fallback. If an allowlist caused it, the error names the allowlist
   (`ErrAllowlistEmptiesPool`, `scorer.go:565-572`).

4. **Soft filters — each falls back to the unfiltered pool rather than failing:**
   - deployment-wide automatic exclusions (`scorer.go:587-612`) — deliberately soft so
     a user's explicit pin still serves;
   - `ToolUseLow` models dropped on `HasTools` turns (`scorer.go:617-637`);
   - `AgenticLow` models dropped on `HasTools` turns (`scorer.go:645-665`) — the comment
     at `scorer.go:639-644` explains this is what lets a price dial demote Opus to a
     cheaper *harness-capable* model instead of stranding the turn on the cheapest one;
   - `ImageInputUnsupported` models dropped on `HasImages` turns (`scorer.go:671-698`).

5. **Preference bonuses** (`scorer.go:704-722`) — `PreferredModels` becomes a
   rank-decaying additive bonus; ranks are compacted over the *eligible* set so a stale
   preference is a no-op.

6. **Top-P nearest clusters** — `topPNearest(vec, s.centroids, s.cfg.TopP)`
   (`scorer.go:725`, impl `scorer.go:993`), cosine similarity on L2-normed vectors.

7. **Knob resolution + validation** (`scorer.go:730-846`). `QualityBias` (0..1 user
   dial) wins over raw `Alpha`; the dial is mapped through a per-bundle mix-change
   calibration (`dialToAlpha`, `scorer.go:310`; `computeDialCalibration`,
   `scorer.go:252`) precisely because a linear dial has a dead zone
   (`scorer.go:244-249`: "the '50% looks like 20%' bug"). `applyDialAlpha`
   (`scorer.go:337-347`) floors each cluster's alpha so a price-leaning dial cannot
   collapse the pool onto the cheapest model. Out-of-range knobs return
   `ErrInvalidRoutingKnobs` (400).

8. **The blend** — `blendScoresV2`, `internal/router/cluster/scorer.go:1128-1302`.
   Per model *m* and each top-P cluster *k*:

   ```
   cost[m]  = inputPer1K + outputCostRatio * outputPer1K * verbosityFactor   (:1150)
   speed[m] = ttftSeconds + expectedOutputTokens / tps                        (:1158)

   qNorm = (quality[k][m] - qMin[k]) / (qMax[k] - qMin[k])                    (:1254)
   cNorm = (cost[m] - cMin) / (cMax - cMin)                                   (:1260)
   sNorm = (speed[m] - sMin) / (sMax - sMin)   // 1.0 when untimed            (:1268-1270)

   wQ = alpha[k];  wS = speedWeight;  wC = 1 - wQ - wS                        (:1241-1246)
   score[m] += wQ*qNorm + wC*(1 - cNorm) + wS*(1 - sNorm)                     (:1272)
   ```

   When no timing data differentiates the pool, `wS` is redistributed into `wQ`/`wC`
   so the weights still sum to 1 (`scorer.go:1276-1283`). Two additive bonuses ride
   on top: the subscription-subsidy lift `subsidyMaxBonus * (1 - f)`
   (`scorer.go:1290-1292`, constant documented `scorer.go:1095-1101`) and the
   per-installation preference bonus (`scorer.go:1296-1298`,
   `priorityBonusFor` at `scorer.go:1117`, base/decay at `scorer.go:1103-1113`).
   Normalization min/max are computed over the **deployed** model set, not the eligible
   subset (`scorer.go:1165-1235`).

9. **Argmax + runner-up** (`scorer.go:862`, `argmax` at `scorer.go:1025`,
   `runnerUp` at `scorer.go:1047`). Ties break by pool order. The runner-up is carried
   in `Decision.Metadata.PairedModel` so a later per-turn policy can swap without
   re-scoring (`router.go:350-357`).

10. **Decision assembly** (`scorer.go:933-956`) — records `CandidateScores`,
    `CandidateProviders` (per-model resolved provider for this request),
    `Propensity: 1.0` (deterministic argmax; an exploration wrapper overwrites it),
    and the paired band.

**Cost values used in the blend are baked at training time**, not looked up per request
(`internal/router/cluster/CLAUDE.md:68-70`) — they live in
`train_cluster_router.py`'s `DEFAULT_COST_PER_1K_INPUT` and are frozen into
`rankings.json`.

## A2. The provider abstraction — the key lift

### Provider is a string constant + three parallel maps

`internal/providers/provider.go:49-75` declares every provider as a bare string:
`anthropic`, `openai`, `google`, `openrouter`, `fireworks`, `bedrock`, `makora`,
`minimax`, `together`, `xai`, `meta`, `wafer`, `wafer_anthropic`, `anthropic_gateway`,
`openai_gateway`.

The comment at `provider.go:44-48` states the contract explicitly:

> "Adding a provider is a THREE-map edit: the `Provider*` constant here, its
> `APIKeyEnvVars` entry, and its `ProviderFamilies` entry. Omitting the family entry
> makes dispatch fall through to `ErrProviderNotConfigured` — a silent 502 even though
> the provider looked 'enabled' at boot. `ValidateDispatchable` and the table test catch
> this at boot instead of in production."

The three maps:

| Map | Line | Purpose |
|---|---|---|
| `ProviderFamilies` | `provider.go:101-118` | provider → `TranslationFamily` (`FamilyAnthropic` / `FamilyOpenAICompat` / `FamilyGemini`) |
| `APIKeyEnvVars` | `provider.go:182-201` | provider → env var holding the deployment key |
| `CacheTTL` | `provider.go:228-243` | provider → best-effort prompt-cache lifetime |

`TranslationFamily` (`provider.go:81-97`) is the wire-format axis, deliberately
separate from the provider name so a new OpenAI-compatible upstream routes correctly
as soon as it gets a families entry. Helpers: `FamilyFor` (`:122`), `IsOpenAICompat`
(`:128`), `IsGateway` (`:135`), `SupportsAnthropicServerTools` (`:148` — speaking the
Anthropic wire format is *not* the same as executing Anthropic server tools),
`AllProviders` (`:154`), `ValidateDispatchable` (`:166-178`, called at boot; the
composition root panics on error).

`baseURLRequiredProviders` (`provider.go:211-214`) marks the two gateway providers as
undispatchable without a tenant endpoint; `RequiresBaseURL` at `:218`.

The dispatch interface itself is two methods —
`providers.Client`, `internal/providers/provider.go:707-713`.

### A model owns an ORDERED list of provider bindings

This is the shape Arkestra lacks. `internal/router/catalog/catalog.go:109-126`:

```go
type ProviderBinding struct {
    Provider      string   // one of the providers.Provider* constants
    UpstreamID    string   // upstream's own ID; empty = same as Model.ID
    Price         Pricing  // per-binding pricing
    FastPrice     Pricing  // provider's paid fast tier; zero = none
    ContextWindow int      // per-binding override; zero = inherit
}
```

and `Model` at `catalog.go:166-196`:

```go
type Model struct {
    ID             string           // public slash-form or bare ID
    Tier           Tier             // Low / Mid / High; TierUnknown = NOT a routing target
    HMMTarget      bool
    ContextWindow  int
    ToolUseQuality ToolUseQuality   // ToolUseLow => dropped from agentic argmax
    AgenticUse     AgenticUse       // AgenticLow  => dropped from has_tools turns
    ImageInput     ImageInput       // ImageInputUnsupported => dropped from image turns
    ThinkTagReasoning bool
    Providers      []ProviderBinding // ORDERED fallback list; must be non-empty
}
```

`Model.PrimaryProvider()` (`catalog.go:201-206`) is the first binding's provider.

A concrete multi-binding row, `catalog.go:281-285`:

```go
{ID: "claude-opus-5", Tier: TierHigh, ContextWindow: 1_000_000, Providers: []ProviderBinding{
    {Provider: providers.ProviderAnthropic,        Price: {5.00, 25.00, CacheReadMultiplier: 0.10}, FastPrice: {10.00, 50.00}},
    {Provider: providers.ProviderAnthropicGateway, Price: {5.00, 25.00, CacheReadMultiplier: 0.10}},
    {Provider: providers.ProviderOpenAIGateway,    Price: {5.00, 25.00}},
}},
```

Binding order is load-bearing and documented at `catalog.go:216-219`: the Anthropic
binding is first because "thinking blocks and cache_control survive natively;
Chat Completions loses them in translation."

**A model with `Tier: TierUnknown` is priced but not routable** — `catalog.go:171-173`
and `RoutingTargetSet` at `internal/router/catalog/lookup.go:167-179`. This is how
retired models (`claude-opus-4-8` at `catalog.go:276`, `claude-fable-5` at
`catalog.go:290`) stay billable for explicit pins without ever being auto-selected.

### Request → (provider, model) resolution

Four resolution functions, `internal/router/catalog/lookup.go`:

| Function | Line | Behavior |
|---|---|---|
| `ResolveBinding(id, available)` | `lookup.go:37-48` | first binding whose `Provider` ∈ available |
| `ResolveBindingWithCustom(id, available, custom)` | `lookup.go:53-70` | as above, then falls back to key-declared providers; synthesized binding **inherits primary pricing** (`:66-68`) |
| `EnumerateBindings(id, available)` | `lookup.go:150-162` | every enabled binding in stable catalog order, each carrying its `Index` |
| `AvailableBindings(id, available)` | `lookup.go:134-141` | the ordered list the proxy failover loop walks; "index 0 is primary, indexes >0 are ordered fallbacks" |

`customProvidersFor` (`lookup.go:84-107`) skips any provider the catalog already binds,
so a model never resolves to the same provider twice.

In the scorer, the equivalent per-request walk is `resolveProviderFor`
(`cluster/scorer.go:355`), `resolveProviderWithCustom` (`:362` — custom bindings rank
*after* every catalog binding), and `resolveGatewayProvider` (`:383` — catalog vendor
bindings are **not consulted** at all in gateway-exclusive mode). The rule is spelled
out at `cluster/CLAUDE.md:78`.

### The roster/arm form: provider/model[:effort]

The HMM sidecar addresses models by a prefixed roster ID.
`internal/router/hmm/mapping.go:29-45`:

```go
func rosterIDFor(m catalog.Model) string {
    if alias, ok := rosterAliases[m.ID]; ok { return alias }
    if strings.Contains(m.ID, "/") { return m.ID }
    switch m.PrimaryProvider() {
    case providers.ProviderAnthropic: return "anthropic/" + m.ID
    case providers.ProviderOpenAI:    return "openai/" + m.ID
    case providers.ProviderGoogle:    return "google/" + m.ID
    }
    return ""
}
```

Note the explicit `return ""` for unmapped providers — an unprefixable model is simply
**not roster-addressable**, rather than silently defaulting to a provider
(`mapping.go:19-26` explains why bare xAI/Meta IDs require an explicit alias: "a bare ID
whose primary provider is a hosting platform would be ambiguous").

Effort rides as a `:suffix` — `SplitEffort` at `mapping.go:48-59`, `EffortArm` at
`mapping.go:62-67`, reverse lookup `CatalogIDForRoster` at `mapping.go:72-80`. The
effort ladder itself is `internal/router/effort.go:5-73`:
`low < medium < high < max < xhigh`, with `CanonicalizeEffort` folding aliases
(`fast|minimal|min` to `low`, `ultra` to `xhigh`) and `HigherEffort` picking the higher
rung (an unrecognized level loses to a recognized one, `effort.go:33-46`).

### Arm identity — the fully-qualified dispatch key

`internal/router/policy/arm.go:15-23`. The most complete "what am I actually
dispatching" identity in the repo:

```go
type ArmIdentity struct {
    CanonicalModel               string
    Endpoint                     string
    ModelRevision                string
    Provider                     string
    ReasoningConfigurationSHA256 string
    ToolConfigurationSHA256      string
    UpstreamID                   string
}
```

`MakeArmID` (`arm.go:34-41`) hashes the JSON to `tq_arm_<sha256>`, deterministic across
languages. The resolver emits one candidate **per (model, binding)** pair —
`internal/router/policy/resolver.go:498-523` — each carrying `Provider`, `UpstreamID`,
`BindingIndex`, per-binding pricing, and a `CandidateCapabilities` block
(`resolver.go:517-522`) with `ContextWindow`, `Tier`, `SupportsTools`, `SupportsImages`.
Provider policy is applied as a filter over the provider set —
`Resolver.allowedProviders` at `resolver.go:544-552`.

Exclusion reasons are enumerated rather than silent: `ExclusionUnmappedRoster`
(`resolver.go:304`), `ExclusionContextWindow` (`:309`), `ExclusionGatewayNotServed`
(`:316`), `ExclusionNoProvider` vs `ExclusionProviderPolicy` (`:337-341`, distinguished
by re-running the enumeration without the policy filter).

## A3. Fallback / failover — the chain and its terminations

Four distinct rescue tiers, tried in order, all inside `internal/proxy`.

### Tier 1 — same-binding retry (same provider, same model)

`internal/proxy/fallback.go:230-336`. Bounded by three things simultaneously
(`fallback.go:380-391`): `maxSameBindingRetries = 2`, exponential backoff from
`sameBindingBackoffBase = 250ms` (`sameBindingBackoff`, `:404-406`), and a wall-clock
`sameBindingRetryBudget = 10s` — the comment at `:387-390` notes count alone does not
bound cost because a hung upstream burns a full `ResponseHeaderTimeout` per attempt.

Same-binding retry is skipped entirely when another binding exists —
`fallback.go:304`: the break condition is
`!providers.IsRetryable(attemptErr) || sb >= maxSameBindingRetries || len(in.bindings) > 1`,
commented "cross-binding failover beats re-hitting the same flaky provider."

### Tier 2 — cross-binding failover (same model, next provider)

`dispatchWithFallback` — `internal/proxy/fallback.go:177-369`. Walks `in.bindings` in
catalog order. Per attempt:

- credentials are re-resolved against an **empty header set** for `i > 0`
  (`fallback.go:198-206`) — only the deployment env key is left, by construction;
- the response prelude is buffered so a retry is invisible to the client
  (`preludeBuffer`, `fallback.go:28-78`); `Committed()` is the retry gate
  (`fallback.go:275-277` — once bytes reach the client the attempt error is final);
- response headers advertise the walk: `x-router-provider`, `x-router-model`,
  `x-router-context-window`, and on `i > 0` `x-router-fallback-from` +
  `x-router-fallback-attempt` (`fallback.go:234-242`);
- a provider eligible at boot but missing at runtime is treated as a retryable
  transport error and skipped (`fallback.go:210-222`);
- a 404 memoizes "this gateway lacks this model" so later turns skip the alias
  (`fallback.go:340-342`).

Failover eligibility class (`fallback.go:346-348`):

```go
canFailover := providers.IsRetryable(attemptErr) ||
    providers.IsUpstreamModelNotFound(attemptErr) ||       // 404: same binding futile, another may serve
    providers.IsUpstreamProviderBillingBlocked(attemptErr) // 402
```

`IsRetryable` (`internal/providers/provider.go:363-393`): response-header timeout is
true; the three stall sentinels (`ErrUpstreamIdleTimeout`, `ErrUpstreamOutputStall`,
`ErrUpstreamSlowThroughput`) are true, checked **before** the cancellation guard because
the watchdog surfaces them by cancelling the context; caller-side `context.Canceled` /
`DeadlineExceeded` are **false** (not the upstream fault); buffered upstream error goes
to `IsRetryableStatus` (`:351-358` — 408, 429, 5xx); already-flushed status error is
false; anything else is true.

Termination (`fallback.go:349-359`): the loop ends when the binding is a managed
subscription binding, the error is not failable, or `i == len(bindings)-1`. On
termination it discards the buffer and flushes the upstream own error envelope to the
client — unless `deferFlushOnExhaustion` is set, which hands ownership to a higher tier.

Failover is disabled wholesale for customer-supplied credentials — `shouldFailover`,
`fallback.go:427-438`: BYOK-only mode, an inbound credential in context, or any external
key present. The reason (`fallback.go:422-426`): "customer credentials bind to a single
provider — retrying elsewhere would 401 unexpectedly."

The binding list is built by `resolveBindingsForDispatch` (`fallback.go:443-490`):
single-element `[primary]` when failover is off or the deploy is in legacy
"all registered" mode; otherwise `EnumerateBindings(model, available)` with installation
provider exclusions applied *during* failover too (`:454-465`) so a fallback cannot
resurrect a provider the scorer already filtered out. If the decision names an excluded
provider and no other binding exists, it returns `nil` so dispatch 502s rather than
reaching the forbidden provider (`:472-478`).

### Tier 3 — sibling failover (different model, same turn)

`internal/proxy/sibling_failover.go:19-65`. When every binding of the routed model is
dark, it walks `siblingCandidateOrder(md)` (`:141-146` — the policy own scored
`CandidateModels`, with the pin `PairedModel` last so replayed pins still have somewhere
to go) and takes the first candidate that:

- is not the failed model, not in `excludedModels`, not in `automaticExcluded`
  (`:38-46` — "a disabled model must not be resurrected here after the pool already
  excluded it");
- resolves to a provider under the available set (`siblingProvider`, `:150`);
- fits the context window under the same dual-estimator as the pre-route overflow
  filter (`siblingFitsContext`, `:126`).

Candidates on the failed provider are ranked **last** (`:55-58`, `:61-63`) — a
cross-provider sibling is preferred over a same-provider one.

`siblingDecisionFor` (`:168`) drops the arm selection and the effort when rebasing
(`:163-167`): the effort "was chosen against the failed model menu, and keeping it would
persist an identity the candidate never served."

`gatewaySiblingDecision` (`:72`) is the BYOK carve-out: BYOK normally disables failover,
but a sibling reachable through a gateway key the request *already holds* uses the same
credentials, so it stays eligible (`gatewaySiblingAllowed`, `:110`).

### Tier 4 — baseline failover (the floor)

`internal/proxy/service.go:3904-3927`. The floor model is a single configured constant:
`WithDefaultBaselineModel` (`service.go:1900-1902`), read by `baselineFor`
(`service.go:1916-1922`), defaulting from `ROUTER_DEFAULT_BASELINE_MODEL`
(`.env.example:143`, value `claude-sonnet-4-5`).

Eligibility is an explicit conjunction (`service.go:3919-3927`):

```go
baselineViable := !agentShadowMode &&
    decision.Reason != translate.ReasonUserForceModel &&   // never override an explicit pin
    s.shouldFailover(ctx) &&                               // not BYOK / inbound-credential
    !anthropicExcluded &&                                  // exclusion contract holds
    baselineAllowed &&                                     // allowlist + request subset
    decision.Provider != providers.ProviderAnthropic &&    // only rescue FROM non-Anthropic
    baselineModel != decision.Model &&
    baselineKnown && baselineCatalog.PrimaryProvider() == providers.ProviderAnthropic
baselineEligible := !routeRes.AuthoritativePerTurn && baselineViable
```

Two things to note for the graft: (a) the floor is explicitly asserted to be an
Anthropic-primary catalog model before it is used, and (b) `decision.Provider != ProviderAnthropic`
is a guard, i.e. this rescue only fires *toward* Anthropic and only *from* a
non-Anthropic provider. It is the documented cross-provider escape hatch, and it is
gated on the installation not having excluded Anthropic.

A parallel tier, `subscriptionRetryEligible` (`service.go:3947-3951`), retries the same
model on a non-subscription Anthropic key when a subscription-pinned turn 429s; it is
**mutually exclusive** with `baselineEligible` and suppressed in subscription-only mode.

The deferred error is flushed exactly once — `flushDeferredErr`,
`service.go:3992-3999`: "each rescue hands ownership to the next, and whichever declines
to run flushes."

### The no-fallback invariant in the scorer

`internal/router/cluster/CLAUDE.md:80` and the error sentinels at
`cluster/scorer.go:18-31`: every scorer failure path returns `ErrClusterUnavailable`
(503), `ErrNoEligibleProvider` (4xx), `ErrAllowlistEmptiesPool`, or
`ErrInvalidRoutingKnobs`. The routing *decision* never degrades silently; only the
*dispatch* has rescue tiers. `internal/router/AGENTS.md:29` states the rule:
"Failure modes return errors, not silent fallbacks."

## A4. Cost accounting

### Representation

`Pricing` — `internal/router/catalog/catalog.go:40-53`: `InputUSDPer1M`,
`OutputUSDPer1M`, `CacheWriteMultiplier`, `CacheReadMultiplier`,
`LongContext *LongContextPricing`. Defaults when a multiplier is unset:
`DefaultCacheReadMultiplier = 0.5` (`catalog.go:67`, "high enough to not treat unknown
providers as free caching, low enough to not block switches"),
`DefaultCacheWriteMultiplier = 1.25` (`catalog.go:71`). Accessors
`EffectiveCacheReadMultiplier` (`:75`) / `EffectiveCacheWriteMultiplier` (`:84`).

`LongContextPricing` (`catalog.go:56-62`) is a threshold-tiered rate; `ForInputTokens`
(`catalog.go:93-104`) swaps in the long-context rates above the threshold.

Pricing is **per-binding, not per-model** — each `ProviderBinding` carries its own
`Price` (`catalog.go:116`), so the same logical model is priced differently per provider.
`FastPrice` (`catalog.go:122`) is a separate post-dispatch billing rate; the routing
score uses `Price` only — stated at `catalog/CLAUDE.md:10`.

### Cost math — one funnel

`internal/router/catalog/cost.go`:

- `EffectiveInputCost(inputTokens, cacheCreation, cacheRead, p, upstreamProvider)`
  (`cost.go:18-30`). The provider argument exists for one reason, documented at
  `cost.go:11-14`: Anthropic `input_tokens` is fresh-only, whereas OpenAI/Gemini
  `prompt_tokens` **includes** cached tokens and must be subtracted (`cost.go:21-23`).
- `EffectiveOutputCost` (`cost.go:34-37`) — straight tokens times per-1M, no cache
  multipliers.
- `USDToMicros` (`cost.go:46-51`) — NaN/Inf/negative collapse to 0.
- `SignedUSDToMicros` (`cost.go:55-60`) — same without the negative clamp, for signed
  planner EV terms.

`catalog/CLAUDE.md:15` names these the single funnel for "the OTel emitter, telemetry
write path, and billing debit hook", and `catalog/CLAUDE.md:42` forbids a parallel price
table: "A second price table guarantees drift."

### Cost in the decision

Two consumers use pricing two different ways:

- **Scorer**: cost is baked into the bundle `modelAxes` (`InputPer1KUSD`,
  `OutputPer1KUSD`, `VerbosityTokens`) and blended at `scorer.go:1150` — a *normalized*
  axis, not dollars.
- **Planner / resolver**: real dollars. `catalog.PriceFor(provider, id)` is used so
  STAY-vs-SWITCH EV math is correct when a model is served by different providers at
  different prices (`catalog/CLAUDE.md:29`). The resolver attaches `InputUSDPer1M`,
  `OutputUSDPer1M`, `EstimatedCostUSD`, `CacheReadMultiplier`, `MarginalCostFactor`, and
  the three `Effective*` variants to each candidate (`policy/resolver.go:509-516`).

Prices are compile-time data. `cmd/genprices` regenerates `install/install.sh` and
`install/cc-statusline.sh` from the catalog (`catalog/CLAUDE.md:21`), and
`catalog/CLAUDE.md:43` forbids a runtime mutation API: "per-deploy filtering happens
through `ResolveBinding(id, available)`, not by mutating `Models`."

## A5. Config shape — where the roster lives

Four layers, each with a different lifecycle:

| Layer | Location | Schema | Changes by |
|---|---|---|---|
| Model roster (pricing, bindings, tier, capability flags) | `internal/router/catalog/catalog.go:214-728` (`var Models`) | Go struct literals | code edit + `go run ./cmd/genprices` |
| Routing membership (which models the policy may choose) | `internal/router/cluster/artifacts/v<X.Y>/model_registry.json` | JSON `{meta, deployed_models[]}` | training run |
| Served bundle version | `internal/router/cluster/artifacts/latest` (one line, currently `v0.75`) | plain text | one-line edit + redeploy |
| Deployment enablement | env vars | `PROVIDER_API_KEY` presence | ops |

`model_registry.json` entry shape (`artifacts/v0.75/model_registry.json`):

```json
{ "model": "claude-haiku-4-5", "provider": "anthropic",
  "bench_column": "routerarena_claude-haiku-4-5", "direct_label": "routerarena",
  "extra_bench_columns": ["swebench_anthropic/claude-haiku-4-5"] }
```

Bundle rules: `artifacts/latest` is the single source of truth for the default served
version (`cluster/CLAUDE.md:26-28`, `:83`); versions are write-once
(`cluster/CLAUDE.md:36-38`, `:82`); `model_registry.json` is the only hand-editable file
in a bundle; `metadata.yaml` is informational and does not affect routing
(`cluster/CLAUDE.md:40-42`).

The HMM sidecar roster is a separate declarative file, validated by
`cmd/validate-roster`. Schema (`cmd/validate-roster/testdata/roster_valid.json`):

```json
{ "clusters": {
    "balanced": { "arms": ["openai/gpt-5.6-sol", "anthropic/claude-opus-4.8"] },
    "high":     { "arms": ["anthropic/claude-opus-4.8", "x-ai/grok-4.5", "openai/gpt-5.6-sol:high"] } } }
```

— cluster label to an ordered list of `provider/model[:effort]` arms, index 0 = highest
priority. The same shape appears per-API-key as
`Request.ClusterArmOverrides map[string][]string` (`internal/router/router.go:204-207`).

`internal/router/hmm/roster.go:9-16` records that the old silent-drop mapping
(`DeployedModelsForRosterIDs`) is deprecated in favor of fail-loud validation
(`rosterdata.Load` / `ValidateRosterIDs`) because "silent-drop let inert roster arms skew
production routing."

Env-var layer, `.env.example`: per-provider keys (`:33` `OPENROUTER_API_KEY`, and the
`APIKeyEnvVars` set at `providers/provider.go:182-201`), `ROUTER_CLUSTER_VERSION` (`:99`,
overrides `artifacts/latest`), `ROUTER_CLUSTER_EMBED_TIMEOUT_MS`,
`ROUTER_DEFAULT_BASELINE_MODEL` (`:143`), `ROUTER_SESSION_PIN_ENABLED`,
`ROUTER_STICKY_DECISION_TTL_MS`, plus `ROUTER_SIBLING_FAILOVER` (kill switch, read at
`internal/proxy/flag_resolution.go:99-101`, default on per
`internal/proxy/service.go:206-209`).

---

# PART B — open-connector

`@oomol-lab/open-connector` v1.5.0 (`package.json:2-3`). TypeScript, Hono, Zod: one core
with several transports. About 5,800 files under `src/`, the vast majority being
generated per-provider action/definition/executor triples under `src/providers/`.

## B1. Cloudflare Workers deployment + statelessness

### The Worker entry

`src/server/cloudflare.ts:38-51` is the entire fetch handler:

```ts
export default {
  async fetch(request, env, _ctx) {
    setPrivateNetworkAccessAllowed(parsePrivateNetworkAccessFlag(env.OOMOL_CONNECT_ALLOW_PRIVATE_NETWORK));
    setEgressTrustedHosts(parseEgressTrustedHosts(env.OOMOL_CONNECT_EGRESS_TRUSTED_HOSTS));
    const publicOrigin = resolvePublicOrigin(request, env);
    const { app } = await appCache.get(createCacheKey(env, publicOrigin), () => createCloudflareApp(env, publicOrigin));
    const response = await app.fetch(request, env);
    if (response.status === 404 && env.ASSETS && shouldServeAsset(request)) return env.ASSETS.fetch(request);
    return response;
  },
};
```

### How statelessness is achieved

1. **All mutable state lives in bindings, never in the isolate.**
   `wrangler.example.jsonc` declares `DB` (D1), `TRANSIT_FILES` (R2 *or* KV — "enable
   EXACTLY ONE"), and `ASSETS`. The Worker constructs
   `new D1RuntimeDatabase(env.DB, {...})` per app (`cloudflare.ts:66-69`) and picks the
   transit-file backend off `env.TRANSIT_FILES_BACKEND` (`cloudflare.ts:76-85`).

2. **What is cached in the isolate is keyed by its own inputs.** Three `PromiseCache`
   instances at module scope (`cloudflare.ts:34-36`): `catalogCache`, `secretCodecCache`,
   `appCache`. The app cache key (`createCacheKey`, `cloudflare.ts:143-158`) is a JSON
   digest of every env-derived input — publicOrigin, admin/runtime tokens, encryption
   key, all four action/proxy policy lists, the custom-OAuth allowlist, transit
   TTL/max-bytes, run limit. Change any of them and a different app instance is built.
   The catalog is cached under a **constant key** with the reason stated at
   `cloudflare.ts:130-131`: "The catalog depends only on the assets binding, which is
   fixed for the isolate, so one slot under a constant key covers every request." The
   secret codec is keyed by the encryption key itself (`cloudflare.ts:139-141`).

3. **Module graph is warmed at app creation, not first request.**
   `await preloadOptionalServerModules()` at `cloudflare.ts:61`, with the rationale at
   `:58-60`: Node defers MCP/docs modules to keep startup small; Workers pay it up front
   "so the first /mcp or /docs request of an isolate is served the same way as every
   later one." An `eager-imports.test.ts` guards this.

4. **Request-scoped globals are re-set on every fetch** —
   `setPrivateNetworkAccessAllowed` / `setEgressTrustedHosts` at `cloudflare.ts:40-41`,
   before anything else runs.

5. **Platform quirks are handled at the composition root, not in the core.**
   `compressApiResponses: false` (`cloudflare.ts:107`) with a nine-line comment
   (`:99-107`) explaining that Cloudflare `encodeBody: "automatic"` re-encodes a body
   Hono `compress()` already gzipped, producing gzip-in-gzip. Logging is likewise swapped
   for a `console.*`-backed shim (`workerLogger`, `cloudflare.ts:111-127`).

6. **Static-asset fallthrough** is a post-404 decision (`cloudflare.ts:45-47`), and
   `run_worker_first` in `wrangler.example.jsonc` lists exactly the API paths that must
   never be served as assets: `/api/*`, `/v1/*`, `/mcp*`, `/oauth/*`, `/docs`, `/docs/*`,
   `/openapi.json`, `/health`.

The same `createConnectApp` is used by the Node entry (`src/server/index.ts`), the single
binary (`scripts/build-binary.ts`), and Helm/Docker deploys
(`deploy/helm/open-connector/`, `fly.toml`) — the Worker is one composition root among
several, not a fork.

## B2. The credential vault

### The codec interface

`src/server/secrets/secret-codec-core.ts:1-5`:

```ts
export interface ISecretCodec {
  readonly encrypted: boolean;
  encode(plaintext: string): Promise<string>;
  decode(stored: string): Promise<string>;
}
```

`PlainTextSecretCodec` (`secret-codec-core.ts:7-17`) is the identity implementation used
when no encryption key is configured.

### Two implementations, one interface, versioned prefixes

| Impl | File | Prefix | KDF | Cipher |
|---|---|---|---|---|
| `AesGcmSecretCodec` (Node) | `src/server/secrets/secret-codec.ts:12-52` | `enc:v1:` (`:9`) | `scryptSync(passphrase, "oomol-connect-local-secret-store-v1", 32)` (`:20`) | `aes-256-gcm`, 12-byte random IV, auth tag stored separately (`:23-36`) |
| `WorkerAesGcmSecretCodec` (WebCrypto) | `src/server/secrets/worker-secret-codec.ts:12-69` | `enc:worker:v1:` (`:5`) | PBKDF2-SHA256, 100000 iterations, salt `oomol-connect-worker-secret-store-v1` (`:26-38`) | AES-GCM 256, 12-byte IV from `crypto.getRandomValues` (`:43-49`) |

Node stored form: `enc:v1:<iv_b64url>.<tag_b64url>.<ciphertext_b64url>`
(`secret-codec.ts:28-35`). Worker stored form:
`enc:worker:v1:<iv_b64url>.<ciphertext_b64url>` (`worker-secret-codec.ts:49`) — the GCM
tag is appended by WebCrypto rather than split out.

Both `decode` implementations pass through unprefixed input unchanged
(`secret-codec.ts:39-41`, `worker-secret-codec.ts:53-55`) — that is the migration path
from a plaintext store. Both throw on a malformed prefixed payload
(`secret-codec.ts:44-46`, `worker-secret-codec.ts:58-60`). Both constructors reject an
empty/whitespace passphrase (`secret-codec.ts:17-19`, `worker-secret-codec.ts:22-24`).

Selection is a one-liner: `createSecretCodec(encryptionKey)` returns the AES codec when a
key is present, otherwise plaintext (`secret-codec.ts:54-56`; `createWorkerSecretCodec`,
`worker-secret-codec.ts:8-10`).

### Where the codec is applied

The codec is injected once into the runtime database and threaded to every store that
holds a secret — `src/server/storage/d1-runtime-store.ts:56-63`:

```ts
const secretCodec = options.secretCodec ?? new PlainTextSecretCodec();
this.connectionStore        = new D1ConnectionStore(database, secretCodec);
this.oauthClientConfigStore = new D1OAuthClientConfigStore(database, secretCodec);
this.oauthStateStore        = new D1OAuthStateStore(database, secretCodec);
this.idempotencyStore       = new D1IdempotencyStore(database, secretCodec);
```

The pattern at every call site is encrypt the whole JSON document, store one opaque
column — not per-field encryption:

- connections write `await this.secretCodec.encode(JSON.stringify(credential))`
  (`d1-runtime-store.ts:158`, `:183`) and read
  `parseJson<ResolvedCredential>(await this.secretCodec.decode(readString(row, "value")))`
  (`:135`, `:213`);
- OAuth client configs: encode `:241`, decode `:229` / `:254`;
- OAuth authorization state (the in-flight `state` parameter): encode `:281`, decode `:291`;
- idempotency responses: encode `:474`, decode `:456`.

A shared helper `getSecretJson(database, secretCodec, table, key)` sits at
`d1-runtime-store.ts:568-573`.

`ISecretCodec.encrypted` is also used as a **capability gate**, not just a flag:
`src/server/connect-app.ts:61` makes custom OAuth client configs available only when
`options.secretCodec.encrypted && isCustomClientConfigAllowed(service)` — a runtime with
no encryption key cannot accept a user-supplied OAuth client secret at all.

### Per-request retrieval and refresh

`ConnectionService.getCredential(service, connectionName)` —
`src/connection-service.ts:266-281`: read the store, and if the stored credential is
`authType === "oauth2"`, run it through `resolveOAuthCredential` before returning.

`resolveOAuthCredential` — `src/connection-service.ts:602-640`:

1. not expired: return as-is (`:607-609`);
2. expired with no refresh token: `ConnectionError("oauth_token_expired", ...)` (`:611-616`);
3. expired but the runtime has no refresher: `ConnectionError("oauth_refresh_unavailable", ...)` (`:618-623`);
4. otherwise de-duplicate concurrent refreshes on the key `connection.id + ":" + connection.revision`
   (`:625-639`) — an in-flight refresh promise is returned to later callers, and the map
   entry is cleared in `finally` only if it is still the same promise.

`refreshOAuthCredential` (`:642-663`) performs the refresh, then writes back through
`store.updateCredential({id, revision, ...})` — an optimistic-concurrency write keyed on
the revision. A lost race returns
`ConnectionError("connection_not_found", "...connection changed while its OAuth credential was refreshing. Retry the action.")`
(`:656-661`).

Per-request scoping is `forConnection(connectionName)` —
`src/connection-service.ts:292-304`. It returns a narrow
`Pick<ConnectionService, "getCredential">` whose map caches the **promise**, not the
value; the doc comment at `:283-291` explains both halves: a provider that asks twice
(credential-derived base URL plus auth header) costs one store read and one refresh
check, and caching the promise "replays a rejection identically instead of retrying it."

## B3. The gateway surface — one core, several transports

### The core

`createConnectApp(options)` — `src/server/connect-app.ts:45-120` — is the single
composition function. It builds, in order: `MarketplaceService` (`:46-51`),
`RuntimeTokenService` (`:52`), `OAuthClientConfigService` (`:57-62`), `ConnectionService`
(`:63-70`), `ActionRunner` (`:71-79`), then hands them to
`new ConnectServer({...}).createApp()` (`:82-114`) and returns
`{ app: Hono, runtimeAuthConfigured: boolean }` (`:40-43`, `:115-118`).

`ConnectAppOptions` (`connect-app.ts:21-38`) is where every host-specific difference is
parameterized: `runtimeDatabase`, `transitFiles`, `uploadTransitFile`, `publicOrigin`,
`secretCodec`, `adminToken`, `runtimeToken`, `verifyRuntimeJwt`, `actionPolicy`,
`registerStaticRoutes`, `logger`, `computeRuntimeAuthConfigured`, `compressApiResponses`.
The Cloudflare root fills all of them from `env` (`cloudflare.ts:63-108`); the Node root
fills them from process env plus the local filesystem (`src/server/index.ts`).

### The transports

All routes are registered in one place — `ConnectServer.createApp`,
`src/server/connect-server.ts:159-261`:

| Surface | Routes | Line |
|---|---|---|
| Health | `GET /health`, `GET /v1/health` | `:172`, `:193` |
| Runtime HTTP API (`/v1`, for SDK + CLI) | `GET /v1/providers`, `/v1/actions`, `/v1/actions/search`, `/v1/actions/:actionId`, `POST /v1/actions/:actionId`, `GET /v1/apps`, `/v1/apps/authenticated`, `/v1/apps/services/:service`, `POST /v1/proxy/:service` | `:194-204` |
| MCP | `POST /mcp`, `GET /mcp` (reject), `DELETE /mcp` (reject), `GET /mcp/tools` | `:256-259` |
| OpenAPI + docs | `GET /openapi.json`, `GET /docs` (lazy handler) | `:206-213` |
| Console API (`/api`) | providers, actions, `agent.md` renders, connections, runs, files, runtime-tokens, runtime-policy, oauth configs/authorizations | `:219-254` |
| OAuth callback | `GET /oauth/callback` | `:255` |
| Static/SPA | `registerStaticRoutes?.(app)` hook | `:261` |

Middleware order: a global `use("*")` context hook (`:159`), then `compress()` scoped to
`/api/*` and only when enabled (`:178`), then `createLocalAuthMiddleware(auth)` on `*`
(`:180`). Errors funnel through one `app.onError` that renders `/v1/` paths in the
runtime failure envelope and everything else in the console envelope (`:262-268`).

### MCP is a stateless projection of the same services

`src/mcp.ts:171-178`:

```ts
/** Serve one Streamable HTTP MCP request statelessly: a fresh server per request, JSON responses, closed afterwards. */
export async function handleMcpRequest(request, options) {
  const handler = createMcpHandler(() => createMcpServer(options), { legacy: "stateless", responseMode: "json" });
  try { return await handler.fetch(request); } finally { await handler.close(); }
}
```

`IMcpServerOptions` (`mcp.ts:20-28`) takes the same objects the HTTP routes use —
`catalog`, `connections`, `actions`, `actionSearch`, `getPolicySnapshot()`,
`runtimeGrant`, `signal`. The HTTP handler is a ten-line adapter:
`ConnectServer.handleMcp`, `connect-server.ts:822-833`, which lazily imports the MCP
module and passes `context.req.raw` plus `readRuntimeGrant(context)` and
`context.req.raw.signal`.

Tool definitions live in one object, `mcpToolConfigs` (`mcp.ts:59` onward), described at
`mcp.ts:56-58` as "Tool configs passed straight to `registerTool`, and the single source
the `/mcp/tools` preview projects its summaries from" — so the HTTP preview at
`connect-server.ts:259` cannot drift from the registered tools.

Policy is enforced inside the MCP tools, not only at the HTTP edge: `listConnections`
(`mcp.ts:180-197`) fetches a policy snapshot first, fails closed with
`errorPayload("internal_error", "Runtime policy is unavailable.")` if it cannot
(`mcp.ts:184-186`), and filters connections through
`connection.authType === "no_auth" || policy.evaluateConnection(connection.id).allowed`
(`mcp.ts:193`).

### The outer transports

Per `README.md:78-80` these are separate published artifacts speaking to `/v1`:

- **Connector SDK** (`oomol-lab/connector-sdk`) — "thin TypeScript HTTP client";
- **oo CLI** (`oomol-lab/oo-cli`) — "local agent relay for connector Actions";
- **MCP** — `http://localhost:3000/mcp` for agent hosts.

`README.md:112` renders the topology as `Agent -->|"SDK / CLI / MCP / HTTP"| Gateway`.
Worked examples for each transport live in `examples/local-http/` (raw HTTP client plus
six provider samples), `examples/mcp-client/list-tools.ts`, and `examples/openai-tools/`
(MCP tools projected into OpenAI tool-calling).

Auth for the runtime tier is layered: static `runtimeToken`, DB-stored runtime tokens via
`RuntimeTokenService.resolveToken`, and an optional JWT verifier — all three collapsed
into one `auth` object at `connect-app.ts:103-109`, with `runtimeAuthConfigured` computed
as their disjunction (`connect-app.ts:115-118`).

---

# PART C — Lift notes for Arkestra

Grounded on `.prism/shared/research/2026-09-06-arkestra-prism-seams.md`, which records
the current Arkestra shape: policy keys `fable5 | opus5 | opus48`,
`DOWNGRADE_CHAIN = ["fable5","opus5","opus48"]`, `FLOOR_MODEL = "opus48"`, and the
verified defect that `nextRunnable()` computing `indexOf(requested) === -1` then
`start = 0` sends any provider-prefixed key to the **top** of the Anthropic chain
(landing on `opus5`, not even on the floor).

## C1. The provider axis — what Weave Router does that Arkestra does not

Weave Router never represents a routable thing as a bare model string. Three
observations, in increasing order of strength:

**(1) `Decision` carries `Provider` next to `Model`** (`internal/router/router.go:260-273`).
The Arkestra chain is a `string[]` of model keys with no provider slot. The mobile mirror
`policyKeyForModel(provider, model)` already emits `provider:model` (seams doc FINDING 1)
— the same shape as the Weave roster IDs (`anthropic/claude-opus-4.8`,
`openai/gpt-5.6-sol`, `x-ai/grok-4.5`) at `internal/router/hmm/mapping.go:11-27`.

**(2) A model owns an ordered list of provider bindings, and the deployment
available-provider set selects one** (`catalog.go:194-195`; `ResolveBinding`,
`lookup.go:37-48`). The provider is not a property of the *chain*, it is a property of the
*model*, resolved per request. That inversion is what makes the Weave chain provider-safe
by construction: the chain is over models, and each model own binding list decides where
it dispatches.

**(3) An unmappable model returns `""` rather than a default.** `rosterIDFor`
(`mapping.go:29-45`) has no `default:` branch that guesses a provider; `mapping.go:19-26`
states why — "a bare ID whose primary provider is a hosting platform would be ambiguous",
so an explicit alias is what makes a model addressable at all. This is exactly the
discipline that the Arkestra `indexOf(...) === -1` then `start = 0` path violates: an
unknown key must not resolve to a position in a known chain.

### The minimum-viable provider axis

Two shapes are present in the harvest, either of which resolves the defect:

- **Prefixed key (what the mobile mirror already emits).** The chain becomes a map keyed
  by provider; the requested key provider is parsed *first* and only that provider chain
  is walked. Mirrors the HMM roster file exactly:
  `{ "clusters": { "high": { "arms": ["anthropic/claude-opus-4.8", "openai/gpt-5.6-sol:high"] } } }`
  (`cmd/validate-roster/testdata/roster_valid.json`) — cluster to ordered arms, index 0
  highest priority.
- **Binding list on the entry (what the catalog does).** `ModelPolicyEntry` gains an
  ordered `providers: [{provider, upstreamId}]` list; the chain stays a list of *models*
  and the provider is resolved from the entry at decision time (`catalog.go:109-126` plus
  `lookup.go:37-48`).

The prefixed-key form is the smaller graft — the encoding already exists in-repo and the
seams doc confirms `provider:model` is live on the mobile lanes today.

### Why a Codex model must never land on `opus48`

The Weave equivalent of the Arkestra floor — baseline failover — is guarded by an
explicit provider predicate before it fires (`internal/proxy/service.go:3919-3927`):

```go
decision.Provider != providers.ProviderAnthropic &&           // only rescue FROM non-Anthropic
baselineKnown && baselineCatalog.PrimaryProvider() == providers.ProviderAnthropic
```

Two things follow directly. First, the cross-provider hop is a **named, separately-gated
tier**, not an accident of index arithmetic — it has its own eligibility conjunction, its
own kill conditions (`ReasonUserForceModel`, `!shouldFailover`, `anthropicExcluded`,
allowlist, shadow mode, `AuthoritativePerTurn`), and its own telemetry marker
(`markerReasonBaseline = "fell back to baseline after provider outage"`,
`service.go:692`). Second, it is **disabled entirely whenever the caller supplied the
credentials** — `shouldFailover` returns false for BYOK-only, an inbound credential, or
any external key (`internal/proxy/fallback.go:427-438`), because "customer credentials
bind to a single provider — retrying elsewhere would 401 unexpectedly"
(`fallback.go:422-426`).

That second rule is the direct analogue for seams-doc consequence #2 (a Codex request
billing against the Max subscription) and #3 (a local GriotModel escaping to cloud): in
Weave terms both are credential-bound requests, and credential-bound requests do not
cross providers at all.

### The graft, stated as behavior

| Weave mechanism | file:line | Arkestra analogue |
|---|---|---|
| `Decision{Provider, Model, Effort}` | `router/router.go:260-273` | decision record gains a `provider` field |
| ordered `Providers []ProviderBinding` per model | `catalog/catalog.go:194-195` | per-entry binding list, or provider-prefixed keys |
| `ResolveBinding(id, available)` — first available binding wins | `catalog/lookup.go:37-48` | resolve provider before walking any chain |
| `rosterIDFor` returns `""` for unmapped | `hmm/mapping.go:44` | unknown key means no chain position (fail closed), never index 0 |
| `Tier == TierUnknown` means priced but never auto-selected | `catalog/catalog.go:171-173`, `lookup.go:167-179` | retired models stay dispatchable by explicit pin only |
| baseline failover guarded by provider equality | `proxy/service.go:3919-3927` | cross-provider hop is a distinct, explicitly-consented tier |
| `shouldFailover` false for BYOK/inbound creds | `proxy/fallback.go:427-438` | credential-bound (Codex account, local model) means no provider crossing |

## C2. What a per-provider downgrade chain plus floor looks like

Reading the four rescue tiers (A3) back as a shape:

**Tier 0 — resolve identity before anything else.** Weave resolves
`(provider, model, upstreamID, bindingIndex)` *before* dispatch
(`policy/resolver.go:498-523`) and re-resolves the provider per request when
`EnabledProviders` is set (`cluster/scorer.go:520-552`). The Arkestra analogue: parse the
requested key provider first; a key whose provider cannot be determined has no chain.

**Tier 1 — retry in place** (`fallback.go:230-336`): same provider, same model, bounded by
*count* (`maxSameBindingRetries = 2`), *backoff* (250 ms doubling), and *wall clock*
(`sameBindingRetryBudget = 10s`) — all three, because count alone does not bound cost
(`fallback.go:387-390`). Skipped entirely when a sibling binding exists
(`fallback.go:304`).

**Tier 2 — walk within the provider** (`fallback.go:194-366`): the ordered binding list
for the *same logical model*. In Arkestra terms this is the per-provider chain:
`anthropic: [fable5, opus5, opus48]`, `codex: [...codex rungs...]`,
`local: [...local rungs...]`. Termination is explicit — last index, non-failable error, or
managed-credential binding (`fallback.go:349`).

**Tier 3 — sibling within the provider** (`sibling_failover.go:19-65`): a *different*
model the policy already scored, with two rules worth lifting verbatim:
- already-excluded models are not resurrected by the rescue (`:41-46`);
- effort is dropped when rebasing, because it was chosen against the failed model menu
  (`:163-167`). The Arkestra effort/approval-mode equivalent should not ride along onto a
  different rung.

**Tier 4 — the floor.** The Weave floor has four properties the single global Arkestra
`FLOOR_MODEL = "opus48"` lacks:

1. **It is configured, not hard-coded** — `WithDefaultBaselineModel`
   (`service.go:1900-1902`), `ROUTER_DEFAULT_BASELINE_MODEL` (`.env.example:143`).
2. **It is validated against the catalog at decision time** —
   `baselineKnown && baselineCatalog.PrimaryProvider() == ProviderAnthropic`
   (`service.go:3926`). A floor that is not a real, correctly-providered model does not fire.
3. **It never overrides an explicit pin** — `decision.Reason != ReasonUserForceModel`
   (`service.go:3920`), the same guard in `siblingViable` (`service.go:3962`) and in the
   `dispatchWithFallback` empty-binding branch (`fallback.go:180-190`, which returns a
   typed 503 naming the forced model and the unconfigured provider rather than
   substituting anything).
4. **It respects the exclusion contract** — `!anthropicExcluded` (`service.go:3922`) and
   `baselineAllowed` (`:3915-3916`), so a floor the installation has excluded is not
   reachable through the back door.

For a per-provider floor, the shape those four properties imply:

```
chain[provider]  = [rung0, rung1, ..., floor(provider)]   // ordered, terminates
floor(provider)  = last(chain[provider])                  // derived, not a second constant
```

— the floor is the terminal element of its own provider chain, which makes "every
provider has a terminating floor" a single structural check rather than two independent
constants that can drift. Weave enforces the analogous property at boot:
`ValidateDispatchable` panics if a registered provider has no `ProviderFamilies` entry
(`providers/provider.go:166-178`), and `catalog/CLAUDE.md:38` makes "`Providers` is never
empty" a tested invariant.

**When a provider has no runnable model at all** — the seams doc open question (FINDING
3) — the Weave answer is uniform across every tier: fail with a typed error naming the
constraint, never substitute. `ErrNoEligibleProvider` (`scorer.go:22-24`),
`ErrAllowlistEmptiesPool` (`:26-28`, deliberately naming the *allowlist* rather than the
desugared exclusion list, `scorer.go:565-572`), `ErrGatewayServesNoDeployedModel`
(`scorer.go:542`), and the forced-model 503 at `fallback.go:180-190`. The one exception is
the *soft* filter class (`AutomaticExcludedModels`, tool-use/agentic/image blacklists,
`scorer.go:587-698`), which falls back to the unfiltered pool — and each of those is a
preference, never a permission.

The distinction Arkestra needs is exactly the Weave hard-vs-soft split
(`internal/router/router.go:154-175`):

| Weave field | Semantics | Empty-pool behavior |
|---|---|---|
| `ExcludedModels` | hard — also rejects an explicit force-model pin | fail the request |
| `SafetyExcludedModels` | physical constraint (context overflow, unsigned history) | fail — the bypass gate still honors it |
| `AutomaticExcludedModels` | soft — withdrawn from *automatic* selection, still reachable by explicit pin | ignore for that turn, serve unfiltered |

## C3. Local-first core plus an additive always-on CF relay tier

open-connector demonstrates the split Arkestra wants, with the seam in exactly one place.

**One core, many roots.** `createConnectApp(options)` (`connect-app.ts:45-120`) is
transport-, storage-, and platform-agnostic; every host difference is an option field
(`connect-app.ts:21-38`). The Worker root (`cloudflare.ts:53-109`) and the Node root
(`src/server/index.ts`) both call it. Nothing under `src/core/`, `src/oauth/`, or
`src/connection-service.ts` knows which one is running.

**The storage seam is an interface, not a branch.** `RuntimeDatabase` has a D1 impl
(`storage/d1-runtime-store.ts`), a SQLite impl (`storage/sqlite-runtime-store.ts`), a
Postgres impl (`storage/postgres-runtime-store.ts`), and a Node dispatcher
(`storage/node-runtime-database.ts`). The Worker picks D1 by construction
(`cloudflare.ts:66-69`); there is no `if (isWorker)` inside the stores.

**The crypto seam is the same interface twice.** `ISecretCodec`
(`secret-codec-core.ts:1-5`) has a `node:crypto` impl and a WebCrypto impl, each with its
own versioned prefix (`enc:v1:` vs `enc:worker:v1:`) so the stored form is self-describing
and a plaintext store migrates by pass-through (`secret-codec.ts:39-41`,
`worker-secret-codec.ts:53-55`). For an Arkestra relay tier this is the pattern for a
policy store that must be readable both device-side and edge-side.

**Isolate caching is keyed by every input that could change behavior.** `createCacheKey`
(`cloudflare.ts:143-158`) digests all eleven env-derived options. An edge tier for
Arkestra that caches a resolved policy would key on the policy own inputs the same way, or
a token/floor/chain change silently serves stale.

**The relay is additive because the transports are projections.** MCP is a fresh
stateless server per request over the *same* service objects (`mcp.ts:171-178`,
`mcp.ts:20-28`), and `/mcp/tools` projects its summaries from the same `mcpToolConfigs`
object the server registers from (`mcp.ts:56-58`) — the preview cannot drift from reality.
`/v1/*` is the SDK plus CLI surface (`connect-server.ts:193-204`); `/api/*` is the
console. All four are registered in one `createApp` (`connect-server.ts:159-261`) with one
`onError` that renders `/v1/` in the runtime envelope and everything else in the console
envelope (`connect-server.ts:262-268`).

**Capability gating off the crypto state.** `connect-app.ts:61` refuses custom OAuth
client configs unless `secretCodec.encrypted` — a runtime without a key literally cannot
accept a user secret. The Arkestra analogue: an edge tier without a configured key cannot
hold, or act on, a credential-bound decision.

## C4. Mechanisms worth lifting whether or not the provider axis lands

- **Typed exclusion diagnostics.** `policy/resolver.go:304-341` records *why* each model
  was dropped (`ExclusionUnmappedRoster`, `ExclusionContextWindow`,
  `ExclusionGatewayNotServed`, `ExclusionNoProvider` vs `ExclusionProviderPolicy`), and
  distinguishes the last pair by re-running the enumeration without the policy filter.
  Arkestra emits `downgradedFrom` on the bus (seams doc FINDING 2, consequence 4) but not
  a reason code.
- **Deterministic decision identity.** `MakeArmID(ArmIdentity{...})` produces
  `tq_arm_<sha256>` (`policy/arm.go:34-41`) over `{CanonicalModel, Endpoint,
  ModelRevision, Provider, ReasoningConfigurationSHA256, ToolConfigurationSHA256,
  UpstreamID}` — "intentionally mirrors `temporal_q.ids.make_arm_id`", i.e. the identity
  is stable across languages.
- **`ServedIdentity()` folds effort into the identity** (`router/router.go:279-284`)
  because an effort change invalidates thinking signatures and the cache prefix — the same
  reason the Arkestra approval mode is per-key rather than per-model.
- **The three-map boot check.** `providers/provider.go:44-48` plus `ValidateDispatchable`
  (`:166-178`): adding a provider is a fixed N-map edit, and omitting one is caught at boot
  with a message naming the file to edit, not as a 502 in production. This is the direct
  analogue of the Arkestra `scripts/verify-model-policy-conformance.mjs` gate over five
  mirrored copies (seams doc FINDING 4) — and the same reason that gate is described there
  as needing to be *extended* to understand per-provider chains rather than relaxed.
- **Response headers that narrate the walk.** `x-router-provider`, `x-router-model`,
  `x-router-context-window`, `x-router-fallback-from`, `x-router-fallback-attempt`
  (`proxy/fallback.go:234-242`) — set pre-commit and rewritten per attempt so they never
  name a model that did not serve.
- **Exactly-once error ownership.** `flushDeferredErr` (`proxy/service.go:3992-3999`):
  each rescue tier either runs or flushes; "writing it forecloses any later rescue."
- **Fail-loud roster validation.** `internal/router/hmm/roster.go:9-16` deprecates the
  silent-drop mapping in favor of `rosterdata.Load` / `ValidateRosterIDs` because
  "silent-drop let inert roster arms skew production routing" — an entry that names a
  model the catalog does not carry fails validation instead of vanishing.
