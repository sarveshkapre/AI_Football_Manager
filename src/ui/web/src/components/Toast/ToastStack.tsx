import { useEffect, useState } from 'react';
import { api } from '../../api/mock';
import { useClipContext } from '../../context/ClipContext';
import type { LiveEvent } from '../../types';

const refreshMs = 30000;

export const ToastStack = () => {
  const { openClip } = useClipContext();
  const [events, setEvents] = useState<LiveEvent[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await api.getLiveEvents();
      setEvents(data);
    };
    load();
    const interval = window.setInterval(load, refreshMs);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="toast-stack">
      {events.map((event) => (
        <button
          className="toast"
          key={event.id}
          onClick={() => openClip({
            id: event.clipId,
            title: 'Live event clip',
            duration: '0:12',
            tags: ['live'],
            overlays: []
          })}
        >
          <div>
            <p className="eyebrow">{event.timestamp}</p>
            <h4>{event.message}</h4>
          </div>
          <span className="pill">Confidence {event.confidence}</span>
        </button>
      ))}
    </div>
  );
};
