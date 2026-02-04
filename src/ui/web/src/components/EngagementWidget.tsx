const metrics = [
  { label: 'Avg clip opens', value: '3.2', detail: 'per recommendation' },
  { label: 'Recommendations used', value: '64%', detail: 'last 5 matches' },
  { label: 'Evidence engagement', value: 'High', detail: 'trend +8%' }
];

const topClips = [
  { title: 'Press beaten via RB-8 channel', opens: 12 },
  { title: 'Switch opens weak side', opens: 9 },
  { title: 'Turnover in zone 14', opens: 7 }
];

export const EngagementWidget = () => (
  <div className="engagement">
    <div className="engagement-metrics">
      {metrics.map((metric) => (
        <div key={metric.label} className="engagement-card">
          <p className="eyebrow">{metric.label}</p>
          <h3>{metric.value}</h3>
          <span className="muted">{metric.detail}</span>
        </div>
      ))}
    </div>
    <div className="engagement-list">
      <h4>Top evidence clips</h4>
      {topClips.map((clip) => (
        <div key={clip.title} className="engagement-row">
          <span>{clip.title}</span>
          <span className="pill">{clip.opens} opens</span>
        </div>
      ))}
    </div>
  </div>
);
