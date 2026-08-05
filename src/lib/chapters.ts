import type { Contact, Sender } from './types';

/**
 * The chapters either side of Tonight.
 *
 * Tonight is the game. These are the twenty years before it (the prequels) and
 * what the choice cost afterwards (the codas). They are ordinary threads as far
 * as the runtime is concerned — same ChatView, same transcript store — which is
 * why they're shaped as `Contact`s rather than getting a surface of their own.
 *
 * They share Tonight's ink story instance but never touch its state: no tick(),
 * no claims. See the CHAPTER RULES header in story/ch2a.ink.
 */
export interface Chapter extends Contact {
  /** Which shelf it sits on in the chapter list. */
  group: 'before' | 'after';
  /** Ending required to unlock, for codas. Prequels are always open. */
  requiresEnding?: 'A' | 'B' | 'C';
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'ch2a',
    label: 'BEFORE — TIMELINE-3',
    blurb: 'the twenty years',
    tint: 'var(--color-t3)',
    entry: 'ch2a_open',
    // Prequels hold no claims, so there is nothing to quote at them. Pointed at
    // the entry knot so an armed quote degrades to simply opening the thread
    // rather than diverting into a knot that doesn't exist.
    quoteEntry: 'ch2a_open',
    reachable: true,
    avatar: 't3',
    group: 'before',
  },
  {
    id: 'ch2b',
    label: 'BEFORE — TIMELINE-7',
    blurb: 'the twenty years',
    tint: 'var(--color-t7)',
    entry: 'ch2b_open',
    quoteEntry: 'ch2b_open',
    reachable: true,
    avatar: 't7',
    group: 'before',
  },
  {
    id: 'ch2c',
    label: 'BEFORE — TIMELINE-12',
    blurb: 'the twenty years',
    tint: 'var(--color-t12)',
    entry: 'ch2c_open',
    quoteEntry: 'ch2c_open',
    reachable: true,
    avatar: 't12',
    group: 'before',
  },
  {
    id: 'ch3a',
    label: 'AFTER — PREVENTED',
    blurb: 'she lived',
    tint: 'var(--color-accent-text)',
    entry: 'ch3a_open',
    quoteEntry: 'ch3a_open',
    reachable: true,
    avatar: 'prime',
    group: 'after',
    requiresEnding: 'A',
  },
  {
    id: 'ch3b',
    label: 'AFTER — SUBSTITUTED',
    blurb: 'they were relieved',
    tint: 'var(--color-accent-text)',
    entry: 'ch3b_open',
    quoteEntry: 'ch3b_open',
    reachable: true,
    avatar: 'prime',
    group: 'after',
    requiresEnding: 'B',
  },
  {
    id: 'ch3c',
    label: 'AFTER — REFUSED',
    blurb: 'nobody knows',
    tint: 'var(--color-accent-text)',
    entry: 'ch3c_open',
    quoteEntry: 'ch3c_open',
    reachable: true,
    avatar: 'prime',
    group: 'after',
    requiresEnding: 'C',
  },
];

export const CHAPTER_IDS = new Set<Sender>(CHAPTERS.map((c) => c.id));

/**
 * Whether a chapter is open to the player yet.
 *
 * Prequels always are — they're background, and reading them first is a valid
 * way in. A coda needs its own ending: the ink knots enforce this too (they
 * divert to `ch3_locked`), so this is presentation, not the actual gate.
 */
export function chapterUnlocked(chapter: Chapter, ending: string): boolean {
  if (!chapter.requiresEnding) return true;
  return chapter.requiresEnding === ending;
}
