#!/usr/bin/env node
/**
 * Scripted playthrough of the cross-examination web.
 *
 * The story gate proves structure (reachability, no orphans, no dead ends).
 * This proves the GAME: that a player who does the right things in the right
 * order actually ends up holding the right evidence.
 *
 * Runs headless against the compiled story with the same tag contract the UI
 * uses, so it is immune to the animated playout — browser verification is
 * subject to background-tab timer throttling and can't assert this reliably.
 *
 * Run: node tools/playtest.mjs   (or `npm run playtest`)
 */
import { Story } from 'inkjs';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const compiled = JSON.parse(readFileSync(join(root, 'src', 'story.json'), 'utf8'));

const story = new Story(compiled);
const claims = new Map(); // id -> {text, source, contested}
const failures = [];
const steps = [];

/** Drain output, applying gain/contest tags exactly as src/lib/ink.ts does. */
function drain() {
  const lines = [];
  while (story.canContinue) {
    const text = story.Continue().trim();
    for (const tag of story.currentTags ?? []) {
      const g = /^gain:\s*(C_[A-Z0-9_]+)\s*::\s*(.+?)\s*::\s*(\S+)\s*$/.exec(tag);
      if (g && !claims.has(g[1])) {
        claims.set(g[1], { text: g[2], source: g[3], contested: false });
      }
      const c = /^contest:\s*(C_[A-Z0-9_]+)\s*$/.exec(tag);
      if (c && claims.has(c[1])) claims.get(c[1]).contested = true;
    }
    if (text) lines.push(text);
  }
  return lines;
}

function open(knot, label) {
  story.ChoosePathString(knot);
  drain();
  steps.push(`open ${label}`);
}

/** Pick a choice by exact text. Records a failure if it isn't on offer. */
function pick(text) {
  const choice = story.currentChoices.find((c) => c.text === text);
  if (!choice) {
    failures.push(
      `choice not offered: "${text}"\n      available: ${story.currentChoices
        .map((c) => `"${c.text}"`)
        .join(', ') || '(none)'}`,
    );
    return false;
  }
  story.ChooseChoiceIndex(choice.index);
  drain();
  steps.push(`  pick "${text}"`);
  return true;
}

/** Quote a claim at someone — sets `quoting` then enters their quote knot. */
function quote(claimId, knot, who) {
  if (!claims.has(claimId)) {
    failures.push(`cannot quote ${claimId} at ${who} — not yet held`);
    return;
  }
  story.variablesState['quoting'] = claimId;
  story.ChoosePathString(knot);
  drain();
  steps.push(`  quote ${claimId} @ ${who}`);
}

function expect(label, cond) {
  if (!cond) failures.push(`ASSERT failed: ${label}`);
  else steps.push(`  ✓ ${label}`);
}

// ===========================================================================
// The intended route to ending A:
//   1. T-3 for the emotional ground truth
//   2. T-7's timeline, which hands over the gap by being too precise
//   3. T-12's three fabrications
//   4. discredit two of them by quoting at the others
//   5. press T-7 on the gap
// ===========================================================================

open('t3_open', 'TIMELINE-3');
pick('Who is this?');
pick('The 14th.');
expect('T-3 opening yields C_TIME_LEFT', claims.has('C_TIME_LEFT'));
pick('You had her keys.');
pick('Tell me about the ford.');
pick('Was she arguing with someone?');
expect('T-3 yields 4 claims total', claims.size === 4);

open('t7_open', 'TIMELINE-7');
pick("He said it's happening tonight.");
pick('Walk me through that night.');
expect('T-7 timeline yields C_TIME_CALL', claims.has('C_TIME_CALL'));
expect('T-7 precision leaks C_TIME_GAP', claims.has('C_TIME_GAP'));
pick('Who did she call?');

open('t12_open', 'TIMELINE-12');
pick("They're trying to help.");
pick('What do you remember?');
pick('Tell me about the ford.');
pick('How did she get home?');
expect('T-12 supplies C_CAR_MOVED', claims.has('C_CAR_MOVED'));
expect('T-12 supplies C_FORD_LIGHT', claims.has('C_FORD_LIGHT'));
expect('T-12 supplies C_WHO_DROVE', claims.has('C_WHO_DROVE'));
expect('all 9 claims obtainable in one run', claims.size === 9);

// The absence of his voice should be legible, not invisible.
pick('Send me a voice note.');
pick('Why not?');

// Discredit the fabrications by putting them to the other two.
quote('C_CAR_MOVED', 't3_quote', 'T-3');
expect('C_CAR_MOVED contested by T-3', claims.get('C_CAR_MOVED')?.contested);

quote('C_FORD_LIGHT', 't3_quote', 'T-3');
expect('C_FORD_LIGHT contested by T-3', claims.get('C_FORD_LIGHT')?.contested);

quote('C_WHO_DROVE', 't7_quote', 'T-7');
expect('C_WHO_DROVE contested by T-7', claims.get('C_WHO_DROVE')?.contested);

// True claims must NOT be contestable — quoting them corroborates instead.
quote('C_CAR_KEYS', 't7_quote', 'T-7');
expect('C_CAR_KEYS stays uncontested (it is true)', !claims.get('C_CAR_KEYS')?.contested);
quote('C_TIME_LEFT', 't12_quote', 'T-12');
expect('C_TIME_LEFT stays uncontested (it is true)', !claims.get('C_TIME_LEFT')?.contested);

// T-3 saw T-7 come back up from the water and never knew what he saw.
open('t3_hub', 'TIMELINE-3');
expect('gap question unlocked at T-3 once C_TIME_GAP is held',
  story.currentChoices.some((c) => c.text.includes('quarter to two')));
pick('Where were you at quarter to two?');

// Press T-7. First press reframes; second gives the closest thing to an answer.
open('t7_hub', 'TIMELINE-7');
pick("You've accounted for every minute but fifteen.");
pick("I'm asking where you were.");
open('t7_hub', 'TIMELINE-7');
pick('Answer the question.');
expect('C_TIME_GAP contested after pressing T-7', claims.get('C_TIME_GAP')?.contested);

// With two fabrications discredited, T-12 drops the act.
open('t12_hub', 'TIMELINE-12');
expect('confrontation unlocked once 2 fabrications are contested',
  story.currentChoices.some((c) => c.text.includes("You've been lying")));
pick("You've been lying to me.");
pick('Say it properly.');

// --- report ----------------------------------------------------------------

console.log('playthrough:');
for (const s of steps) console.log('  ' + s);

const contested = [...claims.entries()].filter(([, c]) => c.contested).map(([id]) => id);
console.log(`\nclaims held: ${claims.size}/9`);
console.log(`contested:   ${contested.join(', ') || '(none)'}`);

if (failures.length) {
  console.error(`\n\x1b[31mplaytest FAIL\x1b[0m — ${failures.length} problem(s):`);
  for (const f of failures) console.error(`  • ${f}`);
  process.exit(1);
}

console.log(
  `\n\x1b[32mplaytest PASS\x1b[0m — route to ending A verified ` +
    `(${claims.size}/9 claims, ${contested.length} contested)`,
);
