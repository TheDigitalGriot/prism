---
name: whisper-beat-finder
description: Transcribe an mp3 with Whisper and convert the word-timestamped transcript into beat boundaries by matching key phrases from the script.
metadata:
  tags: whisper, transcription, audio, beat-timing, animation
---

## When to Use

Use this skill in Stage 03, immediately after `elevenlabs-narration` produces an mp3. It outputs two things:

1. `transcript.json` -- Whisper's full output with word-level timestamps
2. `beat-timings.md` -- absolute timestamps for each beat boundary and key sub-callout

Stage 04 reads `beat-timings.md` to populate `timing.ts` and re-time per-scene `T` constants.

## What You Need

- Python with `openai-whisper` installed
- The mp3 produced by Stage 03 (Whisper takes the file path)
- A list of phrases to find (these come from the script, one per beat boundary)

No GPU is required. The default configuration runs `medium.en` on CPU, which finishes ~1 minute per minute of audio on a modern laptop and is reliable across drivers.

## CPU vs GPU

**Configured model:** `{{WHISPER_MODEL}}`

We default to `medium.en` on CPU because `large-v3` on GPU has been observed to segfault on some CUDA driver combinations (RTX 5080 + driver 591.86 was one). `medium.en` is accurate enough for beat extraction and never crashes. See [`rules/cpu-fallback.md`](rules/cpu-fallback.md).

If you have a stable GPU setup and need faster turnaround, switch to `large-v3` with `device="cuda"`. If anything segfaults, fall back to `medium.en` on CPU.

## How It Works

1. Load the model: `whisper.load_model("medium.en", device="cpu")`
2. Transcribe with `word_timestamps=True`, `language="en"`, `fp16=False`
3. Save the full result to `transcript.json`
4. For each beat in the script, search the word stream for that beat's opening phrase (case-insensitive substring match across N consecutive words). Record the absolute start time.
5. Optionally search for sub-callout phrases (mid-beat moments worth animating against) and record their times too.
6. Write `beat-timings.md` with the structured table.

See [`rules/phrase-matching.md`](rules/phrase-matching.md) for the matching contract.

## Scripts

- [`scripts/transcribe.py`](scripts/transcribe.py) -- transcribe an mp3, save `transcript.json`
- [`scripts/find-beats.py`](scripts/find-beats.py) -- given `transcript.json` and a list of beat phrases, emit `beat-timings.md`

Copy both into the project root and edit the audio path / beat list at the top.

## Output Format

`beat-timings.md` contains a markdown table that Stage 04 reads directly:

```
| Beat | Name | Start (abs) | End (abs) | Sub-callouts |
|------|------|-------------|-----------|--------------|
| 1 | Open on the topic | 0.00 | 21.02 | nine years @ 9.16, keeps emailing @ 13.04 |
| 2 | The backlog | 21.02 | 46.04 | directors by hand @ 31.10, quitting @ 36.86 |
```

The last beat's end is the total audio length (from `transcript.json`'s last word `end`). Plus a small tail if there is an end card.
