---
date: 2026-09-06T14:45:00-04:00
researcher: Claude (Claude Code, Opus 5) — device-side, Prism repo
handback_for: Gavin — run the CLOSING CEREMONY in Cowork
source_handoff: .prism/shared/handoffs/2026-09-06_10-37-31_cross-platform-lift-and-codex-plane.md
branch: main
tags: [handback, arkestra, griot-harvest, provider-axis, codex, interop, ontology]
status: COMPLETE — all three lifts shipped; closing ceremony RUN device-side; only the push awaits Gavin
---

# HANDBACK — Arkestra shipped, harvest generalized

Nomenclature set this session: **Arkestra** = the model-governance layer ("the Governor" in
speech; "Model Control Plane" retired — it collided with MCP = Model Context Protocol).
**Spectrum** = our stage-walk (ICM is the upstream methodology it derives from).

---

## ✅ THE CEREMONY ALREADY RAN — device-side, through the tag

**This section superseded its own blockers.** The full `/prism:prism-closing-ceremony` was run
here rather than in Cowork. **Everything up to and including the tag is done. Nothing is pushed.**
The single thing left for you is the irreversible half.

| ceremony phase | state |
|---|---|
| Step 0 — audit | **8/8 CLEAN** (`pre-release-audit.mjs`) |
| Step 0 — review | **RAN** — 1 Medium found and **fixed**, see below |
| Bookend | 4.15.2 → **4.16.0** across 15 files + `PRISM-DOCUMENTATION-4.16.0.md` + CHANGELOG |
| Docs | VitePress synced — Arkestra + provider axis on the model-assignment page; build passes |
| Release | tag **`v4.16.0` at `68aec07`, LOCAL ONLY** · CLI/VSIX/Electron/NSIS built |
| **Push + GitHub release** | ⏸ **AWAITING YOU** — the only irreversible step |

**I9 was resolved without weakening the check.** The 7 decided-but-silent decisions got their
*real* execution commits recorded (`5f516ec`, `c44a7ae`, `5b7f19f`, `2a84e6c`) — located by asking
git which commit first added each claimed artifact. Choices and summaries untouched.

### The review gate found something the tests did not

It first came back **empty**, which I misdiagnosed in-session as broken agents. The real cause was
**`maxTurns: 10`** in both reviewer agents' frontmatter — the quality-reviewer burned 15 tool calls
/ 79k tokens / 111s and was killed at the cap before writing its summary. My prompt was ~25–30
turns of work. **An over-scoped prompt, not a broken agent.** Re-dispatched as two narrow reviews
that fit the budget; both returned.

- **Broker pairing + atomic writes → CLEAN** on all four questions.
- **Provider axis → 1 MEDIUM, now fixed (`68aec07`).** `providerOf` let an explicit `provider`
  field outrank the key's own prefix, so `"openai:gpt-6-astra": { mode: "deny", provider: "anthropic" }`
  walked the **Anthropic** chain and resolved to `opus5` — the exact escape this release closes,
  reintroduced through config instead of logic.

  The adversarial test I wrote for this case **passed while the escape was live**: it asserted
  `d.model !== "openai:gpt-6-astra"` — true, because the answer was `opus5`. It checked a weaker
  property than the one that mattered. Corrected to `expect(ANTHROPIC).not.toContain(d.model)`.
  Negative-tested; **49/49** now.

  Worth carrying forward: *a test asserting a weaker property than the one that matters is
  indistinguishable from a passing test until something independent looks at it.*

### `griot-ontology` — deliberately NEVER going to GitHub
   All 8 commits (including this session's `67d3d5d`, `2c15904`, `ffdaf2e`, `7ef7b84`) are
   committed, and the full history is now mirrored to a **bare local repo**:
   `D:\GriotBackups\griot-ontology.git` (remote name `backup`). Keep it current with
   `git push backup main`.

   **Why no GitHub remote — a standing decision, not an oversight.** A secret scan came back clean
   (every hit was prose about *context tokens* / *design tokens*), but the doctrine's **content**
   is the issue: three personal email addresses, machine paths and device name, client names, the
   business roadmap, and **family health details**. None of that needs to leave the machine to do
   its job, and "private repo" still means a third party holds it. Gavin stopped a push mid-flight
   and was right to.

   > ⚠️ **Loose end for Gavin (30 seconds):** an EMPTY private repo
   > `TheDigitalGriot/griot-ontology` was created before he stopped me. **Nothing was ever pushed**
   > (`git ls-remote` empty, `isEmpty: true`) and the local remote is removed, so it is inert. It
   > still needs deleting — the CLI token lacks the `delete_repo` scope and I would not expand
   > GitHub auth scopes unprompted. Either delete it in the browser, or:
   > `gh auth refresh -h github.com -s delete_repo && gh repo delete TheDigitalGriot/griot-ontology --yes`

---

## What shipped

### Prism repo (`main`) — 4 commits

| commit | what |
|---|---|
| `3cd8385` | **griot-harvest** skill + I10 invariant + CLAUDE.md ontology import + 10 research docs |
| `6fbdef9` | **Arkestra provider axis** — the fix, the gate, the unblocked test suite |
| `57d64c7` | **Codex roster** — derived so a retired model cannot enter a chain |
| `c3850f8` | **prism-model-onboard** skill + **decision-bus** registered with the broker |
| `505fa76` | this handback |
| `0964dce` | **LIFT 1** — pairing token minted/stored/compared + atomic bus appends |
| `575304e` `b462328` | **LIFT 2** — Spectrum workgraph MCP Worker + 13 protocol tests |
| `62c4623` | **LIFT 3** — recall layer + the Codex-Orchestration research |

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
| `codex-orchestration` | cross-provider call is a **subprocess** shelling out to the `claude` CLI, not a protocol bridge; the plugin holds **no key** and structurally forbids API-key auth, so one run bills **two accounts**; **no retry, no fallback anywhere**; effort has **no cross-provider mapping, deliberately**; best idea = **two-level qualification** (reviewed manifest + a per-install billable probe recorded as *route acceptance, not runtime identity*). Carries a real substitution defect to invert, and two unsourced README metrics |

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

## The three lifts — ALL SHIPPED

### 1. Interop bus — `0964dce`
- **The pairing token authenticated nothing.** `pairingInfo()` minted `randomUUID()` and threw it
  away, so any caller could `POST /register` any id over the wildcard-CORS surface. Now it mints a
  **`(forward, backward)` pair** into a live registry with a 5-min TTL, and `redeemPairing()`
  validates + expires + is **single-use** (a replayed QR cannot register twice). Gated behind
  `PRISM_BROKER_REQUIRE_PAIRING=1` so local-only setups are unchanged.
- **Two Puter defects deliberately NOT copied**: its registry miss returns *no reply* and hangs the
  caller's promise (we answer 401); its `connections_` map is never deleted from (we sweep).
- **Atomic bus appends** via an explicit `O_APPEND` handle, both copies. **Proven: 8 concurrent
  writers × 200 lines = 1600 written, ZERO torn.**
- **Scope stated honestly:** this fixes the APPEND path. Read-modify-write callers
  (`gavel_decide`, `digital-griot-mcp.ts:801/813`) still need a real lock, and the events file is
  still `unlinkSync`-ed out from under readers on a new screen.

### 2. Spectrum workgraph MCP Worker — `575304e` + `b462328`
Stateless CF Worker, **service-worker format + `no_bundle`**, **zero runtime deps** (hand-rolled
JSON-RPC — no SDK on the edge). Four tools: `workgraph_status/_awaits/_edges/_resolve`.
**`listTools()` returns the same objects minus the handler**, so the wire schema is produced by
omission and cannot drift — with a test asserting it. Read-only by default (the global view
generates, never writes back). Degrades honestly: an absent KV binding returns a well-formed
answer carrying a `degraded` reason, not a 500. **13/13 protocol tests in plain node.**
*Auth correction carried:* Puter's sealed blob holds the **flow state and auth code**, not the
access token — so this Worker does **not** half-implement a sealed-token flow from a wrong premise.

### 3. Recall layer — `62c4623`
**A. Local model as embedding backend: ZERO CODE, done.** Ollama `:11434` / LM Studio `:1234` are
already probed; `recall.env.example` ships at repo root. Search stays lexical BM25 — embeddings
only rerank ≤64 hits and the semantic tier fires *only* when lexical returns zero, so a slow local
model degrades **quality**, never breaks recall.
**B. GriotModel as a log source: specified, BLOCKED on one decision** — `Registry()` is a
**compile-time slice**, so this needs a **fork or an upstream contribution**, not a plugin.
Five craft lifts specified (budget enforcement, the fail-safe dial, reorder-don't-drop dedup,
redact-before-cap, one-tool-with-a-mode) — those land in `~/.claude/skills` via
digital-griot-skills, **not this repo**.

## STILL OPEN

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

### Decisions waiting on you (each blocks real work)

1. **Fork deja-vu or contribute upstream?** `Registry()` is a compile-time slice, so GriotModel
   recall cannot be a plugin. This is the only thing between the spec and the code for Lift 3B.
2. **`griot-harvest-ux-ui` layer roles** — from your Desktop codex.
3. **Rename `model-policy.*` → `arkestra-policy.*`?** Raised earlier, still undecided. Touches
   4 files across 2 apps plus the shell hooks; I6-style aliases would carry the old paths.

## Ceremony checklist — DONE except the push

- [x] the 7 silent decisions → **I9 green** (real execution shas recorded, check not weakened)
- [x] `griot-ontology` — committed + mirrored to `D:\GriotBackups\griot-ontology.git`.
      **Not pushed to GitHub, by decision** — see above. Not a checklist item anymore.
- [x] `verify-model-policy-conformance.mjs` → green (incl. the new §7 provider-axis section)
- [x] `npx vitest run src/core/api/__tests__/` → **49/49** (42 + 7 adversarial)
- [x] `verify-invariants.mjs` → I10 green · full audit **8/8 CLEAN**
- [x] CHANGELOG 4.16.0 — fail-closed called out as the user-visible change
- [x] Bookend → 4.16.0 · Docs → VitePress synced · tag `v4.16.0` at `68aec07` **(local)**
- [x] Installers built: 5 CLI binaries · `prism-4.16.0.vsix` · `Prism-4.16.0 Setup.exe` · NSIS

### The one thing left — yours to call

```bash
git push origin main --follow-tags        # 18 commits + v4.16.0
gh release create v4.16.0 --generate-notes \
  apps/prism-vscode/prism-4.16.0.vsix \
  "apps/prism-electron/out/make/squirrel.windows/x64/Prism-4.16.0 Setup.exe" \
  "apps/prism-installer/src-tauri/target/release/bundle/nsis/Prism Setup_4.16.0_x64-setup.exe" \
  apps/prism-cli/bin/*
```

Everything before this is reversible (`git tag -d v4.16.0` and the branch is untouched upstream).
Nothing after it is.

### Build traps — two avoided, one NOT

1. **`VERSION=` is mandatory** on `make build-all`. `Makefile:3` defaults to `git describe` and
   injects via `-ldflags`, so a bare invocation stamps the *previous* tag plus `-dirty` (observed
   on the v4.15.2 cut: `v4.15.1-4-g814b762-dirty`). Passed `VERSION=4.16.0` explicitly. ✅
2. **Stale bundles glob as fresh.** A `Prism Setup_4.15.2_x64-setup.exe` was still sitting in the
   NSIS output dir — the same class that caused the v4.15.0/4.15.1 stale-artifact bug. Cleared it
   before building. (Electron Forge cleans its own `out/` and needed no help.) ✅
3. **❌ NOT avoided — a workspace member without a lock refresh.** `packages/prism-workgraph-mcp`
   was added this cycle; the root `workspaces: ["packages/*"]` glob picks it up, but
   `package-lock.json` was never regenerated. **The tag-triggered installer workflow then failed on
   BOTH runners** with `npm error Missing: @prism/workgraph-mcp@4.16.0 from lock file`, the release
   job was skipped, and v4.16.0 published with **5 of 10 assets**.

   Why it was invisible: `npm install` *reconciles* the lock, `npm ci` *asserts* it already agrees.
   Local builds reused a populated `node_modules` and never consulted the lock at all. **No gate
   runs `npm ci`** — which is exactly how an 8/8 CLEAN audit shipped a broken release.

   Fixed in `b0ef68d` (lock registration only, 12 insertions, no dependency churn). Recovery did
   **not** rewrite the published tag: the workflow's release job is gated on
   `startsWith(github.ref, 'refs/tags/v')`, so a `workflow_dispatch` on `main` rebuilds the
   installers and skips the release step — the macOS dmg then comes out as a downloadable artifact
   to attach by hand. Both runners went green on the re-dispatch, confirming the lock was the sole
   cause. Release is now **10/10**, matching v4.15.2's shape.

   **Recommended hard fix (not done — your call):** add `npm ci --dry-run` to
   `scripts/pre-release-audit.mjs`. It is the one check that would have caught this before the tag,
   and it converts a lesson into a gate rather than a note. Logged as **M13**.

### A second miss worth knowing about — M12

`gh run watch --exit-status | tail -8` reported that failing workflow as **successful**, because a
pipeline returns the *last* command's exit code — `tail`'s `0`, not `gh`'s `1`. I reported green CI
on a red run, and only caught it because the asset count came back 5 instead of 10. **A command
whose exit code is the evidence must never be piped**; read the conclusion directly:

```bash
gh run view <id> --json jobs --jq '.jobs[] | "\(.name): \(.conclusion)"'
```
