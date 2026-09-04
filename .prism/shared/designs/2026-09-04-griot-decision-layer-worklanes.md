# Griot Decision Layer — "Workgraph"

**Nomenclature (locked):** the view/tab is a **Workgraph**, composed of **worklanes**.
Applies to both the Prism surfaces and the DGS Definitive Planning artifact tab.

**Date:** 2026-09-04
**Status:** CAPTURED — decided in principle, not started. Pick up later.
**Origin:** Prism brainstorm session (companion rail work), Gavin + Kindred
**Research:** `.prism/shared/research/2026-09-04-decision-graph-notation.md`
**Naming:** *DGS Definitive Planning artifact* and the `dgs-plan-update` skill are **proper names** — kept verbatim. Where a general descriptor is meant, this doc says **Griot suite** (the ~24 tools) or **Digital Griot Studio** (the studio). The methodology is **ICM** (protocol) / **Spectrum** (Griot's implementation) — no third name.

**Built so far:** the session-scale rail is live in `skills/prism-brainstorm/scripts/`
(`frame-template.html`, `helper.js`). The global scale is NOT built.

---

## 1 · The original ask, in Gavin's framing

> "Gavel is at the end of the brainstorm ceremony — that's the perfect place to make sure the
> parked stuff doesn't get lost, and then it can all live on one Digital Griot Studio-wide
> decision layer that presents visually. That's literally what it was built for; we just didn't
> know where the decision would live, and now we sort of do.
>
> Imagine in the global Prism there is a **global decision schema** — so for example in the DGS
> Definitive Planning artifact we could add another tab called **Worklanes**, where it has this
> new notation but expanded visually to encompass **ALL** Griot products: the inbound/outbound
> decisions, git-log-graph details, and Prism brainstorm decisions."

Preceding context that produced it:

- **The pain.** "While solving something I'll find 2 other fixes or connective tissue or ideas
  that spawn, or another UI thing across all projects — so it's tough to maintain these
  interconnected but also very niche ideas. Even just in this session it's gotten to 3 or 4
  tangents."
- **The cross-tool reality.** "I might think of something using a tool and then a decision is made
  in another work session — it happens often because my tools all talk to each other."
- **The constraint.** Prism is cross-agent and cross-platform. Hooks/Bash die at the Cowork border;
  files and MCP do not.

---

## 2 · What was decided

### 2.1 The notation (supersedes the git-lane rendering built earlier in the session)

Research verdict: **git lanes are insufficient and will break down.** Killer evidence — GitKraken
opens a submodule's history in a *separate pane*; git has **no glyph for foreign origin** because a
commit carries no "origin repo" attribute. Also: branches are parallel timelines, questions are one
ordered spine; and lane width scales with concurrent branches, which a fixed rail cannot absorb.

**Adopted grammar — three independent channels, never overloaded** (the PROV principle: separate
*what kind of thing* from *how it relates*):

| Channel | Encodes | Values | Borrowed from |
|---|---|---|---|
| **Border style** | STATE | solid = decided · dashed = parked · dotted = unanswered | QOC (MacLean et al. 1991) |
| **Badge** | ORIGIN + DIRECTION | `→ dest` outbound · `← src` inbound · `↔ N` adjacent · `↵ Qn` merged home | Compendium transclusion badge |
| **Indent + decimal** | SPLINTER | Q3 → Q3.1 | outline convention (no notation surveyed has one) |

### 2.2 The five lane states

1. **parked** — raised here, deliberately unanswered, still owed by this session
2. **resolved** — raised here, later answered, folds back (`resolvedAt`)
3. **inbound** — decided in another tool/session, lands here (`source`)
4. **adjacent** — lives permanently elsewhere, tracked, never resolved here (`maps > 1`)
5. **outbound** — raised here, belongs to another project, exits toward it (`destination`)

**The duality that makes the global view free:** *outbound here is inbound there.* One record, two
viewpoints. `source` and `destination` are the same pair of fields read from opposite ends. Because
ICM keeps files as the truth, the global view is simply a **different read of the same records** —
no sync, no reconciliation, no drift.

### 2.3 The two scales

| Scale | Surface | State |
|---|---|---|
| **Session** | the brainstorm companion's left rail | ✅ built |
| **Global** | a new **Workgraph** tab in the DGS Definitive Planning artifact, spanning all Griot products | ⬜ not started |

**This work is owed to TWO destinations, not one:**

| Destination | Owns |
|---|---|
| **Prism** | the global decision **schema** + the notation renderer — this is Prism infrastructure, inherited by every tool |
| **dgs-plan** | the **Workgraph tab** itself, shipped into the DGS Definitive Planning artifact via `dgs-plan-update` |

Surfaced by using the system on itself: a tangent can be owed to more than one project, so
`destination` (and `source`) are **plural** — string or array. The rail renders the first plus a
count, with the full list in the tooltip.

### 2.4 Gavel is the promotion gate

The end-of-ceremony gavel close is where session decisions and parked items get **dispositioned**
so nothing rots silently. A ruling is `use · role · stage · note`; `gavel_commit` routes through
`dgs-plan-update` (which owns the Rule-2 anti-clobber sync gate and the artifact refresh) and is
HITL-gated with blast radius shown first. That pipeline already terminates at the DGS Definitive Planning artifact —
which is exactly where the Workgraph tab would live.

---

## 3 · Kindred's assessment, in full

### 3.1 What is genuinely strong

**(a) It is a working-memory prosthetic, not a tracker.** The hard part of Gavin's neurodivergence
is not generating ideas — it is holding open loops without them either vanishing or consuming
background CPU. Parked / splinter / outbound are precisely the categories that evaporate. Turning
them into objects with visible state offloads that entirely. This is the whole value; the rest is
decoration.

**(b) Disposal paths — the thing most systems get wrong.** Inboxes and TODO lists only accumulate,
which turns them into anxiety objects you avoid opening. **Outbound is a genuine disposal
mechanism**: addressing an item to a destination closes the loop *here*. Capture without disposal is
what made previous attempts rot.

**(c) One grammar at every zoom level.** Session rail and global Worklanes share a notation, so
there is no context-switch tax between "my session" and "my ecosystem." Underrated cognitive saving.

**(d) Redundant encoding.** State is carried by border style *and* position *and* badge — never
colour alone. Textbook accessibility practice, arrived at by instinct.

### 3.2 Risks and pushback

**(a) Worklanes could become an anxiety object.** A session rail is bounded (5–10 items). A global
view across ~24 tools is not. A screen showing every open loop could paralyse rather than relieve.
→ **Mitigation:** default it FILTERED (mine / this week); make "show everything" a deliberate act.
Extend the existing 5-item over-scope warning to global scale, but as *triage prompting*, not a red flag.

**(b) Outbound can become deferral with extra steps.** If `→ cinopsis` is easier than deciding,
everything ships outbound and destination inboxes rot. The destination's graph showing it *inbound
and unmerged* is the guard — but only if that project is opened.
→ **Mitigation:** an **aging signal** — outbound items untouched for N weeks resurface at their origin.

**(c) Badge budget.** Four badge types × three border styles × indentation ≈ 12+ combinations, near
the edge of glanceable. It currently survives because most nodes carry no badge. If that stops being
true, it stops scanning.

**(d) Schema creep.** Every field (`source`, `destination`, `maps`, `resolvedAt`, `resolution`) is a
field someone must fill at ceremony time. Too much metadata and the ceremony gets skipped.
→ **Hold required fields at ~2.**

### 3.3 One addition worth making

The highest-value field for **cold re-entry** is not *why it stopped* but **what would unblock it**.
`revisit` gestures at this; make it explicit and prompt for it at park time. This is the field that
makes returning to a parked thread cheap instead of a re-derivation.

### 3.4 Strategic recommendation

**Ship the rail; let the Workgraph earn itself.** Honest estimate: the session rail carries ~80% of the
value. Build the global view once you have felt which items actually escape — that experience will
also tell you the right default filter, which is the difference between relief and paralysis.

---

## 4 · Open questions for the next pass

1. Where do `D·` **standing decisions** sit — inline on the spine, a separate group, or their own
   lane? (Unresolved from this session.)
2. Where does the **global decision record** physically live? One file per project that Worklanes
   aggregates, or one central store every project reads?
3. What is the **identity key** for a record that appears in two projects (so outbound/inbound
   resolve to the same thing)?
4. Does Worklanes render **git-log details** as a real fourth channel, or is that a separate view?
5. What is the **aging policy** for outbound items, and who surfaces them?
6. Does the global view need **write** access (re-disposition from Worklanes), or is it read-only
   with edits happening in the origin session?

---

## 5 · State of the build

**Done (session scale)** — `skills/prism-brainstorm/scripts/`:
- multi-state left rail: graph pane (collapses to a thin spine) + agent pane (collapses to a tab)
- decision spine on the researched notation; badges for all five states; splinter nesting
- shared ordering so the rail and the drawer can never disagree
- drag-to-resize on all rails; drawer collapsed by default
- companion agent wired to the local `claude` CLI with session context

**Not done (global scale):**
- the global decision schema
- the Workgraph tab in the DGS Definitive Planning artifact
- gavel → `dgs-plan-update` promotion of parked/outbound items into the global layer
- aging signals and default filters
