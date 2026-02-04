import { useReportContext } from '../context/ReportContext';

export const ReportQueue = () => {
  const { queue, removeClip, clearQueue } = useReportContext();

  if (queue.length === 0) {
    return (
      <div className="queue-empty">
        <p className="muted">No clips queued for report export.</p>
      </div>
    );
  }

  return (
    <div className="queue">
      {queue.map((clip) => (
        <div className="queue-row" key={clip.id}>
          <div>
            <h4>{clip.title}</h4>
            <p>{clip.duration}</p>
          </div>
          <button className="btn ghost" onClick={() => removeClip(clip.id)}>
            Remove
          </button>
        </div>
      ))}
      <div className="queue-actions">
        <button className="btn" onClick={clearQueue}>
          Clear queue
        </button>
        <button className="btn primary">Export pack</button>
      </div>
    </div>
  );
};
