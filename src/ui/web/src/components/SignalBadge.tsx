import type { SignalQuality } from '../types';

interface SignalBadgeProps {
  signal: SignalQuality;
}

export const SignalBadge = ({ signal }: SignalBadgeProps) => {
  const className = `signal signal-${signal.toLowerCase()}`;
  return <span className={className}>Signal {signal}</span>;
};
