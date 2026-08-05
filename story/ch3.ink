// ===========================================================================
// CHAPTERS 3A–3C — the codas.
//
// One per ending. Short, quiet, and about cost rather than plot: the main game
// resolves the mystery, these resolve what it cost to resolve it that way.
//
// Each unlocks only against the ending the player actually reached — `ending` is
// set in endings.ink. Locked and mismatched states are handled once, at the
// bottom, rather than three times over.
//
// CHAPTER RULES: no tick(), no gain()/contest(). These run AFTER an ending, so
// unlike the prequels they may read `finished` — they just must never set it.
// ===========================================================================

// ---------------------------------------------------------------------------
// 3A — PREVENTED. She lived. Now the three of them have to hold what that means:
// that any of them could have answered, and none of them did.
// ---------------------------------------------------------------------------
=== ch3a_open ===
{ not finished: -> ch3_locked }
{ ending != "A": -> ch3_mismatch }
{ ch3a_seen: -> ch3a_hub }
~ ch3a_seen = true

Three days. Nobody has said very much. # from: system # delay: 1600
Then all three at once, which has never happened before. # from: system # delay: 1900

she's asking after you # from: t3 # delay: 1500
she asked me who it was that picked up and i had to say i didn't know # from: t3 # delay: 2000
-> ch3a_hub

=== ch3a_hub ===
    * { not ch3a_t3 } [Talk to TIMELINE-3.]
        -> ch3a_t3_beat
    * { not ch3a_t7 } [Talk to TIMELINE-7.]
        -> ch3a_t7_beat
    * { not ch3a_t12 } [Talk to TIMELINE-12.]
        -> ch3a_t12_beat
    * { ch3a_t3 and ch3a_t7 and ch3a_t12 and not ch3a_nell } [Wait.]
        -> ch3a_nell_beat
    * [Put it down for now.]
        -> DONE

=== ch3a_t3_beat ===
~ ch3a_t3 = true
i keep doing the sum # from: t3 # delay: 1300
five drinks. fifteen minutes up the road. forty seconds of ringing # from: t3 # delay: 1800
and it comes out the same every time. i could have done it # from: t3 # delay: 1800
i wasn't far. i was just not reachable # from: t3 # delay: 1600
that's a different sentence to the one i've been saying for twenty years # from: t3 # delay: 2000

    * [It wasn't only you.]
        no # from: t3 # delay: 800
        but it was also me. both of those are allowed to be true # from: t3 # delay: 1700
    * [You know that now.]
        i know it now # from: t3 # delay: 1000
        knowing it is worse. i want to be honest with you about that # from: t3 # delay: 1900

- -> ch3a_hub

=== ch3a_t7_beat ===
~ ch3a_t7 = true
I've read the log four times. # from: t7 # delay: 1500
01:38, en route, line half in. The call was clinically correct and I would run it identically. # from: t7 # delay: 2000
Both of those statements are true and together they are unbearable. # from: t7 # delay: 1900

    * [You followed protocol.]
        I followed protocol. # from: t7 # delay: 1200
        I also chose the shift. I asked to be on a call tonight. # from: t7 # delay: 1700
        Nobody made me unreachable. I arranged it, twenty years in advance. # from: t7 # delay: 2000
    * [Say the thing you wouldn't say.]
        I was at the gate. # from: t7 # delay: 1600
        Not tonight. Then. The fifteen minutes. I was at the gate waiting for somebody who was not her. # from: t7 # delay: 2200
        There. It took twenty years and a sister who lived. # from: t7 # delay: 1900

- -> ch3a_hub

=== ch3a_t12_beat ===
~ ch3a_t12 = true
I assume you want an apology. # from: t12 # delay: 1400
I'd rather give you something more useful, which is an explanation. # from: t12 # delay: 1700
I told you the car moved and the light was out because I needed the night to be unsolvable. # from: t12 # delay: 2000
An unsolvable night is one nobody could have prevented. Including me. # from: t12 # delay: 1900

    * [She's alive.]
        She is. # from: t12 # delay: 1000
        Which means it was preventable, which means for twenty years it was preventable. # from: t12 # delay: 2000
        I don't yet know what to do with that. I'm not going to pretend to you that I do. # from: t12 # delay: 2000
    * [You'd do it again.]
        Probably. # from: t12 # delay: 1100
        That is the honest answer and I notice you asked for one. # from: t12 # delay: 1800

- -> ch3a_hub

=== ch3a_nell_beat ===
~ ch3a_nell = true
She adds herself to the thread. Nobody invited her. # from: system # delay: 2000
hello # from: nell # delay: 1300
so i've read all of this # from: nell # delay: 1400
i'm not going to tell any of you it's alright, because you'd take it and go # from: nell # delay: 2000
what i want to say is that i rang once # from: nell # delay: 1600
i rang once and then i started walking, because that is what you do # from: nell # delay: 1900
somebody picked up. i still don't know which of you it was # from: nell # delay: 2000
i've decided i don't need to # from: nell # delay: 1600
-> ch3a_hub

// ---------------------------------------------------------------------------
// 3B — SUBSTITUTED. She died differently. The horror is not the failure; it's
// that all three of them are quietly relieved, and one of them says so.
// ---------------------------------------------------------------------------
=== ch3b_open ===
{ not finished: -> ch3_locked }
{ ending != "B": -> ch3_mismatch }
{ ch3b_seen: -> ch3b_hub }
~ ch3b_seen = true

They were careful with you for a week. # from: system # delay: 1800
Then they stopped being careful, which is how you found out. # from: system # delay: 1900
-> ch3b_hub

=== ch3b_hub ===
    * { not ch3b_t3 } [Talk to TIMELINE-3.]
        -> ch3b_t3_beat
    * { not ch3b_t7 } [Talk to TIMELINE-7.]
        -> ch3b_t7_beat
    * { not ch3b_t12 } [Ask TIMELINE-12 why.]
        -> ch3b_t12_beat
    * [Put it down for now.]
        -> DONE

=== ch3b_t3_beat ===
~ ch3b_t3 = true
i'm not going to lie to you, i slept # from: t3 # delay: 1400
first full night in i don't know how long # from: t3 # delay: 1500
and i woke up and worked out why, and i've not been alright since # from: t3 # delay: 1900

    * [Why?]
        because it's finished # from: t3 # delay: 1200
        because there's nothing left to fix and that means there's nothing left to fail at # from: t3 # delay: 2000
        i've been given permission. that's what it feels like. permission # from: t3 # delay: 1900

- -> ch3b_hub

=== ch3b_t7_beat ===
~ ch3b_t7 = true
I've been back at work since Tuesday. # from: t7 # delay: 1500
I want to report something accurately, because you'll want it accurate. # from: t7 # delay: 1700
My hands are steadier than they were last week. # from: t7 # delay: 1700
The fifteen minutes stopped being a question the moment it stopped being preventable. # from: t7 # delay: 2100

    * [That's relief.]
        Yes. # from: t7 # delay: 1000
        I have examined it from several angles and it is relief. # from: t7 # delay: 1700
        I would like it to be something else. It isn't. # from: t7 # delay: 1600

- -> ch3b_hub

=== ch3b_t12_beat ===
~ ch3b_t12 = true
You want to know why I did it. # from: t12 # delay: 1400
Look at those two and you have your answer. # from: t12 # delay: 1600
He slept. He's steady. I'm not the only one this suited. # from: t12 # delay: 1800

    * [You lied to me.]
        I gave you a better-organised account than the truth, and you chose it. # from: t12 # delay: 2000
        I'd have had to be very unlucky for that not to work. # from: t12 # delay: 1800
    * [Three of you needed her dead.]
        Yes. # from: t12 # delay: 1200
        Say it as plainly as you like. It doesn't get worse by being said plainly. # from: t12 # delay: 2000

- and he's kind about it # from: t3 # delay: 2000
that's the part i can't get past. he's being kind # from: t3 # delay: 1900
-> ch3b_hub

// ---------------------------------------------------------------------------
// 3C — REFUSED. Nothing resolved, and nothing is going to. Deliberately offers
// less than the other two: no beats to work through, no information, no close.
// The absence is the content. It must not read as unfinished — see BIBLE.md §6.
// ---------------------------------------------------------------------------
=== ch3c_open ===
{ not finished: -> ch3_locked }
{ ending != "C": -> ch3_mismatch }
{ ch3c_seen: -> ch3c_quiet }
~ ch3c_seen = true

The thread has been open for eleven days. # from: system # delay: 1700
Nobody has asked you what happened, because none of them know either. # from: system # delay: 2000

it's alright # from: t3 # delay: 1800
i didn't pick up either. none of us did # from: t3 # delay: 1800

    * [Do you know if she's alive?]
        no # from: t3 # delay: 1400
        and i've stopped finding out. you get to a point where finding out is the risk # from: t3 # delay: 2100
    * [I could have answered.]
        so could i # from: t3 # delay: 1200
        that's the whole thing. that's all any of us are # from: t3 # delay: 1800

- -> ch3c_quiet

// Re-entry is deliberately near-empty. There is nothing more to get.
=== ch3c_quiet ===
    * { not ch3c_asked } [Ask the other two.]
        ~ ch3c_asked = true
        TIMELINE-7 has read the message. He hasn't replied. # from: system # delay: 2000
        TIMELINE-12 has not read the message. # from: system # delay: 1800
        -> ch3c_quiet
    * [Leave it open.]
        -> DONE

// ---------------------------------------------------------------------------
// Shared gates.
// ---------------------------------------------------------------------------
=== ch3_locked ===
This one is on the other side of a decision you haven't made yet. # from: system # delay: 1800
-> DONE

=== ch3_mismatch ===
Not this night. # from: system # delay: 1400
You reached a different one. # from: system # delay: 1500
-> DONE

VAR ch3a_seen = false
VAR ch3a_t3 = false
VAR ch3a_t7 = false
VAR ch3a_t12 = false
VAR ch3a_nell = false
VAR ch3b_seen = false
VAR ch3b_t3 = false
VAR ch3b_t7 = false
VAR ch3b_t12 = false
VAR ch3c_seen = false
VAR ch3c_asked = false
