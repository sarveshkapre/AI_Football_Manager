import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isPreferencesState, type PreferencesState } from '../utils/guards';
import { loadFromStorageWithGuard, saveToStorage } from '../utils/storage';

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
const defaultPreferences: PreferencesState = {
  notificationCadence: 30,
  autoRefresh: true,
  ingestSimulation: true
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

export const PreferencesProvider = ({ children }: { children: React.ReactNode }) => {
  const [preferences, setPreferences] = useState<PreferencesState>(() =>
    loadFromStorageWithGuard(storageKey, defaultPreferences, isPreferencesState)
  );

  useEffect(() => {
    saveToStorage(storageKey, preferences);
  }, [preferences]);

  const value = useMemo(
    () => ({
      notificationCadence: preferences.notificationCadence,
      autoRefresh: preferences.autoRefresh,
      ingestSimulation: preferences.ingestSimulation,
      setNotificationCadence: (notificationCadence: Cadence) =>
        setPreferences((prev) => ({ ...prev, notificationCadence })),
      setAutoRefresh: (autoRefresh: boolean) =>
        setPreferences((prev) => ({ ...prev, autoRefresh })),
      setIngestSimulation: (ingestSimulation: boolean) =>
        setPreferences((prev) => ({ ...prev, ingestSimulation }))
    }),
    [preferences]
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
