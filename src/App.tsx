import { useEffect } from 'react';
import { useGame } from './state/game';
import { ContactList } from './components/ContactList';
import { ChatView } from './components/ChatView';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import { Convergence } from './components/Convergence';

/**
 * The device frame.
 *
 * The app is presented inside a fixed portrait shell so the fiction holds on a
 * desktop monitor — on a phone it fills the screen and the frame disappears.
 */
export default function App() {
  const { boot, openThread, claims, toggleEvidence, evidenceOpen, screen } = useGame();

  useEffect(() => {
    // Deliberately once, on mount. boot() no-ops onto a save if one exists.
    boot();
  }, [boot]);

  const contested = claims.filter((c) => c.contested).length;

  return (
    <div className="mediated grid h-full place-items-center bg-black p-0 sm:p-6">
      <div
        className="relative flex h-full w-full flex-col overflow-hidden bg-bg sm:h-[min(844px,92vh)] sm:w-[min(420px,96vw)] sm:rounded-[2.25rem]"
        style={{ boxShadow: '0 0 0 1px #22272f, 0 40px 120px -20px #000' }}
      >
        <main className="relative flex-1 overflow-hidden">
          {openThread ? <ChatView id={openThread} /> : <ContactList />}
          <EvidenceDrawer />
          {screen === 'convergence' && <Convergence />}
        </main>

        {/* Evidence is always one tap away — the loop depends on the player
            being able to check a claim mid-conversation. Hidden during a
            full-screen sequence: the moment takes the whole frame. */}
        {!evidenceOpen && !screen && (
          <button
            onClick={toggleEvidence}
            className="flex items-center justify-between border-t border-hairline bg-raised px-4 py-3 text-left transition-colors hover:bg-input"
          >
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-dim">
              evidence
            </span>
            <span className="flex items-center gap-2">
              {contested > 0 && (
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-accent">
                  {contested} contested
                </span>
              )}
              <span className="font-mono text-[0.625rem] text-ink-faint">
                {claims.length}
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
