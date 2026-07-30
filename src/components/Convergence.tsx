import { useEffect, useReducer, useState } from 'react';
import { useGame } from '../state/game';

/**
 * The convergence screen — ending A's climax.
 *
 * Four lives leave one trunk and fan out. A rule crosses all of them at 01:38.
 * On every line there is a marker at that moment, and on exactly one of them it
 * is FILLED. That is the whole game in a single glyph: the difference between
 * four lives is one answered call.
 *
 * Then the three that didn't answer go out, one at a time, and the player is
 * left looking at the only line still lit.
 *
 * SVG rather than WebGL on purpose — it's four lines and a rule. A shader would
 * cost more than the entire art payload to draw something crisper at 2 KB. The
 * global grain overlay in index.css sits above this and ties it to everything
 * else, so it doesn't need its own texture.
 */

const BRANCHES = [
  { id: 't3', label: 'TIMELINE-3', x: 62, tint: 'var(--color-t3)', answered: false },
  { id: 't7', label: 'TIMELINE-7', x: 148, tint: 'var(--color-t7)', answered: false },
  { id: 'prime', label: 'YOU', x: 244, tint: '#E4E6EA', answered: true },
  { id: 't12', label: 'TIMELINE-12', x: 330, tint: 'var(--color-t12)', answered: false },
] as const;

const TRUNK_X = 196;
const FORK_Y = 150;
const CALL_Y = 400;
const END_Y = 560;

/** Stage timings in ms, from mount. Each stage is additive, never re-entered. */
const STAGES = {
  trunk: 200,
  branches: 900,
  rule: 2200,
  markers: 2900,
  /** The three unanswered branches go dark, staggered. */
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
      aria-label="Four timelines diverge at 01:38. One answered the call. The other three go dark."
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

        {BRANCHES.map((b, i) => {
          const dark = at('darken') && !b.answered;
          // Staggered so they go out one at a time rather than together.
          const stagger = b.answered ? 0 : i * 1100;

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
                  opacity: dark ? 0.1 : 1,
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
                strokeWidth={1.8}
                filter={b.answered && at('markers') ? 'url(#glow)' : undefined}
                style={{
                  opacity: at('markers') ? (dark ? 0.12 : 1) : 0,
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
                fontSize={9}
                letterSpacing={1.4}
                fill={dark ? 'var(--color-ink-faint)' : b.tint}
                style={{
                  opacity: at('branches') ? 1 : 0,
                  transition: `opacity 600ms ease-out ${stagger}ms, fill 1200ms ease-in ${stagger}ms`,
                }}
              >
                {dark ? 'NO SIGNAL' : b.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Skippable from the first frame — nobody should be held in a cutscene. */}
      <button
        onClick={dismissScreen}
        className="mt-6 font-mono text-[0.625rem] uppercase tracking-[0.18em] text-ink-faint transition-colors hover:text-ink"
      >
        {done ? 'continue' : 'skip'}
      </button>
    </div>
  );
}
