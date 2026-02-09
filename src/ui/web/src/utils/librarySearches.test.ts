import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SavedSearch } from '../types';
import { orderSavedSearchesByRecency, touchSavedSearch, upsertSavedSearch } from './librarySearches';

describe('librarySearches', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds a new saved search at the front', () => {
    vi.spyOn(Date, 'now').mockReturnValueOnce(1000);
    const next = upsertSavedSearch([], {
      name: 'My press trap',
      query: 'press',
      tag: 'trap',
      now: '2026-02-09T10:00:00.000Z'
    });
    expect(next).toHaveLength(1);
    expect(next[0].name).toBe('My press trap');
    expect(next[0].lastUsedAt).toBe('2026-02-09T10:00:00.000Z');
  });

  it('deduplicates by name (case-insensitive) and bumps recency', () => {
    const prev: SavedSearch[] = [
      {
        id: 'search-1',
        name: 'Transitions',
        query: 'transition',
        tag: null,
        createdAt: '2026-02-08T10:00:00.000Z',
        lastUsedAt: '2026-02-08T10:00:00.000Z'
      }
    ];

    const next = upsertSavedSearch(prev, {
      name: '  transitions  ',
      query: 'counter',
      tag: 'wide',
      now: '2026-02-09T10:00:00.000Z'
    });

    expect(next).toHaveLength(1);
    expect(next[0].id).toBe('search-1');
    expect(next[0].query).toBe('counter');
    expect(next[0].tag).toBe('wide');
    expect(next[0].lastUsedAt).toBe('2026-02-09T10:00:00.000Z');
  });

  it('deduplicates by query+tag when name differs', () => {
    const prev: SavedSearch[] = [
      {
        id: 'search-1',
        name: 'Left overloads',
        query: 'overload',
        tag: 'left',
        createdAt: '2026-02-08T10:00:00.000Z'
      }
    ];

    const next = upsertSavedSearch(prev, {
      name: 'Same search different label',
      query: 'OVERLOAD',
      tag: 'Left',
      now: '2026-02-09T10:00:00.000Z'
    });

    expect(next).toHaveLength(1);
    expect(next[0].id).toBe('search-1');
    expect(next[0].name).toBe('Same search different label');
  });

  it('touch moves a saved search to the front and bumps lastUsedAt', () => {
    const prev: SavedSearch[] = [
      {
        id: 'a',
        name: 'A',
        query: 'a',
        tag: null,
        createdAt: '2026-02-08T10:00:00.000Z'
      },
      {
        id: 'b',
        name: 'B',
        query: 'b',
        tag: null,
        createdAt: '2026-02-08T10:00:00.000Z'
      }
    ];

    const next = touchSavedSearch(prev, 'b', '2026-02-09T10:00:00.000Z');
    expect(next[0].id).toBe('b');
    expect(next[0].lastUsedAt).toBe('2026-02-09T10:00:00.000Z');
  });

  it('orders by recency (lastUsedAt preferred, otherwise createdAt)', () => {
    const prev: SavedSearch[] = [
      {
        id: 'a',
        name: 'A',
        query: 'a',
        tag: null,
        createdAt: '2026-02-08T10:00:00.000Z',
        lastUsedAt: '2026-02-08T10:00:00.000Z'
      },
      {
        id: 'b',
        name: 'B',
        query: 'b',
        tag: null,
        createdAt: '2026-02-09T10:00:00.000Z'
      }
    ];

    const ordered = orderSavedSearchesByRecency(prev);
    expect(ordered[0].id).toBe('b');
  });

  it('caps saved searches to max size', () => {
    const nowSpy = vi.spyOn(Date, 'now');
    let state: SavedSearch[] = [];
    for (let i = 0; i < 25; i += 1) {
      nowSpy.mockReturnValueOnce(1000 + i);
      state = upsertSavedSearch(state, {
        name: `S${i}`,
        query: `q${i}`,
        tag: null,
        now: `2026-02-09T10:00:${String(i).padStart(2, '0')}.000Z`
      });
    }
    expect(state.length).toBeLessThanOrEqual(20);
  });
});
