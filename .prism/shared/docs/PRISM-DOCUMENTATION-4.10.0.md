# Prism 4.10.0 — Headless-aware release cycle via answer-injection

**Release date:** 2026-08-15
**Type:** feature (minor) — the release-cycle skills now run unattended under `claude -p` / Cowork cloud / CI, reading each interactive gate's answer from a static JSON snapshot; interactive TTY runs are byte-for-byte unchanged.
**Builds on:** 4.9.0 (Griot Widget comm layer + channel-adoption groundwork)

## Summary

v4.10.0 makes the four end-of-cycle skills — **`prism-bookend`**, **`prism-docs-update`**,
**`prism-release`**, and **`prism-closing-ceremony`** — headless-runnable. Each interactive gate that
previously paused for a human answer can now resolve that answer from a release-answers file when the
`PRISM_NONINTERACTIVE` environment variable is set. When it is **unset**, every gate prompts exactly as
before and the answers file is ignored entirely — the mode is purely additive, so no interactive run
changes byte-for-byte.

The design is **fail-closed on the dangerous edges**: the destructive gates (`push`, `githubRelease`,
`syncMirror`) resolve to `false` unless an answer explicitly says `true`, and `tagCollision` defaults to
`abort` (never a silent delete-and-recreate). This deliberately inverts the interactive "always push"
policy for the headless path — an unwanted force-push is far costlier than "built but not pushed."

This release is what lets the closing ceremony run cloud-side from a Cowork session against the local
repo without a human at the keyboard for each gate — the orchestration authors a `release-answers.json`,
sets `PRISM_NONINTERACTIVE`, and the whole Review→Bookend→Docs→Release sequence walks itself.

## What changed

### Shared answer resolver (`scripts/resolve-answer.mjs`)
A single-responsibility module with a pure, unit-testable core and a thin CLI:
- **`resolveWith(answers, key, safeDefault)`** — the pure resolver. Returns `answers[key]` when defined,
  else the safe default. Supports **dotted-key traversal** (`docs.proceed`, `review.overrideHigh`).
- **Fail-closed destructive gates** — `push` / `githubRelease` / `syncMirror` resolve to `false` on a
  missing key, enforced inside the resolver itself (defense in depth, not left to each caller).
- **Fixed-policy defaults** — `tagCollision` → `abort` when unspecified.
- **Activation switch** — `isHeadless()` keys on `PRISM_NONINTERACTIVE`; when unset, `loadAnswers`
  returns `{}` so every gate falls to its interactive default and a stray answers file can never
  silently alter an interactive run.
- **Discovery precedence** — `--answers <path>` → `PRISM_RELEASE_ANSWERS` env → default
  `.prism/local/release-answers.json`.
- **Embedded self-test** — `node scripts/resolve-answer.mjs self-test` (22 assertions) covers
  fail-closed gates, dotted keys, activation, and discovery precedence.

### Per-gate headless blocks in the four release-cycle skills
`prism-bookend`, `prism-docs-update`, `prism-release`, and `prism-closing-ceremony` each gained a
**Headless mode (`PRISM_NONINTERACTIVE`)** section plus per-gate inline blocks. Every headless block is
*appended after* the existing interactive prompt text — the original prompts are untouched — and each
opens with "if unset, every gate behaves exactly as today." The version is decided **once** in bookend
and carried forward; no phase re-derives it.

### Answers schema + per-gate key map (`skills/prism-release/references/answers-resolution.md`)
The canonical reference: the JSON schema, discovery precedence, and the full per-gate key map wiring
each interactive gate to its answers key and safe default.

### Answers templates (`scripts/`)
- **`release-answers.template.json`** — the safe starting point (`dryRun: true`, destructive keys
  false/omitted).
- **`release-answers.full-push.example.json`** — a documented example of a full real-release intent
  (all destructive gates `true`), authored by the orchestration, never a skill default.

### Housekeeping
- **`.gitignore`** — excludes `.prism/local/release-answers.json` (machine-specific, secret-adjacent)
  and `.prism/*-progress.txt` heartbeat files, while shipping the two example templates as tracked files.
- **Vendored ICM method source (`icm/`)** — the Interpretable Context Methodology reference (methodology,
  templates, the paper PDF, README) is vendored for the `icm-architect` skill; generated brains and
  cost-of-remembering results stay gitignored. This is third-party reference content, shipped in a
  separate `chore(icm)` commit.

## Compatibility

Fully backward compatible. With `PRISM_NONINTERACTIVE` unset, all four skills prompt exactly as in
4.9.0 and the answers file is ignored. The headless path is opt-in per invocation and fail-closed on
every destructive gate.

## Verification

- `claude plugin validate .` — passed
- `node scripts/pre-release-audit.mjs` — **AUDIT CLEAN** (plugin validate + verify-branch-integrated +
  verify-ceremony-gate + verify-story-unification + structural checks over 225 changed files)
- `node scripts/resolve-answer.mjs self-test` — PASS (22/22 assertions)
- Closing-ceremony Step-0 two-stage review — **no High findings**. spec-reviewer: spec-compliant, no
  issues (all 22 research-§1 gates wired or correctly no-wired; interactive path proven unchanged).
  quality-reviewer: no High; 3 lower findings, each verified **not exercised by this release** (which
  sets `PRISM_NONINTERACTIVE=1`, explicit `version="4.10.0"`, and explicit destructive-gate booleans).

## Known follow-ups (not in this release)

1. **Tighten `isHeadless` to an explicit allow-list.** Today `isHeadless` treats any non-empty,
   non-`"0"` value of `PRISM_NONINTERACTIVE` as truthy — including the literal `"false"`. An operator
   who writes `PRISM_NONINTERACTIVE=false` intending to *disable* headless mode would instead enable it.
   Not triggered by this release (which uses `=1`), but recommended as a fast-follow:
   accept only `1` / `true` (case-insensitive). Filed from the quality-reviewer's Medium finding.
2. **`undefined`-print wart (Low).** A no-default key that resolves to `undefined` (e.g. `version` /
   `bump` when neither is set) prints the literal text `"undefined"` on stdout. Cosmetic today — both
   call sites are read by the orchestrating agent's judgment, not a string-matching script — but worth a
   one-line guard before any non-LLM consumer is added.
3. **CLI `--answers` arg-parsing fragility (Low).** The positional filter and the key-extraction loop
   are computed independently; a `key` equal to the `--answers` path string could mis-index. Unreachable
   in current usage (no shipped skill call passes `--answers`; all use env/default discovery).

## The process finding

The gate did its job without a single wrong answer shipping. The three quality findings were all
**latent traps for future misuse**, not defects in what this cut exercises — and the reviewer proved that
distinction concretely (running the resolver live, confirming `PRISM_NONINTERACTIVE=false` reads the real
answers file) rather than asserting it. That is the fail-fast contract working as intended: High findings
halt; verified-not-exercised findings are recorded as fast-follows and the release proceeds. The
`isHeadless` allow-list fix is the one carried forward as the authoritative next task.
