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

export type UploadStatus = 'Uploading' | 'Processing' | 'Ready' | 'Failed';
export type SegmentStatus = 'Queued' | 'Analyzing' | 'Ready';
export type PipelineStatus = 'Complete' | 'In progress' | 'Queued';

export type TeamSide = 'home' | 'away';

export interface PlayerDot {
  id: string;
  x: number;
  y: number;
  team: TeamSide;
  role?: string;
  highlighted?: boolean;
}

export interface MinimapSnapshot {
  id: string;
  label: string;
  minute: string;
  phase: string;
  teamShape: string;
  inPossession: string;
  players: PlayerDot[];
}

export interface UploadJob {
  id: string;
  filename: string;
  status: UploadStatus;
  progress: number;
  duration: string;
  size: string;
  uploadedAt: string;
}

export interface Segment {
  id: string;
  label: string;
  start: string;
  end: string;
  status: SegmentStatus;
  signal: SignalQuality;
}

export interface PipelineStep {
  id: string;
  label: string;
  status: PipelineStatus;
  detail: string;
}

export interface AlignmentState {
  method: string;
  confidence: SignalQuality;
  offset: string;
  note: string;
}
