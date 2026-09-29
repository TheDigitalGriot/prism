# Kente x OpenScience spike - stage contract

Written 2026-09-29 from the Djeli/Orca canvas session, so the fresh session rediscovers nothing.
Everything under MEASURED was verified on disk that day. Everything under RULE FIRST is open.

## 0. Session start (Gavin's standing order)

1. `/sankofa`
2. `/griot-suite-context`
3. Read `griot-live-artifacts/live/griot-ontology-codex.html` BEFORE anything else. Finding N5:
   it is an under-consulted source of truth carrying per-node repo/seed/harvest/note for the whole
   suite. It has already silently corrected two open asks (OA2, OA3) that were wrong for weeks.
4. Then `griot-live-artifacts/live/kente-codex.html` (325,546B) and `modelmaker-research-intake-read.html`.

## 1. MEASURED, 2026-09-29 - do not re-derive

- There is **no `kente` directory** under any Griot root (GriotAgents, GriotApps, GriotBranding,
  GriotClients, GriotMeta, GriotProducts, GriotSandbox, .griot). Checked all eight.
- `C:\Users\digit\GriotApps\ModelMaker` **exists but is not a codebase**. Its entire contents:
  a `.prism` folder, `griot-potluck-oss-repo.html` (92,790B) and
  `modelmaker-research-intake-read.html` (12,878B). No `.git`, no `package.json`, no source
  directory. It is a research/intake shell, not the fork it was assumed to be.
- `aipoch/open-science` is an EXTERNAL GitHub repo (OA3). It is **not cloned** anywhere locally.
- `kente-codex.html` states verbatim: `home: concept - no repo yet`,
  `status: concept - design leads the build`, and, of its tool table,
  `Postures pinned at design-time - verify each at integration (no repo yet)`.

**THEREFORE: the Orca workflow does not apply to Kente as things stand. There is no renderer to
port from.** That is the single most important fact in this contract. Do not start a port run
against Kente; it will invent a screen, which is exactly the failure C29/N127 already recorded.


## 1b. CORRECTION, same day, 2026-09-29 - "nothing to port" was the wrong conclusion

The measurements in section 1 are all true and stand. The conclusion drawn from them was wrong,
and Gavin overturned it by opening the Griot Ontology Codex's **Skill routing** tab - a graph that
answered in one look what three text instruments had missed.

**What the codex's kente node actually carries:**
- `MODEL-MAKING / DATA SCIENCE` - "the forge on the OpenScience base: modular notebook building +
  the notebook-forge pipeline + prewarm/thunder monitors - prompt->RAG->LoRA->fine-tune - owns The
  Griot Model"
- **12 skills routed INTO it**, and typed edges out to **The Griot Model** (which it owns),
  **Kaleidoscope**, **Valence** (notebook-forge), **Arkestra** and **Math Formalism**.

**So `open-science` is the SHELL SEED, not the substance.** The substance is Gavin's ML and data
science methodology, and it is already fully mapped. Reading "no repo" as "nothing there" confused
the absence of a RENDERER with the absence of a SYSTEM. Kente is one of the most specified things
in the estate; it simply has no compiled UI yet.

**MEASURED 2026-09-29 - 6 of the 12 routed skills already exist as real skills on disk**, in BOTH
`~/.claude/skills` and `GriotMeta/digital-griot-skills`:
`jhu-notebook-analysis` · `jhu-notebook-chart-extractor` · `jhu-notebook-sanity` ·
`jhu-notebook-styler` · `notebook-storyteller` · `ml-visual-explainer`

**NOT YET LOCATED - which is not the same as absent.** Gavin, 2026-09-29: "they all exist
somewhere." His word about his own machine is ground truth; the search below was too narrow to
contradict it and an earlier draft of this contract wrongly asserted these were "pipeline
components, not skills" on the strength of one failed lookup:
`jupyter-notebook-plugin (notebook-forge)` · `notebook_runtime` · `prewarm-monitor` ·
`p4-thunder-dashboard` · `utility_function_repo` · `jhu-notebook-analysis-skill`

SEARCH SCOPE ACTUALLY RUN (so the next session widens it instead of repeating it): exact directory
names in both skill roots; depth-1 and depth-2 directory names across all eight Griot roots by
pattern; and the ontology codex itself, which names all twelve in its `kente:[...]` routing array
but records NO home for any of them - it is a routing list, not a location index. No JHU or
coursework folder exists under any Griot root.

NOT YET SEARCHED: inside repos, outside the Griot roots, GitHub remotes, and any name variant.
ASK GAVIN where these six live rather than sweeping his disk - one direct question beats a
recursive search that times out, and he already knows the answer.

### This RESOLVES the registry question in section 4

Section 4 says a port needs a registry - Orca had `TOP_LEVEL_VIEW_LOOKUP`. **Kente has one too,
in a different shape: the ontology codex's skill-routing graph IS its surface registry.** Twelve
routed skills and five typed app edges, authored rather than inferred, and half of them already
carry a SKILL.md on disk describing exactly what the surface must do.

That is a bounded, measured spec - not a blank page and not a guess. Read those six SKILL.md files
and the codex's kente node; between them they say what Kente's screens are for.

### Revised shape of the work

Not "find a codebase." The order is:
1. Read the ontology codex's kente node and its Skill routing edges. It is the registry.
2. Read the six on-disk SKILL.md files. They are the behaviour spec.
3. Decide what `open-science` actually contributes as a shell - it is a seed, so treat it as the
   structural floor, not the design. Do not let a fork's UI decide what Gavin's forge looks like.
4. THEN design Kente's screens, desktop and mobile together, against that spec.

Section 3's option C still holds and is strengthened: the base is the frame, Kente is the forge on
top. What changes is that Kente's half is far better specified than this contract first implied.

### The methodological note worth carrying

Three instruments failed on this in one session before the graph settled it: a directory check
("no kente dir"), a repo check ("ModelMaker is not a codebase") and a codex text read ("no repo
yet"). Each was individually correct and together they produced a wrong verdict, because every one
of them was asking about STORAGE and the question was about SYSTEM. The relationship graph answers
a different class of question than any file query can, which is why it is the first thing to open -
not a nice-to-have view of what you already know.

## 1c. SECOND CORRECTION - the PLUGINS are the methodology (Gavin, 2026-09-29)

Gavin: "why are you ignoring the plugins, the plugins include some of the skills and ARE THE
METHODOLOGY beloved."

He is right and this is the reframe that matters most in this contract. Two earlier passes treated
Kente's 12 routed skills as loose artifacts to locate on disk - "6 of 12 exist" - which was the
wrong unit of analysis twice over. The unit is the PLUGIN.

**MEASURED 2026-09-29, in `~/.claude/plugins/cache/prism-marketplace/prism/4.17.2/skills`** - the
Prism plugin carries 38 skills, and two of them are directly Kente's territory and were invisible
to every earlier search because they are plugin-packaged, not standalone:

- **`prism-model-onboard`** - "Add a model to **Arkestra** - Prism's model-governance layer (the
  Governor)." Web-verifies a model's facts TODAY, places it on the right provider chain, writes it
  into the roster + policy + docs, and REFUSES to write a model whose identifier, status or effort
  values have not been confirmed against a primary source that session.
- **`prism-viz-generate`** - layer 01 of prism-viz-engine. Authors archify-shaped JSON IR from
  citable source, gated against archify's validator plus a grounding rule. Never invents a
  component: every non-external node cites path and line.

Also in that plugin: `griot-harvest`, `griot-harvest-ux-ui`, `spectrum`, `spectrum-architect`,
`prism-codex-plan-sync`, `prism-gavel`. The ceremonies ARE the methodology, packaged.

**Arkestra appears in the ontology graph edged to Kente.** So the chain is already built:

    Arkestra (the Governor, via prism-model-onboard)  ->  governs the models
    Valence (notebook-forge)                          ->  builds the notebooks
    Kaleidoscope, Math Formalism                      ->  edged in
    Kente                                             ->  the forge; OWNS The Griot Model
    12 routed skills                                  ->  the pipeline that feeds it

**What this means for the spike:** Kente's screens are not invented from a blank page and not
ported from a fork's UI. They are the surfaces for a pipeline that ALREADY HAS governance, a
diagram layer, a notebook forge and twelve routed skills. Design against that chain.

**And the standing lesson, now recorded three times in one session:** every wrong verdict here came
from asking a STORAGE question (is there a directory, is it in the skills folder, is it a repo)
when the question was about SYSTEM. The instruments that answer the real question are the ontology
graph and the plugin manifests - both authored, both registries. Reach for those FIRST.
## 2. RULE FIRST - OA5, with new evidence

OA5 is open: "does Kente have a repo at all? Two of Gavin's own artifacts disagree."
- `griot-ontology-codex.html` kente node: `repo:'GriotApps'`
- `kente-codex.html`: `home: concept - no repo yet`

**New evidence from the 2026-09-29 measurement, offered as a candidate resolution, NOT applied:**
these two may not actually conflict. `repo:'GriotApps'` reads as a HOME ROOT (which Griot root the
app belongs under), not an assertion that a repository exists. Under that reading kente-codex is
correct and the ontology node is answering a different question. ModelMaker's contents support it:
the "fork of aipoch/open-science" seed describes an INTENDED lineage, not a clone that happened.

Put this to Gavin, with the measurement, and let him rule. Do not merge the sources silently -
his standing rule. If he rules it, close OA5 through `griot-workgraph-update` with the measured
paths as the evidence anchor.

## 3. The option space (lead with C; all three are real)

**A - Port OpenScience.** Clone `aipoch/open-science`, run the Orca workflow on it verbatim.
Unverified prerequisite: that it HAS a UI and a surface registry. Check before committing.

**B - Design-led generation from the kente-codex.** 325KB of specification, and the codex itself
says design leads the build. This is NOT the port workflow. `nodes-to-port-specs.mjs` cannot run
(nothing to point at), and the port contract's core rule inverts: "render the state the CODE
ACTUALLY RENDERS" becomes "render what the codex SPECIFIES". Needs its own contract; do not reuse
the Orca one.

**C - Both, in order (recommended).** Port OpenScience's surfaces first as the structural floor,
then generate Kente's own screens on top, using the ported boards as the reference for what the
forge INHERITS versus what it REPLACES. This mirrors D11, already ruled: Orca's design surface is
the FRAME for Lucid, not a thing Lucid replaces. Same relationship, same shape.

## 4. THE REGISTRY QUESTION - the thing that made Orca work

The Orca port succeeded because Orca declares its surfaces exhaustively:
- `src/shared/top-level-view.ts` - `TOP_LEVEL_VIEW_LOOKUP`, whose own comment says the keys are
  exhaustive on purpose so adding a view updates every persistence boundary.
- `normalizeRightSidebarRoute` in `store/right-sidebar-route.ts` - a closed tab allowlist.

That let the work be a DIFF instead of a guess. Before porting any new codebase, find what plays
that role there - a route table, a nav manifest, a screen enum, a tab allowlist.

**Evidence for why this is not optional.** On Orca, three instruments each gave a wrong answer
before the registries settled it: a file-shape heuristic reported 836 surfaces left across 299,946
lines (it swept in test files and sub-components - a screen is a surface the app renders, not a
.tsx file); then fuzzy name matching failed in BOTH directions, reporting `space` as done because
it matched "WorkspaceComposer", and `tasks` as left because the board is named "TaskPage". The
true remainder was 3 views + 6 panel tabs. Without a registry, you get the 836.

## 5. The tool chain that now exists (use it, do not rebuild it)

In `griot-live-artifacts/tools/`:
- `nodes-to-port-specs.mjs` - harvest nodes -> executable port specs. Six gates; G5 is the
  photocopy gate (a spec points at source, never carries it); G3 refuses a spec whose boards are
  already on the canvas.
- `register-ported-boards.mjs` - places ported pairs on a canvas. Six gates including pairwise
  frame-overlap. It PLACES, it never authors.
- `nodes-to-artboards.mjs` - the older converter. It emits PROVENANCE CARDS, not screens. Do not
  reach for it expecting pixels; that mistake is C29/N127.
- `fill-selectah-template.mjs` - the board. Never hand-composed.

The chain: `codebase-locator / codebase-analyzer -> harvest nodes -> port specs -> one headless
run per spec -> register-ported-boards.mjs -> canvas`.

Shared port contract to copy and adapt:
`Prism/.prism/shared/plans/2026-09-29-orca-screen-port-CONTRACT.md`

## 6. Doctrine locked on 2026-09-29 that governs this work

- **COORDINATION IS NOT FREE - the context multiplier** (griot-ontology `claude/CLAUDE.md`).
  Every call the coordinating session makes re-sends its whole context, so a device call costs the
  size of the CONVERSATION, not the command. One fat call, never many thin ones. Never poll -
  the launcher writes a marker, tested once, bundled with the next real command. Fan-out is the
  CHEAP path: N units in one session is quadratic, N processes is linear. Its real risk is a
  contract flaw paid N times, which argues for contract quality, never fewer runs.
- **A37 / A38 on the Selectah.** Scope the board by ROWS, never by stripping a row of its
  evidence. Every generated CTA keeps its know-more drawer - Gavin: "its usually where i find the
  details i need to make the decision before clicking." Both are gated; both will fail the build
  rather than regress quietly.
- **The Selectah board IS the close** of every unit of work, rendered in chat, generated never
  hand-composed, with the spine filled from that loop's overlay and `closedThisPass` declared.

## 7. First three moves

1. Session start (section 0), then put section 2's OA5 evidence to Gavin and get the ruling.
2. Verify whether `aipoch/open-science` has a UI and a surface registry (section 4) BEFORE
   proposing a port scope. If it has no registry, say so and propose how to bound the surface set
   instead of guessing.
3. Bring him the option space from section 3 with that finding attached, and get the nod before
   any fan-out.