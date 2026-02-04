export const liveStates = [
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

export const recommendations = [
  {
    title: 'Shift trap wide, then invert the 6',
    tradeoff: 'Space behind LB',
    confidence: 0.71,
    clips: 3
  }
];

export const coachHighlights = [
  {
    title: 'Press beaten 3x in last 6 minutes',
    meta: 'Clip 12s'
  },
  {
    title: 'Switches creating weak-side overloads',
    meta: 'Confidence 0.74'
  }
];

export const analystHighlights = [
  'Tactical timeline with auto-tags',
  'Overlay toggles for lines, spacing, trajectories',
  'Ask the match with clip-backed answers'
];

export const evidenceCards = [
  {
    title: 'Signal quality gating',
    body: 'Low visibility suppresses strong claims and flags the reason.'
  },
  {
    title: 'Clip-backed claims',
    body: 'Each tactical diagnosis links to 1-3 supporting clips.'
  },
  {
    title: 'Transparent confidence',
    body: 'Confidence scores cite tracking coverage and repetition.'
  }
];

export const metrics = [
  {
    value: '< 2 min',
    label: 'Time to first insight after upload'
  },
  {
    value: '30-60s',
    label: 'Now card refresh cadence'
  },
  {
    value: '10-15s',
    label: 'Evidence clip length'
  }
];

export const roadmap = [
  {
    stage: 'V1',
    detail: 'Broadcast upload, coach/analyst modes, evidence packs.'
  },
  {
    stage: 'V2',
    detail: 'Live stream ingest and low-latency collaboration.'
  },
  {
    stage: 'V3',
    detail: 'Tracking and event data integrations for higher fidelity.'
  },
  {
    stage: 'V4',
    detail: 'Broadcast-grade studio packs with narrative arcs.'
  }
];
