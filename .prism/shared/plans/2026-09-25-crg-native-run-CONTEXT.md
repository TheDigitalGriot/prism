# crg-native-run — Prism Stage Contract — run code-review-graph natively on Prism

## Role
Headless in C:\Users\digit\GriotApps\Prism, branch as-is. This drives the Prism **research**
stage only: exercise the installed code-review-graph (crg) against this repo and record what it
actually returns. Single job. Do not plan, do not implement, do not wire crg into any skill or
agent this run.

## Inputs
- Working (this run): `.prism/local/crg-native-run/` (all scratch + findings), heartbeat at
  `.prism/local/crg-native-progress.txt`, report at `.prism/crg-native-report.json`,
  notes at `.prism/shared/research/2026-09-25-crg-native-run.md`
- Reference (every run): `.prism/shared/workgraph/index.json` (nodes Q3.3, D16, D20, D24, D25, Q10),
  `.prism/shared/research/2026-09-22-gortex-vs-griot-codeintel.md` §2 and §8,
  `.prism/shared/docs/code-intel/2026-07-12-gitnexus-dual-index.md`,
  `.prism/shared/docs/code-intel/prism-code-intelligence-integration.md`,
  `scripts/verify-code-intel.mjs`, `.mcp.json`, `.claude/skills/` (the four crg-generated skills)

Do NOT load: the gortex clone, gortex-web, other stages' contracts, prior ceremony logs, whole
source trees. Ground every claim through the discovery agents (graph-navigator /
codebase-analyzer / codebase-locator / prism-locator); query the graph; never photocopy whole files.

## Locked Decisions
- crg is ALREADY installed (v2.3.9) and indexed. Do NOT reinstall, do NOT run `install`.
- Refresh with `code-review-graph update`, NEVER a drop-and-rebuild. The existing
  `.code-review-graph/graph.db` (455,266,304 bytes, last written 2026-09-11T21:35) is the baseline —
  record its size and mtime BEFORE and AFTER.
- Do NOT modify `CLAUDE.md`, `.mcp.json`, or any tracked file. This is a read-and-measure stage.
- The DGS shelf blurb's "v4.17.0" is the PRISM PLUGIN version; the repo is 2.3.9. Do not relitigate.
- The "31,000 stars" claim is UNVERIFIED. Flag it; do not assert it.
- Scope is Prism only. Do not index other repos.

## Process
1. Append heartbeat "CRG-START". Record baseline: graph.db bytes + mtime, repo HEAD sha + date.
2. Diagnose the dead freshness contract: D25 recorded a PostToolUse hook on Edit|Write running
   `code-review-graph update --skip-flows`, plus a git pre-commit hook. The index has not moved in
   14 days. Establish WHETHER those hooks exist on disk today (settings + .git/hooks) and whether
   they fire. Append "CRG-HOOKS <present|absent|present-not-firing>".
3. Run `code-review-graph update`. Record wall time, bytes delta, and what it reports. Append
   "CRG-UPDATE <seconds> <bytes-delta>".
4. Enumerate crg's real MCP tool surface (the docs claim 30). Record the ACTUAL count and names.
   Cross-check against our `graph-navigator` agent's tool list. Append "CRG-TOOLS <n>".
5. Exercise four capabilities against Prism with REAL inputs, capturing the actual output of each:
   (a) `detect_changes` over the most recent real commit diff;
   (b) blast radius / `get_impact` on one function you first locate via codebase-locator;
   (c) FTS5 keyword search AND vector/semantic search on a concept query where the concept is NOT
       the identifier name — record whether vector search is available or degraded on this platform;
   (d) Leiden community detection — record community count and the three largest.
   Append "CRG-EXERCISE <a|b|c|d> OK|FAIL" per item.
6. For each of (a)-(d), record the same question answered via codebase-memory-mcp through
   graph-navigator. Capture tokens-in/tokens-out or response size for BOTH. This is the
   token-cost column stage C needs; measure it, do not estimate it.
7. Write the report JSON (baseline, hook verdict, tool count, four exercises with real outputs,
   the crg-vs-cmm cost table, corrections) and the long-form notes. Keep notes under 250 lines.
8. Append "CRG-DONE". On any blocker, append "BLOCKED-<one-word-why>" and stop cleanly.

## Success criteria
- `.prism/crg-native-report.json` exists and parses; `.prism/shared/research/2026-09-25-crg-native-run.md` exists.
- Every one of the four exercises has REAL captured output, or an explicit FAIL with the error text.
- A definite verdict on whether the PostToolUse/pre-commit freshness hooks exist and fire.
- `git status` shows ZERO modified tracked files — only the new outputs above plus `.code-review-graph/`.

## Heartbeat tokens
Append one timestamped line per numbered step to `.prism/local/crg-native-progress.txt`:
CRG-START · CRG-HOOKS · CRG-UPDATE · CRG-TOOLS · CRG-EXERCISE · CRG-DONE · BLOCKED-<why>

## Concision (Opus 5)
Opus 5 defaults to longer output. Answer at the altitude asked: prefer the smallest correct
edit, no restating the task back, no summary of unchanged files. Verbosity is a defect here,
not thoroughness.
