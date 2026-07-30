import { useEffect, useRef } from 'react';
import { useGame } from '../state/game';
import { CONTACTS_BY_ID } from '../lib/contacts';
import { MessageBubble } from './MessageBubble';
import { Avatar } from './Avatar';
import type { Sender } from '../lib/types';

export function ChatView({ id }: { id: Sender }) {
  const { threads, typing, choices, choose, closeThread } = useGame();
  const messages = threads[id] ?? [];
  const contact = CONTACTS_BY_ID[id];
  const scroller = useRef<HTMLDivElement>(null);

  /**
   * Keep the newest message in view as bubbles land and choices appear.
   *
   * Scrolls the container to its own maximum rather than calling
   * scrollIntoView on a sentinel: when the choice panel grows from one option to
   * four, the scroll area shrinks in the same frame, and scrollIntoView resolved
   * against the pre-shrink layout — leaving the last two bubbles clipped below
   * the fold. Two rAFs, so it runs after layout has actually settled.
   */
  useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const el = scroller.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [messages.length, typing, choices.length]);

  /**
   * Re-scroll once an attachment has actually decoded.
   *
   * An evidence image arrives with no intrinsic height, so the scroll above runs
   * against a layout that is still short and the photo ends up half below the
   * fold. `load` doesn't bubble, hence the capture-phase listener.
   */
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onLoad = () => {
      el.scrollTop = el.scrollHeight;
    };
    el.addEventListener('load', onLoad, true);
    return () => el.removeEventListener('load', onLoad, true);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-hairline bg-bg/90 px-3 pb-3 pt-5 backdrop-blur">
        <button
          onClick={closeThread}
          aria-label="Back to branches"
          className="-ml-1 grid h-10 w-10 place-items-center rounded-full text-ink-dim hover:bg-raised hover:text-ink"
        >
          <svg width="8" height="13" viewBox="0 0 8 13" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M7 1L1.5 6.5 7 12" />
          </svg>
        </button>
        <Avatar id={id} size={32} />
        <div className="min-w-0">
          <div
            className="font-mono text-[0.8125rem] tracking-tight"
            style={{ color: contact?.tint }}
          >
            {contact?.label}
          </div>
          <div className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-faint">
            {typing === id ? 'typing…' : contact?.blurb}
          </div>
        </div>
      </header>

      {/* Bottom-anchored. A short conversation must sit just above the composer
          and grow upward, the way every messaging app does — with the content
          top-aligned instead, the first few bubbles float in a void and the
          whole screen reads as a layout bug. `mt-auto` on an inner wrapper
          rather than `justify-end` on the scroller, because justify-end clips
          the top of overflowing content. */}
      <div ref={scroller} className="scroll-quiet flex flex-1 flex-col overflow-y-auto px-3 py-4">
        <div className="mt-auto flex flex-col gap-1.5">
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} />
          ))}
          {typing === id && <TypingIndicator tint={contact?.tint ?? '#888'} />}
        </div>
      </div>

      <footer className="border-t border-hairline p-3">
        {choices.length > 0 ? (
          <div className="flex flex-col gap-2">
            {choices.map((c) => (
              <button
                key={c.index}
                onClick={() => choose(c.index)}
                className="rounded-2xl border border-hairline bg-input px-3.5 py-2.5 text-left text-[0.9375rem] text-ink transition-colors hover:border-ink-faint hover:bg-raised"
              >
                {c.text}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid h-11 place-items-center rounded-2xl bg-input">
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-faint">
              {typing ? '' : 'waiting'}
            </span>
          </div>
        )}
      </footer>
    </div>
  );
}

function TypingIndicator({ tint }: { tint: string }) {
  return (
    <div className="flex justify-start">
      <div
        className="flex items-center gap-1 px-3.5 py-3"
        style={{ borderRadius: 'var(--radius-bubble)', background: 'var(--color-raised)' }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="typing-dot h-1.5 w-1.5 rounded-full"
            style={{ background: tint, animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  );
}
