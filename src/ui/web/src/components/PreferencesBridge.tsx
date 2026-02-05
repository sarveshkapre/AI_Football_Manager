import { useEffect } from 'react';
import { liveStore } from '../store/liveStore';
import { usePreferences } from '../context/PreferencesContext';

export const PreferencesBridge = () => {
  const { autoRefresh, notificationCadence, ingestSimulation } = usePreferences();

  useEffect(() => {
    liveStore.setAutoRefresh(autoRefresh);
  }, [autoRefresh]);

  useEffect(() => {
    liveStore.setRefreshInterval(notificationCadence * 1000);
  }, [notificationCadence]);

  useEffect(() => {
    liveStore.setSimulation(ingestSimulation);
  }, [ingestSimulation]);

  return null;
};
