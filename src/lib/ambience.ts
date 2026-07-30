/**
 * The ambience mixer.
 *
 * Two looping layers and two one-shots:
 *
 *   bed      cold room tone. Diegetic — this is his bedroom at one in the
 *            morning. Constant, and quiet enough to be felt rather than heard.
 *   tension  a dissonant drone. Score, not room. Its gain rises with the ink
 *            `pressure` counter, so the night closing in has a third channel
 *            alongside the writing and the endgame framing. No numbers.
 *
 * Clips are loudness-normalised at build time (tools/gen_ambience.py), so the
 * gains below are meaningful rather than guesses against whatever level the
 * generator happened to return.
 *
 * HTMLAudioElement rather than WebAudio: two loops and two blips do not justify
 * an AudioContext, a gain graph and the resume-on-gesture dance that comes with
 * it. Element `volume` is enough.
 */

const BED_GAIN = 0.5;
const TENSION_MAX = 0.55;
const SFX_GAIN = 0.45;

/**
 * Pressure at which tension reaches full.
 *
 * Mirrors `CONST LATE = 12` in story/endings.ink — the same threshold that
 * switches the endgame's framing to "It's twenty past one." Kept in sync by
 * hand; there are only two of them.
 */
const PRESSURE_LATE = 12;

/** How long the tension layer takes to reach a new level, ms. */
const RAMP_MS = 4000;

const MUTE_KEY = 'survivor-bias/muted/v1';

function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

class Ambience {
  private bed: HTMLAudioElement | null = null;
  private tension: HTMLAudioElement | null = null;
  private sfx = new Map<string, HTMLAudioElement>();

  private muted = loadMuted();
  private started = false;
  private targetTension = 0;
  private ramp: number | null = null;
  private lastPing = 0;

  /**
   * Arms playback on the first user gesture.
   *
   * Browsers block audio until the page has been interacted with, and this is a
   * game whose first screen is a list you have to tap. So rather than fight the
   * policy, wait for the tap that was coming anyway.
   */
  arm() {
    if (typeof window === 'undefined') return;
    const start = () => {
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
      void this.start();
    };
    window.addEventListener('pointerdown', start, { once: true });
    window.addEventListener('keydown', start, { once: true });
  }

  private async start() {
    if (this.started) return;
    this.started = true;

    this.bed = new Audio('/audio/amb_bed.mp3');
    this.bed.loop = true;
    this.bed.volume = this.muted ? 0 : BED_GAIN;

    this.tension = new Audio('/audio/amb_tension.mp3');
    this.tension.loop = true;
    this.tension.volume = 0;

    // A blocked play() is not an error worth surfacing — the game is fully
    // playable in silence.
    await Promise.allSettled([this.bed.play(), this.tension.play()]);
    this.applyTension(this.targetTension, true);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch {
      // Private mode. Muting still works for this session.
    }
    if (this.bed) this.bed.volume = muted ? 0 : BED_GAIN;
    this.applyTension(this.targetTension, true);
  }

  isMuted() {
    return this.muted;
  }

  /** Drives the tension layer from the ink pressure counter. */
  setPressure(pressure: number) {
    const t = Math.max(0, Math.min(1, pressure / PRESSURE_LATE));
    this.applyTension(t * TENSION_MAX, false);
  }

  /**
   * Ramps rather than jumps. A drone that steps up in level draws attention to
   * itself, which is the opposite of what it is for.
   */
  private applyTension(target: number, immediate: boolean) {
    this.targetTension = target;
    const el = this.tension;
    if (!el) return;

    const goal = this.muted ? 0 : target;
    if (this.ramp !== null) {
      clearInterval(this.ramp);
      this.ramp = null;
    }
    if (immediate) {
      el.volume = goal;
      return;
    }

    const steps = 40;
    const from = el.volume;
    let i = 0;
    this.ramp = window.setInterval(() => {
      i += 1;
      el.volume = Math.max(0, Math.min(1, from + (goal - from) * (i / steps)));
      if (i >= steps && this.ramp !== null) {
        clearInterval(this.ramp);
        this.ramp = null;
      }
    }, RAMP_MS / steps);
  }

  /**
   * One-shot. Cloned per play so overlapping messages don't cut each other off,
   * and silently skipped before the first gesture.
   */
  ping(kind: 'receive' | 'send') {
    if (this.muted || !this.started) return;

    // Throttle. Authored delays are 700-3000ms so blips are naturally spaced,
    // but a player echo landing immediately before a reply can double up, and
    // two notification sounds 40ms apart reads as a glitch.
    const now = performance.now();
    if (now - this.lastPing < 220) return;
    this.lastPing = now;

    const src = kind === 'receive' ? '/audio/sfx_receive.mp3' : '/audio/sfx_send.mp3';
    let template = this.sfx.get(src);
    if (!template) {
      template = new Audio(src);
      this.sfx.set(src, template);
    }
    const shot = template.cloneNode() as HTMLAudioElement;
    shot.volume = SFX_GAIN;
    void shot.play().catch(() => {});
  }
}

export const ambience = new Ambience();

// Test seam, mirroring the one in state/game.ts. The mixer holds bare Audio
// objects rather than DOM nodes, so there is otherwise no way to assert that
// levels track pressure.
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__ambience = {
    levels: () => ({
      started: ambience['started'],
      muted: ambience['muted'],
      bed: ambience['bed']?.volume ?? null,
      tension: ambience['tension']?.volume ?? null,
      target: ambience['targetTension'],
      bedPaused: ambience['bed']?.paused ?? null,
      bedLooping: ambience['bed']?.loop ?? null,
    }),
    setPressure: (p: number) => ambience.setPressure(p),
    forceStart: () => ambience['start'](),
  };
}
