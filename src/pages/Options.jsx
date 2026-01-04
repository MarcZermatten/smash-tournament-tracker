import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAudio } from '../context/AudioContext';
import {
  exportData, importData, resetSeason, loadData,
  getPointsConfig, updatePointsConfig,
  getMatchConfig, updateMatchConfig
} from '../data/storage';
import { getMainPlayers } from '../data/players';
import LayoutEditor from '../components/LayoutEditor';
import AudioControls from '../components/AudioControls';
import { playMenuSelectSound } from '../utils/sounds';

// Configuration par défaut du layout Options
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

const Options = () => {
  const {
    soundEnabled, musicEnabled, volume,
    toggleSound, toggleMusic, changeVolume,
    currentTrack, playlist, isPlaying,
    togglePlayPause, nextTrack, previousTrack, selectTrack
  } = useAudio();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('points'); // points, matchs, audio, data
  const fileInputRef = useRef(null);

  // Config points
  const [pointsConfig, setPointsConfig] = useState(getPointsConfig());
  // Config matchs
  const [matchConfig, setMatchConfig] = useState(getMatchConfig());

  // Mode dev layout
  const [devLayoutMode, setDevLayoutMode] = useState(() => localStorage.getItem('smash_dev_layout') === 'true');
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);

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

  const toggleDevLayout = () => {
    const newValue = !devLayoutMode;
    setDevLayoutMode(newValue);
    localStorage.setItem('smash_dev_layout', String(newValue));
    window.dispatchEvent(new Event('devModeChange'));
    showStatus(newValue ? 'Mode Layout DEV activé !' : 'Mode Layout DEV désactivé');
  };

  const mainPlayersCount = getMainPlayers().length;

  // Calculer le nombre de matchs "all" (tous contre tous)
  const calculateAllMatchups = (playerCount) => {
    return (playerCount * (playerCount - 1)) / 2;
  };

  const handlePointsChange = (mode, key, value) => {
    const newConfig = { ...pointsConfig };
    if (mode === 'ffa') {
      newConfig.ffa = { ...newConfig.ffa, [key]: parseInt(value) || 0 };
    } else {
      newConfig[mode] = { ...newConfig[mode], [key]: parseInt(value) || 0 };
    }
    setPointsConfig(newConfig);
    updatePointsConfig(newConfig);
    window.dispatchEvent(new Event('settingsUpdate'));
    showStatus('Points mis à jour !');
  };

  const handleMatchConfigChange = (mode, value) => {
    const newConfig = { ...matchConfig };
    newConfig[mode] = value === 'all' ? 'all' : parseInt(value) || 1;
    setMatchConfig(newConfig);
    updateMatchConfig(newConfig);
    window.dispatchEvent(new Event('settingsUpdate'));
    showStatus('Configuration matchs mise à jour !');
  };

  const showStatus = (message, type = 'success') => {
    setImportStatus({ type, message });
    setTimeout(() => setImportStatus(null), 2000);
  };

  const handleExport = () => {
    exportData();
    showStatus('Données exportées !');
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = importData(event.target?.result);
      if (result) {
        showStatus('Données importées avec succès !');
        window.dispatchEvent(new Event('scoreUpdate'));
      } else {
        showStatus('Erreur lors de l\'import', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    resetSeason();
    setShowResetConfirm(false);
    window.dispatchEvent(new Event('scoreUpdate'));
    showStatus('Saison réinitialisée !');
  };

  const resetPointsToDefault = () => {
    const defaultPoints = {
      '1v1': { win: 3, lose: 0 },
      ffa: { 1: 5, 2: 3, 3: 1, 4: 0 },
      team_ff: { win: 3, lose: 0 },
      team_noff: { win: 3, lose: 0 },
      casual: { vip_win: 2, vip_lose: 0, protectors_win: 3, hunters_win: 3 }
    };
    setPointsConfig(defaultPoints);
    updatePointsConfig(defaultPoints);
    window.dispatchEvent(new Event('settingsUpdate'));
    showStatus('Points réinitialisés !');
  };

  const data = loadData();
  const totalMatches = data.matches.length;

  const tabs = [
    { id: 'points', label: 'Points', icon: '🏆' },
    { id: 'matchs', label: 'Matchs', icon: '🎮' },
    { id: 'audio', label: 'Audio', icon: '🔊' },
    { id: 'data', label: 'Données', icon: '💾' },
    { id: 'about', label: 'À propos', icon: 'ℹ️' },
  ];

  return (
    <div className="home-page">
      <div className="melee-main-frame dashboard-frame" style={{ ...dynamicStyles.frame, maxWidth: '700px' }}>
        {/* Header avec Logo style menu principal */}
        <div className="subpage-header" style={dynamicStyles.header}>
          <div className="subpage-logo-container" style={dynamicStyles.logoContainer}>
            <img src="/logo.png" alt="BFSA" className="subpage-logo" style={dynamicStyles.logo} />
            <div className="subpage-logo-glow"></div>
          </div>
          <div className="subpage-title" style={dynamicStyles.title}>
            <h1>OPTIONS</h1>
            <span className="mode-subtitle">Configuration du tracker</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="options-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Status message */}
        {importStatus && (
          <div className={`status-message ${importStatus.type}`}>
            {importStatus.message}
          </div>
        )}

        {/* Tab Content */}
        <div className="tab-content">
          {/* POINTS CONFIG */}
          {activeTab === 'points' && (
            <div className="points-config">
              <p className="config-hint">Configure le nombre de points attribués pour chaque mode</p>

              {/* 1v1 */}
              <div className="mode-config">
                <div className="mode-header">
                  <span className="mode-icon">⚔️</span>
                  <span className="mode-name">1v1</span>
                </div>
                <div className="points-inputs">
                  <div className="point-input">
                    <label>Victoire</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={pointsConfig['1v1']?.win || 0}
                      onChange={(e) => handlePointsChange('1v1', 'win', e.target.value)}
                    />
                  </div>
                  <div className="point-input">
                    <label>Défaite</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={pointsConfig['1v1']?.lose || 0}
                      onChange={(e) => handlePointsChange('1v1', 'lose', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* FFA */}
              <div className="mode-config">
                <div className="mode-header">
                  <span className="mode-icon">🎯</span>
                  <span className="mode-name">Free For All</span>
                </div>
                <div className="points-inputs ffa-grid">
                  {[1, 2, 3, 4].map(pos => (
                    <div key={pos} className="point-input">
                      <label>{pos === 1 ? '1er' : pos === 2 ? '2e' : pos === 3 ? '3e' : '4e'}</label>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={pointsConfig.ffa?.[pos] || 0}
                        onChange={(e) => handlePointsChange('ffa', pos, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Team FF */}
              <div className="mode-config">
                <div className="mode-header">
                  <span className="mode-icon">🔥</span>
                  <span className="mode-name">2v2 Friendly Fire</span>
                </div>
                <div className="points-inputs">
                  <div className="point-input">
                    <label>Victoire</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={pointsConfig.team_ff?.win || 0}
                      onChange={(e) => handlePointsChange('team_ff', 'win', e.target.value)}
                    />
                  </div>
                  <div className="point-input">
                    <label>Défaite</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={pointsConfig.team_ff?.lose || 0}
                      onChange={(e) => handlePointsChange('team_ff', 'lose', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Team No FF */}
              <div className="mode-config">
                <div className="mode-header">
                  <span className="mode-icon">🤝</span>
                  <span className="mode-name">2v2 No Friendly Fire</span>
                </div>
                <div className="points-inputs">
                  <div className="point-input">
                    <label>Victoire</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={pointsConfig.team_noff?.win || 0}
                      onChange={(e) => handlePointsChange('team_noff', 'win', e.target.value)}
                    />
                  </div>
                  <div className="point-input">
                    <label>Défaite</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={pointsConfig.team_noff?.lose || 0}
                      onChange={(e) => handlePointsChange('team_noff', 'lose', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Casual 2v3 */}
              <div className="mode-config">
                <div className="mode-header">
                  <span className="mode-icon">👶</span>
                  <span className="mode-name">Casual 2v3 (Protège le Noob)</span>
                </div>
                <div className="points-inputs casual-grid">
                  <div className="point-input">
                    <label>VIP survit</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={pointsConfig.casual?.vip_win ?? 2}
                      onChange={(e) => handlePointsChange('casual', 'vip_win', e.target.value)}
                    />
                  </div>
                  <div className="point-input">
                    <label>VIP mort</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={pointsConfig.casual?.vip_lose ?? 0}
                      onChange={(e) => handlePointsChange('casual', 'vip_lose', e.target.value)}
                    />
                  </div>
                  <div className="point-input">
                    <label>Protecteurs</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={pointsConfig.casual?.protectors_win ?? 3}
                      onChange={(e) => handlePointsChange('casual', 'protectors_win', e.target.value)}
                    />
                  </div>
                  <div className="point-input">
                    <label>Chasseurs</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={pointsConfig.casual?.hunters_win ?? 3}
                      onChange={(e) => handlePointsChange('casual', 'hunters_win', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="reset-btn-container">
                <button className="reset-points-btn" onClick={resetPointsToDefault}>
                  Réinitialiser les points par défaut
                </button>
              </div>
            </div>
          )}

          {/* MATCHS CONFIG */}
          {activeTab === 'matchs' && (
            <div className="matchs-config">
              <p className="config-hint">
                Configure le nombre de matchs par défaut pour un tournoi
                <br />
                <span className="hint-small">({mainPlayersCount} joueurs = {calculateAllMatchups(mainPlayersCount)} matchs "tous contre tous")</span>
              </p>

              {/* 1v1 */}
              <div className="mode-config">
                <div className="mode-header">
                  <span className="mode-icon">⚔️</span>
                  <span className="mode-name">1v1</span>
                </div>
                <div className="match-options">
                  <button
                    className={`match-opt ${matchConfig['1v1'] === 'all' ? 'selected' : ''}`}
                    onClick={() => handleMatchConfigChange('1v1', 'all')}
                  >
                    Tous ({calculateAllMatchups(mainPlayersCount)})
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    placeholder="Nb"
                    className={matchConfig['1v1'] !== 'all' ? 'selected' : ''}
                    value={matchConfig['1v1'] !== 'all' ? matchConfig['1v1'] : ''}
                    onChange={(e) => handleMatchConfigChange('1v1', e.target.value)}
                  />
                </div>
              </div>

              {/* FFA */}
              <div className="mode-config">
                <div className="mode-header">
                  <span className="mode-icon">🎯</span>
                  <span className="mode-name">Free For All</span>
                </div>
                <div className="match-options">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={matchConfig.ffa || 5}
                    onChange={(e) => handleMatchConfigChange('ffa', e.target.value)}
                    className="selected"
                  />
                  <span className="match-label">matchs</span>
                </div>
              </div>

              {/* Team FF */}
              <div className="mode-config">
                <div className="mode-header">
                  <span className="mode-icon">🔥</span>
                  <span className="mode-name">2v2 FF</span>
                </div>
                <div className="match-options">
                  <button
                    className={`match-opt ${matchConfig.team_ff === 'all' ? 'selected' : ''}`}
                    onClick={() => handleMatchConfigChange('team_ff', 'all')}
                  >
                    Toutes rotations
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    placeholder="Nb"
                    className={matchConfig.team_ff !== 'all' ? 'selected' : ''}
                    value={matchConfig.team_ff !== 'all' ? matchConfig.team_ff : ''}
                    onChange={(e) => handleMatchConfigChange('team_ff', e.target.value)}
                  />
                </div>
              </div>

              {/* Team No FF */}
              <div className="mode-config">
                <div className="mode-header">
                  <span className="mode-icon">🤝</span>
                  <span className="mode-name">2v2 No FF</span>
                </div>
                <div className="match-options">
                  <button
                    className={`match-opt ${matchConfig.team_noff === 'all' ? 'selected' : ''}`}
                    onClick={() => handleMatchConfigChange('team_noff', 'all')}
                  >
                    Toutes rotations
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    placeholder="Nb"
                    className={matchConfig.team_noff !== 'all' ? 'selected' : ''}
                    value={matchConfig.team_noff !== 'all' ? matchConfig.team_noff : ''}
                    onChange={(e) => handleMatchConfigChange('team_noff', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* AUDIO */}
          {activeTab === 'audio' && (
            <div className="audio-config">
              <div className="option-row">
                <span>Effets sonores</span>
                <button
                  className={`toggle-btn ${soundEnabled ? 'on' : 'off'}`}
                  onClick={toggleSound}
                >
                  {soundEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="option-row">
                <span>Musique</span>
                <button
                  className={`toggle-btn ${musicEnabled ? 'on' : 'off'}`}
                  onClick={toggleMusic}
                >
                  {musicEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="option-row">
                <span>Volume</span>
                <div className="volume-control">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => changeVolume(parseFloat(e.target.value))}
                    className="volume-slider"
                  />
                  <span className="volume-value">{Math.round(volume * 100)}%</span>
                </div>
              </div>

              {/* Contrôles musique */}
              {musicEnabled && (
                <div className="music-controls">
                  {/* Piste en cours */}
                  <div className="now-playing">
                    <div className="now-playing-info">
                      <span className="now-playing-label">En lecture</span>
                      <span className="now-playing-track">
                        {currentTrack ? currentTrack.name : 'Aucune piste'}
                      </span>
                    </div>
                    <div className="music-buttons">
                      <button
                        className="music-btn"
                        onClick={previousTrack}
                        title="Piste précédente"
                      >
                        ⏮
                      </button>
                      <button
                        className="music-btn"
                        onClick={togglePlayPause}
                        title={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? '⏸' : '▶'}
                      </button>
                      <button
                        className="music-btn"
                        onClick={nextTrack}
                        title="Piste suivante"
                      >
                        ⏭
                      </button>
                    </div>
                  </div>

                  {/* Liste des pistes par catégorie */}
                  <div className="track-list">
                    {['Menu', 'Zelda', 'Mario', 'Kirby', 'Stage', 'Character', 'Misc'].map(category => {
                      const categoryTracks = playlist.filter(t => t.category === category);
                      if (categoryTracks.length === 0) return null;
                      return (
                        <div key={category} className="track-category">
                          <div className="category-header">
                            {category === 'Menu' && '🎮 Menu'}
                            {category === 'Zelda' && '🗡️ Zelda'}
                            {category === 'Mario' && '🍄 Mario'}
                            {category === 'Kirby' && '⭐ Kirby'}
                            {category === 'Stage' && '🏟️ Stages'}
                            {category === 'Character' && '👤 Personnages'}
                            {category === 'Misc' && '🎵 Divers'}
                          </div>
                          <div className="category-tracks">
                            {categoryTracks.map(track => (
                              <button
                                key={track.id}
                                className={`track-btn ${currentTrack?.id === track.id ? 'playing' : ''}`}
                                onClick={() => selectTrack(track.id)}
                              >
                                <span className="track-name">{track.name}</span>
                                {currentTrack?.id === track.id && isPlaying && (
                                  <span className="track-playing">♪</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p className="track-hint">
                    💡 Ajoute tes propres MP3 dans <code>public/audio/</code>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* DATA */}
          {activeTab === 'data' && (
            <div className="data-config">
              <div className="data-stats">
                <div className="stat-box">
                  <span className="stat-value">{totalMatches}</span>
                  <span className="stat-label">Parties</span>
                </div>
                <div className="stat-box">
                  <span className="stat-value">{data.tournamentHistory?.length || 0}</span>
                  <span className="stat-label">Tournois</span>
                </div>
              </div>

              <div className="data-buttons">
                <button className="data-btn export" onClick={handleExport}>
                  <span>📤</span> Exporter (JSON)
                </button>

                <button className="data-btn import" onClick={() => fileInputRef.current?.click()}>
                  <span>📥</span> Importer
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Mode Développeur */}
              <div className="dev-zone">
                <div className="dev-header">Mode Développeur</div>
                <div className="option-row">
                  <span>Contrôles Layout</span>
                  <button
                    className={`toggle-btn ${devLayoutMode ? 'on' : 'off'}`}
                    onClick={toggleDevLayout}
                  >
                    {devLayoutMode ? 'ON' : 'OFF'}
                  </button>
                </div>
                <p className="dev-hint">Affiche les contrôles de positionnement sur le menu principal</p>
              </div>

              {/* Danger Zone */}
              <div className="danger-zone">
                <div className="danger-header">Zone Danger</div>

                {showResetConfirm ? (
                  <div className="reset-confirm">
                    <p>Êtes-vous sûr ? Toutes les données de la saison seront perdues !</p>
                    <div className="confirm-buttons">
                      <button className="cancel-btn" onClick={() => setShowResetConfirm(false)}>
                        Annuler
                      </button>
                      <button className="danger-btn" onClick={handleReset}>
                        Confirmer Reset
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="danger-btn" onClick={() => setShowResetConfirm(true)}>
                    Réinitialiser la saison
                  </button>
                )}
              </div>
            </div>
          )}

          {/* À PROPOS */}
          {activeTab === 'about' && (
            <div className="about-section">
              <div className="about-logo">
                <img src="/logo.png" alt="BFSA" />
              </div>
              <h2 className="about-title">BFSA Ultimate Legacy</h2>
              <p className="about-version">Version 1.0</p>

              <div className="about-description">
                <p>Tracker de tournois Super Smash Bros Ultimate pour les soirées entre amis.</p>
              </div>

              <div className="about-credits">
                <h3>Crédits</h3>
                <p>Développé par Marc Zermatten, via GeoMind</p>
              </div>

              <div className="about-features">
                <h3>Fonctionnalités</h3>
                <ul>
                  <li>Mode 1v1, FFA, 2v2</li>
                  <li>Système de points configurable</li>
                  <li>Leaderboard en temps réel</li>
                  <li>Historique des tournois</li>
                </ul>
              </div>
            </div>
          )}
        </div>

      </div>

      <Link to="/" className="back-btn" onClick={playMenuSelectSound}>
        ← Menu
      </Link>

      {/* Layout Editor (mode dev) */}
      <LayoutEditor
        pageKey="options"
        defaultLayout={DEFAULT_LAYOUT}
        controls={LAYOUT_CONTROLS}
        onLayoutChange={setLayout}
      />

      <style>{`
        .options-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }

        .tab-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 8px;
          background: rgba(20, 40, 80, 0.5);
          border: 2px solid rgba(100, 150, 200, 0.3);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .tab-btn:hover {
          border-color: var(--cyan-light);
        }

        .tab-btn.active {
          background: rgba(100, 80, 30, 0.4);
          border-color: var(--yellow-selected);
        }

        .tab-icon {
          font-size: 1.5rem;
        }

        .tab-label {
          font-family: 'Oswald', sans-serif;
          font-size: 0.85rem;
          color: white;
        }

        .tab-content {
          min-height: 350px;
          padding-bottom: 20px;
          margin-bottom: 10px;
          overflow-y: auto;
          max-height: 500px;
        }

        .config-hint {
          color: var(--cyan-light);
          font-size: 0.9rem;
          margin-bottom: 20px;
          text-align: center;
        }

        .hint-small {
          font-size: 0.8rem;
          opacity: 0.7;
        }

        .mode-config {
          background: rgba(6, 18, 35, 0.7);
          border: 2px solid rgba(100, 150, 200, 0.2);
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 12px;
        }

        .mode-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(100, 150, 200, 0.2);
        }

        .mode-icon {
          font-size: 1.3rem;
        }

        .mode-name {
          font-family: 'Oswald', sans-serif;
          font-size: 1.1rem;
        }

        .points-inputs {
          display: flex;
          gap: 15px;
        }

        .points-inputs.ffa-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .points-inputs.casual-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .point-input {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .point-input label {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .point-input input {
          width: 60px;
          padding: 8px 10px;
          background: rgba(0, 0, 0, 0.3);
          border: 2px solid rgba(100, 150, 200, 0.3);
          border-radius: 4px;
          color: var(--yellow-selected);
          font-family: 'Oswald', sans-serif;
          font-size: 1.1rem;
          text-align: center;
        }

        .point-input input:focus {
          outline: none;
          border-color: var(--yellow-selected);
        }

        .reset-btn-container {
          margin-top: 25px;
          padding-top: 15px;
          border-top: 1px solid rgba(100, 150, 200, 0.2);
        }

        .reset-points-btn {
          display: block;
          width: 100%;
          padding: 12px;
          background: rgba(0, 100, 120, 0.4);
          border: 2px solid var(--cyan);
          border-radius: 6px;
          color: var(--cyan-light);
          cursor: pointer;
          font-family: 'Oswald', sans-serif;
          font-size: 0.95rem;
          text-align: center;
        }

        .reset-points-btn:hover {
          background: rgba(0, 150, 180, 0.5);
          border-color: var(--cyan-light);
        }

        .match-options {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .match-opt {
          padding: 8px 15px;
          background: rgba(20, 40, 80, 0.5);
          border: 2px solid rgba(100, 150, 200, 0.3);
          border-radius: 4px;
          color: white;
          cursor: pointer;
          font-family: 'Oswald', sans-serif;
          transition: all 0.15s;
        }

        .match-opt:hover {
          border-color: var(--cyan-light);
        }

        .match-opt.selected {
          background: rgba(100, 80, 30, 0.4);
          border-color: var(--yellow-selected);
          color: var(--yellow-selected);
        }

        .match-options input {
          width: 70px;
          padding: 8px 10px;
          background: rgba(0, 0, 0, 0.3);
          border: 2px solid rgba(100, 150, 200, 0.3);
          border-radius: 4px;
          color: white;
          font-family: 'Oswald', sans-serif;
          font-size: 1rem;
          text-align: center;
        }

        .match-options input.selected {
          border-color: var(--yellow-selected);
          color: var(--yellow-selected);
        }

        .match-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
        }

        .option-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: rgba(6, 18, 35, 0.7);
          border: 2px solid rgba(100, 150, 200, 0.2);
          border-radius: 8px;
          margin-bottom: 10px;
          font-family: 'Oswald', sans-serif;
          font-size: 1.1rem;
        }

        .toggle-btn {
          padding: 8px 25px;
          font-family: 'Oswald', sans-serif;
          font-size: 1rem;
          border: 2px solid;
          cursor: pointer;
          transition: all 0.15s;
          border-radius: 4px;
        }

        .toggle-btn.on {
          background: linear-gradient(180deg, #ffe840 0%, #d0a800 100%);
          border-color: var(--yellow-selected);
          color: #181008;
        }

        .toggle-btn.off {
          background: transparent;
          border-color: rgba(255, 255, 255, 0.3);
          color: rgba(255, 255, 255, 0.5);
        }

        .volume-control {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .volume-slider {
          width: 120px;
          height: 6px;
          -webkit-appearance: none;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          outline: none;
        }

        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          background: var(--yellow-selected);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px var(--yellow-selected);
        }

        .volume-value {
          min-width: 45px;
          text-align: right;
          font-family: 'Oswald', sans-serif;
          color: var(--yellow-selected);
        }

        .audio-note {
          margin-top: 20px;
          padding: 15px;
          background: rgba(100, 80, 30, 0.2);
          border: 1px dashed rgba(255, 200, 0, 0.3);
          border-radius: 6px;
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
        }

        .data-stats {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }

        .stat-box {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          background: rgba(6, 18, 35, 0.7);
          border: 2px solid rgba(100, 150, 200, 0.2);
          border-radius: 8px;
        }

        .stat-box .stat-value {
          font-family: 'Oswald', sans-serif;
          font-size: 2rem;
          color: var(--yellow-selected);
        }

        .stat-box .stat-label {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .data-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 25px;
        }

        .data-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 15px;
          border-radius: 6px;
          font-family: 'Oswald', sans-serif;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.15s;
        }

        .data-btn.export {
          background: rgba(0, 150, 180, 0.2);
          border: 2px solid var(--cyan-light);
          color: var(--cyan-light);
        }

        .data-btn.import {
          background: rgba(100, 80, 30, 0.3);
          border: 2px solid var(--yellow-selected);
          color: var(--yellow-selected);
        }

        .data-btn:hover {
          transform: translateY(-2px);
        }

        .dev-zone {
          background: rgba(100, 80, 30, 0.2);
          border: 2px solid rgba(255, 200, 0, 0.3);
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
        }

        .dev-header {
          font-family: 'Oswald', sans-serif;
          color: var(--yellow-selected);
          margin-bottom: 12px;
          font-size: 1rem;
        }

        .dev-hint {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          margin: 10px 0 0;
          font-style: italic;
        }

        .danger-zone {
          background: rgba(100, 30, 30, 0.2);
          border: 2px solid rgba(255, 100, 100, 0.3);
          border-radius: 8px;
          padding: 15px;
        }

        .danger-header {
          font-family: 'Oswald', sans-serif;
          color: #ff6b6b;
          margin-bottom: 12px;
          font-size: 1rem;
        }

        .danger-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(180deg, #8b0000 0%, #4a0000 100%);
          border: 2px solid #ff6b6b;
          border-radius: 6px;
          color: white;
          font-family: 'Oswald', sans-serif;
          cursor: pointer;
        }

        .danger-btn:hover {
          box-shadow: 0 0 20px rgba(255, 100, 100, 0.4);
        }

        .reset-confirm p {
          color: #f0a050;
          margin-bottom: 12px;
          text-align: center;
        }

        .confirm-buttons {
          display: flex;
          gap: 10px;
        }

        .cancel-btn {
          flex: 1;
          padding: 10px;
          background: rgba(100, 150, 200, 0.2);
          border: 2px solid var(--cyan-light);
          border-radius: 6px;
          color: var(--cyan-light);
          font-family: 'Oswald', sans-serif;
          cursor: pointer;
        }

        .confirm-buttons .danger-btn {
          flex: 1;
        }

        .status-message {
          padding: 10px 15px;
          text-align: center;
          border-radius: 6px;
          font-family: 'Oswald', sans-serif;
          margin-bottom: 15px;
          animation: fadeIn 0.3s;
        }

        .status-message.success {
          background: rgba(78, 205, 196, 0.2);
          color: var(--cyan-light);
          border: 1px solid rgba(78, 205, 196, 0.4);
        }

        .status-message.error {
          background: rgba(255, 107, 107, 0.2);
          color: #ff6b6b;
          border: 1px solid rgba(255, 107, 107, 0.4);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* À propos */
        .about-section {
          text-align: center;
          padding: 20px 0;
        }

        .about-logo {
          margin-bottom: 20px;
        }

        .about-logo img {
          height: 180px;
          filter: drop-shadow(0 0 20px rgba(255, 216, 0, 0.3));
        }

        .about-title {
          font-family: 'Oswald', sans-serif;
          font-size: 1.8rem;
          color: var(--yellow-selected);
          margin: 0 0 5px 0;
        }

        .about-version {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.9rem;
          margin: 0 0 25px 0;
        }

        .about-description {
          color: var(--cyan-light);
          margin-bottom: 25px;
        }

        .about-credits, .about-features {
          background: rgba(6, 18, 35, 0.7);
          border: 1px solid rgba(100, 150, 200, 0.2);
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
          text-align: left;
        }

        .about-credits h3, .about-features h3 {
          font-family: 'Oswald', sans-serif;
          color: var(--cyan-light);
          font-size: 1rem;
          margin: 0 0 10px 0;
        }

        .about-credits p {
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
        }

        .about-credits .credits-players {
          margin-top: 8px;
          font-size: 0.9rem;
          opacity: 0.7;
        }

        .about-features ul {
          margin: 0;
          padding-left: 20px;
          color: rgba(255, 255, 255, 0.7);
        }

        .about-features li {
          margin-bottom: 5px;
        }
      `}</style>

      <AudioControls />
    </div>
  );
};

export default Options;
