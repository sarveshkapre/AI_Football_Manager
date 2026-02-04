import { SectionHeader } from '../components/SectionHeader';
import { usePreferences } from '../context/PreferencesContext';
import { useUi } from '../context/UiContext';

const cadenceOptions = [30, 60, 90] as const;

export const Settings = () => {
  const { notificationCadence, autoRefresh, setNotificationCadence, setAutoRefresh } =
    usePreferences();
  const { density, setDensity } = useUi();

  return (
    <div className="page-content">
      <SectionHeader title="Settings" subtitle="Roles, permissions, and system defaults." />

      <div className="grid two">
        <div className="card surface">
          <SectionHeader title="Live preferences" subtitle="Notifications and refresh." />
          <div className="stack">
            <div className="row-card">
              <div>
                <h4>Notification cadence</h4>
                <p>How often to surface live events.</p>
              </div>
              <div className="segment">
                {cadenceOptions.map((option) => (
                  <button
                    key={option}
                    className={`segment-btn ${notificationCadence === option ? 'active' : ''}`}
                    onClick={() => setNotificationCadence(option)}
                  >
                    {option}s
                  </button>
                ))}
              </div>
            </div>
            <div className="row-card">
              <div>
                <h4>Auto-refresh live state</h4>
                <p>Keep match state updates running.</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(event) => setAutoRefresh(event.target.checked)}
                />
                <span>{autoRefresh ? 'On' : 'Off'}</span>
              </label>
            </div>
            <div className="row-card">
              <div>
                <h4>UI density</h4>
                <p>Compact mode for bench view.</p>
              </div>
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
            </div>
          </div>
        </div>
        <div className="card surface">
          <SectionHeader title="Roles" subtitle="Coach vs analyst access." />
          <div className="stack">
            <div className="row-card">
              <div>
                <h4>Coach view</h4>
                <p>Now/Do Next cards, key moments, evidence clips.</p>
              </div>
              <span className="pill">Enabled</span>
            </div>
            <div className="row-card">
              <div>
                <h4>Analyst view</h4>
                <p>Timeline, overlays, tagging, and report builder.</p>
              </div>
              <span className="pill">Enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
