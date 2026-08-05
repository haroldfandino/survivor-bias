# SURVIVOR BIAS — LLM Strategy & Story Architecture

> ## STATUS — read this before the body
>
> This is a **design document**, and parts of it were written before any of it
> was built. Where the body says something is complete, distrust the body and
> use this table.
>
> | Piece | Actually |
> |---|---|
> | `tools/llm_voice.py` — rephrase / expand / generate + gates | **built, standalone, and probed live.** Run with `--test all`. |
> | REPHRASE output quality | **not shippable.** It drifts and inverts meaning; the number-preservation gate does not catch either. Measured results and the reason are in `LLM_FINDINGS.md` — read that before building on Part 1. |
> | The cosine-similarity gate proposed in Part 1 | **would not work.** Cosine similarity is near-blind to negation, which is one of the two observed failure modes. |
> | Wiring into the running game (React / ink hooks) | **not built.** Nothing in the app calls it. See `LLM_INTEGRATION.md`, which is a plan, not a description. |
> | Pre-generated variant/expansion manifests | **not built.** No `llm_variants.json` / `llm_claims.json` exists. |
> | The story architecture in Part 3–4 below | **superseded.** The chapters that shipped differ; see `CHAPTERS.md` and the two outlines in `story/`. |
> | The 22-block mapping | design intent, useful; not machine-checked. |
>
> The `# voice:` plan that once lived alongside this doc has been withdrawn —
> Tonight deliberately ships without voice notes. See `CHAPTERS.md`.

---

## Part 1: LLM Constraint Engine

### Design Principle
The LLM does **not** write story. It performs **controlled variation** within narrative boundaries defined by ink script.

### Three Operations

#### 1. **Rephrase** — Dialogue Variation
When a self makes a claim or answer, the LLM rephrase it in-character without changing semantic content.

**Example:**
- Ink script (T-3): `"i've still got them. twenty years. they're in a drawer."`
- LLM rephrase (T-3): `"never got rid of them, you know? twenty years sitting in a drawer."`
- LLM rephrase (T-3): `"kept them all this time. two decades. drawer's where they live."`

**Constraints per timeline:**
- **T-3:** Looser, self-interrupting, warmer, forgiving. Emotional truth > precision.
- **T-7:** Precise, clinical, complete sentences. Facts > feeling. Never swears.
- **T-12:** Clipped, edited, confident, rehearsed. Sounds prepared.

**Mechanism:** Prompt template + few-shot examples + semantic similarity gate (rephrase must preserve all factual content within ±10% drift on key entities).

#### 2. **Expand** — Answer Elaboration
When a self answers a question, the LLM adds supporting detail/texture without introducing new facts that could contradict or unlock unintended branches.

**Example:**
- Script: `"I know what can be undone inside fifteen minutes, and I know what can't."` (T-7)
- LLM expansion: `"Fifteen minutes. That's how long I've been doing this. I know exactly what's reversible in that window. After that, the damage is sunk. You stop thinking about what you could have done."` (T-7)

**Constraints:** Expansion must be **contained to dialogue level only** — no new narrative facts, no new claims that file into evidence, no branching hints.

#### 3. **Generate** — New Dialogue (Rare)
When a player asks something the script doesn't directly answer, the LLM generates a response in-character that:
- Does NOT introduce new claims that belong in the evidence drawer
- Deflects or reframes rather than inventing
- Respects what that self would/wouldn't say

**Example:**
- Player: *"What was she like?"* (unscripted)
- T-3 LLM response: `"Good kid. Smart. She'd call me out on my bullshit. I miss that."` (emotional, vague, doesn't file)
- T-7 LLM response: `"She was nineteen. Intelligent. I didn't know her as well as I thought I did."` (clinical, factual but shallow)
- T-12 LLM response: `"Does it matter now?"` (deflect, avoid)

**Constraints:** Generated dialogue must fail a semantic-filing test (should not create a new claim). Use a classifier to reject responses that sound like they belong in evidence.

### Implementation: Rupert + Constraint Layer

```python
# Pseudocode: the constraint architecture

class TimelineVoice:
    def __init__(self, timeline_id: str):
        self.timeline = timeline_id  # t3, t7, t12
        self.character_brief = BRIEFS[timeline_id]  # register, profile, constraints
        self.model = "qwen3.5-27b:latest"  # or 122b for complex rephrasing

    def rephrase(self, original: str) -> list[str]:
        """Rephrase 1 line into 3-5 variants, all in-character."""
        prompt = REPHRASE_PROMPT_TEMPLATE.format(
            timeline=self.timeline,
            character_brief=self.character_brief,
            original=original,
            num_variants=3,
        )
        variants = call_rupert(prompt, model=self.model)
        # Semantic similarity gate: each variant must preserve factual content
        variants = [v for v in variants if semantic_similarity(original, v) > 0.85]
        return variants

    def expand(self, script_line: str, context: dict) -> str:
        """Add 1-2 sentences of texture to a script answer."""
        prompt = EXPAND_PROMPT_TEMPLATE.format(
            timeline=self.timeline,
            character_brief=self.character_brief,
            script_line=script_line,
            conversation_context=context,
        )
        expansion = call_rupert(prompt, model=self.model)
        # Return expanded version: script_line + expansion
        return f"{script_line} {expansion}"

    def generate(self, unscripted_question: str, context: dict) -> str | None:
        """Generate response to unscripted question, or None if should deflect."""
        prompt = GENERATE_PROMPT_TEMPLATE.format(
            timeline=self.timeline,
            character_brief=self.character_brief,
            question=unscripted_question,
            context=context,
        )
        response = call_rupert(prompt, model=self.model)
        
        # Semantic filing gate: reject if response sounds like an evidence claim
        if would_file_as_claim(response):
            return None  # Fallback to ink deflection
        
        return response
```

### Rupert Models for This Work
- **qwen3.5-27b:latest** — rephrase, expand (fast, good control, ~5-20s)
- **qwen3.5:122b** — complex generate calls (more capable, ~30-130s, use sparingly)

**Concurrency limit:** qwen3.5-27b allows 1 concurrent call. For multiplayer/async scenarios, queue or use 9b for faster fallback.

---

## Part 2: Truby's 22 Building Blocks — Current Story Mapping

### The 22 Blocks (in order of story function)

| # | Block | Tonight's Role | Current Implementation |
|---|-------|---|---|
| 1 | **Weakness** | The player can't answer her call in time; each self has a specific blindness | Opening position (latent) |
| 2 | **Desire** | Prevent her death / uncover what happened / escape blame | The three selves' divergent stakes |
| 3 | **Opponent** | Time. Nell herself (her choices). The other selves (their lies). | Clock (hidden pressure counter), Nell's agency, T-12's sabotage |
| 4 | **Ally/Guide** | Each self is your guide to that timeline; Nell is the constant | T-3, T-7, T-12 as perspective sources; Nell as the axis |
| 5 | **Incompleteness** | You lack 9 key claims; some are false | Evidence drawer (claims, contested pairs) |
| 6 | **Moral Problem** | Is it OK to lie to save someone? Does the end justify the means? | T-12's false claims force this choice (ending B) |
| 7 | **Battle Plan** | Extract T-7's gap. Discredit T-12's lies. Use T-3's emotional truth. | The three-self strategy (cross-examination mechanic) |
| 8 | **Battle** | Cross-examine. Find the contested pairs. Resolve them. | Quote mechanic + evidence drawer |
| 9 | **Self-Revelation** | You are not the "good" timeline — you can fail too | Ending C (refusal) shows ambiguity, not failure |
| 10 | **Audience Revelation** | Why none of them agreed on what saved her | All three selves are post-loss accommodations; player is the only pre-loss timeline |
| 11 | **New Equilibrium** | She lives / She dies differently / You don't act | Three endings |
| 12-22 | *Secondary arcs* | T-3's trauma, T-7's atonement, T-12's denial | Implicit in register, voice treatment, claim choice |

### Current Status
✅ **Blocks 1-11 are implemented.** Blocks 12-22 are implicit (in character voices, registers, ffmpeg treatment).

### For New Chapters: Expansion Points

**Prequel chapters** (before tonight):
- Weakness: How did each self develop their current stance?
- Desire: What were they trying to accomplish before the night?
- Opponent: What external pressures forced them into this shape?

**Post-ending chapters** (after A/B/C):
- New Equilibrium becomes New Weakness for the next arc
- Each ending spawns a different character arc (A: redemption, B: reckoning, C: silence)

---

## Part 3: Character Web & Arcs

### The Three Selves as One Person — Three Timelines

```
                    ┌─────────────────────┐
                    │   ONE PERSON        │
                    │  (player character) │
                    └─────────────────────┘
                              │
                 ┌────────────┼────────────┐
                 │            │            │
            ┌────────────┐ ┌──────────┐ ┌──────────┐
            │  TIMELINE-3 │ │TIMELINE-7│ │TIMELINE-12│
            │  The Stayed │ │ The Atoned│ │ Got Out   │
            └────────────┘ └──────────┘ └──────────┘
                 │            │            │
         ┌───────┴────────────┴────────────┴────────┐
         │                                           │
         │        NELL (the constant axis)          │
         │     Lives / Dies / Ambiguous             │
         └───────────────────────────────────────────┘
```

### Per-Timeline Character Arc (22-block style)

#### **TIMELINE-3: "The Stayed"** — Warmth Rotting Into Shame
- **Weakness:** Lacks discipline. Gets drunk. Can't be relied on.
- **Desire:** Absolution. To be forgiven. To be useful.
- **Opponent:** His own weakness. T-7 (the one who "did better"). Time (he's been drinking 20 years).
- **Ally:** The player (believes in him). Nell (the one he failed).
- **Moral Problem:** Can he trust his own memory? Should he?
- **Change:** Truthful but unreliable. Emotional honesty as a kind of integrity.

#### **TIMELINE-7: "The Atoned"** — Control Built on Denial
- **Weakness:** Can't name his own culpability. Hides behind precision.
- **Desire:** To have done the right thing. To be seen as competent/helpful.
- **Opponent:** His own gap (01:40-01:55). The player (asking where he was). Himself.
- **Ally:** His job (paramedic). Clinical language as armor.
- **Moral Problem:** Is detail without honesty the same as truth?
- **Change:** Recognizes the cost of his armor. The gap becomes a confession.

#### **TIMELINE-12: "Got Out"** — Success Built on Sabotage
- **Weakness:** Can't afford to be wrong about the last 20 years.
- **Desire:** To keep the narrative that saved him. To protect his version of events.
- **Opponent:** The player (asking questions). T-3 (emotional truth). T-7 (factual precision). Reality.
- **Ally:** Distance. Confidence. Careful wording.
- **Moral Problem:** If you build a life on a lie, who does the lie protect?
- **Change:** Reveals the motive. Chooses comfort over truth (ending B) or loses the player (ending A).

### Character Web: How They Change Each Other

**The player's job is to make them see each other.** By quoting one self at another, the player forces recognition:
- T-3's emotional truth unsettles T-7's certainty
- T-7's precision exposes T-12's fabrications
- T-12's confidence shakes T-3's shame

**Result:** Each ending is a different resolution of this web:
- **A (Prevented):** All three see the truth together. Nell lives. The web resolves into coherence.
- **B (Substituted):** T-12 wins. The web breaks. Nell dies differently. Relief masquerades as resolution.
- **C (Refused):** The web stays unresolved. The player steps out. Silence as ambiguity.

---

## Part 4: Chapter Architecture — Expansion Timeline

### Phase 1: Tonight (Complete)
- **Duration:** One night, 23:10–01:38
- **Scope:** One location (chat), three perspectives, three endings
- **Status:** Locked (BIBLE.md §1 signed off)

### Phase 2: Prequel Chapters (Proposed)
**Title:** *Before Tonight*
**Scope:** Three chapters, one per timeline, covering the 20 years leading to this night

#### Chapter 2a: T-3 — The Slow Decline
- **Time span:** The night of Nell's death (20 years ago) → Tonight
- **Weaknesses to reveal:** How drinking started. When shame calcified.
- **Ally & opponent:** Who tried to save him? Who enabled him?
- **Arc:** From "I'm responsible" to "I'm responsible and stuck."
- **22-block focus:** Weakness (how it grew), Desire (what he wanted but gave up), Moral Problem (can he change?).

#### Chapter 2b: T-7 — The Atonement Machine
- **Time span:** The night of Nell's death → Paramedic school → Tonight
- **Weaknesses to reveal:** Why he chose that job. What he was running from.
- **Ally & opponent:** Does the job absolve him? Is it punishment or redemption?
- **Arc:** From "It was my fault" to "My fault is my identity."
- **22-block focus:** Desire (become worthy), Opponent (himself), Self-revelation (atonement can be narcissism).

#### Chapter 2c: T-12 — The Exit Strategy
- **Time span:** The night of Nell's death → Building a life elsewhere → Tonight
- **Weaknesses to reveal:** What he had to forget. What he built instead.
- **Ally & opponent:** Success as armor. Distance as safety.
- **Arc:** From "I need to leave" to "Leaving was the only option."
- **22-block focus:** Opponent (reality), Moral Problem (the lie works), Self-revelation (but at what cost?).

**Shared thread:** All three chapters converge on **01:38 — the moment Nell called.** Each shows what that self was doing, what they chose (or didn't). This is the connective tissue with Tonight.

### Phase 3: Post-Ending Chapters (Proposed)
**Titles:** *After Tonight: Ending A*, *After Tonight: Ending B*, *After Tonight: Ending C*
**Scope:** One chapter per ending, showing the aftermath and new equilibrium

#### Chapter 3a: Ending A — The Convergence After
- **What changed:** All three selves now know the truth. Nell lives.
- **New weakness:** Can they live with the weight of knowing? Can they forgive themselves?
- **Arc:** From "She's alive" to "Now what?"
- **Duration:** Hours or days after the call. The emergency is over; the reckoning begins.

#### Chapter 3b: Ending B — The Relief After
- **What changed:** You acted on a T-12 lie. Nell dies differently. The selves are relieved.
- **New weakness:** Can you live knowing you were played? Can they live with relief?
- **Arc:** From "This wasn't supposed to happen" to "Actually, maybe it's OK."
- **Duration:** The immediate aftermath. Shock, then unease at how easy it feels.

#### Chapter 3c: Ending C — The Refusal After
- **What changed:** You didn't act. The phone rang. The ambiguity stands.
- **New weakness:** Living with the choice not to choose.
- **Arc:** From "I'm not responsible" to "But I chose not to be."
- **Duration:** Quiet. The absence of reckoning. The absence of certainty.

**Shared thread:** All three post-chapters are **shorter and more introspective** than Tonight. They're about what choice *cost*, not about solving a puzzle.

---

## Part 5: Implementation Roadmap

### Phase 1: LLM Constraint Engine (Weeks 1-2)
- [ ] Define 22-block prompts for each timeline (rephrase, expand, generate)
- [ ] Build semantic similarity gate + filing classifier
- [ ] Test on 6 voice notes + 10 claims (rephrase operation)
- [ ] Test on 3 unscripted questions (generate operation)
- [ ] Integration: hook into ink runtime

### Phase 2: Prequel Chapters Outline (Weeks 2-3)
- [ ] Map each prequel chapter to 22 blocks
- [ ] Write chapter outlines (act/scene level)
- [ ] Design the 01:38 moment as connective tissue
- [ ] Build character web diagram (Truby-style)

### Phase 3: Prequel Chapter Drafting (Weeks 4-6)
- [ ] Chapter 2a (T-3) — narrative draft
- [ ] Chapter 2b (T-7) — narrative draft
- [ ] Chapter 2c (T-12) — narrative draft
- [ ] Story gate & playtest (similar to Tonight's gate)

### Phase 4: Post-Ending Chapters (Weeks 7-8)
- [ ] Chapter 3a/b/c outlines (based on ending-specific arcs)
- [ ] Draft all three
- [ ] Test branching from Tonight's three endings

### Phase 5: Voice + Polish (Weeks 9-10)
- [ ] Voice notes for prequel chapters (kokoro rephrase per timeline treatment)
- [ ] Voice notes for post-chapters (new treatment if needed)
- [ ] UI: chapter selection, navigation between phases

---

## Design Decisions to Ratify

### LLM Frequency
- **Always rephrase:** Voice notes (kokoro still renders, but dialogue varies on replay)
- **On first encounter:** Initial claims (less repetition, more discovery feel)
- **Rarely generate:** Only when script has no answer (unscripted Qs)

### Scoping: Prequel Depth
- Should each prequel chapter be as long as Tonight (~30 min)?
- Or shorter, vignette-style (5-10 min per chapter)?
- *Proposal: Shorter. Each prequel is one act, focused on one decision point.*

### Timing: Which Comes First?
- Prequel first (build backwards from Tonight)?
- Post-ending first (iterate on endings)?
- LLM engine first (make Tonight's dialogue variable, then expand)?
- *Proposal: LLM engine first. It unlocks all chapters. Then prequels (more content). Then post-endings (tie them off).*

---

## Questions for Approval

1. **LLM Operations:** Are rephrase/expand/generate the right three? Should we add "dodge" (T-12 refuses to answer)?
2. **Chapter Structure:** Prequel-first vs. post-ending-first?
3. **Prequel Length:** Vignette (5-10 min) or full act (30 min)?
4. **New Mechanics:** Do prequel chapters stay chat-based, or introduce new interaction types?
5. **Voice Treatment:** Same ffmpeg chains (t3/t7) extended to prequel chapters, or new sonic design?

---

## Success Metrics

- ✅ All three selves feel less scripted (dialogue rephrase variation)
- ✅ New chapters expand character arcs 3 timelines × 3 chapters = 9 new arcs
- ✅ Story web is traceable via 22 blocks (auditable structure)
- ✅ Endings are not final — they spawn new narratives (A/B/C chapters)
- ✅ LLM constraint layer keeps narrative integrity (no uncontrolled generation)
