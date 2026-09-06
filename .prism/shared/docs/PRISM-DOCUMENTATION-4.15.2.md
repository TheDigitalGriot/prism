# Prism v4.15.2 — Documentation Snapshot

**Released:** 2026-09-06 (tagged `v4.15.2`)
**Theme:** Retiring the old installer exposed that the new one was never finished. The sunset is the headline; the discovery underneath it is the release.

---

## 1. Why this release exists

v4.15.2 was scoped as housekeeping: retire `apps/prism-setup`, the legacy Electron/NSIS installer that the Tauri installer replaced, and harden the build against the stale-artifact bug that shipped 4.13.2-stamped binaries under a 4.15.0 tag.

The sunset had one open question attached to it — *where does the VSIX ship now?* The instruction carried its own decision rule: if the Tauri installer already bundles it, prism-setup's copy was redundant; if not, migrate the bundling. Answering that question is what turned a cleanup into a fix.

**The Tauri installer did not bundle it. It never had.**

| Claim | Evidence |
|---|---|
| `bundle.resources` never existed in `tauri.conf.json` | `git log -S resources -- apps/prism-installer/src-tauri/tauri.conf.json` returns **nothing** |
| Nothing resolved a bundled resource at runtime | No `resolveResource` / `resourceDir` / `resource_dir` call anywhere in `src/` or `src-tauri/src/` |
| CI staged resources into a void | `prism-installer-release.yml` copies into `src-tauri/resources/` — which Tauri ignores without `bundle.resources` |
| The runtime path was never populated | `install_all_extensions` was called with `%LOCALAPPDATA%\Prism\extensions\prism.vsix`, a path only the **legacy NSIS** ever wrote |
| No standalone channel either | v4.15.0 and v4.15.1 published **no `prism.vsix` asset** |

So the shipped installer's "VS Code extension" component could not have worked, and the only thing still putting a VSIX anywhere was the installer being retired. Sunsetting without migrating would have removed the last remaining channel — quietly.

## 2. What the migration actually changed

Three edits, deliberately narrow:

1. **`tauri.conf.json`** declares the resource:
   ```json
   "resources": { "resources/extensions/prism.vsix": "extensions/prism.vsix" }
   ```
2. **`ProgressStep.tsx` / `InstallingStep.tsx`** resolve it properly — `await resolveResource("extensions/prism.vsix")` instead of the never-populated `installDir` path. A failure is re-raised as *"Bundled VSIX resource not found … this is a packaging error"*, because this path cannot be end-to-end tested here and the log line is the only field-diagnosable signal.
3. **`DirectoryStep.tsx`** drops the install-path row that advertised a VSIX location the installer no longer writes. Leaving it would have been an active lie during install.

The VSIX is tracked at `apps/prism-installer/src-tauri/resources/extensions/prism.vsix` — the same tracked-binary pattern prism-setup used, chosen over a build-time staging dance because it is the lowest-risk option for a release cut.

**Verified mechanically:** `tsc` clean; a real `tauri build --bundles nsis` staged the resource at `target/release/extensions/prism.vsix` (824,151 bytes) and grew the NSIS artifact from 3,668,006 to 4,299,914 bytes — a delta consistent with the compressed VSIX.

**Not verified:** an end-to-end install on a clean machine. Stated plainly rather than implied.

## 3. The stale-artifact class, closed at the root

v4.15.0 shipped installers stamped `4.13.2`. The mechanism, found in this cycle:

`tauri.conf.json` had `"targets": []`. In Tauri v2, *omitting* the key defaults to the platform's standard bundles; an **explicit empty array bundles nothing — and still exits 0**. The compile succeeded, no installer was produced, and the previous version's `.exe` sitting in `bundle/nsis/` was collected as if it were fresh.

Two hardeners, one structural and one procedural:

- **Root fix (4ad3a98):** `targets: ["nsis"]`. A build that produces nothing is no longer a silent success.
- **Procedural:** `prism-release` now requires cleaning `bundle/nsis/` and `out/make/` before building, so no prior artifact can be mistaken for fresh output even if a step no-ops.

And the check that would have caught it regardless — **verify by embedded `ProductVersion`, never by filename**, now a numbered step in the skill:

```powershell
(Get-Item "<installer>.exe").VersionInfo.ProductVersion   # must equal the release version
```

A filename is a label anyone can reuse; the embedded version is compiled in.

## 4. The gate that misnamed its own failure

`scripts/pre-release-audit.mjs` shared one `failed` counter across all sections, so the structural-checks verdict line inherited any earlier `verify-*.mjs` failure and printed `[FAIL] structural checks` when the structural checks had found nothing. A release gate that misattributes which check broke sends you to debug the wrong thing. It now compares against a snapshot taken before its section runs.

Small bug; exactly the class the invariants exist to catch — a check whose *reporting* is wrong is worse than no check, because it is trusted.

## 5. Release & Audit gate results

| Gate | Result |
|---|---|
| `claude plugin validate .` | PASS |
| `verify-branch-integrated.mjs` | PASS |
| `verify-ceremony-gate.mjs` | PASS |
| `verify-invariants.mjs` | **FAIL — I9 only** |
| `verify-invariants.test.mjs` | PASS |
| `verify-model-policy-conformance.mjs` | PASS |
| `verify-story-unification.mjs` | PASS |
| structural checks (11 changed files) | PASS |
| spec review | PASS — no High/Medium |
| quality review | no Critical/High; 1 Medium + 3 Low, addressed or logged |

**I9 override, logged as the ceremony requires:** 7 brainstorm decisions remain decided-but-silent (no commit, no deferral). It ships noted, as in 4.15.0 and 4.15.1 — an explicit, recorded acceptance rather than a silent bypass.

## 6. Known gaps carried forward

- **CLI and plugin components still read from `installDir\binaries\` and `installDir\plugin\`.** These have the identical defect the VSIX had — paths only the legacy NSIS populated. Only the VSIX was migrated in this cut. Documented in `skills/prism-release/SKILL.md` under Step 3d so it cannot be rediscovered from scratch.
- **No test covers the `resolveResource` path.** Consistent with the installer's existing lack of a screen-test harness, but a real gap: the only verification is a manual build plus byte inspection.
- **Rollback is intact.** `apps/prism-setup/` and `installer/` were not deleted — nothing was removed from either tree. `git diff --diff-filter=D v4.15.1..HEAD -- apps/prism-setup/ installer/` is empty. `apps/prism-setup/DEPRECATED.md` records the terms in-tree.
