# SURVIVOR BIAS

*In every other timeline she died that night. In yours, she's still alive. For now.*

A mystery told entirely through a messaging app, where every suspect is you.
**Her Story × Emily is Away × a locked-room interrogation.**

**Tech:** React 19 + TypeScript + ink · Web · desktop & mobile browser

## The loop

1. Talk to an alternate self → learn a **claim**, filed into the evidence drawer.
2. **Quote** that claim at a *different* self → they corroborate, deflect, or counter.
3. Countered claims go **contested**. Contradictions are the puzzle.
4. Resolving a contest needs a third self's claim, so the graph forces you to circulate.

Every self has a motive to lie: in their branch they were there, and she died. Some
of them do not want you to succeed — twenty years of who they became depends on the
shape of that loss.

## Run it

```bash
npm install
npm run dev      # http://localhost:4180 — compiles the story first
```

| Command | What it does |
|---|---|
| `npm run story` | Compile `story/*.ink` → `src/story.json` |
| `npm run gate` | Compile → structural lint → scripted playthrough. Green before any Slack post. |
| `npm run playtest` | Just the playthrough: asserts the route to ending A still works |
| `npm run build` | Gate → typecheck → production build |
| `uv run --script tools/gen_art.py` | Generate + grade portraits and evidence stills |
| `uv run --script tools/gen_voice.py` | Generate the voice notes |
| `uv run --script tools/gen_ambience.py` | Generate ambience beds and SFX |
| `npm run pacing` | Dead-air audit per beat (part of `gate`) |
| `uv run --script tools/a11y.py` | WCAG contrast + colour-blind separation |
| `uv run --script tools/build_kit.py` | Build `marketing/kit.html` (self-contained review kit) |

## Layout

```
story/      *.ink — the writing. THE contributor surface: plain text, no engine.
src/        React app — chat shell, evidence drawer
  lib/ink.ts    the only place tags are parsed
  state/game.ts playout timing, save/load
design/     survivor-bias-tokens.json (style lock) + mocks
tools/      build_story · lint_story · playtest · pacing · a11y
            gen_art · gen_voice · gen_ambience · build_kit
marketing/  POST-DRAFT.md (unsent Slack draft) · kit.html
docs/       AUDIO_FINDINGS.md and friends
```

## Writing for it

One ink line = one message bubble. **Tags must be inline on the text line** — a tag
on its own line binds to the *following* output and silently shifts every
attribution by one. The gate fails the build if you do it.

```ink
oh god it's really you # from: t3 # delay: 1100
that's from the week after # from: t3 # delay: 1100 # img: evidence/ford_night_01.webp
~ gain(C_CAR_KEYS, "You still had Nell's car keys the next morning.", "t3")
```

| Tag | Meaning |
|---|---|
| `from: t3` | sender; omit for the player |
| `delay: 900` | ms of typing indicator before the bubble lands |
| `voice: <id>` | render as a voice note |
| `img: <path>` | photo attachment, relative to `assets/` |
| `screen: convergence` | hand the beat to a full-screen sequence; parks the queue until done |
| `gain(id, text, who)` | file a claim (a function, not a tag) |
| `contest(id)` | mark a claim contested |

Claim prose lives in the `gain()` call and nowhere else, so writers never touch
TypeScript.

## The three selves

Same person, three accommodations with the same guilt. Full notes in `story/BIBLE.md`.

| | Register | Gives | Hides |
|---|---|---|---|
| **T-3** *the one who stayed* | lowercase, run-on, wrecked | the emotional truth | nothing — he just doesn't know |
| **T-7** *the one who atoned* | timestamps, clinical, never swears | verifiable times and sequence | where *he* was, 01:40–01:55 |
| **T-12** *the one who got out* | clipped, edited, no typos | the best-argued claims in the game — three are false | why he's lying, until the end |

T-7's precision is his armour and also what betrays him: he accounts for every minute
except fifteen, and hands the player that gap without ever admitting to one.
T-12 sends **no voice notes**, and the absence is a clue.

## Endings, and the deadline

Three endings, all reached by **choosing** — never by timing out. `TONIGHT` sits in the
contact list from the first screen and refuses to open until you have a reason to act.

- **A — Prevented.** You go nowhere. You sit still and pick up. Hands off to the
  **convergence screen**: four lives from one trunk, a rule at 01:38, and the call marker
  filled on exactly one of them — then the other three go dark, one at a time.
- **B — Substituted.** You act, decisively, on the best-argued thing you were told.
- **C — Refused.** You put the phone down. No reproach, no score.

**There is no timer anywhere.** A hidden `pressure` counter advances on each substantive
beat and expresses itself only in the fiction — system lines naming the hour, and the
endgame's framing tightening. The deadline that actually bites is running out of things
left to ask. Details in `story/BIBLE.md` §6.

## Art

`uv run --script tools/gen_art.py` generates and grades every asset. Full rationale in
`design/style-lock.md`; the short version:

Local ComfyUI has no ControlNet or LoRAs, so **one face cannot be pinned across
generations** — fatal for a game about one man in three timelines. So every image is
presented as *evidence* (a call frame, a still, a scan), which makes drift read as
transmission noise rather than a bug. One duotone grade per branch does the unifying,
faces are prompted half-shadowed and off-angle, and portraits are small circular crops.

Two real gates, with real numbers:

- **LPIPS drift** across the three portraits must stay in `0.15–0.78` — below and they're
  one photo re-graded, above and they stop being the same man.
  Current: `t3/t7 0.52 · t3/t12 0.53 · t7/t12 0.40`
- **NIMA aesthetic** floor 5.0; the set lands 5.2–6.2.

The story gate additionally **fails the build** if any `# img:` points at a missing file.

Documents are composited, not generated: `timeline_scan` is a blank generated page with
the real times drawn on, because flux cannot write. That means the 01:40 → 01:55 gap is
legible on the page — the central mystery made visible.

All eight assets are WebP and total **400 KB**.

## Voice

`uv run --script tools/gen_voice.py`. Six notes, 116 KB total.

**All the selves share one voice**, because they are one man. The base is a fixed kokoro
voice (`bm_lewis`) and the per-branch difference is applied with ffmpeg:

| | Treatment | Measured |
|---|---|---|
| **T-3** | close-mic, room reverb, slower | 92–96 Hz, 29% energy <300 Hz |
| **T-7** | flat, compressed, no room | 100–101 Hz, 16% <300 Hz |
| **T-12** | **none — the silence is a clue** | — |
| **Nell** | telephone band; she's on a phone | 9% <300 Hz, one note, ending A only |

The plan called for voice *cloning*, then for prompt-described voices. Both fell over —
cloning 500s, and `voice_description` drifts more between repeat renders than between
different descriptions (`tools/probe_voice_stability.py` has the numbers). A fixed voice
plus ffmpeg is what `BIBLE.md` §7 wanted anyway, and it's truer: literally the same voice,
worn into different shapes.

Waveforms in the UI are the **real peak envelope** of each file, generated alongside the
audio into `src/voices.json`.

## Ambience

`uv run --script tools/gen_ambience.py`. Two seamless loops and two one-shots, 377 KB.

| | What it is |
|---|---|
| **bed** | Cold room tone. Diegetic — his bedroom at one in the morning. Constant and quiet. |
| **tension** | A dissonant drone. Score, not room. **Its gain rises with ink's `pressure` counter**, so the night closing in is audible as well as written — a third channel for the felt deadline, still with no numbers on screen. |
| **sfx** | Message receive / send. Throttled so close beats can't double-blip. |

Sound starts on the first tap (browsers block it before that) and there's a persistent
mute toggle on the home screen — ambient audio in a text game needs to be one tap from
off. Built with `HTMLAudioElement`, not WebAudio: two loops and two blips don't justify a
gain graph.

ACE-Step was the planned generator and never delivered — it queues jobs and doesn't drain
them, retested warm. Stable Audio does the job. Both traps worth knowing are in
`docs/AUDIO_FINDINGS.md`: don't prompt for "quiet" (the first bed came back at −56 dBFS),
and generated clips must be crossfade-wrapped to loop.

## Pacing

`npm run pacing` is part of the gate. It measures **forced dead air** per beat: time the
player can neither act during nor skip. Voice notes (opt-in) and the cutscene (skippable
from frame one) are reported separately, because counting them points the fix at the wrong
place.

It found a 16.7s beat and, more usefully, a characterisation error: T-7 says *"I've had a
long time to get the order right"*, and a man reciting a prepared account types **briskly**.
T-3 is the one who halts. Delay expresses hesitation, so T-7 and T-12 were retimed down and
`MAX_DELAY` dropped from 2600 to 2000 — a long message already costs reading time, so
pairing it with a long typing indicator charges twice for the same weight.

Now: 29 beats, median 3.6s, longest 7.7s, nothing over the 9s warn line.

## Accessibility

`uv run --script tools/a11y.py`. All 18 rendered text pairs pass WCAG AA. Note that every
micro-label is 10px mono, so the bar is 4.5:1 throughout — none of it qualifies for the
large-text 3:1 allowance.

The first run failed 7 pairs. Fixes: `ink-faint` lightened `#565E6A → #7C8593`, `t12`'s key
`#4A6FA5 → #6B90C4`, and a **separate `accent-text`** (`#E56A5A`) introduced because
`accent` (`#C8402F`) only reaches 3.7:1 as a label — a fill colour and a text colour have
different jobs. The fill is unchanged, and white-on-accent in the unread badge passes at
4.96:1.

Because a timeline is identified by colour, the audit also checks that the three grades stay
separable under dichromacy. Minimum ΔE is **36.3** (deuteranopia, t7/t12) against a collapse
threshold of 10 — they hold up, and the text labels carry the same information regardless.

## Status

Week 5 of a 4–6 week vertical slice. **Feature-complete**: all three selves, the full
cross-examination web, all three endings, the convergence screen, portraits, evidence
stills, voice notes and ambience.

```
story gate: claims 9/9 obtainable · 4/9 contestable · 0 orphan
            673 paths walked · 27 quote pairs · 8/8 entries terminate
playtest:   PASS — 5 scenarios, all 3 endings verified
art gates:  LPIPS 3/3 in band · NIMA 8/8 above floor
payload:    108 KB js + 400 KB art + 116 KB voice + 377 KB ambience
```

**Verified on mobile** (375x812) and tablet (768x1024): no horizontal overflow, the device
frame collapses to fullscreen below the `sm` breakpoint and recentres above it, the
convergence SVG fits without clipping, and every tap target is at least 40x40 — two weren't
("try another night" was a 15px-tall text button whose padding lived on its wrapper).

Reaching an ending now offers **"try another night"**, which confirms first. And the save
carries undelivered messages, so reloading mid-beat no longer silently loses lines: ink
advances the moment a beat is read, but the messages land one at a time over several
seconds, and the old save only recorded the delivered ones.

## Presenting it

`marketing/POST-DRAFT.md` holds an unsent `#iio-games` kickoff post in house format, plus a
short dev-update follow-up, plus the three decisions that need making first (bot name,
what to attach, timing). **Nothing has been sent** — the channel norm is draft-first.

`marketing/kit.html` is a 584 KB self-contained review kit: real portraits and evidence
stills, the six voice notes playable inline, and the convergence diagram. Everything in it
is a shipped asset — the chat UI in motion isn't shown, and isn't faked either.

Remaining before posting: a real playthrough with eyes and ears, and 4–5 screenshots taken
while doing it. Everything is verified structurally and pacing is measured rather than
guessed, but the mix of typing rhythm, voice notes, cutscene and drone has never been
*heard* together.

See `story/BIBLE.md` for the design, `docs/AUDIO_FINDINGS.md` for the audio contracts.
