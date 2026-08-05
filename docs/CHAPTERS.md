# Chapters — the twenty years either side of Tonight

**Status: shipped and gated.** `npm run gate` covers all six.

Tonight is the game: one night, three selves, three endings. Chapters are the
material around it — the twenty years that made them (prequels) and what the
choice cost (codas).

---

## What exists

| Chapter | Thread id | Entry knot | File | Unlock |
|---|---|---|---|---|
| BEFORE — TIMELINE-3 | `ch2a` | `ch2a_open` | `story/ch2a.ink` | always |
| BEFORE — TIMELINE-7 | `ch2b` | `ch2b_open` | `story/ch2b.ink` | always |
| BEFORE — TIMELINE-12 | `ch2c` | `ch2c_open` | `story/ch2c.ink` | always |
| AFTER — PREVENTED | `ch3a` | `ch3a_open` | `story/ch3.ink` | ending A |
| AFTER — SUBSTITUTED | `ch3b` | `ch3b_open` | `story/ch3.ink` | ending B |
| AFTER — REFUSED | `ch3c` | `ch3c_open` | `story/ch3.ink` | ending C |

Reached from the home screen via the icon beside the mute button
(`ContactList` → `openChapterList` → `components/ChapterSelect.tsx`).

---

## The one rule that matters

**A chapter must not touch Tonight's state.** It shares the same compiled story
and the same `Story` instance, so this is a discipline, not an isolation
boundary:

- never call `tick()` — pressure is Tonight's deadline, and reading background
  must not spend the player's night
- never call `gain()` or `contest()` — the evidence drawer is Tonight's puzzle
- prequels carry no `{ finished: }` guard, so they stay readable after an ending
- own `VAR`s only, prefixed with the chapter id

`tools/playtest.mjs` asserts the first two directly (`files NO claims`,
`never advances pressure`) for all three prequels, because a regression there is
invisible in play.

---

## Why the prequels withhold

Two things are deliberately *not* in the prequels:

- **T-7 never accounts for 01:40–01:55.** Extracting that is the spine of
  Tonight (`BIBLE.md` §5). He refuses here, in character, and the playtest
  asserts the gate line never appears.
- **T-12 never confesses.** Ending A depends on the player catching him out. The
  prequel shows him *building* the account instead — rehearsing, on the record,
  without ever admitting there is anything to rehearse.

Both were tempting to write and both would have made the main game redundant.

---

## Codas

One file, `story/ch3.ink`, three entries, sharing two gate knots
(`ch3_locked`, `ch3_mismatch`). Each coda checks `ending`, a `VAR` set by the
three ending knots in `endings.ink` and surfaced to the UI by
`StoryEngine.ending()`.

Locked codas are **shown, not hidden** — seeing two other nights you didn't
reach is the same move TONIGHT makes by sitting in the contact list unopenable.

`ch3c` (Refused) is deliberately the thinnest: re-entering offers almost
nothing, because the ending's whole point is that nothing resolves. That is
content, not an unfinished chapter — see `BIBLE.md` §6 on ending C not reading
as a fail state.

---

## Voice notes: not used here, on purpose

Tonight ships with **no** voice notes. The generator (`tools/gen_voice.py`), the
assets and `VoiceNote.tsx` all still work; the tags were removed because the
notes weren't earning their place (commit `aaf468f`, and the header note in
`t3.ink`).

Chapters follow that decision — all plain text. Re-enabling one is a single
`# voice: <id>` tag on the line, and `gen_voice.py` would need the new line
added to its `LINES` table first.

**This reverses an earlier plan in this repo's history** that called for
generating 14 new chapter voice notes. That plan predated the decision to pull
them; it should not be actioned without re-deciding the underlying question.

---

## Adding a chapter

1. Write `story/chNN.ink`, obeying the rules above. Declare `VAR`s at the foot.
2. `INCLUDE` it from `story/main.ink`.
3. Add an entry to `CHAPTERS` in `src/lib/chapters.ts` and its id to `Sender`
   in `src/lib/types.ts`.
4. Add a scenario to `tools/playtest.mjs` — at minimum the two isolation
   assertions.
5. `npm run gate`. `lint_story.mjs` reads `chapters.ts` as well as
   `contacts.ts`, so a typo'd entry knot fails the build rather than shipping a
   thread that opens onto nothing.
