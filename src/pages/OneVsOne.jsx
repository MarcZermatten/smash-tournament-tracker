import { useState, useCallback, useMemo } from 'react';
import { MAIN_PLAYERS, getPlayer } from '../data/players';
import { addMatch, getMatchesByType, undoLastMatch, loadData } from '../data/storage';
import { useAudio } from '../hooks/useAudio';
import BackButton from '../components/BackButton';

// Générer toutes les combinaisons 1v1 possibles
const generate1v1Matchups = (players) => {
  const matchups = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      matchups.push([players[i], players[j]]);
    }
  }
  return matchups;
};

const OneVsOne = () => {
  const [view, setView] = useState('menu');
  const [player1, setPlayer1] = useState(null);
  const [player2, setPlayer2] = useState(null);
  const [winner, setWinner] = useState(null);
  const [lastMatch, setLastMatch] = useState(null);
  const { playSound } = useAudio();

  const allMatchups = useMemo(() => generate1v1Matchups(MAIN_PLAYERS), []);
  const matches = getMatchesByType('1v1');

  // Calculer les stats head-to-head
  const getHeadToHead = useCallback(() => {
    const h2h = {};
    MAIN_PLAYERS.forEach(p1 => {
      h2h[p1] = {};
      MAIN_PLAYERS.forEach(p2 => {
        if (p1 !== p2) {
          h2h[p1][p2] = { wins: 0, losses: 0 };
        }
      });
    });

    matches.forEach(match => {
      if (match.winner && match.loser) {
        h2h[match.winner][match.loser].wins++;
        h2h[match.loser][match.winner].losses++;
      }
    });

    return h2h;
  }, [matches]);

  const selectPlayer = (playerId, slot) => {
    playSound('select');
    if (slot === 1) {
      setPlayer1(playerId);
      if (player2 === playerId) setPlayer2(null);
    } else {
      setPlayer2(playerId);
      if (player1 === playerId) setPlayer1(null);
    }
    setWinner(null);
  };

  const selectWinner = (playerId) => {
    playSound('select');
    setWinner(playerId);
  };

  const isReady = player1 && player2 && winner;

  const handleSubmit = useCallback(() => {
    if (!isReady) return;
    playSound('confirm');

    const loser = winner === player1 ? player2 : player1;

    const match = addMatch({
      type: '1v1',
      player1,
      player2,
      winner,
      loser,
      winners: [winner],
      losers: [loser],
      winPoints: 3,
      losePoints: 0,
    });

    setLastMatch(match);
    setPlayer1(null);
    setPlayer2(null);
    setWinner(null);
    setView('menu');

    window.dispatchEvent(new Event('scoreUpdate'));
  }, [player1, player2, winner, isReady, playSound]);

  const handleUndo = () => {
    const undone = undoLastMatch();
    if (undone) {
      playSound('cancel');
      setLastMatch(null);
      window.dispatchEvent(new Event('scoreUpdate'));
    }
  };

  const renderMenu = () => (
    <div className="mode-menu">
      <h1 className="melee-logo" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
        ⚔️ 1 VS 1
      </h1>
      <p className="melee-logo-sub" style={{ marginBottom: '2rem' }}>
        Duels en rotation
      </p>

      <div className="melee-main-menu" style={{ alignItems: 'center', paddingRight: 0 }}>
        <button className="melee-menu-item" onClick={() => setView('newMatch')}>
          <span className="menu-icon">🎮</span>
          Nouveau Duel
        </button>
        <button className="melee-menu-item" onClick={() => setView('bracket')}>
          <span className="menu-icon">📊</span>
          Tableau des duels
        </button>
        <button className="melee-menu-item" onClick={() => setView('history')}>
          <span className="menu-icon">📜</span>
          Historique ({matches.length})
        </button>
      </div>

      {lastMatch && (
        <div className="last-match-info" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p className="text-cyan">Dernier duel enregistré</p>
          <button
            className="melee-button"
            onClick={handleUndo}
            style={{ marginTop: '0.5rem' }}
          >
            ↩️ Annuler
          </button>
        </div>
      )}
    </div>
  );

  const renderNewMatch = () => (
    <div className="new-match">
      <h2 className="melee-frame-header text-center">Sélectionner les combattants</h2>

      <div className="versus-screen">
        {/* Player 1 */}
        <div className="fighter-select">
          <h3 className="text-cyan mb-1">Joueur 1</h3>
          <div className="fighter-grid">
            {MAIN_PLAYERS.map(playerId => {
              const player = getPlayer(playerId);
              const isSelected = player1 === playerId;
              const isOther = player2 === playerId;

              return (
                <button
                  key={playerId}
                  className={`fighter-btn ${isSelected ? 'selected' : ''} ${isOther ? 'taken' : ''}`}
                  onClick={() => selectPlayer(playerId, 1)}
                  disabled={isOther}
                  style={{ '--player-color': player.color }}
                >
                  <div className="fighter-avatar" style={{ background: player.color }}>
                    {player.initial}
                  </div>
                  <span>{player.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* VS */}
        <div className="vs-center">
          <span className="vs-text">VS</span>
        </div>

        {/* Player 2 */}
        <div className="fighter-select">
          <h3 className="text-orange mb-1">Joueur 2</h3>
          <div className="fighter-grid">
            {MAIN_PLAYERS.map(playerId => {
              const player = getPlayer(playerId);
              const isSelected = player2 === playerId;
              const isOther = player1 === playerId;

              return (
                <button
                  key={playerId}
                  className={`fighter-btn ${isSelected ? 'selected' : ''} ${isOther ? 'taken' : ''}`}
                  onClick={() => selectPlayer(playerId, 2)}
                  disabled={isOther}
                  style={{ '--player-color': player.color }}
                >
                  <div className="fighter-avatar" style={{ background: player.color }}>
                    {player.initial}
                  </div>
                  <span>{player.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Winner selection */}
      {player1 && player2 && (
        <div className="winner-select" style={{ marginTop: '2rem' }}>
          <h3 className="text-gold mb-1 text-center">Qui a gagné ?</h3>
          <div className="winner-buttons">
            <button
              className={`winner-btn melee-button ${winner === player1 ? 'selected' : ''}`}
              onClick={() => selectWinner(player1)}
              style={{ '--player-color': getPlayer(player1).color }}
            >
              <div className="fighter-avatar" style={{ background: getPlayer(player1).color }}>
                {getPlayer(player1).initial}
              </div>
              <span>{getPlayer(player1).name}</span>
              <span className="text-gold">+3 pts</span>
            </button>
            <button
              className={`winner-btn melee-button ${winner === player2 ? 'selected' : ''}`}
              onClick={() => selectWinner(player2)}
              style={{ '--player-color': getPlayer(player2).color }}
            >
              <div className="fighter-avatar" style={{ background: getPlayer(player2).color }}>
                {getPlayer(player2).initial}
              </div>
              <span>{getPlayer(player2).name}</span>
              <span className="text-gold">+3 pts</span>
            </button>
          </div>
        </div>
      )}

      <div className="match-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
        <button
          className="melee-button"
          onClick={() => {
            setPlayer1(null);
            setPlayer2(null);
            setWinner(null);
            setView('menu');
          }}
          style={{ flex: 1 }}
        >
          ❌ Annuler
        </button>
        <button
          className={`melee-button ${isReady ? 'selected' : ''}`}
          onClick={handleSubmit}
          disabled={!isReady}
          style={{ flex: 2 }}
        >
          ✅ Valider le duel
        </button>
      </div>
    </div>
  );

  const renderBracket = () => {
    const h2h = getHeadToHead();

    return (
      <div className="bracket-view">
        <h2 className="melee-frame-header">📊 Tableau des duels</h2>

        <div className="h2h-grid melee-frame">
          <div className="h2h-header">
            <div className="h2h-corner"></div>
            {MAIN_PLAYERS.map(p => (
              <div key={p} className="h2h-col-header" style={{ color: getPlayer(p).color }}>
                {getPlayer(p).initial}
              </div>
            ))}
          </div>

          {MAIN_PLAYERS.map(p1 => (
            <div key={p1} className="h2h-row">
              <div className="h2h-row-header" style={{ color: getPlayer(p1).color }}>
                {getPlayer(p1).name}
              </div>
              {MAIN_PLAYERS.map(p2 => {
                if (p1 === p2) {
                  return <div key={p2} className="h2h-cell self">—</div>;
                }
                const record = h2h[p1][p2];
                const total = record.wins + record.losses;
                const winRate = total > 0 ? Math.round((record.wins / total) * 100) : 0;

                return (
                  <div
                    key={p2}
                    className={`h2h-cell ${record.wins > record.losses ? 'winning' : record.wins < record.losses ? 'losing' : ''}`}
                  >
                    <span className="record">{record.wins}-{record.losses}</span>
                    {total > 0 && <span className="winrate">{winRate}%</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <button className="melee-button" onClick={() => setView('menu')} style={{ marginTop: '1rem', width: '100%' }}>
          ← Retour
        </button>
      </div>
    );
  };

  const renderHistory = () => (
    <div className="match-history">
      <h2 className="melee-frame-header">📜 Historique 1v1</h2>

      {matches.length === 0 ? (
        <p className="text-cyan text-center">Aucun duel enregistré</p>
      ) : (
        <div className="history-list">
          {matches.slice(0, 30).map((match, idx) => (
            <div key={match.id} className="history-item melee-frame" style={{ marginBottom: '0.5rem', padding: '0.8rem' }}>
              <div className="history-header">
                <span className="text-gold">Duel #{matches.length - idx}</span>
                <span className="text-cyan" style={{ fontSize: '0.8rem' }}>
                  {new Date(match.timestamp).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="duel-result">
                <span
                  className={match.winner === match.player1 ? 'winner-name' : 'loser-name'}
                  style={{ '--player-color': getPlayer(match.player1)?.color }}
                >
                  {getPlayer(match.player1)?.name}
                </span>
                <span className="vs-small">vs</span>
                <span
                  className={match.winner === match.player2 ? 'winner-name' : 'loser-name'}
                  style={{ '--player-color': getPlayer(match.player2)?.color }}
                >
                  {getPlayer(match.player2)?.name}
                </span>
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

  return (
    <div className="page onevone-page">
      <div className="page-content">
        {view === 'menu' && renderMenu()}
        {view === 'newMatch' && renderNewMatch()}
        {view === 'bracket' && renderBracket()}
        {view === 'history' && renderHistory()}
      </div>

      {view === 'menu' && <BackButton to="/" />}

      <style>{`
        .onevone-page {
          min-height: 100vh;
          padding: 2rem;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 3rem;
        }

        .page-content {
          width: 100%;
          max-width: 900px;
          animation: fadeIn 0.3s ease-out;
        }

        .mode-menu {
          text-align: center;
        }

        /* Versus Screen */
        .versus-screen {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 1rem;
          align-items: start;
        }

        .fighter-select {
          text-align: center;
        }

        .fighter-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }

        .fighter-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
          padding: 0.8rem;
          background: linear-gradient(180deg, rgba(40, 30, 60, 0.9) 0%, rgba(20, 15, 35, 0.95) 100%);
          border: 2px solid rgba(255, 255, 255, 0.2);
          color: white;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .fighter-btn:hover:not(:disabled) {
          border-color: var(--player-color);
          transform: scale(1.05);
        }

        .fighter-btn.selected {
          border-color: var(--melee-gold);
          background: linear-gradient(180deg, rgba(100, 70, 30, 0.9) 0%, rgba(60, 40, 20, 0.95) 100%);
          box-shadow: 0 0 20px rgba(212, 168, 67, 0.5);
        }

        .fighter-btn.taken {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .fighter-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.4rem;
          color: #1a0a2e;
        }

        .vs-center {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
        }

        .vs-text {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 3rem;
          color: var(--melee-gold);
          text-shadow: 0 0 30px var(--melee-gold);
          animation: vsPulse 1.5s ease-in-out infinite;
        }

        @keyframes vsPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .winner-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .winner-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
        }

        /* Head to Head Grid */
        .h2h-grid {
          overflow-x: auto;
        }

        .h2h-header, .h2h-row {
          display: grid;
          grid-template-columns: 100px repeat(4, 1fr);
          gap: 2px;
        }

        .h2h-corner {
          background: transparent;
        }

        .h2h-col-header, .h2h-row-header {
          padding: 0.5rem;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.2rem;
          text-align: center;
        }

        .h2h-cell {
          padding: 0.5rem;
          text-align: center;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .h2h-cell.self {
          background: rgba(0, 0, 0, 0.3);
          color: rgba(255, 255, 255, 0.3);
        }

        .h2h-cell.winning {
          background: rgba(78, 205, 196, 0.2);
        }

        .h2h-cell.losing {
          background: rgba(255, 107, 107, 0.2);
        }

        .h2h-cell .record {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.3rem;
        }

        .h2h-cell .winrate {
          font-size: 0.7rem;
          opacity: 0.7;
        }

        /* History */
        .duel-result {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          font-size: 1.1rem;
        }

        .winner-name {
          color: var(--melee-gold);
          font-weight: bold;
        }

        .winner-name::before {
          content: '👑 ';
        }

        .loser-name {
          opacity: 0.6;
        }

        .vs-small {
          color: var(--melee-gold);
          font-size: 0.9rem;
        }

        .history-list {
          max-height: 60vh;
          overflow-y: auto;
        }

        @media (max-width: 600px) {
          .versus-screen {
            grid-template-columns: 1fr;
          }

          .vs-center {
            padding: 1rem;
          }

          .vs-text {
            font-size: 2rem;
          }

          .fighter-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .winner-buttons {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default OneVsOne;
