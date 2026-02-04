import { useMemo, useState } from 'react';
import { ReportQueue } from '../components/ReportQueue';
import { SectionHeader } from '../components/SectionHeader';
import { useReportContext } from '../context/ReportContext';
import { formatDuration, durationToSeconds } from '../utils/time';

export const DraftReport = () => {
  const { queue } = useReportContext();
  const [title, setTitle] = useState('Matchday Draft Report');
  const [notes, setNotes] = useState('');

  const totalDuration = useMemo(() => {
    const seconds = queue.reduce((sum, clip) => sum + durationToSeconds(clip.duration), 0);
    return formatDuration(seconds);
  }, [queue]);

  return (
    <div className="page-content">
      <SectionHeader
        title="Draft Report"
        subtitle="Auto-filled from the report queue."
        action={<button className="btn primary">Generate pack</button>}
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
          </div>
        </div>
        <div className="card surface">
          <SectionHeader title="Queued clips" subtitle="Order reflects report sequence." />
          <ReportQueue />
        </div>
      </div>
    </div>
  );
};
