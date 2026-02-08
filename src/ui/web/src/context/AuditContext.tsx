import { createContext, useContext, useMemo, useState } from 'react';
import { isAuditEventArray } from '../utils/guards';
import { loadFromStorageWithGuard, saveToStorage } from '../utils/storage';

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
  const [events, setEvents] = useState<AuditEvent[]>(() =>
    loadFromStorageWithGuard(storageKey, [], isAuditEventArray)
  );

  const logEvent = (action: string, detail: string) => {
    setEvents((prev) => {
      const next = [
        {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          action,
          detail
        },
        ...prev
      ].slice(0, 20);
      saveToStorage(storageKey, next);
      return next;
    });
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
