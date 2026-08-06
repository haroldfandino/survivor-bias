// ===========================================================================
// TIMELINE-11 — "the one who never found out"
//
// Tarnished brass. The plaque on the bench, because there is no stone.
//
// TRUBY ROLE: visit to death, and apparent defeat (docs/STRUCTURE_TRUBY.md
// steps 14 and 18). The game had no low point and no place where the cost of
// NOT knowing was made concrete before the player chose to accept it. He is
// both.
//
// In his branch she walked down the river road and was never found. No body, no
// funeral, no date. He is still looking, in the way you look after twenty years:
// a folder, a forum nobody posts on any more, one phone call a year to a police
// station where nobody remembers the case.
//
// He is NOT an opponent. He wants the player to succeed more than anyone. That
// is what makes him hard to sit with.
//
// HE DESTABILISES THE GAME'S OWN ARITHMETIC. BIBLE.md §3 says she died in eleven
// of twelve branches. Eleven assumes his. He is the reason the count is a guess,
// and he knows it, and it is the only hope he has left.
//
// Register: flat, practical, over-prepared. Talks about the case the way someone
// talks about a job they've had too long. Reference numbers. Dates of letters.
// Never says "died" about her. The one self with no ending to be at peace or at
// war with.
// ===========================================================================

=== t11_open ===
{ finished: -> gone }
{ t11_open_seen: -> t11_hub }
~ t11_open_seen = true

Before you start — has yours been found? # from: t11 # delay: 1400

    * [What do you mean, found?]
    Then no. You'd have led with it. # from: t11 # delay: 1500
    * [She's alive. It hasn't happened yet.]
    Then I'll be brief, because you shouldn't be talking to me. # from: t11 # delay: 1800

- Mine wasn't. That's the whole difference. She went down the river road and that is the last verified thing about her. # from: t11 # delay: 2200
No body. So no inquest, no cause, no date. There's no stone. There's a bench. # from: t11 # delay: 2000
~ tick()
-> t11_hub

=== t11_hub ===
    * { not t11_asked_still } [Are you still looking?]
        -> t11_still
    * { not t11_asked_count } [The others say eleven of twelve.]
        -> t11_count
    * { has(C_TIME_LEFT) and not t11_asked_road } [She walked down the river road.]
        -> t11_road
    * { t11_asked_still and not t11_asked_worst } [Is not knowing worse?]
        -> t11_worst
    * [I have to go.]
        Go. # from: t11 # delay: 1000
        Yours is still in the house. Mine hasn't been in a house for twenty years. Go. # from: t11 # delay: 1900
        -> DONE

// ---------------------------------------------------------------------------
// The shape of twenty years of it. Deliberately administrative — the horror is
// in the reference numbers, not in the feeling.
// ---------------------------------------------------------------------------
=== t11_still ===
~ t11_asked_still = true
Yes. Not the way I was. # from: t11 # delay: 1300
It's a folder now. It used to be a room. # from: t11 # delay: 1500
I ring the station once a year, in March, and I give them the reference, and they're very kind and there's nothing. # from: t11 # delay: 2100
The reference is 04/JX/2211. I've said that number out loud more times than I've said her name. # from: t11 # delay: 2200
There was a forum. Eleven of us on it at one point. It's just me and a man in Doncaster now, and his was a son. # from: t11 # delay: 2200
~ tick()
-> t11_hub

// ---------------------------------------------------------------------------
// He turns the game's own premise into a claim. This is the destabiliser.
// ---------------------------------------------------------------------------
=== t11_count ===
~ t11_asked_count = true
~ gain(C_COUNT_ASSUMES, "T-11: the count of eleven assumes his branch. In his, she was never found.", "t11")
Eleven of twelve. They love that number. # from: t11 # delay: 1500
Ask which eleven. # from: t11 # delay: 1300
Because one of the eleven is mine, and mine is not a death, it's an absence. Somebody put it in the column to make the column add up. # from: t11 # delay: 2200
    * [You think she might be alive.]
    I think there is no evidence that she isn't, and twenty years of no evidence is not evidence. # from: t11 # delay: 2200
    I know exactly how that sentence sounds. I've heard me say it to a lot of people. # from: t11 # delay: 2000
    * [Do you believe that?]
    On about forty days a year. # from: t11 # delay: 1500
    The rest of the time I believe what everybody else believes and I get on with the folder. # from: t11 # delay: 2000

- Their eleven is a decision somebody made. It isn't a finding. # from: t11 # delay: 1900
~ tick()
-> t11_hub

=== t11_road ===
~ t11_asked_road = true
On foot, down the river road, and past the ford is where it stops. # from: t11 # delay: 1700
I have walked that road more times than anyone alive. I've walked it in the dark at the same time of year to see what she'd have been able to see. # from: t11 # delay: 2200
There's about four hundred metres where you can't be seen from anywhere. # from: t11 # delay: 1800
That's the piece I've never got past, and I want to be straight with you: I've never got past it because there's nothing there. Not because there's something. # from: t11 # delay: 2400
~ tick()
-> t11_hub

// ---------------------------------------------------------------------------
// APPARENT DEFEAT (Truby 14). The player's lowest point, delivered by the one
// character who isn't trying to do anything to them.
// ---------------------------------------------------------------------------
=== t11_worst ===
~ t11_asked_worst = true
People ask that carefully, like it's a trap. It isn't. # from: t11 # delay: 1700
    * [Is it worse?]
    * [Sorry. That was a bad question.]
    It's the only honest question anyone's asked me this decade. # from: t11 # delay: 1900

- Yes. # from: t11 # delay: 1300
The three of them get to be sad. Sad has a shape. It gets softer, it gets carried differently, people bring it up at Christmas and then don't. # from: t11 # delay: 2400
I don't have sad. I have a folder and a bench and forty days a year where I think she's in a town somewhere and doesn't want to be found. # from: t11 # delay: 2400
And on the other three hundred and twenty-five I think she's been in the water since 2005 and I have spent my life on a filing cabinet. # from: t11 # delay: 2400
Both of those are worse than knowing. # from: t11 # delay: 1800
So whatever you're deciding tonight — decide it. # from: t11 # delay: 1800
Deciding wrong is survivable. I've met men who decided wrong. They're in worse shape than the ones who were right and better shape than me. # from: t11 # delay: 2400
~ tick()
-> t11_hub

// ---------------------------------------------------------------------------
// Quote handler. He treats every claim as a lead, because that is the only way
// he has left of relating to information. He is the only self who thanks you.
// ---------------------------------------------------------------------------
=== t11_quote ===
{
    - quoting == "C_TIME_GAP":
        Fifteen minutes unaccounted. # from: t11 # delay: 1400
        In mine that's not fifteen minutes, it's twenty years. He at least knows what he's not saying. # from: t11 # delay: 2100

    - quoting == "C_FORD_WATER":
        High water. Yes. # from: t11 # delay: 1200
        They dragged it in the April. Nothing. They'll tell you that's normal for a ford and it is normal and I have never once found it normal. # from: t11 # delay: 2400

    - quoting == "C_CAR_MOVED" or quoting == "C_FORD_LIGHT" or quoting == "C_WHO_DROVE":
        Where did you get that? # from: t11 # delay: 1200
        Right. Him. # from: t11 # delay: 1300
        I chased two of his for a year each. Both went nowhere and both cost me a year. # from: t11 # delay: 2000
        I'd want a second source before you build anything on it. # from: t11 # delay: 1800

    - quoting == "C_CALL_RANG_OUT":
        01:38. # from: t11 # delay: 1200
        Mine rang out too. Mine is the last activity on her account. # from: t11 # delay: 1800
        Forty seconds, and then nothing on that number ever again. # from: t11 # delay: 1900

    - quoting == "C_COUNT_ASSUMES":
        Say it to them. # from: t11 # delay: 1200
        Watch which of them has already thought about it and decided not to mention it to me. # from: t11 # delay: 2000

    - else:
        I'll put it in the folder. # from: t11 # delay: 1300
        That's not nothing. Most people give me sympathy. # from: t11 # delay: 1600
}
~ tick()
-> t11_hub

VAR t11_open_seen = false
VAR t11_asked_still = false
VAR t11_asked_count = false
VAR t11_asked_road = false
VAR t11_asked_worst = false
