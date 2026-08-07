---
name: remotion-scene-anatomy
description: Conventions for building a narrated Remotion video where the audio drives the timeline. Covers timing.ts, beat-local time, gap-fill sequences, and the end-card pattern.
metadata:
  tags: remotion, video, animation, narration, react
---

## When to Use

Use this in Stage 04 after `beat-timings.md` is finalized. This skill encodes the four patterns that make narrated Remotion videos behave correctly:

1. **`timing.ts`** -- a single source of truth for beat boundaries
2. **Beat-local time** -- each scene reads `useCurrentFrame()` inside its `<Sequence>`, so its `T` constants live in beat-local seconds
3. **Gap-fill sequences** -- each scene's `durationInFrames` extends to the next beat's start, with a background `AbsoluteFill` underlay, so no black frames appear between scenes
4. **End-card pattern** -- always lockup + website url, never a tagline overlay

For deeper Remotion API reference, see the upstream `remotion-best-practices` skill in `../../../script-to-animation/skills/remotion-best-practices/`.

## Rules

- [`rules/timing-ts.md`](rules/timing-ts.md) -- the exact `timing.ts` structure
- [`rules/beat-local-time.md`](rules/beat-local-time.md) -- why scenes use beat-local `T` constants and how to re-time when audio changes
- [`rules/gap-fill-sequence.md`](rules/gap-fill-sequence.md) -- the `endFrame = next ? Math.floor(next.start*fps) : totalFrames` pattern
- [`rules/end-card-pattern.md`](rules/end-card-pattern.md) -- lockup + url, springs, no tagline

## Per-Scene Anatomy

Every scene file follows the same shape:

```
// Beat N -- short description (abs start - end seconds)
// VO callouts (local seconds): tag = local_t

import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';

const T = {
  callout1: <local seconds>,
  callout2: <local seconds>,
  // ...
};

export const BeatN: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  // reveals keyed off t and T.*
  return (/* JSX */);
};
```

When the audio is regenerated, `beat-timings.md` changes, `timing.ts` changes, and the per-scene `T` constants are re-derived from the new sub-callout values (absolute time minus the new beat start).

## Master Composition

The master composition assembles every beat with gap-fill sequencing and mounts the audio once at the top:

```tsx
<AbsoluteFill>
  <AbsoluteFill style={{background: BG_COLOR}} />
  <Audio src={staticFile('audio/video1.mp3')} />
  {beats.map((b, i) => {
    const from = Math.floor(b.start * fps);
    const next = beats[i + 1];
    const endFrame = next ? Math.floor(next.start * fps) : totalFrames;
    const durationInFrames = endFrame - from;
    return (
      <Sequence key={b.id} from={from} durationInFrames={durationInFrames} premountFor={30}>
        <SCENES[b.id] />
      </Sequence>
    );
  })}
</AbsoluteFill>
```

`premountFor={30}` keeps each scene mounted one second before its start so spring entrances are already in flight when the cut happens.

## End-Card Convention

Configured assets: lockup at `{{LOCKUP_PATH}}`, website at `{{WEBSITE_URL}}`. The final beat is silent (no VO), runs ~5 seconds, fades in the lockup, draws a green rule, then reveals the url. No tagline overlay.

## When Audio Changes

The hard rule: **audio change -> re-derive everything**. Procedure:

1. Stage 03 produces a new `transcript.json` and `beat-timings.md`.
2. Edit `timing.ts` with the new `start`/`end` values.
3. For each scene, recompute its `T` constants from the new sub-callout absolute times.
4. Re-render.

Never edit `T` constants by ear. They come from the transcript.
