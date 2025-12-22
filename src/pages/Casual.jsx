import { useState, useCallback } from 'react';
import { ALL_PLAYERS, POINTS_SYSTEM, getPlayer } from '../data/players';
import { addMatch, getMatchesByType, undoLastMatch } from '../data/storage';
import { useAudio } from '../hooks/useAudio';
import BackButton from '../components/BackButton';
import Leaderboard from '../components/Leaderboard';

const Casual = () => {
  const [view, setView] = useState('menu');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [rankings, setRankings] = useState({});
  const [lastMatch, setLastMatch] = useState(null);
  const { playSound } = useAudio();

  const config = POINTS_SYSTEM.casual;

  const togglePlayer = (playerId) => {
    playSound('select');
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(p => p !== playerId));
      setRankings(prev => {
        const newRankings = { ...prev };
        delete newRankings[playerId];
        return newRankings;
      });
    } else if (selectedPlayers.length < 8) {
      setSelectedPlayers([...selectedPlayers, playerId]);
    }
  };

  const handlePositionSelect = (playerId, position) => {
    playSound('select');

    const currentHolder = Object.entries(rankings).find(([_, pos]) => pos === position)?.[0];

    setRankings(prev => {
      const newRankings = { ...prev };
      if (currentHolder && currentHolder !== playerId) {
        delete newRankings[currentHolder];
      }
      newRankings[playerId] = position;
      return newRankings;
    });
  };

  const getPointsForPosition = (position, totalPlayers) => {
    // Système de points dynamique selon le nombre de joueurs
    const maxPoints = totalPlayers;
    return Math.max(0, maxPoints - position + 1);
  };

  const isComplete = selectedPlayers.length >= 2 &&
    Object.keys(rankings).length === selectedPlayers.length;

  const handleSubmit = useCallback(() => {
    if (!isComplete) return;
    playSound('confirm');

    const totalPlayers = selectedPlayers.length;
    const results = Object.entries(rankings).map(([player, position]) => ({
      player,
      position,
      points: getPointsForPosition(position, totalPlayers)
    }));

    const match = addMatch({
      type: 'casual',
      results,
      playerCount: totalPlayers,
    });

    setLastMatch(match);
    setRankings({});
    setSelectedPlayers([]);
    setView('menu');

    window.dispatchEvent(new Event('scoreUpdate'));
  }, [rankings, selectedPlayers, isComplete, playSound]);

  const handleUndo = () => {
    const undone = undoLastMatch();
    if (undone) {
      playSound('cancel');
      setLastMatch(null);
      window.dispatchEvent(new Event('scoreUpdate'));
    }
  };

  const matches = getMatchesByType('casual');

  const renderMenu = () => (
    <div className="mode-menu">
      <h1 className="melee-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
        🎉 Mode Casual
      </h1>
      <p className="melee-subtitle" style={{ marginBottom: '2rem' }}>
        {config.description}
      </p>

      <nav className="melee-menu">
        <button className="melee-button" onClick={() => setView('newMatch')}>
          🎮 Nouvelle Partie
        </button>
        <button className="melee-button" onClick={() => setView('history')}>
          📜 Historique ({matches.length})
        </button>
        <button className="melee-button" onClick={() => setView('stats')}>
          📊 Classement Casual
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

  const renderPlayerSelect = () => (
    <div className="player-select">
      <h2 className="melee-frame-header">Qui joue ? (2-8 joueurs)</h2>

      <div className="players-selection">
        {ALL_PLAYERS.map(playerId => {
          const player = getPlayer(playerId);
          const isSelected = selectedPlayers.includes(playerId);

          return (
            <button
              key={playerId}
              className={`player-toggle melee-frame ${isSelected ? 'selected' : ''}`}
              onClick={() => togglePlayer(playerId)}
              style={{ '--player-color': player.color }}
            >
              <div className="player-avatar" style={{ background: player.color }}>
                {player.initial}
              </div>
              <span>{player.name}</span>
              {player.casual && <small className="text-cyan">(Occasionnel)</small>}
              {isSelected && <span className="check">✓</span>}
            </button>
          );
        })}
      </div>

      <p className="text-cyan mt-1">
        {selectedPlayers.length} joueur{selectedPlayers.length > 1 ? 's' : ''} sélectionné{selectedPlayers.length > 1 ? 's' : ''}
      </p>
    </div>
  );

  const renderRankingSelect = () => {
    if (selectedPlayers.length < 2) return null;

    return (
      <div className="ranking-select" style={{ marginTop: '1.5rem' }}>
        <h3 className="text-gold mb-1">Classement de la partie</h3>

        <div className="ranking-grid">
          {selectedPlayers.map(playerId => {
            const player = getPlayer(playerId);
            const currentPosition = rankings[playerId];

            return (
              <div key={playerId} className="player-ranking melee-frame">
                <div className="player-info-small">
                  <span className="player-avatar" style={{ background: player.color, width: '30px', height: '30px', fontSize: '0.9rem' }}>
                    {player.initial}
                  </span>
                  <span>{player.name}</span>
                </div>

                <div className="position-buttons">
                  {selectedPlayers.map((_, idx) => {
                    const pos = idx + 1;
                    const isSelected = currentPosition === pos;
                    const isTaken = Object.values(rankings).includes(pos) && !isSelected;

                    return (
                      <button
                        key={pos}
                        className={`pos-btn ${isSelected ? 'selected' : ''} ${isTaken ? 'taken' : ''}`}
                        onClick={() => handlePositionSelect(playerId, pos)}
                        disabled={isTaken}
                        title={`+${getPointsForPosition(pos, selectedPlayers.length)} pts`}
                      >
                        {pos}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="points-legend" style={{ marginTop: '1rem' }}>
          <p className="text-cyan" style={{ fontSize: '0.8rem' }}>
            Points: {selectedPlayers.map((_, idx) => `${idx + 1}er = ${getPointsForPosition(idx + 1, selectedPlayers.length)}pts`).join(', ')}
          </p>
        </div>
      </div>
    );
  };

  const renderNewMatch = () => (
    <div className="new-match">
      {renderPlayerSelect()}
      {renderRankingSelect()}

      <div className="match-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
        <button
          className="melee-button"
          onClick={() => {
            setSelectedPlayers([]);
            setRankings({});
            setView('menu');
          }}
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
          ✅ Valider ({Object.keys(rankings).length}/{selectedPlayers.length})
        </button>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="match-history">
      <h2 className="melee-frame-header">📜 Historique Casual</h2>

      {matches.length === 0 ? (
        <p className="text-cyan text-center">Aucune partie enregistrée</p>
      ) : (
        <div className="history-list">
          {matches.slice(0, 20).map((match, idx) => (
            <div key={match.id} className="history-item melee-frame" style={{ marginBottom: '0.5rem', padding: '0.8rem' }}>
              <div className="history-header">
                <span className="text-gold">Partie #{matches.length - idx}</span>
                <span className="text-cyan" style={{ fontSize: '0.8rem' }}>
                  {match.playerCount} joueurs • {new Date(match.timestamp).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="history-results" style={{ marginTop: '0.5rem' }}>
                {match.results.sort((a, b) => a.position - b.position).map(r => (
                  <div key={r.player} className="history-result">
                    <span className={`position-badge position-${Math.min(r.position, 4)}`} style={{ width: '20px', height: '20px', fontSize: '0.7rem' }}>
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
      <h2 className="melee-frame-header">📊 Classement Casual</h2>
      <Leaderboard mode="casual" filterCasual={false} />
      <button className="melee-button" onClick={() => setView('menu')} style={{ marginTop: '1rem', width: '100%' }}>
        ← Retour
      </button>
    </div>
  );

  return (
    <div className="page casual-page">
      <div className="page-content">
        {view === 'menu' && renderMenu()}
        {view === 'newMatch' && renderNewMatch()}
        {view === 'history' && renderHistory()}
        {view === 'stats' && renderStats()}
      </div>

      {view === 'menu' && <BackButton to="/" />}

      <style>{`
        .casual-page {
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

        .mode-menu {
          text-align: center;
        }

        .players-selection {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.5rem;
        }

        .player-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
          background: var(--gradient-button);
          color: white;
        }

        .player-toggle:hover {
          border-color: var(--player-color);
        }

        .player-toggle.selected {
          border-color: var(--melee-cyan);
          background: var(--gradient-button-hover);
        }

        .player-toggle .check {
          margin-left: auto;
          color: var(--melee-cyan);
          font-size: 1.2rem;
        }

        .ranking-grid {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .player-ranking {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.6rem;
          gap: 1rem;
        }

        .player-info-small {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .position-buttons {
          display: flex;
          gap: 0.3rem;
        }

        .pos-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--gradient-button);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          cursor: pointer;
          font-family: 'Orbitron', sans-serif;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .pos-btn:hover:not(:disabled) {
          border-color: var(--melee-gold);
          transform: scale(1.1);
        }

        .pos-btn.selected {
          background: var(--gradient-gold);
          color: #1a0a2e;
          border-color: var(--melee-gold);
        }

        .pos-btn.taken {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .history-results {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .history-result {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.85rem;
        }

        .history-list {
          max-height: 60vh;
          overflow-y: auto;
        }

        @media (max-width: 500px) {
          .player-ranking {
            flex-direction: column;
            align-items: stretch;
          }

          .position-buttons {
            justify-content: center;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
};

export default Casual;
