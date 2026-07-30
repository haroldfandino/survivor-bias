# /// script
# requires-python = ">=3.11"
# dependencies = ["httpx", "python-dotenv", "numpy"]
# ///
r"""Does `voice_description` actually control the voice, and hold across calls?

This is the flagged risk from docs/AUDIO_FINDINGS.md. The design wants three
recognisably different treatments of ONE man. Qwen3-TTS VoiceDesign takes a prose
description, but nothing documents whether it's deterministic — and if the same
description drifts between renders, per-branch voice consistency is impossible
and the whole week-4 beat has to change.

Method: render the same line three times per description, for two very different
descriptions. Then measure crude voice statistics (median pitch, spectral
centroid, speech rate) and compare WITHIN a description against BETWEEN
descriptions.

  * within-spread much smaller than between-spread  -> description controls the
    voice and holds. Good.
  * within-spread comparable to between-spread      -> it's effectively random.
    Fall back to kokoro's fixed named voices.

Deliberately measured rather than listened to, because "sounds about right" is
not a decision anyone can re-check later.

Usage: uv run --script tools/probe_voice_stability.py
"""

from __future__ import annotations

import base64
import io
import os
import struct
import sys
import wave
from pathlib import Path

import httpx
import numpy as np
from dotenv import load_dotenv

OUT = Path(__file__).resolve().parent.parent / "assets" / "audio" / "_probe"
load_dotenv(Path(r"D:\Indie\Rupert\.env"))
KEY = (os.environ.get("OPENWEBUI_API_KEY") or "").strip()
ROOT = (os.environ.get("RUPERT_ROOT_URL") or "https://rupert.indieio.dev").rstrip("/")

LINE = "i wasn't in a state to go and see who it was."

DESCRIPTIONS = {
    # T-3: close, wrecked, slower.
    "close": "a tired unshaven man in his early forties, quiet and close to the microphone, slow and unsteady",
    # T-7: flat, professional, mid-distance. Should measure clearly apart.
    "flat": "a calm professional man in his early forties, flat and even, unhurried, mid-distance, no emotion",
}
RENDERS = 3


def speak(text: str, description: str) -> bytes:
    """Form-encoded, `text` + `voice_description`. JSON is silently not parsed."""
    r = httpx.post(
        f"{ROOT}/v1/audio/tts/speak",
        headers={"Authorization": f"Bearer {KEY}"},
        data={"text": text, "voice_description": description},
        timeout=240.0,
    )
    r.raise_for_status()
    payload = r.json()
    data = payload.get("data")
    if not isinstance(data, str):
        sys.exit(f"unexpected payload: {str(payload)[:200]}")
    return base64.b64decode(data)


def stats(wav_bytes: bytes) -> dict[str, float]:
    """Crude voice fingerprint from raw samples. No librosa needed."""
    with wave.open(io.BytesIO(wav_bytes)) as w:
        rate = w.getframerate()
        n = w.getnframes()
        raw = w.readframes(n)
        width = w.getsampwidth()
        channels = w.getnchannels()

    fmt = {1: "b", 2: "h", 4: "i"}[width]
    samples = np.array(struct.unpack(f"<{len(raw) // width}{fmt}", raw), dtype=np.float64)
    if channels > 1:
        samples = samples.reshape(-1, channels).mean(axis=1)
    samples /= np.abs(samples).max() or 1.0

    # Voiced frames only — silence would drag every statistic toward zero.
    frame = int(rate * 0.04)
    frames = samples[: len(samples) // frame * frame].reshape(-1, frame)
    energy = (frames**2).mean(axis=1)
    voiced = frames[energy > energy.mean() * 0.5]
    if not len(voiced):
        voiced = frames

    # Median pitch by autocorrelation, restricted to a plausible speaking range.
    lo, hi = int(rate / 320), int(rate / 60)
    pitches = []
    for f in voiced:
        ac = np.correlate(f, f, mode="full")[frame - 1 :]
        seg = ac[lo:hi]
        if len(seg) and seg.max() > 0:
            pitches.append(rate / (lo + int(seg.argmax())))
    pitch = float(np.median(pitches)) if pitches else 0.0

    # Spectral centroid — the "brightness" of the voice.
    spec = np.abs(np.fft.rfft(voiced, axis=1)).mean(axis=0)
    freqs = np.fft.rfftfreq(frame, 1 / rate)
    centroid = float((spec * freqs).sum() / (spec.sum() or 1))

    duration = len(samples) / rate
    return {
        "pitch_hz": pitch,
        "centroid_hz": centroid,
        "duration_s": duration,
        "voiced_ratio": len(voiced) / len(frames),
    }


def spread(values: list[float]) -> float:
    """Relative spread, so pitch and centroid are comparable."""
    a = np.array(values, dtype=float)
    return float(a.std() / (abs(a.mean()) or 1.0))


def main() -> int:
    if not KEY:
        sys.exit("OPENWEBUI_API_KEY missing")
    OUT.mkdir(parents=True, exist_ok=True)

    measured: dict[str, list[dict[str, float]]] = {}
    for label, desc in DESCRIPTIONS.items():
        measured[label] = []
        for i in range(RENDERS):
            print(f"  render {label} #{i + 1} ...", flush=True)
            audio = speak(LINE, desc)
            (OUT / f"{label}_{i + 1}.wav").write_bytes(audio)
            s = stats(audio)
            measured[label].append(s)
            print(
                f"    pitch {s['pitch_hz']:6.1f} Hz   centroid {s['centroid_hz']:7.1f} Hz"
                f"   {s['duration_s']:.2f}s"
            )

    print("\n" + "=" * 66)
    verdict_ok = True
    for metric in ("pitch_hz", "centroid_hz", "duration_s"):
        within = [spread([r[metric] for r in runs]) for runs in measured.values()]
        between = spread([np.mean([r[metric] for r in runs]) for runs in measured.values()])
        worst_within = max(within)
        print(
            f"{metric:14s} within-description spread {worst_within:.3f}"
            f"   between-description spread {between:.3f}"
        )
        # A description only controls the voice if repeats cluster tighter than
        # different descriptions separate.
        if metric != "duration_s" and worst_within >= between:
            verdict_ok = False

    print("=" * 66)
    if verdict_ok:
        print(
            "VERDICT: repeats cluster tighter than descriptions separate.\n"
            "         voice_description controls the voice and holds across calls.\n"
            "         Safe to use one description per branch."
        )
    else:
        print(
            "VERDICT: repeats vary as much as different descriptions do.\n"
            "         voice_description does NOT reliably control the voice.\n"
            "         Fall back to kokoro's fixed named voices (67 available)."
        )
    print(f"\nsamples: {OUT}")
    return 0 if verdict_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
