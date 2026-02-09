import JSZip from 'jszip';
import type { Clip } from '../types';
import type { TelestrationMap } from '../context/TelestrationContext';
import { isAnnotationsMap, isClipArray, isLabelsMap, isTelestrationMap } from './guards';

export interface ImportedReportPack {
  title: string;
  notes: string;
  match: string;
  owner: string;
  clips: Clip[];
  annotations: Record<string, string>;
  labels: Record<string, string[]>;
  telestration: TelestrationMap;
  source: 'json' | 'zip';
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isString = (value: unknown): value is string => typeof value === 'string';

const parseReportPayload = (value: unknown): Omit<ImportedReportPack, 'source'> | null => {
  if (!isRecord(value)) {
    return null;
  }

  const title = value.title;
  const notes = value.notes;
  const match = value.match;
  const owner = value.owner;
  const clips = value.clips;

  if (!isString(title) || !isString(notes) || !isString(match) || !isString(owner) || !isClipArray(clips)) {
    return null;
  }

  const annotations = value.annotations;
  const labels = value.labels;
  const telestration = value.telestration;

  return {
    title,
    notes,
    match,
    owner,
    clips,
    annotations: isAnnotationsMap(annotations) ? annotations : {},
    labels: isLabelsMap(labels) ? labels : {},
    telestration: isTelestrationMap(telestration) ? telestration : {}
  };
};

const parseNotesPayload = (value: unknown): Pick<ImportedReportPack, 'annotations' | 'labels' | 'telestration'> | null => {
  if (!isRecord(value)) {
    return null;
  }

  const annotations = value.annotations;
  const labels = value.labels;
  const telestration = value.telestration;

  if (!isAnnotationsMap(annotations) || !isLabelsMap(labels) || !isTelestrationMap(telestration)) {
    return null;
  }

  return { annotations, labels, telestration };
};

const firstExistingZipFile = (zip: JSZip, candidates: string[]) => {
  for (const name of candidates) {
    const file = zip.file(name);
    if (file) {
      return file;
    }
  }
  return null;
};

export class PackImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PackImportError';
  }
}

export const importReportPackFromJsonText = (text: string): ImportedReportPack => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new PackImportError('Invalid JSON: could not parse file.');
  }

  const report = parseReportPayload(parsed);
  if (report) {
    return { ...report, source: 'json' };
  }

  // Users sometimes try to import the bundle manifest; it does not contain clips.
  if (isRecord(parsed) && parsed.version === 1 && isRecord(parsed.report) && isString(parsed.report.title)) {
    throw new PackImportError(
      'This looks like a bundle manifest. Import the zip bundle (`afm-bundle.zip`) or the report JSON (`afm-report.json`) instead.'
    );
  }

  throw new PackImportError('Unrecognized pack format. Expected `afm-report.json` payload.');
};

export const importReportPackFromZipBlob = async (blob: Blob): Promise<ImportedReportPack> => {
  let zip: JSZip;
  try {
    // Node's Blob implementation can be finicky with some libraries; normalize to ArrayBuffer.
    const data = typeof blob.arrayBuffer === 'function' ? await blob.arrayBuffer() : blob;
    zip = await JSZip.loadAsync(data);
  } catch {
    throw new PackImportError('Invalid zip: could not read bundle.');
  }

  const reportFile = firstExistingZipFile(zip, ['afm-report.json', 'report/afm-report.json']);
  if (!reportFile) {
    throw new PackImportError('Zip bundle is missing `afm-report.json`.');
  }

  const reportText = await reportFile.async('text');
  let reportParsed: unknown;
  try {
    reportParsed = JSON.parse(reportText) as unknown;
  } catch {
    throw new PackImportError('Zip bundle contains an invalid `afm-report.json`.');
  }

  const report = parseReportPayload(reportParsed);
  if (!report) {
    throw new PackImportError('Zip bundle `afm-report.json` is not a valid report payload.');
  }

  // Back-compat / optional note file: if present, it overrides report-level maps.
  const notesFile = firstExistingZipFile(zip, ['afm-notes.json', 'notes/afm-notes.json']);
  if (notesFile) {
    try {
      const notesText = await notesFile.async('text');
      const notesParsed = JSON.parse(notesText) as unknown;
      const notes = parseNotesPayload(notesParsed);
      if (notes) {
        return {
          ...report,
          ...notes,
          source: 'zip'
        };
      }
    } catch {
      // Ignore malformed optional notes file; the report payload is still usable.
    }
  }

  return { ...report, source: 'zip' };
};

export const importReportPackFromFile = async (file: File): Promise<ImportedReportPack> => {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.zip')) {
    return importReportPackFromZipBlob(file);
  }
  if (name.endsWith('.json')) {
    const text = await file.text();
    return importReportPackFromJsonText(text);
  }
  // Fallback: attempt JSON first (some browsers omit extensions), then zip.
  try {
    const text = await file.text();
    return importReportPackFromJsonText(text);
  } catch {
    return importReportPackFromZipBlob(file);
  }
};

export const clipIdsFromPack = (pack: ImportedReportPack) => pack.clips.map((clip) => clip.id);
