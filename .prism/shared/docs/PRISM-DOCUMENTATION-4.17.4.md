# Prism 4.17.4 - the Artifact publish route, the 5.5 model line, and the viz-engine rename

**Released:** 2026-10-05 - **Base:** v4.17.3 - **Commits:** 108 (most are canonical workgraph syncs)

## Summary

`prism-codex-plan-sync` stops naming the retired `update_artifact` call and now says the top-level
`Artifact` publish with `url=`. Underneath that headline: Claude Opus 5.5 / Sonnet 5.5 are onboarded
into Arkestra, the code-intel tool name is corrected everywhere (`trace_call_path` -> `trace_path`)
and gated, and `prism-viz-engine` is renamed `griot-viz-engine`.

## What changed

- **Artifact publish route.** `prism-codex-plan-sync` forward.md / reverse.md: `update_artifact` replaced by the top-level `Artifact` publish with `url=` (the publish is the card refresh).
- **Model governance.** Opus 5.5 / Sonnet 5.5 onboarded into Arkestra; model-policy and roster tests updated for the opus55/sonnet55 chain; invalid `effort` field removed from the haiku agents.
- **Code-intel.** `trace_call_path` -> `trace_path` across plan, spectrum and 16 further sites; new I16 live-tool-drift gate in `verify-code-intel`.
- **Rename.** `prism-viz-engine` -> `griot-viz-engine` (directory, path literals, live references). `prism-viz-generate` frontmatter folded to a block scalar so it parses.
- **Gates.** Table-driven CHANNELS gate for marketplace mirror freshness; a zero-file structural scan is now a loud FAIL in `pre-release-audit`; standalone-skill validator added to griot-agent-architect.
- **Agents.** `graph-navigator` tools list was prose and resolved to zero tools - fixed.
- **Brainstorm.** Gavel ceremony closes a workgraph node and gains its motion.
- **Housekeeping.** Canonical djeli workgraph synced through amendPass88; global workgraph index regenerated.
