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
