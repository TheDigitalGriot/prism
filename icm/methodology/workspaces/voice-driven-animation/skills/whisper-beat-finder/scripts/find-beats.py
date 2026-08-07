#!/usr/bin/env python3
"""
Convert a Whisper word-timestamped transcript into a beat-timings table by
matching phrases pulled from the script.

Edit the BEATS list at the top to match your script. Each entry has:
- id        : 1, 2, 3, ...
- name      : human label for the beat
- phrase    : opening phrase to find in the transcript (first 3-5 words)
- callouts  : list of {label, phrase, after_seconds=0.0} for sub-callouts

Output is a markdown table written to stdout. Pipe it into
stages/03-voice/output/beat-timings.md, or redirect with `> filename`.

Usage:
    python find-beats.py transcript.json
    python find-beats.py transcript.json > beat-timings.md
"""

import argparse
import json
import sys
from pathlib import Path


# Edit this list per project. Phrases are case-insensitive substring matches.
BEATS = [
    {
        "id": 1, "name": "Open on the topic",
        "phrase": "There's a bot",
        "callouts": [
            {"label": "nine years", "phrase": "nine years"},
            {"label": "keeps emailing", "phrase": "keeps emailing"},
        ],
    },
    {
        "id": 2, "name": "The real problem",
        "phrase": "Here's what that",
        "callouts": [],
    },
    # ... add one entry per beat
]


def find(words, phrase, after_seconds=0.0):
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


def main() -> None:
    p = argparse.ArgumentParser(description="Phrase-match Whisper transcript to beat boundaries.")
    p.add_argument("transcript", help="Path to transcript.json from transcribe.py")
    a = p.parse_args()

    data = json.loads(Path(a.transcript).read_text(encoding="utf-8"))
    words = [w for seg in data.get("segments", [])
             for w in (seg.get("words") or [])]
    if not words:
        sys.exit("No words found in transcript")

    audio_end = words[-1]["end"]

    # Resolve every beat's start time
    rows = []
    for b in BEATS:
        start = find(words, b["phrase"])
        if start is None:
            print(f"WARNING: beat {b['id']} phrase '{b['phrase']}' NOT FOUND",
                  file=sys.stderr)
            continue
        callouts = []
        for c in b["callouts"]:
            after = c.get("after_seconds", 0.0)
            t = find(words, c["phrase"], after_seconds=after)
            if t is not None:
                callouts.append(f"{c['label']} @ {t:.2f}")
            else:
                callouts.append(f"{c['label']} @ NOT FOUND")
        rows.append({"id": b["id"], "name": b["name"], "start": start,
                     "callouts": ", ".join(callouts) or "(none)"})

    # Compute end times as the next beat's start; last beat ends at audio_end
    for i, r in enumerate(rows):
        nxt = rows[i + 1]["start"] if i + 1 < len(rows) else audio_end
        r["end"] = nxt

    # Emit markdown
    print(f"# Beat Timings")
    print()
    print(f"Audio length: **{audio_end:.2f}s**")
    print()
    print("| Beat | Name | Start (abs) | End (abs) | Sub-callouts |")
    print("|------|------|-------------|-----------|--------------|")
    for r in rows:
        print(f"| {r['id']} | {r['name']} | {r['start']:.2f} | "
              f"{r['end']:.2f} | {r['callouts']} |")


if __name__ == "__main__":
    main()
