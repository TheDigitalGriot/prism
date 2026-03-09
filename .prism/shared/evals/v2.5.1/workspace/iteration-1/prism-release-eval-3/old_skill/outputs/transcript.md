# Prism Release Evaluation Transcript (v2.4.8 Skill)

**Task**: Release a patch version. The gh CLI is not authenticated.
**Skill Version**: v2.4.8 (baseline)
**Date**: 2026-03-08

---

## Step 1: Determine bump type

The user requested a **patch** version bump.

Read current version from `VERSION` file:

```
$ cat VERSION
2.5.1
```

Current version: **2.5.1**
Bump type: **patch**
New version will be: **2.5.2**

No need to ask the user — they already specified "patch version."

---

## Step 2: Bump version across all files

**[SIMULATED]** Would run:

```bash
python scripts/bump-version.py patch --root .
```

This would update version from 2.5.1 to 2.5.2 in all version files:
- `VERSION`
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

---

## Step 3: Build all artifacts

### 3a. Cross-compile CLI binaries

**[SIMULATED]** Would run:

```bash
cd cmd/prism-cli && make build-all
```

Expected output: 5 binaries in `cmd/prism-cli/bin/`:
- `prism-cli-darwin-amd64`
- `prism-cli-darwin-arm64`
- `prism-cli-linux-amd64`
- `prism-cli-linux-arm64`
- `prism-cli-windows-amd64.exe`

### 3b. Package VSIX extension

**[SIMULATED]** Would run:

```bash
cd cmd/prism-vscode && npx @vscode/vsce package \
  --no-dependencies \
  --baseContentUrl https://github.com/TheDigitalGriot/prism-plugin/tree/main/cmd/prism-vscode \
  --baseImagesUrl https://github.com/TheDigitalGriot/prism-plugin/raw/main/cmd/prism-vscode \
  --out ../prism-setup/resources/extensions/prism.vsix
```

### 3c. Populate NSIS installer resources

**[SIMULATED]** Would run:

```bash
mkdir -p cmd/prism-setup/resources/binaries
cp cmd/prism-cli/bin/prism-cli-windows-amd64.exe cmd/prism-setup/resources/binaries/

mkdir -p cmd/prism-setup/resources/plugin
cp -r commands agents skills .claude-plugin cmd/prism-setup/resources/plugin/
```

### 3d. Build Electron desktop app

**[SIMULATED]** Would run:

```bash
cd cmd/prism-electron && npm run make
```

Expected output: `Prism-2.5.2 Setup.exe` in `cmd/prism-electron/out/make/squirrel.windows/x64/`

### 3e. Build Tauri installer (Windows + macOS)

**[SIMULATED]** Would run:

```bash
gh workflow run prism-installer-release.yml -f version=2.5.2
```

**BLOCKER**: The `gh` CLI is not authenticated. This command would fail.

Per the skill's error handling section:
> "If `gh` is not installed or not authenticated: tell the user to run `gh auth login`"

**Action taken**: Inform the user that `gh` is not authenticated and they need to run `gh auth login` before the Tauri CI build can be triggered.

The legacy NSIS fallback is noted as deprecated but available:
```bash
makensis -V4 -DVERSION=2.5.2 installer/prism-setup.nsi
```

---

## Step 4: Commit and tag

**[SIMULATED]** Would run:

```bash
git add VERSION .claude-plugin/ cmd/prism-cli/main.go cmd/prism-cli/app/footer.go \
  cmd/prism-vscode/package.json cmd/prism-electron/package.json \
  cmd/prism-installer/package.json cmd/prism-installer/src-tauri/tauri.conf.json \
  packages/prism-core/src/shared/PrismState.ts \
  packages/prism-ui/src/context/PrismStateContext.tsx \
  installer/ scripts/

git commit -m "v2.5.2"
git tag v2.5.2
```

---

## Step 5: Push

**[SIMULATED]** Would run:

```bash
git push && git push origin v2.5.2
```

---

## Step 6: Create GitHub release

**[SIMULATED]** Would run:

```bash
gh release create v2.5.2 \
  cmd/prism-cli/bin/prism-cli-darwin-amd64 \
  cmd/prism-cli/bin/prism-cli-darwin-arm64 \
  cmd/prism-cli/bin/prism-cli-linux-amd64 \
  cmd/prism-cli/bin/prism-cli-linux-arm64 \
  cmd/prism-cli/bin/prism-cli-windows-amd64.exe \
  "cmd/prism-electron/out/make/squirrel.windows/x64/Prism-2.5.2 Setup.exe" \
  installer/Prism-Setup-2.5.2.exe \
  --title "Prism v2.5.2" \
  --notes "Release notes here"
```

**BLOCKER**: This command would also fail because `gh` is not authenticated.

Per the skill's error handling:
> "If `gh` is not installed or not authenticated: tell the user to run `gh auth login`"

**Action taken**: Inform the user to run `gh auth login` to authenticate the GitHub CLI before creating the release.

---

## Step 7: Report results

### Release Summary

| Item | Status |
|------|--------|
| Version bump (2.5.1 -> 2.5.2) | Simulated |
| CLI cross-compile (5 binaries) | Simulated |
| VSIX packaging | Simulated |
| NSIS resource population | Simulated |
| Electron build | Simulated |
| Tauri CI build | **BLOCKED** — `gh` not authenticated |
| Git commit + tag | Simulated |
| Git push | Simulated |
| GitHub release creation | **BLOCKED** — `gh` not authenticated |

### Blockers Encountered

1. **`gh` CLI not authenticated** — The GitHub CLI is required for Step 3e (Tauri CI trigger) and Step 6 (GitHub release creation). The user must run `gh auth login` to authenticate before these steps can proceed.

### Skill Behavior Analysis

The v2.4.8 skill handles the "gh not authenticated" scenario with a single line in the Error Handling section:
> "If `gh` is not installed or not authenticated: tell the user to run `gh auth login`"

**Observations**:
- The skill does NOT detect the auth issue proactively — it would only surface after a command fails.
- There is no pre-flight check for `gh auth status` before starting the pipeline.
- Steps 1-4 (version bump, builds, commit, tag) could all succeed before hitting the `gh` blocker at Step 5 (push would work) and Step 6 (release creation would fail).
- The Tauri CI build (Step 3e) would fail earlier since it also requires `gh`.
- The skill provides no guidance on whether to proceed with local-only steps (commit/tag) when `gh` is unavailable, potentially leaving the repo in a partially-released state.
- The skill does not suggest any workaround (e.g., creating the release manually via the GitHub web UI).
