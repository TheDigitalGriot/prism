---
stage: I7-fix
tool: Prism
date: 2026-09-05
lane: suite-wide ICM/invariant rollout (handoff item 1)
recon: .prism/shared/research/2026-09-05_icm-invariant-recon.md
---

# Stage contract — Prism I7 key alignment (griot_assert consumer loop)

## Inputs (exact paths — working vs reference)
- WORKING (edit): scripts/verify-invariants.mjs — the I7 block, the timestamp
  freshness parse. Current line: Date.parse(r.at || r.t || r.time || '').
- REFERENCE (read only): scripts/digital-griot-mcp/digital-griot-mcp.ts lines
  927-946 — griot_assert PHASE 2 recorder. It builds
  record = { when, claim, target, expression, expect, actual, rung, verdict }
  and appendFileSync to assertions.jsonl. The timestamp key is `when` (ISO).
- EVIDENCE (read only): .prism/local/assertions/assertions.jsonl — confirmed
  on-disk record shape: {"when":"...", ..., "rung":"...", "verdict":"..."}.

## Locked decisions (do not re-derive; do not expand scope)
1. The ONLY code change: in scripts/verify-invariants.mjs, the I7 freshness
   parse, prepend r.when so it reads the key the recorder writes:
   NEW: Date.parse(r.when || r.at || r.t || r.time || '')
   Keep the at/t/time fallbacks (robustness / foreign records).
2. DO NOT modify I4. Its keys (r.verdict, r.rung) already match the recorder;
   it is correct. Touching it would be improvising against a working check.
3. No other invariant, no refactor, no reformat, no other source file. The diff
   in verify-invariants.mjs is a single changed line.
4. Close the loop authentically: after the edit, RUN the gate and OBSERVE the
   I7 row, then record ONE griot_assert verdict of the observed outcome (a real
   observation, never a hand-written record). Claim: verify-invariants I7 reads
   the recorder when key and reports PASS on a session with recorded verdicts.

## Process (numbered)
1. Heartbeat STEP1_GROUNDING. Read the I7 block in verify-invariants.mjs;
   confirm the parse line matches locked decision 1 before editing.
2. Apply the single-line edit (locked decision 1). Heartbeat STEP2_EDIT.
3. Run: node scripts/verify-invariants.mjs — capture full output. Confirm the
   I7 row prints PASS. If it prints UNVERIFIED (none in last 24h), note the
   newest assertion timestamp and proceed to step 4 to record a fresh one.
   Heartbeat STEP3_GATE.
4. Record the observation via the griot_assert MCP tool, phase 2, with
   result = { actual: <the I7 row text>, passed: true, rung: cli }.
   Heartbeat STEP4_VERDICT.
5. Re-run: node scripts/verify-invariants.mjs — confirm I7 = PASS and that no
   invariant that was PASS/UNVERIFIED before is now FAIL. Heartbeat STEP5_REVERIFY.
6. Emit git --no-pager diff --stat and git --no-pager diff
   scripts/verify-invariants.mjs. Heartbeat DONE_I7_PASS.

## Success criteria
- node scripts/verify-invariants.mjs prints: I7  PASS  observation precedes the fix
- A fresh (2026-09-05) record exists in .prism/local/assertions/assertions.jsonl.
- git diff of verify-invariants.mjs = exactly one changed line (the I7 parse).
  No other source file changed (assertion record + heartbeat under .prism/local
  are expected).
- No previously PASS/UNVERIFIED invariant is now FAIL due to this change.

## Heartbeat tokens (append to .prism/local/I7-fix-progress.txt)
STEP1_GROUNDING · STEP2_EDIT · STEP3_GATE · STEP4_VERDICT · STEP5_REVERIFY · DONE_I7_PASS
