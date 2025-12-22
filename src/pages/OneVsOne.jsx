import { useState, useCallback, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMainPlayers, getPlayer, getAvatar } from '../data/players';
import { addMatch, getMatchesByType, undoLastMatch } from '../data/storage';
import { useAudio } from '../hooks/useAudio';

const OneVsOne = () => {
  const [player1, setPlayer1] = useState(null);
  const [player2, setPlayer2] = useState(null);
  const [winner, setWinner] = useState(null);
  const [lastMatch, setLastMatch] = useState(null);
  const [mainPlayers, setMainPlayers] = useState(getMainPlayers());
  const { playSound } = useAudio();

  // Recharger les joueurs quand ils changent
  useEffect(() => {
    const handleUpdate = () => setMainPlayers(getMainPlayers());
    window.addEventListener('playersUpdate', handleUpdate);
    return () => window.removeEventListener('playersUpdate', handleUpdate);
  }, []);

  const matches = getMatchesByType('1v1');

  // Calculer tous les duels possibles et leur statut
  const matchups = useMemo(() => {
    const result = [];
    for (let i = 0; i < mainPlayers.length; i++) {
      for (let j = i + 1; j < mainPlayers.length; j++) {
        const p1 = mainPlayers[i];
        const p2 = mainPlayers[j];
        const played = matches.filter(m =>
          (m.player1 === p1 && m.player2 === p2) ||
          (m.player1 === p2 && m.player2 === p1)
        ).length;
        result.push({ player1: p1, player2: p2, played });
      }
    }
    return result;
  }, [matches, mainPlayers]);

  const notPlayed = matchups.filter(m => m.played === 0);
  const playedCount = matchups.filter(m => m.played > 0).length;

  // Calculer les stats head-to-head
  const h2h = useMemo(() => {
    const result = {};
    mainPlayers.forEach(p1 => {
      result[p1] = {};
      mainPlayers.forEach(p2 => {
        if (p1 !== p2) {
          result[p1][p2] = { wins: 0, losses: 0 };
        }
      });
    });

    matches.forEach(match => {
      if (match.winner && match.loser && result[match.winner] && result[match.loser]) {
        result[match.winner][match.loser].wins++;
        result[match.loser][match.winner].losses++;
      }
    });

    return result;
  }, [matches, mainPlayers]);

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

  const startMatchFromRotation = (p1, p2) => {
    setPlayer1(p1);
    setPlayer2(p2);
    setWinner(null);
    playSound('confirm');
  };

  const clearSelection = () => {
    setPlayer1(null);
    setPlayer2(null);
    setWinner(null);
    playSound('cancel');
  };

  // 5 derniers matchs
  const recentMatches = matches.slice(0, 5);

  return (
    <div className="home-page">
      <div className="melee-main-frame dashboard-frame">
        {/* Header */}
        <div className="melee-header">
          <h1 className="melee-logo">1 vs 1</h1>
          <div className="melee-header-line" />
        </div>

        {/* Dashboard Layout - 3 colonnes */}
        <div className="dashboard-container">
          {/* COLONNE GAUCHE - Rotation des duels */}
          <div className="dashboard-panel rotation-panel">
            <div className="panel-header">
              <span className="panel-title">Rotation</span>
              <span className="panel-badge">{playedCount}/{matchups.length}</span>
            </div>

            <div className="rotation-progress-mini">
              <div
                className="progress-fill"
                style={{ width: `${(playedCount / matchups.length) * 100}%` }}
              />
            </div>

            {notPlayed.length > 0 ? (
              <div className="matchup-list">
                {notPlayed.map((matchup, idx) => (
                  <button
                    key={idx}
                    className={`matchup-mini ${
                      player1 === matchup.player1 && player2 === matchup.player2 ? 'active' : ''
                    }`}
                    onClick={() => startMatchFromRotation(matchup.player1, matchup.player2)}
                  >
                    <span style={{ color: getPlayer(matchup.player1).color }}>
                      {getPlayer(matchup.player1).name}
                    </span>
                    <span className="vs-mini">vs</span>
                    <span style={{ color: getPlayer(matchup.player2).color }}>
                      {getPlayer(matchup.player2).name}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rotation-complete-mini">
                Tous les duels joues !
              </div>
            )}
          </div>

          {/* COLONNE CENTRALE - Zone de match */}
          <div className="dashboard-panel match-panel">
            <div className="panel-header">
              <span className="panel-title">Nouveau Duel</span>
            </div>

            {/* Selection des joueurs */}
            <div className="quick-select">
              <div className="player-slot">
                <span className="slot-label cyan">Joueur 1</span>
                <div className="slot-buttons">
                  {mainPlayers.map(playerId => {
                    const player = getPlayer(playerId);
                    const isSelected = player1 === playerId;
                    const isTaken = player2 === playerId;

                    return (
                      <button
                        key={playerId}
                        className={`slot-btn ${isSelected ? 'selected' : ''} ${isTaken ? 'taken' : ''}`}
                        onClick={() => !isTaken && selectPlayer(playerId, 1)}
                        disabled={isTaken}
                        style={{ '--player-color': player.color }}
                      >
                        {player.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="vs-badge">VS</div>

              <div className="player-slot">
                <span className="slot-label orange">Joueur 2</span>
                <div className="slot-buttons">
                  {mainPlayers.map(playerId => {
                    const player = getPlayer(playerId);
                    const isSelected = player2 === playerId;
                    const isTaken = player1 === playerId;

                    return (
                      <button
                        key={playerId}
                        className={`slot-btn ${isSelected ? 'selected' : ''} ${isTaken ? 'taken' : ''}`}
                        onClick={() => !isTaken && selectPlayer(playerId, 2)}
                        disabled={isTaken}
                        style={{ '--player-color': player.color }}
                      >
                        {player.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Selection du gagnant */}
            {player1 && player2 && (
              <div className="winner-quick">
                <span className="winner-label">Gagnant ?</span>
                <div className="winner-options">
                  <button
                    className={`winner-opt ${winner === player1 ? 'selected' : ''}`}
                    onClick={() => selectWinner(player1)}
                    style={{ '--player-color': getPlayer(player1).color }}
                  >
                    <span className="winner-name">{getPlayer(player1).name}</span>
                    <span className="winner-pts">+3 pts</span>
                  </button>
                  <button
                    className={`winner-opt ${winner === player2 ? 'selected' : ''}`}
                    onClick={() => selectWinner(player2)}
                    style={{ '--player-color': getPlayer(player2).color }}
                  >
                    <span className="winner-name">{getPlayer(player2).name}</span>
                    <span className="winner-pts">+3 pts</span>
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="match-quick-actions">
              {(player1 || player2) && (
                <button className="action-btn cancel" onClick={clearSelection}>
                  Annuler
                </button>
              )}
              <button
                className={`action-btn validate ${isReady ? 'ready' : ''}`}
                onClick={handleSubmit}
                disabled={!isReady}
              >
                Valider
              </button>
            </div>
          </div>

          {/* COLONNE DROITE - Resultats + H2H */}
          <div className="dashboard-panel results-panel">
            {/* Dernier match + Undo */}
            {lastMatch && (
              <div className="last-match-alert">
                <span className="alert-winner" style={{ color: getPlayer(lastMatch.winner)?.color }}>
                  {getPlayer(lastMatch.winner)?.name}
                </span>
                <span className="alert-text">gagne !</span>
                <button className="undo-btn" onClick={handleUndo}>Annuler</button>
              </div>
            )}

            <div className="panel-header">
              <span className="panel-title">Historique</span>
              <span className="panel-badge">{matches.length}</span>
            </div>

            {recentMatches.length > 0 ? (
              <div className="recent-list">
                {recentMatches.map((match, idx) => (
                  <div key={match.id} className="recent-item">
                    <span className="recent-winner" style={{ color: getPlayer(match.winner)?.color }}>
                      {getPlayer(match.winner)?.name}
                    </span>
                    <span className="recent-vs">vs</span>
                    <span className="recent-loser">
                      {getPlayer(match.loser)?.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-mini">Aucun duel</div>
            )}

            {/* Mini tableau H2H */}
            <div className="panel-header" style={{ marginTop: '1rem' }}>
              <span className="panel-title">Confrontations</span>
            </div>
            <div className="h2h-mini">
              <div className="h2h-mini-header">
                <div className="h2h-mini-corner"></div>
                {mainPlayers.map(p => (
                  <div key={p} className="h2h-mini-col" style={{ color: getPlayer(p)?.color }}>
                    {getPlayer(p)?.initial}
                  </div>
                ))}
              </div>
              {mainPlayers.map(p1 => (
                <div key={p1} className="h2h-mini-row">
                  <div className="h2h-mini-rowhead" style={{ color: getPlayer(p1)?.color }}>
                    {getPlayer(p1)?.initial}
                  </div>
                  {mainPlayers.map(p2 => {
                    if (p1 === p2) {
                      return <div key={p2} className="h2h-mini-cell self">-</div>;
                    }
                    const record = h2h[p1]?.[p2] || { wins: 0, losses: 0 };
                    const isWinning = record.wins > record.losses;
                    const isLosing = record.wins < record.losses;
                    return (
                      <div
                        key={p2}
                        className={`h2h-mini-cell ${isWinning ? 'win' : ''} ${isLosing ? 'lose' : ''}`}
                      >
                        {record.wins}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bouton retour */}
      <Link to="/" className="back-btn">
        &larr; Menu
      </Link>
    </div>
  );
};

export default OneVsOne;
