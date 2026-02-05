import type { MinimapSnapshot, PlayerDot } from '../types';

interface MinimapProps {
  snapshot: MinimapSnapshot | null;
  onSelectPlayer?: (player: PlayerDot) => void;
}

export const Minimap = ({ snapshot, onSelectPlayer }: MinimapProps) => {
  if (!snapshot) {
    return <div className="minimap-empty">No minimap data.</div>;
  }

  return (
    <div className="minimap">
      <div className="minimap-field">
        <div className="minimap-line center" />
        <div className="minimap-circle" />
        <div className="minimap-box left" />
        <div className="minimap-box right" />
        {snapshot.players.map((player) => (
          <button
            type="button"
            key={player.id}
            className={`minimap-player team-${player.team} ${
              player.highlighted ? 'is-highlighted' : ''
            }`}
            style={{ left: `${player.x}%`, top: `${player.y}%` }}
            onClick={() => onSelectPlayer?.(player)}
            aria-label={`${player.team} player`}
          />
        ))}
      </div>
    </div>
  );
};
