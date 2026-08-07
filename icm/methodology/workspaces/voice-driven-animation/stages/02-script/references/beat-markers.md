# Beat Markers

Beat markers tell Stage 03 where one beat ends and the next begins. They live in the "Beat-annotated reference" section as HTML comments. The PASTE block has no markers (ElevenLabs would ignore them anyway).

## Format

```
<!-- BEAT 1 -- Cold open: name the topic (~20s) -->

[matter-of-fact] First sentence of beat 1. Second sentence.

<!-- BEAT 2 -- The problem (~26s) -->

[shift] First sentence of beat 2.
```

The marker contains:
- The keyword `BEAT`
- The beat number
- A short description after `--`
- An approximate runtime estimate in parentheses

The first 3-5 words of the prose following the marker are the **anchor phrase** Stage 03 will search for in the transcript.

## Choosing Anchor Phrases

The first 3-5 words of each beat need to be distinctive enough that they appear nowhere else in the script. The phrase-matcher uses substring matching across consecutive transcript words.

Good first lines: `"There's a bot at an"`, `"Here's what that bot was"`, `"Most companies that buy"`
Bad first lines: `"And then"`, `"So we"`, `"But this is where"` -- these probably repeat across beats.

If two beats start with similar openers, change one. Edit the script; do not work around it in Stage 03.

## Sub-Callout Markers (Optional)

For mid-beat moments worth animating against (a stat reveal, a name drop, a turn within the beat), add lightweight in-line markers:

```
[matter-of-fact] The operations team was buried. <!-- callout: ops buried -->
They were paying providers months late. <!-- callout: months late -->
```

Stage 03 picks these up by searching for the labeled phrase. They are not required; only add them where Stage 04 needs a specific animation cue.

## End-Card Beat

The final beat has a marker but no prose:

```
<!-- BEAT N -- End card (silent): lockup + nlplogix.com (~5s) -->
```

The PASTE block has no text after the last narration beat; the silence is the end card.
