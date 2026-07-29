# SURVIVOR BIAS — story bible v1

> **Status: DRAFT, needs Harold's sign-off on §1 before dialogue drafting proceeds.**
> Everything downstream (all `.ink`, all VO, all evidence art) depends on §1 and §2.
> Kill or change it now, cheaply, rather than in week 4.

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

## 4. The three selves

Same person. Three different accommodations with the same guilt. Each gets a color grade
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
| **A — Prevented** | Extract T-7's gap *and* discredit ≥2 of T-12's false claims | You act on the small true thing. Nell lives. The other three go quiet — you can see them stop being reachable, one at a time. |
| **B — Substituted** | Act on a T-12 claim you never contested | You intervene on the wrong detail. She dies differently. The selves are *relieved*, and that's the horror. |
| **C — Refused** | Reach the deadline without acting | You don't intervene. Ambiguous whether you couldn't or wouldn't. T-3's last message is the gut-punch. |

Ending C must not read as a fail state. It's the quietest and it should be the one people argue
about.

## 7. Voice / VO notes

Same cloned voice base for all four (it's the same person) with per-branch treatment — the
thematic core of the audio design. See `tools/gen_voice.py`.

- **T-3:** closer to mic, room reverb, occasional breath. Slightly slower.
- **T-7:** flat, even, mid-distance. No room.
- **T-12:** *no voice notes at all.* His silence is the tell.
- **Nell:** one voice note, held back until an ending. Never speak her before that.

## 8. Open questions

- Does the player character get a name, or stay "YOU"? (Leaning YOU — projection matters more
  than characterisation here.)
- Should the deadline be a visible countdown or only *felt*? (Leaning felt — a literal timer
  turns a mystery into a stress test.)
- Nell's one voice note: ending A only, or all three endings with different content?
