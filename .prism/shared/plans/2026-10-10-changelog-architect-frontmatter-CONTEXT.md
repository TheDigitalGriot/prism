# Stage contract - changelog-architect-frontmatter (Bucket A, griot-agent-architect)
Source: https://code.claude.com/docs/en/changelog v2.1.288-296 (2026-10-02 to 2026-10-09).
## Inputs
Working: C:\Users\digit\GriotApps\Prism\skills\griot-agent-architect\SKILL.md and its references\ and examples\ folders
Reference (code-intel, never inlined): the Claude Code changelog entries below, fetched fresh ; the bundled validator of griot-agent-architect
## Decisions (locked)
- Items to evaluate, each verified against the live changelog and the docs page for the feature before it is written down:
  a. autoCompactWindow in subagent frontmatter and --agents definitions (2.1.296).
  b. Agent tool effort parameter for sub-agent effort (2.1.292).
  c. Subagents preload at most 32 skills from the skills field (2.1.295).
  d. Skill or plugin name longer than 256 characters is ignored; agent names max 256 (2.1.292).
  e. Hook onFailure: block for command and HTTP hooks (2.1.295).
  f. CLAUDE_CODE_WORKFLOW_SUBAGENT_MODEL (2.1.296).
  g. MCP tool description and server instruction limit raised to 4,096 characters (2.1.296) and 16,384 for tool-search loaded descriptions (2.1.295).
- None of these appear in the skill today (grep confirmed 2026-10-10). Add each where it belongs, in place; never rewrite or strip existing content.
- Work from the Prism repo copy only, never the marketplace mirror or cloud snapshot.
- Never re-litigate or ask.
## Process
1. git pull --ff-only; record HEAD.
2. Use web-search-researcher to confirm each item a-g on the docs pages, noting exact syntax.
3. Route the edit through /prism:griot-agent-architect from the Prism repo.
4. Add the verified items to SKILL.md and the matching references or examples.
5. Run the skill's bundled validator.
6. Leave the diff uncommitted; write the marker.
## Success criteria
- Each of a-g is either added with a source URL or dropped with a one-line reason.
- Bundled validator exits 0.
- git diff touches only skills/griot-agent-architect.
## Heartbeat
Tokens: HB:STEP1 .. HB:STEP6, HB:VALIDATOR_GREEN. Terminal marker: .prism/changelog-architect-frontmatter.DONE or .prism/changelog-architect-frontmatter.BLOCKED.