import { useMemo } from 'react';
import { LiveStatus } from './components/LiveStatus';
import { ClipModal } from './components/Modal/ClipModal';
import { ReportQueue } from './components/ReportQueue';
import { ToastStack } from './components/Toast/ToastStack';
import { ClipProvider } from './context/ClipContext';
import { ReportProvider, useReportContext } from './context/ReportContext';
import { useHashRoute } from './hooks/useHashRoute';
import { useHotkeys } from './hooks/useHotkeys';
import { Analyst } from './pages/Analyst';
import { Coach } from './pages/Coach';
import { Library } from './pages/Library';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

const navItems = [
  { key: 'coach', label: 'Coach Mode', description: 'Live tactical guidance' },
  { key: 'analyst', label: 'Analyst Mode', description: 'Timeline + overlays' },
  { key: 'library', label: 'Clip Library', description: 'Evidence clips' },
  { key: 'reports', label: 'Reports', description: 'Packs and exports' },
  { key: 'settings', label: 'Settings', description: 'Roles and defaults' }
] as const;

const Shell = () => {
  const route = useHashRoute();
  const activeLabel = useMemo(
    () => navItems.find((item) => item.key === route)?.label ?? 'Coach Mode',
    [route]
  );
  const { queue } = useReportContext();

  useHotkeys({
    onCoach: () => {
      window.location.hash = '#coach';
    },
    onAnalyst: () => {
      window.location.hash = '#analyst';
    },
    onLibrary: () => {
      window.location.hash = '#library';
    },
    onReports: () => {
      window.location.hash = '#reports';
    },
    onSearch: () => {
      if (route === 'library') {
        const input = document.querySelector('.library-toolbar input') as HTMLInputElement | null;
        input?.focus();
      } else {
        window.location.hash = '#library';
      }
    }
  });

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
              {item.key === 'reports' && queue.length > 0 ? (
                <span className="nav-pill">{queue.length}</span>
              ) : null}
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
          {route === 'library' && <Library />}
          {route === 'reports' && <Reports />}
          {route === 'settings' && <Settings />}
        </div>
      </div>

      {route !== 'reports' && queue.length > 0 ? (
        <div className="queue-dock">
          <div>
            <h4>Report queue</h4>
            <p>{queue.length} clips selected</p>
          </div>
          <button className="btn" onClick={() => (window.location.hash = '#reports')}>
            Review
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default function App() {
  return (
    <ClipProvider>
      <ReportProvider>
        <Shell />
        <ToastStack />
        <ClipModal />
      </ReportProvider>
    </ClipProvider>
  );
}
