# Model Control Plane — FOUNDATION (implement) Stage Contract

## Role
Headless in the Prism repo, branch feat/icm-fuse-opus5-multisurface. IMPLEMENT the Model Control
Plane FOUNDATION ONLY: the policy store + the enforcement seam + bus-event emission. Do NOT build
the tray / statusline / vscode / mobile surfaces (separate later runs). Mirror plugin edits into
apps/prism-setup/resources/plugin/ where applicable. Commit once at the end. Run the api tests +
`claude plugin validate .`. Proceed autonomously; never ask (headless can't answer). Ground edits by
reading only the target files listed here; do not photocopy the repo.

## Inputs — working (exact paths, already code-intel-verified)
- Seam today: apps/prism-vscode/src/core/api/fable-gate.ts (resolveGatedModel L27-52; non-fable pass-through L32-34; fable->opus fallback L39,L51)
- Flag reader today: apps/prism-vscode/src/core/api/fable-flag.ts (isFableEnabled L19-35; reads .prism/local/fable.flag)
- Auth (leave model-agnostic): packages/prism-core/src/core/api/auth.ts (resolveAnthropicAuth L97-108)
- Model IDs: apps/prism-vscode/src/core/api/claude-sdk.ts (MODEL_IDS L24-29; add opus5 if not present)
- Bus events path pattern: scripts/digital-griot-mcp/digital-griot-mcp.ts (resolveStateDir L384-404; events read L697-712; $STATE_DIR/events)
- Headless auto-resolve pattern: scripts/resolve-answer.mjs (the release-cycle answer-injection helper)
- Existing api tests to mirror + keep green: apps/prism-vscode/src/core/api/__tests__/

## Design to build (this IS the spec)
Per-model APPROVAL MODE, like an agentic permission tool. Modes:
- ask   — interactive surfaces prompt a one-shot confirm; headless auto-resolves via resolve-answer.mjs
          (default = headlessDefault) and ALWAYS logs a bus event.
- allow — the model runs; emit a bus event (monitored, not blocked).
- deny  — the model does NOT run; downgrade to the next allowed model (fable5->opus5->opus/4.8) and
          emit a bus event naming the downgrade.
- skip  — bypass all approvals (like --dangerously-skip-permissions): runs, still emits a bus event.

Policy store (generalizes fable.flag; keep back-compat):
- .prism/local/model-policy.json (gitignored, like fable.flag). Ship a committed model-policy.example.json.
  Shape:
  { "version":1,
    "headlessDefault":"allow",
    "models": { "opus5": {"mode":"ask"}, "fable5": {"mode":"ask"} },
    "surfaces": { } }   // optional per-surface override map: surface -> { model -> {mode} }
- Back-compat: if model-policy.json is absent but .prism/local/fable.flag exists, derive fable5 mode
  from it (enabled:true -> ask, else deny) so nothing regresses.

New module: packages/prism-core/src/core/api/model-policy.ts
- readModelPolicy(projectRoot): Policy   (reader mirroring fable-flag.ts robustness — missing/malformed -> safe defaults: opus5/fable5 = "ask")
- resolveModelDecision({ requested, surface, projectRoot, env, confirm? }):
     -> { model, mode, downgradedFrom?, reason }   // applies the mode; confirm? is an injectable
        confirm fn (undefined in headless -> auto-resolve per headlessDefault)
- emitModelEvent(projectRoot, { type:"model-decision", requested, resolved, mode, surface, downgradedFrom, ts })
     -> appends one JSONL line to the digital-griot $STATE_DIR/events file (reuse resolveStateDir-style path).
- Types exported for reuse by the surfaces (statusline/tray/vscode) later.

Seam refactor: apps/prism-vscode/src/core/api/fable-gate.ts
- resolveGatedModel now delegates to resolveModelDecision for ANY policy-listed model (opus5 AND fable5),
  applying its mode; non-policy models still pass through untouched (keep L32-34 behavior for those).
- Emit emitModelEvent at every decision (this is the visibility fix — the previously-silent downgrade at
  L39/L51 now writes an event).
- Preserve fable5's existing default rationale (capped weekly allowance) as its default mode ("ask").
- Do NOT touch auth.ts. Do NOT add opus5 to scripts/fable-gate.sh's hard gated set (the policy governs it now).

## Process (numbered)
1. Append heartbeat "start".
2. Create model-policy.ts + its types; add model-policy.example.json; ensure .prism/local/model-policy.json is gitignored.
3. Add unit tests (mirror the __tests__ style): each mode (ask headless-auto, allow, deny+downgrade, skip), back-compat from fable.flag, and event emission.
4. Refactor resolveGatedModel to delegate to the policy for opus5+fable5 and emit events; keep non-policy pass-through.
5. Ensure MODEL_IDS has an opus5 key (add opus5:"claude-opus-5" if absent; keep opus:"claude-opus-4-8").
6. Mirror-copy any changed plugin file into apps/prism-setup/resources/plugin/. Run the api __tests__ + new tests (green), typecheck apps/prism-vscode, and `claude plugin validate .`.
7. Commit (no AI attribution): "feat(model-policy): control-plane foundation — approval modes + seam + bus events". Append heartbeat "DONE commit=<sha>".
8. On any blocker, append "BLOCKED-<one-word-why>" and leave the tree clean (committed or reverted, never half-edited).

## Success criteria
- api __tests__ + new model-policy tests all green; typecheck clean; `claude plugin validate .` clean.
- Exactly one commit; only foundation files touched; live plugin files and their apps/prism-setup mirrors byte-identical.
- A denied model visibly downgrades AND writes a bus event; an ask model in headless auto-resolves AND writes an event.

## Heartbeat tokens (append one timestamped line each to .prism/local/mcp-foundation-progress.txt)
start · policy-module-done · seam-refactored · tests-green · DONE commit=<sha> · BLOCKED-<why>
