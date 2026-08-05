// ===========================================================================
// CHAPTER 2B — TIMELINE-7, "the twenty years"
//
// Prequel. Register per t7.ink: complete sentences, timestamps, clinical nouns,
// never swears, answers the question adjacent to the one you asked.
//
// PUZZLE CONSTRAINT: this chapter must NOT hand over the 01:40–01:55 gap.
// Extracting it is the spine of Tonight (BIBLE.md §5). Asked directly here he
// deflects — which is in character and costs the main game nothing.
//
// CHAPTER RULES: no tick(), no gain()/contest(), no `finished:` guard.
// See the header in ch2a.ink.
// ===========================================================================

=== ch2b_open ===
{ ch2b_seen: -> ch2b_hub }
~ ch2b_seen = true

You want the intervening period. # from: t7 # delay: 1100
Most people don't. They want the four hours, because the four hours have a shape. # from: t7 # delay: 1900
I can give you the twenty years. It's less useful than you think. # from: t7 # delay: 1800
-> ch2b_hub

=== ch2b_hub ===
    * { not ch2b_why } [Why did you become a paramedic?]
        -> ch2b_why_beat
    * { ch2b_why and not ch2b_work } [Did it work?]
        -> ch2b_work_beat
    * { ch2b_work and not ch2b_now } [And now?]
        -> ch2b_now_beat
    * { ch2b_now and not ch2b_call } [Where were you at twenty to two?]
        -> ch2b_the_gap
    * [I'll come back.]
        Understood. # from: t7 # delay: 700
        -> DONE

=== ch2b_why_beat ===
~ ch2b_why = true
I went to the hospital eighteen months after. A school placement, nominally. # from: t7 # delay: 1700
I stood in the ambulance bay and watched a crew hand over a patient. # from: t7 # delay: 1600
Forty seconds of speech, and every word of it load-bearing. Pressure, rhythm, what they'd given, what they hadn't. # from: t7 # delay: 2000
Nobody in that room was guessing. # from: t7 # delay: 1400

    * [That appealed to you.]
        It was the first thing that had appealed to me in a year and a half. # from: t7 # delay: 1700
    * [Because it was the opposite of that night.]
        You could put it that way. # from: t7 # delay: 1200
        I would put it that it was a system with a correct answer. # from: t7 # delay: 1700

- I applied that month. # from: t7 # delay: 1100
The training is largely protocol. Airway, breathing, circulation, in that order, every time, without deliberation. # from: t7 # delay: 2000
I want to be precise about the appeal: it is not that protocol saves people. # from: t7 # delay: 1800
It's that protocol removes you from the question of whether you were good enough. # from: t7 # delay: 2000
-> ch2b_hub

=== ch2b_work_beat ===
~ ch2b_work = true
Operationally, yes. I'm competent. I've been told I'm more than that. # from: t7 # delay: 1700
Thirteen years in I attended a nineteen-year-old female, collapsed, similar build. # from: t7 # delay: 1800
I ran the call correctly. Transport priority, handover at 04:12, and she was discharged on the Thursday. # from: t7 # delay: 2000

    * [How did that feel?]
        That's the adjacent question, isn't it. # from: t7 # delay: 1400
        She thanked me. I stood in the corridor afterwards and felt nothing at all. # from: t7 # delay: 1900
    * [She survived.]
        She survived. # from: t7 # delay: 1000
        And it did not transfer. # from: t7 # delay: 1200

- I had assumed there was an exchange rate. # from: t7 # delay: 1500
There isn't. You cannot pay one down with the other. Each one is only itself. # from: t7 # delay: 2000
I wrote that down once and then removed the page, which tells you what I thought of it. # from: t7 # delay: 1900
-> ch2b_hub

=== ch2b_now_beat ===
~ ch2b_now = true
Now I teach some of it. Crisis response, scene management. I'm good in a classroom. # from: t7 # delay: 1800
On paper I am the most functional of the three of us. I'd like you to hold that lightly. # from: t7 # delay: 1900

    * [Why lightly?]
        Because functional is a description of an exterior. # from: t7 # delay: 1600
        I have organised twenty years so that nothing gets asked of the interior. # from: t7 # delay: 1900
    * [The other two aren't functional.]
        One drinks and one left. Both of those are legible. # from: t7 # delay: 1700
        Mine isn't legible, which has been the advantage. # from: t7 # delay: 1700

- I am precise about every part of that night except one. # from: t7 # delay: 1800
You'll find it. You strike me as someone who will find it. # from: t7 # delay: 1700
-> ch2b_hub

// ---------------------------------------------------------------------------
// The climax. He will not give up the gap — not here. He gives up the SHAPE of
// it, which is what makes Tonight's extraction feel earned rather than arbitrary.
// ---------------------------------------------------------------------------
=== ch2b_the_gap ===
~ ch2b_call = true
No. # from: t7 # delay: 1200
Not because I don't remember. I remember all of it, to the minute. # from: t7 # delay: 1700

    * [Then say it.]
        -> ch2b_refuse
    * [You were somewhere you shouldn't have been.]
        -> ch2b_shape

=== ch2b_refuse ===
I've had twenty years to build a sentence for it and I have not managed one. # from: t7 # delay: 2000
That isn't evasion. It is a genuine mechanical failure. # from: t7 # delay: 1700
Ask me tonight. Ask me when you've got something to put against it. # from: t7 # delay: 1900
-> ch2b_coda

=== ch2b_shape ===
I was where I said I'd be. That is the problem. # from: t7 # delay: 1800
Not a crime. Not a secret worth keeping, by any reasonable measure. # from: t7 # delay: 1800
And it has cost me two decades, because the reasonable measure isn't the one running. # from: t7 # delay: 2000
-> ch2b_coda

=== ch2b_coda ===
I'll tell you what I can tell you. # from: t7 # delay: 1300
At 01:38 tonight I will be on a call across town, because I asked to be on a call across town. # from: t7 # delay: 2000
The phone will go at 01:38 and I will be sterile to the wrists with a line half in. # from: t7 # delay: 2000
Protocol is that you do not leave a patient for a telephone. # from: t7 # delay: 1800
I have never once been glad of a protocol the way I am glad of that one. # from: t7 # delay: 2000
-> ch2b_hub

VAR ch2b_seen = false
VAR ch2b_why = false
VAR ch2b_work = false
VAR ch2b_now = false
VAR ch2b_call = false
