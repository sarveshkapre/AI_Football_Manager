import { createContext, useContext, useMemo, useState } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';

export interface Annotation {
  clipId: string;
  note: string;
}

interface AnnotationsContextValue {
  annotations: Record<string, Annotation>;
  setAnnotation: (clipId: string, note: string) => void;
  removeAnnotation: (clipId: string) => void;
}

const storageKey = 'afm.annotations';

const AnnotationsContext = createContext<AnnotationsContextValue | undefined>(undefined);

export const AnnotationsProvider = ({ children }: { children: React.ReactNode }) => {
  const [annotations, setAnnotations] = useState<Record<string, Annotation>>(() =>
    loadFromStorage(storageKey, {})
  );

  const persist = (next: Record<string, Annotation>) => {
    setAnnotations(next);
    saveToStorage(storageKey, next);
  };

  const value = useMemo(
    () => ({
      annotations,
      setAnnotation: (clipId: string, note: string) =>
        persist({
          ...annotations,
          [clipId]: { clipId, note }
        }),
      removeAnnotation: (clipId: string) => {
        const next = { ...annotations };
        delete next[clipId];
        persist(next);
      }
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
