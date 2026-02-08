import { createContext, useContext, useMemo, useState } from 'react';
import { isAnnotationsMap } from '../utils/guards';
import { loadFromStorageWithGuard, saveToStorage } from '../utils/storage';

interface AnnotationsContextValue {
  annotations: Record<string, string>;
  setAnnotation: (clipId: string, note: string) => void;
  removeAnnotation: (clipId: string) => void;
}

const storageKey = 'afm.annotations';

const AnnotationsContext = createContext<AnnotationsContextValue | undefined>(undefined);

export const AnnotationsProvider = ({ children }: { children: React.ReactNode }) => {
  const [annotations, setAnnotations] = useState<Record<string, string>>(() =>
    loadFromStorageWithGuard(storageKey, {}, isAnnotationsMap)
  );

  const value = useMemo(
    () => ({
      annotations,
      setAnnotation: (clipId: string, note: string) =>
        setAnnotations((prev) => {
          const next = {
            ...prev,
            [clipId]: note
          };
          saveToStorage(storageKey, next);
          return next;
        }),
      removeAnnotation: (clipId: string) =>
        setAnnotations((prev) => {
          if (!(clipId in prev)) {
            return prev;
          }
          const next = { ...prev };
          delete next[clipId];
          saveToStorage(storageKey, next);
          return next;
        })
    }),
    [annotations]
  );

  return <AnnotationsContext.Provider value={value}>{children}</AnnotationsContext.Provider>;
};

export const useAnnotations = () => {
  const context = useContext(AnnotationsContext);
  if (!context) {
    throw new Error('useAnnotations must be used within AnnotationsProvider');
  }
  return context;
};
