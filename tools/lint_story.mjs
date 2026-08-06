#!/usr/bin/env node
/**
 * The story gate. Nothing gets posted to #iio-games without this green.
 *
 * Walks the compiled story exhaustively — every reachable choice combination,
 * depth-limited — and asserts the structural invariants the design depends on.
 * Prints the proof-of-life metric line at the end.
 *
 * Run: node tools/lint_story.mjs   (or `npm run gate`)
 */
import { Story } from 'inkjs';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const storyDir = join(root, 'story');
const compiled = JSON.parse(readFileSync(join(root, 'src', 'story.json'), 'utf8'));

const errors = [];
const warnings = [];

// --- what the source declares -----------------------------------------------

const inkSource = readdirSync(storyDir)
  .filter((f) => f.endsWith('.ink'))
  .map((f) => readFileSync(join(storyDir, f), 'utf8'))
  .join('\n');

/** Claim ids declared in the LIST in claims.ink. */
const declaredClaims = (() => {
  const m = /LIST\s+Claim\s*=([\s\S]*?)(?:\n\s*\n|\nVAR)/.exec(inkSource);
  if (!m) {
    errors.push('claims.ink: could not find `LIST Claim = ...`');
    return new Set();
  }
  return new Set(
    m[1]
      .split(',')
      .map((s) => s.replace(/\/\/.*$/gm, '').trim())
      .filter((s) => /^C_[A-Z0-9_]+$/.test(s)),
  );
})();

/**
 * Knots referenced by the UI's thread tables.
 *
 * Both contacts.ts (Tonight's four threads) and chapters.ts (the prequels and
 * codas) are read: a typo in either ships a thread that opens onto nothing, and
 * the compiler can't catch it because the knot name is only ever a string.
 *
 * Only knots belonging to *reachable* threads must exist — an unreachable entry
 * is deliberately unwritten, and the gate should not demand content the scope
 * hasn't reached yet.
 */
const requiredKnots = (() => {
  const re =
    /id:\s*'([^']+)'[\s\S]*?entry:\s*'([^']+)'[\s\S]*?quoteEntry:\s*'([^']+)'[\s\S]*?reachable:\s*(true|false)/g;
  const knots = [];
  for (const file of ['contacts.ts', 'chapters.ts']) {
    const src = readFileSync(join(root, 'src', 'lib', file), 'utf8');
    let found = 0;
    for (const m of src.matchAll(re)) {
      if (m[4] === 'true') {
        knots.push(m[2], m[3]);
        found++;
      }
    }
    if (!found) warnings.push(`${file}: no reachable threads found — nothing to walk`);
  }
  return knots;
})();

/**
 * Every `# img:` must point at a file that exists.
 *
 * Added after a rename to .webp left story.json referencing .png: the app
 * silently fell back to a placeholder frame, which looks like a styling choice
 * rather than a missing asset. Broken art must fail the build, not degrade
 * quietly.
 */
{
  // Scan code only. The file headers document the tag contract with examples
  // like `# img: <path>`, and scanning raw source flags those as missing files.
  // Split on /\r?\n/, not '\n'. These files are CRLF, and JS `.` does not match
  // \r — so with a trailing \r left on each line, /\/\/.*$/ never anchors and
  // the comment survives the strip.
  const inkCode = inkSource
    .split(/\r?\n/)
    .map((l) => l.replace(/\/\/.*$/, ''))
    .join('\n');

  for (const m of inkCode.matchAll(/#\s*img:\s*([^\s#]+)/g)) {
    const rel = m[1];
    if (!existsSync(join(root, 'public', rel))) {
      errors.push(`# img: ${rel} — no such file under public/`);
    }
  }
  // Voice notes are wired in week 4; warn rather than fail until then.
  const voices = [...inkCode.matchAll(/#\s*voice:\s*([^\s#]+)/g)].map((m) => m[1]);
  const missingVoices = voices.filter(
    (v) => !existsSync(join(root, 'public', 'audio', `${v}.mp3`)),
  );
  if (missingVoices.length) {
    warnings.push(
      `${missingVoices.length} voice note(s) not yet recorded: ${missingVoices.join(', ')}`,
    );
  }
}

/** Tags authored on their own line — these silently mis-bind to the NEXT line. */
{
  const lines = inkSource.split(/\r?\n/);
  lines.forEach((line, i) => {
    const t = line.trim();
    if (/^#\s*(from|delay|voice|img)\b/.test(t)) {
      errors.push(
        `standalone tag on line ${i + 1} ("${t}") — tags must be INLINE on the text line, ` +
          'or they bind to the following output and shift every attribution by one',
      );
    }
  });
}

// --- exhaustive walk --------------------------------------------------------

const MAX_DEPTH = 60;
/** Backstop against a combinatorial blow-up as the story grows. */
const MAX_PATHS = 4000;
const seenKnots = new Set();
const gainedClaims = new Set();
const contestedClaims = new Set();
const quotedTexts = new Map(); // claim id -> display text
const endings = new Set();
let paths = 0;
let deadEnds = 0;
let quotePairs = 0;

function freshStory() {
  return new Story(compiled);
}

/**
 * Depth-first over every choice, from a given entry knot.
 *
 * Each stack item is a full trail of choice indices from the entry. Replaying a
 * trail from a fresh story is deterministic, so a trail that runs off the end of
 * a choice list is a genuine story defect and not a walker artefact. Branching
 * pushes `[...made, j]` — the choices actually taken so far plus one
 * alternative — so earlier decisions are never dropped.
 */
let preludeKnot = '';

function walk(entry, prelude = []) {
  const stack = [[]];
  const branched = new Set();

  while (stack.length) {
    if (paths >= MAX_PATHS) {
      warnings.push(
        `path cap ${MAX_PATHS} hit while walking '${entry}' — coverage is partial`,
      );
      break;
    }
    const trail = stack.pop();
    const made = [];
    const s = freshStory();
    try {
      // Run any prelude quotes first so state-gated beats become reachable.
      // These use real story paths — no synthetic variable pokes — so the state
      // the walker arrives in is state the player could actually be in.
      for (const step of prelude) {
        s.variablesState['quoting'] = step;
        s.ChoosePathString(step.startsWith('C_') ? preludeKnot : step);
        while (s.canContinue) s.Continue();
      }
      s.ChoosePathString(entry);
    } catch (err) {
      errors.push(`entry knot '${entry}' is not reachable: ${err.message ?? err}`);
      return;
    }

    let depth = 0;
    let idx = 0;
    let ok = true;

    while (depth++ < MAX_DEPTH) {
      while (s.canContinue) {
        s.Continue();
        for (const tag of s.currentTags ?? []) {
          const gi = /^gain:\s*(C_[A-Z0-9_]+)\s*::\s*(.+?)\s*::\s*(\S+)\s*$/.exec(tag);
          if (gi) {
            gainedClaims.add(gi[1]);
            const prev = quotedTexts.get(gi[1]);
            if (prev && prev !== gi[2]) {
              warnings.push(`claim ${gi[1]} has two different display texts`);
            }
            quotedTexts.set(gi[1], gi[2]);
          }
          const ci = /^contest:\s*(C_[A-Z0-9_]+)\s*$/.exec(tag);
          if (ci) contestedClaims.add(ci[1]);
          const bad = /^gain:\s*(.*)$/.exec(tag);
          if (bad && !gi) {
            errors.push(`malformed gain tag: "${tag}" (want: id :: text :: source)`);
          }
        }
      }

      if (!s.currentChoices.length) {
        endings.add(entry);
        break;
      }

      // Follow the recorded trail, defaulting to choice 0 past its end.
      const choiceCount = s.currentChoices.length;
      const take = idx < trail.length ? trail[idx] : 0;
      idx++;

      if (take >= choiceCount) {
        ok = false;
        break;
      }

      // Branch once per distinct prefix, on every alternative we aren't taking.
      const key = made.join(',');
      if (!branched.has(key)) {
        branched.add(key);
        for (let j = 0; j < choiceCount; j++) {
          if (j !== take) stack.push([...made, j]);
        }
      }

      made.push(take);
      s.ChooseChoiceIndex(take);
    }

    if (depth >= MAX_DEPTH) {
      errors.push(`possible infinite loop from '${entry}' (exceeded ${MAX_DEPTH} beats)`);
    }
    if (!ok) deadEnds++;
    paths++;
  }
  seenKnots.add(entry);
}

// Entry points to exercise. boot plus every reachable contact knot.
const entries = ['boot', ...new Set(requiredKnots)];
for (const e of entries) walk(e);

/**
 * Second-visit surfaces.
 *
 * Some beats only exist the *next* time the player opens a thread, and only
 * once the story is in a particular state — the ally attack (t3_turn) needs two
 * contests behind it, the opponent's counterattack (t12_counter) needs one of
 * his claims discredited. The plain walk above always starts from a fresh
 * story, so it can never see either, and the gate reported the claim behind the
 * ally attack as an orphan.
 *
 * Rather than poke variables, each of these declares the quote knots to run
 * first. That is exactly what the player does to get there, so anything the
 * walker finds past the prelude is genuinely reachable in play.
 */
const RETURN_ENTRIES = [
  { knot: 't3_return', via: 't3_quote', quotes: ['C_CAR_MOVED', 'C_FORD_LIGHT'] },
  { knot: 't12_return', via: 't3_quote', quotes: ['C_CAR_MOVED'] },
];
for (const r of RETURN_ENTRIES) {
  preludeKnot = r.via;
  walk(r.knot, r.quotes);
}

// ---------------------------------------------------------------------------
// Quote coverage.
//
// Cross-examination is the core mechanic, and the plain walk above never
// touches it: the UI sets the `quoting` variable before jumping to a quote
// knot, so a walker that doesn't set it only ever sees the `else` branch. That
// left the gate reporting 1 contestable claim when the web actually wires up
// far more.
//
// So: every claim × every quote knot. Also catches the failure mode where a
// quote handler is unreachable because `quoting` was declared as a LIST — a
// raw string assignment throws inside inkjs.
// ---------------------------------------------------------------------------
const quoteKnots = [...new Set(requiredKnots)].filter((k) => k.endsWith('_quote'));
const quoteHits = new Map(); // knot -> count of claims it responds specifically to

for (const knot of quoteKnots) {
  let specific = 0;
  for (const claim of declaredClaims) {
    const s = freshStory();
    try {
      s.variablesState['quoting'] = claim;
    } catch (err) {
      errors.push(
        `cannot assign a string to ink var 'quoting' (${err.message ?? err}) — ` +
          'declare it as `VAR quoting = ""`, not a LIST',
      );
      break;
    }

    let text = '';
    try {
      s.ChoosePathString(knot);
      let depth = 0;
      while (s.canContinue && depth++ < MAX_DEPTH) {
        text += s.Continue();
        for (const tag of s.currentTags ?? []) {
          const ci = /^contest:\s*(C_[A-Z0-9_]+)\s*$/.exec(tag);
          if (ci) contestedClaims.add(ci[1]);
          const gi = /^gain:\s*(C_[A-Z0-9_]+)\s*::/.exec(tag);
          if (gi) gainedClaims.add(gi[1]);
        }
      }
    } catch (err) {
      errors.push(`quote ${knot} with ${claim} threw: ${err.message ?? err}`);
      continue;
    }

    if (text.trim()) specific++;
    quotePairs++;
  }
  quoteHits.set(knot, specific);
}

for (const [knot, hits] of quoteHits) {
  if (hits === 0) errors.push(`quote knot '${knot}' produced no output for any claim`);
}

// --- invariants -------------------------------------------------------------

const orphans = [...declaredClaims].filter((c) => !gainedClaims.has(c));
const undeclared = [...gainedClaims].filter((c) => !declaredClaims.has(c));

for (const c of undeclared) {
  errors.push(`claim ${c} is gained but not declared in LIST Claim`);
}
if (deadEnds > 0) {
  errors.push(`${deadEnds} path(s) dead-ended on an out-of-range choice`);
}

// Orphans are expected while the slice is incomplete — warn, don't fail, but
// name every one so the count can never quietly drift.
if (orphans.length) {
  warnings.push(
    `${orphans.length} declared claim(s) not yet obtainable: ${orphans.join(', ')}`,
  );
}

// --- report -----------------------------------------------------------------

for (const w of warnings) console.warn(`\x1b[33mwarn\x1b[0m  ${w}`);
for (const e of errors) console.error(`\x1b[31mfail\x1b[0m  ${e}`);

// The walk enters each thread in isolation, so cross-thread unlocks are invisible
// to it: T-9's call branch needs C_TIME_CALL from T-7 before it opens, and a
// conditional contest (t9_quote only retracts once C_CAR_MOVED is already
// contested) needs prior state the coverage pass never sets up. So `contestable`
// is a FLOOR, not a total — tools/playtest.mjs walks real routes and is the
// authority on what actually fires. Said out loud because an undercount that
// looks like a total is worse than no number.
const metric = [
  `claims ${gainedClaims.size}/${declaredClaims.size} obtainable`,
  `${contestedClaims.size}/${declaredClaims.size} contestable (floor)`,
  `${orphans.length} orphan`,
  `${paths} paths walked`,
  `${quotePairs} quote pairs`,
  `${endings.size}/${entries.length + RETURN_ENTRIES.length} entries terminate`,
].join(' · ');

console.log(`\nstory gate: ${errors.length === 0 ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}`);
console.log(`metric: ${metric}`);

process.exit(errors.length === 0 ? 0 : 1);
