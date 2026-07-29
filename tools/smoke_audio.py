# /// script
# requires-python = ">=3.11"
# dependencies = ["httpx", "python-dotenv"]
# ///
"""Smoke-test the audio endpoints SURVIVOR BIAS depends on.

Week-4 (voice notes, ambience) is the single strongest demo in the schedule and
it rests on three endpoints that are undocumented beyond a one-line table row
in rupert-api-guide.md and untested anywhere in D:\\Indie. This probes them now,
in week 1, so a failure costs a day instead of a milestone.

  1. kokoro TTS            — documented, known-good. Also gives us a reference
                             sample to feed the cloning probe.
  2. /v1/audio/chatterbox  — voice clone. The thematic core: every timeline is
                             recognisably the same voice.
  3. /v1/music/generate    — ACE-Step, for the ambience bed.
  4. /v1/audio/stable/...  — Stable Audio, for notification/typing SFX.

Discovery-first: each probe tries the most plausible request shape, then reports
exactly what came back so the real contract is written down rather than guessed
at again later.

Usage:  uv run --script tools/smoke_audio.py
Output: assets/audio/_smoke/
"""

from __future__ import annotations

import base64
import json
import sys
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv
import os

RUPERT_ENV = Path(r"D:\Indie\Rupert\.env")
OUT = Path(__file__).resolve().parent.parent / "assets" / "audio" / "_smoke"

load_dotenv(RUPERT_ENV)
API_KEY = (os.environ.get("OPENWEBUI_API_KEY") or "").strip()
ROOT = (os.environ.get("RUPERT_ROOT_URL") or "https://rupert.indieio.dev").rstrip("/")
CHAT_BASE = (
    os.environ.get("RUPERT_BASE_URL") or "https://rupert.indieio.dev/api/v1/"
).rstrip("/")

# A line from the actual script — worth hearing in the real voice early.
LINE = "i wasn't in a state to go and see who it was."

HEADERS = {"Authorization": f"Bearer {API_KEY}"}
results: list[tuple[str, str, str]] = []


def record(name: str, ok: bool, detail: str) -> None:
    results.append((name, "PASS" if ok else "FAIL", detail))
    mark = "\033[32mPASS\033[0m" if ok else "\033[31mFAIL\033[0m"
    print(f"  {mark}  {name}: {detail}")


def describe(resp: httpx.Response, limit: int = 400) -> str:
    ctype = resp.headers.get("content-type", "?")
    if ctype.startswith("application/json"):
        try:
            return json.dumps(resp.json())[:limit]
        except Exception:
            pass
    return f"{ctype}, {len(resp.content)} bytes"


def save(name: str, data: bytes) -> Path:
    OUT.mkdir(parents=True, exist_ok=True)
    p = OUT / name
    p.write_bytes(data)
    return p


def probe_kokoro() -> bytes | None:
    """kokoro is exposed through the OpenAI-compatible audio/speech route."""
    print("\n[1] kokoro TTS (baseline)")
    url = f"{CHAT_BASE}/audio/speech"
    body = {"model": "kokoro", "input": LINE, "voice": "af_heart"}
    try:
        r = httpx.post(url, headers=HEADERS, json=body, timeout=60.0)
    except Exception as e:
        record("kokoro", False, f"{type(e).__name__}: {e}")
        return None
    if r.status_code != 200:
        record("kokoro", False, f"HTTP {r.status_code} — {describe(r)}")
        return None
    p = save("kokoro_ref.mp3", r.content)
    record("kokoro", True, f"{len(r.content)} bytes -> {p.name}")
    return r.content


def unwrap_audio(resp: httpx.Response, name: str) -> str:
    """These services return base64 audio inside a JSON envelope, not raw bytes.

    Discovered by probing: `{"data": "<base64 wav>", "code": 200, ...}`. Nothing
    in the guide says so, which is why the first pass saved unusable files.
    """
    ctype = resp.headers.get("content-type", "")
    if not ctype.startswith("application/json"):
        return f"raw {len(resp.content)} bytes -> {save(name, resp.content).name}"

    payload = resp.json()
    data = payload.get("data")
    if isinstance(data, str):
        raw = base64.b64decode(data)
        return f"b64 -> {len(raw)} bytes -> {save(name, raw).name}"
    return f"json envelope, no audio payload: {json.dumps(payload)[:200]}"


def probe_chatterbox(reference: bytes | None) -> None:
    """Voice clone.

    Undocumented. Probing established the text field is `input` (not `text`) —
    a 422 helpfully named it. The reference sample goes in as multipart.
    """
    print("\n[2] /v1/audio/chatterbox (voice clone)")
    url = f"{ROOT}/v1/audio/chatterbox"

    if reference:
        for field in ("audio", "reference_audio", "voice"):
            try:
                r = httpx.post(
                    url,
                    headers=HEADERS,
                    data={"input": LINE, "language": "en"},
                    files={field: ("ref.mp3", reference, "audio/mpeg")},
                    timeout=240.0,
                )
                if r.status_code == 200:
                    record(
                        f"chatterbox (multipart, {field}=)",
                        True,
                        unwrap_audio(r, "chatterbox_clone.wav"),
                    )
                    return
                record(
                    f"chatterbox (multipart, {field}=)",
                    False,
                    f"HTTP {r.status_code} — {describe(r)}",
                )
            except Exception as e:
                record(f"chatterbox (multipart, {field}=)", False, f"{type(e).__name__}: {e}")

    try:
        r = httpx.post(url, headers=HEADERS, json={"input": LINE, "language": "en"}, timeout=240.0)
        ok = r.status_code == 200
        record(
            "chatterbox (json, no ref)",
            ok,
            unwrap_audio(r, "chatterbox_default.wav") if ok else f"HTTP {r.status_code} — {describe(r)}",
        )
    except Exception as e:
        record("chatterbox (json, no ref)", False, f"{type(e).__name__}: {e}")


def poll_task(task_id: str, label: str, tries: int = 30, every: float = 10.0) -> None:
    """ACE-Step is asynchronous — POST queues a job and returns a task_id.

    Contract, established by probing (none of this is in the guide):
      GET /v1/music/                     health; reports the loaded model
      GET /v1/music/download/<task_id>   the result

    Beware two traps found the hard way:
      * `/v1/tasks/<id>` returns the Open WebUI SPA shell with HTTP 200, so
        "status == 200" is NOT a valid liveness check — content-type must be
        checked too.
      * A pending job and a nonexistent one both 404. They're told apart by the
        message: "Audio file not found on any instance" (pending/dropped) vs
        "Unknown music endpoint" (wrong route).
    """
    url = f"{ROOT}/v1/music/download/{task_id}"

    for attempt in range(tries):
        try:
            r = httpx.get(url, headers=HEADERS, timeout=60.0)
        except Exception as e:
            record(f"{label} poll", False, f"{type(e).__name__}: {e}")
            return

        ctype = r.headers.get("content-type", "")
        if ctype.startswith("text/html"):
            record(f"{label} poll", False, "got the SPA shell — wrong route")
            return

        if r.status_code == 200 and not ctype.startswith("application/json"):
            record(
                f"{label} poll",
                True,
                f"ready after ~{int(attempt * every)}s — "
                f"{len(r.content)} bytes -> {save('ambience.wav', r.content).name}",
            )
            return

        if r.status_code == 404 and "Unknown music endpoint" in r.text:
            record(f"{label} poll", False, f"route rejected: {r.text[:120]}")
            return

        time.sleep(every)

    record(
        f"{label} poll",
        False,
        f"not ready after {int(tries * every)}s — queued but did not finish "
        f"(task {task_id}; ACE-Step reports models_initialized=false, so this is "
        f"likely a cold model load)",
    )


def probe_music() -> None:
    print("\n[3] /v1/music/generate (ACE-Step ambience)")
    url = f"{ROOT}/v1/music/generate"
    body = {
        "prompt": "sparse ambient drone, low tension, night, no drums, no melody",
        "duration": 20,
    }
    try:
        r = httpx.post(url, headers=HEADERS, json=body, timeout=300.0)
    except Exception as e:
        record("music/generate", False, f"{type(e).__name__}: {e}")
        return

    if r.status_code != 200:
        record("music/generate", False, f"HTTP {r.status_code} — {describe(r)}")
        return

    payload = r.json()
    task_id = (payload.get("data") or {}).get("task_id")
    record("music/generate queue", True, f"task_id={task_id}")
    if task_id:
        poll_task(task_id, "music")


def probe_voicedesign() -> None:
    """Qwen3-TTS VoiceDesign — the per-branch voice engine we actually ship.

    `/v1/audio/tts/` reports Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign. It takes a
    FORM-ENCODED body (JSON is silently not parsed — you get a 422 naming
    `text` as missing even when you sent it) with:

        text                the line to speak
        voice_description   a prose description of the voice

    Describing the voice beats cloning for this game: the same man can be
    described three ways — hollowed out, clinical, clipped — which is exactly
    the fiction. See BIBLE.md §7.
    """
    print("\n[5] /v1/audio/tts/speak (Qwen3-TTS VoiceDesign)")
    url = f"{ROOT}/v1/audio/tts/speak"
    desc = "a tired man in his late thirties, quiet, close to the microphone"
    try:
        r = httpx.post(
            url, headers=HEADERS, data={"text": LINE, "voice_description": desc}, timeout=240.0
        )
        ok = r.status_code == 200
        record(
            "tts/speak (voice design)",
            ok,
            unwrap_audio(r, "qwen_voicedesign.wav") if ok else f"HTTP {r.status_code} — {describe(r)}",
        )
    except Exception as e:
        record("tts/speak (voice design)", False, f"{type(e).__name__}: {e}")


def probe_sfx() -> None:
    print("\n[4] /v1/audio/stable/generate (SFX)")
    url = f"{ROOT}/v1/audio/stable/generate"
    body = {"prompt": "single soft UI notification blip, dry, no reverb", "duration": 2}
    try:
        r = httpx.post(url, headers=HEADERS, json=body, timeout=180.0)
        ok = r.status_code == 200
        record(
            "audio/stable/generate",
            ok,
            unwrap_audio(r, "blip.wav") if ok else f"HTTP {r.status_code} — {describe(r)}",
        )
    except Exception as e:
        record("audio/stable/generate", False, f"{type(e).__name__}: {e}")


def main() -> int:
    if not API_KEY:
        print(f"OPENWEBUI_API_KEY missing from {RUPERT_ENV}", file=sys.stderr)
        return 2

    print(f"Rupert root: {ROOT}")
    ref = probe_kokoro()
    probe_chatterbox(ref)
    probe_music()
    probe_voicedesign()
    probe_sfx()

    print("\n" + "=" * 60)
    passed = sum(1 for _, s, _ in results if s == "PASS")
    print(f"audio smoke: {passed}/{len(results)} passed")
    for name, status, detail in results:
        print(f"  {status:4}  {name}")
    print(f"\noutput: {OUT}")
    # Non-zero only if the baseline itself failed — the probes are exploratory.
    return 0 if any(n == "kokoro" and s == "PASS" for n, s, _ in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
