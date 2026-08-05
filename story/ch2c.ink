// ===========================================================================
// CHAPTER 2C — TIMELINE-12, "the twenty years"
//
// Prequel. Register per t12.ink: clipped, edited, punctuated. Types like someone
// who rereads before sending. Never sends voice notes — that absence is a clue,
// and it holds here too.
//
// PUZZLE CONSTRAINT: he does NOT confess. Tonight's ending A depends on the
// player catching him out; a prequel confession would make that redundant. What
// this chapter shows is the CONSTRUCTION — a man rehearsing, on the record,
// without ever admitting there's anything to rehearse.
//
// CHAPTER RULES: no tick(), no gain()/contest(), no `finished:` guard.
// ===========================================================================

=== ch2c_open ===
{ ch2c_seen: -> ch2c_hub }
~ ch2c_seen = true

Twenty years is a strange request. # from: t12 # delay: 1300
There isn't a narrative. I left, I worked, I did well. That's the whole file. # from: t12 # delay: 1800
But go on. # from: t12 # delay: 900
-> ch2c_hub

=== ch2c_hub ===
    * { not ch2c_leaving } [Why did you leave so fast?]
        -> ch2c_leaving_beat
    * { ch2c_leaving and not ch2c_building } [What did you tell people?]
        -> ch2c_building_beat
    * { ch2c_building and not ch2c_now } [And now?]
        -> ch2c_now_beat
    * { ch2c_now and not ch2c_call } [Where were you at twenty to two?]
        -> ch2c_the_call
    * [I'll come back.]
        Fine. # from: t12 # delay: 700
        -> DONE

=== ch2c_leaving_beat ===
~ ch2c_leaving = true
The morning after the funeral. 07:40 train. # from: t12 # delay: 1400
My mother asked where I was going. I said I needed some time. # from: t12 # delay: 1600
I have thought about that sentence more than any other sentence I have said. # from: t12 # delay: 1800
It wasn't a lie. It was a true thing said in place of a truer one. # from: t12 # delay: 1800

    * [Which was?]
        That I was not going to be able to stand in that town and be looked at. # from: t12 # delay: 1900
    * [You were running.]
        Everyone was running. I was the only one who moved. # from: t12 # delay: 1700

- Eight hours on a train is a useful amount of time. # from: t12 # delay: 1500
By the time I got off it I had an account of myself that worked. # from: t12 # delay: 1700
~ ch2c_distance = 280
-> ch2c_hub

=== ch2c_building_beat ===
~ ch2c_building = true
Nothing dramatic. That's the part people get wrong about this. # from: t12 # delay: 1700
Nobody constructs a false identity. You just answer the small questions economically. # from: t12 # delay: 1900
"Where are you from?" Small town, nothing to it. # from: t12 # delay: 1500
"Close to your family?" We're very different people. # from: t12 # delay: 1500
"Siblings?" # from: t12 # delay: 1200
And there you have the only one that costs anything. # from: t12 # delay: 1600

    * [What do you say?]
        I change the subject. It is astonishing how well that works. # from: t12 # delay: 1800
        Twenty years and not one person has pushed. # from: t12 # delay: 1500
    * [You say no.]
        I have never once said no. # from: t12 # delay: 1300
        I want that on the record. I have never denied her. I have simply never raised her. # from: t12 # delay: 2000

- The distinction matters to me. You may find that pathetic. # from: t12 # delay: 1700
-> ch2c_hub

=== ch2c_now_beat ===
~ ch2c_now = true
Now? Comfortable. Senior. Someone people ask for by name. # from: t12 # delay: 1700
A partner who thinks I had an unremarkable childhood, and is right, insofar as it goes. # from: t12 # delay: 1900

    * [Doesn't that get heavy?]
        No. That's the thing nobody believes. # from: t12 # delay: 1400
        It got lighter. Every year it got lighter. # from: t12 # delay: 1500
        That should probably frighten you more than it frightens me. # from: t12 # delay: 1900
    * [You've built it on her.]
        I've built it beside her. # from: t12 # delay: 1300
        And I am aware that is a preposition doing an enormous amount of work. # from: t12 # delay: 1900

- Understand my position. # from: t12 # delay: 1200
If I am wrong about that night, I am not wrong about a detail. # from: t12 # delay: 1700
I am wrong about the last twenty years, and there is no version of me left underneath them. # from: t12 # delay: 2000
-> ch2c_hub

// ---------------------------------------------------------------------------
// The climax. Asleep, three hundred miles out, phone face down. He is the only
// one of the three who missed it without the possibility of choosing.
// ---------------------------------------------------------------------------
=== ch2c_the_call ===
~ ch2c_call = true
Asleep. # from: t12 # delay: 1200
Three hundred miles away, phone face down, as it has been every night since I was nineteen. # from: t12 # delay: 1900

    * [Convenient.]
        -> ch2c_convenient
    * [You didn't know.]
        -> ch2c_didnt_know

=== ch2c_convenient ===
Yes. # from: t12 # delay: 1000
It is the most convenient fact about me and I have never pretended otherwise. # from: t12 # delay: 1800
I could not have answered. That is not innocence. It's distance. # from: t12 # delay: 1700
I bought the distance deliberately, years earlier, for exactly this kind of night. # from: t12 # delay: 1900
-> ch2c_coda

=== ch2c_didnt_know ===
I didn't know. # from: t12 # delay: 1100
And I would ask you to notice how little comfort I take from that. # from: t12 # delay: 1800
The other two had a choice at 01:38 and failed it. I had removed the choice in advance. # from: t12 # delay: 2000
Work out for yourself which of those you'd rather be. # from: t12 # delay: 1800
-> ch2c_coda

=== ch2c_coda ===
One more thing, since you're being thorough. # from: t12 # delay: 1500
When you talk to me tonight, I will be confident. # from: t12 # delay: 1600
I will be more confident than either of them, and better organised, and easier to believe. # from: t12 # delay: 2000
You should think about why that is. # from: t12 # delay: 1600
-> ch2c_hub

VAR ch2c_seen = false
VAR ch2c_leaving = false
VAR ch2c_building = false
VAR ch2c_now = false
VAR ch2c_call = false
VAR ch2c_distance = 0
