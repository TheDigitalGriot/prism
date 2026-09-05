---
date: 2026-09-05T00:00:00-04:00
researcher: Claude
git_commit: 9528fd973f9af1a0ffd1eae4e4a3c951d0e7bdde
branch: main
topic: "Suite-wide ICM / invariant rollout Handoff"
tags: [handoff, icm, invariants, prism, fragment, cinopsis, kora, synaptiq, suite-wide]
status: planned
recon_artifact: https://claude.ai/code/artifact/f9862d5f-bbfe-43b8-a86c-ec7c9a01fd71
---

# Handoff: Roll the ICM stage-walk + invariant pattern across the Griot suite

## Task(s)
**Planned.** Turn the 2026-09-05 recon into shipped invariant gates, tool by tool. This is a *program* of small focused sessions, not one mega-session — pick a tool, ship its gate, move on. Recon is DONE; execution is this lane.

Source of truth (read first):
- Recon doc: `.prism/shared/research/2026-09-05_icm-invariant-recon.md` (full per-tool findings, invariants, evidence)
- Recon artifact (visual): https://claude.ai/code/artifact/f9862d5f-bbfe-43b8-a86c-ec7c9a01fd71
- The origin handback: `.prism/shared/handoffs/2026-09-04-claude-desktop-handback.md` (§5 = the ask; the invariant pattern's own definition)

## Critical References
- `Prism/scripts/verify-invariants.mjs` — the reference implementation of the pattern (I1–I8) to model every other tool's gate on.
- `Prism/scripts/digital-griot-mcp.ts` (~line 931) — the `griot_assert` recorder; the `when` timestamp key is central to the I7 bug below.
- `.prism/shared/research/2026-09-05_icm-invariant-recon.md` — per-tool invariants + the one move each.

## The cross-cutting principle (do not lose this)
Nearly every tool mutates state then reports success **without reading it back**. `write-through` is strong; the gap is **verification**. The universal add is an **I4-style "confirmed reflected, else revert / refuse done"** readback gate. Build each tool's gate as a small committed `verify-*` script (mjs/py/C#) that computes 2–3 propositions and is run before any run prints success — matching Prism's `verify-invariants.mjs`.

## Action Items & Next Steps (execution order — biggest value first)
1. **Prism · fix I7 (start here — small, high-signal).** `verify-invariants.mjs` reads `at`/`t`/`time` but the recorder writes `when`, so I7 reports UNVERIFIED against its own repo. Align the key (and the I4/I7 freshness parsing). This re-earns the pattern's credibility and closes `griot_assert`'s consumer loop. Verify by re-running the ceremony gate and seeing I7 flip to PASS on a session that recorded verdicts.
2. **Fragment · its own dedicated session (foundational).** Add `verify-fragment.mjs` run after `init`/`add`/`connect`: (I1) every requested surface has an `apps/<surface>/` dir + workspace entry; (I2) no emitted file has an unreplaced `{{token}}`; (I3) every generated glue file is imported by its entry point + the workspace builds. Write a `.fragment/<cmd>-progress.txt` heartbeat. Also: fold the Fragment-sync reconciliation (`fragment-sync` skill) into the same session, and document `mobile`/`mcp` surfaces in the CLI reference. See the dedicated Fragment prompt.
3. **Kora + Synaptiq · I4 readback gates (biggest raw gaps).** Kora: every `live_set_*` reads back + asserts equality against the LOM, rollback/refuse-done on mismatch (extend SafeWriter's proven pattern to the LOM path). Synaptiq: after each MCP write, readback/screenshot-verify the node landed with correct title/position before returning; add a graph-query tool if none exists.
4. **Cinopsis · commit the gate.** Ship `scripts/verify_invariants.py` computing the 3 ingest/digest/session props (see recon). AND resolve the `.prism/shared/cinopsis-ingestion-bulletproof-architecture.md` I8 soft-fix: it documents a Data-API/OAuth/Supadata path with zero on-disk implementation — build it or delete it.
5. **The rest, one gate each:** Lucid (block GenJobSpec→done until asset exists in requested format tracing to a locked decision), R3F Studio (measure the real emitted GLB, not the simulated optimizer placeholder), Griot Hub (walk tools.json → every tool resolves to a real launch target), Tesseract (I1–I3 against reloaded state + record a verdict), Valence (dropped==0 + orphans==0 + parsed==persisted), Prism Design Engine (unify stub/publication guards + critique into one named gate).
6. **Pre-scaffold tools** (Audion, Meridian, Kente/ModelMaker, Damus/quiz-assistant, Anansi, keylink): no retrofit — bake the stage contract + a `verify-invariants` gate into the scaffold when each is created.

## Method
Each tool is a Prism-style pass, run device-side (`claude.exe -p` headless in the repo, ICM stage-walk per the agent-ontology CLAUDE.md). Each gate goes through `/prism:cl-plugin-structure` if it touches plugin components. Keep each session to ONE tool's gate so it ships.

## Finish
When a batch of gates ships, run **`/dgs-plan-update`** to flip those items to shipped in the DGS Definitive Plan and record the new invariant coverage per node (the plan already has a `suite` "preference-to-invariant shift" item + per-tool nodes). Follow the git-first loop; the card-refresh half is the top-level `Artifact` tool with `url=` (NOT the deprecated `update_artifact`).

## Other Notes
Agent ids from the recon fan-out (continue one for a deeper per-tool pass): see the recon doc's "Agents" section.
