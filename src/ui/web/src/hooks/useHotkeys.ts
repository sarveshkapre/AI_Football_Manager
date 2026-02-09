import { useEffect, useRef } from 'react';

interface HotkeyOptions {
  onCoach: () => void;
  onAnalyst: () => void;
  onLibrary: () => void;
  onReports: () => void;
  onIngest: () => void;
  onSearch: () => void;
}

const isInputElement = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  );
};

export const useHotkeys = (options: HotkeyOptions) => {
  const latest = useRef(options);

  useEffect(() => {
    latest.current = options;
  }, [options]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (isInputElement(event.target)) {
        return;
      }

      if (event.key === 'c' || event.key === 'C') {
        latest.current.onCoach();
      }
      if (event.key === 'a' || event.key === 'A') {
        latest.current.onAnalyst();
      }
      if (event.key === 'l' || event.key === 'L') {
        latest.current.onLibrary();
      }
      if (event.key === 'r' || event.key === 'R') {
        latest.current.onReports();
      }
      if (event.key === 'u' || event.key === 'U') {
        latest.current.onIngest();
      }
      if (event.key === '/') {
        event.preventDefault();
        latest.current.onSearch();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
};
