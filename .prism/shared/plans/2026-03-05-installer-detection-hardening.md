---
date: 2026-03-05
author: Claude
repository: prism-plugin
branch: feat/installer-detection-hardening
ticket: N/A
status: draft
research: .prism/shared/research/2026-03-05-installer-detection-hardening.md
---

# Plan: Installer Detection Hardening

## Overview

**Goal**: Replace the naive single-path detection in `cmd/prism-installer/src-tauri/src/detect.rs` with robust multi-strategy detection (registry → filesystem → PATH) for all tools, incorporating the proven patterns from the `dev_tools_detection.rs` research. Enrich the data model with version info, install methods, and metadata. Update the frontend to display richer detection results.

**Research**: `.prism/shared/research/2026-03-05-installer-detection-hardening.md`

**Complexity**: Medium

**Estimated Phases**: 6

## Context

The current `detect.rs` checks exactly ONE path per editor (e.g., `%LOCALAPPDATA%\Programs\cursor\...\cursor.cmd`) and ONE path for Claude CLI (`%LOCALAPPDATA%\Programs\claude\...\claude.cmd`). Real-world testing on the developer's machine revealed:

- **Cursor** is installed system-wide at `C:\Program Files\cursor` (InnoSetup) — the current check **misses it entirely**
- **Claude Code** is an npm global at `%APPDATA%\npm\node_modules\@anthropic-ai\claude-code` — the current check at `%LOCALAPPDATA%\Programs\claude` **misses it entirely**
- **VS Code** can also be in `C:\Program Files\Microsoft VS Code` — current check only looks in `%LOCALAPPDATA%\Programs`

We have a proven reference implementation in `.prism/shared/docs/installer-ui/dev_tools_detection.rs` that handles all these cases with registry-first detection, multi-path filesystem fallback, and PATH-based last resort.

**Bundle configuration change**: `tauri.conf.json` has been updated to `"targets": []` (no NSIS wrapper), `webviewInstallMode: "skip"` (trust built-in WebView2), and the NSIS config block removed entirely. The Tauri build now produces a standalone `.exe` that launches the custom React installer UI directly — no native Windows install dialog beforehand. This means the Prism Setup app *is* the installer.

## Success Criteria

### Automated (CI/Scripts)
- [ ] `cargo test` — All existing + new detection tests pass
- [ ] `cargo clippy -- -D warnings` — No Rust lint warnings
- [ ] `cd cmd/prism-installer && npm run build` — Frontend builds with updated TypeScript types

### Manual Verification
- [ ] On a machine with Cursor at `C:\Program Files\cursor`: preflight shows "Cursor vX.Y.Z found (System install)"
- [ ] On a machine with Claude Code via npm: preflight shows "Claude Code vX.Y.Z found (npm global)"
- [ ] On a machine with VS Code at either location: correctly detected with version
- [ ] On a machine with no editors: preflight shows warning (unchanged behavior)
- [ ] On a machine with Node.js missing but Claude Code installed: shows "Node.js not available" warning
- [ ] Version numbers shown in preflight UI for each detected tool
- [ ] Extension install uses detected CLI paths (not hardcoded assumptions)

## What We're NOT Doing

- Adding new editor support (e.g., JetBrains, Zed) — only improving detection of existing 3 editors
- Changing macOS detection fundamentally (no registry on macOS) — only adding version parsing and multi-path checks
- Modifying install logic in `install_cli.rs` — only detection and its consumers
- Adding Linux support
- Changing the preflight UI layout — only enriching the data displayed within existing layout

---

## Phases

### Phase 1: Enrich Rust Data Model

**Goal**: Replace `EditorInfo` with `DetectedTool` and add `DetectionReport`, `InstallMethod` types matching the research reference implementation. Keep backward compatibility by leaving the old Tauri command signatures temporarily.

**Files to modify**:
| File | Change |
|------|--------|
| `cmd/prism-installer/src-tauri/src/detect.rs` | Replace `EditorInfo` struct, add `DetectedTool`, `InstallMethod`, `DetectionReport` |

**Steps**:
1. Add `InstallMethod` enum: `SystemInstall`, `UserInstall`, `SquirrelInstall`, `NpmGlobal`, `Unknown`
2. Add `DetectedTool` struct: `name`, `version: Option<String>`, `executable: Option<PathBuf>`, `install_location: Option<PathBuf>`, `install_method: InstallMethod`, `cli_available: bool`, `metadata: HashMap<String, String>`
3. Add `DetectionReport` struct: `editors: Vec<DetectedTool>`, `claude_code: Option<DetectedTool>`, `node_available: bool`, `npm_prefix: Option<PathBuf>`
4. Keep `EditorInfo` temporarily as a type alias or converter for backward compat with `install_extension.rs`
5. Update `PreflightResult` to use the new types
6. Add `serde_json` (already in Cargo.toml) and `std::collections::HashMap` imports

**Verification**:
```bash
cd cmd/prism-installer/src-tauri && cargo check
```

---

### Phase 2: Multi-Strategy Editor Detection (Windows)

**Goal**: Replace the single-path `detect_editors()` with registry-first → multi-path filesystem → PATH fallback detection for VS Code, Cursor, and Windsurf on Windows.

**Files to modify**:
| File | Change |
|------|--------|
| `cmd/prism-installer/src-tauri/src/detect.rs` | Rewrite `detect_editors()` internals for Windows |

**Steps**:
1. Implement `detect_editor_from_registry(display_name: &str)` — scans HKLM + HKCU + WOW6432Node uninstall keys for matching `DisplayName`, returns `DetectedTool` with version, install location, install method
2. Implement `get_editor_candidate_paths(editor_id: &str)` — returns all filesystem locations for each editor:
   - VS Code: `C:\Program Files\Microsoft VS Code`, `%LOCALAPPDATA%\Programs\Microsoft VS Code`
   - Cursor: `C:\Program Files\cursor`, `%LOCALAPPDATA%\Programs\cursor`, `%LOCALAPPDATA%\cursor` (Squirrel with `app-*` subdirs)
   - Windsurf: `C:\Program Files\windsurf`, `%LOCALAPPDATA%\Programs\windsurf`
3. Implement `detect_editor_from_filesystem(id, name, candidates)` — checks each path for the main `.exe`, reads version from `resources/app/package.json`
4. Implement `detect_editor_from_path(name)` — uses `where.exe <name>` to find CLI shim, walks up to install root
5. Implement `which_command(name: &str)` helper using `where.exe` (Windows) / `which` (macOS)
6. Implement `read_version_from_package_json(base_path)` — parses `resources/app/package.json` for version field
7. Wire the 3-tier strategy: for each editor, try registry → filesystem → PATH, return first hit as `DetectedTool`
8. Update `detect_editors()` to return `Vec<DetectedTool>` instead of `Vec<EditorInfo>`

**Key reference**: `.prism/shared/docs/installer-ui/dev_tools_detection.rs` lines 62-284 (Cursor detection patterns).

**Verification**:
```bash
cargo test -- detect
cargo clippy -- -D warnings
```

---

### Phase 3: Claude Code Detection Overhaul

**Goal**: Replace the single hardcoded path check for Claude CLI with npm-prefix-based detection that finds the actual package, parses version, checks shims, and verifies Node.js availability.

**Files to modify**:
| File | Change |
|------|--------|
| `cmd/prism-installer/src-tauri/src/detect.rs` | Rewrite `detect_claude_cli()` to return `Option<DetectedTool>` |

**Steps**:
1. Implement `get_npm_prefix()` → runs `npm config get prefix`, falls back to `%APPDATA%\npm` (Windows) or `/usr/local` (macOS)
2. Implement `detect_claude_code_npm(npm_prefix)`:
   - Check `{npm_prefix}/node_modules/@anthropic-ai/claude-code/package.json` exists
   - Parse version from that package.json
   - Check shims: `.cmd`, `.ps1`, extensionless at `{npm_prefix}/claude{.cmd,.ps1,}`
   - Check `node --version` availability
   - Store metadata: `npm_prefix`, `node_version`, `node_available`, `cmd_shim`, `entry_point`
3. Implement `detect_claude_code_from_config()` — fallback: check `%APPDATA%\Claude\claude-code\` for config dir presence, extract version hint from subdirectory names
4. Implement `get_command_output(cmd, args)` helper — runs a command and returns stdout
5. Rename Tauri command from `detect_claude_cli` to `detect_claude_code` (returns `Option<DetectedTool>` instead of `Option<String>`)
6. Keep a compatibility wrapper `detect_claude_cli()` that returns `Option<String>` from the new detection (extracts executable path) — for backward compat with `install_plugin.rs`

**Key reference**: `.prism/shared/docs/installer-ui/dev_tools_detection.rs` lines 288-433 (Claude Code detection).

**Verification**:
```bash
cargo test -- claude
cargo clippy -- -D warnings
```

---

### Phase 4: macOS Detection Improvements

**Goal**: Improve macOS detection with multi-path checks and version parsing from `Info.plist` or `package.json`. Add `which` fallback for editors.

**Files to modify**:
| File | Change |
|------|--------|
| `cmd/prism-installer/src-tauri/src/detect.rs` | Enhance macOS detection paths |

**Steps**:
1. Update macOS editor candidates to check both `/Applications/` and `~/Applications/` (user-level installs)
2. Add `read_macos_version_from_plist(app_path)` — parse `Contents/Info.plist` for `CFBundleShortVersionString` (using simple text parsing, not a plist library)
3. Add `which` fallback for each editor on macOS (same pattern as Windows `where.exe`)
4. Update macOS Claude Code detection to use `which claude`, `~/.npm-global/bin/claude`, and npm prefix
5. Implement `get_available_disk_space` properly for macOS using `libc::statvfs` (currently returns 0)
6. Add `detect_node_available()` check for macOS

**Verification**:
```bash
# On macOS:
cargo test -- detect
cargo clippy -- -D warnings
```

---

### Phase 5: Update Downstream Rust Consumers

**Goal**: Update `install_extension.rs`, `install_plugin.rs`, and `lib.rs` to work with the new `DetectedTool` type and register updated commands.

**Files to modify**:
| File | Change |
|------|--------|
| `cmd/prism-installer/src-tauri/src/install_extension.rs` | Accept `Vec<DetectedTool>` instead of `Vec<EditorInfo>`, use `metadata["cli_path"]` or `executable` for CLI command |
| `cmd/prism-installer/src-tauri/src/install_plugin.rs` | Accept `Option<DetectedTool>` for Claude info, use `executable` field for path |
| `cmd/prism-installer/src-tauri/src/lib.rs` | Register new/updated commands: `detect_all_tools`, `detect_claude_code` |

**Steps**:
1. Update `install_extension.rs`:
   - Change `install_all_extensions` to accept `Vec<DetectedTool>` parameter
   - Extract CLI path from `metadata.get("cli_path")` or construct from `install_location`
   - Include editor version in `ExtensionInstallResult` for richer logging
2. Update `install_plugin.rs`:
   - Change `install_plugin` to accept `Option<DetectedTool>` for Claude Code info
   - Extract executable path from `DetectedTool::executable`
   - Add metadata-based warnings (e.g., Node.js not available)
3. Update `lib.rs`:
   - Add `detect_all_tools` (new combined command returning `DetectionReport`)
   - Keep individual detection commands for backward compat
   - Update `run_preflight` to use new types
4. Remove `EditorInfo` if no longer referenced (or keep as thin alias)
5. Update all unit tests

**Verification**:
```bash
cargo test
cargo clippy -- -D warnings
```

---

### Phase 6: Update Frontend (TypeScript + UI)

**Goal**: Update TypeScript types and PreflightStep UI to display version info, install methods, and Node.js warnings from the enriched detection data.

**Files to modify**:
| File | Change |
|------|--------|
| `cmd/prism-installer/src/screens/windows/PreflightStep.tsx` | Use enriched detection data, show versions and install methods |
| `cmd/prism-installer/src/screens/windows/ProgressStep.tsx` | Pass `DetectedTool[]` to install commands |
| `cmd/prism-installer/src/screens/macos/InstallingStep.tsx` | Same updates for macOS |
| `cmd/prism-installer/src/hooks/useInstaller.ts` | Update TypeScript interfaces |

**Steps**:
1. Add TypeScript interface for `DetectedTool`:
   ```typescript
   interface DetectedTool {
     name: string;
     version: string | null;
     executable: string | null;
     install_location: string | null;
     install_method: "SystemInstall" | "UserInstall" | "SquirrelInstall" | "NpmGlobal" | "Unknown";
     cli_available: boolean;
     metadata: Record<string, string>;
   }
   ```
2. Update `PreflightStep.tsx`:
   - Call `detect_editors` (now returns `DetectedTool[]`), display version: "Cursor v2.4.31 found" instead of just "Cursor detected"
   - Call `detect_claude_code` (new command), show version + install method
   - If `metadata.node_available === "false"`, show amber warning: "Node.js not found — Claude Code may not work"
   - Show install method in detail text: "(System install)" or "(npm global)"
3. Update `ProgressStep.tsx`:
   - Pass full `DetectedTool[]` to `install_all_extensions` instead of `EditorInfo[]`
   - Pass `DetectedTool` to `install_plugin` instead of just `Option<String>` for path
   - Log versions during install: "Installing into Cursor v2.4.31..."
4. Update macOS `InstallingStep.tsx` with same enriched data
5. Update `useInstaller.ts` interfaces if the hook manages detection state

**Verification**:
```bash
cd cmd/prism-installer && npm run build
npm run tauri dev  # Visual verification of enriched preflight data
```

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Registry enumeration is slow (many uninstall subkeys) | Medium | Low | Only scan on preflight screen; registry reads are fast per-key |
| `npm config get prefix` spawns a process (slow) | Low | Low | One-shot call during preflight; cached in DetectionReport |
| Breaking change in Tauri command signatures | Medium | Medium | Keep backward-compat wrappers in Phase 5; only remove old types after frontend is updated |
| macOS `statvfs` implementation causes issues | Low | Medium | Guard behind `#[cfg(target_os = "macos")]`; test on actual macOS |
| `where.exe` fails silently on some Windows configs | Low | Low | It's a last-resort fallback after registry + filesystem checks |

## Edge Cases

| Case | Handling |
|------|----------|
| Cursor installed via both InnoSetup and Squirrel | Registry hit wins (InnoSetup), filesystem would find Squirrel as second — return first hit |
| Claude Code installed but Node.js not on PATH | Detection succeeds (found via npm prefix), but `metadata.node_available = false` + UI warning |
| npm not installed at all | `get_npm_prefix()` returns None, skip npm-based detection entirely, try config dir fallback |
| Editor CLI shim exists but .exe is missing | `cli_available = true` but `executable = None` — still usable for VSIX install |
| Multiple VS Code installs (Insiders + Stable) | Currently only detect Stable; Insiders could be added as separate editor ID in future |
| Windsurf not in registry (npm-based install?) | Filesystem check at known paths + PATH fallback will catch it |

## Out of Scope

- Adding detection for JetBrains IDEs, Zed, Neovim, or other editors
- Linux detection support
- Auto-installing missing prerequisites (Node.js, npm)
- Caching detection results across installer screens (re-detection on ProgressStep is intentional for freshness)
- Changing the NSIS installer's detection logic (deprecated)

## Rollback Plan

1. The current `detect.rs` is in git — revert to HEAD if new detection causes issues
2. Old TypeScript interfaces can be restored from git
3. No database, registry, or system state is modified by detection code — pure reads
4. If a specific detection strategy fails, the tiered approach degrades gracefully to the next strategy

## Dependencies

**Must complete first**: None — all changes are within `cmd/prism-installer/`

**Reference implementation**: `.prism/shared/docs/installer-ui/dev_tools_detection.rs` — proven, tested code to port from

## Progress Log

| Phase | Status | Started | Completed | Notes |
|-------|--------|---------|-----------|-------|
| Phase 1: Data Model | ✅ Complete | 2026-03-05 | 2026-03-05 | Added InstallMethod, DetectedTool, DetectionReport; kept EditorInfo for compat; updated PreflightResult; stripped BOM from tauri.conf.json |
| Phase 2: Windows Editor Detection | ✅ Complete | 2026-03-05 | 2026-03-05 | Registry→filesystem→PATH 3-tier detection for VS Code, Cursor, Windsurf; EditorConfig struct; Squirrel detection |
| Phase 3: Claude Code Detection | ✅ Complete | 2026-03-05 | 2026-03-05 | npm-prefix-based detection, config dir fallback, PATH lookup, node availability check, shim detection |
| Phase 4: macOS Detection | ✅ Complete | 2026-03-05 | 2026-03-05 | /Applications + ~/Applications, Info.plist version parsing, which fallback, df-based disk space |
| Phase 5: Downstream Rust Updates | ✅ Complete | 2026-03-05 | 2026-03-05 | install_extension.rs→DetectedTool, install_plugin.rs→DetectedTool, lib.rs registers detect_claude_code + detect_all_tools |
| Phase 6: Frontend Updates | ✅ Complete | 2026-03-05 | 2026-03-05 | TypeScript DetectedTool interfaces, version+install method display, Node.js warning, all 3 screens updated |
