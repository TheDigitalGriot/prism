# Stage contract: 2026-11-02 changelog - GPT-6.1 Terra in Codex (bucket B, Arkestra roster)

Supersedes the unlaunched 2026-10-27-changelog-gpt61-terra-CONTEXT.md (same finding, OA37 still open). New this week: Codex CLI 0.165.0 (2026-10-27) and 0.166.0 (2026-10-29) added Terra to the bundled, Vertex AI and Amazon Bedrock catalogs, and OpenAI now publishes a model page that names the id.

Sources: https://learn.chatgpt.com/docs/changelog (2026-10-26 Terra launch; 2026-10-27 CLI 0.165.0; 2026-10-29 CLI 0.166.0), https://developers.openai.com/api/docs/models/gpt-6.1-terra

Grounding (measured 2026-11-02, Prism HEAD 5414de1 == origin/main, tag v5.1.0):
- model-roster.ts has gpt-5.6-terra (current, effort minimal..xhigh, 1_050_000 ctx, 128_000 out, 2/12). There is NO gpt-6.1-terra entry. gpt-6.1-sol is the default; gpt-6-astra and gpt-6-luna are current.
- Observed on the OpenAI model page today, to be RE-VERIFIED by the run, not trusted: id gpt-6.1-terra; context 1,050,000; max output 128,000; effort none/low/medium(default)/high/xhigh/max; Standard price 1.00 input, 5.00 output per 1M. The page does not mention gpt-5.6-terra, so its fate is unknown.
- Roster is OpenAI-only; Claude ids live in claude-sdk.ts MODEL_IDS and are out of scope.

## Inputs
Working:
- C:\Users\digit\GriotApps\Prism\packages\prism-core\src\core\api\model-roster.ts
- C:\Users\digit\GriotApps\Prism\packages\prism-core\src\core\api\model-policy.ts (only if a tier map or fallback chain must include the new id)
Reference (pull via code-intel, never inline):
- skills/prism-model-onboard (procedure)
- the gpt-6-luna and gpt-5.6-terra RosterEntry shapes, the ModelStatus type, isRetired helper
- .prism/shared/research/2026-09-30-claude-codex-model-roster.md
- the superseded 2026-10-27 contract

## Decisions (locked, do not re-litigate or ask)
- Run /prism:prism-model-onboard. Codex plane, provider openai. Arkestra, never Model Control Plane.
- The id is gpt-6.1-terra only if a primary source (OpenAI model page or Codex models page) confirms it today. Otherwise write .prism/changelog-gpt61-terra.BLOCKED and stop. Never guess.
- New entry status current. gpt-6.1-sol stays the default. Do not retire gpt-5.6-terra unless a primary source states it; then set retiredOn to the stated date.
- The effort array must use only tiers a primary source lists. none and max are new to the Terra line: confirm the roster effort type accepts them (gpt-6-luna already uses none) and extend the type only if a gate demands it.
- Do not touch Claude entries. Do not onboard any other model. Never state price, window or tier from memory.

## Process
1. Verify today with web-search-researcher: model page, Codex models page, changelog entries 2026-10-26/27/29. Capture id, effort tiers, context, max output, pricing, and any gpt-5.6-terra retirement language.
2. Write the RosterEntry and a roster header note dated 2026-11-02.
3. Adjust model-policy.ts only if required; add or adjust the vitest case.
4. Gate 1: verify-model-policy-conformance.mjs.
5. Gate 2: the vitest api suite for prism-core.
6. Gate 3: verify-invariants.mjs.
7. Commit and push natively in Windows PowerShell; prove local HEAD == origin/main.
8. Write the terminal marker.

## Success criteria
- Roster has a verified gpt-6.1-terra entry, status current, fields matching cited sources.
- All three gates exit 0.
- HEAD == origin/main after push.
- .prism/changelog-gpt61-terra.DONE exists, or .BLOCKED with the reason inside.

## Heartbeat
Tokens: CHANGELOG_TERRA_VERIFIED, CHANGELOG_TERRA_ROSTER_WRITTEN, CHANGELOG_TERRA_GATES_PASS, CHANGELOG_TERRA_PUSHED.
Terminal marker: .prism/changelog-gpt61-terra.DONE or .prism/changelog-gpt61-terra.BLOCKED.