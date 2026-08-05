import { useState } from 'react';
import type { Sender } from '../lib/types';
import { CONTACTS_BY_ID } from '../lib/contacts';

/**
 * Circular branch avatar.
 *
 * The real portraits are generated and graded by tools/gen_art.py — one duotone
 * per branch, half-shadowed faces, heavy grain. The circular crop is doing real
 * work: it's the most forgiving format for generated faces, which is what makes
 * running three portraits of "the same man" viable without a character LoRA.
 * See design/style-lock.md.
 *
 * Falls back to a tinted monogram if a portrait is missing, so the app never
 * shows a broken image.
 */
export function Avatar({ id, size = 40 }: { id: Sender; size?: number }) {
  const [failed, setFailed] = useState(false);
  const contact = CONTACTS_BY_ID[id];
  const tint = contact?.tint ?? 'var(--color-ink-faint)';
  // Chapter threads borrow the face of the self they're about, so a prequel is
  // recognisably his rather than falling back to a glyph.
  const face = contact?.avatar ?? id;
  // The player's own timeline has no number — it's the one that hasn't branched.
  const num = face === 'prime' ? '·' : face.replace('t', '');
  const hasPortrait = !failed && face !== 'prime' && face !== 'system' && face !== 'you';

  return (
    <div
      className="relative shrink-0 grid place-items-center overflow-hidden rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(120% 120% at 30% 20%, ${tint}33, #0b0d10 70%)`,
        boxShadow: `inset 0 0 0 1px ${tint}44`,
      }}
      aria-hidden
    >
      {hasPortrait ? (
        <img
          src={`/portraits/${face}.webp`}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : id === 'prime' ? (
        /* The player's own timeline gets the game's central motif rather than a
           glyph: a filled marker, the same thing that means "answered" on the
           convergence diagram. A `·` character was near-invisible at 40px and
           read as a broken image rather than a deliberate absence. */
        <span
          className="block rounded-full"
          style={{
            width: size * 0.3,
            height: size * 0.3,
            background: tint,
            boxShadow: `0 0 ${size * 0.28}px ${tint}`,
          }}
        />
      ) : (
        <span
          className="font-mono tracking-tight"
          style={{ color: tint, fontSize: size * 0.34, opacity: 0.85 }}
        >
          {num}
        </span>
      )}
    </div>
  );
}
