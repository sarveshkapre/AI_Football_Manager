import { useMemo, useRef } from 'react';
import { useAccess } from '../context/AccessContext';
import { Modal, useModalTitleId } from './Modal/Modal';

type HotkeyItem = { label: string; keys: Array<string> };

const keycap = (label: string) => <kbd className="keycap">{label}</kbd>;

export const HotkeyHelpModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { access } = useAccess();
  const titleId = useModalTitleId();
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const navItems: HotkeyItem[] = useMemo(() => {
    const items: Array<{ allowed: boolean; label: string; keys: Array<string> }> = [
      { allowed: access.ingest, label: 'Ingest', keys: ['U'] },
      { allowed: access.coach, label: 'Coach Mode', keys: ['C'] },
      { allowed: access.analyst, label: 'Analyst Mode', keys: ['A'] },
      { allowed: access.library, label: 'Clip Library', keys: ['L'] },
      { allowed: access.reports, label: 'Reports', keys: ['R'] }
    ];
    return items.filter((item) => item.allowed).map(({ label, keys }) => ({ label, keys }));
  }, [access]);

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} className="hotkey-modal" initialFocusRef={closeRef}>
        <header className="modal-header">
          <div>
            <p className="eyebrow">Help</p>
            <h3 id={titleId}>Hotkeys</h3>
          </div>
          <button className="btn ghost" onClick={onClose} ref={closeRef}>
            Close
          </button>
        </header>

        <div className="modal-body">
          <div className="hotkey-grid">
            <section className="hotkey-section">
              <h4>Navigate</h4>
              <ul className="hotkey-list">
                {navItems.map((item) => (
                  <li key={item.label} className="hotkey-row">
                    <span>{item.label}</span>
                    <span className="hotkey-keys">{item.keys.map((k) => keycap(k))}</span>
                  </li>
                ))}
                {navItems.length === 0 ? (
                  <li className="hotkey-row">
                    <span className="muted">No routes enabled (check Settings).</span>
                    <span />
                  </li>
                ) : null}
              </ul>
            </section>

            <section className="hotkey-section">
              <h4>Library</h4>
              <ul className="hotkey-list">
                <li className="hotkey-row">
                  <span>Search clips</span>
                  <span className="hotkey-keys">{keycap('/')}</span>
                </li>
              </ul>
            </section>

            <section className="hotkey-section">
              <h4>System</h4>
              <ul className="hotkey-list">
                <li className="hotkey-row">
                  <span>Toggle this help</span>
                  <span className="hotkey-keys">{keycap('?')}</span>
                </li>
                <li className="hotkey-row">
                  <span>Close dialogs</span>
                  <span className="hotkey-keys">{keycap('Esc')}</span>
                </li>
              </ul>
            </section>
          </div>

          <div className="callout">
            <p className="muted">
              Tip: Coach Mode is designed for under-5-second reads. Use evidence clips to validate every
              recommendation.
            </p>
          </div>
        </div>

        <footer className="modal-footer">
          <div className="muted">Press {keycap('?')} any time.</div>
          <button className="btn primary" onClick={onClose}>
            Got it
          </button>
        </footer>
    </Modal>
  );
};
