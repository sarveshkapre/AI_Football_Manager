import { describe, expect, it } from 'vitest';
import type { ImportedReportPack } from './import';
import { computePackDiff, mergeLabels } from './packDiff';

const clip = (id: string) => ({
  id,
  title: `Clip ${id}`,
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
});

