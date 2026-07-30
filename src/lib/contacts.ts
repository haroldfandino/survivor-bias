import type { Contact, Sender } from './types';

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
  {
    // Not a person — the player's own night, and the decision waiting in it.
    // Deliberately listed from the very first screen so it sits there being
    // unopenable: ink turns the player away until they have a reason to act.
    // That dread is the point, and it's also how the deadline stays *felt*
    // rather than shown — there is no timer anywhere in this game.
    id: 'prime',
    label: 'TONIGHT',
    blurb: 'your timeline',
    tint: 'var(--color-accent)',
    entry: 'endgame',
    quoteEntry: 'endgame',
    reachable: true,
  },
];

export const CONTACTS_BY_ID = Object.fromEntries(
  CONTACTS.map((c) => [c.id, c]),
) as Record<string, Contact>;

/**
 * Tint for any sender, including the ones that aren't contacts.
 *
 * Nell is warm — the only warm thing in the game, and she appears exactly once.
 * See design/style-lock.md §3.
 */
export function tintFor(id: Sender): string {
  if (id === 'nell') return '#F2D9B0';
  return CONTACTS_BY_ID[id]?.tint ?? 'var(--color-ink-faint)';
}
