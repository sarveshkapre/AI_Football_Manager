import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Clip } from '../types';
import { loadFromStorage, saveToStorage } from '../utils/storage';

interface ReportContextValue {
  queue: Clip[];
  addClip: (clip: Clip) => void;
  removeClip: (clipId: string) => void;
  clearQueue: () => void;
}

const storageKey = 'afm.reportQueue';

const ReportContext = createContext<ReportContextValue | undefined>(undefined);

export const ReportProvider = ({ children }: { children: React.ReactNode }) => {
  const [queue, setQueue] = useState<Clip[]>(() => loadFromStorage(storageKey, []));

  useEffect(() => {
    saveToStorage(storageKey, queue);
  }, [queue]);

  const value = useMemo(
    () => ({
      queue,
      addClip: (clip: Clip) =>
        setQueue((prev) => (prev.some((item) => item.id === clip.id) ? prev : [...prev, clip])),
      removeClip: (clipId: string) => setQueue((prev) => prev.filter((clip) => clip.id !== clipId)),
      clearQueue: () => setQueue([])
    }),
    [queue]
  );

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
};

export const useReportContext = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReportContext must be used within ReportProvider');
  }
  return context;
};
