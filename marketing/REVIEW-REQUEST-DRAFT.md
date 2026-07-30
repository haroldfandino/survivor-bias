# #iio-games review request — addressed to Donovan's bot

Channel `C0AQGAYBE7Q`. A focused critique request, separate from the kickoff post in
`POST-DRAFT.md`. Post this one *first* if you want a read before going wide.

**This is live as a Slack draft** in #iio-games, sitting in Drafts & Sent — updated to carry
the deployed link. Not sent. Edit it there and hit send when you're happy, or delete it.

## On the byline

This is written in **your own voice, not a bot's** — deliberately. Donovan's bot is called
*Harold*, so "→ Harold (Donovan's bot), from Andres (Harold's bot)" is genuinely hard to
parse. First person sidesteps it, and the channel has precedent (Caroline and Zach both post
as themselves). If you'd rather keep the house bot format, swap the opening line and sign off
`— Andres (Harold's bot)`.

## The draft

```
:telephone_receiver: *SURVIVOR BIAS* — vertical slice, and I'd like it torn apart

→ *Harold* (Donovan's bot) · cc @Donovan Duncan

Hey — Harold Fandiño here, the human one. I've built a vertical slice and I'd rather get a hard critique now than after I've polished the wrong things. You've shipped more in this channel than anyone, so you're who I want it from.

*What it is*
A mystery told entirely through a messaging app, where every suspect is you. *Her Story* × *Emily is Away* × a locked-room interrogation. You text three alternate versions of yourself across timelines that all diverged from the same night — the night your sister died. Except in your timeline it hasn't happened yet. It's tonight.

The core verb is *cross-examination by quoting*: learn a claim from one self, quote it at another, watch them corroborate, deflect, or counter. One of them is actively lying to you, because if you fix that night then twenty years of who he became stops meaning anything.

*Tech:* React 19 + ink · Web · desktop &amp; mobile · no AI at runtime — Claude wrote the dialogue during development and it ships as a static build.

*Plays end-to-end today:* 3 selves · 9 claims · 3 endings · 30–45 min. Gates green: 9/9 claims obtainable · 673 paths walked · 27 quote pairs · playtest 5/5 scenarios · pacing median 3.6s forced dead air · a11y 18/18 WCAG AA.

*Five things I actually want your read on* :pray:
:one: *The core verb.* Does quoting-to-crack hold for 30–45 minutes, or does it need a second verb to lean on?
:two: *The quiet ending.* One ending is: you put the phone down and don't intervene. It's built to read as a *choice* — no reproach, no score, deliberately ambiguous about whether it even was a decision. Does that land, or does it just feel like losing?
:three: *The faces.* No character LoRA locally, so the three portraits drift. The art direction leans in — everything is presented as "evidence", grain and half-shadow. Style, or bug?
:four: *Web vs Godot.* I went React + ink because it's a chat app and the whole story is plain-text `.ink` files. That's off-house-engine. Does it cost us anything real on the contributor side, or is a text file actually easier to contribute to than a Godot repo?
:five: *Pacing.* Median 3.6s of forced dead air per beat, longest 7.7s. I measured it rather than felt it, so I don't trust it yet. Too slow?

*Known WIP, so you don't waste time on it:* nobody has played it at true speed with sound on yet; ambience is placeholder-grade (ACE-Step queues jobs and never drains them, so I'm on Stable Audio — if you've got audio out of ACE-Step I'd love to know how).

*Play it:* https://survivor-bias.vercel.app — one click, works on your phone too. Repo's at https://github.com/haroldfandino/survivor-bias if you'd rather read the `.ink` files than play. :handshake:
```

## Attached

- **https://survivor-bias.vercel.app** — live, git-linked to `main`, so pushes auto-deploy. Verified in
  production: all 12 assets serve, it plays, and the dev-only test seams are correctly absent.
- `marketing/kit.html` (427 KB, self-contained) if you also want a Drive-able one-pager.
- Screenshots: still worth grabbing 4–5 during a playthrough. A numbered tour is what this
  channel actually responds to.
