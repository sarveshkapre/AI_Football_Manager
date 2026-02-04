interface TrendPoint {
  label: string;
  value: number;
}

interface TrendChartProps {
  title: string;
  points: TrendPoint[];
  max?: number;
}

export const TrendChart = ({ title, points, max = 100 }: TrendChartProps) => {
  return (
    <div className="trend">
      <div className="trend-header">
        <h4>{title}</h4>
        <span className="pill">Last 15 min</span>
      </div>
      <div className="trend-bars">
        {points.map((point) => (
          <div key={point.label} className="trend-bar">
            <div
              className="trend-fill"
              style={{ height: `${(point.value / max) * 100}%` }}
            ></div>
            <span>{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
