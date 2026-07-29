# Prism 4.8.0 — prism-gavel drive-loop repair (the cockpit was inert)

**Release date:** 2026-07-29
**Type:** bugfix (headline-feature repair) + validation-discipline finding
**Builds on:** 4.7.0 (prism-gavel decision cockpit + generalized `digital-griot-mcp` channel)

## Summary

v4.7.0 shipped the prism-gavel decision cockpit. Its defining feature — the **drive loop**, where a
card's button wakes the agent to act with real tools instead of a sandboxed artifact acting on its own
— **did not work at all.** Every use·role·stage control and all four verb buttons were inert.

Two independent defects, both found by *executing* the loop rather than reading it:

1. **`helper.js` was injected into a CSS comment.** The popout server injected the drive layer with a
   first-match string replace against `</body>`; `frame.html` contains that literal twice, and the
   first occurrence is the file's own header comment documenting this very injection. The helper
   therefore landed inside `<style>`, where it never executed.
2. **The shared wake channel could not hold its port.** `digital-griot-mcp` binds a fixed
   `127.0.0.1:52342` but is spawned per Claude Code session; bind losers gave up permanently, so once
   the winning session exited nothing reclaimed the port. Measured in the wild: **two live processes,
   zero listeners** — a dead wake channel for `prism-gavel` *and* `prism-brainstorm`.

Neither was visible to code review. Both were instantly visible to execution. That is the release's
real lesson, recorded below.

## What changed

### Fix 1 — helper injection targets the last `</body>` (`skills/prism-gavel/scripts/server.cjs`)
- Replaced `html.replace('</body>', …)` with `lastIndexOf` + slice. `String.replace` with a *string*
  pattern substitutes only the first match; injecting into HTML by string-matching a closing tag is
  fragile precisely because that tag appears in comments, strings, and baked data.
- The no-match fallback (append) is unchanged.
- **Blast radius checked:** `skills/prism-brainstorm/scripts/server.cjs:151` carries the identical
  fragile pattern, but its `frame-template.html` has a single `</body>` (line 553), so brainstorm was
  never triggered. Verified by serving it and confirming the helper lands before `</body></html>`.
  Left unfixed here deliberately — tracked as a follow-up, not a live defect.

### Fix 2 — channel standby retry/rebind (`scripts/digital-griot-mcp/digital-griot-mcp.ts`)
- The bind moved out of a bare `try`/`catch` into a `bindChannel()` function with a 3s retry timer.
  Bind losers become **standbys** that reclaim `:52342` the moment it frees, instead of dying silently.
- The transition is logged **once**, not per attempt, so stderr stays readable. `console.error` keeps
  stdout pure JSON-RPC, per the 4.5.9 no-orphan stdio hygiene standard.
- The retry timer is `unref`'d — the process is held alive by the stdio transport, never by the timer.
- **The port contract is preserved exactly:** `DEFAULT_PORT = 52342` and the `BRAINSTORM_CHANNEL_PORT`
  env var are untouched, as the S2 spec requires (`server.cjs`/`helper.js` discover the channel by
  port, not by name). The stdio transport and all six `gavel_*` tools work regardless of listener state.

### Bookkeeping
- `.prism/stories/prism-gavel/stories.json` reconciled with git: S1–S4 marked `complete` with their
  real commit hashes and timestamps; S5 correctly remains `pending`. The file had marked all five
  `pending` with null hashes despite four having shipped — actively misreporting state to any
  resume-aware executor.
- New validation report: `.prism/shared/validation/2026-07-29-prism-gavel-report.md`.

## Dogfood / proof

Both fixes were verified live, not asserted:

- **Fix 1:** helper relocated from line 13 (inside the CSS comment) to line 1565 (past the document's
  1561 lines); page scripts went 2 → 3 with the 5150-char helper present.
- **Fix 2:** a standby was started while another instance held the port, the owner was killed, and the
  standby logged `HTTP channel RECLAIMED 127.0.0.1:52342 — wake active` with `/health` answering.
- **Full round-trip:** real cockpit clicks produced canonical events-file entries **and** an MCP wake
  carrying `{session_id, skill:"gavel", verb, card_id}` — every hop of
  `click → helper.js → POST :52342 → channel → wake → events file` confirmed. `commit` was deliberately
  not fired, honoring the skill's HITL HARD-GATE.
- **Regression:** a brainstorm-shaped POST still wakes with `{session_id, choice, element_id}`
  unchanged — one shared wire, both surfaces, no drift from the 4.7.0 rename.

## Compatibility

Fully backward compatible. No API, schema, or contract changes: the channel port, its env var, the
wake payload shape, and the `stories.json` schema are all unchanged. Behavioral change is limited to
two additional stderr lines (bind status) and the drive loop actually functioning.

## Verification

- `claude plugin validate .` — passed
- `node scripts/pre-release-audit.mjs` — **AUDIT CLEAN** (5/5: plugin validate, verify-branch-integrated,
  verify-ceremony-gate, verify-story-unification, structural checks)
- `bash scripts/tests/test_porter_check.sh` — passed (note: `--check` self-skips when griotwave tokens
  are unavailable, so it did not truly verify sync)
- `bun build --target=bun scripts/digital-griot-mcp/digital-griot-mcp.ts` — 219 modules, no errors
- Closing-ceremony Step-0 two-stage review — **no High findings**; one Medium (a non-schema `validation`
  field drifting from `stories-contract.md`'s work-definition/runtime separation) fixed before release.

## Known follow-ups (not in this release)

1. **Harden `skills/prism-brainstorm/scripts/server.cjs:151`** with the same `lastIndexOf` fix. Latent,
   not triggered, one line — a live landmine for the next brainstorm template edit.
2. **Complete story S5** — `prism-gavel` is still unregistered in the DGS Definitive Plan (one prose
   mention vs `prism-brainstorm`'s eight); needs an `APPS` entry and `EDGES` line via `dgs-plan-update`.
3. **Add a drive-loop smoke test.** Serving the frame and asserting the helper `<script>` is the last
   element before `</body>` would have caught Defect 1 in under a second.
4. **Backfill missing doc snapshots** — no `PRISM-DOCUMENTATION-*.md` exists for 4.6.0 or 4.7.0; the
   bookend snapshot step was skipped for two consecutive releases.

## The process finding

Stories S3 and S4 were both accepted against criteria worded *"click → agent acts → reflect"* — criteria
that **could not have passed** as shipped. Acceptance had been discharged by reading code rather than
running it. The most valuable output of this cycle is not the two bugs; it is the confirmation that
**behavioral acceptance criteria must be discharged behaviorally.** A feature whose entire premise is an
interaction cannot be signed off without performing the interaction.
