// ===========================================================================
// TIMELINE-7 — "the one who atoned"
//
// Hospital-green. Became a paramedic because of it. Precise, calm, generous
// with detail, the easiest of the three to trust.
//
// Register: complete sentences. Timestamps. Clinical nouns. Never swears.
// Answers the question ADJACENT to the one you asked.
//
// The engine of this character: his precision is his armour, and it is also
// what gives him away. He can account for every minute of that night except
// 01:40 to 01:55 — and he volunteers the timeline so readily that the hole in
// it becomes visible without him ever admitting to one. That is how the player
// obtains C_TIME_GAP: not by catching him out, but by letting him talk.
//
// He is the one actually at fault. He does not lie. He omits.
// ===========================================================================

=== t7_open ===
{ finished: -> gone }
{ t7_open_seen: -> t7_hub }
~ t7_open_seen = true

I wondered when you'd get to me. # from: t7 # delay: 1500
Three of us reachable, and you went to him first. That's alright. Everyone goes to him first. # from: t7 # delay: 2200

    * [He said it's happening tonight.]
    Then we should be efficient. # from: t7 # delay: 1200
    * [Why does everyone go to him first?]
    Because he cries. # from: t7 # delay: 1400
    People find that easier than the alternative. # from: t7 # delay: 1800

- I'll tell you whatever you want to know. I've had a long time to get the order right. # from: t7 # delay: 2000
-> t7_hub

=== t7_hub ===
    * { not t7_asked_night } [Walk me through that night.]
        -> t7_night
    * { not t7_asked_call and has(C_TIME_CALL) } [Who did she call?]
        -> t7_call
    * { not t7_asked_job } [You became a paramedic.]
        -> t7_job
    * { has(C_TIME_GAP) and not t7_asked_gap } [You've accounted for every minute but fifteen.]
        -> t7_gap
    * { t7_asked_gap } [Answer the question.]
        -> t7_gap_pressed
    * [I need to go.]
        Of course. # from: t7 # delay: 900
        I'll be here. I'm always here. # from: t7 # delay: 1300
        -> DONE

// ---------------------------------------------------------------------------
// The timeline. He volunteers it in exhaustive order — and hands the player
// the gap in the process. Note he narrates himself out of the account at 01:40
// and back into it at 01:55 without marking the seam.
// ---------------------------------------------------------------------------
=== t7_night ===
~ t7_asked_night = true
Right. From the top, and I'll keep to what I actually saw. # from: t7 # delay: 1600
23:10 — we arrive. You park on the verge because the drive is full. # from: t7 # delay: 1800
00:15 to about 01:00 — she's inside. Kitchen, mostly. She's fine. She's laughing at someone. # from: t7 # delay: 2400
~ gain(C_TIME_CALL, "Nell made a call at 01:38 that lasted about forty seconds.", "t7")
01:38 — she makes a call. Forty seconds, give or take. She's on the porch for it. # from: t7 # delay: 2300
01:40 — she comes off the porch. # from: t7 # delay: 1600
01:55 — I'm at the gate. The music's still going. # from: t7 # delay: 2000
02:05 — that's when I start looking properly. # from: t7 # delay: 1800
~ gain(C_TIME_GAP, "T-7 accounts for every minute of that night except 01:40 to 01:55.", "t7")
I wrote it out properly, years ago. # from: t7 # delay: 1900 # img: evidence/timeline_scan.webp
That's the whole of it. Ask me anything inside that and I'll tell you. # from: t7 # delay: 2100
~ tick()
-> t7_hub

=== t7_call ===
~ t7_asked_call = true
I don't know who she called. # from: t7 # delay: 1300
I know it wasn't the house phone and I know it wasn't a taxi, because I checked both. Later. When checking things was all there was to do. # from: t7 # delay: 2600
Forty seconds is a long time for no answer and a short time for a conversation. # from: t7 # delay: 2200
Make of that what you like. I've made everything of it I can. # from: t7 # delay: 2000
~ tick()
-> t7_hub

=== t7_job ===
~ t7_asked_job = true
Twenty-two years next March. # from: t7 # delay: 1300
People assume that's penance. It isn't. Penance implies it helps. # from: t7 # delay: 2200
It's just that I know exactly how long fifteen minutes is now. To the second. In a way I didn't then. # from: t7 # delay: 2600
I know what can be undone inside fifteen minutes and I know what can't. # from: t7 # delay: 2400
~ tick()
-> t7_hub

// ---------------------------------------------------------------------------
// First press. He does not deny — he reframes, and the reframe is the tell.
// ---------------------------------------------------------------------------
=== t7_gap ===
~ t7_asked_gap = true
I've accounted for everything I saw. # from: t7 # delay: 1700
You're asking me to account for what I did, which is a different question, and you should be precise about which one you're asking. # from: t7 # delay: 2600
    * [I'm asking where you were.]
    I was at the party. # from: t7 # delay: 1200
    * [What did you do?]
    I want you to understand that I have never once said a false thing about that night. # from: t7 # delay: 2500
    Not to you. Not to anyone. # from: t7 # delay: 1600

- Ask him. He was in the car the whole time. He'll tell you nothing happened. # from: t7 # delay: 2300
He genuinely believes that. I've never taken it off him. # from: t7 # delay: 2000
~ tick()
-> t7_hub

// Second press, only after the first. He comes closest to it here and stops.
=== t7_gap_pressed ===
~ contest(C_TIME_GAP)
No. # from: t7 # delay: 1400
Here is what I'll give you, and it's more than I've given anyone. # from: t7 # delay: 2200
At 01:40 she came off that porch and she said something to me. # from: t7 # delay: 2500
And at 01:55 I was at the gate, and I was on my own. # from: t7 # delay: 2400
You can do the arithmetic. I've done it every night for twenty-two years and it comes out the same way every time. # from: t7 # delay: 2800
Don't ask me to say it. You're the only one who can still not need me to. # from: t7 # delay: 2600
~ tick()
-> t7_hub

// ---------------------------------------------------------------------------
// Quote handler. He is the factual authority: quoting T-12's fabrications at
// him is the cleanest way to discredit them.
// ---------------------------------------------------------------------------
=== t7_quote ===
{
    - quoting == "C_WHO_DROVE":
        No. Nobody drove her. # from: t7 # delay: 1300
        ~ contest(C_WHO_DROVE)
        There were four cars on that verge and every one of them was still there at dawn. I know because I sat and looked at them. # from: t7 # delay: 2600
        Whoever told you that is telling you a story with a car in it because a car means it was quick. # from: t7 # delay: 2600

    - quoting == "C_CAR_MOVED":
        It didn't move. # from: t7 # delay: 1100
        ~ contest(C_CAR_MOVED)
        He had the keys in his jacket. I watched him find them the next morning and I watched what it did to him. # from: t7 # delay: 2600

    - quoting == "C_FORD_LIGHT":
        The light was on. # from: t7 # delay: 1200
        ~ contest(C_FORD_LIGHT)
        I can tell you the exact colour of the water because of that light. # from: t7 # delay: 2000
        If it had been out, this would all be a much kinder story. # from: t7 # delay: 2200

    - quoting == "C_WHO_ARGUED":
        On the porch. Yes. # from: t7 # delay: 1300
        That's the one true thing he's certain of, and he's certain of it because he couldn't hear it. # from: t7 # delay: 2400
        Distance makes people very sure. # from: t7 # delay: 1800

    - quoting == "C_CAR_KEYS":
        Correct. # from: t7 # delay: 1000
        That detail is load-bearing and he doesn't know why. Leave it with him. # from: t7 # delay: 2200

    - quoting == "C_TIME_GAP":
        -> t7_gap_pressed

    - else:
        That's consistent with what I saw. # from: t7 # delay: 1400
        I won't embroider it for you. # from: t7 # delay: 1300
}
~ tick()
-> t7_hub

VAR t7_open_seen = false
VAR t7_asked_night = false
VAR t7_asked_call = false
VAR t7_asked_job = false
VAR t7_asked_gap = false
