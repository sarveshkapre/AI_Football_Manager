export const bumpRecentTags = ({
  recent,
  tag,
  cap
}: {
  recent: string[];
  tag: string;
  cap: number;
}) => {
  const trimmed = tag.trim();
  if (!trimmed) {
    return recent;
  }

  const next = [trimmed, ...recent.filter((entry) => entry !== trimmed)];
  return next.slice(0, Math.max(1, cap));
};
