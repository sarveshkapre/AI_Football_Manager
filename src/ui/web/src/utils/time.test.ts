import { describe, expect, it } from 'vitest';
import { clockToSeconds, durationToSeconds, formatDuration } from './time';

describe('time utils', () => {
  it('parses duration strings', () => {
    expect(durationToSeconds('1:30')).toBe(90);
    expect(durationToSeconds('01:02:03')).toBe(3723);
  });

  it('returns zero for invalid duration strings', () => {
    expect(durationToSeconds('')).toBe(0);
    expect(durationToSeconds('12:88')).toBe(0);
    expect(durationToSeconds('abc')).toBe(0);
  });

  it('parses clock values and rejects invalid ranges', () => {
    expect(clockToSeconds('63:10')).toBe(3790);
    expect(clockToSeconds('01:03:05')).toBe(3785);
    expect(clockToSeconds('63:72')).toBeNull();
    expect(clockToSeconds('bad-input')).toBeNull();
  });

  it('formats duration consistently', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(615)).toBe('10:15');
  });
});
