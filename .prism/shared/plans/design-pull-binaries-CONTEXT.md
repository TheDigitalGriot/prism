# Stage Contract - design-pull-binaries

**Stage:** design-pull-binaries · **Mode:** PULL DOWN, binaries. `remote_writes: 0`.
**Why:** the 2026-09-14 text pull deferred 70 binaries on an untested assumption. A probe then proved `get_file` returns them as **base64** - `fonts/Afrik-Regular.woff` came back 262,283 base64 chars and decoded to a valid `wOFF` signature. The deferral was wrong. This stage completes the reunification.

## Inputs
- DesignSync `list_files` then `get_file` on project `019de567-c5df-7ee3-8fa2-c07c1d06dd48`.
- Authorized device-side; this headless run inherits Gavin's `/design-login`.

## Output
`C:\Users\digit\GriotMeta\SkillsForge\griotwave\griotwave-library\_master\claude-design\` - same mirror, same remote path structure. `fonts/`, `screenshots/`, `uploads/` and `preview/` already exist there; fill them.

Per-slice manifest: `_binmanifest.slice-<K>.json`.
Heartbeat: `C:\Users\digit\GriotApps\Prism\.prism\shared\plans\design-pull-binaries-HEARTBEAT.log` (append-only, ISO-8601 UTC, prefix your slice id).

## Locked Decisions
1. **PULL ONLY.** Never call `finalize_plan`, `write_files`, `delete_files`, `create_project`, `register_assets`, `unregister_assets`.
2. **Binary handling:** `get_file` returns base64. **Base64-decode before writing**, and write BYTES, not text - in Node use `fs.writeFileSync(path, Buffer.from(b64, 'base64'))`. Never write the base64 string itself to a `.woff`/`.png`.
3. **Verify every file by magic bytes, not by the call succeeding.** Record in the manifest: `decoded_bytes` and `magic_ok`. Expected signatures - `.woff` = `wOFF`, `.woff2` = `wOF2`, `.ttf`/`.otf` = `\x00\x01\x00\x00` or `OTTO` or `true`, `.png` = `\x89PNG`, `.jpg`/`.jpeg` = `\xFF\xD8\xFF`, `.webp` = `RIFF`+`WEBP`. A file whose magic does not match is recorded `magic_ok: false` and **flagged loudly**, never quietly kept.
4. **The 256 KiB cap is real.** If a returned payload looks capped or a decode produces a file whose magic is wrong AND whose size sits suspiciously at the cap, record it as `oversize_suspect` with both sizes. Do not pad, repair or invent.
5. **Never overwrite an existing file in the mirror.** If the path already holds bytes, skip it and record `skipped_exists`.
6. **Nothing outside the mirror is touched.** No credential operations. No artifact cards.

## Process
1. **S1** `list_files`. Filter to binary extensions (`.woff .woff2 .ttf .otf .png .jpg .jpeg .webp .ico .gif`). Emit `HB_S1_BINLIST_OK n=<count>`.
2. **S2** Sort the list alphabetically and take only the paths whose zero-based index modulo 4 equals YOUR SLICE NUMBER. Emit `HB_S2_SLICE_OK mine=<n>`.
3. **S3** For each of yours: `get_file`, base64-decode, write bytes to the mirror, check magic. Heartbeat every 5 files: `HB_S3_BIN_PROGRESS done=<n>/<total> magic_fail=<n>`.
4. **S4** Write your `_binmanifest.slice-<K>.json`: for each path `{path, b64_len, decoded_bytes, magic_ok, status}` plus `"remote_writes": 0`. Emit `HB_S4_BINMANIFEST_OK files=<n> bytes=<total> magic_fail=<n>` then `HB_DONE`.

## Success criteria
- Every one of your paths written-and-verified, or recorded with a reason. No silent drops.
- Every written file has `magic_ok: true`, or is flagged in the manifest AND in the heartbeat.
- `"remote_writes": 0`.
- Heartbeat ends `HB_DONE`. On any failure append `HB_FAIL step=<n> reason=<short>`, still write the partial manifest, and state plainly that the run is INCOMPLETE.