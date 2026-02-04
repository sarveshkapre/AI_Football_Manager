import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';

type Density = 'standard' | 'compact';

interface UiContextValue {
  density: Density;
  setDensity: (density: Density) => void;
}

const storageKey = 'afm.uiDensity';

const UiContext = createContext<UiContextValue | undefined>(undefined);

export const UiProvider = ({ children }: { children: React.ReactNode }) => {
  const [density, setDensityState] = useState<Density>(() => loadFromStorage(storageKey, 'standard'));

  useEffect(() => {
    saveToStorage(storageKey, density);
  }, [density]);

  const value = useMemo(
    () => ({
      density,
      setDensity: (next: Density) => setDensityState(next)
    }),
    [density]
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
};

export const useUi = () => {
  const context = useContext(UiContext);
  if (!context) {
    throw new Error('useUi must be used within UiProvider');
  }
  return context;
};
