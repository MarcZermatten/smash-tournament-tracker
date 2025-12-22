import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllPlayers, getPlayer, POINTS_SYSTEM } from '../data/players';
import { addMatch, getMatchesByType, undoLastMatch } from '../data/storage';
import { useAudio } from '../hooks/useAudio';
import LayoutEditor from '../components/LayoutEditor';

// Configuration par défaut du layout Casual
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

const Casual = () => {
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [rankings, setRankings] = useState({});
  const [lastMatch, setLastMatch] = useState(null);
  const [allPlayers, setAllPlayers] = useState(getAllPlayers());
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const { playSound } = useAudio();

  const config = POINTS_SYSTEM.casual;

  useEffect(() => {
    const handleUpdate = () => setAllPlayers(getAllPlayers());
    window.addEventListener('playersUpdate', handleUpdate);
    return () => window.removeEventListener('playersUpdate', handleUpdate);
  }, []);

  const matches = getMatchesByType('casual');

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

  const clearSelection = () => {
    setSelectedPlayers([]);
    setRankings({});
    playSound('cancel');
  };

  // Stats par joueur
  const playerStats = allPlayers.reduce((acc, playerId) => {
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
            <h1>CASUAL</h1>
            <span className="mode-subtitle">Parties détendues</span>
          </div>
        </div>

        {/* Dashboard Layout - 3 colonnes */}
        <div className="dashboard-container">
          {/* COLONNE GAUCHE - Sélection joueurs */}
          <div className="dashboard-panel rotation-panel">
            <div className="panel-header">
              <span className="panel-title">Joueurs</span>
              <span className="panel-badge">{selectedPlayers.length}/8</span>
            </div>

            <div className="matchup-list">
              {allPlayers.map(playerId => {
                const player = getPlayer(playerId);
                const isSelected = selectedPlayers.includes(playerId);
                const stats = playerStats[playerId];

                return (
                  <button
                    key={playerId}
                    className={`matchup-mini ${isSelected ? 'active' : ''}`}
                    onClick={() => togglePlayer(playerId)}
                    style={{
                      justifyContent: 'space-between',
                      borderLeft: `3px solid ${player.color}`
                    }}
                  >
                    <span style={{ color: player.color, fontWeight: 500 }}>
                      {player.name}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                        {stats.totalPoints}pts
                      </span>
                      {isSelected && (
                        <span style={{ color: 'var(--cyan-light)' }}>✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLONNE CENTRALE - Classement */}
          <div className="dashboard-panel match-panel">
            <div className="panel-header">
              <span className="panel-title">Classement</span>
              <span className="panel-badge">{Object.keys(rankings).length}/{selectedPlayers.length}</span>
            </div>

            {selectedPlayers.length >= 2 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedPlayers.map(playerId => {
                  const player = getPlayer(playerId);
                  const currentPosition = rankings[playerId];

                  return (
                    <div key={playerId} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px',
                      background: currentPosition ? 'rgba(100, 80, 30, 0.4)' : 'rgba(20, 40, 80, 0.5)',
                      border: `2px solid ${currentPosition ? 'var(--yellow-selected)' : 'rgba(100, 150, 200, 0.3)'}`,
                      borderRadius: '6px'
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
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}>
                        {player.initial}
                      </div>
                      <span style={{ flex: 1, fontFamily: 'Oswald' }}>{player.name}</span>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        {selectedPlayers.map((_, idx) => {
                          const pos = idx + 1;
                          const isSelected = currentPosition === pos;
                          const isTaken = Object.values(rankings).includes(pos) && !isSelected;
                          const pts = getPointsForPosition(pos, selectedPlayers.length);

                          return (
                            <button
                              key={pos}
                              onClick={() => !isTaken && handlePositionSelect(playerId, pos)}
                              disabled={isTaken}
                              style={{
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: isSelected
                                  ? pos === 1 ? 'linear-gradient(135deg, #ffd700, #b8860b)'
                                    : pos === 2 ? 'linear-gradient(135deg, #c0c0c0, #808080)'
                                    : pos === 3 ? 'linear-gradient(135deg, #cd7f32, #8b4513)'
                                    : 'linear-gradient(180deg, #ffe840 0%, #d0a800 100%)'
                                  : isTaken
                                    ? 'rgba(50, 50, 50, 0.5)'
                                    : 'rgba(20, 40, 80, 0.6)',
                                border: `2px solid ${isSelected ? '#ffe860' : isTaken ? '#333' : 'rgba(100, 150, 200, 0.3)'}`,
                                borderRadius: '4px',
                                color: isSelected ? '#1a1a1a' : isTaken ? '#555' : '#c0d0e0',
                                cursor: isTaken ? 'not-allowed' : 'pointer',
                                fontFamily: 'Oswald',
                                fontSize: '0.85rem',
                                opacity: isTaken ? 0.4 : 1
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>{pos}</span>
                              <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>+{pts}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--cyan-light)',
                fontFamily: 'Oswald'
              }}>
                Sélectionne au moins 2 joueurs
              </div>
            )}

            {/* Actions */}
            <div className="match-quick-actions" style={{ marginTop: 'auto' }}>
              {selectedPlayers.length > 0 && (
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

          {/* COLONNE DROITE - Historique */}
          <div className="dashboard-panel results-panel">
            {lastMatch && (
              <div className="last-match-alert">
                <span className="alert-winner" style={{ color: getPlayer(lastMatch.results?.find(r => r.position === 1)?.player)?.color }}>
                  {getPlayer(lastMatch.results?.find(r => r.position === 1)?.player)?.name}
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
              <div className="recent-list" style={{ maxHeight: '180px' }}>
                {recentMatches.map((match) => (
                  <div key={match.id} style={{
                    padding: '8px 10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '4px',
                    marginBottom: '6px',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                      {match.playerCount} joueurs
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {match.results?.sort((a, b) => a.position - b.position).slice(0, 3).map(r => (
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
                              : 'linear-gradient(135deg, #cd7f32, #8b4513)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.6rem',
                            fontWeight: 600,
                            color: '#1a1a1a'
                          }}>
                            {r.position}
                          </span>
                          <span style={{ color: getPlayer(r.player)?.color }}>
                            {getPlayer(r.player)?.name}
                          </span>
                        </span>
                      ))}
                      {match.results?.length > 3 && (
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                          +{match.results.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-mini">Aucune partie</div>
            )}

            {/* Système de points */}
            <div className="panel-header" style={{ marginTop: '1rem' }}>
              <span className="panel-title">Points</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--cyan-light)' }}>
              <div style={{ marginBottom: '6px' }}>
                Points = nb joueurs - position + 1
              </div>
              <div style={{ opacity: 0.7, fontSize: '0.75rem' }}>
                Ex: 4 joueurs → 1er: 4pts, 2e: 3pts, 3e: 2pts, 4e: 1pt
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton retour */}
      <Link to="/" className="back-btn">
        &larr; Menu
      </Link>

      {/* Layout Editor (mode dev) */}
      <LayoutEditor
        pageKey="casual"
        defaultLayout={DEFAULT_LAYOUT}
        controls={LAYOUT_CONTROLS}
        onLayoutChange={setLayout}
      />
    </div>
  );
};

export default Casual;
