---
date: 2026-09-29T22:52:52Z
researcher: Claude (Cowork, cloud — scheduled-watch session, no device bridge) + Gavin (device-side measurements 2026-09-29)
git_commit: "8482e884c761430dfce19ccbcfeb786c2003cd67"
branch: "main"
topic: "Griot re-baseline — mirror sync, plugin/skill CI, update path, dual-provider model roster, suite-context, Cinopsis gate-5"
tags: [handoff, prism, griot-agent-architect, griot-propagate, prism-model-onboard, arkestra, model-policy, griot-plugin-update, marketplace, namespace, cinopsis-closing-ceremony, rebaseline]
status: complete
completed: 2026-09-30T12:21:00-04:00
---

> **CLOSED 2026-09-30.** Stages 0-5 complete (prior session work), the inserted Code-Intel
> Three-Way exploration complete through Phase C (L1/L2 surfaced for Gavin's ruling, L4/L7
> shipped, L3/L5/L6 parked with a contract), Stage 6 complete: suite-context refreshed
> (disk-only, channel-6 still open), all repos committed and pushed, Cinopsis closing
> ceremony run for real (not dry-run) - v2.9.0 released, tagged, mirror synced and
> re-verified, GitHub release live at
> https://github.com/TheDigitalGriot/cinopsis/releases/tag/v2.9.0 - and gate 5 in
> wg:cinodex-branch:B11 flipped LANDED with real evidence. CC5 ingestion and the loc
> ruling remain explicitly out of scope, per this handoff's own locked decision.

# Handoff: Griot Suite re-baseline — kill the plugin/skill brittleness for good

> **Why this exists.** The plugin/skill update path has been brittle for weeks. Root cause is NOT
> Gavin's architecture — it is (a) a genuinely buggy Anthropic plugin/cache/validate layer, live all
> through the fast-iteration window and only now patched in **Claude Code 2.1.283–2.1.285** (Sept 25–29
> 2026); (b) the cosmetic cloud-catalog badge; and (c) two self-amplifiers we can close: standalone
> skills leaking into the account-sync namespace, and stale marketplace mirrors. This handoff syncs the
> mirrors first, re-baselines on the fixed substrate, de-collides the channels through the existing
> `griot-propagate` registry, onboards the current **Claude AND Codex** rosters through
> `prism-model-onboard`, refreshes suite-context, and clears the held **Cinopsis gate-5** another
> session is waiting on.
>
> **All figures marked `[measured 2026-09-29]` were captured device-side by Gavin — treat as ground
> truth.** SOTA model facts still get re-verified against primary sources (his standing rule).
>
> **Run on the LOCAL surface** (`digitalgriotpc`, Claude Code CLI, in the repos). Authored on the cloud
> Cowork scheduled-watch surface with no device bridge — git metadata and any `<confirm device-side>`
> are filled by Stage D.
>
> **Format.** `/prism:create_handoff` shell (so `/resume_handoff` works) + each stage an ICM contract
> (Inputs · Decisions · Process · Success · Heartbeat). Plan-nod interactive with Gavin in chat;
> research/implement/validate headless via `claude.exe -p` in-repo (never gated on the daemon).

---

## Task(s)

0. **Sync the marketplace mirrors + build the CHANNELS gate** — the mirrors are behind source, so a Task-1 reinstall today would rebuild records off stale content. Sync first (or install from monorepo source and gate the sync). — *planned* · **NEW, ahead of Task 1**
1. **Re-baseline the substrate** — upgrade Claude Code ≥2.1.285, clean-reinstall all Griot plugins so corrupted `installed_plugins.json` records rebuild on the fixed layer (from freshly-synced mirrors). — *planned*
2. **De-collide the channels via `griot-propagate`** — extend the existing 7-channel OWNER registry (not a parallel audit); fix channel-5 (git-parity) and resolve channel-6 truncation. — *planned*
3. **Dual-provider model roster** — drive `prism-model-onboard` to onboard current **Claude** (Opus 5.5, Sonnet 5.5) **and Codex** (gpt-6.1-sol + line sweep), resuming from the 2026-09-02 contract; run `fragment-sync` downstream; refresh stale model tables. — *planned*
4. **Fix the update path** — resurrect `/griot-plugin-update` on the fixed CLI; prove a version round-trip. — *planned*
5. **Validate everything** — `griot-agent-architect` + `claude plugin validate .` across all Griot plugins until clean. — *planned*
6. **Close out + clear Cinopsis gate-5** — commit, propagate, refresh suite-context; **run the held Cinopsis closing ceremony (gate 5 of the cinodex-branch chain, `wg:cinodex-branch:B11`)** another session waits on. — *planned* · **expanded**

---

## Critical References (read first, in order)

1. `~/.claude/skills/synced/<acct>/griot-suite-context/SKILL.md` — the **"Source of truth"** routing rule + **"Surface awareness"** section. Canonical map; DGS Definitive Plan artifact is the live master.
2. **`~/.claude/skills/griot-propagate/scripts/check.mjs`** — the **7-channel OWNER registry** — the one-channel-per-skill source of truth. Task 2 extends this, not a new audit.
3. `.../prism/skills/griot-agent-architect/SKILL.md` — plugin/skill/validation gold standard. **§ Development Workflow** (mandatory `claude plugin validate .`), **§ Model Configuration** (STALE — Task 3 fixes).
4. `~/.claude/skills/synced/<acct>/griot-plugin-update/SKILL.md` — three-clones model, `plugin@marketplace`, git-stderr, badge-vs-runtime. Task 4.
5. **`GriotApps\Prism\skills\prism-model-onboard\SKILL.md`** (device-side; *plugin* skill, absent from synced list) — **the model tool.** Triggers: "onboard <model>", "add <model> to Arkestra/the Governor", "wire up <provider>'s models", "add the new Codex/Gemini/local roster."
6. **`C:\Users\digit\GriotApps\Prism\.prism\shared\plans\2026-09-02-model-line-sept2026-CONTEXT.md`** (12,072 B) — prior model-line contract to **resume from, not redo.** Roster table "verified live against platform.claude.com — do not re-litigate"; `### Namespace split`; `### 🔴 Bug to fix`; cost-posture; `### Preserve, don't rewrite`. **Claude-line ONLY** — Codex is net-new. File:line targets: `claude-sdk.ts` L24-30 `MODEL_IDS` + L79 `maxTokens`, `claude-agent.ts` L2365-2372 id map, `claude/claude-models.ts`, + matching `.test.ts` pair.
7. The drift ledger (`griot-drift-log`) — entries **171** (channel-5 git-parity) and **172** (channel-6 truncation) carry fix directions.

---

## Recent Changes

None yet — forward plan. First device-side action is Stage D.

---

## Learnings (root causes + measured state)

- **`anthropic-skills:` is the account-sync channel, by design — not drift.** Standalone skills load in Cowork from an account-synced snapshot, namespaced `anthropic-skills`/`claude-ai` (same bucket as `xlsx`/`pdf`). Plugins load from `~/.claude/plugins/cache` under their own namespace. `griot-plugin-update` was never in the account-sync path — it is marketplace-plugins-only.
- **The update pain was mostly platform-side, freshly patched.** Claude Code 2.1.280–2.1.285 is a wall of plugin-lifecycle fixes (wrong-plugin uninstall on case-only id diff; `validate` passing broken + flagging valid; `installed_plugins.json` loss; cache-miss after config move; silent restore-to-newest; sparsePaths empty clone; bare `plugin update` exit-1). Re-baseline on ≥2.1.285.
- **2.1.282 namespace bite (Task 2 verify):** reserved `anthropic-skills`/`claude-ai` for genuinely claude.ai-synced skills; narrowed `Skill(...:*)` allow/deny to match only those. Double-published skills (account-sync AND plugin) now diverge — headless allow-rules can bind the wrong copy.
- **The model tool is `prism-model-onboard`; Arkestra ("the Governor") is the layer it feeds.** Plugin skill at `GriotApps\Prism\skills\prism-model-onboard`. Primary write: one RosterEntry in `packages/prism-core/src/core/api/model-roster.ts` ("usually the only file"); policy `model-policy.ts` + mobile mirror `apps/prism-mobile/.../agent/model-policy.ts`. **HARD RULE: non-Anthropic ids NEVER go in `claude-sdk.ts` `MODEL_IDS`** (Anthropic SDK's array) — Codex/Gemini live in the roster + provider axis. "Model Control Plane" was retired (collided with MCP).
- **Mirror gaps `[measured 2026-09-29]` — a reinstall today rebuilds off stale content:**
  - `prism-marketplace` **4.16.2 vs source 4.17.3 — 37 blobs behind** (16 missing, 21 differing); **`griot-harvest-ux-ui` entirely absent** from the mirror.
  - `cinopsis-marketplace` **2.2.0 vs source 2.8.0 — 44 blobs behind** (25 missing, 19 differing); mirror HEAD **18.5 days old**.
  - `digital-griot-mcp` **9 tools source vs 7 mirror**; `griot_viz_engine` + `griot_propagate_check` absent from a marketplace install; runtime alias `prism_viz_engine` declared in **neither** file on disk.
- **fragment-sync is the downstream leg.** Its Process L44 makes scaffolds "carry channels + Cowork awareness + the current model line." Onboard models without it → new scaffolds keep emitting the old line.
- **Two `dgs-sync-all.ps1` DGS_SYNC_INCOMPLETE stages are NOT regressions — do not chase:** the vocabulary gate's 14 "retired words" all live in one file, `.prism/shared/plans/surface-gate-RUN.log` line 55 (a transcript quoting old vocab inside JSON tool results); the artifact-currency gate's `ARTIFACTS_OUT_OF_SYNC=18` is 18 non-card files (10 `_pub-*` staging snapshots, 6 dated selectah-board renders). Logged as drift 171/172; both Gavin's call (his scripts).
- **Substring guard on the DGS plan false-positives:** the plan EMBEDS the workgraph in its `#wg-data` block, so any sentinel echoing a workgraph note matches. Key idempotence to an ITEMS row shape, not prose.

---

## Artifacts

- This handoff → `.prism/shared/handoffs/2026-09-29_22-52-52_griot-rebaseline-plugins-skills-models.md`.
- Stage outputs → `.prism/shared/plans/rebaseline/<stage>-CONTEXT.md`, research → `.prism/shared/research/2026-09-29_*`.

---

## Action Items & Next Steps — the stage-walk

### Stage D — Preconditions & discovery (device-side, headless-safe)

**Inputs**: `TheDigitalGriot/prism` repo; `~/.claude/` (settings.json, plugins/, skills/); `griot-propagate/scripts/check.mjs`.
**Decisions**: ground truth is device state; fill every `<confirm device-side>`; no destructive step until inventory captured.
**Process**
1. `claude --version` → record (Stage 1 upgrades if < 2.1.285).
2. Inventory → `.prism/shared/plans/rebaseline/00-inventory.json`: `claude plugin list`; `installed_plugins.json` (note invalid records); `ls ~/.claude/skills/` + the account-synced set.
3. **Read `prism-model-onboard`** (`cat prism/skills/prism-model-onboard/SKILL.md` or `/prism:prism-model-onboard`) — confirm invocation + write targets (`model-roster.ts` primary, `model-policy.ts` + mobile mirror, the `claude-sdk.ts MODEL_IDS` hard rule). Read the **2026-09-02 contract** (ref 6). Confirm the **mirror gaps** above still hold.
4. `git rev-parse HEAD` / `git branch --show-current` for the frontmatter.
**Success**: inventory written; CLI version known; `prism-model-onboard` scope + contract + mirror gaps confirmed.
**Heartbeat**: `HB-DISC-OK`

---

### Stage 0 — TASK 0: Sync the marketplace mirrors + build the CHANNELS gate (ahead of reinstall)

**Inputs**
- Working: `digital-griot-marketplace` (mirror) + each tool's source repo; `scripts/sync-to-marketplace.sh` (port target: Prism `scripts/`); `pre-release-audit.mjs`.
- Reference: the mirror-gap measurements in Learnings.
**Decisions (locked)**
- **Sync before any reinstall** — Task 1 reads the mirror, so it must carry source-latest first. Alternative allowed: install Task 1 from **monorepo source** and treat the mirror sync as its own gate.
- **CHANNELS gate is table-driven, fail-closed, one array entry per channel** — reads each published version from the **REMOTE**, never a new code path.
**Process**
1. Close each mirror to source: sync `prism-marketplace` (→ 4.17.3, include the **absent** `griot-harvest-ux-ui`), `cinopsis-marketplace` (→ 2.8.0), and `digital-griot-mcp` (→ 9 tools; land `griot_viz_engine` + `griot_propagate_check`, and reconcile the `prism_viz_engine` runtime alias that is declared in neither file on disk).
2. Port `scripts/sync-to-marketplace.sh` into Prism `scripts/`.
3. Extend `pre-release-audit.mjs` with the table-driven CHANNELS gate (one row per channel; compare local build version vs the remote published version; fail closed on any behind).
4. Re-measure: each mirror `== source`; the gate passes green.
**Success**: all three mirrors at source; `griot-harvest-ux-ui` present; MCP at 9 tools; CHANNELS gate live and fail-closed.
**Heartbeat**: `HB-S0-MIRRORS-OK`

---

### Stage 1 — TASK 1: Re-baseline the substrate

**Inputs**: `~/.claude/plugins/`, `settings.json`; the freshly-synced mirrors from Stage 0.
**Decisions (locked)**
- Upgrade CLI FIRST (`claude update` → ≥2.1.285).
- Reinstall fully-qualified (`plugin@marketplace`); never the bare form (silent exit-1).
- Do NOT hand-edit `installed_plugins.json` — let the fixed CLI rebuild it.
- **Stage 0 must be green first** — otherwise the reinstall re-baselines onto stale mirror code.
**Process**
1. `claude update` → re-verify ≥2.1.285.
2. `claude plugin marketplace update digital-griot-marketplace` (re-pull the now-fresh clone).
3. Per Griot plugin: `claude plugin update <plugin>@digital-griot-marketplace`; for corrupt records, uninstall + reinstall (options/secrets from inventory).
4. `claude plugin list` → diff vs inventory.
**Success**: every Griot plugin at intended version; clean `installed_plugins.json`; no cache-miss/invalid-record warnings.
**Heartbeat**: `HB-S1-REBASELINE-OK`

---

### Stage 2 — TASK 2: De-collide the channels via `griot-propagate`

**Inputs**
- Working: `~/.claude/skills/griot-propagate/scripts/check.mjs` (7-channel OWNER registry — **extend, don't parallel**); the account snapshot; `GriotMeta/digital-griot-skills` ↔ `~/.claude/skills`; drift entries 171/172.
- Reference: the routing rule (griot-suite-context) + the 2.1.282 namespace reservation.
**Decisions (locked)**
- The `griot-propagate` registry IS the one-channel-per-skill source of truth. **5 of 7 channels are drifted `[measured]`.**
- **Channel 5 → make it a git-parity channel (fix, don't run).** Its declared SOURCE (`GriotMeta/digital-griot-skills`) was **2 commits BEHIND** its TARGET (`~/.claude/skills` @ origin/main); the file-copy transport would have written **34 stale files** over live skills — caught only by the dry-run CONFLICT guard. Both are clones of ONE remote, so **`git pull` is the projection**, not file-copy. Even at one commit it reported 12 behind because it hashes raw working-tree bytes (at `1407a40`, both clean, `core.autocrlf=true`, live 44 CRLF pairs vs backup 0 → raw sha differs, normalized identical). Compare **HEAD + eol-normalized content**. Note: `synced/` was added to the skills-repo `.gitignore` 2026-09-29, so the sync cache no longer re-dirties the tree. (Drift 171.)
- **Channel 6 (account snapshot) is TRUNCATION, not skew — measure, don't theorise.** `griot-suite-context` reaches the account at **17,916 B / 172 lines vs 39,111 B / 310 lines on disk (46%)**. Proven not staleness: no git revision is 172 lines; all 8 revisions back to 2026-09-11 (`f17b4c8`, 34,866 B) contain "Djeli is a fork of Orca" which the account copy lacks — yet it DOES contain "prism-design-engine", so it is **cut mid-roster inside the thin-layer-mechanism paragraph**, 138 lines + the whole app-lineage section past the cut. **43 account skills sit under 90% of source** with no common byte ceiling (`griot-plugin-update` 47%, `griot-meridian-reflect` 50%, `griot-workgraph-update` 65%, `sankofa` 69%); **25 repo skills never reached the account.** Channel 6 is **DETECT-AND-REPORT-ONLY by declaration (D5)** — no transport, no owner. **First test: re-save ONE skill to the account and compare bytes** to find the cut cause. (Drift 172.)
**Process**
1. Run `node ~/.claude/skills/griot-propagate/scripts/check.mjs`; capture the 5 drifted channels → `02-propagate-state.md`.
2. Fix channel 5 to git-parity semantics (HEAD + eol-normalized compare); re-run dry-run → no CONFLICT.
3. Channel 6: re-save one skill to the account, diff bytes, record the truncation cause as a finding (do not theorise a fix before measuring).
4. Reconcile any true double-provenance (account-sync AND plugin) to one canonical channel per the routing rule; grep `settings.json`/ontology for `Skill(anthropic-skills:*)`/`Skill(claude-ai:*)` rules and confirm they bind the intended copy under 2.1.282 — re-scope any relied on by headless runs.
**Success**: registry extended; channel 5 is git-parity and conflict-free; channel-6 truncation cause measured and logged (drift 172); no double-provenance unresolved; allow/deny rules verified against a headless run.
**Heartbeat**: `HB-S2-DECOLLIDE-OK`

---

### Stage 3 — TASK 3: Dual-provider roster via prism-model-onboard → Arkestra → fragment-sync

**Inputs**
- Working: `prism-model-onboard` (`/prism:prism-model-onboard`). Writes: `packages/prism-core/src/core/api/model-roster.ts` (RosterEntry, primary); `model-policy.ts` + mobile mirror; `scripts/statusline-model.sh`.
- Resume-from: the 2026-09-02 contract (do NOT re-litigate its verified Claude roster) + its file:line targets: `claude-sdk.ts` L24-30 `MODEL_IDS` / L79 `maxTokens`, `claude-agent.ts` L2365-2372, `claude/claude-models.ts`, + `.test.ts` pair.
- Reference: changelog digest (Other Notes) for current IDs.
**Decisions (locked)**
- **Drive `prism-model-onboard`;** one RosterEntry per model is the usual whole change.
- **HARD RULE — provider hygiene.** Non-Anthropic ids never enter `claude-sdk.ts MODEL_IDS`. Codex ids → roster + provider axis; a denied model steps down *within its own provider*, never crossing (v4.16.0).
- **Resume, don't redo (Claude side):** contract roster is "verified live — do not re-litigate"; change only the deltas since (Opus 5.5 / Sonnet 5.5 as new defaults).
- **Codex is a genuine gap** (contract was Claude-line only) — net-new, verify live.
- **Re-verify BOTH providers against primary sources** — the contract roster is 27 days old (SOTA is a hypothesis).
- **Sweep for PINNED ids, not aliases.** Aliases float (no edit): Prism 14 agents = haiku×7 / opus×2 / sonnet×5; Cinopsis = sonnet / opus[1m] / haiku across digest-writer, video-comparator, video-fetcher, compare, digest, fetch, playlist. **Exactly one stale pin found `[measured]`: Cinopsis `scripts/app_settings.py` line 13 `"model": "claude-sonnet-4-6"` (used by `claude_key`).** Sweep for **ANY** older id, not just N-1 (bump-version.py can't catch a file 2+ versions stale — a VitePress copyright sat two behind through every check).
- **Effort-tier correction:** the old "Opus 4.7+" framing is wrong — **Sonnet now supports all five levels; Haiku 4.5 supports NONE.** Cinopsis runs haiku for video-fetcher/fetch/playlist — if any pass an effort or thinking param it is now invalid.
**Process**
1. Re-verify live: Claude deltas (Opus 5.5 default, 1M, $4/$20; Sonnet 5.5 default, 1M, $2/$10; effort + Opus one-shot xhigh|max) and the Codex line (`gpt-6.1-sol` Codex-CLI default; sweep `gpt-6`/astra, `gpt-5.6-sol/terra/luna`, `gpt-5.3-codex-spark`).
2. Onboard Claude deltas via `prism-model-onboard` (RosterEntry + policy + mobile mirror); leave frozen entries untouched.
3. Onboard Codex (net-new) via `prism-model-onboard`; ids OUT of `claude-sdk.ts MODEL_IDS`; verify provider axis fails closed within Codex.
4. **Fix the stale pin:** `app_settings.py:13` → current sonnet id. Audit haiku agents for now-invalid effort/thinking params.
5. Refresh stale tables: `griot-agent-architect` § Model Configuration + `references/model-config.md`; **suite-context model line — but see coupling below.**
6. Verify: statusline renders new premium models; flip a mode; `.test.ts` pair green.
7. **fragment-sync** (Process L44) so scaffolds carry the new line + channels + Cowork awareness.
> **Coupling with Task 2:** the suite-context refresh (step 5) only reaches a cloud session if **channel-6 truncation is resolved first (Stage 2)** — else the new table lands past the 46% cut. Order Stage 2 ahead of step 5, or accept "correct on disk only" and **say so** in the close-out.
**Success**: `model-roster.ts` current for both providers (provider-clean); frozen Claude entries preserved; provider axis fail-closed; stale pin fixed; haiku effort params valid; tables refreshed; `.test.ts` green; fragment-sync propagated.
**Heartbeat**: `HB-S3-ROSTER-DUAL-OK`

---

### Stage 4 — TASK 4: Fix the update path (resurrect /griot-plugin-update)

**Inputs**: `griot-plugin-update` SKILL.md; authoring clones (`GriotApps\<Tool>` / `GriotProducts\<Tool>`, `GriotMeta\digital-griot-marketplace`); `~/.claude/plugins/cache/`.
**Decisions (locked)**: `git pull --ff-only` before any commit; never `--force`; a DIVERGED clone is a human-gate STOP. Red git stderr ≠ error — judge by `HEAD == origin`.
**Process**
1. Run the skill end-to-end on Cinopsis (the proven example): Step 0 (ff-only reconcile) → Step 1 (`marketplace update` + `update <plugin>@<mkt>`) → Step 2 (refresh runtime) → Step 3 (verify).
2. Confirm on ≥2.1.285 the old failures are gone (no exit-1, no cache-miss, clean repoint).
3. Any residual failure → logs to `.prism/shared/research/2026-09-29_griot-plugin-update-<tool>.md`; Stuck-Protocol ladder before reporting blocked.
**Success**: a full round-trip (GitHub → cache → running code) proven, new code confirmed live via a tool call.
**Heartbeat**: `HB-S4-UPDATE-ROUNDTRIP-OK`

---

### Stage 5 — TASK 5: Validate all plugins/skills via griot-agent-architect

**Inputs**: every Griot plugin repo; `digital-griot-marketplace/.claude-plugin/marketplace.json`.
**Decisions**: `claude plugin validate .` MANDATORY per plugin; do not edit the `griot-agent-architect` skill itself.
**Process**
1. Per plugin: `claude plugin validate .` until clean.
2. Run the marketplace mirror-freshness gate (built in Stage 0) — confirm all channels green against the remote.
3. Spot-check Cowork-visible components (skills + MCP servers) via the Customize install flow for one plugin.
**Success**: every Griot plugin validates clean; CHANNELS gate green.
**Heartbeat**: `HB-S5-VALIDATE-CLEAN`

---

### INSERTED — Code-Intel Three-Way exploration (gortex / code-review-graph / codebase-memory-mcp)

Gavin added this mid-run 2026-09-30, to land BEFORE Stage 6 closes/publishes (its own drift-18
status change and branch-workgraph amendments need to exist before Stage 6's commit + propagate +
Cinopsis ceremony). Full spec, phases A/B/C, guardrails and the two decisions reserved for Gavin's
own ruling: `.prism/shared/handoffs/2026-09-30T00-23-48Z_code-intel-three-way-exploration.md`.
Run it here, between Stage 5 and Stage 6.

---

### Stage 6 — TASK 6: Close out + clear Cinopsis gate-5

**Inputs**
- Working: `digital-griot-skills/griot-suite-context/SKILL.md`; `propagate.ps1`; `/prism:commit`.
- Cinopsis: HEAD `bcb1474` v2.8.0; `cinopsis-closing-ceremony`, `cinopsis-bookend`, `cinopsis-release` on disk at `d4b68e9` (847 insertions / 0 deletions, validator passed) — **ceremony never executed (dry-run only)**; the single commit after `d4b68e9` is just the stage-contract docs commit.
- Chain context: seven-gate `wg:cinodex-branch:B11` (stated 2026-09-26, confirmed 2026-09-27). `[measured]` gates 1-4 LANDED (census fix `f28e75b`; gate-2 verifier; head pull with titles across three playlists; five repos ref-equal); gate 6 `/dgs-plan-update` LANDED 2026-09-29 (plan `e31b65d`, card Version 67, 1949 items). **Gate 5 HELD.**
**Decisions (locked)**
- suite-context = durable map; live status stays in the DGS plan artifact. Update only durable facts (model line, versions, resolved channel/namespace truth).
- Standalone-skill edits finish at repo commit + `~/.claude/skills` redeploy + account-resync — NOT `/griot-plugin-update`.
- **Fix the `app_settings.py:13` pin (Task 3) BEFORE running the Cinopsis ceremony** so the release ships the corrected line.
- The Cinopsis ceremony skills **don't exist on a marketplace install** — that's Task 0 again (they must be synced/present to run).
- **Do NOT pull the 21-video CC5 ingestion or the loc work into this session** — they stay in their own handoff. Running the ceremony only *clears the path* to them.
**Process**
1. Refresh suite-context (model line, Prism version, the resolved channel-discipline + 2.1.282 note). **If Stage 2 channel-6 is unresolved, state that the refresh is disk-only.**
2. `/prism:commit` each repo (no Claude attribution); ff-only first; redeploy skills; `propagate.ps1` if the ontology copy changed.
3. **Run the Cinopsis closing ceremony (gate 5)** — real execution, not dry-run — after the pin fix. Verify `cinopsis-bookend` → `cinopsis-release` complete and gate 5 flips to LANDED in `wg:cinodex-branch:B11`.
4. Mark this handoff `status: complete`; emit the `/resume_handoff` line.
**Success**: suite-context current (or disk-only + said so); all repos committed; skills redeployed; **Cinopsis gate 5 LANDED**; CC5/loc explicitly left for their handoff.
**Heartbeat**: `HB-S6-CLOSEOUT-OK`

---

## Other Notes

### The model tool: `prism-model-onboard` (a Prism *plugin* skill — researched by Gavin)
At `GriotApps\Prism\skills\prism-model-onboard` — a *plugin* skill (ships via the marketplace), which is why it never showed in the standalone/synced list or the cloud snapshot. Trigger line names this task verbatim ("onboard <model>", "add <model> to Arkestra/the Governor", "wire up <provider>'s models", "add the new Codex/Gemini/local roster"). Writes: RosterEntry in `model-roster.ts` (usually the only file) + `model-policy.ts` + mobile mirror. Hard rule: non-Anthropic ids never in `claude-sdk.ts MODEL_IDS`. **Arkestra** ("the Governor") is the layer it feeds; **"The Griot Model"** (Kente-owned open-weight strategy, `griot-model-landscape` artifact) is a separate stream, not this tool.

### Changelog digest this handoff is built on (last ~8 days)
- **Codex** (Sept 29): `gpt-6.1-sol` — near-Astra, cheaper; **now the Codex CLI default** (0.159.1). 0.159.0 removed the bundled `plugin-creator` skill.
- **Claude** (Sept 22): `claude-opus-5-5` default Opus, 1M, $4/$20. (Sept 28): `claude-sonnet-5-5` default Sonnet, 1M, $2/$10.
- **Claude Code 2.1.280–2.1.285**: the plugin/cache/validate fix wall — **upgrade to ≥2.1.285 is Stage 1.**
- **2.1.282**: reserved `anthropic-skills`/`claude-ai` namespaces + narrowed matching allow/deny rules (Stage 2 verify).
- **Sept 25**: new Claude plugin developer portal / directory submission.
- Codex "import from another agent" sync: **no changes this week.**

### Run notes (from device-side session)
- **Cinopsis slash-command path** needs `pip install -r ${CLAUDE_PLUGIN_ROOT}/requirements.txt` first (the Cowork/MCP path auto-installs its own venv — no action there).
- **`dgs-sync-all.ps1`** ends `DGS_SYNC_INCOMPLETE` on two NON-regressions — don't chase (vocabulary gate = one transcript file `surface-gate-RUN.log:55`; artifact-currency `=18` = 10 `_pub-*` snapshots + 6 selectah-board renders). Drift 171/172, Gavin's call.
- **DGS plan idempotence** must key to an ITEMS row shape, not prose — the plan embeds the workgraph in `#wg-data`, so a prose sentinel false-positives.

### Environment note
Authored on the cloud Cowork scheduled-watch surface — no `mcp__remote-devices__*`, no Chrome, no built-in browser (probed live, genuinely absent). Everything executes on the LOCAL surface. To let a future scheduled run touch the box, flip **"Require this computer"** on the watch task.

---

Handoff created! Resume in a new session on `digitalgriotpc` with:

```
/resume_handoff .prism/shared/handoffs/2026-09-29_22-52-52_griot-rebaseline-plugins-skills-models.md
```
