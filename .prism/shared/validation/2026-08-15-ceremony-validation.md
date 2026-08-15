---
date: 2026-08-15
stage: validate
topic: Headless-aware release-cycle skills — answer-injection correctness + additivity
verdict: SHIP
related:
  - .prism/shared/research/2026-08-15-headless-release-cycle-research.md
  - .prism/shared/plans/2026-08-15-ceremony-implement-CONTEXT.md
  - scripts/resolve-answer.mjs
---

# Validation — headless-aware release cycle (answer injection)

**One job (from the contract):** prove the answer-injection is CORRECT and ADDITIVE without
running a real release. No release invoked, no version bump, nothing committed.

## Verdict: **SHIP**

The mechanism is correct (resolver self-test + CLI fail-closed checks green), complete (every
research §1 gate carries wiring or is correctly a no-wire EXIT/auto/deferred gate), and purely
additive (every headless branch is `PRISM_NONINTERACTIVE`-guarded; the one `AskUserQuestion` and
all prose prompts remain; no frontmatter touched; `claude plugin validate .` passes; VERSION
unchanged; nothing committed).

---

## Checks — PASS/FAIL

| # | Check (contract step) | Result | Evidence |
|---|---|---|---|
| 1 | Resolver self-test (`node scripts/resolve-answer.mjs self-test`) | **PASS** | 22/22 assertions `[PASS]`, `self-test: PASS`, exit 0 |
| 1a | Omitted `push` ⇒ `false` (fail-closed) | **PASS** | CLI `--answers <f> push true` → `false` |
| 1b | Explicit `version` ⇒ returned | **PASS** | CLI `version` → `4.9.1` |
| 1c | Discovery precedence `--answers` → `PRISM_RELEASE_ANSWERS` → default | **PASS** | self-test path cases + live CLI env-var case |
| 1d | `tagCollision` default ⇒ `abort` | **PASS** | CLI `tagCollision recreate` → `abort` (safeDefault ignored, policy wins) |
| 2 | Gate coverage — every §1 gate wired or correctly no-wire | **PASS** | table below; 0 gaps |
| 3 | Interactive intact — every preamble env-guarded | **PASS** | resolve-answer refs ⊆ `PRISM_NONINTERACTIVE` blocks in all 5 files |
| 4 | Destructive fail-closed (`push`/`githubRelease`/`syncMirror`⇒false; `tagCollision`⇒abort) | **PASS** | resolver `DESTRUCTIVE_KEYS` + `KEY_DEFAULTS`; CLI verified all four |
| 5 | The one literal `AskUserQuestion` (release Step 1) wrapped | **PASS** | line 37 `AskUserQuestion` intact; line 49 headless wrap "skip it under PRISM_NONINTERACTIVE" |
| 6 | `claude plugin validate .` | **PASS** | `✔ Validation passed`, exit 0 |
| 7 | Additive-safety: no bump / no commit / no frontmatter change | **PASS** | VERSION=4.9.0 unchanged; HEAD `1b70090`; nothing staged; no `---` delimiter changes |

Interactive-path spot-check (still prompts when env unset): bookend `Override?` prompt (SKILL:79),
docs-update `Proceed with updates?` / `Wait for user approval` (SKILL:95,98), release
`Review EVERY entry` (SKILL:81) and tag `delete and recreate` (SKILL:378) all present. Resolver
`loadAnswers` returns `{}` when not headless — verified live: `version "IGNORED"` returned the
safeDefault even with an explicit `--answers` file present.

---

## Gate-coverage table (research §1 → wiring)

Legend: **wired** = headless resolve-or-prompt preamble present with correct key + safe default ·
**EXIT** = deterministic exit-code gate, no wiring by design (guards keep their teeth) ·
**auto** = already automatic, no answer needed · **deferred** = owned by a sub-skill in the same mode.

| # | Gate | Key | Safe default | Status | Where |
|---|------|-----|--------------|--------|-------|
| G0-A | High-finding halt | `review.overrideHigh` | `false` → halt | **wired** | ceremony SKILL Headless §; review-audit-gate.md:50 |
| G0-B | High override (explicit+logged) | `review.overrideHigh` | `false` | **wired** | ceremony SKILL Headless §; review-audit-gate.md:50 |
| G0-C | Pre-flight clean tree | `cleanTree` | `porcelain-empty-only` | **wired** | ceremony SKILL Headless § + pre-flight rule |
| G0-D | Push post-condition (INCOMPLETE unless HEAD==origin) | (push inversion) | built-but-unpushed = expected | **wired** (inverted) | ceremony "Always push" rule exception |
| G0-E | Deferral to prism-release | — | inherit sub-skill | **deferred** | ceremony Headless §: "each sub-skill handles its own gates" |
| B1 | Version bump override | `version` / `confirmVersion` | explicit version, else confirm | **wired** | bookend Headless (B1) |
| B2 | Docs-site sync plan approval | `docs.proceed` | `true` | **wired** | bookend Headless (B2/B3) |
| B3 | VitePress config-change approval | `docs.editConfig` | `false` | **wired** | bookend Headless (B2/B3) |
| B4 | Umbrella "stop at gates" | (per-phase) | per-phase resolved | **wired** | bookend rule #6 |
| D-A | Source-file selection | — | newest via `ls -t` | **auto** | docs-update Headless § note |
| D-B | Change-summary approval | `docs.proceed` | `true` | **wired** | docs-update Headless (D-B) |
| D-C | `config.ts` edit (Step 5 + Step 6.5 bump) | `docs.editConfig` | `false` | **wired** | docs-update Headless (D-C) ×2 |
| R1 | Bump type (**the** AskUserQuestion) | `version` / `bump` | halt if neither | **wired** | release Headless (R1) — wraps AskUserQuestion |
| R2 | Clean-tree review | `cleanTree` | `porcelain-empty-only` | **wired** | release Headless (R2) |
| R3 | Branch-integration guard | — | exit 0 or halt | **EXIT** | release Headless §: "no bypass" |
| R4 | Plugin-manifest validation | — | exit 0 or halt | **EXIT** | release Headless §: "no bypass" |
| R5 | Tag collision | `tagCollision` | `abort` | **wired** | release Step 9 Headless (R5) |
| R6 | Commit + tag | `dryRun` | stop if dryRun | **wired** | release Headless (R6 / dryRun) |
| R7 | `git push` | `push` | `false` (fail-closed) | **wired** | release Headless (R7) |
| R8 | GitHub release | `githubRelease` | `false` (fail-closed) | **wired** | release Headless (R8) |
| R9 | Native builds | `nativeBuilds` | `true` (local artifacts) | **wired** | release Headless (R9) |
| R10 | Mirror force-push | `syncMirror` | `false` (fail-closed) | **wired** | release Headless (R10) |
| R11 | Amend + `tag -f` | (push-gated / dryRun) | only in push envelope | **wired** | release Headless (R11) |

**Coverage: 22/22 gates accounted for — 17 wired, 2 EXIT (no-bypass), 1 auto, 1 deferred, 1 wired-inverted (G0-D).** Zero gaps.

---

## Schema / reference coherence

- `skills/prism-release/references/answers-resolution.md` per-gate key map matches the §1 table and
  the resolver's `DESTRUCTIVE_KEYS` / `KEY_DEFAULTS` exactly.
- `scripts/release-answers.template.json` — `dryRun:true`, all destructive keys `false`/omitted →
  first headless run rehearses (fail-closed). Correct.
- `scripts/release-answers.full-push.example.json` — `dryRun:false`, explicit `version`,
  `push/githubRelease/syncMirror/docs.editConfig:true` → the shape an **orchestrator** writes for a
  full push; documented as NOT the skill default. Correct (mechanism stays fail-closed on missing keys).
- `.gitignore` — `.prism/local/release-answers.json` explicitly ignored (belt-and-suspenders over
  the existing `.prism/local/` rule).

---

## Notes / non-blocking

- **Porter test** (`test_porter_check.sh`, research R4) is not in the live `scripts/` tree — it exists
  only in `.prism/shared/evals/*-snapshot/`. It is a release-pipeline invariant test invoked at
  release Step 1b, outside this validate contract, which requires only `claude plugin validate .`
  (green). No action.
- **Line-ending warnings** (`LF will be replaced by CRLF`) on the three edited SKILLs are pre-existing
  repo behavior (autocrlf), not introduced by these edits. Cosmetic; no content impact.

## Cleanup
- Throwaway answers files created for CLI testing used `mktemp` and were removed; no test artifact
  remains in `.prism/local/` or the working tree.
