# STAGE CONTRACT - prism-codex-plan-sync harvest + epic reconcile (2026-09-21, headless)

Invoked by Gavin: /prism:prism-codex-plan-sync, right after /dgs-plan-update (griot-live-artifacts fe71967). Gavin gave a full green light end to end, except the Hotwater Creative / Kayla seed rollout, which he runs live. Never call the Prism workflow RPIV. Anything unknown is recorded as unknown, never guessed.

## Inputs (exact paths)
- WORKING: C:\Users\digit\GriotApps\Prism\.prism\stories\ (ceremony-review-audit-gate 4 stories 59d, channel-adoption 25 stories 49d, prism-gavel 5 stories 54d) ; C:\Users\digit\GriotMeta\griot-live-artifacts\live\prism-codex.html ; live\djeli-codex.html ; the DGS plan CODEXES row for any codex amended (live\dgs-definitive-plan.html, via the dgs-plan-update skill rules only)
- REFERENCE: the prism-codex-plan-sync skill and its references (forward, reverse, mechanics - including the propagation-targets law); git history of GriotApps\Prism, GriotMeta\digital-griot-skills, GriotMeta\griot-live-artifacts since 2026-09-15 ; the workgraph live\djeli-branch-capture-workgraph.json (nodes B39-B48, N89-N93, B16, finding-prism-cli-tui)
- Write the progress heartbeat to .prism\codex-plan-sync-0921-progress.txt and the report to .prism\codex-plan-sync-0921-report.json

## Locked decisions
- D1 Run the skill exactly as it defines itself. Direction is REVERSE (build to codex) for this pass: harvest build-time discoveries executor-agnostically from git commit scopes and amend the codex with evidence. The forward direction (codex to plan to stories) runs only for epics the reverse pass shows are stale.
- D2 Codexes in scope: prism-codex (today: griot-output-style pills seed as the start of the prism-cli workgraph view, worktrunk adopt and nix-graph trial harvest rows already landed at v8, the S12 four-copy sync, the ceremony audit blind spot N91) and djeli-codex (workgraph B45 to B16 and finding-prism-cli-tui). Add others only if git scopes show a codex-backed app was built on since its last codex update, and list them.
- D3 Epic reconcile: for each of the three stale epics, compare every story status against git evidence and report which look done, still open, or superseded. Flip a story status only with a checkable anchor (commit sha or passing verify token). Never delete a story. Stable STORY-NNN ids are preserved; older s-hash ids are reported, not renamed.
- D4 Gavel: any OPEN decision the skill surfaces is recorded as open with options, never decided in this run.
- D5 Edit in place only. Never strip or reword existing codex content. A codex change goes repo first: commit and push griot-live-artifacts, verify HEAD equals origin/main. Do NOT publish artifacts (the Cowork session publishes after). Commit Prism .prism changes and push with ref equality. prism:commit convention, no Claude attribution.

## Process (heartbeat after each: STEP n START | STEP n OK detail | STEP n FAIL reason)
1 Load the skill and its references; enumerate propagation targets per the mechanics law. 2 Reverse harvest: git scopes since each codex's last update, mapped to codex sections. 3 Amend prism-codex and djeli-codex with evidence rows. 4 Epic reconcile per D3. 5 Open decisions per D4. 6 Commit and push each repo touched, ref equality. 7 Report JSON: per codex (sections amended, evidence shas), per epic (story counts by verdict, flips with anchors), open decisions, propagation targets with their gate state, publish list for the session. Terminal line DONE or BLOCKED: reason, written last.

## Success criteria
Both codexes amended with evidence and pushed; every epic story has a verdict; no decision made that belonged to Gavin; publish list names every card to republish.