import { useMemo } from 'react';
import { SectionHeader } from '../components/SectionHeader';
import { useAccess } from '../context/AccessContext';
import { usePreferences } from '../context/PreferencesContext';
import { useUi } from '../context/UiContext';
import type { AccessState } from '../context/AccessContext';

const cadenceOptions = [30, 60, 90] as const;

export const Settings = () => {
  const {
    notificationCadence,
    autoRefresh,
    ingestSimulation,
    setNotificationCadence,
    setAutoRefresh,
    setIngestSimulation
  } =
    usePreferences();
  const { density, setDensity } = useUi();
  const { access, setAccess, setAccessState } = useAccess();

  const presets: { id: string; label: string; state: AccessState }[] = [
    {
      id: 'full',
      label: 'Full staff',
      state: {
        coach: true,
        analyst: true,
        library: true,
        reports: true,
        ingest: true,
        settings: true,
        draft: true
      }
    },
    {
      id: 'coach',
      label: 'Coach bench',
      state: {
        coach: true,
        analyst: false,
        library: false,
        reports: true,
        ingest: true,
        settings: true,
        draft: true
      }
    },
    {
      id: 'analyst',
      label: 'Analyst room',
      state: {
        coach: false,
        analyst: true,
        library: true,
        reports: true,
        ingest: true,
        settings: true,
        draft: true
      }
    }
  ];

  const activePreset = useMemo(() => {
    const match = presets.find((preset) =>
      Object.keys(preset.state).every(
        (key) => preset.state[key as keyof AccessState] === access[key as keyof AccessState]
      )
    );
    return match?.id ?? 'custom';
  }, [access, presets]);

  const accessItems: { key: keyof AccessState; label: string; description: string }[] = [
    { key: 'ingest', label: 'Ingest', description: 'Uploads and alignment tools.' },
    { key: 'coach', label: 'Coach Mode', description: 'Now and Do Next cards.' },
    { key: 'analyst', label: 'Analyst Mode', description: 'Timeline, overlays, and chat.' },
    { key: 'library', label: 'Clip Library', description: 'Search and playlist clips.' },
    { key: 'reports', label: 'Reports', description: 'Exports, packs, and analytics.' },
    { key: 'draft', label: 'Draft Report', description: 'Pack builder and share flow.' }
  ];

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
                <h4>Ingest simulation</h4>
                <p>Cycle through live phases for demo mode.</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={ingestSimulation}
                  onChange={(event) => setIngestSimulation(event.target.checked)}
                />
                <span>{ingestSimulation ? 'On' : 'Off'}</span>
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
          <SectionHeader title="Access control" subtitle="Role-based permissions by view." />
          <div className="stack">
            <div className="row-card">
              <div>
                <h4>Role presets</h4>
                <p>Quickly align access for bench or analyst room.</p>
              </div>
              <div className="segment">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    className={`segment-btn ${activePreset === preset.id ? 'active' : ''}`}
                    onClick={() => setAccessState(preset.state)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="access-grid">
              {accessItems.map((item) => (
                <div className="access-row" key={item.key}>
                  <div>
                    <h4>{item.label}</h4>
                    <p>{item.description}</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={access[item.key]}
                      onChange={(event) => setAccess(item.key, event.target.checked)}
                    />
                    <span>{access[item.key] ? 'Enabled' : 'Disabled'}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
