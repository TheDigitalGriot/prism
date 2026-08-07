# Audio Pipeline Walkthrough

The end-to-end process for Stage 03, plus the failure modes we have hit and how to recover from each.

## Prereqs

```bash
pip install elevenlabs python-dotenv openai-whisper
```

For `openai-whisper` you also need `ffmpeg` on the PATH:
- Windows: `winget install ffmpeg` or download from gyan.dev
- macOS: `brew install ffmpeg`
- Linux: `apt install ffmpeg`

## `.env` Check

Confirm `.env` is in `.gitignore`. Confirm it has values for `ELEVEN_API_KEY` and `ELEVEN_VOICE_ID`. Do **not** print these to the terminal during normal operation.

## Step 1 -- Dry-run the PASTE extraction

```bash
python generate-audio.py video1 --dry-run
```

Read the output. It should be exactly the narration you want spoken. If you see beat markers, change-note headers, or stray blockquote lines (`>`), the script's PASTE block is misformatted. Fix the script and re-run.

## Step 2 -- Generate audio

```bash
python generate-audio.py video1
```

This writes `audio/video1.mp3` (master) and copies to `remotion/public/audio/video1.mp3` (runtime).

Typical cost: ~$0.05 to $0.20 per minute of output depending on plan tier. Generate from the cleanest dry-run text you can, since regeneration costs credits.

If ElevenLabs returns an error, the most likely causes:
- `401 Unauthorized` -- `ELEVEN_API_KEY` is missing or wrong
- `404 voice not found` -- `ELEVEN_VOICE_ID` is wrong
- `429 rate limited` -- wait and retry; this rarely happens on the standard plans for a single video
- Empty body returned -- the PASTE text was empty or all whitespace

## Step 3 -- Transcribe

Default CPU run:

```bash
python transcribe.py audio/video1.mp3 transcripts/video1.json
```

Takes about as long as the audio itself on a modern laptop. The first run downloads the model (~2.5 GB for `medium.en`); subsequent runs use the cached model.

For GPU (optional, faster):

```bash
python transcribe.py audio/video1.mp3 transcripts/video1.json \
  --model large-v3 --device cuda
```

If the GPU run crashes (segfault, illegal memory, hang), fall back to CPU `medium.en`. See `../../skills/whisper-beat-finder/rules/cpu-fallback.md`.

## Step 4 -- Extract beat timings

Edit `find-beats.py` so the `BEATS` list matches the beat markers in your script. Each entry's `phrase` is the first 3-5 words of that beat's narration.

```bash
python find-beats.py transcripts/video1.json > stages/03-voice/output/beat-timings.md
```

Open the resulting markdown. If any row says `NOT FOUND`, edit the phrase for that beat and re-run. Common fixes:
- Whisper transcribed a slightly different opening; shorten the phrase to the first 2-3 unique words
- Two beats share the same opening; use a more distinctive phrase from the same beat

## Step 5 -- Sanity check

Open `beat-timings.md`. Confirm:
- Beat 1 starts at or very near 0.0
- Each beat's start is strictly after the previous one
- The last beat's `end` matches the audio duration (Whisper's last word `end` time), or the silent end-card start, depending on your structure

If anything looks wrong, the rest of the pipeline will inherit the error. Fix it here.

## When the Script Changes

Any edit to the PASTE block requires re-running Steps 2-4. Stage 04 then re-derives its `T` constants. There is no shortcut: audio = timeline.
