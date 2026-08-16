# Prism Close-out -- merge + headless closing ceremony (full release)

## Role
Headless in the Prism repo, C:\Users\digit\GriotApps\Prism. Ship the accumulated
feat/icm-fuse-opus5-multisurface work as a real release using the ESTABLISHED headless-aware closing
ceremony (the v4.10.0 mechanism: PRISM_NONINTERACTIVE + .prism/local/release-answers.json full-push
answers + scripts/resolve-answer.mjs). Default intent = FULL PUSH (Gavin stated default for a closing
ceremony). Proceed autonomously; never ask.

## Steps
1. Append heartbeat "start" to .prism/local/prism-release-progress.txt.
2. Pre-flight: git checkout main then git merge --no-ff feat/icm-fuse-opus5-multisurface -m "merge: Model Control Plane + Opus 5 + ICM fuse + multi-surface adapters". If the merge conflicts, abort the merge, append "BLOCKED-merge-conflict", and STOP (do not force). Append "merged" on success.
3. Write .prism/local/release-answers.json with full-push answers for the closing ceremony: bump type = minor (4.10.0 -> 4.11.0), push = true, githubRelease = true, syncMirror = true, native builds = true, and any other gates set to their full-push value (read scripts/resolve-answer.mjs + the closing-ceremony/bookend/release skills to get the exact answer keys used at v4.10.0). Append "answers-written".
4. Run the closing ceremony headless: set PRISM_NONINTERACTIVE=1 and drive prism-closing-ceremony (bookend -> docs-update -> release). This bumps the version across all version files, updates CHANGELOG + the VitePress docs, builds the native artifacts (CLI + installers + Cowork sideload zip), commits, tags v4.11.0, pushes, and creates the GitHub release with assets. Use the repo own scripts. Append heartbeats: "bookend-done", "docs-done", "built", "tagged v4.11.0", "pushed", "gh-release-done".
5. Verify: git tag --list v4.11.0, git rev-parse v4.11.0, local main == origin/main after push (ref-equality), and gh release view v4.11.0 succeeds. Append "verify-ok".
6. Append "DONE version=4.11.0". On ANY blocker append "BLOCKED-<phase>-<why>" and STOP that step cleanly (leave the repo committed, never half-released); completing the local bump+tag even if the push/gh-release blocked is fine -- report which succeeded.

## Guardrails
- Do NOT weaken any gate; do NOT skip the build. If a native build tool is missing, append "BLOCKED-build-<tool>" and still complete the version bump + CHANGELOG + docs + tag locally, then push what succeeded.
- Push over the existing origin (SSH) -- the on-device headless run has the real SSH agent (this is how v4.10.0 pushed). If a push hangs > 3 min, append "BLOCKED-push-hang" and stop (do not retry in a loop).
- Do NOT touch npm (create-fragment publish is a separate repo + a human-gated step).

## Heartbeat tokens (append one timestamped line each to .prism/local/prism-release-progress.txt)
start / merged / answers-written / bookend-done / docs-done / built / tagged v4.11.0 / pushed / gh-release-done / verify-ok / DONE version=4.11.0 / BLOCKED-<phase>-<why>
