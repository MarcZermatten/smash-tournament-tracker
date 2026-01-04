import { getPlayer } from '../data/players';

const PlayerCard = ({ playerId, score, position, showPosition = true, onClick, selected }) => {
  const player = getPlayer(playerId);
  if (!player) return null;

  return (
    <div
      className={`player-card ${selected ? 'selected' : ''} ${onClick ? 'clickable' : ''}`}
      style={{ '--player-color': player.color }}
      onClick={onClick}
    >
      {showPosition && position && (
        <div className={`position-badge position-${position}`}>
          {position}
        </div>
      )}
      <div className="player-avatar">
        {player.image ? (
          <img src={player.image} alt={player.name} className="player-avatar-img" />
        ) : (
          player.initial
        )}
      </div>
      <div className="player-info">
        <div className="player-name">{player.name}</div>
        {player.casual && <small className="text-cyan">Joueur occasionnel</small>}
      </div>
      {score !== undefined && (
        <div className="player-score">{score} pts</div>
      )}
    </div>
  );
};

export default PlayerCard;
