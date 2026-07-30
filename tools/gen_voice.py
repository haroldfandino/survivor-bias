# /// script
# requires-python = ">=3.11"
# dependencies = ["httpx", "python-dotenv", "numpy"]
# ///
r"""Generate the voice notes.

WHY ONE VOICE AND NOT THREE
---------------------------
The plan called for cloning a voice and re-treating it per branch. Two probes
changed that:

  1. /v1/audio/chatterbox voice CLONING is broken — every multipart reference
     field 500s. (docs/AUDIO_FINDINGS.md)
  2. Qwen3-TTS VoiceDesign *works* but does not reliably control the voice.
     tools/probe_voice_stability.py measured within-description spread at 0.158
     pitch / 0.384 centroid against between-description spread of 0.132 / 0.213 —
     i.e. rendering the same description twice varies as much as rendering two
     different descriptions. Same prompt returned 136 Hz / 3.5 s and 94 Hz /
     6.4 s. Two different people.

kokoro's fixed named voices, by contrast, are perceptually stable: pitch spread
1.7%, centroid 1.0%, duration identical to the millisecond across renders.

So: ONE kokoro voice is the man, and the per-branch difference is done here with
ffmpeg. Which is what BIBLE.md §7 asked for in the first place — "same voice base
with per-branch treatment" — and it is truer than cloning would have been. It is
literally the same voice, worn into three different shapes.

T-12 gets no voice notes at all. That absence is a clue, not an omission.

Usage:
    uv run --script tools/gen_voice.py           # generate what's missing
    uv run --script tools/gen_voice.py --force   # re-render everything
"""

from __future__ import annotations

import argparse
import json
import os
import struct
import subprocess
import sys
import tempfile
import time
import wave
from pathlib import Path

import httpx
import numpy as np
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "audio"
RAW = ROOT / "assets" / "audio" / "_raw"
MANIFEST_OUT = ROOT / "src" / "voices.json"

load_dotenv(Path(r"D:\Indie\Rupert\.env"))
KEY = (os.environ.get("OPENWEBUI_API_KEY") or "").strip()
BASE = (os.environ.get("RUPERT_BASE_URL") or "https://rupert.indieio.dev/api/v1/").rstrip("/")

# bm_lewis: British, ~92 Hz, deep and worn. One man, early forties, three lives.
# bf_emma:  British, ~185 Hz. Nell — a different person, so a different voice.
VOICE_MAN = "bm_lewis"
VOICE_NELL = "bf_emma"

# Per-branch ffmpeg treatment. This is where the three selves diverge.
#
# BIBLE.md §7:
#   T-3  closer to mic, room reverb, occasional breath, slightly slower
#   T-7  flat, even, mid-distance, no room
#   T-12 no voice notes at all — the silence is the tell
#   Nell one voice note, held until an ending
TREATMENTS = {
    # Slower, bass-heavy, a small room around him. Sounds like a man sitting in
    # a parked car holding the phone too close.
    "t3": (
        "atempo=0.94,"
        "equalizer=f=110:t=q:w=1.0:g=5,"
        "equalizer=f=5500:t=q:w=1.0:g=-4,"
        "aecho=0.82:0.85:26:0.14,"
        "volume=1.05"
    ),
    # Dynamics flattened, low end pulled out, no room whatsoever. Reads as
    # somebody who has told this before, at a measured distance.
    "t7": (
        "highpass=f=115,"
        "acompressor=threshold=0.055:ratio=7:attack=8:release=200,"
        "equalizer=f=220:t=q:w=1.0:g=-3,"
        "equalizer=f=2600:t=q:w=1.2:g=2,"
        "volume=1.0"
    ),
    # Telephone band. She is literally on a phone — this is the only diegetic
    # treatment in the set, not a stylistic one.
    "nell": (
        "highpass=f=320,"
        "lowpass=f=3300,"
        "acompressor=threshold=0.08:ratio=5:attack=5:release=120,"
        "volume=1.35"
    ),
}

# id -> (branch, line). Text must match the ink line it plays under.
LINES: dict[str, tuple[str, str]] = {
    "t3_porch_01": ("t3", "i wasn't in a state to go and see who it was."),
    "t3_keys_01": ("t3", "i've still got them. twenty years. they're in a drawer."),
    "t3_gap_01": (
        "t3",
        "i thought it was one of the lads. i've thought it was one of the lads for twenty years.",
    ),
    "t7_job_01": (
        "t7",
        "I know what can be undone inside fifteen minutes, and I know what can't.",
    ),
    "t7_gap_01": (
        "t7",
        "Don't ask me to say it. You're the only one who can still not need me to.",
    ),
    # Her only line in the game. Written for the ear, not the page.
    "nell_call_01": (
        "nell",
        "hey — did i wake you? i'm fine, i just... it's further than i thought. "
        "and there's no light down by the water. can you come and get me?",
    ),
}

WAVEFORM_BARS = 24  # must match MessageBubble's bar count


def speak(text: str, voice: str, attempts: int = 4) -> bytes:
    """Synthesize one line.

    Retries with backoff: the gateway returns transient 502s and 429s under
    concurrency, and the guide's standing advice is to lean on retry rather than
    treat them as failures.
    """
    last = None
    for attempt in range(attempts):
        try:
            r = httpx.post(
                f"{BASE}/audio/speech",
                headers={"Authorization": f"Bearer {KEY}"},
                json={"model": "kokoro", "input": text, "voice": voice},
                timeout=120.0,
            )
            if r.status_code in (429, 500, 502, 503, 504):
                raise httpx.HTTPStatusError(
                    f"HTTP {r.status_code}", request=r.request, response=r
                )
            r.raise_for_status()
            return r.content
        except Exception as e:  # noqa: BLE001 — any transport failure is retryable here
            last = e
            if attempt < attempts - 1:
                wait = 3 * (attempt + 1)
                print(f"          retry in {wait}s ({type(e).__name__})", flush=True)
                time.sleep(wait)
    raise RuntimeError(f"speak failed after {attempts} attempts: {last}")


def treat(src: Path, dest: Path, chain: str) -> None:
    """Apply the branch treatment and encode for the web.

    Mono, 32 kbps — these are diegetic phone-app voice notes, so telephone
    bandwidth is correct rather than a compromise.
    """
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(src),
            "-af", chain,
            "-ac", "1", "-ar", "24000",
            "-codec:a", "libmp3lame", "-b:a", "32k",
            str(dest),
        ],
        check=True,
    )


def waveform(path: Path, bars: int = WAVEFORM_BARS) -> tuple[list[int], float]:
    """Peak envelope + duration, so the UI draws the real shape of the audio."""
    with tempfile.TemporaryDirectory() as d:
        wav = Path(d) / "a.wav"
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(path),
             "-ac", "1", "-ar", "8000", str(wav)],
            check=True,
        )
        with wave.open(str(wav)) as w:
            rate = w.getframerate()
            raw = w.readframes(w.getnframes())

    s = np.array(struct.unpack(f"<{len(raw) // 2}h", raw), dtype=float)
    duration = len(s) / rate
    if not len(s):
        return [0] * bars, 0.0

    chunks = np.array_split(np.abs(s), bars)
    peaks = np.array([c.max() if len(c) else 0 for c in chunks], dtype=float)
    peaks /= peaks.max() or 1.0
    # Floor at 12% so silent gaps still read as a waveform rather than a hole.
    return [int(round(12 + p * 88)) for p in peaks], duration


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    if not KEY:
        sys.exit("OPENWEBUI_API_KEY missing")

    OUT.mkdir(parents=True, exist_ok=True)
    RAW.mkdir(parents=True, exist_ok=True)

    manifest: dict[str, dict] = {}
    total_kb = 0.0

    for vid, (branch, text) in LINES.items():
        raw = RAW / f"{vid}.mp3"
        dest = OUT / f"{vid}.mp3"
        voice = VOICE_NELL if branch == "nell" else VOICE_MAN

        if raw.exists() and not args.force:
            print(f"  cached  {vid}")
        else:
            print(f"  speak   {vid} ({voice}) ...", flush=True)
            raw.write_bytes(speak(text, voice))

        treat(raw, dest, TREATMENTS[branch])
        bars, duration = waveform(dest)
        kb = dest.stat().st_size / 1024
        total_kb += kb
        manifest[vid] = {
            "branch": branch,
            "duration": round(duration, 2),
            "peaks": bars,
            "text": text,
        }
        print(f"  treated {vid:14s} {branch:5s} {duration:5.2f}s  {kb:5.1f} KB")

    # Manifest goes in src/, not public/: it is bundler input (a few hundred
    # bytes inlined into the JS), whereas the mp3s are served assets. Writing
    # it to public/ would ship it twice.
    MANIFEST_OUT.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"\n  {len(manifest)} voice note(s), {total_kb:.0f} KB total")
    print(f"  manifest -> {MANIFEST_OUT.relative_to(ROOT)}")
    print("\n  T-12 has no voice notes by design — see BIBLE.md §7.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
