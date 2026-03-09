# Prism Release Eval — Old Skill (v2.4.8) Transcript

**Task**: Release a new patch version of prism-plugin. Current version is 2.5.0.
**Skill Version**: v2.4.8 (`prism-release/SKILL.md`)
**Mode**: Simulated (no actual commits, tags, pushes, or file modifications)

---

## Step 1: Determine bump type

**Action**: Read current version from `VERSION` file.

```bash
cat VERSION
# Output: 2.5.0
```

**Bump type**: patch (as specified by the task — bug fixes, small changes)

**New version**: 2.5.0 -> **2.5.1**

> In a real run, the skill instructs to ask the user via `AskUserQuestion` which semver component to bump (patch/minor/major). The user has already specified "patch version" in the task, so this is resolved.

---

## Step 2: Bump version across all files

**Action**: Run the version bump script.

```bash
python scripts/bump-version.py patch --root .
```

**Expected behavior**: The script updates version strings in all tracked locations:
- `VERSION` — `2.5.0` -> `2.5.1`
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

**Simulated output**: All files updated to 2.5.1.

---

## Step 3: Build all artifacts

### Step 3a: Cross-compile CLI binaries

```bash
cd cmd/prism-cli && make build-all
```

**Expected output**: 5 binaries in `cmd/prism-cli/bin/`:
- `prism-cli-darwin-amd64`
- `prism-cli-darwin-arm64`
- `prism-cli-linux-amd64`
- `prism-cli-linux-arm64`
- `prism-cli-windows-amd64.exe`

**Verification**: `ls -la cmd/prism-cli/bin/` — 5 binaries present.

### Step 3b: Package VSIX extension

```bash
cd cmd/prism-vscode && npx @vscode/vsce package \
  --no-dependencies \
  --baseContentUrl https://github.com/TheDigitalGriot/prism-plugin/tree/main/cmd/prism-vscode \
  --baseImagesUrl https://github.com/TheDigitalGriot/prism-plugin/raw/main/cmd/prism-vscode \
  --out ../prism-setup/resources/extensions/prism.vsix
```

**Expected output**: `cmd/prism-setup/resources/extensions/prism.vsix` created.

### Step 3c: Populate NSIS installer resources

```bash
mkdir -p cmd/prism-setup/resources/binaries
cp cmd/prism-cli/bin/prism-cli-windows-amd64.exe cmd/prism-setup/resources/binaries/

mkdir -p cmd/prism-setup/resources/plugin
cp -r commands agents skills .claude-plugin cmd/prism-setup/resources/plugin/
```

**Expected output**: CLI binary and plugin files staged for installer.

### Step 3d: Build Electron desktop app

```bash
cd cmd/prism-electron && npm run make
```

**Expected output**: `cmd/prism-electron/out/make/squirrel.windows/x64/Prism-2.5.1 Setup.exe`

### Step 3e: Build Tauri installer (Windows + macOS)

```bash
gh workflow run prism-installer-release.yml -f version=2.5.1
```

**Expected output**: GitHub Actions workflow triggered. Builds:
- `Prism-Setup-2.5.1.exe` (Windows NSIS via Tauri)
- `Prism-Setup-2.5.1.dmg` (macOS via Tauri)

**Legacy NSIS** (deprecated, kept for rollback):
```bash
makensis -V4 -DVERSION=2.5.1 installer/prism-setup.nsi
```

---

## Step 4: Commit and tag

```bash
git add VERSION .claude-plugin/ cmd/prism-cli/main.go cmd/prism-cli/app/footer.go \
  cmd/prism-vscode/package.json cmd/prism-electron/package.json \
  cmd/prism-installer/package.json cmd/prism-installer/src-tauri/tauri.conf.json \
  packages/prism-core/src/shared/PrismState.ts \
  packages/prism-ui/src/context/PrismStateContext.tsx \
  installer/ scripts/

git commit -m "v2.5.1"
git tag v2.5.1
```

**SIMULATED** — no actual commit or tag created.

---

## Step 5: Push

```bash
git push && git push origin v2.5.1
```

**SIMULATED** — no actual push performed.

---

## Step 6: Create GitHub release

```bash
gh release create v2.5.1 \
  cmd/prism-cli/bin/prism-cli-darwin-amd64 \
  cmd/prism-cli/bin/prism-cli-darwin-arm64 \
  cmd/prism-cli/bin/prism-cli-linux-amd64 \
  cmd/prism-cli/bin/prism-cli-linux-arm64 \
  cmd/prism-cli/bin/prism-cli-windows-amd64.exe \
  "cmd/prism-electron/out/make/squirrel.windows/x64/Prism-2.5.1 Setup.exe" \
  installer/Prism-Setup-2.5.1.exe \
  --title "Prism v2.5.1" \
  --notes "Patch release v2.5.1"
```

**Expected assets** (8 total):
1. `prism-cli-darwin-amd64`
2. `prism-cli-darwin-arm64`
3. `prism-cli-linux-amd64`
4. `prism-cli-linux-arm64`
5. `prism-cli-windows-amd64.exe`
6. `Prism-2.5.1 Setup.exe` (Electron)
7. `Prism-Setup-2.5.1.exe` (Tauri Windows, built by CI)
8. `Prism-Setup-2.5.1.dmg` (Tauri macOS, built by CI)

**SIMULATED** — no actual GitHub release created.

---

## Step 7: Report results

**Summary**:
- Version bumped: 2.5.0 -> 2.5.1
- Version files updated: 11 locations via `scripts/bump-version.py`
- CLI binaries: 5 cross-compiled
- VSIX: packaged
- Electron installer: built
- Tauri installer: CI workflow triggered
- Git commit: `v2.5.1`
- Git tag: `v2.5.1`
- GitHub release: `https://github.com/TheDigitalGriot/prism-plugin/releases/tag/v2.5.1`

---

## Observations on v2.4.8 Skill Behavior

1. **No pre-flight checks**: The skill does not verify that the working tree is clean before starting, or that required tools (Go, Node, NSIS, gh) are installed upfront.
2. **Sequential user interaction**: Step 1 asks the user for bump type, but provides no default or auto-detection from context.
3. **Hardcoded file list in Step 4**: The `git add` command lists specific files. If the bump script updates additional files not in this list, they would be missed from the commit.
4. **No changelog generation**: No automated changelog or release notes — the `--notes` field is a placeholder string.
5. **No rollback mechanism**: If any step fails mid-pipeline, there is no guidance on how to undo partial changes (e.g., version already bumped but build failed).
6. **Tauri + Legacy NSIS overlap**: Step 3e mentions both the new Tauri CI workflow and the deprecated legacy NSIS build, which could cause confusion about which to actually run.
7. **No VSIX in release assets**: The VSIX is built (Step 3b) and placed in `prism-setup/resources/extensions/` but is NOT included in the `gh release create` asset list in Step 6.
8. **CI dependency for Tauri**: The Tauri `.exe` and `.dmg` are built by CI but referenced in the release create command as local files — there is no step to download them from CI before attaching.
