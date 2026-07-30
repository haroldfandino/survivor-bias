import { create } from 'zustand';
import { StoryEngine, type Beat } from '../lib/ink';
import { CONTACTS_BY_ID } from '../lib/contacts';
import { ambience } from '../lib/ambience';
import type { Claim, Message, Sender } from '../lib/types';

const SAVE_KEY = 'survivor-bias/save/v1';

interface GameState {
  engine: StoryEngine;
  /** Per-thread transcript, so reopening a contact shows history. */
  threads: Record<string, Message[]>;
  claims: Claim[];
  /** null = contact list. */
  openThread: Sender | null;
  /** Who the app is currently showing a typing indicator for. */
  typing: Sender | null;
  choices: { index: number; text: string }[];
  /** Threads with messages the player hasn't opened since they arrived. */
  unread: Record<string, number>;
  evidenceOpen: boolean;
  /** Claim the player has armed to quote, if any. */
  armed: string | null;
  /**
   * Full-screen sequence currently taking over, if any. While this is set the
   * message queue is parked — the moment owns its own pacing.
   */
  screen: string | null;
  /** ink's pressure counter, mirrored so the ambience can track it. */
  pressure: number;
  muted: boolean;

  boot: () => void;
  openContact: (id: Sender) => void;
  closeThread: () => void;
  choose: (index: number) => void;
  arm: (claimId: string | null) => void;
  quoteArmed: (target: Sender) => void;
  toggleEvidence: () => void;
  /** Called by the overlay when its sequence is done (or skipped). */
  dismissScreen: () => void;
  toggleMute: () => void;
  reset: () => void;
}

/** Cap so a long delay authored in ink can't stall the game. */
const MAX_DELAY = 2600;

/** Guards against StrictMode's double effect invocation. */
let booted = false;

/** Resolver for the parked message queue while a full-screen sequence runs. */
let screenGate: (() => void) | null = null;

export const useGame = create<GameState>((set, get) => {
  /**
   * Playouts are strictly serialised.
   *
   * Each play() ends by publishing its choice list. Two overlapping playouts
   * therefore race, and the one that finishes last wins — which is how the
   * boot sequence (ending in a choiceless `-> DONE`) was wiping out the
   * choices of a conversation opened while it was still running. Queueing
   * makes ordering deterministic and is also correct for the week-5 case of a
   * message arriving while the player is reading another thread.
   */
  let chain: Promise<void> = Promise.resolve();
  function play(beat: Beat, thread: Sender): Promise<void> {
    chain = chain.then(() => playNow(beat, thread)).catch(() => {});
    return chain;
  }

  /**
   * Plays a beat out over time: typing indicator, then bubble, then the next.
   * Claims are filed immediately (before the messages land) so the evidence
   * drawer never lags behind what has already been said.
   */
  async function playNow(beat: Beat, thread: Sender) {
    if (beat.gained.length || beat.contested.length) {
      set((s) => {
        const byId = new Map(s.claims.map((c) => [c.id, c]));
        for (const c of beat.gained) if (!byId.has(c.id)) byId.set(c.id, c);
        for (const id of beat.contested) {
          const existing = byId.get(id);
          if (existing) byId.set(id, { ...existing, contested: true });
        }
        return { claims: [...byId.values()] };
      });
    }

    for (const msg of beat.messages) {
      // A screen beat parks the queue and hands the moment over entirely. The
      // overlay resolves the gate when it finishes or the player skips it.
      if (msg.screen) {
        await sleep(Math.min(msg.delay, MAX_DELAY));
        set({ typing: null, screen: msg.screen });
        await new Promise<void>((resolve) => {
          screenGate = resolve;
        });
        if (!msg.text) continue;
      }

      if (msg.from !== 'you' && msg.from !== 'system') {
        set({ typing: msg.from });
        await sleep(Math.min(msg.delay, MAX_DELAY));
      }
      // A blip for anything that arrives; the player's own echoes are silent
      // because `choose` already played the send sound.
      if (msg.from !== 'you') ambience.ping('receive');

      set((s) => ({
        typing: null,
        threads: {
          ...s.threads,
          [thread]: [...(s.threads[thread] ?? []), msg],
        },
        unread:
          s.openThread === thread
            ? s.unread
            : { ...s.unread, [thread]: (s.unread[thread] ?? 0) + 1 },
      }));
    }

    // Mirror ink's pressure so the tension layer tracks the night closing in.
    const pressure = get().engine.pressure();
    set({ typing: null, choices: beat.choices, pressure });
    ambience.setPressure(pressure);
    persist();
  }

  function persist() {
    const { engine, threads, claims } = get();
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({ ink: engine.save(), threads, claims }),
      );
    } catch {
      // Private-mode / quota. A save failure must never break play.
    }
  }

  return {
    engine: new StoryEngine(),
    threads: {},
    claims: [],
    openThread: null,
    typing: null,
    choices: [],
    unread: {},
    evidenceOpen: false,
    armed: null,
    screen: null,
    pressure: 0,
    muted: ambience.isMuted(),

    boot() {
      // React StrictMode mounts effects twice in dev; without this the boot
      // knot is entered (and its messages queued) two times over.
      if (booted) return;
      booted = true;
      // Audio can only start after a user gesture; arm a one-shot listener.
      ambience.arm();

      const engine = get().engine;
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          engine.load(saved.ink);
          set({ threads: saved.threads ?? {}, claims: saved.claims ?? [] });
          return;
        } catch {
          localStorage.removeItem(SAVE_KEY);
        }
      }
      void play(engine.enter('boot'), 'system');
    },

    openContact(id) {
      const contact = CONTACTS_BY_ID[id];
      if (!contact?.reachable) return;

      set((s) => ({
        openThread: id,
        unread: { ...s.unread, [id]: 0 },
        choices: [],
      }));

      const { engine, armed } = get();
      if (armed) {
        set({ armed: null });
        void play(engine.quote(armed, contact.quoteEntry), id);
      } else {
        void play(engine.enter(contact.entry), id);
      }
    },

    closeThread() {
      set({ openThread: null, choices: [], typing: null });
    },

    choose(index) {
      const { engine, openThread, choices } = get();
      if (!openThread) return;

      // Echo the player's line as a sent bubble. Choice text is authored in
      // brackets (`* [Who is this?]`) so ink deliberately withholds it from
      // output — without this the player appears to say nothing at all.
      const spoken = choices[index]?.text;
      if (spoken) ambience.ping('send');
      set((s) => ({
        choices: [],
        threads: spoken
          ? {
              ...s.threads,
              [openThread]: [
                ...(s.threads[openThread] ?? []),
                { id: `you-${Date.now()}-${index}`, from: 'you', text: spoken, delay: 0 },
              ],
            }
          : s.threads,
      }));

      void play(engine.choose(index), openThread);
    },

    arm(claimId) {
      set({ armed: claimId, evidenceOpen: false, openThread: null });
    },

    quoteArmed(target) {
      get().openContact(target);
    },

    toggleEvidence() {
      set((s) => ({ evidenceOpen: !s.evidenceOpen }));
    },

    toggleMute() {
      const next = !get().muted;
      ambience.setMuted(next);
      set({ muted: next });
    },

    dismissScreen() {
      if (!get().screen) return;
      set({ screen: null });
      const release = screenGate;
      screenGate = null;
      release?.();
    },

    reset() {
      localStorage.removeItem(SAVE_KEY);
      booted = false;
      // Release any parked queue, otherwise resetting mid-sequence leaves the
      // old playout awaiting a gate that nothing will ever resolve.
      screenGate?.();
      screenGate = null;
      set({
        engine: new StoryEngine(),
        threads: {},
        claims: [],
        openThread: null,
        typing: null,
        choices: [],
        unread: {},
        evidenceOpen: false,
        armed: null,
        screen: null,
        pressure: 0,
      });
      get().boot();
    },
  };
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Test seam. The playtest harness (and manual poking in the console) drives the
// game through the store rather than through animated clicks, so a full
// playthrough assertion doesn't have to wait out every typing delay.
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__game = useGame;
}
