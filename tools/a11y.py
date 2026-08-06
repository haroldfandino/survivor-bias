# /// script
# requires-python = ">=3.11"
# dependencies = ["httpx", "python-dotenv", "numpy"]
# ///
r"""Accessibility audit: WCAG contrast, and colour-blind separation of the grades.

Two things this game is unusually exposed on:

1. It is almost entirely small text on near-black, and a lot of it is 10px mono
   micro-labels. At that size WCAG treats everything as "normal" text, so the bar
   is 4.5:1 — not the 3:1 that large text gets.

2. **A timeline is identified by its colour.** design/style-lock.md makes the
   per-branch grade the primary visual language, which is a real accessibility
   risk: if two grades collapse under a common colour-vision deficiency, the
   player loses the ability to tell who sent a piece of evidence. Labels carry
   the same information in text, so nothing becomes unplayable — but the grades
   should still hold up, and that is measurable rather than assumable.

Contrast comes from Rupert's `/v1/color/contrast` (wcag-contrast-ratio). CVD
simulation is done locally with the standard Brettel/Viénot matrices — no need
for another undocumented endpoint, and it stays deterministic.

Usage: uv run --script tools/a11y.py
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import httpx
import numpy as np
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
TOKENS = json.loads((ROOT / "design" / "survivor-bias-tokens.json").read_text(encoding="utf-8"))

load_dotenv(Path(r"D:\Indie\Rupert\.env"))
KEY = (os.environ.get("OPENWEBUI_API_KEY") or "").strip()
ROOT_URL = (os.environ.get("RUPERT_ROOT_URL") or "https://rupert.indieio.dev").rstrip("/")

C = TOKENS["chrome"]
T = TOKENS["timelines"]

BG = C["bg"]
RAISED = C["bg-raised"]
INPUT = C["bg-input"]

# Every foreground/background pair the UI actually renders, with the size class
# so the right WCAG threshold is applied.
PAIRS = [
    ("message text", C["ink"], RAISED, "normal"),
    ("message text on sent bubble", C["ink"], "#1E242D", "normal"),
    ("contact preview", C["ink-dim"], BG, "normal"),
    ("evidence label", C["ink-dim"], RAISED, "normal"),
    ("micro-label (10px mono)", C["ink-faint"], BG, "normal"),
    ("micro-label on raised", C["ink-faint"], RAISED, "normal"),
    ("micro-label on input", C["ink-faint"], INPUT, "normal"),
    ("contested flag", C["accent-text"], RAISED, "normal"),
    ("restart confirm", C["accent-text"], RAISED, "normal"),
    ("TONIGHT label", C["accent-text"], BG, "normal"),
    # The unread badge is the one place accent is a FILL, with white on top.
    ("unread badge", "#FFFFFF", C["accent"], "normal"),
    # Derived from the token file rather than listed, so adding a self cannot
    # add an unchecked colour. Every branch key is checked against both the page
    # and the raised bubble it can sit on.
    *[
        (f"{T[k]['label']} name", T[k]["key"], BG, "normal")
        for k in ("t2", "t3", "t7", "t9", "t11", "t12")
    ],
    *[
        (f"{T[k]['label']} name on bubble", T[k]["key"], RAISED, "normal")
        for k in ("t2", "t3", "t7", "t9", "t11", "t12")
    ],
    ("YOU on convergence", T["prime"]["key"], BG, "normal"),
]

AA = {"normal": 4.5, "large": 3.0}


def contrast(fg: str, bg: str) -> dict:
    r = httpx.post(
        f"{ROOT_URL}/v1/color/contrast",
        headers={"Authorization": f"Bearer {KEY}"},
        json={"foreground": fg, "background": bg},
        timeout=30.0,
    )
    r.raise_for_status()
    return r.json()


# --- colour-vision deficiency simulation ------------------------------------
# Viénot/Brettel linear-RGB matrices for full dichromacy.
CVD = {
    "protanopia": np.array([[0.1121, 0.8853, -0.0005], [0.1127, 0.8897, -0.0001], [0.0045, 0.0000, 1.0019]]),
    "deuteranopia": np.array([[0.2920, 0.7054, -0.0003], [0.2934, 0.7089, 0.0000], [-0.0209, 0.0270, 0.9942]]),
    "tritanopia": np.array([[1.0175, 0.1123, -0.1148], [-0.0102, 0.0858, 0.9244], [0.0439, 0.9707, -0.0148]]),
}


def hex_to_linear(h: str) -> np.ndarray:
    h = h.lstrip("#")
    srgb = np.array([int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)])
    return np.where(srgb <= 0.04045, srgb / 12.92, ((srgb + 0.055) / 1.055) ** 2.4)


def linear_to_lab(lin: np.ndarray) -> np.ndarray:
    m = np.array(
        [[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]]
    )
    xyz = m @ np.clip(lin, 0, 1)
    white = np.array([0.9505, 1.0, 1.089])
    t = xyz / white
    f = np.where(t > 0.008856, np.cbrt(t), 7.787 * t + 16 / 116)
    return np.array([116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2])])


def delta_e(a: str, b: str, matrix: np.ndarray | None = None) -> float:
    la, lb = hex_to_linear(a), hex_to_linear(b)
    if matrix is not None:
        la, lb = matrix @ la, matrix @ lb
    return float(np.linalg.norm(linear_to_lab(la) - linear_to_lab(lb)))


def main() -> int:
    if not KEY:
        sys.exit("OPENWEBUI_API_KEY missing")

    print("WCAG contrast (AA needs 4.5:1 for normal text; every label here is normal)\n")
    failures = []
    for name, fg, bg, size in PAIRS:
        res = contrast(fg, bg)
        ratio = res["ratio"]
        need = AA[size]
        ok = ratio >= need
        mark = "\033[32mpass\033[0m" if ok else "\033[31mFAIL\033[0m"
        aaa = " AAA" if res.get("aaa_normal") else ""
        print(f"  {mark} {ratio:6.2f}:1  {name:28s} {fg} on {bg}{aaa}")
        if not ok:
            failures.append((name, fg, bg, ratio, need))

    print("\nBranch-grade separation under colour-vision deficiency")
    print("  (deltaE; <10 means two timelines start looking alike)\n")
    keys = {k: T[k]["key"] for k in ("t2", "t3", "t7", "t9", "t11", "t12")}
    collapses = []
    for cvd, matrix in [("normal vision", None), *CVD.items()]:
        m = None if matrix is None else matrix
        row = []
        pairs = [(a, b) for i, a in enumerate(keys) for b in list(keys)[i + 1 :]]
        for a, b in pairs:
            d = delta_e(keys[a], keys[b], m)
            row.append(f"{a}/{b} {d:5.1f}")
            if d < 10:
                collapses.append((cvd, a, b, d))
        print(f"  {cvd:14s} " + "   ".join(row))

    print()
    if failures:
        print(f"\033[31m{len(failures)} contrast failure(s):\033[0m")
        for name, fg, bg, ratio, need in failures:
            print(f"  {name}: {ratio:.2f}:1, needs {need}:1 ({fg} on {bg})")
    if collapses:
        print(f"\033[33m{len(collapses)} grade pair(s) close under CVD:\033[0m")
        for cvd, a, b, d in collapses:
            print(f"  {cvd}: {a} vs {b} deltaE {d:.1f}")
    if not failures and not collapses:
        print("\033[32mall pairs pass AA and all grades stay separable\033[0m")

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
