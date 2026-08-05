# /// script
# requires-python = ">=3.11"
# dependencies = ["httpx", "python-dotenv"]
# ///
r"""LLM constraint engine — dialogue variation inside narrative bounds.

WHAT THIS IS FOR
----------------
The script in story/*.ink is authored, fixed and gated. This does NOT write
story. It performs controlled variation on lines that are already approved:

  REPHRASE  say the same fact a different way, in register
  EXPAND    add texture to an approved line, introducing no new fact
  GENERATE  answer an unscripted question without inventing anything checkable

The third is the dangerous one, so it is gated twice: a cheap keyword heuristic
rejects anything that smells like a claim, and only survivors go to the model-
based classifier. A rejected generation falls back to a per-timeline deflection.

WHY NOTHING HERE FILES A CLAIM
------------------------------
The evidence drawer is the puzzle surface. A generated line that reads as a fact
would be either unverifiable (so the player can never contest it) or a second
source of truth competing with claims.ink. Both break the game, so generation is
constrained to deflection, emotion and texture only.

RUPERT RULES THIS OBEYS (see D:\Indie\Rupert\rupert-api-guide.md)
----------------------------------------------------------------
  - ALWAYS stream. A non-streamed completion hits a Cloudflare 100s 524.
  - Strip <think>...</think> before using output.
  - Exact model tags: qwen3.5-27b:latest, not qwen3.5-27b.
  - Per-model concurrency (27b: 1) — 429 is expected, so retry with backoff.

Usage:
    uv run --script tools/llm_voice.py --test rephrase
    uv run --script tools/llm_voice.py --test expand
    uv run --script tools/llm_voice.py --test generate
    uv run --script tools/llm_voice.py --test all
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent

load_dotenv(Path(r"D:\Indie\Rupert\.env"))
KEY = (os.environ.get("OPENWEBUI_API_KEY") or "").strip()
BASE = (os.environ.get("RUPERT_BASE_URL") or "https://rupert.indieio.dev/api/v1/").rstrip("/")

DEFAULT_MODEL = "qwen3.5-27b:latest"

# Register briefs. These mirror story/BIBLE.md §4 and the header comments in
# t3.ink / t7.ink / t12.ink — if those change, change these.
BRIEFS: dict[str, dict] = {
    "t3": {
        "name": "TIMELINE-3, the one who stayed",
        "register": (
            "lowercase, run-on, self-interrupting, over-familiar, apologetic. "
            "rarely finishes punctuation. warm and wrong."
        ),
        "constraints": [
            "Emotional truth matters more to him than accuracy.",
            "Twenty years of drinking has made his memory genuinely unreliable, and he knows it.",
            "He wants absolution, not to be correct.",
            "Never clinical, never precise, never a timestamp.",
        ],
        "deflection": "i don't want to get into that one",
    },
    "t7": {
        "name": "TIMELINE-7, the one who atoned",
        "register": (
            "complete sentences, capital letters, timestamps, clinical nouns. "
            "never swears. answers the question adjacent to the one asked."
        ),
        "constraints": [
            "Precision is his armour; he narrates the night without placing himself in it.",
            "He will not account for 01:40-01:55 under any circumstances.",
            "Generous with verifiable physical detail, withholding about himself.",
        ],
        "deflection": "I've told you what I can account for.",
    },
    "t12": {
        "name": "TIMELINE-12, the one who got out",
        "register": (
            "clipped, edited, punctuated. types like someone who rereads before "
            "sending. never sends voice notes."
        ),
        "constraints": [
            "He cannot afford to be wrong about the last twenty years.",
            "Confident and well-argued, and some of what he says is false.",
            "He never confesses; he reframes.",
        ],
        "deflection": "That isn't relevant to what you're asking.",
    },
    "nell": {
        "name": "Nell",
        "register": "young, short sentences, casual about being frightened.",
        "constraints": [
            "She speaks exactly once in the game, in ending A.",
            "Never explains the plot. Never accuses anyone.",
        ],
        "deflection": "i don't know. i just want to go home",
    },
}

# Fast pre-filter for GENERATE. Anything that looks checkable is refused before a
# model is asked, because the cheap gate is the one that can't itself hallucinate.
CLAIMY = re.compile(
    r"""(
      \b\d{1,2}[:.]\d{2}\b            # a clock time
    | \b(?:at|by|before|after)\s+\d   # "at 1", "by 2"
    | \b(?:minutes?|seconds?|hours?)\b
    | \b(?:i\s+(?:was|went|drove|saw|heard|called|rang|locked|moved|left|arrived))\b
    | \b(?:he|she|they)\s+(?:was|went|drove|saw|called|rang|left|arrived)\b
    | \b(?:the\s+(?:car|keys|ford|light|porch|gate))\b
    )""",
    re.IGNORECASE | re.VERBOSE,
)

THINK = re.compile(r"<think>.*?</think>", re.DOTALL | re.IGNORECASE)
FENCE = re.compile(r"```(?:json)?\s*(.*?)\s*```", re.DOTALL)


def strip_think(text: str) -> str:
    """Remove reasoning blocks. Required by the guide before using any output."""
    return THINK.sub("", text).strip()


def extract_json(text: str) -> dict:
    """Pull the first JSON object out of a reply, fenced or bare."""
    text = strip_think(text)
    fenced = FENCE.search(text)
    if fenced:
        text = fenced.group(1)
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise ValueError(f"no JSON object in reply: {text[:200]!r}")
    return json.loads(text[start : end + 1])


def call_rupert(prompt: str, model: str = DEFAULT_MODEL, attempts: int = 4) -> str:
    """One streamed chat completion, with backoff. Returns assembled text.

    Streaming is not an optimisation here — a non-streamed call to this gateway
    is terminated by Cloudflare at 100s, which for the 122b is inside its normal
    response time.
    """
    if not KEY:
        raise RuntimeError("OPENWEBUI_API_KEY missing (expected in D:\\Indie\\Rupert\\.env)")

    body = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.8,
        "stream": True,
    }

    last: Exception | None = None
    for attempt in range(attempts):
        try:
            chunks: list[str] = []
            with httpx.stream(
                "POST",
                f"{BASE}/chat/completions",
                headers={"Authorization": f"Bearer {KEY}"},
                json=body,
                timeout=180.0,
            ) as r:
                if r.status_code in (429, 500, 502, 503, 504):
                    r.read()
                    raise httpx.HTTPStatusError(
                        f"HTTP {r.status_code}", request=r.request, response=r
                    )
                r.raise_for_status()
                for line in r.iter_lines():
                    if not line or not line.startswith("data:"):
                        continue
                    payload = line[5:].strip()
                    if payload == "[DONE]":
                        break
                    try:
                        delta = json.loads(payload)["choices"][0].get("delta", {})
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue
                    piece = delta.get("content")
                    if piece:
                        chunks.append(piece)
            return "".join(chunks)
        except Exception as e:  # noqa: BLE001 — every transport failure is retryable
            last = e
            if attempt < attempts - 1:
                wait = 3 * (attempt + 1)
                print(f"      retry in {wait}s ({type(e).__name__})", flush=True)
                time.sleep(wait)
    raise RuntimeError(f"rupert call failed after {attempts} attempts: {last}")


class TimelineVoice:
    """Dialogue variation for one timeline, inside that timeline's register."""

    def __init__(self, timeline: str, model: str = DEFAULT_MODEL):
        if timeline not in BRIEFS:
            raise ValueError(f"unknown timeline: {timeline}")
        self.timeline = timeline
        self.brief = BRIEFS[timeline]
        self.model = model

    def _preamble(self) -> str:
        b = self.brief
        rules = "\n".join(f"  - {c}" for c in b["constraints"])
        return (
            f"You are writing dialogue for {b['name']} in a narrative game.\n"
            f"REGISTER: {b['register']}\n"
            f"CHARACTER RULES:\n{rules}\n"
        )

    def rephrase(self, original: str, n: int = 3) -> list[str]:
        """Say the same thing differently. Facts must survive verbatim."""
        prompt = (
            f"{self._preamble()}\n"
            f'LINE:\n"{original}"\n\n'
            f"Write {n} alternative ways this character says this EXACT same thing.\n"
            "Every name, number, time, place and action must be preserved.\n"
            "Add nothing. Remove nothing. Only the wording changes.\n\n"
            'Reply with JSON only: {"rephrasings": ["...", "...", "..."]}'
        )
        try:
            data = extract_json(call_rupert(prompt, self.model))
            out = [str(s).strip() for s in data.get("rephrasings", []) if str(s).strip()]
            return [s for s in out if self._facts_survive(original, s)]
        except Exception as e:  # noqa: BLE001
            print(f"      rephrase failed: {e}", flush=True)
            return []

    def expand(self, line: str, context: str = "") -> str:
        """Add texture to an approved line. Returns the line unchanged on doubt."""
        prompt = (
            f"{self._preamble()}\n"
            f'APPROVED LINE:\n"{line}"\n\n'
            f"CONTEXT: {context or 'none'}\n\n"
            "Add one short sentence of emotional or sensory texture AFTER this line.\n"
            "Introduce NO new fact: no times, no places, no people, no actions,\n"
            "nothing a listener could later check or contradict.\n\n"
            'Reply with JSON only: {"expanded": "<the original line plus your sentence>"}'
        )
        try:
            data = extract_json(call_rupert(prompt, self.model))
            expanded = str(data.get("expanded", "")).strip()
            # An expansion that dropped the original isn't an expansion.
            return expanded if expanded and line[:24].lower() in expanded.lower() else line
        except Exception as e:  # noqa: BLE001
            print(f"      expand failed: {e}", flush=True)
            return line

    def generate(self, question: str, context: str = "") -> tuple[str, str]:
        """Answer an unscripted question.

        Returns (text, source) where source is 'model' if a generation survived
        both gates, or 'deflection' if it was refused and the authored fallback
        is being used. The caller always gets something printable.
        """
        prompt = (
            f"{self._preamble()}\n"
            f'The player has asked something the script does not answer:\n"{question}"\n\n'
            f"CONTEXT: {context or 'none'}\n\n"
            "Answer in two or three sentences, in register.\n"
            "You must NOT state any checkable fact — no times, locations, actions,\n"
            "sequences or named people. Deflect, reframe, or give feeling instead.\n\n"
            'Reply with JSON only: {"generated": "..."}'
        )
        fallback = self.brief["deflection"]
        try:
            data = extract_json(call_rupert(prompt, self.model))
            text = str(data.get("generated", "")).strip()
        except Exception as e:  # noqa: BLE001
            print(f"      generate failed: {e}", flush=True)
            return fallback, "deflection"

        if not text:
            return fallback, "deflection"
        # Cheap gate first: it cannot hallucinate, so it is the one to trust.
        if CLAIMY.search(text):
            return fallback, "deflection"
        if self._reads_as_claim(text):
            return fallback, "deflection"
        return text, "model"

    # -- gates ---------------------------------------------------------------

    @staticmethod
    def _facts_survive(original: str, variant: str) -> bool:
        """Every number in the original must still be in the variant."""
        want = set(re.findall(r"\d+", original))
        have = set(re.findall(r"\d+", variant))
        return want.issubset(have)

    def _reads_as_claim(self, text: str) -> bool:
        """Model-side check. Fails open: an error must not block dialogue."""
        prompt = (
            "In a mystery game, a CLAIM is a checkable assertion about a specific "
            "night: a time, a place, an action, a sequence, who was where.\n\n"
            f'Line: "{text}"\n\n'
            "Classify it.\n"
            'Reply with JSON only: {"classification": "CLAIM" | "DEFLECTION" | "TEXTURE"}'
        )
        try:
            data = extract_json(call_rupert(prompt, self.model))
            return str(data.get("classification", "")).upper() == "CLAIM"
        except Exception as e:  # noqa: BLE001
            print(f"      classifier unavailable ({type(e).__name__}); allowing", flush=True)
            return False


# ---------------------------------------------------------------------------
# Tests. These hit the live gateway, so they are a smoke check rather than a
# gate — nothing in `npm run gate` depends on Rupert being up.
# ---------------------------------------------------------------------------

REPHRASE_CASES = [
    ("t3", "i've still got them. twenty years. they're in a drawer."),
    ("t7", "I know what can be undone inside fifteen minutes, and I know what can't."),
]
EXPAND_CASES = [
    ("t3", "i wasn't in a state to go and see who it was.", "he is describing the porch"),
]
GENERATE_CASES = [
    ("t3", "What was she like?"),
    ("t7", "What are you not telling me?"),
    ("t12", "Are you lying to me?"),
    # Deliberately factual: this one SHOULD be refused by the gates.
    ("t7", "What time did you get to the ford?"),
]


def test_rephrase() -> int:
    # flush everywhere: the 27b can take a minute per call when it's loaded, and
    # buffered output makes a slow run look like a hung one.
    print("\n=== REPHRASE ===", flush=True)
    for tl, line in REPHRASE_CASES:
        print(f"\n  [{tl}] {line}", flush=True)
        for v in TimelineVoice(tl).rephrase(line):
            print(f"    -> {v}", flush=True)
    return 0


def test_expand() -> int:
    print("\n=== EXPAND ===")
    for tl, line, ctx in EXPAND_CASES:
        print(f"\n  [{tl}] {line}")
        print(f"    -> {TimelineVoice(tl).expand(line, ctx)}")
    return 0


def test_generate() -> int:
    print("\n=== GENERATE (gates active) ===")
    for tl, q in GENERATE_CASES:
        text, source = TimelineVoice(tl).generate(q)
        print(f"\n  [{tl}] Q: {q}")
        print(f"    {source:10s} {text}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--test", choices=["rephrase", "expand", "generate", "all"])
    args = ap.parse_args()

    if not args.test:
        ap.print_help()
        return 0
    if not KEY:
        print("OPENWEBUI_API_KEY missing — cannot reach Rupert", file=sys.stderr)
        return 2

    if args.test in ("rephrase", "all"):
        test_rephrase()
    if args.test in ("expand", "all"):
        test_expand()
    if args.test in ("generate", "all"):
        test_generate()
    return 0


if __name__ == "__main__":
    sys.exit(main())
