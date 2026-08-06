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


# ---------------------------------------------------------------------------
# FIDELITY GATE
#
# The first version of this gate checked that every number in the original
# survived in the variant. docs/LLM_FINDINGS.md records what got through it:
#
#   T-3  "i've still got them. twenty years. they're in a drawer."
#     ->  "... and i'm sorry if i mess up the count but it's been that long ..."
#        An ADDITION. New content, plausible and in voice, and a
#        characterisation decision nobody approved — it softens the one fact he
#        is certain about.
#
#   T-7  "I know what can be undone inside fifteen minutes, and I know what can't."
#     ->  "I know what can't be undone inside fifteen minutes, and I know what can."
#        A POLARITY INVERSION. Opposite meaning, every number intact.
#
# Both preserved "twenty"/"fifteen", so number-preservation passed both. It was
# the wrong invariant: cheap, and measuring almost nothing.
#
# The cosine-similarity gate proposed in LLM_INTEGRATION.md would also have
# passed the inversion — bag-of-words similarity is near-blind to negation,
# because "can" and "can't" are one token apart and stopword lists often drop
# both.
#
# So this gate checks the two things that actually went wrong. It is a
# heuristic, not entailment; what it has going for it is that it demonstrably
# rejects both recorded failures, which `--selftest` proves without touching the
# gateway. Anything it passes still needs a human before it reaches a player.
# ---------------------------------------------------------------------------

# Words that flip or scope a claim. Order matters, so this is a sequence check
# rather than a set check: the T-7 failure preserved the multiset of negations
# and only changed which clause each one attached to.
NEGATORS = {
    "not", "n't", "never", "no", "none", "nobody", "nothing", "cannot",
    "can't", "couldn't", "wouldn't", "didn't", "wasn't", "weren't", "isn't",
    "aren't", "won't", "doesn't", "don't", "hadn't", "hasn't", "haven't",
}

# Ignored when looking for added content: function words carry no claim.
STOPISH = {
    "a", "an", "and", "the", "but", "or", "so", "if", "it", "its", "i", "me",
    "my", "you", "your", "he", "him", "his", "she", "her", "they", "them",
    "we", "us", "that", "this", "these", "those", "then", "than", "of", "in",
    "on", "at", "to", "for", "with", "from", "by", "as", "is", "was", "were",
    "be", "been", "am", "are", "do", "did", "does", "have", "has", "had",
    "what", "who", "when", "where", "how", "why", "just", "about", "up",
    "out", "off", "over", "there", "here", "yeah", "oh", "well", "like",
    "know", "think", "mean", "say", "said", "get", "got", "go", "going",
    "one", "still", "all", "any", "some", "very", "really", "too", "also",
}

WORD = re.compile(r"[a-z']+")

# Spelled-out quantities. The digit check alone misses "twenty years" -> "years",
# which is a deletion rather than an addition and so slips past both other
# checks. In this game the facts ARE times, counts and durations, so they must
# survive in either notation. Kept deliberately narrow: a general
# dropped-content-word check flags honest paraphrase far too often.
NUMBER_WORDS = {
    "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen", "twenty", "thirty", "forty", "fifty",
    "sixty", "hundred", "half", "quarter", "dozen", "twice", "single",
}

# Tuned against the recorded failures: the T-3 addition brought in 4 new content
# words ("sorry", "mess", "count", "foggy"/"hope"). Legitimate rewording of these
# short lines introduces 0-1. Two is the honest line between them.
MAX_ADDED_WORDS = 2


def _words(text: str) -> list[str]:
    return WORD.findall(text.lower().replace("’", "'"))


def polarity_sequence(text: str) -> list[tuple[str, str | None]]:
    """Each negation paired with the next content word it scopes over.

    The naive version of this — just the ordered list of negation words — does
    NOT catch the T-7 inversion, which was the whole reason for writing it. Both
    sentences contain exactly one "can't"; the inversion only changes which
    clause it attaches to, so the multiset and the order are identical.

    Pairing each negator with the next content word after it discriminates,
    because that is precisely what moved:

        original  "...and I know what can't."          -> [("can't", None)]
        inverted  "I know what can't be undone ..."    -> [("can't", "undone")]

    A legitimate reword that keeps the negation on the same clause keeps the same
    anchor, so honest paraphrase still passes.
    """
    words = _words(text)
    out: list[tuple[str, str | None]] = []
    for i, w in enumerate(words):
        if w not in NEGATORS:
            continue
        anchor = next(
            (n for n in words[i + 1 :] if n not in STOPISH and n not in NEGATORS and len(n) > 2),
            None,
        )
        out.append((w, anchor))
    return out


def added_content_words(original: str, variant: str) -> set[str]:
    """Content words present in the variant and absent from the original."""
    before = set(_words(original))
    return {w for w in _words(variant) if w not in before and w not in STOPISH and len(w) > 2}


def check_fidelity(original: str, variant: str) -> list[str]:
    """Return a list of reasons the variant is unfaithful. Empty list = passes."""
    problems: list[str] = []

    want_nums = set(re.findall(r"\d+", original))
    have_nums = set(re.findall(r"\d+", variant))
    if not want_nums.issubset(have_nums):
        problems.append(f"dropped number(s): {sorted(want_nums - have_nums)}")

    want_words = {w for w in _words(original) if w in NUMBER_WORDS}
    have_words = {w for w in _words(variant) if w in NUMBER_WORDS}
    if not want_words.issubset(have_words):
        problems.append(f"dropped quantity word(s): {sorted(want_words - have_words)}")

    before, after = polarity_sequence(original), polarity_sequence(variant)
    if before != after:
        problems.append(f"polarity changed: {before} -> {after}")

    added = added_content_words(original, variant)
    if len(added) > MAX_ADDED_WORDS:
        problems.append(f"added {len(added)} content word(s): {sorted(added)[:6]}")

    return problems


def check_expansion(original: str, expanded: str) -> list[str]:
    """EXPAND is held to a stricter, mechanical standard.

    An expansion appends texture and must leave the approved sentence untouched,
    so the original has to survive VERBATIM as a prefix. That is not a heuristic
    — it cannot be argued with, which is exactly why EXPAND is the operation
    worth shipping first (LLM_FINDINGS.md, "narrow the operation").
    """
    problems: list[str] = []
    o, e = original.strip(), expanded.strip()
    if not e.lower().startswith(o.lower()):
        problems.append("original line not preserved verbatim as a prefix")
    if len(e) <= len(o):
        problems.append("nothing was added")
    tail = e[len(o) :] if e.lower().startswith(o.lower()) else e
    if CLAIMY.search(tail):
        problems.append("appended texture contains something checkable")
    return problems


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
        """Composite fidelity gate. See `check_fidelity` for the reasoning."""
        return not check_fidelity(original, variant)

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


# ---------------------------------------------------------------------------
# Offline gate regression. No network, so it can run in CI.
#
# The two REJECT cases are the real model outputs recorded verbatim in
# docs/LLM_FINDINGS.md. They are the reason this gate was rewritten, so they are
# the cases it must never stop catching.
# ---------------------------------------------------------------------------

FIDELITY_CASES: list[tuple[str, str, str, bool]] = [
    # (label, original, variant, should_pass)
    (
        "T-3 addition (LLM_FINDINGS)",
        "i've still got them. twenty years. they're in a drawer.",
        "i've still got them twenty years they're in a drawer and i'm sorry if i "
        "mess up the count but it's been that long yeah in a drawer",
        False,
    ),
    (
        "T-3 addition, second variant (LLM_FINDINGS)",
        "i've still got them. twenty years. they're in a drawer.",
        "twenty years still got them they're in a drawer i think i mean i hope "
        "it's still twenty because my head is foggy but yeah in a drawer",
        False,
    ),
    (
        "T-7 polarity inversion (LLM_FINDINGS)",
        "I know what can be undone inside fifteen minutes, and I know what can't.",
        "I know what can't be undone inside fifteen minutes, and I know what can.",
        False,
    ),
    (
        "dropped a digit",
        "01:38 — she makes a call. Forty seconds, give or take.",
        "She made a call late that night. Not a long one.",
        False,
    ),
    (
        "vaguened a spelled-out number",
        "i've still got them. twenty years. they're in a drawer.",
        "i've still got them. years. they're in a drawer.",
        False,
    ),
    # Honest rewordings that SHOULD survive, so the gate isn't just "reject all".
    (
        "faithful reword, T-7",
        "I know what can be undone inside fifteen minutes, and I know what can't.",
        "I know what can be undone inside fifteen minutes. And I know what can't.",
        True,
    ),
    (
        "faithful reword, T-3",
        "i've still got them. twenty years. they're in a drawer.",
        "i've got them still. twenty years. in a drawer.",
        True,
    ),
]

EXPANSION_CASES: list[tuple[str, str, str, bool]] = [
    (
        "clean append",
        "i wasn't in a state to go and see who it was.",
        "i wasn't in a state to go and see who it was. i've gone over that a lot since.",
        True,
    ),
    (
        "rewrote the approved line",
        "i wasn't in a state to go and see who it was.",
        "i was too far gone to check. i've gone over that a lot since.",
        False,
    ),
    (
        "appended a checkable fact",
        "i wasn't in a state to go and see who it was.",
        "i wasn't in a state to go and see who it was. i was in the car until 02:00.",
        False,
    ),
    (
        "added nothing",
        "i wasn't in a state to go and see who it was.",
        "i wasn't in a state to go and see who it was.",
        False,
    ),
]


def selftest() -> int:
    """Prove the gate rejects the recorded failures. Runs offline."""
    failures = 0

    print("=== fidelity gate (REPHRASE) ===")
    for label, original, variant, should_pass in FIDELITY_CASES:
        problems = check_fidelity(original, variant)
        passed = not problems
        ok = passed == should_pass
        failures += 0 if ok else 1
        verdict = "PASS" if passed else "REJECT"
        want = "expected PASS" if should_pass else "expected REJECT"
        mark = "\033[32m ok \033[0m" if ok else "\033[31mFAIL\033[0m"
        print(f"  {mark} {verdict:6s} {label}   ({want})")
        for p in problems:
            print(f"           - {p}")

    print("\n=== expansion gate (EXPAND) ===")
    for label, original, expanded, should_pass in EXPANSION_CASES:
        problems = check_expansion(original, expanded)
        passed = not problems
        ok = passed == should_pass
        failures += 0 if ok else 1
        verdict = "PASS" if passed else "REJECT"
        want = "expected PASS" if should_pass else "expected REJECT"
        mark = "\033[32m ok \033[0m" if ok else "\033[31mFAIL\033[0m"
        print(f"  {mark} {verdict:6s} {label}   ({want})")
        for p in problems:
            print(f"           - {p}")

    total = len(FIDELITY_CASES) + len(EXPANSION_CASES)
    print(
        f"\ngate selftest: {'\033[32mPASS\033[0m' if not failures else '\033[31mFAIL\033[0m'}"
        f"  {total - failures}/{total} cases"
    )
    return 1 if failures else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--test", choices=["rephrase", "expand", "generate", "all"])
    ap.add_argument(
        "--selftest",
        action="store_true",
        help="offline gate regression against the failures in LLM_FINDINGS.md",
    )
    args = ap.parse_args()

    if args.selftest:
        return selftest()

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
