---
date: 2026-09-05
researcher: Claude (Cowork)
topic: "Suite-wide ICM / invariant recon"
tags: [research, icm, invariants, suite-wide, recon]
status: complete
artifact: https://claude.ai/code/artifact/f9862d5f-bbfe-43b8-a86c-ec7c9a01fd71
---

# ICM / Invariant Recon — Griot Suite (2026-09-05)

**Question (Gavin, verbatim from the 2026-09-04 handback §5):** where in Prism, Fragment, Cinopsis, Lucid and ALL the Griot tools could we strengthen them with the ICM stage-walk + invariant pattern.

**Method:** a per-tool agent fan-out over the mounted repos (`~/mnt/GriotApps`, `~/mnt/GriotProducts`). 12 tools with git repos got a dedicated agent that inspected the repo device-side and scored 7 dimensions. 6 pre-scaffold tools (no repo) are flagged for adopt-at-scaffold.

**Published artifact (the visual reference):** https://claude.ai/code/artifact/f9862d5f-bbfe-43b8-a86c-ec7c9a01fd71

## The cross-cutting finding (the highest-leverage move)

Nearly every tool **mutates state** (a file, a knowledge graph, a DAW live-set, a canvas, a 3D scene) and **reports success without reading it back**. `write-through` is broadly strong — results land on disk — but **verification of those writes** is the near-universal gap. A single **I4-style "confirmed reflected, else revert / refuse done"** readback gate is the highest-leverage add across the suite.

The reference itself proves it: **Prism's keystone I7 is inert** — the `griot_assert` recorder writes the timestamp key `when`, but `verify-invariants.mjs` reads `at`/`t`/`time`, so I7 reports UNVERIFIED against its own repo. Fix that first.

## Scores (0 = absent = biggest opportunity · 2 = strong) · Ready = sum/12

| Tool | Stage | Heartbeat | Write-through | Deleg. read | Verdict rec. | Soft-fix | Ready |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Prism (reference) | 2 | 2 | 2 | 2 | 2 | 2 | 12 |
| Cinopsis | 2 | 2 | 2 | 2 | 1 | 0 | 9 |
| Djeli | 1 | 1 | 2 | 2 | 1 | 2 | 9 |
| Lucid | 2 | 2 | 0 | 2 | 1 | 1 | 8 |
| Valence | 1 | 1 | 1 | 2 | 1 | 1 | 7 |
| Prism Design Engine | 1 | 1 | 1 | 1 | 2 | 1 | 7 |
| Fragment (foundational) | 0 | 0 | 2 | 1 | 1 | 2 | 6 |
| R3F Studio | 1 | 0 | 1 | 1 | 2 | 1 | 6 |
| Tesseract | 1 | 0 | 2 | 1 | 0 | 1 | 5 |
| Griot Hub | 1 | 0 | 1 | 1 | 1 | 1 | 5 |
| Synaptiq | 0 | 0 | 1 | 1 | 0 | 1 | 3 |
| Kora | 0 | 0 | 1 | 0 | 0 | 1 | 2 |

## Per-tool — computable invariants + the one move + notable finding

### Prism (12/12 — the reference)
- **Invariants:** I1–I8 already shipped + executed at the ceremony gate; I1/I3/I4 degrade to `unverified` with no live session artifact.
- **The one move:** Fix I7 (and the I4/I7 freshness parsing) in `scripts/verify-invariants.mjs` to read the `when` field the recorder (`digital-griot-mcp.ts` ~line 931) actually writes. I3 also leans on a transcript-tail heuristic.
- **Finding:** the flagship's own keystone invariant reports UNVERIFIED against itself — a pure key-name mismatch. This inertness means `griot_assert`'s intended consumer (I7) never actually closes its loop.

### Cinopsis (9/12)
- **Invariants:** (1) a video is ingested iff `transcript_<id>.txt` exists, non-empty, no block-marker stub, `description_<id>.txt` present, id in `videos.json`; (2) a digest is complete iff it covers only ids with real transcripts on disk; (3) a comparison session is served iff its `data_file` JSON + `index.json` entry are both written + `persist_session` promoted it.
- **The one move:** ship a committed `scripts/verify_invariants.py` computing the three props; make it the gate every fetch/digest/compare run passes before printing success.
- **Finding (soft-fix 0):** the "bulletproof ingestion architecture" doc (`.prism/shared/cinopsis-ingestion-bulletproof-architecture.md`: Data API v3, OAuth, Supadata) has **ZERO on-disk implementation** (grep `googleapiclient|playlistItems|InstalledAppFlow|Supadata` = nothing) — an I8 violation. The whole ICM apparatus is gitignored under `.prism/`, so it never ships with the plugin.

### Djeli (9/12)
- **Invariants:** (1) a non-done panel must have a status hook within `AGENT_STATUS_STALE_AFTER_MS` (30min) — silent = stuck, not working; (2) a session is `done` only when every subagent is idle AND the worktree is clean; (3) every `done` carries a recorded, replayable evidence artifact (I8-analog).
- **The one move:** a `verify-invariants`-style gate on the agent-run panel: heartbeat-fresh + all-subagents-idle + worktree-clean + evidence-recorded, so "done" is checked not self-reported.
- **Finding:** still an early stablyai/orca fork — `package.json` name is `"orca"`, zero `djeli`/`griot` refs in `src/`; the only Griot hook is `CLAUDE.md` importing `agent-ontology`. It DOES inherit a mature CI invariant culture (`config/reliability-gates.jsonc` oracles, ratchets, atomic write-through).

### Lucid (8/12)
- **Invariants:** I-A every terminal `GenJobSpec` has its output asset on disk, non-zero, matching the requested kind; I-B no job done with empty `provenance.locked_decisions`; I-C no consumer `status:'live'` unless the target daemon (Open Design :7456) was actually reached (I4).
- **The one move:** ship a `verify-invariants` gate with the P3/P4 gen backend — block a `GenJobSpec` → done until the asset provably exists in the requested format, tracing to a locked decision.
- **Finding:** pre-consolidation (2 commits: Fragment scaffold + intent port); the whole gen half is `status:'stub'`. It already has the ICM front-end (stage contracts, heartbeat, delegated read) and zero completion gates.

### Valence (7/12)
- **Invariants:** I1 every ingested session parses with zero silently-dropped JSONL entries; I2 every subagent span resolves to a parent (`ProcessLinker` orphan count == 0); I3 parsed message count == persisted count.
- **The one move:** gate "trace ingested" on dropped==0 + orphans==0 + parsed==persisted — turn the parser's silent `catch{continue}` / timing-fallback into computable checks (exactly the no-dropped-spans guarantee an observability platform must make).
- **Finding:** NOT an unmodified Superset fork — only the README says so; the actual v2 engine under `packages/` is an original Claude Code session-observability parser of `~/.claude/projects` JSONL.

### Prism Design Engine (7/12)
- **Invariants:** (a) every materialized prototype renders in the sandbox with zero console/page errors before shipped; (b) the generated set covers every screen in the requested set; (c) no published artifact retains placeholders or is a shrunken stub.
- **The one move:** promote the scattered write-boundary guards (`artifact-stub-guard.ts`, `artifact-publication-guard.ts`) + the critique/conformance scoring into one named `verify-invariants`-style gate every prototype must pass.
- **Finding:** largely an unmodified open-design fork — `package.json` name `"open-design"` v0.10.0, 2 Griot commits atop; no `verify-invariants.mjs` present.

### Fragment (6/12 — FOUNDATIONAL, own session)
- **Invariants:** I1 every requested surface has an `apps/<surface>/` dir + its `manifest.workspaceEntry` in root `package.json workspaces` (no requested-but-absent surface); I2 no emitted file still contains an unreplaced `{{token}}`; I3 after `connect`, each glue file exists under `apps/<surface>/src/plugin-glue/` AND is imported by that surface's entry point (no zero-caller glue), and the workspace `tsc`-builds / `npm install` exits 0.
- **The one move:** a `verify-fragment.mjs` gate after `init`/`add`/`connect` that turns today's "created/wired" prints into a computable verdict, writing a `.fragment/<cmd>-progress.txt` heartbeat as it checks.
- **Finding:** `runInit` is a monolith (5 numbered code-comments, no per-stage contract); `connect.ts` prints "Wired surfaces" straight from generator return values with no on-disk/import verification. **Gavin flags Fragment as fundamental to the whole toolchain → its own dedicated Claude Code session.** Minor drift: `mobile`/`mcp` are VALID_SURFACES with templates+generators but undocumented in the skills' CLI reference.

### R3F Studio (6/12)
- **Invariants:** (I) every exported `.glb` validates with 0 errors — tris>0, no empty `TEX_IMAGE` (the `find_empty_textures` check in `verification.py`), all buffers/images resolve; (II) post-optimize metrics MEASURED from the actual output GLB, ≤ profile budget AND ≤ original on every axis; (III) on hydrate, every `AssetRef` resolves to a readable file + every `SceneNode.assetId` → a live AssetRef.
- **The one move:** `src/services/optimizer.ts` only SIMULATES reduction metrics ("placeholder... simulates what gltf-transform would produce") — a gate measuring the real emitted GLB converts Export from an unchecked success into a computable done.
- **Finding:** validation discipline exists for research (recorded `✅ P0 PASSES` tables) but not for the runtime optimize/export path.

### Tesseract (5/12)
- **Invariants:** I1 every connected monitor in `TesseractState.Monitors` maps to exactly one `ActiveDesktop` in `[0, DesktopCount)`; I2 every non-pinned `TrackedWindow` belongs to exactly one desktop list (no window on two desktops, none orphaned); I3 `tesseract-state.json` round-trips after restart with zero loss.
- **The one move:** a `verify-invariants` gate (small C# self-check or CI) computing I1–I3 against a freshly reloaded state after each build/switch + a recorded verdict.
- **Finding:** verdict_recording 0 — no `.prism/stories/`, state, progress, tests or CI exist; the contract describes verdict recording but nothing produces one. Write-through IS strong (`SaveState()` after every mutating op).

### Griot Hub (5/12)
- **Invariants:** (1) every tool in `~/.griot-hub/tools.json` with an `actions.launch` resolves to an installed artifact AND a spawnable command; (2) every install artifact's cached version reconciles to a real GitHub release asset; (3) every `open-claude`/`vscode-url` target `local_path` exists + resolves.
- **The one move:** a gate that walks `tools.json` and computes that every registered tool resolves to a real launch target — the design doc's prose "Success Criteria" made computable before the dashboard reports any tool ready.
- **Finding:** much is designed-but-unimplemented — `main.ts` holds chat/timeline/model purely in memory, zero `writeFileSync`; the "self-healing state" + fallback paths exist only in the design doc.

### Synaptiq (3/12 — biggest gap)
- **Invariants:** (I) after `create_note` returns success, a note with that title is actually on the canvas (readback/screenshot match — no orphan claim); (II) each `writeSyncFile` bumps `meta.sequenceNumber` monotonically + the on-disk JSON re-parses (no torn/corrupt graph); (III) every edge references two existing node ids + no two nodes occupy the same position.
- **The one move:** wrap the MCP write tools (`create_note`/`create_board`/`create_multiple_notes`) in an I4-style gate — after each mutation, screenshot-verify or read back via a new graph-query tool that the node landed with the correct title/position before returning; record the verdict.
- **Finding:** verdict_recording 0 — `service.py:169 return f"Created note '{title}'…"` claims success unconditionally; an unfocused/failed keystroke still reports "Created" with no verification. The Electron sync side IS atomic (tmp→renameSync + sequenceNumber), but the agent graph mutation is fire-and-forget keystrokes that never touch that durable store.

### Kora (2/12 — biggest gap)
- **Invariants:** I-a after `live_set_tempo(bpm)`, a readback `song.get("tempo") === bpm` (currently NOT checked — `bridge.setTempo` just `song.set` and returns); I-b every `SafeWriter.write` left a timestamped `.bak` in `backupDir` (the mutation is reversible); I-c no file-write tool ran while `liveGuard(path) === true` (the open set was never clobbered).
- **The one move:** extend SafeWriter's computable confirmation to the LOM path — every `live_set_*` reads its value back and asserts equality (rollback / refuse "done" on mismatch) + records the verdict.
- **Finding:** SafeWriter proves the file-side invariant (optimistic-lock + atomic tmp→fsync→rename + a 20-deep backup ring), but the LOM path does zero readback; `getSession` is an unbounded main-connection bulk read (`Promise.all(tracks.map(t=>t.get("name")))`).

## Pre-scaffold tools — adopt the pattern at scaffold time
No git repo yet, so nothing to retrofit — the cheapest possible adoption is to bake the stage contract + a `verify-invariants` gate into the scaffold before the first line of product code. Especially the agent-native ones, where the invariant layer is a design primitive.

- **Audion** — real-time listening / invisible teleprompter
- **Meridian** — attention substrate (its DGS tab shipped; the app itself isn't scaffolded)
- **Kente** (folder still `ModelMaker`) — model-building forge
- **Damus** (folder `quiz-assistant-app`) — screenshot quiz analyzer
- **Anansi** — agent-native game engine
- **keylink** — per-device keyboard remapping

## Suggested execution order (biggest value first)
1. **Prism · fix I7** — read the `when` key the recorder writes; unblocks the pattern's own credibility + closes `griot_assert`'s consumer loop. Small, high-signal.
2. **Fragment · verify-fragment.mjs** — foundational (it emits what Prism is); its own dedicated session.
3. **Kora + Synaptiq · I4 readback gates** — the biggest raw gaps; both mutate live state and report success blind.
4. **Cinopsis · commit the gate** (`verify_invariants.py`) + resolve the zero-implementation "bulletproof ingestion" doc (build it or delete it).
5. **Lucid / R3F / Griot Hub / Tesseract / Valence / Design Engine** — each has one named gate to add; most already write-through, they just don't verify.

## Agents
12-agent fan-out, each returning a structured row. Agent ids (for continuation if a row needs a deeper pass): Fragment a648bd147856f2735 · Cinopsis a2a6a6d1a654af754 · Prism aa8e14de6311619a7 · Synaptiq a874fc22f185c4730 · Djeli ad10118e0c7b21bb2 · Griot Hub a480af053a77841ea · Lucid ae110b0cdf79c7dc5 · Valence a317724a05136ef00 · R3F Studio a095d7755f4ae96ed · Tesseract a0e75048d10a178ef · Kora a6535bb599af67510 · Prism Design Engine a6eff6f5553995fe4.
