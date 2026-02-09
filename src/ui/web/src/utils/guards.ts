import type { AnalystTimelineFilters, Clip, OverlayToggle, SavedSearch, Storyboard } from '../types';
import type { AccessState } from '../context/AccessContext';
import type { AuditEvent } from '../context/AuditContext';
import type { StaffInvite } from '../context/InvitesContext';

type PreferenceCadence = 30 | 60 | 90;

export interface PreferencesState {
  notificationCadence: PreferenceCadence;
  autoRefresh: boolean;
  ingestSimulation: boolean;
}

const accessKeys = [
  'coach',
  'analyst',
  'library',
  'reports',
  'ingest',
  'settings',
  'draft'
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isOverlayToggle = (value: unknown): value is OverlayToggle =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.label === 'string' &&
  typeof value.enabled === 'boolean';

const isClip = (value: unknown): value is Clip =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.title === 'string' &&
  typeof value.duration === 'string' &&
  isStringArray(value.tags) &&
  Array.isArray(value.overlays) &&
  value.overlays.every(isOverlayToggle);

const isSavedSearch = (value: unknown): value is SavedSearch =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  typeof value.query === 'string' &&
  (typeof value.tag === 'string' || value.tag === null) &&
  typeof value.createdAt === 'string' &&
  (typeof value.lastUsedAt === 'undefined' || typeof value.lastUsedAt === 'string');

const isStoryboard = (value: unknown): value is Storyboard =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.title === 'string' &&
  typeof value.updated === 'string' &&
  Array.isArray(value.clips) &&
  value.clips.every(isClip);

const isAuditEvent = (value: unknown): value is AuditEvent =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.timestamp === 'string' &&
  typeof value.action === 'string' &&
  typeof value.detail === 'string';

export const isPreferencesState = (value: unknown): value is PreferencesState =>
  isRecord(value) &&
  (value.notificationCadence === 30 ||
    value.notificationCadence === 60 ||
    value.notificationCadence === 90) &&
  typeof value.autoRefresh === 'boolean' &&
  typeof value.ingestSimulation === 'boolean';

export const isAccessState = (value: unknown): value is AccessState =>
  isRecord(value) &&
  accessKeys.every((key) => typeof value[key] === 'boolean');

export const isClipArray = (value: unknown): value is Clip[] =>
  Array.isArray(value) && value.every(isClip);

export const isSavedSearchArray = (value: unknown): value is SavedSearch[] =>
  Array.isArray(value) && value.every(isSavedSearch);

export const isStoryboardArray = (value: unknown): value is Storyboard[] =>
  Array.isArray(value) && value.every(isStoryboard);

export const isAuditEventArray = (value: unknown): value is AuditEvent[] =>
  Array.isArray(value) && value.every(isAuditEvent);

export const isDensity = (value: unknown): value is 'standard' | 'compact' =>
  value === 'standard' || value === 'compact';

export const isLabelsMap = (value: unknown): value is Record<string, string[]> =>
  isRecord(value) && Object.values(value).every(isStringArray);

export const isAnnotationsMap = (value: unknown): value is Record<string, string> =>
  isRecord(value) && Object.values(value).every((entry) => typeof entry === 'string');

export const isNullableString = (value: unknown): value is string | null =>
  typeof value === 'string' || value === null;

export const isAnalystTimelineFilters = (value: unknown): value is AnalystTimelineFilters =>
  isRecord(value) &&
  typeof value.query === 'string' &&
  isNullableString(value.activeTag) &&
  typeof value.minConfidence === 'number' &&
  value.minConfidence >= 0 &&
  value.minConfidence <= 1;

const isStaffRolePreset = (value: unknown): value is StaffInvite['role'] =>
  value === 'Full staff' || value === 'Coach bench' || value === 'Analyst room';

const isStaffInvite = (value: unknown): value is StaffInvite =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.email === 'string' &&
  isStaffRolePreset(value.role) &&
  typeof value.invitedAt === 'string';

export const isStaffInviteArray = (value: unknown): value is StaffInvite[] =>
  Array.isArray(value) && value.every(isStaffInvite);
