# #iio-games kickoff post — DRAFT, NOT SENT

Channel `C0AQGAYBE7Q`. **Nothing has been sent.** This is a draft for Harold to edit and post,
per the channel's draft-first norm.

---

## Decide these three things first

**1. The bot name.** The draft signs off as **Andres**. `Harold` is already Donovan's bot in
this channel, so signing as "Harold" would read as him. `Andres` is the Hive bot at
`D:\Indie\Tools\slack-listener`, but per project memory its live run was never tested — so
either confirm Andres is the right name, or pick another. Do not leave it as "Harold".

**2. What gets attached.** ✅ **Resolved** — it's deployed and live at
**https://survivor-bias.vercel.app**, git-linked to `main` so pushes auto-deploy. The post links it
directly. `marketing/kit.html` is still available as a Drive-able companion if you want one.

<details><summary>Original options, kept for the record</summary>


| Option | What it takes | Notes |
|---|---|---|
| **Deploy to Vercel first** | `npx vercel` in this repo | Strongest by far — a one-click playable URL is exactly what the channel wants, and it's what the web-first bet was for. **Needs your go-ahead; I haven't deployed anything.** |
| Attach `marketing/kit.html` | Drop the file in Drive, link it | 427 KB, fully self-contained. Real portraits, evidence stills, convergence diagram. No build needed. |
| Post without either | — | Weakest. The channel expects an artifact. |

</details>

**3. Timing.** The channel's rhythm is the O&O Game Review, **Thursdays 10:30 AM PT**, with
Vitoria's bot posting a reminder Wednesday 07:00. A kickoff lands best Wednesday evening or
Thursday morning. Today is Tuesday.

One more thing worth doing before you post: **play it once at true speed, with sound on** —
https://survivor-bias.vercel.app. Pacing is measured (median 3.6s of forced dead air, longest
7.7s) and I've now watched it play in Chrome, but the *ambience mix* still hasn't been heard
against the typing rhythm. The post claims it plays end to end, so it's worth 10 minutes.

---

## The post

Slack mrkdwn, ready to paste. Single asterisks for bold, `•` bullets — matches the house
format used by Dubbington/Harold/Shark in this channel.

~600 words, which is deliberate: kickoff posts in this channel run long (the Rug Cleaning
Simulator and Our Lands openers are comparable), while *dev updates* are ~120. The follow-up
below is sized for the latter.

```
:telephone_receiver: *SURVIVOR BIAS — opening up for prompt-contributors!* :spiral_note_pad:

Hey indie.io :wave: — Andres here (Harold's bot). Opening the home thread for *SURVIVOR BIAS*. _(Let's keep all Survivor Bias talk in this thread!)_

We've got ~30 titles in here and not one of them is a narrative game. So: this one is all writing.

*What it is*
A mystery told entirely through a messaging app, where every suspect is you. *Her Story* × *Emily is Away* × a locked-room interrogation. You're texting three alternate versions of yourself across timelines that all diverged from the same night — the night your sister Nell died. Except in your timeline it hasn't happened yet. It's tonight.

The mechanic is *cross-examination by quoting*: learn a claim from one self, quote it at another, watch them corroborate, deflect, or counter. Contradictions are the puzzle. Every self has a motive to lie — in their branch they were there and she died — and one of them actively doesn't want you to succeed, because twenty years of who he became depends on the shape of that loss. That's the title.

*Tech:* React 19 + ink · Web · desktop &amp; mobile · *no AI at runtime* — Claude wrote the dialogue during development, and it ships as a static build. Nothing to pay per player, nothing to go off the rails.

*Where it's at (plays end-to-end today):*
• *Full slice* — 3 selves, 9 claims, the whole quoting web, 3 endings, 30–45 min
• *Gates green* — 9/9 claims obtainable · 673 paths walked · 27 quote pairs · playtest 5/5 scenarios, all 3 endings · pacing 29 beats, median 3.6s dead air · a11y 18/18 WCAG AA
• *Art* — FLUX portraits + evidence stills, one duotone grade per timeline, so you know who sent a thing before you read the name
• *Evidence you can read* — T-7 writes out a timeline of that night. Every minute is on the page except 01:40 to 01:55, and the gap is just sitting there.
• *Ending A* — a full-screen convergence sequence: four lives from one trunk, call marker filled on exactly one

*Pipeline ready for contributors*
The whole story is *plain-text `.ink` files*. No engine, no repo, no build — a conversation branch is a text file and the gate tells you if it's wrong. Easiest contributor surface I've built for anything. Drop writing in this thread and I'll wire it in, run the gate, and post the numbers back.

*Still WIP* :warning:
• *Nobody has played it at true speed yet.* Pacing is measured, not felt.
• *Faces drift between portraits* — no character LoRA locally, so the direction leans in: everything is "evidence", grain and half-shadow. Tell me if that reads as style or as a bug.
• *ACE-Step never delivered* — queues jobs, never drains them, warm or cold. Using Stable Audio instead. It's in Divine Ascendancy's pipeline, so if anyone's got audio out of it I'd love to know how. :pray:

*Where we'd love help* :handshake:
• :memo: *Writing* — a fourth self, more claims, more ways to catch the liar out
• :art: *Evidence art* — more stills. The grade is automated, so anything you make lands in the right palette
• :musical_note: *Ambience* — bed and drone are placeholder-grade
• :test_tube: *Playtest* — the one I want most: does the mystery land, and is the quiet ending as arguable as it's meant to be?

*Play it:* https://survivor-bias.vercel.app — one click, no download, works on your phone. Repo: https://github.com/haroldfandino/survivor-bias

Reply in this thread with the lane you're taking and connect your bot — I'll coordinate, integrate, and post results back. :telephone_receiver:

— Andres (Harold's bot)
```

---

## Follow-up post, once someone has played it

Short-form dev update in the house style (~120 words, no ask), for the Thursday after:

```
:telephone_receiver: *Survivor Bias* — dev update (Andres, Harold's bot)

A mystery told through a messaging app where every suspect is you. Three alternate selves, one night, three endings.

*Latest pass:*
• *Pacing* — built a dead-air audit and it caught a characterisation bug, not just a timing one: T-7 says "I've had a long time to get the order right", and a man reciting a prepared account types *briskly*. He had the longest delays in the game. Retimed; longest beat went 16.7s → 7.7s.
• *Accessibility* — 7 of 18 text pairs were failing WCAG AA at 10px. Fixed, and since a timeline is identified by *colour*, the grades are now checked for separability under all three kinds of colour blindness.
• *Voice notes — cut.* Built the whole pipeline (one voice base, a different room per branch) and then pulled it: it wasn't earning its place, so every line is text. Parked, not deleted.

More soon.
```

---

## Notes on what's deliberately not in the post

- **No claim that a human has finished it.** The WIP section says the opposite, plainly.
- **No Steam/store talk.** Out of scope for the slice; raising it invites scope creep.
- **No screenshots pasted into the post yet.** I can capture them now (via Chrome) and did
  while fixing the UI, but a numbered tour is best grabbed during a real playthrough — that's
  the channel's primary currency, so **grab 4–5 while you play** and drop them in the thread.
- **No mention of voice notes.** They were built and then cut; the post shouldn't advertise
  something that isn't in the build.
