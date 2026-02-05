import {
  CoachCard,
  Clip,
  LiveEvent,
  LiveState,
  Moment,
  MinimapSnapshot,
  OverlayToggle,
  PipelineStep,
  Recommendation,
  ReportItem,
  Segment,
  Storyboard,
  TimelineEvent,
  UploadJob,
  AlignmentState
} from '../types';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const overlays: OverlayToggle[] = [
  { id: 'o1', label: 'Spacing box', enabled: true },
  { id: 'o2', label: 'Def/Mid/Att lines', enabled: true },
  { id: 'o3', label: 'Ball trajectory', enabled: false },
  { id: 'o4', label: 'Territory zones', enabled: false }
];

const clips: Clip[] = [
  {
    id: 'clip-1',
    title: 'Press beaten via RB-8 channel',
    duration: '0:12',
    tags: ['press', 'escape', 'right'],
    overlays
  },
  {
    id: 'clip-2',
    title: 'Switch opens weak side',
    duration: '0:14',
    tags: ['switch', 'overload'],
    overlays
  },
  {
    id: 'clip-3',
    title: 'Turnover in zone 14',
    duration: '0:10',
    tags: ['turnover', 'zone-14'],
    overlays
  },
  {
    id: 'clip-4',
    title: 'Set-piece sequence',
    duration: '0:15',
    tags: ['set-piece'],
    overlays
  },
  {
    id: 'clip-5',
    title: 'Overlap frees the wide channel',
    duration: '0:11',
    tags: ['overlap', 'wide'],
    overlays
  },
  {
    id: 'clip-6',
    title: 'High regain after counterpress',
    duration: '0:09',
    tags: ['counterpress', 'regain'],
    overlays
  }
];

const liveStates: LiveState[] = [
  {
    minute: '63:12',
    signal: 'High',
    confidence: 0.78,
    clips: 3,
    insights: [
      'Opposition 4-4-2 mid-block, compact central lanes.',
      'Our progression is stalling in the RB-8 channel.',
      'Transition risk rising after wide overloads.'
    ]
  },
  {
    minute: '64:02',
    signal: 'Med',
    confidence: 0.65,
    clips: 2,
    insights: [
      'Press intensity dropping on their left side.',
      'Switches to RW are creating 1v1 isolations.',
      'Second-ball recoveries favor them in zone 14.'
    ]
  },
  {
    minute: '64:46',
    signal: 'High',
    confidence: 0.81,
    clips: 3,
    insights: [
      'Their 9 is screening the 6; center access is blocked.',
      'Our 8 is arriving late into half-space pockets.',
      'Counterpress success improving after lost duels.'
    ]
  }
];

const coachCards: CoachCard[] = [
  {
    id: 'now-1',
    type: 'now',
    title: 'Compact mid-block, central lanes closed',
    detail: 'Opposition front two are screening passes into 6 + 8s.',
    confidence: 0.78,
    clips: 3
  },
  {
    id: 'now-2',
    type: 'now',
    title: 'Press beaten via RB-8 channel',
    detail: 'They escape through the right half-space 3x in 6 minutes.',
    confidence: 0.72,
    clips: 2
  },
  {
    id: 'next-1',
    type: 'next',
    title: 'Shift trap wide, then invert the 6',
    detail: 'Invite wide progression then collapse with the 6 to block inside return.',
    confidence: 0.71,
    clips: 3
  },
  {
    id: 'next-2',
    type: 'next',
    title: 'Stagger 8s to occupy half-spaces',
    detail: 'Create dual interior targets for switches.',
    confidence: 0.66,
    clips: 2
  }
];

const moments: Moment[] = [
  { id: 'm1', label: 'Press beaten', detail: '63:05 - 12s clip', clipId: 'clip-1' },
  { id: 'm2', label: 'Overload created', detail: '63:38 - 14s clip', clipId: 'clip-2' },
  { id: 'm3', label: 'Dangerous turnover', detail: '64:10 - 10s clip', clipId: 'clip-3' },
  { id: 'm4', label: 'Set-piece sequence', detail: '64:22 - 15s clip', clipId: 'clip-4' }
];

const recommendations: Recommendation[] = [
  {
    id: 'rec-1',
    title: 'Shift trap wide, then invert the 6',
    tradeoff: 'Space behind LB',
    confidence: 0.71,
    clips: 3
  },
  {
    id: 'rec-2',
    title: 'Stagger 8s to occupy half-spaces',
    tradeoff: 'Less counterpress coverage',
    confidence: 0.64,
    clips: 2
  },
  {
    id: 'rec-3',
    title: 'Pin fullback to free the switch',
    tradeoff: 'Wingback recovery coverage',
    confidence: 0.68,
    clips: 2
  }
];

const timeline: TimelineEvent[] = [
  {
    id: 't1',
    minute: '58:10',
    label: 'Press trap fails on right',
    confidence: 0.77,
    tags: ['press', 'escape', 'right'],
    clipId: 'clip-1'
  },
  {
    id: 't2',
    minute: '60:42',
    label: 'Overload creates entry',
    confidence: 0.73,
    tags: ['overload', 'entry'],
    clipId: 'clip-2'
  },
  {
    id: 't3',
    minute: '62:05',
    label: 'Switch opens weak side',
    confidence: 0.7,
    tags: ['switch', 'weak-side'],
    clipId: 'clip-2'
  },
  {
    id: 't4',
    minute: '63:44',
    label: 'Turnover in zone 14',
    confidence: 0.65,
    tags: ['turnover', 'zone-14'],
    clipId: 'clip-3'
  },
  {
    id: 't5',
    minute: '65:02',
    label: 'Left-sided overload forms',
    confidence: 0.71,
    tags: ['overload', 'left', 'entry'],
    clipId: 'clip-2'
  },
  {
    id: 't6',
    minute: '66:12',
    label: 'Press trigger on their left',
    confidence: 0.74,
    tags: ['press', 'trigger', 'left'],
    clipId: 'clip-1'
  }
];

const reports: ReportItem[] = [
  { id: 'r1', title: 'Segment Report - Final Phase', status: 'Draft', updated: 'Today' },
  { id: 'r2', title: 'Match Report - vs. Westbridge', status: 'Ready', updated: 'Yesterday' },
  { id: 'r3', title: 'Opponent Scout - Press Patterns', status: 'Ready', updated: '2 days ago' }
];

const storyboards: Storyboard[] = [
  {
    id: 'sb1',
    title: 'Press escapes',
    clips: [clips[0], clips[5]],
    updated: 'Today'
  },
  {
    id: 'sb2',
    title: 'Weak-side overloads',
    clips: [clips[1], clips[4]],
    updated: 'Yesterday'
  }
];

const liveEvents: LiveEvent[] = [
  {
    id: 'e1',
    timestamp: '63:20',
    message: 'Press trigger spotted on their left side. Trap recommended.',
    confidence: 0.74,
    clipId: 'clip-1'
  },
  {
    id: 'e2',
    timestamp: '63:45',
    message: 'Weak-side overload created after switch. Consider pinning fullback.',
    confidence: 0.7,
    clipId: 'clip-2'
  },
  {
    id: 'e3',
    timestamp: '64:12',
    message: 'Turnover in zone 14. Transition risk rising.',
    confidence: 0.66,
    clipId: 'clip-3'
  }
];

const signalHistory = [
  { minute: '62', value: 72 },
  { minute: '63', value: 78 },
  { minute: '64', value: 66 },
  { minute: '65', value: 81 },
  { minute: '66', value: 69 },
  { minute: '67', value: 74 }
];

const uploads: UploadJob[] = [
  {
    id: 'upload-1',
    filename: 'ARS-vs-WBR-2H.mp4',
    status: 'Processing',
    progress: 62,
    duration: '45:12',
    size: '1.4 GB',
    uploadedAt: '2 min ago'
  },
  {
    id: 'upload-2',
    filename: 'Training-pressing-drill.mp4',
    status: 'Ready',
    progress: 100,
    duration: '18:20',
    size: '620 MB',
    uploadedAt: 'Today'
  }
];

const segments: Segment[] = [
  {
    id: 'seg-1',
    label: 'Final phase',
    start: '63:00',
    end: '80:00',
    status: 'Analyzing',
    signal: 'Med'
  },
  {
    id: 'seg-2',
    label: 'Opening press',
    start: '03:00',
    end: '15:00',
    status: 'Ready',
    signal: 'High'
  },
  {
    id: 'seg-3',
    label: 'Set-piece wave',
    start: '48:00',
    end: '54:00',
    status: 'Queued',
    signal: 'Low'
  }
];

const pipeline: PipelineStep[] = [
  {
    id: 'pipe-1',
    label: 'Decode + sync',
    status: 'Complete',
    detail: 'Frames extracted and audio aligned'
  },
  {
    id: 'pipe-2',
    label: 'Tracking + registration',
    status: 'In progress',
    detail: '7/11 players tracked with stable ID'
  },
  {
    id: 'pipe-3',
    label: 'Tactical events',
    status: 'Queued',
    detail: 'Press, overload, and switch detectors'
  },
  {
    id: 'pipe-4',
    label: 'Clip + overlay render',
    status: 'Queued',
    detail: '10–15s evidence clips'
  }
];

const alignment: AlignmentState = {
  method: 'Scoreboard OCR',
  confidence: 'Med',
  offset: '+00:12',
  note: 'Scoreboard visible 68% of frames'
};

const minimapSnapshots: MinimapSnapshot[] = [
  {
    id: 'mm-1',
    label: 'In possession',
    minute: '63:20',
    phase: 'Sustained attack',
    teamShape: '3-2-5',
    inPossession: 'Home',
    players: [
      { id: 'h1', x: 18, y: 14, team: 'home' },
      { id: 'h2', x: 22, y: 38, team: 'home' },
      { id: 'h3', x: 26, y: 62, team: 'home' },
      { id: 'h4', x: 40, y: 22, team: 'home' },
      { id: 'h5', x: 44, y: 52, team: 'home', highlighted: true },
      { id: 'h6', x: 52, y: 32, team: 'home' },
      { id: 'h7', x: 58, y: 68, team: 'home' },
      { id: 'h8', x: 68, y: 28, team: 'home' },
      { id: 'h9', x: 76, y: 50, team: 'home' },
      { id: 'h10', x: 72, y: 76, team: 'home' },
      { id: 'h11', x: 84, y: 42, team: 'home' },
      { id: 'a1', x: 30, y: 10, team: 'away' },
      { id: 'a2', x: 34, y: 32, team: 'away' },
      { id: 'a3', x: 36, y: 58, team: 'away' },
      { id: 'a4', x: 46, y: 16, team: 'away' },
      { id: 'a5', x: 50, y: 40, team: 'away' },
      { id: 'a6', x: 54, y: 64, team: 'away' },
      { id: 'a7', x: 62, y: 20, team: 'away' },
      { id: 'a8', x: 62, y: 48, team: 'away' },
      { id: 'a9', x: 64, y: 72, team: 'away' },
      { id: 'a10', x: 72, y: 32, team: 'away' },
      { id: 'a11', x: 74, y: 56, team: 'away' }
    ]
  },
  {
    id: 'mm-2',
    label: 'Out of possession',
    minute: '64:05',
    phase: 'Mid-block',
    teamShape: '4-4-2',
    inPossession: 'Away',
    players: [
      { id: 'h1', x: 30, y: 18, team: 'home' },
      { id: 'h2', x: 32, y: 38, team: 'home' },
      { id: 'h3', x: 34, y: 60, team: 'home' },
      { id: 'h4', x: 40, y: 12, team: 'home' },
      { id: 'h5', x: 42, y: 30, team: 'home' },
      { id: 'h6', x: 42, y: 50, team: 'home' },
      { id: 'h7', x: 44, y: 70, team: 'home' },
      { id: 'h8', x: 52, y: 24, team: 'home' },
      { id: 'h9', x: 52, y: 46, team: 'home' },
      { id: 'h10', x: 54, y: 66, team: 'home', highlighted: true },
      { id: 'h11', x: 62, y: 42, team: 'home' },
      { id: 'a1', x: 18, y: 24, team: 'away' },
      { id: 'a2', x: 22, y: 44, team: 'away' },
      { id: 'a3', x: 24, y: 64, team: 'away' },
      { id: 'a4', x: 32, y: 20, team: 'away' },
      { id: 'a5', x: 34, y: 40, team: 'away' },
      { id: 'a6', x: 36, y: 60, team: 'away' },
      { id: 'a7', x: 48, y: 18, team: 'away' },
      { id: 'a8', x: 50, y: 38, team: 'away' },
      { id: 'a9', x: 50, y: 62, team: 'away' },
      { id: 'a10', x: 64, y: 32, team: 'away' },
      { id: 'a11', x: 66, y: 52, team: 'away' }
    ]
  },
  {
    id: 'mm-3',
    label: 'High press',
    minute: '65:18',
    phase: 'Press trigger',
    teamShape: '4-2-4',
    inPossession: 'Away',
    players: [
      { id: 'h1', x: 22, y: 18, team: 'home' },
      { id: 'h2', x: 26, y: 36, team: 'home' },
      { id: 'h3', x: 28, y: 62, team: 'home' },
      { id: 'h4', x: 34, y: 14, team: 'home' },
      { id: 'h5', x: 38, y: 32, team: 'home' },
      { id: 'h6', x: 38, y: 52, team: 'home' },
      { id: 'h7', x: 40, y: 72, team: 'home' },
      { id: 'h8', x: 54, y: 24, team: 'home' },
      { id: 'h9', x: 54, y: 46, team: 'home' },
      { id: 'h10', x: 56, y: 66, team: 'home' },
      { id: 'h11', x: 64, y: 42, team: 'home' },
      { id: 'a1', x: 10, y: 26, team: 'away' },
      { id: 'a2', x: 12, y: 46, team: 'away' },
      { id: 'a3', x: 14, y: 66, team: 'away' },
      { id: 'a4', x: 24, y: 20, team: 'away' },
      { id: 'a5', x: 26, y: 40, team: 'away', highlighted: true },
      { id: 'a6', x: 28, y: 60, team: 'away' },
      { id: 'a7', x: 42, y: 18, team: 'away' },
      { id: 'a8', x: 44, y: 38, team: 'away' },
      { id: 'a9', x: 44, y: 62, team: 'away' },
      { id: 'a10', x: 58, y: 32, team: 'away' },
      { id: 'a11', x: 60, y: 52, team: 'away' }
    ]
  },
  {
    id: 'mm-4',
    label: 'Switching lanes',
    minute: '66:08',
    phase: 'Weak-side overload',
    teamShape: '3-2-5',
    inPossession: 'Home',
    players: [
      { id: 'h1', x: 16, y: 14, team: 'home' },
      { id: 'h2', x: 20, y: 38, team: 'home' },
      { id: 'h3', x: 24, y: 62, team: 'home' },
      { id: 'h4', x: 38, y: 18, team: 'home' },
      { id: 'h5', x: 42, y: 44, team: 'home' },
      { id: 'h6', x: 44, y: 70, team: 'home' },
      { id: 'h7', x: 56, y: 24, team: 'home' },
      { id: 'h8', x: 62, y: 42, team: 'home' },
      { id: 'h9', x: 68, y: 64, team: 'home', highlighted: true },
      { id: 'h10', x: 76, y: 30, team: 'home' },
      { id: 'h11', x: 82, y: 50, team: 'home' },
      { id: 'a1', x: 26, y: 12, team: 'away' },
      { id: 'a2', x: 30, y: 34, team: 'away' },
      { id: 'a3', x: 32, y: 56, team: 'away' },
      { id: 'a4', x: 44, y: 16, team: 'away' },
      { id: 'a5', x: 48, y: 38, team: 'away' },
      { id: 'a6', x: 50, y: 60, team: 'away' },
      { id: 'a7', x: 58, y: 20, team: 'away' },
      { id: 'a8', x: 60, y: 46, team: 'away' },
      { id: 'a9', x: 62, y: 72, team: 'away' },
      { id: 'a10', x: 70, y: 34, team: 'away' },
      { id: 'a11', x: 72, y: 54, team: 'away' }
    ]
  }
];

export const api = {
  async getLiveState() {
    await wait(300);
    const index = Math.floor(Math.random() * liveStates.length);
    return liveStates[index];
  },
  async getCoachCards() {
    await wait(200);
    return coachCards;
  },
  async getMoments() {
    await wait(180);
    return moments;
  },
  async getRecommendations() {
    await wait(180);
    return recommendations;
  },
  async getTimeline() {
    await wait(220);
    return timeline;
  },
  async getOverlays() {
    await wait(160);
    return overlays;
  },
  async getReports() {
    await wait(200);
    return reports;
  },
  async getClipById(id: string) {
    await wait(120);
    return clips.find((clip) => clip.id === id) ?? clips[0];
  },
  async getClips() {
    await wait(160);
    return clips;
  },
  async getStoryboards() {
    await wait(160);
    return storyboards;
  },
  async getLiveEvents() {
    await wait(180);
    const shuffled = [...liveEvents].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
  },
  async getUploads() {
    await wait(140);
    return uploads;
  },
  async getSegments() {
    await wait(140);
    return segments;
  },
  async getPipeline() {
    await wait(140);
    return pipeline;
  },
  async getAlignment() {
    await wait(120);
    return alignment;
  },
  async getMinimapSnapshots() {
    await wait(160);
    return minimapSnapshots;
  },
  async getSignalHistory() {
    await wait(120);
    return signalHistory;
  }
};
