export type SharePermission = 'view' | 'comment' | 'edit';
export type ShareExpiry = '1h' | '24h' | '7d' | '30d' | 'never';

const expiryMs: Record<Exclude<ShareExpiry, 'never'>, number> = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000
};

export const computeExpiresAt = (expiry: ShareExpiry, issuedAt: Date): string | null => {
  if (expiry === 'never') {
    return null;
  }
  const ms = expiryMs[expiry];
  return new Date(issuedAt.getTime() + ms).toISOString();
};

export const buildShareLink = ({
  baseUrl,
  token,
  permission,
  expiresAt,
  allowDownload
}: {
  baseUrl: string;
  token: string;
  permission: SharePermission;
  expiresAt: string | null;
  allowDownload: boolean;
}) => {
  const origin = baseUrl.replace(/\/+$/, '');
  const url = new URL(`${origin}/share/${encodeURIComponent(token)}`);
  url.searchParams.set('perm', permission);
  if (expiresAt) {
    url.searchParams.set('exp', expiresAt);
  }
  if (allowDownload) {
    url.searchParams.set('dl', '1');
  }
  return url.toString();
};

export interface BundleManifestFile {
  filename: string;
  suggestedPath: string;
  mime: string;
  description: string;
  required: boolean;
}

export interface BundleManifest {
  version: number;
  createdAt: string;
  share: {
    link: string;
    permission: SharePermission;
    expiresAt: string | null;
    allowDownload: boolean;
  };
  report: {
    title: string;
    match: string;
    owner: string;
    clipCount: number;
    totalDuration: string;
  };
  files: BundleManifestFile[];
}

export const buildBundleManifest = ({
  createdAt,
  shareLink,
  permission,
  expiresAt,
  allowDownload,
  title,
  match,
  owner,
  clipCount,
  totalDuration,
  includeNotes
}: {
  createdAt: string;
  shareLink: string;
  permission: SharePermission;
  expiresAt: string | null;
  allowDownload: boolean;
  title: string;
  match: string;
  owner: string;
  clipCount: number;
  totalDuration: string;
  includeNotes: boolean;
}): BundleManifest => {
  const files: BundleManifestFile[] = [
    {
      filename: 'afm-report.json',
      suggestedPath: 'report/afm-report.json',
      mime: 'application/json',
      description: 'Report payload (clips + metadata).',
      required: true
    },
    {
      filename: 'afm-report.csv',
      suggestedPath: 'report/afm-report.csv',
      mime: 'text/csv',
      description: 'Flat clip table for spreadsheets.',
      required: true
    },
    {
      filename: 'afm-cover.txt',
      suggestedPath: 'cover/afm-cover.txt',
      mime: 'text/plain',
      description: 'Presentation cover text.',
      required: false
    },
    {
      filename: 'afm-cover.png',
      suggestedPath: 'cover/afm-cover.png',
      mime: 'image/png',
      description: 'Presentation cover image.',
      required: false
    },
    {
      filename: 'afm-presentation.html',
      suggestedPath: 'presentation/afm-presentation.html',
      mime: 'text/html',
      description: 'Presentation pack HTML.',
      required: false
    },
    {
      filename: 'afm-pack.json',
      suggestedPath: 'pack/afm-pack.json',
      mime: 'application/json',
      description: 'Prototype pack stub (CSV + cover).',
      required: false
    }
  ];

  if (includeNotes) {
    files.push({
      filename: 'afm-notes.json',
      suggestedPath: 'notes/afm-notes.json',
      mime: 'application/json',
      description: 'Clip notes (annotations + labels).',
      required: false
    });
  }

  files.push({
    filename: 'afm-bundle-manifest.json',
    suggestedPath: 'manifest/afm-bundle-manifest.json',
    mime: 'application/json',
    description: 'This manifest file.',
    required: true
  });

  return {
    version: 1,
    createdAt,
    share: {
      link: shareLink,
      permission,
      expiresAt,
      allowDownload
    },
    report: {
      title,
      match,
      owner,
      clipCount,
      totalDuration
    },
    files
  };
};

