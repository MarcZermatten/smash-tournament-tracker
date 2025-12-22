import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAudio } from '../hooks/useAudio';

const Home = () => {
  const { playSound, toggleSound, toggleMusic, soundEnabled, musicEnabled } = useAudio();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const menuItems = [
    {
      to: '/1v1',
      label: '1v1 Mode',
      description: 'Matchs en tête-à-tête avec rotation!',
      subItems: ['Marc vs Max', 'Marc vs Flo', 'Marc vs Boris', 'Tous les matchs']
    },
    {
      to: '/ffa',
      label: 'VS. Mode',
      description: 'Free For All - 4 joueurs!',
      subItems: ['Nouveau match', 'Historique', 'Règles']
    },
    {
      to: '/team-ff',
      label: '2v2 Fire',
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
      description: 'Mode détente - 2 à 8 joueurs!',
      subItems: ['Partie rapide', 'Règles spéciales']
    },
    {
      to: '/leaderboard',
      label: 'Trophies',
      description: 'Classements et statistiques!',
      subItems: ['Général', 'Par mode', 'Records']
    },
    {
      to: '/options',
      label: 'Options',
      description: 'Configuration du tracker!',
      subItems: ['Joueurs', 'Son', 'Données']
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

  const activeIndex = hoveredIndex !== null ? hoveredIndex : selectedIndex;
  const activeItem = menuItems[activeIndex];

  return (
    <div className="home-page">
      {/* Effet de spirale lumineuse supplémentaire */}
      <div className="melee-glow" />

      {/* Header "Main Menu" style Melee */}
      <div className="melee-header">
        <div className="melee-logo-container">
          <h1 className="melee-logo">Main Menu</h1>
        </div>
      </div>

      {/* Container menu + panneau latéral */}
      <div className="menu-container">
        {/* Menu principal */}
        <nav className="melee-main-menu">
          {menuItems.map((item, index) => (
            <Link
              key={item.to}
              to={item.to}
              className={`melee-menu-item ${index === activeIndex ? 'selected' : ''}`}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              onClick={handleClick}
            >
              {item.label}
              {/* Indicateur de sélection - cercle doré */}
              <span className="select-indicator" />
            </Link>
          ))}
        </nav>

        {/* Panneau latéral cyan */}
        <div className="side-panel">
          <div className="side-panel-decoration">TOURNAMENT</div>
          {activeItem.subItems.map((subItem, index) => (
            <div
              key={index}
              className={`side-panel-item ${index === 0 ? 'active' : ''}`}
            >
              {subItem}
            </div>
          ))}
        </div>
      </div>

      {/* Barre de description en bas */}
      <div className="description-bar">
        {activeItem.description}
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
