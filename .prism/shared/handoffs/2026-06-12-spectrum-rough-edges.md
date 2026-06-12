# Handoff: Spectrum Rough-Edge Fixes

**Date:** 2026-06-12
**For:** A fresh chat session (start clean — do not carry this conversation's context)
**Scope:** `scripts/spectrum.sh`, `scripts/spectrum-approval.sh`, `skills/prism-spectrum/SKILL.md`
**Out of scope:** Fable 5 model integration. Do NOT change model frontmatter as part of this work. Related (already done, do not redo or undo):
- Research + activation plan: `.prism/shared/research/2026-06-12-fable-5-integration.md`
- `cl-plugin-structure` change record: `.prism/shared/docs/2026-06-12-cl-plugin-structure-fable-changes.md`
- Fable 5 is locked **RESERVED / NOT ENABLED** in `skills/prism-spectrum/references/model-selection.md` — leave that lock intact.

---

## Context

A review of the Spectrum autonomous-execution workflow surfaced four rough edges that make it slow or fragile in practice. The architecture itself is sound (fresh-context-per-story, shell-side deterministic story selection, post-iteration state verification, two-stage review, consecutive-error cap). These four issues are operational, not architectural.

Recommend doing these as a small `stories.json` epic via Spectrum itself, OR as a single `/prism-implement` pass — they're independent and low-risk. Priority order below is by impact.

---

## Issue 1 — Approval hook is a latency bomb (HIGH PRIORITY)

**File:** `scripts/spectrum-approval.sh`, line 51 (`TIMEOUT=30`)

**Root cause:** The PreToolUse approval hook fires for *every tool call* a spectrum worker makes. It writes a `.request` file and polls for a `.approve`/`.deny` file for **30 seconds** before auto-approving on timeout. In the normal case — nobody is sitting there touching approval files — every single tool call pays the full 30s before proceeding.

**Impact:** A story with 40 tool calls = 40 × 30s = **20 minutes of pure sleep per story**. A 20-story epic can spend *hours* sleeping. This is almost certainly why Spectrum "felt buggy / hung" in past runs — it wasn't broken, it was sleeping.

**Proposed fix:** Reduce the default timeout to 2-3s. Keep the intervention window (so a watching controller can still approve/deny) but stop taxing the happy path. Make it configurable via env var:

```bash
TIMEOUT="${SPECTRUM_APPROVAL_TIMEOUT:-3}"
```

**Consider also:** A "no-controller" fast path. If no controller is registered/watching (e.g. an env flag `SPECTRUM_SUPERVISED` is unset), the hook could auto-approve immediately (`exit 0`) with zero polling. Supervision becomes opt-in rather than always-on-but-usually-pointless.

**Verification:** Run a spectrum story with `SPECTRUM_VERBOSE=true` and confirm tool calls proceed within ~3s, not 30s. Time a full story before/after.

---

## Issue 2 — `/tmp/` shim path is Unix-only (MEDIUM)

**File:** `scripts/spectrum.sh`, line 41 (`SHIM_DIR="/tmp/claude-spectrum-workers"`)

**Root cause:** Hardcoded `/tmp`. Works in WSL and Git Bash (which maps `/tmp` → `%LOCALAPPDATA%\Temp`), but fails in PowerShell/CMD where `/tmp` doesn't exist.

**Impact:** Spectrum can't run natively on Windows outside a bash environment. Given this repo is developed on Windows (`C:\Users\digit\...`), worth fixing for portability.

**Proposed fix:** Derive a portable temp dir:

```bash
SHIM_DIR="${TMPDIR:-/tmp}/claude-spectrum-workers"
```

`$TMPDIR` is set on macOS and most Unix; falls back to `/tmp`. For full Windows-native support, also honor `$TEMP`/`$TMP`. Note: `spectrum.sh` is bash, so it already assumes a bash runtime — the realistic target is WSL/Git Bash. Document the supported shells in the script header comment regardless.

**Verification:** Confirm shim creation works from Git Bash on Windows and from a Unix shell.

---

## Issue 3 — `PRISM_PROJECT_DIR` passed implicitly to approval hook (LOW)

**Files:** `scripts/spectrum-approval.sh` line 35 (`PRISM_PROJECT_DIR="${PRISM_PROJECT_DIR:-.}"`); `scripts/spectrum.sh` `run_iteration()` (~line 354, where the worker is invoked)

**Root cause:** The approval hook falls back to `.` (cwd) for the project dir. It works today only because `spectrum.sh` does `cd "$PROJECT_DIR"` before invoking the worker. The dependency is implicit — if cwd ever drifts, approval `.request` files land in the wrong place and the controller can't find them.

**Proposed fix:** Have `spectrum.sh` export `PRISM_PROJECT_DIR="$PROJECT_DIR"` explicitly when spawning the worker (alongside the existing `SPECTRUM_WORKER_STORY_ID`), so the hook reads an explicit value instead of relying on cwd.

**Verification:** Confirm `.prism/local/spectrum-approvals/<story-id>/` is created under the project root even if the worker's cwd differs.

---

## Issue 4 — `progress.md` token weight accumulates unbounded (LOW / DESIGN)

**File:** `skills/prism-spectrum/SKILL.md` (Workflow step 1 "Load State", step 7 "Update State Files")

**Root cause:** Every story appends a learnings entry to `progress.md`, and the skill reads the *entire* file at the start of every session. By story 30 of a 50-story epic, `progress.md` can exceed 20K tokens, so later stories burn more of their 1M context budget on accumulated history.

**Impact:** Not a crash — `sonnet[1m]` has headroom — but later stories have progressively less runway, and the signal-to-noise of old iteration logs degrades.

**Proposed fix (pick one):**
- **A — Two-tier file:** Keep the curated "Codebase Patterns (Consolidated)" section at the top loaded every session; move per-iteration logs to a separate `progress-log.md` that's append-only and NOT read on load. The consolidated patterns are the part future stories actually need.
- **B — Windowed read:** Read only the consolidated patterns section + the last N iteration entries (e.g. tail 5), not the whole file.
- **C — Periodic compaction:** Every K stories, an agent summarizes the iteration log into the consolidated section and truncates the raw log.

Recommend **A** — cleanest separation, no information loss, smallest change to the read path. The "Codebase Patterns (Consolidated)" section already exists in `init_progress()` (spectrum.sh ~line 300), so the structure is half there.

**Verification:** Confirm a late-story session loads <5K tokens of progress state instead of 20K+, and that consolidated patterns are still available.

---

## Quality Gates

This repo's CLI has Go tests (`cd apps/prism-cli && make test`), but these fixes are bash + markdown. Verify with:
- `bash -n scripts/spectrum.sh` and `bash -n scripts/spectrum-approval.sh` (syntax check)
- Run `scripts/hook-linter.sh` and `scripts/validate-hook-schema.sh` if the approval hook changes (per cl-plugin-structure skill)
- A live smoke test: a 2-3 story throwaway `stories.json` epic, timed before/after Issue 1's fix
- `claude plugin validate .` after any change touching hooks or skill frontmatter

## Suggested Commit Strategy

One commit per issue, conventional format:
- `fix(spectrum): reduce approval hook timeout from 30s to 3s (configurable)`
- `fix(spectrum): use portable TMPDIR for worker shim path`
- `fix(spectrum): pass PRISM_PROJECT_DIR explicitly to approval hook`
- `refactor(spectrum): split progress.md into consolidated patterns + append-only log`

## Do NOT

- Change any `model:` frontmatter (Fable 5 work is deferred — separate doc)
- Disturb the Fable 5 **RESERVED / NOT ENABLED** lock in `skills/prism-spectrum/references/model-selection.md` — the 🔒 blocks, the "Opus is the hard ceiling" line, and the "Never" override rows are intentional, not stale TODOs. Issue 4 touches that skill's `SKILL.md`, not `model-selection.md`, so there's no overlap — but if you open `model-selection.md`, leave the Fable section alone.
- Touch the signal vocabulary or post-iteration verification logic (those are working correctly)
- Remove the approval hook entirely — the supervision primitive is wanted, just not at 30s
