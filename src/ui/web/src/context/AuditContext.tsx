import { createContext, useContext, useMemo, useState } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  detail: string;
}

interface AuditContextValue {
  events: AuditEvent[];
  logEvent: (action: string, detail: string) => void;
}

const storageKey = 'afm.audit';

const AuditContext = createContext<AuditContextValue | undefined>(undefined);

export const AuditProvider = ({ children }: { children: React.ReactNode }) => {
  const [events, setEvents] = useState<AuditEvent[]>(() => loadFromStorage(storageKey, []));

  const logEvent = (action: string, detail: string) => {
    const next = [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        action,
        detail
      },
      ...events
    ].slice(0, 20);
    setEvents(next);
    saveToStorage(storageKey, next);
  };

  const value = useMemo(() => ({ events, logEvent }), [events]);

  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
};

export const useAudit = () => {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error('useAudit must be used within AuditProvider');
  }
  return context;
};
