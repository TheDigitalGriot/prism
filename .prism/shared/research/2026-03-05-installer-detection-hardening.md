# Research: Installer Detection Hardening

**Date**: 2026-03-05
**Repository**: prism-plugin
**Related Plan**: `.prism/shared/plans/2026-03-05-unified-tauri-installer.md`
**Related Research**: `.prism/shared/docs/installer-ui/ide-detection.md`, `.prism/shared/docs/installer-ui/DETECTION_INTEGRATION.md`

---

## Problem Statement

The current `cmd/prism-installer/src-tauri/src/detect.rs` uses **naive single-path checks** for editor and Claude CLI detection. Real-world research on the user's machine revealed that tools like Cursor and Claude Code install to **multiple locations** depending on install method (InnoSetup system-wide, per-user, Squirrel auto-updater, npm global). The current detection misses most of these variants, leading to false negatives where installed tools aren't found.

---

## Current Detection vs. Research Findings

### Cursor Detection

| Aspect | Current `detect.rs` | Research (`dev_tools_detection.rs`) |
|--------|---------------------|-------------------------------------|
| **Paths checked** | 1 path: `%LOCALAPPDATA%\Programs\cursor\...\cursor.cmd` | 3+ paths: `C:\Program Files\cursor`, `%LOCALAPPDATA%\Programs\cursor`, `%LOCALAPPDATA%\cursor` (Squirrel) |
| **Registry** | None | HKLM + HKCU + WOW6432Node uninstall keys — gives version + path in one shot |
| **PATH fallback** | None | `where.exe cursor` → walk up from shim to find install root |
| **Version detection** | None | From registry `DisplayVersion` or `resources/app/package.json` |
| **Install method** | None | Classified: `SystemInstall`, `UserInstall`, `SquirrelInstall`, `Unknown` |
| **Metadata** | None | Publisher, registry key name, CLI path |
| **User's actual machine** | **Would MISS** Cursor (installed at `C:\Program Files\cursor`, not `%LOCALAPPDATA%\Programs`) | **Finds it** via registry or Program Files path |

### Claude Code Detection

| Aspect | Current `detect.rs` | Research (`dev_tools_detection.rs`) |
|--------|---------------------|-------------------------------------|
| **Paths checked** | 1 path: `%LOCALAPPDATA%\Programs\claude\...\claude.cmd` | npm prefix → `node_modules/@anthropic-ai/claude-code/package.json` |
| **Version detection** | None | Parsed from `package.json` |
| **Shim detection** | None | Checks `.cmd`, `.ps1`, and extensionless shim |
| **Node.js check** | None | Verifies `node` is available (Claude Code requires it) |
| **Config directory** | None | Checks `%APPDATA%\Claude\claude-code\` as fallback hint |
| **User's actual machine** | **Would MISS** Claude Code (installed via npm at `%APPDATA%\npm\...`, not `%LOCALAPPDATA%\Programs`) | **Finds it** via npm prefix |

### VS Code & Windsurf Detection

| Aspect | Current `detect.rs` | Research |
|--------|---------------------|----------|
| **VS Code paths** | 1 path: `%LOCALAPPDATA%\Programs\Microsoft VS Code\bin\code.cmd` | Should also check `C:\Program Files\Microsoft VS Code\Code.exe` + registry |
| **Windsurf paths** | 1 path: `%LOCALAPPDATA%\Programs\windsurf\...\windsurf.cmd` | Should also check `C:\Program Files\windsurf\` + registry |
| **Registry** | None | Same HKLM/HKCU uninstall key pattern works for all editors |

---

## Root Cause Analysis

The current `detect.rs` was written with **assumed install locations** based on default per-user installs. However:

1. **Cursor** has 3 installer variants (InnoSetup system-wide, per-user, Squirrel), each placing files differently
2. **Claude Code** is an npm global package, not a standalone app — it lives in `%APPDATA%\npm\` not `%LOCALAPPDATA%\Programs\`
3. **VS Code** can be system-wide (`C:\Program Files`) or per-user
4. **No registry-based detection** means missing the most reliable signal on Windows

---

## Proven Detection Strategies (from research)

### Strategy 1: Registry-First Detection (Windows only)

The Windows registry uninstall keys are the **single most reliable** detection vector:
- `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*`
- `HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*`
- `HKLM\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*`

Each subkey provides `DisplayName`, `DisplayVersion`, `InstallLocation`, `Publisher` — version + path in one shot.

### Strategy 2: Multi-Path Filesystem Checks

Check **all known install locations** per tool, not just one:
- System-wide: `C:\Program Files\<tool>\`
- Per-user: `%LOCALAPPDATA%\Programs\<tool>\`
- Squirrel: `%LOCALAPPDATA%\<tool>\app-X.Y.Z\`
- npm global: `%APPDATA%\npm\node_modules\@org\pkg\`

### Strategy 3: PATH-Based Fallback

Use `where.exe <tool>` (Windows) or `which <tool>` (macOS) to find tools on PATH, then walk up from the shim to find the install root.

### Strategy 4: Version Parsing

- Registry: `DisplayVersion` field
- Filesystem: `resources/app/package.json` → `version` field
- npm: `node_modules/@org/pkg/package.json` → `version` field

---

## Data Model Improvements

The research introduces a richer data model:

```rust
// Current: minimal
struct EditorInfo { id, name, path, cmd_path }

// Research: rich metadata
struct DetectedTool {
    name: String,
    version: Option<String>,          // NEW: version string
    executable: Option<PathBuf>,      // NEW: main .exe path
    install_location: Option<PathBuf>,// NEW: root install dir
    install_method: InstallMethod,    // NEW: how it was installed
    cli_available: bool,              // NEW: can we run CLI commands?
    metadata: HashMap<String, String>,// NEW: extensible metadata
}

enum InstallMethod {
    SystemInstall,    // Program Files (InnoSetup)
    UserInstall,      // %LOCALAPPDATA%\Programs
    SquirrelInstall,  // %LOCALAPPDATA%\<app>\Update.exe
    NpmGlobal,        // npm install -g
    Unknown,
}
```

---

## Impact on Downstream Components

### Extension Installation (`install_extension.rs`)

Currently receives `Vec<EditorInfo>` with `cmd_path` for running `--install-extension`. With the richer `DetectedTool` model:
- Uses `metadata["cli_path"]` instead of assumed `cmd_path`
- Can show version info in progress logs
- Can warn about Squirrel installs (may need special handling)

### Plugin Installation (`install_plugin.rs`)

Currently checks `Option<String>` for Claude CLI path. With `DetectedTool`:
- Uses `executable` field for the actual shim path
- Can check `metadata["node_available"]` to warn early
- Can show version in UI

### Preflight UI (`PreflightStep.tsx`)

Currently shows pass/warn/info per check. With richer data:
- Shows version numbers (e.g., "Cursor v2.4.31 found")
- Shows install method (e.g., "System install at C:\Program Files\cursor")
- Shows Node.js warning if Claude Code found but Node missing
- Shows all detected editors with individual versions

---

## macOS Considerations

The research focused on Windows. For macOS:
- **No registry** — filesystem checks are the primary strategy
- **Cursor**: `/Applications/Cursor.app/Contents/Resources/app/bin/cursor`
- **Claude Code**: `which claude` or `~/.npm-global/bin/claude` (varies by npm config)
- **VS Code**: `/Applications/Visual Studio Code.app/`
- **Windsurf**: `/Applications/Windsurf.app/`
- Version from `Info.plist` (`CFBundleShortVersionString`) or `package.json`

---

## Recommendations

1. **Replace `detect_editors()` with `detect_all_tools()`** — unified detection returning `Vec<DetectedTool>` + `DetectionReport`
2. **Adopt the 3-tier strategy**: Registry → Filesystem → PATH for each tool on Windows
3. **Add dedicated Claude Code detection** via npm prefix parsing instead of hardcoded path
4. **Enrich the data model** with version, install method, metadata
5. **Update frontend** to display richer detection info
6. **Port `dev_tools_detection.rs` patterns** directly — the code is already written and tested
7. **Add VS Code and Windsurf to registry detection** using same pattern as Cursor
8. **Keep backward compatibility** on the TypeScript interface by extending, not replacing

---

## Source Files

| File | Description |
|------|-------------|
| `cmd/prism-installer/src-tauri/src/detect.rs` | Current detection (to be replaced) |
| `.prism/shared/docs/installer-ui/dev_tools_detection.rs` | Proven detection code (reference impl) |
| `.prism/shared/docs/installer-ui/ide-detection.md` | Real-world detection findings |
| `.prism/shared/docs/installer-ui/DETECTION_INTEGRATION.md` | Integration guide with TypeScript types |
