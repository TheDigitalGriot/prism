# Pipeline Overview

The five stages, what each consumes and produces, and where the truth lives at each step.

```
[01-research] -> [02-script] -> [03-voice] -> [04-animate] -> [05-render]
   brief         script.md        audio.mp3      Video1.tsx     out/videoN.mp4
                                  transcript     timing.ts
                                  beat-timings
```

## Source of Truth at Each Stage

| Stage | Source of Truth | Why |
|-------|-----------------|-----|
| 01-research | Verified external sources cited in the brief | The brief is a plan, not a citation |
| 02-script | The script in `stages/02-script/output/` | Voice generation reads only this |
| 03-voice | The rendered `audio.mp3` | If the audio differs from the script, the audio wins. The transcript reflects what was actually said. |
| 04-animate | The transcript-derived `beat-timings.md` | Timing is locked to the audio, not the script |
| 05-render | The Remotion `Video1` composition output | The mp4 is the deliverable |

## Why Audio Wins Over Script

ElevenLabs occasionally elides a word, changes a contraction, or paces a sentence faster than expected. The transcript captures what the recording actually says. Animation beats lock to the transcript so cues land on the spoken word.

If the audio is regenerated, the entire downstream timeline is recomputed from the new transcript. Stage 03 produces a fresh `beat-timings.md`. Stage 04 reads that file. Scene `T` constants come from it.

## Per-Run Inputs

A user starts a run by providing a topic (or, for a series, a topic per video). Everything else is configured once via `setup/questionnaire.md`.
