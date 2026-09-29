# 2026-09-29 Session Handoff - the Orca design surface, three doctrine locks, and the reactive-DAG ruling

**Session shape.** One long Cowork session running four threads: finish porting Orca screens onto the
Djeli IDE Shell design canvas, harden three recurring failure classes into the griot-ontology, evaluate
four open-science repos for Kente, and at the close borrow the marimo reactive-DAG lesson for the
ecosystem. Gavin is splitting the remainder into separate Cowork sessions; section 6 is the split.

---

## 1. What landed, with anchors

| Thread | Result | Anchor |
|---|---|---|
| Orca screen ports | 3 batches + the design surface. Canvas 47 -> 123 boards, IDE Shell **v40** | artifact version `1790710863-045a` |
| Orca design surface | Two bands: 3 composed capability flows at 1440x900, 10 components at measured frames | amendPass75, C34 / N134 |
| Coordination doctrine | `COORDINATION IS NOT FREE - the context multiplier` | griot-ontology `228c190` |
| Discovery-stack ruling | `THE DISCOVERY STACK - locator, analyzer, harvest are LAYERS` (D13) | griot-ontology `34a053f` |
| Proxy-verdict error class | `THE PROXY VERDICT - a named error class, with a required check` | griot-ontology `2163bb1` |
| Reactive-DAG ruling | `THE GRAPH THAT RECORDS vs THE GRAPH THAT DRIVES` (D14) | griot-ontology `ed96be5` |
| Prism design seed recorded | `nexu-io/open-design` named on the Djeli lineage line | skills `6c6191f` |
| Skills repo clean | submodule BOM strip + pointer + `synced/` ignored. **0 dirty for the first time since 2026-09-05** | skills `1b5105a`, `1407a40` |
| prism-design-engine | `feat/prism-rebrand-theme` pushed - it existed **only on local disk** | branch now on origin |
| Workgraph | amendPass76: D14, N135, N136, N137. Four copies in parity, VERIFY_WORKGRAPH_OK | live-artifacts `9850b6e`, Prism `10abbc9` |
| Drift ledger | 167 -> 170 entries; entry 1 RESOLVED with evidence | `0a5f2e1`, `8e2eab8`, `9850b6e` |
| Propagation | channel 4 back to parity; channel 5 source pulled forward 2 commits | griot-propagate check |

**Four open-science repos evaluated** (locator -> analyzer -> registry verdict; findings in
`.prism/shared/research/2026-09-29-eval-*.md`): `ai4s-research/open-science` YES (3 registries),
`aipoch/open-science` YES (3 layers, closest to Djeli lineage, recorded as Kente's seed),
`lfnovo/open-notebook` YES (triple-confirmed, 8 surfaces), `synthetic-sciences/openscience` PARTIAL
(context pane declared twice with drifting values, 2 of 6 tabs dead UI). All four shelved in the
potluck; `use-role-stage` left unruled for Gavin's gavel.

---

## 2. The Prism design seed - the question that opened the close

**Seed = `nexu-io/open-design`** (Apache-2.0, "the open-source Claude Design alternative", formerly
"Open Claude Design"). Forked as `TheDigitalGriot/prism-design-engine`, 2090 upstream commits,
`package.json` still `"name": "open-design"` at v0.10.0. Divergence point `d98a4c23` (2026-06-29,
*rebrand Open Design -> Prism Design Studio*), griotwave added at `50449153`. Measured on disk:
**155 skills** under `skills/`, **152 design systems** under `design-systems/`, engine `:7456` behind
relay `:7457`.

Two corrections worth carrying forward, both mine:

- `prism-design/SKILL.md` L47 **already** named the seed with a link. The gap was only that
  `griot-suite-context` named the component and not its upstream, while the Orca and GenOffice seeds on
  the same line were both attributed. Now fixed.
- I claimed "155 is stale by 3". **That was a PROXY VERDICT** - I measured `design-systems/` (152) and
  asserted a property about `skills/` (155). 155 is correct. Logged as the sixth instance, minutes
  after locking the check into the ontology.
---

## 3. THE REACTIVE-DAG RULING (D14) - the thing to carry into everything

The Griot workgraph is a DAG. A marimo notebook is a DAG. **Same shape, opposite direction of
causality.**

| | marimo | Griot workgraph (today) |
|---|---|---|
| built from | static analysis of the artifacts themselves | hand-authored amend calls |
| causality | graph **drives** execution | execution **records** into graph |
| staleness | computed and displayed | invisible |
| views | N views over ONE graph | four COPIES levelled by a script, policed by a gate |
| on change | dependents invalidate themselves | a human must notice |

**Rule 1 - DERIVE, DO NOT SYNC.** marimo's Dependencies panel, the Variables `Declared By / Used By`
lists, run order and minimap are four views over one graph. The workgraph is four COPIES levelled by
`sync-codex-data.mjs` and policed by `verify-workgraph.mjs`. That gate exists ONLY because copies can
diverge; marimo needs no such gate because there is nothing to diverge.
**A sync step is the receipt for a missing projection.**

**Rule 2 - STALENESS IS COMPUTED, NOT NOTICED.** Nodes should declare inputs as anchors (path + commit
or content hash) and go stale by themselves. Most of the drift ledger is this one defect in different
clothes: *Version manifest lags the cache* - *bump-version.py cannot catch a file 2+ versions stale* -
*Thin-mirror sync stalls silently* - *B10 describes five views its artifact does not have* - *the drift
card a day behind its repo* - *the PROXY VERDICT check is locked but does not fire*. Not one is a hard
problem. Each is a node whose input moved with nothing to invalidate it.
**A human noticing is not a mechanism.**

**Rule 3 - THE GRAPH SHOULD SCHEDULE.** A node whose dependencies are satisfied is RUNNABLE. That set
IS the parallel work and is **computable from the graph**. Hand-authoring a session split is the same
error class as hand-simulating a skill. This is what the workgraph owes Spectrum: Spectrum executes a
story, the GRAPH decides which are eligible, and when one lands its dependents become eligible with no
prompt. **Section 6 of this handoff was written by hand, and is therefore a guess dressed as a plan -
it is the exhibit for why rule 3 matters.**

**The test:** land a change. If nothing downstream turns yellow on its own, the graph recorded and did
not drive.

Three confirmations found the same day by running Gavin's own `griot-propagate check` (6 of 7 channels
drifted):

- **N135** - channel 5's declared *source* sat 2 commits BEHIND its declared *target*. Running the
  transport would have written **34 stale files over the live skills Claude actually loads**. Caught
  only by the dry-run CONFLICT guard. Both sides are clones of ONE remote, so the file-copy transport is
  rule 1 exactly - the projection already exists and is called `git pull`.
- **N136** - after both clones reached one commit, channel 5 still reported 12 behind, because it hashes
  raw working-tree bytes. At `1407a40`, both clean, both `autocrlf=true`: live holds 44 CRLF pairs,
  backup 0, raw sha differs, **normalized content identical**. Its own `drift.why` argues for sha over
  mtime, correctly, then lands on the wrong sha.
- **N137** - see section 4. The most operationally important finding of the session.

---

## 4. N137 - the account copy of griot-suite-context is truncated to 46 percent

`17,916 B / 172 lines` in the account snapshot against `39,111 B / 310 lines` on disk.

**Proven truncation, not staleness:** no revision in git history is 172 lines, and all 8 revisions back
to 2026-09-11 (`f17b4c8`, 34,866 B) contain `Djeli is a fork of Orca`. The account copy does **not**,
while it **does** contain `prism-design-engine` - so it is cut mid-roster, stopping inside the
thin-layer-mechanism paragraph, with **138 lines and the entire app-lineage section past the cut**.

Scope: **43** account skills under 90 percent of source with no common byte ceiling
(`griot-plugin-update` 47, `griot-meridian-reflect` 50, `griot-workgraph-update` 65, `sankofa` 69);
**25** repo skills never reached the account. Channel 6 is DETECT AND REPORT ONLY by declaration (D5):
**no transport, no owner.**

**Consequence:** a cloud session loading these skills from the account reads a roster that ends
mid-sentence. Cause is UNKNOWN and deliberately not theorised. First test: re-save one skill to the
account and compare bytes.

**Interim rule: never conclude a fact is absent from griot-suite-context from a cloud session alone -
read the file on disk.**
---

## 5. Open, with owner

| Item | State | Owner |
|---|---|---|
| Drift codex live card | repo at **170**, card at **167** - republish OWED | a session with the Artifact tool |
| OA9 - DGS mirror tabs | 10 tabs shipping as live iframes, 0 payloads. Builder VERIFY passes, Playwright gate red (`svgLaidOut: 0`, `appendChild Unexpected token '<'`). Prior art: C8 shipped and REVERTED the same hour, N39, N44 | **Gavin rules**: leave iframes / pre-render with Playwright / vendor CDN + fix layout timing |
| 4 open-science repos | shelved, `use-role-stage` unruled | **Gavin's gavel** |
| 33 remaining Orca settings panes | a ruling, not a queue (4 ported as the pattern) | **Gavin** |
| Channel 2 prism-marketplace | 4.16.2 behind 4.17.3; 37 blobs (16 missing, 21 differing). **`griot-harvest-ux-ui` entirely absent from the mirror** | prism-release / griot-plugin-update |
| Channel 3 cinopsis-marketplace | 2.2.0 behind 2.8.0; 44 blobs (25 missing, 19 differing); mirror HEAD 18.5d old | cinopsis release |
| Channel 5 model | rule-1 rewrite (git-parity, not file-copy) | **Gavin's call** - it is his skill |
| Channel 6 | needs an owner even if the transport stays manual | **Gavin** |
| Channel 7 digital-griot-mcp | 9 tools source vs 7 mirror; `griot_viz_engine` + `griot_propagate_check` absent from a marketplace install; runtime alias `prism_viz_engine` declared nowhere on disk | prism |
| D14 rule 3 | the workgraph does not schedule yet | `WGR` in section 6 |

---

## 6. The workstream split - and its own coordination rule

**The lock is the repo, not the topic.** Sessions collide when they write the same file, so the split is
by write-set. Each session amends **only its own branch-capture workgraph**; the DGS plan `#wg-data`
block and the drift ledger are **serialized** - touch them at session close, one session at a time.

**Wave 1 (must go first, alone).** `PROP` - the propagation gate. Writes Prism, cinopsis, both
marketplace mirrors. Everything downstream that needs a Prism or Cinopsis change to actually REACH
Cowork is blocked behind it, and `griot-harvest-ux-ui` being absent from the marketplace mirror means
the harvest skill does not exist on a marketplace install today.

**Wave 2 (three in parallel, disjoint write-sets).**

- `GBF` - GBFolio LOC fix + Reallusion/Blender video ingestion. Needs the Prism + Cinopsis changes, so
  it follows PROP. Writes GBFolio, plus Prism/cinopsis only once PROP is done.
- `KEN` - Kente: the reactive DAG as a Kente capability, the 4-repo gavel, marimo + Quarto pattern
  extraction. Writes GriotApps/Kente + a `kente-*` workgraph.
- `DJE` - Djeli: the 33 remaining Orca panes ruling, OA12 design backlog. Writes the djeli canvas +
  `djeli-branch-capture-workgraph.json`.

**Wave 3 (consumes KEN).** `WGR` - make the workgraph schedule: D14 rule 3. Reuse whatever reactive
machinery KEN lands. Writes the skills repo + live-artifacts.

**Wave 4 (small, Gavin-gated).** `OA9` - the mirror-tab ruling.

---

## 7. Standing corrections earned this session

- **"building ui is comprised of components, so stop being so literal"** - never filter a UI component
  out for being small. An 850-byte menu can be the most important node in a flow, because it is where a
  routing decision is made. Size is never importance; an artboard takes any frame size.
- **Every Selectah CTA keeps its evidence drawer** (A38 reversed A36's strip). Scope a board by ROWS,
  never by thinning a row.
- **The plugins ARE the methodology** - `prism-model-onboard` and `prism-viz-generate` live in the Prism
  plugin and were the blind spot in the Kente sweep.
- **`GrabConfirmationSheet` is dead code** - its callbacks exist nowhere. The live pipeline is
  `grab-guest-script.ts` (`buildGuestOverlayScript`, 955 lines) + `browser-grab-session-controller.ts`.
- **Orca has no single design surface, it has THREE capabilities** - Grab/copy (crosshair -> clipboard),
  Grab/annotate (message-plus -> agent chat), Markup (pencil -> clipboard PNG, the only one that works
  remote/SSH).
- **Do not run a skill's work by hand.** Every ledger and workgraph write this session went through
  `append-drift.mjs`, `resolve-drift.mjs`, `amend-workgraph.mjs`, `sync-codex-data.mjs` and
  `verify-workgraph.mjs`. The one instrument check I skipped produced the PROXY VERDICT in section 2.