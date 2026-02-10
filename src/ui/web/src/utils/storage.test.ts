import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { clearAfmStorage, loadFromStorage, removeFromStorage, saveToStorage } from './storage';

const createMockStorage = () => {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    key(index: number) {
      return Array.from(data.keys())[index] ?? null;
    },
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
    removeItem(key: string) {
      data.delete(key);
    },
    clear() {
      data.clear();
    }
  } as unknown as Storage;
};

describe('storage', () => {
  const originalWindow = (globalThis as unknown as { window?: unknown }).window;

  beforeEach(() => {
    delete (globalThis as unknown as { window?: unknown }).window;
  });

  afterEach(() => {
    (globalThis as unknown as { window?: unknown }).window = originalWindow;
  });

  it('returns fallbacks and no-ops when window/localStorage are unavailable', () => {
    expect(loadFromStorage('afm.missing', 123)).toBe(123);
    expect(() => saveToStorage('afm.key', { ok: true })).not.toThrow();
    expect(() => removeFromStorage('afm.key')).not.toThrow();
    expect(() => clearAfmStorage()).not.toThrow();
  });

  it('uses window.localStorage when available and clears only afm.* keys', () => {
    const storage = createMockStorage();
    (globalThis as unknown as { window?: { localStorage: Storage } }).window = { localStorage: storage };

    saveToStorage('afm.alpha', { value: 1 });
    saveToStorage('other.beta', { value: 2 });

    expect(loadFromStorage('afm.alpha', null)).toEqual({ value: 1 });
    expect(loadFromStorage('other.beta', null)).toEqual({ value: 2 });

    clearAfmStorage();

    expect(loadFromStorage('afm.alpha', null)).toBeNull();
    expect(loadFromStorage('other.beta', null)).toEqual({ value: 2 });
  });
});

