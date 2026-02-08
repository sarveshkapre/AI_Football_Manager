import type { Clip, Recommendation, Segment, TimelineEvent } from '../types';
import { clockToSeconds } from './time';

export interface SegmentReport {
  segmentId: string;
  title: string;
  summary: string;
  patterns: string[];
  adjustments: string[];
  clips: Clip[];
  confidence: number;
  signal: string;
  generatedAt: string;
}

interface BuildSegmentReportInput {
  segment: Segment;
  timeline: TimelineEvent[];
  recommendations: Recommendation[];
  queue: Clip[];
  clips: Clip[];
  generatedAt: string;
}

export const buildSegmentReport = ({
  segment,
  timeline,
  recommendations,
  queue,
  clips,
  generatedAt
}: BuildSegmentReportInput): SegmentReport => {
  const start = clockToSeconds(segment.start);
  const end = clockToSeconds(segment.end);
  const segmentEvents = timeline.filter((event) => {
    const minute = clockToSeconds(event.minute);
    if (minute === null || start === null || end === null) {
      return true;
    }
    return minute >= start && minute <= end;
  });

  const tagCounts = new Map<string, number>();
  segmentEvents.forEach((event) =>
    event.tags.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1))
  );

  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const patterns =
    topTags.length > 0
      ? topTags.map(([tag, count]) => `Repeated ${tag} sequences (${count}x).`)
      : ['No repeated patterns above threshold.'];

  const adjustments =
    recommendations.length > 0
      ? recommendations.slice(0, 3).map((rec) => `${rec.title} - Tradeoff: ${rec.tradeoff}.`)
      : ['Hold shape and wait for a clearer signal.'];

  const evidenceClips =
    queue.length > 0
      ? queue.slice(0, 5)
      : clips.filter((clip) => segmentEvents.some((event) => event.clipId === clip.id));

  const confidence =
    segmentEvents.length > 0
      ? Math.round(
          (segmentEvents.reduce((sum, event) => sum + event.confidence, 0) / segmentEvents.length) *
            100
        ) / 100
      : 0.6;

  const summary =
    segmentEvents.length > 0
      ? `During ${segment.label} (${segment.start}-${segment.end}), ${patterns[0].toLowerCase()}`
      : `During ${segment.label} (${segment.start}-${segment.end}), signal quality was ${segment.signal.toLowerCase()} and evidence was sparse.`;

  return {
    segmentId: segment.id,
    title: `${segment.label} report`,
    summary,
    patterns,
    adjustments,
    clips: evidenceClips,
    confidence,
    signal: segment.signal,
    generatedAt
  };
};
