# Voice-Driven Animation Workspace

Produce a fully narrated animated video. The recorded voiceover defines the timeline. Remotion assembles the scenes around it.

## Task Routing

| Task Type | Go To | Description |
|-----------|-------|-------------|
| Research a topic | `stages/01-research/CONTEXT.md` | Verified sources and a content brief |
| Write the script | `stages/02-script/CONTEXT.md` | Script with the PASTE-into-ElevenLabs block and beat markers |
| Generate voice and beat timings | `stages/03-voice/CONTEXT.md` | Call ElevenLabs, transcribe with Whisper, extract beat boundaries |
| Build animation scenes | `stages/04-animate/CONTEXT.md` | timing.ts and per-beat Remotion scenes |
| Render the final mp4 | `stages/05-render/CONTEXT.md` | Production render, validation, export |

## Shared Resources

| Resource | Location | Contains |
|----------|----------|----------|
| Pipeline overview | `shared/pipeline-overview.md` | The five-stage flow at a glance |
| Environment template | `shared/env-template.md` | `.env` variables (ElevenLabs, paths) -- placeholders only, never real keys |
| Platform specs | `shared/platform-specs.md` | Resolution, fps, duration per platform |
| Brand context | `brand-vault/CONTEXT.md` | Routes to identity and voice rules |
| ElevenLabs narration skill | `skills/elevenlabs-narration/SKILL.md` | How to call ElevenLabs to render a script to mp3 |
| Whisper beat finder skill | `skills/whisper-beat-finder/SKILL.md` | CPU-safe transcription and phrase-match beat extraction |
| Remotion scene anatomy skill | `skills/remotion-scene-anatomy/SKILL.md` | Scene structure, gap-fill sequences, end-card pattern |
