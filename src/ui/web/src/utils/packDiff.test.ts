import { describe, expect, it } from 'vitest';
import type { ImportedReportPack } from './import';
import { buildPackDiffPreview, computePackDiff, mergeLabels } from './packDiff';

const clip = (id: string, title = `Clip ${id}`) => ({
  id,
  title,
  duration: '00:12',
  tags: [],
  overlays: []
});

describe('pack diff utils', () => {
  it('computes new/overlap/removed clip ids', () => {
    const pack: ImportedReportPack = {
      title: 'Pack',
      notes: '',
      match: 'vs',
      owner: 'Analyst',
      clips: [clip('b'), clip('c')],
      annotations: {},
      labels: {},
      telestration: {},
      source: 'json'
    };

    const diff = computePackDiff({
      currentQueue: [clip('a'), clip('b')],
      currentLabels: {},
      currentAnnotations: {},
      currentTelestration: {},
      pack
    });

    expect(diff.newClipIds).toEqual(['c']);
    expect(diff.overlappingClipIds).toEqual(['b']);
    expect(diff.removedClipIds).toEqual(['a']);
  });

  it('flags overlapping clip ids with changed notes', () => {
    const pack: ImportedReportPack = {
      title: 'Pack',
      notes: '',
      match: 'vs',
      owner: 'Analyst',
      clips: [clip('a')],
      annotations: { a: 'new note' },
      labels: { a: ['Key'] },
      telestration: { a: [{ id: 's1', tool: 'freehand', color: '#fff', width: 2, points: [{ x: 0.1, y: 0.2 }] }] },
      source: 'json'
    };

    const diff = computePackDiff({
      currentQueue: [clip('a')],
      currentLabels: { a: [] },
      currentAnnotations: { a: '' },
      currentTelestration: { a: [] },
      pack
    });

    expect(diff.overlapNotesChangedIds).toEqual(['a']);
  });

  it('merges labels by deduping and sorting', () => {
    expect(mergeLabels({ existing: ['Press', 'press', ' '], imported: ['press', 'Switch'] })).toEqual([
      'Press',
      'Switch',
      'press'
    ]);
  });

  it('builds deterministic clip-title previews from the diff groups', () => {
    const pack: ImportedReportPack = {
      title: 'Pack',
      notes: '',
      match: 'vs',
      owner: 'Analyst',
      clips: [
        clip('b', 'Imported B'),
        clip('c', 'Imported C'),
        clip('d', 'Imported D')
      ],
      annotations: { b: 'new note' },
      labels: {},
      telestration: {},
      source: 'json'
    };

    const currentQueue = [
      clip('a', 'Current A'),
      clip('b', 'Current B'),
      clip('e', 'Current E')
    ];

    const diff = computePackDiff({
      currentQueue,
      currentLabels: {},
      currentAnnotations: { b: 'old note' },
      currentTelestration: {},
      pack
    });

    const preview = buildPackDiffPreview({
      diff,
      currentQueue,
      pack,
      limit: 2
    });

    expect(preview.newClips.items).toEqual([
      { id: 'c', title: 'Imported C' },
      { id: 'd', title: 'Imported D' }
    ]);
    expect(preview.newClips.hasMore).toBe(false);

    expect(preview.overlappingClips.items).toEqual([{ id: 'b', title: 'Imported B' }]);
    expect(preview.removedClips.items).toEqual([
      { id: 'a', title: 'Current A' },
      { id: 'e', title: 'Current E' }
    ]);
    expect(preview.notesChanged.items).toEqual([{ id: 'b', title: 'Imported B' }]);
  });

  it('caps preview size and reports overflow count', () => {
    const pack: ImportedReportPack = {
      title: 'Pack',
      notes: '',
      match: 'vs',
      owner: 'Analyst',
      clips: [clip('b', 'Imported B'), clip('c', 'Imported C')],
      annotations: {},
      labels: {},
      telestration: {},
      source: 'json'
    };

    const currentQueue = [clip('a', 'Current A')];
    const diff = computePackDiff({
      currentQueue,
      currentLabels: {},
      currentAnnotations: {},
      currentTelestration: {},
      pack
    });

    const preview = buildPackDiffPreview({
      diff,
      currentQueue,
      pack,
      limit: 1
    });

    expect(preview.newClips.total).toBe(2);
    expect(preview.newClips.items).toEqual([{ id: 'b', title: 'Imported B' }]);
    expect(preview.newClips.hasMore).toBe(true);
  });
});
