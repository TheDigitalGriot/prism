# Prism 4.17.0 — prism-viz-engine ships, and the code-intel layer stops lying

**Released:** 2026-09-12 · **Base:** v4.16.2 · **Commits:** 25

---

## Summary

`prism-viz-engine` is published to npm and reachable as an MCP tool, which is the headline.
The rest of this release is quieter and matters more: three code-intelligence systems that
had been "implemented deeply" for months were all aimed at addresses that no longer existed,
and nothing failed when they were ignored. This cycle converts those silences into checks.

The engine itself is four layers — an archify-shaped IR gated by archify's own validator,
JSON Canvas as the neutral wire, two renderers chosen by *what is being drawn* rather than a
toggle, and a shell where every box is a real module file that opens. It mounts standalone,
composed, or as a Djeli panel, and now installs with `npm i prism-viz-engine`.

---

## What changed

### prism-viz-engine published

`prism-viz-engine@0.1.0` — unscoped, MIT, **React 18 as a peer dependency** so Kweli, Djeli,
Prism and Synaptiq mount one engine rather than drifting three copies. The previously-declared
`@griot/prism-viz-engine` could not publish: the scope 404s and the account holds no
organization. 59.3 kB, 23 files, source-only — no vendor, no `node_modules`.

### archify takes the fourth seat, and the delivery question is ruled

`src/core/motion.ts` named three sources — diagram-design (THE LAW), FossFLOW (THE CAMERA),
Lanshu (THE TOKENS). **archify is added as THE RUNTIME**: Reading Depth, the interaction
inventory, the Motion Governor.

With it, a ruling recorded rather than silently merged: Lanshu ships its motion as a 41-frame,
6–8 MB GIF because Python/PIL had no runtime. That is a **delivery limitation, not a design
decision**. The vocabulary is the asset; the baking is the loss — a GIF cannot be focused,
probed, or honour `prefers-reduced-motion`. Lanshu's motion now runs realtime under archify's
Governor, never pre-rendered, with the export surviving as an *output* rather than the medium.

This also settles the animated-vs-static conflict the harvest flagged: it is a property of the
**mode**, not the engine. `loop` is an explainer and may breathe; `none`/`reveal`/`step` are
documents and may not. Print, embed and reduced-motion collapse to the document case
automatically.

Lanshu's vocabulary is ported as parameters (`LANSHU`, `READING_DEPTH`, `motionCapable`,
`breathingAllowed`) so paths come from a real edge list instead of the upstream's 11 hardcoded
coordinate literals.

### Layer 03 stopped waiting for a dead database

`loadFromKuzu` threw for months on the premise that Kuzu was `trial · next` and would land.
Both halves were false. **Kuzu was archived 2025-10-10** — Apple acquired Kùzu Inc., all 24 org
repos are archived — so it was never landing. And the substrate was *already on disk*:
`.gitnexus/lbug`, a LadybugDB holding this repo's whole code graph, indexed in July and never
queried once.

Renamed `loadFromGraph` (the substrate is Ladybug now), with `loadFromKuzu` kept as a
deprecation alias so imports resolve. New `describeGraphSubstrate()` reports path, provider,
indexed commit, stats and degraded capabilities. **The honesty rule is unchanged — it still
refuses to invent rows.** What it no longer does is refuse to *look*: the throw now carries the
substrate's measured state, so "not wired" is a report instead of a shrug.

### Layer roles: nine → eleven

`emit-canvas-nodes.mjs`, `griot-harvest-ux-ui/SKILL.md` and `src/core/layer-roles.ts` now agree,
verified byte-identical. `Suite meta` and `Cross-cutting rails` were absent from the emitter's
enum, so **our own validator rejected Griot Ontology, Client work, Meridian and Griotwave** —
the tooling itself.

The lesson is in how long it survived: the shortfall was reported honestly and repeatedly as
"7 of 11 layers filled", which made a *validator bug* look like a *data gap*. An honest-looking
number is worse than either, because it stops anyone investigating.

### The workgraph generator emitted edges to nodes it never created

114 of 775 edges — 15% — had an unresolved endpoint. `addEdge(id, wg('dgs','project:'+d), …)`
was called without a matching `addNode`, so any destination that was not literally a plan
`EDGES[]` endpoint pointed at nothing. **That is why project-to-project has never been
visible.** Destination/source references and stage `Inbound (awaits):` dependencies now land as
real nodes; missing projects are created after the plan pass so the plan's richer records still
win, and are marked `inferred: true`. **Unresolved edges: 0.**

`scripts/workgraph-screen.mjs` renders the global graph — session vs everything, per-project
state lanes, cross-project links — chained from the index generator so regenerating the index
always regenerates its view.

### scripts/verify-code-intel.mjs — I11-I15

| | |
|---|---|
| **I11** | the code graph is indexed at THIS repo, not a previous address |
| **I12** | indexes are at HEAD, within a 25-commit / 14-day tolerance |
| **I13** | vendored trees are complete against a recorded manifest |
| **I14** | a tool decided ADOPT on the shelf is actually installed |
| **I15** | a declared capability is available, or covered by another provider |

Auto-discovered by `pre-release-audit.mjs`, so they run at the ceremony gate without being
remembered. Same honesty rule as `verify-invariants.mjs`: a check that cannot execute reports
UNVERIFIED, never a pass it cannot stand behind.

These exist because **every rule broken in this cycle was a soft fix with no check** — "read the
artifacts first", "prefer graph tools over Grep", "use griot-potluck-search", "archify is the
truth". Each was ignored and nothing failed. Exactly one control altered behaviour: a
PreToolUse hook, which blocked an action outright.

### archify vendored whole

The vendored tree was 68 files. Upstream is 542 and includes `viewer/`, `docs/`,
`integrations/`, `experiments/`. The earlier harvest concluded *"there is no viewer directory"* —
true of our copy, false of the project — and every pass since reasoned about a partial tree.

`vendor/archify-full` now carries the **15 authored viewer modules** the 14,934-line bundle is
built from: `guided-views.js` (1,729), `focus.js` (1,440), `export.js` (1,269),
`route-probe.js` (1,033), `motion-governor.js` (263), `reader-layout.js` (168).

Recorded honestly: our `archify/` is upstream's *package* directory, vendored complete. The
failure was **scope**, not truncation — and a file-count check cannot see scope.

### Gap 3 closed — semantic search works locally

`code-review-graph` (MIT) installed and indexed: 2,494 files, 29,339 nodes, 260,393 edges, plus
a local embedding index of **25,669 vectors** via `all-MiniLM-L6-v2` — no API key, nothing
leaving the machine. `search_mode: semantic` confirmed against a concept query naming no symbol.

This closes Gap 3 from the 2026-04-11 memory-and-context research, blocked since by
`LadybugDB VECTOR is disabled on this platform`. The 2026-07-12 dual-index note parked the real
answer as *"a native semantic layer … the real distributable answer"* — that is this tool, and
unlike GitNexus (PolyForm Noncommercial) it is MIT and can ship.

---

## Compatibility

- `loadFromKuzu` still resolves — kept as a deprecation alias for `loadFromGraph` (I6).
- `prism-viz-engine` requires React 18 from the host; it bundles no copy.
- `.mcp.json` gains `code-review-graph` locally; the file is gitignored, so nothing ships.
- No breaking changes to skills, commands or agents.

## Verification

```
pre-release-audit         13 / 14 PASS
verify-code-intel         I11-I15 — 5 pass · 0 fail · 0 unverified
verify-invariants         8 pass · 1 fail · 1 unverified
npm ci --dry-run          lock resolves as CI would resolve it
claude plugin validate .  PASS
marketplace mirrors       3 / 3 match
typecheck                 clean (prism-viz-engine)
```

**Gate override, logged as the ceremony requires.** `I3 — bulk reading is delegated` failed:
one main-thread read of a 12.4 MB screenshot during the authoring session. Historical, no code
impact, not retroactively fixable. Overridden explicitly by Gavin, recorded here rather than
bypassed silently.

## Known follow-ups (not in this release)

- **7 of 11 layers is a scope extension, not a bug.** All five Stage-2 targets were
  Djeli-lineage repos, so four layers had no possible source. Targets identified;
  seven of nine are on disk.
- **Three graphs, no single owner** — `codebase-memory` (SQLite), `.gitnexus/lbug` (Ladybug,
  43,405 nodes), `.code-review-graph` (SQLite, 29,339 nodes). Only code-review-graph is MIT and
  therefore shippable. Consolidation is an open call.
- **AG-UI** is the typed standard for the drive loop hand-rolled on `:52342`. Direction settled;
  adoption open.
- **`griot-agent-architect`** structural pass on `griot-harvest-ux-ui` — numbers corrected,
  structure not yet reviewed.
- **igraph absent** — Leiden community detection fell back to a file-based method.

## The process finding

Every defect above was **discovered by running something, not by reading code**. The dangling
edges surfaced when a view rendered "0 cross-project links". The nine-vs-eleven enum surfaced
when four layers stayed empty. The gitlink surfaced when `git add` warned about an embedded
repository — `archify-full` would have shipped as a pointer, and clones would have received an
empty directory where the entire authored viewer runtime should be.

And the checks themselves had to be corrected twice for the same reason: `I13` was first
baselined against the broken state it existed to catch, and `I12`/`I15` were bundled so that
fixing one left the verdict red. **A check that is permanently red is a check nobody reads** —
which is precisely how "7 of 11" survived for months.
