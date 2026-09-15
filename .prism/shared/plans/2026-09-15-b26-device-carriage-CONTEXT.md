# Stage Contract - B26: prism-codex-plan-sync carries the actual device UIs

Status: STAGED, not fired. Contract-first per Gavin.
Author: Cowork session, 2026-09-15. Workgraph node B26 (untracked -> outbound).
Route device-side headless (claude.exe -p) as an ICM stage-walk, cwd = the Prism repo.
Keep the plan-nod interactive in chat; only research/implement/validate go headless.

## Why this stage exists

prism-codex-plan-sync is the bidirectional bridge between a codex and Prism's
plan/stories layer. It is blind to the one part of a codex Gavin cares most about:
the device. `references/forward.md` mentions "device" exactly once. `reverse.md`
never mentions it. So a codex's real UX/UI - and the gaps in it - do not become
work, and work that produces a UI never flows back into the codex device.

Two things landed 2026-09-15 that this stage must now carry:
- the codex template gained `[OPT:DEVICE-SURFACES]` ALONGSIDE the form-factor
  device (never replacing it): tokens {{SURFACES}}, {{DEVICE_DATA}}, {{DEVICE_CAP}},
  RIGMODE={mobile:'phone',cli:'term'}, accent chain
  var(--accent,var(--ember,var(--mint,#e0a458)))
- prism-codex.html shipped 5 surface toggles x 15 frames (VS Code, Desktop,
  CLI/TUI, Mobile, Foundation) across turns t1-t5.

Gavin's ruling, verbatim in intent: a Prism surface that does not exist yet
becomes a NEW TOGGLE STATE on the device in the codex - not a replaced frame,
not a silent omission.

## Inputs

WORKING (edit here, add in place):
- `C:\Users\digit\GriotApps\Prism\skills\prism-codex-plan-sync\SKILL.md` (5,773 b)
- `...\references\forward.md` (6,727 b)
- `...\references\reverse.md` (4,799 b)
- `...\references\mechanics.md` (5,793 b)

SECOND TREE - MUST land here too or the change never reaches Cowork:
- `C:\Users\digit\GriotApps\Prism\apps\prism-setup\resources\plugin\skills\prism-codex-plan-sync\`
  Currently STALE vs source: SKILL.md 5,694 / forward 6,733 / mechanics 4,862 /
  reverse 4,805 against source 5,773 / 6,727 / 5,793 / 4,799. This is the DGS
  open-question "prism-codex-plan-sync edit unreleased to Codex" (commit 78c7ebc).
  Converge, then version-bump so it actually releases.

REFERENCE (read for grounding, do NOT alter):
- `C:\Users\digit\.claude\skills\griot-app-codex\assets\codex-template.html` (38,766 b)
  - the `[OPT:DEVICE]` form-factor block AND the `[OPT:DEVICE-SURFACES]` block
- `C:\Users\digit\GriotMeta\griot-live-artifacts\live\prism-codex.html` (1.43 MB)
  - the reference implementation: 5 toggles, 15 frames, provenance lines
- `C:\Users\digit\GriotMeta\griot-live-artifacts\live\` - the other filled codexes
  (synaptiq, audion, anansi, kora, paralegalproject) and the ones still holding
  self-declaring placeholders
- `C:\Users\digit\GriotApps\Prism\skills\griot-agent-architect\` - the standard + validators

DO NOT EDIT: the eval snapshots under `.prism\shared\evals\v*-snapshot\skills\`.

## Locked Decisions

- ADD IN PLACE. Never strip or restructure the three reference files or SKILL.md.
- The device block is read in BOTH directions. Forward: extract it. Reverse: write
  back to it.
- A placeholder surface is NOT an open decision. It is a known gap. It routes to a
  task or to `## What We're NOT Doing` - it never passes silently through the
  No-Placeholders gate as if resolved.
- CHECK THE DESTINATION, don't count the harvest. Per surface, determine whether
  the codex holds a real export or a self-declaring placeholder. This is the
  N16/B27 correction: the "empty" slots were never empty, and seven codexes
  already held real exports.
- A surface that did not exist before becomes a NEW TOGGLE STATE. Additive. Never
  overwrite an existing frame to make room.
- The form-factor device is never replaced by the surfaces device. They coexist.
- Prefix discipline is real and must be documented: filled codexes use
  `<img class="tsd-shot">` inside `.tsd-screen` with object-fit:cover /
  object-position:top center; Prism uses bare `.placeholder` / `.screen` / `.rig`
  with no tsd- prefix. Accent falls back --accent -> --ember -> --mint -> literal
  (Prism has --mint, not --ember; without the chain the active chip is invisible).
- Any injection into a codex is gated on three refuse-to-write assertions:
  lead/element count unchanged, final size == predicted (+/-4 bytes), unique id
  present exactly once. Never search a generated doc for a token you just wrote
  into it. (N29.)
- Plugin work routes through griot-agent-architect (cl-plugin-structure is now a
  deprecation alias pointing at it). RUN its bundled validators; never hand-eyeball.
- DO NOT COMMIT. Leave everything uncommitted for Gavin's review.
- Daemon is NOT a prerequisite. In-process agents only.

## Process (numbered, ICM stage-walk)

1. LOAD CONTEXT - drive prism-locator over `.prism` for prior codex/plan-sync
   research, and codebase-locator over the two skill trees. Confirm the exact
   drift between source and the prism-setup mirror, file by file.
   HEARTBEAT: STEP1_CONTEXT
2. GROUND THE DEVICE - read the template's `[OPT:DEVICE]` + `[OPT:DEVICE-SURFACES]`
   blocks and prism-codex.html's implemented device. Extract the exact contract:
   token names, toggle markup, frame markup, provenance line, RIGMODE, accent
   chain, prefix split. Save to
   `.prism/shared/research/2026-09-15-codex-device-contract.md`.
   HEARTBEAT: STEP2_GROUND
3. FORWARD - amend `references/forward.md` IN PLACE:
   - Step 1 "Read the codex" gains a device-block extraction: surfaces, frames per
     surface, and per surface real-export vs self-declaring-placeholder.
   - Step 2 Gavel gains the placeholder-is-a-gap-not-a-decision rule.
   - Step 4 gains surface-scoped stories: `context.surface`, plus graphTargets
     seeded from the frame's provenance line.
   HEARTBEAT: STEP3_FORWARD
4. REVERSE - amend `references/reverse.md` IN PLACE: when a build lands a UI, the
   normalized discovery record carries re-render-the-frame + re-push-the-artifact.
   A surface that did not exist becomes a NEW TOGGLE STATE, additively.
   HEARTBEAT: STEP4_REVERSE
5. MECHANICS - amend `references/mechanics.md` IN PLACE with the prefix split, the
   accent fallback chain, and the refuse-to-write triad as mandatory for any codex
   injection. Update SKILL.md's two direction summaries to name the device seam.
   HEARTBEAT: STEP5_MECHANICS
6. CONVERGE + VALIDATE - bring the prism-setup mirror to match source, version-bump.
   Run the griot-agent-architect validators (parse-frontmatter and the plugin
   validator) on the skill dir. Confirm the eval snapshots are untouched (git diff).
   HEARTBEAT: STEP6_VALIDATE
7. REPORT - diffs per file, mirror convergence proof, validator output, and the
   device-contract research location. Leave UNCOMMITTED.
   HEARTBEAT: DONE_B26_DEVICE_CARRIAGE_STAGED

## Success criteria

- forward.md, reverse.md, mechanics.md and SKILL.md each carry the device seam,
  ADDITIVELY - every pre-existing section still present (prove by diff, not claim).
- The real-export vs placeholder distinction is a named step, not an aside.
- "New surface -> new toggle state, never a replaced frame" is written explicitly.
- The prism-setup mirror matches source byte-for-byte on all four files, and the
  version is bumped so it releases.
- griot-agent-architect validators pass.
- Eval snapshots byte-identical (git diff empty) - proven.
- Nothing committed.

## Heartbeat tokens

Write to `C:\Users\digit\GriotApps\Prism\.prism\local\b26-progress.txt`:
STEP1_CONTEXT - STEP2_GROUND - STEP3_FORWARD - STEP4_REVERSE - STEP5_MECHANICS - STEP6_VALIDATE - DONE_B26_DEVICE_CARRIAGE_STAGED