# Phrase Matching

Given Whisper's word-timestamped transcript, find a phrase from the script and return its absolute start time. This is how beat boundaries get derived from the audio.

## Why Phrase Matching (Not Sentence Diffing)

Whisper occasionally drops or re-spells a word. ElevenLabs occasionally elides a contraction. A direct diff against the script breaks. A substring match across a short window of words is robust to both.

## Matching Contract

```python
def find(words, phrase, after_seconds=0.0):
    """Return the absolute start time of the first occurrence of `phrase`,
    or None if not found. `words` is the list of {word, start, end} objects
    from `transcript.json` (flattened across segments). `after_seconds`
    skips matches before that time -- useful when a phrase appears more
    than once and you want the second instance.
    """
    needle = phrase.lower().split()
    n = len(needle)
    cleaned = [(w["start"], w["word"].strip().lower().rstrip(".,!?'"))
               for w in words]
    for i in range(len(cleaned) - n + 1):
        if cleaned[i][0] < after_seconds:
            continue
        if all(needle[j] in cleaned[i + j][1] for j in range(n)):
            return cleaned[i][0]
    return None
```

Three things to notice:

- `needle[j] in cleaned[i+j][1]` is a substring check, not equality. That handles trailing punctuation Whisper sometimes attaches.
- `.rstrip(".,!?'")` strips trailing punctuation Whisper occasionally embeds in a word token.
- `after_seconds` lets you find later occurrences of a repeated phrase.

## Choosing Phrases

For each beat, pick the first 3-5 words that are distinctive within the script. Avoid generic openers ("So we"), since they may appear in multiple beats.

Good: `"There's a bot at an insurance"`, `"Here's what that bot was"`, `"about one in five"`
Bad: `"And then"`, `"But here"`, `"So we"`

## Sub-Callouts

Within a beat, you may want a second match for a moment that drives an animation reveal. Same function, same contract. Record the absolute time, then convert to beat-local in Stage 04 (`local = abs - beat.start`).

## When a Phrase Does Not Match

The transcript spelled it differently. Options in order of preference:

1. Look at `transcript.json` around the expected time. Pick a shorter or different distinctive phrase from the script and try again.
2. If Whisper mangled the audio (rare), the script needs adjusting before the next render.
3. Last resort: scrub the audio file in an editor, read the timestamp directly, hand-enter it.

Never proceed with a missing beat boundary. Stage 04 cannot place a scene without a start time.
