import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  meta?: string;
  icon?: ReactNode;
}

export const StatCard = ({ label, value, meta, icon }: StatCardProps) => (
  <div className="stat-card">
    <div>
      <p className="stat-label">{label}</p>
      <h3>{value}</h3>
      {meta ? <span className="stat-meta">{meta}</span> : null}
    </div>
    {icon ? <div className="stat-icon">{icon}</div> : null}
  </div>
);
