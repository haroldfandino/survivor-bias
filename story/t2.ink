// ===========================================================================
// TIMELINE-2 — "the one who forgave himself"
//
// Ice. Pale, cold, clear.
//
// TRUBY ROLE: moral opponent (docs/STRUCTURE_TRUBY.md). Every other opponent
// fights the PLAN. He fights the PREMISE. He is the only character in the game
// who argues the player should stop playing.
//
// THE RULE FOR WRITING HIM: everything he says must be genuinely healthy. He is
// not in denial — T-12 is in denial, and T-12 is frightened. T-2 is not
// frightened of anything. He went to therapy, he did the work, he grieved his
// sister and he put it down, and he is warmer than any of the others.
//
// The danger is that he is RIGHT about everything except the one thing. If the
// player accepts his frame, they don't act. So he must never be a strawman: no
// smugness, no platitudes, no wellness vocabulary. He should be the person you
// would most want to be, and the reason you can't be him tonight.
//
// He does not lie, withhold, or launder. He gives no claims, because he stopped
// collecting them fifteen years ago — and that is itself a position on the moral
// problem, not an absence of one.
//
// Register: unhurried, plain, kind. Short paragraphs. Asks the player questions
// and waits. The only self who is curious about the player rather than about the
// night.
// ===========================================================================

=== t2_open ===
{ finished: -> gone }
{ t2_open_seen: -> t2_hub }
~ t2_open_seen = true

Hello. # from: t2 # delay: 1000
I'll be honest with you, I nearly didn't pick this up. # from: t2 # delay: 1500

    * [Why not?]
    Because I know what this is. # from: t2 # delay: 1200
    * [You knew it was me?]
    Who else calls on this. # from: t2 # delay: 1300

- It's the night. It's always the night. One of us gets going and then we all get pulled back in for a fortnight. # from: t2 # delay: 1900
I'm not going to be much use to you. I want to say that at the start rather than let you find it out slowly. # from: t2 # delay: 2000
~ tick()
-> t2_hub

=== t2_hub ===
    * { not t2_asked_useless } [Why won't you be useful?]
        -> t2_useless
    * { not t2_asked_how } [How did you stop?]
        -> t2_how
    * { count_known() >= 3 and not t2_asked_should } [Should I be doing this at all?]
        -> t2_should
    * { (contested ? C_TIME_GAP) and not t2_asked_blame } [One of you is at fault.]
        -> t2_blame
    * [I should keep going.]
        You should. I mean that. # from: t2 # delay: 1300
        I'd just rather you knew there was another door. # from: t2 # delay: 1500
        -> DONE

// ---------------------------------------------------------------------------
// His position, stated without defensiveness. He is not hiding a wound; he
// closed it.
// ---------------------------------------------------------------------------
=== t2_useless ===
~ t2_asked_useless = true
Because I've stopped keeping it. # from: t2 # delay: 1200
I could have told you the running order of that night once. Times, who was where, all of it. I had it the way he has it. # from: t2 # delay: 1900
And then at some point in my thirties I noticed I was maintaining it. Like a garden. # from: t2 # delay: 1800
So I stopped, and it went, and I let it. # from: t2 # delay: 1500
I know how that sounds to you tonight. # from: t2 # delay: 1400
~ tick()
-> t2_hub

=== t2_how ===
~ t2_asked_how = true
Slowly, and with help, and it took about four years. # from: t2 # delay: 1500
There wasn't a moment. I'd have loved a moment. # from: t2 # delay: 1400
What there was, was a Tuesday where I realised I hadn't thought about the ford in eight days, and I didn't panic about that. # from: t2 # delay: 2000
That was the whole thing. Not forgetting her. Not minding that I'd gone eight days. # from: t2 # delay: 1800
    * [That sounds like letting her go.]
    It might be. I've turned that over a lot. # from: t2 # delay: 1700
    I decided I'd rather be someone who can hold her lightly than someone who can only hold her at all. # from: t2 # delay: 2000
    * [I don't think I could do that.]
    No. Not tonight you couldn't. # from: t2 # delay: 1500
    Tonight is the worst possible night to be told any of this, and I'm telling you anyway, because nobody told me. # from: t2 # delay: 2000

- ~ tick()
-> t2_hub

// ---------------------------------------------------------------------------
// The moral attack. Not on the plan — on the point. He does not raise his voice
// and he does not overstate it, which is what makes it land.
// ---------------------------------------------------------------------------
=== t2_should ===
~ t2_asked_should = true
Honestly? I don't know. # from: t2 # delay: 1300
I'll tell you what I'd want you to at least look at. # from: t2 # delay: 1500
Three of them have spent twenty years assembling a case, and tonight somebody finally turned up who can do something with it. # from: t2 # delay: 2000
Look at what that's worth to them. # from: t2 # delay: 1500
    * [They want to save her.]
    Some of that, yes. # from: t2 # delay: 1300
    And some of it is that being the one who solved it would make the twenty years mean something. # from: t2 # delay: 1900
    * [You think they're using me.]
    I think they'd be horrified to hear it put that way, and I think it's true anyway. # from: t2 # delay: 2000

- Here's the part I'd actually ask you to sit with. # from: t2 # delay: 1600
If you fix tonight, you get her back. # from: t2 # delay: 1400
And you also get to be the one who did it, forever, and so does the version of you that had to be told. # from: t2 # delay: 2000
I'm not saying don't. # from: t2 # delay: 1300
I'm saying know which of those two you're doing it for, because you won't get to ask afterwards. # from: t2 # delay: 2000
~ tick()
-> t2_hub

// ---------------------------------------------------------------------------
// Once the player has the gap, he refuses to help them use it. This is the
// clearest expression of his position: he will not join the prosecution.
// ---------------------------------------------------------------------------
=== t2_blame ===
~ t2_asked_blame = true
I know. # from: t2 # delay: 1100
    * [You know which one?]
    I worked it out in about 2009. # from: t2 # delay: 1500
    * [And you never said?]
    Who would I have said it to. # from: t2 # delay: 1600

- I worked it out and then I had to decide what to do with a thing like that, and what I decided was nothing. # from: t2 # delay: 2000
He was nineteen. So was I. So were you. # from: t2 # delay: 1600
He has spent twenty-two years on an ambulance because of fifteen minutes when he was a boy, and I do not think there is anybody left to punish. # from: t2 # delay: 2200
    * [She's still dead in your timeline.]
    Yes. # from: t2 # delay: 1300
    Both things are true and I've stopped needing them to cancel. # from: t2 # delay: 1800
    * [That's not forgiveness, that's just quitting.]
    It might be. # from: t2 # delay: 1400
    I've had that argument with myself for fifteen years and I've never once won it cleanly. # from: t2 # delay: 1900

- Do what you're going to do tonight. I'm not going to help you build a case against a nineteen-year-old. # from: t2 # delay: 2100
~ tick()
-> t2_hub

// ---------------------------------------------------------------------------
// Quote handler. He is the one self who will not engage with evidence as
// evidence — he answers the human question underneath it instead. Note he never
// contests anything: refusing the frame is not the same as disputing the fact.
// ---------------------------------------------------------------------------
=== t2_quote ===
{
    - quoting == "C_TIME_GAP":
        Fifteen minutes. # from: t2 # delay: 1200
        I'm not going to help you close that. I've told you why. # from: t2 # delay: 1600

    - quoting == "C_CAR_MOVED" or quoting == "C_FORD_LIGHT" or quoting == "C_WHO_DROVE":
        He'd know better than me. I gave all that up. # from: t2 # delay: 1600
        I'll say this though — he was always very sure, and being sure was never his strong suit. Make of that what you like. # from: t2 # delay: 2000

    - quoting == "C_CALL_RANG_OUT":
        She called me too. # from: t2 # delay: 1300
        // Branch logic: each self is the SAME brother in a different timeline, so
        // there is exactly one call per branch. The horror isn't one call to many
        // people — it's the same call, made in every timeline, answered in none.
        Not instead of him. As well as. In my timeline, my house, that minute. # from: t2 # delay: 2000
        That's the bit none of them will say out loud, because it means it isn't one call that went unanswered. # from: t2 # delay: 2100
        It's the same call, every time, and it has never once been picked up. # from: t2 # delay: 2000

    - quoting == "C_ROW_DAY_BEFORE":
        We all had that row. Every one of us, same Tuesday, same nothing. # from: t2 # delay: 1900
        It's the only thing in this whole business that every timeline agrees on and nobody thinks is important. # from: t2 # delay: 2000

    - else:
        I'd only be repeating one of them, and you can get that from the source. # from: t2 # delay: 1700
}
~ tick()
-> t2_hub

VAR t2_open_seen = false
VAR t2_asked_useless = false
VAR t2_asked_how = false
VAR t2_asked_should = false
VAR t2_asked_blame = false
