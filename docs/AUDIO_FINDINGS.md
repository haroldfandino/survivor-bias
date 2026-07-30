# Audio pipeline — smoke-test findings (2026-07-29)

Week-1 risk retirement for the week-4 voice-note milestone. Reproduce with:

```bash
uv run --script tools/smoke_audio.py
```

Outputs land in `assets/audio/_smoke/`. **None of the contracts below are in
`Rupert/rupert-api-guide.md`** — the guide has one table row per service. They
were established by probing, so write down any further discoveries here.

> ## CORRECTION (2026-07-29, later the same day)
>
> **The recommendation below to ship `/v1/audio/tts/speak` VoiceDesign was wrong,
> and `tools/probe_voice_stability.py` is what caught it.** The endpoint works,
> but a `voice_description` does **not reliably control the voice**:
>
> | metric | within-description spread | between-description spread |
> |---|---|---|
> | pitch | **0.158** | 0.132 |
> | spectral centroid | **0.384** | 0.213 |
> | duration | 0.286 | 0.235 |
>
> Rendering the *same* description three times varies more than rendering two
> deliberately different ones. The same prompt returned 136 Hz / 3.52 s and
> 94 Hz / 6.40 s — audibly two different people.
>
> **What shipped instead:** one fixed kokoro voice (`bm_lewis`) as the man, with
> the per-branch difference applied by ffmpeg in `tools/gen_voice.py`. kokoro
> named voices are perceptually stable — pitch spread 1.7%, centroid 1.0%,
> duration identical to the millisecond. Nell gets `bf_emma`, as she's a
> different person.
>
> This is what `BIBLE.md` §7 specified all along ("same voice base with
> per-branch treatment"), and it's truer than cloning would have been: literally
> the same voice, worn into three different shapes. Measured result —
> **T-3** 92–96 Hz, 29% energy below 300 Hz (dark, close);
> **T-7** 100–101 Hz, 16% (brighter, low end pulled);
> **Nell** phone-band-limited at 9%.
>
> The rest of this document is still accurate and is kept as the record of what
> each endpoint actually does.

## Verdict

The week-4 beat is **not blocked**, but it lands via a different endpoint than
planned. Voice cloning is broken; voice *design* works — but see the correction
above before using it for anything that needs to sound like the same person
twice.

| Endpoint | Status | Notes |
|---|---|---|
| `kokoro` (via `/api/v1/audio/speech`) | ✅ **works** | 44 KB MP3 in seconds. 67 voices. Reliable fallback. |
| `/v1/audio/tts/speak` (Qwen3-TTS VoiceDesign) | ✅ **works — ship this** | 5.84 s / 24 kHz mono WAV. Describe the voice in prose. |
| `/v1/audio/stable/generate` (Stable Audio 3.0) | ✅ **works** | Honoured `duration: 2` exactly → 2.00 s / 44.1 kHz stereo. SFX unblocked. |
| `/v1/audio/chatterbox` — plain TTS | ✅ works | 2.00 s / 24 kHz mono. A usable second engine. |
| `/v1/audio/chatterbox` — **voice cloning** | ❌ **broken** | Every multipart reference field 500s. See below. |
| `/v1/music/generate` (ACE-Step) | ❌ **queues, never delivers** | Retested warm; queue is not drained. Replaced by Stable Audio — see below. |

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

### Retested 2026-07-29 (later) — still does not deliver

`/v1/music/` now reports `models_initialized: true` (it was `false`, which
explained the first round of failures). It made no difference:

- A fresh job sat at `queue_position: 1` for **300 s** with no result.
- All three jobs from the earlier session are gone — `download` returns
  "Audio file not found on any instance" for every one.
- `/v1/music/download/<task_id>` is the **only** valid retrieval route. Ten other
  candidate paths (`/status/`, `/result/`, `/task/`, `/audio/`, `/jobs`, `/list`,
  `.wav`, `.mp3` suffixes…) all 404 with "Unknown music endpoint".

Conclusion: the model loads but **the queue is not being drained**. That is
service-side and not fixable from here.

**Worth raising in `#iio-games`** — ACE-Step is named in Divine Ascendancy's
asset pipeline, so somebody there has got audio out of it and will know whether a
worker needs kicking.

### What shipped

Stable Audio 3.0, via `tools/gen_ambience.py`. Two seamless loops (a diegetic
room-tone bed and a tension drone whose gain tracks ink's `pressure`) plus two UI
one-shots. 377 KB total.

Two things that pass silently if you don't measure them:

- **Do not ask the model for "very quiet".** The first bed came back at
  −56 dBFS — effectively silence. Level is the mixer's job; the prompt should
  describe the *sound*. Everything is `loudnorm`-ed at build time so the mixer's
  gains mean something.
- **Generated clips do not loop.** They are wrapped locally: take the clip from
  `xfade` onward and crossfade its tail into the clip's own opening, so the
  result starts and ends on the same material. Measured wrap discontinuity is
  0.004–0.006, i.e. no click. Note `acrossfade` yields an **empty stream** when
  fed `atrim`'d branches of an `asplit` — it needs plain file inputs, so this
  runs as three passes with intermediates.

## Still open

- **Why does chatterbox cloning 500?** Tried `audio=`, `reference_audio=`,
  `voice=` as multipart. All 500 with a bare `Internal Server Error`. Worth one
  question in-channel before spending more time — but no longer urgent, since
  VoiceDesign covers the requirement.
- **Whether `voice_description` is stable across calls.** Critical: if the same
  description yields a noticeably different voice each render, per-branch
  consistency breaks. Needs a repeat-render comparison before week 4.
