#!/usr/bin/env node
/**
 * Compiles story/main.ink (and its INCLUDEs) to src/story.json.
 *
 * Run directly, or via `npm run story`. Also runs as a prebuild step so a
 * stale story.json can never ship.
 *
 * INCLUDEs are inlined here rather than handed to an inkjs file handler:
 * inkjs 2.4 only ships JsonFileHandler (a virtual file map), and inlining is
 * exactly what the compiler would do anyway. Knots and VARs are global in ink,
 * so concatenation order doesn't matter.
 */
import { Compiler } from 'inkjs/full';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const storyDir = join(root, 'story');
const entry = join(storyDir, 'main.ink');
const out = join(root, 'src', 'story.json');

/** Recursively inline INCLUDE lines, tracking which files we've already read. */
function inline(file, seen = new Set()) {
  const abs = resolve(file);
  if (seen.has(abs)) return '';
  seen.add(abs);

  if (!existsSync(abs)) {
    console.error(`\x1b[31mstory: missing include -> ${abs}\x1b[0m`);
    process.exit(1);
  }

  return readFileSync(abs, 'utf8')
    .split(/\r?\n/)
    .map((line) => {
      const m = /^\s*INCLUDE\s+(.+?)\s*$/.exec(line);
      if (!m) return line;
      // Replace the INCLUDE with the file's contents, guarded by a marker so
      // compiler line numbers stay traceable to a source file.
      const target = join(storyDir, m[1]);
      return `// >>> ${m[1]}\n${inline(target, seen)}\n// <<< ${m[1]}`;
    })
    .join('\n');
}

const source = inline(entry);

// NB: do not pass `sourceFilename` — inkjs 2.4 demands a FileHandler the
// moment that option is set, even with every INCLUDE already inlined.
const compiler = new Compiler(source, {
  errorHandler: (message, type) => {
    if (type === 2) {
      console.error(`\x1b[31m${message}\x1b[0m`);
      process.exitCode = 1;
    } else if (type === 1) {
      console.warn(`\x1b[33m${message}\x1b[0m`);
    } else {
      console.log(message);
    }
  },
});

let story;
try {
  story = compiler.Compile();
} catch (err) {
  console.error(`\x1b[31m${err.message ?? err}\x1b[0m`);
  process.exit(1);
}

if (process.exitCode === 1 || !story) {
  console.error('\nstory: compile FAILED');
  process.exit(1);
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, story.ToJson(), 'utf8');
console.log('story: compiled -> src/story.json');
