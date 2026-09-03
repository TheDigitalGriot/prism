# model-line-sept2026 — Prism Stage Contract — update Prism to the Sept 2026 Claude line

## Role
Runs in `c:\Users\digit\GriotApps\Prism`, branch `main`. ONE stage: **implement**. Update Prism's model
configuration — the source of truth, not just docs — to the Sept 2026 Claude model line, and
sweep every live surface that pins a model id. Do not widen scope beyond the file list below.

## Inputs

**Working (this run — edited/produced):**

*Docs — plugin skills*
- `skills/cl-plugin-structure/references/model-config.md` (§1–§9, full refresh)
- `skills/cl-plugin-structure/SKILL.md` (Model Configuration section + agent-frontmatter comment)
- `skills/cl-plugin-structure/references/statusline-model.md`
- `skills/prism-spectrum/references/model-selection.md` (ceiling + cost-ratio re-baseline)
- `skills/fragment-sync/references/conformance-checklist.md`
- `skills/icm-architect/references/prism-run-contract.md`, `skills/icm-architect/assets/templates/prism-stage-CONTEXT.md`
- `skills/prism-gavel/scripts/frame.html`
- `skills/{prism-validate,prism-subagent,prism-spectrum}/SKILL.md`

*Runtime code*
- `packages/prism-core/src/core/api/model-policy.ts` (L115 `DOWNGRADE_CHAIN`, L118 `FLOOR_MODEL`, L136-147 `defaultPolicy`, L110-114 + L54/L62 doc comments)
- `apps/prism-vscode/src/core/api/claude-sdk.ts` (L24-30 `MODEL_IDS`, L79 `maxTokens`)
- `apps/prism-vscode/src/core/api/fable-gate.ts` (L30/L36/L47 labels + messages)
- `apps/prism-vscode/src/providers/model-status.ts` (L27 `PREMIUM`, L101 statusline text)
- `apps/prism-vscode/src/extension.ts` (L167 quick-pick label)
- `apps/prism-mobile/packages/server/src/server/agent/model-policy.ts` (L60-61 chain/floor, L71 defaults, L230-231 id mapping)
- `apps/prism-mobile/packages/server/src/server/agent/providers/claude-agent.ts` (L2365-2372 id map)
- `apps/prism-mobile/packages/server/src/server/agent/providers/claude/claude-models.ts`

*Shell + config*
- `scripts/fable-gate.sh` (L13 comment, **L56-57 BUG**, L65-68 fail-safe regex, L111/L113 defaults, L141 CHAIN)
- `scripts/statusline-model.sh` (L7-8 comment, L41-42 regex, L58-59 defaults)
- `model-policy.example.json`
- `hooks/hooks.json` (verify only; edit only if it names a model id)

*Tests*
- `apps/prism-vscode/src/core/api/__tests__/{model-policy,fable-gate}.test.ts`
- `apps/prism-mobile/packages/server/src/server/agent/providers/{claude-agent,claude/claude-models}.test.ts`
- `apps/prism-mobile/packages/cli/tests/15-provider.test.ts`

*Mirror + docs site*
- `apps/prism-setup/resources/plugin/**` — tracked, byte-identical mirror; sync every file above that exists there
- `prism-docs/docs/plugin/scripts.md`, `README.md`

**Reference (every run — read via code-intel, do NOT inline):**
- Live model facts already verified this session (see Locked Decisions §Roster) — do not re-fetch
- `skills/cl-plugin-structure/SKILL.md` § Model Configuration for house wording/philosophy to PRESERVE

**Do NOT load or edit — time capsules** (per `model-config.md` §9, "Historical pins … are time
capsules — leave them alone"):
`.prism/shared/evals/**`, `.prism/shared/docs/PRISM-DOCUMENTATION-*.md`,
`.prism/shared/{research,plans,handoffs,brainstorms}/**` (except THIS contract).

**AMENDED 2026-09-02 (Gavin, mid-run) — supersedes the original "no release" scope.** After the
implement stage validates green, run `/prism:prism-closing-ceremony` end-to-end: Review & Audit
gate → `prism-bookend` (version bump + CHANGELOG) → `prism-docs-update` → `prism-release`
(CLI binaries, VSIX, Electron, Tauri, NSIS, Cowork sideload zip, tag, push, GitHub release).
`VERSION` and `CHANGELOG.md` therefore DO change — but only in the ceremony phase, never during
steps 1–10. Order is load-bearing: the changelog must describe work that already passed its gates.

---

## Locked Decisions

### Roster — verified live 2026-09-02 against platform.claude.com (do not re-litigate)

| Tier | API id | Alias | $/MTok in-out | Context | Max out | Effort |
|---|---|---|---|---|---|---|
| Fable 5.1 | `claude-fable-5-1` | *none* — pin the id | $10 / $50 | 1M | 128K | all 5, default `high` |
| Opus 5 | `claude-opus-5` | `opus` (flipped) | $5 / $25 | 1M | 128K | all 5, default `high` |
| Opus 4.8 | `claude-opus-4-8` | `opus48` | $5 / $25 | 1M | 128K | all 5, default `high` |
| Sonnet 5 | `claude-sonnet-5` | `sonnet` | **$2 / $10** | 1M | 128K | all 5, default `high` |
| Haiku 4.5 | `claude-haiku-4-5-20251001` | `haiku` / `claude-haiku-4-5` | $1 / $5 | 200K | 64K | **none** |

- Opus 5 GA **2026-07-24**; it is the default model on Claude Max.
- Every dateless id from the 4.6 generation on is a **pinned snapshot**, not an evergreen pointer.
  Only Haiku keeps a true alias→dated-snapshot indirection (`claude-haiku-4-5` → `…-20251001`).
- **Mythos 5.1** (`claude-mythos-5-1`) — id CONFIRMED, identical to Fable 5.1, but **Project
  Glasswing, invitation-only** (vetted US cyberdefense/life-science orgs). Record as a
  **non-routable footnote in §1 only**. Do NOT add to the tier table, MODEL_IDS, the policy
  chain, or any frontmatter.
- **Effort support widened**: Sonnet 5 now supports all five levels (4.6 lacked `xhigh`).
  Haiku 4.5 supports **none**. The old "Opus 4.7+" framing is wrong — fix it.
- **`high` is not comparable across models** — Anthropic states the token allocation behind each
  effort label changed. Document that; do not imply parity.

### Namespace split — the whole point of the rename
Two DIFFERENT namespaces currently both use a bare `opus`. Keep them explicitly distinct:

- **Policy-key namespace** (`model-policy.ts`, `fable-gate.sh`, `statusline-model.sh`, mobile):
  the bare key `opus` is **renamed `opus48`**. No bare `opus` survives here.
- **SDK alias namespace** (`claude-sdk.ts` `MODEL_IDS`): `opus` REMAINS as the user-facing alias
  (agent frontmatter depends on it) but now resolves to Opus 5. Explicit `opus5` and `opus48`
  keys sit beside it.

### Chain + gating
```
DOWNGRADE_CHAIN = ["fable5", "opus5", "opus48"]      FLOOR_MODEL = "opus48"

  fable5  → claude-fable-5-1   [ask]    🔒 HITL-gated escalation — policy UNCHANGED
     ↓
  opus5   → claude-opus-5      [allow]  ⭐ routine ceiling — UN-GATED
     ↓
  opus48  → claude-opus-4-8    [free]   📦 legacy floor, kept reachable for the A/B
```
- **`opus5` mode `ask` → `allow`.** This RESTORES the locked decision in
  `icm-fuse-CONTEXT.md:34-39` ("NO Fable-style model gate on Opus 5"),
  `icm-fuse-opus5-PLAN.md:212-213`, `OPUS5-INCORPORATION-PLAN.md:144`. The shipped `ask` was
  drift. Bus events still emit on every decision — un-gating must not reduce visibility.
- Opus 5's only guard stays the **`effort: xhigh|max` one-shot confirm** (per-call effort
  control, NOT a model gate). No `opus5.flag`.
- **Fable's gate policy carries over VERBATIM** — `fable-gate.sh` + `.prism/local/fable.flag`,
  same wording, same capped-weekly-Max-allowance rationale. Only the version string (5 → 5.1)
  and the id change.
- Sonnet 5 is **NOT** added as a 4th chain rung. It never was one; adding it is speculative
  (ICM guardrail: don't over-structure). Its price cut IS reflected in the cost-ratio re-baseline.

### 🔴 Bug to fix (found this session, not pre-existing scope)
`scripts/fable-gate.sh:56` gates on an **exact** match:
```sh
case "$MODEL" in
  fable|claude-fable-5) POLICY_MODEL="fable5" ;;
```
`claude-fable-5-1` does NOT match. Shipping the rename without widening this lets Fable 5.1
dispatch **completely ungated**, defeating the HITL policy. Fix with a prefix match
(`fable|claude-fable-5|claude-fable-5-*`) so both 5 and 5.1 gate. Same for the L65 fail-safe
grep regex, and for the mobile equivalent at `mobile/model-policy.ts:230`.

### Cost posture (from this session's research — grounds the maxTokens/effort changes)
- Prism **never sets `thinking`** (`claude-sdk.ts` has no thinking param). On Opus 4.8 that
  means thinking-OFF; on Opus 5 adaptive thinking is **ON by default**. Anthropic:
  "a workload that ran without thinking on Claude Opus 4.8 can produce more output tokens per
  request on Claude Opus 5."
- Thinking tokens bill as **output** and count against `max_tokens`. The current default
  `maxTokens ?? 8192` therefore risks **truncation**, not merely spend → raise to `32768`.
- Anthropic's recommended start drops from `xhigh` (4.8) to `high` with "**low and medium
  liberally as your primary control for token cost**" (Opus 5) → re-sweep deep-analysis agents
  from `effort: high` to `effort: medium`.
- Effort does **not** reliably shorten visible responses on Opus 5 → add an explicit
  prompt-for-concision note; effort alone is no longer a sufficient cost lever.
- Same tokenizer on 4.8 and 5 — **no tokenizer differential** between them. Do not claim one.

### Preserve, don't rewrite
Add/rename models; keep Gavin's existing gating philosophy and wording. Do not restructure
§1–§9 of `model-config.md`, do not rewrite the Fable rationale, do not editorialize.

---

## Process
1. Append heartbeat `START`.
2. `model-config.md` — refresh §1 roster table + Mythos footnote; §2 alias/pinned rule + record
   the completed flip; §3 provider table; §4 effort matrix (Sonnet 5 gains all five, Haiku none,
   `high`-not-comparable note); §5 retitle to Fable 5.1 API differences; §7 `[1m]` (all current
   models are natively 1M — note the suffix is now a no-op for them); §8 version minimums;
   §9 currency-check greps. Append `DOC-CONFIG`.
3. `SKILL.md` Model Configuration section + the `claude-fable-5` mention in the agent-frontmatter
   block. Keep it under the progressive-disclosure budget. Append `DOC-SKILL`.
4. Fix `scripts/fable-gate.sh` prefix-match BUG first, then its chain/defaults/comments.
   Then `scripts/statusline-model.sh`. Append `SHELL`.
5. `model-policy.ts` chain/floor/defaults/comments + `model-policy.example.json`; then the mobile
   `model-policy.ts` mirror + `claude-agent.ts` id map. Append `POLICY`.
6. `claude-sdk.ts` MODEL_IDS + maxTokens 8192→32768; `fable-gate.ts`, `model-status.ts`,
   `extension.ts` labels; `claude-models.ts`. Append `SDK`.
7. Agent frontmatter: `effort: high` → `effort: medium` on `codebase-analyzer.md` and
   `prism-analyzer.md` ONLY (the two Opus agents). All 14 agents keep their `model:` **aliases** —
   no agent gets a pinned id. Append `AGENTS`.
8. Remaining docs: `model-selection.md` cost ratios (Sonnet is now **2x** haiku, not 3-5x),
   `statusline-model.md`, `conformance-checklist.md`, icm-architect refs, gavel `frame.html`,
   the three SKILL.mds, `prism-docs/docs/plugin/scripts.md`, `README.md`. Append `DOCS`.
9. Update tests to the new ids/keys. Sync `apps/prism-setup/resources/plugin/**`. Append `MIRROR`.
10. Run `claude plugin validate .`, the vscode tests, and the mobile tests. Fix what they flag.
    Append `DONE`.

On any blocker append `BLOCKED-<one-word-why>` and stop cleanly — never leave the tree
half-edited.

## Success criteria
- `claude plugin validate .` passes clean.
- `rg 'claude-opus-4-8|claude-sonnet-4-6|claude-fable-5(?!-1)'` returns hits ONLY in the
  excluded time-capsule paths and in deliberate legacy-pin contexts (`opus48`).
- A Task dispatch with `model: claude-fable-5-1` **is gated** (the bug fix is verifiable).
- vscode + mobile test suites green.
- `apps/prism-setup/resources/plugin/**` is byte-identical to its live counterparts.
- `VERSION` and `CHANGELOG.md` are UNCHANGED; no `.prism/shared/evals|docs|research|handoffs`
  file is modified.
- All 14 agents still use aliases; zero pinned ids in `agents/*.md`.

## Heartbeat tokens
Append one timestamped line per numbered step to `.prism/local/model-line-sept2026-progress.txt`:
`START · DOC-CONFIG · DOC-SKILL · SHELL · POLICY · SDK · AGENTS · DOCS · MIRROR · DONE · BLOCKED-<why>`

## Concision (Opus 5)
Opus 5 defaults to longer output. Answer at the altitude asked: prefer the smallest correct
edit, no restating the task back, no summary of unchanged files. Verbosity is a defect here,
not thoroughness.
