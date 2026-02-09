type KeyPerf = { writes: number; removes: number; bytes: number; lastAt: number | null };

interface StoragePerfState {
  totalWrites: number;
  totalRemoves: number;
  totalBytes: number;
  byKey: Record<string, KeyPerf>;
}

const globalKey = '__afmPerf';

const getState = (): StoragePerfState => {
  const g = globalThis as unknown as Record<string, unknown>;
  const existing = g[globalKey];
  if (existing && typeof existing === 'object') {
    return existing as StoragePerfState;
  }
  const fresh: StoragePerfState = {
    totalWrites: 0,
    totalRemoves: 0,
    totalBytes: 0,
    byKey: {}
  };
  g[globalKey] = fresh;
  return fresh;
};

const ensureKey = (state: StoragePerfState, key: string): KeyPerf => {
  const existing = state.byKey[key];
  if (existing) {
    return existing;
  }
  const fresh: KeyPerf = { writes: 0, removes: 0, bytes: 0, lastAt: null };
  state.byKey[key] = fresh;
  return fresh;
};

export const noteStorageWrite = (key: string, bytes: number) => {
  // Keep this extremely cheap; it runs on every persisted write.
  try {
    const state = getState();
    state.totalWrites += 1;
    state.totalBytes += Math.max(0, bytes);
    const perf = ensureKey(state, key);
    perf.writes += 1;
    perf.bytes += Math.max(0, bytes);
    perf.lastAt = Date.now();
  } catch {
    // Do not let perf counters break storage.
  }
};

export const noteStorageRemove = (key: string) => {
  try {
    const state = getState();
    state.totalRemoves += 1;
    const perf = ensureKey(state, key);
    perf.removes += 1;
    perf.lastAt = Date.now();
  } catch {
    // Ignore.
  }
};

export const noteStorageClear = (keys: string[]) => {
  try {
    const state = getState();
    state.totalRemoves += keys.length;
    keys.forEach((key) => {
      const perf = ensureKey(state, key);
      perf.removes += 1;
      perf.lastAt = Date.now();
    });
  } catch {
    // Ignore.
  }
};

export interface StoragePerfSnapshot {
  totalWrites: number;
  totalRemoves: number;
  totalBytes: number;
  keys: Array<{ key: string; writes: number; removes: number; bytes: number; lastAt: number | null }>;
}

export const getStoragePerfSnapshot = (): StoragePerfSnapshot => {
  const state = getState();
  const keys = Object.entries(state.byKey)
    .map(([key, perf]) => ({ key, ...perf }))
    .sort((a, b) => b.writes - a.writes || b.bytes - a.bytes);

  return {
    totalWrites: state.totalWrites,
    totalRemoves: state.totalRemoves,
    totalBytes: state.totalBytes,
    keys
  };
};

export const resetStoragePerf = () => {
  const g = globalThis as unknown as Record<string, unknown>;
  g[globalKey] = {
    totalWrites: 0,
    totalRemoves: 0,
    totalBytes: 0,
    byKey: {}
  } satisfies StoragePerfState;
};

