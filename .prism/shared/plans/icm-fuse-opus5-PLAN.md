# ICM Fuse + Opus 5 + Multi-surface — Implementation Plan

> **Scope:** Plan only. No source files were modified in producing this document (git status shows
> only this plan + `.prism/local/icm-fuse-progress.txt`). Written against `prism` @ **4.10.0** on branch
> `feat/icm-fuse-opus5-multisurface`. Every file:line below was re-verified through code-intel discovery
> agents (graph-navigator / codebase-analyzer / codebase-locator) at plan time — not copied from the
> superseded 4.8.0 `OPUS5-INCORPORATION-PLAN.md`. Grounding ledger at the end (§8).

This plan supersedes `OPUS5-INCORPORATION-PLAN.md` for the Opus-5 workstream and folds it into three
additional workstreams under the locked Option-C decision. It is organized as five workstreams (W1–W5),
an execution ordering (§6), verification commands (§7), and a per-repo release checklist (§7.6).

---

## 0. The four locked decisions (planned to, not relitigated)

1. **W1 — Full Option-C ICM fuse.** Thread the ICM run-contract + code-intel-slice pattern natively into
   every pipeline skill; add a Griot-MCP verb (`icm_prism_run`) that owns contract-write + thin-launch +
   heartbeat-poll; surface stage-contract progress via the app-bus cards; make **Fragment emit the ICM
   scaffold** ("icm-infuse"); `fragment-sync` enforces the 10 ICM invariants.
2. **W2 — Opus 5 governance = effort-dial + a visibility add-on.** No Fable-style gate on Opus 5. Optional
   light confirm on `xhigh|max` only. Build a visibility layer that emits gate/downgrade events to the
   file bus. **Parallel `opus5` key** (keep `opus = claude-opus-4-8` reachable for A/B) — final call in §2.1.
3. **W2 — Fold in the Opus 5 prompting guide.** Prompt for concision; remove self-verify scaffolding;
   set deterministic subagent caps; re-sweep effort defaults; keep thinking ON, lower effort for cost.
4. **W5 — Multi-surface.** Fragment also emits/adapts to ChatGPT Skills + ChatGPT Work + Gemini Gems.
   This pass **designs** the adapter (§5); the working adapter is built after.

---

## W1 — ICM fuse into the pipeline skills

### 1.1 The canonical ICM run-contract reference (one home, invariant 8)

**Create one canonical file** every pipeline skill points at (no per-skill copy — a link beats a copy):

- **New:** `skills/icm-architect/references/prism-run-contract.md` — the ICM↔Prism binding. It is L3 factory
  material (stable across runs). It defines, by pointing at the existing method (never re-inlining it):
  - The stage-contract shape, referencing the existing template `skills/icm-architect/assets/templates/stage-CONTEXT.md:1-21` plus the Prism-pipeline additions: a **Locked Decisions** block and a **Heartbeat tokens** block (the shape used by *this* run's contract).
  - The code-intel-slice rule: ground every claim via discovery agents (graph-navigator / codebase-analyzer / codebase-locator / prism-locator), query the graph, never photocopy whole files — mirrors the invariant 7 token discipline (`skills/icm-architect/references/core.md:80-82`, 2k–8k tokens/step).
  - The heartbeat protocol: append one timestamped token line per numbered step to `.prism/local/<stage>-progress.txt`.
  - The honor rule: "read the contract first; do not relitigate its Locked Decisions; proceed autonomously; do not ask (headless hangs on interactive prompts)."
- **New template (for `icm_prism_run` to instantiate):** `skills/icm-architect/assets/templates/prism-stage-CONTEXT.md`
  — the blank Prism-flavored stage contract (Role · Inputs [Working|Reference] · Locked Decisions · Process
  [numbered] · Success criteria · Heartbeat tokens). Instantiate-by-copying (invariant 10) — this file *is*
  the copy source.

**Why here:** `skills/icm-architect/` already owns the ICM method (SKILL.md, `references/core.md`,
`references/forms.md`, `assets/templates/stage-CONTEXT.md`, `assets/templates/CLAUDE.md`). The run-contract
reference is the Prism binding of that method; it belongs beside it, not duplicated into nine skills.

### 1.2 The run-contract pointer — exact insertion line per skill

Each pipeline skill gets **one line** at the top of its workflow: *"If this run was launched with a stage
contract (a `*-CONTEXT.md` in `.prism/shared/plans/`, or the path in `$PRISM_ICM_CONTRACT`), read it first
and honor its Inputs / Locked Decisions / Success criteria before anything else. See*
`skills/icm-architect/references/prism-run-contract.md`.*"

Verified insertion points (all currently have **zero** CONTEXT.md / stage-contract references):

| Skill | File | `## Workflow` | First load-context step | **Insert pointer at** |
|---|---|---|---|---|
| prism-research | `skills/prism-research/SKILL.md` | L48 | `### 0. Read Mentioned Files First` L50 | **L49** |
| prism-plan | `skills/prism-plan/SKILL.md` | L38 | `### 1. Load Context` L40 | **L39** |
| prism-design | `skills/prism-design/SKILL.md` | L68 | `### 1. Load Ledger` L70 / `### 2. Load Supporting Context` L74 | **L69** |
| prism-implement | `skills/prism-implement/SKILL.md` | — | `### 1. Load Stories + Plan` L19 (block L19-31) | **L32** (after Step-1 block, before `### 2.` L33) |
| prism-validate | `skills/prism-validate/SKILL.md` | — | `### 1. Load Plan and Git State` L18 (block L18-29) | **L30** (after block, before `### 1a.` L31) |
| prism-prd | `skills/prism-prd/SKILL.md` | — | `### Step 1: Check for Existing Context` L29 (block L29-38) | **L39** (after block, before `### Step 2` L40) |
| prism-decompose | `skills/prism-decompose/SKILL.md` | `## Process` L32 | `### Step 1: Read the Full Spec` L34 | **after L31** (before `## Process` L32) |
| prism-spectrum | `skills/prism-spectrum/SKILL.md` | `## Workflow` L39 | `### 1. Load State` L41 (block L41-58) | **after L38** (before `## Workflow` L39) |
| prism-subagent | `skills/prism-subagent/SKILL.md` | `## Core Loop` L21 | `1. Pre-flight` L23 | **after L20** (before `## Core Loop` L21) |

Notes grounded in discovery:
- prism-prd already dispatches a discovery agent (`Task(subagent_type="prism-locator")` at `skills/prism-prd/SKILL.md:34`) — the pointer sits above it.
- prism-design declares inputs in frontmatter (`skills/prism-design/SKILL.md:7-13`, `.prism/shared/plans` at L12); prose-top insertion (L69) keeps parity with research/plan.
- prism-spectrum already reads a contracts convention (`skills/prism-spectrum/SKILL.md:65-66`, `contracts_to_read`) and `.prism/shared/spectrum/progress.md` (L36) — the ICM pointer is a distinct, higher-level "run contract," not the story-contract lifecycle.

### 1.3 Mirror obligation

`apps/prism-setup/resources/plugin/` ships a byte-identical copy of the plugin (verified identical for
`model-config.md`, `model-selection.md`, `fable-gate.sh`, `hooks.json`, and the MCP server — §W2/§W1.4).
**Every skill edit in §1.2 and the new reference/template in §1.1 must be re-copied** into
`apps/prism-setup/resources/plugin/skills/...` or the installed plugin drifts. This is a checklist row in §7.6.

### 1.4 The `icm_prism_run` MCP verb (owns contract-write + thin-launch + heartbeat-poll)

**Server:** `scripts/digital-griot-mcp/digital-griot-mcp.ts` (live, 1034 lines) **and** its byte-identical
bundled mirror `apps/prism-setup/resources/plugin/scripts/digital-griot-mcp/digital-griot-mcp.ts`. Both
must receive the identical edit.

Registration pattern (grounded): tools are a `const GAVEL_TOOLS = [...] as const` array
(`digital-griot-mcp.ts:84-249`), advertised by the `ListToolsRequestSchema` handler
(`:779-785`), and dispatched by a `switch (name)` in the `CallToolRequestSchema` handler (`:788-817`,
`default` at `:806`). Schemas are **raw JSON Schema** (no zod). Success returns via `okJson` (`:504-506`),
errors via `errJson` (`:774-776`). Session/state dir precedence is `resolveStateDir` (`:384-404`) →
`.prism/local/gavel/<id>/state`. Write pattern: `fs.mkdirSync(dir,{recursive:true})` +
`fs.writeFileSync(...)` (`:571-573`). External-process precedents: `execFileSync` (imported `:54`, used
`:302-305`) for blocking spawn; `async` + `fetch` (`handleGavelVerify` `:639-688`, awaited at `:800`).

**Three edits, applied to BOTH files:**
1. Append a tool definition object to `GAVEL_TOOLS` before the closing `] as const` at `:249`, following the
   `gavel_open` shape (`:158-175`).
2. Add `case "icm_prism_run":` (and `case "icm_prism_status":`) to the dispatch switch before `default:` at
   `:805`; `await` them (mirror the async `gavel_verify` case at `:800`).
3. Add `handleIcmPrismRun(args)` / `handleIcmPrismStatus(args)` returning via `okJson`/`errJson`.

**`icm_prism_run` signature (raw JSON Schema, mirroring `:158-175`):**

| Field | Type | Req | Meaning |
|---|---|---|---|
| `stage` | string enum `research\|plan\|design\|implement\|validate\|prd\|decompose\|spectrum\|subagent` | ✔ | which pipeline stage |
| `contract_markdown` | string | ✔ | full stage-contract body to write (instantiated from the §1.1 template) |
| `project_dir` | string | — | defaults `PRISM_PROJECT_DIR` → cwd (mirror `resolveStateDir` `:389-392`) |
| `router_prompt` | string | — | thin router prompt; if omitted, generate the default "run the `<stage>` stage; read the contract at `<path>`; execute; heartbeat; proceed autonomously; do not commit" |
| `model` | string | — | `opus\|opus5\|sonnet\|haiku` (default per stage — §2.3) |
| `effort` | string enum `low\|medium\|high\|xhigh\|max` | — | forwarded to the headless run |
| `launch` | boolean | — | default `true`; `false` = write contract + return path only (dry-run) |
| `heartbeat_tokens` | string[] | — | expected token sequence for `icm_prism_status` to poll |

**Behavior:** (1) resolve a session dir `<project>/.prism/local/icm/<id>/` via a `resolveStateDir`-style helper
(`:384-404`); (2) write the contract to `.prism/shared/plans/<date>-<stage>-CONTEXT.md` **via TEMP + Copy-Item**
to survive Controlled Folder Access (per the CLAUDE.md ICM protocol); (3) init the heartbeat file
`.prism/local/<stage>-progress.txt`; (4) if `launch`, spawn detached `claude -p` with **flags before `-p`**
and a **quote-free instructions file** (per the control-tested launcher note in CLAUDE.md), using the
`execFileSync` precedent (`:54`,`:302-305`) or an async spawn; (5) emit a `verb:"icm-progress"` JSONL line to
the file-bus events log (§1.5); (6) return `{ contract_path, heartbeat_path, session_dir, pid? }`.
**`icm_prism_status(session_dir|id)`** reads the heartbeat file + `git`-tracked file writes (reuse the
`execFileSync("git", …)` precedent `:302-305`) and returns `{ tokens_seen, done, files }`.

### 1.5 Stage-contract progress on the app-bus cards

Grounded constraint: this MCP process does **not** write the wake-events file itself — the popout's
`server.cjs` writes `$STATE_DIR/events` (comment `digital-griot-mcp.ts:954-956`); the MCP `/channel` POST
handler only relays an in-process notification (`:916-975`, content at `:961`). The MCP **reads** an events
JSONL in `handleGavelCommit` (`:697-712`, path `:697`, backward scan `:700-711`).

**Plan:** `icm_prism_run` appends `{ verb:"icm-progress", stage, token, done, ts }` JSONL lines to the same
`$STATE_DIR/events` file the popout/app-bus already tails, so the existing Cowork/electron card renderer
picks up stage-contract progress with no new bus. `icm_prism_status` reads it back with the `handleGavelCommit`
read pattern (`:697-712`). This satisfies "surface stage-contract progress via the app-bus cards" by reusing
the card bus, not building a parallel one.

---

## W2 — Opus 5: model line, effort dial, visibility layer, prompting-guide sweep

Routing lives across three independent surfaces + a bundled mirror. An edit to one does **not** propagate.

### 2.1 Decision: parallel `opus5` key (final call)

**Adopt the parallel `opus5` key.** Keep `MODEL_IDS.opus = "claude-opus-4-8"` reachable for A/B eval; add
`opus5: "claude-opus-5"`. Rationale: safer, explicit, and honors decision W2's "keep opus reachable for A/B."
Frontmatter agents that should ride the ceiling stay on the `opus` alias and roll forward only when we flip
the alias; the runtime map is pinned. (Matches `model-config.md §2` alias-vs-pinned rule, heading at
`skills/cl-plugin-structure/references/model-config.md:42`.)

### 2.2 Surface A — Plugin docs/guidance (no executable routing)

| Change | File:line (verified 4.10.0) | Action |
|---|---|---|
| Add Opus 5 row to the model-line table (`claude-opus-5`, 1M, 128k out, $5/$25, effort `low…max` default `high`) | `skills/cl-plugin-structure/references/model-config.md` §1 heading L21, table **L25-30** (rows: Fable5 L27, Opus4.8 L28, Sonnet L29, Haiku L30) | insert Opus 5 row; keep Opus 4.8 row for A/B |
| Note alias resolution `opus → claude-opus-5` (when we flip) | §2 heading **L42**, §3 alias table **L63-67** | add Opus 5 alias note |
| Add Opus 5 to the effort matrix; re-sweep defaults (low/medium now strong) | §4 heading **L83**, capability table L87-92, defaults **L94-99** | add row; re-baseline defaults |
| Currency-check reference for the sweep | §9 heading **L243**, steps L247-255 | run the grep audit (§7) |
| Tier notes + "Opus is the ceiling" reframe + cost ratios | `skills/prism-spectrum/references/model-selection.md` tiers **L5-34**, ceiling cells **L57/L60**, ceiling statement **L67**, cost-ratio heading **L69**, ratios **L72-75** | Opus 5 becomes ceiling; re-baseline ratios (ceiling is now cheaper-per-capability) |
| Model Configuration tier table in the gold-standard skill body | `skills/cl-plugin-structure/SKILL.md` "Model Configuration" section | add Opus 5 row |

Mirror: both docs are **byte-identical** in `apps/prism-setup/resources/plugin/...` — re-copy after editing.

### 2.3 Surface B — App runtime (the only hardcoded-ID surface; the "expose the dial" code)

`apps/prism-vscode/src/core/api/claude-sdk.ts` (all verified current):
- `MODEL_IDS` object **L24-29** (`opus:"claude-opus-4-8"` L25, sonnet L26, haiku L27, fable L28) → **add `opus5:"claude-opus-5"`**; `type ModelName` (**L31**) updates automatically from the keys.
- `PrismApiHandlerOptions` **L37-46** (fields `apiKey?` L43, `model?` L44, `maxTokens?` L45 — **no `effort`**) → **add `effort?: "low"|"medium"|"high"|"xhigh"|"max"`**.
- `this._model = MODEL_IDS[options.model ?? "sonnet"]` **L77**; default `maxTokens ?? 8192` **L78** → optionally raise ceiling toward 128k **per-call** for long-output stages (bounded, not global).
- `messages.stream({...})` **L105-113** sends only `model` L106 / `max_tokens` L107 / `system` L108 / `messages` L109 / `tools` L110-112 — **no effort/output_config/thinking today** → **add the effort param** (SDK `output_config`/effort) defaulting to `"high"` when unset. **This is the concrete "expose the dial."**
- `refusal` stop-reason already handled **L171-175** — Opus 5 shares the Opus-family surface, so no new handler.

`apps/prism-vscode/src/core/task/index.ts`:
- `CreateTaskOptions` **L315-322** (no `effort`) → **add `effort?`**.
- `createTask()` **L324-344**; calls `resolveGatedModel(options.model, workspaceRoot)` **L331**; constructs `new PrismApiHandler({ apiKey, model })` **L333-336** → **thread `effort`** into the handler, mirroring how `model` already flows.

`apps/prism-vscode/src/core/api/fable-gate.ts` — **no change to gating logic.** Opus 5 already passes through:
`resolveGatedModel()` **L27-52**, non-fable pass-through **L32-34**; fable falls back to `"opus"` on
deny/disabled **L39, L51**. (Opus 5 is not Fable-class-metered; no new gate — decision W2.)

`packages/prism-core/src/core/api/auth.ts` — **no change.** `resolveAnthropicAuth()` **L97-108** is
model-agnostic (subscription-first); `ALLOW_METERED_ENV="GRIOT_ALLOW_METERED"` **L69**;
`OAUTH_TOKEN_ENV="CLAUDE_CODE_OAUTH_TOKEN"` **L57**, consumed **L103**. Opus 5 inherits this unchanged.

### 2.4 The visibility layer (the net-new "never see the gate" fix)

Grounded gap: today the downgrade is **silent** — `fable-gate.ts` returns `"opus"` on deny/disabled
(**L39, L51**) and the shell `scripts/fable-gate.sh` denies flag-OFF (**L81-83**) / asks flag-ON (**L75-79**)
with **no event written anywhere the Cowork/headless surface can read**. That is Gavin's "leaky / never see
it" complaint.

**Plan — emit a model-gate event at each decision point to the file bus:**
- `fable-gate.ts` — before returning a downgraded/gated model at **L39** and **L51**, append
  `{ type:"model-gate", requested, resolved, reason, effort, ts }` JSONL to a file-bus log
  (`.prism/local/model-events.jsonl`, or the shared `$STATE_DIR/events` for card rendering — pick the
  events file so §1.5's card bus renders it too).
- `claude-sdk.ts` — when `effort` is defaulted/clamped in the stream call (**L105-113**), emit an
  `{ type:"effort-resolved", requested, applied }` event.
- `scripts/fable-gate.sh` — on deny (**L81-83**) and ask (**L75-79**), append the same JSONL shape (shell
  `printf >>`). This makes the shell-gate path legible on the headless/Cowork surface, which today sees nothing.
- `icm_prism_status` (§1.4) and the app-bus card (§1.5) surface these events → "requested fable → downgraded to
  opus (flag off)" is now visible instead of silent.

**Optional light confirm (decision W2, flag for Gavin):** gate `effort: xhigh|max` behind a one-shot confirm
on the app surface — a lighter, effort-level guard, categorically different from Fable's model-level gate.
Recommend: default-only (no gate); adopt the confirm only if a cost ceiling is wanted. **Do not** add Opus 5
to `fable-gate.sh`'s gated set (**L41-44**); **do not** create an `opus5.flag`.

### 2.5 Surface C — Paseo daemon / mobile

`apps/prism-mobile/packages/server/src/server/agent/providers/claude/claude-models.ts` (path glob-resolved):
- `CLAUDE_MODELS` **L18-61** tops out at Opus 4.7 (`isDefault` is **Opus 4.6**, L40-47) → **prepend an Opus 5
  entry** (`id:"claude-opus-5"`, `label:"Opus 5"`, `isDefault:true`, `thinkingOptions: CLAUDE_OPUS_4_7_THINKING_OPTIONS`)
  and move `isDefault` off 4.6. Add a `[1m]` variant if the 1M UX is surfaced.
- `CLAUDE_THINKING_OPTIONS` **L3-8** (no xhigh); `CLAUDE_OPUS_4_7_THINKING_OPTIONS` **L10-16** (xhigh-inclusive)
  → reuse the xhigh set for Opus 5.
- `normalizeClaudeRuntimeModelId()` **L71-95**, family regex **L83-85** (`opus|sonnet|haiku` only; non-match →
  `null` L87) → **extend the family group to include `opus-5`** so runtime init messages normalize.
- Local lanes (Ollama `:11434`, DeepSeek, Kimi K3): **config only**, not code — Paseo custom provider
  (`extends:"claude"` + `ANTHROPIC_BASE_URL`), documented as the tier below Haiku in `model-selection.md`.
  Not a `MODEL_IDS` key — it's a provider, not a tier.

### 2.6 Prompting-guide sweep (decision W2 #3) — surgical, not blanket

The guide says remove *self*-verification (Opus 5 verifies its own output) — **not** independent cross-agent
review of a *different* agent's code. Be surgical:

**Remove / soften (self-verify + "final verification step" scaffolding):**
- `skills/prism-validate/SKILL.md` — the Distrust Pattern block **L50-81** (esp. L52 "Do NOT trust
  self-reported completion"), and the Iron Law fresh-verification gate **L182-197** (L185). These target a
  model verifying its *own* claims → soften under Opus 5 self-verification. **Keep** the `visual-regression-grader`
  Task **L111-118** (it judges a diff, an independent artifact).
- `skills/prism-subagent/SKILL.md` — the "Final pass — single full-implementation reviewer" **L32** (the
  "final verification step" the guide names) → drop. **Keep** spec-reviewer/quality-reviewer (**L28-29**),
  because the Subagent Role Audit (**L62-74**, e.g. L68) justifies them as reviewing code produced by a
  *different* agent — independent cross-review, not self-verify.
- `skills/prism-spectrum/SKILL.md` — Two-Stage Review **L219-261** (spec-reviewer L227, quality-reviewer L242):
  **keep** (independent cross-review), but remove any "then verify your own work again" language and note it is
  optional under Opus 5. 5b/5c browser/visual (**L262-272**) unchanged.

**Add deterministic subagent caps (none exist today — confirmed across all three skills):**
- Set `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` and `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` in the env blocks. Home:
  `skills/prism-spectrum/SKILL.md` near the existing env line `CLAUDE_CODE_DISABLE_1M_CONTEXT=1` (**L13**) and
  the launcher scripts (`scripts/spectrum.sh`); document in `model-config.md`. **Requires Claude Code ≥ 2.1.217**
  — add a version-gate note beside the caps.

**Concision + effort:**
- Add a concision instruction (Opus 5 defaults to longer output) to the shared reference `prism-run-contract.md`
  (§1.1) so it applies pipeline-wide, plus the skill bodies' output sections.
- Re-sweep effort defaults in `model-config.md §4` (**L94-99**) — low/medium are now strong; keep thinking ON
  and lower effort for cost rather than disabling thinking.

---

## W3 — (folded into W1) Griot-MCP verb

The `icm_prism_run` / `icm_prism_status` verbs are specified in §1.4–1.5 (same server, both mirrors). No
separate workstream — kept here as a cross-reference so the release checklist (§7.6) treats
`digital-griot-mcp` as its own releasable unit.

---

## W4 — Fragment "icm-infuse": emit the ICM scaffold + enforce it

**Repo:** `../fragment-ai-scaffold` (sibling, outside Prism). Templates live at
`packages/create-fragment/templates/{base,core,ui,electron,vscode,tui,mobile,mcp}/`. The generator copies
them: entry `src/index.ts:22-58` (`init <name>` → `runInit`), orchestrator `src/commands/init.ts:19-80`
(base copy L36, surfaces L53-64), copier `src/engine/copier.ts:14-56` (strips `.tmpl`, token-substitutes).
Today it emits `base/CLAUDE.md.tmpl` (41 lines, routing + `.prism/shared/` refs) and `base/.prism/README.md.tmpl`
— but **no stage-contract / CONTEXT.md** and no code-intel wiring.

### 4.1 What Fragment must emit (new template files under `templates/base/`)

Because `copyDir` (`copier.ts:23-56`) copies recursively and strips `.tmpl`, **most of this is add-files-only,
no generator code change**:
1. `templates/base/.prism/shared/plans/_TEMPLATE-stage-CONTEXT.md.tmpl` — the Prism stage-contract template
   (Role · Inputs [Working|Reference] · Locked Decisions · Process · Success · Heartbeat), mirroring §1.1's
   `prism-stage-CONTEXT.md`. Satisfies invariants 4 (explicit contract) + 6 (edit surface).
2. `templates/base/.prism/shared/ref/icm-run-contract.md.tmpl` — the emitted copy of §1.1's canonical
   reference (or a pointer to the plugin if the scaffolded app depends on Prism). Satisfies invariant 8.
3. Extend `templates/base/CLAUDE.md.tmpl` (currently 41 lines) with two sections: the **ICM stage-walk
   protocol** (headless device-side run, thin router prompt, heartbeat — the pattern this very run used) and a
   **code-intel-first routing block** ("prefer graph tools over Glob/Grep; discovery agents do the locating").
   Keep it a routing entry file — invariant 2 (≤~60 lines, routes not content). This is the only *edit* (vs add).
4. `templates/base/.gitnexus/` (or a codebase-memory-mcp config stub) so scaffolded apps are born code-intel-wired
   (invariant 7).
5. The meta-skills Fragment already emits (`templates/base/skills/{bookend,docs-update,release,closing-ceremony}/SKILL.md`,
   all `model: sonnet`) get the ICM run-contract pointer at their Workflow top (same one-liner as §1.2).
6. `mcp/` template — expose `icm_prism_run` in the emitted MCP server so scaffolded apps can drive their own
   headless ICM runs. If the verb needs wiring beyond a static template, touch `src/engine/generators/mcp-glue.ts`
   (parallel to the existing `electron/vscode/mobile-glue.ts` generators).

### 4.2 fragment-sync conformance rows (enforce the 10 ICM invariants)

**File:** `skills/fragment-sync/references/conformance-checklist.md`. Structure: Section A (A1-A7, L7-17),
Section B (`create-fragment`, B1-B13, L19-35), Model-line reference L37-41, Idempotence L43-45. The model-line
row is **B3 (L25)** (not B8/B9 — B8 L30 is auth, B9 L31 is meta-skills). **Append new rows after L35, before
the L37 `## Model line reference` header** (next number **B14**):

| New row | Enforces (invariant) | Emitted evidence path |
|---|---|---|
| **B14** | Emitted `CLAUDE.md` is a routing entry file (≤~60 lines, routes not content) — inv. 2 | `templates/base/CLAUDE.md.tmpl` |
| **B15** | Emitted `.prism/shared/plans/` carries a stage-CONTEXT template with Inputs[Working\|Reference]/Process/Success/Heartbeat — inv. 4, 6 | `templates/base/.prism/shared/plans/_TEMPLATE-stage-CONTEXT.md.tmpl` |
| **B16** | Emitted skills carry the ICM run-contract pointer at Workflow top — inv. 7 (load only what the step needs) | `templates/base/skills/*/SKILL.md` |
| **B17** | Emitted project is code-intel-wired (graph-tools-first `CLAUDE.md` block + config stub) — inv. 7, 8 | `templates/base/.gitnexus/`, `CLAUDE.md.tmpl` |
| **B18** | Emitted `mcp/` exposes `icm_prism_run` (contract-write + launch + heartbeat) — decision W1 | `templates/mcp/...`, `src/engine/generators/mcp-glue.ts` |

Also update **B3 (L25)** and the **Model-line reference (L37-41)** to the Opus 5 line from §2. Reconcile via
`/prism:fragment-sync` (the checklist is B-numbered; idempotence marked per L43-45).

---

## W5 — Multi-surface deploy adapter (design only; build after)

### 5.1 Grounded format findings (primary sources in §8)

| Element | Claude Skills | ChatGPT Skills | Custom GPT | Apps SDK | Gemini Gems |
|---|---|---|---|---|---|
| Packaging unit | folder + `SKILL.md` | folder + `SKILL.md` (near-identical) + `agents/openai.yaml` | UI config object (no file) | hosted **MCP server** + `chatgpt-app-submission.json` | **none** (in-app object) |
| Instructions | `SKILL.md` md body | `SKILL.md` md body | builder text field | per-tool `description` (no single prompt) | free-text field |
| Tool schema | frontmatter grants | `openai.yaml` MCP deps | **OpenAPI** (Actions) | MCP tool reg (JSON Schema) | one "Default tool" pick |
| Knowledge files | `references/`,`assets/` | `references/`,`assets/` | 20 files ×512MB | server-side | 10 files ×100MB |
| Code exec | `scripts/` | `scripts/` | ✗ | server-side only | ✗ |
| Programmatic creation | git files | git files | Builder UI only | MCP + submission JSON | **no official API** |

### 5.2 Adapter architecture — shared IR + per-target sinks

**Shared layer (target-agnostic "Fragment Skill IR", `skill.ir.json`):** name + description + instructions
(markdown) + knowledge files + a coarse primary-capability. This is the safe common denominator across all
five surfaces.

**Per-target emitters** (new `src/engine/adapters/*.ts` in Fragment; built after this plan):
- `claude.ts` — `SKILL.md` + `scripts/` + `references/` (Fragment's native home format).
- `chatgpt-skills.ts` — `SKILL.md` (~90% shared with Claude) + `agents/openai.yaml` (MCP tool deps) +
  `scripts/`. **Share ~90% of logic with the Claude emitter.**
- `chatgpt-apps.ts` — reuse Fragment's existing `mcp/` surface as the hosted MCP server + emit
  `chatgpt-app-submission.json` (`schema_version:1`, per-tool `readOnlyHint`/`destructiveHint`/`openWorldHint`
  + justification, `app_info`, **≥5 positive + 3 negative test cases** — missing hints are submission blockers).
  Cloud/local split: logic runs cloud (hosted MCP server), UI in ChatGPT's sandbox; no local exec.
- `custom-gpt.ts` — emit an **OpenAPI Actions schema** (≤~1MB, ≤30 operations) + instructions text + a
  knowledge-file manifest for **manual builder entry** (no installable artifact; Custom GPT can't mix Actions+Apps).
- `gemini-gems.ts` — **guidance only**: a copy-paste instruction block (Persona/Task/Context/Format) + a
  manual file-attach checklist (10×100MB). **No manifest, no official API** — never emit an "installable" Gem.
  Flag any reverse-engineered client as non-production.

**Hardest per-target layer:** the tool-schema shape (JSON-Schema/MCP vs OpenAPI vs none) — three structurally
incompatible formats; the IR carries a normalized tool spec that each adapter down-translates. **Deploy sinks
differ per target** (git-scan / GPT-Store publish / plugin-directory submission with test cases / manual UI).

**Explicit constraint to surface, not engineer around:** Gemini Gems and Custom GPTs have no portable file
format; the adapter's honest output for those is guidance + manual steps, not an artifact.

---

## 6. Execution ordering

1. **W2 Surface A (docs)** — lowest risk: `model-config.md`, `model-selection.md`, `cl-plugin-structure/SKILL.md`.
2. **W1.1 canonical reference + template** — create `prism-run-contract.md` + `prism-stage-CONTEXT.md`.
3. **W1.2 skill pointers** — the nine one-line insertions.
4. **W2.6 prompting-guide sweep** — self-verify removal + subagent caps + concision (touches the same skills as W1.2; do together).
5. **W2 Surface B (code)** — `MODEL_IDS` + effort plumbing + task threading; then the **visibility layer** (W2.4).
6. **W2 Surface C (mobile)** — `claude-models.ts` registry + normalizer.
7. **W1.4 MCP verb** — `icm_prism_run`/`icm_prism_status` in both server copies + app-bus wiring (W1.5).
8. **Mirror sync** — re-copy every changed plugin file into `apps/prism-setup/resources/plugin/`.
9. **W4 Fragment icm-infuse** (sibling repo) — emit templates + `mcp-glue`.
10. **W4.2 fragment-sync** — append B14-B18 + update B3/model-line; run `/prism:fragment-sync`.
11. **W5 adapters** — design frozen here; build in a follow-up branch.

---

## 7. Verification commands

### 7.1 Plugin (Surface A + skills + MCP)
- `claude plugin validate .` — **must pass clean** after any frontmatter/hooks/plugin.json edit (authoritative for Claude Code + Cowork).
- Currency check (`model-config.md §9`, L243): `grep -rE 'claude-(opus|sonnet|haiku|fable)-[0-9a-z]' --include=*.ts --include=*.md` over runtime code; confirm no stray `claude-opus-4-8` left where the ceiling should resolve to Opus 5; confirm min Claude Code ≥ 2.1.217 for the subagent caps.

### 7.2 App runtime (Surface B)
- `cd apps/prism-vscode && <typecheck>` (tsc) — verify `MODEL_IDS`/`ModelName`/`effort` types compile.
- Run `apps/prism-vscode/src/core/api/__tests__/` — the `auth-resolve` and `fable-gate` tests must stay green (gating unchanged; assert Opus 5 passes through `resolveGatedModel`).

### 7.3 Mobile (Surface C)
- Run the collocated `claude-models.test.ts` **single file only** (repo rule: never the full mobile suite) — assert Opus 5 entry + `normalizeClaudeRuntimeModelId("claude-opus-5")` resolves.

### 7.4 MCP server
- Lint/typecheck `digital-griot-mcp.ts`; smoke-test `icm_prism_run` with `launch:false` (dry-run) → asserts contract written to `.prism/shared/plans/*-CONTEXT.md` + heartbeat initialized, no headless spawn.
- Confirm live vs bundled mirror stay byte-identical (`diff` the two `digital-griot-mcp.ts`).

### 7.5 Fragment (sibling repo)
- Scaffold a throwaway app (`create-fragment init _icm-smoke`); assert it emits `.prism/shared/plans/_TEMPLATE-stage-CONTEXT.md`, the ICM stage-walk + code-intel sections in `CLAUDE.md`, and `icm_prism_run` in the mcp surface.
- `/prism:fragment-sync` — B14-B18 + B3 must report conformant (idempotent clean run).

### 7.6 Per-repo release checklist
- **Prism** (`GriotApps/Prism`): Surface A/B/C edits, skill pointers, prompting sweep, MCP verb, **mirror re-copy into `apps/prism-setup/resources/plugin/`**, `claude plugin validate .`, currency check. **Do NOT** edit `.prism/shared/evals/**` snapshots, historical research/docs, or add a Fable-style flag for Opus 5.
- **fragment-ai-scaffold** (sibling): new `templates/base/.prism/...` + `CLAUDE.md.tmpl` edit + `mcp-glue`; scaffold smoke test.
- **Cinopsis** (and other Fragment-born apps): re-scaffold/adopt via `/prism:fragment-sync` once Fragment emits ICM — no manual per-app ICM authoring.
- **digital-griot-mcp**: released as part of Prism (both copies) — verify the two files byte-identical post-edit.

---

## 8. Grounding ledger (research findings this plan cites)

Each finding was produced by a code-intel discovery agent (graph-navigator / codebase-analyzer /
codebase-locator / web-search-researcher) at plan time and anchors ≥1 change above.

1. **ICM insertion points, research/plan/design** — `## Workflow` L48/L38/L68; first load-context L50/L40/L70; **none** reference CONTEXT.md; insert L49/L39/L69. (§1.2)
2. **ICM insertion points, implement/validate/prd** — Step-1 blocks L19-31 / L18-29 / L29-38; insert L32/L30/L39; prd already dispatches `prism-locator` at `prism-prd/SKILL.md:34`. (§1.2)
3. **ICM insertion points, decompose/spectrum/subagent** — decompose `## Process` L32 / Step-1 L34; spectrum `## Workflow` L39 / Load State L41-58 / env `CLAUDE_CODE_DISABLE_1M_CONTEXT=1` L13; subagent `## Core Loop` L21 / Pre-flight L23; **no subagent env caps exist anywhere**. (§1.2, §2.6)
4. **Self-verify scaffolding to soften** — prism-validate Distrust Pattern L50-81 (L52) + Iron Law L182-197 (L185) + visual-regression-grader Task L111-118; subagent "Final pass" L32 + Role Audit L62-74 (L68); spectrum Two-Stage Review L219-261 (spec L227, quality L242). (§2.6)
5. **Opus 5 Surface B verified** — `claude-sdk.ts` MODEL_IDS L24-29 (`opus="claude-opus-4-8"` L25), ModelName L31, options L37-46 (**no effort**), `this._model` L77, maxTokens 8192 L78, stream L105-113 (**no effort/output_config/thinking**), refusal L171-175. (§2.3)
6. **Opus 5 gating verified unchanged** — `fable-gate.ts` resolveGatedModel L27-52, pass-through L32-34, fallback→opus L39/L51; `fable-flag.ts` isFableEnabled L19-35 reads `.prism/local/fable.flag` L21; `auth.ts` resolveAnthropicAuth L97-108 (model-agnostic), ALLOW_METERED_ENV L69, OAUTH_TOKEN_ENV L57; `task/index.ts` createTask L324-344, resolveGatedModel call L331, handler L333-336 (**no effort threaded**). (§2.3, §2.4)
7. **Visibility gap located** — silent downgrade at `fable-gate.ts:39,51` and `fable-gate.sh:81-83` (deny) / L75-79 (ask); no event emitted. (§2.4)
8. **Opus 5 Surface A doc anchors** — `model-config.md` §1 table L25-30, §2 L42, §3 L63-67, §4 L83/L94-99, §9 L243; `model-selection.md` tiers L5-34, ceiling L57/L60/L67, cost L69-75. (§2.2)
9. **Opus 5 Surface C verified** — `claude-models.ts` CLAUDE_MODELS L18-61 (isDefault Opus 4.6 L40-47, tops at 4.7), thinking sets L3-8 / L10-16, normalizeClaudeRuntimeModelId L71-95 regex L83-85 (opus|sonnet|haiku only). (§2.5)
10. **Bundled mirrors byte-identical** — model-config.md, model-selection.md, fable-gate.sh, hooks.json, and `digital-griot-mcp.ts` all IDENTICAL between live and `apps/prism-setup/resources/plugin/...`. (§1.3, §2.2, §1.4)
11. **digital-griot-mcp structure** — `Server` low-level API, `GAVEL_TOOLS` L84-249, tools/list L779-785, dispatch switch L788-817 (default L806), okJson L504-506 / errJson L774-776, resolveStateDir L384-404, write pattern L571-573, execFileSync L54/L302-305, async fetch handler L639-688/L800, events read L697-712, wake relay L916-975 (events written by server.cjs L954-956). (§1.4, §1.5)
12. **Fragment scaffolder layout** — templates `base/core/ui/electron/vscode/tui/mobile/mcp`; `CLAUDE.md.tmpl` (41 lines), `.prism/README.md.tmpl`, **no CONTEXT.md**; generator `src/index.ts:22-58`, `src/commands/init.ts:19-80`, `src/engine/copier.ts:14-56`; meta-skills `templates/base/skills/{bookend,docs-update,release,closing-ceremony}` all `model: sonnet`; surface-glue generators `src/engine/generators/{electron,vscode,mobile}-glue.ts`. (§4.1)
13. **fragment-sync checklist** — Section A A1-A7 L7-17, Section B B1-B13 L19-35, model-line row **B3 L25** (B8 L30 auth, B9 L31 meta-skills), append point after L35 / next B14, model-line reference L37-41, no ICM/CONTEXT refs today. (§4.2)
14. **Multi-surface formats** — ChatGPT Skills `SKILL.md`+`agents/openai.yaml`+`scripts/` (≤2%/8k-char list budget); Apps SDK = hosted MCP + `chatgpt-app-submission.json` (hints mandatory, ≥5 pos/3 neg tests); Custom GPT = OpenAPI Actions (≤1MB/≤30 ops, 20×512MB knowledge); Gemini Gems = **no manifest, no official API** (10×100MB knowledge, guidance-only). Primary sources linked in the W5 research. (§5)

**N = 14 research findings.**
