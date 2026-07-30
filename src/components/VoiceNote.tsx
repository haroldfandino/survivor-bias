import { useEffect, useRef, useState } from 'react';
import voices from '../voices.json';

/**
 * A playable voice note.
 *
 * The waveform is the REAL peak envelope of the file, generated alongside the
 * audio by tools/gen_voice.py and read from src/voices.json. A fake
 * waveform on a real recording is the kind of detail that quietly tells players
 * nothing here is trustworthy.
 *
 * All the selves share one kokoro voice (bm_lewis) and differ only by ffmpeg
 * treatment, because it is the same man — see tools/gen_voice.py for why that
 * beat cloning, and design/style-lock.md for how it fits the rest.
 */

interface VoiceMeta {
  branch: string;
  duration: number;
  peaks: number[];
  text: string;
}

const MANIFEST = voices as unknown as Record<string, VoiceMeta>;

/** Fallback silhouette if a note plays before its asset has been generated. */
const PLACEHOLDER = [
  20, 42, 30, 64, 48, 82, 55, 38, 70, 90, 62, 44, 76, 34, 52, 28, 60, 40, 24, 46,
  32, 68, 50, 36,
];

function formatTime(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  return `0:${String(s).padStart(2, '0')}`;
}

export function VoiceNote({ id, tint }: { id: string; tint: string }) {
  const meta = MANIFEST[id];
  const peaks = meta?.peaks ?? PLACEHOLDER;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [missing, setMissing] = useState(false);

  const duration = meta?.duration ?? 0;
  const progress = duration > 0 ? Math.min(1, elapsed / duration) : 0;

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setElapsed(el.currentTime);
    const onEnd = () => {
      setPlaying(false);
      setElapsed(0);
    };
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('ended', onEnd);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('ended', onEnd);
    };
  }, []);

  async function toggle() {
    const el = audioRef.current;
    if (!el || missing) return;
    if (playing) {
      el.pause();
      setPlaying(false);
      return;
    }
    try {
      await el.play();
      setPlaying(true);
    } catch {
      // Autoplay policy or a missing file. Never throw at the player.
      setMissing(true);
    }
  }

  return (
    <div className="flex items-center gap-2 py-0.5">
      <audio ref={audioRef} src={`/audio/${id}.mp3`} preload="metadata" onError={() => setMissing(true)} />

      <button
        onClick={toggle}
        aria-label={playing ? 'Pause voice note' : 'Play voice note'}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full transition-opacity hover:opacity-80 disabled:opacity-40"
        style={{ background: `${tint}22`, color: tint }}
        disabled={missing}
      >
        {playing ? (
          <svg width="9" height="11" viewBox="0 0 9 11" fill="currentColor">
            <rect x="0" y="0" width="3" height="11" rx="1" />
            <rect x="6" y="0" width="3" height="11" rx="1" />
          </svg>
        ) : (
          <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
            <path d="M0 0l10 6-10 6z" />
          </svg>
        )}
      </button>

      {/* Bars fill left-to-right as it plays — the only progress indicator. */}
      <div className="flex h-6 flex-1 items-center gap-[2px]">
        {peaks.map((h, i) => {
          const played = i / peaks.length < progress;
          return (
            <span
              key={i}
              className="w-[2px] rounded-full transition-colors"
              style={{
                height: `${h}%`,
                background: played ? tint : `${tint}55`,
                opacity: played ? 0.95 : 1,
              }}
            />
          );
        })}
      </div>

      <span className="shrink-0 font-mono text-[0.625rem] text-ink-faint">
        {missing ? '--:--' : formatTime(playing || elapsed > 0 ? duration - elapsed : duration)}
      </span>
    </div>
  );
}
