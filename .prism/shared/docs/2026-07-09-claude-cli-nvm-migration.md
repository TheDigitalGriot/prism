# Claude Code CLI: npm-global → native install migration

**Date:** 2026-07-09
**Machine:** Windows, user `digit`
**Why documented:** Preserving the pre-migration state (shims, paths, prefix split) so this change is reversible and referenceable later.

---

## Problem being fixed

1. **Broken CLI** — an interrupted Claude Code auto-update renamed the live binary to
   `claude.exe.old.<timestamp>` but never wrote the new `claude.exe`. Running `claude` failed with
   `CommandNotFoundException` because the shims point at a now-missing `claude.exe`.
2. **nvm fragility** — Claude Code was installed as an npm-global package. Under nvm-for-Windows,
   npm globals are scoped to the active Node version / prefix, so changing the nvm default keeps
   breaking `claude`.
3. **Prefix split** — the root cause of the fragility (see below).

## Captured before-state

### Install location (OLD npm default prefix)
```
C:\Users\digit\AppData\Roaming\npm\node_modules\@anthropic-ai\claude-code\   (version 2.1.173)
C:\Users\digit\AppData\Roaming\npm\claude            (bash shim)
C:\Users\digit\AppData\Roaming\npm\claude.cmd        (cmd shim)
C:\Users\digit\AppData\Roaming\npm\claude.ps1        (powershell shim)
```

### The prefix split (why nvm breaks it)
```
npm config get prefix   →  C:\nvm4w\nodejs                 (CURRENT — nvm-managed, changes on `nvm use`)
npm root -g             →  C:\nvm4w\nodejs\node_modules
actual claude install   →  C:\Users\digit\AppData\Roaming\npm   (OLD default prefix, orphaned)
```
Because the install lives in the OLD prefix, `npm uninstall -g @anthropic-ai/claude-code` looks in
`C:\nvm4w\nodejs` and does NOTHING — the old copy must be removed manually.

### Orphaned backup binary
```
C:\Users\digit\AppData\Roaming\npm\node_modules\@anthropic-ai\claude-code\bin\claude.exe.old.1783500346806
  (244,185,248 bytes — the last-known-good binary, renamed by the failed auto-update)
```

### The shims (standard npm auto-generated boilerplate — NOT custom)
npm generates all three automatically for any `-g` package with a `bin` field. Recorded verbatim
for reference:

`claude` (POSIX/Git-Bash):
```sh
#!/bin/sh
basedir=$(dirname "$(echo "$0" | sed -e 's,\\,/,g')")
case `uname` in
    *CYGWIN*|*MINGW*|*MSYS*)
        if command -v cygpath > /dev/null 2>&1; then
            basedir=`cygpath -w "$basedir"`
        fi
    ;;
esac
exec "$basedir/node_modules/@anthropic-ai/claude-code/bin/claude.exe"   "$@"
```

`claude.cmd`:
```bat
@ECHO off
GOTO start
:find_dp0
SET dp0=%~dp0
EXIT /b
:start
SETLOCAL
CALL :find_dp0
"%dp0%\node_modules\@anthropic-ai\claude-code\bin\claude.exe"   %*
```

`claude.ps1`:
```powershell
#!/usr/bin/env pwsh
$basedir=Split-Path $MyInvocation.MyCommand.Definition -Parent
$exe=""
if ($PSVersionTable.PSVersion -lt "6.0" -or $IsWindows) {
  $exe=".exe"
}
if ($MyInvocation.ExpectingInput) {
  $input | & "$basedir/node_modules/@anthropic-ai/claude-code/bin/claude.exe"   $args
} else {
  & "$basedir/node_modules/@anthropic-ai/claude-code/bin/claude.exe"   $args
}
exit $LASTEXITCODE
```

### Second install location (`C:\nvm4w\nodejs` — nvm prefix), discovered during cleanup

A second, **working** npm install existed here in parallel (created when the npm prefix was the
nvm4w node dir). It had its own shim trio plus a live binary:

```text
C:\nvm4w\nodejs\claude            (bash shim)
C:\nvm4w\nodejs\claude.cmd        (cmd shim)
C:\nvm4w\nodejs\claude.ps1        (powershell shim)
C:\nvm4w\nodejs\node_modules\@anthropic-ai\claude-code\bin\claude.exe   (246,707,360 bytes — WORKING)
```

The shim **content is byte-identical** to the `AppData\Roaming\npm` trio recorded above — npm emits
the same boilerplate at every location. Each shim resolves the exe *relative to its own folder*
(`$MyInvocation` / `%~dp0` / `$0` + `node_modules\@anthropic-ai\claude-code\bin\claude.exe`), so only
the base directory differs, never the text. **This is the dangerous set**: it lives inside the
version-scoped nvm prefix, so `nvm use` / changing the default Node would move it out from under
`claude`. Because `~\.local\bin\claude.exe` (native) sat earlier on PATH, this working copy was
silently shadowed — which is why the *broken* AppData copy wasn't even the one being invoked in some
shells. Both npm locations were removed during migration.

## What is being changed

Replace the npm-global install with the **native standalone installer**, which lives at a fixed,
nvm-independent path and self-updates in place:
```powershell
irm https://claude.ai/install.ps1 | iex
```
Expected native location: `C:\Users\digit\.local\bin\claude.exe`
(versions under `C:\Users\digit\AppData\Local\claude\`).

Then remove the orphaned npm-global copy manually (npm won't, due to the prefix split):
```powershell
Remove-Item "$env:APPDATA\npm\claude*" -Force
Remove-Item "$env:APPDATA\npm\node_modules\@anthropic-ai\claude-code" -Recurse -Force
```

## NOT affected by this change (no re-setup needed)

All user config/state lives in `C:\Users\digit\.claude\` and is untouched:
```
.claude\plugins\      (marketplaces, installed plugins, cache)
.claude\skills\       (e.g. graphify)
.claude\agents\
.claude\commands\
.claude\settings.json
.claude\CLAUDE.md
```

## Revert path (if ever needed)

To go back to the npm-global install (recreates all three shims automatically):
```powershell
npm install -g @anthropic-ai/claude-code
```
Note: with the current nvm prefix, this installs into `C:\nvm4w\nodejs`, not the old
`AppData\Roaming\npm`. The `.old` backup binary (if preserved) can also be renamed back to
`claude.exe` in-place to restore the exact 2.1.173 build.

## References

- Native installer (Windows): `irm https://claude.ai/install.ps1 | iex`
- Pinned version: `& ([scriptblock]::Create((irm https://claude.ai/install.ps1))) <version>`
- Diagnostics: `claude doctor`
- There is **no** `claude migrate-installer` command in 2.1.x (verified) — migration is manual.

---

## Outcome (executed 2026-07-09)

**Result: SUCCESS — `claude` is now a single native install, fully independent of npm/nvm.**

- Native installer ran cleanly → **Claude Code 2.1.206** at `C:\Users\digit\.local\bin\claude.exe`
  (newer than the broken npm 2.1.173). Installer auto-added `~\.local\bin` to the user PATH.
- **Discovery:** there were actually TWO npm installs competing on PATH, not one:
  - `C:\Users\digit\AppData\Roaming\npm\...\claude-code\bin\` → only `claude.exe.old.<ts>` (BROKEN — the one throwing errors)
  - `C:\nvm4w\nodejs\node_modules\...\claude-code\bin\claude.exe` (246 MB, WORKING) + its own `claude`/`.cmd`/`.ps1` shims — an nvm-prefix install that would break on `nvm use`
- **Removed** (surgical — only `claude` files, no shared PATH directories touched):
  - `AppData\Roaming\npm\claude`, `claude.cmd`, `claude.ps1` + the whole `@anthropic-ai\claude-code` package (incl. the 244 MB `.old` backup)
  - `C:\nvm4w\nodejs\claude`, `claude.cmd`, `claude.ps1` + its `@anthropic-ai\claude-code` package
- **Verified final state:**
  - `Get-Command claude -All` → only `C:\Users\digit\.local\bin\claude.exe`
  - `claude --version` → `2.1.206 (Claude Code)`
  - Zero `claude*` artifacts remain anywhere under `C:\nvm4w` → nvm version switches can no longer affect claude.
- **Untouched / preserved:** all of `C:\Users\digit\.claude\` (7 marketplaces, 18 installed plugins, 57 skills, agents, commands, settings.json, CLAUDE.md).

**Note for open terminals:** existing shells still hold the old PATH in memory — open a NEW terminal
(or restart VS Code) for `claude` to resolve there. The `.old` 2.1.173 backup was deleted; to recover
any npm build, `npm install -g @anthropic-ai/claude-code` (installs into the current nvm prefix).
