import { useMemo, useState } from 'react';
import { ReportQueue } from '../components/ReportQueue';
import { SectionHeader } from '../components/SectionHeader';
import { useAnnotations } from '../context/AnnotationsContext';
import { useAudit } from '../context/AuditContext';
import { useLabels } from '../context/LabelsContext';
import { useReportContext } from '../context/ReportContext';
import {
  buildCoverText,
  buildPresentationHtml,
  buildPackStub,
  downloadCoverImage,
  downloadFile,
  openHtmlPreview
} from '../utils/export';
import { formatDuration, durationToSeconds } from '../utils/time';

export const DraftReport = () => {
  const { queue } = useReportContext();
  const { logEvent } = useAudit();
  const { annotations } = useAnnotations();
  const { labels } = useLabels();
  const [title, setTitle] = useState('Matchday Draft Report');
  const [notes, setNotes] = useState('');
  const [matchLabel, setMatchLabel] = useState('vs. Westbridge');
  const [owner, setOwner] = useState('Lead Analyst');
  const [sharePermission, setSharePermission] = useState('View');
  const shareLink = 'https://afm.example.com/share/preview';

  const totalDuration = useMemo(() => {
    const seconds = queue.reduce((sum, clip) => sum + durationToSeconds(clip.duration), 0);
    return formatDuration(seconds);
  }, [queue]);

  const queueIds = useMemo(() => queue.map((clip) => clip.id), [queue]);

  const exportJson = () => {
    const payload = {
      title,
      notes,
      match: matchLabel,
      owner,
      totalDuration,
      clipCount: queue.length,
      clips: queue,
      annotations: Object.fromEntries(
        Object.entries(annotations).filter(([clipId]) => queueIds.includes(clipId))
      ),
      labels: Object.fromEntries(
        Object.entries(labels).filter(([clipId]) => queueIds.includes(clipId))
      )
    };
    downloadFile('afm-report.json', JSON.stringify(payload, null, 2), 'application/json');
    logEvent('Report JSON exported', `${queue.length} clips`);
  };

  const exportCsv = () => {
    const header = 'id,title,duration,tags';
    const rows = queue.map((clip) =>
      [clip.id, clip.title, clip.duration, clip.tags.join('|')]
        .map((value) => `"${value.replace(/"/g, '""')}"`)
        .join(',')
    );
    downloadFile('afm-report.csv', [header, ...rows].join('\n'), 'text/csv');
    logEvent('Report CSV exported', `${queue.length} clips`);
  };

  const exportNotes = () => {
    const payload = {
      annotations: Object.fromEntries(
        Object.entries(annotations).filter(([clipId]) => queueIds.includes(clipId))
      ),
      labels: Object.fromEntries(
        Object.entries(labels).filter(([clipId]) => queueIds.includes(clipId))
      )
    };
    downloadFile('afm-notes.json', JSON.stringify(payload, null, 2), 'application/json');
    logEvent('Notes exported', `${queue.length} clips`);
  };

  const exportCover = () => {
    const coverText = buildCoverText(
      title,
      notes,
      queue.slice(0, 5).map((clip) => clip.title)
    );
    downloadFile('afm-cover.txt', coverText, 'text/plain');
    logEvent('Cover exported', title);
  };

  const exportCoverImage = () => {
    downloadCoverImage(title, matchLabel, notes);
    logEvent('Cover image exported', title);
  };

  const exportPresentation = () => {
    const html = buildPresentationHtml({
      title,
      match: matchLabel,
      owner,
      summary: notes,
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
    downloadFile('afm-presentation.html', html, 'text/html');
    logEvent('Presentation HTML exported', title);
  };

  const previewPresentation = () => {
    const html = buildPresentationHtml({
      title,
      match: matchLabel,
      owner,
      summary: notes,
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
    logEvent('Presentation HTML previewed', title);
  };

  const exportPack = () => {
    const metadata = {
      title,
      notes,
      match: matchLabel,
      owner,
      createdAt: new Date().toISOString(),
      clipCount: queue.length,
      totalDuration,
      sharePermission
    };
    const csv = [
      'id,title,duration,tags',
      ...queue.map((clip) =>
        [clip.id, clip.title, clip.duration, clip.tags.join('|')]
          .map((value) => `"${value.replace(/"/g, '""')}"`)
          .join(',')
      )
    ].join('\n');
    const cover = buildCoverText(
      title,
      notes,
      queue.slice(0, 5).map((clip) => clip.title)
    );
    const pack = buildPackStub(metadata, csv, cover);
    downloadFile('afm-pack.json', pack, 'application/json');
    logEvent('Pack exported', `${queue.length} clips`);
  };

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      logEvent('Share link copied', sharePermission);
    } catch {
      logEvent('Share link generated', sharePermission);
    }
  };

  const coverClips = queue.slice(0, 3);

  return (
    <div className="page-content">
      <SectionHeader
        title="Draft Report"
        subtitle="Auto-filled from the report queue."
        action={
          <button className="btn primary" onClick={exportPack}>
            Generate pack
          </button>
        }
      />

      <div className="grid two">
        <div className="card surface">
          <div className="form">
            <label className="field">
              <span>Report title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Enter report title"
              />
            </label>
            <label className="field">
              <span>Match label</span>
              <input
                value={matchLabel}
                onChange={(event) => setMatchLabel(event.target.value)}
                placeholder="Opponent or fixture"
              />
            </label>
            <label className="field">
              <span>Owner</span>
              <input
                value={owner}
                onChange={(event) => setOwner(event.target.value)}
                placeholder="Primary analyst"
              />
            </label>
            <label className="field">
              <span>Coach summary</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Summarize tactical shifts and recommendations"
                rows={6}
              />
            </label>
            <div className="summary">
              <div>
                <p className="eyebrow">Clips in queue</p>
                <h3>{queue.length}</h3>
              </div>
              <div>
                <p className="eyebrow">Total duration</p>
                <h3>{totalDuration}</h3>
              </div>
            </div>
            <div className="export-actions">
              <button className="btn" onClick={exportJson}>
                Download JSON
              </button>
              <button className="btn" onClick={exportCsv}>
                Download CSV
              </button>
              <button className="btn" onClick={exportNotes}>
                Download notes
              </button>
            </div>
          </div>
        </div>
        <div className="card surface">
          <SectionHeader title="Queued clips" subtitle="Order reflects report sequence." />
          <ReportQueue />
        </div>
      </div>

      <div className="grid two">
        <div className="card surface">
          <SectionHeader title="Presentation cover" subtitle="Preview for the report pack." />
          <div className="cover">
            <div>
              <p className="eyebrow">AI Football Manager</p>
              <h2 className="cover-title">{title}</h2>
              <p className="muted">{matchLabel}</p>
              <p className="muted">{notes || 'Add a short summary to guide the staff.'}</p>
            <div className="cover-actions">
              <button className="btn" onClick={exportCover}>
                Download cover text
              </button>
              <button className="btn" onClick={exportCoverImage}>
                Download cover image
              </button>
              <button className="btn" onClick={exportPresentation}>
                Download HTML pack
              </button>
              <button className="btn ghost" onClick={previewPresentation}>
                Preview pack
              </button>
            </div>
          </div>
            <div className="cover-list">
              <h4>Key clips</h4>
              {coverClips.length === 0 && <p className="muted">Add clips to show highlights.</p>}
              {coverClips.map((clip) => (
                <div key={clip.id} className="cover-item">
                  <span>{clip.title}</span>
                  <span className="pill">{clip.duration}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card surface">
          <SectionHeader title="Share pack" subtitle="Generate a shareable link." />
          <div className="share">
            <label className="field">
              <span>Share link</span>
              <input value={shareLink} readOnly />
            </label>
            <div className="share-actions">
              <select
                value={sharePermission}
                onChange={(event) => setSharePermission(event.target.value)}
              >
                <option value="View">View only</option>
                <option value="Comment">Comment</option>
                <option value="Edit">Edit</option>
              </select>
              <button className="btn primary" onClick={copyShare}>
                Copy link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
