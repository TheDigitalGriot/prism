---
name: elevenlabs-narration
description: Render a written script to mp3 voiceover via the ElevenLabs API. Reads a PASTE-block convention from a script.md file, calls the API, saves a master and a runtime copy.
metadata:
  tags: elevenlabs, voice, audio, narration, tts
---

## When to Use

Use this skill in Stage 03 (voice). It takes a finished script (Stage 02 output) and produces an mp3.

## What You Need Before Calling

1. A `.env` file with `ELEVEN_API_KEY` and `ELEVEN_VOICE_ID` populated locally. See `../../shared/env-template.md`.
2. Python with `elevenlabs` and `python-dotenv` installed.
3. A script file in the workspace that contains a `## ► PASTE THIS into ElevenLabs` heading followed by two `---` rules. The narration sits between those rules.

The skill never writes the API key or voice id into a committed file. Credentials stay in `.env`.

## How It Works

1. Read the script file.
2. Find the `PASTE THIS into ElevenLabs` heading. The case-insensitive match handles `► `, `▶ `, or `> ` prefixes.
3. Extract everything between the next two `---` rules. Strip any lines starting with `>` (markdown blockquote callouts to the human).
4. Load `.env` via `python-dotenv`.
5. Call `client.text_to_speech.convert(text=..., voice_id=..., model_id=..., output_format=..., voice_settings=VoiceSettings(...))`.
6. Save the returned audio to `audio/{videoN}.mp3` (master).
7. Copy that file to `remotion/public/audio/{videoN}.mp3` (runtime, so `staticFile()` finds it).

The reference implementation is in [`scripts/generate-audio.py`](scripts/generate-audio.py). Copy it into the project root and adjust the `SCRIPTS` mapping for your file layout.

## Voice Settings

This workspace is configured for:

- Voice label: `{{ELEVEN_VOICE_LABEL}}` (the real id lives in `.env`)
- Model: `{{ELEVEN_MODEL_ID}}`
- Stability: `{{ELEVEN_STABILITY}}`
- Similarity boost: `{{ELEVEN_SIMILARITY_BOOST}}`
- Speed: `{{ELEVEN_SPEED}}`
- Output: `{{ELEVEN_OUTPUT_FORMAT}}`

Override any of these by setting the matching `ELEVEN_*` variable in `.env` before the call.

## Rules

- [`rules/paste-block.md`](rules/paste-block.md) -- exact format the script must use so extraction works
- [`rules/tone-tags.md`](rules/tone-tags.md) -- `[brackets]` tags ElevenLabs honors and the ones it does not

## After the Call

Stage 03 hands off to the Whisper skill. The voice file is the timeline truth from here on.
