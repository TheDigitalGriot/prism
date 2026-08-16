# Model Control Plane — SURFACES (implement) Stage Contract

## Role
Headless in the Prism repo, branch feat/icm-fuse-opus5-multisurface. Wire the already-shipped Model
Control Plane foundation (packages/prism-core/src/core/api/model-policy.ts, commit a206223) into the
remaining surfaces. Commit PER SURFACE (plain conventional-commit messages, no AI attribution). Mirror
any changed plugin file into apps/prism-setup/resources/plugin/. Run the relevant checks per surface.
Proceed autonomously; never ask. Ground exact insertion points via the discovery agents
(codebase-analyzer / codebase-locator / graph-navigator); do not photocopy whole files.

## Foundation you are extending (already in the repo)
- model-policy.ts exports: ApprovalMode (ask|allow|deny|skip), readModelPolicy(projectRoot),
  resolveModelDecision({requested,surface,projectRoot,env,confirm?}) -> {model,mode,downgradedFrom?,reason},
  emitModelEvent(projectRoot,{requested,resolved,mode,surface,downgradedFrom}) -> $STATE_DIR/events JSONL,
  resolveStateDir/resolveEventsFile. Policy at <root>/.prism/local/model-policy.json (models opus5/fable5,
  each {mode}; per-surface overrides; headlessDefault). Event shape: {type:"model-decision",requested,
  resolved,mode,surface,downgradedFrom,ts}.

## Surfaces to build (each its own commit)

### 1. CLI / headless emit — scripts/fable-gate.sh  (surface id "cli")
Today it only gates fable via fable.flag. Generalize it to the policy for BOTH opus5 and fable5 and
EMIT an event so headless/Cowork runs are no longer silent:
- When the Task tool_input.model is a policy model (fable|claude-fable-5 -> fable5; opus5|claude-opus-5 -> opus5),
  read <CLAUDE_PROJECT_DIR|pwd>/.prism/local/model-policy.json via node (fall back to fable.flag for fable5).
- Apply the mode: allow/skip -> permissionDecision "allow" (or exit 0 pass-through); ask -> "ask"; deny -> "deny".
- In ALL policy cases append a model-decision JSONL line to the events file (resolve the path the same way
  model-policy.ts resolveStateDir does: GAVEL_STATE_DIR -> GAVEL_DIR/state -> newest .prism/local/gavel/*/state
  -> .prism/local/gavel/_mcp/state). Use node for the JSON + append (the hook already uses node). Never let a
  malformed policy break Task dispatch (fail-open to allow + best-effort emit). Keep POSIX sh + the existing
  node-parse convention. Mirror into apps/prism-setup. Commit "feat(cli): policy-govern + emit model events from the Task hook".

### 2. CLI statusline — scripts/statusline-model.sh (or .mjs)  (surface id "cli")
A Claude Code statusLine script (best-claude-hud pattern): reads the statusline JSON on stdin (it carries
the active model), reads the policy for that model's mode, prints a compact segment "<model> · <mode>",
LOUD (ANSI ember/red) when the model is opus5/fable5. Document enabling it via the statusLine setting in a
short reference (skills/cl-plugin-structure/references or the plugin README). Mirror into apps/prism-setup.
Commit "feat(cli): loud active-model statusline segment".

### 3. vscode status-bar chip + receipts — apps/prism-vscode  (surface id "vscode")
- Add a StatusBarItem (window.createStatusBarItem) created at activation showing the active/last-resolved
  model + mode; ember colour (warningBackground) when premium; command opens a QuickPick to set the mode for
  opus5/fable5 (writes model-policy.json via the core). Locate the extension activation + existing status-bar
  usage with codebase-analyzer.
- Add a "Model decisions" receipts view: read the events file and live-watch it with
  vscode.workspace.createFileSystemWatcher (harvest the Claude-Code-History + claude-replay timeline pattern) —
  a simple TreeView or a webview list of "HH:mm requested -> resolved (mode) [surface]", newest first, badges
  for opus5/fable5. Typecheck prism-vscode. Commit "feat(vscode): model status-bar chip + decisions receipts".

### 4. First universal-lane hook — Paseo custom-provider dispatch  (surface id "paseo")
Locate the provider dispatch in apps/prism-mobile (the custom-provider registry / claude-agent provider that
resolves a model id before a request; use codebase-locator/analyzer). Insert a resolveModelDecision call
keyed by the provider+model id so NON-Anthropic lanes (gemini, gpt, local GriotModel, kimi) become governable
by the same policy, and emit the event. Keep it minimal + behind the same policy file. Run the single
collocated test if one exists (never the full mobile suite). Commit "feat(paseo): govern custom-provider lanes through the model policy".

## Process (numbered)
1. Append heartbeat "start".
2. Surface 1 (CLI emit) -> mirror -> commit. Append "cli-emit-done commit=<sha>".
3. Surface 2 (statusline) -> mirror -> commit. Append "statusline-done commit=<sha>".
4. Surface 3 (vscode) -> typecheck -> commit. Append "vscode-done commit=<sha>".
5. Surface 4 (paseo hook) -> commit. Append "paseo-done commit=<sha>".
6. `claude plugin validate .` (after the plugin edits) must pass. Append "validate-ok".
7. Append "DONE commits=<list>". On a blocker append "BLOCKED-<surface>-<why>" and continue with the others.

## Success criteria
- Four commits (one per surface); plugin files mirrored + `claude plugin validate .` clean; prism-vscode typechecks.
- The CLI Task hook now emits a model-decision event for opus5/fable5 (headless surface no longer silent).
- resolveModelDecision is reused (not reimplemented) wherever TS can import it; the shell hook mirrors its logic minimally.

## Heartbeat tokens (append one timestamped line each to .prism/local/surfaces-progress.txt)
start · cli-emit-done commit=<sha> · statusline-done commit=<sha> · vscode-done commit=<sha> · paseo-done commit=<sha> · validate-ok · DONE commits=<...> · BLOCKED-<surface>-<why>
