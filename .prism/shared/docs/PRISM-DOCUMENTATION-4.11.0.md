# Prism 4.11.0 — Model Control Plane + Opus 5 + ICM fuse + multi-surface adapters

**Release date:** 2026-08-17
**Type:** feature (minor) — a per-model **approval control plane** (like an agentic permission tool) replaces the single `fable.flag` boolean, surfaced across CLI, VS Code, and the Paseo mobile provider; the model line adds **Opus 5** as the routine ceiling under a parallel `opus5` key; and the Interpretable Context Methodology (ICM) run-contract is fused into the Prism pipeline skills.
**Builds on:** 4.10.0 (headless-aware release cycle via answer-injection)

## Summary

v4.11.0 generalizes model governance from a single boolean into a **Model Control Plane**: every
policy-listed model carries a per-model **approval mode** — `ask` / `allow` / `deny` / `skip` —
resolved through one shared core (`packages/prism-core/src/core/api/model-policy.ts`) and made
visible on every surface that dispatches a model. A `deny` no longer just blocks; it **downgrades**
to the next freely runnable model in a shared chain (`fable5 → opus5 → opus`) and emits a bus event
naming the substitution. The store lives at `<project>/.prism/local/model-policy.json` (gitignored,
like `fable.flag`); when absent, the module derives a back-compatible policy from a legacy
`fable.flag` so nothing regresses, and a committed `model-policy.example.json` documents the shape.

The same release lifts the model line to **Opus 5** (`claude-opus-5`) as the routine ceiling, shipped
under a **parallel `opus5` key** so `opus`/`best` stay pinned to Opus 4.8 for A/B eval until the alias
flip — nothing rolls forward silently. Opus 5's re-swept `low`/`medium` effort levels are now strong
enough for most routine dispatch, so the guidance is *keep thinking ON and lower the effort dial for
cost* rather than dropping to a weaker tier.

Finally, the **ICM run-contract** (headless stage-walk: a thin router prompt over a `*-CONTEXT.md`
stage contract with Inputs / Locked Decisions / Success criteria / Heartbeat tokens) is fused into
the nine Prism pipeline skills and codified as a canonical reference, and Fragment's conformance
checklist gains rows **B14–B18** so every scaffolded "Prism-image" project is born able to drive an
ICM stage-walk.

## What changed

### Model Control Plane core (`packages/prism-core/src/core/api/model-policy.ts`, new — 435 lines)
The single-responsibility policy core, generalizing `fable.flag` into a per-model approval verb:
- **Four approval modes** — `ask` (interactive surfaces prompt a one-shot confirm; a headless run
  with no `confirm` fn auto-resolves per `headlessDefault` and always logs a bus event), `allow`
  (runs, emits a monitored event), `deny` (does not run; downgrades to the next runnable model in the
  chain and names the downgrade), `skip` (bypasses approvals like `--dangerously-skip-permissions`,
  still emits an event).
- **Downgrade chain + floor** — `DOWNGRADE_CHAIN = [fable5, opus5, opus]` with `opus` as the floor;
  `nextRunnable` walks past a denied model to the next `allow`/`skip` entry.
- **Pure decision core** — `resolveModelDecision` is side-effect-free and injectable: a surface may
  supply a `confirm` fn (which can consult `scripts/resolve-answer.mjs`), while the resolver itself
  falls back to `headlessDefault` (optionally overridden by `PRISM_MODEL_HEADLESS_DEFAULT`).
- **Reader robustness** — any missing/malformed policy degrades to safe defaults (opus5 + fable5 =
  `ask`) rather than throwing, mirroring `fable-flag.ts`.
- **Bus events + writer** — `emitModelEvent` / `writeModelPolicy` carry explicit, differentiated
  throw/no-throw contracts; `policyKeyForModel(provider, model)` folds Anthropic ids onto the shared
  chain keys (`fable5`/`opus5`) and gives every other lane a stable `${provider}:${model}` key so it
  becomes governable by adding one entry to the same policy file.
- **`model-policy.example.json`** (new, tracked) documents the store: `headlessDefault`, per-model
  `mode`, and optional per-surface overrides.

### Multi-surface adapters (the plane made visible everywhere a model dispatches)
- **CLI — Task-hook governance + events (`scripts/fable-gate.sh`).** The gate refactors to govern
  `opus5`+`fable5` through the shared policy logic (hand-mirrored in POSIX sh, since a hook can't
  import the TS core), emits a JSONL model-decision event, and stays fail-open so telemetry never
  breaks a dispatch. `scripts/spectrum.sh` emits model events per iteration.
- **CLI — loud active-model statusline (`scripts/statusline-model.sh`, new).** A Claude Code
  `statusLine` command that renders the active model + its approval mode as a compact segment,
  printed **loud** (ember/red ANSI) when a premium model (opus5/fable5) is active so a costly model
  never runs silently. Reads the same `.prism/local/model-policy.json`; fail-safe to a quiet segment
  on missing stdin/node/policy. Reference: `cl-plugin-structure/references/statusline-model.md`.
- **VS Code — model status chip + decisions receipts (`apps/prism-vscode/src/providers/model-status.ts`,
  new — 191 lines).** A status-bar chip, a TreeView of recent model decisions, a QuickPick to change
  a model's mode, and a FileSystemWatcher over the events file — reusing `resolveEventsFile` /
  `readModelPolicy` from the core (no reimplemented parsing) and degrading safely on a
  missing/malformed events file. Wired in `extension.ts`; `fable-gate.ts` delegates its opus5/fable5
  decision to `resolveModelDecision` while non-policy models pass through untouched. Covered by
  `model-policy.test.ts` (new — 336 lines): all four modes, headless vs interactive resolution, env
  override, surface override, back-compat legacy-flag derivation, and the end-to-end decision+event path.
- **Paseo mobile — governed custom-provider lanes (`apps/prism-mobile/packages/server/.../claude-agent.ts`).**
  The mobile daemon's dispatch lane is instrumented so non-Anthropic providers (which extend `claude`
  via `ANTHROPIC_BASE_URL`) become visible and governable by the same policy file, keyed by provider +
  model. A `deny` **substitutes** the concrete downgrade target on `base.model` — the floor maps to
  `claude-opus-4-8` (matching the VS Code surface's `MODEL_IDS.opus`), never a bare `opus` alias — so
  the enforcement actually stops a premium model when the branch is reached. The policy logic is
  hand-mirrored into the mobile server (documented cross-workspace-boundary duplication).

### Opus 5 model-line sweep
- **`model-config.md`** adds the **Opus 5** row (`claude-opus-5`, alias `opus5`, $5/$25, 1M context /
  128K output, effort `low…max` with an `xhigh`/`max` one-shot confirm) and reframes it as the routine
  ceiling that supersedes Opus 4.8 at the same price. Opus 5 ships under a **parallel `opus5` key**;
  `opus`/`best` stay pinned to Opus 4.8 until the alias flip, so both models are A/B-reachable and the
  runtime map never moves silently. Opus-family API surface — **no Fable-style HITL gate, no
  `opus5.flag`** — the only add-on is a per-call effort confirm at `xhigh`/`max`.
- **`prism-spectrum/references/model-selection.md`** re-baselines routine dispatch toward `medium`
  (Opus 5's `low`/`medium` reach what took prior-tier `high`) and version-gates the subagent-cap note.

### ICM run-contract fused into the pipeline
- **Canonical reference + template** — `skills/icm-architect/references/prism-run-contract.md` (new)
  and `skills/icm-architect/assets/templates/prism-stage-CONTEXT.md` (new) define the headless
  stage-walk: a thin router prompt reads a `*-CONTEXT.md` stage contract carrying **Role · Inputs
  (Working | Reference) · Locked Decisions · Process · Success criteria · Heartbeat tokens**.
- **Nine pipeline-skill pointers** — `prism-research`, `prism-plan`, `prism-decompose`,
  `prism-design`, `prism-prd`, `prism-implement`, `prism-subagent`, `prism-spectrum`, `prism-validate`
  each gained a top-of-Workflow pointer to read the `*-CONTEXT.md` in `.prism/shared/plans/` (or
  `$PRISM_ICM_CONTRACT`) first and honor its Inputs / Locked Decisions / Success criteria.

### Fragment conformance (B14–B18) + model line (B3)
`fragment-sync/references/conformance-checklist.md` gains five rows so emitted "Prism-image" projects
are born ICM- and code-intel-aware: **B14** routing-table `CLAUDE.md` with an ICM stage-walk section,
**B15** a `.prism/shared/plans` stage-CONTEXT template, **B16** meta-skills carrying the ICM
run-contract pointer, **B17** a born-code-intel-wired `.gitnexus/` stub + "Code-intel first" routing,
**B18** an MCP `icm_prism_run` detached launcher. **B3** is updated to the Opus 5 ceiling (via the
auto-rolling `opus` alias; Opus 4.8 as the A/B default) with effort re-baselined toward `medium`.

## Compatibility

Fully backward compatible. With no `.prism/local/model-policy.json` present, the core derives a
policy from a legacy `fable.flag`, so existing Fable gating is unchanged. Opus 5 ships under a
parallel `opus5` key with `opus`/`best` still pinned to Opus 4.8 — no agent rolls to Opus 5 until the
alias is explicitly flipped. The multi-surface adapters are additive: each fails open, so policy
resolution or telemetry can never break a dispatch. The ICM pointers are read-only additions to the
pipeline skills.

## Verification

- `claude plugin validate .` — passed
- `node scripts/pre-release-audit.mjs` — **AUDIT CLEAN** (plugin validate + verify-branch-integrated +
  verify-ceremony-gate + verify-story-unification + structural checks over the 55 changed files), run
  twice (before and after the Step-0 fix)
- `node scripts/resolve-answer.mjs self-test` — PASS
- VS Code `model-policy.test.ts` — covers all four approval modes, headless/interactive resolution,
  env + surface overrides, legacy-flag back-compat, and the decision+event path
- Closing-ceremony Step-0 two-stage review — spec-reviewer: **NO HIGH FINDINGS** (spec-compliant; full
  requirements checklist verified). quality-reviewer: one **High** on the Paseo deny-downgrade floor
  (the map sent a bare `"opus"` alias the SDK can't resolve) — **fixed** in `fix(paseo)` before Bookend
  (floor now maps to `claude-opus-4-8`), re-reviewed **RESOLVED** with no new High.

## The process finding

The gate did its job. The one High was a **latent trap in currently-unreachable code**, not a break
in what this cut exercises — the deny→downgrade branch never fires on the mobile surface today because
that package's model catalog tops out at `claude-opus-4-7`, so `policyKeyForModel` never yields
`opus5`/`fable5` and no downgrade target is ever set. Rather than override the High (headless
`review.overrideHigh` stays `false`) or block the release over a dormant path, the fix mapped the
chain floor to a concrete, plane-consistent id (`claude-opus-4-8`) so the enforcement is correct the
moment the catalog grows — verified by reachability analysis, then re-reviewed clean. Fail-fast
contract working as intended: verify the finding, fix the root, re-run until clean.

## Known follow-ups (not in this release)

1. **Shared-logic drift across three copies.** The downgrade-chain / policy logic now lives in the
   core module, the `scripts/fable-gate.sh` POSIX mirror, and the Paseo mobile mirror — hand-kept in
   sync by design (each documents why it can't import the TS core), with no shared test or lint rule
   enforcing parity. A future policy-shape change is likely to update one and miss another; a
   cross-copy conformance check is the fast-follow.
2. **CLI/Task-hook deny is block-only, not substituting.** `scripts/fable-gate.sh` returns
   `permissionDecision: "deny"` on a denied dispatch; the hook protocol has no mechanism to substitute
   the downgrade target at that surface, so the "downgraded to X" reason text is informational there.
   Pre-existing behavior, surfaced by the Step-0 review.
3. **Alias flip.** When Opus 5 becomes the resting default, flip `opus`/`best` → `claude-opus-5` and
   retire the parallel `opus5` key (`model-config.md` §2).
