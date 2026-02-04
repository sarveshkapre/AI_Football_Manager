import { useSyncExternalStore } from 'react';
import { liveStore } from '../store/liveStore';

export const useLiveStore = () => {
  return useSyncExternalStore(liveStore.subscribe, liveStore.getState);
};
