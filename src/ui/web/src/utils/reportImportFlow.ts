import type { Clip } from '../types';
import type { TelestrationMap } from '../context/TelestrationContext';
import type { ImportedReportPack } from './import';
import {
  mergeLabels,
  type PackDiff,
  type PackImportDecision,
  type PackImportStrategy
} from './packDiff';

export type LastImportMeta = {
  title: string;
  notes: string;
  match: string;
  owner: string;
  source: 'json' | 'zip';
  clipCount: number;
  importedAt: string;
};

export type ImportUndoSnapshot = {
  createdAt: string;
  pack: {
    title: string;
    match: string;
    owner: string;
    source: 'json' | 'zip';
    clipCount: number;
  };
  affectedClipIds: string[];
  postImportQueueIds?: string[];
  previousQueue: Clip[];
  previousLabels: Record<string, string[]>;
  previousAnnotations: Record<string, string>;
  previousTelestration: TelestrationMap;
  previousLastImportMeta: LastImportMeta | null;
};

export type ImportWriteSet = {
  labelIds: string[];
  nextLabels: Record<string, string[]>;
  annotationIds: string[];
  nextAnnotations: Record<string, string>;
  telestrationIds: string[];
  nextTelestration: TelestrationMap;
};

export const reportsLastImportKey = 'afm.reports.lastImport.v1';
export const reportsImportUndoKey = 'afm.reports.importUndo.v1';

export const defaultImportDecision: PackImportDecision = {
  strategy: 'replace',
  overlapLabels: 'merge',
  overlapAnnotations: 'keep',
  overlapTelestration: 'keep'
};

export const areStringArraysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, idx) => value === b[idx]);

export const buildPostImportQueueIds = ({
  previousQueueIds,
  importedClips,
  strategy
}: {
  previousQueueIds: string[];
  importedClips: Clip[];
  strategy: PackImportStrategy;
}) => {
  if (strategy === 'replace') {
    return importedClips.map((clip) => clip.id);
  }

  const existing = new Set(previousQueueIds);
  const next = [...previousQueueIds];
  importedClips.forEach((clip) => {
    if (!existing.has(clip.id)) {
      next.push(clip.id);
      existing.add(clip.id);
    }
  });
  return next;
};

export const buildImportUndoSnapshot = ({
  pack,
  diff,
  postImportQueueIds,
  queue,
  labels,
  annotations,
  strokesByClip,
  lastImportMeta
}: {
  pack: ImportedReportPack;
  diff: PackDiff;
  postImportQueueIds: string[];
  queue: Clip[];
  labels: Record<string, string[]>;
  annotations: Record<string, string>;
  strokesByClip: TelestrationMap;
  lastImportMeta: LastImportMeta | null;
}): ImportUndoSnapshot => {
  const affectedClipIds = Array.from(new Set([...diff.newClipIds, ...diff.overlappingClipIds]));

  return {
    createdAt: new Date().toISOString(),
    pack: {
      title: pack.title,
      match: pack.match,
      owner: pack.owner,
      source: pack.source,
      clipCount: pack.clips.length
    },
    affectedClipIds,
    postImportQueueIds,
    previousQueue: queue,
    previousLabels: Object.fromEntries(
      affectedClipIds.map((clipId) => [clipId, labels[clipId] ?? []])
    ),
    previousAnnotations: Object.fromEntries(
      affectedClipIds.map((clipId) => [clipId, annotations[clipId] ?? ''])
    ),
    previousTelestration: Object.fromEntries(
      affectedClipIds.map((clipId) => [clipId, strokesByClip[clipId] ?? []])
    ),
    previousLastImportMeta: lastImportMeta
  };
};

export const buildImportWriteSet = ({
  diff,
  decision,
  pack,
  currentLabels
}: {
  diff: PackDiff;
  decision: PackImportDecision;
  pack: ImportedReportPack;
  currentLabels: Record<string, string[]>;
}): ImportWriteSet => {
  const overlapIds = diff.overlappingClipIds;
  const newIds = diff.newClipIds;

  const labelIds: string[] = [];
  const nextLabels: Record<string, string[]> = {};

  const annotationIds: string[] = [];
  const nextAnnotations: Record<string, string> = {};

  const telestrationIds: string[] = [];
  const nextTelestration: TelestrationMap = {};

  const includeOverlapLabels =
    decision.overlapLabels === 'merge' || decision.overlapLabels === 'replace';
  const includeOverlapNotes = (policy: PackImportDecision['overlapAnnotations']) =>
    policy === 'replace';

  // New clips always take imported notes and drawings.
  newIds.forEach((clipId) => {
    labelIds.push(clipId);
    nextLabels[clipId] = pack.labels[clipId] ?? [];

    annotationIds.push(clipId);
    nextAnnotations[clipId] = pack.annotations[clipId] ?? '';

    telestrationIds.push(clipId);
    nextTelestration[clipId] = pack.telestration[clipId] ?? [];
  });

  // Overlapping clips are policy-controlled.
  if (overlapIds.length > 0) {
    if (includeOverlapLabels) {
      overlapIds.forEach((clipId) => {
        labelIds.push(clipId);
        if (decision.overlapLabels === 'merge') {
          nextLabels[clipId] = mergeLabels({
            existing: currentLabels[clipId],
            imported: pack.labels[clipId]
          });
          return;
        }
        nextLabels[clipId] = pack.labels[clipId] ?? [];
      });
    }

    if (includeOverlapNotes(decision.overlapAnnotations)) {
      overlapIds.forEach((clipId) => {
        annotationIds.push(clipId);
        nextAnnotations[clipId] = pack.annotations[clipId] ?? '';
      });
    }

    if (includeOverlapNotes(decision.overlapTelestration)) {
      overlapIds.forEach((clipId) => {
        telestrationIds.push(clipId);
        nextTelestration[clipId] = pack.telestration[clipId] ?? [];
      });
    }
  }

  return {
    labelIds,
    nextLabels,
    annotationIds,
    nextAnnotations,
    telestrationIds,
    nextTelestration
  };
};
