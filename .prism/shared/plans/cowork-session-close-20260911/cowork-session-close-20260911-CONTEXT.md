# Stage contract - cowork session close, 2026-09-11

Inbound (awaits): .prism/shared/handoffs, live/_drift/drift-entries.json

Gavin is leaving this Cowork session to work in Claude Code. Nothing may be left owed or implied.
He has had a bad week largely caused by work that fake-landed. Verify everything; assume nothing.

## ENCODING - non-negotiable

PowerShell 5.1 Get-Content -Raw reads UTF-8 as ANSI and Set-Content -Encoding UTF8 writes it back
double-encoded. That corrupted djeli-codex.html today and the damage was committed before it was
caught. Use the Edit tool, or .NET ReadAllText/WriteAllText with UTF8Encoding($false). After every
write verify zero mojibake markers and an unchanged multibyte count. Never commit unverified.

## 1. DRIFT LOG - five entries, via the griot-drift-log engine, never by hand-editing the HTML

node C:\Users\digit\.claude\skills\griot-drift-log\scripts\append-drift.mjs
  --json C:\Users\digit\GriotMeta\griot-live-artifacts\live\_drift\drift-entries.json
  --out  C:\Users\digit\GriotMeta\griot-live-artifacts\live\suite-drift-codex.html

Log these, grounded, plainly, no dramatising. Status in brackets:

(a) [recurring] home: PowerShell file edits.
    PowerShell 5.1 Get-Content -Raw plus Set-Content -Encoding UTF8 double-encodes UTF-8. Five clean
    characters in djeli-codex.html became six mojibake sequences and it was committed and pushed
    (5aba992) before anyone noticed. Repaired in 7db069c by rebuilding from the pre-edit copy.
    Fix: .NET ReadAllText/WriteAllText with UTF8Encoding(false), or the Edit tool. Verify the
    mojibake count is zero and the multibyte count is unchanged after EVERY write, before committing.

(b) [recurring] home: the progress list.
    A task was marked completed while it had shipped the wrong thing - the Genspark view went out as
    text cards when Gavin had asked for a graph mode. He had to catch it. Gavin calls this a FAKE
    LAND and names it the single most expensive failure mode in the working relationship.
    Fix: nothing is marked complete until Gavin has seen it working. Otherwise it reads
    "landed, unverified" and stays open.

(c) [recurring] home: research depth.
    110 Genspark tools were mapped from their NAMES off a single index page. Reading the 55 actual
    tool pages overturned three of nine layer verdicts: Collaboration was called ahead when GenTeam
    has no agent-to-agent handoff at all; Memory was called nothing when a real managed PostgreSQL
    sits under Database/CRM/Form Builder; Deployment was called nothing when AI Website Builder
    ships to Cloudflare Pages with downloadable code and no export fee.
    Fix: an index page is not a source. Open the actual pages or files. This is the same class as
    the standing never-skim-and-discard line.

(d) [recurring] home: multi-step chains.
    The head of a chain eats the session and the tail never runs. Steps 4 to 7 of today's sync chain
    sat pending for hours while the first three consumed everything. Gavin names this directly as
    how his week gets eaten.
    Fix: protect the tail. Run the steps that habitually evaporate first, or state plainly at the
    start which ones will not land today.

(e) [flagged] home: unasked ceremonies.
    The design skill was fired headless without being asked. Gavin had intended it as a ceremony.
    Fix: never run a skill, harvest or ceremony that was not asked for, and never run headless
    something he has called a ceremony.

## 2. PRISM HANDOFF

Create a handoff at .prism/shared/handoffs/ following this repo existing handoff convention.
It must carry, honestly:
- what landed today with commit SHAs, and what is still owed
- the Djeli/Prism lineage settlement (BOTH fork Orca; Djeli is the container with GenOffice folded
  in as the office surface; Djeli expands into several Genspark-matching stacks)
- the corrected Genspark coverage per layer, including that three verdicts were wrong first time
- that griot-harvest-ux-ui is BUILT and the harvest is about to be run by Gavin in Claude Code from
  the Prism repo, emitting .prism/shared/workgraph/uxui-canvas-nodes.json, and that composing the
  canvas is deliberately NOT started - it is a decision he wants to be present for
- the six artifact cards and their state
- the deja recall layer: 317 sessions / 32,860 messages across claude, codex, cursor, gemini

## 3. CHANGELOG

Check whether today's Prism-side work warrants a CHANGELOG entry (griot-harvest-ux-ui, the
marketplace mirror-freshness gate, the workgraph write side). If the repo convention is to add
under an Unreleased heading, add it. If entries are only written at release, say so and add nothing.
Do not invent a version number.

## 4. SYNC VERIFICATION - every repo, ref equality, not stderr text

For EACH of: GriotApps\Prism, GriotMeta\griot-live-artifacts, GriotMeta\digital-griot-skills,
GriotMeta\digital-griot-marketplace, GriotMeta\griot-ontology
report: branch, local HEAD, origin HEAD, whether they are equal, and any uncommitted changes.
griot-ontology has NO github origin, only a D:\GriotBackups remote - that is expected, not a fault.
Commit anything uncommitted that belongs to today work. Never force.

Also verify the LOCAL deploys: ~/.claude/skills/sankofa/SKILL.md and
~/.claude/skills/griot-suite-context/SKILL.md must be byte-identical (sha256) to the
digital-griot-skills repo source. Report the hashes.

## Heartbeat tokens

STEP 1 drift - STEP 2 handoff - STEP 3 changelog - STEP 4 sync - DONE