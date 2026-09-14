# Stage Contract - design-pull

**Stage:** design-pull · **Mode:** PULL DOWN. Reads remote, writes ONLY to the local mirror below.
**Purpose (Gavin, 2026-09-14):** "the whole point of pull the claude designs was to reunify my design work and html stuff from over the past including prism." Bring the Claude Design work back onto disk so it sits beside griotwave-ui, griotwave-library, the Prism designs folder and the live HTML surfaces.
**Date:** 2026-09-14

---

## Inputs

- DesignSync `list_files` then `get_file` against project `019de567-c5df-7ee3-8fa2-c07c1d06dd48` (Griotwave Design System, 155 paths / 144 files).
- Authorized device-side by Gavin's `/design-login`; this headless run inherits it.

## Output - the reunification home

`C:\Users\digit\GriotMeta\SkillsForge\griotwave\griotwave-library\_master\claude-design\`

Mirror the remote path structure exactly underneath it. Create directories as needed. This sits beside `griotwave.tokens.json` and the visual-language docs, which is the canonical design home.

Also write:
- `_manifest.json` - every remote path with bytes pulled, or the reason it was skipped.
- `_REUNIFY.md` - a short index: what came down, what is text vs binary, and which local store each remote area overlaps.

Heartbeat: `C:\Users\digit\GriotApps\Prism\.prism\shared\plans\design-pull-HEARTBEAT.log` (append-only, ISO-8601 UTC per line).

## Locked Decisions

1. **PULL ONLY.** Never call `finalize_plan`, `write_files`, `delete_files`, `create_project`, `register_assets`, `unregister_assets`. Nothing is written to the remote project. The manifest must end with `"remote_writes": 0`.
2. **`get_file` is NOT rationed.** The only limit is 256 KiB per file. Pull every text file. A previous contract's "max 5" was an error and does not apply.
3. **Text now, binary listed.** Pull `.md .css .json .tsx .ts .jsx .js .html .txt .svg`. For fonts and images (`.woff .woff2 .ttf .otf .png .jpg .jpeg .webp`) record the path and skip the body - note them in the manifest under `binary_deferred` with a one-line reason.
4. **Never overwrite a local file outside the mirror.** Everything lands under `_master\claude-design\`. Nothing else on disk is touched.
5. **A file over 256 KiB is recorded as `oversize`, not truncated.**
6. **No credential operations.** Never run `npm publish`, `npm login`, `npm adduser`, or anything that consumes a token.
7. **No artifact cards.** Publishing is the caller's half.

## Process

1. **S1** `list_files` the project. Record the full path list. Emit `HB_S1_LIST_OK n=<count>`.
2. **S2** Partition into text / binary_deferred / oversize by extension. Emit `HB_S2_PARTITION_OK text=<n> binary=<n>`.
3. **S3** `get_file` each text path and write it to the mirror at the same relative path. Emit a heartbeat every 25 files: `HB_S3_PULL_PROGRESS done=<n>/<total>`. On a per-file failure, record it in the manifest and keep going - one bad file never ends the pull.
4. **S4** Write `_manifest.json` (paths, bytes, status, `"remote_writes": 0`). Emit `HB_S4_MANIFEST_OK files=<n> bytes=<total>`.
5. **S5** Write `_REUNIFY.md` - the index. For each top-level remote area (`brand-matrix-kit/`, `preview/`, `src/`, `ui_kits/`, `uploads/`, root files), one line saying what it holds and which local store it overlaps: griotwave-ui `src/`, griotwave-library `_master`/`01-ember-bloom`, the Prism designs folder, or nothing. Emit `HB_S5_INDEX_OK` then `HB_DONE`.

## Success criteria

- Every text path either written to the mirror or recorded with a failure reason. No silent drops.
- `_manifest.json` carries `"remote_writes": 0`.
- Mirror path structure matches the remote path structure exactly.
- Heartbeat ends with `HB_DONE`. If any step cannot complete, append `HB_FAIL step=<n> reason=<short>`, still write the partial manifest, and say plainly that the run is INCOMPLETE.