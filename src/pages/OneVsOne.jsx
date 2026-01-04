import { useState, useCallback, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMainPlayers, getPlayer, getAvatar, getPointsSystem, getPlayerImage } from '../data/players';
import Icon from '../components/Icon';
import { addMatch, getMatchesByType, undoLastMatch } from '../data/storage';
import { useAudio } from '../context/AudioContext';
import { useTournament } from '../context/TournamentContext';
import LayoutEditor from '../components/LayoutEditor';
import { playMenuSelectSound } from '../utils/sounds';

// Configuration par défaut du layout 1v1
const DEFAULT_LAYOUT = {
  frameTop: 22,
  frameScale: 135,
  logoSize: 315,
  logoX: -50,
  logoY: -100,
  titleX: -40,
  titleAlign: 0,
  panelGap: 16,
  rotationWidth: 194,
  matchWidth: 409,
  resultsWidth: 228,
  fontSize: 104,
};

// Contrôles disponibles pour le layout editor
const LAYOUT_CONTROLS = [
  { key: 'frameTop', label: 'Position Y', min: -20, max: 50, unit: 'vh', group: 'Cadre' },
  { key: 'frameScale', label: 'Échelle', min: 50, max: 150, unit: '%', group: 'Cadre' },
  { key: 'logoSize', label: 'Taille', min: 50, max: 400, unit: 'px', group: 'Logo' },
  { key: 'logoX', label: 'Position X', min: -200, max: 300, unit: 'px', group: 'Logo' },
  { key: 'logoY', label: 'Position Y', min: -200, max: 200, unit: 'px', group: 'Logo' },
  { key: 'titleX', label: 'Décalage X', min: -500, max: 500, unit: 'px', group: 'Titre' },
  { key: 'titleAlign', label: 'Alignement', min: 0, max: 100, step: 50, unit: '%', group: 'Titre' },
  { key: 'panelGap', label: 'Espacement', min: 5, max: 60, unit: 'px', group: 'Panels' },
  { key: 'rotationWidth', label: 'Rotation', min: 100, max: 400, unit: 'px', group: 'Panels' },
  { key: 'matchWidth', label: 'Match', min: 200, max: 600, unit: 'px', group: 'Panels' },
  { key: 'resultsWidth', label: 'Résultats', min: 150, max: 400, unit: 'px', group: 'Panels' },
  { key: 'fontSize', label: 'Taille texte', min: 60, max: 150, unit: '%', group: 'Texte' },
];

const OneVsOne = () => {
  const [player1, setPlayer1] = useState(null);
  const [player2, setPlayer2] = useState(null);
  const [winner, setWinner] = useState(null);
  const [lastMatch, setLastMatch] = useState(null);
  const [mainPlayers, setMainPlayers] = useState(getMainPlayers());
  const [pointsConfig, setPointsConfig] = useState(getPointsSystem()['1v1']);
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const { playSound } = useAudio();
  const { tournament, isActive: isTournamentActive } = useTournament();
  const navigate = useNavigate();

  // Recharger les joueurs et la config quand ils changent
  useEffect(() => {
    const handleUpdate = () => {
      setMainPlayers(getMainPlayers());
      setPointsConfig(getPointsSystem()['1v1']);
    };
    window.addEventListener('playersUpdate', handleUpdate);
    window.addEventListener('settingsUpdate', handleUpdate);
    return () => {
      window.removeEventListener('playersUpdate', handleUpdate);
      window.removeEventListener('settingsUpdate', handleUpdate);
    };
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
  const allRotationsComplete = notPlayed.length === 0 && matchups.length > 0;

  // Déterminer le mode suivant dans le tournoi
  const getNextMode = () => {
    if (!isTournamentActive || !tournament.modes) return null;
    const currentIndex = tournament.modes.indexOf('1v1');
    if (currentIndex === -1 || currentIndex >= tournament.modes.length - 1) return null;
    return tournament.modes[currentIndex + 1];
  };

  const nextMode = getNextMode();
  const modeRoutes = {
    '1v1': '/1v1',
    'ffa': '/ffa',
    'team_ff': '/team-ff',
    'team_noff': '/team-noff',
    'casual': '/casual'
  };
  const modeNames = {
    '1v1': '1 vs 1',
    'ffa': 'Free For All',
    'team_ff': '2v2 Friendly Fire',
    'team_noff': '2v2 Team',
    'casual': 'Casual'
  };

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
      winPoints: pointsConfig.win,
      losePoints: pointsConfig.lose,
    });

    setLastMatch(match);
    setPlayer1(null);
    setPlayer2(null);
    setWinner(null);

    window.dispatchEvent(new Event('scoreUpdate'));
  }, [player1, player2, winner, isReady, playSound, pointsConfig]);

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

  // Styles dynamiques basés sur le layout
  const dynamicStyles = {
    frame: {
      transform: `scale(${layout.frameScale / 100})`,
      marginTop: `${layout.frameTop}vh`,
      transformOrigin: 'top center',
    },
    logoContainer: {
      left: `${layout.logoX}px`,
      transform: `translateY(calc(-50% + ${layout.logoY}px))`,
    },
    logo: {
      height: `${layout.logoSize}px`,
    },
    title: {
      marginLeft: `${layout.titleX}px`,
      textAlign: layout.titleAlign === 0 ? 'left' : layout.titleAlign === 100 ? 'right' : 'center',
    },
    header: {
      paddingLeft: `${layout.logoX + layout.logoSize + 20}px`,
    },
    container: { gap: `${layout.panelGap}px`, fontSize: `${layout.fontSize}%` },
    rotation: { width: `${layout.rotationWidth}px` },
    match: { width: `${layout.matchWidth}px` },
    results: { width: `${layout.resultsWidth}px` },
  };

  return (
    <div className="home-page">
      <div className="melee-main-frame dashboard-frame" style={dynamicStyles.frame}>
        {/* Header avec Logo style menu principal */}
        <div className="subpage-header" style={dynamicStyles.header}>
          <div className="subpage-logo-container" style={dynamicStyles.logoContainer}>
            <img src="/logo.png" alt="BFSA" className="subpage-logo" style={dynamicStyles.logo} />
            <div className="subpage-logo-glow"></div>
          </div>
          <div className="subpage-title" style={dynamicStyles.title}>
            <h1>1 VS 1</h1>
            <span className="mode-subtitle">Duels en tête-à-tête</span>
          </div>
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
                    const playerImg = getPlayerImage(playerId);
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
                        {playerImg ? (
                          <img src={playerImg} alt="" className="slot-btn-img" />
                        ) : (
                          <span className="slot-btn-initial" style={{ background: player.color }}>{player.initial}</span>
                        )}
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
                    const playerImg = getPlayerImage(playerId);
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
                        {playerImg ? (
                          <img src={playerImg} alt="" className="slot-btn-img" />
                        ) : (
                          <span className="slot-btn-initial" style={{ background: player.color }}>{player.initial}</span>
                        )}
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
                    <span className="winner-pts">+{pointsConfig.win} pts</span>
                  </button>
                  <button
                    className={`winner-opt ${winner === player2 ? 'selected' : ''}`}
                    onClick={() => selectWinner(player2)}
                    style={{ '--player-color': getPlayer(player2).color }}
                  >
                    <span className="winner-name">{getPlayer(player2).name}</span>
                    <span className="winner-pts">+{pointsConfig.win} pts</span>
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
            <div className="panel-header">
              <span className="panel-title">Historique</span>
              <span className="panel-badge">{matches.length}</span>
              {matches.length > 0 && (
                <button className="edit-results-btn" onClick={handleUndo} title="Annuler le dernier match">
                  <Icon name="undo" size={16} />
                </button>
              )}
            </div>

            {recentMatches.length > 0 ? (
              <div className="recent-list">
                {recentMatches.map((match, idx) => (
                  <div key={match.id} className="recent-item">
                    <span className="recent-winner" style={{ color: '#50ff90' }}>
                      {getPlayer(match.winner)?.name}
                    </span>
                    <span className="recent-vs">vs</span>
                    <span className="recent-loser" style={{ color: '#ff6b6b' }}>
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

      {/* Bouton Mode Suivant - apparaît quand toutes les rotations sont terminées */}
      {allRotationsComplete && isTournamentActive && (
        <div className="next-mode-container">
          {nextMode ? (
            <button
              className="next-mode-btn"
              onClick={() => {
                playSound('confirm');
                navigate(modeRoutes[nextMode]);
              }}
            >
              <span className="next-mode-label">Mode suivant</span>
              <span className="next-mode-name">{modeNames[nextMode]}</span>
              <span className="next-mode-arrow"><Icon name="arrowRight" size={14} /></span>
            </button>
          ) : (
            <button
              className="next-mode-btn results"
              onClick={() => {
                playSound('confirm');
                navigate('/leaderboard');
              }}
            >
              <span className="next-mode-label">Tournoi terminé !</span>
              <span className="next-mode-name">Voir les résultats</span>
              <span className="next-mode-arrow"><Icon name="trophy" size={16} /></span>
            </button>
          )}
        </div>
      )}

      {/* Bouton retour */}
      <Link to="/" className="back-btn" onClick={playMenuSelectSound}>
        &larr; Menu
      </Link>

      {/* Layout Editor (mode dev) */}
      <LayoutEditor
        pageKey="1v1"
        defaultLayout={DEFAULT_LAYOUT}
        controls={LAYOUT_CONTROLS}
        onLayoutChange={setLayout}
      />

    </div>
  );
};

export default OneVsOne;
