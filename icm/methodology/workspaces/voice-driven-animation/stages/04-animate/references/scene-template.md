# Scene Template

Every per-beat scene file follows this shape. The header comment documents both absolute and beat-local timings so a future editor (you in three months) can re-derive everything from `beat-timings.md`.

## Skeleton

```tsx
// Beat N -- {short label} (abs {start}s to {end}s)
// VO sub-callouts (beat-local seconds):
//   {tag1} {value1}, {tag2} {value2}, ...
//
// Source: stages/03-voice/output/beat-timings.md
// If you change these, derive them from a fresh transcript.

import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';

// Beat-local seconds. Computed as (absolute callout time) - (beat start).
const T = {
  tag1: 0.20,
  tag2: 6.50,
  // ...
};

export const BeatN: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  // Example: a reveal that springs in at T.tag2
  // (Use your project's <Reveal /> primitive or interpolate inline.)

  return (
    <AbsoluteFill style={{background: '{{BACKGROUND_COLOR}}'}}>
      {/* Beat-specific content here */}
    </AbsoluteFill>
  );
};
```

## Naming

- Files: `BeatN.tsx`, exporting `export const BeatN`
- For a multi-video project, namespace by video: `scenes/video1/BeatN.tsx`
- Composition ids in `Root.tsx` use hyphens, never underscores (Remotion rejects underscores in composition ids)

## Background Color

Configured background: `{{BACKGROUND_COLOR}}`. The master composition lays this color via an `<AbsoluteFill>` so no scene needs to repaint the background, but it does not hurt for scenes to also set it -- belts and suspenders.

## Branding

Configured accents:
- Primary: `{{PRIMARY_COLOR}}`
- Accent: `{{ACCENT_COLOR}}`
- Text: `{{TEXT_COLOR}}`

Fonts:
- Heading: `{{HEADING_FONT}}`
- Body: `{{BODY_FONT}}`

Load fonts via `@remotion/google-fonts` at app boot or hand-link in the composition. Local fonts use the standard `@font-face` block in a top-level CSS file.

## End-Card Beat

The final beat is the end card. Use the template in `../../skills/remotion-scene-anatomy/rules/end-card-pattern.md`. It is silent, ~5.5s long, no sub-callouts, no audio interaction.

## When `T` Constants Are Wrong

If a reveal lands off-cue in the studio preview, do not nudge the `T` value by feel. Open `beat-timings.md`, find the sub-callout's absolute time, subtract `beat.start`, and replace `T`. That keeps the scene file and the transcript in lockstep.
