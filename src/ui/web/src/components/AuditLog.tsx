import { useAudit } from '../context/AuditContext';

export const AuditLog = () => {
  const { events } = useAudit();

  if (events.length === 0) {
    return <p className="muted">No exports logged yet.</p>;
  }

  return (
    <div className="audit">
      {events.map((event) => (
        <div key={event.id} className="audit-row">
          <div>
            <p className="eyebrow">{event.timestamp}</p>
            <h4>{event.action}</h4>
            <p className="muted">{event.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
