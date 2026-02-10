import { useEffect, useMemo, useRef, useState } from 'react';
import { InviteStaffModal } from '../components/InviteStaffModal';
import { SectionHeader } from '../components/SectionHeader';
import { useAccess } from '../context/AccessContext';
import { useInvites } from '../context/InvitesContext';
import { usePreferences } from '../context/PreferencesContext';
import { useUi } from '../context/UiContext';
import type { AccessState } from '../context/AccessContext';
import { clearAfmStorage, loadFromStorageWithGuard, removeFromStorage } from '../utils/storage';
import { getStoragePerfSnapshot, resetStoragePerf, type StoragePerfSnapshot } from '../utils/perf';
import { BackupImportError, createAfmBackupV1, parseAfmBackup, restoreAfmBackup, serializeAfmBackup } from '../utils/backup';
import { downloadFile } from '../utils/export';

const cadenceOptions = [30, 60, 90] as const;
const openInviteKey = 'afm.ui.invite.open';

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
  const { invites } = useInvites();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [perf, setPerf] = useState<StoragePerfSnapshot>(() => getStoragePerfSnapshot());
  const restoreInputRef = useRef<HTMLInputElement | null>(null);
  const [restoreCandidate, setRestoreCandidate] = useState<{
    filename: string;
    createdAt: string;
    entries: Record<string, string>;
  } | null>(null);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreBusy, setRestoreBusy] = useState(false);

  useEffect(() => {
    const shouldOpen = loadFromStorageWithGuard(openInviteKey, false, (value): value is boolean =>
      typeof value === 'boolean'
    );
    if (shouldOpen) {
      setInviteOpen(true);
      removeFromStorage(openInviteKey);
    }
  }, []);

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

      <div className="grid two" style={{ marginTop: 20 }}>
        <div className="card surface">
          <SectionHeader
            title="Collaboration"
            subtitle="Invite staff to view packs (local prototype stub)."
            action={
              <button className="btn primary" onClick={() => setInviteOpen(true)}>
                Invite staff
              </button>
            }
          />
          <div className="row-card">
            <div>
              <h4>Recent invites</h4>
              <p>{invites.length === 0 ? 'No invites yet.' : `${invites.length} invite(s) stored locally.`}</p>
            </div>
            <span className="pill">{invites.length}</span>
          </div>
        </div>
        <div className="card surface">
          <SectionHeader
            title="Performance"
            subtitle="Lightweight counters to catch persistence regressions."
            action={
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn ghost" onClick={() => setPerf(getStoragePerfSnapshot())}>
                  Refresh
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    resetStoragePerf();
                    setPerf(getStoragePerfSnapshot());
                  }}
                >
                  Reset
                </button>
              </div>
            }
          />
          <div className="stack">
            <div className="row-card">
              <div>
                <h4>localStorage writes</h4>
                <p>Total writes + bytes since last reset (in-session).</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h4>{perf.totalWrites}</h4>
                <p className="muted">{Math.round(perf.totalBytes / 1024)} KB</p>
              </div>
            </div>
            <div className="row-card">
              <div>
                <h4>Removals</h4>
                <p>Clears and key deletes.</p>
              </div>
              <span className="pill">{perf.totalRemoves}</span>
            </div>
            <div className="row-card">
              <div>
                <h4>Top keys</h4>
                <p>Most frequently persisted keys.</p>
              </div>
              <span className="pill">{Math.min(5, perf.keys.length)} shown</span>
            </div>
            <div className="stack" style={{ gap: 10 }}>
              {perf.keys.slice(0, 5).map((entry) => (
                <div key={entry.key} className="access-row">
                  <div>
                    <h4 style={{ fontSize: '0.95rem' }}>{entry.key}</h4>
                    <p>
                      {entry.writes} write(s) · {Math.round(entry.bytes / 1024)} KB · {entry.removes} remove(s)
                    </p>
                  </div>
                  <span className="pill">
                    {entry.lastAt ? new Date(entry.lastAt).toLocaleTimeString() : '—'}
                  </span>
                </div>
              ))}
              {perf.keys.length === 0 ? <p className="muted">No writes recorded yet.</p> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid two" style={{ marginTop: 20 }}>
        <div className="card surface">
          <SectionHeader
            title="Backup / Restore"
            subtitle="Export or restore all local AFM prototype data (queue, notes, settings, searches)."
          />
          <div className="stack">
            <div className="row-card">
              <div>
                <h4>Download backup</h4>
                <p>Creates a versioned JSON snapshot of all stored `afm.*` keys.</p>
              </div>
              <button
                className="btn"
                onClick={() => {
                  setBackupStatus(null);
                  try {
                    const storage = window.localStorage;
                    const payload = createAfmBackupV1(storage);
                    const dateStamp = payload.createdAt.slice(0, 10);
                    downloadFile(`afm-backup-${dateStamp}.json`, serializeAfmBackup(payload), 'application/json');
                    setBackupStatus(`Downloaded backup with ${Object.keys(payload.entries).length} key(s).`);
                  } catch {
                    setBackupStatus('Backup failed: localStorage is not available in this environment.');
                  }
                }}
              >
                Download
              </button>
            </div>

            <div className="row-card">
              <div>
                <h4>Restore from backup</h4>
                <p>Overwrites all local `afm.*` keys and reloads the app to rehydrate state.</p>
                {restoreError ? <p style={{ color: '#b42318', marginTop: 8 }}>{restoreError}</p> : null}
                {backupStatus ? <p className="muted" style={{ marginTop: 8 }}>{backupStatus}</p> : null}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
                <input
                  ref={restoreInputRef}
                  type="file"
                  accept=".json,application/json"
                  style={{ display: 'none' }}
                  onChange={async (event) => {
                    const file = event.target.files?.[0] ?? null;
                    event.target.value = '';
                    setRestoreError(null);
                    setBackupStatus(null);
                    if (!file) {
                      return;
                    }
                    try {
                      const text = await file.text();
                      const parsed = parseAfmBackup(text);
                      setRestoreCandidate({
                        filename: file.name || 'backup.json',
                        createdAt: parsed.createdAt,
                        entries: parsed.entries
                      });
                    } catch (error) {
                      if (error instanceof BackupImportError) {
                        setRestoreError(error.message);
                        return;
                      }
                      setRestoreError('Restore failed: unexpected error while reading backup.');
                    }
                  }}
                />
                <button
                  className="btn ghost"
                  onClick={() => {
                    setRestoreCandidate(null);
                    setRestoreError(null);
                    restoreInputRef.current?.click();
                  }}
                >
                  Choose file
                </button>
                {restoreCandidate ? (
                  <button
                    className="btn primary"
                    disabled={restoreBusy}
                    onClick={() => {
                      const entryCount = Object.keys(restoreCandidate.entries).length;
                      const ok = window.confirm(
                        `Restore backup "${restoreCandidate.filename}" (${entryCount} key(s))? This overwrites all local AFM data and reloads the app.`
                      );
                      if (!ok) {
                        return;
                      }

                      setRestoreBusy(true);
                      try {
                        const storage = window.localStorage;
                        restoreAfmBackup(storage, {
                          version: 1,
                          createdAt: restoreCandidate.createdAt,
                          entries: restoreCandidate.entries
                        });
                        window.location.reload();
                      } catch {
                        setRestoreBusy(false);
                        setRestoreError('Restore failed: localStorage is not available in this environment.');
                      }
                    }}
                  >
                    {restoreBusy ? 'Restoring…' : 'Restore'}
                  </button>
                ) : null}
              </div>
            </div>

            {restoreCandidate ? (
              <div className="row-card" style={{ background: 'rgba(15, 76, 92, 0.06)' }}>
                <div>
                  <h4>Ready to restore</h4>
                  <p className="muted" style={{ marginBottom: 0 }}>
                    {restoreCandidate.filename} · {Object.keys(restoreCandidate.entries).length} key(s) · created{' '}
                    {new Date(restoreCandidate.createdAt).toLocaleString()}
                  </p>
                </div>
                <button className="btn" onClick={() => setRestoreCandidate(null)}>
                  Clear
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="card surface">
          <SectionHeader title="Recovery" subtitle="If the prototype gets into a bad state, clear local AFM data." />
          <div className="stack">
            <div className="row-card">
              <div>
                <h4>Reset local data</h4>
                <p>Clears all `afm.*` keys (does not affect other sites). Reloads into Coach Mode.</p>
              </div>
              <button
                className="btn"
                onClick={() => {
                  const ok = window.confirm('Reset all local AFM data? This cannot be undone.');
                  if (!ok) {
                    return;
                  }
                  clearAfmStorage();
                  window.location.hash = '#coach';
                  window.location.reload();
                }}
              >
                Reset
              </button>
            </div>
            <p className="muted" style={{ margin: 0 }}>
              Tip: download a backup first if you want to preserve queue + notes.
            </p>
          </div>
        </div>
      </div>

      <InviteStaffModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
};
