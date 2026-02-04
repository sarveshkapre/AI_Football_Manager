import {
  CoachCard,
  LiveState,
  Moment,
  OverlayToggle,
  Recommendation,
  ReportItem,
  TimelineEvent
} from '../types';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    title: 'Stretch with RW high + pin fullback',
    detail: 'Create weak-side 1v1s to open central switch lane.',
    confidence: 0.66,
    clips: 2
  }
];

const moments: Moment[] = [
  { id: 'm1', label: 'Press beaten', detail: '63:05 - 12s clip' },
  { id: 'm2', label: 'Overload created', detail: '63:38 - 14s clip' },
  { id: 'm3', label: 'Dangerous turnover', detail: '64:10 - 10s clip' },
  { id: 'm4', label: 'Set-piece sequence', detail: '64:22 - 15s clip' }
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
  }
];

const timeline: TimelineEvent[] = [
  {
    id: 't1',
    minute: '58:10',
    label: 'Press trap fails on right',
    confidence: 0.77,
    tags: ['press', 'escape', 'right']
  },
  {
    id: 't2',
    minute: '60:42',
    label: 'Overload creates entry',
    confidence: 0.73,
    tags: ['overload', 'entry']
  },
  {
    id: 't3',
    minute: '62:05',
    label: 'Switch opens weak side',
    confidence: 0.7,
    tags: ['switch', 'weak-side']
  },
  {
    id: 't4',
    minute: '63:44',
    label: 'Turnover in zone 14',
    confidence: 0.65,
    tags: ['turnover', 'zone-14']
  }
];

const overlays: OverlayToggle[] = [
  { id: 'o1', label: 'Spacing box', enabled: true },
  { id: 'o2', label: 'Def/Mid/Att lines', enabled: true },
  { id: 'o3', label: 'Ball trajectory', enabled: false },
  { id: 'o4', label: 'Territory zones', enabled: false }
];

const reports: ReportItem[] = [
  { id: 'r1', title: 'Segment Report - Final Phase', status: 'Draft', updated: 'Today' },
  { id: 'r2', title: 'Match Report - vs. Westbridge', status: 'Ready', updated: 'Yesterday' },
  { id: 'r3', title: 'Opponent Scout - Press Patterns', status: 'Ready', updated: '2 days ago' }
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
  }
};
