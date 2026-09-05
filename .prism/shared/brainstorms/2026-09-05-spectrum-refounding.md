# Decision Ledger — Spectrum re-founding

Date: 2026-09-05
Session: prism-brainstorm visual companion (session 761), decisions made by Gavin
Upstream: `.prism/shared/plans/2026-09-05-spectrum-refounding-PROPOSAL.md` (the 5 open questions)
Grounding: `.prism/shared/research/2026-09-05-spectrum-refounding.md`

This is a ledger of locked decisions and parked concerns — not an architecture doc.

## Locked

### Q0 · Spectrum = Griot's implementation of ICM — LOCKED 2026-09-04
ICM is the protocol; Spectrum is the Griot implementation of it. Contract vs implementation, like POSIX/Linux. (Locked in a prior session; the questions below are what that commits us to.)

### Q3 · Does spectrum.sh survive? — LOCKED 2026-09-05: RETIRE THE LOOP
**Decision:** Retire the Ralph loop. Replace its one real job — long autonomous runs — with a NEW ICM-native runner, `scripts/spectrum-marathon.sh`.

Not option A as written (which loses overnight autonomy) and not B (which keeps the loop): **A with an ICM replacement**. The marathon runner gives the re-founded Spectrum its long form without carrying any of the loop's machinery.

**What the marathon runner is** (`scripts/spectrum-marathon.sh`, commit `be1171b`, named `9d1d16c`):
- Walks a stage-structured ICM workspace: numbered stage folders (`NN_*`), each a `CONTEXT.md` contract (authored by spectrum-architect) with an `output/`.
- One fresh, bounded agent per stage — reads only that stage's contract + the inputs it names (invariant 7, 2–8k tokens). Never reloads.
- Advances ONLY when a stage's output exists on disk (invariant 9: the filesystem is the state machine). No signal to lie about.
- Long-form (default): walks every stage unattended — the overnight capability the loop provided. Supervised (`SPECTRUM_SUPERVISED=1`): pauses at each output edit surface (invariant 6).
- Carries NONE of the old script's machinery: no MAX_ITERATIONS, no lockfile-signal, no state-verification, no story queue. Gavin's call: rely on nothing in the old script; it "might corrupt the beautiful fluidity our methodology has." ICM makes that machinery unnecessary — a file cannot lie, so there is nothing to verify.

**The old `scripts/spectrum.sh`** is marked RETIRED (kept for reference, backed up to `D:\GriotBackups\spectrum_2026-09-05_122443`). Hard removal is Gavin's ceremony.

## Proposed — Gavin's remaining calls (NOT locked)

- **Q1 · Stories vs stages** — Rec: **B** (stage-walk *wraps* stories; `stories.json` stays the queue, each story executes as a walk). Only option respecting the §5 parking while moving the foundation. Coupled to Q3: with the marathon runner in place, "wraps" now means a story's execution IS a marathon over its stages.
- **Q2 · Measure the ICM token claim** — Rec: **B** (measure Prism-side; the harness is in-repo). Turns the thesis from a claim into an observation.
- **Q4 · `spectrum-architect` name** — Rec: **B** (keep it canonical; `icm-architect` a PERMANENT attribution alias, not a deprecation countdown).
- **Q5 · When the CLI/desktop parking lifts** — Rec: **B** (on Gavin's recorded trigger — after the ICM/Spectrum ledger and the three carrier edits land, its own conversation).

## Parked

- **Legacy Spectrum surfaces — stories + Ralph loops (CLI/desktop).** Out of scope by Gavin's explicit parking: no changes to `apps/prism-cli` or the Electron surfaces in any first pass. Revisit: its own conversation, after the ledger and the three carrier edits land.

## Next

- Q1/Q2/Q4/Q5 await Gavin's calls (companion session 761 is live for these).
- With Q1, wire the "wraps" relationship: a story's execution dispatches `spectrum-marathon` over its stage contracts.
- Straggler logged: the Prism viz engine (brainstorm boards need it; hand-ASCII is the stopgap) — drift codex entry, ref the prism-viz-engine-cluster codex board.
