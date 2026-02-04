export type SignalQuality = 'High' | 'Med' | 'Low';

export interface LiveState {
  minute: string;
  signal: SignalQuality;
  confidence: number;
  clips: number;
  insights: string[];
}

export interface Recommendation {
  id: string;
  title: string;
  tradeoff: string;
  confidence: number;
  clips: number;
}

export interface CoachCard {
  id: string;
  type: 'now' | 'next';
  title: string;
  detail: string;
  confidence: number;
  clips: number;
}

export interface Moment {
  id: string;
  label: string;
  detail: string;
  clipId: string;
}

export interface TimelineEvent {
  id: string;
  minute: string;
  label: string;
  confidence: number;
  tags: string[];
  clipId: string;
}

export interface OverlayToggle {
  id: string;
  label: string;
  enabled: boolean;
}

export interface ReportItem {
  id: string;
  title: string;
  status: 'Draft' | 'Ready';
  updated: string;
}

export interface Clip {
  id: string;
  title: string;
  duration: string;
  tags: string[];
  overlays: OverlayToggle[];
}

export interface LiveEvent {
  id: string;
  timestamp: string;
  message: string;
  confidence: number;
  clipId: string;
}

export interface Storyboard {
  id: string;
  title: string;
  clips: Clip[];
  updated: string;
}
