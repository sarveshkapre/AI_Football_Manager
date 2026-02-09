import type { AnalystTimelineFilters, Clip, OverlayToggle, SavedSearch, Storyboard } from '../types';
import type { AccessState } from '../context/AccessContext';
import type { AuditEvent } from '../context/AuditContext';
import type { StaffInvite } from '../context/InvitesContext';
import type { TelestrationMap, TelestrationStroke } from '../context/TelestrationContext';

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

const isTelestrationPoint = (value: unknown): value is { x: number; y: number } =>
  isRecord(value) && typeof value.x === 'number' && typeof value.y === 'number';

const isTelestrationTool = (value: unknown): value is TelestrationStroke['tool'] =>
  value === 'freehand' || value === 'arrow';

const isTelestrationStroke = (value: unknown): value is TelestrationStroke =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  isTelestrationTool(value.tool) &&
  typeof value.color === 'string' &&
  typeof value.width === 'number' &&
  Array.isArray(value.points) &&
  value.points.every(isTelestrationPoint);

export const isTelestrationMap = (value: unknown): value is TelestrationMap =>
  isRecord(value) && Object.values(value).every((entry) => Array.isArray(entry) && entry.every(isTelestrationStroke));

const isPackSource = (value: unknown): value is 'json' | 'zip' => value === 'json' || value === 'zip';

export const isReportsLastImportMeta = (
  value: unknown
): value is {
  title: string;
  notes: string;
  match: string;
  owner: string;
  source: 'json' | 'zip';
  clipCount: number;
  importedAt: string;
} =>
  isRecord(value) &&
  typeof value.title === 'string' &&
  typeof value.notes === 'string' &&
  typeof value.match === 'string' &&
  typeof value.owner === 'string' &&
  isPackSource(value.source) &&
  typeof value.clipCount === 'number' &&
  Number.isFinite(value.clipCount) &&
  value.clipCount >= 0 &&
  typeof value.importedAt === 'string';
