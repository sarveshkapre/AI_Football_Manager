import { describe, expect, it } from 'vitest';
import type { Clip } from '../types';
import type { ImportedReportPack } from './import';
import type { PackDiff, PackImportDecision } from './packDiff';
import {
  buildImportUndoSnapshot,
  buildImportWriteSet,
  buildPostImportQueueIds
} from './reportImportFlow';

const clip = (id: string, title = id): Clip => ({
  id,
  title,
  duration: '00:10',
  tags: [],
  overlays: []
});

const buildPack = (clips: Clip[]): ImportedReportPack => ({
  title: 'Pack',
  notes: '',
  match: 'Match',
  owner: 'Analyst',
  clips,
  labels: {
    c1: ['High press', 'Transition'],
    c2: ['Set piece'],
    c3: ['Counter']
  },
  annotations: {
    c1: 'Keep compact',
    c2: 'Far-post runner',
    c3: 'Exploit width'
  },
  telestration: {
    c1: [],
    c2: [
      {
        id: 's1',
        tool: 'arrow',
        color: '#fff',
        width: 2,
        points: [
          { x: 0.1, y: 0.1 },
          { x: 0.2, y: 0.2 }
        ]
      }
    ],
    c3: []
  },
  source: 'json'
});

describe('reportImportFlow helpers', () => {
  it('buildPostImportQueueIds preserves append order and dedupes', () => {
    const result = buildPostImportQueueIds({
      previousQueueIds: ['a', 'b'],
      importedClips: [clip('b'), clip('c'), clip('d')],
      strategy: 'append'
    });

    expect(result).toEqual(['a', 'b', 'c', 'd']);
  });

  it('buildPostImportQueueIds replaces queue ids in imported order', () => {
    const result = buildPostImportQueueIds({
      previousQueueIds: ['a', 'b'],
      importedClips: [clip('d'), clip('c')],
      strategy: 'replace'
    });

    expect(result).toEqual(['d', 'c']);
  });

  it('buildImportWriteSet respects overlap policies', () => {
    const diff: PackDiff = {
      currentClipCount: 2,
      importedClipCount: 3,
      newClipIds: ['c3'],
      overlappingClipIds: ['c1', 'c2'],
      removedClipIds: [],
      overlapNotesChangedIds: ['c1', 'c2']
    };
    const decision: PackImportDecision = {
      strategy: 'append',
      overlapLabels: 'merge',
      overlapAnnotations: 'keep',
      overlapTelestration: 'replace'
    };
    const pack = buildPack([clip('c1'), clip('c2'), clip('c3')]);

    const writeSet = buildImportWriteSet({
      diff,
      decision,
      pack,
      currentLabels: {
        c1: ['Existing', 'High press'],
        c2: ['Carry']
      }
    });

    expect(writeSet.labelIds).toEqual(['c3', 'c1', 'c2']);
    expect(writeSet.nextLabels.c1).toEqual(['Existing', 'High press', 'Transition']);
    expect(writeSet.nextLabels.c2).toEqual(['Carry', 'Set piece']);
    expect(writeSet.annotationIds).toEqual(['c3']);
    expect(writeSet.nextAnnotations).toEqual({ c3: 'Exploit width' });
    expect(writeSet.telestrationIds).toEqual(['c3', 'c1', 'c2']);
    expect(writeSet.nextTelestration.c2).toHaveLength(1);
  });

  it('buildImportUndoSnapshot tracks affected clip union and previous values', () => {
    const diff: PackDiff = {
      currentClipCount: 1,
      importedClipCount: 2,
      newClipIds: ['c2'],
      overlappingClipIds: ['c1'],
      removedClipIds: [],
      overlapNotesChangedIds: ['c1']
    };
    const pack = buildPack([clip('c1'), clip('c2')]);

    const snapshot = buildImportUndoSnapshot({
      pack,
      diff,
      postImportQueueIds: ['c1', 'c2'],
      queue: [clip('c1')],
      labels: { c1: ['Existing'] },
      annotations: { c1: 'Old note' },
      strokesByClip: { c1: [] },
      lastImportMeta: null
    });

    expect(snapshot.affectedClipIds).toEqual(['c2', 'c1']);
    expect(snapshot.previousQueue.map((item) => item.id)).toEqual(['c1']);
    expect(snapshot.previousLabels).toEqual({ c1: ['Existing'], c2: [] });
    expect(snapshot.previousAnnotations).toEqual({ c1: 'Old note', c2: '' });
    expect(snapshot.previousTelestration).toEqual({ c1: [], c2: [] });
    expect(snapshot.postImportQueueIds).toEqual(['c1', 'c2']);
  });
});
