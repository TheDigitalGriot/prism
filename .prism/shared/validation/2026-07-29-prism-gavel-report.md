---
date: 2026-07-29
epic: prism-gavel
plan: .prism/shared/plans/2026-07-28-prism-gavel.md
stories: .prism/stories/prism-gavel/stories.json
spec: .prism/shared/designs/prism-gavel-S2-S5-spec.md
validated_release: v4.7.0
status: PARTIAL — S1–S4 delivered but shipped non-functional; two defects found by live execution, both fixed and re-verified. S5 incomplete.
---

# Validation Report — prism-gavel

All evidence in this report was produced by commands run **in this session**. No claim rests on a
checkbox, a commit message, or a prior run.

## Summary

| Metric | Result |
|--------|--------|
| Stories | 4/5 implemented (S1–S4); S5 incomplete |
| Plan ↔ stories parity | 5/5 mapped, 1:1, ids stable |
| Automated gates | 2/2 passing (1 soft-skip noted) |
| Manual/behavioural criteria | 5/5 verified — **but only after 2 fixes** |
| Defects found | **2 (both severity: critical / high)** |
| Defects fixed + re-verified | 2 |
| Status | **PARTIAL** |

### The headline

**The drive loop — the single defining feature of prism-gavel — was 100% non-functional in the
shipped v4.7.0 release.** Every verb click was inert. The defect was invisible to code review and
would have remained invisible to any validation that read code rather than executing it. S3 and S4
were both accepted against criteria worded *"click → agent acts → reflect"*; neither could ever have
passed as shipped. **This is a process finding, not just a bug finding.**

---

## 1. Git State & Scope

Epic commits, all verified ancestors of `main` (`git merge-base --is-ancestor` → YES ×4):

| Story | Commit | Title |
|-------|--------|-------|
| S1 `s-dd9c27cf` | `9826249` | scaffold prism-gavel skill |
| S2 `s-0f7a0813` | `14c6a75` | generalize brainstorm-channel into shared digital-griot-mcp + 6 gavel MCP tools |
| S3 `s-60898f71` | `5194945` | lift Gavel cockpit into prism-gavel popout stack |
| S4 `s-ffac38f6` | `5c3e0cc` | wire gavel verb read/write bindings |
| — | `c867520` | regen prism-setup installer mirror for S1–S4 |

`git rev-list --left-right --count main...feat/prism-gavel` → `2 0`. The branch is **fully
integrated** into `main`; nothing stranded. The repo's integration invariant is satisfied.

Scope: `42 files changed, 5169 insertions(+), 465 deletions(-)` (`c0be402..5c3e0cc`).

## 1a. Story Coverage (plan ↔ stories parity)

| Plan story | stories.json id | Mapped | Status recorded | Reality |
|---|---|---|---|---|
| S1 Scaffold | `s-dd9c27cf` | ✅ | `pending` | **shipped** |
| S2 Generalize channel | `s-0f7a0813` | ✅ | `pending` | **shipped** |
| S3 Lift cockpit | `s-60898f71` | ✅ | `pending` | **shipped** |
| S4 Wire verbs | `s-ffac38f6` | ✅ | `pending` | **shipped** |
| S5 Package/release/register | `s-f6bbcf35` | ✅ | `pending` | **genuinely incomplete** |

Coverage is 1:1 with stable ids — no re-emit churn. **However, all five stories still read
`"status": "pending"` with `completedAt: null` and `commitHash: null` despite four of them shipping.**
The bookkeeping write-back never happened, so `stories.json` actively misreports project state. Any
resume-aware executor reading it would rebuild finished work.

> **Finding (process, medium):** git is the durable record; `stories.json` is a projection *about* it.
> The two diverged silently. Reconciling them must be a step, not an assumption.

---

## 2. Independent Verification

Per the distrust pattern — every requirement checked against running behaviour, not checkboxes.

| Requirement (plan) | Plan says | Verified by | Status |
|---|---|---|---|
| `skills/prism-gavel/` scaffold, sibling to brainstorm | S1 done | Dir listing: `SKILL.md` 10655 B, `visual-companion.md` 3805 B, `references/`, `scripts/` | ✅ |
| Plugin validates; gavel loads; brainstorm unaffected | S1 accept | `claude plugin validate .` → **Validation passed**, exit 0. `prism:prism-gavel` present in live skill registry | ✅ |
| Channel renamed + relocated to neutral home | S2 | `scripts/digital-griot-mcp/digital-griot-mcp.ts` exists; old `skills/prism-brainstorm/scripts/brainstorm-channel.ts` deleted (−220 lines) | ✅ |
| `plugin.json` mcpServers key + channels entry | S2 | `plugin.json:10` `"digital-griot-mcp"`, `:18-20` `channels: [{server: "digital-griot-mcp"}]` | ✅ |
| Six gavel tools callable | S2 accept | `gavel_state` invoked live → returned real shelf parsed from `griot-live-artifacts` HEAD (242 KB payload). Dispatch switch at `digital-griot-mcp.ts:793-804` routes all six to real handlers; zero TODO/stub/placeholder | ✅ |
| **Brainstorm still drives through renamed channel** | S2 accept (Risk #1) | POST brainstorm-shaped payload → `{"ok":true}` → wake emitted with meta `{session_id, choice, element_id}` **unchanged**. Brainstorm helper verified injected at end of served page | ✅ |
| Cockpit renders in the popout | S3 accept | Served on `:61374`; DOM query → 6 cards, 4 verbs (`open/scan/commit/verify`), 4 `[data-use]`, 3 `[data-role]`, 3 `[data-stage]` | ✅ |
| **Controls emit channel intents** | S3 accept | ❌ **FAILED as shipped** — see Defect 1. ✅ after fix | ⚠️ fixed |
| **Each verb round-trips: click → agent acts → reflect** | S4 accept | ❌ **FAILED as shipped** — see Defect 1. ✅ after fix (evidence below) | ⚠️ fixed |
| Sideload clean; released; DGS plan shows prism-gavel | S5 accept | Released as v4.7.0 ✅; **DGS registration MISSING** ❌ | ❌ incomplete |

### Unplanned / uncommitted changes at time of validation

- `scripts/digital-griot-mcp/digital-griot-mcp.ts` — **modified** (Defect 2 fix). Justified: repairs a
  shipped defect.
- `skills/prism-gavel/scripts/server.cjs` — **modified** (Defect 1 fix). Justified: repairs a shipped
  defect that made the feature inoperable.
- `paralegalpro-brainstorm-{input,output}.md` — untracked, **belong to a different workstream**; not
  touched, not staged.

No over-building detected: every changed file in `c0be402..5c3e0cc` maps to a plan story.

---

## 3. Defects

### Defect 1 — helper.js injected into a CSS comment (CRITICAL) — *fixed, re-verified*

**Location:** `skills/prism-gavel/scripts/server.cjs:170-171` (pre-fix).

```js
if (html.includes('</body>')) {
  html = html.replace('</body>', helperInjection + '\n</body>');
}
```

`String.prototype.replace` with a **string** pattern replaces only the **first** occurrence.
`skills/prism-gavel/scripts/frame.html` contains `</body>` **twice**:

- **line 13** — inside the header CSS comment: `* a full document served by gavel's server.cjs, helper.js injected before </body>.`
- line 1560 — the real structural close.

The injection therefore landed at line 13, **inside a `<style>` comment**, where it is inert (and
corrupts the comment). The comment documenting the injection is what swallowed it.

**Impact:** `helper.js` never executed → no WebSocket to `server.cjs`, no POST to the channel →
**every verb click dead**. The drive loop, the entire premise of the skill, did not function in
v4.7.0.

**Evidence, before fix:**
- Served HTML line 13: `... helper.js injected before <script>` followed by `(function() {` — the helper body inlined into the comment.
- Browser: `scriptCount: 2` (267053, 20951 chars — both cockpit code); no helper; `helperPresent: false`.

**Fix:** target the **last** `</body>` via `lastIndexOf` + slice; fall back to append.

**Evidence, after fix:**
- Line 13 restored: `* ... helper.js injected before </body>.`
- Helper relocated to **line 1565** (document is 1561 lines).
- Browser: `scriptCount: 3` → `[267053, 20951, 5150]`; `helperPresent: true`.

**Blast radius:** `skills/prism-brainstorm/scripts/server.cjs:150-151` carries the **identical**
fragile pattern, but `frame-template.html` has only one `</body>` (line 553), so brainstorm is
**not currently regressed** — verified by serving it and confirming the helper lands before
`</body></html>`. The trap remains latent there.

### Defect 2 — channel cannot hold its port (HIGH) — *fixed, re-verified*

**Location:** `scripts/digital-griot-mcp/digital-griot-mcp.ts` (bind block, pre-fix ~line 851).

The channel binds a **fixed** port 52342 — correctly so; that port is the discovery contract
`server.cjs`/`helper.js` depend on and the spec says not to change it. But the server is spawned
**per Claude Code session**. Concurrent sessions race for the bind; the losers logged once to stderr
and **never retried**. When the winning session exited, the port freed and no survivor reclaimed it.

**Impact:** measured live — **two `bun` instances alive (PIDs 14476, 38416, since 12:22), zero
listeners on 52342.** `Test-NetConnection`, `Invoke-WebRequest`, and `netstat` all agreed the channel
was dead. Wake is unavailable for **both** prism-gavel and prism-brainstorm whenever this happens.
The stderr log exists but MCP-server stderr is never surfaced to the user, so the failure is
effectively silent.

> This is the exact failure mode the project's own operating rule names: *readiness is a socket that
> answers, never a process count.* Here a process count reported "2, healthy" while the socket was dead.

**Fix:** retry/rebind standby loop — on `EADDRINUSE`, log the transition **once**, then retry every
3 s and reclaim the port the moment it frees. Timer is `unref`'d; the stdio transport and all six
`gavel_*` tools remain functional regardless of listener state. Fixed port preserved.

**Evidence, after fix:**
```
[digital-griot-mcp] HTTP bind failed (Error: Failed to start server. Is port 52342 in use?)
    — another instance owns :52342. Standing by; will reclaim it if that instance exits.
        ↓ (owner PID 24380 killed)
[digital-griot-mcp] HTTP channel RECLAIMED 127.0.0.1:52342 — wake active.
        ↓
GET /health → {"ok":true,"port":52342}
```

---

## 4. Drive Loop — End-to-End Proof (post-fix)

The criterion never previously exercised. Executed against a live cockpit on `:61374` with the
channel on `:52342`.

Two real verb clicks dispatched through helper delegation (`scan`, then `verify` — `commit`
deliberately **not** fired, per the skill's HITL HARD-GATE):

**Canonical events file** (`.prism/local/gavel/929-1785345956/state/events`):
```json
{"type":"verb","skill":"gavel","verb":"scan","card_id":"oss28","card_title":"Debossify","timestamp":1785346016239}
{"type":"verb","skill":"gavel","verb":"verify","card_id":"oss28","card_title":"Debossify","timestamp":1785346262761}
```

**MCP wake notification emitted by the channel:**
```json
{"method":"notifications/message/create",
 "params":{"content":"Griot viewer interaction — read events file for details",
 "meta":{"session_id":"929-1785345956","skill":"gavel","verb":"verify","card_id":"oss28"}}}
```

Every hop confirmed: **cockpit click → helper.js delegation → POST :52342 → channel → MCP wake
carrying `skill`/`verb`/`card_id` → events file**. Payload shape matches the S2b contract exactly.

---

## 5. Success Criteria

**Automated**

| Criterion | Command | Result |
|---|---|---|
| Plugin/marketplace manifest valid | `claude plugin validate .` | ✅ **Validation passed**, exit 0 |
| Porter sync | `bash scripts/tests/test_porter_check.sh` | ⚠️ exit 0 but **soft-skip**: *"--check skipped: griotwave tokens unavailable"* — did not actually verify sync |
| Channel source compiles | `bun build --target=bun … digital-griot-mcp.ts` | ✅ Bundled 219 modules, no errors |

**Manual / behavioural**

| Criterion | Status |
|---|---|
| gavel skill loads alongside brainstorm | ✅ both in live registry |
| Six `gavel_*` tools callable | ✅ `gavel_state` returned real data |
| Cockpit renders with full control set | ✅ 6 cards / 4 verbs / use·role·stage |
| Verb click round-trips to a wake | ✅ **after Defect 1 fix** |
| Brainstorm not regressed by the rename | ✅ wake fires, payload shape unchanged |
| DGS plan registers prism-gavel | ❌ **not done** |

### 3a. Visual Regression
**Skipped — no baselines found.** `.prism/shared/validation/baselines/` contains no directory for any
prism-gavel story. Given the cockpit is a 303 KB lifted surface, baselines would have real value here;
recommended as follow-up.

### 3b. Structural Validation
**Skipped — not meaningfully applicable.** Both changed files are standalone runtime entry points (a
Bun stdio+HTTP MCP server; a Node HTTP/WS server) rather than library code with in-graph callers, so
call-path and dead-code queries would not exercise the changed behaviour. The behavioural proof in
§4 covers the risk that structural analysis would have approximated.

---

## 6. Deviations from Plan / Spec

| Deviation | Reason | Impact |
|---|---|---|
| Six formal **MCP tools** built, where spec S2c *recommended* "verbs-on-wake for v1 (less surface area)" | Plan's own architecture table specified six MCP tools; implementation did both (tools + resolve-and-return on wake) | Neutral-to-positive. Resolves spec open question #2. Larger surface than recommended, but lets Desktop/CLI drive the cockpit directly as the spec anticipated |
| Channel home = `scripts/digital-griot-mcp/` (plugin root) | Spec open question #1 offered this or `skills/_shared/` | Resolved; matches spec option 1 |
| Port meta key still `brainstorm-channel-port` | Spec marked the rename optional/cosmetic, requiring a paired change in `server.cjs` + `helper.js` | Cosmetic only. Now carries mild misleading-name debt since the channel serves both surfaces |
| `stories.json` never status-updated | Bookkeeping step missing from the execution path | **Medium** — the file misreports state and would mislead a resume |
| Duplicate `brainstorm-channel-port` meta tag observed in brainstorm's served page | Not investigated in depth | Informational; `querySelector` takes the first, behaviour unaffected |

---

## 7. Status & Recommendations

**Status: PARTIAL.** S1–S4 are functionally complete **only with the two fixes in this report
applied**; as tagged, v4.7.0 ships a cockpit whose every control is inert. S5 is genuinely incomplete.

### Immediate
1. **Commit both fixes** — `server.cjs` (Defect 1) and `digital-griot-mcp.ts` (Defect 2). Until then
   the repair exists only in the working tree.
2. **Mirror the fixes into `apps/prism-setup/resources/plugin/`** — the installer copy is regenerated
   from source (`c867520`) and still contains both defects.
3. **Cut a patch release.** v4.7.0's headline feature does not work; users installing it get a dead
   cockpit.

### Follow-up
4. **Harden brainstorm's injection** (`server.cjs:150-151`) with the same `lastIndexOf` fix — latent,
   not yet triggered, one line.
5. **Reconcile `stories.json`** — mark S1–S4 `complete` with their commit hashes.
6. **Complete S5's registration** — `prism-gavel` appears once (prose) in the DGS plan vs
   `prism-brainstorm`'s 8; needs an `APPS` entry + `EDGES` line via `dgs-plan-update`.
7. **Add a smoke test that executes the loop.** Both defects were invisible to inspection and
   instantly visible to execution. A test that serves the frame and asserts the helper `<script>` is
   the last element before `</body>` would have caught Defect 1 in under a second.
8. **Consider baselines** for the cockpit surface.

### Process finding
S3 and S4 were accepted against criteria reading *"click → agent acts → reflect"* — criteria that
could not have passed. Acceptance was signed off by reading code, not running it. **The most valuable
output of this validation is not the two bugs; it is the confirmation that behavioural acceptance
criteria must be discharged behaviourally.**
