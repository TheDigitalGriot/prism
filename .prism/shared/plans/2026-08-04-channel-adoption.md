# Channel Adoption — Headless Channel-Surface Rollout

**Epic:** `channel-adoption`
**Date:** 2026-08-04
**Status:** Plan (authored headless; not yet executed)
**Source references:**
- `skills/cl-plugin-structure/references/channel-patterns.md` → *Transport Modes — Live-Push vs Passive Bus*
- `skills/fragment-sync/references/conformance-checklist.md` → row **B13** (channel transport axis)
- Reference adopters: `skills/prism-brainstorm`, `skills/prism-gavel`
- Shared server: `scripts/digital-griot-mcp/digital-griot-mcp.ts` (`capabilities:{tools:{}}`, `$STATE_DIR/events`)

> **Scope guardrail.** This plan makes Prism's skills *headless-aware passive-bus channel surfaces*. It does **not** build browser cockpits, add live-push, or modify the shared server. Every conversion is the same atomic change, applied one skill at a time, and **all implementation routes through `/prism:cl-plugin-structure`**.

---

## My Understanding

Prism's skills were written for an **interactive terminal**. Several of them gate progress on `AskUserQuestion` (or spawn interactive subagents) to get a decision from the human before proceeding. That works at a TTY — and **hangs** the moment the skill runs **headless**: under `claude -p`, in Cowork cloud, or in CI there is no console to answer, so Claude sits idle (~5s CPU, 0 output, 0 progress). Per `channel-patterns.md`, this is *exactly* why the release-cycle skills hung headless.

The fix is already proven and shipping in two skills. `prism-brainstorm` and `prism-gavel` ride the **passive bus** on the shared `digital-griot-mcp` server:

- The server declares only `capabilities: { tools: {} }` — no live-push dependency.
- **OUT:** the driving skill writes human-readable **option/progress cards as HTML** to a per-session `$SCREEN_DIR` that a cockpit (or a headless operator) can render.
- **IN:** rulings/events are appended as **JSONL to `$STATE_DIR/events`**; the skill reads that file to learn the decision.
- Because nothing waits on a pushed notification, **the same skill runs unchanged** interactively, in Cowork cloud, and under headless `claude -p`.

The Griot rule (channel-patterns.md §"bus is the substrate, push is an optional accelerator"): build on the passive bus first; **never let a skill's correctness depend on a pushed reply.** Live-push is an interactive-only accelerator and is explicitly out of scope here.

So the **required headless-safety change** for a gating skill is mechanical and identical everywhere:

1. Detect non-interactive execution (no TTY / headless run).
2. Replace each `AskUserQuestion` (or interactive-subagent) gate with: **write an option card to `$SCREEN_DIR`** + **read the ruling from `$STATE_DIR/events`**.
3. If no ruling is present (truly unattended run), **fall through to a provided, documented default** — never block.
4. Emit **progress cards** to `$SCREEN_DIR` at each phase boundary so a headless/cloud operator can watch the skill advance.

There are **30 skills** under `skills/` (excluding the non-skill `generated/` directory). Two are already done, three are internal/meta and out of scope, and **25 convert** — one story each.

### Classification (30 skills)

**ALREADY-DONE (2)** — the reference pattern; no work:
`prism-brainstorm`, `prism-gavel`.

**CONVERT (25)** — becomes a passive-bus channel surface (progress cards; `AskUserQuestion` gates replaced with `$SCREEN_DIR` card + `$STATE_DIR/events` read + default fallthrough):

- **T · Ceremony (7)** — the release/lifecycle chain; the *proven* headless-hang offenders, so highest priority:
  `prism-release`, `prism-bookend`, `prism-docs-update`, `prism-init`, `prism-sideload`, `prism-finish`, `prism-closing-ceremony`.
- **R · Reasoning (10)** — interactive decision/design surfaces that gate on human input:
  `prism-plan`, `prism-implement`, `prism-design`, `prism-iterate`, `prism-brand`, `prism-eval`, `prism-capture`, `prism-prd`, `prism-visual-docs`, `prism-codex-plan-sync`.
- **O · Output (8)** — long-running producer/QA surfaces where progress + verdict cards materially help a headless operator:
  `prism-research`, `prism-decompose`, `prism-subagent`, `prism-dispatch`, `prism-spectrum`, `prism-validate`, `prism-verify`, `prism-debug`.

**SKIP (3)** — never run as a top-level channel surface; justified in `coverage.md`:
`prism` (umbrella 4-phase orchestrator — its phases are the real surfaces, each converted individually; converting the umbrella would double-count), `cl-plugin-structure` (the authoring *reference/standard* itself — read, not executed as a workflow; it is the gold standard the rollout builds *to*), `fragment-sync` (meta/maintenance conformance sweep against the Fragment repo — and it is the very skill that *tracks* this rollout via row B13, so it must not itself become a surface).

### `prism-init` note (it was dual-listed)

`prism-init` appeared in both the ceremony CONVERT list and the assess list. **Decision: CONVERT (T-ceremony), light-touch.** It is a top-level surface (`"init prism"`) that can prompt on an existing `.prism/` directory; the only interactive gate is an overwrite confirmation, which becomes a single option card with a **safe default of "do not overwrite."**

---

## Approach

One **atomic, uniform conversion** per CONVERT skill, applied through `/prism:cl-plugin-structure` so every change lands on Prism's gold-standard patterns:

1. **Read the skill's current gates.** Identify each `AskUserQuestion` / interactive-subagent wait and each natural phase boundary.
2. **Add a `## Headless Channel Surface` section to `SKILL.md`** documenting:
   - the passive-bus contract it rides (shared `digital-griot-mcp`, `capabilities:{tools:{}}`, `$SCREEN_DIR` out / `$STATE_DIR/events` in);
   - the **option cards** it emits (one per former `AskUserQuestion`) and the **progress cards** it emits at phase boundaries;
   - the **default fallthrough** for each decision when running unattended.
3. **Replace each gate** with the write-card → read-`events` → default-fallthrough sequence (prompt-level; Claude does the `Write` to `$SCREEN_DIR` and the read of `$STATE_DIR/events` — no new server code).
4. **Verify headless.** The skill must run clean under `claude -p` with no TTY — no hang, cards written, defaults taken when `events` is empty.

Because the shared server, the `$SCREEN_DIR`/`$STATE_DIR/events` transport, and two reference consumers already exist, **no server or transport code changes** — each story is a `SKILL.md` (and, where a gate exists, its inline card contract) edit plus a headless smoke-run.

### Proposed Phases (grouped by tier)

> Priority ordering = value/risk ordering. Lower `priority` number runs first.

**Phase T · Ceremony (priority 1)** — fixes the *proven* headless hangs in the release/lifecycle chain first.
`prism-release` · `prism-bookend` · `prism-docs-update` · `prism-init` · `prism-sideload` · `prism-finish` · `prism-closing-ceremony`
*(`prism-closing-ceremony` runs last in this phase — it orchestrates bookend → docs-update → release in one headless pass, so its correctness depends on those three being headless-safe first.)*

**Phase R · Reasoning (priority 2)** — the core, most-used decision/design surfaces.
`prism-plan` · `prism-implement` · `prism-design` · `prism-iterate` · `prism-brand` · `prism-eval` · `prism-capture` · `prism-prd` · `prism-visual-docs` · `prism-codex-plan-sync`

**Phase O · Output (priority 3)** — long-running producer/QA surfaces; progress + verdict cards.
`prism-research` · `prism-decompose` · `prism-subagent` · `prism-dispatch` · `prism-spectrum` · `prism-validate` · `prism-verify` · `prism-debug`

The three phases are otherwise **independent and parallelizable**; the only cross-story dependency is `prism-closing-ceremony` → {`prism-release`, `prism-bookend`, `prism-docs-update`}.

---

## Success Criteria

### Automated Verification

- [ ] Each converted skill runs to completion under headless `claude -p` (no TTY) **without hanging** — no ~5s-idle stall on a former `AskUserQuestion` gate.
- [ ] For each converted skill, a headless run with an **empty `$STATE_DIR/events`** takes the **documented default** for every former gate and completes.
- [ ] For each converted skill, a headless run with a **seeded ruling** in `$STATE_DIR/events` reads that ruling and proceeds accordingly.
- [ ] Each converted skill **writes at least one card** (`.html`) to `$SCREEN_DIR` per run (progress and/or option card).
- [ ] `grep -rL '\$SCREEN_DIR' skills/<converted>/SKILL.md` is empty for the converted set (every converted `SKILL.md` references the bus).
- [ ] No converted skill declares `experimental["claude/channel"]` as load-bearing (passive-bus floor only): `grep -r 'claude/channel' skills/<converted>` returns nothing new.
- [ ] `claude plugin validate .` passes after each conversion (cl-plugin-structure completion gate).
- [ ] `node --check` / server unchanged: `git diff --name-only scripts/digital-griot-mcp/` is empty across the whole epic (no server edits).

### Manual Verification

- [ ] With a cockpit/operator watching `$SCREEN_DIR`, a converted ceremony skill (e.g. `prism-release`) shows its option card for a former prompt, accepts a ruling written to `$STATE_DIR/events`, and continues — proving the interactive path still works.
- [ ] Running `prism-closing-ceremony` headless in Cowork cloud completes the bookend → docs-update → release pass without a TTY prompt.
- [ ] Spot-check one skill per tier for card **readability** (the HTML card is a real, human-legible option/progress card in the Griotwave register, not a JSON dump).
- [ ] The default-fallthrough choices are **sensible and safe** (e.g. `prism-init` defaults to *not* overwriting; `prism-finish` defaults to the least-destructive option).

---

## Structural Impact

- **Files touched:** `skills/<name>/SKILL.md` for each of the 25 CONVERT skills (documentation + prompt-level card/gate logic). No new scripts, no server changes.
- **Shared server (`scripts/digital-griot-mcp/digital-griot-mcp.ts`):** **read-only reference** — unchanged. All 25 skills ride the existing passive bus (`$SCREEN_DIR` out, `$STATE_DIR/events` in).
- **Transport:** passive bus only. No `experimental["claude/channel"]` live-push added anywhere.
- **Blast radius:** each `SKILL.md` is loaded independently at skill-invocation time; converting one cannot break another. The only ordering constraint is `prism-closing-ceremony` after its three sub-skills.
- **Conformance:** completes the *adoption* half of `fragment-sync` row **B13** for Prism's own skills (the reference implementation the checklist points at).
- **Reversibility:** each story is a self-contained `SKILL.md` diff; revertible per skill with no cross-coupling.

---

## What We Are NOT Doing

- **NOT** building browser cockpits / `visual-companion.md` for the converted skills. The passive-bus card write to `$SCREEN_DIR` is the load-bearing transport; the interactive browser cockpit is an *optional accelerator* (only `prism-brainstorm`/`prism-gavel` have one) and is out of scope.
- **NOT** adding live-push (`experimental["claude/channel"]` + `notifications/claude/channel`). It is interactive-only and inert headless — the opposite of this rollout's goal.
- **NOT** modifying the shared `digital-griot-mcp` server or its transport. The bus already exists.
- **NOT** re-converting `prism-brainstorm` / `prism-gavel` (already done) or converting the 3 SKIP skills.
- **NOT** editing the `cl-plugin-structure` skill — we *use* it to do the conversions; we do not change the standard.
- **NOT** building the durable `run_device_skill(skill, args, answers)` MCP verb (named as a future target in channel-patterns.md); this rollout is the prompt-level adoption, not the invocation harness.
- **NOT** executing any conversion in this run. This is author-only: plan + stories + coverage, committed, then stop.

---

## Session Notes

- **Authored headless.** This plan was written non-interactively (no `AskUserQuestion` approval loop). It follows the prism-plan **contract-plan structure** — My Understanding → Approach → Phases → two-category Success Criteria → Structural Impact → What We Are NOT Doing — but the interactive per-section approval was necessarily skipped; treat this document as a proposed contract awaiting Gavin's review before execution.
- **`prism-init` dual-listing resolved** to CONVERT (T-ceremony, light-touch, safe default = no overwrite). Documented above and in `coverage.md`.
- **`prism-verify` / `prism-validate`** have no hard `AskUserQuestion` gate today; they are converted as **additive progress/verdict surfaces** (the QA gates a headless operator most wants to watch) plus a card for any ambiguous manual-verification item. Noted in their stories.
- **Every story routes through `/prism:cl-plugin-structure`** — non-negotiable per the ecosystem rule that any change to a Griot-suite tool goes through Prism's gold standard.

### Executor recommendation → **`prism-spectrum`** (primary)

The story graph is **25 near-independent stories**, each the *same* atomic conversion touching one `SKILL.md`, with a single soft dependency (`prism-closing-ceremony` last). That profile is the textbook Spectrum case:

- **Scale:** 25 stories ≫ the 3–10 sweet spot for `prism-subagent` (one session) and far past `prism-implement` (single phase).
- **Fresh context per story** avoids degradation across 25 repetitive conversions and lets each story's headless smoke-test run clean in isolation.
- **Quality gate** maps directly to the success criteria: *"the converted skill runs clean under headless `claude -p`."*
- **`progress.md` accumulation** captures the shared conversion recipe once and reuses it — ideal for a uniform change repeated 25×.
- Run order = the tier priorities (T → R → O); `blockedBy` keeps `prism-closing-ceremony` after its three sub-skills.

**Routing specifics:**
- **Primary:** `/decompose_plan` (this stories.json is already decompose-shaped) → `./scripts/spectrum.sh`, quality gate = headless `claude -p` smoke-run per story. Each story's implementation step **must** invoke `/prism:cl-plugin-structure`.
- **Supervised alternative for Phase T:** because the ceremony skills are the proven-hang, highest-risk set, an operator may prefer to drive **Phase T (7 stories) with `prism-subagent`** in one supervised session first (two-stage review, bounded retries), then hand **Phases R + O (18 stories) to Spectrum** overnight.
- **Not recommended:** `prism-dispatch` (fan-out of *independent problem domains* — here the domains are identical, so per-story fresh sessions beat one parallel blast) or `prism-implement` (single-phase; far too thin for 25 stories).
