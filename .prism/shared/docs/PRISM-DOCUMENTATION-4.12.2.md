# Prism v4.12.2 — Documentation Snapshot

**Released:** 2026-09-01 (tag `v4.12.2`, commit `d635a2d`, GitHub release "v4.12.2 - Stuck Protocol")
**Theme:** Stuck Protocol — device/cloud tool recovery, propagated to every skill and agent that drives a browser, MCP, or device bridge.

> ⚠️ **Reconstructed after the fact.** This snapshot was written on **2026-09-03**, during the post-v4.13.0 drift sweep, from the git record — `git log/diff v4.12.1..v4.12.2`, the tag, and the GitHub release. It was **not** authored at release time; v4.12.2 shipped without one, which is the bookend-convention miss this file closes. Everything below is quoted or counted from the commits themselves; nothing is inferred about intent that the diff does not show.

---

## 1. What shipped

Two commits, 23 files, +25/−2 lines. A **documentation and behavioral-contract patch** — no runtime code, no schema, no model changes.

| Commit | Date | Subject |
|---|---|---|
| `c4f8373` | 2026-09-01 | prism: add Stuck Protocol device/cloud recovery (CLAUDE.md + bridge skills/commands/agents) |
| `d635a2d` | 2026-09-01 | release: v4.12.2 - Stuck Protocol device/cloud recovery (docs patch) |

The release commit touched only `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` (version 4.12.1 → 4.12.2). **Root `VERSION` was not updated** — see §4.

---

## 2. The Stuck Protocol

The canonical statement was added to `CLAUDE.md` as a top-level section, verbatim:

> **Stuck Protocol — device/cloud tool recovery (non-negotiable)**
>
> When ANY device/cloud tool returns empty/`[]`/"not connected"/"no DOM"/403 or fails first-call, that is NOT "unavailable." Before reporting a tool blocked/skipped, run the ladder: **(1) retry 2-3x** (lazy bridges — Claude-in-Chrome, MCP attach — return empty at session start; `[]` != absent) → **(2) switch surface** (built-in browser pane ↔ Claude-in-Chrome; Windows-MCP PowerShell when the sandbox has no route; the Gmail *browser* when the *connector* is the wrong account) → **(3) replay the logs** (session_info → last successful run of this task → copy its exact tool sequence) → **(4) ask Gavin ONE direct question.** Gavin's word about his own machine is GROUND TRUTH — try his path before theorizing why it can't work. Reporting "blocked" without steps 1-3 is a DEFINED ERROR, not a status; a forced skip = INCOMPLETE run, said loudly.

### The four-rung ladder

```
tool returns []/403/"not connected"/no DOM
        │
        ├─ 1. RETRY 2-3x ......... lazy bridges return empty at session start
        │                          `[]` != absent
        ├─ 2. SWITCH SURFACE ..... built-in pane ↔ Claude-in-Chrome
        │                          Windows-MCP PowerShell when sandboxed
        │                          Gmail *browser* when the *connector* is wrong
        ├─ 3. REPLAY THE LOGS .... session_info → last successful run
        │                          → copy its exact tool sequence
        └─ 4. ASK ONE QUESTION ... direct, singular
```

Two rules give the protocol teeth:

- **Ground truth.** The user's word about their own machine outranks any tool error string. Try their path before theorizing why it cannot work.
- **"Blocked" is a defined error, not a status.** Reporting a tool blocked without completing rungs 1–3 is itself the failure. A forced skip makes the run **INCOMPLETE**, and must be said loudly rather than presented as a partial success.

---

## 3. Propagation — 20 carrier files

Rather than relying on `CLAUDE.md` being loaded, the release embedded a one-line pointer blockquote into every component that actually drives a browser, MCP, or device bridge. Each carrier received exactly **one** added line, ending `Full ladder: this plugin's CLAUDE.md "Stuck Protocol" section.`

| Type | Count | Files |
|---|---|---|
| Agents | 3 | `browser-verifier`, `log-investigator`, `state-investigator` |
| Commands | 2 | `prism-browse`, `prism-screenshot` |
| Skills | 15 | `prism-brainstorm`, `prism-capture`, `prism-closing-ceremony`, `prism-debug`, `prism-design`, `prism-dispatch`, `prism-eval`, `prism-implement`, `prism-release`, `prism-research`, `prism-sideload`, `prism-spectrum`, `prism-subagent`, `prism-validate`, `prism-verify` |

The selection is coherent: every browser-driving surface (`prism-verify`, `prism-browse`, `prism-screenshot`, `browser-verifier`), every device/state investigator (`log-investigator`, `state-investigator`, `prism-debug`), and every long-running autonomous surface where a silent skip would corrupt the run (`prism-spectrum`, `prism-subagent`, `prism-release`, `prism-closing-ceremony`).

---

## 4. Known gaps in this release

Recorded here because the drift sweep found them, not because they were known at the time:

- **Root `VERSION` was not bumped.** v4.12.0–4.12.2 each moved only `plugin.json` and `marketplace.json`, leaving root `VERSION` at 4.12.1 and every app (vscode, electron, mobile, installer, tauri, CLI, prism-core, prism-ui) pinned at **4.11.0**. Because `scripts/bump-version.py` keys off root `VERSION`, this silently compounded until v4.13.0 audited each location directly. Fixed in `781c366`.
- **No CHANGELOG entry.** v4.12.2 shipped without one; backfilled in `781c366`.
- **No documentation snapshot.** Closed by this file.
- **The in-repo mirror did not receive the 20 carrier files.** `apps/prism-setup/resources/plugin/` was not re-synced, so the NSIS installer shipped skills and agents *without* the Stuck Protocol blockquote — and manifests still declaring 4.11.0. The CI workflow re-copied only `commands/` and `agents/`, so this could not self-correct. Fixed in `7e8ab5b` (workflow now copies all six plugin dirs; mirror re-synced).
- **The carrier line points at `CLAUDE.md`, which the plugin does not ship.** `sync-prism-plugin.sh` archives six dirs; `CLAUDE.md` sits at repo root, outside all of them. So in the marketplace mirror and the sideload zip, "Full ladder: this plugin's CLAUDE.md" dangles. Still open — see §5.

---

## 5. Open follow-up

**The dangling `CLAUDE.md` pointer.** All 20 carriers reference a file that reaches neither distribution channel. Options: ship `CLAUDE.md` in the archived set, relocate the canonical ladder into a shipped skill reference (e.g. `skills/cl-plugin-structure/references/`), or inline the full ladder into the carriers. Not addressed by v4.13.0 or the drift sweep.

---

## 6. Verification status

This snapshot documents a release that shipped **before** the current gate set existed. `scripts/verify-model-policy-conformance.mjs` and the six-dir CI copy both post-date it. Re-running today's `pre-release-audit.mjs` against the v4.12.2 tree would fail the structural check — `skills/cl-plugin-structure/SKILL.md` carried machine-specific absolute paths from v4.12.0 until `ddc1c6e`.

---

*Reconstructed 2026-09-03 from `git log/diff v4.12.1..v4.12.2`, tag `v4.12.2` (`d635a2d`, 2026-09-01 03:53:30 −0400), and GitHub release "v4.12.2 - Stuck Protocol" (published 2026-09-01T07:53:36Z).*
*Related: `.prism/shared/docs/PRISM-DOCUMENTATION-4.12.0.md` · `PRISM-DOCUMENTATION-4.12.1.md` · `PRISM-DOCUMENTATION-4.13.0.md`*
