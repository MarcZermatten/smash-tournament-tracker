import { useState, useEffect } from 'react';
import { getLeaderboard, getPlayerStats } from '../data/storage';
import { PLAYERS, getPlayer } from '../data/players';
import BackButton from '../components/BackButton';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showCasual, setShowCasual] = useState(false);

  useEffect(() => {
    const update = () => {
      let data = getLeaderboard();
      if (!showCasual) {
        data = data.filter(e => !PLAYERS[e.player]?.casual);
      }
      setLeaderboard(data);
    };

    update();
    window.addEventListener('scoreUpdate', update);
    return () => window.removeEventListener('scoreUpdate', update);
  }, [showCasual]);

  const renderPlayerModal = () => {
    if (!selectedPlayer) return null;

    const player = getPlayer(selectedPlayer);
    const stats = getPlayerStats(selectedPlayer);

    return (
      <div className="player-modal-overlay" onClick={() => setSelectedPlayer(null)}>
        <div className="player-modal melee-frame" onClick={e => e.stopPropagation()}>
          <button className="close-btn" onClick={() => setSelectedPlayer(null)}>✕</button>

          <div className="modal-header" style={{ '--player-color': player.color }}>
            <div className="player-avatar large">{player.initial}</div>
            <h2>{player.name}</h2>
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value text-gold">{stats.matches}</span>
              <span className="stat-label">Parties</span>
            </div>
            <div className="stat-item">
              <span className="stat-value text-cyan">{stats.wins}</span>
              <span className="stat-label">Victoires</span>
            </div>
            <div className="stat-item">
              <span className="stat-value" style={{ color: stats.winRate >= 50 ? '#4ECDC4' : '#FF6B6B' }}>
                {stats.winRate}%
              </span>
              <span className="stat-label">Win Rate</span>
            </div>
          </div>

          <div className="points-breakdown">
            <h3 className="text-gold mb-1">Points par mode</h3>
            <div className="mode-points">
              <div className="mode-row">
                <span>⚔️ FFA</span>
                <span className="text-gold">{stats.points.ffa} pts</span>
              </div>
              <div className="mode-row">
                <span>🔥 2v2 FF</span>
                <span className="text-gold">{stats.points.team_ff} pts</span>
              </div>
              <div className="mode-row">
                <span>🤝 2v2 No FF</span>
                <span className="text-gold">{stats.points.team_noff} pts</span>
              </div>
              <div className="mode-row">
                <span>🎉 Casual</span>
                <span className="text-gold">{stats.points.casual} pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page leaderboard-page">
      <div className="page-content">
        <h1 className="melee-title" style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '0.5rem' }}>
          🏆 Classement Général
        </h1>
        <p className="melee-subtitle text-center mb-2">Tous modes confondus</p>

        <div className="filter-toggle" style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <button
            className={`melee-button ${!showCasual ? 'selected' : ''}`}
            onClick={() => setShowCasual(false)}
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', marginRight: '0.5rem' }}
          >
            Joueurs principaux
          </button>
          <button
            className={`melee-button ${showCasual ? 'selected' : ''}`}
            onClick={() => setShowCasual(true)}
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
          >
            Tous les joueurs
          </button>
        </div>

        <div className="leaderboard-container melee-frame">
          {leaderboard.length === 0 ? (
            <p className="text-cyan text-center">Aucun score enregistré</p>
          ) : (
            <div className="leaderboard-list">
              {leaderboard.map((entry, index) => {
                const player = getPlayer(entry.player);
                const position = index + 1;

                return (
                  <div
                    key={entry.player}
                    className={`leaderboard-item position-${Math.min(position, 4)}-bg`}
                    onClick={() => setSelectedPlayer(entry.player)}
                    style={{ '--player-color': player.color }}
                  >
                    <div className={`rank-badge position-${Math.min(position, 4)}`}>
                      {position === 1 ? '👑' : position}
                    </div>

                    <div className="player-avatar" style={{ background: player.color }}>
                      {player.initial}
                    </div>

                    <div className="player-details">
                      <span className="name">{player.name}</span>
                      <span className="breakdown">
                        FFA: {entry.ffa} | 2v2: {entry.team_ff + entry.team_noff} | Casual: {entry.casual}
                      </span>
                    </div>

                    <div className="total-score">
                      <span className="score-value">{entry.total}</span>
                      <span className="score-label">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BackButton to="/" />
      {renderPlayerModal()}

      <style>{`
        .leaderboard-page {
          min-height: 100vh;
          padding: 2rem;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 3rem;
        }

        .page-content {
          width: 100%;
          max-width: 600px;
          animation: fadeIn 0.3s ease-out;
        }

        .leaderboard-container {
          padding: 1rem;
        }

        .leaderboard-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .leaderboard-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.8rem 1rem;
          background: rgba(255,255,255,0.05);
          border-left: 4px solid var(--player-color);
          cursor: pointer;
          transition: all 0.2s;
        }

        .leaderboard-item:hover {
          background: rgba(255,255,255,0.1);
          transform: translateX(5px);
        }

        .leaderboard-item.position-1-bg {
          background: linear-gradient(90deg, rgba(255, 215, 0, 0.2) 0%, rgba(255,255,255,0.05) 100%);
        }

        .leaderboard-item.position-2-bg {
          background: linear-gradient(90deg, rgba(192, 192, 192, 0.15) 0%, rgba(255,255,255,0.05) 100%);
        }

        .leaderboard-item.position-3-bg {
          background: linear-gradient(90deg, rgba(205, 127, 50, 0.15) 0%, rgba(255,255,255,0.05) 100%);
        }

        .rank-badge {
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Orbitron', sans-serif;
          font-weight: bold;
          border-radius: 50%;
          font-size: 1rem;
        }

        .rank-badge.position-1 {
          background: var(--gradient-gold);
          font-size: 1.2rem;
        }

        .rank-badge.position-2 {
          background: var(--gradient-metal);
          color: #1a0a2e;
        }

        .rank-badge.position-3 {
          background: linear-gradient(180deg, #cd7f32, #8b4513);
        }

        .rank-badge.position-4 {
          background: rgba(255,255,255,0.2);
        }

        .player-avatar {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Orbitron', sans-serif;
          font-weight: bold;
          color: #1a0a2e;
        }

        .player-avatar.large {
          width: 80px;
          height: 80px;
          font-size: 2rem;
          box-shadow: 0 0 30px var(--player-color);
        }

        .player-details {
          flex: 1;
        }

        .player-details .name {
          display: block;
          font-size: 1.1rem;
          font-weight: bold;
        }

        .player-details .breakdown {
          font-size: 0.75rem;
          opacity: 0.7;
        }

        .total-score {
          text-align: right;
        }

        .score-value {
          display: block;
          font-family: 'Orbitron', sans-serif;
          font-size: 1.5rem;
          color: var(--melee-gold);
          text-shadow: 0 0 10px var(--melee-gold);
        }

        .score-label {
          font-size: 0.7rem;
          opacity: 0.7;
        }

        /* Modal */
        .player-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s;
        }

        .player-modal {
          width: 90%;
          max-width: 400px;
          padding: 1.5rem;
          position: relative;
          animation: scaleIn 0.3s ease-out;
        }

        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .close-btn {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          opacity: 0.7;
        }

        .close-btn:hover {
          opacity: 1;
        }

        .modal-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid var(--player-color);
        }

        .modal-header h2 {
          font-size: 1.5rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-family: 'Orbitron', sans-serif;
          font-size: 1.8rem;
        }

        .stat-label {
          font-size: 0.8rem;
          opacity: 0.7;
        }

        .mode-points {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .mode-row {
          display: flex;
          justify-content: space-between;
          padding: 0.3rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        @media (max-width: 500px) {
          .player-details .breakdown {
            display: none;
          }

          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .stat-value {
            font-size: 1.4rem;
          }
        }
      `}</style>
    </div>
  );
};

export default LeaderboardPage;
