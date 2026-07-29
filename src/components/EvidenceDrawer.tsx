import { useGame } from '../state/game';
import { CONTACTS_BY_ID } from '../lib/contacts';

/**
 * The evidence drawer — the second half of the core loop.
 *
 * Claims are not just a reading log: tapping one arms it, which sends the
 * player back to the branch list to pick who to put it to. Contested claims
 * are flagged, because a contradiction is the thing the player is hunting.
 */
export function EvidenceDrawer() {
  const { claims, evidenceOpen, toggleEvidence, arm } = useGame();
  if (!evidenceOpen) return null;

  const contestedCount = claims.filter((c) => c.contested).length;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-bg/97 backdrop-blur">
      <header className="flex items-center justify-between border-b border-hairline px-4 pb-3 pt-5">
        <div>
          <h2 className="text-[1.0625rem] font-medium tracking-tight">Evidence</h2>
          <p className="mt-0.5 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-faint">
            {claims.length} claim{claims.length === 1 ? '' : 's'}
            {contestedCount > 0 && ` · ${contestedCount} contested`}
          </p>
        </div>
        <button
          onClick={toggleEvidence}
          aria-label="Close evidence"
          className="grid h-8 w-8 place-items-center rounded-full text-ink-dim hover:bg-raised hover:text-ink"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" stroke="currentColor" strokeWidth="1.6">
            <path d="M1 1l9 9M10 1l-9 9" />
          </svg>
        </button>
      </header>

      {claims.length === 0 ? (
        <p className="px-4 py-8 text-center text-[0.8125rem] text-ink-faint">
          Nothing yet. Talk to someone.
        </p>
      ) : (
        <ul className="scroll-quiet flex-1 overflow-y-auto px-3 py-3">
          {claims.map((c) => {
            const tint = CONTACTS_BY_ID[c.source]?.tint ?? 'var(--color-ink-faint)';
            return (
              <li key={c.id} className="mb-2">
                <button
                  onClick={() => arm(c.id)}
                  className="w-full rounded border border-hairline bg-raised p-3 text-left transition-colors hover:border-ink-faint"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="font-mono text-[0.5625rem] uppercase tracking-[0.12em]"
                      style={{ color: tint }}
                    >
                      {CONTACTS_BY_ID[c.source]?.label ?? c.source}
                    </span>
                    {c.contested && (
                      <span className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-accent">
                        contested
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-[0.875rem] leading-snug text-ink">
                    {c.text}
                  </span>
                  <span className="mt-1.5 block font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-ink-faint">
                    tap to quote →
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
