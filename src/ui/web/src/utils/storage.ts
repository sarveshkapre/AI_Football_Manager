import { noteStorageClear, noteStorageRemove, noteStorageWrite } from './perf';

const getLocalStorage = (): Storage | null => {
  // Prefer `window.localStorage` when available (browser + happy-dom).
  // Avoid Node's experimental WebStorage global `localStorage`, which can emit warnings
  // (and is not a runtime we target for the app).
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Storage can throw on access in some environments (private mode / policy).
  }
  return null;
};

export const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const storage = getLocalStorage();
    if (!storage) {
      return fallback;
    }
    const raw = storage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const loadFromStorageWithGuard = <T>(
  key: string,
  fallback: T,
  guard: (value: unknown) => value is T
): T => {
  const parsed = loadFromStorage<unknown>(key, fallback);
  return guard(parsed) ? parsed : fallback;
};

export const saveToStorage = (key: string, value: unknown) => {
  try {
    const storage = getLocalStorage();
    if (!storage) {
      return;
    }
    const serialized = JSON.stringify(value);
    storage.setItem(key, serialized);
    noteStorageWrite(key, serialized.length);
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
};

export const removeFromStorage = (key: string) => {
  try {
    const storage = getLocalStorage();
    if (!storage) {
      return;
    }
    storage.removeItem(key);
    noteStorageRemove(key);
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
};

export const clearAfmStorage = () => {
  try {
    const storage = getLocalStorage();
    if (!storage) {
      return;
    }
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key && key.startsWith('afm.')) {
        keys.push(key);
      }
    }
    keys.forEach((key) => storage.removeItem(key));
    noteStorageClear(keys);
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
};
