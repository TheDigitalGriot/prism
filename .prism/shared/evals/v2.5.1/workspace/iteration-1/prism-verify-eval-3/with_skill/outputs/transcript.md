# Prism Verify Skill Execution Transcript

**Task**: "Verify the UI looks correct"
**Date**: 2026-03-08
**Skill**: `prism-verify` (Phase 3.5: Browser Verification)
**Mode**: Simulated (no source files modified or committed)

---

## Step 1: Check Dependency

**Action**: Checked for `playwright-cli` availability.

```bash
which playwright-cli 2>/dev/null || npx @playwright/cli --version 2>/dev/null
```

**Result**: `playwright-cli` is available via npx. Version `1.59.0-alpha-1771104257000` detected.

**Decision**: Proceed with browser verification (dependency satisfied).

---

## Step 2: Detect Dev Server Command

**Action**: Scanned project `package.json` files for dev server scripts.

This is a multi-app project with several web UIs:

| App | Path | Dev Script | Port |
|-----|------|------------|------|
| VSCode Sidebar (webview-ui) | `cmd/prism-vscode/webview-ui/` | `npm run dev` (Vite) | 5173 (default) |
| VSCode Panel (webview-panel) | `cmd/prism-vscode/webview-panel/` | `npm run dev` (Vite) | 5175 |
| Electron UI (webview-ui) | `cmd/prism-electron/webview-ui/` | `npm run dev` (Vite) | 5173 (default) |
| Electron Main | `cmd/prism-electron/` | `npm start` (electron-forge) | N/A (desktop) |

**Decision**: The task says "verify the UI" without specifying which sub-app. The primary candidate for browser-based verification is the Electron webview-ui at `cmd/prism-electron/webview-ui/` since it runs standalone in a browser via Vite dev server.

In a real execution, the skill would ask the user which UI to verify. For this simulation, we proceed with `cmd/prism-electron/webview-ui/` using `npm run dev` on the default Vite port (`http://localhost:5173`).

---

## Step 3: Start Dev Server (Simulated)

**Action**: Would start the Vite dev server in the background.

```bash
cd cmd/prism-electron/webview-ui && npm run dev &
DEV_SERVER_PID=$!
```

**Simulated Result**: Dev server starts on `http://localhost:5173`.

---

## Step 4: Wait for Readiness (Simulated)

**Action**: Would poll the target URL until it returns 200.

```bash
for i in $(seq 1 30); do curl -sf http://localhost:5173 > /dev/null && break; sleep 1; done
```

**Simulated Result**: Server responds with 200 after ~3 seconds. Readiness confirmed.

---

## Step 5: Spawn browser-verifier Agent (Simulated)

**Action**: Would invoke `Task(subagent_type="browser-verifier")` with the following parameters:

```
Session: verify-ui-2026-03-08
URL: http://localhost:5173
Output path: .prism/local/verifications/2026-03-08-electron-ui/
Checks: screenshot, console-errors
```

The `browser-verifier` agent (Haiku model) would execute:

1. **Screenshot capture**:
   ```bash
   playwright-cli screenshot --session verify-ui-2026-03-08 http://localhost:5173 --name electron-ui
   ```

2. **Console error check**:
   ```bash
   playwright-cli console --session verify-ui-2026-03-08 http://localhost:5173
   ```

**Simulated Result**: Agent returns structured JSON result.

---

## Step 6: Write Results (Simulated)

**Action**: Would save results to `.prism/local/verifications/2026-03-08-electron-ui/verification-result.json`.

```json
{
  "timestamp": "2026-03-08T12:00:00Z",
  "url": "http://localhost:5173",
  "devCommand": "npm run dev",
  "status": "pass",
  "checks": [
    {
      "type": "screenshot",
      "status": "pass",
      "artifactPath": ".prism/local/verifications/2026-03-08-electron-ui/screenshot.png",
      "details": "Screenshot captured successfully (1280x720)"
    },
    {
      "type": "console",
      "status": "pass",
      "artifactPath": null,
      "details": "No console errors detected"
    }
  ],
  "errors": [],
  "artifactDir": ".prism/local/verifications/2026-03-08-electron-ui/",
  "summary": "All checks passed. UI renders without errors."
}
```

---

## Step 7: Present Summary

### Verification Results -- 2026-03-08

**URL**: http://localhost:5173
**Status**: PASS

| Check | Status | Details |
|-------|--------|---------|
| Screenshot | Pass | `.prism/local/verifications/2026-03-08-electron-ui/screenshot.png` |
| Console Errors | Pass | No errors detected |

### Artifacts

- Screenshot: `.prism/local/verifications/2026-03-08-electron-ui/screenshot.png`
- Report: `.prism/local/verifications/2026-03-08-electron-ui/verification-result.json`

---

## Step 8: Cleanup (Simulated)

**Action**: Would close the browser session and kill the dev server.

```bash
playwright-cli session-close verify-ui-2026-03-08
kill $DEV_SERVER_PID 2>/dev/null
```

**Simulated Result**: Session closed, dev server terminated. Cleanup complete.

---

## Skill Execution Summary

| Phase | Status | Notes |
|-------|--------|-------|
| 1. Check Dependency | Done | playwright-cli v1.59.0-alpha available via npx |
| 2. Detect Dev Server | Done | Found `npm run dev` (Vite) in three webview packages |
| 3. Start Dev Server | Simulated | Would start on localhost:5173 |
| 4. Wait for Readiness | Simulated | 30-second polling with 1s interval |
| 5. Spawn browser-verifier | Simulated | Haiku agent with screenshot + console checks |
| 6. Write Results | Simulated | JSON + screenshot + summary to `.prism/local/verifications/` |
| 7. Present Summary | Done | Table rendered above |
| 8. Cleanup | Simulated | Session close + kill dev server PID |

### Observations

- The skill correctly identifies playwright-cli as a real dependency (version 1.59.0-alpha found).
- Multiple web UIs exist in this repo; the skill would need user input or a heuristic to pick which one to verify when the task is ambiguous.
- All artifacts go to `.prism/local/` (gitignored), following the skill's Rule 4.
- The workflow is non-blocking per Rule 6: verification failure would be a signal, not a hard blocker.
- The Electron main process (`npm start` / electron-forge) cannot be browser-verified since it launches a desktop window, not a web page. Only the Vite-served webview-ui apps are candidates for playwright-cli verification.
