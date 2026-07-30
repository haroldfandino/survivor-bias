# /// script
# requires-python = ">=3.11"
# dependencies = ["httpx", "python-dotenv"]
# ///
r"""Generate the ambience beds and UI sound effects.

WHY NOT ACE-STEP
----------------
`/v1/music/generate` accepts and queues jobs but never produces audio. Retested
after `/v1/music/` began reporting `models_initialized: true` (it was false
earlier, which explained the first failures) — a fresh job still sat at
`queue_position: 1` for 300s, and `/v1/music/download/<task_id>`, the only valid
retrieval route, kept returning "Audio file not found on any instance". Every
other candidate path 404s with "Unknown music endpoint". The queue is not being
drained; that is service-side and not fixable from here.

Stable Audio 3.0 (`/v1/audio/stable/generate`) works, honours `duration`
exactly, and is what this uses.

TWO LAYERS, BECAUSE THE DEADLINE IS FELT
----------------------------------------
  bed      — cold room tone. Diegetic: this is his bedroom at 01:00.
  tension  — a sustained dissonant drone. Score, not room.

The bed is constant and quiet. The tension layer's gain is driven by the ink
`pressure` counter, so as the night closes in, score creeps in over reality. The
felt deadline (BIBLE.md §6) already lives in the writing and the endgame framing;
this gives it a third channel that needs no numbers.

Loops are made seamless locally with an ffmpeg crossfade wrap — generated clips
do not loop cleanly on their own, and the loop-points endpoint is one more
undocumented dependency this doesn't need.

Usage:
    uv run --script tools/gen_ambience.py           # generate what's missing
    uv run --script tools/gen_ambience.py --force   # re-render everything
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "audio"
RAW = ROOT / "assets" / "audio" / "_raw"

load_dotenv(Path(r"D:\Indie\Rupert\.env"))
KEY = (os.environ.get("OPENWEBUI_API_KEY") or "").strip()
ROOT_URL = (os.environ.get("RUPERT_ROOT_URL") or "https://rupert.indieio.dev").rstrip("/")

# Crossfade length for the loop wrap, seconds. Long enough to hide the seam in
# sustained material, short enough not to eat the clip.
LOOP_XFADE = 3.0

# Loudness targets. Normalising at build time means the mixer's gains are
# meaningful numbers rather than guesses against whatever level the model
# happened to return — the first pass produced a bed at -56 dB (inaudible) and a
# tension layer peaking at 0.72 (far too hot).
LOUD_BED = "loudnorm=I=-26:TP=-4:LRA=7"
LOUD_SFX = "loudnorm=I=-20:TP=-3:LRA=9"

CLIPS = {
    # --- looping beds -------------------------------------------------------
    "amb_bed": {
        # NB: no "very quiet" in the prompt. Asking the model for quiet produced
        # near-silence; level is set by LOUD_BED and the mixer instead.
        "prompt": (
            "cold empty room tone at night, faint distant traffic outside, low electrical hum, "
            "refrigerator hum, still air, no music, no melody, no drums, no voices"
        ),
        "duration": 30,
        "loop": True,
        "post": f"highpass=f=40,lowpass=f=6000,{LOUD_BED}",
    },
    "amb_tension": {
        "prompt": (
            "sustained low dissonant drone, slow swell, two close detuned notes, ominous, "
            "cold, minimal, no drums, no melody, no voices, no rhythm"
        ),
        "duration": 30,
        "loop": True,
        "post": f"highpass=f=45,lowpass=f=4500,{LOUD_BED}",
    },
    # --- one-shots ----------------------------------------------------------
    "sfx_receive": {
        "prompt": "single short soft muted notification blip, dry, no reverb, low pitched",
        "duration": 2,
        "loop": False,
        # Stable Audio pads one-shots with silence, hence the trim.
        "post": f"silenceremove=start_periods=1:start_threshold=-50dB,atrim=0:0.45,{LOUD_SFX}",
    },
    "sfx_send": {
        "prompt": "single soft low wooden thud, muted, dry, no reverb, no tail, no click",
        "duration": 2,
        "loop": False,
        # Rolled off at 2.2k: the first attempt came back as a bright click
        # (8.7 kHz centroid), which is wrong for an app that is trying to feel
        # cold rather than chirpy.
        "post": (
            "silenceremove=start_periods=1:start_threshold=-50dB,atrim=0:0.28,"
            f"lowpass=f=2200,{LOUD_SFX}"
        ),
    },
}


def stable_audio(prompt: str, duration: int, attempts: int = 4) -> bytes:
    """Stable Audio returns base64 WAV inside a JSON envelope, not raw bytes."""
    last = None
    for attempt in range(attempts):
        try:
            r = httpx.post(
                f"{ROOT_URL}/v1/audio/stable/generate",
                headers={"Authorization": f"Bearer {KEY}"},
                json={"prompt": prompt, "duration": duration},
                timeout=240.0,
            )
            if r.status_code in (429, 500, 502, 503, 504):
                raise RuntimeError(f"HTTP {r.status_code}")
            r.raise_for_status()
            payload = r.json()
            data = payload.get("data")
            if not isinstance(data, str):
                raise RuntimeError(f"no audio in payload: {json.dumps(payload)[:160]}")
            return base64.b64decode(data)
        except Exception as e:  # noqa: BLE001 — all transport failures are retryable
            last = e
            if attempt < attempts - 1:
                wait = 4 * (attempt + 1)
                print(f"          retry in {wait}s ({type(e).__name__})", flush=True)
                time.sleep(wait)
    raise RuntimeError(f"stable_audio failed after {attempts} attempts: {last}")


def ffmpeg(args: list[str]) -> None:
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *args], check=True)


def duration_of(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def make_loop(src: Path, dest: Path, post: str, xfade: float = LOOP_XFADE) -> None:
    """Wrap a clip into a seamless loop.

    Takes the clip from `xfade` to the end, and crossfades its tail into the
    clip's own opening `xfade` seconds. The result therefore *starts* on the
    material at t=xfade and *ends* having faded into that same material, so the
    wrap point is continuous. Output length is (original - xfade).
    """
    total = duration_of(src)
    if total <= xfade * 2:
        raise RuntimeError(f"{src.name}: {total:.1f}s is too short to wrap with a {xfade}s fade")

    # Three passes with real intermediate files rather than one filter_complex.
    # `acrossfade` produces an empty stream when fed atrim'd branches of a split
    # — it needs its first input to be a finite stream it can measure. Two plain
    # file inputs work, and this is far easier to debug than a graph that
    # silently yields zero frames.
    with tempfile.TemporaryDirectory() as tmp:
        main = Path(tmp) / "main.wav"
        head = Path(tmp) / "head.wav"
        ffmpeg(["-i", str(src), "-ss", str(xfade), "-c:a", "pcm_s16le", str(main)])
        ffmpeg(["-i", str(src), "-t", str(xfade), "-c:a", "pcm_s16le", str(head)])
        ffmpeg([
            "-i", str(main), "-i", str(head),
            "-filter_complex", f"[0:a][1:a]acrossfade=d={xfade}:c1=tri:c2=tri[x];[x]{post}[out]",
            "-map", "[out]",
            "-ac", "1", "-ar", "44100",
            "-codec:a", "libmp3lame", "-b:a", "56k",
            str(dest),
        ])


def make_oneshot(src: Path, dest: Path, post: str) -> None:
    ffmpeg([
        "-i", str(src),
        "-af", post,
        "-ac", "1", "-ar", "44100",
        "-codec:a", "libmp3lame", "-b:a", "64k",
        str(dest),
    ])


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

    for name, spec in CLIPS.items():
        raw = RAW / f"{name}.wav"
        dest = OUT / f"{name}.mp3"

        if raw.exists() and not args.force:
            print(f"  cached  {name}")
        else:
            print(f"  gen     {name} ({spec['duration']}s) ...", flush=True)
            raw.write_bytes(stable_audio(spec["prompt"], spec["duration"]))

        if spec["loop"]:
            make_loop(raw, dest, spec["post"])
        else:
            make_oneshot(raw, dest, spec["post"])

        dur = duration_of(dest)
        kb = dest.stat().st_size / 1024
        total_kb += kb
        manifest[name] = {"duration": round(dur, 2), "loop": spec["loop"]}
        print(f"  {'loop ' if spec['loop'] else 'shot '}   {name:14s} {dur:5.2f}s  {kb:5.1f} KB")

    (ROOT / "src" / "ambience.json").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8"
    )
    print(f"\n  {len(manifest)} clip(s), {total_kb:.0f} KB total")
    print("  manifest -> src/ambience.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
