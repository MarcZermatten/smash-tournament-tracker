import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  getPlayers,
  getPlayer,
  getAvatar,
  addPlayer,
  updatePlayer,
  removePlayer,
  resetPlayers,
  setPlayerImage,
  getPlayerImage,
  AVATARS,
  COLORS,
  SSBU_CHARACTERS
} from '../data/players';
import { useAudio } from '../context/AudioContext';
import { useModal } from '../components/Modal';
import LayoutEditor from '../components/LayoutEditor';
import AudioControls from '../components/AudioControls';
import { playMenuSelectSound } from '../utils/sounds';

// Configuration par défaut du layout Players
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

const Players = () => {
  const [players, setPlayers] = useState(getPlayers());
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ name: '', color: COLORS[0], avatar: 'fox', isMain: true });
  const [newPlayerImage, setNewPlayerImage] = useState(null);
  const [message, setMessage] = useState(null);
  const { playSound } = useAudio();
  const { showConfirm } = useModal();
  const fileInputRef = useRef(null);
  const newFileInputRef = useRef(null);
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

  // Sélectionner un personnage SSBU (utilise l'image locale)
  const handleSelectSSBUCharacter = (character, playerId) => {
    // Utiliser l'image locale du personnage
    const imageUrl = character.image;

    if (playerId) {
      setPlayerImage(playerId, imageUrl);
      setPlayers(getPlayers());
      showMessage(`${character.name} sélectionné !`);
    } else {
      setNewPlayerImage(imageUrl);
    }
    playSound('confirm');
  };

  // Recharger quand les joueurs changent
  useEffect(() => {
    const handleUpdate = () => setPlayers(getPlayers());
    window.addEventListener('playersUpdate', handleUpdate);
    return () => window.removeEventListener('playersUpdate', handleUpdate);
  }, []);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAddPlayer = () => {
    if (!newPlayer.name.trim()) {
      showMessage('Le nom est requis', 'error');
      return;
    }

    const result = addPlayer(newPlayer);
    if (result.success) {
      // Sauvegarder l'image si elle existe
      if (newPlayerImage && result.player?.id) {
        setPlayerImage(result.player.id, newPlayerImage);
      }
      playSound('confirm');
      showMessage(`${newPlayer.name} ajouté !`);
      setNewPlayer({ name: '', color: COLORS[Object.keys(players).length % COLORS.length], avatar: 'fox', isMain: true });
      setNewPlayerImage(null);
      setShowAddForm(false);
      setPlayers(getPlayers());
    } else {
      playSound('cancel');
      showMessage(result.error, 'error');
    }
  };

  const handleUpdatePlayer = (id, updates) => {
    const result = updatePlayer(id, updates);
    if (result.success) {
      playSound('select');
      setPlayers(getPlayers());
    }
  };

  const handleRemovePlayer = (id) => {
    const player = getPlayer(id);
    showConfirm(`Supprimer ${player.name} ?`, () => {
      removePlayer(id);
      playSound('cancel');
      showMessage(`${player.name} supprimé`);
      setPlayers(getPlayers());
      setEditingPlayer(null);
    });
  };

  const handleReset = () => {
    showConfirm('Réinitialiser tous les joueurs aux valeurs par défaut ?', () => {
      resetPlayers();
      playSound('confirm');
      showMessage('Joueurs réinitialisés');
      setPlayers(getPlayers());
    });
  };

  // Gestion de l'upload d'image
  const handleImageUpload = (e, playerId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      // Redimensionner l'image
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 150;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const resizedImage = canvas.toDataURL('image/jpeg', 0.8);

        if (playerId) {
          // Mettre à jour l'image d'un joueur existant
          setPlayerImage(playerId, resizedImage);
          setPlayers(getPlayers());
          showMessage('Image mise à jour !');
        } else {
          // Pour un nouveau joueur
          setNewPlayerImage(resizedImage);
        }
        playSound('confirm');
      };
      img.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (playerId) => {
    setPlayerImage(playerId, null);
    setPlayers(getPlayers());
    showMessage('Image supprimée');
    playSound('select');
  };

  const playerList = Object.values(players);

  return (
    <div className="home-page">
      <div className="melee-main-frame dashboard-frame players-frame" style={dynamicStyles.frame}>
        {/* Header avec Logo style menu principal */}
        <div className="subpage-header" style={dynamicStyles.header}>
          <div className="subpage-logo-container" style={dynamicStyles.logoContainer}>
            <img src="/logo.png" alt="BFSA" className="subpage-logo" style={dynamicStyles.logo} />
            <div className="subpage-logo-glow"></div>
          </div>
          <div className="subpage-title" style={dynamicStyles.title}>
            <h1>JOUEURS</h1>
            <span className="mode-subtitle">Gestion des profils</span>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`players-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Contenu */}
        <div className="players-content">
          {/* Liste des joueurs */}
          <div className="players-list">
            {playerList.map(player => {
              const avatar = getAvatar(player.avatar);
              const isEditing = editingPlayer === player.id;

              const playerImage = getPlayerImage(player.id);

              return (
                <div
                  key={player.id}
                  className={`player-row ${isEditing ? 'editing' : ''} ${player.isMain ? 'main' : 'casual'}`}
                  onClick={() => !isEditing && setEditingPlayer(player.id)}
                >
                  {/* Avatar ou Image personnalisée - avec bordure couleur joueur */}
                  {playerImage ? (
                    <img
                      src={playerImage}
                      alt={player.name}
                      className="player-row-avatar-img"
                      style={{ borderColor: player.color }}
                    />
                  ) : (
                    <div className="player-row-avatar" style={{ background: player.color }}>
                      {avatar?.icon || player.initial}
                    </div>
                  )}

                  {/* Info */}
                  <div className="player-row-info">
                    <span className="player-row-name">{player.name}</span>
                    <span className="player-row-tag">
                      {player.isMain ? 'Joueur principal' : 'Casual'}
                    </span>
                  </div>

                  {/* Édition inline */}
                  {isEditing && (
                    <div className="player-edit-panel" onClick={(e) => e.stopPropagation()}>
                      {/* Upload image personnalisée */}
                      <div className="edit-section">
                        <span className="edit-label">Image personnalisée</span>
                        <div className="image-upload-section">
                          {playerImage ? (
                            <div className="current-image">
                              <img src={playerImage} alt={player.name} />
                              <button
                                className="remove-image-btn"
                                onClick={() => handleRemoveImage(player.id)}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="no-image">Aucune image</div>
                          )}
                          <button
                            className="upload-btn"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            📷 {playerImage ? 'Changer' : 'Ajouter'} une image
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, player.id)}
                            style={{ display: 'none' }}
                          />
                        </div>
                      </div>

                      {/* Sélection personnage SSBU */}
                      <div className="edit-section">
                        <span className="edit-label">Personnages SSBU</span>
                        <div className="ssbu-grid">
                          {SSBU_CHARACTERS.map(char => (
                            <button
                              key={char.id}
                              className="ssbu-option"
                              onClick={() => handleSelectSSBUCharacter(char, player.id)}
                              title={char.name}
                            >
                              <img src={char.image} alt={char.name} className="ssbu-char-img" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sélection couleur */}
                      <div className="edit-section">
                        <span className="edit-label">Couleur</span>
                        <div className="color-grid">
                          {COLORS.map(color => (
                            <button
                              key={color}
                              className={`color-option ${player.color === color ? 'selected' : ''}`}
                              style={{ background: color }}
                              onClick={() => handleUpdatePlayer(player.id, { color })}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Toggle principal */}
                      <div className="edit-section">
                        <label className="toggle-label">
                          <input
                            type="checkbox"
                            checked={player.isMain}
                            onChange={(e) => handleUpdatePlayer(player.id, { isMain: e.target.checked })}
                          />
                          <span>Joueur principal (tournois)</span>
                        </label>
                      </div>

                      {/* Actions */}
                      <div className="edit-actions">
                        <button
                          className="edit-btn delete"
                          onClick={() => handleRemovePlayer(player.id)}
                        >
                          Supprimer
                        </button>
                        <button
                          className="edit-btn close"
                          onClick={() => setEditingPlayer(null)}
                        >
                          Fermer
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Indicateur d'édition */}
                  {!isEditing && (
                    <span className="edit-hint">Cliquer pour éditer</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Formulaire d'ajout */}
          {showAddForm ? (
            <div className="add-player-form">
              <div className="form-header">Nouveau joueur</div>

              <div className="form-field">
                <label>Nom</label>
                <input
                  type="text"
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                  placeholder="Nom du joueur"
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label>Image personnalisée</label>
                <div className="image-upload-section">
                  {newPlayerImage ? (
                    <div className="current-image">
                      <img src={newPlayerImage} alt="Preview" />
                      <button
                        className="remove-image-btn"
                        onClick={() => setNewPlayerImage(null)}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="no-image">Aucune image</div>
                  )}
                  <button
                    className="upload-btn"
                    onClick={() => newFileInputRef.current?.click()}
                  >
                    📷 {newPlayerImage ? 'Changer' : 'Ajouter'} une image
                  </button>
                  <input
                    ref={newFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, null)}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Personnages SSBU</label>
                <div className="ssbu-grid">
                  {SSBU_CHARACTERS.map(char => (
                    <button
                      key={char.id}
                      className="ssbu-option"
                      onClick={() => handleSelectSSBUCharacter(char, null)}
                      title={char.name}
                    >
                      <img src={char.image} alt={char.name} className="ssbu-char-img" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-field">
                <label>Couleur</label>
                <div className="color-grid">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      className={`color-option ${newPlayer.color === color ? 'selected' : ''}`}
                      style={{ background: color }}
                      onClick={() => setNewPlayer({ ...newPlayer, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="form-field">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={newPlayer.isMain}
                    onChange={(e) => setNewPlayer({ ...newPlayer, isMain: e.target.checked })}
                  />
                  <span>Joueur principal (tournois)</span>
                </label>
              </div>

              <div className="form-actions">
                <button
                  className="melee-button"
                  onClick={() => setShowAddForm(false)}
                >
                  Annuler
                </button>
                <button
                  className="melee-button primary"
                  onClick={handleAddPlayer}
                >
                  Ajouter
                </button>
              </div>
            </div>
          ) : (
            <div className="players-actions">
              <button
                className="melee-button primary"
                onClick={() => {
                  playSound('select');
                  setShowAddForm(true);
                }}
              >
                + Ajouter un joueur
              </button>
              <button
                className="melee-button"
                onClick={handleReset}
              >
                Réinitialiser
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bouton retour */}
      <Link to="/" className="back-btn" onClick={playMenuSelectSound}>
        &larr; Menu
      </Link>

      {/* Layout Editor (mode dev) */}
      <LayoutEditor
        pageKey="players"
        defaultLayout={DEFAULT_LAYOUT}
        controls={LAYOUT_CONTROLS}
        onLayoutChange={setLayout}
      />

      <AudioControls />

      <style>{`
        .player-row-avatar-img {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid;
          box-shadow: 0 0 10px currentColor;
        }

        .image-upload-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
        }

        .current-image {
          position: relative;
          display: inline-block;
        }

        .current-image img {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid var(--yellow-selected);
        }

        .remove-image-btn {
          position: absolute;
          top: -5px;
          right: -5px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ff4444;
          border: 2px solid white;
          color: white;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }

        .remove-image-btn:hover {
          transform: scale(1.1);
        }

        .no-image {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.9rem;
          padding: 10px;
        }

        .upload-btn {
          padding: 8px 16px;
          background: rgba(0, 150, 180, 0.3);
          border: 2px solid var(--cyan-light);
          border-radius: 20px;
          color: var(--cyan-light);
          font-family: 'Oswald', sans-serif;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .upload-btn:hover {
          background: rgba(0, 150, 180, 0.5);
          transform: scale(1.05);
        }

        /* SSBU Characters Grid - Full roster */
        .ssbu-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 3px;
          padding: 6px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
        }

        .ssbu-option {
          width: 36px;
          height: 36px;
          padding: 2px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: rgba(20, 40, 80, 0.5);
        }

        .ssbu-option:hover {
          border-color: var(--yellow-selected);
          transform: scale(1.4);
          z-index: 10;
          box-shadow: 0 4px 20px rgba(255, 200, 0, 0.4);
          background: rgba(60, 50, 30, 0.8);
        }

        .ssbu-char-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      `}</style>
    </div>
  );
};

export default Players;
