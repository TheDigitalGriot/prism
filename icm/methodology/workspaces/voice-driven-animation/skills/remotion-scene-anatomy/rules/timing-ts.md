# timing.ts Structure

`timing.ts` is the single source of truth for beat boundaries inside the Remotion project. Every scene reads from it. Every change to audio re-derives it from `beat-timings.md`.

## Required Shape

```ts
import {canvas} from './brand';

export type Beat = {
  id: number;
  name: string;
  start: number; // seconds, absolute
  end: number;   // seconds, absolute
  callouts?: {at: number; note: string}[]; // absolute seconds
};

export const beats: Beat[] = [
  {
    id: 1,
    name: 'Open on the topic',
    start: 0.0,
    end: 21.02,
    callouts: [
      {at: 9.16, note: 'nine years'},
      {at: 13.04, note: 'keeps emailing'},
    ],
  },
  // ...
  {
    id: 8,
    name: 'End card (silent)',
    start: 190.46,
    end: 195.96,
    callouts: [{at: 190.46, note: 'website url reveal'}],
  },
];

export const totalSeconds = 195.96;
export const totalFrames = Math.ceil(totalSeconds * canvas.fps);
```

## Conventions

- `start` and `end` are seconds, not frames. Convert to frames at composition time with `Math.floor(start * fps)`. This keeps the file readable.
- `callouts` are optional, but useful: they document what each sub-cue is so future you knows what scene timing was driving.
- `totalSeconds` is the audio length plus the end-card tail (typically +5.5s for a silent lockup hold).
- `totalFrames` uses `Math.ceil` to avoid truncating the last frame.

## When Audio Changes

Open `stages/03-voice/output/beat-timings.md` and copy values into the `beats` array. Match by beat name. Do not paste new values into the wrong rows. After updating, every scene's `T` constants need re-derivation -- see [`beat-local-time.md`](beat-local-time.md).

## Adding a Beat

If a new beat is inserted, every following beat's id shifts. Update the master composition's `SCENES` map at the same time, or you will silently swap which scene plays where.

## End-Card Beat

The last beat is always the silent end card. `start` equals the audio length (Whisper's last word `end` time). `end` is `start + 5.5` for a comfortable hold. The end-card scene file uses neither the audio (it is silent) nor any beat-local sub-callouts.
