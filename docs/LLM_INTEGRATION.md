# LLM Voice Integration — Implementation Guide

> **STATUS: PROPOSAL. None of this is wired up.**
>
> `tools/llm_voice.py` exists and runs standalone. The app does not call it, and
> the components and JSON manifests named below do not exist. Every code block
> here is a sketch of intended shape, not a description of the codebase — the
> `fetchRephrase` / `fetchExpand` / `fetchGenerate` helpers are invented for
> illustration.
>
> Anything shipped and verified is in `CHAPTERS.md` instead.

## Overview

The **llm_voice.py** module provides three dialogue operations (rephrase, expand, generate) that hook into the ink runtime to add variation without breaking narrative constraints.

This guide shows where and how to integrate the LLM engine into the game flow.

---

## Architecture: Runtime Integration Points

### 1. Voice Note Rephrasing (Low Risk, High Frequency)

**Where:** `src/components/MessageBubble.tsx` — when rendering a voice note for the first time.

**Pattern:**
```typescript
// In MessageBubble.tsx, when rendering a voice note:
if (message.audio && isFirstRender) {
  const rephrase = await fetchRephrase({
    timeline: message.timeline,
    originalText: message.audio.text,
  });
  // The .mp3 file is UNCHANGED (kokoro still renders the exact voice)
  // But on-screen text shows the rephrased variant
  displayText = rephrase || message.audio.text;
}
```

**Why this is safe:**
- The audio file itself doesn't change (kokoro voice is consistent)
- Only the *displayed* text varies per playthrough
- Replaying the same voice note can show different text
- No narrative impact (just dialogue flavor)

**Frequency:** Every first encounter with a voice note

**Rupert model:** qwen3.5-27b:latest (fast, 5-20s per rephrase)

---

### 2. Claim Expansion (Medium Risk, One-Time)

**Where:** `src/components/ChatView.tsx` — when a claim is filed into the evidence drawer.

**Pattern:**
```typescript
// When a character makes a claim that will be filed:
const scriptLine = claim.text;
const expanded = await fetchExpand({
  timeline: claim.timeline,
  scriptLine: scriptLine,
  context: { topic, turn_number, claims_so_far },
});

// File the expanded version as the "official" claim
evidence.addClaim({
  ...claim,
  text: expanded || scriptLine,
});
```

**Why this is safe:**
- Expansion adds *texture* but preserves all *facts*
- Evidence drawer only contains the expanded claim (no branching from variants)
- One expansion per claim per playthrough (no repeat variation)
- Semantic similarity gate ensures factual preservation

**Frequency:** Once per claim per playthrough

**Rupert model:** qwen3.5-27b:latest (one-time, not in critical path)

---

### 3. Generate (High Risk, Use Sparingly)

**Where:** `src/lib/game.ts` — when the player asks something not in the script.

**Pattern:**
```typescript
// When ink returns a "no_script" branch:
const unscriptedQ = player.lastInput;
const response = await fetchGenerate({
  timeline: currentTimeline,
  question: unscriptedQ,
  context: { stage, claims_filed, contested },
});

if (response) {
  // LLM generated a response that passed safety gates
  displayMessage(response);
} else {
  // LLM returned null (would have filed as claim) or error
  // Fallback to ink deflection/default response
  displayMessage(DEFAULT_DEFLECTION[currentTimeline]);
}
```

**Why this is risky:**
- Generates new text that hasn't been vetted
- Could introduce unintended narrative branches
- Must use strong safety gates (filing classifier)

**When to use:**
- Only after player has made several moves (not opening exchange)
- Only for "soft" questions (emotional, philosophical, not factual)
- Only if ink has no scripted answer
- Never for questions that sound like they need evidence

**Fallback:** Always have a default deflection per timeline:

```python
DEFAULT_DEFLECTIONS = {
    "t3": "I don't really want to get into that.",
    "t7": "I've told you what I know.",
    "t12": "That's not relevant right now.",
}
```

**Frequency:** Rare (only unscripted Qs, and many should still deflect)

**Rupert model:** qwen3.5-27b:latest or qwen3.5:122b for complex cases

---

## Usage Patterns

### Pattern 1: Always Rephrase (Voice Notes)

Voice notes always get rephrased on render. This feels like the character is saying something slightly different but meaning the same thing.

**Example flow:**
1. Player hears T-3's voice note on first playthrough: `"i wasn't in a state to go and see who it was."`
2. Player replays the same voice note: `"wasn't exactly in the right headspace to go check, you know?"`
3. Player starts a new game: `"i was too far gone to get up and see who was at the door."`

**Implementation:**
```python
# tools/llm_voice.py

def batch_rephrase_voices() -> None:
    """Pre-generate rephrase variants for all 6 voice notes in the game."""
    voice_ids = [
        "t3_porch_01", "t3_keys_01", "t3_gap_01",
        "t7_job_01", "t7_gap_01",
        "nell_call_01",
    ]
    
    for vid in voice_ids:
        text = VOICES[vid]["text"]
        timeline = VOICES[vid]["branch"]
        voice = TimelineVoice(timeline)
        
        variants = voice.rephrase(text)
        # Store variants in src/voices_variants.json
        variants_manifest[vid] = variants
        print(f"  {vid}: {len(variants)} variants")
```

**Result:** When rendering a voice note, the UI picks a random variant:

```typescript
const variants = voiceVariants[audioId];
const displayText = variants[Math.floor(Math.random() * variants.length)];
```

---

### Pattern 2: Expand on Filing (Claims)

When a character makes a claim, expand it with texture before it files into evidence.

**Example flow:**
1. Script: `"I know what can be undone inside fifteen minutes, and I know what can't."` (T-7)
2. LLM expands: `"I know what can be undone inside fifteen minutes, and I know what can't. When you've done this work long enough, the math becomes automatic."`
3. Evidence drawer contains the expanded version

**Implementation:**
```python
def expand_all_claims(story_json: dict) -> dict:
    """Pre-generate expanded versions of all claims."""
    for claim in story_json["claims"]:
        timeline = claim["timeline"]
        voice = TimelineVoice(timeline)
        
        expanded = voice.expand(claim["text"], context={"claim_id": claim["id"]})
        claim["text_expanded"] = expanded
    
    return story_json
```

**UI behavior:**
```typescript
// In ChatView, when claim is filed:
const displayText = claim.text_expanded || claim.text;
evidence.addClaim({
  ...claim,
  text: displayText,
});
```

---

### Pattern 3: Generate Fallback (Unscripted)

Generate responses only when the script has no answer AND the question seems safe (not factual).

**Example flow:**
1. Player asks: *"What was she like?"* (unscripted)
2. Ink has no branch for this
3. LLM generates: `"Good kid. Smart. She'd call me out on my bullshit. I miss that."` (T-3)
4. Filing classifier says: "DEFLECTION" (safe, not a claim)
5. Response displays

**Implementation:**
```python
class GameState:
    """Track stage/context for safety gates."""
    def __init__(self):
        self.stage = "opening"  # opening, mid, endgame
        self.claims_filed = 0
        self.contested_pairs = 0
        self.timeline = "t3"
        
        # Generate only after enough game state is established
        self.min_claims_before_generate = 3

def should_attempt_generate(state: GameState, question: str) -> bool:
    """Determine if generation is safe to attempt."""
    # Don't generate too early
    if state.claims_filed < state.min_claims_before_generate:
        return False
    
    # Don't generate factual-sounding questions
    factual_keywords = ["when", "where", "what time", "how long", "how many"]
    if any(kw in question.lower() for kw in factual_keywords):
        return False
    
    return True
```

---

## Safety Gates (Detailed)

### Gate 1: Semantic Similarity (Rephrase Only)

**Purpose:** Ensure rephrased variants preserve factual content.

**Implementation:**
```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def semantic_similarity(original: str, variant: str, threshold: float = 0.85) -> bool:
    """Check if variant preserves semantic content of original."""
    corpus = [original, variant]
    vectorizer = TfidfVectorizer(lowercase=True, stop_words="english")
    vectors = vectorizer.fit_transform(corpus)
    similarity = cosine_similarity(vectors[0], vectors[1])[0][0]
    return similarity > threshold
```

**Threshold tuning:**
- `0.85`: Strict. Variants must preserve ~85% of meaning. Catches rephrases that drift.
- `0.75`: Loose. Allows more variation. Might miss meaning drift.
- **Recommended: 0.80** (balance)

---

### Gate 2: Filing Classifier (Generate Only)

**Purpose:** Reject generated responses that sound like evidence claims.

**Prompt-based classifier** (uses Rupert):
```python
def would_file_as_claim(response: str, timeline: str) -> bool:
    """Use LLM to classify if response sounds like an evidence claim."""
    prompt = f"""
    Classify this response as one of: WOULD_FILE, DEFLECTION, TEXTURE.
    
    Context: Character is {timeline}. They are answering a question.
    Response: "{response}"
    
    WOULD_FILE = new factual claim (time, location, event, decision, action)
    DEFLECTION = vague, refuses, reframes without new facts
    TEXTURE = emotional, sensory, context (not new claim)
    
    Answer: WOULD_FILE | DEFLECTION | TEXTURE
    """
    
    result = call_rupert(prompt)
    return result.strip() == "WOULD_FILE"
```

**Rule-based fallback** (fast, no LLM call):
```python
def would_file_as_claim_heuristic(response: str) -> bool:
    """Fast heuristic: reject if response contains factual keywords."""
    claim_keywords = [
        "at ", "was at", "went to", "called", "saw", "heard",
        "01:", "02:", "23:", "00:", "clock", "time",
        "left", "arrived", "locked", "closed", "open",
    ]
    
    response_lower = response.lower()
    for kw in claim_keywords:
        if kw in response_lower:
            return True  # Likely a claim
    
    return False  # Likely safe
```

**Safety principle:** Use rule-based gate first (fast reject), then LLM gate if rule passes (confident accept).

---

## Pre-Game Pipeline (Phase 1 Completion)

To ship the LLM engine, we need:

1. ✅ **llm_voice.py** — Core constraint engine (done)
2. ✅ **llm_prompts.json** — Detailed prompt templates (done)
3. **llm_variants.json** — Pre-generated variants for all 6 voice notes
4. **llm_claims.json** — Pre-generated expansions for all 28 claims
5. **Integration hooks** — React components + ink runtime (ready for phase 2)

### Generate Variants & Expansions

```bash
cd survivor-bias

# Pre-generate rephrase variants for voice notes
uv run --script tools/llm_voice.py --pre-generate-voices
# Outputs: src/llm_variants.json

# Pre-generate expand variants for claims
uv run --script tools/llm_voice.py --pre-generate-claims
# Outputs: src/llm_claims.json

# Test generation safety on sample questions
uv run --script tools/llm_voice.py --test-generate
```

---

## Configuration: `llm_config.json`

```json
{
  "rephrase": {
    "enabled": true,
    "operation": "always",
    "targets": ["voice_notes"],
    "model": "qwen3.5-27b:latest",
    "num_variants": 3,
    "semantic_similarity_threshold": 0.80
  },
  "expand": {
    "enabled": true,
    "operation": "on_filing",
    "targets": ["claims"],
    "model": "qwen3.5-27b:latest",
    "preserve_original": true
  },
  "generate": {
    "enabled": true,
    "operation": "fallback",
    "min_claims_before_generate": 3,
    "model": "qwen3.5-27b:latest",
    "safety_gates": [
      "semantic_reasonableness",
      "filing_classifier",
      "keyword_heuristic"
    ],
    "fallback_deflection_enabled": true
  },
  "rupert": {
    "base_url": "https://rupert.indieio.dev/api/v1/",
    "timeout_seconds": 60,
    "concurrent_limit": 1,
    "retry_attempts": 3,
    "retry_backoff_seconds": 3
  }
}
```

---

## Summary: Phase 1 Deliverables

- ✅ **llm_voice.py** — TimelineVoice class with rephrase/expand/generate
- ✅ **llm_prompts.json** — Character briefs, examples, few-shot patterns
- ✅ **LLM_INTEGRATION.md** (this file) — Runtime integration guide
- ⬜ **llm_variants.json** — Pre-generated voice variants (batch generation step)
- ⬜ **llm_claims.json** — Pre-generated claim expansions (batch generation step)
- ⬜ **React integration** — MessageBubble, ChatView hooks (phase 2)
- ⬜ **Ink integration** — Dialogue annotation for LLM hooks (phase 2)

**Ready for Phase 2: Prequel Chapter Outlines**
