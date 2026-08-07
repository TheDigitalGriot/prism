# Voice-Driven Animation

This workspace produces narrated explainer videos where the recorded voiceover is the source of truth. The script is a plan; the audio is the timeline; the transcript drives scene boundaries; Remotion is the assembler.

## When to Use This Workspace

Use this when the deliverable is a 1 to 6 minute animated video with full narration (no on-camera footage), and you want timing locked to the actual recorded VO. Good for explainers, case-study videos, product walkthroughs, advisory pitches. Not for short-form social where on-camera face is the asset, and not for live-action shoots.

If your video has no narration, use `script-to-animation` instead.

## Folder Map

```
voice-driven-animation/
|-- CLAUDE.md              (you are here)
|-- CONTEXT.md             (start here for task routing)
|-- setup/
|   `-- questionnaire.md   (run with "setup")
|-- brand-vault/
|   |-- CONTEXT.md
|   |-- identity.md        (brand, audience, positioning)
|   `-- voice-rules.md     (tone, hard constraints, examples)
|-- skills/
|   |-- elevenlabs-narration/   (generate VO from a PASTE-block script)
|   |-- whisper-beat-finder/    (CPU-safe transcription + beat extraction)
|   `-- remotion-scene-anatomy/ (gap-fill sequences, beat-local time, end card)
|-- shared/
|   |-- pipeline-overview.md   (five-stage diagram)
|   |-- env-template.md        (.env vars across stages)
|   `-- platform-specs.md      (resolution, fps, duration per platform)
`-- stages/
    |-- 01-research/   (topic -> verified brief with citations)
    |-- 02-script/     (brief -> script + PASTE block + beat markers)
    |-- 03-voice/      (script -> audio.mp3 + transcript + beat-timings)
    |-- 04-animate/    (beat-timings -> timing.ts + per-beat scenes)
    `-- 05-render/     (scenes -> rendered mp4)
```

Each stage has `CONTEXT.md`, `output/`, and `references/`. Outputs are the human edit surface between stages.

## Triggers

| Keyword | Action |
|---------|--------|
| `setup` | Run the onboarding questionnaire. Configures brand, voice, ElevenLabs voice id, Whisper preference, end-card assets. |
| `status` | Scan `stages/*/output/`. Show each stage as COMPLETE if its output folder has files other than `.gitkeep`, otherwise PENDING. |

## Routing

| Task | Go To |
|------|-------|
| Research a topic and produce a brief | `stages/01-research/CONTEXT.md` |
| Write the script with the PASTE block | `stages/02-script/CONTEXT.md` |
| Generate VO and find beat boundaries | `stages/03-voice/CONTEXT.md` |
| Build Remotion scenes | `stages/04-animate/CONTEXT.md` |
| Render the final mp4 | `stages/05-render/CONTEXT.md` |
| Configure this workspace | `setup/questionnaire.md` |

## What to Load

| Task | Load These | Do NOT Load |
|------|-----------|-------------|
| Research | `brand-vault/identity.md` (Audience), `stages/01-research/references/*` | voice-rules, skills, later stages |
| Script | `brand-vault/voice-rules.md` ("Hard Constraints" through "What the Voice Is NOT"), `brand-vault/identity.md` (One-Sentence + Audience), `stages/01-research/output/`, `stages/02-script/references/*` | skills, animate, render |
| Voice | `stages/02-script/output/`, `stages/03-voice/references/audio-pipeline.md`, `skills/elevenlabs-narration/SKILL.md`, `skills/whisper-beat-finder/SKILL.md` | brand-vault, animate references |
| Animate | `stages/03-voice/output/`, `stages/04-animate/references/*`, `skills/remotion-scene-anatomy/SKILL.md` | brand-vault, earlier stages |
| Render | `stages/04-animate/output/`, `stages/05-render/references/render-checklist.md` | everything else |

## Stage Handoffs

Each stage writes to its own `output/`. The next stage reads from there. If you edit an output file (rewrite a script line, retime a beat, adjust a scene's `T` constants), the next stage picks up the edit automatically. That is the primary control surface.

The audio file in `stages/03-voice/output/audio.mp3` is the timing truth. If the audio is regenerated, every downstream timing (timing.ts, scene-local T constants) needs to be re-derived from the new transcript. The phrase-match script in `skills/whisper-beat-finder/scripts/` does this.
