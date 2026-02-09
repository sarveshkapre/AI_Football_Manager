import type { SavedSearch } from '../types';

const maxSavedSearches = 20;

const normalize = (value: string) => value.trim().toLowerCase();

const recencyValue = (search: SavedSearch) => {
  const parsed = Date.parse(search.lastUsedAt ?? search.createdAt);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const orderSavedSearchesByRecency = (items: SavedSearch[]) =>
  [...items].sort((a, b) => recencyValue(b) - recencyValue(a));

export const upsertSavedSearch = (
  prev: SavedSearch[],
  input: { name: string; query: string; tag: string | null; now?: string }
) => {
  const now = input.now ?? new Date().toISOString();
  const trimmedName = input.name.trim();
  const nameKey = normalize(trimmedName);
  const queryKey = normalize(input.query);
  const tagKey = input.tag ? normalize(input.tag) : null;

  const matchIndex = prev.findIndex((item) => {
    if (normalize(item.name) === nameKey) {
      return true;
    }
    const itemQueryKey = normalize(item.query);
    const itemTagKey = item.tag ? normalize(item.tag) : null;
    return itemQueryKey === queryKey && itemTagKey === tagKey;
  });

  const next = [...prev];

  if (matchIndex >= 0) {
    const existing = next[matchIndex];
    next.splice(matchIndex, 1);
    next.unshift({
      ...existing,
      name: trimmedName,
      query: input.query,
      tag: input.tag,
      lastUsedAt: now
    });
    return next.slice(0, maxSavedSearches);
  }

  return [
    {
      id: `search-${Date.now()}`,
      name: trimmedName,
      query: input.query,
      tag: input.tag,
      createdAt: now,
      lastUsedAt: now
    },
    ...next
  ].slice(0, maxSavedSearches);
};

export const touchSavedSearch = (prev: SavedSearch[], id: string, now?: string) => {
  const index = prev.findIndex((item) => item.id === id);
  if (index < 0) {
    return prev;
  }
  const stamp = now ?? new Date().toISOString();
  const next = [...prev];
  const current = next[index];
  next.splice(index, 1);
  next.unshift({ ...current, lastUsedAt: stamp });
  return next;
};

