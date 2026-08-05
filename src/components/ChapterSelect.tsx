import type { ReactNode } from 'react';
import { CHAPTERS, chapterUnlocked, type Chapter } from '../lib/chapters';
import { useGame } from '../state/game';
import { Avatar } from './Avatar';

/**
 * The chapters either side of Tonight.
 *
 * Deliberately a separate surface from the contact list rather than more rows on
 * it: the home screen is the four branches you are talking to *right now*, and
 * putting twenty-years-ago in the same list would flatten the difference between
 * a live conversation and a record of one.
 *
 * Locked codas are shown, not hidden — seeing that there are two other nights
 * you didn't reach is the same trick TONIGHT plays by sitting there unopenable.
 */
export function ChapterSelect() {
  const { openContact, closeChapterList, threads, ending } = useGame();

  const before = CHAPTERS.filter((c) => c.group === 'before');
  const after = CHAPTERS.filter((c) => c.group === 'after');

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-bg">
      <header className="flex items-center gap-3 border-b border-hairline px-3 pb-3 pt-5">
        <button
          onClick={closeChapterList}
          aria-label="Back to branches"
          className="-ml-1 grid h-10 w-10 place-items-center rounded-full text-ink-dim hover:bg-raised hover:text-ink"
        >
          <svg width="8" height="13" viewBox="0 0 8 13" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M7 1L1.5 6.5 7 12" />
          </svg>
        </button>
        <div>
          <h1 className="text-[1.0625rem] font-medium tracking-tight">The record</h1>
          <p className="mt-0.5 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-faint">
            twenty years either side
          </p>
        </div>
      </header>

      <div className="scroll-quiet flex-1 overflow-y-auto">
        <Shelf title="before" note="the twenty years that made them">
          {before.map((c) => (
            <Row key={c.id} chapter={c} unlocked thread={threads[c.id]?.length ?? 0} onOpen={openContact} />
          ))}
        </Shelf>

        <Shelf title="after" note="what the choice cost">
          {after.map((c) => (
            <Row
              key={c.id}
              chapter={c}
              unlocked={chapterUnlocked(c, ending)}
              thread={threads[c.id]?.length ?? 0}
              onOpen={openContact}
            />
          ))}
        </Shelf>
      </div>
    </div>
  );
}

function Shelf({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-hairline/60 pb-1">
      <div className="px-4 pb-1 pt-4">
        <div className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-ink-faint">
          {title}
        </div>
        <div className="mt-0.5 text-[0.8125rem] text-ink-dim">{note}</div>
      </div>
      <ul>{children}</ul>
    </section>
  );
}

function Row({
  chapter,
  unlocked,
  thread,
  onOpen,
}: {
  chapter: Chapter;
  unlocked: boolean;
  thread: number;
  onOpen: (id: Chapter['id']) => void;
}) {
  return (
    <li>
      <button
        onClick={() => onOpen(chapter.id)}
        disabled={!unlocked}
        className="flex w-full items-center gap-3 border-t border-hairline/60 px-4 py-3 text-left transition-colors enabled:hover:bg-raised disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Avatar id={chapter.id} size={34} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span
              className="font-mono text-[0.75rem] tracking-tight"
              style={{ color: chapter.tint }}
            >
              {chapter.label}
            </span>
            {!unlocked && (
              <span className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-ink-faint">
                not this night
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-[0.8125rem] text-ink-dim">
            {chapter.blurb}
          </span>
        </span>
        {thread > 0 && (
          <span className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-ink-faint">
            read
          </span>
        )}
      </button>
    </li>
  );
}
