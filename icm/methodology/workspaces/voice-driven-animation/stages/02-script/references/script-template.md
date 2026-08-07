# Script Template

The structure every script.md file follows. Stage 03's audio generator extracts only the PASTE block; everything else is for the human.

## Skeleton

```markdown
# Script -- {{Working Title}}

**Status:** draft / revised / final
**Length:** ~{{words}} words / ~{{minutes}} at ElevenLabs cadence
**Voice:** {{ELEVEN_VOICE_LABEL}}
**Visual system:** {{Pillar/Identity reference}}

---

## ► PASTE THIS into ElevenLabs

> Copy everything between the two horizontal rules below. Tone tags in `[brackets]` are intentional, keep them.

---

[matter-of-fact] {{First sentence of narration.}} {{Second sentence.}}

[shift] {{Beat 2 opening sentence.}} {{...}}

[pointed] {{Beat 3 turn.}}

[warm] {{Close.}}

---

## Beat-annotated reference (working copy)

<!-- BEAT 1 -- Cold open (~20s) -->

[matter-of-fact] {{Same Beat 1 prose, repeated here for human editing context.}}

<!-- BEAT 2 -- {{description}} (~Ns) -->

[shift] {{Beat 2 prose.}}

...

<!-- BEAT N -- End card (silent) (~5s) -->

---

## What changed from the prior cut (if applicable)

| Prior beat | Fate | Note |
|------------|------|------|
| {{n}} | Kept / Revised / Removed / Replaced | {{reason}} |

## Voice / craft notes

- {{Any explicit constraints honored}}
- {{Antithesis count check}}
- {{Word count vs target}}
```

## Why Two Copies of the Prose

The PASTE block is what ElevenLabs sees: clean, no markers, ready for the API. The beat reference is what humans and Stage 03 see: same prose, with `<!-- BEAT N -->` markers so the phrase-match step has stable anchors.

When you edit, edit the beat reference first, then copy the changes into the PASTE block. Or write into the PASTE block and re-derive the beat reference from it. Either order works; what matters is that the two stay in sync.

## Tone Tags

Use the configured vocabulary: {{TONE_TAG_VOCABULARY}}.

One tag per beat is enough. Stacking tags or tagging every sentence flattens the contrast. See `../../skills/elevenlabs-narration/rules/tone-tags.md`.

## End-Card Beat

Always the last beat. Silent. The PASTE block has no text for this beat. The beat reference has the marker plus `(silent end card -- lockup + url)` so the human knows it is intentional.
