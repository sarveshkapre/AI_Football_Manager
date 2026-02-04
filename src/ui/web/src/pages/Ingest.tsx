import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/mock';
import { SectionHeader } from '../components/SectionHeader';
import { SignalBadge } from '../components/SignalBadge';
import { useAudit } from '../context/AuditContext';
import type { AlignmentState, PipelineStep, Segment, UploadJob } from '../types';

const statusClassMap: Record<string, string> = {
  Ready: 'pill-ready',
  Processing: 'pill-warn',
  Uploading: 'pill-muted',
  Failed: 'pill-danger',
  Queued: 'pill-muted',
  Analyzing: 'pill-warn',
  Complete: 'pill-ready',
  'In progress': 'pill-warn'
};

export const Ingest = () => {
  const { logEvent } = useAudit();
  const [uploads, setUploads] = useState<UploadJob[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStep[]>([]);
  const [alignment, setAlignment] = useState<AlignmentState | null>(null);

  const [segmentLabel, setSegmentLabel] = useState('Final phase');
  const [segmentStart, setSegmentStart] = useState('63:00');
  const [segmentEnd, setSegmentEnd] = useState('80:00');
  const [manualOffset, setManualOffset] = useState('+00:12');

  useEffect(() => {
    const load = async () => {
      const [uploadData, segmentData, pipelineData, alignmentData] = await Promise.all([
        api.getUploads(),
        api.getSegments(),
        api.getPipeline(),
        api.getAlignment()
      ]);
      setUploads(uploadData);
      setSegments(segmentData);
      setPipeline(pipelineData);
      setAlignment(alignmentData);
      setManualOffset(alignmentData.offset);
    };

    load();
  }, []);

  const uploadSummary = useMemo(() => {
    const ready = uploads.filter((item) => item.status === 'Ready').length;
    const processing = uploads.filter((item) => item.status !== 'Ready').length;
    return `${ready} ready · ${processing} active`;
  }, [uploads]);

  const addSegment = () => {
    if (!segmentLabel.trim()) {
      return;
    }
    const next: Segment = {
      id: `seg-${Date.now()}`,
      label: segmentLabel.trim(),
      start: segmentStart.trim(),
      end: segmentEnd.trim(),
      status: 'Queued',
      signal: 'Med'
    };
    setSegments((prev) => [next, ...prev]);
    logEvent('Segment queued', `${next.label} ${next.start}-${next.end}`);
  };

  const applyAlignment = () => {
    if (!alignment) {
      return;
    }
    const next = { ...alignment, method: 'Manual', offset: manualOffset };
    setAlignment(next);
    logEvent('Alignment updated', `${next.offset} (${next.method})`);
  };

  const handleUpload = () => {
    const id = `upload-${Date.now()}`;
    const next: UploadJob = {
      id,
      filename: 'New-broadcast-upload.mp4',
      status: 'Uploading',
      progress: 12,
      duration: '20:00',
      size: '950 MB',
      uploadedAt: 'Just now'
    };
    setUploads((prev) => [next, ...prev]);
    logEvent('Upload started', next.filename);

    setTimeout(() => {
      setUploads((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: 'Processing', progress: 55, uploadedAt: '1 min ago' }
            : item
        )
      );
    }, 1200);

    setTimeout(() => {
      setUploads((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: 'Ready', progress: 100, uploadedAt: '2 min ago' }
            : item
        )
      );
      logEvent('Upload ready', next.filename);
    }, 2400);
  };

  return (
    <div className="page-content">
      <SectionHeader
        title="Ingest"
        subtitle="Upload broadcast video and align match time."
        action={
          <button className="btn primary" onClick={handleUpload}>
            Upload segment
          </button>
        }
      />

      <div className="grid two">
        <div className="card surface">
          <SectionHeader title="Upload queue" subtitle={uploadSummary} />
          <div className="upload-drop">
            <div>
              <h4>Drop broadcast files</h4>
              <p>MP4/MOV up to 3 GB. Tactical cam preferred when available.</p>
            </div>
            <button className="btn" onClick={handleUpload}>
              Choose file
            </button>
          </div>
          <div className="upload-list">
            {uploads.map((item) => (
              <div className="upload-row" key={item.id}>
                <div>
                  <h4>{item.filename}</h4>
                  <p>
                    {item.duration} · {item.size} · {item.uploadedAt}
                  </p>
                </div>
                <div className="upload-status">
                  <span className={`pill ${statusClassMap[item.status] ?? ''}`}>
                    {item.status}
                  </span>
                  <div className="progress">
                    <div className="progress-fill" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card surface">
          <SectionHeader title="Match alignment" subtitle="Scoreboard OCR + manual override." />
          {alignment ? (
            <div className="alignment">
              <div className="alignment-meta">
                <div>
                  <p className="eyebrow">OCR reliability</p>
                  <h3>{alignment.method}</h3>
                  <p className="muted">{alignment.note}</p>
                </div>
                <SignalBadge signal={alignment.confidence} />
              </div>
              <div className="alignment-row">
                <label className="field">
                  <span>Offset (mm:ss)</span>
                  <input
                    value={manualOffset}
                    onChange={(event) => setManualOffset(event.target.value)}
                  />
                </label>
                <button className="btn" onClick={applyAlignment}>
                  Apply offset
                </button>
              </div>
              <div className="alignment-row">
                <div>
                  <p className="eyebrow">Aligned to match clock</p>
                  <h4>{alignment.offset}</h4>
                </div>
                <span className="pill">Confidence {alignment.confidence}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid two">
        <div className="card surface">
          <SectionHeader title="Segment builder" subtitle="Define 15–20 minute windows." />
          <div className="segment-form">
            <label className="field">
              <span>Segment label</span>
              <input
                value={segmentLabel}
                onChange={(event) => setSegmentLabel(event.target.value)}
              />
            </label>
            <div className="segment-row">
              <label className="field">
                <span>Start</span>
                <input
                  value={segmentStart}
                  onChange={(event) => setSegmentStart(event.target.value)}
                />
              </label>
              <label className="field">
                <span>End</span>
                <input value={segmentEnd} onChange={(event) => setSegmentEnd(event.target.value)} />
              </label>
              <button className="btn primary" onClick={addSegment}>
                Add segment
              </button>
            </div>
          </div>
          <div className="segment-list">
            {segments.map((segment) => (
              <div className="segment-item" key={segment.id}>
                <div>
                  <h4>{segment.label}</h4>
                  <p>
                    {segment.start} → {segment.end}
                  </p>
                </div>
                <div className="segment-meta">
                  <SignalBadge signal={segment.signal} />
                  <span className={`pill ${statusClassMap[segment.status] ?? ''}`}>
                    {segment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card surface">
          <SectionHeader title="Processing pipeline" subtitle="Evidence generation status." />
          <div className="pipeline-list">
            {pipeline.map((step) => (
              <div className="pipeline-step" key={step.id}>
                <div>
                  <h4>{step.label}</h4>
                  <p>{step.detail}</p>
                </div>
                <span className={`pill ${statusClassMap[step.status] ?? ''}`}>{step.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
