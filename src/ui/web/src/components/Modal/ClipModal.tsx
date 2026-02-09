import { useEffect, useRef, useState } from 'react';
import { api } from '../../api/mock';
import { useAudit } from '../../context/AuditContext';
import { useClipContext } from '../../context/ClipContext';
import { useLabels } from '../../context/LabelsContext';
import { useAnnotations } from '../../context/AnnotationsContext';
import { useReportContext } from '../../context/ReportContext';
import type { Clip } from '../../types';
import { downloadFile } from '../../utils/export';
import { Modal, useModalTitleId } from './Modal';

export const ClipModal = () => {
  const { clip, closeClip } = useClipContext();
  const { addClip } = useReportContext();
  const { logEvent } = useAudit();
  const { labels, addLabel, removeLabel } = useLabels();
  const { annotations, setAnnotation } = useAnnotations();
  const [detail, setDetail] = useState<Clip | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const titleId = useModalTitleId();
  const closeRef = useRef<HTMLButtonElement | null>(null);

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
  const clipLabels = labels[clipDetail.id] ?? [];
  const clipAnnotation = annotations[clipDetail.id] ?? '';
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

  const handleAddLabel = () => {
    const label = newLabel.trim();
    if (!label) {
      return;
    }
    addLabel(clipDetail.id, label);
    setNewLabel('');
    logEvent('Label added', `${clipDetail.title} · ${label}`);
  };

  return (
    <Modal open={Boolean(clip)} onClose={closeClip} labelledBy={titleId} initialFocusRef={closeRef}>
        <header className="modal-header">
          <div>
            <p className="eyebrow">Evidence Clip</p>
            <h3 id={titleId}>{clipDetail.title}</h3>
          </div>
          <button className="btn ghost" onClick={closeClip} ref={closeRef}>
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
            <div className="clip-notes">
              <h4>Annotations</h4>
              <textarea
                rows={4}
                value={clipAnnotation}
                onChange={(event) => setAnnotation(clipDetail.id, event.target.value)}
                placeholder="Add a coaching note tied to this clip."
              />
            </div>
            <div className="clip-labels">
              <h4>Labels</h4>
              <div className="chip-row">
                {clipLabels.length === 0 ? (
                  <span className="muted">No labels yet.</span>
                ) : (
                  clipLabels.map((label) => (
                    <button
                      key={label}
                      className="tag-chip"
                      onClick={() => removeLabel(clipDetail.id, label)}
                    >
                      {label}
                    </button>
                  ))
                )}
              </div>
              <div className="label-form">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(event) => setNewLabel(event.target.value)}
                  placeholder="Add label"
                />
                <button className="btn" onClick={handleAddLabel} disabled={!newLabel.trim()}>
                  Add
                </button>
              </div>
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
    </Modal>
  );
};
