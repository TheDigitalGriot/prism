# Stage contract: 2026-10-27 changelog - GPT-6.1 Terra launched in Codex (bucket B, Arkestra roster)

Source: https://learn.chatgpt.com/docs/changelog entry 2026-10-26: GPT-6.1 Terra launches in ChatGPT Work and Codex for Plus, Pro, Business, Enterprise and Edu plans, not in Chat. The entry lists NO model id, so the id, effort tiers, context window and pricing must be verified from primary sources before anything is written.

Grounding (measured 2026-10-27, Prism HEAD 49152da == origin/main, tag v5.1.0):
- model-roster.ts has gpt-5.6-terra (status current, effort minimal..xhigh, context 1_050_000, maxOutput 128_000, pricing 2/12, notes: designated replacement for retired gpt-5.4). There is NO 6.1 Terra entry.
- gpt-6.1-sol is the roster default; gpt-6-astra and gpt-6-luna are current.
- Claude roster is not in this file (claude-sdk.ts MODEL_IDS owns it); this contract does not touch it.

## Inputs
Working:
- C:\Users\digit\GriotApps\Prism\packages\prism-core\src\core\api\model-roster.ts
- C:\Users\digit\GriotApps\Prism\packages\prism-core\src\core\api\model-policy.ts (only if a fallback or tier map needs the new id)
Reference (pull via code-intel, never inline):
- .prism/shared/research/2026-09-30-claude-codex-model-roster.md
- the gpt-6-luna and gpt-5.6-terra RosterEntry shapes in model-roster.ts
- the ModelStatus type and isRetired helper in model-roster.ts
- skills/prism-model-onboard (the onboarding procedure)

## Decisions (locked, do not re-litigate or ask)
- Run /prism:prism-model-onboard for the new Terra model. Codex plane, provider openai.
- Use only the id the primary sources give. If no primary source names an id, write .prism/changelog-gpt61-terra.BLOCKED with the reason and stop. Never guess or invent an id.
- New entry status is current. gpt-6.1-sol stays the default. Do not retire gpt-5.6-terra unless a primary source says so; if it does, set retiredOn to the stated date.
- Do not touch Claude entries and do not onboard any other model.
- Never state a price, window or tier from memory.

## Process
1. Verify today with web-search-researcher: the changelog entry of 2026-10-26, the Codex models page, and the OpenAI models page. Capture exact id, effort tiers, context window, max output, pricing, and any retirement or replacement language for gpt-5.6-terra.
2. Write the RosterEntry for the new Terra id and add a roster header note dated 2026-10-27.
3. Adjust model-policy.ts only if a tier map or fallback chain must include the new id; add or adjust the vitest case.
4. Run gate 1: verify-model-policy-conformance.mjs.
5. Run gate 2: the vitest api suite for prism-core.
6. Run gate 3: verify-invariants.mjs.
7. Commit natively in Windows PowerShell, push, prove local HEAD equals origin/main.
8. Write the terminal marker.

## Success criteria
- The roster has an entry for the verified 6.1 Terra id with status current and effort, context and pricing matching the cited sources.
- All three gates exit 0.
- HEAD equals origin/main after push.
- Marker .prism/changelog-gpt61-terra.DONE exists, or .BLOCKED with a reason.

## Heartbeat
Tokens: CHANGELOG_TERRA_VERIFIED, CHANGELOG_TERRA_ROSTER_WRITTEN, CHANGELOG_TERRA_GATES_PASS, CHANGELOG_TERRA_PUSHED.
Terminal marker: .prism/changelog-gpt61-terra.DONE or .prism/changelog-gpt61-terra.BLOCKED (with the reason inside).