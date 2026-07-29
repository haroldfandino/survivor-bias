import type { Contact } from './types';

/**
 * The three branches, in the order the player meets them.
 *
 * All three are reachable now. `reachable: false` stays supported because the
 * gate keys off it — an unwritten branch can be listed without demanding its
 * knots exist — and because ending A takes the selves offline one at a time.
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
    reachable: true,
  },
  {
    id: 't12',
    label: 'TIMELINE-12',
    blurb: 'the one who got out',
    tint: 'var(--color-t12)',
    entry: 't12_open',
    quoteEntry: 't12_quote',
    reachable: true,
  },
];

export const CONTACTS_BY_ID = Object.fromEntries(
  CONTACTS.map((c) => [c.id, c]),
) as Record<string, Contact>;
