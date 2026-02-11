import type { Clip } from '../types';
import type { ImportedReportPack } from './import';
import type { TelestrationMap, TelestrationStroke } from '../context/TelestrationContext';

export type PackImportStrategy = 'replace' | 'append';
export type PackOverlapLabelsPolicy = 'merge' | 'replace' | 'keep';
export type PackOverlapNotePolicy = 'replace' | 'keep';

export interface PackImportDecision {
  strategy: PackImportStrategy;
  overlapLabels: PackOverlapLabelsPolicy;
  overlapAnnotations: PackOverlapNotePolicy;
  overlapTelestration: PackOverlapNotePolicy;
}

export interface PackDiff {
  currentClipCount: number;
  importedClipCount: number;
  newClipIds: string[];
  overlappingClipIds: string[];
  removedClipIds: string[];
  overlapNotesChangedIds: string[];
}

export interface PackDiffPreviewItem {
  id: string;
  title: string;
}

export interface PackDiffPreviewGroup {
  total: number;
  hasMore: boolean;
  items: PackDiffPreviewItem[];
}

export interface PackDiffPreview {
  newClips: PackDiffPreviewGroup;
  overlappingClips: PackDiffPreviewGroup;
  removedClips: PackDiffPreviewGroup;
  notesChanged: PackDiffPreviewGroup;
}

const normalizeLabels = (labels: string[] | undefined) => {
  if (!Array.isArray(labels) || labels.length === 0) {
    return [];
  }
  return Array.from(new Set(labels.map((value) => value.trim()).filter(Boolean))).sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0
  );
};

const labelsEqual = (a: string[] | undefined, b: string[] | undefined) => {
  const left = normalizeLabels(a);
  const right = normalizeLabels(b);
  if (left.length !== right.length) {
    return false;
  }
  return left.every((value, idx) => value === right[idx]);
};

const normalizeAnnotation = (value: string | undefined) => (value ?? '').trim();

const annotationEqual = (a: string | undefined, b: string | undefined) =>
  normalizeAnnotation(a) === normalizeAnnotation(b);

const stableStrokeKey = (stroke: TelestrationStroke) => stroke.id;

const stableStrokesString = (strokes: TelestrationStroke[] | undefined) => {
  if (!Array.isArray(strokes) || strokes.length === 0) {
    return '[]';
  }
  const sorted = [...strokes].sort((a, b) => stableStrokeKey(a).localeCompare(stableStrokeKey(b)));
  return JSON.stringify(sorted);
};

const strokesEqual = (a: TelestrationStroke[] | undefined, b: TelestrationStroke[] | undefined) =>
  stableStrokesString(a) === stableStrokesString(b);

export const computePackDiff = ({
  currentQueue,
  currentLabels,
  currentAnnotations,
  currentTelestration,
  pack
}: {
  currentQueue: Clip[];
  currentLabels: Record<string, string[]>;
  currentAnnotations: Record<string, string>;
  currentTelestration: TelestrationMap;
  pack: ImportedReportPack;
}): PackDiff => {
  const currentIds = new Set(currentQueue.map((clip) => clip.id));
  const importedIds = new Set(pack.clips.map((clip) => clip.id));

  const newClipIds: string[] = [];
  const overlappingClipIds: string[] = [];
  const removedClipIds: string[] = [];

  for (const id of importedIds) {
    if (currentIds.has(id)) {
      overlappingClipIds.push(id);
    } else {
      newClipIds.push(id);
    }
  }

  for (const id of currentIds) {
    if (!importedIds.has(id)) {
      removedClipIds.push(id);
    }
  }

  newClipIds.sort((a, b) => a.localeCompare(b));
  overlappingClipIds.sort((a, b) => a.localeCompare(b));
  removedClipIds.sort((a, b) => a.localeCompare(b));

  const overlapNotesChangedIds = overlappingClipIds.filter((clipId) => {
    const labelsChanged = !labelsEqual(currentLabels[clipId], pack.labels[clipId]);
    const annotationChanged = !annotationEqual(currentAnnotations[clipId], pack.annotations[clipId]);
    const telestrationChanged = !strokesEqual(currentTelestration[clipId], pack.telestration[clipId]);
    return labelsChanged || annotationChanged || telestrationChanged;
  });

  return {
    currentClipCount: currentQueue.length,
    importedClipCount: pack.clips.length,
    newClipIds,
    overlappingClipIds,
    removedClipIds,
    overlapNotesChangedIds
  };
};

export const mergeLabels = ({
  existing,
  imported
}: {
  existing: string[] | undefined;
  imported: string[] | undefined;
}) => normalizeLabels([...(existing ?? []), ...(imported ?? [])]);

const buildClipTitleIndex = (clips: Clip[]) => new Map(clips.map((clip) => [clip.id, clip.title]));

const mapIdsToPreviewGroup = ({
  ids,
  preferredTitles,
  fallbackTitles,
  limit
}: {
  ids: string[];
  preferredTitles: Map<string, string>;
  fallbackTitles: Map<string, string>;
  limit: number;
}): PackDiffPreviewGroup => {
  const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.trunc(limit)) : 5;
  const limited = ids.slice(0, safeLimit);
  return {
    total: ids.length,
    hasMore: ids.length > limited.length,
    items: limited.map((id) => ({
      id,
      title: preferredTitles.get(id) ?? fallbackTitles.get(id) ?? id
    }))
  };
};

export const buildPackDiffPreview = ({
  diff,
  currentQueue,
  pack,
  limit = 5
}: {
  diff: PackDiff;
  currentQueue: Clip[];
  pack: ImportedReportPack;
  limit?: number;
}): PackDiffPreview => {
  const currentTitles = buildClipTitleIndex(currentQueue);
  const importedTitles = buildClipTitleIndex(pack.clips);

  return {
    newClips: mapIdsToPreviewGroup({
      ids: diff.newClipIds,
      preferredTitles: importedTitles,
      fallbackTitles: currentTitles,
      limit
    }),
    overlappingClips: mapIdsToPreviewGroup({
      ids: diff.overlappingClipIds,
      preferredTitles: importedTitles,
      fallbackTitles: currentTitles,
      limit
    }),
    removedClips: mapIdsToPreviewGroup({
      ids: diff.removedClipIds,
      preferredTitles: currentTitles,
      fallbackTitles: importedTitles,
      limit
    }),
    notesChanged: mapIdsToPreviewGroup({
      ids: diff.overlapNotesChangedIds,
      preferredTitles: importedTitles,
      fallbackTitles: currentTitles,
      limit
    })
  };
};
