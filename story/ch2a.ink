// ===========================================================================
// CHAPTER 2A — TIMELINE-3, "the twenty years"
//
// Prequel. T-3 walks the player through the two decades between that night and
// this one. He is the same man as in t3.ink: lowercase, run-on, apologetic,
// emotionally honest and factually unreliable.
//
// CHAPTER RULES (all prequel/coda files obey these):
//   - Never call tick(). Pressure belongs to Tonight; a chapter must not
//     advance the player's deadline.
//   - Never call gain() or contest(). The evidence drawer is Tonight's.
//   - No `finished:` guard. Chapters stay readable after an ending.
//   - Own VARs, prefixed ch2a_, declared at the foot of the file.
//
// Tags MUST be inline — see the header note in t3.ink. `# voice:` is available
// and deliberately unused, exactly as in Tonight: the notes didn't earn their
// place. Re-enabling one is a single tag.
// ===========================================================================

=== ch2a_open ===
{ ch2a_seen: -> ch2a_hub }
~ ch2a_seen = true

you want the twenty years # from: t3 # delay: 900
nobody asks for the twenty years # from: t3 # delay: 1300
everyone asks about the night. the night's four hours # from: t3 # delay: 1400
the twenty years is the actual thing # from: t3 # delay: 1600
alright # from: t3 # delay: 800
-> ch2a_hub

// ---------------------------------------------------------------------------
// Hub. Re-entered every time the player opens the chapter.
// ---------------------------------------------------------------------------
=== ch2a_hub ===
    * { not ch2a_early } [Start at the beginning.]
        -> ch2a_early_years
    * { ch2a_early and not ch2a_sober } [Did you ever stop?]
        -> ch2a_sober_stretch
    * { ch2a_sober and not ch2a_now } [And now?]
        -> ch2a_now_beat
    * { ch2a_now and not ch2a_call } [Where were you at twenty to two?]
        -> ch2a_the_call
    * [I'll come back.]
        yeah # from: t3 # delay: 600
        yeah alright # from: t3 # delay: 700
        -> DONE

=== ch2a_early_years ===
~ ch2a_early = true
first three years i thought i was fine # from: t3 # delay: 1100
i went to work. i went to the pub. i did the shop on a saturday # from: t3 # delay: 1500
that's what fine looks like from outside isn't it. a man doing his shop # from: t3 # delay: 1700
the thing about a town this size is everyone knows and nobody says # from: t3 # delay: 1800
two years it took to train them out of asking. i was proud of that # from: t3 # delay: 1700
i was proud of getting people to stop saying her name # from: t3 # delay: 1900

    * [That's not fine.]
        no # from: t3 # delay: 700
        no it isn't # from: t3 # delay: 800
    * [You were surviving.]
        that's a kind word for it # from: t3 # delay: 1100

- and every few months i'd make the promise # from: t3 # delay: 1400
walking home, always walking home. tomorrow i stop # from: t3 # delay: 1500
i meant it every single time. that's the bit people don't believe # from: t3 # delay: 1800
-> ch2a_hub

=== ch2a_sober_stretch ===
~ ch2a_sober = true
eight months once # from: t3 # delay: 900
eight months, meetings twice a week, the whole thing. i had a chip and everything # from: t3 # delay: 1700
i used to run my thumb over it in my pocket like a lucky coin # from: t3 # delay: 1700
then i saw him in town # from: t3 # delay: 1200
the paramedic one. you've talked to him # from: t3 # delay: 1300
he had the uniform on. he looked like someone you'd be glad to see coming # from: t3 # delay: 1800

    * [What did he say?]
        nothing # from: t3 # delay: 700
        that's the thing. he nodded # from: t3 # delay: 1000
    * [Did he stop?]
        no # from: t3 # delay: 700
        he nodded and he kept walking # from: t3 # delay: 1100

- one nod and off he went # from: t3 # delay: 1300
and i thought, he's made something of it and i've made a stool at the anchor # from: t3 # delay: 1900
i was in there by six # from: t3 # delay: 1000
first one's easy. i want to be honest with you, the first one is lovely # from: t3 # delay: 1800
that's what nobody tells you # from: t3 # delay: 1200
~ ch2a_relapses = ch2a_relapses + 1
-> ch2a_hub

=== ch2a_now_beat ===
~ ch2a_now = true
now # from: t3 # delay: 800
now my hands go in the morning. not from the drink, from the not-drink # from: t3 # delay: 1700
and my memory's gone soft in the middle # from: t3 # delay: 1400
i used to be able to tell you what she had on # from: t3 # delay: 1500
blue jacket, rip in the pocket. i'd have said that to you ten years ago and meant it # from: t3 # delay: 1900

    * [And now?]
        now i'm not sure # from: t3 # delay: 1000
        now i think maybe i built the jacket # from: t3 # delay: 1400
    * [You still remember the keys.]
        i remember the keys # from: t3 # delay: 900
        the keys are the one thing i'd put my hand in a fire over # from: t3 # delay: 1600

- that's the frightening bit # from: t3 # delay: 1300
not forgetting her. forgetting which parts i'm making up # from: t3 # delay: 1800
you should know that about me before you use anything i say # from: t3 # delay: 1900
-> ch2a_hub

// ---------------------------------------------------------------------------
// The climax. Every prequel lands on 01:38 and each self misses it a different
// way. His way is that he is not in a fit state to be reached.
// ---------------------------------------------------------------------------
=== ch2a_the_call ===
~ ch2a_call = true
you already know # from: t3 # delay: 1200
i was in the anchor. i'd had five # from: t3 # delay: 1300
phone went and i didn't know the number # from: t3 # delay: 1500

    * [You didn't answer.]
        -> ch2a_didnt
    * [Could you have answered?]
        -> ch2a_could_have

=== ch2a_didnt ===
i didn't answer # from: t3 # delay: 1100
and i've told myself for twenty years that i didn't know # from: t3 # delay: 1700
that's true. i didn't know # from: t3 # delay: 1300
it's also not the point # from: t3 # delay: 1200
-> ch2a_coda

=== ch2a_could_have ===
physically? i could have pressed the green thing # from: t3 # delay: 1500
but what comes out of me at five drinks isn't a person you'd want on the other end # from: t3 # delay: 2000
she'd have got me slurring at her down a phone in the dark # from: t3 # delay: 1800
i've thought about which of those is worse for a very long time # from: t3 # delay: 1900
-> ch2a_coda

=== ch2a_coda ===
forty seconds it rang # from: t3 # delay: 1600
i know that now. somebody told me that later, the exact number # from: t3 # delay: 1700
forty seconds is nothing. you could miss it going to the bar # from: t3 # delay: 1800
i did miss it going to the bar # from: t3 # delay: 1600
that's the twenty years # from: t3 # delay: 1500
-> ch2a_hub

VAR ch2a_seen = false
VAR ch2a_early = false
VAR ch2a_sober = false
VAR ch2a_now = false
VAR ch2a_call = false
VAR ch2a_relapses = 0
