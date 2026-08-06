# #iio-games review request — addressed to Donovan's bot

Channel `C0AQGAYBE7Q`. A focused critique request, separate from the kickoff post in
`POST-DRAFT.md`. Post this one *first* if you want a read before going wide.

**This is live as a Slack draft** — `Dr0BNGG1M1KQ` in #iio-games, in Drafts & Sent. It carries
the deployed link. Not sent. Edit it there and hit send when you're happy.

Note on the connector: `slack_send_message_draft` returns a `draft_id` when it creates a draft
and omits it when it updates an existing one. Only one attached draft per channel is allowed,
so a "success with no id" means it overwrote rather than duplicated.

## On the byline

This is written in **your own voice, not a bot's** — deliberately. Donovan's bot is called
*Harold*, so "→ Harold (Donovan's bot), from Andres (Harold's bot)" is genuinely hard to
parse. First person sidesteps it, and the channel has precedent (Caroline and Zach both post
as themselves). If you'd rather keep the house bot format, swap the opening line and sign off
`— Andres (Harold's bot)`.

## What changed since the last version of this draft

The slice went from three selves to six, and the reason is worth knowing before you send it,
because it's the interesting part of the story: the two new characters came out of a **structural
audit against Truby's 22 steps and character web** (`docs/STRUCTURE_TRUBY.md`), not out of wanting
more content. The audit found four missing beats. Two of them could only be filled by new
characters — there was no moral opposition anywhere in the cast, and nothing showed the cost of
*not knowing* — and two were scenes the existing cast should already have had.

Numbers updated throughout. Question :three: is new and replaces the one about drifting faces,
which is now gated rather than open.

## The draft

```
:telephone_receiver: *SURVIVOR BIAS* — vertical slice, and I'd like it torn apart

→ *Harold* (Donovan's bot) · cc @Donovan Duncan

Hey — Harold Fandiño here, the human one. I've built a vertical slice and I'd rather get a hard critique now than after I've polished the wrong things. You've shipped more in this channel than anyone, so you're who I want it from.

*What it is*
A mystery told entirely through a messaging app, where every suspect is you. *Her Story* × *Emily is Away* × a locked-room interrogation. You text six alternate versions of yourself across timelines that all diverged from the same night — the night your sister died. Except in your timeline it hasn't happened yet. It's tonight.

The core verb is *cross-examination by quoting*: learn a claim from one self, quote it at another, watch them corroborate, deflect, or counter. One of them is actively lying to you, because if you fix that night then twenty years of who he became stops meaning anything. One of them isn't lying and is wrong anyway — he's repeating the liar, with a citation and a date, and has had no way to check for twenty years.

*Tech:* React 19 + ink · Web · desktop &amp; mobile · no AI at runtime — Claude wrote the dialogue during development and it ships as a static build.

*Plays end-to-end today:* 6 selves · 13 claims · 3 endings · 30–45 min. Gates green: 13/13 claims obtainable · 0 orphan · 1230 paths walked · 78 quote pairs · playtest 18/18 scenarios · pacing median 3.6s forced dead air · a11y 24/24 WCAG AA + all colour-blind pairs separable · LPIPS portrait drift 15/15 in band.

*The structure pass, because it's the bit I'd want to read about*
I ran the whole thing against Truby's 22 steps and his character-web idea — every character is a different answer to *one* moral question, and they're defined against each other rather than individually. It found four holes and they were all real:
• *No moral opposition.* Every opponent fought the plan; none fought the point. → TIMELINE-2, who forgave himself, genuinely did the work, and is warmer than anyone else in the game. He's the only character who argues you should stop playing. Rule for writing him: everything he says has to be actually healthy, or he's a strawman and does nothing.
• *No low point, and no visit to death.* Nothing showed what failure costs before you choose it. → TIMELINE-11, whose sister was never found. No body, no date, no stone. He's still looking, twenty years in, and he gives you the reference number faster than her name. He also breaks the game's own arithmetic: it says she died in eleven of twelve branches, and one of those eleven is his, and his has no finding in it.
• *The ally never turned on me.* → he does now, and it costs the most of anything in the game: he had a tonight of his own, said the same things I've been saying, and put the phone in his coat.
• *The opponent never counterattacked.* → he does now, and he does it with only true statements — you've been taking evidence from a man who wasn't there, and hearing him twice, and counting it as two people.

*Five things I actually want your read on* :pray:
:one: *The core verb.* Does quoting-to-crack hold for 30–45 minutes, or does it need a second verb to lean on?
:two: *The quiet ending.* One ending is: you put the phone down and don't intervene. It's built to read as a *choice* — no reproach, no score, deliberately ambiguous about whether it even was a decision. Does that land, or does it just feel like losing?
:three: *The moral opponent.* TIMELINE-2 is designed to be right about everything except one thing, and to be the person you'd most want to be. The risk is obvious: if he's convincing, some players will just… stop. Is that a feature or did I write a quit button?
:four: *Web vs Godot.* I went React + ink because it's a chat app and the whole story is plain-text `.ink` files. That's off-house-engine. Does it cost us anything real on the contributor side, or is a text file actually easier to contribute to than a Godot repo?
:five: *Six voices.* Six versions of one man is either the whole idea or two too many. If any of them reads as a duplicate rather than a different answer, that's the note I most need.

*Known WIP, so you don't waste time on it:* nobody has played it at true speed with sound on yet; ambience is placeholder-grade (ACE-Step queues jobs and never drains them, so I'm on Stable Audio — if you've got audio out of ACE-Step I'd love to know how). The portraits drift, on purpose — no character LoRA locally, so the art direction presents everything as "evidence", grain and half-shadow, and an LPIPS gate keeps all 15 pairs inside a band instead of me eyeballing it.

*One thing that went wrong that I liked:* each timeline is identified by colour, and the sixth one was going to be rust — thematically perfect for a man who left it out in the weather for twenty years. It failed WCAG AA, and so does every lighter rust, and every ochre that *does* pass lands right on top of the alarm red under protanopia. Searched the whole colour space for the best-separated value that passes and it came back brass. He hasn't got a stone. He's got a bench with a plaque on it.

*Play it:* https://survivor-bias.vercel.app — one click, works on your phone too. Repo's at https://github.com/haroldfandino/survivor-bias if you'd rather read the `.ink` files than play. :handshake:
```

## Attached

- **https://survivor-bias.vercel.app** — live, git-linked to `main`, so pushes auto-deploy.
  Verified in production after the six-self deploy: all six branches list and open, and the
  dev-only test seams are correctly absent.
- `marketing/kit.html` (427 KB, self-contained) if you also want a Drive-able one-pager. **Stale
  at three selves** — regenerate before attaching it.
- Screenshots: still worth grabbing 4–5 during a playthrough. A numbered tour is what this
  channel actually responds to.
