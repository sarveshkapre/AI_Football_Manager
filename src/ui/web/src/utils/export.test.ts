import { describe, expect, it } from 'vitest';
import { buildTelestrationSvg } from './export';

describe('buildTelestrationSvg', () => {
  it('returns empty string for no strokes', () => {
    expect(buildTelestrationSvg([])).toBe('');
  });

  it('renders freehand and arrow strokes deterministically', () => {
    const svg = buildTelestrationSvg([
      {
        id: 's1',
        tool: 'freehand',
        color: '#ff3b3b',
        width: 4,
        points: [
          { x: 0.1, y: 0.2 },
          { x: 0.12, y: 0.25 }
        ]
      },
      {
        id: 's2',
        tool: 'arrow',
        color: '#00c2ff',
        width: 3,
        points: [
          { x: 0.2, y: 0.4 },
          { x: 0.7, y: 0.6 }
        ]
      }
    ]);

    expect(svg).toContain('<svg');
    expect(svg).toContain('Telestration overlay');
    expect(svg).toContain('stroke="#ff3b3b"');
    expect(svg).toContain('stroke="#00c2ff"');
  });
});

