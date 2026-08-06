/**
 * `prime` is the player's own timeline — the endgame surface, not a person.
 * `nell` speaks exactly once, in ending A. She is never a contact.
 */
export type Sender =
  | 'you'
  | 't2'
  | 't3'
  | 't7'
  | 't9'
  | 't11'
  | 't12'
  | 'prime'
  | 'nell'
  | 'system'
  /**
   * Chapter threads — the prequels (ch2a–ch2c) and codas (ch3a–ch3c). They are
   * threads rather than people: the bubbles inside them still come `# from: t3`
   * and friends, so they render in the right voice and colour. Only the thread
   * itself is addressed by these ids.
   */
  | 'ch2a'
  | 'ch2b'
  | 'ch2c'
  | 'ch3a'
  | 'ch3b'
  | 'ch3c';

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
  /**
   * Hands this beat to a full-screen sequence, pausing the message queue until
   * it completes. Currently only 'convergence' (ending A).
   */
  screen?: string;
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
  /**
   * Borrow another sender's portrait and monogram. Chapter threads use this so
   * the T-3 prequel wears T-3's face instead of falling back to a glyph.
   */
  avatar?: Sender;
}
