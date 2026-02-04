import { createContext, useContext, useMemo, useState } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';

export type AccessKey =
  | 'coach'
  | 'analyst'
  | 'library'
  | 'reports'
  | 'ingest'
  | 'settings'
  | 'draft';

export type AccessState = Record<AccessKey, boolean>;

interface AccessContextValue {
  access: AccessState;
  setAccess: (key: AccessKey, value: boolean) => void;
  setAccessState: (next: AccessState) => void;
}

const defaultAccess: AccessState = {
  coach: true,
  analyst: true,
  library: true,
  reports: true,
  ingest: true,
  settings: true,
  draft: true
};

const storageKey = 'afm.access';

const AccessContext = createContext<AccessContextValue | undefined>(undefined);

export const AccessProvider = ({ children }: { children: React.ReactNode }) => {
  const [access, setAccessStateInternal] = useState<AccessState>(() => {
    const stored = loadFromStorage(storageKey, defaultAccess);
    return { ...defaultAccess, ...stored };
  });

  const setAccessState = (next: AccessState) => {
    setAccessStateInternal(next);
    saveToStorage(storageKey, next);
  };

  const setAccess = (key: AccessKey, value: boolean) => {
    const next = { ...access, [key]: value };
    setAccessState(next);
  };

  const value = useMemo(() => ({ access, setAccess, setAccessState }), [access]);

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
};

export const useAccess = () => {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error('useAccess must be used within AccessProvider');
  }
  return context;
};
