import { useEffect, useState } from 'react';
import { api } from '../api/mock';
import { useClipContext } from '../context/ClipContext';
import { usePreferences } from '../context/PreferencesContext';
import type { LiveEvent } from '../types';

export const LiveEventFeed = () => {
  const { openClip } = useClipContext();
  const { notificationCadence } = usePreferences();
  const [events, setEvents] = useState<LiveEvent[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await api.getLiveEvents();
      setEvents(data);
    };
    load();
    const interval = window.setInterval(load, notificationCadence * 1000);
    return () => window.clearInterval(interval);
  }, [notificationCadence]);

  return (
    <div className="feed">
      {events.map((event) => (
        <button
          key={event.id}
          className="feed-item"
          onClick={() =>
            openClip({
              id: event.clipId,
              title: event.message,
              duration: '0:12',
              tags: ['live'],
              overlays: []
            })
          }
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
