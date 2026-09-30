---
date: 2026-09-30T00:23:48Z
researcher: Claude (Claude Code CLI, local, digitalgriotpc) + Gavin
git_commit: "<confirm device-side at session start>"
branch: "<confirm device-side at session start>"
topic: "Code-Intel Three-Way — gortex vs code-review-graph vs codebase-memory-mcp: see them, close the silent doors, rank the lifts, rule the open decisions"
tags: [handoff, code-intel, gortex, code-review-graph, codebase-memory-mcp, gitnexus, graphify, djeli-branch-capture, drift-18, OA26, consolidation]
status: planned
sequencing: "INSERTED into the 2026-09-29 griot-rebaseline-plugins-skills-models handoff's stage walk — runs AFTER Stage 5 (Validate) and BEFORE Stage 6 (Close out + Cinopsis ceremony). Gavin's correction, 2026-09-30: the source spec said 'run after' the rebaseline session finishes and pushes; he wants it folded into THIS release cycle instead, landing before Stage 6's commit+propagate+release closes it out. Reason this placement, not later: this session's own success criteria include a drift-ledger status change and branch-workgraph amendments, and Stage 6 is the stage that commits/propagates/ships — those need to exist before that happens, not after."
---

# Handoff: Code-Intel Three-Way — gortex / code-review-graph / codebase-memory-mcp

> **Do not re-harvest.** The research is already consolidated. Read it first:
> - **Artifact**: `claude.ai/artifact/3HsqpHRAU9ax5RQHgQhXDR` ("Code-Intel Three-Way", measured
>   2026-09-25 03:15–03:35 on digitalgriotpc, Prism @ `b9edf2e43f9d`, every figure traced to a
>   command that ran).
> - **Workgraph nodes** in `live/djeli-branch-capture-workgraph.json`: `S15`, `S13`, `B8`, `N101`,
>   `N103`, `OA26`, `A3`, `N71`, `N11`, `N124`, `N138`.
> - **Drift ledger**: entry 18 "code-review-graph dropped from the pipeline" (still flagged), and
>   the entry titled "A correction landed in an artifact and never reached the node it disproved."

## START FROM THE CORRECTED RECORD, not the original claim

`N103` asserted **"gortex has no capability we lack."** That was **FALSE**, and it is now corrected
on the node itself (correction stamped `amendPass77`, 2026-09-30, carrying `wasClaimed` /
`isTrue` / `cause`). gortex has **seven verbs with no Griot equivalent anywhere**:

| verb | what it does |
|---|---|
| `taint` | pattern-driven source-to-sink dataflow |
| `clones` | near-duplicate function clusters |
| `audit` | repo-level A–F health grade |
| `flow` | ranked dataflow paths between two symbols |
| `edit` | verified mutation verbs |
| `memory` | durable session memory over the graph |
| `wakeup` | ~500-token codebase digest with a `--max-tokens` budget |

The claim was false because it came from a **CODE READ of the gortex source** rather than from
**running the binary** — a source read cannot see a runtime surface. That is the floor under the
read-the-source invariant: reading source proves what the code CAN do; running it proves what it
DOES.

What DOES stand from N103 is the consolidation half, and it is the real problem: **three engines,
roughly 2.6 GB of index for one repo**, code-review-graph wired into **ZERO** skills or agents,
only `graph-navigator` touching a graph at all while locator / analyzer / pattern-finder are
grep-only, and **~61 tools across three servers with NO facade** against gortex's **178 behind a
21-tool facade**.

---

## PHASE A — SEE THEM FIRST, not last

Spatial and 3D rank as the reveal (`B8`). Gavin wants to **look at these before deciding
anything** — "I am judging these by looking at them."

1. **code-review-graph** renders a graph to HTML — last measured at **63,428,339 bytes**. Serve it
   over **http, not file://**; if 63 MB chokes the tab render a **scoped subgraph** instead of the
   whole repo. crg 2.3.9, MIT, Python, tree-sitter + SQLite; index already refreshed to HEAD.
2. **gortex** has a web UI — `S13` records the whole workspace idea was "sparked by the gortex web
   UI (`assets/graph.png`): a graph view good enough to want in our own operations tab." Find its
   serve/ui verb from `gortex --help` rather than assuming a port. v0.64.4, Apache-2.0, Go, pure-Go
   SQLite, no cgo runtime.
3. **The Griot stack already has a web UI at :9749** and it is listed nowhere. Open that too, so
   all three sit side by side in the browser at once.

**Deliverable**: screenshots of all three, and for each one, name what it shows that the other two
cannot.

**Two guardrails — both measured, both information not permission:**
- **gortex WROTE into the live repo last time**: `audit` created `Prism\.gortex\badge.svg`,
  untracked, authorised by no contract. **Point gortex at a sandbox clone under GriotSandbox, not
  GriotApps\Prism.**
- **Its store does not stop at index completion**: 1,208,168,772 bytes when the run finished,
  1,222,587,628 four minutes later with **no command issued**, because the daemon keeps enriching.
  Any single footprint figure is a reading, not a size. Budget **~1.2 GB per repo** and **~1,165 MB
  peak RAM** while indexing.

---

## PHASE B — close the three silent doors

crg was never in the ecosystem, and it was never one fold: **three independent doors each reported
success while doing nothing.**

- **Door 1 (index) — ALREADY FIXED, 2026-09-25.** `uv tool install code-review-graph` put the shim
  on PATH; all three freshness hooks revived and verified through the hook's own `sh.exe`; the
  index went 455,266,304 → 489,742,336 bytes in 50 seconds, absorbing 14 days of drift.
- **Door 2 — STILL SHUT.** `.mcp.json` launches `uvx code-review-graph serve` **without**
  `--from "code-review-graph[embeddings]"`, so the server runs **keyword-only** — confirmed live,
  `search_mode: "fts"`. The 25,669 embeddings built at install sit on disk, unreachable through the
  server. This is **open item 6 from the 2026-09-12 handback** and was called a one-line fix —
  **verify that it is one before treating it as one.**
- **Door 3 — the gate that could not report either failure.** `verify-code-intel.mjs` (I15) bundles
  `fts` and `vectorSearch` into **ONE** verdict and gates the fallback on
  `bad.every(b => b.startsWith('vectorSearch'))`, so fts being down suppresses the vector fallback
  even though the 455 MB witness it looks for is right there. **Story `s-4bee6675` owns the split
  and is pending.**

**Name the asymmetry that hid all three, because it generalises**: `.mcp.json` reached crg through
`uvx`, which IS on PATH. **The READ path answered and the REFRESH path was dead.** A server that
responds when queried and silently never updates looks healthy from every surface that only
queries it.

**Three more measured defects while in there:**
- GitNexus text AND vector search both report unavailable on this machine (our own
  `verify-code-intel` catches it: 4 pass / 1 fail).
- `codebase-memory-mcp`'s `list_projects` reads a **ZERO-BYTE** `_config.db` — three stale projects
  reported, six real ones missing (`N71`).
- cmm exposes **14 tools** while CLAUDE.md and the `graph-navigator` frontmatter both say **11**,
  and `graph-navigator` calls `trace_call_path` against a server that exposes `trace_path`.

---

## PHASE C — the nine ranked lifts (`S15`)

Work them in order: **one drop-in, six patterns, two reference-only.**

| # | lift | class | note |
|---|---|---|---|
| L1 | theme/icon/chart system → viz-templates + the Djeli ops tab | **DROP-IN** | needs a Griotwave ruling from Gavin first — **surface it, do not apply it** |
| L2 | four view modes over our workgraph, for the Djeli Griot Operations tab | PATTERN | cheap for a measured reason: our workgraph ALREADY satisfies their renderer data contract, and no graph component imports their API layer. **The visual-first lift.** |
| L3 | a compact tool facade over our three servers | PATTERN | the ~61-with-no-facade gap above |
| L4 | merge-not-overwrite agent-config wiring | PATTERN | for `propagate` and `plugin-update` |
| L5 | a bounded subgraph endpoint for the cmm graph UI | PATTERN | also what makes Phase A step 1 tractable without opening 63 MB |
| L6 | an embeddable in-process library for cmm | PATTERN | our ONE genuinely absent capability |
| L7 | an honest benchmark harness for toon | PATTERN | |
| L8 | GCX1 | REFERENCE ONLY | do not port |
| L9 | the engine itself | REFERENCE ONLY | do not port |

---

## Two decisions are Gavin's. PRESENT them, do not resolve them.

1. **`OA26`** — the `.code-review-graph` directory in Gavin's user profile is 0 bytes, zero files,
   no README, no config, while `code-review-summary` and `graphify` already ship in
   digital-griot-skills. Is the code-review graph a **FOURTH engine**, a **CONSUMER** of an
   existing one, or a **DJELI SURFACE** over what is already indexed?
2. **The consolidation-versus-specialisation call.** ~2.6 GB of index for one codebase to run all
   three. **Nothing in the research decides it.**

---

## THE FINDING GAVIN MOST WANTS PUSHED FURTHER

gortex's primary indexed language in Prism is **MARKDOWN, at 79,432 symbols**, ahead of TypeScript
at 64,010. It treats documentation as graph, and **neither other engine sees a single line of it**
— so the entire `.prism/` tree, every codex and every contract is invisible to both. Gavin: *"That
is not a scope curiosity for me, it is the thing I document everything for."*

Two verbs ride on it:
- **`wakeup`** — a ~500-token digest on demand with a `--max-tokens` budget: scale, top
  communities with their hub symbol, load-bearing symbols with in/out degree (`View` at in:842
  out:1, `createAgentMcpServer` at in:48 out:502), entry points. **ICM's problem statement as one
  verb.**
- **`audit_agent_config`** — it LINTS `CLAUDE.md`, `AGENTS.md`, `.cursor/rules` and
  `copilot-instructions` against the code graph for stale symbol references, dead file paths and
  bloat. **That is the exact defect class the drift ledger keeps catching by hand.**

**Run both against Gavin's real repos and report what they say about his own doctrine files.**

Then **`N101`**, the layer this lands on: gortex is **multi-repo by default**. Gavin's shapes are
per-capture (three branch workgraphs) and per-repo (only Prism has a project workgraph); the only
multi-root read he owns is a generated `index.json` at 804/778 nodes from 2026-09-12. So a
multi-repo indexer is **not a competitor to the branch graphs — it is a candidate for LAYER 4**,
where the gap already is. Answer:
- what does gortex index per repo,
- how does it JOIN repos,
- is that join a graph the workgraph edges could be **PROJECTED INTO**,
- can its web UI show a multi-repo view the branch codexes cannot?

`A3`'s constraint is measured — genoffice, orca, djeli and block-buzz carry no per-repo index at
all; `~/.gitnexus/registry.json` holds only the single prism entry.

---

## Restore the pipeline ordering, and move drift 18

The ledger records that `graphify` surfaces every time code-intel comes up while
`code-review-graph` never does, despite being the **foundational extract layer**, and the ontology
today carries only a bare `graphify` trigger line. **Canonical head:**

```
code-review-graph → graphify → react-force-graph + Mindwalk
```

**Lead with the extract/blast-radius layer, not graphify** — in whatever this session writes, and
**change drift 18's status when it does, with evidence** (not "done" — a commit sha, a gate token,
a file path).

---

## Method

**Use the Prism discovery agents throughout** — `codebase-locator` for WHERE, `codebase-analyzer`
for HOW with file:line, `graph-navigator` for structure and blast radius — **do not drop to raw
grep where a tool covers it.**

### Three engine traps, all measured, all Gavin's own to have hit — avoid repeating them

1. **`amend-workgraph.mjs` reports a localId COLLISION as idempotent and silently writes nothing**
   (`N124`). **Check that totals MOVED after every amend.**
2. It writes a correction to `node.correction` (**singular**), not `node.corrections`. **Verify
   the field the engine actually writes, not the one you expect.**
3. `append-drift.mjs` exits 2 with `"entry.fix is required"` and a piped `Select-Object` will
   swallow it. **Never read an entry COUNT as proof your entry landed** — another session may have
   added one in the meantime. **Grep for your own title.**

---

## Land it as

- Screenshots of all three surfaces (Phase A).
- An updated branch capture (workgraph amendments from Phase B/C findings, following the three
  engine-trap guardrails above).
- Drift 18 status moved, **with evidence**.
- A ruling sheet for `OA26` and the consolidation call — **presented, not decided**.

---

## Resume

```
/resume_handoff .prism/shared/handoffs/2026-09-30T00-23-48Z_code-intel-three-way-exploration.md
```

**Placement reminder**: this runs between Stage 5 and Stage 6 of
`.prism/shared/handoffs/2026-09-29_22-52-52_griot-rebaseline-plugins-skills-models.md`. Confirm
that handoff's Stage 5 (Validate) is complete and its findings are committed before starting this
one, so the drift-18 and workgraph changes this session produces are already in place when Stage 6
runs its commit + propagate + Cinopsis-ceremony close-out.
