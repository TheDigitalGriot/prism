# Stage contract: 2026-10-12 changelog - GPT-6.1 Sol Ultrafast (bucket B, Arkestra roster)

Source: https://learn.chatgpt.com/docs/changelog entry 2026-10-08: GPT-6.1 Sol Ultrafast in Codex and ChatGPT Work. Faster token generation with GPT-6.1 Sol. Pro $500 and eligible Enterprise/Edu plans; Enterprise off by default until a workspace owner enables it. The entry lists NO model id.

## Inputs
Working:
- C:\Users\digit\GriotApps\Prism\packages\prism-core\src\core\api\model-roster.ts (gpt-6.1-sol entry, roster header notes)
Reference (pull via code-intel, never inline):
- .prism/shared/research/2026-09-30-claude-codex-model-roster.md
- header note in model-roster.ts that ultra is a CLI/TUI mode and not an effort value (same pattern to follow)

## Decisions (locked - do not re-litigate or ask)
- Ultrafast is treated as a SPEED MODE of gpt-6.1-sol, not a new model id, until a primary source shows otherwise.
- Do not add a new RosterEntry id unless a primary source publishes one.
- Never state pricing or API availability that a primary source does not publish.
- Names: Arkestra, Spectrum, Prism. Never Model Control Plane or ICM or RPIV.

## Process
1. Run /prism:prism-model-onboard scoped to gpt-6.1-sol Ultrafast.
2. Verify today with web-search-researcher against primary sources: the ChatGPT changelog entry, Codex docs, and the OpenAI models page. Answer: is there an API model id or config key for Ultrafast, is it Codex CLI visible, any pricing multiplier.
3. If no id or key exists: add a documented note to the gpt-6.1-sol entry and roster header (mode, plan gating, date verified). No new entry.
4. If an id or key exists: write the RosterEntry with status, effort and pricing from the source.
5. Run gates: verify-model-policy-conformance.mjs, the vitest api suite, verify-invariants.mjs.
6. Write .prism/changelog-sol-ultrafast.DONE with the gate results, or .prism/changelog-sol-ultrafast.BLOCKED with the reason.

## Success criteria
- gpt-6.1-sol entry or header records Ultrafast with a verified-on date and source URL.
- All three gates exit 0.
- git diff touches only model-roster.ts and tests that must follow it.
- Terminal marker present.

## Heartbeat
Tokens: HB_START, HB_VERIFIED, HB_ROSTER_WRITTEN, HB_GATES_PASS, then the marker file .prism/changelog-sol-ultrafast.DONE or .prism/changelog-sol-ultrafast.BLOCKED.