import { useState, useCallback, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMainPlayers, getTeamRotations, getPointsSystem, getPlayer } from '../data/players';
import Icon from '../components/Icon';
import { addMatch, getMatchesByType, undoLastMatch } from '../data/storage';
import { useAudio } from '../context/AudioContext';
import { useTournament } from '../context/TournamentContext';
import LayoutEditor from '../components/LayoutEditor';
import { playMenuSelectSound } from '../utils/sounds';

// Configuration par défaut du layout Team
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

const Team = ({ mode = 'team_ff' }) => {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [winner, setWinner] = useState(null);
  const [customTeam1, setCustomTeam1] = useState([]);
  const [customTeam2, setCustomTeam2] = useState([]);
  const [useCustomTeams, setUseCustomTeams] = useState(false);
  const [lastMatch, setLastMatch] = useState(null);
  const [mainPlayers, setMainPlayers] = useState(getMainPlayers());
  const [teamRotations, setTeamRotations] = useState(getTeamRotations());
  const [pointsSystem, setPointsSystem] = useState(getPointsSystem());
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const { playSound } = useAudio();
  const { tournament, isActive: isTournamentActive } = useTournament();
  const navigate = useNavigate();

  useEffect(() => {
    const handleUpdate = () => {
      setMainPlayers(getMainPlayers());
      setTeamRotations(getTeamRotations());
      setPointsSystem(getPointsSystem());
    };
    window.addEventListener('playersUpdate', handleUpdate);
    window.addEventListener('settingsUpdate', handleUpdate);
    return () => {
      window.removeEventListener('playersUpdate', handleUpdate);
      window.removeEventListener('settingsUpdate', handleUpdate);
    };
  }, []);

  const config = mode === 'team_ff' ? pointsSystem.team_ff : pointsSystem.team_noff;
  const modeIcon = mode === 'team_ff' ? 'fire' : 'handshake';
  const modeName = mode === 'team_ff' ? '2v2 FF' : '2v2 Team';

  const matches = getMatchesByType(mode);

  // Helper: vérifier si deux équipes sont identiques (indépendamment de l'ordre)
  const teamsMatch = (t1, t2) => {
    if (!t1 || !t2 || t1.length !== t2.length) return false;
    const sorted1 = [...t1].sort();
    const sorted2 = [...t2].sort();
    return sorted1.every((p, i) => p === sorted2[i]);
  };

  // Calculer les rotations avec statut "joué"
  const rotationsWithStatus = useMemo(() => {
    return teamRotations.map((rotation, idx) => {
      // Chercher si ce match a déjà été joué (teams dans n'importe quel ordre)
      const played = matches.some(m => {
        const matchTeam1 = m.team1 || [];
        const matchTeam2 = m.team2 || [];
        // Vérifier les deux combinaisons possibles
        return (teamsMatch(rotation.team1, matchTeam1) && teamsMatch(rotation.team2, matchTeam2)) ||
               (teamsMatch(rotation.team1, matchTeam2) && teamsMatch(rotation.team2, matchTeam1));
      });
      return { ...rotation, idx, played };
    });
  }, [teamRotations, matches]);

  const notPlayed = rotationsWithStatus.filter(r => !r.played);
  const playedCount = rotationsWithStatus.filter(r => r.played).length;
  const allRotationsComplete = notPlayed.length === 0 && teamRotations.length > 0;

  // Déterminer le mode suivant dans le tournoi
  const getNextMode = () => {
    if (!isTournamentActive || !tournament.modes) return null;
    const currentIndex = tournament.modes.indexOf(mode);
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

  const getTeams = () => {
    if (useCustomTeams) {
      return { team1: customTeam1, team2: customTeam2 };
    }
    if (selectedTeam !== null && teamRotations[selectedTeam]) {
      return teamRotations[selectedTeam];
    }
    return null;
  };

  const isReady = () => {
    const teams = getTeams();
    if (!teams) return false;
    return teams.team1.length === 2 && teams.team2.length === 2 && winner !== null;
  };

  const handleSubmit = useCallback(() => {
    if (!isReady()) return;
    playSound('confirm');

    const teams = getTeams();
    const winners = winner === 'team1' ? teams.team1 : teams.team2;
    const losers = winner === 'team1' ? teams.team2 : teams.team1;

    const match = addMatch({
      type: mode,
      team1: teams.team1,
      team2: teams.team2,
      winners,
      losers,
      winPoints: config.win,
      losePoints: config.lose,
    });

    setLastMatch(match);
    setSelectedTeam(null);
    setWinner(null);
    setCustomTeam1([]);
    setCustomTeam2([]);

    window.dispatchEvent(new Event('scoreUpdate'));
  }, [mode, winner, selectedTeam, customTeam1, customTeam2, useCustomTeams, config, playSound]);

  const handleUndo = () => {
    const undone = undoLastMatch();
    if (undone) {
      playSound('cancel');
      setLastMatch(null);
      window.dispatchEvent(new Event('scoreUpdate'));
    }
  };

  const toggleCustomPlayer = (playerId, team) => {
    playSound('select');
    if (team === 1) {
      if (customTeam1.includes(playerId)) {
        setCustomTeam1(customTeam1.filter(p => p !== playerId));
      } else if (customTeam1.length < 2) {
        setCustomTeam1([...customTeam1, playerId]);
        setCustomTeam2(customTeam2.filter(p => p !== playerId));
      }
    } else {
      if (customTeam2.includes(playerId)) {
        setCustomTeam2(customTeam2.filter(p => p !== playerId));
      } else if (customTeam2.length < 2) {
        setCustomTeam2([...customTeam2, playerId]);
        setCustomTeam1(customTeam1.filter(p => p !== playerId));
      }
    }
  };

  const selectRotation = (idx) => {
    playSound('select');
    setSelectedTeam(idx);
    setWinner(null);
  };

  const clearSelection = () => {
    setSelectedTeam(null);
    setWinner(null);
    setCustomTeam1([]);
    setCustomTeam2([]);
    playSound('cancel');
  };

  // Stats par joueur
  const playerStats = mainPlayers.reduce((acc, playerId) => {
    const playerMatches = matches.filter(m =>
      m.team1?.includes(playerId) || m.team2?.includes(playerId)
    );
    const wins = playerMatches.filter(m => m.winners?.includes(playerId)).length;
    acc[playerId] = { matches: playerMatches.length, wins };
    return acc;
  }, {});

  const recentMatches = matches.slice(0, 5);
  const teams = getTeams();

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
            <h1><Icon name={modeIcon} size={24} /> {modeName}</h1>
            <span className="mode-subtitle">{mode === 'team_ff' ? 'Équipes avec Friendly Fire' : 'Équipes sans Friendly Fire'}</span>
          </div>
        </div>

        {/* Dashboard Layout - 3 colonnes */}
        <div className="dashboard-container">
          {/* COLONNE GAUCHE - Rotations ou Stats */}
          <div className="dashboard-panel rotation-panel">
            <div className="panel-header">
              <span className="panel-title">
                {useCustomTeams ? 'Stats' : 'Rotations'}
              </span>
              <span className="panel-badge">{playedCount}/{teamRotations.length}</span>
            </div>

            {/* Barre de progression */}
            {!useCustomTeams && teamRotations.length > 0 && (
              <div className="rotation-progress-mini">
                <div
                  className="progress-fill"
                  style={{ width: `${(playedCount / teamRotations.length) * 100}%` }}
                />
              </div>
            )}

            {useCustomTeams ? (
              // Mode custom: afficher stats joueurs
              <div className="matchup-list">
                {mainPlayers.map(playerId => {
                  const player = getPlayer(playerId);
                  const stats = playerStats[playerId];
                  return (
                    <div key={playerId} style={{
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
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                        /{stats.matches}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Mode rotation: afficher les rotations avec statut joué/non joué
              <div className="matchup-list">
                {/* Afficher d'abord les non jouées */}
                {notPlayed.map((rotation) => (
                  <button
                    key={rotation.idx}
                    className={`matchup-mini ${selectedTeam === rotation.idx ? 'active' : ''}`}
                    onClick={() => selectRotation(rotation.idx)}
                    style={{ flexDirection: 'column', padding: '10px' }}
                  >
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                      {rotation.team1.map(p => (
                        <span key={p} style={{ color: getPlayer(p)?.color, fontSize: '0.9rem' }}>
                          {getPlayer(p)?.name}
                        </span>
                      ))}
                    </div>
                    <span className="vs-mini">vs</span>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      {rotation.team2.map(p => (
                        <span key={p} style={{ color: getPlayer(p)?.color, fontSize: '0.9rem' }}>
                          {getPlayer(p)?.name}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}

                {/* Message si toutes les rotations sont terminées */}
                {allRotationsComplete && (
                  <div className="rotation-complete-mini">
                    <Icon name="check" size={14} /> Toutes les rotations jouées !
                  </div>
                )}

                <button
                  className="matchup-mini"
                  onClick={() => { setUseCustomTeams(true); clearSelection(); }}
                  style={{ marginTop: '10px', borderStyle: 'dashed' }}
                >
                  <span style={{ color: 'var(--cyan-light)' }}>+ Custom</span>
                </button>
              </div>
            )}

            {useCustomTeams && (
              <button
                className="matchup-mini"
                onClick={() => { setUseCustomTeams(false); clearSelection(); }}
                style={{ marginTop: '10px' }}
              >
                <span style={{ color: 'var(--cyan-light)' }}><Icon name="arrowLeft" size={14} /> Rotations</span>
              </button>
            )}
          </div>

          {/* COLONNE CENTRALE - Sélection équipes */}
          <div className="dashboard-panel match-panel">
            <div className="panel-header">
              <span className="panel-title">
                {useCustomTeams ? 'Équipes Custom' : 'Match'}
              </span>
            </div>

            {useCustomTeams ? (
              // Mode custom: sélection des joueurs
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                {/* Équipe 1 */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '10px',
                    color: 'var(--cyan-light)',
                    fontFamily: 'Oswald'
                  }}>
                    Équipe 1
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {mainPlayers.map(playerId => {
                      const player = getPlayer(playerId);
                      const inTeam1 = customTeam1.includes(playerId);
                      const inTeam2 = customTeam2.includes(playerId);
                      return (
                        <button
                          key={playerId}
                          onClick={() => !inTeam2 && toggleCustomPlayer(playerId, 1)}
                          disabled={inTeam2}
                          className={`slot-btn ${inTeam1 ? 'selected' : ''} ${inTeam2 ? 'taken' : ''}`}
                          style={{ '--player-color': player.color }}
                        >
                          {player.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="vs-badge">VS</div>

                {/* Équipe 2 */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '10px',
                    color: '#f0a050',
                    fontFamily: 'Oswald'
                  }}>
                    Équipe 2
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {mainPlayers.map(playerId => {
                      const player = getPlayer(playerId);
                      const inTeam1 = customTeam1.includes(playerId);
                      const inTeam2 = customTeam2.includes(playerId);
                      return (
                        <button
                          key={playerId}
                          onClick={() => !inTeam1 && toggleCustomPlayer(playerId, 2)}
                          disabled={inTeam1}
                          className={`slot-btn ${inTeam2 ? 'selected' : ''} ${inTeam1 ? 'taken' : ''}`}
                          style={{ '--player-color': player.color }}
                        >
                          {player.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              // Mode rotation: afficher l'équipe sélectionnée
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                {teams ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                    <div>
                      {teams.team1.map(p => (
                        <div key={p} style={{
                          color: getPlayer(p)?.color,
                          fontSize: '1.3rem',
                          fontFamily: 'Oswald',
                          marginBottom: '4px'
                        }}>
                          {getPlayer(p)?.name}
                        </div>
                      ))}
                    </div>
                    <div className="vs-badge">VS</div>
                    <div>
                      {teams.team2.map(p => (
                        <div key={p} style={{
                          color: getPlayer(p)?.color,
                          fontSize: '1.3rem',
                          fontFamily: 'Oswald',
                          marginBottom: '4px'
                        }}>
                          {getPlayer(p)?.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--cyan-light)', fontFamily: 'Oswald' }}>
                    Sélectionne une rotation
                  </div>
                )}
              </div>
            )}

            {/* Sélection du gagnant */}
            {teams && teams.team1.length === 2 && teams.team2.length === 2 && (
              <div className="winner-quick">
                <span className="winner-label">Gagnant ?</span>
                <div className="winner-options">
                  <button
                    className={`winner-opt ${winner === 'team1' ? 'selected' : ''}`}
                    onClick={() => { playSound('select'); setWinner('team1'); }}
                  >
                    <span className="winner-name">
                      {teams.team1.map(p => getPlayer(p)?.name).join(' & ')}
                    </span>
                    <span className="winner-pts">+{config.win} pts</span>
                  </button>
                  <button
                    className={`winner-opt ${winner === 'team2' ? 'selected' : ''}`}
                    onClick={() => { playSound('select'); setWinner('team2'); }}
                  >
                    <span className="winner-name">
                      {teams.team2.map(p => getPlayer(p)?.name).join(' & ')}
                    </span>
                    <span className="winner-pts">+{config.win} pts</span>
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="match-quick-actions">
              {(selectedTeam !== null || customTeam1.length > 0 || customTeam2.length > 0) && (
                <button className="action-btn cancel" onClick={clearSelection}>
                  Annuler
                </button>
              )}
              <button
                className={`action-btn validate ${isReady() ? 'ready' : ''}`}
                onClick={handleSubmit}
                disabled={!isReady()}
              >
                Valider
              </button>
            </div>
          </div>

          {/* COLONNE DROITE - Résultats complets */}
          <div className="dashboard-panel results-panel">
            {/* CLASSEMENT DU MODE */}
            <div className="panel-header">
              <span className="panel-title">Classement {modeName}</span>
              {matches.length > 0 && (
                <button className="edit-results-btn" onClick={handleUndo} title="Annuler le dernier match">
                  <Icon name="undo" size={16} />
                </button>
              )}
            </div>
            <div style={{ marginBottom: '12px' }}>
              {mainPlayers
                .map(id => ({ id, ...playerStats[id], player: getPlayer(id) }))
                .sort((a, b) => b.wins - a.wins)
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
                      {p.wins * config.win}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                      ({p.wins}W/{p.matches})
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
              <div className="recent-list" style={{ maxHeight: '100px' }}>
                {recentMatches.map((match) => (
                  <div key={match.id} style={{
                    padding: '6px 8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '4px',
                    marginBottom: '4px',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ color: 'var(--yellow-selected)' }}><Icon name="trophy" size={16} /></span>
                    {match.winners?.map(p => (
                      <span key={p} style={{ color: getPlayer(p)?.color }}>
                        {getPlayer(p)?.name}
                      </span>
                    ))}
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>vs</span>
                    {match.losers?.map(p => (
                      <span key={p} style={{ color: getPlayer(p)?.color, opacity: 0.6 }}>
                        {getPlayer(p)?.name}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-mini">Aucune partie</div>
            )}

            {/* SYSTÈME DE POINTS */}
            <div className="panel-header" style={{ marginTop: '10px' }}>
              <span className="panel-title">Points</span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '6px',
              textAlign: 'center'
            }}>
              <div style={{
                padding: '8px',
                background: 'rgba(255, 200, 0, 0.2)',
                borderRadius: '4px',
                border: '1px solid rgba(255, 200, 0, 0.4)'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Victoire</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--yellow-selected)' }}>
                  +{config.win}
                </div>
              </div>
              <div style={{
                padding: '8px',
                background: 'rgba(100, 100, 100, 0.2)',
                borderRadius: '4px',
                border: '1px solid rgba(100, 100, 100, 0.4)'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Défaite</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                  +{config.lose}
                </div>
              </div>
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
        pageKey={`team_${mode}`}
        defaultLayout={DEFAULT_LAYOUT}
        controls={LAYOUT_CONTROLS}
        onLayoutChange={setLayout}
      />

    </div>
  );
};

export default Team;
