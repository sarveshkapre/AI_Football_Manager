import { describe, expect, it } from 'vitest';
import {
  BackupImportError,
  createAfmBackupV1,
  isAfmStorageKey,
  parseAfmBackup,
  restoreAfmBackup,
  serializeAfmBackup
} from './backup';

const createMemoryStorage = (): Storage => {
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

describe('backup utilities', () => {
  it('filters to afm.* keys', () => {
    const storage = createMemoryStorage();
    storage.setItem('afm.preferences', '{"notificationCadence":60}');
    storage.setItem('afm.reportQueue', '[]');
    storage.setItem('unrelated.key', 'nope');

    const backup = createAfmBackupV1(storage);
    expect(backup.version).toBe(1);
    expect(Object.keys(backup.entries).sort()).toEqual(['afm.preferences', 'afm.reportQueue']);
  });

  it('parses and normalizes only afm.* entries', () => {
    const text = JSON.stringify({
      version: 1,
      createdAt: '2026-02-10T00:00:00.000Z',
      entries: {
        'afm.a': '1',
        'not-afm': '2',
        'afm.b': '3'
      }
    });

    const parsed = parseAfmBackup(text);
    expect(Object.keys(parsed.entries).sort()).toEqual(['afm.a', 'afm.b']);
  });

  it('rejects invalid JSON', () => {
    expect(() => parseAfmBackup('{')).toThrowError(BackupImportError);
  });

  it('rejects wrong schema', () => {
    const text = JSON.stringify({ version: 2 });
    expect(() => parseAfmBackup(text)).toThrowError(BackupImportError);
  });

  it('restores by clearing existing afm.* keys and leaving others', () => {
    const storage = createMemoryStorage();
    storage.setItem('afm.old', 'x');
    storage.setItem('keep.me', 'y');

    const payload = parseAfmBackup(
      JSON.stringify({
        version: 1,
        createdAt: '2026-02-10T00:00:00.000Z',
        entries: { 'afm.new': '{"ok":true}' }
      })
    );

    restoreAfmBackup(storage, payload);

    expect(storage.getItem('afm.old')).toBeNull();
    expect(storage.getItem('afm.new')).toBe('{"ok":true}');
    expect(storage.getItem('keep.me')).toBe('y');
  });

  it('isAfmStorageKey is strict about prefix', () => {
    expect(isAfmStorageKey('afm.x')).toBe(true);
    expect(isAfmStorageKey('afm')).toBe(false);
    expect(isAfmStorageKey('x.afm.y')).toBe(false);
  });

  it('serializes to stable JSON', () => {
    const storage = createMemoryStorage();
    storage.setItem('afm.a', '1');
    const backup = createAfmBackupV1(storage);
    const serialized = serializeAfmBackup(backup);
    const roundTrip = parseAfmBackup(serialized);
    expect(roundTrip.entries).toEqual({ 'afm.a': '1' });
  });
});

