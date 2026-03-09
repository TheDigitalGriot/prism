# Prism Release — Old Skill (v2.4.8) Transcript

**Skill Version**: v2.4.8 (BASELINE)
**Task**: "Release a new minor version. The current version is 2.5.0. I want a minor bump."
**Date**: 2026-03-08
**Mode**: Simulated (no actual commits, tags, pushes, or file modifications)

---

## Step 1: Determine Bump Type

The user has already specified:
- **Bump type**: minor
- **Current version**: 2.5.0 (as stated by user)
- **New version**: 2.6.0

Per the skill instructions, I would read the `VERSION` file and confirm with the user:

```bash
cat VERSION
# Output: 2.5.1
```

> **Note**: The actual VERSION file contains `2.5.1`, but the user stated the current version is `2.5.0`. In a real execution, I would clarify this discrepancy with the user. For this simulation, I proceed with the user's stated version `2.5.0` and target `2.6.0`.

The user already told me they want a **minor** bump, so no need to ask via AskUserQuestion. Proceeding.

---

## Step 2: Bump Version Across All Files

**Command (simulated)**:
```bash
python scripts/bump-version.py minor --root .
```

**Expected behavior**: This script updates version strings in all of these locations:
- `VERSION` — `2.5.0` -> `2.6.0`
- `plugin.json`
- `marketplace.json`
- `cmd/prism-cli/main.go`
- `cmd/prism-cli/app/footer.go`
- `cmd/prism-vscode/package.json`
- `cmd/prism-electron/package.json`
- `cmd/prism-installer/package.json`
- `cmd/prism-installer/src-tauri/tauri.conf.json`
- `packages/prism-core/src/shared/PrismState.ts`
- `packages/prism-ui/src/context/PrismStateContext.tsx`

**Expected output**: Confirmation that all files were updated to `2.6.0`.

---

## Step 3: Build All Artifacts

### Step 3a: Cross-compile CLI binaries

**Command (simulated)**:
```bash
cd cmd/prism-cli && make build-all
```

**Expected output**: 5 binaries produced in `cmd/prism-cli/bin/`:
- `prism-cli-darwin-amd64`
- `prism-cli-darwin-arm64`
- `prism-cli-linux-amd64`
- `prism-cli-linux-arm64`
- `prism-cli-windows-amd64.exe`

**Verification (simulated)**:
```bash
ls -la cmd/prism-cli/bin/
# Should show 5 binaries
```

### Step 3b: Package VSIX Extension

**Command (simulated)**:
```bash
cd cmd/prism-vscode && npx @vscode/vsce package \
  --no-dependencies \
  --baseContentUrl https://github.com/TheDigitalGriot/prism-plugin/tree/main/cmd/prism-vscode \
  --baseImagesUrl https://github.com/TheDigitalGriot/prism-plugin/raw/main/cmd/prism-vscode \
  --out ../prism-setup/resources/extensions/prism.vsix
```

**Expected output**: `prism.vsix` created at `cmd/prism-setup/resources/extensions/prism.vsix`.

### Step 3c: Populate NSIS Installer Resources

**Commands (simulated)**:
```bash
mkdir -p cmd/prism-setup/resources/binaries
cp cmd/prism-cli/bin/prism-cli-windows-amd64.exe cmd/prism-setup/resources/binaries/

mkdir -p cmd/prism-setup/resources/plugin
cp -r commands agents skills .claude-plugin cmd/prism-setup/resources/plugin/
```

### Step 3d: Build Electron Desktop App

**Command (simulated)**:
```bash
cd cmd/prism-electron && npm run make
```

**Verification (simulated)**:
```bash
ls cmd/prism-electron/out/make/squirrel.windows/x64/
# Expected: "Prism-2.6.0 Setup.exe"
```

### Step 3e: Build Tauri Installer (Windows + macOS)

**Command (simulated)**:
```bash
gh workflow run prism-installer-release.yml -f version=2.6.0
```

**Expected behavior**: GitHub Actions workflow triggers, building:
- `Prism-Setup-2.6.0.exe` (Windows NSIS via Tauri)
- `Prism-Setup-2.6.0.dmg` (macOS via Tauri)

Legacy NSIS (deprecated, not run unless needed for rollback):
```bash
makensis -V4 -DVERSION=2.6.0 installer/prism-setup.nsi
```

---

## Step 4: Commit and Tag

**Commands (simulated)**:
```bash
git add VERSION .claude-plugin/ cmd/prism-cli/main.go cmd/prism-cli/app/footer.go \
  cmd/prism-vscode/package.json cmd/prism-electron/package.json \
  cmd/prism-installer/package.json cmd/prism-installer/src-tauri/tauri.conf.json \
  packages/prism-core/src/shared/PrismState.ts \
  packages/prism-ui/src/context/PrismStateContext.tsx \
  installer/ scripts/

git commit -m "v2.6.0"
git tag v2.6.0
```

---

## Step 5: Push

**Commands (simulated)**:
```bash
git push && git push origin v2.6.0
```

---

## Step 6: Create GitHub Release

**Command (simulated)**:
```bash
gh release create v2.6.0 \
  cmd/prism-cli/bin/prism-cli-darwin-amd64 \
  cmd/prism-cli/bin/prism-cli-darwin-arm64 \
  cmd/prism-cli/bin/prism-cli-linux-amd64 \
  cmd/prism-cli/bin/prism-cli-linux-arm64 \
  cmd/prism-cli/bin/prism-cli-windows-amd64.exe \
  "cmd/prism-electron/out/make/squirrel.windows/x64/Prism-2.6.0 Setup.exe" \
  installer/Prism-Setup-2.6.0.exe \
  --title "Prism v2.6.0" \
  --notes "Release notes here"
```

**Expected assets (8 total)**:
1. `prism-cli-darwin-amd64`
2. `prism-cli-darwin-arm64`
3. `prism-cli-linux-amd64`
4. `prism-cli-linux-arm64`
5. `prism-cli-windows-amd64.exe`
6. `Prism-2.6.0 Setup.exe` (Electron)
7. `Prism-Setup-2.6.0.exe` (Tauri Windows, built by CI)
8. `Prism-Setup-2.6.0.dmg` (Tauri macOS, built by CI)

---

## Step 7: Report Results

**Release Summary**:
- **Version**: 2.5.0 -> 2.6.0 (minor bump)
- **Tag**: `v2.6.0`
- **Release URL**: `https://github.com/TheDigitalGriot/prism-plugin/releases/tag/v2.6.0`
- **Assets**: 8 artifacts (5 CLI binaries + 1 Electron installer + 2 Tauri installers)
- **Tauri CI**: Workflow `prism-installer-release.yml` triggered for Windows + macOS builds

---

## Observations on Old Skill (v2.4.8) Behavior

1. **No release notes generation**: The skill uses a placeholder `"Release notes here"` for the `--notes` flag. There is no automated changelog generation or prompt to write release notes.
2. **No pre-release validation**: The skill does not run tests, linting, or any validation before building and releasing. It goes straight from version bump to build.
3. **No dry-run mode**: There is no way to preview what will happen without actually executing.
4. **Hardcoded asset list**: The `gh release create` command has a fixed list of assets. If a build step fails, the release command will also fail due to missing files.
5. **Sequential dependency not enforced**: Steps 3a and 3b are noted as parallelizable, but 3c depends on 3a (needs the Windows CLI binary). The skill mentions this order but doesn't enforce it.
6. **Version discrepancy handling**: The skill says to read VERSION and show it, but doesn't have explicit guidance for when the user's stated version doesn't match the file.
7. **Tauri CI fire-and-forget**: The Tauri workflow is triggered but there's no wait or verification that it completed before creating the GitHub release. The Tauri assets may not be attached.
8. **Legacy NSIS still referenced**: The deprecated NSIS path is documented but the relationship between it and the Tauri-built NSIS installer could cause confusion.
