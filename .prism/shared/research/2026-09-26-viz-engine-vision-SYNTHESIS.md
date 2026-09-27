---
date: 2026-09-26
topic: "griot-viz-engine — the VISION, found and synthesised"
scope: research only. No code written, no source file changed, no commit.
method: prism-locator + prism-analyzer over .prism/shared (research 84 · docs 110 · plans 137 · designs 91 · brainstorms 11 · handoffs 24 · ref 10,384) + the four branch workgraphs + live/ artifacts + direct reads of engine source
status: synthesis. Gavin's words are quoted verbatim and marked as such; everything else is summarised.
---

# griot-viz-engine — the vision, in the record

**What was asked:** find the nearly-two-days of detailing Gavin did on this engine, and synthesise it.

**What was found.** The vision is not in one document. It is in **four strata**, written on four
different days in four different registers:

| stratum | where | date | register |
|---|---|---|---|
| the **thesis** — one sentence that has governed everything since | `live/griot-viz-engine-cluster.html` footer | 2026-08-03 | Gavin's words, re-quoted in every later doc |
| the **expansion** — twelve of his own passages, including four questions he refused to close | `.prism/shared/designs/2026-09-06-prism-viz-engine-expanded.md` | 2026-09-06 | verbatim session capture |
| the **long session** — 26 decisions + 14 parked, the densest single body of material | `.prism/local/brainstorm/vizclose-1789138640/state/decisions.json` (45,057 b, **gitignored**) | 2026-09-11 → 09-12 | ruling ledger |
| the **synthesis day** — B17, B22, N10, the rename, the six-axis framing | `live/djeli-branch-capture-workgraph.json` nodes B17 · B22 · N10 · A4 | 2026-09-13 | workgraph, `recorded verbatim per his request` |

**The "nearly two days" is 2026-09-11 into 2026-09-13.** 2026-09-06 was the sourcing pass; 09-11
was a 10+ hour session that produced the 26-decision ledger; 09-12 shipped v4.17.0; 09-13 was the
day the *shape* was named — and 09-13 holds his most load-bearing sentences.

**Two corrections to the brief, both measured.**

1. The material is in the djeli workgraph and in `.prism` documents as expected — but the single
   richest source is **the brainstorm store**, `.prism/local/brainstorm/vizclose-1789138640/`, and
   it is **gitignored**. That is recorded as workgraph defect `defect-gitignored-decisions`, state
   `open`, and it is why this material is hard to find: 45 KB of rulings with no durable home.
2. It is **not** in the eight `2026-09-11-*` harvest research docs. Those carry the *methodology*
   in extraordinary depth but are `documentarian`-register reports about four vendored repos, and
   contain **zero occurrences of the string "Gavin"** — grepped across all eight, not estimated.

---

## 1 · WHERE IT LIVES

Ranked by how much vision each carries, not by how much text.

### Tier 1 — the vision itself

| # | path | date | what it carries |
|---|---|---|---|
| 1 | `live/djeli-branch-capture-workgraph.json` → nodes **B17, B22, N10, A4, C4, N30, B15, B21, B9** | 2026-09-13 → 09-16 | **The synthesis.** B17 is the central spec node — the six-axis "ONE cohesive UI". N10 is his lane/graph primitive ruling, flagged `recorded verbatim per his request`. B22 is the Kweli evolution. The typed edges are the blast radius. |
| 2 | `.prism/shared/designs/2026-09-06-prism-viz-engine-expanded.md` (172 l) | 2026-09-06 | **12 Gavin passages, 8 direct quotes** — scope, substrate, the tablet pair, isometric-for-monitoring, and four open questions he explicitly refused to resolve. Its own frontmatter: *"Where he said he does not know, that is recorded as an open question, not resolved by inference."* |
| 3 | `.prism/local/brainstorm/vizclose-1789138640/state/decisions.json` (45 KB) | 2026-09-11/12 | **26 decisions + 14 parked.** archify-is-the-truth, the GIF ruling, Kuzu→Ladybug, the dual-pane, and D11 — the session's own collaboration failure recorded at his instruction. **Gitignored.** |
| 4 | `live/griot-viz-engine-cluster.html` (76 l) | 2026-08-03 | **THE THESIS**, one sentence, plus the four-layer table with named members. Everything later cites this. Registry: `class: cypher`, `mounted: false`, `published: true`. |
| 5 | `.prism/shared/plans/2026-09-16-renderer-truth-CONTEXT.md` (70 l) | 2026-09-16 | The contract that made fidelity **structural**, and the per-shape × per-fidelity matrix in one table. Carries the ruling *"A WIREFRAME NAV AND A GLASS NAV ARE DIFFERENT DRAWINGS, NOT THE SAME DRAWING AT DIFFERENT OPACITY."* |
| 6 | `.prism/shared/plans/viz-companion-fusion/viz-companion-fusion-CONTEXT.md` (131 l) | 2026-09-13 | 8 locked decisions. **Decisions 7 and 8 were added by Gavin mid-run**: the panels are never empty; this becomes a Djeli workflow tab. Decision 1 is the no-hand-authored-HTML law. |
| 7 | `.prism/shared/plans/griot-viz-engine-rail/griot-viz-engine-rail-CONTEXT.md` (89 l) | 2026-09-13 | The rename ruling, **Decision 5 chapters-are-reading-paths**, Decision 6 never-infer, Decision 3 publish-is-Gavin's. |

### Tier 2 — the methodology sources and the ship record

| # | path | date | what it carries |
|---|---|---|---|
| 8 | `apps/griot-viz-engine/src/core/motion.ts` | 2026-09-11+ | Not a doc, but the **densest design statement in the repo**: the four-seat fusion, the 2-1 glow ruling recorded *as* 2-1, the GIF ruling, the motion budget. Doctrine with code attached. |
| 9 | `.prism/shared/handoffs/2026-09-11_prism-viz-engine-close-4.17.0.md` (147 l) | 2026-09-11 | The close contract plus *Known-incomplete, to state rather than discover* — still the best gap inventory written. |
| 10 | `.prism/shared/handoffs/2026-09-12_prism-viz-engine-shipped-4.17.0.md` (150 l) | 2026-09-12 | What shipped, the five fixes, nine-became-eleven, and *"What Gavin said that this session got wrong."* |
| 11 | `skills/prism-brainstorm/references/fidelity-engine.md` (91 l) | 2026-09-13 | **The fidelity canon** — lo/mid/hi with hand-tuned numbers sourced to `idea_init view_translate.jsx`, the classifier, carry-forward, and the final-hi ceremonial rule. |
| 12 | `.prism/shared/research/2026-09-11-archify-visual-layer.md` (880 l) | 2026-09-11 | The design layer of THE RUNTIME: 8 palettes, the `--mask` token, Reading Depth, reduced-motion as a *designed* state, the desktop-readability maths. |
| 13 | `.prism/shared/research/2026-09-11-lanshu-visual-explainer-aesthetics.md` (566 l) | 2026-09-11 | THE TOKENS: the reading-order cursor, the three-operation finish pass, radius-as-hierarchy. |
| 14 | `.prism/shared/research/2026-09-11-diagram-design-visual-grammar.md` (720 l) | 2026-09-11 | THE LAW: token contract, motion clock, four modes, six connector rules, complexity budget. |
| 15 | `.prism/shared/research/2026-09-11-fossflow-design-layer.md` (634 l) | 2026-09-11 | THE CAMERA: `power1.out` as instrument feel, the connector halo, adopt-the-maths-reject-the-renderer. |
| 16 | `.prism/shared/plans/djeli-uxui-harvest/djeli-uxui-harvest-CONTEXT.md` (100 l) | 2026-09-11, corrected 09-16 | The **eleven layer roles** verbatim, plus the provenance rule: byte-verbatim from `LNAME`, middle dots load-bearing. |
| 17 | `.prism/shared/research/2026-09-11-archify.md` · `-fossflow.md` · `-lanshu.md` · `-diagram-design-visual-explainer.md` | 2026-09-11 | The mechanism halves of the same four harvests. Lanshu's pipeline-polarity finding (§3) is here. |

### Tier 3 — supporting, corroborating, peripheral

| # | path | date | what it carries |
|---|---|---|---|
| 18 | `.prism/local/renderer-truth-progress.txt` | 2026-09-16 | **The measurement record.** Pre-fix fingerprint collision, post-fix six distinct hashes. The only place before/after is proven rather than claimed. |
| 19 | `.prism/local/griot-viz-rail-report.md` | 2026-09-16 | What of A4 landed, what did not, and why the directory rename was deferred (later superseded). |
| 20 | `live/djeli-uxui-harvest-layer-routing.html` (259 l) | 2026-09-11 | The layer roles rendered as data — **still says nine**. Carries the *"the other half of the canvas"* reframe. |
| 21 | `live/diagramming-oss-audit-codex.html` (297 l) | pre-09-06 | The landscape audit beneath the cluster: six families → six surfaces. Its open decision is the gap the cluster closed. |
| 22 | `.prism/shared/handoffs/2026-09-16-session-HANDOFF.md` | 2026-09-16 | The B7/B17/A4 open-state record and *"B17 is explicitly a /design ceremony decision (B11), NEVER a headless one."* |
| 23 | `.prism/shared/designs/2026-09-14-design-sync-reconcile.md` | 2026-09-14 | Where `GavelSurface` actually lives — §6's answer. |
| 24 | `.prism/local/brainstorm/12558-1788520964/state/decisions.json` | 2026-09-04 | D1, the standing method: every UI decision shown as a wireframe, both views when mixed. Parks *"prism-viz-engine — revise + lock the diagramming/viz cluster."* |
| 25 | `.prism/shared/handoffs/2026-09-06_HANDBACK_arkestra-and-harvest.md` (318 l) | 2026-09-06 | Registers the cluster as an orphan artifact; parks `griot-harvest-ux-ui` pending layer roles. |
| 26 | `live/_gold/gold-entries.json` → `viz-companion-fusion` | 2026-09-13 | *"It stopped being described and started being seen."* |
| 27 | `live/_drift/drift-entries.json` → `viz-engine to harvest to harvest-ux-ui loop is unused` | 2026-09-20 | The most important open drift: the engine is **outbound-only, nothing calls into it.** |
| 28 | `docs/PRISM-DOCUMENTATION-4.17.0.md` | 2026-09-12 | The published four-layer thesis. |
| 29 | `live/djeli-codex.html` · `live/prism-codex.html` · `live/griot-ontology-codex.html` · `live/dgs-definitive-plan.html` | ongoing | The harvest rows, the port inventory, the POT_T shelf rows tagged to the engine (`json-render`, `wireframe-ui`, `JSON Canvas`, `Drawesome`, `JSONCrack`, `Ladybug`, `Chat2DB`, `Liveline`, `gortex`, `Mindwalk`, `Code Review Graph`). |
| 30 | `.prism/shared/designs/2026-09-05-griotwave-rail-pattern.md` | 2026-09-05 | Four collapsible-pane bugs as a reusable pattern. Peripheral to vision, load-bearing for any shell. |

**Searched and empty:** `.prism/shared/ref` (10,384 files) is vendored reference material and
carries none of this. `.prism/shared/evals/v4.17.0-snapshot/**` duplicates Tier-2 docs as a frozen
snapshot — do not edit those copies; they are the eval baseline.

---

## 2 · THE VISION IN GAVIN'S OWN WORDS

Every block quote in this section is reproduced **character for character** from the file named.
Where the record itself is an agent's summary or attribution rather than his words, it is placed
under **[AGENT SUMMARY]** and labelled. Nothing here is tidied, re-punctuated, or re-ordered into
an arc.

### 2.1 The thesis — the sentence that has governed everything since

**[GAVIN, VERBATIM]** — `live/griot-viz-engine-cluster.html` footer, re-quoted at
`designs/2026-09-06-prism-viz-engine-expanded.md:27-30` as *"Thesis (Gavin's words)"*:

> *"a native Prism engine that draws diagrams **from** real substrate (code graph via Kuzu, DB
> schema via Chat2DB) using the cluster's generation patterns, renders them on the right canvas per
> shape, and ships them as **interactive, source-wired** surfaces in the Waku mold — not static
> SVGs."*

Four clauses. Every one of them is a requirement, and §4 measures each separately.

### 2.2 The substrate is LIVE, not aspirational

**[GAVIN, VERBATIM]** — `designs/2026-09-06-prism-viz-engine-expanded.md:35-36`:

> *"kuzu codegraph and chat2db have been hidden for so long but they have been operating
> beautifully"*

### 2.3 Scope — ecosystem-wide, not Prism-only

**[GAVIN, VERBATIM]** — same file, `:42`:

> *"i see prism-viz-engine turning into a very important piece of Griot tooling everywhere"*

The capture's own note on what that changes: *"This changes where the engine belongs
architecturally. It is not a Prism feature; it is suite infrastructure that Prism happens to host."*

### 2.4 The ink pair is a TABLET companion, not a desktop widget

**[GAVIN, VERBATIM]** — same file, `:48-49`:

> *"yes they do actually … djeli would use penecho and drawesome possibly to have like an iOS app
> tablet companion to brainstorming or notes in synaptiq"*

### 2.5 Isometric is for infrastructure — and motion is part of the requirement

**[GAVIN, VERBATIM]** — same file, `:59-60`:

> *"i love this for things like server monitoring where its actual boxes … the isometric canvas
> with good motion and interaction design"*

The capture's note, which the router later encoded: *"A distinct **output mode**, reached for when
the subject is infrastructure-shaped. Motion and interaction design are explicitly part of the
requirement, not decoration."*

### 2.6 The four questions he refused to close

**[GAVIN, VERBATIM]** — the design layer is contested, `:89-91`:

> *"instatic is like the Figma of Djeli, but also there is the Design layer of Orca and also we
> have a whole prism-design-engine (i don't even know what that's about because it's been going
> dark) and we also have OpenDesign as the seed being used for the prism design app"*

**[GAVIN, VERBATIM]** — what he asked for instead of a resolution, `:95-97`:

> *"if orca can take over the OpenDesign lets see where both are today and what they offer, how to
> port prism-design current and then the future — because when it was first done most of this
> infrastructure didn't exist in the griot ecosystem."*

**[GAVIN, VERBATIM]** — design-memory, placement unknown, `:108-109`:

> *"not sure tbh i just know that something sparked for me when i saw the way it remembers design
> decisions … we've done something shallow but similar with some of our griot skills"*

**[GAVIN, VERBATIM]** — the uncaptured band, `:116-119`. This is the passage that names the hole
in his own shelf:

> *"a skeleton UI library and how that would be cool in brainstorming app wireframes/ux/userflow —
> so many things in the in-between of Information Architecture/UX and a polished Griot level of
> quality immersive UX/UI. I don't know if that actually got captured anywhere in the codexes or
> the potluck — it should be perhaps in the Lucid design inspo sources"*

The capture verified him right: across all 1,149 `POT_T` tools, `information architecture` **0**,
`lo-fi`/`lofi` **0**, `user flow` **0**, `wireframe` **1**. Lucid carries 106 tools and none cover
the band.

### 2.7 Composition — one workflow's close is the next one's enter

**[GAVIN, VERBATIM]** — same file, `:137-138`:

> *"griot harvest cant do that lol thats what my cinopsis tool is for … after a cinopsis run i
> will call griot-harvest and dgs-update to align everything"*

### 2.8 Sequencing — harvest first, architect second

**[GAVIN, VERBATIM]** — same file, `:158-159`:

> *"i want to expand on that and do the griot-harvest on them to see … after the harvest there
> might be even more that we aren't aware of"*

### 2.9 The primitive — the single most important passage in the corpus

**[GAVIN, VERBATIM]** — `live/djeli-branch-capture-workgraph.json`, node
`wg:djeli-branch:design-lane-primitive` (localId **N10**), introduced by `amendPass3`. The record's
own framing is *"Gavin, 2026-09-13, recorded verbatim per his request:"*

> "The brainstorm companion's panels are decision states - done, superseded, parked, open. The
> capture's lanes are branch states - tracked, unfiled, in-flight, discovered. Same substrate, two
> verbs. Brainstorm answers what did we decide; capture answers what is in flight. Put them on one
> surface and you have a workspace that knows both, which is exactly the thing neither a chat log
> nor a kanban board can do."

**[AGENT SUMMARY]** of why that makes it a primitive, from the same node — worth carrying because
it is the reasoning the renderer inherits: *"the lanes were NOT a chosen layout - they fell out of
the data, they are the states work actually occupies, which makes the shape reusable, not
decorative. It IS a diagram type: a state swimlane over a work graph … the 'right canvas PER SHAPE'
selector choosing itself because the data had a shape."* And the resolution it supplies:
**"LANES ARE STRUCTURE, CHAPTERS ARE JOURNEYS ACROSS THEM - both, never either."**

### 2.10 Chapters are reading paths

**[CONTRACT, locked]** — `plans/griot-viz-engine-rail/griot-viz-engine-rail-CONTEXT.md` Decision 5,
quoted inside node N10. Authorship is not attributed to Gavin in the node text, so it is marked as
a locked contract decision rather than his voice:

> "chapters are reading paths, not categories... eleven layers were never going to be eleven
> chapters"

### 2.11 Kweli is the natural evolution

**[GAVIN, VERBATIM]** — node `wg:djeli-branch:B22`, framed *"Gavin's call 2026-09-13:"*. The
ellipsis is his elision as recorded, not an abbreviation made here:

> "agentation and kweli go hand in hand... not to mention griot-viz-engine and kweli is the natural
> evolution."

**[AGENT SUMMARY]** of the seam, same node: *"griot-viz-engine renders the artifact; Kweli captures
the approval on what was rendered; the four detail levels are the fidelity ladder the viz engine
ALREADY has (lo / mid / hi). Render, point, approve, with the evidence carried."*

### 2.12 Lucid is the design anchor

**[GAVIN, NEAR-VERBATIM]** — node `wg:djeli-branch:B18`, framed *"Gavin's ruling 2026-09-13, given
twice and sharpened the second time."* Rendered in the node **without** quote marks, unlike N10 and
B22, so it is presented as his sentence but not explicitly flagged `recorded verbatim`. The anchor
if the exact string matters is `griot-live-artifacts a7e8216`:

> Lucid is my gold standard for design, and even though orca is the seed, the left navigation and
> the rails and the utility of the design therein are amazing and fit what i want visually.

### 2.13 Publish authority

**[GAVIN, VERBATIM]** — node `wg:djeli-branch:A4`, final sentence of its description; also
`griot-viz-engine-rail-CONTEXT.md` Decision 3. This is the clause that keeps the rail from running
headlessly:

> Publish is Gavin's, never the agent's.

### 2.14 Why the tooling is never used — said to the agent's face

**[GAVIN, VERBATIM]** — `vizclose-1789138640/state/decisions.json`, D10 summary:

> 'its in my potluck and in my codexes and you've told me its implemented deeply but its never
> used.'

**[GAVIN, VERBATIM]** — D13, on the phrase "nothing is lost":

> 'you've said that literally for 6 months and look what turned up lost today.'

**[GAVIN, VERBATIM]** — D25, on `code-review-graph`:

> "ive asked for months"

**[AGENT SUMMARY]** of D11, recorded at his instruction: a 10+ hour session on 2026-09-11 *"that
ended with Gavin saying he had given up … THE MECHANISM: the agent generated work for the user to
check instead of verifying before showing. Gavin became QA for the agent."* And the verdict:
**"WHAT WAS NOT AT FAULT: his systems. Every tool held. The failure was the layer meant to read and
use them."**

### 2.15 The six axes — the assembly, as he framed it

**[AGENT SUMMARY of Gavin's framing]** — node `wg:djeli-branch:B17`, opening *"Gavin's framing
2026-09-13, and it names the thing all of today's separate threads were approaching from different
sides."* This is the closest thing to a specification the engine has, and it is recorded prose, not
a quotation:

> "THE STACK, bottom to top, using only pieces that already exist: the DATA is the capture's
> node/lane pairing (localId + originLane + group + derived direction, edges in the studio's
> six-kind vocabulary); the RENDERER is griot-viz-engine, which already emits shell | isometric |
> nodegraph and already carries fidelity lo | mid | hi against the fidelity-engine canon; the
> NAVIGATION is archify's guided chapters (meta.views, <=5 curated chapters) resolving B7's
> per-shape selector and N10's lanes-are-structure-chapters-are-journeys ruling; the PAYLOAD
> contract is OpenUI's generative-UI shape; the WIRE is AG-UI's event protocol - and Gavin already
> hand-rolled both halves as griot-widget's render() and drive() over the brainstorm channel (B15).
> WHY IT IS ONE SURFACE AND NOT SIX: each piece is a different AXIS over the same substrate - the
> data says what exists, the renderer says what shape it takes, fidelity says how much detail
> survives, chapters say which path through it you walk, the payload says how it streams, the wire
> says how it answers back. Six answers to six different questions about one graph."

And its own honesty clause, which is why this document exists:

> "HONEST STATE: every component exists and none of them are joined. The renderer does not read the
> capture's lanes, the chapter rail is written but never launched (A4), fidelity is verified but
> unused outside the companion, and the protocol halves are hand-rolled rather than conformant.
> Named, not built - and explicitly a /design ceremony decision (B11), never a headless one."

### 2.16 Two rulings added mid-run, 2026-09-13

**[CONTRACT, ruled by Gavin mid-run]** — `viz-companion-fusion-CONTEXT.md` Decision 7:

> THE PANELS ARE NEVER EMPTY. LAYERS and TIMELINE must both carry something from the FIRST moment of
> a session, not from the first decision. An empty panel at session start is a defect, not a neutral
> initial state. The seed is foundational even when it is only the first ideation step: the session
> genesis, the inbound context the contract names, the opening question. From there the panels GROW
> ORGANICALLY and EVOLVE as the session runs - accretion, never a one-shot fill and never a rebuild.

**[CONTRACT, ruled by Gavin mid-run]** — Decision 8:

> What this stage builds is not session-scoped tooling. The fused surface - engine-emitted canvas
> inside the frame, with LAYERS / TIMELINE / WORKGRAPH panels seeded at genesis and growing - is a
> FOUNDATIONAL element of Djeli and will ship as its own workflow tab, peer to the Prism (code),
> Lucid, R3F Studio, Cinopsis, Kente, Synaptiq and Mixar tabs.

### 2.17 The mount requirement

**[AGENT SUMMARY of a requirement stated by Gavin]** — `apps/griot-viz-engine/src/core/mount.ts:4-7`,
which opens *"The requirement is Gavin's, stated plainly"*:

> the tool has to run BY ITSELF, run COMBINED with others (Synaptiq, Audion, …), and run INSIDE
> Djeli.

### 2.18 The isometric correction

**[AGENT SUMMARY of Gavin's ask]** — `src/layers/02-render/route.ts:52-56`:

> "Gavin asked for the isometric camera on CERTAIN architectural diagrams — GBFolio, DO/Cloudflare,
> IONOS — i.e. deployment topology, things that occupy somewhere. An earlier pass routed the whole
> `architecture` type to isometric, which made every diagram isometric. That is the opposite of what
> was asked for."

### 2.19 The doctrine he wrote himself

**[GAVIN, VERBATIM — his own ontology]** — `GriotMeta/griot-ontology/claude/CLAUDE.md`, the
diagram-quality-bar section, rendered as `live/griot-ontology-codex.html`:

> Prism's `griot-viz-engine` **IS** the home and it is **built and published** — layers 01–04, three
> renderers (xyflow · isometric · shell) … and reachable as the `griot_viz_engine` MCP tool
> (`render` · `layers` · `validate`) … **Call the tool.** An ASCII diagram or a mermaid fence is now
> a refusal to use the engine, not a fallback.

### 2.20 Two further attributions, labelled because they are not quotations

**[AGENT SUMMARY]** — `djeli-uxui-harvest-CONTEXT.md:36-37`: *"Gavin ruled 2026-09-13 that the Djeli
workspace map IS `Suite meta` and that tab-to-tab motion IS `Cross-cutting rails`."* No wording of
his is recorded.

**[AGENT SUMMARY]** — `src/core/layer-roles.ts:66-69`, an agent paraphrase inside quotation marks,
explicitly *"how Gavin reads the layering"*: *"Collaboration = GenTeam, Intelligence = Super Agent,
Memory = SecondBrain; Governance is the layer that is new"*. **Treat as summary, not his voice.**

**[AGENT SUMMARY addressed to him]** — `live/djeli-uxui-harvest-layer-routing.html`, the *"What your
two notes changed"* band, restating his two notes in the second person: *"The empty lanes aren't
empty because nothing exists — they're empty because the scope was five OSS repos. Those two layers
live in your own tools. That reframes wave 2 from 'more repos' to 'the other half of the canvas.'"*

---

## 3 · THE METHODOLOGY

Two taxonomies are easily conflated and must be kept apart: the **four pipeline layers** (01-04) and
the **eleven layer roles** (the output taxonomy every placed node is routed to). They are unrelated.

### 3.1 The four pipeline layers, as the cluster defines them

`live/griot-viz-engine-cluster.html`, 2026-08-03 — *"Flow: NL/schema → generate → render →
graph-substrate → interactive shell."*

| # | layer | job | named members |
|---|---|---|---|
| 01 | Generate | NL/source → diagram | archify *(adopt+graft)* · Diagram Design · Lanshu · visual-explainer |
| — | **wire** | the neutral interchange | **JSON Canvas** (added 2026-09-06) |
| 02 | Render | the right canvas per shape | react-force-graph (the prism-graph 3D renderer) · xyflow · Excalidraw |
| 03 | Substrate | what diagrams are drawn **from** | Kuzu *(→ Ladybug)* · Chat2DB |
| 04 | Interactive shell | the design target | **waku-agent** — click-any-box, every box a real module file |

### 3.2 The renderer matrix — what each is FOR

**As the docs define it** (`src/layers/02-render/route.ts:9-24`, whose own header calls the layer
subtitle *"a routing rule, not a description"* — *"The shape of the thing being drawn picks the
renderer; the user does not toggle it"*):

| renderer | the shape it owns | why | descends from |
|---|---|---|---|
| **isometric** | infra / deployment topology — GBFolio, DO/Cloudflare, IONOS | *"things with zones, tiers, racks — a floor plan reads it fastest"* | FossFLOW — **maths adopted, renderer rejected** |
| **nodegraph** (xyflow) | ordered process chains, workflows, sequences, lifecycles | *"order is the meaning"* | pre-existing, not harvested |
| **forcegraph** (react-force-graph) | code / knowledge graphs — prism-graph, the 3D renderer | *"no authored layout, structure emerges from the edges"* | — |
| **excalidraw** | freeform / hand-drawn, infinite canvas | Lanshu's format | Lanshu's `.excalidraw` emitter |
| **shell** | the UI itself — chrome, palette, canvas, inspector | layer 04's Waku surface | Griotwave-native |

The discriminator is **authored, not guessed**: archify's IR carries `diagram_type` with a separate
JSON Schema per type, so the router reads a field the generator already set (`route.ts:19-24`).
The router also refuses to let the type name decide alone — `architecture` defaults to nodegraph and
**only lifts to isometric when the document itself shows topology**, with the reason reported so the
lift is never silent (`route.ts:48-63`).

**Measured against the code — three disagreements, all in the docs' favour as intent and against
them as fact:**

1. **The engine's own flag set is `shell | isometric | nodegraph`** (`src/core/fidelity.ts:25`,
   `export const SHAPES = ["shell", "nodegraph", "isometric"] as const`). The ontology says
   *"three renderers (xyflow · isometric · shell)"* — that is the same three, naming the library
   (`xyflow`) where the engine names the flag (`nodegraph`). **Not a conflict, a vocabulary skew.**
2. **Two of four route targets are unbuilt, and the code says so honestly**
   (`route.ts:211-214`): `nodegraph: true`, `isometric: true`, `forcegraph: false` — *"prism-graph,
   react-force-graph — layer 02's third renderer, not built"*, `excalidraw: false` — *"the Excal
   writer grafted from Lanshu belongs here — not built"*. The router names what it fell back to
   rather than pretending.
3. **The router and the emitter disagree about who chooses.** `route.ts` exists and routes from
   `diagram_type`. The shipping emitter, `scripts/emit-screen.mjs`, takes `--renderer` as a **manual
   flag**. So the doctrine *"the user does not toggle it"* is implemented in a module the production
   path does not call. **Docs: routing is automatic. Code: routing exists and is bypassed.**

### 3.3 The fidelity matrix — what each level changes

**The canon** (`skills/prism-brainstorm/references/fidelity-engine.md:14-21`), sourced to
`idea_init view_translate.jsx` and copied into `src/core/fidelity.ts:45-49` so the two cannot drift.
`fidelity.ts:17-19` says of these numbers: *"Do not 'tidy' them."*

| level | vocabulary | blur | saturate | bloom | rim | radius | border | verbatim note from source |
|---|---|---|---|---|---|---|---|---|
| `lo` | sketch | 0 | 100% | 0 | .07 | 6 | **dashed** | *"structure only — dashed rims, no glass, embers desaturate to white"* |
| `mid` | structured | 8px | 118% | .26 | .09 | 14 | solid | *"color + light blur return · embers tint · depth begins"* |
| `hi` | polished | 40px | 140% | .55 | .13 | 20 | solid | *"full frost · three-layer bloom on the primary affordance · ceremonial"* |

**The ruling that made fidelity real** (`plans/2026-09-16-renderer-truth-CONTEXT.md`, restated at
`src/core/fidelity.ts:12-15`):

> a wireframe nav and a glass nav are **DIFFERENT DRAWINGS**, not the same drawing at different
> opacity. Fidelity therefore returns a **STRUCTURAL** policy — a set of decisions about which
> elements exist at all — and the CSS ramp below is what dresses whatever survived that decision.
> **Two layers, in that order, never the ramp alone.**

And the failure it exists to kill (`fidelity.ts:4-10`): *"CSS can restyle an element. It cannot
decide not to emit one. So lo/mid/hi could only ever re-tint whatever had already been drawn —
which is how a request for a UI design at hi fidelity came back as a re-skinned copy of the lane
diagram."*

**Per-shape structural policy — what is actually emitted at each level** (`fidelity.ts:112-140`).
`policyFor(shape, level)` is the one lookup: *"Shape decides WHICH drawing; fidelity decides HOW
MUCH of it exists"* (`:142`).

*shell* — lo = wireframe chrome, no glass → mid = solid structure → hi = full griotwave:

| element | lo | mid | hi |
|---|---|---|---|
| ambient ember-field · glass · routePill · statusLine · inspectorLegend · emberAccents | ✗ | ✗ | ✓ |
| pickers · buttons · paletteFilters · paletteCardMeta · inspectorValues | ✗ | ✓ | ✓ |
| canvasContent | `empty` | `outline` | `full` |

Comments carry the discipline: lo *"keeps the card, drops the meta"*; lo inspector *"emits the keys
only — a labelled skeleton"*; *"lo is monochrome by construction."*

*nodegraph* — lo = nodes only → mid = labels → hi = labels + edges + embers:

| element | lo | mid | hi |
|---|---|---|---|
| laneBands · laneLabels · nodeLabels | ✗ | ✓ | ✓ |
| nodeMeta (repo / file:line / licence) · **edges** · embers | ✗ | ✗ | ✓ |

*isometric* — lo = flat boxes → mid = depth → hi = full render:

| element | lo | mid | hi |
|---|---|---|---|
| faces | **1** (top only) | **3** | 3 |
| labels · shadow | ✗ | ✗ | ✓ |
| embers | ✗ | ✓ | ✓ |

**Direct answer to a question the docs leave implicit: edge ROUTING does not change between levels.
Edges either exist or do not, and they only exist at `hi`.**

**Measured against the code — the docs and the code now AGREE, and did not before.**
`fidelity` had **zero occurrences** anywhere under the engine's `src` on 2026-09-16 (measured,
20/20 files, case-insensitive). It now occurs 29 times, with `src/core/fidelity.ts` holding the
per-shape policy. The proof is mechanical, not asserted — `scripts/build-shape-proof.mjs` emits six
artifacts and fingerprints their tag sequence with all numbers stripped:

| artifact | elements | fingerprint |
|---|---|---|
| shell-lo | 149 | `7acfecf80022d233` |
| shell-mid | 255 | `43d8b74482031050` |
| shell-hi | 316 | `5a729ddacd5b0f5d` |
| nodegraph-lo | 126 | `fbe2766aa9932980` |
| nodegraph-mid | 186 | `ee182f9a84a91148` |
| nodegraph-hi | 280 | `ab97f853a1c13d7a` |

Before the fix, **shell-mid and nodegraph-mid both hashed `b90fd90fa9c69bee` at 194 elements — the
same drawing under two flags.** That collision is gone; 15 pairs compared, 0 structurally identical.
The chrome lift is **gated**, not trusted: `scripts/check-chrome-drift.mjs` exits 0 on 45 spec'd
classes and goes red if `Shell.tsx` renames one.

### 3.4 The eleven layer roles — the output taxonomy

`src/core/layer-roles.ts:16-28`, copied **byte-verbatim** from the `LNAME` array in
`griot-ontology-codex.html` (The Griot Stack, artifact `c389ca6c`). The file's own instruction:
*"Do not retype these by hand and do not 'tidy' the punctuation — the emitter, the canvas, and the
plan all key on exact string equality."*

```
Djeli · container            Collaboration · GenTeam      Creation · build/content/3D
Capture                      Intelligence · Super Agent   Governance · Governor
Model-making / data science   Memory · foundation          Deployment
Suite meta                   Cross-cutting rails
```

**`unplaceable`** (`layer-roles.ts:32-33`): *"A finding that fits no role is flagged, never
force-fit into a tenth."* It is a first-class `LayerSlot`, not an error state, and its ember
`#6b7385` is the only desaturated slate in the set — an unplaced finding is **visibly colourless**.

**Nine became eleven, and the lesson is in the mechanism.** `Suite meta` and `Cross-cutting rails`
were absent from the emitter's enum, so **the engine's own validator rejected Griot Ontology, Client
work, Meridian, Griotwave and Prism** — exactly the tooling that has to sit on this canvas. It
survived because *"7 of 11 layers filled"* was reported honestly and repeatedly, which made a
**validator bug look like a data gap**. The shipped handoff states the lesson plainly: *"An
honest-looking number is worse than either, because it stops anyone investigating."*

**Docs-vs-code disagreement, still live.** `live/djeli-uxui-harvest-layer-routing.html` renders
**nine**; the code declares **eleven**; `A1` reports *"7 of 11 filled."* The two added roles are
named in `.prism` contracts and in code but **appear in no file under `live/`**.

**One thing the docs never say, and the code does: role assignment is a DRAG, not an algorithm.**
`Canvas.tsx:13` states it — *"drag a node across a lane → its layer role is REASSIGNED"* — with
`laneOf(y)` indexing into `ALL_SLOTS` (`:66-67`) and `onNodeDragStop` → `onReroute` (`:159-166`). The
routing act and the editing act are the same screen. `ALL_SLOTS` is the eleven roles **plus**
`unplaceable` = **12 lanes**, so the unplaceable lane is a real band a node can be dropped into.
`IsometricView.tsx:28-33` carries the reason this matters: archify components arrive `unplaceable`
**on purpose**, because *"a layer role is Gavin's to assign and must never be guessed."*

### 3.5 The design layer — four seats, one engine

`src/core/motion.ts:5-20` states the thesis: *"The point of griot-viz-engine is not four tools side
by side; it is their motion design and methodologies **fused into one coherent thing**."*

| seat | source | what it owns |
|---|---|---|
| **THE LAW** | diagram-design | four modes, the token clock, eight semantic primitives, static-first, reduced-motion and print discipline |
| **THE CAMERA** | FossFLOW | GSAP `power1.out` at 0.25s, translate+scale tweened with the grid so the floor moves with the camera |
| **THE TOKENS** | Lanshu | glow dots, `pulse_rect` phase maths, sequential module activation |
| **THE RUNTIME** | archify | Reading Depth, the interaction inventory, the Motion Governor — the fourth seat, added 2026-09-11 |

**The clock**, adopted verbatim from diagram-design (`motion.ts:77-93`): `fast 160` · `step 480` ·
`hold 720` · `maxTotal 8000` · `ease cubic-bezier(.2,.8,.2,1)` · `camera 250`, the last
*"deliberately NOT one of the semantic tokens above: the camera is chrome."*

**The motion budget, enforced not documented** (`:102-111`): `maxSteps 8` · `targetSteps [3,6]` ·
`maxItems 12` · `maxSimultaneous 2` · `maxDrawnPaths 2` · `maxFlowTokens 1` · `minLoopCycle 3000` ·
`translateMax 24`. `validateMotion()` returns `{rule, problem, fixes}` — archify's diagnostic
envelope reused: *"collect everything, coerce nothing."*

**The four rulings recorded at the site of the code they govern.** These matter because the ontology
requires conflicts to be ruled explicitly and written down:

1. **The glow conflict, ruled 2-1** (`motion.ts:45-62`). diagram-design `animation.md:46` forbids
   glow outright; visual-explainer bans it independently; **Lanshu is built on it.** Ruling: *"the
   law wins on SEMANTICS, Lanshu's primitives survive as DECORATION under it"* — a glow may never
   encode meaning, is always `aria-hidden`, runs only in `loop` mode at ≥3s, is first dropped under
   reduced-motion, and never appears in an export. Recorded **as 2-1 rather than laundered into
   consensus.**
2. **The GIF ruling** (`:22-43`). Lanshu ships motion as a 41-frame 6-8 MB GIF. *"That is a DELIVERY
   LIMITATION, not a design decision … The vocabulary is the asset; the baking is the loss."* Ruled:
   the vocabulary runs **realtime under archify's Motion Governor, never pre-rendered.** And it
   settles animated-vs-static as **a property of the MODE, not the engine**: `loop` may breathe,
   `none`/`reveal`/`step` are documents and may not.
3. **The law's floor beats Lanshu's cadence** (`:322-329`). Lanshu's native loop is 2050 ms, under
   the 3000 ms floor, so a faithful loop must be slowed — *"recorded rather than silently retimed."*
4. **FossFLOW: adopt the maths, reject the renderer.** The projection is ~25 lines of 2×2 arithmetic,
   true 30° isometric (1.415 ≈ √2, 0.819 ≈ √2/√3), no WebGL, no CSS-3D. The lattice was rejected:
   *"The lattice is the point, and the lattice is not ours."* GSAP itself was reimplemented on rAF
   *"for one reason only: GSAP arrives with FossFLOW's whole MUI/Emotion/Paper/Quill stack … Same
   curve, same duration, no tree."*

**The three design ideas most worth keeping, all from the harvests:**

- **`power1.out` IS the instrument feel** — *"the decelerating curve makes panning feel like the
  canvas has weight and settles … That lag *is* the instrument feel."* And its inverse: the drag
  ghost gets **zero** smoothing, because *"the same easing that makes panning feel good makes
  dragging feel wrong."*
- **The first-render guard** (`motion.ts:171-173`) — *"the scene must not animate into existence, but
  every subsequent change eases. An engine that fades in on load feels like a slideshow; one that
  snaps on load and glides thereafter feels like an instrument."*
- **Reading Depth, and the six words the engine calls its whole philosophy** —
  *"Reader intent outranks the global zoom level."* Three levels carried as `data-detail-level`:
  MAP below 100%, READ at 100%, FULL at 175%, and **nothing moves** — only detail resolves.

**One structural finding worth stating because it explains the whole pipeline's polarity**
(`research/2026-09-11-lanshu.md:743-746`): *"In Lanshu the file falls out of the drawing; in ours the
drawing falls out of the file."*

---

## 4 · WHAT WAS BUILT VERSUS WHAT WAS ENVISIONED

The cleanest way to measure this is against the thesis, clause by clause, because Gavin wrote four
requirements into one sentence and they have very different completion states.

### 4.1 The thesis, measured clause by clause

| clause | state | evidence |
|---|---|---|
| *"draws diagrams **from** real substrate"* | **NOT BUILT** | `loadFromGraph` **throws** (`harvest-adapter.ts:232-237`). Layer 03 has never returned a row. |
| *"renders them on the right canvas per shape"* | **HALF BUILT** | Router is real and reads `diagram_type`; 2 of 4 renderers built; **the shipping emitter takes a manual `--renderer` flag and never calls the router.** |
| *"interactive, source-wired surfaces in the Waku mold"* | **HALF BUILT** | Click-to-source works, 27/27 nodes carry `data.origin.file`+`line`, fail-closed proven. Live trace (*"a box glows when its code runs"*) is a type signature with no implementation. |
| *"not static SVGs"* | **CONTRADICTED IN PRACTICE** | `renderer-truth-CONTEXT.md` Decision 8: **"STATIC IS THE DEFAULT. No motion in this run."** `meta.animation "trace"` deferred. The entire four-seat motion layer has no runtime consumer in the emitter. |

**This is one headline gap.** The most rigorously specified part of the engine — the motion layer,
four seats fused, three conflicts formally ruled, a budget with a validator — is **authored and
almost entirely unconsumed.** Measured: `IsometricView.tsx:49` uses `MOTION`, `pulseIntensity`,
`activeIndex` and `decorativeAttrs`; `Shell.tsx:45` uses `motionCssVars`. Everything else in
`motion.ts` — `validateMotion`, `planMotion`, `motionCapable`, `breathingAllowed`, `READING_DEPTH`,
`depthForZoom`, `tweenCamera`, the whole `LANSHU` parameter block — has **zero callers.** The Motion
Governor, the budget validator and Reading Depth are doctrine waiting for a caller.

### 4.1b The sharper gap — the per-shape canvas and structural fidelity are UNREACHABLE from the MCP tool

This is the finding that most changes the picture, and it is measured in the dispatch code, not
inferred.

The ontology instructs every agent to **call `griot_viz_engine`** rather than write ASCII. The MCP
server says the same in its own `instructions` string. But `digital-griot-mcp.ts:1236-1243` builds
the emitter's argv as:

```
[ emit-screen.mjs, ("--in" <path> | "--self"), ("--title" <t>)?, "--out", <contentDir> ]
```

**It never passes `--companion`, `--renderer` or `--fidelity`.** And `emit-screen.mjs:154` gates the
entire fragment path on `if (!COMPANION)`. So:

- every MCP `render` call takes the **full-document lane-diagram path**;
- that path reaches **neither `fidelity.ts` nor `chrome.ts`** — no per-shape canvas, no structural
  fidelity, no chapter rail, no chrome;
- and it uses a **hand-typed duplicate** of `LAYER_ROLES`/`EMBER` at `emit-screen.mjs:70-83`, flagged
  as a known duplication in its own comment at `:33-38`, rather than the source of truth in
  `layer-roles.ts`.

**The `--companion/--renderer/--fidelity` flags have exactly one caller in the whole repository:**
`scripts/build-shape-proof.mjs:53` — the proof harness.

So the work that closed B7 and B17's fidelity half is real, committed, gated and proven — and it is
reachable only by running the proof script by hand. Through the door the ontology tells agents to
use, the engine still emits exactly the re-skinned lane diagram that `renderer-truth-CONTEXT.md` was
written to eliminate. **The defect was fixed in the engine and not wired to the entrance.** That is
the single highest-value, lowest-cost gap in this document: the fix exists, and three flags are
missing from one argv array.

Corroborating the same shape one level up: `policyFor()` has **exactly one consumer** in the codebase
(`emit-screen.mjs:536`). The interactive React shell imports no fidelity at all — grep for `fidelity`
across `src/**/*.{ts,tsx}` returns only `core/fidelity.ts` and `04-shell/chrome.ts`. **Fidelity is an
emitter-path feature, not a runtime-app feature.**

### 4.2 Layer 03 — the substrate gap, and why it is the deepest one

The thesis's first clause is the engine's reason for existing: diagrams drawn **from** real
substrate rather than authored by hand. It is the clause with the least code behind it.

What happened, in order: the seam threw for months on the premise that Kuzu was `trial · next`;
**Kuzu was archived 2025-10-10** (Apple acquired Kùzu Inc.; all 24 org repos archived) so it was
never landing; and **the substrate was already on disk** — `.gitnexus/lbug`, a LadybugDB holding
this repo's whole code graph, indexed 2026-07-12 and **never queried once**. Eleven months unnoticed.

What was fixed: renamed `loadFromGraph`, `loadFromKuzu` kept as a deprecation alias, and
`describeGraphSubstrate()` added so the throw now carries the substrate's measured state — *"it no
longer refuses to LOOK."*

**What is still missing: the Ladybug client binding.** The shipped handoff calls it *"a build task,
not a decision."* Until it exists, every canvas the engine draws comes from `adaptHarvest()` over a
harvested JSON array — which is real data with real `file:line`, but it is **harvested, not queried**.
The engine reads a file someone else produced; it does not interrogate a graph.

The size of what is sitting unqueried is recorded in the adapter's own docblock
(`harvest-adapter.ts:159-172`): `.gitnexus/lbug` is a **351 MB LadybugDB** holding **2,645 files /
39,798 nodes / 90,788 edges / 1,731 communities / 300 execution flows** — *"Indexed 2026-07-12 and
never queried once."* `loadFromKuzu` is now a deprecation alias for `loadFromGraph` (`:247`), and the
seam returns a `GraphSubstrate` fact-report (`:173-185`) instead of a bare throw. **The honesty rule
held throughout: it has never returned an invented row.**

### 4.3 The coverage gap — 7 of 11 layers, and the reframe that matters

27 nodes, all with `file:line` origins, routed to **7 of 11** layer roles. Two causes, and only one
was the enum:

- **Cause 1 (fixed):** the emitter gated on nine roles, so `Suite meta` and `Cross-cutting rails`
  findings were rejected.
- **Cause 2 (the real one, not fixed):** all five Stage-2 targets were Djeli-lineage repos —
  genoffice 13 nodes, orca 4, djeli 4, block-buzz 6. *"None of those repos IS Suite meta,
  Cross-cutting rails, Model-making or Memory, so no finding in those layers could arise no matter
  what the enum allowed. Re-running the same five targets will still yield seven layers."*

Filling the other four is a **scope extension**, and the targets are already named and on disk:
Suite meta ← `GriotMeta/griot-ontology` and `GriotClients`; Cross-cutting rails ← `GriotApps/Meridian`,
`griotwave`, `GriotApps/Prism`; Memory · foundation ← `GriotApps/Synaptiq`; Model-making ← `GriotMeta`.
**Nothing has run them.**

The reframe on the two hardest lanes, from `layer-routing.html`: *"The empty lanes aren't empty
because nothing exists — they're empty because the scope was five OSS repos. Those two layers live
in your own tools. That reframes wave 2 from 'more repos' to 'the other half of the canvas.'"*

### 4.4 The six axes — every component exists, zero joins made

B17 is the specification and its own honest state is the gap. Measured today:

| axis | component | exists | joined |
|---|---|---|---|
| DATA | the capture's node/lane pairing (`localId` + `originLane` + `group` + derived `direction`) | ✓ | ✗ — **the renderer does not read the capture's lanes** |
| RENDERER | `shell \| isometric \| nodegraph` | ✓ | partial — router bypassed by the emitter |
| FIDELITY | lo/mid/hi, structural since 2026-09-16 | ✓ | ✓ *inside the engine* — B17's "unused outside the companion" is now **stale** |
| CHAPTERS | archify `meta.views`, ≤5, authored at `uxui-canvas-views.json` (5/5 validated) | ✓ | ✗ — **A4 still reads `written-not-launched`**; stepping a chapter never verified live |
| PAYLOAD | OpenUI's generative-UI shape | ✗ | hand-rolled as `griot-widget` `render()`, not conformant |
| WIRE | AG-UI's event protocol | ✗ | hand-rolled as `griot-widget` `drive()` over `:52342`, not conformant |

**The one structural blocker:** the edges are `A4 awaits B11` and `B17 awaits B11`, where B11 is the
`/design` ceremony gate. **Nothing on this rail can proceed headlessly — by node structure, not by
convention.** The 2026-09-16 handoff states it: *"B17 is explicitly a /design ceremony decision
(B11), NEVER a headless one."*

### 4.5 The gap that matters most — the engine is wired to emit and never to be consumed

`live/_drift/drift-entries.json`, entry `viz-engine to harvest to harvest-ux-ui loop is unused`,
filed 2026-09-20, state `flagged`:

> "The pipeline was built to capture Gavin's own UX/UI design judgement as it fires during
> exploratory prototype work - render via prism-viz-engine, capture via griot-harvest, distill via
> griot-harvest-ux-ui - so **20+ years of design expertise gets turned into reusable workflow** …
> The code graph confirms the wiring gap: prism-viz-engine is classified layer=entry,
> **outbound-only - nothing calls into it**, so it is wired to emit, never to be consumed
> downstream by harvest."

Set beside §2.3 — *"i see prism-viz-engine turning into a very important piece of Griot tooling
everywhere"* — this is the largest distance between vision and reality in the corpus. The engine
was built to be the instrument through which his design judgement becomes reusable. It renders. The
loop that would capture what it renders has never closed.

### 4.6 What was genuinely delivered, and it is substantial

Against all of the above, the built surface is real and should not be undersold:

- **Four layers, published.** `griot-viz-engine@0.1.0` (registry name `prism-viz-engine`), MIT,
  59.3 kB / 23 files, React 18 as a **peer** dependency.
- **The MCP tool is live.** `griot_viz_engine` canonical with `prism_viz_engine` **derived by spread**
  in `ListTools` so the two schemas cannot drift; both `case` labels reach one handler. Three modes —
  `render` (shells out to the emitter, writes into the live companion, returns the URL), `layers`
  (reads `LAYER_ROLES` from source, never retyped), `validate` (reports UNFILLED rather than
  inventing). The server's own instructions now tell a connecting agent to call it *"rather than
  writing ASCII."*
- **The companion fusion works, and was proven in a browser.** Commit `56b8c05`: the engine's screen
  renders inside the brainstorm frame, LAYERS/TIMELINE/WORKGRAPH seeded at genesis, node-click
  writing a real event. Gold entry: *"The engine had been producing output nobody was looking at;
  after this run there was a screen you could open, click a node in, and watch write a real event.
  It stopped being described and started being seen."*
- **Fidelity is structural and gated**, per §3.3 — six artifacts, six distinct fingerprints, a
  chrome-drift gate proven in both directions.
- **The isometric renderer is real**: `isometric.ts` 149 lines of true 30° projection, `IsometricView.tsx`
  288 lines over the same JSON Canvas, `icons.ts` branching on `isIsometric` between anchored and
  decal scales — *"the two paths, not averaged"* — because only **37 of 1062** isopack icons are
  genuinely isometric.
- **The design layer was DECLARED whole, not stripped** — and this needs stating precisely, because
  the honest version is more interesting than the flattering one. The engine's `dependencies` block
  keeps all 21 of `@mui/material`, `@emotion/react`, `@emotion/styled`, `gsap`, `paper`,
  `@isoflow/isopacks`, `mui-color-input`, `pathfinding`, `chroma-js`, `react-quill`, `zustand`,
  `immer`, `zod`, `@xyflow/react` and the rest — the ontology's never-strip-a-dependency rule honoured
  in the manifest. **But only two of the 21 have import sites in the engine's source:**
  `@xyflow/react` (`Canvas.tsx:43-44`, `ComponentNode.tsx:17`, `Inspector.tsx:13`) and
  `@isoflow/isopacks` (`icons.ts:66-70`, five dynamic subpath imports). The other 19 have **zero**.
  GSAP in particular is declared at `package.json:66` and appears in the source only as two
  *comments* at `motion.ts:186-187`, because the camera tween was deliberately reimplemented on rAF
  (`tweenCamera`, `motion.ts:198-229`, easing `power1Out = t => 1 - (1-t)*(1-t)`) *"for one reason
  only: GSAP arrives with FossFLOW's whole MUI/Emotion/Paper/Quill stack, and this is the one
  function of it we need. Same curve, same duration, no tree."* So the tree is **retained as the
  reference the harvest rule requires, not consumed** — which is defensible and deliberate, but it
  means the design layer is present as *specification*, not as running code.
- **C4, the working hub screen**: the 78-node branch graph as wires, five chapters that dim and
  undim, lo/mid/hi that changes what is drawn, a top-anchored gavel drawer, node-click inspector —
  the demonstration that the pieces compose.

### 4.7 Envisioned and never started

| item | source | state |
|---|---|---|
| **tablet companion** — penecho + drawesome feeding Synaptiq notes | §2.4 | shelf rows only (`Drawesome`, srcName *"Gavin - griot-viz-engine sourcing 2026-09-06"*). No layer, no code. |
| **the design-layer decision** — Instatic vs Orca's design layer vs prism-design-engine vs OpenDesign | §2.6 | **never answered.** The assessment he asked for was never run. |
| **design-memory** (`interface-design` / `system.md`) — decisions that persist and reapply | §2.6 | placement still undecided: generators, or Djeli's own UI. |
| **the IA → wireframe → userflow → polished-UX band** | §2.6 | hole verified across 1,149 tools; `wireframe-ui` and `json-render` shelved and tagged to the engine; **no harvest pass run.** |
| **JSONCrack** as the JSON renderer over our own substrates | designs 2026-09-06 | on the shelf (Apache-2.0, surveyed not recalled); never built in. |
| **Reading Depth** / adaptive reader width | close handoff item 4 | *"Harvested and fully specified (`template.html:4130-4181`), not applied. Highest-value unapplied finding."* |
| **Liveline's one-loop-one-lerp** discipline | node B21, `decision: trial` | named as the thing that would make the suite's surfaces *"one thing breathing rather than a bunch of parts updating independently."* Not adopted. |
| **the real infrastructure diagram** | close handoff item 5 | **blocked on Gavin's data, nothing invented.** Verified: the Cloudflare account/worker/R2, the relay, `open-design` on `127.0.0.1:7456`. Missing: DigitalOcean entirely, Coolify's host, IONOS, GBFolio's deployment, the DNS zones. |
| **the dual-pane** — graph and UI side by side, one control | §4.8 | built **once, as a brainstorm screen**, not in the engine. |

### 4.8 One item worth separating out — the dual-pane

Gavin's standing ask, parked repeatedly, then built on 2026-09-11 as
`vizclose-1789138640/content/08-fidelity-dual-pane.html`: the archify graph and the UI itself in
**one content area**, with **a single control driving both**. The reasoning recorded for the single
control: *"separate toggles let the panes drift, and then the picture of the system and the picture
of the screen disagree about which decisions are made. Both resolve together or neither does."*

**Why it is still a gap:** it lives in a gitignored brainstorm session as one HTML file. It is not a
renderer, not a mode, not in `SHAPES`, not reachable from the MCP tool. The thing that was verified
*"in lockstep across all three rungs"* exists only as an artifact of the session that made it.

---

## 5 · OPEN AND SUPERSEDED

### 5.1 Superseded — a later document overturned an earlier one

| # | the earlier claim | superseded by | note |
|---|---|---|---|
| 1 | **npm name `prism-viz-engine`, unscoped, "LOCKED"** (vizclose Q1, 2026-09-11) | **`griot-viz-engine`**, Gavin ruled 2026-09-13 | The nomenclature rule. `prism-viz-engine` is a **deprecation alias that resolves** in exactly three places: the npm package, the MCP binding, module imports. |
| 2 | `@griot/prism-viz-engine` | unscoped `prism-viz-engine` | The `@griot` scope 404s; the account holds no organisations. Verified against the registry, not assumed. |
| 3 | **A4 Decision 1's reasoning that the directory must stay** `apps/prism-viz-engine` | **commit `460d0a2`, 2026-09-23** | Recorded in the package's own `griot` block: *"DECISION SUPERSEDED 2026-09-23 … the three hard-path resolvers this note originally cited as the reason to hold still are exactly the three that moved together."* Directory is now `apps/griot-viz-engine`. |
| 4 | **Kuzu** as layer 03's substrate (`trial · next`) | **LadybugDB** (`adopt · now`), forked `TheDigitalGriot/ladybug` | Kuzu archived 2025-10-10. 299 MB of docs/mcp-server/text2cypher/wasm **preserved** at `GriotMeta/kuzu-archive`. |
| 5 | **Nine** layer roles | **Eleven**, byte-verbatim from `LNAME` | Our own validator was rejecting our own tooling. |
| 6 | *"archify has no `viewer/` directory"* | **our vendored copy was a 68-file subset** of a 542-file project | *"We vendored the PACKAGE and reasoned as if we had the PROJECT."* A file-count check catches truncation, not **scope mismatch** — which is the failure that actually occurred. |
| 7 | **diagram-design ranked as THE LAW above archify** | **archify is THE TRUTH**; diagram-design is the reasoning/figure law | Gavin's correction 2026-09-11. *"a sequencing accident that became an architecture."* Ranking them the other way *"inverted the whole harvest."* |
| 8 | FossFLOW's ease as `easeOutQuint` | **`power1.out`** — gsap's default, because neither `gsap.to()` call specifies an ease | *"a guess at the feel rather than the measured curve."* |
| 9 | *"nothing is lost"* | **"it is written down"** | Gavin: *"you've said that literally for 6 months and look what turned up lost today."* Everything that turned up lost was already on disk. Storage was never the failure mode; **retrieval** was. |
| 10 | *"graphify and GitNexus are the same idea"* | a deliberate **dual-index with a licence wall** | STRUCTURAL = codebase-memory-mcp (shipped). SEMANTIC = GitNexus (PolyForm Noncommercial, local-only, never bundled). graphify is a third thing: any-input-to-graph. |
| 11 | I12 as one check | **split into I12 (freshness) + I15 (capability health)** | One fix was invisible behind the other. *"A check that is permanently red is a check nobody reads."* |
| 12 | *"FossFLOW isometric — harvested, not built"* (a parked item) | **FALSE ITEM** — it was already built | *"carried from a todo note rather than checked against the repo."* It was one step from being rebuilt. |
| 13 | the Sep-5 djeli-codex lineage denial | **overturned** in commit `5aba992` | Djeli AND Prism are both forks of Orca; Djeli is the container, GenOffice the office surface. Do not reintroduce from an older source. |
| 14 | node **N6** *"Memory · foundation unfilled"* as a discovery | `superseded` / `reframed-not-newly-discovered` | The lane is empty because it is the **load-bearing** one. |

**One node is stale in the other direction — worth flagging because it understates what exists.**
`A4` still reads `state: open` / `stateDetail: written-not-launched`, and B17 still says fidelity is
*"verified but unused outside the companion."* Both were true when written. Since then: the
renderer-truth stage **ran** on 2026-09-16 (heartbeat `DONE_RENDERER_TRUTH`), the rename **landed**
(`460d0a2`), and the fidelity/chrome/chapters code **committed** in `d114d3b`. `fidelity.ts`,
`chapters.ts` and `chrome.ts` are in `HEAD` today. The workgraph's own filing note explains the lag
honestly: N30 was filed while the Prism-side code was **uncommitted**, so *"no commit sha anchors it
yet and B7/B17 are deliberately NOT advanced in this pass."* **The sha now exists; the advance was
never made.** What genuinely remains of A4 is the **live** chapter-stepping verification, not the
code.

### 5.2 Open — left unresolved by every document that touched it

**Decisions that are explicitly Gavin's and were never made:**

1. **B11, the `/design` ceremony** — the gate both A4 and B17 await. Structurally blocking.
2. **Three code-intel graphs, no single owner** — `codebase-memory` (SQLite), `.gitnexus/lbug`
   (Ladybug, 43,405 nodes), `.code-review-graph` (SQLite, 29,339). Only `code-review-graph` is MIT
   and therefore distributable; GitNexus is PolyForm Noncommercial and can never ship inside a
   plugin. *"Which is the substrate, which is the interface, and which retires is undecided — and
   that undecidedness is why all three sit idle rather than any one being maintained."*
4. **The design-layer contest** — four candidates, no decision (§2.6).
5. **The superseded cluster duplicate** — `live/_superseded/prism-viz-engine-cluster.html` is
   byte-identical to the live file bar three name strings. The drift ledger says outright the ruling
   is Gavin's and was deliberately not inferred from a 0.989 similarity score.
6. **The npm publish + deprecate pair** — printed, never run, per A4 Decision 3.

**Build tasks, not decisions:**

7. **The Ladybug client binding** for layer 03 (§4.2).
8. **`forcegraph` and `excalidraw`** renderers — declared in the router, `false` in `RENDERER_BUILT`.
9. **The emitter should call the router** rather than take `--renderer` as a manual flag (§3.2).
9b. **The MCP `render` argv should pass `--companion --renderer --fidelity`** (§4.1b). Three flags in
    one array at `digital-griot-mcp.ts:1236-1243`. This is the cheapest high-value fix in the document.
9c. **`emit-screen.mjs:70-83` hand-types a duplicate of `LAYER_ROLES` and `EMBER`** for the
    full-document path, flagged as a known duplication in its own comment at `:33-38`. The companion
    path imports the real ones from `layer-roles.ts:39`. Two sources of truth for a list whose whole
    point is byte-exact string equality.
9d. **`skills/prism-gavel/scripts/server.cjs.pre-gmcl-b1.bak`** is still on disk.
10. **`meta.animation "trace"`** — the motion switch deferred by renderer-truth Decision 8, and with
    it the entire consumption of `motion.ts`.
11. **Waku Wiring C** — `subscribeTrace` is a type with no implementation.
12. **Reading Depth / adaptive reader width** — specified at `template.html:4130-4181`, unapplied.
13. **The wave-2 harvest** for the four unfilled layer roles — targets named, never run (§4.3).
14. **The IA → wireframe → userflow harvest pass**, routed to Lucid (§2.6).
15. **AG-UI / OpenUI conformance** — direction settled, adoption open.
16. **`route.ts` `topologyScore` duplicates `deploymentOwnershipDiagnostics`** — that function is
    node-only and by render time the IR is gone. *"The fix is designed and deliberately not
    half-built."* They agree on every example tested, *"not the same as guaranteed."*

**Hygiene and record defects:**

17. **`vizclose-1789138640/state/decisions.json` is gitignored** — 45 KB, 26 decisions, 14 parked,
    no durable home. Workgraph defect `defect-gitignored-decisions`, open. **This is why the vision
    was hard to find, and it will be hard to find again.**
18. **`live/griot-viz-engine-cluster.html` is `mounted: false`** — no `SURFACES[]` row, no tab, no
    eager iframe, no owner skill, despite being the document that specified the engine before any of
    it was built. It was an orphan once already and was only registered on 2026-09-06.
19. **The published cluster artifact's title is still `prism-viz-engine — assembled cluster`**, and
    `artifact-index.html` renders the stale title. The repo file's `<title>` is correct.
20. **`live/djeli-uxui-harvest-layer-routing.html` renders nine roles**, not eleven (§3.4).
21. **`apps/griot-viz-engine/README.md` says `npm install prism-viz-engine`** while its own import
    examples use `griot-viz-engine`. Checked against the registry today: `prism-viz-engine@0.1.0` is
    **published**; **`griot-viz-engine` is 404.** So the install line is *accurate*, the import lines
    do not resolve for anyone outside this workspace, and the doc is internally inconsistent — a
    one-line fix once Gavin runs the publish.
21b. **`main` is `./src/index.ts` with no build output, no `types`, and no `prepublish`.** The
    published package ships raw TypeScript. Workable in a TS/Vite host; an obstacle anywhere else.
22. **`emit-screen.mjs:157` and `:196` still emit `prism-viz-engine`** in the full-document `<title>`
    and footer — **an explicit deferral**, because those lines sit inside the block whose
    byte-identity is the renderer-truth proof.
23. **LadybugDB VECTOR is disabled on this platform** — semantic search over the code graph does not
    work on this machine. I15 fails on it, correctly. Gap 3 from the 2026-04-11 research, still open.
24. **`OA22`** — brainstorm-hub port 51900 vs the documented 52341.
25. **`.mcp.json` `code-review-graph`** uses plain `uvx code-review-graph serve`, which falls back to
    keyword-only; needs `--from "code-review-graph[embeddings]"`. One-line fix.

---

## 6 · COMPONENT SHAPE — is any of this a drop-in?

**Short answer: the ENGINE is designed as a drop-in and is close to being one. The gavel exists as a
drop-in component but in a different repo and a different package. The Selectah board is not a
component at all. And there are THREE different component contracts in play with no single answer.**

### 6.1 The engine — yes, deliberately, and the seam is documented

`src/core/mount.ts` is the whole answer, and it opens by naming the requirement as Gavin's (§2.17):
*"the tool has to run BY ITSELF, run COMBINED with others (Synaptiq, Audion, …), and run INSIDE
Djeli."* Its design consequence, stated in the file:

> "So the engine exports one function and owns no window, no router, no global state. The host
> supplies the element; the engine fills it. That is the entire contract."

The API:

```ts
mountVizEngine({ element, host?, canvas?, sources?, onChange?, reveal?, subscribeTrace? })
  -> { load(canvas), snapshot(), destroy() }

type VizHost = "standalone" | "composed" | "djeli" | "vscode" | "cowork"
```

Four properties that make it genuinely mountable rather than nominally so:

- **`detectHost()` reads hard signals, never guesses** — `acquireVsCodeApi` → vscode,
  `djeli.tabs || aiOffice` → djeli, `claude.sendPrompt` → cowork, `parent !== window` → composed,
  else standalone. *"the same discipline as the env beacon."*
- **The host owns persistence.** `onChange` fires on every mutation; *"the engine never writes."*
- **Capabilities degrade honestly.** *"A box that cannot reveal its source is a picture of a module,
  not the module. Hosts that can reveal supply `reveal`; hosts that cannot leave it undefined and
  the engine hides the control rather than offering a dead button."*
- **React 18 is a peer dependency** — *"so Kweli, Djeli, Prism and Synaptiq mount one engine instead
  of drifting three copies of one."* And the `exports` map allows a **data-only** import with no
  React and no xyflow in the consumer's bundle:

```
"."              -> src/index.ts          (full engine)
"./mount"        -> src/core/mount.ts     (the seam)
"./json-canvas"  -> src/core/json-canvas.ts   (validate, emptyCanvas — no React)
"./layer-roles"  -> src/core/layer-roles.ts   (LAYER_ROLES, isLayerRole — no React)
"./motion"       -> src/core/motion.ts        (the design layer as data)
```

**The honest blocker, recorded in the file rather than glossed** (`mount.ts:12-19`):

> "The Djeli codex records an OBSERVED gap, not an inference: the shell's tab registry is CLOSED — a
> `TabKind` union, hand-written openers, a hardcoded `routeDocumentPath`, no IPC channel that takes a
> module id, and a default-deny navigation guard. So today mounting a Griot panel in Djeli is 'a
> compile-time fork edit at ~6 sites, not a plugin install.' This file does not pretend otherwise."

So: `host: "djeli"` is wired and correct on the engine's side; **the six-site fork edit is Djeli's
work**, tracked there.

**Four measured caveats on how drop-in it actually is today:**

1. **`main` is `./src/index.ts` — raw TypeScript, no build output.** There is no `types` field, no
   `module` field, and no `prepublish`/`prepare` script; `scripts.build` is `vite build` and nothing
   runs it before publish. A consumer must transpile the engine's TS itself. That is workable inside
   a Vite/TS host and a real obstacle for anything else.
2. **`Shell`, `Canvas` and `IsometricView` are not in the `exports` map.** They are exported from
   their own modules but unreachable by subpath, so a host cannot mount just the canvas — it takes
   `mountVizEngine` whole or it takes data only. `mountVizEngine` is also an **imperative async
   function**, not an exported React component or a custom element: it dynamic-imports
   `mount-react.tsx` and returns a handle (`mount.ts:127-130`).
3. **Nothing in this repository imports the engine as a package.** Grepped across
   `**/*.{ts,tsx,js,mjs,cjs,json}`: zero importers of `griot-viz-engine` or any of its five export
   subpaths. Every in-repo engine import is *inside the engine* or its own `scripts/`; every
   out-of-engine reference is a **path string or a spawn**, not an import — `digital-griot-mcp.ts:1093`
   joins the directory, `:1138` reads `layer-roles.ts` as **text**, `:1220` spawns `emit-screen.mjs`.
   The mount seam has **no first consumer.**
4. **The npm identity is split.** `prism-viz-engine@0.1.0` is published (and carries the same
   `exports` map and React peer deps); **`griot-viz-engine` returns 404 — it is not in the registry.**
   So the canonical name does not yet resolve for anyone, and the README's `npm install
   prism-viz-engine` line is *accurate* while its adjacent import examples say `griot-viz-engine`.
   Per A4 Decision 3 the publish is Gavin's; the commands are printed in
   `.prism/local/griot-viz-rail-report.md`.

**One duplication worth naming:** the engine's `mount.ts:82-120` exports its own `drive()` — a
four-rung ladder (mcp-app postMessage → `sendPrompt` → `POST 127.0.0.1:52342/wake` → clipboard). So
does `packages/griot-widget/drive.cjs`, with the same ladder. Two implementations of B17's WIRE axis
live in one repo, in two module systems, and neither imports the other.

**The intent is recorded in three more places, consistently:**

- `viz-companion-fusion-CONTEXT.md` **Decision 8** (Gavin, mid-run): *"TAB-SHAPED, NOT
  SESSION-SHAPED. The surface must be hostable inside another shell, not only served by server.cjs
  on a session port. `src/core/mount.ts` is therefore first-class, not a companion-only detail — it
  is the seam Djeli mounts through."* Plus two constraints: the panels *"must survive being
  embedded: no assumption that the frame owns the whole viewport"*, and the state channel *"must be
  addressable by a host that is not the brainstorm server."*
- `live/djeli-codex.html`, the harvest row: *"Mounts as a Djeli PANEL — the canvas where every box
  is a real module file that opens. React 18 peer dep so the container supplies it."*
- `live/djeli-codex.html`, the gortex ruling: *"Lift L2 as the Griot Operations / Ceremonies tab
  (workgraph S13), **rendered through griot-viz-engine rather than a fourth graph UI**."* That is the
  clearest statement anywhere that the engine is meant to be the shared renderer other surfaces mount
  rather than each building their own.

The package description says it outright: *"Mounts standalone, composed into another app, or inside
the Djeli container."*

### 6.2 `packages/griot-widget` — a different contract, and it is NOT a viz-engine wrapper

This is worth stating plainly because the name invites the assumption. Measured:

```json
{ "name": "@griot/widget", "version": "0.1.0", "private": true,
  "main": "render.cjs", "license": "UNLICENSED",
  "description": "Griot Widget Contract primitive — render() + capability manifest + registry
                  (the surface-aware widget comm layer). Epic griot-mcp-comm-layer, phase C core." }
```

Files: `render.cjs` · `drive.cjs` · `manifest.cjs` · `registry.cjs` · `chat-cta.cjs` · `test.cjs`.
CommonJS, no React, no dependency on the engine. `render.cjs` is *"Generalized from
prism-brainstorm/scripts/server.cjs wrapInFrame + isFullDocument + injectChannelMeta. One slot-fill
seam every Griot surface calls; never hand-authored HTML."* `render(content, opts)` slots a fragment
into a frame template, passes a full document through, and injects `griot-*` comm meta. It even
supports `opts.injectMeta` so it can be a **byte-identical drop-in** for a tool's existing wrap.

**Its significance to this vision is B15's framing, not its code:** `render()` is the hand-rolled
**PAYLOAD** half (OpenUI's shape) and `drive()` is the hand-rolled **WIRE** half (AG-UI's protocol),
over the brainstorm channel on `:52342`. `registry.cjs`'s
`register(name, {render, drive, verbs}, {readiness})` is described as *"a hand-rolled version of
exactly this pairing."* So griot-widget is the **surface-agnostic widget contract** two of B17's six
axes are currently satisfied by — and it is `private: true` and `UNLICENSED`, so it is not
distributable today.

**Unlike the engine, it has real consumers** — and that contrast is the point of this subsection:

| consumer | line |
|---|---|
| `skills/prism-gavel/scripts/server.cjs` | `:19` requires `render.cjs`, used at `:145` |
| `skills/prism-gavel/scripts/adapter.cjs` | `:14-15` requires `render.cjs` + `drive.cjs` |
| `skills/prism-gavel/scripts/adapter.test.cjs` | `:13` requires `registry.cjs` |
| `skills/prism-brainstorm/scripts/server.cjs` | `:145` requires `render.cjs`; the comment at `:142-144` records it as **byte-identical** to the previous inline `wrapInFrame` |
| `apps/prism-setup/resources/plugin/…` | mirrored copies of the above |

All of them use a **relative `require()` of the `.cjs` files**, never the package name `@griot/widget`
— even though `package-lock.json:4139` resolves the workspace symlink. So the widget is the one piece
of this stack that is genuinely load-bearing across surfaces, and it achieves that by being CommonJS
files on a relative path rather than by being a package. `chat-cta.cjs` is the closest thing to a
drop-in *component* in either package: `chatCtaHtml(opts)` returns markup, `bindChatCta(root, driveFn)`
wires it. Still not React, still not a custom element.

**Three component contracts, no single answer:** the engine is an npm-published React mount; the
widget is a private CJS render/drive contract; and (below) the gavel is a React component library in
a third repo. Nothing reconciles them. That is not called out as a defect in any document I found,
and it is the shape of the question if "any Griot app can mount this" is the goal.

### 6.3 The gavel cockpit — a component, but in griotwave-ui

**The runtime** is a skill: `skills/prism-gavel` plus its popout on the `:52342` channel.
`prism-gavel/visual-companion.md` states the model: *"every control on a card **wakes the agent to
act with real tools** — this is the drive loop (cockpit -> button -> channel -> agent -> reflect ->
cockpit). The cockpit shows state; the agent does the work."* And its provenance, recorded from
Gavin mid-run 2026-07-29: *"prism-gavel IS the extraction of the Gavel cockpit that was built INTO
the DGS plan artifact; there is no separate gavel source yet."*

**The component form does exist, and it is not in Prism.**
`.prism/shared/designs/2026-09-14-design-sync-reconcile.md:41` locks the boundary:

> `src/gavel/` — GavelSurface, DecisionCardStack, DecisionDrawer, WizardStepBar, the Lucid adapter

under `C:/Users/digit/GriotMeta/SkillsForge/griotwave/griotwave-ui/src` — a **92-component** React
library at v0.3.0 (against 18 in the remote design system, which has not seen a component since
2026-07-02). Three files under `gavel/` are in the **excluded** set for having no griotwave token
reference.

And the relationship was ruled on 2026-09-23 (`brainstorm/7354-1790199040`, D1 *"One gavel, adopt the
kit"*): **"Prism gavel came first; griotwave GavelSurface is the extracted pattern."**

**So the gavel's drop-in story is real but split:** the *pattern* is a component in `griotwave-ui`;
the *working cockpit* is a skill-hosted popout in Prism; and the two are related by extraction, not
by import. No document proposes that Prism consume `GavelSurface`.

### 6.4 The Selectah board — not a component

`griot-live-artifacts/tools/render-selectah.mjs` emits `live/selectah-board.html` plus
`live/_selectah/board-data.json`. It is a **generator + a derived projection**, and the ownership map
is explicit that the board data is *"DERIVED, disposable, regenerated and never authored."* There is
no package, no export, no mount seam, and no document treats it as mountable. The nearest thing to a
component claim is the `landed-and-owed` viz template, which is an HTML template with tokens.

**Measured, and worth stating because it is easy to assume otherwise: there is no Selectah code in
Prism at all.** A grep for `[Ss]electah` across the whole Prism tree returns **four files, all prose,
zero code** — `plans/2026-09-26-nervous-system-CONTEXT.md`, `plans/closing-ceremony-REPORT.md`,
`plans/brainstorm-design-CONTEXT.md`, `workgraph/djeli-branch-capture.json`. No renderer, no
`board-data.json` writer, no markup. The renderer lives entirely in `griot-live-artifacts`.

### 6.5 The one place all three compose — and why it is not yet the answer

Node **C4** is the working proof: *"the branch-capture graph drawn as nodes and wires, five archify
chapters that dim and undim the canvas, lo/mid/hi fidelity that changes WHAT is drawn rather than
merely tinting it, the gavel ceremony in a TOP-anchored drawer, and node-click opening the right
inspector with that node's card."* Verified against `VERIFY_WORKGRAPH_OK` at 78 nodes / 84 edges,
with `MAX_CHAPTERS = 5` enforced in `chapters.ts:31` rather than described.

**That is the composition working.** But it is a **brainstorm companion screen**, served by
`server.cjs` on a session port — not a mounted component. Decision 8 anticipated exactly this gap
("do NOT build the tab in this run; this decision exists so Step 2 and Step 3 are not built in a way
that forecloses it"), and the tab has not been built. C4 proves the pieces fit; it does not prove
they can be mounted anywhere else.

---

## Named uncertainties

Two things were not resolved, and are named rather than guessed:

1. **The two added layer roles appear in no file under `live/`.** `Suite meta` and `Cross-cutting
   rails` are in `src/core/layer-roles.ts`, in `djeli-uxui-harvest-CONTEXT.md` and in the engine's
   README — but every rendered live surface still shows the original nine. Whether the live surfaces
   should be regenerated or whether nine is deliberate for that harvest's scope is not stated
   anywhere I read.
2. **Whether the 2026-09-11 vizclose session is "the nearly two days."** It is the largest single
   body of material and it spans 09-11 into 09-12, with the 09-13 rulings immediately after. But
   Gavin also described developing the tablet/ink thread *"ideologically in Claude Desktop"*
   (`designs/2026-09-06:56`), and a Claude Desktop session would not appear in any store swept here.
   If something is missing from this synthesis, that is where it is, and `chat-log-access` is the
   tool for it.
