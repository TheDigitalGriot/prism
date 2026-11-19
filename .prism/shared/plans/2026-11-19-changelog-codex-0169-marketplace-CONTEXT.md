# Changelog contract: Codex CLI 0.168-0.169 plugin/marketplace, trust and config changes (bucket A)
Source: https://learn.chatgpt.com/docs/changelog entries 2026-11-13 (0.169.0, 0.168.0) and 2026-11-11 (0.167.2).
## Inputs
Working: C:\Users\digit\GriotMeta\digital-griot-skills\griot-plugin-update\SKILL.md (Codex marketplace rows near lines 70, 169, 189)
Reference (code-intel only): C:\Users\digit\GriotApps\Prism\skills\griot-agent-architect (read from the Prism repo, never the mirror or cloud snapshot)
## Decisions (locked, do not re-litigate or ask)
- Grounded 2026-11-19: griot-plugin-update has no mention of --trust, multi_agent or agents.enabled, and the Prism repo has no codex exec or multi_agent usage. Gap is documentation only, no code break found.
- 0.169.0: plugin marketplace upgrades reuse Git objects already on disk. Check whether this changes the stale-pin caveat at SKILL.md line 189 (upgrade can report already up to date against a stale pin). Do not assume it does.
- 0.169.0: codex exec keeps project config and MCP servers disabled in untrusted dirs; --trust saves project trust.
- 0.168.0: warning when features.multi_agent is set explicitly, agents.enabled is the replacement.
- Standalone skills follow griot-plugin-update two axes: repo commit plus redeploy, no plugin cache.
## Process
1. Run /prism:griot-agent-architect from C:\Users\digit\GriotApps\Prism and its bundled validator.
2. Dispatch web-search-researcher to read the 0.168.0 and 0.169.0 release notes on GitHub openai/codex for exact semantics.
3. Add the verified facts in place to griot-plugin-update SKILL.md (add only, never strip existing content), next to the Codex marketplace rows.
4. If any Prism Codex config template sets features.multi_agent, report it, do not change it.
5. Re-run the validator.
## Success criteria
- SKILL.md carries the three facts with source URL and date; validator passes; no existing line removed (git diff shows additions only).
## Heartbeat
tokens: STEP_1_OK .. STEP_5_OK ; terminal marker .prism/changelog-codex-0169-marketplace.DONE or .prism/changelog-codex-0169-marketplace.BLOCKED