import { useState } from 'react';
import type { Message } from '../lib/types';
import { CONTACTS_BY_ID } from '../lib/contacts';

/**
 * One chat bubble.
 *
 * System lines are centred, uppercase and mono — they're the app talking, not
 * a person, and should read as instrumentation.
 */
export function MessageBubble({ msg }: { msg: Message }) {
  if (msg.from === 'system') {
    return (
      <div className="msg-in py-2 text-center">
        <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-faint">
          {msg.text}
        </span>
      </div>
    );
  }

  const mine = msg.from === 'you';
  const tint = CONTACTS_BY_ID[msg.from]?.tint ?? 'var(--color-ink-faint)';

  return (
    <div className={`msg-in flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[78%] px-3 py-2 text-[0.9375rem] leading-[1.45]"
        style={{
          borderRadius: 'var(--radius-bubble)',
          background: mine ? '#1E242D' : 'var(--color-raised)',
          color: 'var(--color-ink)',
          borderBottomRightRadius: mine ? '0.25rem' : undefined,
          borderBottomLeftRadius: mine ? undefined : '0.25rem',
          boxShadow: mine ? 'none' : `inset 0 0 0 1px ${tint}22`,
        }}
      >
        {msg.img && <Attachment src={msg.img} tint={tint} />}

        {msg.voice ? <VoiceNote tint={tint} /> : msg.text}
      </div>
    </div>
  );
}

/**
 * A photo attachment.
 *
 * Assets are pre-graded to the sender's branch duotone by tools/gen_art.py, so
 * nothing needs tinting here — the frame just has to not fight them. Renders a
 * labelled placeholder rather than a broken image if the file is absent.
 */
function Attachment({ src, tint }: { src: string; tint: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className="mb-2 -mx-1 overflow-hidden rounded"
      style={{ boxShadow: `inset 0 0 0 1px ${tint}33` }}
    >
      {failed ? (
        <div
          className="grid h-36 place-items-center font-mono text-[0.625rem] uppercase tracking-[0.12em]"
          style={{ background: `linear-gradient(160deg, ${tint}18, #0b0d10)`, color: `${tint}99` }}
        >
          {src.replace(/^.*\//, '')}
        </div>
      ) : (
        // Eager, not lazy. An attachment arriving is a story beat, and the whole
        // evidence set is ~330 KB — a frame that fills in after the bubble lands
        // reads as a glitch. (It also makes the image reliably present for
        // automated checks, where a hidden tab never fires the lazy observer.)
        <img src={`/${src}`} alt="" className="block w-full" onError={() => setFailed(true)} />
      )}
    </div>
  );
}

/**
 * Voice-note placeholder.
 *
 * Audio arrives in week 4 (cloned VO per branch). The control is built now so
 * the layout is already correct and the week-4 pass is a wiring job, not a
 * redesign.
 */
function VoiceNote({ tint }: { tint: string }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <div
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full"
        style={{ background: `${tint}22`, color: tint }}
      >
        <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
          <path d="M0 0l10 6-10 6z" />
        </svg>
      </div>
      <div className="flex h-6 flex-1 items-center gap-[2px]">
        {WAVEFORM.map((h, i) => (
          <span
            key={i}
            className="w-[2px] rounded-full"
            style={{ height: `${h}%`, background: `${tint}66` }}
          />
        ))}
      </div>
      <span className="font-mono text-[0.625rem] text-ink-faint">0:07</span>
    </div>
  );
}

// Fixed, not random — a stable waveform silhouette reads as a real file.
const WAVEFORM = [
  20, 42, 30, 64, 48, 82, 55, 38, 70, 90, 62, 44, 76, 34, 52, 28, 60, 40, 24, 46,
  32, 68, 50, 36,
];
