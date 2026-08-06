# SURVIVOR BIAS — story bible v1

> **Status: §1 SIGNED OFF (Harold, 2026-07-29). Nell is locked.**
> All three selves are written and the cross-examination web is verified end to
> end (`npm run gate`). Remaining open questions are in §8 — none of them block
> writing.

---

## 1. Who she is

**Nell. Your younger sister. Nineteen.**

Chosen over a partner or a friend for three reasons that matter mechanically:

- **She is the constant.** Branches diverge; siblings don't. She exists in *every* timeline,
  which is exactly what the premise needs — the selves differ, she doesn't, except in whether
  she's alive.
- **The guilt needs no setup.** "You were supposed to be watching her" is load-bearing in one
  line. A 30–45 minute slice cannot afford to build a relationship from scratch before it can
  be threatened.
- **It licenses the lying.** Sibling shame is specific and evasive in a way romantic grief
  isn't. Each self deflects differently, and that difference *is* the puzzle.

Name is deliberately plain, warm, slightly old-fashioned, and easy for TTS to pronounce
cleanly across voices.

## 2. The structural trick — the clock

**In your timeline, the night hasn't happened yet. It's tonight.**

Every other self is *past* it. They lived through it; you haven't. This is the spine of the
whole design and it earns three things at once:

- **A literal clock.** The game runs against a real deadline in the fiction.
- **A reason the conversation exists.** You're the only branch where it's still preventable.
- **A reason to lie that isn't cartoonish.** Some of them do not want you to succeed. Their
  entire adult lives are built on the shape of that loss. If Nell lives, twenty years of who
  they became stops meaning anything.

That last point is the title. *Survivor bias:* you are only hearing from the branches that
outlasted her, and every one of them has a stake in her staying dead.

## 3. That night

Nell went to a house party out past **the ford** on the river road. You drove her there. You
were supposed to drive her home. Between **01:20 and 02:05** she left the house on foot.

In eleven of twelve branches she did not survive the night. The divergence between branches is
never dramatic — it's a phone that was or wasn't charged, a door that was or wasn't locked, a
five-minute argument that did or didn't happen. **The thing that saves her is small**, which is
why nobody has ever agreed on what it was.

## 4. The four selves

Same person. Four different accommodations with the same guilt. Each gets a color grade
(`design/survivor-bias-tokens.json → timelines`) and a distinct register.

### TIMELINE-3 — *sodium-orange* — "the one who stayed"
Never left town. Drinks. Was in the car that night. Talks the most, apologises the most, and is
the **least factually reliable** — he was three drinks past useful. Warm, wrecked, wants
absolution more than he wants to be accurate.
- **Gives:** the emotional truth of the night, and a lot of factual noise.
- **Withholds:** nothing deliberately. He genuinely doesn't know what he doesn't know.
- **Register:** run-on, lowercase, self-interrupting, over-familiar. Sends voice notes when
  he's had a few.

### TIMELINE-7 — *hospital-green* — "the one who atoned"
Became a paramedic because of it. Precise, calm, generous with detail, easiest to trust. He has
the **most accurate account** of the timeline of events — and he is the one **actually at
fault**. Clinical language is his armour: he can narrate the night in exhaustive procedural
detail while never once placing himself in it.
- **Gives:** verifiable times, sequence, physical facts.
- **Withholds:** one thing — where *he* was between 01:40 and 01:55.
- **Register:** complete sentences, timestamps, clinical nouns. Never swears. Answers the
  question adjacent to the one you asked.

### TIMELINE-12 — *blue-hour* — "the one who got out"
Moved away, built a life on top of it, successful by any external measure. Coldest of the
three. **He is the saboteur** — he feeds you plausible, checkable, wrong claims, because he
cannot survive being wrong about the last twenty years.
- **Gives:** the most confident and best-argued claims in the game. Several are false.
- **Withholds:** his motive, until the end.
- **Register:** clipped, edited, punctuated. Types like someone who rereads before sending.
  Never sends voice notes. That absence is a clue.

### TIMELINE-9 — *paper* — "the one who didn't go"

The fourth self, and the only one who wasn't there.

He and Nell argued the day before. So he didn't go to the party — and at 01:38 he was awake,
at home, and he watched her name come up and let it ring. The other three *couldn't* answer:
drunk in a car, at the gate, asleep three hundred miles away. **He chose not to.** That makes
him the closest of them to the player's own situation: the decision ending A turns on is the
one he already got wrong.

Having no account of his own, he has spent twenty years assembling everyone else's — a file,
built from three unreliable narrators. He is helpful, sober, generous with detail, and the most
believable person in the game.

**He is also how T-12's lies get laundered.** He repeats the fabrications as established fact,
not because he's lying but because he got them from T-12 twenty years ago and has never had any
way to check. Two sources appear to agree; one is an echo.

- **Gives:** first-hand confirmation that the call happened at 01:38 and rang out — the only
  independent corroboration of the thing ending A turns on. Plus T-12's fabrications, restated
  with a citation and a date, which is exactly what makes them dangerous.
- **Withholds:** that he was awake. He'll say he "missed it" for a long time before he'll say
  he watched it.
- **Uniquely:** he is the only self who can be *changed* by evidence. Put a contested claim to
  him and he goes back through the file and finds out where he got it. He is the only one who
  ever says "then I've been wrong about that for twenty years."
- **Register:** careful, past-tense, sourced. Says "according to" and "he told me in 2011". The
  only self who cites. Never a raw assertion when a provenance will do.

**Grade: paper.** A desaturated warm bone tone rather than a fourth saturated hue — he reads as
a document, not a person who was there. It also survives dichromacy better than another mid-tone
would, being separated on lightness rather than hue.

> **The lesson he teaches, which the game had no way to teach before him:
> corroboration is not verification.**

## 5. The mechanic — cross-examination by quoting

1. A conversation yields a **claim** → it files into the evidence drawer.
2. **Quote** a claim at a *different* self. They **corroborate**, **deflect**, or **counter**.
3. Countered claims mark **contested**. Contested pairs are the puzzle surface.
4. Resolving a contest requires a *third* self's claim — so the graph forces you to circulate.

Slice target: **~28 claims**, of which ~6 are false (all traceable to T-12), ~4 are the
load-bearing truth, and the remainder are corroborating texture.

The one thing you must extract to reach the best ending: **where T-7 was between 01:40 and
01:55.** He will not tell you. T-3 saw it and doesn't know he saw it. T-12 knows and will lie
about it to keep you away from it.

## 6. Endings

| # | Trigger | Shape |
|---|---|---|
| **A — Prevented** | Extract T-7's gap *and* discredit ≥2 of T-12's false claims | You act on the small true thing. Nell lives. Hands off to the **convergence screen**, where you watch the other three stop being reachable, one at a time. |
| **B — Substituted** | Act on a T-12 claim you never contested | You intervene on the wrong detail. She dies differently. The selves are *relieved*, and that's the horror. |
| **C — Refused** | Choose to put the phone down | You let it ring. Ambiguous whether you couldn't or wouldn't. T-3's last message: *"i didn't pick up either. none of us did. that's the whole thing."* |

Ending C must not read as a fail state. It's the quietest and it should be the one people argue
about. So it carries no reproach, no score, and no "you could have" — and it is reached by
*choosing*, never by timing out, because a timeout would read as failure.

### The payoff

T-7 establishes that Nell made a call at 01:38 lasting forty seconds, and hands us the line
that gives it away: *"Forty seconds is a long time for no answer and a short time for a
conversation."*

It rang out. She called her brother and nobody picked up — T-3 was drunk in a car, T-7 was at
the gate, T-12 was asleep three hundred miles away.

**In your timeline you are awake at 01:38, holding your phone, because you have spent all night
on it talking to them.** The thing that saves her is that you answer. The app is the mechanism.
That is why the divergence is small, why nobody ever agreed on what it was, and why the player
had to be on their phone for the whole game.

### The convergence screen

Ending A's climax is a full-screen diagram, not chat text (`src/components/Convergence.tsx`,
triggered by `# screen: convergence`, which parks the message queue until it finishes).

Four lives leave one trunk and fan out. A rule crosses all of them at **01:38** — the only
labelled time on the diagram. Every line carries a marker at that moment, and on exactly
one it is **filled**.

> The difference between four lives is one answered call.

Then the three that didn't answer go out, staggered, their labels turning to `NO SIGNAL`,
until only the lit line is left. It replaced three lines of chat text that said the same
thing and carried none of it.

Skippable from the first frame, and it jumps to the end state under
`prefers-reduced-motion` — the information matters more than the choreography.

### The deadline is felt, not shown

No countdown, no clock anywhere in the UI. `tick()` in `endings.ink` advances a hidden
`pressure` counter on each substantive beat, and its only expression is diegetic: system lines
naming the hour (`23:10` → `00:40` → `01:20` → `01:31`), and the endgame's framing shifting from
*"Your own night is quiet"* to *"It's twenty past one."* Past `LATE` the player can no longer
back out and keep talking.

The deadline that actually bites is **running out of things left to ask**.

`TONIGHT` sits in the contact list from the first screen, unopenable — ink turns the player away
until they have a reason to act. Seeing the decision waiting there is the point.

## 7. Voice / VO notes

One voice base for all the selves — it's the same person — with per-branch treatment.
That's the thematic core of the audio design, and it survived contact with reality:
cloning is broken and prompt-described voices drift, so the base is a **fixed kokoro
voice (`bm_lewis`)** and the divergence is done in ffmpeg. See `tools/gen_voice.py` and
the correction at the top of `docs/AUDIO_FINDINGS.md`.

| | Treatment | Measured |
|---|---|---|
| **T-3** | closer to mic, room reverb, slightly slower | 92–96 Hz, 29% energy <300 Hz |
| **T-7** | flat, even, mid-distance, no room | 100–101 Hz, 16% <300 Hz |
| **T-12** | ***no voice notes at all.*** His silence is the tell. | — |
| **Nell** | telephone band — she is literally on a phone | `bf_emma`, 9% <300 Hz |

Six notes total: three T-3, two T-7, one Nell. T-12's zero is load-bearing, and
`t12_voice` makes the absence legible so it isn't mistaken for missing content.

Nell speaks exactly once, in ending A, after he answers. Never before.

## 8. Open questions

- Does the player character get a name, or stay "YOU"? (Leaning YOU — projection matters more
  than characterisation here.)
- Should the deadline be a visible countdown or only *felt*? (Leaning felt — a literal timer
  turns a mystery into a stress test.)
- Nell's one voice note: ending A only, or all three endings with different content?
