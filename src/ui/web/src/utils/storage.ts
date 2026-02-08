export const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
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
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
};
