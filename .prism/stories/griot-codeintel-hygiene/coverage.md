# Coverage — griot-codeintel-hygiene

Plan: `.prism/shared/plans/2026-09-22-griot-codeintel-hygiene.md`
Stage contract: `.prism/shared/plans/2026-09-22-codex-plan-sync-eve-CONTEXT.md`
Emitted: 2026-09-22 by the codex-plan-sync evening stage (forward direction).

Requirements found = 6. Stories emitted = 6. Intentional exclusions = 12. No requirement dropped.

## Requirement → Story Mapping

| # | Requirement (source) | Story | Verification |
|---|---|---|---|
| D3(a) | GitNexus fts + vectorSearch report unavailable; `verify-code-intel.mjs` 4 pass / 1 fail (harvest O5, workgraph N103) | `s-4bee6675` | `node scripts/verify-code-intel.mjs` emits one verdict per capability; exit code still non-zero while a capability has no provider |
| D3(b) | codebase-memory-mcp exposes 14 tools; four non-snapshot files declare 11 (harvest O6) | `s-10c2e47d` | `grep -rn "11 tools" --include=*.md . \| grep -v "/evals/"` returns nothing; a check fails on declared-vs-actual drift |
| D3(c) | Global workgraph index 11 days stale; nothing re-runs the generator (workgraph N96) | `s-5ff38680` | `node scripts/verify-workgraph-index.mjs` fails on a stale stamp, passes after `node scripts/workgraph-index.mjs` |
| D3(d) | verify-cards reports stale right after a publish whose read-back was byte-identical (workgraph N99) | `s-b02d6c48` | Gate reports in sync for a card whose read-back is byte-identical; no previously in-sync card flips |
| D3(e) | Two codexes with live cards reported NO CARD; registry rows now exist, gate does not read them (workgraph N100) | `s-3eeb40a6` | Zero NO-CARD rows for codexes carrying a registry row; a genuinely cardless codex is still reported |
| D3(f) | Griot Ontology Codex render has no owner and is 11 days behind (workgraph N102) | `s-8f068ed6` | A check fails when the render is older than the ontology's last commit; passes after regeneration |

## Dependency edges

- `s-10c2e47d` blockedBy `s-4bee6675` — both edit `scripts/verify-code-intel.mjs`.
- `s-3eeb40a6` blockedBy `s-b02d6c48` — both edit `verify-cards.ps1`.

File overlap on two pairs means this epic is **not** dispatch-eligible. See the routing note below.

## Intentional Exclusions

Every item below is Gavin's ruling to make (the D2 Gavel boundary) or is reserved to another owner.
None is decomposed here; decomposing one would decide it by writing it down as work.

| Excluded | Source | Why |
|---|---|---|
| The nine gortex lifts L1–L9 | workgraph S15 | Gavin's ruling; one drop-in, six patterns, two reference-only |
| gortex adopt/trial/defer/pass ruling | plan POT_T row, deliberately undecided | Gavin's ruling |
| Adding gortex to the Potluck shelf + paired `oss-inspo` row | harvest O2 | A `dgs-plan-update` call this stage does not make |
| S13 Djeli code-intel workspace **scope** | workgraph S13, harvest O1 | Gavin's ruling |
| S14 four-layer sync design | workgraph S14 | Gavin's ruling |
| App-codex fan-out A vs B | stage contract D2 | Gavin's ruling |
| Licence posture for gortex (Apache-2.0 engine / PolyForm UI) | harvest O7 | "The call is Gavin's alone" |
| Consolidation vs specialisation across three engines (~1.07GB) | harvest O4, workgraph N103 | "A decision, not a defect" |
| Wiring `code-review-graph` into any skill or agent (zero callers, I8) | workgraph N103 | Inseparable from the consolidation decision above |
| `channel-adoption` disposition (0/25 at 50 days) | workgraph OA20 | D4: reported, not re-scoped |
| Moving the two loose story stores at the `.prism/stories` root | workgraph OA21 | D4: reported, not moved |
| Port 51900 vs documented 52341 for the brainstorm hub | workgraph OA22 | Gavin's own observation; ask, never silently correct |
| `code-review-graph` shelf blurb (version 4.17.0 → 2.3.8, 31,000-star claim) | harvest O3 | A plan/Potluck edit; D6 reserves plan edits for the session |

## Executor routing (from the emitted story graph)

Six stories, two `blockedBy` edges, and file overlap on `scripts/verify-code-intel.mjs` and
`verify-cards.ps1`. Per the forward pipeline's routing table that is **`prism-subagent`** — serial,
fresh-context-isolated, two-stage review. Not `prism-dispatch`: `files[]` are not disjoint, so true
fan-out would collide. Not `spectrum`: six stories is below the 10+ threshold.

Note the cross-repo split — `s-b02d6c48`, `s-3eeb40a6` land in `griot-live-artifacts` and
`s-8f068ed6` in `griot-ontology`; only the other three are Prism-local. An executor must change repo
for those, and the card-republish half of `s-8f068ed6` is deliberately left as a handoff item (D6).
