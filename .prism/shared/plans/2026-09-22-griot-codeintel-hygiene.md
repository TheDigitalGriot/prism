---
epic: griot-codeintel-hygiene
date: 2026-09-22
source: .prism/shared/plans/2026-09-22-codex-plan-sync-eve-CONTEXT.md
status: ready
---

# Griot code-intel hygiene — six gates that measure the wrong thing

## My Understanding

**Goal.** Repair six mechanical defects surfaced by the gortex harvest and the Djeli branch
workgraph on 2026-09-22. Every one is a gate, a declared capability, or a generated surface that
reports a state it is not actually measuring. None of them requires a ruling from Gavin — each has
a determinate right answer and a named owner, which is precisely why they are decomposed here while
the nine gortex lifts, the workspace scope, and the four-layer sync design are not.

**Key files.**
- `scripts/verify-code-intel.mjs` — I15 bundles two independent capabilities into one verdict.
- `agents/graph-navigator.md:4`, `apps/prism-setup/resources/plugin/agents/graph-navigator.md:4`,
  `.prism/shared/docs/code-intel/prism-code-intelligence-integration.md:78,:299` — the "11 tools" claim.
- `scripts/workgraph-index.mjs` — the generator nothing re-runs.
- `griot-live-artifacts/verify-cards.ps1` — the card gate (two separate defects).
- `griot-ontology/propagate.ps1` — copies the ontology, does not render its codex.

**Patterns.** Every fix follows the ontology's gate law: *a gate must measure the right quantity, in
the right place, and a rule with no gate is decoration.* Each story therefore ends in a command that
can FAIL, not in a corrected file.

**Constraints.**
- Stories that touch `griot-live-artifacts` or `griot-ontology` are authored here but land in those
  repos; this epic's back-link lives in Prism because Prism owns the story store.
- No story may force a check green. A capability with no provider must still fail — `verify-code-intel.mjs`
  states its own honesty rule: *unverified is not pass.*

**Questions.** None outstanding. Every unknown in this epic was resolved by observation on 2026-09-22
and is cited inline in the story `steps`.

## Approach Options

**Option A — patch the six files.** Rejected. Five of the six defects are *already* a corrected file
sitting behind a check that cannot see the correction; patching without moving the check reproduces
the exact failure class (N100: the registry rows existed and the gate still reported NO CARD).

**Option B — move the measurement, then patch (chosen).** For each defect, fix what the check
measures or where it looks, and only then correct the data. This is the shape that worked for
`verify-cards.ps1` on 2026-09-17 (hash the body, not the size) and for stage 4 (point at the path the
skill actually writes).

## Proposed Phases

### Phase 1 — gate integrity (the checks that currently lie)
Stories `s-4bee6675`, `s-b02d6c48`, `s-3eeb40a6`. These come first because a wrong verdict is worse
than a missing one: it reassures.

#### Automated Verification:
- [ ] `node scripts/verify-code-intel.mjs` emits a separate verdict line per capability
- [ ] `pwsh verify-cards.ps1` reports in-sync for a card whose read-back is byte-identical
- [ ] `pwsh verify-cards.ps1` reports zero NO-CARD rows for codexes carrying a registry row

#### Manual Verification:
- [ ] Publish one card, read it back, and confirm the gate agrees with the read-back

**Checkpoint**: [ ] Phase 1 complete

### Phase 2 — freshness owners (generated surfaces nothing regenerates)
Stories `s-5ff38680`, `s-8f068ed6`.

#### Automated Verification:
- [ ] `node scripts/workgraph-index.mjs` regenerates `index.json` and a staleness check fails when it trails
- [ ] a check fails when `griot-ontology-codex.html` is older than the ontology's last commit

#### Manual Verification:
- [ ] Confirm the regenerated index node/edge counts are plausible against the branch graphs

**Checkpoint**: [ ] Phase 2 complete

### Phase 3 — declared-vs-actual drift
Story `s-10c2e47d`.

#### Automated Verification:
- [ ] zero hits for `11 tools` outside `.prism/shared/evals/`
- [ ] a check fails when the declared tool count differs from the server's actual count

#### Manual Verification:
- [ ] `graph-navigator` still resolves its tools after the frontmatter edit

**Checkpoint**: [ ] Phase 3 complete

## Structural Impact (graph-informed)

`scripts/verify-code-intel.mjs` is auto-discovered by `pre-release-audit.mjs` (globs
`scripts/verify-*.mjs`), so I15's verdict shape reaches the closing-ceremony gate. Changing it
changes what the ceremony halts on — intended, and the reason story `s-4bee6675` must not force green.

## What We're NOT Doing

- **Not deciding the nine gortex lifts L1-L9** (workgraph S15). Gavin's ruling; surfaced, not scoped.
- **Not ruling gortex adopt/trial/defer/pass**, and not adding it to the Potluck shelf or a paired
  `oss-inspo` row (harvest O2). That is a `dgs-plan-update` call this stage does not make.
- **Not scoping the S13 Djeli code-intel workspace.** Gavin's call.
- **Not designing the S14 four-layer sync.** Gavin's call.
- **Not choosing the app-codex fan-out A vs B.** Gavin's call.
- **Not ruling the licence posture** for gortex (Apache-2.0 engine, PolyForm-Small-Business UI) —
  harvest O7 states the call is Gavin's alone.
- **Not resolving consolidation vs specialisation** across the three code-intel engines (~1.07GB,
  harvest O4 / workgraph N103) — explicitly "a decision, not a defect."
- **Not wiring `code-review-graph` into any skill or agent.** It has zero callers (invariant I8
  territory), but wiring it is the consolidation decision above, not hygiene.
- **Not re-scoping or re-opening `channel-adoption`** (workgraph OA20). Reported only.
- **Not moving the two loose story stores** at the `.prism/stories` root (workgraph OA21). Reported only.
- **Not correcting the port-51900 note** (workgraph OA22) — it is Gavin's own observation and may be
  a custom port; asking beats silently rewriting.
- **Not correcting the `code-review-graph` shelf blurb** (version 4.17.0 vs 2.3.8, the 31,000-star
  claim — harvest O3). It is a plan/Potluck edit, and D6 reserves plan edits for the session.
- **Not editing the DGS plan HTML or publishing any artifact** in this pass (D6).

## Session Notes - 2026-09-22

Emitted by the codex-plan-sync evening stage under
`.prism/shared/plans/2026-09-22-codex-plan-sync-eve-CONTEXT.md`.

Two corrections to the stage contract's framing, both observed rather than inferred:

1. **D3(b) is imprecise.** `CLAUDE.md` carries no tool count. The "11" claim lives in four
   non-snapshot locations, one of which — `apps/prism-setup/resources/plugin/agents/graph-navigator.md`
   — is a propagation-target copy, so correcting only the authored agent would leave the shipped
   scaffold wrong. A separate naming drift rides along: the agent body calls the tool
   `trace_call_path`; the server's actual tool is `trace_path`.
2. **Story ids use `s-<hash8>`, not `STORY-NNN`.** D3 says "stable STORY-NNN ids per the stories
   contract", but the cited authority — `.prism/shared/contracts/stories-contract.md` rule 4 — states
   the id is a content hash and is "NOT a sequential label like STORY-001", and
   `dgs-sync-all.ps1:210-219` classifies `s-<hash8>` as contract-compliant and `STORY-NNN` as the
   forbidden dialect B. The `STORY-NNN` wording is the skill's known-wrong line. Executing the cited
   authority; flagged for Gavin rather than decided silently.

Also observed: **three** id conventions exist, not two. `griot-mcp-comm-layer.stories.json` uses
`GMCL-CN`, which the stage-4 gate classifies as "unknown".
