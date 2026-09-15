# Stage Contract - griot-workgraph-update gains --advance (workgraph N28)

Status: STAGED, not fired. Contract-first per Gavin.
Author: Cowork session, 2026-09-15, after amendPass19 (75 nodes / 84 edges / 34 branches).
Route device-side headless (claude.exe -p) as an ICM stage-walk, cwd = the skills repo.
Keep the plan-nod interactive in chat; only research/implement/validate go headless.

## Why this stage exists

amend-workgraph.mjs accepts nodes, edges and corrections. It has NO verb for
"this node is now done". B27 shipped and still reads named-unfiled. Pass 19 had
to file a superseding node (B29) rather than close B27 in place, because the only
other route was hand-editing the JSON - exactly the drift-47 anti-pattern.

Closing out the rest of the workgraph means transitioning 40+ nodes. Without this
verb that is 40 hand-edits. This stage is the gate on stage 3.

## Inputs

WORKING (edit here - the skills repo is source of truth, written into the workflow):
- `C:\Users\digit\GriotMeta\digital-griot-skills\griot-workgraph-update\amend-workgraph.mjs` (4,748 b)
- `C:\Users\digit\GriotMeta\digital-griot-skills\griot-workgraph-update\SKILL.md` (9,604 b)
- `C:\Users\digit\GriotMeta\digital-griot-skills\griot-workgraph-update\verify-workgraph.mjs` (2,654 b)

REFERENCE (read for grounding, do NOT alter from this stage):
- `C:\Users\digit\GriotMeta\griot-live-artifacts\live\djeli-branch-capture-workgraph.json` (315 KB, 75/84)
  - the real node shape: id / localId / kind / title / state / direction, originLane vs group
  - edge vocabulary: in-epic, awaits, splinter, outbound, ontology, inbound
  - lanes: tracked, untracked, this-stage, open-ask, new-findings, suggested
- `C:\Users\digit\GriotApps\Prism\.prism\shared\workgraph\djeli-branch-capture.json` - canonical copy, must stay in parity

CONVERGE AFTER the run (device-side copy by the Cowork session, NOT inside the headless run - N17):
- `C:\Users\digit\.claude\skills\griot-workgraph-update\scripts\` - the live home

## Current CLI surface (grounded, do not guess)

amend-workgraph.mjs today accepts: --json --payload --correct --pass --prefix --note --dry

## Locked Decisions

- ADDITIVE ONLY. --advance is a new verb. --payload, --correct, --pass, --prefix,
  --note and --dry keep their exact current behaviour and exact current output.
- Proposed shape (this is a PROPOSAL for Gavin, not a fait accompli - surface it
  before the canonical flip):
    --advance '{"target":"B27","state":"built-and-live","evidence":"..."}'
  or a file of them. It writes the state transition PLUS a provenance line naming
  the evidence, so a shipped branch closes IN PLACE instead of growing a twin.
- EVIDENCE IS MANDATORY. An advance with no evidence string is refused, not
  defaulted. Evidence is a commit sha, a live artifact version, or a passing
  verify - never an assertion.
- REFUSE-TO-WRITE. The write is gated: node count unchanged, edge count unchanged,
  exactly the named targets changed, and --dry prints the diff without writing.
- NEVER invent a state value. Advance only to a state string that already exists
  in the graph, or one Gavin names.
- The skills repo is source of truth; ~/.claude/skills is the live home and gets
  converged from it, never the other way.
- Plugin/skill work routes through griot-agent-architect conventions and RUNS its
  bundled validators (`C:\Users\digit\GriotApps\Prism\skills\griot-agent-architect\scripts\`)
  - parse-frontmatter at minimum. Never hand-eyeball skill structure.
- DO NOT COMMIT. Leave it uncommitted for Gavin's review.
- Daemon is NOT a prerequisite. In-process agents only.

## Process (numbered, ICM stage-walk)

1. LOAD CONTEXT - drive codebase-locator / codebase-analyzer over
   griot-workgraph-update. Get amend-workgraph.mjs's actual arg parsing, its write
   path, and how --correct already mutates a node, at file:line. Do not photocopy
   the file. HEARTBEAT: STEP1_CONTEXT
2. GROUND THE SHAPE - read the real workgraph JSON's node schema and the full set
   of state strings in use (there are ~28). Confirm where provenance lines live
   today (how --correct records one). HEARTBEAT: STEP2_GROUND
3. PROPOSE - write the --advance spec to
   `.prism/shared/research/2026-09-15-workgraph-advance-spec.md`: payload shape,
   refusal conditions, provenance line format, and how it differs from --correct.
   HEARTBEAT: STEP3_PROPOSE
4. IMPLEMENT - add --advance additively. Do not touch the existing verbs' code
   paths beyond the arg switch. HEARTBEAT: STEP4_IMPLEMENT
5. VALIDATE - on a COPY of the live workgraph JSON (never the live file):
   - --dry prints the diff and writes nothing
   - a real advance on B27 -> built-and-live leaves nodes=75 edges=84, changes
     exactly one node, and adds a provenance line
   - an advance with no evidence is REFUSED
   - an advance to a state string not in the graph and not named is REFUSED
   - verify-workgraph.mjs still returns VERIFY_WORKGRAPH_OK
   - a negative control: corrupt the count guard, confirm the write refuses
   Run parse-frontmatter on the skill dir. HEARTBEAT: STEP5_VALIDATE
6. SKILL.md - document --advance in place, additively. Do not restructure the
   existing SKILL.md. HEARTBEAT: STEP6_DOCUMENT
7. REPORT - what changed, the five validation results, and the spec location.
   Leave UNCOMMITTED. HEARTBEAT: DONE_WG_ADVANCE_STAGED

## Success criteria

- --advance exists, is documented in SKILL.md, and is additive: every existing
  flag behaves byte-identically (prove it - run an existing --correct before and
  after against a copy and diff the output).
- Evidence-less and unknown-state advances are refused, proven by negative control.
- The live workgraph JSON was never written to by this stage (git diff on
  griot-live-artifacts is empty).
- parse-frontmatter passes on the skill dir.
- Nothing committed.

## Heartbeat tokens

Write to `C:\Users\digit\GriotMeta\digital-griot-skills\.wg-advance-progress.txt`:
STEP1_CONTEXT - STEP2_GROUND - STEP3_PROPOSE - STEP4_IMPLEMENT - STEP5_VALIDATE - STEP6_DOCUMENT - DONE_WG_ADVANCE_STAGED