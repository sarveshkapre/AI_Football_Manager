import { api } from '../api/mock';
import type { LiveState, Moment } from '../types';

export interface LiveSnapshot {
  liveState: LiveState | null;
  moments: Moment[];
  updatedAt: string | null;
  connected: boolean;
}

let refreshIntervalMs = 45000;
let autoRefresh = true;

let state: LiveSnapshot = {
  liveState: null,
  moments: [],
  updatedAt: null,
  connected: false
};

const listeners = new Set<() => void>();
let intervalId: number | null = null;
let isFetching = false;

const emit = () => {
  listeners.forEach((listener) => listener());
};

const setState = (partial: Partial<LiveSnapshot>) => {
  state = { ...state, ...partial };
  emit();
};

const fetchSnapshot = async () => {
  if (isFetching) {
    return;
  }
  isFetching = true;
  try {
    const [liveState, moments] = await Promise.all([api.getLiveState(), api.getMoments()]);
    setState({
      liveState,
      moments,
      updatedAt: new Date().toISOString(),
      connected: true
    });
  } catch {
    setState({ connected: false });
  } finally {
    isFetching = false;
  }
};

const startInterval = () => {
  if (intervalId) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
  if (!autoRefresh) {
    return;
  }
  intervalId = window.setInterval(fetchSnapshot, refreshIntervalMs);
};

export const liveStore = {
  getState() {
    return state;
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    if (listeners.size === 1) {
      fetchSnapshot();
      startInterval();
    }

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && intervalId) {
        window.clearInterval(intervalId);
        intervalId = null;
        setState({ connected: false });
      }
    };
  },
  setAutoRefresh(enabled: boolean) {
    autoRefresh = enabled;
    if (listeners.size > 0) {
      startInterval();
    }
  },
  setRefreshInterval(ms: number) {
    refreshIntervalMs = ms;
    if (listeners.size > 0) {
      startInterval();
    }
  }
};
