import { useEffect } from 'react';

interface HotkeyOptions {
  onCoach: () => void;
  onAnalyst: () => void;
  onLibrary: () => void;
  onReports: () => void;
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
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (isInputElement(event.target)) {
        return;
      }

      if (event.key === 'c' || event.key === 'C') {
        options.onCoach();
      }
      if (event.key === 'a' || event.key === 'A') {
        options.onAnalyst();
      }
      if (event.key === 'l' || event.key === 'L') {
        options.onLibrary();
      }
      if (event.key === 'r' || event.key === 'R') {
        options.onReports();
      }
      if (event.key === '/') {
        event.preventDefault();
        options.onSearch();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [options]);
};
