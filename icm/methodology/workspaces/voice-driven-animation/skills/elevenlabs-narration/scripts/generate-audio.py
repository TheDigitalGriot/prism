#!/usr/bin/env python3
"""
Reference implementation: render a script's PASTE block to mp3 via ElevenLabs.

Copy this into the project root that hosts your scripts and audio. Adjust the
`SCRIPTS` mapping to match your file layout.

Usage:
    python generate-audio.py video1
    python generate-audio.py --all
    python generate-audio.py video1 --dry-run   # extract and print, skip API

Credentials come from `.env` (see ../../../shared/env-template.md). Never
commit real keys.
"""

import argparse
import os
import sys
from pathlib import Path

try:
    from elevenlabs.client import ElevenLabs
    from elevenlabs import VoiceSettings, save
except ImportError:
    sys.exit("Install: pip install elevenlabs python-dotenv")

try:
    from dotenv import load_dotenv
except ImportError:
    sys.exit("Install: pip install python-dotenv")


PROJECT_ROOT = Path(__file__).resolve().parents[3]   # adjust if you move this file
AUDIO_DIR = PROJECT_ROOT / "audio"
REMOTION_PUBLIC_AUDIO = PROJECT_ROOT / "remotion" / "public" / "audio"

# Map a short video key to its script file. Edit for your layout.
SCRIPTS = {
    "video1": "stages/02-script/output/video1-script.md",
    "video2": "stages/02-script/output/video2-script.md",
}
VIDEOS = list(SCRIPTS.keys())


def extract_paste_block(script_path: Path) -> str:
    """Pull the narration block out of a script.md file.

    Locates the 'PASTE THIS into ElevenLabs' heading (case insensitive, leading
    decorations such as '>', '►', '▶' tolerated), then returns the content
    between the first two `---` rules below it. Lines starting with '>' (author
    callouts) are stripped.
    """
    text = script_path.read_text(encoding="utf-8")
    lower = text.lower()
    marker = lower.find("paste this into elevenlabs")
    if marker == -1:
        raise ValueError(f"No PASTE THIS heading in {script_path}")

    after = text[marker:]
    first = after.find("\n---\n")
    if first == -1:
        first = after.find("\n---\r\n")
    if first == -1:
        raise ValueError(f"No opening --- rule after PASTE heading in {script_path}")

    rest = after[first + 5:]
    second = rest.find("\n---\n")
    if second == -1:
        second = rest.find("\n---\r\n")
    if second == -1:
        raise ValueError(f"No closing --- rule in {script_path}")

    body = rest[:second].strip()
    lines = [line for line in body.splitlines() if not line.lstrip().startswith(">")]
    body = "\n".join(lines).strip()
    if not body:
        raise ValueError(f"Empty PASTE block in {script_path}")
    return body


def render(video: str, client: ElevenLabs, voice_id: str, model_id: str,
           settings: VoiceSettings, output_format: str) -> Path:
    script_path = PROJECT_ROOT / SCRIPTS[video]
    if not script_path.exists():
        raise FileNotFoundError(script_path)

    print(f"[{video}] reading {script_path.relative_to(PROJECT_ROOT)}")
    text = extract_paste_block(script_path)
    print(f"[{video}] {len(text.split())} words, {len(text)} chars")
    if len(text) > 5000:
        print(f"[{video}] WARNING: over 5000 chars; ElevenLabs may truncate")

    print(f"[{video}] calling ElevenLabs (model={model_id})")
    audio = client.text_to_speech.convert(
        text=text, voice_id=voice_id, model_id=model_id,
        output_format=output_format, voice_settings=settings,
    )

    AUDIO_DIR.mkdir(exist_ok=True)
    master = AUDIO_DIR / f"{video}.mp3"
    save(audio, str(master))
    print(f"[{video}] saved master: {master.relative_to(PROJECT_ROOT)}")

    REMOTION_PUBLIC_AUDIO.mkdir(parents=True, exist_ok=True)
    runtime = REMOTION_PUBLIC_AUDIO / f"{video}.mp3"
    runtime.write_bytes(master.read_bytes())
    print(f"[{video}] copied to runtime: {runtime.relative_to(PROJECT_ROOT)}")
    return master


def main() -> None:
    p = argparse.ArgumentParser(description="Render scripts to mp3 via ElevenLabs.")
    p.add_argument("video", nargs="?", help=f"Video key. One of: {', '.join(VIDEOS)}")
    p.add_argument("--all", action="store_true", help="Render every video in SCRIPTS")
    p.add_argument("--dry-run", action="store_true", help="Extract and print, skip API")
    a = p.parse_args()
    if not a.video and not a.all:
        p.error("Pass a video key or --all")
    if a.video and a.video not in VIDEOS:
        p.error(f"Unknown video '{a.video}'")

    targets = VIDEOS if a.all else [a.video]
    load_dotenv(PROJECT_ROOT / ".env")

    if a.dry_run:
        for v in targets:
            path = PROJECT_ROOT / SCRIPTS[v]
            print(f"\n=== {v} ({path.name}) ===")
            try:
                print(extract_paste_block(path))
            except (FileNotFoundError, ValueError) as e:
                print(f"[error] {e}")
        return

    key = os.environ.get("ELEVEN_API_KEY")
    voice = os.environ.get("ELEVEN_VOICE_ID")
    if not key or not voice:
        sys.exit("Set ELEVEN_API_KEY and ELEVEN_VOICE_ID in .env")

    settings = VoiceSettings(
        stability=float(os.environ.get("ELEVEN_STABILITY", "0.5")),
        similarity_boost=float(os.environ.get("ELEVEN_SIMILARITY_BOOST", "0.75")),
        speed=float(os.environ.get("ELEVEN_SPEED", "1.0")),
    )
    model = os.environ.get("ELEVEN_MODEL_ID", "eleven_v3")
    fmt = os.environ.get("ELEVEN_OUTPUT_FORMAT", "mp3_44100_128")
    client = ElevenLabs(api_key=key)

    failures = []
    for v in targets:
        try:
            render(v, client, voice, model, settings, fmt)
        except Exception as e:
            print(f"[{v}] FAILED: {e}")
            failures.append((v, str(e)))
        print()

    if failures:
        sys.exit(f"{len(failures)} failure(s)")


if __name__ == "__main__":
    main()
