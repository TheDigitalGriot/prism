#!/usr/bin/env python3
"""
Transcribe an mp3 to a word-timestamped JSON via Whisper.

Default config: medium.en on CPU. Safe across drivers. ~1 min audio per
1 min wall-clock on a modern laptop. Override with --model and --device
if you have a stable GPU.

Usage:
    python transcribe.py audio.mp3 transcript.json
    python transcribe.py audio.mp3 transcript.json --model large-v3 --device cuda
"""

import argparse
import json
import sys
import time
from pathlib import Path

try:
    import whisper
except ImportError:
    sys.exit("Install: pip install openai-whisper")


def main() -> None:
    p = argparse.ArgumentParser(description="Whisper transcription with word timestamps.")
    p.add_argument("audio", help="Path to mp3 (or any ffmpeg-readable audio).")
    p.add_argument("out", help="Path to write the JSON transcript.")
    p.add_argument("--model", default="medium.en",
                   help="Whisper model (default: medium.en).")
    p.add_argument("--device", default="cpu",
                   help="cpu or cuda (default: cpu).")
    a = p.parse_args()

    audio = Path(a.audio)
    if not audio.exists():
        sys.exit(f"Not found: {audio}")

    print(f"loading model {a.model} on {a.device}")
    m = whisper.load_model(a.model, device=a.device)
    print(f"transcribing {audio}")
    t0 = time.time()
    result = m.transcribe(
        str(audio),
        word_timestamps=True,
        language="en",
        fp16=(a.device == "cuda"),
        verbose=False,
    )
    dur = time.time() - t0

    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    words = [w for seg in result.get("segments", [])
             for w in (seg.get("words") or [])]
    end = words[-1]["end"] if words else 0
    print(f"audio_end={end:.2f}s  words={len(words)}  elapsed={dur:.1f}s")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
