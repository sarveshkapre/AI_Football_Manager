import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/mock';
import { AuditLog } from '../components/AuditLog';
import { EngagementStream } from '../components/EngagementStream';
import { EngagementWidget } from '../components/EngagementWidget';
import { ReportQueue } from '../components/ReportQueue';
import { SectionHeader } from '../components/SectionHeader';
import { Modal, useModalTitleId } from '../components/Modal/Modal';
import { useAudit } from '../context/AuditContext';
import { useReportContext } from '../context/ReportContext';
import type { Clip, Recommendation, ReportItem, Segment, TimelineEvent } from '../types';
import { useAnnotations } from '../context/AnnotationsContext';
import { useLabels } from '../context/LabelsContext';
import { useTelestration, type TelestrationMap } from '../context/TelestrationContext';
import {
  buildEvidencePackage,
  buildPresentationHtml,
  downloadFile,
  openHtmlPreview
} from '../utils/export';
import { importReportPackFromFile, PackImportError } from '../utils/import';
import {
  isNullableString,
  isReportsImportUndoSnapshot,
  isReportsLastImportMeta
} from '../utils/guards';
import { buildSegmentReport, type SegmentReport } from '../utils/reports';
import { durationToSeconds, formatDuration } from '../utils/time';
import { loadFromStorageWithGuard, saveToStorage } from '../utils/storage';
import {
  computePackDiff,
  mergeLabels,
  type PackDiff,
  type PackImportDecision,
  type PackOverlapLabelsPolicy,
  type PackOverlapNotePolicy
} from '../utils/packDiff';
import type { ImportedReportPack } from '../utils/import';

type LastImportMeta = {
  title: string;
  notes: string;
  match: string;
  owner: string;
  source: 'json' | 'zip';
  clipCount: number;
  importedAt: string;
};

const lastImportKey = 'afm.reports.lastImport.v1';
const importUndoKey = 'afm.reports.importUndo.v1';

const defaultImportDecision: PackImportDecision = {
  strategy: 'replace',
  overlapLabels: 'merge',
  overlapAnnotations: 'keep',
  overlapTelestration: 'keep'
};

type ImportUndoSnapshot = {
  createdAt: string;
  pack: {
    title: string;
    match: string;
    owner: string;
    source: 'json' | 'zip';
    clipCount: number;
  };
  affectedClipIds: string[];
  postImportQueueIds?: string[];
  previousQueue: Clip[];
  previousLabels: Record<string, string[]>;
  previousAnnotations: Record<string, string>;
  previousTelestration: TelestrationMap;
  previousLastImportMeta: LastImportMeta | null;
};

export const Reports = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const [segmentReport, setSegmentReport] = useState<SegmentReport | null>(null);
  const { queue, setQueue, enqueueClips } = useReportContext();
  const { logEvent } = useAudit();
  const { annotations, replaceAnnotationsForClips } = useAnnotations();
  const { labels, replaceLabelsForClips } = useLabels();
  const { strokesByClip, replaceStrokesForClips } = useTelestration();
  const [importStatus, setImportStatus] = useState<string>('');
  const [importBusy, setImportBusy] = useState(false);
  const [pendingImport, setPendingImport] = useState<{
    pack: ImportedReportPack;
    diff: PackDiff;
    decision: PackImportDecision;
  } | null>(null);
  const importTitleId = useModalTitleId();
  const applyImportRef = useRef<HTMLButtonElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [lastImportMeta, setLastImportMeta] = useState<LastImportMeta | null>(() =>
    loadFromStorageWithGuard(lastImportKey, null, isReportsLastImportMeta)
  );
  const [importUndo, setImportUndo] = useState<ImportUndoSnapshot | null>(() =>
    loadFromStorageWithGuard(importUndoKey, null, isReportsImportUndoSnapshot)
  );

  useEffect(() => {
    api.getReports().then(setReports);
  }, []);

  useEffect(() => {
    const load = async () => {
      const [segmentData, timelineData, clipData, recs] = await Promise.all([
        api.getSegments(),
        api.getTimeline(),
        api.getClips(),
        api.getRecommendations()
      ]);
      setSegments(segmentData);
      setTimeline(timelineData);
      setClips(clipData);
      setRecommendations(recs);
      const storedSegment = loadFromStorageWithGuard('afm.lastSegment', null, isNullableString);
      if (storedSegment && segmentData.some((segment) => segment.id === storedSegment)) {
        setSelectedSegmentId(storedSegment);
        saveToStorage('afm.lastSegment', null);
      } else if (segmentData.length > 0) {
        setSelectedSegmentId(segmentData[0].id);
      }
    };

    load();
  }, []);

  const segmentOptions = useMemo(
    () =>
      segments.map((segment) => ({
        id: segment.id,
        label: `${segment.label} (${segment.start}–${segment.end})`
      })),
    [segments]
  );

  const totalDuration = useMemo(() => {
    const seconds = queue.reduce((sum, clip) => sum + durationToSeconds(clip.duration), 0);
    return formatDuration(seconds);
  }, [queue]);

  const generateSegmentReport = () => {
    const segment = segments.find((item) => item.id === selectedSegmentId);
    if (!segment) {
      return;
    }
    const report = buildSegmentReport({
      segment,
      timeline,
      recommendations,
      queue,
      clips,
      generatedAt: new Date().toLocaleString()
    });

    setSegmentReport(report);
    logEvent('Segment report generated', segment.label);
  };

  const downloadSegmentReport = () => {
    if (!segmentReport) {
      return;
    }
    downloadFile(
      'segment-report.json',
      JSON.stringify(segmentReport, null, 2),
      'application/json'
    );
    logEvent('Segment report exported', segmentReport.title);
  };

  const copySummary = async () => {
    if (!segmentReport) {
      return;
    }
    try {
      await navigator.clipboard.writeText(segmentReport.summary);
      logEvent('Segment summary copied', segmentReport.title);
    } catch {
      logEvent('Segment summary generated', segmentReport.title);
    }
  };

  const exportAnalystData = () => {
    const queueIds = queue.map((clip) => clip.id);
    const payload = {
      generatedAt: new Date().toISOString(),
      clipCount: queue.length,
      totalDuration,
      clips: queue,
      labels: Object.fromEntries(
        Object.entries(labels).filter(([clipId]) => queueIds.includes(clipId))
      ),
      annotations: Object.fromEntries(
        Object.entries(annotations).filter(([clipId]) => queueIds.includes(clipId))
      )
    };
    downloadFile('afm-analyst-data.json', JSON.stringify(payload, null, 2), 'application/json');
    logEvent('Analyst data exported', `${queue.length} clips`);
  };

  const exportEvidencePackage = () => {
    const queueIds = queue.map((clip) => clip.id);
    const manifest = queue.map((clip) => ({
      id: clip.id,
      title: clip.title,
      duration: clip.duration,
      tags: clip.tags,
      overlays: clip.overlays,
      labels: labels[clip.id] ?? [],
      annotation: annotations[clip.id],
      telestration: strokesByClip[clip.id] ?? []
    }));

    const metadata = {
      clipCount: queue.length,
      totalDuration,
      segment: segmentReport?.title ?? 'Unassigned',
      owner: 'Analyst room',
      labels: Object.fromEntries(
        Object.entries(labels).filter(([clipId]) => queueIds.includes(clipId))
      ),
      annotations: Object.fromEntries(
        Object.entries(annotations).filter(([clipId]) => queueIds.includes(clipId))
      )
    };

    const payload = buildEvidencePackage(metadata, manifest);
    downloadFile('afm-evidence-pack.json', payload, 'application/json');
    logEvent('Evidence pack exported', `${queue.length} clips`);
  };

  const renderBroadcastPack = () => {
    const queueIds = queue.map((clip) => clip.id);
    const telestration = Object.fromEntries(
      Object.entries(strokesByClip).filter(([clipId]) => queueIds.includes(clipId))
    );
    const html = buildPresentationHtml({
      title: 'Broadcast pack',
      match: segmentReport?.title ?? 'Matchday segment',
      owner: 'Analyst room',
      summary: segmentReport?.summary ?? 'Broadcast-ready evidence reel.',
      totalDuration,
      clipCount: queue.length,
      clips: queue,
      labels: Object.fromEntries(
        Object.entries(labels).filter(([clipId]) => queueIds.includes(clipId))
      ),
      annotations: Object.fromEntries(
        Object.entries(annotations).filter(([clipId]) => queueIds.includes(clipId))
      ),
      telestration
    });
    openHtmlPreview(html);
    logEvent('Broadcast pack previewed', `${queue.length} clips`);
  };

  const closePendingImport = () => {
    setPendingImport(null);
    setImportStatus('');
    if (importInputRef.current) {
      importInputRef.current.value = '';
    }
  };

  const clearImportUndo = () => {
    setImportUndo(null);
    saveToStorage(importUndoKey, null);
  };

  const undoLastImport = () => {
    if (!importUndo || importBusy) {
      return;
    }

    const currentQueueIds = queue.map((clip) => clip.id);
    const expectedQueueIds = importUndo.postImportQueueIds;
    const arraysEqual = (a: string[], b: string[]) =>
      a.length === b.length && a.every((value, idx) => value === b[idx]);

    if (!expectedQueueIds || !arraysEqual(expectedQueueIds, currentQueueIds)) {
      const ok = window.confirm(
        'Your export queue changed since the last import. Undo will overwrite the current queue and restore the pre-import state. Continue?'
      );
      if (!ok) {
        return;
      }
    }

    setImportBusy(true);
    setImportStatus('Undoing import...');
    try {
      setQueue(importUndo.previousQueue);

      const affected = importUndo.affectedClipIds;
      replaceLabelsForClips(affected, importUndo.previousLabels);
      replaceAnnotationsForClips(affected, importUndo.previousAnnotations);
      replaceStrokesForClips(affected, importUndo.previousTelestration);

      setLastImportMeta(importUndo.previousLastImportMeta);
      saveToStorage(lastImportKey, importUndo.previousLastImportMeta);

      clearImportUndo();
      setImportStatus('Import undone.');
      logEvent('Pack import undone', importUndo.pack.title);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'Unknown undo error';
      setImportStatus(`Undo failed: ${message}`);
      logEvent('Pack import undo failed', message);
    } finally {
      setImportBusy(false);
    }
  };

  const applyPendingImport = () => {
    if (!pendingImport || importBusy) {
      return;
    }

    const { pack, diff, decision } = pendingImport;
    const currentQueueIds = new Set(queue.map((clip) => clip.id));
    const importedIds = new Set(pack.clips.map((clip) => clip.id));

    setImportBusy(true);
    setImportStatus('Applying import...');
    try {
      const previousQueueIds = queue.map((clip) => clip.id);
      const postImportQueueIds =
        decision.strategy === 'replace'
          ? pack.clips.map((clip) => clip.id)
          : (() => {
              const existing = new Set(previousQueueIds);
              const next = [...previousQueueIds];
              pack.clips.forEach((clip) => {
                if (!existing.has(clip.id)) {
                  next.push(clip.id);
                  existing.add(clip.id);
                }
              });
              return next;
            })();

      const affectedClipIds = Array.from(new Set([...diff.newClipIds, ...diff.overlappingClipIds]));
      const snapshot: ImportUndoSnapshot = {
        createdAt: new Date().toISOString(),
        pack: {
          title: pack.title,
          match: pack.match,
          owner: pack.owner,
          source: pack.source,
          clipCount: pack.clips.length
        },
        affectedClipIds,
        postImportQueueIds,
        previousQueue: queue,
        previousLabels: Object.fromEntries(
          affectedClipIds.map((clipId) => [clipId, labels[clipId] ?? []])
        ),
        previousAnnotations: Object.fromEntries(
          affectedClipIds.map((clipId) => [clipId, annotations[clipId] ?? ''])
        ),
        previousTelestration: Object.fromEntries(
          affectedClipIds.map((clipId) => [clipId, strokesByClip[clipId] ?? []])
        ),
        previousLastImportMeta: lastImportMeta
      };
      setImportUndo(snapshot);
      saveToStorage(importUndoKey, snapshot);

      if (decision.strategy === 'replace') {
        setQueue(pack.clips);
      } else {
        // Append clips in pack order; enqueueClips will skip duplicates.
        enqueueClips(pack.clips);
      }

      const overlapIds = diff.overlappingClipIds;
      const newIds = diff.newClipIds;

      const labelIds: string[] = [];
      const nextLabels: Record<string, string[]> = {};

      const annotationIds: string[] = [];
      const nextAnnotations: Record<string, string> = {};

      const telestrationIds: string[] = [];
      const nextTelestration = {} as typeof pack.telestration;

      const includeOverlapLabels = (policy: PackOverlapLabelsPolicy) =>
        policy === 'merge' || policy === 'replace';
      const includeOverlapNotes = (policy: PackOverlapNotePolicy) => policy === 'replace';

      // New clips always take the imported notes (including clearing stale local notes).
      newIds.forEach((clipId) => {
        labelIds.push(clipId);
        nextLabels[clipId] = pack.labels[clipId] ?? [];

        annotationIds.push(clipId);
        nextAnnotations[clipId] = pack.annotations[clipId] ?? '';

        telestrationIds.push(clipId);
        nextTelestration[clipId] = pack.telestration[clipId] ?? [];
      });

      // Overlapping clips are policy-controlled.
      if (overlapIds.length > 0) {
        if (includeOverlapLabels(decision.overlapLabels)) {
          overlapIds.forEach((clipId) => {
            labelIds.push(clipId);
            if (decision.overlapLabels === 'merge') {
              nextLabels[clipId] = mergeLabels({
                existing: labels[clipId],
                imported: pack.labels[clipId]
              });
              return;
            }
            nextLabels[clipId] = pack.labels[clipId] ?? [];
          });
        }

        if (includeOverlapNotes(decision.overlapAnnotations)) {
          overlapIds.forEach((clipId) => {
            annotationIds.push(clipId);
            nextAnnotations[clipId] = pack.annotations[clipId] ?? '';
          });
        }

        if (includeOverlapNotes(decision.overlapTelestration)) {
          overlapIds.forEach((clipId) => {
            telestrationIds.push(clipId);
            nextTelestration[clipId] = pack.telestration[clipId] ?? [];
          });
        }
      }

      replaceLabelsForClips(labelIds, nextLabels);
      replaceAnnotationsForClips(annotationIds, nextAnnotations);
      replaceStrokesForClips(telestrationIds, nextTelestration);

      const meta: LastImportMeta = {
        title: pack.title,
        notes: pack.notes,
        match: pack.match,
        owner: pack.owner,
        source: pack.source,
        clipCount: pack.clips.length,
        importedAt: new Date().toLocaleString()
      };
      setLastImportMeta(meta);
      saveToStorage(lastImportKey, meta);

      const strategyLabel = decision.strategy === 'replace' ? 'Replaced queue' : 'Appended clips';
      setImportStatus(`${strategyLabel}: "${pack.title}" (${pack.clips.length} clips).`);
      logEvent('Pack imported', `${pack.title} · ${pack.clips.length} clips · ${decision.strategy}`);

      closePendingImport();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'Unknown import error';
      setImportStatus(`Import failed: ${message}`);
      logEvent('Pack import failed', message);
    } finally {
      setImportBusy(false);
    }

    // Diagnostics-only (no functional impact): expose a quick sanity check in the audit log.
    if (importedIds.size > 0 && currentQueueIds.size > 0) {
      logEvent(
        'Pack import diff',
        `new:${diff.newClipIds.length} overlap:${diff.overlappingClipIds.length} removed:${diff.removedClipIds.length}`
      );
    }
  };

  const onImportFile: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file || importBusy) {
      return;
    }

    setImportBusy(true);
    setImportStatus('Importing pack...');
    try {
      const pack = await importReportPackFromFile(file);
      const diff = computePackDiff({
        currentQueue: queue,
        currentLabels: labels,
        currentAnnotations: annotations,
        currentTelestration: strokesByClip,
        pack
      });
      setPendingImport({ pack, diff, decision: defaultImportDecision });
      setImportStatus(`Review import: "${pack.title}" (${pack.clips.length} clips).`);
    } catch (error) {
      const message =
        error instanceof PackImportError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unknown import error';
      setImportStatus(`Import failed: ${message}`);
      logEvent('Pack import failed', message);
    } finally {
      setImportBusy(false);
      event.target.value = '';
    }
  };

  const clearImportedPackBanner = () => {
    setLastImportMeta(null);
    saveToStorage(lastImportKey, null);
    clearImportUndo();
    setImportStatus('');
    logEvent('Pack banner cleared', 'Reports import');
  };

  return (
    <div className="page-content">
      <SectionHeader
        title="Reports"
        subtitle="Evidence-backed packs ready for staff review."
        action={<button className="btn primary">New report</button>}
      />

        <div className="grid two">
          <div className="card surface">
          <SectionHeader title="Recent reports" />
          <div className="report-list">
            {reports.map((report) => (
              <div className="report-row" key={report.id}>
                <div>
                  <h4>{report.title}</h4>
                  <p>{report.updated}</p>
                </div>
                <span className={`pill ${report.status === 'Ready' ? 'pill-ready' : ''}`}>
                  {report.status}
                </span>
              </div>
            ))}
          </div>
        </div>
          <div className="card surface">
          <SectionHeader
            title="Export queue"
            subtitle="Clips added from Coach/Analyst."
            action={
              <button className="btn" onClick={() => (window.location.hash = '#draft')}>
                Open draft
              </button>
            }
          />
          <ReportQueue />
          <div className="divider" />
          <div className="form" style={{ paddingTop: 6 }}>
            <label className="field">
              <span>Import pack</span>
              <input
                ref={importInputRef}
                type="file"
                accept=".zip,application/zip,.json,application/json"
                onChange={onImportFile}
                disabled={importBusy}
              />
            </label>
            <p className="muted">
              Import a zip bundle (`afm-bundle.zip`) or report JSON (`afm-report.json`) to hydrate the queue and notes.
            </p>
            {importStatus ? (
              <p className={`muted ${importStatus.startsWith('Import failed') ? 'danger' : ''}`}>
                {importStatus}
              </p>
            ) : null}
            {lastImportMeta ? (
              <div className="import-banner">
                <div>
                  <p className="eyebrow">Imported pack</p>
                  <h4>{lastImportMeta.title}</h4>
                  <p className="muted">
                    {lastImportMeta.match} · {lastImportMeta.owner} · {lastImportMeta.clipCount}{' '}
                    clips · {lastImportMeta.source.toUpperCase()} · {lastImportMeta.importedAt}
                  </p>
                  {lastImportMeta.notes ? <p className="muted">{lastImportMeta.notes}</p> : null}
                </div>
                <div className="import-banner-actions">
                  {importUndo ? (
                    <button className="btn" onClick={undoLastImport} disabled={importBusy}>
                      Undo import
                    </button>
                  ) : null}
                  <button className="btn ghost" onClick={clearImportedPackBanner} disabled={importBusy}>
                    Clear
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <Modal
        open={pendingImport !== null}
        onClose={closePendingImport}
        labelledBy={importTitleId}
        initialFocusRef={applyImportRef}
        className="import-review-modal"
      >
        {pendingImport ? (
          <>
            <div className="modal-header">
              <div>
                <p className="eyebrow">Import pack</p>
                <h3 id={importTitleId}>{pendingImport.pack.title}</h3>
                <p className="muted">
                  {pendingImport.pack.match} · {pendingImport.pack.owner} · {pendingImport.pack.clips.length} clips ·{' '}
                  {pendingImport.pack.source.toUpperCase()}
                </p>
              </div>
              <button className="btn ghost" onClick={closePendingImport}>
                Close
              </button>
            </div>

            <div className="modal-body">
              <div className="import-diff-grid">
                <div className="import-diff-card">
                  <p className="eyebrow">New clips</p>
                  <h4>{pendingImport.diff.newClipIds.length}</h4>
                </div>
                <div className="import-diff-card">
                  <p className="eyebrow">Overlapping clips</p>
                  <h4>{pendingImport.diff.overlappingClipIds.length}</h4>
                </div>
                <div className="import-diff-card">
                  <p className="eyebrow">Removed (if replace)</p>
                  <h4>{pendingImport.diff.removedClipIds.length}</h4>
                </div>
                <div className="import-diff-card">
                  <p className="eyebrow">Overlap notes changed</p>
                  <h4>{pendingImport.diff.overlapNotesChangedIds.length}</h4>
                </div>
              </div>

              <div className="row-card">
                <div>
                  <h4>Import strategy</h4>
                  <p>Choose how this pack affects the current export queue.</p>
                </div>
                <div className="segment">
                  <button
                    className={`segment-btn ${pendingImport.decision.strategy === 'replace' ? 'active' : ''}`}
                    onClick={() =>
                      setPendingImport((prev) =>
                        prev ? { ...prev, decision: { ...prev.decision, strategy: 'replace' } } : prev
                      )
                    }
                  >
                    Replace
                  </button>
                  <button
                    className={`segment-btn ${pendingImport.decision.strategy === 'append' ? 'active' : ''}`}
                    onClick={() =>
                      setPendingImport((prev) =>
                        prev ? { ...prev, decision: { ...prev.decision, strategy: 'append' } } : prev
                      )
                    }
                  >
                    Append
                  </button>
                </div>
              </div>

              {pendingImport.diff.overlappingClipIds.length > 0 ? (
                <div className="row-card">
                  <div>
                    <h4>Overlapping clips</h4>
                    <p>Resolve clip note conflicts when IDs already exist in the queue.</p>
                  </div>
                  <div className="import-conflicts">
                    <label className="field">
                      <span>Labels</span>
                      <select
                        value={pendingImport.decision.overlapLabels}
                        onChange={(event) =>
                          setPendingImport((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  decision: {
                                    ...prev.decision,
                                    overlapLabels: event.target.value as PackOverlapLabelsPolicy
                                  }
                                }
                              : prev
                          )
                        }
                      >
                        <option value="merge">Merge (recommended)</option>
                        <option value="keep">Keep local</option>
                        <option value="replace">Replace with imported</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>Annotations</span>
                      <select
                        value={pendingImport.decision.overlapAnnotations}
                        onChange={(event) =>
                          setPendingImport((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  decision: {
                                    ...prev.decision,
                                    overlapAnnotations: event.target.value as PackOverlapNotePolicy
                                  }
                                }
                              : prev
                          )
                        }
                      >
                        <option value="keep">Keep local (recommended)</option>
                        <option value="replace">Replace with imported</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>Telestration</span>
                      <select
                        value={pendingImport.decision.overlapTelestration}
                        onChange={(event) =>
                          setPendingImport((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  decision: {
                                    ...prev.decision,
                                    overlapTelestration: event.target.value as PackOverlapNotePolicy
                                  }
                                }
                              : prev
                          )
                        }
                      >
                        <option value="keep">Keep local (recommended)</option>
                        <option value="replace">Replace with imported</option>
                      </select>
                    </label>
                  </div>
                </div>
              ) : null}

              <div className="callout">
                <p className="muted">
                  Tip: choose <strong>Append</strong> to keep your current queue and only bring in new clips.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn ghost" onClick={closePendingImport} disabled={importBusy}>
                Cancel
              </button>
              <button
                className="btn primary"
                onClick={applyPendingImport}
                disabled={importBusy}
                ref={applyImportRef}
              >
                Apply import
              </button>
            </div>
          </>
        ) : null}
      </Modal>

      <div className="grid two">
        <div className="card surface">
          <SectionHeader
            title="Segment report"
            subtitle="Auto-generate the key findings."
            action={
              <button
                className="btn primary"
                onClick={generateSegmentReport}
                disabled={segments.length === 0}
              >
                Generate
              </button>
            }
          />
          <div className="segment-report-form">
            <label className="field">
              <span>Segment</span>
              <select
                value={selectedSegmentId}
                onChange={(event) => setSelectedSegmentId(event.target.value)}
                disabled={segmentOptions.length === 0}
              >
                {segmentOptions.length === 0 ? (
                  <option value="">No segments available</option>
                ) : (
                  segmentOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))
                )}
              </select>
            </label>
            <div className="segment-report-meta">
              <div>
                <p className="eyebrow">Queued clips</p>
                <h4>{queue.length}</h4>
              </div>
              <div>
                <p className="eyebrow">Timeline events</p>
                <h4>{timeline.length}</h4>
              </div>
            </div>
            <p className="muted">
              Uses evidence clips from the queue when available; otherwise falls back to detected
              timeline clips.
            </p>
          </div>
        </div>

        <div className="card surface">
          <SectionHeader
            title="Report output"
            subtitle={segmentReport ? `Generated ${segmentReport.generatedAt}` : 'Not generated yet.'}
            action={
              <div className="header-actions">
                <button className="btn" onClick={copySummary} disabled={!segmentReport}>
                  Copy summary
                </button>
                <button className="btn" onClick={downloadSegmentReport} disabled={!segmentReport}>
                  Download JSON
                </button>
              </div>
            }
          />
          {segmentReport ? (
            <div className="report-output">
              <div className="report-block">
                <p className="eyebrow">Summary</p>
                <h3>{segmentReport.title}</h3>
                <p>{segmentReport.summary}</p>
                <div className="report-meta">
                  <span className="pill">Signal {segmentReport.signal}</span>
                  <span className="pill">Confidence {segmentReport.confidence}</span>
                  <span className="pill">{segmentReport.clips.length} clips</span>
                </div>
              </div>
              <div className="report-block">
                <p className="eyebrow">Repeat patterns</p>
                <ul className="report-bullets">
                  {segmentReport.patterns.map((pattern) => (
                    <li key={pattern}>{pattern}</li>
                  ))}
                </ul>
              </div>
              <div className="report-block">
                <p className="eyebrow">Recommended adjustments</p>
                <ul className="report-bullets">
                  {segmentReport.adjustments.map((adjustment) => (
                    <li key={adjustment}>{adjustment}</li>
                  ))}
                </ul>
              </div>
              <div className="report-block">
                <p className="eyebrow">Evidence clips</p>
                <div className="report-clips">
                  {segmentReport.clips.map((clip) => (
                    <div key={clip.id} className="report-clip">
                      <span>{clip.title}</span>
                      <span className="pill">{clip.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="muted">Generate a report to view findings.</p>
          )}
        </div>
      </div>

      <div className="grid two">
        <div className="card surface">
          <SectionHeader title="Evidence engagement" subtitle="How staff use evidence." />
          <EngagementWidget />
        </div>
        <div className="card surface">
          <SectionHeader title="Engagement stream" subtitle="Live clip opens." />
          <EngagementStream />
        </div>
      </div>

      <div className="grid two">
        <div className="card surface">
          <SectionHeader title="Export formats" subtitle="Presentation packs and data files." />
          <div className="export-grid">
            <div className="export-card">
              <h4>Coach pack</h4>
              <p>Clips + overlays + summary PDF.</p>
              <button className="btn" onClick={() => (window.location.hash = '#draft')}>
                Generate
              </button>
            </div>
            <div className="export-card">
              <h4>Analyst data</h4>
              <p>Tags, clips, JSON/CSV export.</p>
              <button className="btn" onClick={exportAnalystData} disabled={queue.length === 0}>
                Download
              </button>
            </div>
            <div className="export-card">
              <h4>Broadcast pack</h4>
              <p>Studio-ready sequence with graphics.</p>
              <button className="btn" onClick={renderBroadcastPack} disabled={queue.length === 0}>
                Render
              </button>
            </div>
            <div className="export-card">
              <h4>Evidence package</h4>
              <p>Manifest with overlays, labels, annotations.</p>
              <button className="btn" onClick={exportEvidencePackage} disabled={queue.length === 0}>
                Export
              </button>
            </div>
          </div>
        </div>
        <div className="card surface">
          <SectionHeader title="Export log" subtitle="Recent downloads." />
          <AuditLog />
        </div>
      </div>
    </div>
  );
};
