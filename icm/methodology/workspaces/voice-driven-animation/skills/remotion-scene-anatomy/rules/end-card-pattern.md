# End-Card Pattern

Every video ends with the same beat: lockup + website url. No tagline overlay, no parting line, no "AI Realized" text. The lockup is the brand and the url is the call to action. That is the whole end card.

## Assets

- Lockup: `{{LOCKUP_PATH}}` (typically `public/brand/lockup.svg`)
- URL: `{{WEBSITE_URL}}`

The lockup is an SVG so it stays crisp at any resolution. If you have a PNG, upscale it once with `vectorize` or accept the slight softness; do not embed a PNG into the JSX inline.

## Structure

The end-card scene file:

```tsx
import {useCurrentFrame, useVideoConfig, spring, Img, staticFile} from 'remotion';

export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const lockupReveal = spring({frame, fps,
    config: {damping: 200},
    durationInFrames: Math.floor(0.7 * fps)});

  const ruleReveal = spring({frame: frame - Math.floor(0.8 * fps), fps,
    config: {damping: 200},
    durationInFrames: Math.floor(0.5 * fps)});

  const urlReveal = spring({frame: frame - Math.floor(1.1 * fps), fps,
    config: {damping: 200},
    durationInFrames: Math.floor(0.6 * fps)});

  return (
    <AbsoluteFill style={{
      background: BG_COLOR,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 36,
    }}>
      <Img src={staticFile('{{LOCKUP_PATH}}')}
           style={{
             height: 200, width: 'auto',
             opacity: lockupReveal,
             transform: `translateY(${(1 - lockupReveal) * 14}px)`,
           }} />
      <div style={{
        marginTop: 36,
        width: 360,
        height: 2,
        background: ACCENT_COLOR,
        opacity: ruleReveal * 0.75,
        transform: `scaleX(${ruleReveal})`,
        transformOrigin: 'center',
      }} />
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 38,
        color: ACCENT_COLOR,
        letterSpacing: 6,
        opacity: urlReveal,
        transform: `translateY(${(1 - urlReveal) * 10}px)`,
      }}>
        {{WEBSITE_URL}}
      </div>
    </AbsoluteFill>
  );
};
```

## Timing

The end-card beat runs ~5.5 seconds, silent. Lockup reveals first (0.0s), rule draws (0.8s), url appears (1.1s). The remaining ~4 seconds is a comfortable hold so the viewer reads the url. Do not cut it shorter than 4 seconds of hold; the eye needs time.

## What This Card Never Has

- A tagline ("AI Realized.", "Stay curious.", etc.)
- A "Call Us" or "Contact Us" line
- A QR code
- A social handle

Any of those is a separate beat earlier in the video, not on the lockup card.

## When to Override This Pattern

You do not. The end card is the brand. If a project needs something different, it is not this workspace; build a new scene file outside the standard pattern and accept that it will not match other videos in the series.
