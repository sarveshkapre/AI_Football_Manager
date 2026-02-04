import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';

type Cadence = 30 | 60 | 90;

interface PreferencesContextValue {
  notificationCadence: Cadence;
  autoRefresh: boolean;
  setNotificationCadence: (cadence: Cadence) => void;
  setAutoRefresh: (enabled: boolean) => void;
}

const storageKey = 'afm.preferences';

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

export const PreferencesProvider = ({ children }: { children: React.ReactNode }) => {
  const [notificationCadence, setNotificationCadence] = useState<Cadence>(() =>
    loadFromStorage(storageKey, { notificationCadence: 30, autoRefresh: true }).notificationCadence
  );
  const [autoRefresh, setAutoRefresh] = useState<boolean>(() =>
    loadFromStorage(storageKey, { notificationCadence: 30, autoRefresh: true }).autoRefresh
  );

  useEffect(() => {
    saveToStorage(storageKey, { notificationCadence, autoRefresh });
  }, [notificationCadence, autoRefresh]);

  const value = useMemo(
    () => ({
      notificationCadence,
      autoRefresh,
      setNotificationCadence,
      setAutoRefresh
    }),
    [notificationCadence, autoRefresh]
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
