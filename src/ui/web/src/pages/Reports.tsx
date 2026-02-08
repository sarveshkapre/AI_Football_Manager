import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/mock';
import { AuditLog } from '../components/AuditLog';
import { EngagementStream } from '../components/EngagementStream';
import { EngagementWidget } from '../components/EngagementWidget';
import { ReportQueue } from '../components/ReportQueue';
import { SectionHeader } from '../components/SectionHeader';
import { useAudit } from '../context/AuditContext';
import { useReportContext } from '../context/ReportContext';
import type { Clip, Recommendation, ReportItem, Segment, TimelineEvent } from '../types';
import { useAnnotations } from '../context/AnnotationsContext';
import { useLabels } from '../context/LabelsContext';
import {
  buildEvidencePackage,
  buildPresentationHtml,
  downloadFile,
  openHtmlPreview
} from '../utils/export';
import { isNullableString } from '../utils/guards';
import { buildSegmentReport, type SegmentReport } from '../utils/reports';
import { durationToSeconds, formatDuration } from '../utils/time';
import { loadFromStorageWithGuard, saveToStorage } from '../utils/storage';

export const Reports = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const [segmentReport, setSegmentReport] = useState<SegmentReport | null>(null);
  const { queue } = useReportContext();
  const { logEvent } = useAudit();
  const { annotations } = useAnnotations();
  const { labels } = useLabels();

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
      annotation: annotations[clip.id]
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
      )
    });
    openHtmlPreview(html);
    logEvent('Broadcast pack previewed', `${queue.length} clips`);
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
        </div>
      </div>

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
