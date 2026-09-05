---
date: 2026-09-05T00:00:00-04:00
researcher: Claude
git_commit: 9528fd973f9af1a0ffd1eae4e4a3c951d0e7bdde
branch: main
topic: "Kill the deprecated update_artifact / create_artifact across the skills Handoff"
tags: [handoff, skills, artifact, dgs-tools, cleanup]
status: planned
---

# Handoff: Sweep the dead update_artifact / create_artifact out of the skills

## Task(s)
**Planned.** `update_artifact` / `create_artifact` (and `mcp__remote-devices__*_artifact`) are **deprecated / unmounted in cloud Cowork**. They are baked into several skills as literal steps, so whenever one of those skills runs in cloud and reaches that step, it FAILS — and the agent either stalls or improvises. It bit `/dgs-plan-update` in the 2026-09-05 session (its SKILL.md step 6 literally says `update_artifact(id, file_uuid, …)`). The fix is one mechanical swap everywhere, plus a note so it never returns.

**The correct socket (from Gavin's global CLAUDE.md, `# publishing / refreshing a live artifact from cloud Cowork`):** the top-level `Artifact` tool. Publish = strip `<!DOCTYPE>/<html>/<head>/<body>` (keep `<title>` + `<style>` + body-content + `<script>`), call the `Artifact` tool; republish the same file path in-conversation to keep the URL, or pass `url=` to update from another conversation. The git `griot-live-artifacts` commit is the source-of-truth half; the `Artifact` publish is the card-refresh half — do BOTH.

## Critical References
- Gavin's global CLAUDE.md section `# publishing / refreshing a live artifact from cloud Cowork` (also in `GriotMeta/agent-ontology/claude/CLAUDE.md`) — the canonical replacement pattern.
- The 5 offending files (grep of `C:\Users\digit\.claude\skills` for the dead terms, 2026-09-05):

| Hits | Skill file |
|:--:|---|
| 9 | `griot-meridian-reflect/SKILL.md` (worst offender) |
| 4 | `griot-app-codex/consolidation-ritual.md` |
| 1 | `dgs-plan-update/SKILL.md` |
| 1 | `chat-log-access/SKILL.md` |
| 1 | `griot-potluck-search/SKILL.md` |

## The swap (apply in every file)
- `update_artifact(id="<id>", file_uuid=<uuid>, description=…, update_summary=…)` → `Artifact` tool, `action:"publish"`, `url="https://claude.ai/code/artifact/<id-or-url>"`, `file_path=<skeleton-stripped html>`, `description=…`. Read the artifact first (`Artifact action:"read" url=…`) to register, then publish.
- `create_artifact(...)` → `Artifact` tool publish WITHOUT `url=` (new artifact) + a `favicon`.
- `device_stage_files(artifact_ids=[…])` to READ a live artifact's body is fine (still works) — leave those; only the WRITE calls are dead.
- Add one line near each swap: "NOTE: create_artifact/update_artifact are deprecated/unmounted in cloud — the socket is the top-level `Artifact` tool."

## Action Items & Next Steps
1. Open each of the 5 files; replace every dead call with the `Artifact`-tool pattern above. `griot-meridian-reflect` (9) and `griot-app-codex/consolidation-ritual.md` (4) carry the bulk.
2. These are **standalone skills** — source of truth is `TheDigitalGriot/digital-griot-skills` (repo at `C:\Users\digit\GriotMeta\digital-griot-skills`). Edit the repo copy AND the deployed `~/.claude/skills/<name>/…` copy (or re-deploy). For the `SKILL.md` files, a Cowork session changes them via a skill-proposal card; a Claude Code session edits the files directly + commits to digital-griot-skills.
3. Grep-verify 0 remaining hits of `update_artifact|create_artifact` across `~/.claude/skills` and `digital-griot-skills` (allowed survivors: prose that explicitly says "deprecated").
4. Commit to `digital-griot-skills` and redeploy so Cowork/Desktop read the fixed versions.

## Learnings
This is a "soft fix that rots" in reverse — a dead API reference that keeps re-poisoning runs. Gavin's own global note flagged it ("griot-app-codex + dgs-plan-update SKILLs still name the dead create_artifact call — use the `Artifact` tool instead, and fix those skills."); the recon confirmed 3 MORE skills carry it.

## Finish
After the sweep + redeploy, run **`/dgs-plan-update`** to record the cleanup as a `suite` item (skills hardened: dead-artifact-API swept from 5 skills) so it's tracked. Use the correct `Artifact`-tool publish path for that very update — it is the reference implementation of the fix.
