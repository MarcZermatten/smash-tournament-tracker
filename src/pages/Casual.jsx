import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMainPlayers, getPlayer } from '../data/players';
import { addMatch, getMatchesByType, undoLastMatch, getPointsConfig } from '../data/storage';
import { useAudio } from '../context/AudioContext';
import LayoutEditor from '../components/LayoutEditor';
import AudioControls from '../components/AudioControls';

// Configuration par défaut du layout Casual
const DEFAULT_LAYOUT = {
  frameTop: 13,
  frameScale: 96,
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

// Points par défaut pour le mode Casual 2v3
const DEFAULT_POINTS = {
  protectors_win: 3,   // Points pour les protecteurs si le VIP survit
  vip_win: 2,          // Points pour le VIP s'il survit
  hunters_win: 3,      // Points pour les chasseurs s'ils tuent le VIP
  vip_lose: 0,         // Points pour le VIP s'il meurt
};

const CASUAL_VIP_KEY = 'smash_casual_vip';

const Casual = () => {
  const [players, setPlayers] = useState([]);
  const [vip, setVip] = useState(null);           // Le joueur à protéger (persistant)
  const [protectors, setProtectors] = useState([]); // Les 2 protecteurs
  const [hunters, setHunters] = useState([]);      // Les 2 chasseurs
  const [friendlyFire, setFriendlyFire] = useState(true);
  const [winner, setWinner] = useState(null);      // 'protectors' ou 'hunters'
  const [lastMatch, setLastMatch] = useState(null);
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [POINTS, setPOINTS] = useState(DEFAULT_POINTS);
  const [vipLocked, setVipLocked] = useState(false); // Le noob est-il verrouillé ?
  const { playSound } = useAudio();

  // Charger la config des points depuis les settings
  useEffect(() => {
    const loadPoints = () => {
      const config = getPointsConfig();
      if (config.casual) {
        setPOINTS({
          vip_win: config.casual.vip_win ?? DEFAULT_POINTS.vip_win,
          vip_lose: config.casual.vip_lose ?? DEFAULT_POINTS.vip_lose,
          protectors_win: config.casual.protectors_win ?? DEFAULT_POINTS.protectors_win,
          hunters_win: config.casual.hunters_win ?? DEFAULT_POINTS.hunters_win,
        });
      }
    };
    loadPoints();
    window.addEventListener('settingsUpdate', loadPoints);
    return () => window.removeEventListener('settingsUpdate', loadPoints);
  }, []);

  // Charger le noob persistant au démarrage
  useEffect(() => {
    const savedVip = localStorage.getItem(CASUAL_VIP_KEY);
    if (savedVip) {
      setVip(savedVip);
      setVipLocked(true);
    }
  }, []);

  useEffect(() => {
    setPlayers(getMainPlayers());
    const handleUpdate = () => setPlayers(getMainPlayers());
    window.addEventListener('playersUpdate', handleUpdate);
    return () => window.removeEventListener('playersUpdate', handleUpdate);
  }, []);

  const matches = getMatchesByType('casual');

  // Calculer les rotations possibles quand le VIP est sélectionné
  const getRotations = () => {
    if (!vip) return [];
    const otherPlayers = players.filter(p => p !== vip);
    if (otherPlayers.length < 4) return [];

    const rotations = [];
    // Générer toutes les combinaisons de 2 protecteurs parmi les 4 autres joueurs
    for (let i = 0; i < otherPlayers.length; i++) {
      for (let j = i + 1; j < otherPlayers.length; j++) {
        const prots = [otherPlayers[i], otherPlayers[j]];
        const hunts = otherPlayers.filter(p => !prots.includes(p));
        rotations.push({ protectors: prots, hunters: hunts });
      }
    }
    return rotations;
  };

  const rotations = getRotations();

  // Vérifier si une rotation a déjà été jouée (pour un mode FF spécifique)
  const isRotationPlayed = (rotation, ff) => {
    return matches.some(m =>
      m.vip === vip &&
      m.friendlyFire === ff &&
      m.protectors.length === 2 &&
      m.protectors.includes(rotation.protectors[0]) &&
      m.protectors.includes(rotation.protectors[1])
    );
  };

  // Compter les rotations restantes par mode FF
  const countRemainingRotations = (ff) => {
    return rotations.filter(r => !isRotationPlayed(r, ff)).length;
  };

  // Sélectionner une rotation (auto-remplir protecteurs et chasseurs)
  const selectRotation = (rotation) => {
    setProtectors(rotation.protectors);
    setHunters(rotation.hunters);
    playSound('select');
  };

  // Reset la sélection (garde le noob si verrouillé)
  const resetSelection = (keepVip = true) => {
    if (!keepVip) {
      setVip(null);
      setVipLocked(false);
      localStorage.removeItem(CASUAL_VIP_KEY);
    }
    setProtectors([]);
    setHunters([]);
    setWinner(null);
    playSound('cancel');
  };

  // Changer de noob (déverrouiller)
  const changeVip = () => {
    setVip(null);
    setVipLocked(false);
    localStorage.removeItem(CASUAL_VIP_KEY);
    setProtectors([]);
    setHunters([]);
    setWinner(null);
    playSound('cancel');
  };

  // Sélectionner le VIP (et le verrouiller)
  const selectVip = (playerId) => {
    if (vipLocked) return; // Ne pas changer si verrouillé

    if (vip === playerId) {
      setVip(null);
      localStorage.removeItem(CASUAL_VIP_KEY);
    } else {
      setVip(playerId);
      // Persister et verrouiller le noob
      localStorage.setItem(CASUAL_VIP_KEY, playerId);
      setVipLocked(true);
      // Retirer des autres rôles si présent
      setProtectors(prev => prev.filter(p => p !== playerId));
      setHunters(prev => prev.filter(p => p !== playerId));
    }
    playSound('select');
  };

  // Ajouter/retirer un protecteur
  const toggleProtector = (playerId) => {
    if (playerId === vip) return;
    if (protectors.includes(playerId)) {
      setProtectors(prev => prev.filter(p => p !== playerId));
    } else if (protectors.length < 2) {
      setProtectors(prev => [...prev, playerId]);
      setHunters(prev => prev.filter(p => p !== playerId));
    }
    playSound('select');
  };

  // Ajouter/retirer un chasseur
  const toggleHunter = (playerId) => {
    if (playerId === vip) return;
    if (hunters.includes(playerId)) {
      setHunters(prev => prev.filter(p => p !== playerId));
    } else if (hunters.length < 2) {
      setHunters(prev => [...prev, playerId]);
      setProtectors(prev => prev.filter(p => p !== playerId));
    }
    playSound('select');
  };

  // Vérifier si la config est complète
  const isConfigComplete = vip && protectors.length === 2 && hunters.length === 2;

  // Sélectionner le gagnant
  const selectWinner = (team) => {
    setWinner(team);
    playSound('select');
  };

  // Valider le match
  const handleSubmit = useCallback(() => {
    if (!isConfigComplete || !winner) return;
    playSound('confirm');

    const results = [];

    if (winner === 'protectors') {
      // L'équipe de protection gagne
      results.push({ player: vip, points: POINTS.vip_win, role: 'vip', win: true });
      protectors.forEach(p => results.push({ player: p, points: POINTS.protectors_win, role: 'protector', win: true }));
      hunters.forEach(p => results.push({ player: p, points: 0, role: 'hunter', win: false }));
    } else {
      // Les chasseurs gagnent
      results.push({ player: vip, points: POINTS.vip_lose, role: 'vip', win: false });
      protectors.forEach(p => results.push({ player: p, points: 0, role: 'protector', win: false }));
      hunters.forEach(p => results.push({ player: p, points: POINTS.hunters_win, role: 'hunter', win: true }));
    }

    const match = addMatch({
      type: 'casual',
      subtype: '2v3',
      vip,
      protectors,
      hunters,
      winner,
      friendlyFire,
      results,
    });

    setLastMatch(match);
    resetSelection();
    window.dispatchEvent(new Event('scoreUpdate'));
  }, [vip, protectors, hunters, winner, friendlyFire, isConfigComplete, playSound, POINTS]);

  // Annuler le dernier match
  const handleUndo = () => {
    const undone = undoLastMatch();
    if (undone) {
      playSound('cancel');
      setLastMatch(null);
      window.dispatchEvent(new Event('scoreUpdate'));
    }
  };

  // Stats par joueur
  const playerStats = players.reduce((acc, playerId) => {
    const playerMatches = matches.filter(m =>
      m.results?.some(r => r.player === playerId)
    );
    const wins = playerMatches.filter(m =>
      m.results?.find(r => r.player === playerId)?.win
    ).length;
    const vipCount = playerMatches.filter(m => m.vip === playerId).length;
    const totalPoints = playerMatches.reduce((sum, m) => {
      const result = m.results?.find(r => r.player === playerId);
      return sum + (result?.points || 0);
    }, 0);

    acc[playerId] = { matches: playerMatches.length, wins, vipCount, totalPoints };
    return acc;
  }, {});

  // Styles dynamiques
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

  // Joueurs disponibles (pas encore assignés)
  const availablePlayers = players.filter(p =>
    p !== vip && !protectors.includes(p) && !hunters.includes(p)
  );

  return (
    <div className="home-page">
      <div className="melee-main-frame dashboard-frame" style={dynamicStyles.frame}>
        {/* Header */}
        <div className="subpage-header" style={dynamicStyles.header}>
          <div className="subpage-logo-container" style={dynamicStyles.logoContainer}>
            <img src="/logo.png" alt="BFSA" className="subpage-logo" style={dynamicStyles.logo} />
            <div className="subpage-logo-glow"></div>
          </div>
          <div className="subpage-title" style={dynamicStyles.title}>
            <h1>CASUAL</h1>
            <span className="mode-subtitle">2v3 - Protège le Noob</span>
          </div>
        </div>

        {/* Config FF */}
        <div className="ff-toggle">
          <button
            className={`ff-btn ${friendlyFire ? 'active' : ''}`}
            onClick={() => setFriendlyFire(true)}
          >
            🔥 FF ON
          </button>
          <button
            className={`ff-btn ${!friendlyFire ? 'active' : ''}`}
            onClick={() => setFriendlyFire(false)}
          >
            🛡️ FF OFF
          </button>
        </div>

        {/* Dashboard */}
        <div className="casual-dashboard">
          {/* Colonne gauche - Sélection VIP et Rotations */}
          <div className="casual-panel">
            {/* Section Noob */}
            {!vipLocked ? (
              <>
                <div className="panel-header">
                  <span className="panel-title">👶 Choisir le Noob</span>
                </div>
                <div className="player-list">
                  {players.map(playerId => {
                    const player = getPlayer(playerId);
                    const isVip = vip === playerId;
                    const stats = playerStats[playerId];

                    return (
                      <button
                        key={playerId}
                        className={`player-btn ${isVip ? 'vip' : ''}`}
                        onClick={() => selectVip(playerId)}
                      >
                        <div className="player-avatar" style={{ background: player?.color }}>
                          {player?.initial}
                        </div>
                        <span className="player-name">{player?.name}</span>
                        <span className="player-stats">{stats?.totalPoints || 0}pts</span>
                        {isVip && <span className="role-badge vip">👶</span>}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                {/* Noob verrouillé - afficher uniquement les rotations */}
                <div className="vip-locked-header">
                  <div className="vip-locked-info">
                    <span className="vip-locked-label">NOOB</span>
                    <span className="vip-locked-name" style={{ color: getPlayer(vip)?.color }}>
                      {getPlayer(vip)?.name}
                    </span>
                  </div>
                  <button className="change-vip-btn" onClick={changeVip}>
                    Changer
                  </button>
                </div>

                {/* Rotations FF ON */}
                <div className="rotations-section">
                  <div className="panel-header ff-on">
                    <span className="panel-title">🔥 FF ON</span>
                    <span className="panel-badge">
                      {countRemainingRotations(true)}/{rotations.length}
                    </span>
                  </div>
                  <div className="rotations-list">
                    {rotations.map((rotation, idx) => {
                      const played = isRotationPlayed(rotation, true);
                      const isCurrentSelection =
                        friendlyFire &&
                        protectors.includes(rotation.protectors[0]) &&
                        protectors.includes(rotation.protectors[1]);

                      return (
                        <button
                          key={`on-${idx}`}
                          className={`rotation-btn ${played ? 'played' : ''} ${isCurrentSelection ? 'selected' : ''}`}
                          onClick={() => {
                            if (!played) {
                              setFriendlyFire(true);
                              selectRotation(rotation);
                            }
                          }}
                          disabled={played}
                        >
                          <span className="rot-team prot">
                            🛡️ {getPlayer(rotation.protectors[0])?.name?.substring(0, 3)}-{getPlayer(rotation.protectors[1])?.name?.substring(0, 3)}
                          </span>
                          <span className="rot-vs">vs</span>
                          <span className="rot-team hunt">
                            ⚔️ {getPlayer(rotation.hunters[0])?.name?.substring(0, 3)}-{getPlayer(rotation.hunters[1])?.name?.substring(0, 3)}
                          </span>
                          {played && <span className="rot-done">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rotations FF OFF */}
                <div className="rotations-section">
                  <div className="panel-header ff-off">
                    <span className="panel-title">🛡️ FF OFF</span>
                    <span className="panel-badge">
                      {countRemainingRotations(false)}/{rotations.length}
                    </span>
                  </div>
                  <div className="rotations-list">
                    {rotations.map((rotation, idx) => {
                      const played = isRotationPlayed(rotation, false);
                      const isCurrentSelection =
                        !friendlyFire &&
                        protectors.includes(rotation.protectors[0]) &&
                        protectors.includes(rotation.protectors[1]);

                      return (
                        <button
                          key={`off-${idx}`}
                          className={`rotation-btn ${played ? 'played' : ''} ${isCurrentSelection ? 'selected' : ''}`}
                          onClick={() => {
                            if (!played) {
                              setFriendlyFire(false);
                              selectRotation(rotation);
                            }
                          }}
                          disabled={played}
                        >
                          <span className="rot-team prot">
                            🛡️ {getPlayer(rotation.protectors[0])?.name?.substring(0, 3)}-{getPlayer(rotation.protectors[1])?.name?.substring(0, 3)}
                          </span>
                          <span className="rot-vs">vs</span>
                          <span className="rot-team hunt">
                            ⚔️ {getPlayer(rotation.hunters[0])?.name?.substring(0, 3)}-{getPlayer(rotation.hunters[1])?.name?.substring(0, 3)}
                          </span>
                          {played && <span className="rot-done">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Colonne centrale - Configuration des équipes */}
          <div className="casual-panel teams-panel">
            <div className="team-section">
              <div className="team-header protectors">
                <span>🛡️ PROTECTEURS (2)</span>
                <span className="team-count">{protectors.length}/2</span>
              </div>
              {vip && (
                <div className="vip-card">
                  <div className="vip-avatar" style={{ background: getPlayer(vip)?.color }}>
                    {getPlayer(vip)?.initial}
                  </div>
                  <div className="vip-info">
                    <span className="vip-label">À PROTÉGER</span>
                    <span className="vip-name" style={{ color: getPlayer(vip)?.color }}>
                      {getPlayer(vip)?.name}
                    </span>
                  </div>
                  <span className="vip-icon">👶</span>
                </div>
              )}
              <div className="team-slots">
                {[0, 1].map(idx => {
                  const playerId = protectors[idx];
                  const player = playerId ? getPlayer(playerId) : null;
                  return (
                    <div key={idx} className={`team-slot ${player ? 'filled' : ''}`}>
                      {player ? (
                        <>
                          <div className="slot-avatar" style={{ background: player.color }}>
                            {player.initial}
                          </div>
                          <span style={{ color: player.color }}>{player.name}</span>
                          <button className="remove-btn" onClick={() => toggleProtector(playerId)}>×</button>
                        </>
                      ) : (
                        <span className="slot-empty">Sélectionner...</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="available-players">
                {availablePlayers.map(playerId => {
                  const player = getPlayer(playerId);
                  return (
                    <button
                      key={playerId}
                      className="mini-player-btn"
                      onClick={() => toggleProtector(playerId)}
                      disabled={protectors.length >= 2}
                    >
                      <span style={{ color: player?.color }}>{player?.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="vs-separator">VS</div>

            <div className="team-section">
              <div className="team-header hunters">
                <span>⚔️ CHASSEURS (2)</span>
                <span className="team-count">{hunters.length}/2</span>
              </div>
              <div className="team-slots">
                {[0, 1].map(idx => {
                  const playerId = hunters[idx];
                  const player = playerId ? getPlayer(playerId) : null;
                  return (
                    <div key={idx} className={`team-slot ${player ? 'filled' : ''}`}>
                      {player ? (
                        <>
                          <div className="slot-avatar" style={{ background: player.color }}>
                            {player.initial}
                          </div>
                          <span style={{ color: player.color }}>{player.name}</span>
                          <button className="remove-btn" onClick={() => toggleHunter(playerId)}>×</button>
                        </>
                      ) : (
                        <span className="slot-empty">Sélectionner...</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="available-players">
                {availablePlayers.map(playerId => {
                  const player = getPlayer(playerId);
                  return (
                    <button
                      key={playerId}
                      className="mini-player-btn hunters"
                      onClick={() => toggleHunter(playerId)}
                      disabled={hunters.length >= 2}
                    >
                      <span style={{ color: player?.color }}>{player?.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Colonne droite - Résultat */}
          <div className="casual-panel result-panel">
            {lastMatch && (
              <div className="last-match-alert">
                <span className="alert-text">
                  {lastMatch.winner === 'protectors' ? '🛡️ Protecteurs' : '⚔️ Chasseurs'} gagnent !
                </span>
                <button className="undo-btn" onClick={handleUndo}>Annuler</button>
              </div>
            )}

            <div className="panel-header">
              <span className="panel-title">🏆 Qui a gagné ?</span>
            </div>

            {isConfigComplete ? (
              <div className="winner-selection">
                <button
                  className={`winner-btn protectors ${winner === 'protectors' ? 'selected' : ''}`}
                  onClick={() => selectWinner('protectors')}
                >
                  <span className="winner-icon">🛡️</span>
                  <span className="winner-label">Protecteurs</span>
                  <span className="winner-desc">Le noob survit</span>
                  <span className="winner-points">+{POINTS.protectors_win}pts / VIP +{POINTS.vip_win}pts</span>
                </button>

                <button
                  className={`winner-btn hunters ${winner === 'hunters' ? 'selected' : ''}`}
                  onClick={() => selectWinner('hunters')}
                >
                  <span className="winner-icon">⚔️</span>
                  <span className="winner-label">Chasseurs</span>
                  <span className="winner-desc">Le noob est mort</span>
                  <span className="winner-points">+{POINTS.hunters_win}pts chacun</span>
                </button>
              </div>
            ) : (
              <div className="config-hint">
                <p>Configure les équipes :</p>
                <ul>
                  <li className={vip ? 'done' : ''}>1 Noob à protéger {vip && '✓'}</li>
                  <li className={protectors.length === 2 ? 'done' : ''}>2 Protecteurs {protectors.length === 2 && '✓'}</li>
                  <li className={hunters.length === 2 ? 'done' : ''}>2 Chasseurs {hunters.length === 2 && '✓'}</li>
                </ul>
              </div>
            )}

            <div className="action-buttons">
              <button className="action-btn cancel" onClick={resetSelection}>
                Reset
              </button>
              <button
                className={`action-btn validate ${isConfigComplete && winner ? 'ready' : ''}`}
                onClick={handleSubmit}
                disabled={!isConfigComplete || !winner}
              >
                Valider
              </button>
            </div>

            {/* Stats */}
            <div className="panel-header" style={{ marginTop: '1rem' }}>
              <span className="panel-title">📊 Stats</span>
              <span className="panel-badge">{matches.length} matchs</span>
            </div>
            <div className="stats-hint">
              Protecteurs: +{POINTS.protectors_win}pts si victoire<br/>
              VIP (noob): +{POINTS.vip_win}pts si survie<br/>
              Chasseurs: +{POINTS.hunters_win}pts si kill
            </div>

            {/* Historique des matchs */}
            {matches.length > 0 && (
              <div className="match-history">
                <div className="panel-header" style={{ marginTop: '1rem' }}>
                  <span className="panel-title">📜 Historique</span>
                </div>
                <div className="history-list">
                  {matches.slice(-5).reverse().map((match, idx) => {
                    const vipPlayer = getPlayer(match.vip);
                    return (
                      <div key={match.id || idx} className={`history-item ${match.winner}`}>
                        <span className="history-vip" style={{ color: vipPlayer?.color }}>
                          {vipPlayer?.name}
                        </span>
                        <span className="history-result">
                          {match.winner === 'protectors' ? '🛡️ Survit' : '⚔️ Mort'}
                        </span>
                        <span className="history-ff">
                          {match.friendlyFire ? 'FF' : 'NoFF'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <Link to="/" className="back-btn">
        ← Menu
      </Link>

      <LayoutEditor
        pageKey="casual"
        defaultLayout={DEFAULT_LAYOUT}
        controls={LAYOUT_CONTROLS}
        onLayoutChange={setLayout}
      />

      <AudioControls />

      <style>{`
        .ff-toggle {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .ff-btn {
          padding: 8px 20px;
          background: rgba(20, 40, 80, 0.5);
          border: 2px solid rgba(100, 150, 200, 0.3);
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.6);
          font-family: 'Oswald', sans-serif;
          cursor: pointer;
          transition: all 0.15s;
        }

        .ff-btn.active {
          background: rgba(100, 80, 30, 0.4);
          border-color: var(--yellow-selected);
          color: var(--yellow-selected);
        }

        .casual-dashboard {
          display: grid;
          grid-template-columns: 280px 1fr 250px;
          gap: 15px;
          min-height: 400px;
        }

        .casual-panel {
          background: rgba(6, 18, 35, 0.7);
          border: 2px solid rgba(100, 150, 200, 0.2);
          border-radius: 8px;
          padding: 15px;
          display: flex;
          flex-direction: column;
        }

        .player-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          overflow-y: auto;
          max-height: 350px;
        }

        .player-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid rgba(100, 150, 200, 0.2);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .player-btn:hover {
          border-color: var(--cyan-light);
        }

        .player-btn.vip {
          background: rgba(255, 200, 0, 0.15);
          border-color: var(--yellow-selected);
        }

        .player-btn.protector {
          background: rgba(0, 150, 100, 0.15);
          border-color: #00cc88;
        }

        .player-btn.hunter {
          background: rgba(200, 50, 50, 0.15);
          border-color: #cc4444;
        }

        .player-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0a0a1a;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .player-name {
          flex: 1;
          font-family: 'Oswald', sans-serif;
          color: white;
          text-align: left;
        }

        .player-stats {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .role-badge {
          font-size: 1rem;
        }

        .teams-panel {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .team-section {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .team-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-radius: 6px;
          font-family: 'Oswald', sans-serif;
          margin-bottom: 10px;
        }

        .team-header.protectors {
          background: rgba(0, 150, 100, 0.2);
          border: 1px solid #00cc88;
          color: #00ff99;
        }

        .team-header.hunters {
          background: rgba(200, 50, 50, 0.2);
          border: 1px solid #cc4444;
          color: #ff6666;
        }

        .team-count {
          opacity: 0.7;
        }

        .vip-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 15px;
          background: linear-gradient(180deg, rgba(255, 200, 0, 0.2) 0%, rgba(255, 180, 0, 0.1) 100%);
          border: 2px solid var(--yellow-selected);
          border-radius: 8px;
          margin-bottom: 10px;
        }

        .vip-avatar {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0a0a1a;
          font-weight: 700;
          font-size: 1.1rem;
          box-shadow: 0 0 15px rgba(255, 200, 0, 0.4);
        }

        .vip-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .vip-label {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
        }

        .vip-name {
          font-family: 'Oswald', sans-serif;
          font-size: 1.2rem;
        }

        .vip-icon {
          font-size: 1.5rem;
        }

        .team-slots {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }

        .team-slot {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 2px dashed rgba(100, 150, 200, 0.3);
          border-radius: 6px;
          min-height: 50px;
        }

        .team-slot.filled {
          border-style: solid;
          border-color: var(--cyan);
        }

        .slot-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0a0a1a;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .slot-empty {
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.85rem;
        }

        .remove-btn {
          margin-left: auto;
          width: 24px;
          height: 24px;
          border: none;
          background: rgba(255, 100, 100, 0.3);
          border-radius: 50%;
          color: #ff6666;
          cursor: pointer;
          font-size: 1rem;
        }

        .available-players {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .mini-player-btn {
          padding: 6px 12px;
          background: rgba(0, 100, 150, 0.3);
          border: 1px solid var(--cyan);
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.15s;
        }

        .mini-player-btn:hover:not(:disabled) {
          background: rgba(0, 150, 200, 0.4);
        }

        .mini-player-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .mini-player-btn.hunters {
          background: rgba(150, 50, 50, 0.3);
          border-color: #cc4444;
        }

        .mini-player-btn.hunters:hover:not(:disabled) {
          background: rgba(200, 50, 50, 0.4);
        }

        .vs-separator {
          text-align: center;
          font-family: 'Oswald', sans-serif;
          font-size: 1.5rem;
          color: var(--yellow-selected);
          padding: 10px 0;
        }

        .result-panel {
          display: flex;
          flex-direction: column;
        }

        .winner-selection {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 15px;
        }

        .winner-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 15px;
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid rgba(100, 150, 200, 0.3);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .winner-btn:hover {
          border-color: var(--cyan-light);
        }

        .winner-btn.selected {
          border-color: var(--yellow-selected);
          background: rgba(100, 80, 30, 0.4);
        }

        .winner-btn.protectors.selected {
          border-color: #00cc88;
          background: rgba(0, 150, 100, 0.3);
        }

        .winner-btn.hunters.selected {
          border-color: #cc4444;
          background: rgba(200, 50, 50, 0.3);
        }

        .winner-icon {
          font-size: 2rem;
          margin-bottom: 5px;
        }

        .winner-label {
          font-family: 'Oswald', sans-serif;
          font-size: 1.1rem;
          color: white;
        }

        .winner-desc {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .winner-points {
          font-size: 0.75rem;
          color: var(--yellow-selected);
          margin-top: 5px;
        }

        .config-hint {
          padding: 20px;
          text-align: center;
          color: var(--cyan-light);
        }

        .config-hint ul {
          list-style: none;
          padding: 0;
          margin: 10px 0 0 0;
          text-align: left;
        }

        .config-hint li {
          padding: 5px 0;
          color: rgba(255, 255, 255, 0.5);
        }

        .config-hint li.done {
          color: #00cc88;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
          margin-top: auto;
        }

        .action-btn {
          flex: 1;
          padding: 12px;
          border: 2px solid;
          border-radius: 6px;
          font-family: 'Oswald', sans-serif;
          cursor: pointer;
          transition: all 0.15s;
        }

        .action-btn.cancel {
          background: transparent;
          border-color: rgba(255, 100, 100, 0.5);
          color: #ff9999;
        }

        .action-btn.validate {
          background: rgba(100, 100, 100, 0.3);
          border-color: rgba(100, 150, 200, 0.3);
          color: rgba(255, 255, 255, 0.4);
        }

        .action-btn.validate.ready {
          background: linear-gradient(180deg, #ffe840 0%, #d0a800 100%);
          border-color: var(--yellow-selected);
          color: #181008;
        }

        .action-btn.validate:disabled {
          cursor: not-allowed;
        }

        .stats-hint {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.6;
        }

        .last-match-alert {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: rgba(0, 150, 100, 0.2);
          border: 1px solid #00cc88;
          border-radius: 6px;
          margin-bottom: 15px;
        }

        .alert-text {
          color: #00ff99;
          font-family: 'Oswald', sans-serif;
        }

        .undo-btn {
          padding: 4px 10px;
          background: rgba(255, 100, 100, 0.2);
          border: 1px solid #ff6666;
          border-radius: 4px;
          color: #ff9999;
          cursor: pointer;
          font-size: 0.8rem;
        }

        /* Rotations */
        .rotations-section {
          margin-top: 10px;
        }

        .rotations-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 180px;
          overflow-y: auto;
        }

        .rotation-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 8px 10px;
          background: rgba(20, 40, 80, 0.5);
          border: 2px solid rgba(100, 150, 200, 0.3);
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.15s;
        }

        .rotation-btn:hover:not(:disabled) {
          border-color: var(--cyan);
          background: rgba(30, 60, 100, 0.6);
        }

        .rotation-btn.selected {
          border-color: var(--yellow-selected);
          background: rgba(100, 80, 30, 0.5);
        }

        .rotation-btn.played {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .rot-team {
          font-family: 'Oswald', sans-serif;
        }

        .rot-team.prot {
          color: #00cc88;
        }

        .rot-team.hunt {
          color: #ff6666;
        }

        .rot-vs {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.7rem;
        }

        .rot-done {
          color: #00ff88;
          font-weight: bold;
        }

        /* Historique des matchs */
        .match-history {
          margin-top: 10px;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 150px;
          overflow-y: auto;
        }

        .history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 10px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 4px;
          font-size: 0.8rem;
          border-left: 3px solid;
        }

        .history-item.protectors {
          border-color: #00cc88;
        }

        .history-item.hunters {
          border-color: #cc4444;
        }

        .history-vip {
          font-family: 'Oswald', sans-serif;
          flex: 1;
        }

        .history-result {
          font-size: 0.75rem;
        }

        .history-ff {
          font-size: 0.65rem;
          padding: 2px 5px;
          background: rgba(100, 100, 100, 0.3);
          border-radius: 3px;
          color: rgba(255, 255, 255, 0.6);
          margin-left: 8px;
        }

        /* VIP Verrouillé */
        .vip-locked-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: linear-gradient(180deg, rgba(255, 200, 0, 0.2) 0%, rgba(255, 180, 0, 0.1) 100%);
          border: 2px solid var(--yellow-selected);
          border-radius: 8px;
          margin-bottom: 15px;
        }

        .vip-locked-info {
          display: flex;
          flex-direction: column;
        }

        .vip-locked-label {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
        }

        .vip-locked-name {
          font-family: 'Oswald', sans-serif;
          font-size: 1.3rem;
        }

        .change-vip-btn {
          padding: 6px 12px;
          background: rgba(255, 100, 100, 0.2);
          border: 1px solid #ff6666;
          border-radius: 4px;
          color: #ff9999;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.15s;
        }

        .change-vip-btn:hover {
          background: rgba(255, 100, 100, 0.4);
        }

        /* Panel headers FF */
        .panel-header.ff-on {
          background: rgba(255, 100, 50, 0.15);
          border: 1px solid #ff6633;
          border-radius: 4px;
          padding: 6px 10px;
          margin-bottom: 8px;
        }

        .panel-header.ff-on .panel-title {
          color: #ff9966;
        }

        .panel-header.ff-off {
          background: rgba(0, 150, 200, 0.15);
          border: 1px solid #0099cc;
          border-radius: 4px;
          padding: 6px 10px;
          margin-bottom: 8px;
        }

        .panel-header.ff-off .panel-title {
          color: #66ccff;
        }

        .rotations-list {
          max-height: 120px;
        }
      `}</style>
    </div>
  );
};

export default Casual;
