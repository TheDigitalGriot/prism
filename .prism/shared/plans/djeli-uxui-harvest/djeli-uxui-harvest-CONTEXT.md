# Stage contract - djeli-uxui-harvest

Inbound (awaits): skills/griot-harvest-ux-ui/SKILL.md, GriotSandbox/genoffice, GriotSandbox/orca

## Why this was parked, and what unparked it

The 2026-09-07 handback recorded griot-harvest-ux-ui as DELIBERATELY NOT BUILT, needing the layer
roles from the Desktop codex. Those layer roles were found 2026-09-11 in the LNAME array of
griot-live-artifacts/live/griot-suite-map.html (The Griot Stack, artifact c389ca6c). The tool is
now unblocked. It was never a generic harvester: its OUTPUT TAXONOMY is the layer roles, which is
exactly why it could not be written without them. A UI pattern with no layer is unplaceable.

## Decisions (locked)

1. LINEAGE, settled by Gavin 2026-09-11: Djeli AND Prism are BOTH forks of Orca (stablyai/orca).
   Djeli is the CONTAINER; GenOffice (genspark-ai/genoffice, Apache-2.0) is folded in as the OFFICE
   SURFACE, not the fork base. Djeli will expand into several stacks matching GenSpark, which is
   where the long-running confusion came from. The Sep-5 djeli-codex denial is OVERTURNED
   (corrected in commit 5aba992) - do not reintroduce it from any older source.
2. LAYER ROLES are the output taxonomy, verbatim from suite-map LNAME:
   Djeli container | Collaboration GenTeam | Creation build/content/3D | Capture |
   Intelligence Super Agent | Governance Governor | Model-making / data science |
   Memory foundation | Deployment
   CORRECTED 2026-09-16 (djeli-stage0-code-intel, Step 1) - the output taxonomy is ELEVEN roles,
   not nine. The nine named above stand verbatim and unchanged as the first nine; TWO were missing
   and are named here. MEASURED this session, not recalled: `prism_viz_engine mode=layers`
   (scripts/digital-griot-mcp/digital-griot-mcp.ts:1120-1131, which reads the LAYER_ROLES array
   literal at apps/prism-viz-engine/src/core/layer-roles.ts:16-28) returned count=11:
     Djeli · container | Collaboration · GenTeam | Creation · build/content/3D | Capture |
     Intelligence · Super Agent | Governance · Governor | Model-making / data science |
     Memory · foundation | Deployment | Suite meta | Cross-cutting rails
   The two added are `Suite meta` and `Cross-cutting rails`. Provenance, layer-roles.ts:1-13:
   copied byte-verbatim from the LNAME array in griot-ontology-codex.html (The Griot Stack,
   artifact c389ca6c) on Gavin's instruction 2026-09-11, because gating on nine meant our OWN
   validator rejected Griot Ontology, Client work, Meridian, Griotwave and Prism - exactly the
   tooling that has to sit on this canvas. Gavin ruled 2026-09-13 that the Djeli workspace map IS
   `Suite meta` and that tab-to-tab motion IS `Cross-cutting rails`.
   The middle dots and spacing are LOAD-BEARING: emitter, canvas and plan all key on exact string
   equality (layer-roles.ts:4-6) - do not retype or tidy the punctuation. A finding that fits no
   role is flagged `unplaceable` (layer-roles.ts:31-32), never force-fit into a twelfth and never
   invented to fill an empty layer. Authority: djeli-stage0-code-intel-CONTEXT.md decision 1.
3. COMPOSITION, one home per fact. griot-harvest owns the clone, the survey and the fit verdict -
   CALL it, never reimplement it. dgs-plan-update owns every plan write. griot-potluck-search owns
   shelf search. This skill owns only the UI walk: component - screen - flow - workflow - provenance,
   and the layer routing.
4. SUBSTRATE is the live Kuzu code graph plus Chat2DB (viz-engine layer 03, running today, never
   surfaced). CANVAS is xyflow (layer 02) because nodes are a plain JSON array an agent reads and
   writes directly, with no canvas-widget indirection.
   CORRECTED 2026-09-13 (djeli-branch-capture third AMEND pass) - the substrate is LadybugDB, not
   Kuzu. Kuzu was ARCHIVED 2025-10-10 (Apple acquired Kuzu Inc., all 24 org repos); griot-live-
   artifacts commit d901bf6 (2026-09-11, live/dgs-definitive-plan.html) already corrected the DGS
   shelf from kuzudb/kuzu (trial/next) to LadybugDB/ladybug (adopt/now) - "already in production
   here, .gitnexus/lbug runs on it". Forked as TheDigitalGriot/ladybug; 299MB of kuzudb docs/mcp-
   server/text2cypher/wasm was PRESERVED (not harvested) at GriotMeta/kuzu-archive. Chat2DB is
   unchanged. See djeli-branch-capture-workgraph.json B9 for the full evidence trail.
5. Every claim carries file:line. Every quoted metric carries who measured it and of what. Licence
   is a FACT for a field, never a verdict. Never gate or narrow what Gavin forks, studies or remixes.

## Process

Stage 1 - BUILD THE TOOL (headless, device-side, through griot-agent-architect + its validator).
  Emit skills/griot-harvest-ux-ui/ with SKILL.md and any references/scripts it needs. Follow the
  architect conventions; run the bundled validator; do not hand-eyeball structure.

Stage 2 - RUN IT ON THE SANDBOX (Gavin drives, interactively in Claude Code).
  Targets already on disk: GriotSandbox/genoffice (six Electron apps, thirteen packages, the office
  surface), GriotSandbox/orca and GriotApps/djeli (the real stablyai/orca clone whose package.json
  name is orca - this is Djeli's own lineage, not residue). Scope is Gavin's call, not the agent's.

Stage 3 - COMPOSE THE CANVAS.
  Each harvested screen becomes a canvas node carrying its layer role, its file:line origin and its
  mount point. Real features and real UI only. Nothing sketched, nothing inferred.

## Success criteria

- skills/griot-harvest-ux-ui exists, passes the griot-agent-architect validator, and routes every
  finding to one of the nine layer roles.
  CORRECTED 2026-09-16 (djeli-stage0-code-intel, Step 1): read "one of the ELEVEN layer roles"
  - see decision 2's correction. The criterion is otherwise unchanged.
- It calls griot-harvest rather than duplicating the clone/survey path.
- A run against genoffice returns screens with file:line origins, not prose summaries.
- The canvas renders from harvested data, not from a hand-authored node list.

## Heartbeat tokens

STEP 1 architect - STEP 2 skill-body - STEP 3 layer-routing - STEP 4 validator - STEP 5 commit - DONE

## Stage 2 targets (complete)

  GriotSandbox/block-buzz   Buzz - Djeli GenTeams - the Collaboration layer
  GriotSandbox/buzz-skills  how Buzz is operated
  GriotSandbox/genoffice    the office surface folded into the container
  GriotSandbox/orca         the container shell
  GriotApps/djeli           Djeli own Orca clone

If any of the nine layer roles returns no source, say so plainly as an unfilled layer. Never invent
a source to fill it.
CORRECTED 2026-09-16 (djeli-stage0-code-intel, Step 1): read "any of the ELEVEN layer roles" - see
decision 2's correction. The instruction itself is unchanged and is reinforced by the engine's own
note: unfilled layers are reported as unfilled, never filled by invention.