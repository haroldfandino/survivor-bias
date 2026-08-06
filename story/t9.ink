// ===========================================================================
// TIMELINE-9 — "the one who didn't go"
//
// Paper. The only self who wasn't at the party. He and Nell argued the day
// before, so he stayed home — and at 01:38 he was awake and watched her name
// come up and let it ring. The other three COULDN'T answer. He chose not to.
//
// Register: careful, past-tense, SOURCED. He cites. "According to", "he told me
// in 2011", "that's from T-12, not from me". The only self who gives provenance,
// which is exactly why he sounds like the reliable one.
//
// THE MECHANIC HE EXISTS FOR — corroboration is not verification.
//
// Having no account of his own, he assembled everyone else's into a file. So he
// restates T-12's fabrications as established fact, with a date attached. The
// player hears two independent sources agreeing. One is an echo.
//
// He is also the ONLY self who can be changed by evidence: put a contested claim
// to him and he goes back through the file, finds where he got it, and says so.
// Nobody else in this game ever revises anything.
//
// Tags inline only — see the header note in t3.ink.
// ===========================================================================

=== t9_open ===
{ finished: -> gone }
{ t9_open_seen: -> t9_hub }
~ t9_open_seen = true

You'll have spoken to the other three by now. # from: t9 # delay: 1200
I should say up front that I wasn't there. # from: t9 # delay: 1300

    * [You weren't at the party?]
    No. I didn't go. # from: t9 # delay: 900
    * [Then why am I talking to you?]
    Because I'm the only one of us who kept a record. # from: t9 # delay: 1400

- So everything I have, I have second-hand. I want to be clear about that before I give you any of it. # from: t9 # delay: 1600
I've spent twenty years writing down what the other three told me, because I had nothing of my own to write down. # from: t9 # delay: 1800
~ tick()
-> t9_hub

=== t9_hub ===
    * { not t9_asked_why } [Why didn't you go?]
        -> t9_why
    * { not t9_asked_file } [What's in the file?]
        -> t9_file
    * { has(C_TIME_CALL) and not t9_asked_call } [She made a call at 01:38.]
        -> t9_call
    * { t9_asked_call and not t9_asked_awake } [Were you awake?]
        -> t9_awake
    * { t9_asked_awake and not t9_asked_watched } [You watched it ring.]
        -> t9_watched
    * [That's enough for now.]
        Of course. The file isn't going anywhere. # from: t9 # delay: 1100
        -> DONE

// ---------------------------------------------------------------------------
// His wound. Not the night — the day before it.
// ---------------------------------------------------------------------------
=== t9_why ===
~ t9_asked_why = true
~ gain(C_ROW_DAY_BEFORE, "T-9 and Nell argued the day before; he stayed home because of it.", "t9")
We'd had a row. The day before. # from: t9 # delay: 1100
About nothing — genuinely nothing, I've had twenty years to find the something in it and there isn't one. # from: t9 # delay: 1800
So when she asked if I was coming out to the thing at the ford, I said no. # from: t9 # delay: 1500
And that is the entire difference between me and the three of them. They were all there. # from: t9 # delay: 1700
~ tick()
-> t9_hub

// ---------------------------------------------------------------------------
// The laundering. He hands over a T-12 fabrication with a date and a source,
// which is what makes it land as fact rather than as testimony.
// ---------------------------------------------------------------------------
=== t9_file ===
~ t9_asked_file = true
Times, mostly. Who said what, and when they said it to me. # from: t9 # delay: 1300
Some of it is firm. The car, for instance — that's settled. # from: t9 # delay: 1400
~ gain(C_T9_LAUNDERED, "T-9's file records the car as moved before 02:00 — sourced from T-12 in 2011.", "t9")
It was moved before two. I have that from 2011, and I've never had cause to revisit it. # from: t9 # delay: 1900
{ known ? C_CAR_MOVED:
    I gather you've heard that already. Then we agree, which is usually a good sign. # from: t9 # delay: 1800
}
~ tick()
-> t9_hub

// ---------------------------------------------------------------------------
// The one thing that is genuinely his. First-hand, and true.
// ---------------------------------------------------------------------------
=== t9_call ===
~ t9_asked_call = true
~ gain(C_CALL_RANG_OUT, "T-9 saw the 01:38 call come in on his own phone. It rang out.", "t9")
Yes. 01:38. # from: t9 # delay: 1000
And that one isn't from anybody's account. That one's mine. # from: t9 # delay: 1400
She called me. My phone, in my house, at 01:38. # from: t9 # delay: 1600
It rang out. # from: t9 # delay: 1300
~ tick()
-> t9_hub

// First press. He reaches for the passive.
=== t9_awake ===
~ t9_asked_awake = true
I missed it. # from: t9 # delay: 1100
    * [You missed it.]
    That's the phrase I've used for twenty years, yes. # from: t9 # delay: 1600
    * [Missed it, or didn't answer it?]
    You've talked to him, then. He asks it that way too. # from: t9 # delay: 1800

- It's the sentence I settled on early and I've never had to defend it, because nobody ever asks the follow-up. # from: t9 # delay: 2000
You've asked the follow-up. # from: t9 # delay: 1300
~ tick()
-> t9_hub

// Second press. The confession — and the line that connects him to the player.
=== t9_watched ===
~ t9_asked_watched = true
~ contest(C_CALL_RANG_OUT)
I was sitting up. Reading, I think, though I've stopped trusting that detail. # from: t9 # delay: 1700
The phone was face up on the arm of the chair and her name came up on it. # from: t9 # delay: 1800
I looked at it until it stopped. # from: t9 # delay: 1600
The other three will tell you they couldn't answer, and they're telling you the truth. One was drunk, one was at the gate, one was asleep three hundred miles away. # from: t9 # delay: 2000
I could have answered. # from: t9 # delay: 1500
That's the whole of my contribution to this. I'm the one who found out what it costs, and it turns out the answer is everything, and it takes about four seconds. # from: t9 # delay: 2000
~ tick()
-> t9_hub

// ---------------------------------------------------------------------------
// Quote handler.
//
// This is the character's real function. He is the only self who REVISES: put a
// contested claim to him and he traces it back through the file to its source.
// Every other self defends; he checks.
// ---------------------------------------------------------------------------
=== t9_quote ===
{
    // The payoff. He discovers his "settled" fact has one source, and that source
    // has already been caught out.
    - quoting == "C_CAR_MOVED" or quoting == "C_T9_LAUNDERED":
        { contested ? C_CAR_MOVED:
            Then let me go back through it. # from: t9 # delay: 1300
            ~ contest(C_T9_LAUNDERED)
            ...I have one source for the car. One. Entered in 2011, and it's him. # from: t9 # delay: 2000
            I've been treating that as settled for fifteen years because two of us said it, and now I look at it properly, it was never two of us. It was him, and then me repeating him. # from: t9 # delay: 2000
            I'm sorry. That's a serious thing to have done. # from: t9 # delay: 1700
        - else:
            The car was moved before two. That's in the file. # from: t9 # delay: 1400
            If you've got something that contradicts it, bring me that and I'll go back through it. # from: t9 # delay: 1800
        }

    - quoting == "C_FORD_LIGHT":
        { contested ? C_FORD_LIGHT:
            Also him. Also 2011. # from: t9 # delay: 1200
            ~ contest(C_T9_LAUNDERED)
            I'm beginning to see the shape of my own file and I don't care for it. # from: t9 # delay: 1800
        - else:
            The light being out is in there, yes. Same source as the car. # from: t9 # delay: 1500
            I'd never noticed they came in together. # from: t9 # delay: 1500
        }

    - quoting == "C_TIME_GAP":
        Fifteen minutes he can't account for. # from: t9 # delay: 1300
        I have that gap in the file too. I assumed it was a gap in his memory. # from: t9 # delay: 1700
        Sitting here, I notice I never asked him to fill it. Nobody wants to be the one who asks. # from: t9 # delay: 1900

    - quoting == "C_CAR_KEYS":
        The keys are the firmest thing anyone's ever given me. # from: t9 # delay: 1500
        He told me that in the first month, before anyone had a story to protect. Earliest entries are the ones I'd stake something on. # from: t9 # delay: 1900

    - quoting == "C_TIME_CALL" or quoting == "C_CALL_RANG_OUT":
        01:38. Forty seconds. # from: t9 # delay: 1100
        Which matches my phone exactly, and mine is the one record in this that nobody had to remember. # from: t9 # delay: 1800

    - quoting == "C_WHO_DROVE":
        No. Nobody drove her. # from: t9 # delay: 1000
        ~ contest(C_WHO_DROVE)
        That one I did check, years ago — it's the only thing I ever went back on him about. Every car was still there in the morning. # from: t9 # delay: 2000

    - else:
        Let me see if that's in the file. # from: t9 # delay: 1300
        It isn't. Which doesn't make it wrong, it makes it unrecorded. # from: t9 # delay: 1600
}
~ tick()
-> t9_hub

VAR t9_open_seen = false
VAR t9_asked_why = false
VAR t9_asked_file = false
VAR t9_asked_call = false
VAR t9_asked_awake = false
VAR t9_asked_watched = false
