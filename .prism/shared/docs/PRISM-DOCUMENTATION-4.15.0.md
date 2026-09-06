# Prism v4.15.0 — Documentation Snapshot

**Released:** 2026-09-05 (tagged `v4.15.0` = `9528fd9`, pushed)
**Theme:** The invariant **pairs** — a written principle and its mechanical check land together, or neither lands. I3 stops excusing itself and computes; I7 and I8 arrive; and I7's first run reports UNVERIFIED against the very session that authored it.

---

## 1. Why this release exists

v4.14.0 introduced invariants I1–I6 and made the argument for them: everything in the ontology before that was a **preference** — advisory, competing with the rest of context, and demonstrably skippable. The proof was in the authoring session itself, where a rule was written and then broken three times by its own author.

But v4.14.0 shipped with a gap it did not name loudly enough: **a principle whose only enforcement is that someone remembers it is a soft fix**, and v4.14.0 contained several. "SOFT FIXES ROT" was written into the ontology and *nothing checked it* — which made the anti-soft-fix principle itself a soft fix. I3 was declared and then excused itself as "not computable." `griot_assert` existed with no consumer.

v4.15.0 closes all three, and the closing is the point:

| Gap in v4.14.0 | v4.15.0 response |
|---|---|
| "SOFT FIXES ROT" had no check | **I8** — no helper may have zero callers |
| A fix could precede any observation | **I7** — a session that produced edits must also have produced recorded verdicts |
| I3 declared itself not computable | **I3 now computes** — the claim was never checked, and was wrong |
| `griot_assert` had zero consumers | **I7 is the consumer** — satisfying I7 *requires* recording verdicts |

**WRITTEN + INVARIANT IS THE PAIR.** Every principle in this release ships with its row in the invariant table and its check in `scripts/verify-invariants.mjs`.

---

## 2. I3 now computes

I3 previously reported *"no read-size telemetry exists; not computable post-hoc."* That was a claim nobody had checked, and it was false. The session transcript records every `Read` with its `file_path`, so main-thread read sizes are recoverable after the fact.

The refinement that matters is the **windowed read**. A `Read` carrying `offset`/`limit` is the *disciplined* case — it is the behavior I3 exists to encourage. Charging that read the file's full 1002 lines would flag the very thing being rewarded:

> A check that cries wolf is worse than no check.

So I3 line-counts the window when one is present, and the full file only when the read was unwindowed.

## 3. I7 — a fix is preceded by an OBSERVATION, not an inference

The failure I7 catches: **editing something to fix a reported symptom without ever observing the symptom.** Four occurrences in a single session — a naming question closed unilaterally and written to disk; a CSS theory invented instead of taking a screenshot with the tool already loaded; a defect announced that had never been verified; a deliberate UI state wiped as "probably my residue."

Computable form: *a session that produced edits must also have produced recorded verdicts.*

**I7's first run reported UNVERIFIED against the session that authored it.** Hours of verification happened in that session and not one verdict was written through. The check caught its own author on its first execution — which is the strongest possible argument that the check was needed, and the cleanest demonstration that `unverified` is doing real work rather than decorating a pass.

## 4. I8 — no soft fixes

A "soft fix" is anything whose only enforcement is that someone remembers it: a preference, a convention, a doc, a note in a `SKILL.md`, a helper script nobody calls. They feel like progress and decay silently, because **nothing fails when they are skipped.**

I8's computable form: no helper may have zero callers.

The refinement: I8 searches the **whole repo** for callers, not just `scripts/`. A helper invoked from a `SKILL.md` is not dead code — scoping the search to `scripts/` would have manufactured false failures for every script whose caller is a skill, which is the normal shape in this plugin.

---

## 5. The `unverified` contract

`unverified` is **not** `pass`. With no way to execute a check, the verdict is `unverified` — the absence of evidence, said out loud.

Mechanically (`scripts/verify-invariants.mjs:384-389`): unverified results are counted and reported separately, and are **never** rolled into the pass count or into the exit code. Only failures drive `process.exit`. So an `unverified` can neither silently clear a ceremony gate nor silently fail one — it is inert to the gate and loud in the report.

Stage-2 review confirmed all three new invariants honor this:

- **I3** returns `unverified` when no transcript exists or no `Read` calls are found — it does not default to pass on absence of evidence.
- **I7** returns `unverified` both when there is no assertion record at all and — more carefully — when assertions exist but none fall inside the 24h window. It refuses to let a stale assertion prove *this* session observed anything.
- **I8** only ever returns `pass` or `fail`. Defensible: the check is structural (a reference exists or it does not), so there is no "cannot execute" case to represent.

---

## 6. Verification

`node scripts/verify-invariants.mjs` → **7 pass, 0 fail, 1 unverified.** The unverified is I7, against its own authoring session.

The runner is auto-discovered by `pre-release-audit.mjs` under the `verify-*.mjs` convention, so it gates this very release rather than sitting beside it.

### Native builds (this ceremony, against the tagged tree)

| Artifact | Command | Result |
|---|---|---|
| `packages/prism-core` | `npm run build` | ✅ pass |
| VSIX | `npx @vscode/vsce package --no-dependencies` | ✅ 804.85 KB, 103 files |
| Electron | `npm run build:daemon` → `npm run make` | ✅ Squirrel installer |
| Tauri NSIS | `npm run tauri:build -- --bundles nsis` | ✅ `Prism Setup_*_x64-setup.exe` |

**The VSIX needed `--no-dependencies`, and this is permanent.** `vsce package` runs `npm list --production --parseable --depth=99999` to enumerate dependencies. In an npm-workspaces monorepo the deps are hoisted to the **root** `node_modules`, so from the workspace package's view they are all `extraneous`; npm exits `ELSPROBLEMS` and vsce treats the non-zero exit as fatal. This is [microsoft/vscode-vsce#580](https://github.com/microsoft/vscode-vsce/issues/580), **still open** — no vsce version fixes workspaces natively. `--no-dependencies` (from [#439](https://github.com/microsoft/vscode-vsce/issues/439)) skips the dependency scan entirely and is the tool's own designed answer for **bundled** extensions. It is correct here because the extension is fully esbuild-bundled into `dist/extension.js`, so nothing in `node_modules` is needed at runtime. Note `.vscodeignore` alone cannot fix this — the `npm list` step runs *before* ignore filtering.

---

## 7. Stage-2 quality review — PASS-WITH-CONCERNS

Stage-1 spec compliance passed. Stage-2 (architecture + testing) found no release blocker but one High finding worth carrying forward.

| Severity | Location | Finding |
|---|---|---|
| **High** | `verify-invariants.mjs:86-99` | **I3 has no ROOT scoping.** Project dirs are cwd-encoded, and the check reads whichever transcript is globally newest across `~/.claude/projects` — not this repo's. A clean unrelated session can make I3 report `pass` on a Prism session that actually violated the invariant. |
| Medium | `:110` | I3 inspects only the last 4MB tail. An offending read early in a long session escapes, and the `pass` reads as "whole session clean." Worth a caveat in the `detail` string. |
| Medium | `:142-144` | Offender line-counts are taken at *current* file length, not read-time length. A gap between what was observed and what is computed — in the one check that models observation-over-inference. |
| Medium | `:283-288` | I8 matches callers by exact filename **including extension**. A helper referenced by bare CLI name (the normal pattern for an installed script) will never be seen as referenced, so it will false-FAIL the day someone documents it correctly. |
| Low | `:118-131` | I3's primary regex couples to Claude Code's current transcript key order; degrades to `unverified` (correct failure mode) if the schema changes. Worth a comment so a format change is diagnosed rather than rediscovered. |

**Testing: there is no coverage for `verify-invariants.mjs` at all.** No `scripts/__tests__/`, no fixtures. The checks are eminently self-testable — each reads from a small set of well-defined inputs — and none of that is exploited. Highest-value additions: a golden-path smoke test over a synthetic `.prism/local/` fixture (cheapest, biggest regression win), an I3 ROOT-scoping regression, an I8 bare-name regression, and an I7 24h-boundary test.

---

## 8. Version surfaces — one gap, stated not silently patched

`VERSION`, `.claude-plugin/plugin.json`, and `.claude-plugin/marketplace.json` are all **4.15.0** and consistent.

⚠️ **The per-app manifests were not bumped and remain at `4.13.2`:**

| File | Version at tag |
|---|---|
| `apps/prism-vscode/package.json` | 4.13.2 |
| `apps/prism-electron/package.json` | 4.13.2 |
| `apps/prism-installer/package.json` | 4.13.2 |
| `apps/prism-installer/src-tauri/Cargo.toml` | 4.13.2 |
| `apps/prism-installer/src-tauri/tauri.conf.json` | 4.13.2 |

`prism-release` Step 2 (`skills/prism-release/SKILL.md:125-127`) flags exactly these as manual-verification files the bump script may miss — and this cycle they were missed. **Consequence:** the installers built in §6 carry `4.13.2` in their filenames and manifests (`Prism Setup_4.13.2_x64-setup.exe`), while the plugin they install is 4.15.0.

This was **not** corrected during this ceremony: the run was scoped additive-only against the existing tag, and bumping five manifests is a re-bump. Recorded here so the next release opens with it rather than rediscovering it.

The VitePress site declared `v4.13.2` in `prism-docs/docs/.vitepress/config.ts:203` and is bumped to `v4.15.0` by this docs sync (Step 6.5) — the site's own recurring drift, caught by the skill's mandatory staleness self-check.

---

## 9. Documentation sync

The site was two releases stale (declared 4.13.2, product 4.15.0), so this sync reconciled the **4.13.2 → 4.15.0** delta rather than the release-notes file alone:

- `plugin/scripts.md` — added `verify-invariants.mjs` and `verify-model-policy-conformance.mjs` to the Release & Audit Gate table (both were undocumented), plus a new **Invariants** subsection carrying the I1–I8 table and the `unverified` contract.
- `plugin/scripts.md` — corrected the `cl-plugin-structure` validator rows, which still advertised `validate-agent.sh` / `validate-settings.sh` as **BOM-intolerant "known open (v4.13.1)"** though v4.13.2 closed them. The stale `::: warning` is now a `::: tip` recording the portable POSIX strip and the GNU-sed trap, with a separate warning carrying the three genuinely-open items (CRLF, the missing `color:` field on all 14 agents, the stale model allow-list).
- `.vitepress/config.ts` — site version `v4.13.2` → `v4.15.0`.

Post-tag work on `main` (the spectrum-marathon runner, the `spectrum` / `spectrum-architect` renames, I9) is **deliberately not documented here** — it is unreleased, and documenting it against v4.15.0 would put the site ahead of the product instead of behind it.

---

## 10. Release status

Tagged and pushed at `v4.15.0` before this ceremony ran. This run performed only the three remaining steps — docs sync, stage-2 review, native builds — additively, with no re-bump, no re-tag, and no new release commit.

| Ceremony step | Status |
|---|---|
| Stage-1 spec review | ✅ passed (prior) |
| Stage-2 quality review | ⚠️ PASS-WITH-CONCERNS — 1 High, 3 Medium, 2 Low, no test coverage |
| `prism-docs-update` | ✅ synced, site bumped to 4.15.0 |
| Native builds | ✅ 4/4 (VSIX required `--no-dependencies`) |

### Carried into the next cycle

1. Scope I3's transcript discovery to `ROOT` (**High** — `verify-invariants.mjs:86-99`).
2. Bump the five per-app manifests off `4.13.2` (§8) so installers stop shipping a stale version string.
3. Add at minimum the golden-path smoke test and the I3 ROOT-scoping regression before I3/I7/I8 are relied on unattended in Spectrum runs.
4. Note the I8 basename/extension matching gap (`:283-288`) so it is not re-litigated later as "the fix regressed."
