# /// script
# requires-python = ">=3.11"
# dependencies = ["openai", "httpx", "python-dotenv", "Pillow"]
# ///
r"""Generate the portraits and evidence stills, and grade them to the style lock.

WHY THE PIPELINE LOOKS LIKE THIS
--------------------------------
Local ComfyUI has no ControlNet, no LoRAs and no SDXL checkpoint, so there is no
way to force one face to stay the same face across generations. For a game about
one man in three timelines, drifting faces read as a bug.

So the art direction makes the mediation the style (design/style-lock.md):
every image is presented as evidence — a call frame, a security still, a scan —
and the grading here does the heavy lifting:

  * one duotone grade per branch, so a timeline is legible by colour alone
  * heavy grain and a hard vignette, so inconsistency reads as transmission noise
  * portraits are small circular crops, the most forgiving format there is

Faces are prompted half-shadowed and off-angle on purpose. Drift becomes mood.

The LPIPS gate then keeps the three portraits inside a band: similar enough to be
one man, different enough to be three lives. That's measured, not eyeballed.

Usage:
    uv run --script tools/gen_art.py              # generate everything missing
    uv run --script tools/gen_art.py --force      # regenerate everything
    uv run --script tools/gen_art.py --only t3    # one asset
    uv run --script tools/gen_art.py --check      # re-run the gates, no generation
"""

from __future__ import annotations

import argparse
import base64
import io
import json
import os
import random
import sys
from pathlib import Path

import httpx
from dotenv import load_dotenv
from openai import OpenAI
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
RUPERT_ENV = Path(r"D:\Indie\Rupert\.env")
TOKENS = json.loads((ROOT / "design" / "survivor-bias-tokens.json").read_text(encoding="utf-8"))

RAW = ROOT / "assets" / "_raw"          # ungraded generations, kept for re-grading
PORTRAITS = ROOT / "public" / "portraits"
EVIDENCE = ROOT / "public" / "evidence"

load_dotenv(RUPERT_ENV)
API_KEY = (os.environ.get("OPENWEBUI_API_KEY") or "").strip()
ROOT_URL = (os.environ.get("RUPERT_ROOT_URL") or "https://rupert.indieio.dev").rstrip("/")
BASE_URL = (os.environ.get("RUPERT_BASE_URL") or "https://rupert.indieio.dev/api/v1/").rstrip("/")

# Shared prompt tail. Keeps every asset in the same photographic world so the
# grade lands consistently.
LOOK = (
    "photographic, 35mm, harsh single light source, deep shadows, "
    "heavy film grain, slightly out of focus, amateur photo, no text, no watermark"
)

# One man, three lives. Faces deliberately obscured — see module docstring.
PORTRAIT_PROMPTS = {
    "t3": (
        "close portrait of a tired unshaven white man in his early forties sitting in a "
        "parked car at night, face half lit by an orange sodium streetlight through the "
        "windscreen, looking down and away from camera, heavy bags under eyes, "
        "cheap jacket, " + LOOK
    ),
    "t7": (
        "close portrait of a composed clean-shaven white man in his early forties under "
        "flat green fluorescent hospital lighting, paramedic uniform collar visible, "
        "three-quarter profile, face partly in shadow, unreadable expression, " + LOOK
    ),
    "t12": (
        "close portrait of a well-groomed white man in his early forties by a window at "
        "cold blue pre-dawn light, expensive open-collar shirt, turned away from camera "
        "so most of the face is in shadow, controlled, " + LOOK
    ),
    "nell": (
        "candid photo of a nineteen year old white woman with dark hair laughing, "
        "warm kitchen light at a house party at night, slightly blurred motion, "
        "snapshot taken by a family member, " + LOOK
    ),
}

# Places and objects — no faces, so no consistency problem at all. This is where
# the real art weight goes.
EVIDENCE_PROMPTS = {
    "ford_night_01": (
        "a shallow river ford crossing a country road at night, water running high over "
        "flat stones, edges of the road invisible under the water, a single streetlight "
        "further up the lane, wet tarmac, nobody present, " + LOOK
    ),
    "porch_night": (
        "the wooden porch of a rural house at night seen from a distance across a dark "
        "garden, warm light spilling from the open front door, two indistinct figures "
        "standing on the porch too far away to identify, " + LOOK
    ),
    "verge_dawn": (
        "a grass verge beside a narrow country lane at grey dawn, three parked cars in a "
        "row and one obvious empty gap between them, flattened grass, overcast, "
        "nobody present, " + LOOK
    ),
    # BLANK on purpose. flux cannot write — its first attempt at this produced
    # convincing-looking gibberish, which is worse than nothing for a document
    # the player is invited to read. The real times are drawn on in
    # compose_timeline() so the 01:40 -> 01:55 gap is legible on the page. That
    # turns the central mystery into something you can see.
    "timeline_scan": (
        "a blank sheet of pale lined exercise paper, creased from being folded in four, "
        "slightly yellowed, photographed flat on a dark wooden table, completely empty, "
        "no writing, no text, no marks, " + LOOK
    ),
}

# Per-branch duotone, pulled from the style lock so there is one source of truth.
GRADES = {
    "t3": TOKENS["timelines"]["t3"]["duotone"],
    "t7": TOKENS["timelines"]["t7"]["duotone"],
    "t12": TOKENS["timelines"]["t12"]["duotone"],
    "nell": ["#1A1008", "#F2D9B0"],   # warm — she is the only warm thing in the game
    # Evidence inherits the grade of whoever sends it.
    "ford_night_01": TOKENS["timelines"]["t3"]["duotone"],
    "porch_night": TOKENS["timelines"]["t3"]["duotone"],
    "timeline_scan": TOKENS["timelines"]["t7"]["duotone"],
    "verge_dawn": TOKENS["timelines"]["t12"]["duotone"],
}

GRAIN = TOKENS["grain"]


# ---------------------------------------------------------------------------
# generation
# ---------------------------------------------------------------------------

def client() -> OpenAI:
    if not API_KEY:
        sys.exit(f"OPENWEBUI_API_KEY missing from {RUPERT_ENV}")
    return OpenAI(base_url=BASE_URL, api_key=API_KEY, timeout=180.0, max_retries=3)


def generate(name: str, prompt: str) -> Path:
    """flux is 1024x1024-only through the SDK. Raw output is cached in _raw/."""
    RAW.mkdir(parents=True, exist_ok=True)
    out = RAW / f"{name}.png"
    resp = client().images.generate(model="flux", prompt=prompt, size="1024x1024")
    item = resp.data[0]
    if getattr(item, "b64_json", None):
        out.write_bytes(base64.b64decode(item.b64_json))
    elif getattr(item, "url", None):
        out.write_bytes(httpx.get(item.url, timeout=120.0).content)
    else:
        sys.exit(f"{name}: flux returned no image data")
    return out


# ---------------------------------------------------------------------------
# grading — this is what makes generated art look like one game
# ---------------------------------------------------------------------------

def grade(src: Path, name: str, *, circular: bool, size: int) -> Image.Image:
    img = Image.open(src).convert("RGB")

    # The document gets its real contents written on before grading, so the ink
    # picks up the same duotone and grain as everything else.
    if name == "timeline_scan":
        img = compose_timeline(img)

    # Crop to square from slightly above centre — faces sit high in a portrait.
    w, h = img.size
    side = min(w, h)
    top = int((h - side) * 0.35)
    img = img.crop(((w - side) // 2, top, (w - side) // 2 + side, top + side))
    img = img.resize((size, size), Image.LANCZOS)

    # Duotone. The single biggest unifier: whatever flux gave us, it now lives in
    # this branch's two colours.
    shadow, light = GRADES.get(name, ["#0B0D10", "#E4E6EA"])
    duo = ImageOps.colorize(ImageOps.grayscale(img), black=shadow, white=light)
    img = Image.blend(img, duo, 0.86)

    img = ImageEnhance.Contrast(img).enhance(1.18)

    # Grain, scaled by the style lock so it matches the CSS overlay in the app.
    noise = Image.effect_noise((size, size), 22).convert("L")
    if GRAIN["scale"] != 1:
        small = (max(1, int(size / GRAIN["scale"])),) * 2
        noise = noise.resize(small, Image.NEAREST).resize((size, size), Image.BILINEAR)
    img = Image.blend(img, Image.merge("RGB", (noise, noise, noise)), GRAIN["opacity"] * 2.2)

    # Chromatic aberration: nudge the red and blue channels apart by a subpixel
    # amount. Cheap, and it reads as a photograph of a screen.
    off = max(1, round(GRAIN["aberration-px"]))
    r, g, b = img.split()
    r = ImageChops_offset(r, off)
    b = ImageChops_offset(b, -off)
    img = Image.merge("RGB", (r, g, b))

    # Hard vignette — pushes the frame edges down so nothing reads as a clean
    # studio render, and hides whatever flux did in the corners.
    img = apply_vignette(img, strength=0.55 if circular else 0.34)

    if circular:
        img = img.convert("RGBA")
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
        img.putalpha(mask.filter(ImageFilter.GaussianBlur(0.6)))

    return img


# The account T-7 gives in t7.ink, as he wrote it out. Keep in sync with
# story/t7.ink -> t7_night. The blank rows are the point: he accounts for every
# minute except 01:40 to 01:55, and on paper you can see the hole.
TIMELINE_ROWS = [
    ("23:10", "arrived. parked on the verge"),
    ("00:15", "she's inside. kitchen"),
    ("01:00", "still fine. laughing"),
    ("01:38", "call. 40 seconds. on the porch"),
    ("01:40", "comes off the porch"),
    ("", ""),
    ("", ""),
    ("", ""),
    ("01:55", "me — at the gate. alone"),
    ("02:05", "started looking"),
]

HAND = Path(r"C:\Windows\Fonts\Inkfree.ttf")


def compose_timeline(paper: Image.Image) -> Image.Image:
    """Draw T-7's real timeline onto the generated blank page.

    Deliberately hand-composited rather than generated: the player is meant to
    read this and notice what isn't on it.
    """
    img = paper.convert("RGB")
    size = img.size[0]
    draw = ImageDraw.Draw(img)

    try:
        font = ImageFont.truetype(str(HAND), int(size * 0.042))
        small = ImageFont.truetype(str(HAND), int(size * 0.034))
    except OSError:
        font = small = ImageFont.load_default()

    ink = (28, 42, 96)  # blue ballpoint
    x_time, x_note = int(size * 0.13), int(size * 0.34)
    y = int(size * 0.16)
    step = int(size * 0.072)

    # A slight rightward drift and jitter per line, so it reads as one sitting of
    # handwriting rather than a table.
    rng = random.Random(7)
    for i, (time_txt, note) in enumerate(TIMELINE_ROWS):
        jitter = rng.randint(-2, 2)
        drift = int(i * 1.2)
        if time_txt:
            draw.text((x_time + drift, y + jitter), time_txt, font=font, fill=ink)
            draw.text((x_note + drift, y + jitter + 2), note, font=small, fill=ink)
        y += step

    # He has gone over the two edges of the gap more than once.
    gap_top = int(size * 0.16) + 4 * step + int(size * 0.052)
    gap_bottom = int(size * 0.16) + 8 * step + int(size * 0.052)
    for dy in (0, 2):
        draw.line((x_time, gap_top + dy, int(size * 0.80), gap_top + dy), fill=ink, width=2)
        draw.line((x_time, gap_bottom + dy, int(size * 0.80), gap_bottom + dy), fill=ink, width=2)

    # And written in the margin, harder than the rest.
    draw.text(
        (int(size * 0.72), gap_top + int(size * 0.045)),
        "15 min",
        font=font,
        fill=(18, 28, 78),
    )

    return img


def ImageChops_offset(chan: Image.Image, dx: int) -> Image.Image:
    """Shift one channel horizontally, clamping at the edge."""
    out = Image.new("L", chan.size, 0)
    out.paste(chan, (dx, 0))
    return out


def apply_vignette(img: Image.Image, strength: float) -> Image.Image:
    size = img.size[0]
    grad = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(grad)
    steps = 48
    for i in range(steps):
        t = i / steps
        # Clamp short of the centre — past size/2 the ellipse bounds invert and
        # Pillow raises "x1 must be greater than or equal to x0".
        inset = min(int(t * size * 0.62), size // 2 - 1)
        value = int(255 * (1 - (t**2) * strength))
        draw.ellipse((inset, inset, size - inset, size - inset), fill=value)
    grad = grad.filter(ImageFilter.GaussianBlur(size / 22))
    black = Image.new("RGB", img.size, (0, 0, 0))
    return Image.composite(img, black, grad)


# ---------------------------------------------------------------------------
# gates
# ---------------------------------------------------------------------------

def rupert_image_post(path_frag: str, files: dict, data: dict | None = None):
    url = f"{ROOT_URL}/{path_frag.lstrip('/')}"
    r = httpx.post(
        url, headers={"Authorization": f"Bearer {API_KEY}"}, files=files, data=data or {}, timeout=120.0
    )
    r.raise_for_status()
    return r.json()


def lpips_gate(portraits: dict[str, Path]) -> list[str]:
    """Keep the three selves inside a similarity band.

    Too similar and they're the same photo re-graded; too different and they stop
    being one man. LPIPS is perceptual distance, so lower means more alike. The
    band is empirical — the run prints every pair so it can be re-tuned.
    """
    notes = []
    ids = [k for k in ("t3", "t7", "t12") if k in portraits]
    for i, a in enumerate(ids):
        for b in ids[i + 1 :]:
            try:
                res = rupert_image_post(
                    "/v1/image/similarity",
                    files={
                        "image1": (f"{a}.png", portraits[a].read_bytes(), "image/png"),
                        "image2": (f"{b}.png", portraits[b].read_bytes(), "image/png"),
                    },
                )
            except Exception as e:
                notes.append(f"  {a}/{b}: similarity check unavailable ({type(e).__name__})")
                continue
            payload = res.get("data", res)
            dist = None
            if isinstance(payload, dict):
                for key in ("lpips", "distance", "score", "similarity"):
                    if isinstance(payload.get(key), (int, float)):
                        dist = float(payload[key])
                        break
            if dist is None:
                notes.append(f"  {a}/{b}: unexpected payload {json.dumps(payload)[:120]}")
                continue
            verdict = "ok"
            if dist < 0.15:
                verdict = "TOO ALIKE — they read as one re-graded photo"
            elif dist > 0.78:
                verdict = "TOO DIFFERENT — they stop reading as the same man"
            notes.append(f"  {a}/{b}: {dist:.3f}  {verdict}")
    return notes


# NIMA aesthetic score below which an asset is worth regenerating. Established
# by measuring this set: the graded stills land 5.5-6.5, so 5.0 flags a genuine
# outlier rather than firing constantly.
NIMA_FLOOR = 5.0


def nima_scores(images: dict[str, Path]) -> list[str]:
    """NIMA aesthetic score, 1-10.

    The field is `file=`, not `image=` — `image=` 422s naming `file` as missing.
    The payload is flat (`mean_score`, `quality_label`), not wrapped in `data`.
    Neither is documented; both were established by probing.
    """
    notes = []
    for name, path in sorted(images.items()):
        try:
            res = rupert_image_post(
                "/v1/image/quality",
                files={"file": (path.name, path.read_bytes(), "image/webp")},
            )
        except Exception as e:
            notes.append(f"  {name}: quality check unavailable ({type(e).__name__})")
            continue

        score = res.get("mean_score")
        label = res.get("quality_label", "?")
        if not isinstance(score, (int, float)):
            notes.append(f"  {name}: unexpected payload {json.dumps(res)[:120]}")
            continue
        flag = "  <-- BELOW FLOOR, regenerate" if score < NIMA_FLOOR else ""
        notes.append(f"  {name}: {score:.2f}/10  ({label}){flag}")
    return notes


# ---------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="regenerate even if raw exists")
    ap.add_argument("--only", help="single asset name")
    ap.add_argument("--check", action="store_true", help="re-run gates only")
    args = ap.parse_args()

    PORTRAITS.mkdir(parents=True, exist_ok=True)
    EVIDENCE.mkdir(parents=True, exist_ok=True)

    jobs: list[tuple[str, str, bool, int, Path]] = []
    for name, prompt in PORTRAIT_PROMPTS.items():
        # Nell is shown full-frame in the ending, not as a circular avatar.
        circular = name != "nell"
        dest = (PORTRAITS if circular else EVIDENCE) / f"{name}.webp"
        jobs.append((name, prompt, circular, 320 if circular else 768, dest))
    for name, prompt in EVIDENCE_PROMPTS.items():
        jobs.append((name, prompt, False, 768, EVIDENCE / f"{name}.webp"))

    if args.only:
        jobs = [j for j in jobs if j[0] == args.only]
        if not jobs:
            sys.exit(f"unknown asset '{args.only}'")

    written: dict[str, Path] = {}
    total = 0
    for name, prompt, circular, size, dest in jobs:
        raw = RAW / f"{name}.png"
        if args.check:
            if dest.exists():
                written[name] = dest
            continue
        if raw.exists() and not args.force:
            print(f"  cached  {name}")
        else:
            print(f"  gen     {name} ...", flush=True)
            generate(name, prompt)

        img = grade(raw, name, circular=circular, size=size)
        # WebP, not PNG. These are heavily grained photographs, which PNG cannot
        # compress — the first pass shipped ~1MB per evidence still and 5.3MB
        # total, against a 104KB app bundle. WebP also carries the alpha the
        # circular portraits need, so one format covers both.
        if circular:
            img.save(dest, "WEBP", quality=92, method=6)
        else:
            img.convert("RGB").save(dest, "WEBP", quality=82, method=6)

        kb = dest.stat().st_size / 1024
        total += kb
        print(f"  graded  {name} -> {dest.relative_to(ROOT)}  ({kb:.0f} KB)")
        written[name] = dest

    if total:
        print(f"\n  total art payload: {total:.0f} KB")

    portraits = {k: v for k, v in written.items() if k in ("t3", "t7", "t12")}
    if len(portraits) >= 2:
        print("\nLPIPS drift gate (same man, three lives):")
        for line in lpips_gate(portraits):
            print(line)

    if written:
        print("\nNIMA aesthetic scores:")
        for line in nima_scores(written):
            print(line)

    print(f"\n{len(written)} asset(s) ready.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
