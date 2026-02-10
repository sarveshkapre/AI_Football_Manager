export interface AfmBackupPayloadV1 {
  version: 1;
  createdAt: string;
  entries: Record<string, string>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export class BackupImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupImportError';
  }
}

export const isAfmStorageKey = (key: string) => key.startsWith('afm.');

export const createAfmBackupV1 = (storage: Storage): AfmBackupPayloadV1 => {
  const entries: Record<string, string> = {};
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (!key || !isAfmStorageKey(key)) {
      continue;
    }
    const value = storage.getItem(key);
    if (typeof value === 'string') {
      entries[key] = value;
    }
  }

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    entries
  };
};

export const serializeAfmBackup = (payload: AfmBackupPayloadV1) => JSON.stringify(payload, null, 2);

export const parseAfmBackup = (text: string): AfmBackupPayloadV1 => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new BackupImportError('Invalid JSON: could not parse backup file.');
  }

  if (!isRecord(parsed) || parsed.version !== 1) {
    throw new BackupImportError('Unrecognized backup format. Expected version 1 payload.');
  }

  const createdAt = parsed.createdAt;
  const entries = parsed.entries;
  if (typeof createdAt !== 'string' || !isRecord(entries)) {
    throw new BackupImportError('Backup is missing required fields.');
  }

  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (!isAfmStorageKey(key)) {
      continue;
    }
    if (typeof value === 'string') {
      normalized[key] = value;
    }
  }

  return {
    version: 1,
    createdAt,
    entries: normalized
  };
};

export const restoreAfmBackup = (storage: Storage, payload: AfmBackupPayloadV1) => {
  const removeKeys: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key && isAfmStorageKey(key)) {
      removeKeys.push(key);
    }
  }

  removeKeys.forEach((key) => storage.removeItem(key));

  // Restore raw JSON strings to preserve exact serialization across versions.
  Object.entries(payload.entries).forEach(([key, raw]) => {
    if (!isAfmStorageKey(key)) {
      return;
    }
    storage.setItem(key, raw);
  });
};

