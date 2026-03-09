# Prism Verify (v2.4.8) — Eval Transcript

**Task**: "Verify the UI looks correct"
**Skill version**: v2.4.8 (BASELINE)
**Date**: 2026-03-08
**Mode**: Simulated execution (no source files modified, no commits)

---

## Workflow Execution

### Step 1: Check Dependency

```bash
which playwright-cli 2>/dev/null || npx @playwright/cli --version 2>/dev/null
```

**Result**: playwright-cli is available (v1.59.0-alpha-1771104257000). Proceeding.

### Step 2: Detect Dev Server Command

Scanned `package.json` files for dev server scripts:

| Project | Path | Script Found | Command |
|---------|------|-------------|---------|
| prism-electron | `cmd/prism-electron/package.json` | `scripts.start` | `electron-forge start` (Electron app, not a web URL) |
| prism-electron webview-ui | `cmd/prism-electron/webview-ui/package.json` | `scripts.dev` | `vite` (port 5173) |
| prism-vscode webview-panel | `cmd/prism-vscode/webview-panel/package.json` | `scripts.dev` | `vite` (port 5175) |
| prism-vscode | `cmd/prism-vscode/package.json` | None applicable | N/A (VSCode extension, no web server) |

**Decision**: The skill checks scripts in order: `dev` > `start` > `serve`. However, the task is ambiguous ("Verify the UI looks correct") with no specific project or URL specified.

**Problem identified**: The v2.4.8 skill reads a single `package.json` but does not specify WHICH `package.json` to read. The skill says "Read `package.json`" (singular), implying the project root. There is no root `package.json` in this repository.

**Fallback**: Per the skill instructions, "If no package.json or no matching script: Ask user for the URL to verify."

### Step 2 (simulated): Ask user for URL

> "No `package.json` found at the project root. Which URL should I verify? Available dev servers in this project:
> - Electron webview-ui: `cd cmd/prism-electron/webview-ui && npm run dev` (port 5173)
> - VSCode webview-panel: `cd cmd/prism-vscode/webview-panel && npm run dev` (port 5175)
>
> Please provide the URL or specify which sub-project to verify."

**Simulated user response**: "Use the Electron webview-ui at http://localhost:5173"

### Step 3: Start Dev Server (simulated)

```bash
cd cmd/prism-electron/webview-ui && npm run dev &
DEV_SERVER_PID=$!
```

**Simulated result**: Vite dev server started on http://localhost:5173.

### Step 4: Wait for Readiness (simulated)

```bash
for i in $(seq 1 30); do curl -sf http://localhost:5173 > /dev/null && break; sleep 1; done
```

**Simulated result**: Server responded at iteration 3 (3 seconds). Ready.

### Step 5: Spawn browser-verifier Agent (simulated)

```
Task(subagent_type="browser-verifier")
"Session: verify-2026-03-08-ui-check
URL: http://localhost:5173
Output path: .prism/local/verifications/2026-03-08-ui-check/
Checks: screenshot, console-errors"
```

**Agent execution (simulated)**:

The browser-verifier agent would run:

```bash
# Screenshot capture
playwright-cli screenshot --session verify-2026-03-08-ui-check http://localhost:5173 --name screenshot

# Console error check
playwright-cli console --session verify-2026-03-08-ui-check http://localhost:5173
```

**Simulated agent JSON result**:

```json
{
  "session": "verify-2026-03-08-ui-check",
  "url": "http://localhost:5173",
  "status": "pass",
  "checks": [
    {
      "type": "screenshot",
      "status": "pass",
      "artifactPath": ".prism/local/verifications/2026-03-08-ui-check/screenshot.png",
      "details": "Screenshot captured successfully (1920x1080)"
    },
    {
      "type": "console",
      "status": "pass",
      "artifactPath": null,
      "details": "No console errors detected"
    }
  ],
  "errors": [],
  "summary": "All checks passed. UI renders without errors."
}
```

### Step 6: Write Results (simulated)

Results would be saved to `.prism/local/verifications/2026-03-08-ui-check/verification-result.json`.

### Step 7: Present Summary (simulated)

> ## Verification Results -- 2026-03-08
>
> **URL**: http://localhost:5173
> **Status**: PASS
>
> | Check | Status | Details |
> |-------|--------|---------|
> | Screenshot | Pass | `.prism/local/verifications/2026-03-08-ui-check/screenshot.png` |
> | Console Errors | Pass | No errors detected |
>
> ### Artifacts
> - Screenshot: `.prism/local/verifications/2026-03-08-ui-check/screenshot.png`
> - Report: `.prism/local/verifications/2026-03-08-ui-check/verification-result.json`

### Step 8: Cleanup (simulated)

```bash
playwright-cli session-close verify-2026-03-08-ui-check
kill $DEV_SERVER_PID 2>/dev/null
```

---

## Observations on v2.4.8 Skill Behavior

### What Worked

1. **Dependency check** is clear and handles the not-installed case gracefully (warn + skip).
2. **Agent separation** is well-defined: the skill orchestrates, the browser-verifier agent executes.
3. **Output format** (JSON + human-readable summary) is well-specified via references.
4. **Cleanup is mandatory** in all exit paths -- good design.
5. **Session naming convention** is consistent and traceable.

### Issues Encountered

1. **Ambiguous project targeting**: The skill says "Read `package.json`" but this is a monorepo with multiple sub-projects, each with their own `package.json`. No root `package.json` exists. The skill has no mechanism to discover or select among multiple web UIs.

2. **No context from prior phases**: The skill does not reference any plan, story, or implementation context. The task "Verify the UI looks correct" gives no specificity about WHAT to verify. The skill has no mechanism to pull context from `.prism/shared/plans/` or `stories.json` to determine which component was just implemented.

3. **User interaction required**: Because the project root has no `package.json`, the skill falls through to "Ask user for the URL." This breaks autonomous (Spectrum) execution where no user is present.

4. **No visual assertion capability**: The skill captures a screenshot but has no way to evaluate whether the UI "looks correct." It checks for console errors and captures artifacts, but actual visual correctness requires either:
   - A baseline screenshot to diff against
   - Human review of the captured screenshot
   - An LLM vision model to evaluate the screenshot

5. **Artifact storage is gitignored**: Results go to `.prism/local/` which is gitignored. This is correct for screenshots but means verification results are lost across sessions/machines. No mechanism to persist key findings to `.prism/shared/`.

6. **No port detection**: The skill assumes it can determine the port from the dev command, but Vite dynamically assigns ports. No mechanism to detect the actual port the server started on.

7. **Single URL verification**: The skill verifies one URL. Multi-page or multi-route verification would require multiple invocations or a route list.

### Skill Completeness Rating

| Criterion | Rating | Notes |
|-----------|--------|-------|
| Handles happy path | OK | Linear workflow is clear |
| Handles missing dependency | Good | Graceful skip with warning |
| Handles ambiguous input | Poor | No project selection for monorepos |
| Autonomous execution | Poor | Requires user input for URL in many cases |
| Visual correctness assessment | None | Captures screenshot but cannot evaluate it |
| Integration with other phases | Poor | No connection to plans/stories/implementation context |
| Error handling | OK | Cleanup always runs, but limited error recovery |

---

## Summary

The v2.4.8 `prism-verify` skill provides a structured workflow for browser-based UI verification using playwright-cli. It successfully orchestrates dependency checking, dev server management, agent delegation, and cleanup. However, it struggles with monorepo project selection, lacks autonomous URL detection, and critically cannot actually assess whether a UI "looks correct" -- it can only capture a screenshot and check for console errors, leaving visual correctness judgment to a human reviewer.
