export const downloadFile = (filename: string, content: string, mime = 'text/plain') => {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const buildCoverText = (title: string, summary: string, clips: string[]) => {
  return [
    'AI Football Manager',
    `Report: ${title}`,
    '',
    'Summary:',
    summary || 'No summary provided.',
    '',
    'Key clips:',
    ...clips.map((clip, index) => `${index + 1}. ${clip}`)
  ].join('\n');
};

export const buildPackStub = (
  metadata: Record<string, unknown>,
  csv: string,
  cover: string
) => {
  const payload = {
    metadata,
    files: {
      'report.csv': csv,
      'cover.txt': cover
    }
  };
  return JSON.stringify(payload, null, 2);
};

interface PresentationClip {
  id: string;
  title: string;
  duration: string;
  tags: string[];
}

interface PresentationPayload {
  title: string;
  match: string;
  owner: string;
  summary: string;
  totalDuration: string;
  clipCount: number;
  clips: PresentationClip[];
  labels?: Record<string, string[]>;
  annotations?: Record<string, string>;
}

export const buildPresentationHtml = ({
  title,
  match,
  owner,
  summary,
  totalDuration,
  clipCount,
  clips,
  labels = {},
  annotations = {}
}: PresentationPayload) => {
  const clipRows = clips
    .map((clip, index) => {
      const clipLabels = labels[clip.id] ?? [];
      const note = annotations[clip.id];
      const labelMarkup =
        clipLabels.length > 0
          ? `<div class="chips">${clipLabels
              .map((label) => `<span class="chip">${label}</span>`)
              .join('')}</div>`
          : '';
      const noteMarkup = note ? `<p class="note">${note}</p>` : '';
      return `<div class="clip">
        <div class="clip-meta">
          <div>
            <p class="eyebrow">Clip ${index + 1}</p>
            <h3>${clip.title}</h3>
            <p class="muted">${clip.duration} · ${clip.tags.join(' · ')}</p>
          </div>
          <span class="pill">${clip.duration}</span>
        </div>
        ${labelMarkup}
        ${noteMarkup}
      </div>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} · AI Football Manager</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #0b1f2a;
      --muted: #5c6b73;
      --surface: #ffffff;
      --surface-alt: #f4f6f8;
      --line: rgba(11, 31, 42, 0.12);
      --accent: #0f4c5c;
      --accent-soft: rgba(15, 76, 92, 0.12);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Space Grotesk", "Helvetica Neue", Arial, sans-serif;
      color: var(--ink);
      background: #eef2f4;
    }
    main {
      max-width: 980px;
      margin: 32px auto;
      padding: 0 24px 48px;
    }
    .hero {
      background: linear-gradient(135deg, #0f4c5c, #3a7ca5);
      color: #fff;
      border-radius: 28px;
      padding: 32px;
      display: grid;
      gap: 12px;
      box-shadow: 0 20px 45px rgba(15, 76, 92, 0.18);
    }
    .hero h1 {
      margin: 0;
      font-size: 2.4rem;
    }
    .hero p { margin: 0; opacity: 0.9; }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 8px;
    }
    .pill {
      background: rgba(255, 255, 255, 0.18);
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 0.85rem;
    }
    section {
      margin-top: 28px;
      background: var(--surface);
      border-radius: 22px;
      padding: 24px;
      border: 1px solid var(--line);
      box-shadow: 0 8px 24px rgba(11, 31, 42, 0.08);
    }
    .eyebrow {
      text-transform: uppercase;
      font-size: 0.72rem;
      letter-spacing: 0.12em;
      color: var(--muted);
      margin: 0 0 8px;
    }
    .summary {
      font-size: 1.05rem;
      color: var(--muted);
      line-height: 1.6;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-top: 18px;
    }
    .stat {
      background: var(--surface-alt);
      padding: 16px;
      border-radius: 16px;
      border: 1px solid var(--line);
    }
    .stat h3 { margin: 0; font-size: 1.4rem; }
    .stat p { margin: 4px 0 0; color: var(--muted); }
    .clip {
      padding: 18px;
      border-radius: 18px;
      background: var(--surface-alt);
      border: 1px solid var(--line);
      margin-bottom: 14px;
    }
    .clip-meta {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
    }
    .clip h3 { margin: 4px 0; }
    .muted { color: var(--muted); }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;
    }
    .chip {
      background: var(--accent-soft);
      color: var(--accent);
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
    }
    .note {
      margin: 10px 0 0;
      padding: 10px 12px;
      border-radius: 12px;
      background: #fff;
      border: 1px solid var(--line);
      color: var(--muted);
    }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <p class="eyebrow">AI Football Manager · Presentation Pack</p>
      <h1>${title}</h1>
      <p>${match} · Owner: ${owner}</p>
      <div class="meta">
        <span class="pill">${clipCount} clips</span>
        <span class="pill">${totalDuration} total</span>
      </div>
    </section>

    <section>
      <p class="eyebrow">Summary</p>
      <p class="summary">${summary || 'No summary provided.'}</p>
      <div class="stats">
        <div class="stat">
          <h3>${clipCount}</h3>
          <p>Evidence clips</p>
        </div>
        <div class="stat">
          <h3>${totalDuration}</h3>
          <p>Total clip duration</p>
        </div>
      </div>
    </section>

    <section>
      <p class="eyebrow">Evidence Clips</p>
      ${clipRows || '<p class="muted">No clips added to this pack.</p>'}
    </section>
  </main>
</body>
</html>`;
};

export const openHtmlPreview = (html: string) => {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

export const buildPrintableHtml = ({
  title,
  match,
  owner,
  summary,
  totalDuration,
  clipCount,
  clips,
  labels = {},
  annotations = {}
}: PresentationPayload) => {
  const clipRows = clips
    .map((clip, index) => {
      const clipLabels = labels[clip.id] ?? [];
      const note = annotations[clip.id];
      return `<tr>
        <td>${index + 1}</td>
        <td>
          <strong>${clip.title}</strong><br/>
          <span class="muted">${clip.tags.join(' · ')}</span>
          ${clipLabels.length > 0 ? `<div class="chips">${clipLabels
            .map((label) => `<span class="chip">${label}</span>`)
            .join('')}</div>` : ''}
          ${note ? `<div class="note">${note}</div>` : ''}
        </td>
        <td>${clip.duration}</td>
      </tr>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} · Print Pack</title>
  <style>
    :root {
      --ink: #0b1f2a;
      --muted: #5c6b73;
      --line: #d4d9dd;
      --accent: #0f4c5c;
      --accent-soft: #e6f0f2;
    }
    body {
      font-family: "Space Grotesk", "Helvetica Neue", Arial, sans-serif;
      color: var(--ink);
      margin: 32px;
      background: #fff;
    }
    header {
      border-bottom: 2px solid var(--line);
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    h1 { margin: 0 0 4px; font-size: 2rem; }
    .meta { display: flex; gap: 12px; flex-wrap: wrap; color: var(--muted); }
    .summary {
      margin-top: 16px;
      font-size: 1rem;
      line-height: 1.5;
      color: var(--muted);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
    }
    th, td {
      text-align: left;
      border-bottom: 1px solid var(--line);
      padding: 12px 8px;
      vertical-align: top;
    }
    th { color: var(--muted); font-weight: 600; }
    .muted { color: var(--muted); }
    .chips { margin-top: 6px; display: flex; gap: 6px; flex-wrap: wrap; }
    .chip { background: var(--accent-soft); color: var(--accent); padding: 2px 8px; border-radius: 999px; font-size: 0.75rem; }
    .note {
      margin-top: 8px;
      padding: 8px 10px;
      background: #f7f8f9;
      border: 1px solid var(--line);
      border-radius: 8px;
      color: var(--muted);
      font-size: 0.9rem;
    }
    @media print {
      body { margin: 16mm; }
      header { page-break-after: avoid; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <header>
    <h1>${title}</h1>
    <div class="meta">
      <span>${match}</span>
      <span>Owner: ${owner}</span>
      <span>${clipCount} clips</span>
      <span>${totalDuration} total</span>
    </div>
    <div class="summary">${summary || 'No summary provided.'}</div>
  </header>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Clip</th>
        <th>Duration</th>
      </tr>
    </thead>
    <tbody>
      ${clipRows || '<tr><td colspan="3" class="muted">No clips added.</td></tr>'}
    </tbody>
  </table>
</body>
</html>`;
};

interface EvidenceClipManifest {
  id: string;
  title: string;
  duration: string;
  tags: string[];
  overlays: { id: string; label: string; enabled: boolean }[];
  labels?: string[];
  annotation?: string;
}

export const buildEvidencePackage = (
  metadata: Record<string, unknown>,
  clips: EvidenceClipManifest[]
) => {
  const payload = {
    metadata,
    clips,
    generatedAt: new Date().toISOString()
  };
  return JSON.stringify(payload, null, 2);
};

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) => {
  const words = text.split(' ');
  let line = '';
  let lines = 0;

  for (let i = 0; i < words.length; i += 1) {
    const testLine = `${line}${words[i]} `;
    if (ctx.measureText(testLine).width > maxWidth && line !== '') {
      ctx.fillText(line.trim(), x, y);
      line = `${words[i]} `;
      y += lineHeight;
      lines += 1;
      if (lines >= maxLines) {
        return;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, y);
};

export const downloadCoverImage = (
  title: string,
  match: string,
  summary: string,
  filename = 'afm-cover.png'
) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#0f4c5c');
  gradient.addColorStop(1, '#3a7ca5');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = '600 28px "Space Grotesk", Arial';
  ctx.fillText('AI Football Manager', 80, 120);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 64px "Space Grotesk", Arial';
  wrapText(ctx, title, 80, 210, 900, 72, 3);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '500 28px "Source Sans 3", Arial';
  ctx.fillText(match, 80, 430);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = '400 24px "Source Sans 3", Arial';
  wrapText(ctx, summary || 'Add a short summary to guide the staff.', 80, 490, 900, 34, 6);

  canvas.toBlob((blob) => {
    if (!blob) {
      return;
    }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  });
};
