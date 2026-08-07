# Gap-Fill Sequence

If a scene's `durationInFrames` is set to its own `(end - start)`, and the next scene's `start` is even slightly later than the previous scene's `end`, a black frame appears between them. The fix is to extend each sequence to the next beat's start (gap-fill) and lay a solid background underneath the whole composition.

## The Pattern

```tsx
<AbsoluteFill>
  {/* Background underlay -- prevents black flashes */}
  <AbsoluteFill style={{background: BG_COLOR}} />

  <Audio src={staticFile('audio/video1.mp3')} />

  {beats.map((b, i) => {
    const from = Math.floor(b.start * fps);
    const next = beats[i + 1];
    // Stretch this sequence until the next beat starts; the last beat
    // runs to totalFrames.
    const endFrame = next ? Math.floor(next.start * fps) : totalFrames;
    const durationInFrames = endFrame - from;
    const Scene = SCENES[b.id];
    return (
      <Sequence
        key={b.id}
        from={from}
        durationInFrames={durationInFrames}
        premountFor={30}
      >
        <Scene />
      </Sequence>
    );
  })}
</AbsoluteFill>
```

## Why This Works

A scene's content typically finishes its animation timeline well before the beat's natural end. After that, its visible elements hold on screen until the next sequence cuts in. With gap-fill, the cut happens **exactly** when the next sequence starts. No black frame can fit between them.

The background `AbsoluteFill` is belt-and-suspenders. Even if a sub-frame gap snuck through, the underlay would render the brand background instead of black.

## `premountFor`

`premountFor={30}` mounts the upcoming scene 30 frames (1 second at 30fps) before its `from`. Spring entrances start computing early, so when the cut lands, the entrance is already in flight rather than spawning a stiff snap.

## Audio Mount

The audio mounts once on the composition root, not per-sequence. Each sequence's frame counter is sequence-local; the audio's playhead is composition-global. They stay in sync because both clocks tick at `fps`.

## Series Projects

For a multi-video project, every video has its own master composition file (`Video1.tsx`, `Video2.tsx`, etc.) with its own `<Audio src={...} />`. Register them as separate compositions in `Root.tsx`.
