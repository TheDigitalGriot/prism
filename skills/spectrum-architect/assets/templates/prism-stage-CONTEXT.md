# {stage} — Prism Stage Contract — {the job in five words}

## Role
{Where this runs (headless in <repo>, branch <name>) and the ONE stage of the Prism
pipeline it drives — research | plan | design | implement | validate | prd | decompose |
spectrum | subagent. State the single job; do not let the agent widen scope.}

## Inputs
- Working (this run): {exact paths the agent edits/produces this run — the plan, the target files}
- Reference (every run): {stable material pulled via code-intel, NOT inlined — reference docs, contracts}

Do NOT load: {what an eager agent would wrongly pull in — other stages' references, prior runs,
whole folders}. Ground every claim through the discovery agents (graph-navigator /
codebase-analyzer / codebase-locator / prism-locator); query the graph; never photocopy whole files.

## Locked Decisions
- {A locked call the agent must honor and NOT relitigate or ask about.}
- {Another locked decision. These are the contract — headless runs cannot answer questions,
  so every fork the run would otherwise stop on is decided here.}

## Process
1. Append heartbeat "{first-token}".
2. {Do the work in short, numbered, checkable steps. Load only what each step needs.}
3. {Restate hard limits worth repeating: length, count, format, files-not-to-touch.}
4. Append final "{done-token}". On any blocker, append "BLOCKED-<one-word-why>" and stop cleanly
   (leave the tree committed or clean, never half-edited).

## Success criteria
- {Checkable outcome — a command that passes, a file that exists, a test that is green.}
- {Scope guard — only the intended files changed; nothing out of scope touched.}

## Heartbeat tokens
Append one timestamped line per numbered step to `.prism/local/{stage}-progress.txt`:
{token-1} · {token-2} · {done-token} · BLOCKED-<why>

## HEADLESS RULE
- This run is `claude.exe -p`: ending your turn ENDS THE PROCESS and kills anything you
  backgrounded (measured 2026-10-23: a run that backgrounded its job and replied died with EPIPE).
- Never use run_in_background, Monitor, or "I'll wait for the task" and then reply.
- Launch any job longer than ~9 minutes detached from the WINDOWS side: `Start-Process wsl.exe
  -WindowStyle Hidden` running a SCRIPT FILE (`<job>.sh`) that owns the job, logs to
  `/mnt/c/<log>`, and writes the exit marker `<marker>`. Two measured dead ends:
  `wsl -- setsid ... & disown` does NOT survive wsl.exe exiting, so the job never starts
  (2026-10-23); an inline `bash -lc "<cmd>"` string passed through `Start-Process -ArgumentList`
  died silently (2026-10-24).
- Then WAIT INSIDE THE RUN: repeated foreground commands, each under 9 minutes, that sleep-loop
  on `<marker>` existing. Continue only after it exists.
- Do not end your turn until the {done-token} or BLOCKED marker is written.

## Concision (Opus 5)
Opus 5 defaults to longer output. Answer at the altitude asked: prefer the smallest correct
edit, no restating the task back, no summary of unchanged files. Verbosity is a defect here,
not thoroughness.
