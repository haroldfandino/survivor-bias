#!/usr/bin/env node
/**
 * Scripted playthroughs.
 *
 * The story gate proves structure (reachability, no orphans, no dead ends).
 * This proves the GAME: that a player who does the right things in the right
 * order ends up holding the right evidence and reaching the right ending.
 *
 * Runs headless against the compiled story using the same tag contract as
 * src/lib/ink.ts, so it is immune to the animated playout — browser
 * verification is subject to background-tab timer throttling and cannot assert
 * this reliably.
 *
 * Each scenario gets a fresh Story, because the endings are terminal.
 *
 * Run: node tools/playtest.mjs   (or `npm run playtest`)
 */
import { Story } from 'inkjs';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const compiled = JSON.parse(readFileSync(join(root, 'src', 'story.json'), 'utf8'));

let failures = 0;

function run(name, body) {
  const story = new Story(compiled);
  const claims = new Map();
  const log = [];
  const problems = [];
  let transcript = '';

  function drain() {
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
      if (text) transcript += text + '\n';
    }
  }

  const api = {
    claims,
    open(knot, label) {
      story.ChoosePathString(knot);
      drain();
      log.push(`open ${label ?? knot}`);
    },
    pick(text) {
      const choice = story.currentChoices.find((c) => c.text === text);
      if (!choice) {
        problems.push(
          `choice not offered: "${text}"\n        available: ${
            story.currentChoices.map((c) => `"${c.text}"`).join(', ') || '(none)'
          }`,
        );
        return false;
      }
      story.ChooseChoiceIndex(choice.index);
      drain();
      log.push(`  pick "${text}"`);
      return true;
    },
    quote(claimId, knot, who) {
      if (!claims.has(claimId)) {
        problems.push(`cannot quote ${claimId} at ${who} — not held`);
        return;
      }
      story.variablesState['quoting'] = claimId;
      story.ChoosePathString(knot);
      drain();
      log.push(`  quote ${claimId} @ ${who}`);
    },
    offered(fragment) {
      return story.currentChoices.some((c) => c.text.includes(fragment));
    },
    /** Terminal endings leave the story unable to continue and choiceless. */
    ended() {
      return !story.canContinue && story.currentChoices.length === 0;
    },
    said(fragment) {
      return transcript.includes(fragment);
    },
    expect(label, cond) {
      if (!cond) problems.push(`ASSERT failed: ${label}`);
      else log.push(`  ✓ ${label}`);
    },
    contested(id) {
      return !!claims.get(id)?.contested;
    },
  };

  body(api);

  const ok = problems.length === 0;
  console.log(`\n${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${name}`);
  for (const l of log) console.log('    ' + l);
  for (const p of problems) console.error('    \x1b[31m• ' + p + '\x1b[0m');
  if (!ok) failures++;
}

/** The shared opening: everything up to holding all nine claims. */
function gatherEverything(t) {
  t.open('t3_open', 'TIMELINE-3');
  t.pick('Who is this?');
  t.pick('The 14th.');
  t.expect('T-3 opening yields C_TIME_LEFT', t.claims.has('C_TIME_LEFT'));
  t.pick('You had her keys.');
  t.pick('Tell me about the ford.');
  t.pick('Was she arguing with someone?');

  t.open('t7_open', 'TIMELINE-7');
  t.pick("He said it's happening tonight.");
  t.pick('Walk me through that night.');
  t.expect('T-7 timeline yields C_TIME_CALL', t.claims.has('C_TIME_CALL'));
  t.expect('T-7 precision leaks C_TIME_GAP', t.claims.has('C_TIME_GAP'));
  t.pick('Who did she call?');

  t.open('t12_open', 'TIMELINE-12');
  t.pick("They're trying to help.");
  t.pick('What do you remember?');
  t.pick('Tell me about the ford.');
  t.pick('How did she get home?');
  t.expect('all 9 claims obtainable in one run', t.claims.size === 9);
}

// ===========================================================================

run('endgame refuses before the player has any reason to act', (t) => {
  t.open('endgame', 'TONIGHT');
  t.expect('turned away', t.said("You don't know enough to do anything with."));
  t.expect('no decision offered', !t.offered('phone'));
});

run('ENDING A — prevented (the full route)', (t) => {
  gatherEverything(t);

  // Discredit the fabrications by putting them to the other two.
  t.quote('C_CAR_MOVED', 't3_quote', 'T-3');
  t.expect('C_CAR_MOVED contested by T-3', t.contested('C_CAR_MOVED'));
  t.quote('C_FORD_LIGHT', 't3_quote', 'T-3');
  t.expect('C_FORD_LIGHT contested by T-3', t.contested('C_FORD_LIGHT'));
  t.quote('C_WHO_DROVE', 't7_quote', 'T-7');
  t.expect('C_WHO_DROVE contested by T-7', t.contested('C_WHO_DROVE'));

  // True claims must corroborate, never contest.
  t.quote('C_CAR_KEYS', 't7_quote', 'T-7');
  t.expect('C_CAR_KEYS stays uncontested (it is true)', !t.contested('C_CAR_KEYS'));

  // T-3 saw T-7 come up from the water and never knew what he saw.
  t.open('t3_hub', 'TIMELINE-3');
  t.expect('gap question unlocked at T-3', t.offered('quarter to two'));
  t.pick('Where were you at quarter to two?');

  // Press T-7 twice.
  t.open('t7_hub', 'TIMELINE-7');
  t.pick("You've accounted for every minute but fifteen.");
  t.pick("I'm asking where you were.");
  t.open('t7_hub', 'TIMELINE-7');
  t.pick('Answer the question.');
  t.expect('C_TIME_GAP contested after pressing T-7', t.contested('C_TIME_GAP'));

  // T-12 drops the act once two fabrications are dead.
  t.open('t12_hub', 'TIMELINE-12');
  t.expect('confrontation unlocked', t.offered("You've been lying"));
  t.pick("You've been lying to me.");
  t.pick('Say it properly.');
  t.expect('T-12 admits the motive', t.said("I don't want you to save her."));

  // The full route accrues ~17 ticks, so by now the night has closed in.
  t.expect('late marker fired on the real route', t.said('01:20. In eleven timelines'));

  // The decision.
  t.open('endgame', 'TONIGHT');
  t.expect('urgent framing once late', t.said("It's twenty past one."));
  t.expect('cannot stall once late', !t.offered('Not yet'));
  t.expect('ending A is offered', t.offered('Wait for the phone'));
  t.pick('Wait for the phone to ring.');
  t.pick('Answer it.');

  t.expect('she calls at 01:38', t.said('01:38'));
  t.expect('he answers', t.said('You answer on the second ring.'));
  t.expect('the keys pay off', t.said('in this timeline you have them'));
  t.expect('the branches go quiet', t.said('TIMELINE-7 — no signal'));
  t.expect('the title lands', t.said('Somebody picked up.'));
  t.expect('story is over', t.ended());

  // Post-ending, the selves are unreachable.
  t.open('t3_open', 'TIMELINE-3 (after)');
  t.expect('T-3 is gone', t.said('No signal.'));
});

run('ENDING B — substituted (acts on an uncontested lie)', (t) => {
  gatherEverything(t);

  // Deliberately never puts C_FORD_LIGHT to anyone.
  t.expect('holds an uncontested fabrication', !t.contested('C_FORD_LIGHT'));

  t.open('endgame', 'TONIGHT');
  t.expect('ending A is NOT offered', !t.offered('Wait for the phone'));
  t.expect('acting on the lie is offered', t.offered('Go down to the ford'));
  t.pick('Go down to the ford.');

  t.expect('he is away from the phone', t.said('Your phone is on the bed at home.'));
  t.expect('it rings unanswered', t.said('It rings at 01:38 for forty seconds.'));
  t.expect('the horror is the relief', t.said('now you understand'));
  t.expect('T-12 is kind about it', t.said('He was trying to bring you home.'));
  t.expect('story is over', t.ended());
});

run('ENDING C — refused (reads as a choice, not a failure)', (t) => {
  gatherEverything(t);

  t.open('endgame', 'TONIGHT');
  t.expect('refusal always available', t.offered('Put the phone down'));
  t.pick('Put the phone down.');

  t.expect('no reproach, only ambiguity', t.said('whether that was a decision'));
  t.expect('T-3 gets the last word', t.said("i didn't pick up either"));
  t.expect('shared, not blamed', t.said("that's all any of us are"));
  t.expect('story is over', t.ended());
});

run('the deadline is felt, never shown', (t) => {
  // A gather-only run accrues 9 ticks, so it should reach the early markers and
  // NOT the late ones — the night closes in on the player's own activity.
  gatherEverything(t);
  t.expect('early marker fired (pressure 4)', t.said('23:10. In their night'));
  t.expect('mid marker fired (pressure 8)', t.said("00:40. She's in the kitchen"));
  t.expect('late marker has NOT fired yet', !t.said('01:20. In eleven timelines'));
  t.expect(
    'no countdown, timer, or score language anywhere',
    !t.said('remaining') && !t.said('minutes left') && !t.said('score'),
  );

  // The decision surface reads calm while there's still room.
  t.open('endgame', 'TONIGHT');
  t.expect('quiet framing before it gets late', t.said('Your own night is quiet.'));
  t.expect('can back out and keep talking', t.offered('Not yet'));
});

// ===========================================================================

if (failures) {
  console.error(`\n\x1b[31mplaytest FAIL\x1b[0m — ${failures} scenario(s) failed`);
  process.exit(1);
}
console.log('\n\x1b[32mplaytest PASS\x1b[0m — 5 scenarios, all 3 endings verified');
