import type { Clip, CoachCard, LiveEvent, LiveState, Moment, Recommendation, ReportItem, Storyboard, TimelineEvent } from '../types';

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
}
