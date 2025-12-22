import { useState, useCallback } from 'react';
import { MAIN_PLAYERS, POINTS_SYSTEM, getPlayer } from '../data/players';
import { addMatch, getMatchesByType, undoLastMatch } from '../data/storage';
import { useAudio } from '../hooks/useAudio';
import BackButton from '../components/BackButton';
import PlayerCard from '../components/PlayerCard';
import Leaderboard from '../components/Leaderboard';

const FFA = () => {
  const [view, setView] = useState('menu'); // menu, newMatch, history, stats
  const [rankings, setRankings] = useState({}); // { playerId: position }
  const [lastMatch, setLastMatch] = useState(null);
  const { playSound } = useAudio();

  const handlePositionSelect = (playerId, position) => {
    playSound('select');

    // Vérifier si cette position est déjà prise par un autre joueur
    const currentHolder = Object.entries(rankings).find(([_, pos]) => pos === position)?.[0];

    setRankings(prev => {
      const newRankings = { ...prev };

      // Si un autre joueur avait cette position, le retirer
      if (currentHolder && currentHolder !== playerId) {
        delete newRankings[currentHolder];
      }

      // Assigner la nouvelle position
      newRankings[playerId] = position;

      return newRankings;
    });
  };

  const isComplete = Object.keys(rankings).length === 4;

  const handleSubmit = useCallback(() => {
    if (!isComplete) return;

    playSound('confirm');

    const results = Object.entries(rankings).map(([player, position]) => ({
      player,
      position,
      points: POINTS_SYSTEM.ffa.positions[position]
    }));

    const match = addMatch({
      type: 'ffa',
      results,
    });

    setLastMatch(match);
    setRankings({});
    setView('menu');

    // Déclencher la mise à jour du leaderboard
    window.dispatchEvent(new Event('scoreUpdate'));
  }, [rankings, isComplete, playSound]);

  const handleUndo = () => {
    const undone = undoLastMatch();
    if (undone) {
      playSound('cancel');
      setLastMatch(null);
      window.dispatchEvent(new Event('scoreUpdate'));
    }
  };

  const matches = getMatchesByType('ffa');

  const renderMenu = () => (
    <div className="mode-menu">
      <h1 className="melee-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
        ⚔️ Free For All
      </h1>
      <p className="melee-subtitle" style={{ marginBottom: '2rem' }}>
        4 joueurs - Chacun pour soi
      </p>

      <nav className="melee-menu">
        <button className="melee-button" onClick={() => setView('newMatch')}>
          🎮 Nouvelle Partie
        </button>
        <button className="melee-button" onClick={() => setView('history')}>
          📜 Historique ({matches.length})
        </button>
        <button className="melee-button" onClick={() => setView('stats')}>
          📊 Classement FFA
        </button>
      </nav>

      {lastMatch && (
        <div className="last-match-info" style={{ marginTop: '1.5rem' }}>
          <p className="text-cyan">Dernière partie enregistrée</p>
          <button
            className="melee-button"
            onClick={handleUndo}
            style={{ marginTop: '0.5rem', fontSize: '0.9rem', padding: '0.5rem 1rem' }}
          >
            ↩️ Annuler
          </button>
        </div>
      )}
    </div>
  );

  const renderNewMatch = () => (
    <div className="new-match">
      <h2 className="melee-frame-header">Entrer les résultats</h2>
      <p className="text-cyan mb-2">Sélectionne la position de chaque joueur</p>

      <div className="players-grid">
        {MAIN_PLAYERS.map(playerId => {
          const player = getPlayer(playerId);
          const currentPosition = rankings[playerId];

          return (
            <div key={playerId} className="player-ranking-card melee-frame">
              <div className="player-header" style={{ '--player-color': player.color }}>
                <div className="player-avatar">{player.initial}</div>
                <span className="player-name">{player.name}</span>
              </div>

              <div className="position-selector">
                {[1, 2, 3, 4].map(pos => {
                  const isSelected = currentPosition === pos;
                  const isTaken = Object.values(rankings).includes(pos) && !isSelected;

                  return (
                    <button
                      key={pos}
                      className={`position-btn position-${pos} ${isSelected ? 'selected' : ''} ${isTaken ? 'taken' : ''}`}
                      onClick={() => handlePositionSelect(playerId, pos)}
                      disabled={isTaken}
                    >
                      <span className="pos-number">{pos}</span>
                      <span className="pos-points">+{POINTS_SYSTEM.ffa.positions[pos]} pts</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="match-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
        <button
          className="melee-button"
          onClick={() => { setRankings({}); setView('menu'); }}
          style={{ flex: 1 }}
        >
          ❌ Annuler
        </button>
        <button
          className={`melee-button ${isComplete ? 'selected' : ''}`}
          onClick={handleSubmit}
          disabled={!isComplete}
          style={{ flex: 2 }}
        >
          ✅ Valider ({Object.keys(rankings).length}/4)
        </button>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="match-history">
      <h2 className="melee-frame-header">📜 Historique FFA</h2>

      {matches.length === 0 ? (
        <p className="text-cyan text-center">Aucune partie enregistrée</p>
      ) : (
        <div className="history-list">
          {matches.slice(0, 20).map((match, idx) => (
            <div key={match.id} className="history-item melee-frame" style={{ marginBottom: '0.5rem', padding: '0.8rem' }}>
              <div className="history-header">
                <span className="text-gold">Partie #{matches.length - idx}</span>
                <span className="text-cyan" style={{ fontSize: '0.8rem' }}>
                  {new Date(match.timestamp).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="history-results">
                {match.results.sort((a, b) => a.position - b.position).map(r => (
                  <div key={r.player} className="history-result">
                    <span className={`position-badge position-${r.position}`} style={{ width: '25px', height: '25px', fontSize: '0.8rem' }}>
                      {r.position}
                    </span>
                    <span>{getPlayer(r.player)?.name}</span>
                    <span className="text-gold">+{r.points}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="melee-button" onClick={() => setView('menu')} style={{ marginTop: '1rem', width: '100%' }}>
        ← Retour
      </button>
    </div>
  );

  const renderStats = () => (
    <div className="mode-stats">
      <h2 className="melee-frame-header">📊 Classement FFA</h2>
      <Leaderboard mode="ffa" />
      <button className="melee-button" onClick={() => setView('menu')} style={{ marginTop: '1rem', width: '100%' }}>
        ← Retour
      </button>
    </div>
  );

  return (
    <div className="page ffa-page">
      <div className="page-content">
        {view === 'menu' && renderMenu()}
        {view === 'newMatch' && renderNewMatch()}
        {view === 'history' && renderHistory()}
        {view === 'stats' && renderStats()}
      </div>

      {view === 'menu' && <BackButton to="/" />}

      <style>{`
        .ffa-page {
          min-height: 100vh;
          padding: 2rem;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 3rem;
        }

        .page-content {
          width: 100%;
          max-width: 800px;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .mode-menu {
          text-align: center;
        }

        .players-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
        }

        .player-ranking-card {
          padding: 1rem;
        }

        .player-header {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin-bottom: 1rem;
          padding-bottom: 0.8rem;
          border-bottom: 2px solid var(--player-color, var(--melee-gold));
        }

        .position-selector {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }

        .position-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.6rem;
          background: var(--gradient-button);
          border: 2px solid rgba(255,255,255,0.2);
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 4px;
        }

        .position-btn:hover:not(:disabled) {
          transform: scale(1.05);
          border-color: var(--melee-gold);
        }

        .position-btn.selected {
          border-color: var(--melee-cyan);
          box-shadow: 0 0 15px var(--melee-cyan);
        }

        .position-btn.taken {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .position-btn.position-1.selected { box-shadow: 0 0 15px var(--melee-gold); border-color: var(--melee-gold); }
        .position-btn.position-2.selected { box-shadow: 0 0 15px var(--melee-silver); border-color: var(--melee-silver); }

        .pos-number {
          font-family: 'Orbitron', sans-serif;
          font-size: 1.4rem;
          font-weight: bold;
        }

        .pos-points {
          font-size: 0.7rem;
          opacity: 0.8;
        }

        .history-item {
          background: rgba(0,0,0,0.3);
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .history-results {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .history-result {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.9rem;
        }

        .history-list {
          max-height: 60vh;
          overflow-y: auto;
        }

        @media (max-width: 600px) {
          .players-grid {
            grid-template-columns: 1fr 1fr;
          }

          .position-selector {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default FFA;
