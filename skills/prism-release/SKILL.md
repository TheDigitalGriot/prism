---
name: prism-release
description: Create a versioned release of prism-plugin. Bumps semantic version (major/minor/patch) across all version files — plugin.json, marketplace.json, main.go, both package.json files, changelogs, and documentation. Cross-compiles prism-cli binaries, commits, and tags. Use when the user says "release", "bump version", "new version", "cut a release", "prism-release", or wants to update version numbers across the project.
---

# Prism Release

Bump version numbers across the entire prism-plugin monorepo, update changelogs, rebuild CLI binaries, and create a tagged commit.

## Workflow

### 1. Gather Release Info

Ask the user:
- **Bump type**: patch / minor / major
- **Release summary**: Short description of what changed (used in commit message and changelogs)
- **Include packages?**: Whether to also bump `packages/prism-core` and `packages/prism-ui`

### 2. Read Current Version

Source of truth: `VERSION` file at repository root.

```bash
cat VERSION
```

### 3. Bump Version Across All Files

Run the centralized bump script:

```bash
python scripts/bump-version.py <major|minor|patch> --root .
```

This automatically updates all 14 version locations:
- `VERSION` (root source of truth)
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

Verify the script output shows all files updated. If any are skipped (file missing), note it but continue.

### 4. Update Changelogs

Prepend a new section after the header in each changelog:

**Root `CHANGELOG.md`**:
```markdown
## [NEW] - YYYY-MM-DD

### Changed
- {user's release summary}
```

**`cmd/prism-vscode/CHANGELOG.md`**:
```markdown
## [NEW] — YYYY-MM-DD

### Changed
- {user's release summary}
```

### 5. Update Documentation (if exists)

```bash
ls .prism/shared/docs/PRISM-DOCUMENTATION-*.md
```

If found, rename and update internal version references.

### 6. Build CLI Binaries

```bash
cd cmd/prism-cli && make build-all
```

This cross-compiles for: windows/amd64, darwin/amd64, darwin/arm64, linux/amd64, linux/arm64.

Verify build succeeds. If it fails, stop and report the error.

### 7. Summary and Review

Display the bump script output and changelog updates. Ask user to confirm before committing.

### 8. Commit and Tag

```bash
git add -A
git commit -m "vNEW - {release summary}"
git tag "vNEW"
```

### 9. Push (Optional)

Ask user if they want to push:

```bash
git push origin main --tags
```

Only push if explicitly confirmed.
