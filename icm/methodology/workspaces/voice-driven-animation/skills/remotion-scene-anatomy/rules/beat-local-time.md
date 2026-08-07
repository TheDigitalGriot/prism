# Beat-Local Time

Each scene reads `useCurrentFrame()` inside its `<Sequence>`. Remotion returns a frame counted from the sequence start, not the composition start. So `t = frame / fps` is **beat-local** seconds. All `T` constants in a scene file are beat-local.

## Why This Matters

If you wrote `T.callout1 = 9.16` thinking it was the absolute time, the callout would fire 9.16 seconds into the beat, which is 9.16 seconds after the beat's `start`, which is at absolute time `start + 9.16`. That is rarely what you wanted.

Deriving `T` correctly:

```
T.callout = (absolute time of sub-callout) - (beat.start)
```

The transcript gives absolute times. The beat starts at `beat.start`. Subtract.

## Example

Beat 5 runs from absolute 101.86 to 136.12. Sub-callout "at machine speed" is at absolute 113.94. Beat-local:

```
T.machineSpeed = 113.94 - 101.86 = 12.08
```

In the scene file:

```ts
const T = {
  machineSpeed: 12.08,
  // ...
};
```

The scene reveals fire when `t >= T.machineSpeed`.

## When Audio Changes

The transcript regenerates with new word timestamps. The beat may now start at 102.45 and "at machine speed" may now land at 114.20. New beat-local:

```
T.machineSpeed = 114.20 - 102.45 = 11.75
```

Update the scene file. Never adjust by feel.

## Header Comment

Every scene file documents both timings in the top comment so the conversion is explicit:

```
// Beat 5 -- AI inherits everything (abs 101.86 to 136.12s)
// Sub-callouts (beat-local):
//   machineSpeed 12.08, ifRules 14.28, truthSerum 27.66, faster 32.12
```

## Reveal Pattern

Use a `<Reveal at={T.callout}>` wrapper for spring-based slide-and-fade reveals, or compute opacity from `interpolate(t, [T.x - 0.1, T.x + 0.3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})` for inline reveals.

Either way, the `T` value is beat-local seconds.
