---
date: 2026-09-06
source: Gavin, expounded in session (Claude Code, device-side)
topic: "Prism Viz Engine — the expanded layer model, and the Djeli UX/UI map"
tags: [prism-viz-engine, djeli, lucid, synaptiq, cinopsis, griot-harvest, design]
status: captured — several threads deliberately left OPEN pending harvest
---

# Prism Viz Engine — expanded

Captures Gavin's own account, given in session. **Where he said he does not know, that is
recorded as an open question, not resolved by inference.**

## What already existed (and I missed on first pass)

`griot-live-artifacts/live/prism-viz-engine-cluster.html` — a four-layer cluster with a written
thesis, all `stage: next`, committed 2026-08-03. **Not registered in `CODEXES[]`**, which is why
nothing pointed at it.

| layer | tools | job |
|---|---|---|
| 01 Generate | archify *(adopt/graft)* · Diagram Design · Lanshu · visual-explainer | NL/source → diagram |
| 02 Render | react-force-graph *(the prism-graph 3D renderer)* · xyflow · Excalidraw | right canvas per shape |
| 03 Substrate | **Kuzu** (embedded graph DB, Cypher, WASM) · Chat2DB (schema→ER, MCP) | what diagrams are drawn **from** |
| 04 Interactive shell | **waku-agent** — click-any-box live architecture diagram, every box a real module file | the design target |

Thesis (Gavin's words): *"a native Prism engine that draws diagrams **from** real substrate
(code graph via Kuzu, DB schema via Chat2DB) using the cluster's generation patterns, renders them
on the right canvas per shape, and ships them as **interactive, source-wired** surfaces in the Waku
mold — not static SVGs."*

## What Gavin added this session

### The substrate is LIVE, not aspirational
> *"kuzu codegraph and chat2db have been hidden for so long but they have been operating
> beautifully"*

Correction to my read: layer 03 is **working today**. The engine is not greenfield — it has a
running substrate that has never been surfaced.

### Scope: ecosystem-wide, not Prism-only
> *"i see prism-viz-engine turning into a very important piece of Griot tooling everywhere"*

This changes where the engine belongs architecturally. It is not a Prism feature; it is suite
infrastructure that Prism happens to host.

### penecho + drawesome close a loop — as a TABLET COMPANION
> *"yes they do actually … djeli would use penecho and drawesome possibly to have like an iOS app
> tablet companion to brainstorming or notes in synaptiq"*

So the ink/spatial pair is **a mobile/tablet surface**, not a desktop canvas widget:
- **drawesome** — human ink (7 pens, area eraser, SVG/PNG, React-only, no deps)
- **penecho** — reads marks + relationships back
- feeds **Synaptiq** notes and brainstorming

New layer, not yet in the cluster. Gavin was developing this ideologically in Claude Desktop.

### FossFLOW — isometric, for server monitoring
> *"i love this for things like server monitoring where its actual boxes … the isometric canvas
> with good motion and interaction design"*

A distinct **output mode**, reached for when the subject is infrastructure-shaped. Motion and
interaction design are explicitly part of the requirement, not decoration.

### JSON Canvas — the neutral wire (confirmed)
Placement as interchange between layer 01 and layer 02 confirmed as the right instinct.

**WANTED, UNFOUND:** a repo or site Gavin saw that rendered **JSON as nodes, Blender-node-style**
— possibly "json hacks". He could not re-find it. *"JSON node canvas+"*. Low priority, but
recorded so it is not lost twice.

## Open questions Gavin explicitly did NOT resolve

### The design layer is contested — four candidates, no decision
> *"instatic is like the Figma of Djeli, but also there is the Design layer of Orca and also we
> have a whole prism-design-engine (i don't even know what that's about because it's been going
> dark) and we also have OpenDesign as the seed being used for the prism design app"*

Candidates: **Instatic** · **Orca's design layer** · **prism-design-engine** · **OpenDesign**.

Asked for: *"if orca can take over the OpenDesign lets see where both are today and what they
offer, how to port prism-design current and then the future — because when it was first done most
of this infrastructure didn't exist in the griot ecosystem."*

> ⚠️ **OBSERVED CORRECTION (2026-09-06):** `prism-design-engine` is **NOT going dark** — last
> commit **2026-09-05, 0 days ago**. It *is* `nexu-io/open-design` ("Open Design: the open-source
> Claude Design alternative"), now **v0.9.0**, shipping a built-in **Model Router**, 150 design
> systems, 261 plugins, 21 coding agents, 14 media providers.
> **`djeli` is the repo going dark — last commit 2026-07-27, 41 days.**
> The memory was inverted. Also note: Open Design's Model Router is directly relevant to
> **Arkestra** and should be looked at during that build.

### `interface-design` / design-memory — placement unknown
> *"not sure tbh i just know that something sparked for me when i saw the way it remembers design
> decisions … we've done something shallow but similar with some of our griot skills"*

What sparked: **design decisions that persist and reapply across sessions** (`system.md`).
Whether that governs the *generators* (so every diagram inherits the design system) or only
Djeli's own UI is **undecided**.

### The uncaptured band — IA → wireframe → userflow → polished immersive UX
> *"a skeleton UI library and how that would be cool in brainstorming app wireframes/ux/userflow —
> so many things in the in-between of Information Architecture/UX and a polished Griot level of
> quality immersive UX/UI. I don't know if that actually got captured anywhere in the codexes or
> the potluck — it should be perhaps in the Lucid design inspo sources"*

**VERIFIED: it was never captured.** Scanned all 1,149 `POT_T` tools:

| term | hits |
|---|---|
| `information architecture` | **0** |
| `lo-fi` / `lofi` | **0** |
| `user flow` | **0** |
| `wireframe` | **1** (`wireframe-ui`) |
| `skeleton` | 1 (`Stable-Video-Infinity` — unrelated, video) |

Lucid carries **106 tools** and none cover this band. This is a genuine hole in the shelf, in the
exact place Gavin works most. **Action: a dedicated harvest pass for the IA/wireframe/userflow →
polished-UX spectrum, routed to Lucid's design-inspo workstream.**

## The Cinopsis → griot-harvest edge (a typed hand-off)

> *"griot harvest cant do that lol thats what my cinopsis tool is for … after a cinopsis run i
> will call griot-harvest and dgs-update to align everything"*

**This is a hard design input for `griot-harvest`.** Its ENTER stage takes three input types:

1. a repo URL
2. a Potluck shelf hit
3. **a Cinopsis harvest result** ← the YouTube/video backlog path

`griot-harvest` must NOT attempt video ingestion — Cinopsis owns that (and had a month of repair
work; treat its output as the contract, not its internals). The chain is:

```
Cinopsis (video → tool list)  →  griot-harvest (ground each against code)  →  dgs-plan-update (close decisions)
```

That is one workflow's CLOSE becoming the next workflow's ENTER — the composition thesis, with a
real first instance.

## Sequencing Gavin set

> *"i want to expand on that and do the griot-harvest on them to see … after the harvest there
> might be even more that we aren't aware of"*

**Harvest first, architect second.** Do not fix the layer graph before the new repos are grounded.
The UX/UI map's relationship to the viz engine (consumer vs. same engine, new substrate) is
deliberately left open pending that harvest.

## Immediate actions falling out

- [x] `drawesome` + JSON Canvas added to `POT_T` (1147 → 1149) — *uncommitted at time of writing*
- [ ] Register `prism-viz-engine-cluster` in `CODEXES[]` (currently an orphan artifact)
- [ ] Harvest pass: the IA/wireframe/userflow → polished-UX band, routed to Lucid
- [ ] Assess Orca's design layer vs OpenDesign; plan the prism-design port
- [ ] Note Open Design 0.9.0's Model Router when building Arkestra
- [ ] Djeli going dark at 41 days — flag in the freshness lens
