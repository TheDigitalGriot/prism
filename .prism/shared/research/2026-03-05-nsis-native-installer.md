# NSIS Native Windows Installer — Research & Implementation

**Date**: 2026-03-05
**Status**: Implemented (v2.4.3)

---

## Problem

The original installer (`cmd/prism-setup/`) was an Electron-based wizard application weighing ~130MB. It suffered from:

1. **Excessive size** — 130MB+ for an installer that installs a 37MB payload
2. **npm workspace hoisting** — `electron` package hoisted to root, breaking `require('electron')` at runtime
3. **PATH issues** — CLI commands (`code`, `cursor`, `claude`) failed due to restricted shell environment
4. **Unconventional** — Users expect a native Windows installer wizard (like Node.js, Git, VS Code)

## Decision

Replace the Electron wizard with a **native NSIS (Nullsoft Scriptable Install System)** installer — the same technology used by Node.js, Git for Windows, and many other Windows applications.

## NSIS Installer Architecture

### File Structure

```
installer/
├── prism-setup.nsi          # Root MUI2 wizard script
├── sections/
│   ├── cli.nsh              # Prism CLI binary + PATH (required)
│   ├── vscode.nsh           # VSIX install via code/cursor/windsurf
│   ├── plugin.nsh           # Claude plugin install or file copy
│   └── electron.nsh         # Desktop app download from GitHub
├── pages/
│   └── preflight.nsh        # System Check custom NsDialogs page
├── uninstall.nsh            # Uninstaller + Add/Remove Programs
└── plugins/
    └── x86-unicode/
        ├── EnVar.dll         # PATH manipulation (HKCU registry)
        └── NScurl.dll        # HTTPS download from GitHub
```

### Wizard Flow (MUI2 Pages)

1. **Welcome** — Branding, version
2. **Components** — 4 checkboxes:
   - Prism CLI (required, locked)
   - VSCode Extension (checked)
   - Claude Code Plugin (checked)
   - Prism Desktop App (unchecked, downloads ~130MB)
3. **Directory** — Install path, defaults to `%LOCALAPPDATA%\Prism`
4. **System Check** — Custom NsDialogs page detecting editors, Claude CLI, existing prism-cli
5. **Install** — Progress bar with DetailPrint output
6. **Finish** — Offer to open terminal, link to GitHub

### Component Details

#### CLI Section (`sections/cli.nsh`)
- Copies `prism-cli-windows-amd64.exe` to `$INSTDIR\bin\prism-cli.exe`
- Creates `%USERPROFILE%\.prism\` and `workspaces.json` if missing
- Adds `$INSTDIR\bin` to user PATH via EnVar plugin (HKCU registry, idempotent)
- Broadcasts `WM_SETTINGCHANGE` so open terminals pick up PATH
- Writes install dir and version to `HKCU\Software\Prism`

#### VSCode Extension Section (`sections/vscode.nsh`)
- Bundles `prism.vsix` to `$INSTDIR\extensions\`
- Detects editors by checking known install paths (not `where.exe`):
  - VS Code: `$LOCALAPPDATA\Programs\Microsoft VS Code\bin\code.cmd`
  - Cursor: `$LOCALAPPDATA\Programs\cursor\resources\app\bin\cursor.cmd`
  - Windsurf: `$LOCALAPPDATA\Programs\windsurf\resources\app\bin\windsurf.cmd`
- Tries ALL detected editors (not just first), installs VSIX into each
- Uses `cmd.exe /c "<path>" --install-extension ... --force`

#### Claude Plugin Section (`sections/plugin.nsh`)
- Stages files to `$INSTDIR\plugin\{commands,agents,skills,.claude-plugin}`
- Tries `claude plugin install prism@prism-marketplace` via nsExec
- Falls back to copying files to `%USERPROFILE%\.claude\{commands,agents}`

#### Desktop App Section (`sections/electron.nsh`)
- Unchecked by default (optional, ~130MB download)
- Downloads versioned asset from GitHub: `Prism-${VERSION}.Setup.exe`
- Uses NScurl for HTTPS with redirect following
- Runs downloaded installer silently via nsExec
- Cleans up temp files

### NSIS Plugins Used

| Plugin | Purpose | Source |
|--------|---------|--------|
| **EnVar** | PATH manipulation (HKCU registry) | github.com/GsNSIS/EnVar |
| **NScurl** | HTTPS download from GitHub releases | github.com/negrutiu/nsis-nscurl |
| **nsExec** | Run CLI commands silently | Built into NSIS |
| **NsDialogs** | Custom system check page | Built into NSIS |
| **MUI2** | Modern UI wizard pages | Built into NSIS |

### Key Implementation Gotchas

1. **`where.exe` fails in nsExec** — The nsExec environment doesn't inherit the user's full PATH. Must use `IfFileExists` with known install paths instead.

2. **`code.cmd` is a batch file** — VS Code/Cursor/Windsurf CLIs on Windows are `.cmd` batch files. `nsExec` can't run them directly. Must use `cmd.exe /c "<path>" --install-extension ...`.

3. **`cmd.exe /c` quoting** — `cmd.exe /c` strips the first and last quotes from the entire string. If the command name doesn't have spaces, don't quote it. For full paths with spaces, the quotes around the path are needed and preserved correctly.

4. **`ExecToStack` double-Pop** — `nsExec::ExecToStack` pushes both exit code AND stdout to the NSIS stack. Must `Pop` both or the stack gets corrupted.

5. **Local plugins directory** — NSIS program dir (`C:\Program Files (x86)\NSIS\Plugins\`) is permission-denied for user installs. Use `!addplugindir /x86-unicode "plugins\x86-unicode"` with local DLLs.

6. **GitHub asset naming** — Electron Forge Squirrel produces `Prism-2.4.3 Setup.exe` (with space). GitHub replaces the space with a dot: `Prism-2.4.3.Setup.exe`. The NSIS download URL must use the dot format.

## CI/CD Workflow

`.github/workflows/prism-setup-release.yml` — three jobs:

1. **prepare** (Ubuntu): Build CLI binary, package VSIX, copy plugin files
2. **build-nsis** (Ubuntu): Install NSIS + EnVar + NScurl plugins, compile with `makensis`
3. **release**: Upload `Prism-Setup-{version}.exe` to GitHub Release

Triggers: `push tags v*` + `workflow_dispatch`

## Centralized Version Management

### VERSION File
Single source of truth at repository root. Contains just the semver string (e.g., `2.4.3`).

### Bump Script (`scripts/bump-version.py`)

```bash
python scripts/bump-version.py patch     # 2.4.3 -> 2.4.4
python scripts/bump-version.py minor     # 2.4.3 -> 2.5.0
python scripts/bump-version.py --set 3.0.0  # explicit version
```

Updates all 14 version locations:
- `VERSION` (root)
- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`
- `cmd/prism-cli/main.go`
- `cmd/prism-cli/app/footer.go`
- `cmd/prism-vscode/package.json`
- `cmd/prism-electron/package.json`
- `cmd/prism-setup/package.json`
- `packages/prism-core/src/shared/PrismState.ts`
- `packages/prism-ui/src/context/PrismStateContext.tsx`
- `cmd/prism-setup/src/main.ts`
- `cmd/prism-setup/src/screens/WelcomeScreen.tsx`
- `cmd/prism-setup/src/installer/download.ts`
- `cmd/prism-setup/src/installer/version.ts`

### prism-release Skill Updated
The `/prism-release` skill now uses `VERSION` file + `scripts/bump-version.py` instead of manually editing 8+ files.

## Results

| Metric | Electron Wizard | NSIS Installer |
|--------|----------------|----------------|
| Installer size | ~130 MB | ~37 MB |
| Technology | Electron + React | Native Windows |
| User experience | Custom UI, non-standard | Standard MUI2 wizard |
| Dependencies | Node.js, npm | None (standalone .exe) |
| PATH configuration | Spawns `setx` (fragile) | EnVar plugin (registry-based) |
| Editor detection | `which`/`where` in shell | Direct file path checks |

## Known Issues

1. **Cursor extension install** — Returns exit code 1 on some systems. May be a Cursor CLI compatibility issue. VSIX is saved for manual install as fallback.
2. **Electron Desktop App** — White screen after install due to Vite renderer packaging issue. Separate from installer — the Squirrel-based Electron installer itself works, but the app has a React initialization error being investigated.
