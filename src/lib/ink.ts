import { Story } from 'inkjs';
import storyJson from '../story.json';
import type { Claim, Message, Sender } from './types';

/**
 * The ink bridge.
 *
 * Tags are the ONLY contract between the writing and the UI, so all tag
 * parsing lives here and nowhere else. Writers touch story/*.ink; this file
 * translates. Supported tags (all must be INLINE on the text line):
 *
 *   from: t3                    sender; absent => the player
 *   delay: 900                  ms of typing indicator before the bubble lands
 *   voice: <id>                 render as a voice note
 *   img: <path>                 photo attachment, relative to assets/
 *   screen: convergence         hand the beat to a full-screen sequence
 *   gain: <id> :: <text> :: <who>   file a claim (side-effect, not a bubble)
 *   contest: <id>               mark a claim contested (side-effect)
 */

export interface Beat {
  messages: Message[];
  gained: Claim[];
  contested: string[];
  choices: { index: number; text: string }[];
  /** true when the conversation has ended and we return to the contact list. */
  ended: boolean;
}

const DEFAULT_DELAY = 800;

function parseTags(tags: string[]) {
  const out: {
    from?: Sender;
    delay?: number;
    voice?: string;
    img?: string;
    screen?: string;
    gains: Claim[];
    contests: string[];
  } = { gains: [], contests: [] };

  for (const raw of tags) {
    const idx = raw.indexOf(':');
    if (idx === -1) continue;
    const key = raw.slice(0, idx).trim();
    const value = raw.slice(idx + 1).trim();

    switch (key) {
      case 'from':
        out.from = value as Sender;
        break;
      case 'delay': {
        const n = Number(value);
        if (Number.isFinite(n)) out.delay = n;
        break;
      }
      case 'voice':
        out.voice = value;
        break;
      case 'img':
        out.img = value;
        break;
      case 'screen':
        out.screen = value;
        break;
      case 'gain': {
        const [id, text, who] = value.split('::').map((s) => s.trim());
        if (id && text) {
          out.gains.push({
            id,
            text,
            source: (who || 'system') as Sender,
            contested: false,
          });
        }
        break;
      }
      case 'contest':
        if (value) out.contests.push(value);
        break;
      default:
        break;
    }
  }
  return out;
}

let seq = 0;
const nextId = () => `m${++seq}`;

export class StoryEngine {
  private story: Story;

  constructor() {
    // inkjs accepts the compiled JSON object directly.
    this.story = new Story(storyJson as unknown as string);
  }

  /**
   * Runs the story forward until it needs input, collecting everything emitted.
   *
   * Note that `gain:`/`contest:` tags routinely land on a line with no text
   * (ink emits the function's tag on its own beat). Those are collected as
   * side-effects and never become bubbles — which is why gained/contested are
   * separate from messages rather than attached to one.
   */
  advance(): Beat {
    const messages: Message[] = [];
    const gained: Claim[] = [];
    const contested: string[] = [];

    while (this.story.canContinue) {
      const text = this.story.Continue()?.trim() ?? '';
      const t = parseTags(this.story.currentTags ?? []);

      gained.push(...t.gains);
      contested.push(...t.contests);

      // A `screen:` beat is authored as a bare gather with tags only, so it has
      // no text. It still has to survive as a positioned entry in the sequence,
      // because the screen must fire between the lines it sits between — hence a
      // control message with empty text, which the renderer skips.
      if (!text && !t.screen) continue;

      messages.push({
        id: nextId(),
        from: t.from ?? 'you',
        text,
        delay: t.delay ?? DEFAULT_DELAY,
        voice: t.voice,
        img: t.img,
        screen: t.screen,
      });
    }

    const choices = this.story.currentChoices.map((c, index) => ({
      index,
      text: c.text,
    }));

    return { messages, gained, contested, choices, ended: choices.length === 0 };
  }

  /** Jump into a conversation knot. */
  enter(knot: string): Beat {
    this.story.ChoosePathString(knot);
    return this.advance();
  }

  choose(index: number): Beat {
    this.story.ChooseChoiceIndex(index);
    return this.advance();
  }

  /** Set the `quoting` ink variable, then run the target's quote handler. */
  quote(claimId: string, quoteEntry: string): Beat {
    this.story.variablesState['quoting'] = claimId;
    return this.enter(quoteEntry);
  }

  /** Whether a knot exists — used to fail loudly on a typo'd contact entry. */
  hasKnot(knot: string): boolean {
    try {
      return this.story.KnotContainerWithName(knot) != null;
    } catch {
      return false;
    }
  }

  /**
   * The ink `pressure` counter — how many substantive things the player has
   * done. Drives the ambience tension layer, so the night closing in is audible
   * as well as written. See endings.ink → tick().
   */
  pressure(): number {
    const v = this.story.variablesState['pressure'];
    return typeof v === 'number' ? v : 0;
  }

  save(): string {
    return this.story.state.ToJson();
  }

  load(json: string) {
    this.story.state.LoadJson(json);
  }
}
