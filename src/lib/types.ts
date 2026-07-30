/**
 * `prime` is the player's own timeline — the endgame surface, not a person.
 * `nell` speaks exactly once, in ending A. She is never a contact.
 */
export type Sender = 'you' | 't3' | 't7' | 't12' | 'prime' | 'nell' | 'system';

/** One chat bubble. `delay` is how long to hold the typing indicator first. */
export interface Message {
  id: string;
  from: Sender;
  text: string;
  delay: number;
  /** Voice-note asset id — render as a playable note rather than text. */
  voice?: string;
  /** Photo attachment path, relative to assets/. */
  img?: string;
}

/** One checkable assertion about that night. */
export interface Claim {
  id: string;
  text: string;
  source: Sender;
  contested: boolean;
}

export interface Contact {
  id: Sender;
  label: string;
  /** Shown under the name in the contact list. */
  blurb: string;
  /** CSS custom property holding this branch's key colour. */
  tint: string;
  /** ink knot to enter when the player opens this thread. */
  entry: string;
  /** ink knot used when quoting a claim at this person. */
  quoteEntry: string;
  /** false = present in the list but not yet contactable (week-1 scope). */
  reachable: boolean;
}
