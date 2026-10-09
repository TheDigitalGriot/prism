# Stage contract - headless runs cannot dispatch subagents or use the Artifact tools (drift 277)

Measured 2026-10-09 on digitalgriotpc, claude.exe 2.1.289, `--permission-mode bypassPermissions -p`:
- Default tool set (16): Bash, Edit, Glob, Grep, ListAgents, PowerShell, Read, ReportFindings, ScheduleWakeup, Skill, ToolSearch, Workflow, Write, + 3 Claude Docs MCP tools. No Agent / Task.
- ToolSearch for agent / task: NONE.
- `--tools default`: only ListAgents matches. `--tools Agent,...`: Agent silently dropped.
- Consequences seen today: prism-closing-ceremony (v5.0.2) skipped the two-stage spec + quality review; the Daily Briefing refresh could not upload or repoint (no Artifact / ArtifactData).
- The skipped review, run from the cloud session afterwards, found a High fail-open regression (drift 278) - so the gap is not cosmetic.

## Inputs
- Working: C:\Users\digit\.claude\skills\griot-mixdown\SKILL.md (headless launcher section), Prism skills that dispatch agents (prism-closing-ceremony references/review-audit-gate.md, prism-research, prism-plan Step 1).
- Reference: `claude --help` (2.1.289): --agents, --agent, --tools, --allowedTools, `claude agents` (background agents), the Workflow tool present in headless.

## Locked decisions
- Until resolved, any headless run whose skill needs agent dispatch or Artifact tools records those steps as SKIPPED-HEADLESS in its marker, and the outer cloud session runs them (as done 2026-10-09 for the v5.0.2 review and the DBR upload).

## Process
1. web-search-researcher: Claude Code 2.1.x - is the Agent tool unavailable in -p by design or by org policy; what replaces it (Workflow tool, `claude agents` background agents, --agents).
2. Probe headless: does the Workflow tool or a `claude --bg` child give the same isolation as a subagent? One measured run each.
3. Pick the route, update the griot-mixdown headless launcher section and the ceremony's review gate to name it, and prove with one headless ceremony that runs both reviewers.

## Success criteria
- A headless prism-closing-ceremony run whose marker shows SPEC_PASS/QUALITY_PASS (or FAIL) from reviewers it dispatched itself.

## Heartbeat tokens
HEADLESS_DISPATCH_RESEARCHED · HEADLESS_DISPATCH_PROBED · HEADLESS_DISPATCH_ROUTE_LOCKED · HEADLESS_REVIEW_PROVEN