import { useMemo } from 'react';
import { LiveStatus } from './components/LiveStatus';
import { useHashRoute } from './hooks/useHashRoute';
import { Analyst } from './pages/Analyst';
import { Coach } from './pages/Coach';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

const navItems = [
  { key: 'coach', label: 'Coach Mode', description: 'Live tactical guidance' },
  { key: 'analyst', label: 'Analyst Mode', description: 'Timeline + overlays' },
  { key: 'reports', label: 'Reports', description: 'Packs and exports' },
  { key: 'settings', label: 'Settings', description: 'Roles and defaults' }
] as const;

export default function App() {
  const route = useHashRoute();
  const activeLabel = useMemo(
    () => navItems.find((item) => item.key === route)?.label ?? 'Coach Mode',
    [route]
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" />
          <div>
            <p className="brand-name">AI Football Manager</p>
            <span className="brand-tag">Matchday Copilot</span>
          </div>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={`#${item.key}`}
              className={route === item.key ? 'active' : ''}
            >
              <div>
                <span>{item.label}</span>
                <p>{item.description}</p>
              </div>
            </a>
          ))}
        </nav>
        <div className="sidebar-footer">
          <LiveStatus />
          <button className="btn ghost">Invite staff</button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Matchday</p>
            <h1>{activeLabel}</h1>
          </div>
          <div className="topbar-actions">
            <button className="btn">Upload segment</button>
            <button className="btn primary">Share pack</button>
          </div>
        </header>

        <div className="content">
          {route === 'coach' && <Coach />}
          {route === 'analyst' && <Analyst />}
          {route === 'reports' && <Reports />}
          {route === 'settings' && <Settings />}
        </div>
      </div>
    </div>
  );
}
