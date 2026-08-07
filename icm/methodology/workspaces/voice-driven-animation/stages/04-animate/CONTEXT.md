# Stage 04: Animate

Take `beat-timings.md` from Stage 03 and build the Remotion scenes. Each beat is one scene file with beat-local `T` constants derived from sub-callouts. The master composition assembles them with gap-fill sequencing.

## Inputs

| Source | File/Location | Section/Scope | Why |
|--------|--------------|---------------|-----|
| Stage 03 | `../03-voice/output/beat-timings.md` | Full table | Beat boundaries and sub-callout absolute times |
| Stage 03 | `../03-voice/output/audio.mp3` | Path only | The audio mounts on the master composition |
| Reference | `references/scene-template.md` | Full file | The shape every scene file follows |
| Skill | `../../skills/remotion-scene-anatomy/SKILL.md` | Full file | Pattern overview |
| Skill | `../../skills/remotion-scene-anatomy/rules/timing-ts.md` | Full file | `timing.ts` structure |
| Skill | `../../skills/remotion-scene-anatomy/rules/beat-local-time.md` | Full file | How to convert absolute timings to beat-local `T` |
| Skill | `../../skills/remotion-scene-anatomy/rules/gap-fill-sequence.md` | Full file | The `<Sequence>` pattern |
| Skill | `../../skills/remotion-scene-anatomy/rules/end-card-pattern.md` | Full file | End-card scene |
| External | `../../../script-to-animation/skills/remotion-best-practices/SKILL.md` | When deeper Remotion API help is needed | Reuse the upstream skill rather than re-bundling |

## Process

1. Build `timing.ts` from `beat-timings.md`. Each beat's `start`, `end`, and `callouts[]` come from the table.
2. For each beat, create `scenes/BeatN.tsx` from the scene template. Compute local `T` constants: `T.callout = absolute_callout_time - beat.start`.
3. Build the master composition `Video1.tsx`. Mount audio once. Map each beat through `<Sequence from={Math.floor(b.start*fps)} durationInFrames={endFrame-from}>`. End frame = next beat's start, or `totalFrames` for the last beat.
4. Lay a background `AbsoluteFill` at the top of the master composition so no black frames can leak between sequences.
5. Build the end-card scene per `rules/end-card-pattern.md`. Silent, ~5s, lockup + url + green rule.
6. Register the composition in `Root.tsx`. For series projects, register one composition per video.
7. Run `npm run dev` (Remotion Studio) and preview each beat. Adjust `T` constants if a reveal lands off-cue. Never adjust by ear; pull the corrected absolute time from the transcript and recompute.
8. Save scenes under `output/scenes/` (or write directly into the live Remotion project's `src/scenes/` and treat that as the canonical location).

## Checkpoints

| After Step | Agent Presents | Human Decides |
|------------|---------------|---------------|
| 1 | `timing.ts` for review against `beat-timings.md` | Approve or fix discrepancies |
| 6 | Studio preview of the full composition | Approve, request scene-level adjustments, or send a beat back to Stage 02 if VO needs a rewrite |

## Audit

| Check | Pass Condition |
|-------|---------------|
| Beat count | `beats` array length matches the number of scene files registered |
| Local `T` derivation | Every `T` constant was computed `absolute - beat.start`; no values guessed |
| Gap-fill | Each sequence's `durationInFrames` extends to the next beat's start |
| Background underlay | Master composition has an `<AbsoluteFill style={{background: BG}} />` underneath everything |
| End card | Final beat is the lockup + url scene per `end-card-pattern.md` |
| Studio preview | All beats play, no black frames, reveals land on-cue |

## Outputs

| Artifact | Location | Format |
|----------|----------|--------|
| Scenes + master composition | `output/scenes/` and `output/Video1.tsx` (or the live Remotion project equivalent) | TSX |
| Updated timing | `output/timing.ts` | TS |

Stage 05 reads the composition by name from `Root.tsx`. No file handoff required beyond a passing studio preview.
