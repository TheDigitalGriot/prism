# CPU Fallback for Whisper

`medium.en` on CPU is the default for this workspace because it has not segfaulted on any setup we have used. `large-v3` on GPU is faster but has crashed on RTX 5080 with CUDA driver 591.86 (and other recent driver+model combos). Pick one strategy:

## Default (Safe)

```python
import whisper
m = whisper.load_model("medium.en", device="cpu")
result = m.transcribe("audio.mp3",
                      word_timestamps=True,
                      language="en",
                      fp16=False,
                      verbose=False)
```

`fp16=False` is required when running on CPU. Without it Whisper warns and silently slows down.

Throughput is roughly 1 minute of audio per 1 minute wall-clock on a modern laptop CPU. For a 3-minute video that is fine. For a 30-minute long-form recording you may want GPU.

## Optional GPU Path

```python
m = whisper.load_model("large-v3", device="cuda")
result = m.transcribe("audio.mp3",
                      word_timestamps=True,
                      language="en",
                      fp16=True,
                      verbose=False)
```

If `whisper.load_model("large-v3")` crashes the Python process (segfault, abort, or silent exit), the immediate fall back is `medium.en` on CPU. Do not spend time fighting the driver during a deadline.

Common crash signatures we have seen:
- Process exits with no stack trace (segfault on model load)
- `cudaErrorIllegalAddress` during first decode batch
- Process hangs after model loads, no progress output

In all of these, switch to CPU `medium.en` and continue.

## Why Not `tiny.en` or `base.en`

They are faster but produce noisier word timings, especially at sentence boundaries. Beat phrase-matching gets less reliable. Only use them for sanity-check drafts.

## Memory Footprint

- `tiny.en` -- ~500 MB
- `base.en` -- ~600 MB
- `small.en` -- ~1 GB
- `medium.en` -- ~2.5 GB
- `large-v3` -- ~5 GB plus GPU VRAM

CPU runs of `medium.en` need about 4 GB of RAM headroom for safety.
