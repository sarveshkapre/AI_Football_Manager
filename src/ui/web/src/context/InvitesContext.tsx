import { createContext, useContext, useMemo, useState } from 'react';
import { isStaffInviteArray } from '../utils/guards';
import { loadFromStorageWithGuard, saveToStorage } from '../utils/storage';

export type StaffRolePreset = 'Full staff' | 'Coach bench' | 'Analyst room';

export interface StaffInvite {
  id: string;
  email: string;
  role: StaffRolePreset;
  invitedAt: string;
}

interface InvitesContextValue {
  invites: StaffInvite[];
  inviteStaff: (email: string, role: StaffRolePreset) => StaffInvite;
  revokeInvite: (id: string) => void;
}

const storageKey = 'afm.invites';

const InvitesContext = createContext<InvitesContextValue | undefined>(undefined);

const generateId = () => `invite-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const InvitesProvider = ({ children }: { children: React.ReactNode }) => {
  const [invites, setInvites] = useState<StaffInvite[]>(() =>
    loadFromStorageWithGuard(storageKey, [], isStaffInviteArray)
  );

  const value = useMemo(
    () => ({
      invites,
      inviteStaff: (email: string, role: StaffRolePreset) => {
        const invite: StaffInvite = {
          id: generateId(),
          email,
          role,
          invitedAt: new Date().toLocaleString()
        };
        setInvites((prev) => {
          const next = [invite, ...prev].slice(0, 20);
          saveToStorage(storageKey, next);
          return next;
        });
        return invite;
      },
      revokeInvite: (id: string) =>
        setInvites((prev) => {
          const next = prev.filter((invite) => invite.id !== id);
          saveToStorage(storageKey, next);
          return next;
        })
    }),
    [invites]
  );

  return <InvitesContext.Provider value={value}>{children}</InvitesContext.Provider>;
};

export const useInvites = () => {
  const context = useContext(InvitesContext);
  if (!context) {
    throw new Error('useInvites must be used within InvitesProvider');
  }
  return context;
};

