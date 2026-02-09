import { useEffect, useMemo, useState } from 'react';
import { LiveStatus } from './components/LiveStatus';
import { ClipModal } from './components/Modal/ClipModal';
import { PreferencesBridge } from './components/PreferencesBridge';
import { ToastStack } from './components/Toast/ToastStack';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HotkeyHelpModal } from './components/HotkeyHelpModal';
import { OnboardingTourModal } from './components/OnboardingTourModal';
import { AccessProvider, useAccess } from './context/AccessContext';
import { AnnotationsProvider } from './context/AnnotationsContext';
import { AuditProvider } from './context/AuditContext';
import { ClipProvider } from './context/ClipContext';
import { InvitesProvider } from './context/InvitesContext';
import { LabelsProvider } from './context/LabelsContext';
import { LibraryProvider } from './context/LibraryContext';
import { PreferencesProvider } from './context/PreferencesContext';
import { ReportProvider, useReportContext } from './context/ReportContext';
import { StoryboardProvider } from './context/StoryboardContext';
import { TelestrationProvider } from './context/TelestrationContext';
import { UiProvider, useUi } from './context/UiContext';
import { useHashRoute } from './hooks/useHashRoute';
import { useHotkeys } from './hooks/useHotkeys';
import { Analyst } from './pages/Analyst';
import { Coach } from './pages/Coach';
import { DraftReport } from './pages/DraftReport';
import { Ingest } from './pages/Ingest';
import { Library } from './pages/Library';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { loadFromStorageWithGuard, saveToStorage } from './utils/storage';

const navItems = [
  { key: 'ingest', label: 'Ingest', description: 'Upload + align video' },
  { key: 'coach', label: 'Coach Mode', description: 'Live tactical guidance' },
  { key: 'analyst', label: 'Analyst Mode', description: 'Timeline + overlays' },
  { key: 'library', label: 'Clip Library', description: 'Evidence clips' },
  { key: 'reports', label: 'Reports', description: 'Packs and exports' },
  { key: 'settings', label: 'Settings', description: 'Roles and defaults' }
] as const;

const routeLabels: Record<string, string> = {
  coach: 'Coach Mode',
  analyst: 'Analyst Mode',
  library: 'Clip Library',
  reports: 'Reports',
  settings: 'Settings',
  draft: 'Draft Report',
  ingest: 'Ingest'
};

const preferredFallbackOrder = [
  'coach',
  'analyst',
  'library',
  'reports',
  'ingest',
  'settings',
  'draft'
] as const;

const firstAllowedRoute = (access: Record<string, boolean>) => {
  for (const key of preferredFallbackOrder) {
    if (access[key]) {
      return key;
    }
  }
  return 'settings';
};

const onboardingKey = 'afm.onboarding.v1.seen';
const openInviteKey = 'afm.ui.invite.open';

const Shell = () => {
  const route = useHashRoute();
  const activeLabel = useMemo(() => routeLabels[route] ?? 'Coach Mode', [route]);
  const { queue } = useReportContext();
  const { density } = useUi();
  const { access } = useAccess();
  const [helpOpen, setHelpOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(() => {
    const seen = loadFromStorageWithGuard(onboardingKey, false, (value): value is boolean =>
      typeof value === 'boolean'
    );
    return !seen;
  });

  const allowedNavItems = useMemo(
    () => navItems.filter((item) => access[item.key as keyof typeof access]),
    [access]
  );

  const isAllowed = access[route] ?? false;

  const navigate = (target: keyof typeof access) => {
    if (access[target]) {
      window.location.hash = `#${target}`;
      return;
    }

    if (target === 'draft' && access.reports) {
      window.location.hash = '#reports';
      return;
    }

    const fallback = firstAllowedRoute(access);
    window.location.hash = `#${fallback}`;
  };

  useEffect(() => {
    if (!isAllowed) {
      const fallback = firstAllowedRoute(access);
      if (fallback !== route) {
        window.location.hash = `#${fallback}`;
      }
    }
  }, [access, isAllowed, route]);

  useHotkeys({
    onCoach: () => {
      navigate('coach');
    },
    onAnalyst: () => {
      navigate('analyst');
    },
    onLibrary: () => {
      navigate('library');
    },
    onReports: () => {
      navigate('reports');
    },
    onIngest: () => {
      navigate('ingest');
    },
    onSearch: () => {
      if (route === 'library') {
        const input = document.querySelector('.library-toolbar input') as HTMLInputElement | null;
        input?.focus();
      } else {
        navigate('library');
      }
    },
    onHelp: () => {
      setHelpOpen((prev) => !prev);
    },
    onEscape: () => {
      setHelpOpen(false);
      setTourOpen(false);
    }
  });

  return (
    <div className={`app-shell density-${density}`}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" />
          <div>
            <p className="brand-name">AI Football Manager</p>
            <span className="brand-tag">Matchday Copilot</span>
          </div>
        </div>
        <nav className="nav" aria-label="Primary">
          {allowedNavItems.map((item) => (
            <a
              key={item.key}
              href={`#${item.key}`}
              className={route === item.key ? 'active' : ''}
              aria-current={route === item.key ? 'page' : undefined}
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
          <button
            className="btn ghost"
            onClick={() => {
              saveToStorage(openInviteKey, true);
              navigate('settings');
            }}
          >
            Invite staff
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Matchday</p>
            <h1>{activeLabel}</h1>
          </div>
          <div className="topbar-actions">
            <button className="btn ghost" onClick={() => setHelpOpen(true)}>
              Hotkeys
            </button>
            <button className="btn" onClick={() => navigate('ingest')}>
              Upload segment
            </button>
            <button className="btn primary" onClick={() => navigate('draft')}>
              Share pack
            </button>
          </div>
        </header>

        <main id="main-content" className="content" tabIndex={-1}>
          {isAllowed && route === 'ingest' && <Ingest />}
          {isAllowed && route === 'coach' && <Coach />}
          {isAllowed && route === 'analyst' && <Analyst />}
          {isAllowed && route === 'library' && <Library />}
          {isAllowed && route === 'reports' && <Reports />}
          {isAllowed && route === 'draft' && <DraftReport />}
          {isAllowed && route === 'settings' && <Settings />}
        </main>
      </div>

      {route !== 'reports' && route !== 'draft' && queue.length > 0 ? (
        <div className="queue-dock">
          <div>
            <h4>Report queue</h4>
            <p>{queue.length} clips selected</p>
          </div>
          <button className="btn" onClick={() => (window.location.hash = '#draft')}>
            Review
          </button>
        </div>
      ) : null}

      <HotkeyHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <OnboardingTourModal
        open={tourOpen}
        onClose={() => {
          setTourOpen(false);
          saveToStorage(onboardingKey, true);
        }}
        onStart={() => {
          setTourOpen(false);
          saveToStorage(onboardingKey, true);
          navigate('ingest');
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ClipProvider>
        <ReportProvider>
          <StoryboardProvider>
            <UiProvider>
              <PreferencesProvider>
                <AccessProvider>
                  <LibraryProvider>
                    <AnnotationsProvider>
                      <LabelsProvider>
                        <AuditProvider>
                          <InvitesProvider>
                            <TelestrationProvider>
                              <PreferencesBridge />
                              <Shell />
                              <ToastStack />
                              <ClipModal />
                            </TelestrationProvider>
                          </InvitesProvider>
                        </AuditProvider>
                      </LabelsProvider>
                    </AnnotationsProvider>
                  </LibraryProvider>
                </AccessProvider>
              </PreferencesProvider>
            </UiProvider>
          </StoryboardProvider>
        </ReportProvider>
      </ClipProvider>
    </ErrorBoundary>
  );
}
