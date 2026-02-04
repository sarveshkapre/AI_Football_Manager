import { createContext, useContext, useMemo, useState } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';

interface LabelsContextValue {
  labels: Record<string, string[]>;
  addLabel: (clipId: string, label: string) => void;
  removeLabel: (clipId: string, label: string) => void;
}

const storageKey = 'afm.labels';

const LabelsContext = createContext<LabelsContextValue | undefined>(undefined);

export const LabelsProvider = ({ children }: { children: React.ReactNode }) => {
  const [labels, setLabels] = useState<Record<string, string[]>>(() =>
    loadFromStorage(storageKey, {})
  );

  const persist = (next: Record<string, string[]>) => {
    setLabels(next);
    saveToStorage(storageKey, next);
  };

  const value = useMemo(
    () => ({
      labels,
      addLabel: (clipId: string, label: string) => {
        const existing = labels[clipId] ?? [];
        if (existing.includes(label)) {
          return;
        }
        persist({
          ...labels,
          [clipId]: [...existing, label]
        });
      },
      removeLabel: (clipId: string, label: string) => {
        const existing = labels[clipId] ?? [];
        persist({
          ...labels,
          [clipId]: existing.filter((item) => item !== label)
        });
      }
    }),
    [labels]
  );

  return <LabelsContext.Provider value={value}>{children}</LabelsContext.Provider>;
};

export const useLabels = () => {
  const context = useContext(LabelsContext);
  if (!context) {
    throw new Error('useLabels must be used within LabelsProvider');
  }
  return context;
};
