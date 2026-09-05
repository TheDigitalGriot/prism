---
stage: i9-decision-execution
tool: Prism
date: 2026-09-05
lane: suite-wide ICM/invariant rollout (candidate I9, adopted by Gavin 2026-09-05)
---

# Stage contract — I9: decisions carry an execution commit or explicit deferral

## Inputs (exact paths — working vs reference)
- WORKING (edit):
  - Prism/scripts/verify-invariants.mjs — insert an I9 block AFTER the I8 block (~line 272)
    and BEFORE the report section (~line 274, the `// ── report` comment). Model its shape,
    verdict vocabulary (pass/fail/unverified) and exit-code contribution on the I8 block.
  - GriotMeta/agent-ontology/claude/CLAUDE.md — the canonical ontology invariants list; add a
    one-line I9 entry alongside I1–I8 (documentation of the control).
- REFERENCE / GROUND TRUTH (honor, do not reassume):
  - CHANGELOG.md uses a per-version `### Decided, not executed` deferral ledger. The v4.14.0
    entry lists Q5 and NAMES its next step ("its own contracted session"). Executed decisions
    live under Added/Changed/Fixed, never in this ledger.
  - Decision docs live in .prism/shared/{brainstorms,designs,research}. There is NO single
    machine-readable decisions.jsonl.

## Locked decisions (do not re-derive; do not expand scope)
1. I9 name: "a decision carries an execution commit or an explicit deferral naming the next step."
   COMPUTABLE CORE (v1): parse CHANGELOG.md for `### Decided, not executed` ledger entries; each
   entry must NAME a next step / disposition (non-empty actionable text, e.g. "its own contracted
   session", a commit/next-step reference). Verdict:
   - UNVERIFIED if no `### Decided, not executed` ledger is present ("no deferral ledger — cannot tie
     decisions to execution").
   - FAIL if any deferral entry names no next step (a decision left in limbo).
   - PASS if every deferral entry names its path. (Q5 => PASS, correctly: it was a proper deferral.)
2. HONEST, never false-fail: do NOT build a fragile free-text "DECIDED" scanner across all docs
   (that is a v2 once a structured decision ledger exists — note it in the detail, do not build it).
   UNVERIFIED is the honest verdict when the control cannot compute.
3. Additive only: I9 is a NEW block; touch nothing in I1–I8. verify-invariants.mjs stays pure
   Node ESM, no deps; it is auto-discovered by pre-release-audit.mjs at the ceremony gate.
4. Ontology: add the I9 line to GriotMeta/agent-ontology/claude/CLAUDE.md invariants list. Do NOT
   run propagate.ps1 in this pass — flag the fan-out as a follow-on (it rides the task-10
   agent-ontology → griot-ontology sweep). The executable control (verify-invariants.mjs) is the
   primary deliverable.
5. Close the loop: record ONE griot_assert verdict of the observed I9 gate outcome (real
   observation, not a hand-written record).

## Process (numbered)
1. STEP1_GROUNDING: read the I8 block + report boundary in verify-invariants.mjs; read the
   CHANGELOG `### Decided, not executed` structure; locate the ontology invariants section. Heartbeat.
2. STEP2_I9: implement the I9 block (locked decision 1), modeled on I8. A small CHANGELOG parser:
   find each `### Decided, not executed` section, collect its bullet entries, flag any with no
   next-step text. Heartbeat.
3. STEP3_ONTOLOGY: add the I9 documentation line to the canonical ontology invariants list. Do NOT
   propagate. Heartbeat.
4. STEP4_GATE: run `node scripts/verify-invariants.mjs`; confirm an I9 row prints and I1–I8 are
   unchanged (no new FAIL). With Q5 naming its next step, I9 should PASS. Heartbeat.
5. STEP5_VERDICT: record the observation via the griot_assert MCP tool, phase 2,
   result={actual:<I9 row text>, passed:true, rung:cli}. Heartbeat.
6. STEP6_REVERIFY: re-run the gate; confirm I9 stable + no regressions. Heartbeat.
7. STEP7_DONE: emit git --no-pager diff --stat and the full I1–I9 board. Heartbeat DONE_I9.

## Success criteria
- verify-invariants.mjs prints an `I9  <verdict>  decisions carry a commit or named deferral  …` row.
- Q5 deferral => I9 PASS (proper deferral, not a slip); a deferral with no next step => FAIL.
- I1–I8 verdicts unchanged by this addition. Pure ESM, no deps. Fresh griot_assert verdict recorded.
- git diff = the I9 block in verify-invariants.mjs + one line in the ontology doc (+ heartbeat/verdict
  under .prism/local, which is gitignored).

## Heartbeat tokens (append to Prism/.prism/local/i9-progress.txt)
STEP1_GROUNDING · STEP2_I9 · STEP3_ONTOLOGY · STEP4_GATE · STEP5_VERDICT · STEP6_REVERIFY · DONE_I9
