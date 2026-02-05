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
let simulateIngest = true;

let state: LiveSnapshot = {
  liveState: null,
  moments: [],
  updatedAt: null,
  connected: false
};

const listeners = new Set<() => void>();
let intervalId: number | null = null;
let isFetching = false;
let phaseIndex = 0;

const simulatedStates: LiveState[] = [
  {
    minute: '63:10',
    signal: 'High',
    confidence: 0.78,
    clips: 3,
    insights: [
      'Opposition 4-4-2 mid-block, central lanes closed.',
      'Switches to RW isolating fullback 1v1.',
      'Transition risk rising after wide overloads.'
    ]
  },
  {
    minute: '64:20',
    signal: 'Med',
    confidence: 0.66,
    clips: 2,
    insights: [
      'Press intensity drops on their left side.',
      'Our 8 arriving late into half-space pockets.',
      'Second-ball recoveries favor them in zone 14.'
    ]
  },
  {
    minute: '65:15',
    signal: 'High',
    confidence: 0.81,
    clips: 3,
    insights: [
      'Their 9 screening the 6; center access blocked.',
      'Weak-side overload forming after switch.',
      'Counterpress success improving after lost duels.'
    ]
  },
  {
    minute: '66:05',
    signal: 'Med',
    confidence: 0.69,
    clips: 2,
    insights: [
      'Press trigger on their left—trap is available.',
      'Right half-space entry still blocked.',
      'Wide spacing leaving backline exposed.'
    ]
  }
];

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
    const [liveState, moments] = simulateIngest
      ? [simulatedStates[phaseIndex], await api.getMoments()]
      : await Promise.all([api.getLiveState(), api.getMoments()]);
    if (simulateIngest) {
      phaseIndex = (phaseIndex + 1) % simulatedStates.length;
    }
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
  },
  setSimulation(enabled: boolean) {
    simulateIngest = enabled;
    if (listeners.size > 0) {
      fetchSnapshot();
    }
  }
};
