// ===========================================================================
// THE NIGHT — pressure, the decision, and the three endings.
//
// THE PAYOFF, so it doesn't get lost in a refactor:
//
//   T-7 establishes that Nell made a call at 01:38 that lasted forty seconds.
//   T-7's own line: "Forty seconds is a long time for no answer and a short
//   time for a conversation."
//
//   It rang out. She called her brother and nobody picked up — T-3 was drunk in
//   a car, T-7 was at the gate, T-12 was asleep and three hundred miles away.
//
//   In YOUR timeline you are awake at 01:38, holding your phone, because you
//   have spent all night on it talking to them.
//
//   The thing that saves her is that you answer. The app is the mechanism.
//   That is why the divergence is small, why nobody could ever agree on what it
//   was, and why the player had to be on their phone for the whole game.
//
// THE DEADLINE IS FELT, NOT SHOWN. There is no countdown and no wall clock.
// Pressure advances on player *action*, and its only expression is diegetic:
// system lines naming the hour, and the writing tightening. The deadline that
// actually bites is running out of things left to ask.
// ===========================================================================

VAR pressure = 0
VAR finished = false
VAR acted_on = ""

// Where the night is by the time the player has done N substantive things.
// Tuned so a thorough run (~15 actions to reach ending A) still has room, and
// only a player who wanders or acts on bad information feels it close in.
CONST LATE = 12
CONST LAST_CALL = 20

// ---------------------------------------------------------------------------
// tick() — call at the end of every substantive beat.
//
// Emits a time marker at thresholds and nothing the rest of the time, so the
// player registers the night moving without ever being shown a number.
// ---------------------------------------------------------------------------
=== function tick() ===
    ~ pressure = pressure + 1
    { pressure:
        - 4:  23:10. In their night, you're parking on the verge. # from: system
        - 8:  00:40. She's in the kitchen. She's laughing at someone. # from: system
        - LATE: 01:20. In eleven timelines, she has about twenty minutes. # from: system
        - 16: 01:31. # from: system
        - LAST_CALL: 01:37. # from: system
    }

=== function is_late() ===
    ~ return pressure >= LATE

// T-12's three fabrications, as a set. Kept here rather than open-coded in each
// helper so adding a fourth lie is a one-line change.
VAR lies = (C_CAR_MOVED, C_FORD_LIGHT, C_WHO_DROVE)

// How many of them the player has caught. `^` is list intersection.
=== function contested_lies() ===
    ~ return LIST_COUNT(contested ^ lies)

// True once the player has both halves of it: what T-7 did, and that T-12 has
// been steering them away from it.
=== function knows_the_truth() ===
    ~ return (contested ? C_TIME_GAP) and contested_lies() >= 2

// A fabrication the player still believes — held, but never put to anyone.
// Ending B's trap.
=== function holds_a_lie() ===
    ~ return LIST_COUNT((known ^ lies) - contested) > 0

// ---------------------------------------------------------------------------
// The decision.
//
// Always visible in the contact list — you can see it sitting there all game,
// which is the point — but ink refuses to open it until the player has any
// reason at all to think something is wrong.
// ---------------------------------------------------------------------------
=== endgame ===
{ finished: -> gone }
{ not has(C_TIME_GAP):
    -> endgame_too_early
}

{ is_late():
    It's twenty past one. # from: system
    She is walking out of that kitchen in about fifteen minutes and you are the only person in any timeline who knows it. # from: system # delay: 2400
- else:
    Your own night is quiet. # from: system
    Nell is asleep down the hall. She has no idea any of this is happening. # from: system # delay: 2200
}

-> endgame_choice

=== endgame_too_early ===
You don't know enough to do anything with. # from: system # delay: 1600
Not yet. # from: system # delay: 1200
-> DONE

=== endgame_choice ===
    * { knows_the_truth() } [Wait for the phone to ring.]
        -> ending_prevented
    * { holds_a_lie() and not knows_the_truth() } [Go down to the ford.]
        ~ acted_on = "ford"
        -> ending_substituted
    * { holds_a_lie() and not knows_the_truth() } [Go and find the car.]
        ~ acted_on = "car"
        -> ending_substituted
    * [Put the phone down.]
        -> ending_refused
    * { not is_late() } [Not yet. Keep talking.]
        -> DONE

// ===========================================================================
// ENDING A — PREVENTED
//
// The player does the one small thing. Note that it isn't heroic and it isn't
// clever: he sits still and keeps hold of his phone.
// ===========================================================================
=== ending_prevented ===
~ finished = true
You don't go anywhere. # from: system # delay: 1800
You sit on the edge of your bed at twenty past one in the morning with your phone in your hand, and you wait. # from: system # delay: 2600

01:38. # from: system # delay: 2800
// The only time Nell is ever shown. Held back for exactly this beat — see
// BIBLE.md §7: never speak her or show her before an ending.
NELL # from: system # delay: 1400 # img: evidence/nell.webp

    * [Answer it.]

- You answer on the second ring. # from: system # delay: 2000
// The only time she speaks in the entire game. Short bubbles on purpose: she is
// standing on a road in the dark being casual about it.
hey — did i wake you? # from: nell # delay: 1100
i'm fine, i'm fine. i just # from: nell # delay: 850
it's further than i thought # from: nell # delay: 950
and there's no light down by the water # from: nell # delay: 1000
can you come and get me # from: nell # delay: 1100
You say yes. # from: system # delay: 2000
You are already looking for your keys, because in this timeline you have them. # from: system # delay: 2600

// The other branches stop existing.
//
// `# screen: convergence` hands the moment to a full-screen visual and PAUSES
// the message queue until it finishes — see src/components/Convergence.tsx. It
// replaces what used to be three "TIMELINE-N — no signal" chat lines, because
// watching them go out one at a time is the whole point and a text list cannot
// carry it. The coda below lands back in the chat afterwards.
- # from: system # delay: 2000 # screen: convergence

They were only ever reachable because they were the ones who lost her. # from: system # delay: 3000
Forty seconds. That's all the difference ever was. # from: system # delay: 2800
Somebody picked up. # from: system # delay: 2600
-> END

// ===========================================================================
// ENDING B — SUBSTITUTED
//
// He acts, decisively, on the best-argued thing he was told. He is away from
// his phone at 01:38. The horror is not that he failed — it's the reaction.
// ===========================================================================
=== ending_substituted ===
~ finished = true
{ acted_on == "ford":
    You take the river road. # from: system # delay: 1800
    He was right about one thing — you can't see where the edge is. You stand in the dark by the water for forty minutes and nothing happens, because nothing was ever going to happen here. # from: system # delay: 3200
- else:
    You go looking for the car. # from: system # delay: 1800
    It's on the verge, where it has been all night, where it was always going to be. You walk round it twice. # from: system # delay: 2800
}

Your phone is on the bed at home. # from: system # delay: 2600
It rings at 01:38 for forty seconds. # from: system # delay: 2800

- - - # from: system # delay: 3000

They come back the next morning, all three of them, and they are careful with you. # from: system # delay: 2800
TIMELINE-7 sends you a timeline. It's very precise. He has already worked out that there was nothing you could have done. # from: system # delay: 3000
TIMELINE-3 says he's glad it wasn't just him. # from: system # delay: 2600
TIMELINE-12 says: *now you understand.* # from: system # delay: 2600
And he is kind about it. That's the part you won't get over. # from: system # delay: 2800
He was never trying to hurt you. He was trying to bring you home. # from: system # delay: 3000
-> END

// ===========================================================================
// ENDING C — REFUSED
//
// Must NOT read as a fail state. It's the quietest and should be the one people
// argue about. So: no reproach, no score, no "you could have". Deliberately
// ambiguous about whether he couldn't or wouldn't — and T-3 gets the last word.
// ===========================================================================
=== ending_refused ===
~ finished = true
You put the phone face down on the bedside table. # from: system # delay: 2200

{ knows_the_truth():
    You know what happened. You've known for about an hour. # from: system # delay: 2600
    You just don't know what a person is supposed to do with three men who are all you, all certain, all ruined in a different direction. # from: system # delay: 3200
- else:
    You've got four accounts of the same night and no two of them agree. # from: system # delay: 2800
    Somewhere under all of it there's a true thing the size of a coin, and you cannot find it, and it is twenty past one. # from: system # delay: 3200
}

It rings at 01:38. # from: system # delay: 3000
You let it. # from: system # delay: 2400
You couldn't say afterwards whether that was a decision. # from: system # delay: 2800

- - - # from: system # delay: 3000

In the morning there's one message. # from: system # delay: 2400
it's alright # from: t3 # delay: 2600
i didn't pick up either # from: t3 # delay: 2400
none of us did. that's the whole thing. that's all any of us are # from: t3 # delay: 3000
-> END

// ---------------------------------------------------------------------------
// After an ending. Reached if the player reopens a thread post-resolution.
// ---------------------------------------------------------------------------
=== gone ===
No signal. # from: system # delay: 1400
-> DONE
