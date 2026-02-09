/* @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

const advance = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms);
  // React state updates from resolved promises settle on the microtask queue.
  await Promise.resolve();
};

describe('App smoke', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.location.hash = '#analyst';
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key) {
          keys.push(key);
        }
      }
      keys.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Best-effort cleanup; storage can be unavailable in some environments.
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('boots, navigates, and opens a clip modal', async () => {
    render(<App />);

    // Initial fetches in the mock API use small timeouts.
    await advance(1200);

    expect(screen.getByRole('heading', { level: 2, name: 'Analyst Mode' })).toBeTruthy();

    const timelineLabel = 'Press trap fails on right';
    const timelineButton = screen.getByText(timelineLabel).closest('button');
    expect(timelineButton).not.toBeNull();

    fireEvent.click(timelineButton as HTMLButtonElement);
    await advance(600);

    // Clip title should appear in the ClipModal header.
    expect(screen.getByText('Press beaten via RB-8 channel')).toBeTruthy();

    window.location.hash = '#reports';
    window.dispatchEvent(new Event('hashchange'));
    await advance(1000);

    expect(screen.getByText('Recent reports')).toBeTruthy();
  });
});
