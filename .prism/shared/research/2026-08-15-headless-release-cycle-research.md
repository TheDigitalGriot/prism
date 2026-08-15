---
date: 2026-08-15
topic: Headless-aware release-cycle skills — gate inventory + answer-injection design
status: research (design only — no implementation)
skills: prism-closing-ceremony, prism-bookend, prism-docs-update, prism-release
related:
  - skills/cl-plugin-structure/references/channel-patterns.md (passive-bus thesis)
  - scripts/digital-griot-mcp/digital-griot-mcp.ts (headless precedent)
---

# Headless-aware release-cycle skills

**One job:** map every interactive gate in the release-cycle skills and DESIGN (not
implement) a non-interactive answer-injection mechanism so the closing ceremony can run
headless from Cowork — while interactive TTY use stays the default and unchanged.

## TL;DR

- The closing ceremony is a **prose orchestrator** that runs a Step 0 review/audit gate,
  then invokes `prism-bookend` → `prism-docs-update` → `prism-release` in order,
  fail-fast. It owns almost no gates itself; it defers every push / release / native-build
  pause to the sub-skills and forbids itself from bypassing them.
- There is exactly **one literal `AskUserQuestion`** in the whole cycle
  (`prism-release` Step 1, semver bump type). Every other gate is **prose** — an approval
  pause a human reads and answers. Under headless `claude -p` the `AskUserQuestion` *hangs*
  (no TTY); the prose gates *don't* hang the runtime but a diligent agent will still stall
  waiting for a "go" that never comes.
- **`prism-commit` does not exist.** The ceremony never calls it. Commit/tag/push are
  inline in `prism-release` Step 4–5, with a fixed message `v{VERSION}` and **no**
  message-approval gate.
- **The fix already has a precedent and a written mandate in this repo.**
  `channel-patterns.md:76-78` explicitly says *"this is exactly why the release-cycle
  skills hung headless"* and prescribes: skip `AskUserQuestion`, read the ruling from a
  file, *fall through to provided defaults*. `prism-brainstorm`/`prism-gavel` already run
  headless on that pattern (`capabilities: { tools: {} }` + a file bus).
- **Recommendation:** a single **`.prism/local/release-answers.json`** snapshot file,
  discovered by precedence (explicit arg → `PRISM_RELEASE_ANSWERS` env → default path),
  activated by `PRISM_NONINTERACTIVE=1`. Each gate resolves `answers[key] ?? safeDefault`;
  destructive gates **fail closed** (halt, don't guess); a `dryRun` key + `--dry-run`
  stops before any push/tag/GitHub-release. Additive: absent env/file ⇒ today's
  interactive behavior, byte-for-byte.

---

## 1. Gate inventory

Legend — **Type:** `ASK` = literal `AskUserQuestion` (hangs headless) · `PROSE` = prose
approval pause · `EXIT` = deterministic script exit-code gate (already headless-safe).
**Destr:** ⚠ = destructive / hard-to-reverse.

| # | Skill | Gate (what it asks) | Type | Valid answers | Safe headless default | Destr | Source |
|---|-------|---------------------|------|---------------|-----------------------|-------|--------|
| G0-A | closing-ceremony | Step 0 High-finding halt — "Do not proceed to Bookend with an unresolved High" | PROSE | fix-and-rerun / explicit logged override | **halt** (fail-closed) | | `SKILL.md:25`; `references/review-audit-gate.md:46-49` |
| G0-B | closing-ceremony | Human override of a High finding (must be explicit + logged) | PROSE | override(logged) / none | **no override** | | `SKILL.md:25`; `review-audit-gate.md:48-49` |
| G0-C | closing-ceremony | Pre-flight: working tree committed / intentionally staged? | PROSE | proceed / stop | proceed **only if** `git status` clean-or-intended | | `SKILL.md:28` |
| G0-D | closing-ceremony | Push post-condition — un-pushed release = INCOMPLETE (verify HEAD==origin/HEAD) | EXIT (verify) | done / INCOMPLETE | report INCOMPLETE unless verified | | `SKILL.md:31` |
| G0-E | closing-ceremony | Deferral: "get the user's go where [prism-release] asks; adds no bypass" | PROSE | (owned by prism-release) | inherit sub-skill default | ⚠ | `SKILL.md:27` |
| B1 | bookend | Version bump override — `Type "3.2.0" to override, or "confirm" to proceed with 3.1.0` | PROSE | `confirm` / semver `X.Y.Z` | suggested bump (or **require explicit** — see §4) | | `SKILL.md:68,71-74,158` |
| B2 | bookend | Docs-site sync plan approval — "Present the plan to user before proceeding" | PROSE | approve / adjust | proceed | | `SKILL.md:99-108` |
| B3 | bookend | VitePress config-change approval (new pages / sidebar) | PROSE | approve / reject | **skip config edits** (leave un-bumped) or injected `true` | | `SKILL.md:160` |
| B4 | bookend | Umbrella rule — "Stop at gates: get approval before each major phase" | PROSE | approve / hold | per-phase resolved answer | | `SKILL.md:136,141` |
| D-A | docs-update | Source-file selection (which `PRISM-DOCUMENTATION-*.md`) | PROSE (auto-def) | path / (auto) | **already auto**: newest via `ls -t … \| head -1` | | `SKILL.md:37-43` |
| D-B | docs-update | Change-summary approval — literal `Proceed with updates?` then "Wait for user approval" | PROSE | proceed / revise | proceed | | `SKILL.md:67-90,183` |
| D-C | docs-update | VitePress `config.ts` edit — "NEVER modify without explicit user approval" | PROSE | approve / withhold | **skip config.ts** unless injected `true` | | `SKILL.md:113,141-152,184` |
| R1 | release | **Bump type** — literal AskUserQuestion (patch/minor/major) | **ASK** | `patch` / `minor` / `major` | `patch` (marked Recommended) — but see §4 | | `SKILL.md:15-27` |
| R2 | release | Clean-tree / staged-file review — "Review EVERY entry before proceeding" (MANDATORY) | PROSE | land-it / keep-out (per entry) | proceed **only if** `git status --porcelain` empty; else halt | | `SKILL.md:44-58` |
| R3 | release | Branch-integration guard — `verify-branch-integrated.mjs`, "Must exit 0" | EXIT | pass / fail | auto-pass on exit 0; else halt | | `SKILL.md:60-76` |
| R4 | release | Plugin-manifest/porter validation — `claude plugin validate .` + `test_porter_check.sh` | EXIT | pass / fail | auto-pass on exit 0; else halt | | `SKILL.md:29-42` |
| R5 | release | Tag collision — "ask the user if they want to delete and recreate" | PROSE | delete+recreate / no | **abort** (never auto-delete) | ⚠ | `SKILL.md:319` |
| R6 | release | `git commit -m "v{VERSION}"` + `git tag v{VERSION}` (**no** message-approval gate) | (none) | — | proceeds unattended after R1/R2 | ⚠ | `SKILL.md:120-136` |
| R7 | release | `git push && git push origin v{VERSION}` (no inline prompt; ceremony policy "Always push") | (policy) | — | **fail-closed to false** unless `push:true` injected | ⚠ | `SKILL.md:157-161,318`; ceremony `SKILL.md:31` |
| R8 | release | `gh release create v{VERSION} …` (public GitHub release) | (none) | — | **fail-closed to false** unless `githubRelease:true` | ⚠ | `SKILL.md:165-197` |
| R9 | release | Native builds (VSIX / Electron / Tauri / NSIS / Cowork zip) — unconditional runs, **not** confirm gates | (none) | — | run if `nativeBuilds:true`; produce local artifacts only | | `SKILL.md:96-118,138-155`; `references/build-commands.md` |
| R10 | release | Step 6.5 `sync-prism-plugin.sh` — force-push to `prism-plugin` mirror | (none) | — | **fail-closed to false** unless injected | ⚠ | `SKILL.md:209` |
| R11 | release | Step 8 `git commit --amend` + `git tag -f` (rewrites release commit, force-moves tag) | (none) | — | run only in the same push-gated envelope | ⚠ | `SKILL.md:295-296` |

**Headless-hang reality:** only **R1** truly *hangs the runtime* (it's the sole
`AskUserQuestion`). The PROSE gates (B1–B4, D-B, D-C, R2, R5, G0-*) don't hang the process
but *do* stall a diligent agent that's been told to "get the user's go." Both classes must
be resolved by injection for an unattended run. The **EXIT** gates (R3, R4) and the
already-auto default (D-A) need nothing.

**Absent by design (do not build a gate for these):** no VitePress build/deploy/publish
step exists anywhere in docs-update (it only edits markdown + config and counts headings);
no commit-message-approval gate exists (message is fixed `v{VERSION}`); no separate
docs-version prompt (version is *derived* from the source filename + `cat VERSION`).

---

## 2. Orchestration map

`prism-closing-ceremony` is pure markdown prompt-orchestration — no scripts of its own,
one `references/review-audit-gate.md`. It drives deterministic scripts in the repo-root
`scripts/` dir but contains zero `AskUserQuestion`.

```
prism-closing-ceremony  (SKILL.md:10-21, "run in order — do not skip or reorder")
│
├─ Step 0  Review & Audit gate                                  [OWNS the gate]
│    ├─ two-stage review: spec-reviewer → quality-reviewer  (diff since last tag + plan)
│    └─ deterministic audit:  node scripts/pre-release-audit.mjs
│         └─ auto-discovers scripts/verify-*.mjs, runs each with --all
│         └─ process.exit(failed === 0 ? 0 : 1)          (pre-release-audit.mjs:67)
│    ── FAIL-FAST: an unresolved High HALTS the ceremony  (SKILL.md:25; gate.md:47) ──
│
├─ Step 1  invoke  prism-bookend        →  "THE VERSION IS DECIDED HERE"  (SKILL.md:17)
│                                           writes PRISM-DOCUMENTATION-[version].md snapshot
├─ Step 2  invoke  prism-docs-update    →  consumes that snapshot (bookend leads)  (SKILL.md:18)
│                                           "Must complete clean before the release."
└─ Step 3  invoke  prism-release        →  bump files, build, commit, tag, push, GH release  (SKILL.md:19)
```

- **Fail-fast:** asserted in three places (frontmatter `SKILL.md:3`; rule `SKILL.md:25`;
  `review-audit-gate.md:47`). Deterministically enforced **only at Step 0** via
  `pre-release-audit.mjs` exit codes. Steps 1–3 "each finish clean before the next."
- **State handoff is not a data structure.** Two artifacts carry state:
  (1) the **version number**, decided **once** in bookend and carried forward — the rule
  `SKILL.md:26` warns *"Decide the version once… do not re-derive per phase (re-running a
  bump would double-increment)"*; (2) the **`PRISM-DOCUMENTATION-[version].md`** snapshot
  file that docs-update reads. No JSON/env handoff exists between the sub-skills today.
- **Gate ownership.** The orchestrator owns only Step 0 (G0-A…E). Every push / GitHub
  release / native-build pause is **explicitly deferred** to `prism-release` and must be
  surfaced "exactly as that skill defines them… This orchestrator adds no bypass"
  (`SKILL.md:27`). Bookend also *chains docs-update + release internally* (`SKILL.md:21`),
  so invoking bookend can itself walk the rest of the cycle.
- **Push policy.** Ceremony treats an un-pushed release as INCOMPLETE (`SKILL.md:31`,
  "Always push — a release means the work is wanted upstream"), verifying
  `HEAD == origin/HEAD`. This is the one place the orchestrator is *more* aggressive than a
  safe headless default should be — see §4.
- **Existing non-interactive machinery** lives entirely in the driven scripts: the audit
  and every `verify-*.mjs` run with `--all` and gate on exit codes; `bump-version.py`
  (`major|minor|patch`, `--set X.Y.Z`, `--root`, `--strict`) and `build-sideload.py`
  (`--ref`, `--output`) are fully argparse-driven with **no** `input()`/stdin. **No skill**
  in the cycle defines an env var, a `--flag`, a `PRISM_NONINTERACTIVE` branch, a
  `--dry-run`, or a `--yes/--force` auto-approve today.

---

## 3. Injection mechanism — options + recommendation

### Design constraints (from the precedents)

The two headless precedents establish the contract a release-answers mechanism should copy:

1. **File is the load-bearing channel, not a push.** `digital-griot-mcp` declares only
   `capabilities: { tools: {} }`; wake notifications are best-effort and wrapped in
   try/catch that flips `passiveMode = true` if unsupported. The durable decision always
   lands in `$STATE_DIR/events` regardless. That's *why* it survives `claude -p`.
2. **Read-with-default is already the written contract.** `channel-patterns.md:78`:
   *"read the ruling from `$STATE_DIR/events` (or fall through to provided defaults) —
   never block on an interactive prompt."*
3. **Format precedent:** append-streams are JSONL (`server.cjs:295`); one-shot state
   snapshots are plain JSON objects (`decisions.json`, `gavel-cards.json`). A one-shot
   answers file matches the **JSON-object snapshot** shape.
4. **Path-resolution precedent:** `resolveStateDir()` uses precedence
   *explicit arg → env var → newest-session dir → fallback* (`digital-griot-mcp.ts:384-404`).
5. **Named durable target already exists:** `channel-patterns.md:78` calls for a Griot MCP
   verb `run_device_skill(skill, args, answers)` that "owns the invocation, injects the
   answers, and polls." An answers file is the concrete near-term form of that `answers`
   payload.

### Option A — Answers file `.prism/local/release-answers.json`  ★ RECOMMENDED

A single JSON-object snapshot the skills read before each gate.

- **Activation:** `PRISM_NONINTERACTIVE=1` (explicit opt-in). Without it, skills behave
  exactly as today — the file, if present, is ignored, so a stray file can never silently
  change an interactive run.
- **Discovery precedence** (mirrors `resolveStateDir`): explicit `--answers <path>` arg →
  `PRISM_RELEASE_ANSWERS` env → default `.prism/local/release-answers.json`.
- **Location rationale:** `.prism/local/` is gitignored and is where per-run/per-session
  artifacts already live (the gavel/brainstorm session dirs sit under
  `.prism/local/gavel/…`). Keeps a machine-specific, possibly-secret-adjacent answers blob
  out of the release commit. (The contract sketched `.prism/release-answers.json`; the
  `local/` sub-path is the only change, for gitignore safety — call out in the plan.)
- **Read contract per gate:** `answer = answers[key]`; if defined, use it; else use the
  gate's **safe default** (§1 column); for destructive gates with no safe default, **halt**
  and record why (fail-closed) rather than prompt.
- **Proposed schema (v1):**
  ```json
  {
    "schemaVersion": 1,
    "dryRun": true,
    "version": "4.9.1",           // explicit target — resolves R1 + B1 without a bump guess
    "bump": null,                  // OR "patch|minor|major" if you must derive (discouraged, see §4)
    "confirmVersion": true,        // B1
    "review": { "overrideHigh": false },   // G0-A/B — default no override
    "cleanTree": "porcelain-empty-only",   // R2 — proceed only if working tree clean
    "docs": { "proceed": true, "editConfig": false },  // D-B, D-C / B2, B3
    "push": false,                 // R7 — fail-closed
    "githubRelease": false,        // R8 — fail-closed
    "syncMirror": false,           // R10 — fail-closed
    "nativeBuilds": true,          // R9 — local artifacts only, safe
    "tagCollision": "abort"        // R5 — never auto delete+recreate
  }
  ```
- **Pros:** one file resolves all gates across all four skills; matches the JSON-snapshot
  precedent; auditable (you can diff/log the exact answers a run used); trivially supports
  `dryRun`; interactive path untouched. Directly becomes the `answers` arg of the future
  `run_device_skill` verb.
- **Cons:** each skill needs a small "read-answer-or-default" preamble added at each gate
  (prose + a resolver snippet). One new gitignore entry.

### Option B — Env vars only (`PRISM_NONINTERACTIVE` + per-answer vars)

e.g. `PRISM_RELEASE_BUMP=patch PRISM_RELEASE_PUSH=0 …`.

- **Pros:** zero new files; trivially set by a launcher `.ps1`; already how the launcher in
  `channel-patterns.md:58-61` passes context.
- **Cons:** a dozen+ gates ⇒ a dozen+ env vars, unauditable and error-prone; no natural
  place for structured answers (the review-override object, tag-collision policy); no
  single artifact to log. Env is fine as the **activation switch** but poor as the
  **answer payload**. → use env for the *flag*, file for the *answers* (that's Option A).

### Option C — Existing passive file-bus (`$STATE_DIR/events`, JSONL)

Reuse the gavel/brainstorm bus verbatim: emit each gate as a bus card to `$SCREEN_DIR`,
read the ruling from `$STATE_DIR/events`.

- **Pros:** literally the mechanism the repo already ships and blesses; a human *or* an
  injector can answer through the same channel; supports a live cockpit later.
- **Cons:** heavyweight for a one-shot batch of ~10 answers known up front — it's built for
  *interactive, arriving-over-time* events (append JSONL, newest-wins scan), needs the
  popout HTTP/WS server running, and a session-dir allocation. For "supply all answers up
  front and skip prompts," a static snapshot (Option A) is the right subset. **Best treated
  as the eventual live-surface layer *on top of* Option A**, not the near-term injector.

### Option D — `--answers <path>` flag only (no env switch)

- **Pros:** explicit, self-documenting at the call site.
- **Cons:** skills are markdown prompt files, not argv-parsed binaries — a "flag" here is
  just a convention the prose must honor, so it collapses into Option A's discovery
  precedence anyway. Keep `--answers` as the *highest-precedence* discovery input **within**
  Option A, not as a standalone mechanism.

### Recommendation

**Option A**, with the env var as the activation switch and `--answers`/`PRISM_RELEASE_ANSWERS`
as higher-precedence discovery inputs:

- Activate headless mode with `PRISM_NONINTERACTIVE=1` (fail-closed and explicit — the TTY
  path is never touched without it).
- Resolve the answers file by precedence: `--answers` → `PRISM_RELEASE_ANSWERS` →
  `.prism/local/release-answers.json`.
- Every gate does `answers[key] ?? safeDefault`, destructive gates fail-closed, and a
  `dryRun` key short-circuits before push/tag/GH-release.
- This is the concrete, shippable form of the already-mandated
  `run_device_skill(skill, args, answers)` target (`channel-patterns.md:78`); Option C's
  live bus can layer on later without changing the file schema.

---

## 4. Blast radius + safety

**What breaks if done wrong:**

- **Accidental push / GitHub release / mirror force-push (R7, R8, R10).** The single most
  dangerous failure. The ceremony's own policy is *"Always push"* (`SKILL.md:31`) — if a
  headless injector inherits that as the *default*, an unattended run publishes a commit,
  a public tag, and a public GitHub release with no human in the loop. Mitigation:
  **fail-closed** — `push`, `githubRelease`, `syncMirror` all default to `false`; they fire
  only when the answers file explicitly sets `true`. This deliberately *inverts* the
  interactive "always push" policy for headless, because "unwanted push" is far costlier
  than "release built but not pushed."
- **Wrong version bump (R1 / B1).** `patch` is the interactive Recommended default, but a
  wrong auto-bump double-increments or ships a major as a patch. Mitigation: in headless,
  **require an explicit `version` string** (resolve via `bump-version.py --set X.Y.Z`);
  treat `bump: "patch"` as a discouraged fallback that must be opted into. Also honor the
  documented idempotency trap (`SKILL.md:84-88`): never hand-edit `VERSION` first, or the
  bump reports success while changing 0 files.
- **Tag collision auto-recreate (R5).** Auto-deleting and recreating a tag on collision can
  clobber a real prior release. Mitigation: default `tagCollision: "abort"`; never
  delete+recreate without an explicit injected answer.
- **Review High-finding silent bypass (G0-A/B).** Auto-overriding a High finding ships an
  unreviewed base. Mitigation: `review.overrideHigh` defaults `false`; an unresolved High
  **halts** the run. Any override must be explicit *and* logged into the bookend snapshot
  (matches the existing rule `review-audit-gate.md:48-49`).
- **Racing working tree (R2).** Proceeding past a dirty tree packages another session's
  half-work into the release. Mitigation: `cleanTree: "porcelain-empty-only"` — halt unless
  `git status --porcelain` is empty; do not attempt to "reconcile" unexplained files
  unattended.
- **Step 8 amend + `tag -f` after a push (R11).** If push already happened, the amend moves
  the tag and diverges from the remote. Mitigation: run R11 only inside the same
  push-gated envelope; if `push:false`, the amend/tag-force stays local and reversible.

**Keeping it additive and safe:**

1. **Explicit opt-in.** No `PRISM_NONINTERACTIVE` ⇒ zero behavioral change; the answers
   file is ignored. Interactive runs are byte-for-byte what they are today.
2. **Dry-run first-class.** `dryRun: true` (and/or a `--dry-run` convention) runs the whole
   pipeline up to — but not including — any destructive step (commit/tag/push/GH-release),
   printing exactly what it *would* do. Recommend this be the **default** value in any
   generated answers template, so the first headless run of a new cycle is always a rehearsal.
3. **Fail-closed defaults for every ⚠ gate.** Missing key on a destructive gate = halt or
   skip, never "assume yes."
4. **Reuse the deterministic guards, don't weaken them.** R3 (`verify-branch-integrated.mjs`)
   and R4 (`claude plugin validate` + porter) already exit-gate headless-clean — the
   injection layer must *not* add a bypass for them; on non-zero exit the run halts.
5. **Auditability.** Log the resolved answers (with a redaction pass) into the release
   notes / bookend snapshot so a headless run is reconstructable — mirrors the existing
   "override must be logged" rule.
6. **Gitignored answers file.** `.prism/local/…` keeps the answers blob out of the release
   commit.

---

## 5. Open questions (for the plan phase)

1. **File location:** contract sketched `.prism/release-answers.json`; this doc recommends
   `.prism/local/release-answers.json` for gitignore safety. Confirm the `local/` path (and
   add the gitignore entry) — or accept root `.prism/` and add an explicit ignore rule.
2. **Who authors the answers file?** A `run_device_skill(skill, args, answers)` MCP verb
   (the named durable target) writing it before launch, vs. the Cowork orchestrator writing
   it via the device bridge (TEMP → Copy-Item past Controlled Folder Access), vs. a small
   generator skill. Affects whether the file is validated against `schemaVersion`.
3. **Version source of truth:** require explicit `version` (safest) vs. allow
   `bump: patch|minor|major` derived by `bump-version.py`. Recommendation leans explicit;
   confirm.
4. **Push default in headless:** this doc recommends fail-closed `push:false`, which
   *contradicts* the ceremony's interactive "Always push" policy (`SKILL.md:31`). Confirm
   the inversion is intended for unattended runs (I believe it must be).
5. **Where the read-and-default preamble lives:** inline prose added to each SKILL.md gate,
   vs. a shared `references/answers-resolution.md` all four skills point to, vs. a tiny
   `scripts/resolve-answer.mjs` helper the skills call. A shared helper keeps the four
   skills DRY and testable.
6. **Bookend's internal chaining:** bookend "chains docs-update + release internally"
   (`ceremony SKILL.md:21`). Confirm the answers file is read once and shared across the
   chained sub-skills (single resolve at ceremony entry) rather than re-resolved per skill,
   to avoid drift.
7. **Interaction with the `--all` verify scripts:** none expected (they're already
   headless), but confirm no verify script itself prompts under some edge path.

---

## Source index (file:line)

- Orchestration / Step 0 gate: `skills/prism-closing-ceremony/SKILL.md:3,10-21,25-32`;
  `skills/prism-closing-ceremony/references/review-audit-gate.md:29-34,45-49`
- Audit machinery: `scripts/pre-release-audit.mjs:24-25,39-47,67`;
  `scripts/verify-branch-integrated.mjs:14,29-37,101`; `scripts/verify-ceremony-gate.mjs:33`
- Bookend gates: `skills/prism-bookend/SKILL.md:68,71-74,82,93,99-108,110-116,136,141,158,160`
- Docs-update gates: `skills/prism-docs-update/SKILL.md:37-43,67-90,113,141-152,183-184`
- Release gates: `skills/prism-release/SKILL.md:15-27,29-42,44-58,60-76,78-94,120-136,157-161,165-197,209,295-296,318-319`;
  `skills/prism-release/references/build-commands.md:13-79`; `scripts/bump-version.py:148-154,273`;
  `skills/prism-sideload/scripts/build-sideload.py:36-37`
- Headless precedent (file-bus): `scripts/digital-griot-mcp/digital-griot-mcp.ts:62-76,384-404,691-713,820-842,958-964,1019-1034`;
  `skills/prism-gavel/scripts/server.cjs:95-96,282-297`; `skills/prism-gavel/scripts/start-server.sh:78-86`;
  `skills/prism-gavel/scripts/helper.js:94-113`; `skills/prism-gavel/SKILL.md:64-91`
- Passive-bus thesis + the explicit "release-cycle skills hung headless" statement:
  `skills/cl-plugin-structure/references/channel-patterns.md:30-78`
