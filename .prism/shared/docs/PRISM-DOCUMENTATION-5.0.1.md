# Prism 5.0.1 - audit gates the shipped release, mobile in the release add-list, docs reconciled

**Released:** 2026-10-05 - **Base:** v4.17.4

## Summary

First release after 4.17.4, versioned 5.0.1. It ships the release-tooling fixes made since 4.17.4 and carries
the plugin files that were behind in the marketplace mirror (they reach the mirror only through the release sync).

## What changed

- **Release tooling.** `pre-release-audit` now audits the shipped release at a freshly tagged HEAD (diffs against the previous tag instead of a false zero-file FAIL); `prism-release` add-list includes `apps/prism-mobile/packages/app/package.json`.
- **Docs.** `prism-docs` plugin pages reconciled with the v4.17.x code delta; `griot-viz-engine` and the brainstorm gavel motion documented.
- **Mirror propagation.** Marketplace mirror receives agents/codebase-analyzer, agents/graph-navigator, scripts/verify-code-intel.mjs, create_plan, decompose_plan and the prism-plan, prism-subagent, prism-validate, prism-decompose and spectrum skills via the release sync.
