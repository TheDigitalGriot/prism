# Stage 03: Voice

Take the finished script, generate the voiceover via ElevenLabs, transcribe it with Whisper, and produce beat-timings.md. From this stage on, the audio is the timeline truth.

## Inputs

| Source | File/Location | Section/Scope | Why |
|--------|--------------|---------------|-----|
| Stage 02 | `../02-script/output/[topic-slug]-script.md` | Full file | The PASTE block + beat markers |
| Reference | `references/audio-pipeline.md` | Full file | Step-by-step pipeline including failure modes |
| Skill | `../../skills/elevenlabs-narration/SKILL.md` | Full file | How to call ElevenLabs |
| Skill | `../../skills/whisper-beat-finder/SKILL.md` | Full file | How to transcribe and phrase-match |
| Shared | `../../shared/env-template.md` | Full file | Confirm `.env` has `ELEVEN_API_KEY` and `ELEVEN_VOICE_ID` populated locally |

## Process

1. Confirm `.env` exists and is in `.gitignore`. If not, stop and ask the human to populate it. Never commit credentials.
2. Run the ElevenLabs generator in dry-run first to verify the PASTE block extracts cleanly: `python generate-audio.py {topic-slug} --dry-run`. Read the output. If the wrong text comes out, fix the script's PASTE block placement before spending API credits.
3. Run the generator for real. Save the mp3 to `output/audio.mp3` and also copy it to wherever the Remotion runtime reads from (`remotion/public/audio/videoN.mp3`).
4. Transcribe the mp3: `python transcribe.py output/audio.mp3 output/transcript.json`. Default model is `medium.en` on CPU (about 1 min audio per 1 min wall-clock).
5. Extract beats: `python find-beats.py output/transcript.json > output/beat-timings.md`. The script's BEATS list must mirror the beat markers in the script.md file.
6. Sanity-check `beat-timings.md`. If any beat phrase says NOT FOUND, fix the BEATS list and re-run.
7. If the human asks for an audio regen later (script edits), repeat all six steps. Every downstream timing comes from the new transcript.

## Checkpoints

| After Step | Agent Presents | Human Decides |
|------------|---------------|---------------|
| 2 | Extracted PASTE text (dry-run output) | Approve or fix the script before spending API credits |
| 6 | Final `beat-timings.md` table | Approve, or request a phrase change and re-run |

## Audit

| Check | Pass Condition |
|-------|---------------|
| Credentials | `.env` exists locally; no real key in any committed file |
| Dry-run match | The dry-run output matches what the human expects to hear |
| Transcript completeness | `transcript.json` covers the full audio (last word `end` matches the file duration within 1s) |
| All beats found | Every beat in BEATS resolves to a numeric start time |
| Beat ordering | Beat N's start is strictly less than Beat N+1's start |

## Outputs

| Artifact | Location | Format |
|----------|----------|--------|
| Audio master | `output/audio.mp3` | mp3 (44.1kHz, 128kbps by default) |
| Transcript | `output/transcript.json` | Whisper JSON with word timestamps |
| Beat timings | `output/beat-timings.md` | Markdown table with id, name, start, end, sub-callouts |

Stage 04 reads `beat-timings.md`. If the audio is regenerated, that file changes and every downstream `T` constant gets re-derived.
