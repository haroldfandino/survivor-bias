import { useEffect, useReducer, useState } from 'react';
import { useGame } from '../state/game';

/**
 * The convergence screen — ending A's climax.
 *
 * Seven lives leave one trunk and fan out. A rule crosses all of them at 01:38.
 * On every line there is a marker at that moment, and on exactly one of them it
 * is FILLED. That is the whole game in a single glyph: the difference between
 * seven lives is one answered call.
 *
 * Then the six that didn't answer go out, one at a time, and the player is left
 * looking at the only line still lit.
 *
 * Two markers are drawn against the grain, and both are load-bearing:
 *   - T-9's ring is dashed and heavier. He reached the call and declined it, so
 *     his is the only unanswered marker with a decision inside it.
 *   - T-11 never fully goes out. In his branch she was never found, so there is
 *     no moment for his line to end at — it dims and stays. His terminal label
 *     is NO RECORD, not NO SIGNAL.
 *
 * Labels are abbreviated (T-3, not TIMELINE-3) because seven branches across a
 * 400-unit viewBox leaves ~55 units per column and the long form collides.
 *
 * SVG rather than WebGL on purpose — it's seven lines and a rule. A shader would
 * cost more than the entire art payload to draw something crisper at 2 KB. The
 * global grain overlay in index.css sits above this and ties it to everything
 * else, so it doesn't need its own texture.
 */

const BRANCHES = [
  { id: 't2', label: 'T-2', x: 36, tint: 'var(--color-t2)', answered: false },
  { id: 't3', label: 'T-3', x: 91, tint: 'var(--color-t3)', answered: false },
  { id: 't7', label: 'T-7', x: 145, tint: 'var(--color-t7)', answered: false },
  { id: 'prime', label: 'YOU', x: 200, tint: '#E4E6EA', answered: true },
  { id: 't9', label: 'T-9', x: 255, tint: 'var(--color-t9)', answered: false },
  { id: 't11', label: 'T-11', x: 309, tint: 'var(--color-t11)', answered: false },
  { id: 't12', label: 'T-12', x: 364, tint: 'var(--color-t12)', answered: false },
] as const;

const TRUNK_X = 200;
const FORK_Y = 150;
const CALL_Y = 400;
const END_Y = 560;

/** Stage timings in ms, from mount. Each stage is additive, never re-entered. */
const STAGES = {
  trunk: 200,
  branches: 900,
  rule: 2200,
  markers: 2900,
  /** The six unanswered branches go dark, staggered. */
  darken: 4600,
  done: 9200,
} as const;

type Stage = keyof typeof STAGES;
const ORDER: Stage[] = ['trunk', 'branches', 'rule', 'markers', 'darken', 'done'];

export function Convergence() {
  const dismissScreen = useGame((s) => s.dismissScreen);
  const [reached, advance] = useReducer(
    (n: number, to: number) => Math.max(n, to),
    0,
  );
  const [reduced] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  );

  // Under reduced motion, skip straight to the end state — the information
  // matters more than the choreography.
  useEffect(() => {
    if (reduced) {
      advance(ORDER.length);
      return;
    }
    const timers = ORDER.map((stage, i) =>
      setTimeout(() => advance(i + 1), STAGES[stage]),
    );
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  const at = (stage: Stage) => reached > ORDER.indexOf(stage);
  const done = at('done');

  // Test seam: the sequence is timer-driven, and hidden tabs throttle timers.
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__convergence = {
      skipToEnd: () => advance(ORDER.length),
      stage: () => ORDER[Math.max(0, reached - 1)] ?? 'pending',
    };
  }, [reached]);

  return (
    <div
      className="absolute inset-0 z-[70] flex flex-col items-center justify-center bg-bg"
      role="img"
      aria-label="Seven timelines diverge at 01:38. One answered the call. Five go dark, and one has no record to go dark at."
    >
      <svg viewBox="0 0 400 620" className="w-full max-w-[420px]" aria-hidden>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Shared past. One life, up to the night. */}
        <line
          x1={TRUNK_X}
          y1={40}
          x2={TRUNK_X}
          y2={FORK_Y}
          stroke="var(--color-ink-faint)"
          strokeWidth={1.5}
          style={{
            strokeDasharray: 120,
            strokeDashoffset: at('trunk') ? 0 : 120,
            transition: 'stroke-dashoffset 700ms ease-out',
          }}
        />

        {/* The rule at 01:38 — the only labelled time on the diagram. */}
        <g
          style={{
            opacity: at('rule') ? 1 : 0,
            transition: 'opacity 900ms ease-out',
          }}
        >
          <line
            x1={28}
            y1={CALL_Y}
            x2={372}
            y2={CALL_Y}
            stroke="var(--color-hairline)"
            strokeWidth={1}
            strokeDasharray="3 4"
          />
          <text
            x={28}
            y={CALL_Y - 10}
            className="font-mono"
            fontSize={11}
            letterSpacing={2}
            fill="var(--color-ink-faint)"
          >
            01:38
          </text>
        </g>

        {/* Extinguish order is left to right across the unanswered branches, so
            the stagger is indexed on those alone — with six of them, the old
            900ms step ran past `done` and the last line went dark after the
            button already said "continue". */}
        {BRANCHES.map((b, i) => {
          const dark = at('darken') && !b.answered;
          const unansweredIndex = BRANCHES.filter((o) => !o.answered).findIndex(
            (o) => o.id === b.id,
          );
          const stagger = b.answered ? 0 : unansweredIndex * 500;
          // T-9 saw the call and chose not to answer, so his marker is drawn as a
          // ring that was reached and declined rather than one never reached at
          // all — the only unanswered marker with anything inside it.
          const declined = b.id === 't9';
          // T-11's branch has no resolution to go dark at. He dims and stays.
          const unresolved = b.id === 't11';

          return (
            <g key={b.id}>
              {/* Fork out from the trunk, then straight down. */}
              <path
                d={`M ${TRUNK_X} ${FORK_Y} C ${TRUNK_X} ${FORK_Y + 60}, ${b.x} ${FORK_Y + 40}, ${b.x} ${FORK_Y + 110} L ${b.x} ${END_Y}`}
                fill="none"
                stroke={b.tint}
                strokeWidth={b.answered ? 2.2 : 1.5}
                filter={b.answered && at('markers') ? 'url(#glow)' : undefined}
                style={{
                  strokeDasharray: 520,
                  strokeDashoffset: at('branches') ? 0 : 520,
                  opacity: dark ? (unresolved ? 0.3 : 0.1) : 1,
                  transition: [
                    'stroke-dashoffset 1100ms ease-out',
                    `opacity 1400ms ease-in ${stagger}ms`,
                  ].join(', '),
                }}
              />

              {/* The call. Filled means answered. */}
              <circle
                cx={b.x}
                cy={CALL_Y}
                r={b.answered ? 7 : 5}
                fill={b.answered ? b.tint : 'var(--color-bg)'}
                stroke={b.tint}
                strokeWidth={declined ? 2.6 : 1.8}
                strokeDasharray={declined ? '2 2' : undefined}
                filter={b.answered && at('markers') ? 'url(#glow)' : undefined}
                style={{
                  opacity: at('markers') ? (dark ? (unresolved ? 0.34 : 0.12) : 1) : 0,
                  transform: at('markers') ? 'scale(1)' : 'scale(0.4)',
                  transformOrigin: `${b.x}px ${CALL_Y}px`,
                  transition: [
                    `opacity 500ms ease-out ${dark ? stagger : i * 220}ms`,
                    `transform 500ms cubic-bezier(0.16,1,0.3,1) ${i * 220}ms`,
                  ].join(', '),
                }}
              />

              <text
                x={b.x}
                y={END_Y + 26}
                textAnchor="middle"
                className="font-mono"
                fontSize={8}
                letterSpacing={0.8}
                fill={dark ? 'var(--color-ink-faint)' : b.tint}
                style={{
                  opacity: at('branches') ? 1 : 0,
                  transition: `opacity 600ms ease-out ${stagger}ms, fill 1200ms ease-in ${stagger}ms`,
                }}
              >
                {dark ? (unresolved ? 'NO RECORD' : 'NO SIGNAL') : b.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Skippable from the first frame — nobody should be held in a cutscene. */}
      <button
        onClick={dismissScreen}
        className="mt-4 px-6 py-4 font-mono text-[0.625rem] uppercase tracking-[0.18em] text-ink-faint transition-colors hover:text-ink"
      >
        {done ? 'continue' : 'skip'}
      </button>
    </div>
  );
}
