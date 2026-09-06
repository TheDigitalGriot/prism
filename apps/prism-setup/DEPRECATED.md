# apps/prism-setup — RETIRED (v4.15.2)

**This tree is no longer built, staged, or shipped.** It is retained on disk for rollback only.

The legacy Electron/NSIS "Prism Setup" installer here was superseded by the Tauri installer at
[`apps/prism-installer/`](../prism-installer/). As of **v4.15.2**:

- `.github/workflows/prism-setup-release.yml` was deleted (it had already been tag-trigger-disabled
  and marked DEPRECATED before that).
- `skills/prism-release/SKILL.md` no longer routes the VSIX or the CLI/plugin resources through
  `apps/prism-setup/resources/`.
- The VSIX now ships as a **bundled Tauri resource** —
  `apps/prism-installer/src-tauri/resources/extensions/prism.vsix`, declared in
  `apps/prism-installer/src-tauri/tauri.conf.json` under `bundle.resources` and resolved at runtime
  with `resolveResource("extensions/prism.vsix")`.

`installer/` (the `prism-setup.nsi` NSIS source and its historical `Prism-Setup-*.exe` artifacts) is
retired on the same terms.

## Do not

- Do not add this tree back to the release ceremony's git-add list or build steps.
- Do not treat `resources/extensions/prism.vsix` here as current — it is frozen at whatever v4.15.1
  left behind. The live copy is under `apps/prism-installer/`.

## Rollback

`git revert` the sunset commit (`db65d56`) and restore
`.github/workflows/prism-setup-release.yml` from history. Nothing in this tree was deleted, so the
revert is a restore of wiring only.
