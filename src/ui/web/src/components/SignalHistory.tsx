import { useState } from 'react';
import { TrendChart } from './TrendChart';

const windows = [
  { label: '15m', points: [70, 78, 64, 82, 74] },
  { label: '30m', points: [62, 68, 72, 65, 70] },
  { label: '45m', points: [58, 60, 66, 69, 64] }
];

export const SignalHistory = () => {
  const [windowIndex, setWindowIndex] = useState(0);

  const points = windows[windowIndex].points.map((value, index) => ({
    label: `${index + 1}`,
    value
  }));

  return (
    <div className="signal-history">
      <div className="signal-header">
        <h4>Signal quality history</h4>
        <div className="segment">
          {windows.map((window, index) => (
            <button
              key={window.label}
              className={`segment-btn ${index === windowIndex ? 'active' : ''}`}
              onClick={() => setWindowIndex(index)}
            >
              {window.label}
            </button>
          ))}
        </div>
      </div>
      <TrendChart title="Signal quality" points={points} max={100} />
    </div>
  );
};
