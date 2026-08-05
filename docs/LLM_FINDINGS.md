# LLM dialogue variation — probe findings (2026-08-05)

First live run of `tools/llm_voice.py` against Rupert. Reproduce with:

```bash
uv run --script tools/llm_voice.py --test rephrase
```

**Verdict: the pipeline works. The output is not shippable yet, and the reason is
structural rather than a prompt-tuning problem.**

---

## What works

- Streamed chat completions against `qwen3.5-27b:latest`, `<think>` stripping,
  fenced-JSON extraction, retry/backoff — all fine.
- Register is captured well. T-3 comes back lowercase and run-on; T-7 comes back
  in complete sentences with the clinical vocabulary intact. Nobody has to be
  told twice.

## Gateway timing (matters for design)

A ten-token reply took **64 s** wall-clock during this probe. That is the small
model, warm, on a trivial prompt.

Consequences:

- Anything on the player's critical path is out. A rephrase cannot happen while a
  bubble is landing.
- Variation must be **pre-generated at build time** into a manifest, not fetched
  at runtime. The runtime picks from a list.
- A `--test all` run makes ~11 calls and therefore takes ~10 minutes. It looked
  like a hang the first time because Python buffers stdout when piped; the test
  prints now flush.

## Where it actually fails: REPHRASE drifts and inverts

Verbatim output from the probe.

**T-3** — `"i've still got them. twenty years. they're in a drawer."`

> i've still got them twenty years they're in a drawer **and i'm sorry if i mess
> up the count but it's been that long** yeah in a drawer

> twenty years still got them they're in a drawer **i think i mean i hope it's
> still twenty because my head is foggy** but yeah in a drawer

The bolded parts are **new content**. Plausible content, in voice — and invented.
T-3 doubting the count is a *characterisation decision*, not a paraphrase, and it
undercuts the one thing he is certain about. The keys are the single fact he'd
"put his hand in a fire over" (`ch2a.ink`); softening them damages the puzzle.

**T-7** — `"I know what can be undone inside fifteen minutes, and I know what can't."`

> I know what **can't** be undone inside fifteen minutes, and I know what **can**.

That is a **semantic inversion** and it passed every gate.

## Why the gates didn't catch it

`_facts_survive()` checks that every number in the original survives. Both
failures preserve "fifteen"/"twenty". The gate is blind to:

- **additions** — new propositions that weren't in the source
- **polarity** — negation swaps, which paraphrase models are notoriously prone to
- **emphasis** — which clause carries the weight

Number preservation was the wrong invariant. It is cheap and it measures almost
nothing.

## What would have to change

In rough order of cost:

1. **Entailment, not similarity.** The check needs to be bidirectional: original
   must entail variant *and* variant must entail original. A same-direction
   similarity score (the cosine gate sketched in `ARCHITECTURE.md`) would have
   passed the inversion too — cosine similarity is near-blind to negation.
2. **Author the variants.** For six voice-note lines and ~28 claims, hand-writing
   two alternates each is a few hours of work with a zero defect rate. The model
   is only obviously worth it above a few hundred lines.
3. **Narrow the operation.** EXPAND (append texture, never touch the original
   line) and GENERATE (gated to deflection only) are structurally much safer than
   REPHRASE, because neither rewrites an approved sentence. If any of this ships
   first, it should be those two.

## Recommendation

Do not wire REPHRASE into the game. Keep the engine as a **content tool** —
producing candidate lines a human accepts or rejects — rather than a runtime
feature. That keeps the property the ink gate depends on: every line that reaches
a player was read by someone first.

GENERATE remains interesting, because its failure mode is a deflection rather
than a false statement, and the cheap keyword gate genuinely does refuse
timestamps and locations. It is untested at volume.
