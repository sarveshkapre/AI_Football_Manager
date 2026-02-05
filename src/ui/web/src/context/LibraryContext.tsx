import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { SavedSearch } from '../types';
import { loadFromStorage, saveToStorage } from '../utils/storage';

interface LibraryContextValue {
  savedSearches: SavedSearch[];
  addSearch: (name: string, query: string, tag: string | null) => void;
  removeSearch: (id: string) => void;
}

const storageKey = 'afm.savedSearches';

const LibraryContext = createContext<LibraryContextValue | undefined>(undefined);

export const LibraryProvider = ({ children }: { children: React.ReactNode }) => {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() =>
    loadFromStorage(storageKey, [])
  );

  useEffect(() => {
    saveToStorage(storageKey, savedSearches);
  }, [savedSearches]);

  const value = useMemo(
    () => ({
      savedSearches,
      addSearch: (name: string, query: string, tag: string | null) =>
        setSavedSearches((prev) => [
          ...prev,
          {
            id: `search-${Date.now()}`,
            name,
            query,
            tag,
            createdAt: new Date().toLocaleDateString()
          }
        ]),
      removeSearch: (id: string) =>
        setSavedSearches((prev) => prev.filter((search) => search.id !== id))
    }),
    [savedSearches]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within LibraryProvider');
  }
  return context;
};
