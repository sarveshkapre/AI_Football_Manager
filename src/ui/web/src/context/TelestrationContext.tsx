import { createContext, useContext, useMemo, useState } from 'react';
import { isTelestrationMap } from '../utils/guards';
import { loadFromStorageWithGuard, saveToStorage } from '../utils/storage';

export type TelestrationTool = 'freehand' | 'arrow';

export interface TelestrationPoint {
  x: number; // normalized [0..1]
  y: number; // normalized [0..1]
}

export interface TelestrationStroke {
  id: string;
  tool: TelestrationTool;
  color: string;
  width: number;
  points: TelestrationPoint[];
}

export type TelestrationMap = Record<string, TelestrationStroke[]>;

interface TelestrationContextValue {
  strokesByClip: TelestrationMap;
  addStroke: (clipId: string, stroke: TelestrationStroke) => void;
  undoStroke: (clipId: string) => void;
  clearStrokes: (clipId: string) => void;
  replaceStrokesForClips: (clipIds: string[], nextStrokes: TelestrationMap) => void;
}

const storageKey = 'afm.telestration';

const TelestrationContext = createContext<TelestrationContextValue | undefined>(undefined);

export const TelestrationProvider = ({ children }: { children: React.ReactNode }) => {
  const [strokesByClip, setStrokesByClip] = useState<TelestrationMap>(() =>
    loadFromStorageWithGuard(storageKey, {}, isTelestrationMap)
  );

  const value = useMemo(
    () => ({
      strokesByClip,
      addStroke: (clipId: string, stroke: TelestrationStroke) =>
        setStrokesByClip((prev) => {
          const existing = prev[clipId] ?? [];
          const next = {
            ...prev,
            [clipId]: [...existing, stroke].slice(-50)
          };
          saveToStorage(storageKey, next);
          return next;
        }),
      undoStroke: (clipId: string) =>
        setStrokesByClip((prev) => {
          const existing = prev[clipId] ?? [];
          if (existing.length === 0) {
            return prev;
          }
          const next = {
            ...prev,
            [clipId]: existing.slice(0, -1)
          };
          saveToStorage(storageKey, next);
          return next;
        }),
      clearStrokes: (clipId: string) =>
        setStrokesByClip((prev) => {
          if (!(clipId in prev)) {
            return prev;
          }
          const next = { ...prev };
          delete next[clipId];
          saveToStorage(storageKey, next);
          return next;
        }),
      replaceStrokesForClips: (clipIds: string[], nextStrokes: TelestrationMap) =>
        setStrokesByClip((prev) => {
          if (clipIds.length === 0) {
            return prev;
          }
          const next = { ...prev };
          clipIds.forEach((clipId) => {
            const imported = nextStrokes[clipId];
            if (Array.isArray(imported) && imported.length > 0) {
              next[clipId] = imported;
            } else if (clipId in next) {
              delete next[clipId];
            }
          });
          saveToStorage(storageKey, next);
          return next;
        })
    }),
    [strokesByClip]
  );

  return <TelestrationContext.Provider value={value}>{children}</TelestrationContext.Provider>;
};

export const useTelestration = () => {
  const context = useContext(TelestrationContext);
  if (!context) {
    throw new Error('useTelestration must be used within TelestrationProvider');
  }
  return context;
};
