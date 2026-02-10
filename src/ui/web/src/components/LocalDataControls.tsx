import { useRef, useState } from 'react';
import { BackupImportError, createAfmBackupV1, parseAfmBackup, restoreAfmBackup, serializeAfmBackup } from '../utils/backup';
import { downloadFile } from '../utils/export';
import { clearAfmStorage } from '../utils/storage';
import { SectionHeader } from './SectionHeader';

export const LocalDataControls = () => {
  const restoreInputRef = useRef<HTMLInputElement | null>(null);
  const [restoreCandidate, setRestoreCandidate] = useState<{
    filename: string;
    createdAt: string;
    entries: Record<string, string>;
  } | null>(null);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreBusy, setRestoreBusy] = useState(false);

  return (
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
              {backupStatus ? (
                <p className="muted" style={{ marginTop: 8 }}>
                  {backupStatus}
                </p>
              ) : null}
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
  );
};

