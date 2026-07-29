# Audio pipeline — smoke-test findings (2026-07-29)

Week-1 risk retirement for the week-4 voice-note milestone. Reproduce with:

```bash
uv run --script tools/smoke_audio.py
```

Outputs land in `assets/audio/_smoke/`. **None of the contracts below are in
`Rupert/rupert-api-guide.md`** — the guide has one table row per service. They
were established by probing, so write down any further discoveries here.

## Verdict

The week-4 beat is **not blocked**, but it lands via a different endpoint than
planned. Voice cloning is broken; voice *design* works and is a better fit.

| Endpoint | Status | Notes |
|---|---|---|
| `kokoro` (via `/api/v1/audio/speech`) | ✅ **works** | 44 KB MP3 in seconds. 67 voices. Reliable fallback. |
| `/v1/audio/tts/speak` (Qwen3-TTS VoiceDesign) | ✅ **works — ship this** | 5.84 s / 24 kHz mono WAV. Describe the voice in prose. |
| `/v1/audio/stable/generate` (Stable Audio 3.0) | ✅ **works** | Honoured `duration: 2` exactly → 2.00 s / 44.1 kHz stereo. SFX unblocked. |
| `/v1/audio/chatterbox` — plain TTS | ✅ works | 2.00 s / 24 kHz mono. A usable second engine. |
| `/v1/audio/chatterbox` — **voice cloning** | ❌ **broken** | Every multipart reference field 500s. See below. |
| `/v1/music/generate` (ACE-Step) | ⚠️ **queues, doesn't finish** | Accepted and queued; no result after 300 s. |

## The call that matters

`/v1/audio/tts/speak` takes a **form-encoded** body. JSON is silently not
parsed — you get a `422` naming `text` as missing *even when you sent it*, with
`"input": null` giving the game away.

```python
httpx.post(
    f"{ROOT}/v1/audio/tts/speak",
    headers={"Authorization": f"Bearer {KEY}"},
    data={                                   # form, NOT json=
        "text": "i wasn't in a state to go and see who it was.",
        "voice_description": "a tired man in his late thirties, quiet, close to the microphone",
    },
    timeout=240.0,
)
# -> 200 {"data": "<base64 wav>", "code": 200, ...}
```

Health: `GET /v1/audio/tts/` → `Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign`, port 8076.

### Why this is better than cloning

The design wanted one cloned voice re-treated per branch. Voice *design* gets
there more directly: describe **the same man three ways** and let the prose carry
the divergence.

- **T-3** — "a tired man in his late thirties, quiet, close to the microphone"
- **T-7** — "the same man, flat and professional, mid-distance, unhurried"
- **T-12** — *no voice notes.* His silence is the tell (`BIBLE.md` §7).

That is the fiction — the same person, worn into three different shapes — and it
no longer depends on a broken endpoint.

## Response envelopes

All the `/v1/` audio services return **base64 inside a JSON envelope**, not raw
bytes:

```json
{"data": "<base64>", "code": 200, "error": null, "timestamp": 1785354343360}
```

Saving `response.content` straight to `.wav` produces an unplayable file. Decode
`data` first — `unwrap_audio()` in the smoke script handles both shapes.

## ACE-Step (music) — async, and cold

`POST /v1/music/generate` returns immediately with a queued task:

```json
{"data": {"task_id": "80793d9d-…", "status": "queued", "queue_position": 1}}
```

Discovered routes:

- `GET /v1/music/` — health. Currently reports `models_initialized: false`,
  `loaded_model: acestep-v15-xl-turbo`.
- `GET /v1/music/download/<task_id>` — **the result route.**
- `GET /v1/music/models` — returns an empty list.

Three jobs were queued across ~25 minutes; none produced audio. Because
`models_initialized` is `false`, this reads as a cold 4B model load rather than a
broken service, but it is **unproven** either way.

Two traps when polling:

1. **`/v1/tasks/<id>` returns the Open WebUI SPA shell with HTTP 200.** Checking
   only `status_code == 200` will make you think you found a status route. Check
   `content-type` too.
2. **Pending and nonexistent jobs both 404**, distinguishable only by message —
   `"Audio file not found on any instance"` (pending/dropped) vs
   `"Unknown music endpoint"` (wrong route).

### Action

Ambience is **not** on the week-4 critical path. Options, cheapest first:

1. Queue a job and collect it much later — plausibly just a slow cold start.
2. Ask in `#iio-games` whether ACE-Step is expected to be warm. Others have
   shipped with it, so someone knows.
3. Build the bed from Stable Audio layers, which works today: a long low drone
   plus room tone, looped via `/v1/audio/loop-points`.

## Still open

- **Why does chatterbox cloning 500?** Tried `audio=`, `reference_audio=`,
  `voice=` as multipart. All 500 with a bare `Internal Server Error`. Worth one
  question in-channel before spending more time — but no longer urgent, since
  VoiceDesign covers the requirement.
- **Whether `voice_description` is stable across calls.** Critical: if the same
  description yields a noticeably different voice each render, per-branch
  consistency breaks. Needs a repeat-render comparison before week 4.
