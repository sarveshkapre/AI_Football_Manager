import { describe, expect, it } from 'vitest';
import { buildSegmentReport } from './reports';

describe('buildSegmentReport', () => {
  it('uses queued clips as primary evidence and builds pattern summary', () => {
    const report = buildSegmentReport({
      segment: {
        id: 'seg-1',
        label: 'Final phase',
        start: '63:00',
        end: '80:00',
        status: 'Ready',
        signal: 'High'
      },
      timeline: [
        {
          id: 't1',
          minute: '63:10',
          label: 'Press escape',
          confidence: 0.8,
          tags: ['press', 'right'],
          clipId: 'clip-a'
        },
        {
          id: 't2',
          minute: '64:22',
          label: 'Press escape again',
          confidence: 0.7,
          tags: ['press'],
          clipId: 'clip-b'
        }
      ],
      recommendations: [
        {
          id: 'rec-1',
          title: 'Shift trap wide',
          tradeoff: 'Space behind LB',
          confidence: 0.72,
          clips: 2
        }
      ],
      queue: [
        {
          id: 'queued-1',
          title: 'Queued evidence',
          duration: '0:12',
          tags: ['press'],
          overlays: []
        }
      ],
      clips: [
        {
          id: 'clip-a',
          title: 'Timeline clip',
          duration: '0:10',
          tags: ['press'],
          overlays: []
        }
      ],
      generatedAt: '2026-02-08 14:00'
    });

    expect(report.segmentId).toBe('seg-1');
    expect(report.clips).toHaveLength(1);
    expect(report.clips[0]?.id).toBe('queued-1');
    expect(report.patterns[0]).toContain('press');
    expect(report.adjustments[0]).toContain('Tradeoff');
    expect(report.confidence).toBe(0.75);
  });

  it('falls back when no events are available', () => {
    const report = buildSegmentReport({
      segment: {
        id: 'seg-2',
        label: 'Set-piece wave',
        start: '48:00',
        end: '54:00',
        status: 'Queued',
        signal: 'Low'
      },
      timeline: [],
      recommendations: [],
      queue: [],
      clips: [],
      generatedAt: '2026-02-08 14:05'
    });

    expect(report.patterns).toEqual(['No repeated patterns above threshold.']);
    expect(report.adjustments).toEqual(['Hold shape and wait for a clearer signal.']);
    expect(report.confidence).toBe(0.6);
    expect(report.summary).toContain('signal quality was low');
  });
});
