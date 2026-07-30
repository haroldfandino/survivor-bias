# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
r"""Build marketing/kit.html — a single portable review kit.

Same shape as the house precedent (iio-games/Divine-Ascendancy/marketing/
_kit_template.html): one self-contained HTML file with every asset base64-embedded,
so it can be dropped in Drive or opened from a Slack link with nothing else needed.
Themed to this game's own style lock rather than DA's gold-on-obsidian.

Everything in the kit is a REAL shipped asset — the portraits and stills are the
files the game loads, the voice notes are the real mp3s, and the convergence
diagram is the same SVG markup the game renders. Nothing here is a mockup, and
the one thing the kit cannot show (the chat UI in motion) is called out as such
rather than faked.

Usage: uv run --script tools/build_kit.py
"""

from __future__ import annotations

import base64
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "marketing" / "kit.html"
TOKENS = json.loads((ROOT / "design" / "survivor-bias-tokens.json").read_text(encoding="utf-8"))
VOICES = json.loads((ROOT / "src" / "voices.json").read_text(encoding="utf-8"))


def data_uri(path: Path, mime: str) -> str:
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode()}"


def img(name: str, folder: str) -> str:
    return data_uri(ROOT / "public" / folder / f"{name}.webp", "image/webp")


def audio(name: str) -> str:
    return data_uri(ROOT / "public" / "audio" / f"{name}.mp3", "audio/mpeg")


C = TOKENS["chrome"]
T = TOKENS["timelines"]

SELVES = [
    ("t3", "TIMELINE-3", "the one who stayed",
     "Never left town. Drinks. Was in the car. Talks the most and is the least reliable — "
     "he gives you the emotional truth and a lot of factual noise.",
     "close-mic, room reverb, slower &middot; 92-96 Hz"),
    ("t7", "TIMELINE-7", "the one who atoned",
     "Became a paramedic because of it. Precise, calm, easiest to trust. He has the most "
     "accurate account of that night and he is the one actually at fault. He does not lie. He omits.",
     "flat, compressed, no room &middot; 100-101 Hz"),
    ("t12", "TIMELINE-12", "the one who got out",
     "Moved away and built a life on top of it. The best-argued claims in the game are his, "
     "and three of them are false. He does not want you to succeed.",
     "no voice notes at all &mdash; the silence is a clue"),
]

EVIDENCE = [
    ("timeline_scan", "T-7's timeline",
     "He wrote it out years ago. Every minute of that night is on the page except "
     "01:40 to 01:55, and the gap is sitting there with <em>15 min</em> in the margin. "
     "Composited rather than generated &mdash; flux cannot write, and a document the player "
     "is invited to read has to actually say something."),
    ("ford_night_01", "The ford",
     "Water over the stones, and the light plainly on &mdash; which quietly contradicts "
     "one of T-12's three fabrications before anyone says a word about it."),
    ("verge_dawn", "The verge at dawn",
     "T-12 sends this as proof the car was moved. Look at it as long as you like; it "
     "proves nothing. Confidence reads as reliability, and that is the trap."),
    ("porch_night", "The porch",
     "Two figures too far away to identify. T-3 watched this from the car and has spent "
     "twenty years deciding what they were saying."),
]

METRICS = [
    ("story gate", "9/9 claims obtainable &middot; 4/9 contestable &middot; 0 orphan &middot; 673 paths walked &middot; 27 quote pairs"),
    ("playtest", "5 scenarios, all 3 endings verified end to end"),
    ("pacing", "29 beats &middot; median 3.6s forced dead air &middot; longest 7.7s &middot; 0 over threshold"),
    ("accessibility", "18/18 text pairs pass WCAG AA &middot; grades separable under all 3 CVD types"),
    ("payload", "108 KB JS + 900 KB assets &middot; loads instantly from a link"),
]


def selves_html() -> str:
    out = []
    for key, label, blurb, desc, voice in SELVES:
        tint = T[key]["key"]
        out.append(f"""
      <article class="self reveal">
        <img src="{img(key, 'portraits')}" alt="{label}">
        <div>
          <div class="label" style="color:{tint}">{label}</div>
          <div class="blurb">{blurb}</div>
          <p>{desc}</p>
          <div class="voice-note">{voice}</div>
        </div>
      </article>""")
    return "".join(out)


def evidence_html() -> str:
    out = []
    for key, title, desc in EVIDENCE:
        out.append(f"""
      <figure class="reveal">
        <img src="{img(key, 'evidence')}" alt="{title}">
        <figcaption><strong>{title}</strong> {desc}</figcaption>
      </figure>""")
    return "".join(out)


def voices_html() -> str:
    rows = []
    for vid, meta in VOICES.items():
        branch = meta["branch"]
        tint = T[branch]["key"] if branch in T else "#F2D9B0"
        who = "NELL" if branch == "nell" else T[branch]["label"]
        text = meta["text"]
        if branch == "nell":
            text = "&mdash; held back until an ending &mdash;"
        rows.append(f"""
        <div class="vrow reveal">
          <span class="vwho" style="color:{tint}">{who}</span>
          <audio controls preload="none" src="{audio(vid)}"></audio>
          <span class="vtext">{text}</span>
        </div>""")
    return "".join(rows)


def convergence_svg() -> str:
    """The end state of the real sequence, as the game draws it."""
    branches = [
        ("t3", "NO SIGNAL", 62, T["t3"]["key"], False),
        ("t7", "NO SIGNAL", 148, T["t7"]["key"], False),
        ("prime", "YOU", 244, "#E4E6EA", True),
        ("t12", "NO SIGNAL", 330, T["t12"]["key"], False),
    ]
    parts = []
    for _key, label, x, tint, lit in branches:
        op = "1" if lit else "0.14"
        parts.append(
            f'<path d="M 196 150 C 196 210, {x} 190, {x} 260 L {x} 560" fill="none" '
            f'stroke="{tint}" stroke-width="{2.2 if lit else 1.5}" opacity="{op}"/>'
            f'<circle cx="{x}" cy="400" r="{7 if lit else 5}" '
            f'fill="{tint if lit else "#0B0D10"}" stroke="{tint}" stroke-width="1.8" opacity="{op}"/>'
            f'<text x="{x}" y="586" text-anchor="middle" font-family="ui-monospace,monospace" '
            f'font-size="9" letter-spacing="1.4" fill="{tint if lit else C["ink-faint"]}">{label}</text>'
        )
    return (
        '<svg viewBox="0 0 400 620" role="img" aria-label="Four timelines diverge at 01:38. '
        'One answered the call. The other three go dark.">'
        f'<line x1="196" y1="40" x2="196" y2="150" stroke="{C["ink-faint"]}" stroke-width="1.5"/>'
        f'<line x1="28" y1="400" x2="372" y2="400" stroke="{C["hairline"]}" stroke-width="1" stroke-dasharray="3 4"/>'
        f'<text x="28" y="390" font-family="ui-monospace,monospace" font-size="11" '
        f'letter-spacing="2" fill="{C["ink-faint"]}">01:38</text>'
        + "".join(parts)
        + "</svg>"
    )


def metrics_html() -> str:
    return "".join(
        f'<div class="metric"><span class="mk">{k}</span><span class="mv">{v}</span></div>'
        for k, v in METRICS
    )


HTML = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SURVIVOR BIAS — review kit</title>
<style>
  :root {{
    --bg:{C["bg"]}; --raised:{C["bg-raised"]}; --input:{C["bg-input"]};
    --hairline:{C["hairline"]}; --ink:{C["ink"]}; --dim:{C["ink-dim"]};
    --faint:{C["ink-faint"]}; --accent:{C["accent-text"]};
    --t3:{T["t3"]["key"]}; --t7:{T["t7"]["key"]}; --t12:{T["t12"]["key"]};
    --maxw:940px;
  }}
  *{{box-sizing:border-box;margin:0;padding:0}}
  html{{scroll-behavior:smooth}}
  body{{
    background:var(--bg); color:var(--ink);
    font-family:ui-sans-serif,-apple-system,'Segoe UI',Roboto,sans-serif;
    font-size:16px; line-height:1.6; overflow-x:hidden;
  }}
  /* Same mediation layer the game uses — grain over everything. */
  body::after{{
    content:""; position:fixed; inset:0; pointer-events:none; z-index:99;
    opacity:.055; mix-blend-mode:overlay;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  }}
  .wrap{{max-width:var(--maxw); margin:0 auto; padding:0 24px}}
  .mono{{font-family:ui-monospace,'SF Mono','Cascadia Mono',Menlo,monospace}}
  .kicker{{font-family:ui-monospace,monospace; font-size:.625rem; letter-spacing:.2em;
    text-transform:uppercase; color:var(--faint)}}
  h1{{font-size:clamp(2.4rem,7vw,4.4rem); line-height:1; letter-spacing:-.02em; margin:.2em 0 .3em}}
  h2{{font-size:1.5rem; letter-spacing:-.01em; margin-bottom:.2em}}
  section{{padding:70px 0; border-top:1px solid var(--hairline)}}
  .reveal{{opacity:0; transform:translateY(20px);
    transition:opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1)}}
  .reveal.in{{opacity:1; transform:none}}

  header{{padding:90px 0 70px}}
  .logline{{font-size:clamp(1.1rem,2.4vw,1.5rem); color:var(--dim); max-width:640px; font-style:italic}}
  .pitch{{margin-top:26px; font-size:1.05rem; max-width:640px}}
  .chips{{display:flex; flex-wrap:wrap; gap:8px; margin-top:28px}}
  .chip{{border:1px solid var(--hairline); border-radius:3px; padding:6px 12px;
    font-family:ui-monospace,monospace; font-size:.625rem; letter-spacing:.14em;
    text-transform:uppercase; color:var(--dim); background:var(--raised)}}

  .self{{display:grid; grid-template-columns:104px 1fr; gap:22px; align-items:start;
    padding:24px 0; border-bottom:1px solid var(--hairline)}}
  .self:last-child{{border-bottom:0}}
  .self img{{width:104px; height:104px; border-radius:50%; display:block}}
  .label{{font-family:ui-monospace,monospace; font-size:.8125rem; letter-spacing:.06em}}
  .blurb{{font-family:ui-monospace,monospace; font-size:.625rem; letter-spacing:.14em;
    text-transform:uppercase; color:var(--faint); margin:.3em 0 .7em}}
  .self p{{color:var(--dim); font-size:.9375rem}}
  .voice-note{{margin-top:10px; font-family:ui-monospace,monospace; font-size:.625rem;
    letter-spacing:.1em; text-transform:uppercase; color:var(--faint)}}

  figure{{margin-bottom:34px}}
  figure img{{width:100%; display:block; border-radius:4px; border:1px solid var(--hairline)}}
  figcaption{{margin-top:12px; color:var(--dim); font-size:.9375rem}}
  figcaption strong{{color:var(--ink); display:block; margin-bottom:.2em}}

  .vrow{{display:grid; grid-template-columns:110px 220px 1fr; gap:16px; align-items:center;
    padding:12px 0; border-bottom:1px solid var(--hairline)}}
  .vwho{{font-family:ui-monospace,monospace; font-size:.6875rem; letter-spacing:.1em}}
  .vtext{{color:var(--dim); font-size:.875rem}}
  audio{{width:100%; height:32px}}

  .conv{{background:var(--bg); border:1px solid var(--hairline); border-radius:6px; padding:20px}}
  .conv svg{{width:100%; max-width:400px; display:block; margin:0 auto}}

  .metric{{display:grid; grid-template-columns:140px 1fr; gap:14px; padding:9px 0;
    border-bottom:1px solid var(--hairline); font-size:.875rem}}
  .mk{{font-family:ui-monospace,monospace; font-size:.625rem; letter-spacing:.14em;
    text-transform:uppercase; color:var(--faint); padding-top:3px}}
  .mv{{color:var(--dim)}}

  .lanes{{display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:16px; margin-top:22px}}
  .lane{{background:var(--raised); border:1px solid var(--hairline); border-radius:5px; padding:16px}}
  .lane h3{{font-size:.9375rem; margin-bottom:.35em}}
  .lane p{{color:var(--dim); font-size:.875rem}}

  .wip{{background:var(--raised); border-left:2px solid var(--accent);
    border-radius:0 5px 5px 0; padding:20px 22px}}
  .wip li{{color:var(--dim); font-size:.9375rem; margin:.45em 0 .45em 1.1em}}
  .accent{{color:var(--accent)}}
  footer{{padding:60px 0 80px; color:var(--faint); font-size:.8125rem;
    border-top:1px solid var(--hairline)}}
  @media (max-width:640px){{
    .self{{grid-template-columns:72px 1fr; gap:16px}}
    .self img{{width:72px;height:72px}}
    .vrow{{grid-template-columns:1fr; gap:8px}}
    .metric{{grid-template-columns:1fr; gap:2px}}
  }}
</style>
</head>
<body>

<header class="wrap">
  <div class="kicker">indie.io &middot; review kit &middot; vertical slice</div>
  <h1>SURVIVOR&nbsp;BIAS</h1>
  <p class="logline">In every other timeline she died that night. In yours, she's still alive. For now.</p>
  <p class="pitch">A mystery told entirely through a messaging app, where every suspect is you.
    <strong>Her Story &times; Emily is Away &times; a locked-room interrogation.</strong></p>
  <div class="chips">
    <span class="chip">React 19 + ink</span>
    <span class="chip">Web &middot; desktop &amp; mobile</span>
    <span class="chip">30&ndash;45 min</span>
    <span class="chip">3 endings</span>
    <span class="chip">no AI at runtime</span>
  </div>
</header>

<section class="wrap">
  <div class="kicker">the loop</div>
  <h2>Cross-examination by quoting</h2>
  <p style="color:var(--dim); max-width:640px; margin-top:14px">
    Talk to an alternate self and you learn a <strong>claim</strong>. Quote that claim at a
    <em>different</em> self and they corroborate, deflect, or counter. Countered claims go
    <span class="accent">contested</span>, and the contradictions are the puzzle. Resolving a
    contest needs a third self's account, so the graph forces you to circulate.
  </p>
  <p style="color:var(--dim); max-width:640px; margin-top:14px">
    Every self has a motive to lie: in their branch they were there, and she died. Some of
    them actively do not want you to succeed &mdash; twenty years of who they became depends
    on the shape of that loss. That's the title.
  </p>
</section>

<section class="wrap">
  <div class="kicker">the three selves</div>
  <h2>One man, three accommodations with the same guilt</h2>
  <p style="color:var(--dim); max-width:640px; margin:14px 0 24px">
    They share one voice, because they are one man &mdash; a single fixed TTS voice with a
    different treatment per branch. And one colour grade each, so you can read who sent a
    piece of evidence before you read the name.
  </p>
  {selves_html()}
</section>

<section class="wrap">
  <div class="kicker">evidence</div>
  <h2>Everything the player sees is evidence</h2>
  <p style="color:var(--dim); max-width:640px; margin:14px 0 30px">
    A call frame, a security still, a scan. Nothing is presented as direct observation &mdash;
    which is both the fiction and the reason generated art holds together here.
  </p>
  {evidence_html()}
</section>

<section class="wrap">
  <div class="kicker">voice</div>
  <h2>Hear the same man three ways</h2>
  <p style="color:var(--dim); max-width:640px; margin:14px 0 24px">
    Play them back to back. It's one voice base; the rooms are different.
    T-12 has none, and that absence is a clue rather than an omission.
  </p>
  {voices_html()}
</section>

<section class="wrap">
  <div class="kicker">ending a</div>
  <h2>The difference between four lives is one answered call</h2>
  <p style="color:var(--dim); max-width:640px; margin:14px 0 24px">
    She called her brother at 01:38 and it rang for forty seconds. In every other branch
    nobody picked up. In yours you're awake, holding your phone, because you've spent all
    night on it talking to them. Then the branches that didn't answer go dark, one at a time.
  </p>
  <div class="conv">{convergence_svg()}</div>
</section>

<section class="wrap">
  <div class="kicker">state of the build</div>
  <h2>Where it's at</h2>
  <div style="margin-top:20px">{metrics_html()}</div>
</section>

<section class="wrap">
  <div class="kicker">honest bit</div>
  <h2>Still WIP</h2>
  <div class="wip" style="margin-top:18px">
    <ul>
      <li><strong>Nobody has played it at true speed yet.</strong> Pacing is measured, not felt
        &mdash; the mix of typing rhythm, voice notes, cutscene and drone has never been heard
        together. That's the next thing.</li>
      <li><strong>No in-app screenshots in this kit.</strong> Everything above is a real
        shipped asset, but the chat UI in motion isn't shown, so it isn't faked either.</li>
      <li><strong>Faces drift between portraits by design.</strong> No ControlNet or character
        LoRA locally, so the art direction routes around it instead of pretending otherwise.</li>
      <li><strong>ACE-Step never delivered.</strong> It queues jobs and doesn't drain them, warm
        or cold. Ambience is Stable Audio instead. If anyone has got audio out of it, I'd like
        to know how.</li>
    </ul>
  </div>
</section>

<section class="wrap">
  <div class="kicker">where we'd love help</div>
  <h2>The writing is plain text</h2>
  <p style="color:var(--dim); max-width:640px; margin:14px 0 6px">
    The whole story lives in <span class="mono">.ink</span> files. No engine, no repo setup,
    no build &mdash; a conversation branch is a text file, and the gate will tell you if it's
    wrong. This is the lowest-friction contributor surface I've been able to build.
  </p>
  <div class="lanes">
    <div class="lane"><h3>&#128221; Writing</h3><p>A fourth self, more claims, more ways
      to catch T-12 out. One <span class="mono">.ink</span> file per branch.</p></div>
    <div class="lane"><h3>&#127912; Evidence art</h3><p>More stills, and better ones. The
      grade is automated, so anything you make lands in the right palette.</p></div>
    <div class="lane"><h3>&#127925; Ambience</h3><p>The bed and drone are placeholder-grade.
      A real ambient pass would lift the whole thing.</p></div>
    <div class="lane"><h3>&#129514; Playtest</h3><p>Most wanted: does the mystery actually
      land, and is ending C as arguable as it's meant to be?</p></div>
  </div>
</section>

<footer class="wrap">
  <div class="mono">SURVIVOR BIAS &middot; vertical slice &middot; indie.io</div>
  <div style="margin-top:8px">Built with Claude. Story in ink, art via FLUX, voice via kokoro,
    ambience via Stable Audio. No AI at runtime &mdash; it ships as a static build.</div>
</footer>

<script>
  // Reveal on scroll, and honour reduced-motion by just showing everything.
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = document.querySelectorAll('.reveal');
  if (reduce) {{
    items.forEach(el => el.classList.add('in'));
  }} else {{
    const io = new IntersectionObserver((entries) => {{
      entries.forEach(e => {{ if (e.isIntersecting) {{ e.target.classList.add('in'); io.unobserve(e.target); }} }});
    }}, {{ rootMargin: '0px 0px -8% 0px' }});
    items.forEach(el => io.observe(el));
  }}
  // Only one voice note at a time — they're meant to be compared, not layered.
  document.querySelectorAll('audio').forEach(a => a.addEventListener('play', () => {{
    document.querySelectorAll('audio').forEach(o => {{ if (o !== a) o.pause(); }});
  }}));
</script>
</body>
</html>
"""


def main() -> int:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(HTML, encoding="utf-8")
    kb = OUT.stat().st_size / 1024
    print(f"kit -> {OUT.relative_to(ROOT)}  ({kb:.0f} KB, self-contained)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
