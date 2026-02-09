import { useMemo, useRef, useState } from 'react';
import { useAudit } from '../context/AuditContext';
import { useInvites, type StaffRolePreset } from '../context/InvitesContext';
import { Modal, useModalTitleId } from './Modal/Modal';

const roleOptions: StaffRolePreset[] = ['Full staff', 'Coach bench', 'Analyst room'];

const isEmailLike = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const InviteStaffModal = ({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const titleId = useModalTitleId();
  const emailRef = useRef<HTMLInputElement | null>(null);
  const { logEvent } = useAudit();
  const { invites, inviteStaff, revokeInvite } = useInvites();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRolePreset>('Full staff');

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const canInvite = normalizedEmail.length > 0 && isEmailLike(normalizedEmail);

  const submit = () => {
    if (!canInvite) {
      emailRef.current?.focus();
      return;
    }
    const invite = inviteStaff(normalizedEmail, role);
    logEvent('Staff invited', `${invite.email} · ${invite.role}`);
    setEmail('');
    setRole('Full staff');
    emailRef.current?.focus();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      className="invite-modal"
      initialFocusRef={emailRef}
    >
      <header className="modal-header">
        <div>
          <p className="eyebrow">Collaboration</p>
          <h3 id={titleId}>Invite staff</h3>
        </div>
        <button className="btn ghost" onClick={onClose}>
          Close
        </button>
      </header>

      <div className="modal-body">
        <div className="stack">
          <label className="field">
            <span>Email</span>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="coach@club.com"
              autoComplete="email"
            />
          </label>
          <label className="field">
            <span>Role preset</span>
            <select value={role} onChange={(event) => setRole(event.target.value as StaffRolePreset)}>
              {roleOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <p className="muted">
            Prototype note: invites are stored locally and logged to the audit stream.
          </p>
        </div>

        <div className="card" style={{ padding: 14, background: 'var(--surface-alt)' }}>
          <h4 style={{ marginBottom: 10 }}>Recent invites</h4>
          {invites.length === 0 ? (
            <p className="muted">No invites yet.</p>
          ) : (
            <div className="invite-list">
              {invites.map((invite) => (
                <div className="invite-row" key={invite.id}>
                  <div>
                    <strong>{invite.email}</strong>
                    <p className="muted">
                      {invite.role} · {invite.invitedAt}
                    </p>
                  </div>
                  <button
                    className="btn ghost"
                    onClick={() => {
                      revokeInvite(invite.id);
                      logEvent('Invite revoked', invite.email);
                    }}
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="modal-footer">
        <div className="muted">Send an invite to share packs and reports.</div>
        <button className="btn primary" onClick={submit} disabled={!canInvite}>
          Send invite
        </button>
      </footer>
    </Modal>
  );
};
