import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAudio } from '../context/AudioContext';
import Icon from '../components/Icon';
import { useTournament } from '../context/TournamentContext';
import { useModal } from '../components/Modal';
import { getMatchesByType } from '../data/storage';
import { getPlayer, getMainPlayers } from '../data/players';
import LayoutEditor from '../components/LayoutEditor';
import { playMenuSelectSound } from '../utils/sounds';

// Configuration par défaut du layout Home
const DEFAULT_LAYOUT = {
  frameTop: 17,
  frameScale: 121,
  logoSize: 336,
  logoMarginTop: -60,
  menuMarginLeft: 135,
  menuMarginTop: -34,
  btnTournamentX: -106,
  btnTournamentY: 21,
  panelPreviewX: -110,
  panelPreviewY: -40,
  menuGap: 2,
};

const LAYOUT_CONTROLS = [
  { key: 'frameTop', label: 'Position Y', min: -20, max: 50, unit: 'vh', group: 'Cadre' },
  { key: 'frameScale', label: 'Échelle', min: 50, max: 150, unit: '%', group: 'Cadre' },
  { key: 'menuGap', label: 'Gap menu', min: 0.5, max: 8, step: 0.1, unit: 'rem', group: 'Cadre' },
  { key: 'logoSize', label: 'Taille', min: 100, max: 500, unit: 'px', group: 'Logo' },
  { key: 'logoMarginTop', label: 'Margin-top', min: -200, max: 100, unit: 'px', group: 'Logo' },
  { key: 'menuMarginLeft', label: 'Décalage X', min: -200, max: 200, unit: 'px', group: 'Menu' },
  { key: 'menuMarginTop', label: 'Décalage Y', min: -100, max: 100, unit: 'px', group: 'Menu' },
  { key: 'btnTournamentX', label: 'Position X', min: -200, max: 200, unit: 'px', group: 'Bouton Tournoi' },
  { key: 'btnTournamentY', label: 'Position Y', min: -200, max: 200, unit: 'px', group: 'Bouton Tournoi' },
  { key: 'panelPreviewX', label: 'Position X', min: -200, max: 200, unit: 'px', group: 'Panel Preview' },
  { key: 'panelPreviewY', label: 'Position Y', min: -200, max: 200, unit: 'px', group: 'Panel Preview' },
];

const Home = () => {
  const { playSound, toggleSound, toggleMusic, soundEnabled, musicEnabled } = useAudio();
  const { showConfirm } = useModal();
  const { tournament, isActive, endTournament } = useTournament();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);

  const menuItems = [
    {
      to: '/ffa',
      label: 'FFA',
      description: 'Free For All - 4 joueurs!',
      subItems: ['Nouveau match', 'Historique', 'Règles']
    },
    {
      to: '/1v1',
      label: '1v1',
      description: 'Matchs en tête-à-tête avec rotation!',
      subItems: ['Nouveau duel', 'Rotation', 'Historique']
    },
    {
      to: '/team-ff',
      label: '2v2 FF',
      description: 'Équipes avec Friendly Fire!',
      subItems: ['Nouveau match', 'Rotation équipes', 'Scores']
    },
    {
      to: '/team-noff',
      label: '2v2 Team',
      description: 'Équipes sans Friendly Fire!',
      subItems: ['Nouveau match', 'Rotation équipes', 'Scores']
    },
    {
      to: '/casual',
      label: 'Casual',
      description: 'Parties détente sans tournoi!',
      subItems: ['Match libre', 'Fun', 'Détente']
    },
    {
      to: '/players',
      label: 'Joueurs',
      description: 'Gérer les joueurs du tournoi!',
      subItems: ['Ajouter', 'Modifier', 'Avatars']
    },
    {
      to: '/leaderboard',
      label: 'Résultats',
      description: 'Classements et statistiques!',
      subItems: ['Général', 'Par mode', 'Records']
    },
    {
      to: '/wall-of-fame',
      label: 'Wall of Fame',
      description: 'Historique des tournois et légendes!',
      subItems: ['Légendes', 'Tournois', 'Records']
    },
    {
      to: '/options',
      label: 'Options',
      description: 'Configuration du tracker!',
      subItems: ['Points', 'Matchs', 'Données']
    },
  ];

  const handleMouseEnter = (index) => {
    setHoveredIndex(index);
    playSound('menuMove');
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const handleClick = () => {
    playMenuSelectSound();
  };

  const handleEndTournament = () => {
    playMenuSelectSound();
    showConfirm('Terminer le tournoi en cours ?', () => {
      endTournament();
      playSound('confirm');
    });
  };

  const activeItem = hoveredIndex !== null ? menuItems[hoveredIndex] : null;

  // Calculer les stats pour le mode survolé
  const getModeStats = (modePath) => {
    const modeMap = {
      '/1v1': '1v1',
      '/ffa': 'ffa',
      '/team-ff': 'team_ff',
      '/team-noff': 'team_noff',
      '/casual': 'casual'
    };

    const modeKey = modeMap[modePath];
    if (!modeKey) return null;

    const matches = getMatchesByType(modeKey);
    if (matches.length === 0) return null;

    const mainPlayers = getMainPlayers();
    const playerStats = {};

    // Calculer les stats par joueur pour ce mode
    mainPlayers.forEach(playerId => {
      playerStats[playerId] = { wins: 0, points: 0 };
    });

    matches.forEach(match => {
      if (modeKey === '1v1') {
        if (match.winner) playerStats[match.winner] = { ...playerStats[match.winner], wins: (playerStats[match.winner]?.wins || 0) + 1, points: (playerStats[match.winner]?.points || 0) + (match.winPoints || 0) };
        if (match.loser) playerStats[match.loser] = { ...playerStats[match.loser], points: (playerStats[match.loser]?.points || 0) + (match.losePoints || 0) };
      } else if (modeKey === 'ffa' || modeKey === 'casual') {
        match.results?.forEach(r => {
          if (playerStats[r.player]) {
            playerStats[r.player].points = (playerStats[r.player].points || 0) + (r.points || 0);
            if (r.position === 1) playerStats[r.player].wins = (playerStats[r.player].wins || 0) + 1;
          }
        });
      } else {
        // Team modes
        match.winners?.forEach(p => {
          if (playerStats[p]) {
            playerStats[p].wins = (playerStats[p].wins || 0) + 1;
            playerStats[p].points = (playerStats[p].points || 0) + (match.winPoints || 0);
          }
        });
        match.losers?.forEach(p => {
          if (playerStats[p]) {
            playerStats[p].points = (playerStats[p].points || 0) + (match.losePoints || 0);
          }
        });
      }
    });

    // Trier par points
    const sorted = Object.entries(playerStats)
      .filter(([_, s]) => s.points > 0 || s.wins > 0)
      .sort((a, b) => b[1].points - a[1].points)
      .slice(0, 4);

    return { matches: matches.length, players: sorted };
  };

  const modeStats = activeItem ? getModeStats(activeItem.to) : null;

  // Style dynamique basé sur les contrôles
  const dynamicFrameStyle = {
    transform: `scale(${layout.frameScale / 100})`,
    marginTop: `${layout.frameTop}vh`,
    transformOrigin: 'top center',
  };

  const dynamicLogoStyle = {
    height: `${layout.logoSize}px`,
    marginTop: `${layout.logoMarginTop}px`,
  };

  const dynamicMenuContainerStyle = {
    gap: `${layout.menuGap}rem`,
  };

  const dynamicMenuStyle = {
    marginLeft: `${layout.menuMarginLeft}px`,
    marginTop: `${layout.menuMarginTop}px`,
  };

  const dynamicBtnTournamentStyle = {
    transform: `translate(${layout.btnTournamentX}px, ${layout.btnTournamentY}px)`,
  };

  const dynamicPanelStyle = {
    transform: `translate(${layout.panelPreviewX}px, ${layout.panelPreviewY}px)`,
  };

  // Pas de dynamicSideColumnStyle car les éléments sont déplacés indépendamment

  return (
    <div className="home-page">
      {/* CADRE BLEU PRINCIPAL - Englobant tout le contenu style Melee */}
      <div className="melee-main-frame" style={dynamicFrameStyle}>
        {/* Header avec Logo BFSA Ultimate Legacy */}
        <div className="home-logo-section">
          <div className="home-logo-container">
            <img src="/logo.png" alt="BFSA Ultimate Legacy" className="home-logo" style={dynamicLogoStyle} />
            <div className="logo-glow"></div>
          </div>
        </div>

        {/* Container menu + panneau latéral */}
        <div className="menu-container" style={dynamicMenuContainerStyle}>
          {/* Menu principal */}
          <nav className="melee-main-menu" style={dynamicMenuStyle}>
            {menuItems.map((item, index) => (
              <Link
                key={item.to}
                to={item.to}
                className={`melee-menu-item ${index === hoveredIndex ? 'selected' : ''}`}
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
              >
                {/* Texte du bouton */}
                <span className="button-label">{item.label}</span>
                {/* Indicateur Logo Smash (visible seulement quand sélectionné) */}
                <span className="select-indicator" />
              </Link>
            ))}
          </nav>

          {/* Colonne droite : Bouton Tournoi + Panneau latéral */}
          <div className="side-column">
            {/* Bouton Nouveau Tournoi - au-dessus du panneau */}
            {isActive ? (
              <div className="tournament-status" style={dynamicBtnTournamentStyle}>
                <div className="tournament-active-badge">
                  <span className="status-dot"></span>
                  <span className="tournament-name">{tournament.name}</span>
                  <span className="tournament-meta">{tournament.players.length} joueurs</span>
                </div>
                <button className="end-tournament-btn" onClick={handleEndTournament}>
                  Terminer
                </button>
              </div>
            ) : (
              <Link to="/tournament" className="start-tournament-btn" onClick={handleClick} style={dynamicBtnTournamentStyle}>
                <span className="btn-icon smash-logo-icon"></span>
                <span className="btn-text">NOUVEAU TOURNOI</span>
              </Link>
            )}

            {/* Panneau latéral cyan - Preview */}
            <div className="side-panel" style={dynamicPanelStyle}>
              {activeItem && ['/1v1', '/ffa', '/team-ff', '/team-noff', '/casual'].includes(activeItem.to) ? (
                <>
                  {/* Titre du mode de combat */}
                  <div className="preview-title">{activeItem.label}</div>

                  {modeStats ? (
                    <>
                      <div className="preview-subtitle">{modeStats.matches} matchs joués</div>
                      <div className="preview-ranking">
                        {modeStats.players.map(([playerId, stats], index) => {
                          const player = getPlayer(playerId);
                          return (
                            <div key={playerId} className="preview-player">
                              <span className="preview-rank">{index + 1}</span>
                              <span className="preview-name" style={{ color: player?.color }}>{player?.name}</span>
                              <span className="preview-points">{stats.points}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="preview-empty">Résultats en attente</div>
                  )}
                </>
              ) : activeItem ? (
                <>
                  <div className="preview-title">{activeItem.label}</div>
                  <div className="preview-description">{activeItem.description}</div>
                </>
              ) : (
                <>
                  <div className="preview-title">BFSA</div>
                  <div className="preview-empty">Sélectionner un mode</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Barre de description - ENCASTRÉE dans le cadre */}
        <div className="description-bar">
          {activeItem ? activeItem.description : 'Survolez un mode de jeu'}
        </div>
      </div>

      {/* Contrôles audio */}
      <div className="audio-controls">
        <button
          className={`audio-btn ${!soundEnabled ? 'off' : ''}`}
          onClick={toggleSound}
          title={soundEnabled ? 'Désactiver les sons' : 'Activer les sons'}
        >
          {soundEnabled ? <Icon name="volumeOn" size={18} /> : <Icon name="volumeOff" size={18} />}
        </button>
        <button
          className={`audio-btn ${!musicEnabled ? 'off' : ''}`}
          onClick={toggleMusic}
          title={musicEnabled ? 'Désactiver la musique' : 'Activer la musique'}
        >
          {musicEnabled ? <Icon name="music" size={18} /> : <Icon name="musicOff" size={18} />}
        </button>
      </div>

      <style>{`
        /* Section Logo + Tournoi */
        .home-logo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 0;
          margin-bottom: 15px;
          z-index: 100;
        }

        .home-logo-container {
          position: relative;
          margin-bottom: 0;
        }

        .home-logo {
          height: 160px;
          width: auto;
          filter: drop-shadow(0 8px 30px rgba(0, 0, 0, 0.9))
                  drop-shadow(0 0 50px rgba(255, 200, 0, 0.4));
          animation: logoFloat 4s ease-in-out infinite;
        }

        .logo-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, rgba(255, 200, 0, 0.15) 0%, transparent 70%);
          border-radius: 50%;
          z-index: -1;
          animation: glowPulse 3s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes logoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
        }

        /* Bouton Nouveau Tournoi */
        .start-tournament-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 25px;
          background: linear-gradient(180deg, rgba(255, 200, 0, 0.15) 0%, rgba(180, 140, 0, 0.2) 100%);
          border: 2px solid rgba(255, 200, 0, 0.5);
          border-radius: 25px;
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .start-tournament-btn:hover {
          background: linear-gradient(180deg, rgba(255, 200, 0, 0.3) 0%, rgba(180, 140, 0, 0.35) 100%);
          border-color: var(--yellow-selected);
          transform: scale(1.05);
          box-shadow: 0 0 20px rgba(255, 200, 0, 0.3);
        }

        .start-tournament-btn .btn-icon {
          font-size: 1.2rem;
        }

        .start-tournament-btn .btn-icon.smash-logo-icon {
          display: inline-block;
          width: 24px;
          height: 24px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3CclipPath id='c-btn'%3E%3Ccircle cx='50' cy='50' r='50'/%3E%3C/clipPath%3E%3C/defs%3E%3Cg clip-path='url(%23c-btn)'%3E%3Crect x='0' y='0' width='30' height='62' fill='%23ffd800'/%3E%3Crect x='0' y='70' width='30' height='30' fill='%23ffd800'/%3E%3Crect x='48' y='0' width='52' height='62' fill='%23ffd800'/%3E%3Crect x='48' y='70' width='52' height='30' fill='%23ffd800'/%3E%3C/g%3E%3C/svg%3E");
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.6));
        }

        .start-tournament-btn .btn-text {
          font-family: 'Oswald', sans-serif;
          font-size: 1rem;
          font-weight: 500;
          color: var(--yellow-selected);
          letter-spacing: 0.05em;
        }

        /* Status Tournoi Actif */
        .tournament-status {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .tournament-active-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 18px;
          background: rgba(0, 180, 100, 0.15);
          border: 2px solid rgba(80, 255, 144, 0.4);
          border-radius: 20px;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          background: #50ff90;
          border-radius: 50%;
          animation: statusPulse 1.5s infinite;
        }

        @keyframes statusPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 5px #50ff90; }
          50% { opacity: 0.5; box-shadow: 0 0 15px #50ff90; }
        }

        .tournament-name {
          font-family: 'Oswald', sans-serif;
          font-size: 1rem;
          color: #50ff90;
        }

        .tournament-meta {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.5);
          margin-left: 5px;
        }

        .end-tournament-btn {
          padding: 8px 16px;
          background: rgba(255, 100, 100, 0.15);
          border: 1px solid rgba(255, 100, 100, 0.4);
          color: #ff9999;
          border-radius: 15px;
          cursor: pointer;
          font-family: 'Oswald', sans-serif;
          font-size: 0.85rem;
          transition: all 0.2s;
        }

        .end-tournament-btn:hover {
          background: rgba(255, 100, 100, 0.25);
          border-color: #ff6b6b;
        }

        /* Colonne droite avec Bouton Tournoi + Panel */
        .side-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          flex: 0 0 auto;
        }

        /* Preview Panel Styles */
        .preview-title {
          font-family: 'Oswald', sans-serif;
          font-size: 1.3rem;
          font-weight: 600;
          color: var(--yellow-selected);
          text-align: center;
          padding: 8px 10px;
          margin-bottom: 8px;
          border-bottom: 2px solid rgba(255, 200, 0, 0.3);
          text-shadow: 0 0 10px rgba(255, 200, 0, 0.3);
        }

        .preview-subtitle {
          font-family: 'Oswald', sans-serif;
          font-size: 0.8rem;
          color: var(--cyan-light);
          text-align: center;
          opacity: 0.8;
          margin-bottom: 10px;
        }

        .preview-ranking {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .preview-player {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
          border-left: 3px solid transparent;
        }

        .preview-player:first-child {
          border-left-color: #ffd700;
          background: rgba(255, 200, 0, 0.1);
        }

        .preview-rank {
          font-family: 'Oswald', sans-serif;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
          width: 18px;
          text-align: center;
        }

        .preview-player:first-child .preview-rank {
          color: #ffd700;
        }

        .preview-name {
          flex: 1;
          font-family: 'Oswald', sans-serif;
          font-size: 0.95rem;
        }

        .preview-points {
          font-family: 'Oswald', sans-serif;
          font-size: 0.9rem;
          color: var(--yellow-selected);
        }

        .preview-points::after {
          content: 'pts';
          font-size: 0.7rem;
          opacity: 0.7;
          margin-left: 2px;
        }

        .preview-empty {
          text-align: center;
          padding: 20px 10px;
          color: rgba(255, 255, 255, 0.5);
          font-family: 'Oswald', sans-serif;
          font-size: 0.9rem;
          font-style: italic;
        }

        .preview-description {
          text-align: center;
          padding: 15px 10px;
          color: var(--cyan-light);
          font-size: 0.85rem;
          line-height: 1.4;
        }
      `}</style>

      <LayoutEditor
        pageKey="home"
        defaultLayout={DEFAULT_LAYOUT}
        controls={LAYOUT_CONTROLS}
        onLayoutChange={setLayout}
      />
    </div>
  );
};

export default Home;
