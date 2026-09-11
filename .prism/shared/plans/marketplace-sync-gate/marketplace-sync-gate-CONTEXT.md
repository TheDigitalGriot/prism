# Stage contract - marketplace-sync-gate

Inbound (awaits): scripts/sync-to-marketplace.sh, scripts/pre-release-audit.mjs

## The defect

Prism ships through three channels. Two mirrors drifted silently and nothing failed:

- TheDigitalGriot/prism-plugin      froze at 4.15.2  (4.16.0, 4.16.1, 4.16.2 never ran Step 6.5)
- digital-griot-marketplace         froze at 4.12.1  (last sync commit eb23337, 2026-08-24)

Two different stall points prove these are two independent manual steps, both skippable, neither
gated. The Claude Cowork surface reads the unified marketplace, so it has been serving Prism 4.12.1.
Corroborated independently: cinopsis reads 2.2.0 in the marketplace and 2.2.0 on the Cowork surface,
while the device is further ahead. Two plugins, same fingerprint, same channel.

This is the same class of bug already solved once for lockfiles: bc4a601 gated the release on
package.json/package-lock sync and de9772c made that gate FAIL CLOSED. The mirror sync has no gate.
The durable fix is the gate, not another manual push.

## Inputs

Working (exact paths):
- C:\Users\digit\GriotApps\Prism\scripts\pre-release-audit.mjs        151 lines, the ceremony gate
- C:\Users\digit\GriotApps\Prism\scripts\sync-prism-plugin.sh         standalone-mirror sync, works
- C:\Users\digit\GriotApps\Prism\VERSION                              4.16.2

Reference (read, do not edit in place):
- C:\Users\digit\GriotMeta\digital-griot-marketplace\scripts\sync-to-marketplace.sh
  The canonical generalized multi-plugin sync. Clones the shared marketplace, replaces ONLY this
  tool subdir, upserts ONE manifest entry, commits without force-push so other tools survive.
  It is written to be run from a Griot TOOL repo root. Prism never received a copy.

## Decisions (locked)

1. Do NOT invent a sync script. Port the existing canonical sync-to-marketplace.sh into Prism
   scripts/ unchanged in behaviour. One home per fact; this is a port, not a rewrite.
2. The real deliverable is the GATE. Add a mirror-freshness check to pre-release-audit.mjs in the
   established style: it reports on its own result, it FAILS CLOSED, and an unrecognised or
   environmental failure is a FAIL with a clear message, never a silent pass. A gate that flakes is
   a gate people learn to ignore, so make it robust rather than lenient.
3. The gate compares local VERSION against the version actually published in BOTH mirrors, read
   from the remote, not from a local working copy. A local file proves nothing about the remote.
4. The marketplace subdir is a GENERATED build artifact. Commits d96b5cb and e142df8 hand-edited it
   for the griot-agent-architect and spectrum-architect renames. The sync replaces the subdir
   wholesale and those hand-edits will disappear. That is CORRECT: both renames are already present
   in the 4.16.2 source tree, so nothing is lost. Do not try to preserve them.
5. Never force-push the shared marketplace. Force-push is only valid for the single-tool mirror.

## Process

1. Run griot-agent-architect and follow its conventions for every file touched.
2. Port sync-to-marketplace.sh into Prism scripts/, POSIX sh only, LF endings.
3. Add the mirror-freshness gate to pre-release-audit.mjs, fail-closed, self-reporting.
4. Wire both mirror syncs into the prism-release closing ceremony Step 6.5 so a release cannot
   complete having pushed only one of them.
5. Run the bundled griot-agent-architect validator AND node scripts/pre-release-audit.mjs.
   Expect the new gate to FAIL first, because the marketplace really is stale. That failure is the
   proof the gate works. Record it.
6. Run the sync for real so digital-griot-marketplace carries prism 4.16.2.
7. Re-run the gate. It must now PASS. Verify the remote by fresh clone, never by working copy.
8. Commit to the Prism repo with a message describing the gate, not just the sync.

## Out of scope, flag only

Cinopsis is also stale in the shared marketplace at 2.2.0. Do not touch the Cinopsis repo. Note it
in the report so it can be closed from its own repo with the same ported script.

## Success criteria

- Prism scripts/sync-to-marketplace.sh exists and is a faithful port.
- pre-release-audit.mjs fails closed when either mirror is behind VERSION.
- The gate demonstrably FAILED before the sync and PASSES after.
- digital-griot-marketplace prism-plugin plugin.json AND the root marketplace.json entry both read
  4.16.2 on the REMOTE, verified by fresh clone.
- cinopsis-plugin and every other tool folder still present in the marketplace after the push.
- Prism repo committed, HEAD equals origin/main.

## Heartbeat tokens

STEP 1 architect - STEP 2 port - STEP 3 gate - STEP 4 wire - STEP 5 gate-fails-as-expected
STEP 6 sync - STEP 7 gate-passes - STEP 8 commit - DONE

## AMENDMENT - make the gate channel-generic (added mid-stage)

Prism publishes to FOUR channels, not two. Verified on this device:

| channel | source it reads | state |
|---|---|---|
| local Claude Code CLI marketplace | TheDigitalGriot/prism, source "." | current 4.16.2 |
| TheDigitalGriot/prism-plugin      | thin mirror, Anthropic Desktop/Cowork backend | was 4.15.2, now 4.16.2 |
| digital-griot-marketplace         | thin mirror, unified, what Cowork actually serves | STALE 4.12.1 |
| Codex CLI prism-marketplace       | https://github.com/TheDigitalGriot/prism.git DIRECT | current 4.16.2 |

Codex clones the monorepo directly. Its backend does not reject what Anthropic's rejects, so it
never used a thin mirror and is structurally immune to this defect. Its cache already holds 4.16.2.
Codex therefore needs NO fix. Record it, do not change it.

Because a channel list that lives in someone's head is how this broke, build the gate TABLE-DRIVEN
over an explicit CHANNELS array in pre-release-audit.mjs, one entry per channel, each declaring how
its published version is read (remote thin mirror, or source-direct which is current by definition).
Adding a fifth channel later must be one array entry, never a new code path. State in a comment that
an unlisted channel is the bug this gate exists to prevent.

The ChatGPT import surface (~/.agents/skills) carries STANDALONE SKILLS, not plugins, and is out of
scope for a plugin-version gate. Note it and move on.
