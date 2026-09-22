# gortex vs the Griot code-intel suite — grounded harvest

**Date** 2026-09-22 · **Stage** `gortex-harvest` · **Contract** `.prism/shared/plans/2026-09-22-gortex-harvest-CONTEXT.md`
**Subject** `zzet/gortex` @ `1b834f7` (2026-09-21) — `C:\Users\digit\GriotSandbox\gortex`
**Subject, part 2** `gortexhq/web` @ `9b0b48a` (2026-04-24) — `C:\Users\digit\GriotSandbox\gortex-web\web` *(cloned during this stage: the UI is not in the engine repo)*
**Workgraph** B49 (this harvest) · N94 (buried web UIs) · S13 (Djeli code-intel workspace)

> **Read-only stage.** Nothing was modified in gortex, gortex-web, or any Griot repo. The three
> contract outputs plus gitignored agent scratch under `.prism/local/gortex-harvest/` are the
> only writes. No commit, no push, no publish. Every decision below is recorded for Gavin, not taken.

---

## 0. The one-paragraph answer

gortex is a serious, actively-developed, single-binary code-intelligence engine: 35 node kinds,
~64 edge kinds, pure-Go SQLite, 178 MCP tools behind a 21-tool facade, and a genuinely honest
benchmark suite. **It has no capability our stack lacks.** Every axis on the comparison — semantic
search, cross-repo, incremental refresh, daemon, HTTP API, graph web UI, blast radius, API-contract
extraction, speculative edit preview, PR review, compact wire format — is **present on our side
too**, across three separate engines. What gortex has that we do not is **consolidation**: one
binary, one store, one daemon, one UI, one install. We have the same capabilities spread across
three engines, ~1.07 GB of indexes, three web UIs, and **nothing that lists any of them**. The
harvest's real finding is therefore not a missing feature. It is N94, confirmed and enlarged:
*we already built the thing the screenshot made us want, and it is invisible.*

---

## 1. Survey (facts for fields, not rulings)

| field | gortex (engine) | gortex-web (UI) |
|---|---|---|
| path | `GriotSandbox/gortex` | `GriotSandbox/gortex-web/web` |
| HEAD | `1b834f7` 2026-09-21 (0d) | `9b0b48a` 2026-04-24 (**150d**) |
| size | 4868 files / 300 dirs | 93 files / 24 dirs |
| languages | go:4574 md:55 py:39 yaml:37 ts:35 | tsx:50 ts:16 md:10 svg:5 |
| **licence** | **Apache-2.0** (`LICENSE.md`) | **"Gortex License" — Part 1 based on PolyForm Small Business 1.0.0** (source-available; free use enumerated for small business / individual / OSS / education / nonprofit, commercial licence required for larger companies) |
| release cadence | 12 tags in ~5 weeks (~2-3/wk); HEAD is dependabot merge **#817** | 2 PRs total |

**The licence is two different licences.** The engine is Apache-2.0; the UI — the only part this
harvest was commissioned for — is not. Recorded as a **field**, per the harvest contract: what may
be done with either repo is Gavin's call alone, and this document does not rule on it.

**The `ts:35` in the engine survey is a false positive.** Those are Angular/NestJS DI-parser *test
fixtures* under `bench/fixtures/di/` — not UI source. There is no UI source in the engine repo.

---

## 2. Capability matrix (D3) — every row cited on both sides

Legend: **Theirs** = gortex. **Ours** = the Griot stack (`cmm` = codebase-memory-mcp ·
`gnx` = GitNexus · `crg` = code-review-graph · `wg` = workgraph scripts).

### 2.1 What is indexed

| | evidence |
|---|---|
| **Theirs** | **35 node kinds, ~64 edge kinds** declared in `internal/graph/node.go` + `internal/graph/edge.go`. Genuinely covers HTTP routes, pub/sub topics, ORM tables, docs, contracts, capability edges (env reads, process exec), and MinHash clone detection. |
| **Ours** | `cmm` live index on Prism **today: 94,184 nodes / 196,191 edges**, current at HEAD, incl. a `Route` label (143 nodes) and `HTTP_CALLS`/`GRPC_CALLS`/`CONFIGURES` edges. `gnx`: 43,693 symbols / 96,170 relationships / 300 execution flows (`CLAUDE.md`, confirmed against `.gitnexus/`). `crg`: live 455 MB index. **Plus a second, distinct graph domain we have and gortex does not** — `wg` indexes a *project/story* workgraph (804 nodes / 778 edges), not code structure. |
| **verdict** | **PARITY on code structure; OURS-ONLY on project/work structure.** gortex has no equivalent of the workgraph. |

### 2.2 How the index is built and refreshed

| | evidence |
|---|---|
| **Theirs** | Three parser tiers (~30 bespoke tree-sitter / ~60 regex / ~165 forest-backed = **256**). **Correction:** tiers 1 and 2 are *not architecturally distinct* — both are hand-written `Extractor` structs registered identically (119 total); only the forest tier (170 wired of 212 declared in `go.mod`) is a separate generic engine. Live `fsnotify`, incremental restart. |
| **Ours** | Three mechanisms: `cmm` `auto_watch=true` config; `gnx` `analyze` update-if-stale + a PostToolUse hook prompt (`README:50`); `crg` a real multi-repo **watch daemon** (`daemon` verb). |
| **verdict** | **PARITY.** `crg` is the closest match to gortex's watcher and is the one we do not call. |

### 2.3 Where it is stored

| | evidence |
|---|---|
| **Theirs** | `~/.gortex/store/store.sqlite`, **pure-Go SQLite** (`modernc.org/sqlite`, **no cgo** — this is what makes the single-binary claim true). Schema **v21** keyed off `PRAGMA user_version`, with an explicit *drop-and-rebuild-as-derived-cache* philosophy. |
| **Ours** | `cmm`: SQLite per-project under `~/.cache/codebase-memory-mcp/`; 275 MB binary at `%LOCALAPPDATA%\Prism\bin\`. `gnx`: **LadybugDB** store in `.gitnexus/` — **339 MB**. `crg`: **455 MB**. |
| **verdict** | **PARITY on mechanism; OURS IS 3x THE FOOTPRINT** — ~1.07 GB across three stores for one machine. |

### 2.4 How it is queried

| | evidence |
|---|---|
| **Theirs** | Four surfaces. **MCP: 178 tools** (`internal/mcp/promote_call_gate_test.go:37`, `docs/mcp-facade-v1.md:57` — README's "175" is **stale**), **18 resources** (13 `addResource` + 5 `addResourceTemplate`; README's "16" is stale), 3 prompts — but a **structurally-enforced 21-tool compact facade** (`internal/mcp/facade_registry.go:265-477`) is what every named client actually gets. **HTTP: 20 `/v1/*` routes + `/mcp`** Streamable-HTTP. **CLI.** **Library:** `pkg/gortex/api.go`, 181 lines, 10 methods, genuinely daemon-free and embeddable. All three clients share **one AF_UNIX socket — including on Windows** (`internal/daemon/paths.go:43-44`), not a named pipe. |
| **Ours** | MCP on all three engines (`cmm` **14 tools** — note `CLAUDE.md` and `graph-navigator`'s frontmatter both say **11**, which is drift; `gnx` 17; `crg` ~30). HTTP: `gnx serve`, `crg serve --http`, `cmm --ui`. No embeddable library equivalent found. |
| **verdict** | **PARITY on MCP/HTTP. ABSENT on our side: an embeddable in-process library.** Search that failed: no `pkg/`-style importable graph API in any of the three engines; all are server processes. |

### 2.5 What it renders

| | evidence |
|---|---|
| **Theirs** | `gortexhq/web` — Next **16.2.4** / React **19.2.5** (docs say "Next.js 15"), **4 graph modes** (not 5), 10 routes. |
| **Ours** | **Three web UIs, all live, none listed.** `cmm` HTTP viz server on **:9749** (confirmed running via `netstat`) — a real Vite+React app at `GriotMeta/codebase-memory-mcp/graph-ui`. `gnx` gitnexus.vercel.app or `gitnexus serve`. `crg` `visualize`. Plus `griot-ecosystem-viz` on **:5174**. |
| **verdict** | **PARITY IN EXISTENCE, DEFICIT IN REACH.** They have one UI you can find. We have three-plus you cannot. |

### 2.6 Agent integration

| | evidence |
|---|---|
| **Theirs** | **20 agent adapters** (`cmd/gortex/init.go:123-142`, exactly 20 `Register()` calls; README's "19" double-counts `vscode`+`copilotcli` into one bullet). Claude Code specifically: writes `.mcp.json`, **8 wired hook events**, permissions, skills, slash commands, sub-agents — all **merge-not-overwrite** with dedup/healing. |
| **Ours** | One agent touches a graph server: `graph-navigator` (`agents/graph-navigator.md:4-8`, haiku/low/maxTurns 5) -> `cmm`. `codebase-locator`, `codebase-analyzer`, `codebase-pattern-finder` are all `Read, Glob, Grep, Bash` only — **no graph access**. |
| **verdict** | **THEIRS IS AHEAD.** Their install wires 20 agents; our three engines are wired to *one* agent, and `crg` to none. |

### 2.7 Compact wire format

| | evidence |
|---|---|
| **Theirs** | **GCX1**, **-27% vs JSON** — CONFIRMED, reproducible, checked in at `bench/wire-format/scorecard.md:28`. Caveat: the 20 fixtures are self-authored synthetic tool responses. |
| **Ours** | **`toon`** — `cmm` `search_graph`/`trace_path --format toon` (the **default**), claims *"~60% fewer tokens"* vs json. Searched `gnx` and `crg` READMEs for `toon` — no match; they are JSON-only. |
| **verdict** | **PARITY — and ours claims a larger saving.** Neither number is third-party verified. |

### 2.8 Speculative edit preview · PR review

| | evidence |
|---|---|
| **Theirs** | `preview_edit` / `simulate_chain`; `gortex prs` + `gortex review` with BLOCK/REVIEW/APPROVE verdicts. |
| **Ours** | `crg` **only**, and cleanly: `refactor_tool` (preview) -> `apply_refactor_tool` (apply) — an explicit propose-then-commit pair. PR review: `get_review_context_tool`, `get_minimal_context_tool`, `get_suggested_questions_tool`. |
| **verdict** | **PARITY — located entirely in the engine we never call.** |

### 2.9 Blast radius

| | evidence |
|---|---|
| **Theirs** | **See §5.1 — the advertised mechanism is dead code.** Live path is `reach.Lookup`, lazy per-seed BFS + memoisation. |
| **Ours** | All three: `cmm` `trace_path --risk-labels` + `detect_changes`; `gnx` `impact` + `api_impact` + `group impact` (cross-repo); `crg` `get_impact_radius_tool` + `detect_changes_tool`. |
| **verdict** | **PARITY, and ours is arguably better evidenced** — ours is wired into CLAUDE.md as a mandatory pre-edit gate. |

### 2.10 Semantic search

| | evidence |
|---|---|
| **Theirs** | Embedded GloVe-50d, measured at **3,830,458 bytes** — the "3.8 MB" claim is exact. Store-native FTS5/BM25 + vector, adaptive alpha fusion, zero deps. |
| **Ours** | Present in all three — **but degraded here right now**: `gnx`'s FTS **and** vector search both report `unavailable` on this platform. The repo's own `scripts/verify-code-intel.mjs` gate ran **4 pass / 1 fail**, that being the failure. |
| **verdict** | **PARITY ON PAPER, DEGRADED IN FACT.** This is a live, fixable defect on our side, found by our own gate. |

### 2.11 Performance claims, maturity, licence

See §5 (claim ledger) and §1 (licence). Tests: 4,574 Go files of which **2,701 are tests**; CI
tracks coverage with no enforced minimum found. Supply chain — SLSA-3, Sigstore, VirusTotal,
OpenSSF Scorecard — **all confirmed as real CI configuration, not decorative badges**.
Stars/community: **UNKNOWN-FROM-CLONE** (no web access this stage); only in-repo signals (Discord
badge, trendshift id, mcptoplist) were observed.

---

## 3. The web UI — deep section (D4)

### 3.1 Where it lives and how it is served

**It is not in the engine repo.** `docs/server.md:60` points to `gortexhq/web`, "so it can be
deployed independently." Verified structurally: zero UI `.ts`/`.tsx`, no UI `package.json`, no
`.gitmodules`, no `web/` or `ui/` directory. There is **no `go:embed`** of UI assets and **no
`gortex web`/`ui`/`serve` command**. The daemon serves only `/v1/*` JSON+SSE, started by
`gortex daemon start --http-addr 127.0.0.1:7411` (`cmd/gortex/daemon.go:137-144`). The UI is a
separate `npm run dev` on :3000 against `NEXT_PUBLIC_GORTEX_URL`. `internal/tui` is a **Go Bubble
Tea terminal dashboard** — unrelated to the browser UI.

### 3.2 The stack, and what each dependency actually carries

**The headline finding, and it inverts the usual lesson.** Six pinned dependencies carry **zero
rendered pixels** — grep-verified to have no import sites outside their own scaffold files:

| dependency | reality |
|---|---|
| `shadcn` ^4.4.0 | **unused** |
| `@base-ui/react` ^1.4.1 | **unused** |
| `lucide-react` ^1.11.0 | **unused** — icons are hand-drawn |
| `recharts` ^3.8.1 | **unused** — charts are hand-rolled SVG |
| `mermaid` ^11.14.0 | **unused** |
| `tw-animate-css` ^1.4.0 | **unused** |

The design system is **100% hand-authored**: `app/globals.css` carries three complete **OKLCH**
themes (**Ink / Paper / Terminal**) as CSS custom properties; `primitives/Icon.tsx` holds ~40
hand-drawn SVG icons; `primitives/Charts.tsx` is a hand-rolled SVG donut/bar/sparkline set.

What **is** load-bearing: `three` ^0.184 + `@react-three/fiber` ^9.6 + `@react-three/drei` ^10.7
(every graph mode), `graphology` ^0.26 + `graphology-layout-forceatlas2` ^0.10 (the layout,
**synchronous, main-thread, non-worker build**), `zustand` ^5 (client state), `shiki` ^4 (code
highlighting, generic), Tailwind 4.

> **Doctrine note.** The standing rule is *never strip a dependency because it is heavy — ask what
> it CARRIES*. gortex-web is the mirror case: here the heavy manifest is largely decorative and the
> hand-authored CSS is the entire look. Both directions prove the same rule — **you cannot tell what
> carries the look from the manifest**. Lifting this dependency list would have delivered none of
> the screenshot; lifting `globals.css` + `Icon.tsx` + the r3f scenes delivers nearly all of it.

### 3.3 The four modes (not five)

`CommandPalette.tsx:12` says, in the app's own words, **"4 view modes."** `Graph3D` is the
*switcher component's filename*, not a fifth style.

- **Constellation** — **not 2D.** An `@react-three/fiber` **orthographic WebGL** scene: custom GLSL
  point-cloud shader plus line segments, flattened to z=0 with rotation disabled. This is why
  `sigma` is absent from `package.json`, `package-lock.json` and `src/` alike: *there is no 2D
  renderer.* The engine docs' "Sigma.js 2D" is simply wrong.
- **Galaxies · Strata · City** — three 3D metaphors, all confirmed r3f `Canvas` scenes.
  (`AGENTS.md` in their own repo is **stale**: it claims Strata and City are "still SVG.")

### 3.4 The data contract

`GET /v1/graph` (`internal/server/handler.go:713-785`) returns `{nodes, edges, stats}` where nodes
are a **deliberately stripped 7-field projection** — `id, kind, name, file_path, start_line,
language, repo_prefix` (Meta/QualName/EndLine dropped at `handler.go:716-717`) — edges are the
**full** `graph.Edge` struct (`internal/graph/edge.go:563-603`), and stats is `{total_nodes,
total_edges, by_kind, by_language}` (`internal/graph/graph.go:19-24`). `GET /v1/subgraph` is the
one bounded endpoint: **cap 200 nodes, depth 2** (`internal/server/subgraph.go:15,18`). The UI's
TypeScript declares a 9-field node against the API's 7 — a real brief-vs-full mismatch.

**What our data would have to emit for this renderer to run unmodified:** per node `id`, `name`, a
`kind` string, and a repo/cluster bucket key; per edge `from`, `to`, optional `cross_repo` bool
(tints an edge pink) and a `calls`-equivalent kind (City skybridges only); plus a
`repos: [{id, color}]` palette array — and `fallbackRepoColor()` (`views/layout.ts:18-26`) can
synthesize that if we have no colours. **Our workgraph already satisfies all of this.**

### 3.5 Liftability split

**(a) liftable as-is, zero gortex dependency** — `three-common.tsx` (PointsCloud, LineSegs,
TopLabels, EmptyState, raycast threshold, colour helpers) · `views/ThreeDThumb.tsx` +
`views/Graph3D.tsx` switcher shell · `primitives/Charts.tsx`, `Icon.tsx`, `CodeBlock.tsx` ·
`app/globals.css` (**the design system to vendor whole**) · the four zustand stores
(`inspector/tweaks/pins/cmdk`) · `lib/flow.ts` + `primitives/FlowSteps.tsx` (swap the ID-prefix
parser) · `lib/colors.ts` — *and note it is **currently dead code in their repo**, a kind/edge/
language->hex map that never got wired.*

**(b) liftable if we satisfy the contract** — `views/Constellation.tsx`, `Galaxies.tsx`,
`Strata.tsx`, `City.tsx` · `views/layout.ts` (degree/grouping/seeded-jitter maths) ·
`components/graph/GraphView.tsx` · `chrome/SymbolInspector.tsx`.

**(c) welded — replace, do not lift** — `lib/api.ts` + `lib/hooks.ts` (typed wrappers over specific
`/v1/*` routes and MCP tool names, `api.ts:39-49, 91-291`) · `lib/schema.ts` + `lib/types.ts` (their
own comments say "Types matching Gortex Go structs").

**The seam is unusually clean: no file under `components/graph/` imports `lib/api.ts` at all.**
Everything flows as props from the single `GraphView.tsx`. That one fact is what makes this liftable.

---

## 4. LIFT LIST (D5)

Studio norm: **grafting a pattern is the norm; adopting a whole tool is the exception.** Every row
says which. Nothing here is decided — these are ranked candidates for Gavin.

| # | lift | class | Griot target | effort | replaces / extends |
|---|---|---|---|---|---|
| **L1** | `app/globals.css` OKLCH token system (Ink/Paper/Terminal) + `primitives/Icon.tsx` + `Charts.tsx` | **drop-in library** (vendor whole) | `viz-templates`, Djeli ops tab | 1-2 steps: copy, reconcile names against Griotwave tokens | **Extends.** Adds a proven 3-theme OKLCH ramp beside the Griotwave tokens. Ruling needed where the two disagree. |
| **L2** | `three-common.tsx` + `views/layout.ts` + the 4 view components | **pattern to reimplement** (source is (a)/(b), but licence differs from the engine's) | Djeli **Griot Operations / Ceremonies** tab (S13); `prism-viz-engine` | 4-6 steps: emit `{id,name,kind,bucket}` + `{from,to}` + palette; drop in the r3f scenes | **Extends.** Gives the workgraph a real 3D renderer. Our workgraph **already satisfies the contract**. |
| **L3** | The **21-tool compact facade** over 178 (`internal/mcp/facade_registry.go:265-477`) | **pattern to reimplement** | `cmm` + `crg` + `gnx` — our 3 servers expose ~61 tools with **no** facade | 3-4 steps | **Extends.** Directly attacks agent context bloat. The single most transferable idea in the engine. |
| **L4** | `gortex init`'s **merge-not-overwrite** agent wiring (20 adapters, 8 hook events, dedup/healing) | **pattern to reimplement** | `griot-plugin-update`, `propagate.ps1` | 3-5 steps | **Extends.** Our propagation register has a known ungated target; this is a worked pattern for safe merge. |
| **L5** | `/v1/subgraph` **bounded** endpoint — cap 200 nodes, depth 2 (`subgraph.go:15,18`) | **pattern to reimplement** | `cmm` graph-ui (:9749) | 1-2 steps | **Extends.** The guard their own `/v1/graph` lacks (see §6). |
| **L6** | `pkg/gortex/api.go` — 181-line daemon-free embeddable library | **pattern to reimplement** | `cmm` | 2-3 steps | **Fills our one ABSENT row** (§2.4). |
| **L7** | The **honest benchmark table** — publish the row where you lose | **pattern to reimplement** | `scripts/verify-code-intel.mjs` | 1 step | **Extends.** Our `toon` claims "~60% fewer tokens" with no published harness; theirs publishes a 0.23x loss. |
| **L8** | GCX1 wire format | **reference only** | — | — | We already have `toon`, claiming more. **No action.** |
| **L9** | The engine itself | **reference only** | — | — | Adopting it would be the *exception*, and it duplicates three engines we already run. |

**Not recommended as a lift, flagged as a finding instead:** `lib/colors.ts` is dead code in their
repo. If L1/L2 land, wiring it up gives the kind-ramp the live purpose it never got upstream.

---

## 5. Claim ledger — every number, and who measured it

The harvest's Iron Law exists because a past harvest repeated third-party measurements of the
*problem* as a tool's *results*. **That pattern did not recur here.** Every gortex headline traces
to a gortex-authored harness in `bench/`.

| claim | verdict | evidence |
|---|---|---|
| "50x fewer tokens per response" | **SOURCED, self-measured, thin** | `BENCHMARK.md:80-92`. n=**8** hand-picked queries, one corpus. True range **0.23x-94.5x** — and `BENCHMARK.md:90` **discloses a row where gortex is ~4x worse than ripgrep.** |
| GCX1 "-27% vs JSON" | **SOURCED, reproducible** | `bench/wire-format/scorecard.md:28`. Caveat: 20 self-authored synthetic fixtures. |
| "precomputed depth-3 reach index" | **DESCRIBES DEAD CODE** | See §5.1. |
| "257 languages/grammars" | **OFF-BY-ONE** | Their own `docs/languages.md` and the extractor count both say **256**. |
| scale table (linux 1.69M nodes, vscode 204K) | **UNSOURCED** | No date, no run id, no artifact — unlike every other table in the file. |
| SLSA-3 / Sigstore / VirusTotal / Scorecard | **CONFIRMED REAL** | Actual `.github/workflows` config. |
| SWE-bench + agent-graded eval | **METHODOLOGY ONLY, ZERO NUMBERS** | `docs/04-evaluation/README.md:11`; `BENCHMARK-SWE.md` entirely "TBD". |
| embedded GloVe "3.8 MB" | **EXACT** | 3,830,458 bytes. **But zero licence attribution** in NOTICE or THIRD_PARTY_NOTICES.md. |
| 175 MCP tools / 16 resources / 19 agents | **ALL THREE STALE** | Real: **178 / 18 / 20**. |
| "Next.js 15", "Sigma.js 2D", "five 3D modes" | **ALL THREE WRONG** | Real: **Next 16.2.4**, no 2D renderer at all, **4** modes. |
| stars / community | **UNKNOWN-FROM-CLONE** | No web access this stage. Not guessed. |

### 5.1 The loudest correction — and a cross-agent conflict adjudicated

**The reach index is dead code.** `reach.BuildIndex` has **zero production callers** — verified by
the orchestrator directly, not taken on an agent's word: 45 references, all in `_test.go`; every
production hit is a *comment*. The eager pass was deliberately retired, and their own comment at
`internal/indexer/indexer.go` ~4150 gives the numbers: on kubernetes/kubernetes it cost **~2000 s
to build to save ~10 ms/query — a ~200,000-query breakeven.** The live mechanism is `reach.Lookup`,
lazy per-seed BFS with memoisation.

**Honest framing: the capability exists; the advertised mechanism does not run.** Blast radius is
still fast — just not fast the way the README says.

**Two agents disagreed and were not averaged.** A4 marked this `SOURCED`, citing the doc-comment at
`internal/reach/reach.go:1-5`. A1 said dead code, citing the call site. Both read real text; only
one read the call graph. Merging them into "mostly sourced" would have shipped the README's claim
with a citation stapled to it — the exact failure the Iron Law names.

### 5.2 A correction to this harvest's own brief

The orchestrator's prompt to A5 asserted code-review-graph was "INSTALLED 2026-09-12 (**v4.17.0**)",
taken from the DGS plan's shelf blurb. **The true version is 2.3.8/2.3.9; `4.17.0` is the Prism
plugin's version.** The shelf blurb conflates them. The same blurb claims **31,000 stars** for that
repo — **unverified offline, flagged not asserted.** Both are shelf data-quality defects, for Gavin.

---

## 6. What NOT to copy

**From the engine.** Unauthenticated-by-default HTTP and pprof — safety lives only in the CLI
callers, not in the server package (`internal/server/auth.go:9-27`); CORS defaults to `*`.
178 tools is sprawl the 21-tool facade exists to paper over — and `gortex call` **bypasses** that
facade's tool-name authorization boundary from the CLI. Single-writer-mutex SQLite serialization.
A prior OOM in LSH clone detection on a 150k-item corpus (since fixed with streaming + bounded
dedup). Subprocess crash-isolation is needed because native grammars crash.

**From the UI.** `GET /v1/graph` has **zero pagination** — their own code comment estimates a
**~32 MB pointer slice for a 4M-edge repo** before JSON overhead. ForceAtlas2 runs **synchronously
on the main thread** (non-worker build). A dead `focus=` deep-link param. An inert caveat-filter
checkbox group. **A legend that describes a colour mapping the canvas does not actually use.**
Scoped requests silently zero out `stats`.

**From their docs.** `README.md`, `docs/server.md`, `AGENTS.md` and their own `CLAUDE.md` are each
stale against their own code (their `CLAUDE.md` self-reports a file count off by ~3.4x). The
pattern to avoid is documentation that is never gated against the source.

---

## 7. Hidden-surface inventory (D6) — raw material for S13

| kind | count |
|---|---|
| web apps with a `dev`/`start`/`preview` script | ~28 (Vite/Next/Astro/VitePress/Remotion) |
| static codex/card HTML in `griot-live-artifacts/live/` | **93 — 9 embedded as eager mirror tabs in the DGS plan, 84 orphaned** |
| TUIs (Charm/Bubble Tea) | 4 — `prism-cli` (built, has `.exe`), `lucid`, 2 SkillsForge scaffolds (ship status unconfirmed) |
| desktop targets | 12 (Electron Forge x9, electron-vite x2, Tauri x2) |
| local servers/daemons with confirmed ports | 8 |

### 7.1 Port map

| port | owner | confirmed at |
|---|---|---|
| 6767 | Prism agent daemon | ecosystem doctrine |
| 6780 | Prism broker | ecosystem doctrine |
| 7456 / 7457 | prism-design-engine | A6 |
| 5123 | Cinopsis compare viewer | A6 + N94 |
| 8888 | Jupyter | A6 |
| 7520 | 3D-gen | A6 |
| **9749** | **`codebase-memory-mcp` graph-ui — RUNNING (netstat)** | A5; dir verified at `GriotMeta/codebase-memory-mcp/graph-ui` |
| **5174** | **`griot-ecosystem-viz`** | A6 |
| 51920 | griot-seed COMPOSE companion | `.claude/skills/.prism/griot-seed-companion-report.json` |
| 52341 | prism-brainstorm visual companion | `skills/prism-brainstorm/visual-companion.md` |
| 52342 | prism-gavel cockpit | `dgs-plan-update` + `griot-suite-context` SKILL.md |
| 9333 | Chrome CDP (not an app surface) | A6 |

**Collisions (real findings):** **:3000** claimed by three Next apps (Valence web, agentlens web,
prism-design-engine web) with no conflict guard. **:5173** claimed by **six** Vite dev servers
(prism-installer, prism-mobile website, 3x prism-vscode webviews, quiz-assistant, keylink-scaffold,
Prism docs).

**Open item for Gavin, not silently corrected:** N94 records `:51900` for the brainstorm hub.
`51900` appears **only inside the workgraph JSON itself** — no code or config claims it; the
documented port is **52341**. Recorded **UNCONFIRMED** (typo, or an ephemeral dev port). Gavin's call.

### 7.2 BURIED — alive but listed nowhere, ranked

1. **`codebase-memory-mcp/graph-ui` (:9749)** — a finished graph web UI over our own code graph,
   running right now, referenced by no skill, doc or artifact.
2. **`griot-ecosystem-viz` (:5174)** — same shape.
3. Prism Design Studio
4. `prism-cli` TUI
5. `lucid` TUI
6. prism-mobile website/server
7. Cinopsis `viewer.html` cockpit
8. **the 84 orphaned codex cards.**

> **Positive evidence of burial, not absence of evidence:** a grep for `9749` and `5174` across
> `.claude/skills`, `Prism/skills` and `griot-live-artifacts` returns **zero hits**. Nothing
> anywhere points at either.

**Coverage caveat (earned, not claimed):** GBFolio's real code lives at `C:\Users\digit\GBFolio` /
`Developer\gbfolio-*`, outside the assigned roots and **not searched**. Kweli, Damus, Sigil, Ashe,
Kente and Graft have **no local app directory** under the assigned roots. GriotMeta was **sampled,
not walked exhaustively**.

### 7.3 prism-cli

**Hypothesis CONFIRMED:** `prism-cli` has **no workgraph and no code-graph view** — zero-match
repo-wide grep against `NewModel()`'s 6 wired plugins. It knows worktrees and stories only.

---

## 8. Open items — Gavin's calls, none taken here

1. **S13 scope.** The harvest's finding is that S13 is mostly a *listing and routing* problem, not a
   *build a graph view* problem. Three UIs exist; one is running on :9749.
2. **Shelf gap.** gortex is **not on the Potluck shelf** — its only plan mention is `amendPass49`.
   Adding it (and a paired `oss-inspo` row + the derived mirror) is a `dgs-plan-update` call, which
   this stage does not make.
3. **Shelf data quality.** The code-review-graph blurb's version (`4.17.0` -> `2.3.8`) and its
   `31,000 stars` claim both need correcting/verifying at source.
4. **Three engines, ~1.07 GB, one caller.** `crg` is installed, indexed at 455 MB, and wired into
   **zero** skills or agents (invariant I8 territory). Consolidation vs. specialisation is a
   decision, not a defect.
5. **A live, fixable defect:** GitNexus FTS **and** vector search both `unavailable` on this
   platform — caught by our own `scripts/verify-code-intel.mjs` (4 pass / 1 fail).
6. **`cmm` tool-count drift:** 14 real tools; `CLAUDE.md` and `graph-navigator`'s frontmatter both
   say 11.
7. **Licence ruling, if L1/L2 proceed.** Engine Apache-2.0, UI PolyForm-Small-Business-based.
   Facts recorded; the call is Gavin's alone.

---

## 9. Provenance

Seven analyst agents, each given the prior hypothesis to attack, each required to cite file:line
and to name the source of every metric. Full detail (~2,900 lines) in gitignored scratch at
`.prism/local/gortex-harvest/`: `A1-indexer-core.md` (717) · `A2-query-surfaces.md` (540) ·
`A3-web-ui.md` (210) · `A3b-web-ui-source.md` (253) · `A4-bench-maturity.md` (330) ·
`A5-our-codeintel.md` (484) · `A6-surface-inventory.md` (184).

**Corrections produced by this harvest: 16** — 11 against gortex's own documentation, 1 cross-agent
conflict adjudicated at the call graph, 2 against the DGS shelf, 1 against this harvest's own brief,
1 against N94's recorded port.
