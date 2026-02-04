import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/mock';
import type { Clip, Storyboard } from '../types';
import { loadFromStorage, saveToStorage } from '../utils/storage';

interface StoryboardContextValue {
  storyboards: Storyboard[];
  addStoryboard: (title: string, clips: Clip[]) => void;
  renameStoryboard: (id: string, title: string) => void;
  removeStoryboard: (id: string) => void;
}

const storageKey = 'afm.storyboards';

const StoryboardContext = createContext<StoryboardContextValue | undefined>(undefined);

export const StoryboardProvider = ({ children }: { children: React.ReactNode }) => {
  const [storyboards, setStoryboards] = useState<Storyboard[]>(() => loadFromStorage(storageKey, []));

  useEffect(() => {
    if (storyboards.length === 0) {
      api.getStoryboards().then((data) => {
        setStoryboards(data);
      });
    }
  }, [storyboards.length]);

  useEffect(() => {
    saveToStorage(storageKey, storyboards);
  }, [storyboards]);

  const value = useMemo(
    () => ({
      storyboards,
      addStoryboard: (title: string, clips: Clip[]) =>
        setStoryboards((prev) => [
          ...prev,
          {
            id: `sb-${Date.now()}`,
            title,
            clips,
            updated: 'Just now'
          }
        ]),
      renameStoryboard: (id: string, title: string) =>
        setStoryboards((prev) =>
          prev.map((board) => (board.id === id ? { ...board, title, updated: 'Just now' } : board))
        ),
      removeStoryboard: (id: string) =>
        setStoryboards((prev) => prev.filter((board) => board.id !== id))
    }),
    [storyboards]
  );

  return <StoryboardContext.Provider value={value}>{children}</StoryboardContext.Provider>;
};

export const useStoryboards = () => {
  const context = useContext(StoryboardContext);
  if (!context) {
    throw new Error('useStoryboards must be used within StoryboardProvider');
  }
  return context;
};
