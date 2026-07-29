import { CONTACTS } from '../lib/contacts';
import { useGame } from '../state/game';
import { Avatar } from './Avatar';

/**
 * The app's home screen.
 *
 * When a claim is armed, this doubles as the "quote at whom?" picker — the
 * player is choosing a target rather than just opening a thread, so the header
 * changes to say so.
 */
export function ContactList() {
  const { threads, unread, openContact, armed, claims, arm } = useGame();
  const armedClaim = claims.find((c) => c.id === armed);

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-hairline px-4 pb-3 pt-5">
        {armedClaim ? (
          <>
            <div className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-accent">
              quote this at —
            </div>
            <p className="mt-1.5 text-[0.8125rem] leading-snug text-ink-dim">
              “{armedClaim.text}”
            </p>
            <button
              onClick={() => arm(null)}
              className="mt-2 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-faint hover:text-ink"
            >
              cancel
            </button>
          </>
        ) : (
          <>
            <h1 className="text-[1.0625rem] font-medium tracking-tight">Branches</h1>
            <p className="mt-0.5 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-faint">
              3 reachable · signal unstable
            </p>
          </>
        )}
      </header>

      <ul className="scroll-quiet flex-1 overflow-y-auto">
        {CONTACTS.map((c) => {
          const thread = threads[c.id] ?? [];
          const last = thread[thread.length - 1];
          const count = unread[c.id] ?? 0;

          return (
            <li key={c.id}>
              <button
                onClick={() => openContact(c.id)}
                disabled={!c.reachable}
                className="flex w-full items-center gap-3 border-b border-hairline/60 px-4 py-3 text-left transition-colors enabled:hover:bg-raised disabled:cursor-not-allowed disabled:opacity-35"
              >
                <Avatar id={c.id} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span
                      className="font-mono text-[0.8125rem] tracking-tight"
                      style={{ color: c.tint }}
                    >
                      {c.label}
                    </span>
                    {!c.reachable && (
                      <span className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-ink-faint">
                        no signal
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-[0.8125rem] text-ink-dim">
                    {last ? last.text : c.blurb}
                  </span>
                </span>
                {count > 0 && (
                  <span
                    className="grid h-5 min-w-5 place-items-center rounded-full px-1.5 font-mono text-[0.625rem]"
                    style={{ background: 'var(--color-accent)', color: '#fff' }}
                  >
                    {count}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
