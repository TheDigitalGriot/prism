# Stage contract - changelog-plugin-update-cli (Bucket A, griot-plugin-update)
Source: https://code.claude.com/docs/en/changelog v2.1.289, 2.1.292, 2.1.293, 2.1.295 and https://learn.chatgpt.com/docs/changelog (2026-10-07 iOS plugins entry).
## Inputs
Working: C:\Users\digit\GriotMeta\digital-griot-skills\griot-plugin-update\SKILL.md
Reference (code-intel, never inlined): griot-agent-architect at C:\Users\digit\GriotApps\Prism\skills\griot-agent-architect (read from the Prism repo only) ; the changelog entries fresh from source
## Decisions (locked)
- Items: claude plugin install --marketplace <source> adds the marketplace if needed then installs (2.1.292); plugin list, plugin eval, plugin update now show current copies for local-folder marketplaces (2.1.289); plugin install, enable, disable and marketplace add warn when the target settings file fails to load (2.1.295); claude plugin validate gives install-line advice (2.1.295); GitHub plugin installs fall back to HTTPS without an SSH key (2.1.292); claude.ai skill sync checks about every 40 minutes when idle, was 10 (2.1.293), which bears on the stale-is-not-blocked rule.
- SKILL.md has none of these today (grep confirmed 2026-10-10). Respect the two axes: marketplace PLUGIN vs standalone SKILL, and surface. Do not put marketplace or cache steps on a standalone skill.
- Add in place; never strip existing content. It is a standalone skill: finish at repo commit plus redeploy to ~/.claude/skills, no plugin cache steps.
- Never re-litigate or ask.
## Process
1. Reconcile digital-griot-skills fast-forward only; record HEAD.
2. Verify each item against the live docs with web-search-researcher.
3. Edit SKILL.md in place under the right axis headings; bump its version.
4. Redeploy the skill to C:\Users\digit\.claude\skills\griot-plugin-update and confirm the file hash matches.
5. Leave the commit for Gavin; write the marker.
## Success criteria
- Each item added with a source URL or dropped with a reason.
- Deployed copy hash equals repo copy hash.
- No marketplace or cache step added to the standalone-skill axis.
## Heartbeat
Tokens: HB:STEP1 .. HB:STEP5, HB:HASH_MATCH. Terminal marker: .prism/changelog-plugin-update-cli.DONE or .prism/changelog-plugin-update-cli.BLOCKED.