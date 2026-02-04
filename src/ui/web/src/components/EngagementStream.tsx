import { useEffect, useState } from 'react';
import { api } from '../api/mock';
import type { LiveEvent } from '../types';

export const EngagementStream = () => {
  const [events, setEvents] = useState<LiveEvent[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await api.getLiveEvents();
      setEvents(data.map((event) => ({ ...event, message: `Clip opened: ${event.message}` })));
    };
    load();
    const interval = window.setInterval(load, 45000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="stream">
      {events.map((event) => (
        <div key={event.id} className="stream-row">
          <span className="eyebrow">{event.timestamp}</span>
          <p>{event.message}</p>
          <span className="pill">+1</span>
        </div>
      ))}
    </div>
  );
};
