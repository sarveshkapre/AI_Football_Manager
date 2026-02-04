import { useEffect, useState } from 'react';
import { api } from '../../api/mock';
import { useAudit } from '../../context/AuditContext';
import { useClipContext } from '../../context/ClipContext';
import { useReportContext } from '../../context/ReportContext';
import type { Clip } from '../../types';
import { downloadFile } from '../../utils/export';

export const ClipModal = () => {
  const { clip, closeClip } = useClipContext();
  const { addClip } = useReportContext();
  const { logEvent } = useAudit();
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

  const clipDetail = detail ?? clip;
  const handleAdd = () => {
    addClip(clipDetail);
    logEvent('Clip queued', clipDetail.title);
  };

  const handleExport = () => {
    const payload = {
      id: clipDetail.id,
      title: clipDetail.title,
      duration: clipDetail.duration,
      tags: clipDetail.tags,
      overlays: clipDetail.overlays
    };
    downloadFile(`clip-${clipDetail.id}.json`, JSON.stringify(payload, null, 2), 'application/json');
    logEvent('Clip exported', clipDetail.title);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <header className="modal-header">
          <div>
            <p className="eyebrow">Evidence Clip</p>
            <h3>{clipDetail.title}</h3>
          </div>
          <button className="btn ghost" onClick={closeClip}>
            Close
          </button>
        </header>
        <div className="modal-body">
          <div className="video-preview">
            <div className="video-frame"></div>
            <div className="video-meta">
              <span>{clipDetail.duration}</span>
              <span>{clipDetail.tags.join(' · ')}</span>
            </div>
          </div>
          <div className="overlay-panel">
            <h4>Overlays</h4>
            <div className="overlay-controls">
              {clipDetail.overlays.map((overlay) => (
                <label className="toggle" key={overlay.id}>
                  <input type="checkbox" defaultChecked={overlay.enabled} />
                  <span>{overlay.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <footer className="modal-footer">
          <button className="btn" onClick={handleAdd}>
            Add to report
          </button>
          <button className="btn primary" onClick={handleExport}>
            Export clip
          </button>
        </footer>
      </div>
    </div>
  );
};
