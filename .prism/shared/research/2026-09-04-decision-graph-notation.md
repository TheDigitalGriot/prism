# Decision-graph notation — is a git-lane graph the right metaphor?

**Date:** 2026-09-04
**Agent:** `prism:web-search-researcher` (background, ~41k tokens in isolated context)
**Question:** For the Prism brainstorm question-graph rail — does an established visual notation
already handle decision provenance and cross-project links better than a git-lane DAG?
**Verdict:** **Git lanes are insufficient and will break down.** Use a hybrid.

---

## The six cases the notation must carry

1. **Parked** — raised here, deliberately unanswered, still owed by this session.
2. **Resolved tangent** — raised here, later answered, folds back into the spine.
3. **Inbound** — decided in another tool/session, lands here.
4. **Adjacent** — lives permanently in another project; tracked, never resolved here.
5. **Outbound** — raised here, belongs to another project; exits and becomes *their* inbound.
6. **Splinter** — a sub-question spawned mid-question (Q3 → Q3.1) that grows the total.

## Findings

| Notation | Covers | Does NOT cover |
|---|---|---|
| **IBIS / gIBIS** (Rittel & Kunz 1970; Conklin & Begeman 1988) | 1, 2 — the only surveyed system that makes "raised but unanswered" a first-class state | 3, 4, 5 (no cross-session origin); 6 |
| **Compendium** (transclusion) | 3, 4 — a numbered badge showing the node appears in N maps. The only purpose-built glyph found for "not unique to this session" | Symmetric — no in/out direction; no splinter grammar |
| **QOC / Design Space Analysis** (MacLean et al. 1991) | 1, 2 via solid/dashed assessment edges | Single design space — no cross-project concept at all |
| **DRL** (Lee 1990) | slightly richer via "viewpoints" | single-workspace; no adopted glyph set; tooling dead |
| **W3C PROV** (PROV-DM/O/N) | 3, 5 — bundles + `wasDerivedFrom` across boundaries; `alternateOf` is almost literally "same record, two viewpoints". Has a *standard* visual notation | Models what happened, not what is undecided (1, 2); not an interactive UI |
| **ADR / MADR** | 2 via status change | Only "superseded" is formally named; **no graph notation exists**; no tool renders an ADR graph |
| **Argument mapping** (Toulmin, Argdown, Kialo) | 2 | trees, not cross-project graphs |
| **Git-lane DAG** (gitgraph.js, VS Code Git Graph, GitKraken) | 6 superficially | **No standard glyph for "came from another repo."** 1, 2 have no git equivalent |
| **JSON Canvas / Kumu** | clean open substrate — typed, coloured, directional edges | zero decision vocabulary; you invent it either way |

## Why git lanes lose

1. **The killer evidence.** GitKraken opens a submodule's history in a **separate graph pane**, not an
   inline glyph. Mature, funded tools have had open issues for years and still refuse to notate
   foreign origin in the DAG — because git commits carry no "origin repo" attribute. The one case that
   seems most graph-shaped (inbound) is the one git itself won't draw.
2. **Semantic mismatch.** Git branches are *parallel independent timelines that may never reconverge*.
   A question spine is *one ordered line with typed annotations*. A splinter is a footnote that bumps a
   counter, not an independent history deserving a lane.
3. **Width.** Lane renderers scale horizontally with concurrent branches — unbounded. A 216px rail
   cannot absorb that.

## Recommended hybrid

A single **vertical spine**, with three *independent* channels — never overloading one glyph:

| Channel | Encodes | Borrowed from |
|---|---|---|
| **Border style** — solid / dashed / dotted | decided / parked / unanswered | QOC's solid-vs-dashed assessment convention |
| **Badge** — `→ dest` / `← source` / `⇄ N` | outbound / inbound / adjacent-in-N-maps | Compendium's transclusion badge |
| **Indent + decimal** — Q3 → Q3.1 | splinter | outline convention (no notation has this) |

The governing principle is **PROV's**: separate *what kind of thing* (shape) from *how it relates*
(edge/badge). Git overloads a single lane with both, which is why it stops scaling.

## Consequences for the build

- **The data model is unchanged** — `fromQ`, `resolvedAt`, `source`, `destination`. Renderer only.
- Supersedes the lane rendering built in this session's Q3.1–Q3.3.
- No off-the-shelf notation wins outright; this is a deliberate three-source hybrid.

## Primary sources

- Kunz & Rittel, *Issues as Elements of Information Systems* (1970)
- Conklin & Begeman, *gIBIS: a hypertext tool for exploratory policy discussion*, ACM TOIS (1988) — https://dl.acm.org/doi/10.1145/58566.59297
- Buckingham Shum et al., *Knowledge Mapping with Compendium* — https://oro.open.ac.uk/28658/1/KnowledgeMapping_ICDE2006.pdf
- MacLean, Young, Bellotti, Moran, *Questions, Options, and Criteria* (1991) — https://www.tandfonline.com/doi/abs/10.1080/07370024.1991.9667168
- Lee, *Decision Representation Language* — http://dspace.mit.edu/bitstream/handle/1721.1/41499/AI_WP_325.pdf
- W3C PROV-O — https://www.w3.org/TR/prov-o/ · PROV-DM — https://www.w3.org/TR/prov-dm/
- PROV-DM alternate entities (`specializationOf` / `alternateOf`) — https://dvcs.w3.org/hg/prov/raw-file/default/model/working-copy/wd5/wd5-prov-dm-alternate.html
- FINOS CALM, *Link Architecture Decision Records* — https://calm.finos.org/tutorials/intermediate/10-adr-linking/
- GitKraken submodules — https://help.gitkraken.com/gitkraken-desktop/submodules/
- GitLens issue #2728 (submodule graph will not open inline) — https://github.com/gitkraken/vscode-gitlens/issues/2728
- JSON Canvas spec — https://deepwiki.com/obsidianmd/jsoncanvas/1.1-format-specification
