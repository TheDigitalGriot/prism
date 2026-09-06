# Prism v4.16.0 — Documentation Snapshot

**Released:** 2026-09-06 (tagged `v4.16.0`)
**Theme:** A governance layer that could silently switch providers was not governing. Naming it **Arkestra** was the easy half; discovering it had been sending Codex requests to Anthropic — and local models to the cloud — was the release.

---

## 1. Why this release exists

The task was scoped as an extension: add Codex models to the model-governance layer so Prism could route to them. The layer already had approval modes, a downgrade chain and a floor. Adding a roster looked like data entry.

Reading the code first turned it into a defect fix.

`nextRunnable()` resolved a downgrade by walking a single global chain:

```ts
const idx = DOWNGRADE_CHAIN.indexOf(requested)   // ["fable5","opus5","opus48"]
const start = idx < 0 ? 0 : idx + 1              // unknown key => start at 0
```

`indexOf` returns `-1` for any key that is not one of the three Anthropic entries — which is *every* provider-prefixed key. `start` became `0`, and the walk began at the **top of the Anthropic chain**. Executed against the real logic:

```
requested=gpt:gpt-6-astra      -> downgrades to: opus5
requested=gpt:gpt-5.6-sol      -> downgrades to: opus5
requested=local:griotmodel     -> downgrades to: opus5
```

Three consequences, in ascending order of seriousness:

| | |
|---|---|
| **Provider swap** | a Codex request silently became an Anthropic request |
| **Wrong account billed** | it drew on the Max subscription rather than the Codex account |
| **Local-first broken** | a denied **local** GriotModel escaped to a **cloud** model, sending data off-device |

It never even reached the floor — it stopped at `opus5`, the first freely-runnable entry. The planning note that predicted "downgrades to the Anthropic floor `opus48`" was itself wrong.

**This was live, not hypothetical.** The mobile lanes already emit `${provider}:${model}` keys via `policyKeyForModel` (`apps/prism-mobile/.../model-policy.ts:234-242`), so the defect was reachable before any Codex work began.

## 2. The fix — a chain never leaves its provider

Lifted from Weave Router, whose `shouldFailover` returns false for BYOK / inbound / external-key requests (`fallback.go:427-438`), and whose `rosterIDFor` returns `""` for an unmapped model rather than guessing (`mapping.go:44`) — precisely the discipline `indexOf(...) === -1 → start = 0` broke.

- **`PROVIDER_CHAINS` / `PROVIDER_FLOORS`** — a chain walks within one provider and terminates at that provider's own floor, or **fails closed**.
- **`providerOf()`** — explicit entry field → `provider:model` key prefix → `anthropic` for the three legacy keys → `"unknown"`, which has no chain and therefore fails closed.
- **`ModelDecision.blocked`** — the fail-closed signal callers must honour. Silently switching provider is the defect itself.
- **`credentialBound`** — a request carrying its own credential is never failed over at all. One rule answering both the billing and the local-escape case.

**Anthropic behaviour is byte-identical.** `DOWNGRADE_CHAIN` and `FLOOR_MODEL` are unchanged and still exported under their own names; `PROVIDER_CHAINS.anthropic` *is* `DOWNGRADE_CHAIN`. Verified: `fable5→opus5`, `opus5→opus48`, `opus48→opus48`.

## 3. The observation became a check

`scripts/verify-model-policy-conformance.mjs` gained a section asserting that the axis exists in both mirrored copies, that Anthropic still maps to the canonical chain and floor, that `nextRunnable` resolves a provider, walks a per-provider chain and can return `null`, that it does **not** return a global `FLOOR_MODEL` unconditionally, and that `ModelDecision` carries `blocked`.

**Negative-tested:** restoring the pre-Arkestra logic produced all four diagnoses, and the file was restored byte-identically. A cross-provider downgrade cannot ship silently again.

## 4. The test suite was dead and nobody knew

`apps/prism-vscode` had **no vitest config**. Every suite importing `@prism-core/*` died at import — *"Failed to load url @prism-core/core/api/model-policy. Does the file exist?"* — including the tests for the module being changed. Confirmed pre-existing by running against an unmodified checkout before touching anything.

| before | after |
|---|---|
| **0 runnable** | **42/42 passing across 3 suites** |

Added `vitest.config.ts` (aliases mirroring `tsconfig`, globals, node env) and `vitest.setup.ts` (a `jest`→`vi` shim for suites written against Jest). `fable-gate.test.ts` is excluded — it imports the `vscode` module and belongs to the `vscode-test` runner.

One of the six new Arkestra tests caught a real bug in the same commit: `coerceEntry` dropped the `provider` field on read, which would have left the axis inert for explicitly-declared providers.

## 5. The Codex roster — retirement as a date, not a flag

`packages/prism-core/src/core/api/model-roster.ts` is the data half; `model-policy.ts` remains the decision half. That split is what lets a model be added by writing data rather than logic.

Every fact was verified against primary sources on release day. **Five corrections to the planning assumptions:**

1. `gpt-6-astra` became the Codex CLI default only on 2026-09-04 (v0.153.4) — two days before release.
2. `gpt-5.4` / `gpt-5.4-mini` are **already retired** (2026-08-31 passed), not "retiring".
3. Effort values `light` and `extra-high` **do not exist** — they are ChatGPT UI display labels; the real config values are `minimal|low|medium|high|xhigh|max`.
4. `gpt-5.2` and `gpt-5.3-codex` are also retired (2026-06-02) and were missing entirely.
5. `gpt-5.3-codex-spark` has **no per-token price** — bundled into ChatGPT Pro; recorded as `null`, never estimated.

`isRetired()` compares a `retiredOn` date to now, and `PROVIDER_CHAINS.openai` is **derived** via `chainFor()`, so a retired id can never enter a live chain. A hand-maintained boolean is exactly what went stale in the planning list.

## 6. New surfaces

| surface | what it is |
|---|---|
| **`skills/griot-harvest`** | Ground an OSS repo against its real code, then hand the decision to `dgs-plan-update`. ENTER takes a repo URL, a Potluck shelf hit, **or a Cinopsis result** — it never ingests video. Bundles a survey script and the hypothesis-attack prompt pattern. |
| **`skills/prism-model-onboard`** | Never onboard a model from memory. Verify today, place on a chain that cannot leave its provider, write data not logic, gate on three checks. |
| **`packages/prism-workgraph-mcp`** | The Spectrum workgraph over MCP on Arkestra's **additive** always-on tier. Stateless Worker, zero runtime dependencies, `listTools()` returns the tool objects **minus the handler** so the wire schema cannot drift. 13 protocol tests in plain node. Local-first is unchanged; nothing gates on deployment. |
| **`packages/prism-daemon`** | `pairingInfo()` now mints a `(forward, backward)` pair into a live registry with a TTL and single-use redemption. It previously minted a UUID and discarded it, so the token authenticated nothing. Gated behind `PRISM_BROKER_REQUIRE_PAIRING`, default off. |
| **bus durability** | `$STATE_DIR/events` appends through an explicit `O_APPEND` handle in both copies. Proven: 8 concurrent writers × 200 lines = 1600 written, **zero torn**. |
| **invariant I10** | The ontology edited is the canonical, never the generated mirror. Negative-tested. |

## 7. Release & Audit gate results

| check | result |
|---|---|
| `claude plugin validate .` | PASS |
| `verify-branch-integrated.mjs` | PASS |
| `verify-ceremony-gate.mjs` | PASS |
| `verify-invariants.mjs` | PASS — `9 executed · 5 deferred · 0 open of 14` |
| `verify-invariants.test.mjs` | PASS |
| `verify-model-policy-conformance.mjs` | PASS |
| `verify-story-unification.mjs` | PASS |
| structural checks | PASS (34 changed files) |
| vitest (`src/core/api/__tests__/`) | 42/42 |
| workgraph protocol tests | 13/13 |

**I9 was failing on entry** with 7 decided-but-silent decisions. Resolved by recording the *real* execution commits — located by asking git which commit added each claimed artifact — not by weakening the check. Choices and summaries were left untouched.

## 8. Known gaps carried forward

- **Bus concurrency is only half-fixed.** The append path is atomic; read-modify-write callers (`gavel_decide`, `digital-griot-mcp.ts:801/813`) still need a real lock, and the events file is still `unlinkSync`-ed out from under readers on a new screen.
- **GriotModel as a recall log source is blocked**, not built: deja-vu's `Registry()` is a compile-time slice, so it needs a fork or an upstream contribution rather than a plugin. The local-model *embedding* half needs no code and ships as `recall.env.example`.
- **`griot-harvest-ux-ui` is deliberately unbuilt**, pending design decisions that are the user's to make.
- **`prism-viz-engine-cluster` was an orphan artifact** — committed but never registered — found and registered this cycle. Worth auditing whether other artifacts are similarly unreachable.
- **`apps/prism-setup` remains tracked** (260 files) though sunset in v4.15.2, carrying unpoliced copies of gate-checked files. Either delete the tree or bring it under the conformance gate.
