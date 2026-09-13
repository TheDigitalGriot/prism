# Stage contract - djeli-branch-capture

Inbound (awaits): .prism/shared/plans/{djeli-uxui-harvest,viz-companion-fusion,
djeli-stage0-code-intel,griot-viz-engine-rail}, .prism/shared/workgraph/index.json,
.prism/shared/workgraph/uxui-canvas-nodes.json, griot-live-artifacts/live/

## Why this stage exists

One session produced four contracts and roughly a dozen named-but-unfiled threads. That is the
exact pattern the Suite Drift Codex exists to end: called out, then swept. Worse, they are
invisible in Gavin's own instrument - the workgraph panel is session-scoped and the studio graph at
.prism/shared/workgraph/index.json contains none of them.

Gavin ruled 2026-09-13: capture FIRST, and make the capture itself the artifact. The global
workgraph becomes a PRIMITIVE and a Djeli WORKFLOW TAB, so this codex is both the ledger of these
branches and the first real render of the multi-branch workgraph we have been theorising.

## Decisions (locked)

1. ONE ARTIFACT, TWO JOBS. A new Griot codex artifact that (a) captures every branch below with its
   state and its edges, and (b) renders the fully built workgraph from that data. Not two artifacts.
2. THE WORKGRAPH IS A PRIMITIVE. This is not a one-off picture. The global workgraph becomes a
   reusable primitive and a Djeli workflow tab, peer to the other tabs. Build the data shape so it
   can be mounted, not just viewed once.
3. INBOUND / OUTBOUND ALREADY EXIST. Use the established direction vocabulary - outbound when a
   branch has a destination, inbound when it has a source, adjacent when it maps more than once,
   local otherwise. Do not invent a second edge vocabulary (helper.js:204-209 is the precedent).
4. FOREIGN WORKGRAPH CONTENT IS GREYED, NOT DROPPED. Other workgraph material from across the
   machine may be folded in LATER as a greyed-out background layer so these branches stay in focus.
   Not in this pass; build so it can be added without a rewrite.
5. NEVER INVENT A BRANCH, A STATE OR AN EDGE. Every branch below is stated by Gavin or verified on
   disk in this session. If a state is unknown, say unknown. Do not promote a written contract to
   "run", and do not infer a dependency that was not stated.
6. ARTIFACT DONE = PUSHED LIVE. Both halves: commit into griot-live-artifacts AND publish the card.
   A staged-only edit is not done.
7. GRIOTWAVE REGISTER, CODEX FRAME. Follow the existing codex artifacts (Djeli, Kente, Griot
   Sandbox) for frame and register. Ember per the codex convention. Never an invented palette.

## The branches (the capture - this list IS the deliverable's data)

### Tracked - contracts exist on disk
  A1  djeli-uxui-harvest            DONE      out-> uxui-canvas-nodes.json (27 nodes, 7/11 layers)
  A2  viz-companion-fusion          DONE      in<- A1 · commit 56b8c05 · out-> companion fragment
                                              target, workgraph state channel, seeded LAYERS/
                                              TIMELINE, local-lane bug fix
  A3  djeli-stage0-code-intel       WRITTEN, NOT RUN   in<- A1 · out-> B6
                                              carries: taxonomy 9->11, index targets, idea_init
                                              recovery, mixar/openscience/kente open asks
  A4  griot-viz-engine-rail         WRITTEN, NOT LAUNCHED  in<- A2, archify viewer-runtime.md
                                              carries: rename to griot-viz-engine, chapter rail,
                                              click-to-source. Publish is Gavin's, never the agent's

### Untracked until now - named in session, nowhere durable
  B1  idea_init bench into the prototype        Lucid tab. JSX app surface (companion/branding.jsx,
                                                tweaks-panel.jsx, screen_session.jsx, app/icons.jsx),
                                                4 hub-wireframe-mid.html iterations, design-dna
                                                report, workshop-bench-index.html, inspo-sources.md.
                                                NOT lost - intact at GriotApps/idea_init
  B2  Griot tool UI hunt                        R3F Studio, Cinopsis, Prism desktop (Paseo lineage,
                                                the always-on architecture moment), Kente, Synaptiq.
                                                Find real HTML/app surfaces; ASK, never assume - if
                                                no HTML exists it is a Claude design or Pencil file
                                                and Gavin supplies it. out-> B12
  B3  Griot pages that become workflow tabs     meridian-day-surface, griot-studio-dashboard,
                                                griot-morning-briefing. out-> B12
  B4  gold log + griot-gold-log skill           mirror of _drift/drift-entries.json at _gold/.
                                                Entry adds invariants, trace (derived from the
                                                heartbeat, not narrated), flow_cause, artifacts.
                                                First entry candidate: the viz-companion-fusion run
  B5  duplicate-rows display gap                orca and djeli clusters render as identical rows in
                                                the rail with no repo tag. Real data, bad display
  B6  create*View + addChildView blast radius   the codex estimates "roughly six sites"; the graph
                                                can measure it. in<- A3
  B7  per-shape selector                        diagram-design's 27 editorial types as the selection
                                                discipline the engine lacks. Thesis says "the right
                                                canvas PER SHAPE"; engine always emits lanes
  B8  react-force-graph 3D reveal               documented layer-02 plan pick, NOT vendored. Spatial
                                                and 3D rank as the reveal, never a nice-to-have
  B9  Kuzu + Chat2DB substrate                  layer 03, "running today, never surfaced". Engine
                                                draws from a frozen JSON array instead of the graph
  B10 Ontology Codex tabs as precedent          Layers / Relationships / Skill routing / Workgraph /
                                                vs Genspark = five curated views over one graph,
                                                authored before archify was read. Generalise GAVIN'S
                                                pattern, do not import someone else's
  B11 /design ceremony                          the vision-locking session. INTERACTIVE, never
                                                headless - drift entry 2026-09-11 names this exact
                                                error. in<- A4, B2
  B12 Djeli workflow-tab roster                 Prism(code) · Lucid · R3F Studio · Cinopsis · Kente ·
                                                Synaptiq · Mixar · office surfaces · GenTeam ·
                                                the fused viz/brainstorm surface · this workgraph
  C1  workgraph codex + primitive + tab         THIS stage. out-> B12

### Open asks - Gavin's calls, never inferred
  - Mixar is a WSL distro, not a repo: D:\GriotEnvs\MixarBuild\ext4.vhdx (`wsl -d MixarBuild`)
  - Kente has no repo by design; its shipped assets are the five notebook skills
  - "OpenScience" is Kente's open-metadata intake layer, not a repo
  - Which idea_init surface is THE Lucid UI

## Process

Step 1 - VERIFY, do not trust this file. Confirm each A-branch state against disk (contract exists?
  commit present? heartbeat DONE?). Correct any state that is wrong and say so loudly.
Step 2 - BUILD THE GRAPH DATA. Emit the branches + edges as a data file the codex renders from, in
  the shape a Djeli tab can mount later (Decision 2). Data first, page second.
Step 3 - BUILD THE CODEX. Griot codex frame, Griotwave register, rendering from Step 2's data -
  never a hand-typed node list.
Step 4 - COMMIT into griot-live-artifacts/live/. Report the exact path and the artifact filename so
  the card can be published.
Step 5 - REPORT. .prism/local/branch-capture-report.md with the data path, the artifact path, the
  verified state of every A-branch, and anything this file got wrong.

## Success criteria

- Every branch above exists in the emitted data with a state and its edges.
- The codex renders FROM that data, not from a hand-authored list.
- A-branch states are verified against disk, not copied from this contract.
- The data shape can be mounted as a Djeli tab and can take a greyed foreign layer later.
- Committed into griot-live-artifacts. Publishing the card is the caller's half.

## Heartbeat tokens

STEP 1 verify - STEP 2 graph-data - STEP 3 codex - STEP 4 commit - STEP 5 report - DONE
