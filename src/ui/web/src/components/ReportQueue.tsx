import { useReportContext } from '../context/ReportContext';
import { useDragList } from '../hooks/useDragList';
import { QueueAnnotation } from './QueueAnnotation';

export const ReportQueue = () => {
  const { queue, removeClip, clearQueue, setQueue } = useReportContext();
  const { handleDragStart, handleDragOver, handleDrop } = useDragList(queue, setQueue);

  if (queue.length === 0) {
    return (
      <div className="queue-empty">
        <p className="muted">No clips queued for report export.</p>
      </div>
    );
  }

  return (
    <div className="queue">
      {queue.map((clip, index) => (
        <div
          className="queue-row draggable"
          key={clip.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(index)}
        >
          <div>
            <h4>{clip.title}</h4>
            <p>{clip.duration}</p>
          </div>
          <div className="queue-actions-inline">
            <QueueAnnotation clipId={clip.id} />
            <button className="btn ghost" onClick={() => removeClip(clip.id)}>
              Remove
            </button>
          </div>
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
