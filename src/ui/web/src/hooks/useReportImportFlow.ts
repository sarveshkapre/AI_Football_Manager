import { useEffect, useMemo, useRef, useState, type ChangeEventHandler } from 'react';
import type { Clip } from '../types';
import type { TelestrationMap } from '../context/TelestrationContext';
import { importReportPackFromFile, PackImportError, type ImportedReportPack } from '../utils/import';
import {
  buildPackDiffPreview,
  computePackDiff,
  type PackDiff,
  type PackImportDecision
} from '../utils/packDiff';
import {
  isReportsImportUndoSnapshot,
  isReportsLastImportMeta
} from '../utils/guards';
import { loadFromStorageWithGuard, saveToStorage } from '../utils/storage';
import {
  areStringArraysEqual,
  buildImportUndoSnapshot,
  buildImportWriteSet,
  buildPostImportQueueIds,
  defaultImportDecision,
  reportsImportUndoKey,
  reportsLastImportKey,
  type ImportUndoSnapshot,
  type LastImportMeta
} from '../utils/reportImportFlow';

type ImportStatusTone = 'danger' | 'success' | 'info';

type PendingImport = {
  pack: ImportedReportPack;
  diff: PackDiff;
  decision: PackImportDecision;
};

type ReportImportFlowParams = {
  queue: Clip[];
  setQueue: (clips: Clip[]) => void;
  enqueueClips: (clips: Clip[]) => void;
  labels: Record<string, string[]>;
  annotations: Record<string, string>;
  strokesByClip: TelestrationMap;
  replaceLabelsForClips: (clipIds: string[], nextLabels: Record<string, string[]>) => void;
  replaceAnnotationsForClips: (clipIds: string[], nextAnnotations: Record<string, string>) => void;
  replaceStrokesForClips: (clipIds: string[], nextStrokes: TelestrationMap) => void;
  logEvent: (action: string, detail: string) => void;
};

const isInputElement = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  );
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
};

export const useReportImportFlow = ({
  queue,
  setQueue,
  enqueueClips,
  labels,
  annotations,
  strokesByClip,
  replaceLabelsForClips,
  replaceAnnotationsForClips,
  replaceStrokesForClips,
  logEvent
}: ReportImportFlowParams) => {
  const [importStatus, setImportStatus] = useState('');
  const [importBusy, setImportBusy] = useState(false);
  const [showImportClipPreview, setShowImportClipPreview] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const applyImportRef = useRef<HTMLButtonElement | null>(null);
  const [lastImportMeta, setLastImportMeta] = useState<LastImportMeta | null>(() =>
    loadFromStorageWithGuard(reportsLastImportKey, null, isReportsLastImportMeta)
  );
  const [importUndo, setImportUndo] = useState<ImportUndoSnapshot | null>(() =>
    loadFromStorageWithGuard(reportsImportUndoKey, null, isReportsImportUndoSnapshot)
  );

  const importPreview = useMemo(() => {
    if (!pendingImport) {
      return null;
    }
    return buildPackDiffPreview({
      diff: pendingImport.diff,
      currentQueue: queue,
      pack: pendingImport.pack,
      limit: 5
    });
  }, [pendingImport, queue]);

  const importStatusTone = useMemo<ImportStatusTone>(() => {
    if (importStatus.startsWith('Import failed') || importStatus.startsWith('Undo failed')) {
      return 'danger';
    }
    if (
      importStatus.startsWith('Applying') ||
      importStatus.startsWith('Importing') ||
      importStatus.startsWith('Review import') ||
      importStatus.startsWith('Undoing')
    ) {
      return 'info';
    }
    return 'success';
  }, [importStatus]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (importBusy || isInputElement(event.target) || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      if (event.key !== 'i' && event.key !== 'I') {
        return;
      }
      event.preventDefault();
      importInputRef.current?.click();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [importBusy]);

  const closePendingImport = () => {
    setPendingImport(null);
    setShowImportClipPreview(false);
    setImportStatus('');
    if (importInputRef.current) {
      importInputRef.current.value = '';
    }
  };

  const clearImportUndo = () => {
    setImportUndo(null);
    saveToStorage(reportsImportUndoKey, null);
  };

  const undoLastImport = () => {
    if (!importUndo || importBusy) {
      return;
    }

    const currentQueueIds = queue.map((clip) => clip.id);
    const expectedQueueIds = importUndo.postImportQueueIds;
    if (!expectedQueueIds || !areStringArraysEqual(expectedQueueIds, currentQueueIds)) {
      const ok = window.confirm(
        'Your export queue changed since the last import. Undo will overwrite the current queue and restore the pre-import state. Continue?'
      );
      if (!ok) {
        return;
      }
    }

    setImportBusy(true);
    setImportStatus('Undoing import...');
    try {
      setQueue(importUndo.previousQueue);

      const affected = importUndo.affectedClipIds;
      replaceLabelsForClips(affected, importUndo.previousLabels);
      replaceAnnotationsForClips(affected, importUndo.previousAnnotations);
      replaceStrokesForClips(affected, importUndo.previousTelestration);

      setLastImportMeta(importUndo.previousLastImportMeta);
      saveToStorage(reportsLastImportKey, importUndo.previousLastImportMeta);

      clearImportUndo();
      setImportStatus('Import undone.');
      logEvent('Pack import undone', importUndo.pack.title);
    } catch (error) {
      const message = getErrorMessage(error, 'Unknown undo error');
      setImportStatus(`Undo failed: ${message}`);
      logEvent('Pack import undo failed', message);
    } finally {
      setImportBusy(false);
    }
  };

  const applyPendingImport = () => {
    if (!pendingImport || importBusy) {
      return;
    }

    const { pack, diff, decision } = pendingImport;
    const currentQueueIds = new Set(queue.map((clip) => clip.id));
    const importedIds = new Set(pack.clips.map((clip) => clip.id));

    setImportBusy(true);
    setImportStatus('Applying import...');
    try {
      const previousQueueIds = queue.map((clip) => clip.id);
      const postImportQueueIds = buildPostImportQueueIds({
        previousQueueIds,
        importedClips: pack.clips,
        strategy: decision.strategy
      });
      const snapshot = buildImportUndoSnapshot({
        pack,
        diff,
        postImportQueueIds,
        queue,
        labels,
        annotations,
        strokesByClip,
        lastImportMeta
      });
      setImportUndo(snapshot);
      saveToStorage(reportsImportUndoKey, snapshot);

      if (decision.strategy === 'replace') {
        setQueue(pack.clips);
      } else {
        // Append clips in pack order; enqueueClips skips duplicates.
        enqueueClips(pack.clips);
      }

      const writeSet = buildImportWriteSet({
        diff,
        decision,
        pack,
        currentLabels: labels
      });
      replaceLabelsForClips(writeSet.labelIds, writeSet.nextLabels);
      replaceAnnotationsForClips(writeSet.annotationIds, writeSet.nextAnnotations);
      replaceStrokesForClips(writeSet.telestrationIds, writeSet.nextTelestration);

      const meta: LastImportMeta = {
        title: pack.title,
        notes: pack.notes,
        match: pack.match,
        owner: pack.owner,
        source: pack.source,
        clipCount: pack.clips.length,
        importedAt: new Date().toLocaleString()
      };
      setLastImportMeta(meta);
      saveToStorage(reportsLastImportKey, meta);

      const strategyLabel = decision.strategy === 'replace' ? 'Replaced queue' : 'Appended clips';
      setImportStatus(`${strategyLabel}: "${pack.title}" (${pack.clips.length} clips).`);
      logEvent('Pack imported', `${pack.title} · ${pack.clips.length} clips · ${decision.strategy}`);

      closePendingImport();
    } catch (error) {
      const message = getErrorMessage(error, 'Unknown import error');
      setImportStatus(`Import failed: ${message}`);
      logEvent('Pack import failed', message);
    } finally {
      setImportBusy(false);
    }

    // Diagnostics-only (no functional impact): expose a quick sanity check in the audit log.
    if (importedIds.size > 0 && currentQueueIds.size > 0) {
      logEvent(
        'Pack import diff',
        `new:${diff.newClipIds.length} overlap:${diff.overlappingClipIds.length} removed:${diff.removedClipIds.length}`
      );
    }
  };

  const onImportFile: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file || importBusy) {
      return;
    }

    setImportBusy(true);
    setImportStatus('Importing pack...');
    try {
      const pack = await importReportPackFromFile(file);
      const diff = computePackDiff({
        currentQueue: queue,
        currentLabels: labels,
        currentAnnotations: annotations,
        currentTelestration: strokesByClip,
        pack
      });
      setPendingImport({ pack, diff, decision: defaultImportDecision });
      setShowImportClipPreview(false);
      setImportStatus(`Review import: "${pack.title}" (${pack.clips.length} clips).`);
    } catch (error) {
      const message =
        error instanceof PackImportError
          ? error.message
          : getErrorMessage(error, 'Unknown import error');
      setImportStatus(`Import failed: ${message}`);
      logEvent('Pack import failed', message);
    } finally {
      setImportBusy(false);
      event.target.value = '';
    }
  };

  const clearImportedPackBanner = () => {
    setLastImportMeta(null);
    saveToStorage(reportsLastImportKey, null);
    clearImportUndo();
    setImportStatus('');
    logEvent('Pack banner cleared', 'Reports import');
  };

  return {
    applyImportRef,
    importInputRef,
    importStatus,
    importStatusTone,
    importBusy,
    showImportClipPreview,
    setShowImportClipPreview,
    pendingImport,
    setPendingImport,
    importPreview,
    lastImportMeta,
    importUndo,
    onImportFile,
    closePendingImport,
    applyPendingImport,
    undoLastImport,
    clearImportedPackBanner
  };
};
