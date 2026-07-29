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
  // The player's own timeline has no number — it's the one that hasn't branched.
  const num = id === 'prime' ? '·' : id.replace('t', '');
  const hasPortrait = !failed && id !== 'prime' && id !== 'system' && id !== 'you';

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
          src={`/portraits/${id}.webp`}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
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
