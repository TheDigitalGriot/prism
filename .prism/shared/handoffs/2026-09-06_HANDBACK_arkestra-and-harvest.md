---
date: 2026-09-06T14:45:00-04:00
researcher: Claude (Claude Code, Opus 5) — device-side, Prism repo
handback_for: Gavin — run the CLOSING CEREMONY in Cowork
source_handoff: .prism/shared/handoffs/2026-09-06_10-37-31_cross-platform-lift-and-codex-plane.md
branch: main
tags: [handback, arkestra, griot-harvest, provider-axis, codex, interop, ontology]
status: heavy-lifting half COMPLETE for Arkestra; three lifts remain
---

# HANDBACK — Arkestra shipped, harvest generalized

Nomenclature set this session: **Arkestra** = the model-governance layer ("the Governor" in
speech; "Model Control Plane" retired — it collided with MCP = Model Context Protocol).
**Spectrum** = our stage-walk (ICM is the upstream methodology it derives from).

---

## ⚠️ BEFORE THE CEREMONY — two blockers

1. **I9 FAILS** — `verify-invariants.mjs` reports *7 decided but silent* decisions in an old
   brainstorm's `decisions.json` (`Q3.1`, `Q3.2`, `Q4`, +4). **Pre-existing, not from this
   session**, but the ceremony halts on a false invariant. Clear or defer them first.
2. **4 ontology commits are UNPUSHED** on `main` in `GriotMeta/griot-ontology`
   (`67d3d5d`, `2c15904`, `ffdaf2e`, `7ef7b84`). You never asked me to push; they are ready.

---

## What shipped

### Prism repo (`main`) — 4 commits

| commit | what |
|---|---|
| `3cd8385` | **griot-harvest** skill + I10 invariant + CLAUDE.md ontology import + 10 research docs |
| `6fbdef9` | **Arkestra provider axis** — the fix, the gate, the unblocked test suite |
| `57d64c7` | **Codex roster** — derived so a retired model cannot enter a chain |
| `c3850f8` | **prism-model-onboard** skill + **decision-bus** registered with the broker |

### griot-live-artifacts — 4 commits, all pushed, cards live

`7a330c2` 5 graft decisions · `a1957ea` 18 harvest rows/12 codexes · `6bd9279` registry stamped ·
`0582b4f` drawesome + JSON Canvas + viz-engine registered. Plan card: **39 apps · 1603 items ·
1149 OSS · 55 dark**. Render gate clean every pass.

### griot-ontology — 4 commits, UNPUSHED

I10 invariant · 15 repos migrated off the mirror · nomenclature rule · **Arkestra** named ·
the diagram-quality bar.

---

## THE DEFECT — found, reproduced, fixed, and made computable

Executing the real logic (an observation, not a theory):

```
requested=gpt:gpt-6-astra   -> downgraded to: opus5
requested=local:griotmodel  -> downgraded to: opus5
```

`nextRunnable` did `DOWNGRADE_CHAIN.indexOf(requested)`, which returns `-1` for any
`${provider}:${model}` key, so the walk started at the TOP of the Anthropic chain.

1. a Codex request silently became an **Anthropic** request billed to the **Max subscription**;
2. a denied **local** GriotModel escaped to a **cloud** model — breaking local-first and sending
   data off-device;
3. it never reached the floor. The handoff's "downgrades to the floor `opus48`" was itself wrong.

**Reachable today** — the mobile lanes already emit `${provider}:${model}` keys via
`policyKeyForModel`. A live defect, not a hypothetical.

**The fix** (from Weave Router `fallback.go:427-438`): per-provider chains and floors; a chain
never leaves its provider; unmapped providers **fail closed**; `blocked` on the decision as the
signal callers must honour; and **a credential-bound request is never failed over at all** — one
rule answering both the billing and the local-escape case.

**Anthropic behaviour is byte-identical.** Verified `fable5→opus5`, `opus5→opus48`,
`opus48→opus48`.

**Now a check, not an observation** — `verify-model-policy-conformance.mjs` §7. Negative-tested by
restoring the pre-Arkestra logic: all four diagnoses fired, file restored byte-identically.

---

## The test suite was dead and nobody knew

`apps/prism-vscode` had **no vitest config**, so every suite importing `@prism-core/*` died at
import — including the tests for the module I was changing. Proven pre-existing against an
unmodified checkout *before* touching anything.

Fixed: `vitest.config.ts` (aliases mirroring tsconfig, globals, node env) + `vitest.setup.ts`
(`jest`→`vi` shim). `fable-gate.test.ts` excluded — it needs the extension host and belongs to
`vscode-test`.

**42/42 passing across 3 suites, from 0 runnable.** One new test caught a real bug in my own
commit: `coerceEntry` dropped the `provider` field on read, which would have left the axis inert
for explicitly-declared providers.

---

## Research — 11 docs, ~360KB, 8 agents. Every repo corrected the handoff.

`.prism/shared/research/2026-09-06-*.md`

| doc | headline correction |
|---|---|
| `puter-interop-bus` | paired UUIDs are **capability tokens, not identities**; the gate is `WindowProxy` **object identity**, not an origin check; envelope has an `env` field checked *first*; `uuid` is an int. **Defects not to copy:** a failed registry lookup **hangs the caller's promise**; `connections_` is **never deleted from** |
| `puter-mcp-server` | service-worker format, **zero runtime deps** (protocol hand-rolled in 230 lines); sealed blob holds the **flow state and auth code**, NOT the access token |
| `waggle-handoff-tokens` | token is **8 base58 chars**, not ~30 bytes; the projector is a **sealed matcher over pre-authored variants** + a separate byte budget; **both headline metrics misattributed** (Anthropic's ~15×, Berkeley/MAST's 36.9% — measurements of the *problem*) |
| `dejavu-recall` | **"7–9ms" appears nowhere** (~0.4ms real); **one tool `deja` with a mode**, not two; adapters are a struct literal — but `Registry()` is **compile-time**, no runtime seam |
| `codex-model-roster` | **5 corrections** — see the roster commit |
| `arkestra-grafts` | the fix: **credential-bound requests never cross providers** |
| `prism-interop-landing-zone` | **the broker is BUILT** on `:6780` (assumed spec-only); `pairingInfo()` mints a token **never stored or compared**; `digital-griot-mcp` had **zero identity** and **zero concurrency guarantees** |
| `cc-conversation-archiver` | the capture half of deja-vu's recall; **no licence declared** |
| `agentic-ui-canvas-oss` | nothing does the whole job; **Onlook** (Apache-2.0) closest; **tldraw is source-available, not OSI** — the shelf blurb says "open-source" |
| `codex-orchestration` | *(agent running at handback time — check the file)* |

---

## The two new skills

**`griot-harvest`** — repo → grounded research → fit verdict → hand to `dgs-plan-update`.
ENTER takes a repo URL, a shelf hit, **or a Cinopsis result** (`Cinopsis → griot-harvest →
dgs-plan-update`; it never ingests video). Bundles a survey script (verified on all 10 cluster
repos) and `references/analyst-prompt.md` — the hypothesis-attack pattern that produced 16+
corrections.

**`prism-model-onboard`** — never onboard a model from memory. Verify today, place on a chain that
never leaves its provider, write data not logic, gate on three checks.

---

## STILL OPEN

### The three remaining lifts (researched, unstarted)
1. **Interop bus** — the broker is built and `decision-bus` is now registered. Next: mint and
   **compare** a paired token (`pairingInfo()` already mints one and throws it away), and add
   atomic writes to the events file (**no `flock`/rename today**; it is `unlinkSync`-ed out from
   under readers).
2. **MCP server for the Spectrum workgraph** on the CF-relay tier — Puter's stateless Worker is
   the model; note the sealed blob holds flow state, not the token.
3. **deja-vu recall** for `sankofa` + `chat-log-access`. **Two separate integrations**: local
   models as an *embedding backend* = **zero code** (env vars; Ollama `:11434`/LM Studio `:1234`
   already probed); GriotModel as a *log source* = a new adapter + registry entry (compile-time).

### Parked for you
- **`griot-harvest-ux-ui`** — deliberately not built. Needs the layer roles from your Desktop
  codex. Design capture: `.prism/shared/designs/2026-09-06-prism-viz-engine-expanded.md`.

### Threads found that nobody was tracking
- **The IA → wireframe → userflow → polished-UX band is a real hole.** Across 1,149 tools:
  `information architecture` **0**, `lo-fi` **0**, `user flow` **0**, `wireframe` **1**. Lucid
  carries 106 tools and none cover it.
- **`prism-design-engine` is ALIVE** (committed 2026-09-05) and is `nexu-io/open-design` **v0.9.0**
  — with a built-in **Model Router** worth reading for Arkestra. **Djeli is the dark one: 41 days.**
- **Shelf hygiene:** duplicate `POT_T` rows for `orca`, `buzz`, `instatic` (×3), `penecho` (×2);
  `mixar`/`meetily` not tagged to Djeli although they feed it; tldraw's licence string is wrong.
- **`prism-viz-engine-cluster` was an orphan** — now published and registered as `prismvizengine`.

---

## Ceremony checklist

- [ ] clear/defer the 7 silent decisions → **I9**
- [ ] push the 4 `griot-ontology` commits
- [ ] `node scripts/verify-model-policy-conformance.mjs` → green
- [ ] `npx vitest run src/core/api/__tests__/` from `apps/prism-vscode` → 42/42
- [ ] `node scripts/verify-invariants.mjs` → I10 green
- [ ] CHANGELOG for the Arkestra provider axis (user-visible: a denied non-Anthropic model now
      **fails closed** instead of silently switching provider — call this out)
