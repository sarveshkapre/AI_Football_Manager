import type {
  AlignmentState,
  Clip,
  CoachCard,
  LiveEvent,
  LiveState,
  Moment,
  PipelineStep,
  Recommendation,
  ReportItem,
  Segment,
  Storyboard,
  TimelineEvent,
  UploadJob
} from '../types';

export interface ApiContract {
  getLiveState: () => Promise<LiveState>;
  getCoachCards: () => Promise<CoachCard[]>;
  getMoments: () => Promise<Moment[]>;
  getRecommendations: () => Promise<Recommendation[]>;
  getTimeline: () => Promise<TimelineEvent[]>;
  getReports: () => Promise<ReportItem[]>;
  getClipById: (id: string) => Promise<Clip>;
  getClips: () => Promise<Clip[]>;
  getStoryboards: () => Promise<Storyboard[]>;
  getLiveEvents: () => Promise<LiveEvent[]>;
  getUploads: () => Promise<UploadJob[]>;
  getSegments: () => Promise<Segment[]>;
  getPipeline: () => Promise<PipelineStep[]>;
  getAlignment: () => Promise<AlignmentState>;
}
