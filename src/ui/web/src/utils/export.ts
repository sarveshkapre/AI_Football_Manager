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
