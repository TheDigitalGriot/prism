# Stage contract - spectrum-headless-rule

Date: 2026-10-24 · Plan-nod: Gavin 17:04 "please complete all owed end to end full green light nothing left incomplete. full permission granted" · Executor: headless claude.exe -p in C:\Users\digit\GriotApps\Prism via prism:griot-agent-architect, --add-dir C:\Users\digit\GriotMeta\digital-griot-skills
Closes: drift ledger "Headless griot-scrape v2 architect backgrounded its smoke re-run and ended its -p turn..." (entry 382) whose fix names this owed step: "the line in the Spectrum stage-contract template itself, so contracts authored anywhere inherit it"; and the older mixdown entry with the same prescription.

## Inputs
### Working
- Prism: skills/spectrum-architect/assets/templates/prism-stage-CONTEXT.md and skills/spectrum-architect/references/prism-run-contract.md (add a HEADLESS RULE section; never strip)
- digital-griot-skills: griot-branch-codex/templates/stage-CONTEXT.md.tmpl (same section)
### Reference
- The proven rule text, verbatim below (validated by griot-scrape v2 run 2, v3, v3.1, v3.2 headless runs 2026-10-23/24)
- griot-ontology/claude/CLAUDE.md sections: THE UNGATED PROPAGATION TARGET (I11), any change to a Griot-suite tool goes through griot-agent-architect

## Decisions (locked)
- R1 Insert the rule below as a section in each template, worded generically (replace stage-specific paths with placeholders like <job>, <marker>), keeping the two measured facts: claude -p ends the process when the turn ends, and 'wsl -- setsid ... & disown' does not survive wsl.exe exiting (use a Windows-side Start-Process wsl.exe running a script file; an inline bash -lc string passed through Start-Process -ArgumentList died silently on 2026-10-24).
- R2 Do not change any other template section.
- R3 Follow each repo's own propagation convention after commit (Prism: the plugin's deployed copies the architect skill names, I11; digital-griot-skills: live skill home under ~/.claude/skills with SHA-256 parity). Record every surface touched and every surface not touched with the reason.
- R4 Commits carry NO Claude attribution (prism:commit convention). Push both repos.

## HEADLESS RULE (drift ledger: "The headless mixdown agent backgrounded sync-all and ended its -p turn"; recurred 2026-10-23 on this stage)
- This run is claude.exe -p: ending your turn ENDS THE PROCESS and kills anything you backgrounded (run 1 of this stage died with EPIPE that way).
- Never use run_in_background, Monitor, or "I'll wait for the task" and then reply. Launch any job longer than ~9 minutes detached from the WINDOWS side (Start-Process wsl.exe -WindowStyle Hidden owning the job, logging to /mnt/c and writing an exit marker; measured 2026-10-23 v2 run 2 finding F3: 'wsl -- setsid ... & disown' does NOT survive wsl.exe exiting, the job never starts), then WAIT INSIDE THE RUN with repeated foreground commands, each under 9 minutes, that sleep-loop on the marker file's existence. Only after the marker exists may you continue. Do not end your turn until the DONE or BLOCKED marker is written.

## Process
1. Load architect conventions + R1-R4. Heartbeat: loaded
2. Edit the three files. Heartbeat: implemented
3. Validate: the architect's validator on spectrum-architect and on griot-branch-codex; grep each file for the section heading. Heartbeat: validated
4. Commit + push both repos; propagate per R3. Heartbeat: committed <prism sha> <skills sha>
5. Write .prism/spectrum-headless-rule.DONE (in the Prism repo) with both shas, surfaces propagated, surfaces skipped; or .BLOCKED.

## Heartbeat
Append `<ISO> <token> <note>` to .prism/spectrum-headless-rule-progress.txt (Prism repo)
