import { createContext, useContext, useMemo, useState } from 'react';
import type { Clip } from '../types';

interface ClipContextValue {
  clip: Clip | null;
  openClip: (clip: Clip) => void;
  closeClip: () => void;
}

const ClipContext = createContext<ClipContextValue | undefined>(undefined);

export const ClipProvider = ({ children }: { children: React.ReactNode }) => {
  const [clip, setClip] = useState<Clip | null>(null);

  const value = useMemo(
    () => ({
      clip,
      openClip: (nextClip: Clip) => setClip(nextClip),
      closeClip: () => setClip(null)
    }),
    [clip]
  );

  return <ClipContext.Provider value={value}>{children}</ClipContext.Provider>;
};

export const useClipContext = () => {
  const context = useContext(ClipContext);
  if (!context) {
    throw new Error('useClipContext must be used within ClipProvider');
  }
  return context;
};
