# ICM Fuse + Opus 5 + Multi-surface — Program Stage Contract (RESEARCH+PLAN pass)

## Role
You are running headless inside the Prism repo (branch feat/icm-fuse-opus5-multisurface).
Produce a code-intel-grounded IMPLEMENTATION PLAN only. DO NOT edit, create, or delete any
source file. The ONLY files you may write are: the plan doc named in step 7, and the heartbeat
file. Ground every claim by querying code-intel via the Prism discovery agents
(graph-navigator, codebase-analyzer, codebase-locator, prism-locator) — query the graph, never
photocopy whole files. Do NOT invoke interactive skills (prism-plan / prism-research wrappers)
— they gate on user input and will hang; drive their discovery agents directly instead.

## Inputs — working (this repo)
- ICM method: icm/README.md, icm/methodology/, skills/icm-architect/SKILL.md, skills/icm-architect/references/core.md, skills/icm-architect/references/forms.md
- Pipeline skills: skills/prism-research/SKILL.md, skills/prism-plan/SKILL.md, skills/prism-design/SKILL.md, skills/prism-implement/SKILL.md, skills/prism-validate/SKILL.md (and prism-prd, prism-decompose, prism-spectrum, prism-subagent)
- Griot MCP: scripts/digital-griot-mcp/digital-griot-mcp.ts (live) and apps/prism-setup/resources/plugin/scripts/digital-griot-mcp/digital-griot-mcp.ts (bundled mirror)
- Opus 5 surfaces: apps/prism-vscode/src/core/api/claude-sdk.ts, apps/prism-vscode/src/core/api/fable-gate.ts, apps/prism-vscode/src/core/api/fable-flag.ts, packages/prism-core/src/core/api/auth.ts, scripts/fable-gate.sh, hooks/hooks.json, skills/cl-plugin-structure/references/model-config.md, skills/prism-spectrum/references/model-selection.md, apps/prism-mobile providers/claude/claude-models.ts
- Fragment (sibling repo): ../fragment-ai-scaffold (create-fragment templates)
- fragment-sync: skills/fragment-sync/references/conformance-checklist.md
- Existing plan to validate/supersede: OPUS5-INCORPORATION-PLAN.md (written at 4.8.0; repo is now 4.10.0 — re-verify all file:line refs before trusting them)

## Inputs — reference (read as rules, do not restate in the plan)
- The 10 ICM invariants (skills/icm-architect/SKILL.md)
- Opus 5 prompting guide (summarized in Decisions below)
- cl-plugin-structure gold standard + its bundled validator

## Locked decisions (from Gavin — do NOT relitigate, plan to these)
1. FULL Option-C ICM fuse. Thread the ICM run-contract + code-intel-slice pattern natively into
   every pipeline skill; add a Griot-MCP verb (icm-prism-run / run_device_skill) that owns
   contract-write + thin-launch + heartbeat-poll; surface stage-contract progress via the app bus
   cards; make FRAGMENT EMIT the ICM scaffold (stage-contract templates + routing CLAUDE.md +
   code-intel wiring) so every app scaffolded by Fragment (Cinopsis, Lucid, R3F Studio, Synaptiq)
   is born ICM-shaped; fragment-sync enforces conformance to the 10 ICM invariants. This Fragment
   emission step is the thing Gavin called "icm-infuse" (it is not an existing skill/file).
2. Opus 5 (claude-opus-5, 1M/128k, 5/25 same price as Opus 4.8) governance = EFFORT-DIAL + a
   VISIBILITY add-on. NO Fable-style model gate on Opus 5. Optional light confirm on effort
   xhigh/max only. BUILD a visibility layer that emits gate/downgrade events to the file bus so
   the Cowork/headless surface can see them (today the gates live only in the vscode/electron app
   + the Task PreToolUse hook, and a denied/flag-off Fable request silently downgrades to Opus =
   the "leaky / never see it" complaint). Fable gate stays exactly as-is. Recommend a parallel
   opus5 key (keep opus=claude-opus-4-8 reachable for A/B); state final call in the plan.
3. Fold in Anthropic's new Opus 5 prompting guide: longer default responses -> prompt for
   concision; Opus 5 self-verifies -> REMOVE "final verification step / use a subagent to verify"
   scaffolding from skills; it over-delegates -> set deterministic subagent caps
   (CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS / CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH; needs Claude Code
   >= 2.1.217); low/medium effort now strong -> re-sweep effort defaults; keep thinking ON and
   lower effort for cost rather than disabling thinking.
4. Multi-surface deploy: Fragment ALSO emits/adapts to ChatGPT Skills + ChatGPT Work (cloud/local)
   + Gemini gems, same as the Claude surfaces. A working adapter will be built after this plan.
   In THIS pass: research the three target packaging formats (via web-search-researcher) and
   design the adapter architecture (what Fragment emits per target, shared vs per-target layers).

## Process (numbered)
1. Append heartbeat "start".
2. ICM fuse mapping: for each pipeline skill, use codebase-analyzer to locate its Step-1 / Load-Context
   workflow and identify the exact insertion point for an ICM run-contract pointer. Append "icm-mapped".
3. Design the shared ICM run-contract reference (one canonical file the skills point at) and the
   icm-prism-run MCP verb signature. Append "contract-designed".
4. Opus 5: re-validate the 3-surface file:line map against current 4.10.0 code; specify the effort
   plumbing and the visibility layer (where gate/downgrade events are written to the bus). Append "opus5-mapped".
5. Fragment icm-infuse: specify exactly what ICM scaffold Fragment must emit and the fragment-sync
   conformance rows that enforce the 10 invariants. Append "fragment-mapped".
6. Multi-surface: research ChatGPT Skills, ChatGPT Work, Gemini gems packaging; design the adapter.
   Append "deploy-mapped".
7. Write the consolidated plan to .prism/shared/plans/icm-fuse-opus5-PLAN.md — per-workstream
   file/line change list, execution ordering, verification commands, and a per-repo release
   checklist (Prism, fragment-ai-scaffold, Cinopsis, digital-griot-mcp). Append "DONE files=N commit=none".
8. On any blocker, append "BLOCKED-<one-word-why>" and continue with the remaining steps.

## Success criteria
- .prism/shared/plans/icm-fuse-opus5-PLAN.md exists and is self-contained.
- Every proposed change cites a file:line grounded via code-intel (not guessed).
- No source files modified (plan-only pass); git status shows only the plan doc + heartbeat file.
- Heartbeats written through DONE.

## Heartbeat tokens (append one line each, with a timestamp, to .prism/local/icm-fuse-progress.txt)
start · icm-mapped · contract-designed · opus5-mapped · fragment-mapped · deploy-mapped · DONE files=N · BLOCKED-<why>
