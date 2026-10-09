# Prism 5.0.2 - cross-graph edges in the global workgraph index

**Released:** 2026-10-09 (version bump only; release gate HELD - no tag, GitHub release or native builds) - **Base:** v5.0.1

## Summary

Patch bump covering seven commits since v5.0.1. One file outside `.prism` changed: `scripts/workgraph-index.mjs`.

## What changed

- **Workgraph index.** New section 4c reads `griot-live-artifacts/live/*-branch-capture-workgraph.json`, and indexes edges stamped `crossGraph:true` together with both endpoint nodes. They show as outbound at the writing graph and inbound at the origin (drift 269, commit 90e4645). `stats.sources.crossGraphEdges` reports the count.
- **Index regenerations.** `.prism/shared/workgraph/index.json` regenerated three times (854/835, then 856/837).
- **Known follow-ups.** Section 4c hardcodes `C:/Users/digit/GriotMeta` for the live dir; the thin mirrors (prism-plugin, digital-griot-marketplace) diverge on `scripts/workgraph-index.mjs` until their sync runs.
