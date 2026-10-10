# Stage contract - changelog-haiku-5-5 (Bucket B, Arkestra roster)
Source: https://support.claude.com/en/articles/12138966-release-notes (2026-10-07 Claude Haiku 5.5 launch) and https://code.claude.com/docs/en/changelog (v2.1.293 2026-10-07, v2.1.296 2026-10-09).
## Inputs
Working: C:\Users\digit\GriotApps\Prism\skills\griot-agent-architect\SKILL.md ; ...\references\model-config.md ; packages\prism-core\src\core\api\claude-sdk.ts (MODEL_IDS) ; packages\prism-core\src\core\api\model-roster.ts (Codex-only today, provider openai)
Reference (code-intel, never inlined): .prism/shared/research/2026-09-30-claude-codex-model-roster.md ; the verify-model-policy-conformance.mjs and verify-invariants.mjs scripts ; prism-model-onboard SKILL.md
## Decisions (locked)
- Claude Haiku 5.5, id claude-haiku-5-5, is now the default Haiku on the Anthropic API. 1M context. $0.10 in / $0.50 out per Mtok ($0.50 / $2.50 for prompts over 100K). Verify every figure against primary sources before writing; effort support is NOT stated in the changelog and must be found.
- Sonnet 5.5 cache reads are now priced $0.10/Mtok (was $0.20) per Claude Code 2.1.296. model-config.md line 35 still says $0.20. Correct it only after verifying against Anthropic pricing.
- Claude models live in model-config.md plus claude-sdk.ts MODEL_IDS, not in model-roster.ts (Codex-only). Do not force a Claude entry into the Codex roster unless prism-model-onboard says its schema takes provider anthropic.
- Haiku 4.5 row is not deleted; mark its status per the verified retirement info.
- Never re-litigate these; never ask.
## Process
1. git pull --ff-only in the Prism repo; record HEAD.
2. Dispatch web-search-researcher to verify Haiku 5.5: id, aliases, context, price, max output, effort tiers, retirement of Haiku 4.5, and Sonnet 5.5 cache-read price. Primary sources only.
3. Run /prism:prism-model-onboard for claude-haiku-5-5 and write the RosterEntry where the skill routes it.
4. Update model-config.md (model table, alias rows, effort matrix, cache-read line) and the Haiku 4.5 mentions in SKILL.md lines near 286 and 293. Add or adjust in place; never strip existing content.
5. Update claude-sdk.ts MODEL_IDS if a haiku alias should roll to 5.5, and the SDK alias table row in model-config.md.
6. Run the three gates: verify-model-policy-conformance.mjs, the vitest api suite, verify-invariants.mjs.
7. Do not commit. Leave the diff for Gavin and write the terminal marker.
## Success criteria
- model-config.md names claude-haiku-5-5 with verified price, context and effort support, each with a source URL.
- Sonnet 5.5 cache-read line matches the verified price.
- All three gates exit 0.
- git diff touches only the files listed under Working.
## Heartbeat
Tokens: HB:STEP1 .. HB:STEP7, HB:GATES_GREEN. Terminal marker: .prism/changelog-haiku-5-5.DONE or .prism/changelog-haiku-5-5.BLOCKED (BLOCKED carries the reason).