import { describe, expect, it } from 'vitest';
import { buildBundleManifest, buildShareLink, computeExpiresAt } from './share';

describe('share utils', () => {
  it('computes expiry timestamps from issued-at', () => {
    const issuedAt = new Date('2026-02-09T00:00:00.000Z');
    expect(computeExpiresAt('1h', issuedAt)).toBe('2026-02-09T01:00:00.000Z');
    expect(computeExpiresAt('24h', issuedAt)).toBe('2026-02-10T00:00:00.000Z');
    expect(computeExpiresAt('7d', issuedAt)).toBe('2026-02-16T00:00:00.000Z');
    expect(computeExpiresAt('30d', issuedAt)).toBe('2026-03-11T00:00:00.000Z');
    expect(computeExpiresAt('never', issuedAt)).toBeNull();
  });

  it('builds share links with permission and optional flags', () => {
    expect(
      buildShareLink({
        baseUrl: 'https://afm.example.com/',
        token: 'abc123',
        permission: 'view',
        expiresAt: null,
        allowDownload: false
      })
    ).toBe('https://afm.example.com/share/abc123?perm=view');

    expect(
      buildShareLink({
        baseUrl: 'https://afm.example.com',
        token: 'abc123',
        permission: 'comment',
        expiresAt: '2026-02-10T00:00:00.000Z',
        allowDownload: true
      })
    ).toBe(
      'https://afm.example.com/share/abc123?perm=comment&exp=2026-02-10T00%3A00%3A00.000Z&dl=1'
    );
  });

  it('builds a zip-friendly bundle manifest with expected files', () => {
    const manifest = buildBundleManifest({
      createdAt: '2026-02-09T00:00:00.000Z',
      shareLink: 'https://afm.example.com/share/abc123?perm=view',
      permission: 'view',
      expiresAt: null,
      allowDownload: true,
      title: 'Matchday Draft Report',
      match: 'vs. Westbridge',
      owner: 'Lead Analyst',
      clipCount: 2,
      totalDuration: '00:30',
      includeNotes: true
    });

    expect(manifest.version).toBe(1);
    expect(manifest.share.permission).toBe('view');
    expect(manifest.report.clipCount).toBe(2);
    expect(manifest.files.some((file) => file.filename === 'afm-report.json')).toBe(true);
    expect(manifest.files.some((file) => file.filename === 'afm-notes.json')).toBe(true);
    expect(manifest.files.some((file) => file.filename === 'afm-bundle-manifest.json')).toBe(true);
  });
});

