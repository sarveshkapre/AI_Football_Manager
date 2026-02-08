import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/mock';
import { SectionHeader } from '../components/SectionHeader';
import { SignalBadge } from '../components/SignalBadge';
import { useAudit } from '../context/AuditContext';
import { usePreferences } from '../context/PreferencesContext';
import type { AlignmentState, PipelineStep, Segment, UploadJob } from '../types';
import { saveToStorage } from '../utils/storage';
import { clockToSeconds } from '../utils/time';

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
  const { ingestSimulation, setIngestSimulation } = usePreferences();
  const [uploads, setUploads] = useState<UploadJob[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStep[]>([]);
  const [alignment, setAlignment] = useState<AlignmentState | null>(null);

  const [segmentLabel, setSegmentLabel] = useState('Final phase');
  const [segmentStart, setSegmentStart] = useState('63:00');
  const [segmentEnd, setSegmentEnd] = useState('80:00');
  const [manualOffset, setManualOffset] = useState('+00:12');
  const [autoGenerateReports, setAutoGenerateReports] = useState(true);
  const [segmentError, setSegmentError] = useState<string | null>(null);
  const [alignmentError, setAlignmentError] = useState<string | null>(null);
  const autoGenerateRef = useRef(autoGenerateReports);
  const segmentsRef = useRef<Segment[]>([]);
  const uploadTimersRef = useRef<number[]>([]);

  useEffect(() => {
    autoGenerateRef.current = autoGenerateReports;
  }, [autoGenerateReports]);

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  useEffect(() => {
    return () => {
      uploadTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, []);

  const normalizeOffset = (value: string) => {
    const trimmed = value.trim();
    const match = trimmed.match(/^([+-])(\d{2}):(\d{2})$/);
    if (!match) {
      return null;
    }
    const seconds = Number(match[3]);
    if (Number.isNaN(seconds) || seconds >= 60) {
      return null;
    }
    return `${match[1]}${match[2]}:${match[3]}`;
  };

  const validateSegmentWindow = (start: string, end: string) => {
    const startSeconds = clockToSeconds(start);
    const endSeconds = clockToSeconds(end);
    if (startSeconds === null || endSeconds === null) {
      return 'Use mm:ss or hh:mm:ss format for start and end.';
    }
    if (endSeconds <= startSeconds) {
      return 'End time must be after start time.';
    }
    return null;
  };

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
    const label = segmentLabel.trim();
    if (!label) {
      setSegmentError('Add a segment label before queuing.');
      return;
    }
    const validationError = validateSegmentWindow(segmentStart, segmentEnd);
    if (validationError) {
      setSegmentError(validationError);
      return;
    }
    const next: Segment = {
      id: `seg-${Date.now()}`,
      label,
      start: segmentStart.trim(),
      end: segmentEnd.trim(),
      status: 'Queued',
      signal: 'Med'
    };
    setSegments((prev) => [next, ...prev]);
    setSegmentError(null);
    logEvent('Segment queued', `${next.label} ${next.start}-${next.end}`);
  };

  const applyAlignment = () => {
    if (!alignment) {
      return;
    }
    const normalizedOffset = normalizeOffset(manualOffset);
    if (!normalizedOffset) {
      setAlignmentError('Offset must use +mm:ss or -mm:ss.');
      return;
    }
    const next = { ...alignment, method: 'Manual', offset: normalizedOffset };
    setAlignment(next);
    setManualOffset(normalizedOffset);
    setAlignmentError(null);
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

    const processingTimer = window.setTimeout(() => {
      setUploads((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: 'Processing', progress: 55, uploadedAt: '1 min ago' }
            : item
        )
      );
    }, 1200);
    uploadTimersRef.current.push(processingTimer);

    const readyTimer = window.setTimeout(() => {
      setUploads((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: 'Ready', progress: 100, uploadedAt: '2 min ago' }
            : item
        )
      );
      logEvent('Upload ready', next.filename);
      if (autoGenerateRef.current) {
        const currentSegments = segmentsRef.current;
        const readySegment =
          currentSegments.find((segment) => segment.status === 'Ready') ?? currentSegments[0];
        if (readySegment) {
          saveToStorage('afm.lastSegment', readySegment.id);
        }
        window.location.hash = '#reports';
      }
    }, 2400);
    uploadTimersRef.current.push(readyTimer);
  };

  return (
    <div className="page-content">
      <SectionHeader
        title="Ingest"
        subtitle="Upload broadcast video and align match time."
        action={
          <div className="header-actions">
            <label className="toggle">
              <input
                type="checkbox"
                checked={ingestSimulation}
                onChange={(event) => setIngestSimulation(event.target.checked)}
              />
              <span>{ingestSimulation ? 'Simulating' : 'Live feed'}</span>
            </label>
            <button className="btn primary" onClick={handleUpload}>
              Upload segment
            </button>
          </div>
        }
      />

      <div className="grid two">
        <div className="card surface">
          <SectionHeader title="Upload queue" subtitle={uploadSummary} />
          <div className="row-card">
            <div>
              <h4>Auto-generate segment report</h4>
              <p>Open Reports as soon as a segment becomes ready.</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={autoGenerateReports}
                onChange={(event) => setAutoGenerateReports(event.target.checked)}
              />
              <span>{autoGenerateReports ? 'On' : 'Off'}</span>
            </label>
          </div>
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
                    onChange={(event) => {
                      setManualOffset(event.target.value);
                      setAlignmentError(null);
                    }}
                  />
                </label>
                <button className="btn" onClick={applyAlignment}>
                  Apply offset
                </button>
              </div>
              {alignmentError ? <p className="form-error">{alignmentError}</p> : null}
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
                onChange={(event) => {
                  setSegmentLabel(event.target.value);
                  setSegmentError(null);
                }}
              />
            </label>
            <div className="segment-row">
              <label className="field">
                <span>Start</span>
                <input
                  value={segmentStart}
                  onChange={(event) => {
                    setSegmentStart(event.target.value);
                    setSegmentError(null);
                  }}
                />
              </label>
              <label className="field">
                <span>End</span>
                <input
                  value={segmentEnd}
                  onChange={(event) => {
                    setSegmentEnd(event.target.value);
                    setSegmentError(null);
                  }}
                />
              </label>
              <button className="btn primary" onClick={addSegment}>
                Add segment
              </button>
            </div>
            {segmentError ? <p className="form-error">{segmentError}</p> : null}
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
                  <button
                    className="btn ghost"
                    onClick={() => {
                      saveToStorage('afm.lastSegment', segment.id);
                      logEvent('Segment report opened', segment.label);
                      window.location.hash = '#reports';
                    }}
                    disabled={segment.status !== 'Ready'}
                  >
                    Generate report
                  </button>
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
