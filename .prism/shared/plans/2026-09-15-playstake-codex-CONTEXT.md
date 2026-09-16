# Stage Contract - PlayStake codex (unblocks B27)

Status: FIRED by the Cowork session, 2026-09-15, at Gavin's instruction.
Route device-side headless (claude.exe -p) as an ICM stage-walk, cwd = griot-live-artifacts.

## Why this stage exists

B27 (the codex [OPT:DEVICE] sweep) cannot advance to done because PlayStake has no codex
file at all - B27 itself said "its own node". Every other app in the roster has one; there
are 46 codexes in live/ and no playstake-codex.html. This closes that gap so B27's
disposition stops being conditional.

## Inputs

WORKING (write here - cwd, one repo per run):
- `C:\Users\digit\GriotMeta\griot-live-artifacts\live\playstake-codex.html`  (NEW - does not exist yet)

REFERENCE (read for grounding, never write outside cwd - N17):
- `...\_master\claude-design\playstake-mvp-prototype\PlayStake.dc.html` (81,928 b - the design surface)
- `...\playstake-mvp-prototype\developer\index.html` (256,250 b - the built prototype)
- `...\playstake-mvp-prototype\refs\deck-01.png` .. `deck-10.png` (ten real deck frames)
- `...\playstake-mvp-prototype\uploads\PlayStake_Technical_Architecture_v0.1.pdf` (166,614 b)
- `...\playstake-mvp-prototype\uploads\PlayStake_Deck_Review_and_Restructure_Map.pdf` (102,778 b)
- `...\playstake-mvp-prototype\_CHATS\playstake-prototype-design-6b4d46de.md` (8,691 b - design intent)
- `...\playstake-mvp-prototype\_SHARD.json` (project id a6709e09-5eeb-4376-8ad2-d66d004f5f3f)
- SIBLING PRECEDENT: `live\kora-codex.html`, `live\keylink-codex.html` - read ONE for structure.

## Locked Decisions

- RUN the `griot-app-codex` skill and follow its own phases in order. Never hand-roll a
  codex, never simulate the skill's output. If a phase trips, re-route - do not improvise.
- PHASE 3 IS LOAD-BEARING: "Reference AND embed the current design." Never draw a fake
  screen. The embeds come from the REAL PlayStake exports listed above.
- ZERO placeholders. `placeholder - design pending` must appear 0 times in the output.
- ADD ONLY. Create playstake-codex.html. Touch no other file in live/.
- The device block follows the template's `[OPT:DEVICE]` / `[OPT:DEVICE-SURFACES]` contract;
  a surface with no real export is a named gap, never a silent omission.
- Any injection into the generated page is gated on three refuse-to-write assertions:
  element count as predicted, final size == predicted, unique id present exactly once.
  Never search a generated document for a token you also just wrote into it (N29).
- DO NOT COMMIT. Leave it uncommitted for Gavin's review.
- Daemon is NOT a prerequisite. In-process agents only. :6767/:6780 are mobile/remote only.

## Process (ICM stage-walk)

1. LOAD - read the skill, then the _SHARD/_STATE and the design chat md for intent. Do not
   photocopy the 256 KB developer build; query it. HEARTBEAT: STEP1_LOAD
2. GROUND - inventory what PlayStake actually IS from the deck refs, the architecture PDF and
   the design surface. Name the product in one line before writing anything.
   HEARTBEAT: STEP2_GROUND
3. STRUCTURE - read ONE sibling codex for the current structure. Do not invent a new shape.
   HEARTBEAT: STEP3_STRUCTURE
4. BUILD - generate playstake-codex.html through the skill's phases, with real embeds.
   HEARTBEAT: STEP4_BUILD
5. VALIDATE - assert: file exists; 0 occurrences of "placeholder - design pending"; >=3 real
   embeds; structure matches the sibling; `git status` in live/ shows exactly ONE new
   untracked file and no modifications. HEARTBEAT: STEP5_VALIDATE
6. REPORT - what PlayStake is, what was embedded and from where, the assertion results.
   HEARTBEAT: DONE_PLAYSTAKE_CODEX

## Success criteria

- live/playstake-codex.html exists and is the only file this run created or changed.
- 0 placeholders; at least 3 embeds traceable to the real exports, each named in the report.
- Structure matches a sibling codex, proven by naming the sibling's sections.
- Nothing committed.

## Heartbeat tokens

Write to `C:\Users\digit\GriotMeta\griot-live-artifacts\.playstake-codex-progress.txt`:
STEP1_LOAD - STEP2_GROUND - STEP3_STRUCTURE - STEP4_BUILD - STEP5_VALIDATE - DONE_PLAYSTAKE_CODEX