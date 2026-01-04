import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getPlayers, getPlayer, addPlayer, updatePlayer, removePlayer,
  setPlayerImage, COLORS, AVATARS, getAvatar
} from '../data/players';
import { useTournament } from '../context/TournamentContext';
import { useAudio } from '../context/AudioContext';
import { useModal } from '../components/Modal';
import AudioControls from '../components/AudioControls';
import { playMenuSelectSound } from '../utils/sounds';

const TournamentSetup = () => {
  const navigate = useNavigate();
  const { startTournament } = useTournament();
  const { playSound } = useAudio();
  const { showConfirm, showAlert } = useModal();

  const [step, setStep] = useState(1); // 1: joueurs, 2: modes, 3: confirmation
  const [players, setPlayers] = useState({});
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [selectedModes, setSelectedModes] = useState(['ffa', '1v1', 'team_ff', 'team_noff']);
  const [tournamentName, setTournamentName] = useState('');
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showNewPlayer, setShowNewPlayer] = useState(false);
  const [casualNoob, setCasualNoob] = useState(null); // Noob pour le mode Casual
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const fileInputRef = useRef(null);

  const CASUAL_VIP_KEY = 'smash_casual_vip';

  useEffect(() => {
    const loadPlayers = () => {
      const allPlayers = getPlayers();
      setPlayers(allPlayers);
      // Pré-sélectionner les joueurs principaux par défaut
      const mainPlayerIds = Object.entries(allPlayers)
        .filter(([_, p]) => p.isMain)
        .map(([id, _]) => id);
      if (selectedPlayers.length === 0 && mainPlayerIds.length > 0) {
        setSelectedPlayers(mainPlayerIds);
      }
    };
    loadPlayers();
    window.addEventListener('playersUpdate', loadPlayers);
    return () => window.removeEventListener('playersUpdate', loadPlayers);
  }, []);

  const modes = [
    { id: 'ffa', name: 'Free For All', icon: '🎯', desc: '4 joueurs' },
    { id: '1v1', name: '1 vs 1', icon: '⚔️', desc: 'Duels classiques' },
    { id: 'team_ff', name: '2v2 FF', icon: '🔥', desc: 'Équipes avec friendly fire' },
    { id: 'team_noff', name: '2v2 Team', icon: '🤝', desc: 'Équipes sans friendly fire' },
    { id: 'casual', name: 'Casual', icon: '👶', desc: '2v3 Protège le Noob (FF ON + FF OFF)' },
  ];

  const togglePlayer = (playerId) => {
    playSound('select');
    setSelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const toggleMode = (modeId) => {
    playSound('select');
    setSelectedModes(prev =>
      prev.includes(modeId)
        ? prev.filter(id => id !== modeId)
        : [...prev, modeId]
    );
  };

  const handleImageUpload = async (playerId, file) => {
    if (!file) return;

    // Redimensionner l'image avant de la stocker
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 150;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        const result = setPlayerImage(playerId, base64);
        if (result.success) {
          setPlayers(getPlayers());
          playSound('confirm');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) return;

    const result = addPlayer({
      name: newPlayerName.trim(),
      isMain: true
    });

    if (result.success) {
      setSelectedPlayers(prev => [...prev, result.player.id]);
      setNewPlayerName('');
      setShowNewPlayer(false);
      setPlayers(getPlayers());
      playSound('confirm');
    }
  };

  const handleDeletePlayer = (playerId) => {
    showConfirm(`Supprimer ${getPlayer(playerId)?.name} ?`, () => {
      removePlayer(playerId);
      setSelectedPlayers(prev => prev.filter(id => id !== playerId));
      setPlayers(getPlayers());
      playSound('cancel');
    });
  };

  const handleStart = () => {
    if (selectedPlayers.length < 2) {
      showAlert('Sélectionne au moins 2 joueurs !');
      return;
    }
    if (selectedModes.length === 0) {
      showAlert('Sélectionne au moins 1 mode de jeu !');
      return;
    }
    // Vérifier qu'un noob est sélectionné si le mode Casual est activé
    if (selectedModes.includes('casual') && !casualNoob) {
      showAlert('Sélectionne le Noob pour le mode Casual !');
      return;
    }

    // Mettre à jour isMain pour les joueurs sélectionnés
    Object.keys(players).forEach(id => {
      updatePlayer(id, { isMain: selectedPlayers.includes(id) });
    });

    // Sauvegarder le noob pour le mode Casual
    if (selectedModes.includes('casual') && casualNoob) {
      localStorage.setItem(CASUAL_VIP_KEY, casualNoob);
    } else {
      localStorage.removeItem(CASUAL_VIP_KEY);
    }

    startTournament({
      name: tournamentName || `Tournoi du ${new Date().toLocaleDateString('fr-FR')}`,
      players: selectedPlayers,
      modes: selectedModes,
    });

    // Jouer le son du countdown immédiatement
    const countdownSound = new Audio('/audio/3-2-1-go.mp3');
    countdownSound.volume = 0.7;
    countdownSound.play().catch(() => {});

    // Lancer le countdown visuel 0.2s plus tard
    setTimeout(() => {
      setShowCountdown(true);
      setCountdown(3);

      // Animation du countdown
      let count = 3;
      const interval = setInterval(() => {
        count--;
        if (count >= 0) {
          setCountdown(count);
        }

        if (count < 0) {
          clearInterval(interval);
          playMenuSelectSound();
          // Naviguer vers le menu principal après le "GO!"
          setTimeout(() => {
            navigate('/');
          }, 500);
        }
      }, 1000);
    }, 200); // Décalage de 0.2s pour le visuel
  };

  const renderPlayerCard = (playerId) => {
    const player = players[playerId];
    if (!player) return null;

    const isSelected = selectedPlayers.includes(playerId);
    const avatar = getAvatar(player.avatar);

    return (
      <div
        key={playerId}
        className={`player-setup-card ${isSelected ? 'selected' : ''}`}
        style={{ '--player-color': player.color }}
      >
        <div className="player-select-checkbox" onClick={() => togglePlayer(playerId)}>
          <div className={`checkbox ${isSelected ? 'checked' : ''}`}>
            {isSelected && '✓'}
          </div>
        </div>

        <div
          className="player-avatar-container"
          onClick={() => {
            fileInputRef.current.dataset.playerId = playerId;
            fileInputRef.current.click();
          }}
        >
          {player.image ? (
            <img src={player.image} alt={player.name} className="player-image" />
          ) : (
            <div className="player-avatar-fallback" style={{ background: player.color }}>
              {avatar?.icon || player.initial}
            </div>
          )}
          <div className="avatar-upload-hint">Changer</div>
        </div>

        <div className="player-info">
          <div className="player-name">{player.name}</div>
          <div className="player-actions">
            <button
              className="mini-btn edit"
              onClick={() => setEditingPlayer(playerId)}
            >
              Modifier
            </button>
            <button
              className="mini-btn delete"
              onClick={() => handleDeletePlayer(playerId)}
            >
              X
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEditModal = () => {
    if (!editingPlayer) return null;
    const player = players[editingPlayer];
    if (!player) return null;

    return (
      <div className="modal-overlay" onClick={() => setEditingPlayer(null)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h3>Modifier {player.name}</h3>

          <div className="form-group">
            <label>Couleur</label>
            <div className="color-picker">
              {COLORS.map(color => (
                <button
                  key={color}
                  className={`color-btn ${player.color === color ? 'selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => {
                    updatePlayer(editingPlayer, { color });
                    setPlayers(getPlayers());
                  }}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Avatar</label>
            <div className="avatar-picker">
              {AVATARS.map(av => (
                <button
                  key={av.id}
                  className={`avatar-btn ${player.avatar === av.id ? 'selected' : ''}`}
                  onClick={() => {
                    updatePlayer(editingPlayer, { avatar: av.id });
                    setPlayers(getPlayers());
                  }}
                >
                  {av.icon}
                </button>
              ))}
            </div>
          </div>

          <button className="close-modal-btn" onClick={() => setEditingPlayer(null)}>
            Fermer
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="home-page">
      <div className="melee-main-frame dashboard-frame" style={{ maxWidth: '900px' }}>
        <div className="melee-header">
          <h1 className="melee-logo">Nouveau Tournoi</h1>
          <div className="melee-header-line" />
        </div>

        {/* Steps indicator */}
        <div className="steps-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Joueurs</div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Modes</div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Go!</div>
        </div>

        {/* Step 1: Joueurs */}
        {step === 1 && (
          <div className="setup-step">
            <div className="step-header">
              <h2>Qui participe ?</h2>
              <span className="badge">{selectedPlayers.length} joueurs</span>
            </div>

            <div className="players-grid">
              {Object.keys(players).map(renderPlayerCard)}

              {/* Ajouter un joueur */}
              {showNewPlayer ? (
                <div className="new-player-form">
                  <input
                    type="text"
                    placeholder="Nom du joueur"
                    value={newPlayerName}
                    onChange={e => setNewPlayerName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddPlayer()}
                    autoFocus
                  />
                  <button onClick={handleAddPlayer}>OK</button>
                  <button onClick={() => { setShowNewPlayer(false); setNewPlayerName(''); }}>X</button>
                </div>
              ) : (
                <button className="add-player-btn" onClick={() => setShowNewPlayer(true)}>
                  + Nouveau joueur
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={(e) => {
                const playerId = e.target.dataset.playerId;
                if (playerId && e.target.files[0]) {
                  handleImageUpload(playerId, e.target.files[0]);
                }
                e.target.value = '';
              }}
            />
          </div>
        )}

        {/* Step 2: Modes */}
        {step === 2 && (
          <div className="setup-step">
            <div className="step-header">
              <h2>Modes de jeu</h2>
              <span className="badge">{selectedModes.length} modes</span>
            </div>

            <div className="modes-grid">
              {modes.map(mode => (
                <button
                  key={mode.id}
                  className={`mode-card ${selectedModes.includes(mode.id) ? 'selected' : ''}`}
                  onClick={() => toggleMode(mode.id)}
                >
                  <div className="mode-icon">{mode.icon}</div>
                  <div className="mode-name">{mode.name}</div>
                  <div className="mode-desc">{mode.desc}</div>
                  {selectedModes.includes(mode.id) && (
                    <div className="mode-check">✓</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="setup-step">
            <div className="step-header">
              <h2>Prêt à jouer ?</h2>
            </div>

            <div className="confirmation-box">
              <div className="form-group">
                <label>Nom du tournoi (optionnel)</label>
                <input
                  type="text"
                  placeholder={`Tournoi du ${new Date().toLocaleDateString('fr-FR')}`}
                  value={tournamentName}
                  onChange={e => setTournamentName(e.target.value)}
                  className="tournament-name-input"
                />
              </div>

              {/* Sélection du Noob si mode Casual activé */}
              {selectedModes.includes('casual') && (
                <div className="form-group noob-selection">
                  <label>👶 Choisir le Noob pour le mode Casual</label>
                  <div className="noob-options">
                    {selectedPlayers.map(id => {
                      const player = players[id];
                      if (!player) return null;
                      return (
                        <button
                          key={id}
                          className={`noob-btn ${casualNoob === id ? 'selected' : ''}`}
                          onClick={() => {
                            setCasualNoob(id);
                            playSound('select');
                          }}
                          style={{ '--player-color': player.color }}
                        >
                          <div className="noob-avatar" style={{ background: player.color }}>
                            {player.initial}
                          </div>
                          <span className="noob-name">{player.name}</span>
                          {casualNoob === id && <span className="noob-check">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                  {!casualNoob && (
                    <p className="noob-hint">Le noob sera protégé par 2 joueurs contre 2 chasseurs</p>
                  )}
                </div>
              )}

              <div className="summary">
                <div className="summary-item">
                  <span className="label">Joueurs</span>
                  <span className="value">
                    {selectedPlayers.map(id => players[id]?.name).join(', ')}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="label">Modes</span>
                  <span className="value">
                    {selectedModes.map(id => modes.find(m => m.id === id)?.name).join(', ')}
                  </span>
                </div>
                {casualNoob && (
                  <div className="summary-item">
                    <span className="label">Noob</span>
                    <span className="value" style={{ color: players[casualNoob]?.color }}>
                      {players[casualNoob]?.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="warning-box">
                Les scores seront remis à zéro pour ce tournoi.
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="setup-navigation">
          {step > 1 && (
            <button className="nav-btn prev" onClick={() => { playMenuSelectSound(); setStep(step - 1); }}>
              ← Retour
            </button>
          )}

          {step < 3 ? (
            <button
              className="nav-btn next"
              onClick={() => { playMenuSelectSound(); setStep(step + 1); }}
              disabled={step === 1 && selectedPlayers.length < 2}
            >
              Suivant →
            </button>
          ) : (
            <button className="nav-btn go" onClick={handleStart}>
              GO !
            </button>
          )}
        </div>
      </div>

      <Link to="/" className="back-btn" onClick={playMenuSelectSound}>
        ← Annuler
      </Link>

      {renderEditModal()}

      {/* Countdown Overlay */}
      {showCountdown && (
        <div className="countdown-overlay">
          <div className="countdown-flash" key={countdown}></div>
          <div className="countdown-content">
            <div className="countdown-number" key={countdown}>
              {countdown > 0 ? countdown : 'GO!'}
            </div>
          </div>
        </div>
      )}

      <AudioControls />

      <style>{`
        .steps-indicator {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 25px;
          padding: 15px;
          background: rgba(0, 40, 80, 0.3);
          border-radius: 8px;
        }

        .step {
          padding: 8px 20px;
          border-radius: 20px;
          font-family: 'Oswald', sans-serif;
          color: rgba(255,255,255,0.4);
          border: 2px solid transparent;
        }

        .step.active {
          color: var(--yellow-selected);
          border-color: var(--yellow-selected);
          background: rgba(255, 200, 0, 0.1);
        }

        .setup-step {
          min-height: 350px;
        }

        .step-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .step-header h2 {
          font-family: 'Oswald', sans-serif;
          color: var(--cyan-light);
          font-size: 1.3rem;
        }

        .badge {
          background: rgba(0, 150, 180, 0.3);
          color: var(--cyan-light);
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.85rem;
        }

        .players-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }

        .player-setup-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: rgba(6, 18, 35, 0.7);
          border: 2px solid rgba(100, 150, 200, 0.3);
          border-radius: 8px;
          transition: all 0.15s;
        }

        .player-setup-card.selected {
          border-color: var(--yellow-selected);
          background: rgba(100, 80, 30, 0.3);
        }

        .player-select-checkbox {
          cursor: pointer;
        }

        .checkbox {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--yellow-selected);
          font-weight: bold;
        }

        .checkbox.checked {
          background: var(--yellow-selected);
          color: #1a1a1a;
          border-color: var(--yellow-selected);
        }

        .player-avatar-container {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          overflow: hidden;
          cursor: pointer;
          position: relative;
          border: 2px solid var(--player-color);
        }

        .player-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .player-avatar-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          color: #1a1a1a;
        }

        .avatar-upload-hint {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0,0,0,0.7);
          color: white;
          font-size: 0.6rem;
          text-align: center;
          padding: 2px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .player-avatar-container:hover .avatar-upload-hint {
          opacity: 1;
        }

        .player-info {
          flex: 1;
          min-width: 0;
        }

        .player-name {
          font-family: 'Oswald', sans-serif;
          font-size: 1rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .player-actions {
          display: flex;
          gap: 5px;
          margin-top: 5px;
        }

        .mini-btn {
          padding: 3px 8px;
          font-size: 0.7rem;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(0,0,0,0.3);
          color: white;
          border-radius: 3px;
          cursor: pointer;
        }

        .mini-btn:hover {
          background: rgba(255,255,255,0.1);
        }

        .mini-btn.delete {
          color: #ff6b6b;
          border-color: #ff6b6b;
        }

        .new-player-form {
          display: flex;
          gap: 5px;
          padding: 10px;
          background: rgba(6, 18, 35, 0.7);
          border: 2px dashed var(--cyan-light);
          border-radius: 8px;
        }

        .new-player-form input {
          flex: 1;
          padding: 8px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(0,0,0,0.3);
          color: white;
          border-radius: 4px;
        }

        .new-player-form button {
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .new-player-form button:first-of-type {
          background: var(--yellow-selected);
          color: #1a1a1a;
        }

        .add-player-btn {
          padding: 20px;
          background: transparent;
          border: 2px dashed rgba(100, 150, 200, 0.3);
          border-radius: 8px;
          color: var(--cyan-light);
          cursor: pointer;
          font-family: 'Oswald', sans-serif;
        }

        .add-player-btn:hover {
          border-color: var(--cyan-light);
        }

        .modes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
        }

        .mode-card {
          padding: 20px 15px;
          background: rgba(6, 18, 35, 0.7);
          border: 2px solid rgba(100, 150, 200, 0.3);
          border-radius: 8px;
          text-align: center;
          cursor: pointer;
          position: relative;
          transition: all 0.15s;
        }

        .mode-card:hover {
          border-color: var(--cyan-light);
        }

        .mode-card.selected {
          border-color: var(--yellow-selected);
          background: rgba(100, 80, 30, 0.3);
        }

        .mode-icon {
          font-size: 2rem;
          margin-bottom: 8px;
        }

        .mode-name {
          font-family: 'Oswald', sans-serif;
          font-size: 1rem;
          margin-bottom: 4px;
        }

        .mode-desc {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.5);
        }

        .mode-check {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          background: var(--yellow-selected);
          color: #1a1a1a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .confirmation-box {
          background: rgba(6, 18, 35, 0.7);
          border: 2px solid rgba(100, 150, 200, 0.3);
          border-radius: 8px;
          padding: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: var(--cyan-light);
          font-size: 0.9rem;
        }

        .tournament-name-input {
          width: 100%;
          padding: 12px;
          border: 2px solid rgba(100, 150, 200, 0.3);
          background: rgba(0,0,0,0.3);
          color: white;
          border-radius: 6px;
          font-family: 'Oswald', sans-serif;
          font-size: 1.1rem;
        }

        .summary {
          margin-bottom: 20px;
        }

        .summary-item {
          display: flex;
          padding: 10px 0;
          border-bottom: 1px solid rgba(100, 150, 200, 0.2);
        }

        .summary-item .label {
          width: 100px;
          color: rgba(255,255,255,0.5);
        }

        .summary-item .value {
          flex: 1;
          color: var(--yellow-selected);
        }

        .warning-box {
          background: rgba(255, 100, 100, 0.1);
          border: 1px solid rgba(255, 100, 100, 0.3);
          color: #ff9999;
          padding: 12px;
          border-radius: 6px;
          text-align: center;
          font-size: 0.9rem;
        }

        .setup-navigation {
          display: flex;
          justify-content: space-between;
          margin-top: 25px;
          gap: 15px;
        }

        .nav-btn {
          padding: 12px 30px;
          border: 2px solid;
          border-radius: 6px;
          font-family: 'Oswald', sans-serif;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.15s;
        }

        .nav-btn.prev {
          background: transparent;
          border-color: rgba(100, 150, 200, 0.4);
          color: var(--cyan-light);
        }

        .nav-btn.next {
          background: linear-gradient(180deg, rgba(0, 150, 180, 0.3), rgba(0, 100, 130, 0.5));
          border-color: var(--cyan-light);
          color: white;
          margin-left: auto;
        }

        .nav-btn.go {
          background: linear-gradient(180deg, #ffe840 0%, #d0a800 100%);
          border-color: #ffe860;
          color: #181008;
          margin-left: auto;
          font-size: 1.3rem;
          padding: 15px 50px;
        }

        .nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: linear-gradient(180deg, #1a2a4a 0%, #0a1525 100%);
          border: 2px solid var(--cyan-light);
          border-radius: 10px;
          padding: 25px;
          max-width: 400px;
          width: 90%;
        }

        .modal-content h3 {
          color: var(--yellow-selected);
          margin-bottom: 20px;
          font-family: 'Oswald', sans-serif;
        }

        .color-picker, .avatar-picker {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .color-btn {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          border: 3px solid transparent;
          cursor: pointer;
        }

        .color-btn.selected {
          border-color: white;
          box-shadow: 0 0 10px currentColor;
        }

        .avatar-btn {
          width: 45px;
          height: 45px;
          font-size: 1.5rem;
          background: rgba(0,0,0,0.3);
          border: 2px solid transparent;
          border-radius: 8px;
          cursor: pointer;
        }

        .avatar-btn.selected {
          border-color: var(--yellow-selected);
          background: rgba(100, 80, 30, 0.4);
        }

        .close-modal-btn {
          width: 100%;
          padding: 12px;
          margin-top: 20px;
          background: rgba(0, 150, 180, 0.3);
          border: 1px solid var(--cyan-light);
          color: white;
          border-radius: 6px;
          cursor: pointer;
        }

        /* Noob Selection */
        .noob-selection {
          background: rgba(255, 200, 0, 0.1);
          border: 2px solid rgba(255, 200, 0, 0.3);
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .noob-selection label {
          color: var(--yellow-selected) !important;
          font-size: 1rem !important;
          display: block;
          margin-bottom: 12px;
        }

        .noob-options {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .noob-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 15px;
          background: rgba(6, 18, 35, 0.7);
          border: 2px solid rgba(100, 150, 200, 0.3);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .noob-btn:hover {
          border-color: var(--player-color);
        }

        .noob-btn.selected {
          border-color: var(--yellow-selected);
          background: rgba(255, 200, 0, 0.2);
        }

        .noob-avatar {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1a1a1a;
          font-weight: 600;
        }

        .noob-name {
          font-family: 'Oswald', sans-serif;
          color: white;
        }

        .noob-check {
          color: var(--yellow-selected);
          font-weight: bold;
        }

        .noob-hint {
          margin-top: 10px;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
          font-style: italic;
        }

        /* Countdown Overlay */
        .countdown-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          z-index: 10000;
        }

        .countdown-flash {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(255, 255, 255, 0.8) 0%, transparent 50%);
          animation: flashPulse 1s ease-out;
        }

        @keyframes flashPulse {
          0% { opacity: 1; transform: scale(0.5); }
          50% { opacity: 0.8; }
          100% { opacity: 0; transform: scale(2); }
        }

        .countdown-content {
          text-align: center;
        }

        .countdown-number {
          font-family: 'Oswald', sans-serif;
          font-size: 15rem;
          font-weight: 900;
          color: var(--yellow-selected);
          text-shadow: 0 0 100px rgba(255, 200, 0, 1), 5px 5px 0 #8b6914;
          animation: countdownBeat 1s ease-out;
        }

        @keyframes countdownBeat {
          0% { transform: scale(2); opacity: 0; }
          50% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TournamentSetup;
