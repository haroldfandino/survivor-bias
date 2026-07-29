import type { Contact } from './types';

/**
 * The three branches, in the order the player meets them.
 *
 * t7 and t12 are deliberately present-but-unreachable in the week-1 slice.
 * Showing them greyed is better than hiding them: it tells the player the
 * shape of the game, and "not yet reachable" is in-fiction rather than a
 * missing-content apology.
 */
export const CONTACTS: Contact[] = [
  {
    id: 't3',
    label: 'TIMELINE-3',
    blurb: 'the one who stayed',
    tint: 'var(--color-t3)',
    entry: 't3_open',
    quoteEntry: 't3_quote',
    reachable: true,
  },
  {
    id: 't7',
    label: 'TIMELINE-7',
    blurb: 'the one who atoned',
    tint: 'var(--color-t7)',
    entry: 't7_open',
    quoteEntry: 't7_quote',
    reachable: false,
  },
  {
    id: 't12',
    label: 'TIMELINE-12',
    blurb: 'the one who got out',
    tint: 'var(--color-t12)',
    entry: 't12_open',
    quoteEntry: 't12_quote',
    reachable: false,
  },
];

export const CONTACTS_BY_ID = Object.fromEntries(
  CONTACTS.map((c) => [c.id, c]),
) as Record<string, Contact>;
