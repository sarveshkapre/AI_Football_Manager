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
}

export interface TimelineEvent {
  id: string;
  minute: string;
  label: string;
  confidence: number;
  tags: string[];
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
