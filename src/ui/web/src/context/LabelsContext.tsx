import { createContext, useContext, useMemo, useState } from 'react';
import { isLabelsMap } from '../utils/guards';
import { loadFromStorageWithGuard, saveToStorage } from '../utils/storage';

interface LabelsContextValue {
  labels: Record<string, string[]>;
  addLabel: (clipId: string, label: string) => void;
  removeLabel: (clipId: string, label: string) => void;
}

const storageKey = 'afm.labels';

const LabelsContext = createContext<LabelsContextValue | undefined>(undefined);

export const LabelsProvider = ({ children }: { children: React.ReactNode }) => {
  const [labels, setLabels] = useState<Record<string, string[]>>(() =>
    loadFromStorageWithGuard(storageKey, {}, isLabelsMap)
  );

  const value = useMemo(
    () => ({
      labels,
      addLabel: (clipId: string, label: string) => {
        setLabels((prev) => {
          const existing = prev[clipId] ?? [];
          if (existing.includes(label)) {
            return prev;
          }
          const next = {
            ...prev,
            [clipId]: [...existing, label]
          };
          saveToStorage(storageKey, next);
          return next;
        });
      },
      removeLabel: (clipId: string, label: string) =>
        setLabels((prev) => {
          const existing = prev[clipId] ?? [];
          const next = {
            ...prev,
            [clipId]: existing.filter((item) => item !== label)
          };
          saveToStorage(storageKey, next);
          return next;
        })
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
