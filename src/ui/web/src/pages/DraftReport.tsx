import { useMemo, useState } from 'react';
import { ReportQueue } from '../components/ReportQueue';
import { SectionHeader } from '../components/SectionHeader';
import { useReportContext } from '../context/ReportContext';
import { buildCoverText, downloadFile } from '../utils/export';
import { formatDuration, durationToSeconds } from '../utils/time';

export const DraftReport = () => {
  const { queue } = useReportContext();
  const [title, setTitle] = useState('Matchday Draft Report');
  const [notes, setNotes] = useState('');
  const [matchLabel, setMatchLabel] = useState('vs. Westbridge');
  const [owner, setOwner] = useState('Lead Analyst');

  const totalDuration = useMemo(() => {
    const seconds = queue.reduce((sum, clip) => sum + durationToSeconds(clip.duration), 0);
    return formatDuration(seconds);
  }, [queue]);

  const exportJson = () => {
    const payload = {
      title,
      notes,
      match: matchLabel,
      owner,
      totalDuration,
      clipCount: queue.length,
      clips: queue
    };
    downloadFile('afm-report.json', JSON.stringify(payload, null, 2), 'application/json');
  };

  const exportCsv = () => {
    const header = 'id,title,duration,tags';
    const rows = queue.map((clip) =>
      [clip.id, clip.title, clip.duration, clip.tags.join('|')]
        .map((value) => `"${value.replace(/"/g, '""')}"`)
        .join(',')
    );
    downloadFile('afm-report.csv', [header, ...rows].join('\n'), 'text/csv');
  };

  const exportCover = () => {
    const coverText = buildCoverText(
      title,
      notes,
      queue.slice(0, 5).map((clip) => clip.title)
    );
    downloadFile('afm-cover.txt', coverText, 'text/plain');
  };

  const exportPack = () => {
    const metadata = {
      title,
      notes,
      match: matchLabel,
      owner,
      createdAt: new Date().toISOString(),
      clipCount: queue.length
    };
    downloadFile('afm-pack.json', JSON.stringify(metadata, null, 2), 'application/json');
  };

  const coverClips = queue.slice(0, 3);

  return (
    <div className="page-content">
      <SectionHeader
        title="Draft Report"
        subtitle="Auto-filled from the report queue."
        action={<button className="btn primary" onClick={exportPack}>Generate pack</button>}
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
              <button className="btn" onClick={exportCover}>
                Download cover
              </button>
            </div>
          </div>
        </div>
        <div className="card surface">
          <SectionHeader title="Queued clips" subtitle="Order reflects report sequence." />
          <ReportQueue />
        </div>
      </div>

      <div className="card surface">
        <SectionHeader title="Presentation cover" subtitle="Preview for the report pack." />
        <div className="cover">
          <div>
            <p className="eyebrow">AI Football Manager</p>
            <h2 className="cover-title">{title}</h2>
            <p className="muted">{matchLabel}</p>
            <p className="muted">{notes || 'Add a short summary to guide the staff.'}</p>
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
    </div>
  );
};
