export const formatClockTime = (iso: string | null) => {
  if (!iso) {
    return '--';
  }
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const parseClockParts = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parts = trimmed.split(':');
  if (parts.length !== 2 && parts.length !== 3) {
    return null;
  }
  const parsed = parts.map((part) => Number(part));
  if (parsed.some((part) => Number.isNaN(part) || part < 0 || !Number.isInteger(part))) {
    return null;
  }
  if (parsed[parsed.length - 1] >= 60) {
    return null;
  }
  if (parsed.length === 3 && parsed[1] >= 60) {
    return null;
  }
  return parsed;
};

export const durationToSeconds = (duration: string) => {
  const parts = parseClockParts(duration);
  if (!parts) {
    return 0;
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
};

export const clockToSeconds = (clock: string) => {
  const parts = parseClockParts(clock);
  if (!parts) {
    return null;
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return null;
};

export const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
