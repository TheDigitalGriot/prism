# Stage 02: Script

Take the verified brief and write a script ready for ElevenLabs. The script has two faces: a clean PASTE block that goes to the API, and a beat-annotated reference that goes downstream.

## Inputs

| Source | File/Location | Section/Scope | Why |
|--------|--------------|---------------|-----|
| Stage 01 | `../01-research/output/[topic-slug]-brief.md` | Full file | Source of claims and citations |
| Brand vault | `../../brand-vault/voice-rules.md` | "Hard Constraints" through "What the Voice Is NOT" | Tone discipline |
| Brand vault | `../../brand-vault/identity.md` | "One-Sentence Brand" and "Audience" | Who is being addressed |
| Reference | `references/script-template.md` | Full file | Required structure of the script file |
| Reference | `references/beat-markers.md` | Full file | How to delimit beats so Stage 03 finds boundaries |
| Skill | `../../skills/elevenlabs-narration/rules/paste-block.md` | Full file | Exact PASTE block format |
| Skill | `../../skills/elevenlabs-narration/rules/tone-tags.md` | Tag vocabulary | What `[brackets]` tags ElevenLabs honors |
| Shared | `../../shared/platform-specs.md` | Target duration | Word-count budget |

## Process

1. Compute the word budget. ElevenLabs runs ~150-170 wpm including pauses. Multiply by `{{TARGET_DURATION}}` to get a target word count.
2. Outline the beats: cold open, problem, evidence (cited from the brief), turn, takeaway, close. Number them.
3. Write the PASTE block in one pass, keeping each beat to roughly its share of the budget. Use `[matter-of-fact]`, `[shift]`, `[pointed]`, `[warm]` tags sparingly (one per beat is plenty).
4. Mirror the PASTE block below in a "Beat-annotated reference" section, with HTML-comment markers `<!-- BEAT N -- description (~Ns) -->` between paragraphs. This is the working copy. Stage 03 phrase-match uses the first 3-5 words of each beat.
5. Run audits against the voice rules. Rewrite any line that violates.
6. Save to `output/[topic-slug]-script.md`.

## Checkpoints

| After Step | Agent Presents | Human Decides |
|------------|---------------|---------------|
| 2 | Beat outline (one line per beat) | Approve or restructure |
| 5 | Full draft with audit pass results | Approve, request rewrites, or change tone |

## Audit

| Check | Pass Condition |
|-------|---------------|
| Voice constraints | Zero violations of `voice-rules.md` Hard Constraints |
| Antithesis count | At most one "not X, but Y" pattern in the whole script |
| Em-dash count | Zero em dashes anywhere |
| Word budget | Within +/-10% of `{{TARGET_DURATION}}` * ~160 wpm |
| Claims sourced | Every quantitative claim traces to a citation in the brief |
| PASTE block | Extracts cleanly with `--dry-run` from the ElevenLabs script |

## Outputs

| Artifact | Location | Format |
|----------|----------|--------|
| Script file | `output/[topic-slug]-script.md` | Markdown with PASTE block, beat reference, and change notes |

The human edits the PASTE block. The next stage re-extracts when they regenerate audio.
