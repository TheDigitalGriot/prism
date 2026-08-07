# Tone Tags

Inline tags ElevenLabs honors when the model is `eleven_v3` or newer. Tags shape the delivery of the immediately following sentences until the next tag.

## Format

Place a tag in square brackets at the start of the sentence or paragraph where the tone shifts. The tag is **not** spoken.

```
[matter-of-fact] Most companies that buy AI never see the value.
[shift] But the ones that succeed have a structure underneath.
```

## Vocabulary for This Workspace

Configured tags: {{TONE_TAG_VOCABULARY}}

Common general-purpose tags you can rely on:

| Tag | Use For |
|-----|---------|
| `matter-of-fact` | Default narration. Neutral delivery, even pace. |
| `wry` | Showing a failure pattern from a distance. Slight tilt of the head. |
| `shift` | Tonal turn. Often used to pivot from problem to solution. |
| `pointed` | Single line landing for weight. Slower, clear. |
| `thoughtful` | Reflective. Slightly slower with more breath. |
| `warm` | Closing or invitation. Less clipped, friendlier. |
| `conversational` | Lighter mode. Good for case studies, anecdotes. |
| `pause` | A short rest, useful between long sentences. |

## What ElevenLabs Does NOT Honor

- Stage directions ("(grins)", "(sighs heavily)") -- ignored.
- Long descriptive tags like `[in a voice that feels both confident and inviting]` -- ignored or treated as noise.
- Stacked tags `[matter-of-fact] [pause]` on one line -- only the first tag wires through.

## Pause Beats

For a longer rest than a paragraph break gives you, write `[pause]` on its own line between sentences. Use sparingly. The transcript will reflect it as silence between words.

## Tag Density

Roughly one tag per beat (40 to 80 words). Tag every paragraph and you flatten the contrast. Tag once per minute and the delivery drifts back to the default.
