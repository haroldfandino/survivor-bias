import type { Sender } from '../lib/types';
import { CONTACTS_BY_ID } from '../lib/contacts';

/**
 * Circular branch avatar.
 *
 * Placeholder until the week-3 portrait pass: a duotone monogram carrying the
 * branch tint. The circular crop is the format the real generated portraits
 * will land in — small and heavily graded, which is what makes face drift
 * between timelines survivable. See design/style-lock.md.
 */
export function Avatar({ id, size = 40 }: { id: Sender; size?: number }) {
  const contact = CONTACTS_BY_ID[id];
  const tint = contact?.tint ?? 'var(--color-ink-faint)';
  // The player's own timeline has no number — it's the one that hasn't branched.
  const num = id === 'prime' ? '·' : id.replace('t', '');

  return (
    <div
      className="relative shrink-0 grid place-items-center rounded-full overflow-hidden"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(120% 120% at 30% 20%, ${tint}33, #0b0d10 70%)`,
        boxShadow: `inset 0 0 0 1px ${tint}44`,
      }}
      aria-hidden
    >
      <span
        className="font-mono tracking-tight"
        style={{ color: tint, fontSize: size * 0.34, opacity: 0.85 }}
      >
        {num}
      </span>
    </div>
  );
}
