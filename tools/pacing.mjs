#!/usr/bin/env node
/**
 * Pacing audit.
 *
 * Every delay is authored, every voice note has a measured duration, and the
 * cutscene has a fixed length — so the thing that can't be judged without ears
 * can at least be computed.
 *
 * For each beat (the run of messages between two player decisions) this reports
 * FORCED dead air: time the player can neither act during nor skip. That is the
 * number that matters. Voice notes are opt-in and the cutscene is skippable from
 * its first frame, so counting either would overstate the problem and point the
 * fix at the wrong place — they're reported separately.
 *
 * Run: node tools/pacing.mjs   (or `npm run pacing`)
 */
import { Story } from 'inkjs';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const compiled = JSON.parse(readFileSync(join(root, 'src', 'story.json'), 'utf8'));
const voices = JSON.parse(readFileSync(join(root, 'src', 'voices.json'), 'utf8'));

/** Mirrors MAX_DELAY in src/state/game.ts — long authored delays are capped. */
const MAX_DELAY = 2000;
/** Mirrors the sequence length in src/components/Convergence.tsx. */
const SCREEN_MS = 9200;

/**
 * Thresholds on forced time. Past ~9s of watching typing dots with nothing to
 * do, people tab away. Chosen from how long a reader will sit still, not from
 * anything in the data.
 */
const WARN_MS = 9_000;
const FAIL_MS = 13_000;

const beats = [];

/**
 * Walks a route recording one entry per beat. Takes choice 0 throughout, which
 * still reaches every authored beat because the hubs gate options off as they're
 * consumed.
 */
function walk(entry, label) {
  const story = new Story(compiled);
  try {
    story.ChoosePathString(entry);
  } catch {
    return;
  }

  let guard = 0;
  while (guard++ < 80) {
    const beat = {
      entry: label ?? entry,
      messages: [],
      forced: 0,
      optional: 0,
      skippable: 0,
      notes: [],
    };

    while (story.canContinue) {
      const text = story.Continue().trim();
      let delay = 800;
      let from = 'you';
      let voice = null;
      let img = null;
      let screen = null;

      for (const t of story.currentTags ?? []) {
        const i = t.indexOf(':');
        if (i === -1) continue;
        const k = t.slice(0, i).trim();
        const v = t.slice(i + 1).trim();
        if (k === 'delay') delay = Number(v) || delay;
        else if (k === 'from') from = v;
        else if (k === 'voice') voice = v;
        else if (k === 'img') img = v;
        else if (k === 'screen') screen = v;
      }

      if (!text && !screen) continue;

      // Mirrors playNow: system and player lines land with no typing pause.
      const typing = from === 'you' || from === 'system' ? 0 : Math.min(delay, MAX_DELAY);
      beat.forced += typing;

      if (screen) {
        beat.forced += Math.min(delay, MAX_DELAY);
        beat.skippable += SCREEN_MS;
        beat.notes.push(`cutscene ${screen}`);
      }
      if (voice) {
        beat.optional += (voices[voice]?.duration ?? 0) * 1000;
        beat.notes.push(`voice ${voice}`);
      }
      if (img) beat.notes.push('image');
      if (text) beat.messages.push({ from, text, typing });
    }

    if (beat.messages.length || beat.notes.length) beats.push(beat);
    if (!story.currentChoices.length) break;
    story.ChooseChoiceIndex(0);
  }
}

for (const [knot, label] of [
  ['boot', 'boot'],
  ['t3_open', 'T-3'],
  ['t7_open', 'T-7'],
  ['t12_open', 'T-12'],
  ['ending_prevented', 'ENDING A'],
  ['ending_substituted', 'ENDING B'],
  ['ending_refused', 'ENDING C'],
]) {
  walk(knot, label);
}

// --- report -----------------------------------------------------------------

const RED = '[31m';
const YELLOW = '[33m';
const GREEN = '[32m';
const OFF = '[0m';

const worst = [...beats].sort((a, b) => b.forced - a.forced);
let fails = 0;
let warns = 0;

console.log('FORCED dead air per beat (cannot act, cannot skip):\n');

for (const b of worst) {
  if (b.forced < WARN_MS) continue;
  let mark;
  if (b.forced >= FAIL_MS) {
    mark = `${RED}FAIL${OFF}`;
    fails += 1;
  } else {
    mark = `${YELLOW}WARN${OFF}`;
    warns += 1;
  }
  const first = b.messages[0]?.text.slice(0, 40) ?? '(no text)';
  const extra = [];
  if (b.optional) extra.push(`${(b.optional / 1000).toFixed(1)}s opt-in`);
  if (b.skippable) extra.push(`${(b.skippable / 1000).toFixed(1)}s skippable`);
  console.log(
    `${mark} ${(b.forced / 1000).toFixed(1).padStart(6)}s  ${b.entry.padEnd(9)}` +
      `${String(b.messages.length).padStart(3)} msg  "${first}"` +
      (extra.length ? `  [+${extra.join(', +')}]` : ''),
  );
}
if (!fails && !warns) console.log(`${GREEN}all beats under ${WARN_MS / 1000}s${OFF}`);

const totalForced = beats.reduce((n, b) => n + b.forced, 0);
const sorted = beats.map((b) => b.forced).sort((a, b) => a - b);
const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;

console.log(
  `\n${beats.length} beats | median forced ${(median / 1000).toFixed(1)}s` +
    ` | longest ${((worst[0]?.forced ?? 0) / 1000).toFixed(1)}s` +
    ` | total ${(totalForced / 1000 / 60).toFixed(1)} min`,
);
console.log(
  `thresholds: warn >=${WARN_MS / 1000}s, fail >=${FAIL_MS / 1000}s` +
    ` -- ${warns} warn, ${fails} fail`,
);

process.exit(fails > 0 ? 1 : 0);
