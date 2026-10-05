# docs-reconcile-2 stage - close the two documented gaps (2026-10-05)

One job: add the two docs entries docs-reconcile skipped. Repo: C:\Users\digit\GriotApps\Prism. Docs only, prism-docs/ only. No version bumps/tag/push. Add in place, never strip.

## Inputs
- Reference (code-intel slices, no whole-file inlining): skills/prism-viz-generate/SKILL.md, the scripts/ + directory behind griot-viz-engine (git log --oneline -i --grep 'viz-engine'; commit 460d0a2 rename prism-viz-engine -> griot-viz-engine); brainstorm Gavel motion: commit ecf1bc1 and 1391b89 (server.cjs, helper.js, frame-template.html under the brainstorm skill); CHANGELOG 4.17.x entries; skills/prism-docs-update page-mapping rules.
- Working: prism-docs/docs/plugin/skills.md (+ the page that fits the brainstorm companion, per page mapping).

## Decisions (locked)
- Every claim checkable against a repo path. Name the engine griot-viz-engine (not prism-viz-engine) and say it was renamed.
- One commit: "docs: document griot-viz-engine and the brainstorm gavel motion" with trailer Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>.

## Process
1. Read the code slices. 2. Patch pages. 3. npm run docs:build passes. 4. commit; tree clean.

## Heartbeat
Append to .prism/docs-reconcile-progress.txt: start2, patched2=N, build-pass2, committed2=<hash>, DONE2. On block BLOCKED-<reason>.