import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMainPlayers, getPlayer, getPointsSystem } from '../data/players';
import { addMatch, getMatchesByType, undoLastMatch, getMatchConfig } from '../data/storage';
import { useAudio } from '../hooks/useAudio';
import { useTournament } from '../context/TournamentContext';
import LayoutEditor from '../components/LayoutEditor';

// Configuration par défaut du layout FFA
const DEFAULT_LAYOUT = {
  frameTop: 20,
  frameScale: 100,
  logoSize: 315,
  logoX: -50,
  logoY: -100,
  titleX: -40,
  titleAlign: 0,
  fontSize: 104,
};

const LAYOUT_CONTROLS = [
  { key: 'frameTop', label: 'Position Y', min: 0, max: 20, unit: 'vh', group: 'Cadre' },
  { key: 'frameScale', label: 'Échelle', min: 70, max: 110, unit: '%', group: 'Cadre' },
  { key: 'logoSize', label: 'Taille', min: 80, max: 350, unit: 'px', group: 'Logo' },
  { key: 'logoX', label: 'Position X', min: -50, max: 200, unit: 'px', group: 'Logo' },
  { key: 'logoY', label: 'Position Y', min: -100, max: 100, unit: 'px', group: 'Logo' },
  { key: 'titleX', label: 'Décalage X', min: -300, max: 200, unit: 'px', group: 'Titre' },
  { key: 'titleAlign', label: 'Alignement', min: 0, max: 100, step: 50, unit: '%', group: 'Titre' },
  { key: 'fontSize', label: 'Taille texte', min: 80, max: 120, unit: '%', group: 'Texte' },
];

const FFA = () => {
  const [rankings, setRankings] = useState({}); // { playerId: position }
  const [lastMatch, setLastMatch] = useState(null);
  const [mainPlayers, setMainPlayers] = useState(getMainPlayers());
  const [pointsConfig, setPointsConfig] = useState(getPointsSystem().ffa);
  const [matchConfig, setMatchConfig] = useState(getMatchConfig());
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const { playSound } = useAudio();
  const { tournament, isActive: isTournamentActive } = useTournament();
  const navigate = useNavigate();

  // Recharger les joueurs et la config quand ils changent
  useEffect(() => {
    const handleUpdate = () => {
      setMainPlayers(getMainPlayers());
      setPointsConfig(getPointsSystem().ffa);
      setMatchConfig(getMatchConfig());
    };
    window.addEventListener('playersUpdate', handleUpdate);
    window.addEventListener('settingsUpdate', handleUpdate);
    return () => {
      window.removeEventListener('playersUpdate', handleUpdate);
      window.removeEventListener('settingsUpdate', handleUpdate);
    };
  }, []);

  const matches = getMatchesByType('ffa');
  const targetMatches = matchConfig?.ffa || 5;
  const allRotationsComplete = matches.length >= targetMatches;

  // Déterminer le mode suivant dans le tournoi
  const getNextMode = () => {
    if (!isTournamentActive || !tournament.modes) return null;
    const currentIndex = tournament.modes.indexOf('ffa');
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
      points: pointsConfig.positions[position]
    }));

    const match = addMatch({
      type: 'ffa',
      results,
    });

    setLastMatch(match);
    setRankings({});

    window.dispatchEvent(new Event('scoreUpdate'));
  }, [rankings, isComplete, playSound, pointsConfig]);

  const handleUndo = () => {
    const undone = undoLastMatch();
    if (undone) {
      playSound('cancel');
      setLastMatch(null);
      window.dispatchEvent(new Event('scoreUpdate'));
    }
  };

  const clearSelection = () => {
    setRankings({});
    playSound('cancel');
  };

  // Stats par joueur
  const playerStats = mainPlayers.reduce((acc, playerId) => {
    const playerMatches = matches.filter(m =>
      m.results?.some(r => r.player === playerId)
    );
    const wins = playerMatches.filter(m =>
      m.results?.find(r => r.player === playerId)?.position === 1
    ).length;
    const totalPoints = playerMatches.reduce((sum, m) => {
      const result = m.results?.find(r => r.player === playerId);
      return sum + (result?.points || 0);
    }, 0);

    acc[playerId] = { matches: playerMatches.length, wins, totalPoints };
    return acc;
  }, {});

  // 5 derniers matchs
  const recentMatches = matches.slice(0, 5);

  // Styles dynamiques basés sur le layout
  const dynamicStyles = {
    frame: {
      transform: `scale(${layout.frameScale / 100})`,
      marginTop: `${layout.frameTop}vh`,
      transformOrigin: 'top center',
      fontSize: `${layout.fontSize}%`,
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
            <h1>FREE FOR ALL</h1>
            <span className="mode-subtitle">4 joueurs, chacun pour soi</span>
          </div>
        </div>

        {/* Dashboard Layout - 3 colonnes */}
        <div className="dashboard-container">
          {/* COLONNE GAUCHE - Stats joueurs */}
          <div className="dashboard-panel rotation-panel">
            <div className="panel-header">
              <span className="panel-title">Stats FFA</span>
              <span className="panel-badge">{matches.length}/{targetMatches}</span>
            </div>

            {/* Barre de progression */}
            <div className="rotation-progress-mini">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(100, (matches.length / targetMatches) * 100)}%` }}
              />
            </div>

            {allRotationsComplete && (
              <div className="rotation-complete-mini" style={{ marginBottom: '10px' }}>
                ✓ Objectif atteint !
              </div>
            )}

            <div className="matchup-list">
              {mainPlayers.map(playerId => {
                const player = getPlayer(playerId);
                const stats = playerStats[playerId];

                return (
                  <div key={playerId} className="stat-row" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    background: 'rgba(20, 40, 80, 0.5)',
                    borderRadius: '6px',
                    marginBottom: '6px',
                    borderLeft: `3px solid ${player.color}`
                  }}>
                    <span style={{ color: player.color, fontWeight: 500, flex: 1 }}>
                      {player.name}
                    </span>
                    <span style={{ color: 'var(--yellow-selected)', fontSize: '0.9rem' }}>
                      {stats.wins}W
                    </span>
                    <span style={{ color: 'var(--cyan-light)', fontSize: '0.85rem' }}>
                      {stats.totalPoints}pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLONNE CENTRALE - Sélection positions */}
          <div className="dashboard-panel match-panel">
            <div className="panel-header">
              <span className="panel-title">Nouvelle Partie</span>
              <span className="panel-badge">{Object.keys(rankings).length}/4</span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              marginBottom: '15px'
            }}>
              {mainPlayers.map(playerId => {
                const player = getPlayer(playerId);
                const currentPosition = rankings[playerId];

                return (
                  <div key={playerId} style={{
                    background: 'rgba(6, 18, 35, 0.7)',
                    border: `2px solid ${currentPosition ? 'var(--yellow-selected)' : 'rgba(0, 150, 180, 0.4)'}`,
                    borderRadius: '8px',
                    padding: '12px',
                    transition: 'all 0.15s'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '10px',
                      paddingBottom: '8px',
                      borderBottom: `2px solid ${player.color}`
                    }}>
                      <div style={{
                        width: '35px',
                        height: '35px',
                        borderRadius: '50%',
                        background: player.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0a0a1a',
                        fontWeight: 600
                      }}>
                        {player.initial}
                      </div>
                      <span style={{ fontFamily: 'Oswald', fontSize: '1.1rem' }}>
                        {player.name}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      {[1, 2, 3, 4].map(pos => {
                        const isSelected = currentPosition === pos;
                        const isTaken = Object.values(rankings).includes(pos) && !isSelected;

                        return (
                          <button
                            key={pos}
                            onClick={() => !isTaken && handlePositionSelect(playerId, pos)}
                            disabled={isTaken}
                            style={{
                              padding: '8px 4px',
                              background: isSelected
                                ? 'linear-gradient(180deg, #ffe840 0%, #d0a800 100%)'
                                : isTaken
                                  ? 'rgba(50, 50, 50, 0.5)'
                                  : 'rgba(20, 40, 80, 0.6)',
                              border: `2px solid ${isSelected ? '#ffe860' : isTaken ? '#333' : 'rgba(100, 150, 200, 0.3)'}`,
                              borderRadius: '4px',
                              color: isSelected ? '#181008' : isTaken ? '#555' : '#c0d0e0',
                              cursor: isTaken ? 'not-allowed' : 'pointer',
                              fontFamily: 'Oswald',
                              fontSize: '0.9rem',
                              transition: 'all 0.1s',
                              opacity: isTaken ? 0.4 : 1
                            }}
                          >
                            <div style={{ fontWeight: 600 }}>{pos}</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                              +{pointsConfig.positions[pos]}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="match-quick-actions">
              {Object.keys(rankings).length > 0 && (
                <button className="action-btn cancel" onClick={clearSelection}>
                  Annuler
                </button>
              )}
              <button
                className={`action-btn validate ${isComplete ? 'ready' : ''}`}
                onClick={handleSubmit}
                disabled={!isComplete}
              >
                Valider
              </button>
            </div>
          </div>

          {/* COLONNE DROITE - Résultats complets */}
          <div className="dashboard-panel results-panel">
            {/* CLASSEMENT DU MODE */}
            <div className="panel-header">
              <span className="panel-title">Classement FFA</span>
              {matches.length > 0 && (
                <button className="edit-results-btn" onClick={handleUndo} title="Annuler le dernier match">
                  ↩
                </button>
              )}
            </div>
            <div style={{ marginBottom: '12px' }}>
              {mainPlayers
                .map(id => ({ id, ...playerStats[id], player: getPlayer(id) }))
                .sort((a, b) => b.totalPoints - a.totalPoints)
                .map((p, idx) => (
                  <div key={p.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    background: idx === 0 ? 'rgba(255, 200, 0, 0.15)' : 'rgba(255,255,255,0.02)',
                    borderRadius: '4px',
                    marginBottom: '3px',
                    borderLeft: `3px solid ${p.player?.color}`
                  }}>
                    <span style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: idx === 0 ? 'linear-gradient(135deg, #ffd700, #b8860b)'
                        : idx === 1 ? 'linear-gradient(135deg, #c0c0c0, #808080)'
                        : idx === 2 ? 'linear-gradient(135deg, #cd7f32, #8b4513)'
                        : 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: idx < 3 ? '#1a1a1a' : '#888'
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ flex: 1, color: p.player?.color, fontSize: '0.9rem' }}>
                      {p.player?.name}
                    </span>
                    <span style={{ color: 'var(--yellow-selected)', fontWeight: 600, fontSize: '0.9rem' }}>
                      {p.totalPoints}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                      ({p.wins}W)
                    </span>
                  </div>
                ))}
            </div>

            {/* HISTORIQUE */}
            <div className="panel-header">
              <span className="panel-title">Dernières parties</span>
              <span className="panel-badge">{matches.length}</span>
            </div>
            {recentMatches.length > 0 ? (
              <div className="recent-list" style={{ maxHeight: '120px' }}>
                {recentMatches.map((match) => (
                  <div key={match.id} style={{
                    padding: '6px 8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '4px',
                    marginBottom: '4px',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {match.results?.sort((a, b) => a.position - b.position).map(r => (
                        <span key={r.player} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <span style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: r.position === 1 ? 'linear-gradient(135deg, #ffd700, #b8860b)'
                              : r.position === 2 ? 'linear-gradient(135deg, #c0c0c0, #808080)'
                              : r.position === 3 ? 'linear-gradient(135deg, #cd7f32, #8b4513)'
                              : 'rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            color: r.position <= 3 ? '#1a1a1a' : '#888'
                          }}>
                            {r.position}
                          </span>
                          <span style={{ color: getPlayer(r.player)?.color }}>
                            {getPlayer(r.player)?.name}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-mini">Aucune partie</div>
            )}

            {/* SYSTÈME DE POINTS */}
            <div className="panel-header" style={{ marginTop: '10px' }}>
              <span className="panel-title">Points par place</span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '4px',
              textAlign: 'center'
            }}>
              {Object.entries(pointsConfig.positions).map(([pos, pts]) => (
                <div key={pos} style={{
                  padding: '6px 4px',
                  background: pos === '1' ? 'rgba(255, 200, 0, 0.2)' : 'rgba(0, 150, 180, 0.1)',
                  borderRadius: '4px',
                  border: `1px solid ${pos === '1' ? 'rgba(255, 200, 0, 0.4)' : 'rgba(0, 150, 180, 0.2)'}`
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                    {pos === '1' ? '1er' : pos === '2' ? '2e' : pos === '3' ? '3e' : '4e'}
                  </div>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: pos === '1' ? 'var(--yellow-selected)' : 'var(--cyan-light)'
                  }}>
                    +{pts}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bouton Mode Suivant - apparaît quand le nombre de matchs est atteint */}
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
              <span className="next-mode-arrow">→</span>
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
              <span className="next-mode-arrow">🏆</span>
            </button>
          )}
        </div>
      )}

      {/* Bouton retour */}
      <Link to="/" className="back-btn">
        &larr; Menu
      </Link>

      {/* Layout Editor (mode dev) */}
      <LayoutEditor
        pageKey="ffa"
        defaultLayout={DEFAULT_LAYOUT}
        controls={LAYOUT_CONTROLS}
        onLayoutChange={setLayout}
      />
    </div>
  );
};

export default FFA;
