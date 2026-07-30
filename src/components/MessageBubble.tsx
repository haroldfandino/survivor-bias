import { useState } from 'react';
import type { Message } from '../lib/types';
import { tintFor } from '../lib/contacts';
import { VoiceNote } from './VoiceNote';

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
  const tint = tintFor(msg.from);

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

        {msg.voice ? <VoiceNote id={msg.voice} tint={tint} /> : msg.text}
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

