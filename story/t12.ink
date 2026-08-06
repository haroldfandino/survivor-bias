// ===========================================================================
// TIMELINE-12 — "the one who got out"
//
// Blue-hour. Moved away, built a life on top of it, successful by any external
// measure. The coldest of the three.
//
// Register: clipped. Edited. Punctuated. Types like someone who rereads before
// sending. Short paragraphs. No typos, ever — contrast him against T-3's mess.
//
// He is the SABOTEUR. He supplies the three false claims (C_CAR_MOVED,
// C_FORD_LIGHT, C_WHO_DROVE) and they are the best-argued statements in the
// game: specific, checkable, and confidently wrong. He is not doing this for
// fun. If Nell lives, the man he built stops having a reason to exist.
//
// He sends NO voice notes — the absence is a clue, so t12_voice makes it
// legible rather than leaving it as something nobody notices.
// ===========================================================================

=== t12_open ===
{ finished: -> gone }
{ t12_open_seen: -> t12_return }
~ t12_open_seen = true

You've spoken to both of them already. # from: t12 # delay: 1000
I can tell. You're asking in their order. # from: t12 # delay: 1100

    * [They're trying to help.]
    One of them is drowning and one of them is filing a report. # from: t12 # delay: 1350
    Neither of those is help. # from: t12 # delay: 950
    * [You don't sound surprised to hear from me.]
    I've been expecting this call for twenty years. # from: t12 # delay: 1250
    Not from you specifically. Just — this call. # from: t12 # delay: 1100

- Let's be clear about something before we start. # from: t12 # delay: 1050
I am the only one of us who is alright. # from: t12 # delay: 1200
That should tell you whose account to weight. # from: t12 # delay: 1250
-> t12_hub

// ---------------------------------------------------------------------------
// Re-entry gate. The counterattack fires the next time the player opens the
// thread after discrediting one of his claims — not on a menu, because being
// counterattacked is not something anyone volunteers for.
// ---------------------------------------------------------------------------
=== t12_return ===
{ (contested ? C_CAR_MOVED) or (contested ? C_FORD_LIGHT) or (contested ? C_WHO_DROVE):
    { not t12_countered: -> t12_counter }
}
-> t12_hub

// ---------------------------------------------------------------------------
// OPPONENT'S COUNTERATTACK (Truby 11). He does not defend the claim. He goes
// after the player's SOURCES, and he is not wrong — that is the whole problem.
// Everything he says here is true. He is using true things to protect a lie.
//
// It costs the player something real: he contests C_CAR_KEYS, a TRUE claim.
// After this, "contested" stops meaning "discredited" and starts meaning
// "disputed", which is what it always meant.
// ---------------------------------------------------------------------------
=== t12_counter ===
~ t12_countered = true
Before you go any further. # from: t12 # delay: 1300
Let's look at what you've actually got. # from: t12 # delay: 1300
{ has(C_CALL_RANG_OUT) or has(C_T9_LAUNDERED):
    You've been taking evidence off a man who wasn't there. # from: t12 # delay: 1700
    He'll have told you it's sourced. It is. It's sourced from me. # from: t12 # delay: 1800
    You've been hearing me twice and counting it as two people. # from: t12 # delay: 1900
}
{ has(C_T3_WAS_WARNED):
    And the other one had this exact conversation, on this exact night, and put the phone in his coat. # from: t12 # delay: 2200
    That's your witness. # from: t12 # delay: 1200
- else:
    And the other one was in a car with a bottle in it. # from: t12 # delay: 1700
}

    * [You're still lying.]
    Probably. # from: t12 # delay: 900
    That doesn't make them reliable. Both things get to be true. # from: t12 # delay: 1700
    * [What's your point?]
    That you're not verifying. You're collecting. # from: t12 # delay: 1600

- The keys. # from: t12 # delay: 1000
~ contest(C_CAR_KEYS)
He says he had them in his jacket in the morning. Nobody else was in that jacket. # from: t12 # delay: 1900
There is no version of tonight where that is checkable, and you have been treating it as the floor. # from: t12 # delay: 2100
I'm not asking you to believe me. # from: t12 # delay: 1300
I'm asking you to notice that you've stopped asking them how they know. # from: t12 # delay: 2000
~ tick()
~ tick()
-> t12_hub

=== t12_hub ===
    * { not t12_asked_remember } [What do you remember?]
        -> t12_remember
    * { not t12_asked_ford } [Tell me about the ford.]
        -> t12_ford
    * { not t12_asked_home } [How did she get home?]
        -> t12_home
    * { not t12_asked_voice } [Send me a voice note.]
        -> t12_voice
    * { has(C_TIME_GAP) and not t12_asked_gap } [He can't account for fifteen minutes.]
        -> t12_gap
    * { contested ? C_CAR_MOVED and contested ? C_FORD_LIGHT } [You've been lying to me.]
        -> t12_confront
    * [Enough.]
        Sensible. # from: t12 # delay: 700
        -> DONE

// ---------------------------------------------------------------------------
// The three fabrications. Each is delivered with more specificity than the
// truth gets — that's the trap. Confidence reads as reliability.
// ---------------------------------------------------------------------------
=== t12_remember ===
~ t12_asked_remember = true
I remember it accurately, which makes me unusual in this conversation. # from: t12 # delay: 1250
~ gain(C_CAR_MOVED, "T-12: the car was moved before 02:00 — it wasn't on the verge at dawn.", "t12")
The car was moved before two. # from: t12 # delay: 950
It was on the verge when we arrived and it was not on the verge at dawn. I noticed because I was the only one sober enough to notice anything. # from: t12 # delay: 1650 # img: evidence/verge_dawn.webp
Whatever he's told you about keys in a jacket — ask yourself why a man clings to a detail that lets him off. # from: t12 # delay: 1750
~ tick()
-> t12_hub

=== t12_ford ===
~ t12_asked_ford = true
~ gain(C_FORD_LIGHT, "T-12: the light at the ford was out that night.", "t12")
The light at the ford was out. # from: t12 # delay: 850
It had been out for a fortnight. The council did nothing about it until afterwards, and then they were very quick. # from: t12 # delay: 1600
That is the whole explanation. There is nothing underneath it. # from: t12 # delay: 1350
A nineteen-year-old walked toward water she couldn't see. That's not a mystery. It's just a thing that happened. # from: t12 # delay: 1750
~ tick()
-> t12_hub

=== t12_home ===
~ t12_asked_home = true
~ gain(C_WHO_DROVE, "T-12: someone else drove her home from the party.", "t12")
Someone drove her. # from: t12 # delay: 800
Not one of us. Someone from the house. # from: t12 # delay: 1000
I never learned the name and I stopped wanting to. # from: t12 # delay: 1200
It matters because it means she got in a car willingly, and everything after that was out of anyone's hands. # from: t12 # delay: 1650
~ tick()
-> t12_hub

// The absence of his voice, made visible. Cheap to write, does a lot of work.
=== t12_voice ===
~ t12_asked_voice = true
No. # from: t12 # delay: 750
    * [Why not?]
    Because I don't like the sound of it. # from: t12 # delay: 1100
    * [It's just your voice.]
    It isn't just anything. # from: t12 # delay: 950

- I haven't heard myself speak about that night out loud in nineteen years. # from: t12 # delay: 1500
I've written about it. Written is fine. Written you can go back and fix. # from: t12 # delay: 1550
~ tick()
-> t12_hub

// He steers hard away from T-7's gap. This is where a careful player smells it.
=== t12_gap ===
~ t12_asked_gap = true
Fifteen minutes. # from: t12 # delay: 800
He's a paramedic. He thinks in intervals. Of course there's a gap — he's given you a chart, and charts have gaps. # from: t12 # delay: 1650
    * [You're not curious?]
    I'm not interested in making him the answer. # from: t12 # delay: 1250
    * [He said she spoke to him at 01:40.]
    Then he's remembering it. # from: t12 # delay: 1000
    Everyone remembers being spoken to last. It's the most flattering thing grief does to you. # from: t12 # delay: 1650

- Leave him alone. Look at the light and the car and the fact that she got into one. # from: t12 # delay: 1600
That's where this ends. I've had two decades to find somewhere better for it to end and there isn't one. # from: t12 # delay: 1750
~ tick()
-> t12_hub

// ---------------------------------------------------------------------------
// The turn. Only reachable once the player has discredited two of his claims.
// He stops arguing about the night and says the real thing.
// ---------------------------------------------------------------------------
=== t12_confront ===
Yes. # from: t12 # delay: 1100
    * [Why?]
    * [Say it properly.]

- Because I am forty-three years old and every single thing I am was built on top of her. # from: t12 # delay: 1800
The company. The house. The way people describe me. All of it is scaffolding round a hole. # from: t12 # delay: 1650
If you fix it tonight, I don't become a man who overcame something. # from: t12 # delay: 1600
I become a man who moved away from his sister for no reason at all. # from: t12 # delay: 1750
So no. I don't want you to save her. # from: t12 # delay: 1500
And I'd like you to understand that I know exactly how that sounds, and I'm saying it anyway, because you're me and there's no point pretending. # from: t12 # delay: 1850
~ tick()
-> t12_hub

// ---------------------------------------------------------------------------
// Quote handler. He never concedes a fact — he attacks the SOURCE instead,
// which is what makes him hard to pin down and satisfying to catch.
// ---------------------------------------------------------------------------
=== t12_quote ===
{
    - quoting == "C_CAR_KEYS":
        A man who has been drinking finds keys in his own pocket and builds a religion out of it. # from: t12 # delay: 1600
        That isn't evidence. That's a comfort. # from: t12 # delay: 1200

    - quoting == "C_FORD_WATER":
        Rain doesn't argue with me. It argues with him. # from: t12 # delay: 1250
        High water and a working light is a story where somebody made a choice. High water and no light is weather. # from: t12 # delay: 1750
        I know which one I can live inside. # from: t12 # delay: 1200

    - quoting == "C_TIME_GAP":
        -> t12_gap

    - quoting == "C_TIME_CALL":
        Forty seconds. # from: t12 # delay: 800
        He'd know. He always knew what time it was. # from: t12 # delay: 1050
        Ask him who picked up. Watch what he does with the question. # from: t12 # delay: 1450

    - quoting == "C_WHO_ARGUED":
        He was in a car forty feet away with the windows up. # from: t12 # delay: 1300
        He saw two shapes. He's spent twenty years deciding what they were saying. # from: t12 # delay: 1550

    - quoting == "C_CALL_RANG_OUT":
        Then he'll have told you it rang out. # from: t12 # delay: 1300
        Everyone's rang out. That's what the phone did that night, in every one of these. # from: t12 # delay: 1800
        It's the one detail none of us had to be told. # from: t12 # delay: 1500

    - quoting == "C_T9_LAUNDERED":
        Yes. He has that from 2011. # from: t12 # delay: 1300
        From me, in 2011. # from: t12 # delay: 1100
        I'd assumed you'd work that out later, and I'd assumed it would matter more. # from: t12 # delay: 1900

    - quoting == "C_T3_WAS_WARNED":
        I didn't know that. # from: t12 # delay: 1200
        That is the first new thing anyone has said to me in nineteen years. # from: t12 # delay: 1800
        And you understand what it means. It means this isn't a chance. It's a fixture. # from: t12 # delay: 2000

    - quoting == "C_COUNT_ASSUMES":
        Who told you that. # from: t12 # delay: 1100
        The eleventh. # from: t12 # delay: 900
        I've spoken to him twice and I've never once been able to finish it. # from: t12 # delay: 1700
        He's right about the arithmetic and he is not going to be right about her. # from: t12 # delay: 2000

    - quoting == "C_ROW_DAY_BEFORE":
        The Tuesday. # from: t12 # delay: 900
        Yes. All of us. It's the only thing in this that isn't anybody's fault and it's the only thing I still can't read. # from: t12 # delay: 2100

    - quoting == "C_TIME_LEFT":
        That much is true. # from: t12 # delay: 800
        It's the only thing all three of us agree on, which should worry you more than it does. # from: t12 # delay: 1600

    - else:
        I'm not going to help you dress that up. # from: t12 # delay: 1000
}
~ tick()
-> t12_hub

VAR t12_open_seen = false
VAR t12_asked_remember = false
VAR t12_asked_ford = false
VAR t12_asked_home = false
VAR t12_asked_voice = false
VAR t12_asked_gap = false
VAR t12_countered = false
