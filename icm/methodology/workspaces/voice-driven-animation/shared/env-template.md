# Environment Template

The pipeline reads secrets from a local `.env` file. **Never commit `.env`.** This file shows what variables to populate locally.

## Required `.env` Contents

Create a file named `.env` in the project root (next to `package.json` or whichever directory hosts the Python scripts) with these keys:

```
# ElevenLabs (required for Stage 03 voice generation)
ELEVEN_API_KEY=
ELEVEN_VOICE_ID=

# ElevenLabs voice settings (optional -- defaults shown)
ELEVEN_MODEL_ID=eleven_v3
ELEVEN_STABILITY=0.5
ELEVEN_SIMILARITY_BOOST=0.75
ELEVEN_SPEED=1.0
ELEVEN_OUTPUT_FORMAT=mp3_44100_128
```

## How to Get the Values

- `ELEVEN_API_KEY` -- ElevenLabs dashboard, Profile menu, "API Keys". Generate a new key for this project only.
- `ELEVEN_VOICE_ID` -- ElevenLabs dashboard, "Voices", click your voice, copy the id from the URL or the voice settings panel.

## `.gitignore`

Confirm `.env` is in `.gitignore` before doing anything else:

```
.env
.env.local
.env.*.local
```

## What the Stages Expect

| Stage | Reads From `.env` | Notes |
|-------|-------------------|-------|
| 03-voice | `ELEVEN_API_KEY`, `ELEVEN_VOICE_ID`, plus the optional voice-settings vars | The Python script in `skills/elevenlabs-narration/scripts/generate-audio.py` loads these via `python-dotenv`. |
| All others | Nothing | Stages 01, 02, 04, 05 do not call any paid service. |

## What Never Goes Into `.env`

Per-video creative content (script text, beat timings, scene code). Those live in stage outputs and are committed normally. `.env` is for credentials only.
