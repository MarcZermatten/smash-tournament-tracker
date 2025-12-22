import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAudio } from '../hooks/useAudio';

const Home = () => {
  const { playSound, toggleSound, toggleMusic, soundEnabled, musicEnabled } = useAudio();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const menuItems = [
    {
      to: '/1v1',
      label: '1v1',
      description: 'Matchs en tête-à-tête avec rotation!',
      subItems: ['Nouveau duel', 'Rotation', 'Historique']
    },
    {
      to: '/ffa',
      label: 'FFA',
      description: 'Free For All - 4 joueurs!',
      subItems: ['Nouveau match', 'Historique', 'Règles']
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
      to: '/options',
      label: 'Options',
      description: 'Configuration du tracker!',
      subItems: ['Son', 'Données', 'Reset']
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
    playSound('confirm');
  };

  const activeItem = hoveredIndex !== null ? menuItems[hoveredIndex] : null;

  return (
    <div className="home-page">
      {/* CADRE BLEU PRINCIPAL - Englobant tout le contenu style Melee */}
      <div className="melee-main-frame">
        {/* Header "Main Menu" style Melee - INTÉGRÉ au cadre */}
        <div className="melee-header">
          <h1 className="melee-logo">Main Menu</h1>
          <div className="melee-header-line" />
        </div>

        {/* Container menu + panneau latéral */}
        <div className="menu-container">
          {/* Menu principal */}
          <nav className="melee-main-menu">
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
                {/* Indicateur cercle (visible seulement quand sélectionné) */}
                <span className="select-indicator" />
              </Link>
            ))}
          </nav>

          {/* Panneau latéral cyan */}
          <div className="side-panel">
            <div className="side-panel-decoration">SMASH</div>
            {activeItem ? (
              activeItem.subItems.map((subItem, index) => (
                <div
                  key={index}
                  className={`side-panel-item ${index === 0 ? 'active' : ''}`}
                >
                  {subItem}
                </div>
              ))
            ) : (
              <div className="side-panel-item active">Sélectionner un mode</div>
            )}
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
          className="audio-btn"
          onClick={toggleSound}
          title={soundEnabled ? 'Désactiver les sons' : 'Activer les sons'}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
        <button
          className="audio-btn"
          onClick={toggleMusic}
          title={musicEnabled ? 'Désactiver la musique' : 'Activer la musique'}
        >
          {musicEnabled ? '🎵' : '🎶'}
        </button>
      </div>
    </div>
  );
};

export default Home;
