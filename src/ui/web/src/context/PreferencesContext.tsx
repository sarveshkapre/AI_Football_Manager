import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';

type Cadence = 30 | 60 | 90;

interface PreferencesContextValue {
  notificationCadence: Cadence;
  autoRefresh: boolean;
  ingestSimulation: boolean;
  setNotificationCadence: (cadence: Cadence) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setIngestSimulation: (enabled: boolean) => void;
}

const storageKey = 'afm.preferences';

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

export const PreferencesProvider = ({ children }: { children: React.ReactNode }) => {
  const [notificationCadence, setNotificationCadence] = useState<Cadence>(() => {
    const stored = loadFromStorage(storageKey, {
      notificationCadence: 30,
      autoRefresh: true,
      ingestSimulation: true
    }).notificationCadence;
    return stored ?? 30;
  });
  const [autoRefresh, setAutoRefresh] = useState<boolean>(() => {
    const stored = loadFromStorage(storageKey, {
      notificationCadence: 30,
      autoRefresh: true,
      ingestSimulation: true
    }).autoRefresh;
    return stored ?? true;
  });
  const [ingestSimulation, setIngestSimulation] = useState<boolean>(() => {
    const stored = loadFromStorage(storageKey, {
      notificationCadence: 30,
      autoRefresh: true,
      ingestSimulation: true
    }).ingestSimulation;
    return stored ?? true;
  });

  useEffect(() => {
    saveToStorage(storageKey, { notificationCadence, autoRefresh, ingestSimulation });
  }, [notificationCadence, autoRefresh, ingestSimulation]);

  const value = useMemo(
    () => ({
      notificationCadence,
      autoRefresh,
      ingestSimulation,
      setNotificationCadence,
      setAutoRefresh,
      setIngestSimulation
    }),
    [notificationCadence, autoRefresh, ingestSimulation]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return context;
};
