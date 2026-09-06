---
date: 2026-09-06
researcher: Claude (Claude Code, Opus 5) — device-side
topic: "Arkestra: the Prism-side seams, and the verified cross-provider downgrade defect"
tags: [arkestra, governor, model-policy, provider-axis, codex, research]
status: complete
---

# Arkestra — Prism-side seams

> **Nomenclature.** **Arkestra** is the model-governance layer (everyday shorthand:
> "the Governor"). The former name "Model Control Plane" was retired 2026-09-06 —
> it collided with MCP and said nothing Griot. **MCP** means Model Context Protocol
> throughout. **Spectrum** is our stage-walk / execution model (ICM is the upstream
> methodology it derives from, cited by that name only when citing the paper).

## The files

| File | Lines | Role |
|---|---|---|
| `packages/prism-core/src/core/api/model-policy.ts` | 450 | **Canonical** Arkestra implementation |
| `apps/prism-mobile/packages/server/src/server/agent/model-policy.ts` | 242 | Minimal mirror for the Paseo custom-provider lanes |
| `apps/prism-vscode/src/core/api/claude-sdk.ts` | 234 | `MODEL_IDS` — SDK alias → pinned API id |
| `model-policy.example.json` | 9 | Committed example of the store shape |

Store: `<projectRoot>/.prism/local/model-policy.json` (gitignored).
Events: one JSONL line per decision appended to `$STATE_DIR/events` (the same file
the cockpit/statusline reads).

## The two namespaces (already settled, do not conflate)

| Namespace | Where | Keys |
|---|---|---|
| **Policy keys** — govern approval mode + downgrade | `model-policy.ts` (both copies), `fable-gate.sh`, `statusline-model.sh` | `fable5`, `opus5`, `opus48` — **no bare `opus`** |
| **SDK aliases** — friendly name → API id | `claude-sdk.ts` `MODEL_IDS` | `opus` (→ Opus 5), `opus5`, `opus48`, `sonnet`, `haiku`, `fable` |

## FINDING 1 — the mirror is AHEAD of the canonical on the provider axis

`apps/prism-mobile/.../model-policy.ts:234-242` already ships a provider-aware key
function that the canonical core **does not have**:

```ts
export function policyKeyForModel(provider: string, model: string): string {
  if (model === "fable" || model === "claude-fable-5" || model.startsWith("claude-fable-5-"))
    return "fable5";
  if (model === "opus5" || model === "claude-opus-5") return "opus5";
  if (model === "opus48" || model === "claude-opus-4-8") return "opus48";
  return `${provider}:${model}`;          // gemini / gpt / local GriotModel / kimi / ...
}
```

So the **`${provider}:${model}` key convention already exists and is in use** on the
mobile lanes. The provider axis does not need to be invented — it needs to be lifted
into the canonical core and made load-bearing in the downgrade logic.

Note also the deliberate **prefix** match on Fable (`startsWith("claude-fable-5-")`):
an exact match silently fails to gate point releases like `claude-fable-5-1`, letting a
premium model dispatch ungated. Any provider matching we add must follow that lesson.

## FINDING 2 — VERIFIED DEFECT: a denied non-Anthropic model becomes an Anthropic model

**This is an observation, reproduced by executing the real logic — not an inference.**

`DOWNGRADE_CHAIN = ["fable5","opus5","opus48"]` and `FLOOR_MODEL = "opus48"` are
Anthropic-only in **both** copies. `nextRunnable()` does:

```ts
const idx = DOWNGRADE_CHAIN.indexOf(requested);
const start = idx < 0 ? 0 : idx + 1;     // <-- unknown key => start at 0
```

A provider-prefixed key is never in the chain, so `indexOf` returns `-1`, `start`
becomes `0`, and the walk begins at the TOP of the Anthropic chain. Reproduced:

```
  requested=gpt:gpt-6-astra      -> downgrades to: opus5
  requested=gpt:gpt-5.6-sol      -> downgrades to: opus5
  requested=local:griotmodel     -> downgrades to: opus5
  requested=fable5               -> downgrades to: opus5
  requested=opus5                -> downgrades to: opus48
```

**This is worse than the planning session predicted.** The handoff expected a Codex
model to "downgrade to the Anthropic floor `opus48`". It does not fall to the floor —
it lands on **`opus5`**, the first freely-runnable entry. Consequences:

1. A Codex request silently becomes an **Anthropic** request — the provider changes
   without the caller knowing.
2. It bills against the **Max subscription** rather than the Codex/OpenAI account.
3. A **local** GriotModel request — which should cost nothing and stay on-device —
   silently escapes to a **cloud** model. This is the most serious case: it breaks the
   local-first guarantee and sends data off-device.
4. The emitted bus event records `downgradedFrom`, so it is *visible* after the fact,
   but nothing *prevents* it.

The `${provider}:${model}` keys from FINDING 1 make this reachable **today** on the
mobile lanes, so this is a live defect rather than a hypothetical one for the Codex work.

## FINDING 3 — the floor is a single global constant

`FLOOR_MODEL = "opus48"` is one string. There is no notion of "the floor for THIS
provider". Any fix needs a per-provider floor, and a rule for what happens when a
provider has no runnable model at all (fail closed vs. cross to another provider with
explicit consent).

## FINDING 4 — the blast radius is FIVE copies, and a conformance gate polices them

The planning session assumed two files. It is **five**, plus two data files, and they
are held together by a static-analysis gate that will **fail the closing ceremony** if
the provider axis is added naively.

`scripts/verify-model-policy-conformance.mjs` (208 lines) exists precisely because these
copies cannot import each other and have drifted silently before (the v4.13.0 audit found
the shell gate matching Fable by exact string, so `claude-fable-5-1` dispatched **ungated**).
It is auto-discovered by `scripts/pre-release-audit.mjs`, which globs `verify-*.mjs`.

The copies it polices:

| # | File | Role |
|---|---|---|
| 1 | `packages/prism-core/src/core/api/model-policy.ts` | canonical |
| 2 | `scripts/fable-gate.sh` | embedded node, surface `cli` |
| 3 | `scripts/statusline-model.sh` | embedded node, display only |
| 4 | `apps/prism-mobile/.../agent/model-policy.ts` | mobile server |
| 5 | `apps/prism-vscode/src/core/api/fable-gate.ts` | `MODELNAME_TO_POLICY` |
| + | `model-policy.example.json` | store example |
| + | `apps/prism-vscode/src/core/api/claude-sdk.ts` | `MODEL_IDS` |

**Verified: the gate passes today** (`exit 0`, "all mirrored model-policy copies agree").

### Why this constrains the provider-axis design

The gate asserts the chain and floor by **literal shape**, via regex:

```js
const chainRe = /\[\s*"fable5"\s*,\s*"opus5"\s*,\s*"([a-z0-9]+)"\s*\]/
… src[key].match(/FLOOR_MODEL\s*[:=]\s*"([a-z0-9]+)"/)
```

If `DOWNGRADE_CHAIN` becomes a per-provider **map** and `FLOOR_MODEL` a per-provider
lookup, **both regexes stop matching** and the gate fails with "DOWNGRADE_CHAIN not found
or not in the expected shape" — in `core` *and* `mobile`, plus the `CHAIN=` variant in
`fable-gate.sh`.

The script says explicitly: *"Fix the divergence — do not weaken this check."* So the
correct move is to **extend the gate to understand per-provider chains**, asserting:
- every provider has a chain and a terminating floor;
- the Anthropic chain still terminates at `opus48`;
- **no chain crosses providers** (the FINDING 2 defect, now computable);
- Fable is still matched by prefix in every copy (the existing security invariant).

That last point matters: FINDING 2 is currently only an observation. Encoding it into
this gate converts it into a **check** — the hard form, per the ontology's
"SOFT FIXES ROT" rule. A cross-provider downgrade then cannot ship silently again.

### Also in the blast radius

- `apps/prism-vscode/src/core/api/__tests__/model-policy.test.ts` (349 lines) — the unit
  suite for the decision logic. Must keep passing and should gain cross-provider cases.
- `apps/prism-vscode/src/providers/model-status.ts` + `extension.ts` — surface the mode.
- `apps/prism-mobile/.../agent/providers/claude-agent.ts` — a `policyKeyForModel` caller.
- `apps/prism-setup/**` — **resolved: out of scope.** Despite commit `db65d56`
  ("sunset apps/prism-setup"), the tree is still tracked (260 files in HEAD); the sunset
  removed it from *bundling*, not from git. Verified that neither
  `verify-model-policy-conformance.mjs` nor `pre-release-audit.mjs` nor `package.json`
  references it, so its copies of `fable-gate.sh`, `statusline-model.sh` and
  `verify-model-policy-conformance.mjs` are **unpoliced stale resources**. Do NOT update
  them as part of the provider-axis work.
  *Drift note for the Suite Drift Codex:* a sunset tree still carrying copies of
  gate-policed files is exactly the silent-drift shape the conformance gate exists to
  prevent — it just does not cover them. Either delete the tree or add it to the gate.

## The shape the fix needs

1. **`provider` on the policy entry** — extend `ModelPolicyEntry` beyond `{mode}`.
   Keep the reader's degrade-to-safe-default behavior: any malformed input must fall
   back rather than throw (the current reader never throws, by design).
2. **Per-provider chain + floor** — `DOWNGRADE_CHAIN` becomes a map keyed by provider;
   `FLOOR_MODEL` likewise. `nextRunnable()` must resolve the requested key's provider
   FIRST and walk only that provider's chain.
3. **Never cross providers implicitly.** An unknown/unmapped key must NOT default into
   the Anthropic chain. Fail closed, or downgrade within its own provider only.
4. **Keep both copies in sync** — the mobile mirror is a deliberate minimal copy
   (it cannot import across the repo boundary). Its header explicitly says to keep it
   in sync when the policy shape changes.
5. **Back-compat** — `readModelPolicy` currently derives a policy from a legacy
   `fable.flag` when the store is absent. That path must keep working.

## Nomenclature debt found while reading

Both `model-policy.ts` copies open with `Model Control Plane — ...` in their header
comments. That name is retired; these become **Arkestra** when the layer is next
touched. The mobile mirror's header also cites "the Model Control Plane design".

## Open question for the build

Whether to rename the files/identifiers `model-policy.*` → `arkestra-policy.*` (with
I6-style aliases for the old paths), or keep the descriptive filenames and use
Arkestra only as the subsystem's proper name in docs and comments. Raised with Gavin;
**not yet decided** — the rename touches 4 files across 2 apps plus the shell hooks.
