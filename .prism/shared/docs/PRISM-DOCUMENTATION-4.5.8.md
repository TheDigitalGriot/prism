# Prism 4.5.8 — Self-hardening release path (closing-ceremony Review & Audit gate)

**Release date:** 2026-07-22
**Type:** feature (release governance)
**Builds on:** 4.5.7 (plan → story unification)

## Summary

`prism-closing-ceremony` now runs a **Review & Audit gate** as its first step — before bookend, docs, or
release. Every release now reviews and audits *itself* on the way out the door, instead of relying on a
human to remember to do it. This is the same rigor applied by hand to 4.5.7, now encoded into the release
path: the system hardening its own release process using its own workflow.

## What changed

### The gate (Step 0 of the ceremony, fail-fast)
- **Two-stage review** — `spec-reviewer` → `quality-reviewer` on the diff since the last version tag
  (plus the plan/stories that drove it).
- **Deterministic best-practices audit** — `node scripts/pre-release-audit.mjs`: `claude plugin validate`,
  discovery + run of every `scripts/verify-*.mjs`, and cl-plugin-structure structural checks (SKILL.md
  size, frontmatter, hardcoded paths) **scoped to the release's changed files**.
- **Fail-fast** — an unresolved High finding halts the ceremony before bookend; a human may override, but
  only explicitly and logged in the bookend snapshot.

### Files
- `skills/prism-closing-ceremony/SKILL.md` — Step 0 added to the Sequence; fail-fast Rules.
- `skills/prism-closing-ceremony/references/review-audit-gate.md` — the gate procedure.
- `scripts/pre-release-audit.mjs` — the deterministic audit runner.
- `scripts/verify-ceremony-gate.mjs` — guard that the gate stays wired ahead of bookend.

## Dogfood / proof

4.5.8 is the first release to pass through its own gate. On its first run the gate's two-stage review
caught two real soundness bugs in the audit script (a brittle plugin-validate success heuristic and a
bootstrap empty-diff false-pass) — both fixed before this release. The gate demonstrably works, on itself.

## Compatibility

Additive — the gate precedes the existing bookend → docs → release sequence, which is unchanged. Native
build / push / GitHub-release mechanics remain `prism-release`'s job and stay human-gated.

## Verification

- `node scripts/verify-ceremony-gate.mjs` → ALL PASS
- `node scripts/pre-release-audit.mjs` → AUDIT CLEAN
- `node scripts/verify-story-unification.mjs --all` → 16/16 (4.5.7 intact)
- `claude plugin validate .` → passed
