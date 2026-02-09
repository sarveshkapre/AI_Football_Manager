import { useEffect } from 'react';

const keycap = (label: string) => <kbd className="keycap">{label}</kbd>;

export const OnboardingTourModal = ({
  open,
  onClose,
  onStart
}: {
  open: boolean;
  onClose: () => void;
  onStart: () => void;
}) => {
  useEffect(() => {
    if (!open) {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome tour"
    >
      <div className="modal tour-modal">
        <header className="modal-header">
          <div>
            <p className="eyebrow">Welcome</p>
            <h3>AI Football Manager</h3>
          </div>
          <button className="btn ghost" onClick={onClose}>
            Skip
          </button>
        </header>

        <div className="modal-body">
          <div className="tour-steps">
            <div className="tour-step">
              <p className="eyebrow">1</p>
              <h4>Upload a segment</h4>
              <p className="muted">
                Start in Ingest, align minutes if needed, then let the pipeline build evidence clips.
              </p>
              <div className="tour-key">{keycap('U')}</div>
            </div>
            <div className="tour-step">
              <p className="eyebrow">2</p>
              <h4>Bench-ready guidance</h4>
              <p className="muted">
                Coach Mode surfaces “Now” and “Do next” cards. Tap into clips for proof before acting.
              </p>
              <div className="tour-key">{keycap('C')}</div>
            </div>
            <div className="tour-step">
              <p className="eyebrow">3</p>
              <h4>Build the narrative</h4>
              <p className="muted">
                Analyst Mode adds timeline tagging, minimap snapshots, and “Ask the match” evidence Q&A.
              </p>
              <div className="tour-key">{keycap('A')}</div>
            </div>
          </div>

          <div className="callout">
            <p className="muted">
              Need a reminder? Press {keycap('?')} for hotkeys and navigation.
            </p>
          </div>
        </div>

        <footer className="modal-footer">
          <button className="btn" onClick={onClose}>
            Not now
          </button>
          <button className="btn primary" onClick={onStart}>
            Start in Ingest
          </button>
        </footer>
      </div>
    </div>
  );
};

