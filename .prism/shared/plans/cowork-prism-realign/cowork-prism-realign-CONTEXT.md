# Stage contract - cowork-prism-realign

Inbound (awaits): .prism/local/plugin-update-report.md, skills/griot-harvest-ux-ui/SKILL.md

## Inputs

Working (exact paths):
- C:\Users\digit\GriotApps\Prism                      device Prism repo, main @ 4.16.2
- C:\Users\digit\GriotMeta\digital-griot-marketplace  generated thin mirror, never hand-edited
- C:\Users\digit\.prism\local\plugin-update-report.md headless griot-plugin-update report

Reference (read, do not edit):
- .prism/shared/research/2026-09-06-agentic-ui-canvas-oss.md   the Djeli UX/UI OSS landscape
- .prism/shared/designs/2026-09-05-workgraph-icm-grounding.md  generate-never-maintain doctrine
- skills/griot-harvest/SKILL.md                                the repo-to-sandbox-to-plan pipeline
- C:\Users\digit\GriotMeta\griot-live-artifacts\live\djeli-codex.html

## Decisions (locked)

1. The Cowork surface was running Prism 4.12.1 against a device main of 4.16.2. The gap is closed
   by griot-plugin-update run device-side headless, never by hand-mirroring a cache.
2. griot-harvest is the Djeli repo-identification pipeline: harvest-survey.mjs shallow-clones into
   GriotSandbox per cluster, analyst agents ground one pattern each with file and line citations,
   a separate agent grounds the Griot landing zone, then dgs-plan-update closes the decision into
   griot-live-artifacts. griot-harvest never writes the plan itself.
3. The workgraph index is GENERATED, never maintained. Work is registered by writing a source the
   generator reads, then re-running workgraph-index.mjs. Hand-editing index.json is the anti-pattern.
4. device_bash is unavailable on this device: a Windows update dated 2026-09-08 broke the Plan9
   shares the Cowork VM mounts through. Windows-MCP PowerShell is the working socket. This is a
   routing fact, not a blocker.

## Process

1. Reconcile the Prism and marketplace authoring clones fast-forward-only. Divergence is a STOP.
2. Refresh the marketplace and install so the Cowork snapshot carries 4.16.2.
3. Confirm RUNNING, not merely DOWNLOADED or INSTALLED. A version badge alone proves nothing.
4. Re-run workgraph-index.mjs so this stage enters the index, then workgraph-distil.mjs so the
   Meridian channel reflects it.
5. Resolve the open question below, then decide whether griot-harvest-ux-ui gets written.

## Open question (blocking item 5)

The UX/UI explorer. The research doc names griot-harvest-ux-ui as an orchestrator that does not yet
exist. A search across ~/.claude/skills, Prism/skills and digital-griot-skills returns zero hits and
GriotSandbox holds no ux-ui cluster. Either it was built in the Cursor Claude Code session under a
different name or home, or it remains spec. Gavin confirms which; do not assume.

## Success criteria

- Both authoring clones at ref-equality with origin/main.
- Cowork reports Prism 4.16.2 and griot-harvest is callable on that surface.
- This stage appears as a node in .prism/shared/workgraph/index.json after a generator run.
- The ux-ui explorer question is answered by Gavin, not inferred.

## Heartbeat tokens

STEP 0 detect - STEP 1 reconcile - STEP 2 install - STEP 3 verify running - STEP 4 workgraph - DONE
