/* @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { clearAfmStorage } from './utils/storage';

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

const advance = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

describe('App smoke', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // On newer Node versions, global `localStorage` is an experimental WebStorage
    // implementation that emits warnings unless configured. Force a deterministic
    // in-memory storage for this integration smoke.
    const memoryStorage = createMemoryStorage();
    Object.defineProperty(window, 'localStorage', {
      value: memoryStorage,
      configurable: true
    });
    Object.defineProperty(globalThis, 'localStorage', {
      value: memoryStorage,
      configurable: true
    });
    window.location.hash = '#analyst';
    clearAfmStorage();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('boots, navigates, and opens a clip modal', async () => {
    render(<App />);

    // Initial fetches in the mock API use small timeouts.
    await advance(2000);

    expect(screen.getByRole('heading', { level: 2, name: 'Analyst Mode' })).toBeTruthy();

    const timelineLabel = 'Press trap fails on right';
    // In CI, React effects may settle slightly later even with fake timers.
    let timelineButton: HTMLElement | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      timelineButton = screen.queryByText(timelineLabel)?.closest('button') ?? null;
      if (timelineButton) {
        break;
      }
      await advance(500);
    }
    expect(timelineButton).not.toBeNull();

    fireEvent.click(timelineButton as HTMLButtonElement);
    await advance(600);

    // Clip title should appear in the ClipModal header.
    expect(
      screen.getByRole('heading', { level: 3, name: 'Press beaten via RB-8 channel' })
    ).toBeTruthy();

    window.location.hash = '#reports';
    window.dispatchEvent(new Event('hashchange'));
    await advance(1000);

    expect(screen.getByText('Recent reports')).toBeTruthy();
  });
});
