# Stage contract: 2026-10-19 changelog - GPT-5.5 retired in Codex for ChatGPT sign-in (bucket B, Arkestra roster)

Source: https://learn.chatgpt.com/docs/changelog entry 2026-10-14 GPT-5.5 retirement in Codex. GPT-5.5 stops being available in Codex for users signed in with ChatGPT. API-key sessions are NOT affected. Replacement named by the entry: gpt-6.1-sol. Users must update saved settings, managed configs, custom agents, scheduled tasks and scripts that still select gpt-5.5.

Grounding (measured 2026-10-19, Prism HEAD b958c66 == origin/main, tag v5.1.0):
- model-roster.ts line 173: gpt-5.5 is status legacy with NO retiredOn. Stale for the ChatGPT-auth plane.
- model-policy.ts line 224: the 5.6 family (sol/terra/luna) falls back to gpt-5.5. That fallback now targets a model a ChatGPT-signed-in Codex session cannot serve.
- gpt-6.1-sol is already the roster default. No new model to add.

## Inputs
Working:
- C:\Users\digit\GriotApps\Prism\packages\prism-core\src\core\api\model-roster.ts (gpt-5.5 entry, roster header notes)
- C:\Users\digit\GriotApps\Prism\packages\prism-core\src\core\api\model-policy.ts (fallback map near line 224)
Reference (pull via code-intel, never inline):
- .prism/shared/research/2026-09-30-claude-codex-model-roster.md
- the retired-entry pattern for gpt-5.4 in model-roster.ts (retiredOn plus empty effort)
- the isRetired helper near line 210 of model-roster.ts

## Decisions (locked, do not re-litigate or ask)
- The retirement is scoped to ChatGPT-signed-in Codex. API-key sessions still serve gpt-5.5, so the entry must say so in notes and must not claim a global retirement.
- Set gpt-5.5 status to retired with retiredOn 2026-10-14 so routing rejects it on the Codex plane. Keep the API-key caveat in notes.
- Re-point the model-policy fallback that targets gpt-5.5 to gpt-6.1-sol or the nearest current tier, same provider, never crossing providers.
- Never state a version from memory. Verify the entry date and scope against the primary source first.
- Do not onboard any new model. Do not touch Claude entries.

## Process
1. Verify today with web-search-researcher against https://learn.chatgpt.com/docs/changelog: confirm date 2026-10-14, the ChatGPT-auth scope, the API-key exemption and the replacement id.
2. Write the RosterEntry change for gpt-5.5 (retired, retiredOn, notes with the API-key caveat) and add a roster header correction note.
3. Update the model-policy fallback map so no fallback resolves to a retired id. Add or adjust the vitest case that asserts it.
4. Run gate 1: verify-model-policy-conformance.mjs.
5. Run gate 2: the vitest api suite for prism-core.
6. Run gate 3: verify-invariants.mjs.
7. Commit natively in Windows PowerShell, push, prove local HEAD equals origin/main.
8. Write the terminal marker.

## Success criteria
- gpt-5.5 entry shows retired, retiredOn 2026-10-14, notes mention API-key sessions.
- No fallback in model-policy.ts resolves to gpt-5.5 on the ChatGPT-auth plane.
- All three gates exit 0.
- HEAD equals origin/main after push.

## Heartbeat
Tokens: CHANGELOG_GPT55_VERIFIED, CHANGELOG_GPT55_ROSTER_WRITTEN, CHANGELOG_GPT55_GATES_PASS, CHANGELOG_GPT55_PUSHED.
Terminal marker: .prism/changelog-gpt55-retire.DONE or .prism/changelog-gpt55-retire.BLOCKED (with the reason inside).