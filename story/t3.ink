// ===========================================================================
// TIMELINE-3 — "the one who stayed"
//
// Sodium-orange. Never left town. Was in the car. Drinks.
// Register: lowercase, run-on, self-interrupting, over-familiar, apologetic.
// He is WARM and WRONG. He gives you the emotional truth and factual noise.
//
// Every line is one message bubble. Tags MUST be inline on the same line as
// the text — a tag on its own line binds to the FOLLOWING output, which
// silently shifts every attribution by one. Inline only.
//
//   # from: t3      who sent it (omit for the player)
//   # delay: 900    ms to hold the typing indicator before this lands
//   # voice: <id>   render as a voice note
//   # img: <path>   render as a photo attachment
// ===========================================================================

=== t3_open ===
{ finished: -> gone }
{ t3_open_seen: -> t3_hub }
~ t3_open_seen = true

oh # from: t3 # delay: 700
oh god it's really you # from: t3 # delay: 1100
sorry give me a second # from: t3 # delay: 900

    * [Who is this?]
    it's me # from: t3 # delay: 800
    that's the whole thing isn't it. it's me. i'm you. i'm the one that stayed # from: t3 # delay: 1600

    * [I know who you are.]
    yeah # from: t3 # delay: 600
    yeah course you do # from: t3 # delay: 700

- what's the date where you are # from: t3 # delay: 1200

    * [The 14th.]
        -> t3_date_reveal
    * [Why does that matter?]
    just tell me the date # from: t3 # delay: 700
    please # from: t3 # delay: 500
    ** [The 14th.]
        -> t3_date_reveal

=== t3_date_reveal ===
no # from: t3 # delay: 1400
no no no okay okay listen to me # from: t3 # delay: 900
listen. it hasn't happened yet for you. tonight. it's tonight # from: t3 # delay: 1700
~ gain(C_TIME_LEFT, "Nell leaves the house on foot between 01:20 and 02:05.", "t3")
she leaves the house at like half one. on foot. down the river road # from: t3 # delay: 1500
i've had twenty years to think about that road # from: t3 # delay: 1300
~ tick()
-> t3_hub

// ---------------------------------------------------------------------------
// The conversation hub. React re-enters here every time the player opens T-3.
// Options gate on what the player already holds, so the thread never repeats.
// ---------------------------------------------------------------------------
=== t3_hub ===
    * { not t3_asked_car } [You had her keys.]
        -> t3_car
    * { not t3_asked_ford } [Tell me about the ford.]
        -> t3_ford
    * { not t3_asked_porch } [Was she arguing with someone?]
        -> t3_porch
    * { has(C_TIME_GAP) and not t3_asked_gap } [Where were you at quarter to two?]
        -> t3_gap
    * [I have to go.]
        okay # from: t3 # delay: 600
        okay. come back. please come back # from: t3 # delay: 900
        -> DONE

=== t3_car ===
~ t3_asked_car = true
~ gain(C_CAR_KEYS, "You still had Nell's car keys in your pocket the next morning.", "t3")
her keys were in my jacket # from: t3 # delay: 1000
next morning. i put my hand in my pocket and there they were # from: t3 # delay: 1400
she couldn't have driven anywhere. she never could have. i had them the whole time # from: t3 # delay: 1600
{ contested ? C_CAR_MOVED:
    and before you say it — no. the car did not move. i don't care who told you that # from: t3 # delay: 1500
}
~ tick()
-> t3_hub

=== t3_ford ===
~ t3_asked_ford = true
~ gain(C_FORD_WATER, "The ford was running high — it had rained for two days.", "t3")
it'd been raining since the tuesday # from: t3 # delay: 900
the ford was up over the stones. you couldn't see where the edge was # from: t3 # delay: 1500
that's from the week after # from: t3 # delay: 1100 # img: evidence/ford_night_01.png
~ tick()
-> t3_hub

=== t3_porch ===
~ t3_asked_porch = true
~ gain(C_WHO_ARGUED, "Nell argued with someone on the porch before she left.", "t3")
there was someone on the porch with her # from: t3 # delay: 1000
i saw them from the car. i was in the car. i was # from: t3 # delay: 1200
i wasn't in a state to go and see who it was # from: t3 # delay: 1400 # voice: t3_porch_01
~ tick()
-> t3_hub

// Only reachable once the player has learned about T-7's gap elsewhere —
// T-3 saw it and does not know that he saw it. This is the hinge of ending A.
=== t3_gap ===
~ t3_asked_gap = true
me? i was in the car the whole # from: t3 # delay: 1000
hang on # from: t3 # delay: 1600
hang on. you're not asking about me are you # from: t3 # delay: 1300
~ contest(C_TIME_GAP)
there was someone coming back up from the water # from: t3 # delay: 1800
i thought it was one of the lads. i've thought it was one of the lads for twenty years # from: t3 # delay: 2000
~ tick()
-> t3_hub

// ---------------------------------------------------------------------------
// Quote handler. UI sets `quoting` then jumps here.
// ---------------------------------------------------------------------------
=== t3_quote ===
{
    - quoting == "C_CAR_MOVED":
        who told you the car moved # from: t3 # delay: 900
        ~ contest(C_CAR_MOVED)
        that's wrong. i had the keys. i HAD them # from: t3 # delay: 1200
        i've still got them. twenty years. they're in a drawer # from: t3 # delay: 1900

    - quoting == "C_FORD_LIGHT":
        the light wasn't out # from: t3 # delay: 800
        ~ contest(C_FORD_LIGHT)
        i know it wasn't out because i remember the moths. there were moths all round it # from: t3 # delay: 1700
        you don't get moths round a light that isn't on # from: t3 # delay: 1400

    - quoting == "C_TIME_CALL":
        half one, twenty to two, i don't know # from: t3 # delay: 1100
        i wasn't looking at a clock. he would've been # from: t3 # delay: 1500
        he was always the one looking at the clock # from: t3 # delay: 1300

    - quoting == "C_WHO_DROVE":
        nobody drove her # from: t3 # delay: 800
        ~ contest(C_WHO_DROVE)
        that's — no. she walked. i watched her walk off # from: t3 # delay: 1500
        i watched her go and i didn't get out of the car # from: t3 # delay: 1900

    - else:
        yeah # from: t3 # delay: 700
        yeah that sounds about right # from: t3 # delay: 800
}
~ tick()
-> t3_hub

VAR t3_open_seen = false
VAR t3_asked_car = false
VAR t3_asked_ford = false
VAR t3_asked_porch = false
VAR t3_asked_gap = false
