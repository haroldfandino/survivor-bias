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
| `uv run --script tools/smoke_audio.py` | Probe the Rupert audio endpoints |

## Layout

```
story/      *.ink — the writing. THE contributor surface: plain text, no engine.
src/        React app — chat shell, evidence drawer
  lib/ink.ts    the only place tags are parsed
  state/game.ts playout timing, save/load
design/     survivor-bias-tokens.json (style lock) + mocks
tools/      build_story · lint_story · smoke_audio
docs/       AUDIO_FINDINGS.md and friends
```

## Writing for it

One ink line = one message bubble. **Tags must be inline on the text line** — a tag
on its own line binds to the *following* output and silently shifts every
attribution by one. The gate fails the build if you do it.

```ink
oh god it's really you # from: t3 # delay: 1100
that's from the week after # from: t3 # delay: 1100 # img: evidence/ford_night_01.png
~ gain(C_CAR_KEYS, "You still had Nell's car keys the next morning.", "t3")
```

| Tag | Meaning |
|---|---|
| `from: t3` | sender; omit for the player |
| `delay: 900` | ms of typing indicator before the bubble lands |
| `voice: <id>` | render as a voice note |
| `img: <path>` | photo attachment, relative to `assets/` |
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

- **A — Prevented.** You go nowhere. You sit still and pick up.
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

## Status

Week 3 of a 4–6 week vertical slice. **Story-complete and illustrated**: all three
selves, the full cross-examination web, all three endings, portraits and evidence stills.
Audio is the remaining placeholder.

```
story gate: claims 9/9 obtainable · 4/9 contestable · 0 orphan
            673 paths walked · 27 quote pairs · 8/8 entries terminate
playtest:   PASS — 5 scenarios, all 3 endings verified
art gates:  LPIPS 3/3 in band · NIMA 8/8 above floor
payload:    104 KB js + 400 KB art
```

See `story/BIBLE.md` for the design, `docs/AUDIO_FINDINGS.md` for the audio contracts.
