# Changelog contract: GPT-6.2 Astra + GPT-6.2 Sol (bucket B, Arkestra roster)
Source: https://learn.chatgpt.com/docs/changelog entry 2026-11-17 (GPT-6.2 Astra and GPT-6.2 Sol now in ChatGPT Work and Codex; Ultrafast mode for Pro tiers). No API id strings given there.
## Inputs
Working: C:\Users\digit\GriotApps\Prism\packages\prism-core\src\core\api\model-roster.ts ; C:\Users\digit\GriotApps\Prism\scripts\verify-model-policy-conformance.mjs ; C:\Users\digit\GriotApps\Prism\scripts\verify-invariants.mjs
Reference (code-intel only, never inlined): existing RosterEntry for gpt-6.1-sol, gpt-6-astra; .prism/shared/research GPT-6 generation notes; prior contract 2026-11-02-changelog-gpt61-terra-CONTEXT.md
## Decisions (locked, do not re-litigate or ask)
- Roster at Prism HEAD 8a1d5b7 (v5.1.0) has gpt-6.1-sol, gpt-6-astra, gpt-6-luna; no 6.2 ids. Gap confirmed 2026-11-19.
- Never invent an id: ids, default status, effort tiers, context, pricing come only from primary sources verified today.
- Ultrafast is a plan-tier mode, record it as a note, not a model id, unless a primary source says otherwise.
- Never change the default of an existing entry without a primary-source line saying the CLI default moved.
## Process
1. Run /prism:prism-model-onboard in C:\Users\digit\GriotApps\Prism.
2. Dispatch web-search-researcher: confirm the exact API ids, Codex CLI default, effort tiers, context window and pricing for GPT-6.2 Astra and GPT-6.2 Sol from OpenAI primary sources.
3. Write the RosterEntry for each verified model (status, retiredOn for any superseded entry if a primary source says so).
4. Pass gate 1: node scripts/verify-model-policy-conformance.mjs
5. Pass gate 2: the vitest api suite in packages/prism-core
6. Pass gate 3: node scripts/verify-invariants.mjs
7. Commit on a branch, no push without gates green. Write the marker.
## Success criteria
- Both models present in model-roster.ts with source URL and verified date, or a documented reason a model is not yet API-addressable.
- All three gates print their OK tokens.
## Heartbeat
tokens: STEP_1_OK .. STEP_7_OK ; terminal marker .prism/changelog-gpt62-astra-sol.DONE or .prism/changelog-gpt62-astra-sol.BLOCKED