import { useEffect } from 'react';
import { liveStore } from '../store/liveStore';
import { usePreferences } from '../context/PreferencesContext';

export const PreferencesBridge = () => {
  const { autoRefresh } = usePreferences();

  useEffect(() => {
    liveStore.setAutoRefresh(autoRefresh);
  }, [autoRefresh]);

  return null;
};
