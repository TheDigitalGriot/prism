# PASTE Block Format

The script file must contain a `PASTE THIS into ElevenLabs` heading followed by the narration between two `---` horizontal rules. The extractor finds the heading (case-insensitive, ignoring `► `, `▶ `, or `> ` prefixes), then takes everything between the first and second `---` rules below it.

## Required Layout

```markdown
# Script -- Working Title

[some setup / notes here -- ignored by the extractor]

## ► PASTE THIS into ElevenLabs

> Copy everything between the two horizontal rules below. Tone tags in `[brackets]` are intentional, keep them.

---

[matter-of-fact] First sentence of narration. Second sentence.

[shift] New paragraph picks up on a tone change.

---

## Beat-annotated reference (for the human)

[Anything below the second `---` is ignored by the extractor. Put beat
markers, scene notes, change history, etc.]
```

## What Gets Sent

Only the lines between the two `---` rules. Lines beginning with `>` are stripped (those are author notes to the human, not narration).

Empty lines between paragraphs become natural pauses in delivery. ElevenLabs interprets paragraph breaks as breath beats.

## What Does NOT Get Sent

- The H1 title (`# Script -- ...`)
- The blockquote `>` instruction line
- The `## ► PASTE THIS` heading itself
- Anything below the closing `---` (beat reference, change log, voice notes)

## One Heading per File

The extractor finds the first match. Do not have multiple `PASTE THIS` sections in one file. For a series, use one file per video (`script-video1.md`, `script-video2.md`, etc.).

## Verifying Before You Spend Tokens

Run the extractor in `--dry-run` mode first. It prints the extracted text without calling the API. If the dry-run looks wrong, fix the rules placement before running it for real.
