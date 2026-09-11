# Stage contract - griot-sync-chain

Inbound (awaits): dgs-definitive-plan.html, griot-ontology-codex.html

## Run these IN THIS ORDER. The order is dependency-driven, not preference.

1. dgs-plan-update
2. prism-codex-plan-sync
3. workgraph regenerate + distil
4. griot-meridian-reflect
5. backflow into griot-suite-context and the ontology

3 must follow 1 and 2 because the generator reads the plan EDGES.
4 must follow 3 because the reflection renders off the generated index.
5 is last because it encodes what the first four established.

## ENCODING - non-negotiable, a real file was corrupted today

PowerShell 5.1 Get-Content -Raw reads UTF-8 as ANSI and Set-Content -Encoding UTF8 writes it back
double-encoded. On 2026-09-11 that turned five clean characters in djeli-codex.html into six
mojibake sequences and the damage was committed before it was caught.

For ANY file containing non-ASCII characters use .NET directly:
  [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8)
  [System.IO.File]::WriteAllText($p, $c, (New-Object System.Text.UTF8Encoding($false)))
After every write, verify: count matches of the mojibake markers and confirm ZERO, and confirm the
count of clean multibyte characters is unchanged. Never commit a file you have not verified this way.

## What each step must carry

STEP 1 dgs-plan-update - register: the new skill griot-harvest-ux-ui (Prism, committed c52f8a3,
layer-role aware, emits xyflow canvas nodes, gated by emit-canvas-nodes.mjs); the vs Genspark
toggle now live in the ontology codex (dd0c7b3); the Djeli lineage settlement (Djeli AND Prism are
both Orca forks, Djeli is the container with GenOffice folded in as the office surface, Djeli
expands into several stacks matching Genspark); the marketplace mirror-freshness gate (Prism
3dad2db) and that digital-griot-marketplace is the channel Cowork actually reads.

STEP 5 backflow - these are STALE and are the reason a session opened today with wrong orientation:
  griot-suite-context  says Djeli is a fork of stablyai/orca with Prism as the agent brain. Correct
                       it: BOTH Prism and Djeli fork Orca; Djeli is the container, GenOffice is its
                       office surface, and Djeli expands into several Genspark-matching stacks.
  griot-suite-context  says Prism is "Now v4.11.0". It is 4.16.2.
  griot-suite-context  says "Model Control Plane". That name is retired. It is Arkestra.
  sankofa              Phase 3 RECALL lists four lanes and omits deja entirely. deja.exe is on PATH
                       indexing 234 sessions and 23,716 messages across claude, codex, cursor and
                       gemini. Add it as a lane and say plainly that it is the strongest one.
griot-suite-context and sankofa are STANDALONE SKILLS: author in digital-griot-skills, commit, then
redeploy to ~/.claude/skills. They have NO plugin cache - marketplace steps on them are a defined
error. The ontology is griot-ontology/claude/CLAUDE.md plus propagate.ps1, which now carries a Codex
target emitting ~/.codex/AGENTS.md.

## Artifact cards

You cannot publish cards from headless. Do the git half and say plainly which cards are owed a
re-push. Three are already owed: Suite Drift Codex, Djeli Codex, Griot Ontology Codex.

## Heartbeat tokens

STEP 1 plan - STEP 2 codex-sync - STEP 3 workgraph - STEP 4 reflect - STEP 5 backflow - DONE