import { useUi } from '../context/UiContext';

export const DensityToggle = () => {
  const { density, setDensity } = useUi();

  return (
    <div className="segment">
      <button
        className={`segment-btn ${density === 'standard' ? 'active' : ''}`}
        onClick={() => setDensity('standard')}
      >
        Standard
      </button>
      <button
        className={`segment-btn ${density === 'compact' ? 'active' : ''}`}
        onClick={() => setDensity('compact')}
      >
        Compact
      </button>
    </div>
  );
};
