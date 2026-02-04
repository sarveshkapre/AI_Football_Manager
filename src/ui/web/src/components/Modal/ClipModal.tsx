import { useEffect, useState } from 'react';
import { api } from '../../api/mock';
import { useClipContext } from '../../context/ClipContext';
import type { Clip } from '../../types';

export const ClipModal = () => {
  const { clip, closeClip } = useClipContext();
  const [detail, setDetail] = useState<Clip | null>(null);

  useEffect(() => {
    if (!clip) {
      setDetail(null);
      return;
    }
    api.getClipById(clip.id).then(setDetail);
  }, [clip]);

  if (!clip) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <header className="modal-header">
          <div>
            <p className="eyebrow">Evidence Clip</p>
            <h3>{detail?.title ?? clip.title}</h3>
          </div>
          <button className="btn ghost" onClick={closeClip}>
            Close
          </button>
        </header>
        <div className="modal-body">
          <div className="video-preview">
            <div className="video-frame"></div>
            <div className="video-meta">
              <span>{detail?.duration ?? clip.duration}</span>
              <span>{detail?.tags.join(' · ')}</span>
            </div>
          </div>
          <div className="overlay-panel">
            <h4>Overlays</h4>
            <div className="overlay-controls">
              {detail?.overlays.map((overlay) => (
                <label className="toggle" key={overlay.id}>
                  <input type="checkbox" defaultChecked={overlay.enabled} />
                  <span>{overlay.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <footer className="modal-footer">
          <button className="btn">Export clip</button>
          <button className="btn primary">Add to report</button>
        </footer>
      </div>
    </div>
  );
};
