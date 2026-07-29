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
  const bottom = useRef<HTMLDivElement>(null);

  // Keep the newest message in view as bubbles land and choices appear.
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, typing, choices.length]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-hairline bg-bg/90 px-3 pb-3 pt-5 backdrop-blur">
        <button
          onClick={closeThread}
          aria-label="Back to branches"
          className="grid h-8 w-8 place-items-center rounded-full text-ink-dim hover:bg-raised hover:text-ink"
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

      <div className="scroll-quiet flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} />
        ))}
        {typing === id && <TypingIndicator tint={contact?.tint ?? '#888'} />}
        <div ref={bottom} />
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
