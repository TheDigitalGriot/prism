# Phase C — L3, L5, L6 — parked with a contract, not a paragraph

Source: Code-Intel Three-Way, Phase C, the nine ranked lifts
(`.prism/shared/handoffs/2026-09-30T00-23-48Z_code-intel-three-way-exploration.md`).
L4 and L7 shipped this session (see `git log --oneline propagate.ps1` in griot-ontology
and `bench/toon-wire-format/` in this repo). L1 and L2 are Gavin's calls, surfaced in
the Code-Intel Three-Way artifact, not applied. **This parks L3, L5, L6** — real,
substantial engineering, not something to rush in the same pass as everything else.

Written at park time, while every path below was just measured live, per the standing
rule: a parked item carrying a contract is loaded work; a parked item carrying a
description is a debt that grows.

## Why these three and not the others

`codebase-memory-mcp` is **ours** — source at `C:\Users\digit\GriotMeta\codebase-memory-mcp`,
not a closed third-party binary (confirmed this session; the installed binary reports
`griot-base-2469ecc` as its version string). That reopens L5/L6 as real, buildable
feature work rather than a wishlist against someone else's tool — but "buildable" and
"safe to rush" are different things. Real structure confirmed by directory listing:
`internal/cbm/` (the Go engine, vendored tree-sitter grammars incl. the 3 that show up
as `.c` build artifacts — liquid/requirements/squirrel), `graph-ui/` (a separate
React/TS frontend, `tsconfig.tsbuildinfo` present, matches the earlier gortex-harvest
finding that :9749 is this UI variant's own backend), `src/cli`, `src/cypher`,
`src/discover`, `src/foundation`, `src/git`, `src/graph_buffer`. None of these three
paths were read past their names this session — that read is the first step below.

## L3 — a compact tool facade over gortex + code-review-graph + codebase-memory-mcp

**The gap, measured earlier this session:** ~61 tools across the three servers, no
facade, vs. gortex's own 178 tools behind a 21-tool facade (its own
`internal/mcp/promote_call_gate_test.go` + `docs/mcp-facade-v1.md`,
per `.prism/local/gortex-harvest/A2-query-surfaces.md`). Not a code-review-graph or
cmm problem specifically — it's the absence of ONE composite layer over all three.

**Steps:**
1. Read gortex's own facade source (`internal/mcp/tool_catalog.go`, the promote/gate
   logic named in the harvest) as the worked pattern to follow, not reinvent — it
   already solved "which N of M tools does a client actually need visible."
2. Enumerate the real current tool surface: gortex's own (37 advertised / 146
   deferred per its own receipt), code-review-graph's 26 CLI verbs / MCP tools,
   cmm's 14 (confirmed exact list this session via `codebase-memory-mcp --help`).
3. Design the facade as a NEW MCP server (own `.mcp.json` entry) that composes calls
   across the three rather than a fork of any one of them — each underlying server
   keeps its own identity; the facade is a thin router + a curated "core" tool set,
   mirroring gortex's `--tools core|full|readonly|edit|nav` preset pattern
   (its own `daemon start --help`, read live earlier this session).
4. Ship it behind a preset flag from day one, not a hardcoded list — the exact
   mistake I15's proxy-verdict bug (this session, Door 3) grew out of was a
   hardcoded assumption standing in for a live check.

**Estimated real scope:** a new small MCP server package, not a one-file patch.

## L5 — a bounded subgraph endpoint for the cmm graph UI

**The gap:** `graph-ui/` fetches the FULL graph for its `--ui=true --port=9749` view
with no server-side bound — this is also what made Phase A step 1 (opening the UI on
a large project) slow, per the handoff's own framing.

**Steps:**
1. Read `graph-ui/src/` for the exact fetch call and its backing Go handler — find the
   real endpoint (likely under `internal/cbm/` or a `src/` HTTP surface not yet
   located this session; the directory listing did not resolve to one file).
2. Read gortex-web's OWN client-side truncation pattern as the anti-pattern to avoid
   copying (`.prism/local/gortex-harvest/A3b-web-ui-source.md`, "What NOT to copy":
   full unpaginated fetch + four independent client-side re-truncations) — the lesson
   from L2's own research applies directly here: bound it SERVER-side, once, not
   client-side, four times.
3. Add a `limit`/`offset` or degree-threshold param to the Go handler; keep the
   existing full-fetch path working behind a flag for back-compat.
4. Verify against a real large project (Prism itself, 95k+ nodes) before calling it
   fixed — "tractable" needs a measured before/after, not an assertion.

## L6 — an embeddable in-process library for cmm

**The gap:** cmm ships only as a CLI + MCP server today; there is no importable Go
package API for embedding cmm's graph capability directly inside another Go program
(gortex, or a future Griot tool) without shelling out or speaking MCP.

**Steps:**
1. Read `internal/cbm/`'s own package boundaries — is the core graph/query logic
   already separated from the CLI/server entrypoints (`src/cli`, `src/foundation`),
   or are they intertwined? This determines whether L6 is "export an existing clean
   boundary" (cheap) or "extract one that doesn't exist yet" (real refactor).
2. If clean: define and document a minimal public Go API (open project, query,
   close) and ship it as its own importable package.
3. If not clean: this is a genuine refactor, not a lift — say so plainly rather than
   forcing a facade over tangled internals, per the standing rule that a diagnosis
   with a guessed root is worse than none.

## Success criteria (all three)

- Each lands as its own commit, its own test, its own verification — never three
  lifts squashed into one unverifiable pass.
- Real code read before real code written, every time (steps 1 above are load-bearing,
  not decoration).
- None of the three touches `.mcp.json`'s existing three server entries in a way that
  could break what Phase B just fixed (Door 2/3) — additive, not destructive.
