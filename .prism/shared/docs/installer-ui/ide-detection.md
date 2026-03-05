Let me load the Windows MCP tools and help you locate Cursor and Claude Code CLI on your machine.Let me search your machine for both Cursor and Claude Code CLI installations.Good, found both. Let me dig deeper to get the full picture — actual executables, installation directories, registry entries, and shims.Here's a comprehensive map of everything found on your machine for both apps. This should give you solid detection strategies for your Tauri installer.

---

**Cursor (v2.4.31, published by Anysphere)**

Your install is the "Program Files" variant (InnoSetup-based, not Squirrel):

| Detection Vector | Path / Key |
|---|---|
| **Main executable** | `C:\Program Files\cursor\Cursor.exe` |
| **CLI shim (in PATH)** | `C:\Program Files\cursor\resources\app\bin\cursor` |
| **CLI cmd** | `C:\Program Files\cursor\resources\app\bin\cursor.cmd` |
| **Tunnel exe** | `C:\Program Files\cursor\resources\app\bin\cursor-tunnel.exe` |
| **Registry (Uninstall)** | `HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{D7D7D7D7-...}_is1` — has `DisplayName`, `InstallLocation`, `DisplayVersion` |
| **URI protocol** | `HKCU:\SOFTWARE\Classes\cursor\shell\open\command` → points to `Cursor.exe --open-url` |
| **PATH entry** | `C:\Program Files\cursor\resources\app\bin` |

Note: There's **no** `%LOCALAPPDATA%\cursor\Update.exe` (Squirrel pattern) on your machine — some users will have Cursor installed per-user at `%LOCALAPPDATA%\Programs\cursor` instead, so your detection should check both locations.

---

**Claude Code CLI (v2.1.69, `@anthropic-ai/claude-code`)**

Installed globally via npm — it's a Node.js shim, not a standalone binary:

| Detection Vector | Path / Key |
|---|---|
| **PowerShell shim** | `C:\Users\digit\AppData\Roaming\npm\claude.ps1` |
| **CMD shim** | `C:\Users\digit\AppData\Roaming\npm\claude.cmd` |
| **Bash shim** | `C:\Users\digit\AppData\Roaming\npm\claude` (no ext) |
| **Actual entry point** | `C:\Users\digit\AppData\Roaming\npm\node_modules\@anthropic-ai\claude-code\cli.js` |
| **Config directory** | `%APPDATA%\Claude\claude-code\` (contains versioned subdirs like `2.1.51`) |
| **PATH entry** | `C:\Users\digit\AppData\Roaming\npm` |
| **Dependency** | Requires `node.exe` on PATH |

No registry entries for Claude Code — it's purely npm-based.

---

**Detection Strategy Recommendations for Tauri**

For your detection function, here's a priority-ordered approach:

**Cursor** — most reliable to least:
1. **Registry query** on `HKLM:\...\Uninstall\*` filtering `DisplayName == "Cursor"` — gives you version + install path in one shot
2. **File existence** check for `C:\Program Files\cursor\Cursor.exe` AND `%LOCALAPPDATA%\Programs\cursor\Cursor.exe` (covers both install types)
3. **PATH/`where` check** for `cursor` command

**Claude Code** — most reliable to least:
1. **File existence** of `%APPDATA%\npm\node_modules\@anthropic-ai\claude-code\package.json` — you can parse it for the version
2. **Config directory** existence at `%APPDATA%\Claude\claude-code\`
3. **Shim existence** at `%APPDATA%\npm\claude.cmd`
4. **`npm list -g @anthropic-ai/claude-code`** as a fallback (slower, requires npm)

Want me to dig into anything else, like checking for other editors (VS Code, Windsurf, etc.) or drafting the actual Rust detection code for your Tauri app?