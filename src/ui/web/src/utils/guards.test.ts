import { describe, expect, it } from 'vitest';
import {
  isAccessState,
  isAnalystTimelineFilters,
  isClipArray,
  isNullableString,
  isPreferencesState,
  isSavedSearchArray,
  isStaffInviteArray
} from './guards';

describe('storage guards', () => {
  it('validates preference shape', () => {
    expect(
      isPreferencesState({
        notificationCadence: 60,
        autoRefresh: true,
        ingestSimulation: false
      })
    ).toBe(true);
    expect(
      isPreferencesState({
        notificationCadence: 10,
        autoRefresh: true,
        ingestSimulation: false
      })
    ).toBe(false);
  });

  it('validates full access state keys', () => {
    expect(
      isAccessState({
        coach: true,
        analyst: true,
        library: true,
        reports: true,
        ingest: true,
        settings: true,
        draft: true
      })
    ).toBe(true);
    expect(
      isAccessState({
        coach: true
      })
    ).toBe(false);
  });

  it('validates clip arrays', () => {
    expect(
      isClipArray([
        {
          id: 'clip-1',
          title: 'Press beaten',
          duration: '0:12',
          tags: ['press'],
          overlays: [{ id: 'o1', label: 'Spacing box', enabled: true }]
        }
      ])
    ).toBe(true);
    expect(
      isClipArray([
        {
          id: 'clip-1',
          title: 'Press beaten',
          duration: '0:12',
          tags: ['press'],
          overlays: [{ id: 'o1', label: 'Spacing box', enabled: 'yes' }]
        }
      ])
    ).toBe(false);
  });

  it('validates saved search array and nullable strings', () => {
    expect(
      isSavedSearchArray([
        {
          id: 'search-1',
          name: 'Press moments',
          query: 'press',
          tag: 'press',
          createdAt: '2026-02-08'
        }
      ])
    ).toBe(true);
    expect(isSavedSearchArray([{ id: 'search-1' }])).toBe(false);
    expect(isNullableString('segment-1')).toBe(true);
    expect(isNullableString(null)).toBe(true);
    expect(isNullableString(42)).toBe(false);
  });

  it('validates analyst timeline filters', () => {
    expect(isAnalystTimelineFilters({ query: '', activeTag: null, minConfidence: 0 })).toBe(true);
    expect(isAnalystTimelineFilters({ query: 'press', activeTag: 'press', minConfidence: 0.7 })).toBe(
      true
    );
    expect(isAnalystTimelineFilters({ query: 'x', activeTag: null, minConfidence: 2 })).toBe(false);
    expect(isAnalystTimelineFilters({ query: 1, activeTag: null, minConfidence: 0 })).toBe(false);
  });

  it('validates staff invites', () => {
    expect(
      isStaffInviteArray([
        { id: 'invite-1', email: 'coach@club.com', role: 'Coach bench', invitedAt: '2026-02-09' }
      ])
    ).toBe(true);
    expect(isStaffInviteArray([{ id: 'invite-1' }])).toBe(false);
    expect(
      isStaffInviteArray([
        { id: 'invite-1', email: 'coach@club.com', role: 'Unknown', invitedAt: '2026-02-09' }
      ])
    ).toBe(false);
  });
});
