import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { importReportPackFromJsonText, importReportPackFromZipBlob, PackImportError } from './import';

const sampleClip = (id: string) => ({
  id,
  title: `Clip ${id}`,
  duration: '00:12',
  tags: ['press'],
  overlays: [{ id: 'spacing', label: 'Spacing box', enabled: true }]
});

describe('import utils', () => {
  it('imports a valid report JSON payload', () => {
    const payload = {
      title: 'Matchday Draft Report',
      notes: 'Summary',
      match: 'vs. Test',
      owner: 'Analyst',
      totalDuration: '00:24',
      clipCount: 2,
      clips: [sampleClip('a'), sampleClip('b')],
      annotations: { a: 'note' },
      labels: { a: ['Key'] },
      telestration: { a: [{ id: 's1', tool: 'freehand', color: '#ff3b3b', width: 3, points: [{ x: 0.1, y: 0.2 }, { x: 0.2, y: 0.3 }] }] }
    };

    const pack = importReportPackFromJsonText(JSON.stringify(payload));
    expect(pack.title).toBe('Matchday Draft Report');
    expect(pack.clips).toHaveLength(2);
    expect(pack.annotations.a).toBe('note');
    expect(pack.labels.a).toEqual(['Key']);
    expect(pack.source).toBe('json');
  });

  it('rejects a bundle manifest JSON (no clips)', () => {
    const manifest = {
      version: 1,
      createdAt: new Date().toISOString(),
      share: { link: 'x', permission: 'view', expiresAt: null, allowDownload: true },
      report: { title: 'Demo', match: 'vs', owner: 'Analyst', clipCount: 0, totalDuration: '00:00' },
      files: []
    };

    expect(() => importReportPackFromJsonText(JSON.stringify(manifest))).toThrow(PackImportError);
  });

  it('imports a zip bundle containing afm-report.json', async () => {
    const payload = {
      title: 'Zip Report',
      notes: 'Z',
      match: 'vs. Zip',
      owner: 'Analyst',
      totalDuration: '00:12',
      clipCount: 1,
      clips: [sampleClip('z1')],
      annotations: { z1: 'note' },
      labels: { z1: ['Key'] },
      telestration: {}
    };

    const zip = new JSZip();
    zip.file('afm-report.json', JSON.stringify(payload));
    const buffer = await zip.generateAsync({ type: 'arraybuffer' });
    const blob = new Blob([buffer], { type: 'application/zip' });

    const pack = await importReportPackFromZipBlob(blob);
    expect(pack.title).toBe('Zip Report');
    expect(pack.clips).toHaveLength(1);
    expect(pack.source).toBe('zip');
  });
});
