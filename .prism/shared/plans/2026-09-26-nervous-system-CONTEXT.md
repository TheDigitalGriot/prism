# Stage contract - the nervous system: one decision state, four entry points

stage: implement
primary repo: C:\Users\digit\GriotApps\Prism

## Role

You are wiring the connective tissue between decision-bearing systems that ALREADY EXIST and are
ALREADY MATURE. Gavin's framing, and it governs every decision below: these are specialised cells
in the Griot body. Nothing here is a rewrite. Almost nothing here is new construction. You are
building membranes between organs that are already alive, and you are removing nothing.

This is foundational to Gavin's creative practice. Precision over speed.

## The measured problem - do not re-derive, all measured 2026-09-26/27

FOUR ENTRY POINTS (workgraph node B55, Gavin verbatim): "another note about the selectah and gavel
and workgraph in brainstorm and the decision rail on teh right as well. everything should be
udpating with the decision from each one of them"

WHAT EXISTS AND WORKS:
- Gavel: 1288 undecided cards, 5 axes (project vertical decision stage type), a 667-entry resolve
  table. Sources from live/dgs-definitive-plan.html in griot-live-artifacts. Cards are flat, 14
  string fields: app item oss type detail slug decision role stage src _id cat status note.
  Card vocabulary: decision=undecided, stage=later|next|now, role=""|pattern, status=idea.
- Brainstorm: 43 decisions.json sets, 160 decisions, 79 parked. State enum at helper.js line ~209
  is literally: var L = { done: [], superseded: [], parked: [], open: [] };
- Workgraph / branch captures: 267 djeli nodes. ADOPTED brainstorm's enum already.
- The bus: scripts/server.cjs (27081 B) broadcasts 8 message types over WebSocket including
  workgraph-update, uses fs.watch x5, references workgraph.json x7 and port 52342.
- digital-griot-mcp: StdioServerTransport x2 (MCP half) plus express x9 on 52342 (A2A half,
  agent-to-agent comms). Gavel round trip click -> POST:52342 -> channel -> MCP wake -> events.
- The brainstorm frame's REAL zone registry, read from frame-template.html this session:
    grail       zone       #grail              left rail, tabsAfter .grail-head
    stage       zone       .main               resident screen
    drawer      zone       #brainstorm-drawer
    agent       zone       #arail              resident companion
    slide-over  transient  #ps-slide
    sheet       transient  #ps-sheet
    ceremony    transient  #ps-ceremony
    inspector   transient  #ps-inspector       resident node
- helper.js public surface from C3: window.ps = { open, close, isOpen, fill, show }

THE THREE MEMBRANES THAT ARE MISSING:
1. VOCABULARY. Grepping the whole 674 KB gavel_state output for done / superseded / parked / open /
   decided returns ZERO of each. Brainstorm and the captures agree; Gavel speaks a different language.
2. REFERENCE. A Gavel card has no field that can point at a workgraph node. No wg: id, no node
   handle, no story id. The only pointer is src, an untyped string holding video ids and scan labels.
3. DURABILITY. Gavel writes rulings to .prism/local/gavel/cw-<session>/state/gavel-cards.json - a
   Cowork-session-scoped folder under a gitignored path. Brainstorm writes to .prism/local/brainstorm/,
   also gitignored. The shelf they read is tracked; the rulings are not.

THE THRESHOLD LAYER:
- Project .prism is uniform across every repo checked (Prism, Cinopsis, griot-live-artifacts,
  digital-griot-skills, GBFolio/gb-portfolio-r3f): all have local + shared.
- Global ~/.prism has the SAME shape and is empty where it matters: shared holds 1 file. No .git.
- Contracts declaring an "Inbound (awaits)" edge, swept across four repos: ZERO. The vocabulary is
  documented in griot-suite-context; the producer never shipped.

## Inputs

WORKING (create or edit):
  C:\Users\digit\GriotApps\Prism\skills\prism-brainstorm\      the companion
  C:\Users\digit\GriotApps\Prism\scripts\digital-griot-mcp\    the MCP + A2A server
  <each repo>\.prism\shared\decisions\                         the per-project decision store
  C:\Users\digit\.prism\shared\                                the global threshold tier
  C:\Users\digit\GriotMeta\griot-ontology\viz-templates\       N125 only

REFERENCE (read, never edit):
  griot-live-artifacts\live\djeli-branch-capture-workgraph.json   267 nodes, the spine
  griot-live-artifacts\live\dgs-definitive-plan.html              the Gavel shelf
  griot-live-artifacts\tools\render-selectah.mjs                  emits board-data.json
  griot-live-artifacts\tools\fill-selectah-template.mjs           fills viz-template 11
  C:\Users\digit\.claude\skills\griot-agent-architect\            conventions + validators

## Locked Decisions - do not relitigate

D1  NOTHING HERE IS A REWRITE. Every system named above stays. You add membranes. If a step seems
    to require replacing, simplifying or bypassing an existing surface, you have misread the step.

D2  THE GAVEL UI IS NOT THROWAWAY. Gavin's ruling, verbatim in intent: "gavel has a very extensive
    workflow and the UI is not throw away it is apart of the experience for spatial thinking and
    brainstorming along side the 3D viz and interactive branch workgraph." A ruling MOVES the card
    and/or ANNOTATES it. Do not flatten Gavel into a form. Do not route around its cockpit.

D3  ONE VOCABULARY: done | superseded | parked | open, exactly as helper.js declares it. Gavel's
    decision/stage/role TRANSLATE INTO it. Brainstorm and the captures already speak it and must
    NOT be changed to accommodate anything. The translation is one-directional and lives in one file.

D4  EVERY decision record carries a REFERENCE to what it settles - the workgraph node id, the Gavel
    card _id, or both. Routing uses a field that already exists: a card's `app` (36 project slugs)
    names the project whose store the ruling lands in.

D5  TWO TIERS, DIFFERENT JOBS. Project .prism/shared/decisions/ holds that project's own rulings,
    tracked in that repo. Global ~/.prism/shared/ holds ONLY what belongs to no project: the project
    registry and the inbound/outbound edge table. Decisions themselves NEVER live in the global tier.

D6  GIT INIT THE GLOBAL TIER. Gavin's ruling: init, NO PUSH. No remote, no origin, no push, ever.

D7  USE THE ZONES THAT EXIST, listed in the measured section above. Left rail (grail, #grail) takes
    the workgraph - that is the parked suggest-brainstorm-workgraph-slot, now unparked. The
    inspector transient (#ps-inspector) IS the decision rail and its resident is ALREADY declared
    as "node". The ceremony transient (#ps-ceremony) is where the Gavel ceremony runs. Fill them
    through window.ps.fill. DO NOT INVENT A NEW ZONE OR A NEW PUBLIC API.

D8  THE BUS EXISTS. server.cjs already broadcasts workgraph-update and already knows 52342. A store
    write FIRES THE EXISTING CHANNEL. Do not build a second bus, a second port, or a second protocol.

D9  EDGE PRODUCER - MEASURE, DO NOT INVENT. Gavin believes spectrum-architect or
    griot-agent-architect can already emit an Inbound (awaits) edge, and is unsure about
    icm-prism-run. Determine which of the three actually can, using the discovery agents. Wire the
    one that can. If none can, report that as a finding and emit the edge from the store write
    instead. DO NOT create a fourth producer.

D10 N125 FIRST, it is one block. viz-templates/templates/_selectah-palette.css and its inlined
    copies in templates 07 and 11 define dark ONLY under @media (prefers-color-scheme:dark).
    Measured today: 0 [data-theme=dark] blocks against 2 prefers-color-scheme. Add the
    [data-theme=dark] block so a viewer on an explicit dark theme stops getting a light board.

D11 Plugin and skill work routes through griot-agent-architect and RUNS its bundled validators.

D12 BUILD AND PROVE. No version bump, no tag, NO PUSH anywhere, no release, no marketplace sync.

D13 UTF-8 without BOM on every write, via [System.IO.File]::WriteAllText with UTF8Encoding($false).
    Never Set-Content. Verify BOM bytes, CR count and mojibake count after each write.

D14 A legacy workflow label Gavin has retired must never appear in any file, comment, output string,
    heartbeat line or fixture you write.

## Process

1. Read this contract. Heartbeat contract-read.
2. N125. Fix the three palette copies, verify 3 [data-theme=dark] blocks exist and no rule was
   removed. Heartbeat n125 plus the before/after counts.
3. Survey with the discovery agents, NOT by reading whole files: how server.cjs broadcasts and what
   it watches; how helper.js buckets into L; how Gavel writes a ruling today; what
   spectrum-architect / griot-agent-architect / icm-prism-run each actually emit (D9).
   Heartbeat survey plus a short table and the D9 verdict.
4. Design the decision record. Fields, the reference field, the translation table from Gavel's
   decision/stage/role into the four-value enum. Write it as references/decision-record.md in the
   brainstorm skill. Heartbeat record-shape plus the full field list.
5. Build the per-project store and its engines in the shape of the drift and gold ledgers - append,
   resolve, render - so the existing recall tool shape carries over. Heartbeat store.
6. Init the global tier per D6 and write the project registry plus the empty edge table with its
   schema. Heartbeat global-tier.
7. Wire the write path: a ruling from any entry point goes through an MCP tool, lands in the right
   project store by `app`, and FIRES the existing 52342 channel. Heartbeat write-path.
8. Wire the three read surfaces through window.ps: grail takes the workgraph, inspector takes the
   decision rail, ceremony takes the Gavel ceremony. Each subscribes to workgraph-update.
   Heartbeat read-surfaces.
9. Route through griot-agent-architect and RUN its validators. Heartbeat validator:pass or
   validator:fail:<reason>.
10. Prove the loop end to end with a REAL ruling on a real card, read-only elsewhere: rule it,
    show it landed in the project store, show the channel fired, show all three surfaces would
    receive it. Heartbeat loop-proof plus the evidence.
11. Commit. Heartbeat committed:<sha>, then D1-PROOF listing every pre-existing file you touched
    and confirming none was stripped or rewritten, then DONE.

## Success criteria

- N125: 3 [data-theme=dark] blocks where there were 0, and no existing rule deleted.
- No .mjs or .js written by this run contains a hardcoded repo path; paths come from the registry.
- The translation is ONE file and is one-directional. helper.js's enum is untouched.
- Global ~/.prism has a .git and NO remote. `git -C ~/.prism remote -v` prints nothing.
- The decision store is inside a repo's .prism/shared/, tracked, NOT under .prism/local/.
- INVERTED EXPECTATION: the D9 survey may well find that NONE of the three producers emits an
  Inbound (awaits) edge today - zero exist across four repos after months. Reporting "none of them
  does, here is the evidence" is a PASS. Inventing a producer to make the number non-zero is a FAIL.
- D1-PROOF: every pre-existing file touched is listed, each with what was ADDED and confirmation
  that nothing was removed. Gavel's cockpit, helper.js's enum, server.cjs's bus and the four
  existing sync scripts all survive intact.
- The loop proof uses a real card and a real node, not a fixture.

## Heartbeat

Append one timestamped line per step to .prism\local\nervous-system-progress.txt in the Prism repo.
Tokens in order: contract-read, n125, survey, record-shape, store, global-tier, write-path,
read-surfaces, validator:pass, loop-proof, committed:<sha>, D1-PROOF, DONE.
If a decision is genuinely missing, append BLOCKED plus a one word reason and stop cleanly, leaving
the tree either committed or clean but never half edited. Do not ask questions; this is headless.
