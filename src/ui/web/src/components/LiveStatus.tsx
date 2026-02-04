import { useLiveStore } from '../hooks/useLiveStore';
import { formatClockTime } from '../utils/time';

export const LiveStatus = () => {
  const { updatedAt, connected } = useLiveStore();

  return (
    <div className="live-status">
      <span className={`live-dot ${connected ? 'on' : 'off'}`} />
      <div>
        <p className="eyebrow">Live sync</p>
        <span>{connected ? `Updated ${formatClockTime(updatedAt)}` : 'Disconnected'}</span>
      </div>
    </div>
  );
};
