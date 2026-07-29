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
import { readFileSync, readdirSync } from 'node:fs';
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
 * Knots referenced by the UI's contact table.
 *
 * Only knots belonging to *reachable* contacts must exist — unreachable
 * branches are deliberately unwritten in the week-1 slice, and the gate should
 * not demand content the scope hasn't reached yet.
 */
const requiredKnots = (() => {
  const src = readFileSync(join(root, 'src', 'lib', 'contacts.ts'), 'utf8');
  const re =
    /id:\s*'([^']+)'[\s\S]*?entry:\s*'([^']+)'[\s\S]*?quoteEntry:\s*'([^']+)'[\s\S]*?reachable:\s*(true|false)/g;
  const knots = [];
  for (const m of src.matchAll(re)) {
    if (m[4] === 'true') knots.push(m[2], m[3]);
  }
  if (!knots.length) {
    warnings.push('contacts.ts: no reachable contacts found — nothing to walk');
  }
  return knots;
})();

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
function walk(entry) {
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

const metric = [
  `claims ${gainedClaims.size}/${declaredClaims.size} obtainable`,
  `${contestedClaims.size} contestable`,
  `${orphans.length} orphan`,
  `${paths} paths walked`,
  `${endings.size}/${entries.length} entries terminate`,
].join(' · ');

console.log(`\nstory gate: ${errors.length === 0 ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}`);
console.log(`metric: ${metric}`);

process.exit(errors.length === 0 ? 0 : 1);
