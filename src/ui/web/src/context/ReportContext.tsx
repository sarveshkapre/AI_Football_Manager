import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Clip } from '../types';
import { isClipArray } from '../utils/guards';
import { loadFromStorageWithGuard, saveToStorage } from '../utils/storage';

interface ReportContextValue {
  queue: Clip[];
  addClip: (clip: Clip) => void;
  removeClip: (clipId: string) => void;
  clearQueue: () => void;
  setQueue: (clips: Clip[]) => void;
  enqueueClips: (clips: Clip[]) => void;
}

const storageKey = 'afm.reportQueue';

const ReportContext = createContext<ReportContextValue | undefined>(undefined);

export const ReportProvider = ({ children }: { children: React.ReactNode }) => {
  const [queue, setQueueState] = useState<Clip[]>(() =>
    loadFromStorageWithGuard(storageKey, [], isClipArray)
  );

  useEffect(() => {
    saveToStorage(storageKey, queue);
  }, [queue]);

  const value = useMemo(
    () => ({
      queue,
      addClip: (clip: Clip) =>
        setQueueState((prev) => (prev.some((item) => item.id === clip.id) ? prev : [...prev, clip])),
      removeClip: (clipId: string) =>
        setQueueState((prev) => prev.filter((clip) => clip.id !== clipId)),
      clearQueue: () => setQueueState([]),
      setQueue: (clips: Clip[]) => setQueueState(clips),
      enqueueClips: (clips: Clip[]) =>
        setQueueState((prev) => {
          const existing = new Set(prev.map((clip) => clip.id));
          const next = [...prev];
          clips.forEach((clip) => {
            if (!existing.has(clip.id)) {
              next.push(clip);
              existing.add(clip.id);
            }
          });
          return next;
        })
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
