# Prism v4.16.1 — Documentation Snapshot

**Released:** 2026-09-06 (tagged `v4.16.1`)
**Theme:** v4.16.0's installer workflow failed on both runners *after* this audit reported
`AUDIT CLEAN`. The patch is small; the finding is not — **the gate was not measuring the thing
that broke.**

No user-facing runtime behaviour changes. Everything here is release integrity.

---

## 1. What actually happened

`packages/prism-workgraph-mcp` was added in 4.16.0. The root `workspaces: ["packages/*"]` glob
picks it up, but `package-lock.json` was never regenerated. Both CI runners died on:

```
npm error Missing: @prism/workgraph-mcp@4.16.0 from lock file
```

The release job is `needs: [build-windows, build-macos]`, so it was **skipped**, and v4.16.0 first
published with **5 of its 10 assets**.

The asymmetry that hid it:

| | |
|---|---|
| `npm install` | **reconciles** the lock to `package.json` |
| `npm ci` | **asserts** they already agree, and fails otherwise |

That is exactly what makes `ci` correct for CI — and exactly why the drift was invisible locally. A
populated `node_modules` means the lock is never consulted, so every local build passed. **No gate
ran `npm ci`**, so `AUDIT CLEAN` and a broken release were entirely compatible states.

Recovery did **not** rewrite the published tag. The workflow's release job is gated on
`startsWith(github.ref, 'refs/tags/v')`, so a `workflow_dispatch` on `main` rebuilds the installers
and skips the release step; the macOS dmg then comes out as a downloadable artifact to attach by
hand. Both runners went green on the re-dispatch, confirming the lock was the sole cause.

## 2. The lesson became a gate

`scripts/pre-release-audit.mjs` §3. Two layers, deliberately:

**§3a — deterministic and offline.** Every workspace member resolved from the `workspaces` globs
must appear in the lock's `packages` map. This is precisely the defect above, touches no registry,
and therefore cannot flake — which matters, because a gate that flakes is a gate people learn to
skip.

**§3b — authoritative.** `npm ci --dry-run`, literally what CI runs, so it also catches dependency
drift §3a cannot see (a member present in the lock but resolving wrong versions).

## 3. Review caught the gate failing open

The first cut of §3b decided FAIL vs WARN from an **allow-list** of npm phrasings
(`EUSAGE`, `can only install packages`, `Missing: … from lock file`) and warned on everything else.

Drifting a dependency range makes npm emit:

```
npm error code ETARGET
npm error notarget No matching version found for @tauri-apps/api@^99.0.0
```

which matches none of them. **Genuine lock drift would have shipped as a warning.**

Inverted to fail-closed: any non-zero exit **fails** unless it is recognisably environmental (spawn
error, `ENOTFOUND` / `ECONNREFUSED` / `ETIMEDOUT` / registry unreachable). Unknown npm wording now
defaults to FAIL, so npm may reword its errors freely without silently disarming the gate.

Worth stating plainly: **a release whose entire theme was fail-closed model routing shipped a
fail-open classifier in its own release gate.** The same reasoning error, one layer up.

The second finding was the same shape — globs that were not a trailing `/*` (`packages/**`,
`apps/*/server`) were silently dropped from §3a, so a member declared that way could be missing
from the lock while the check still printed PASS. Globs now resolve segment-by-segment, and a shape
the resolver cannot handle **fails loudly** rather than resolving to nothing.

## 4. Two files had been going stale every release

`bump-version.py`'s own discovery sweep caught them:

- `packages/prism-workgraph-mcp/package.json` — added last release, never registered
- `prism-docs/docs/.vitepress/config.ts` — the VitePress footer `copyright`, which would have shown
  the previous version on the docs site indefinitely

This is a documented recurring class in that script: `main.go`, `footer.go`, `PrismState.ts` and
`PrismStateContext.tsx` sat at **3.0.3 across multiple releases** before the sweep existed. Both new
files are now registered rather than swept up by hand — the sweep is meant to be a backstop, not the
mechanism.

## 5. Verification

Every fixture restored byte-identically after use.

| test | result |
|---|---|
| the **real** v4.16.0 lock (`git show 22aa2dc:package-lock.json`) | both §3a and §3b FAIL |
| `packages/**` + `apps/pre*` added to `workspaces` | FAIL — unsupported glob shape |
| dependency range the lock cannot satisfy | FAIL via the new fail-closed default (`ETARGET`) |
| clean tree | PASS — all 15 workspace members registered |
| non-mutation, npm 10.9.3 | lock hash identical; `node_modules` 781 → 781 entries |

That last row was the review's Minor finding, and it is now **observed rather than documented** — a
release gate must not modify the tree it audits, and "npm documents it as safe" is not the same
claim as "it did not touch anything here."

## 6. Ledger

- **M12** — `gh run watch --exit-status | tail` reported the failing workflow as *successful*,
  because a pipeline returns the last command's exit code. Green CI was reported for a red run;
  caught only because the asset count read 5 instead of 10. **A command whose exit code is the
  evidence must never be piped.**
- **M13** — the lock drift above. **Promoted** to a gate this release, per the ledger's own rule
  that a computable mistake becomes a check rather than staying a note.

## 7. Gates

| check | result |
|---|---|
| `claude plugin validate .` | PASS |
| `verify-branch-integrated.mjs` | PASS |
| `verify-ceremony-gate.mjs` | PASS |
| `verify-invariants.mjs` (+ its own tests) | PASS |
| `verify-model-policy-conformance.mjs` | PASS |
| `verify-story-unification.mjs` | PASS |
| **lockfile sync §3a / §3b** | **PASS (new)** |
| structural checks | PASS |

## 8. Known gaps carried forward

Unchanged from 4.16.0, none addressed here:

- Bus concurrency is half-fixed — the append path is atomic, but read-modify-write callers still
  need a real lock.
- GriotModel as a recall source is **blocked, not built** — deja-vu's `Registry()` is a compile-time
  slice, so it needs a fork or an upstream contribution.
- `apps/prism-setup` remains tracked though sunset in v4.15.2, carrying unpoliced copies of
  gate-checked files.
- **New:** the §3b WARN branch is the one path not exercised by a test — simulating a missing or
  offline npm was not worth the contortion, and §3a covers the defect if that classification ever
  misfires.
