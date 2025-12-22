import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getPlayers,
  getPlayer,
  getAvatar,
  addPlayer,
  updatePlayer,
  removePlayer,
  resetPlayers,
  AVATARS,
  COLORS
} from '../data/players';
import { useAudio } from '../hooks/useAudio';

const Players = () => {
  const [players, setPlayers] = useState(getPlayers());
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ name: '', color: COLORS[0], avatar: 'fox', isMain: true });
  const [message, setMessage] = useState(null);
  const { playSound } = useAudio();

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
      playSound('confirm');
      showMessage(`${newPlayer.name} ajouté !`);
      setNewPlayer({ name: '', color: COLORS[Object.keys(players).length % COLORS.length], avatar: 'fox', isMain: true });
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
    if (window.confirm(`Supprimer ${player.name} ?`)) {
      removePlayer(id);
      playSound('cancel');
      showMessage(`${player.name} supprimé`);
      setPlayers(getPlayers());
      setEditingPlayer(null);
    }
  };

  const handleReset = () => {
    if (window.confirm('Réinitialiser tous les joueurs aux valeurs par défaut ?')) {
      resetPlayers();
      playSound('confirm');
      showMessage('Joueurs réinitialisés');
      setPlayers(getPlayers());
    }
  };

  const playerList = Object.values(players);

  return (
    <div className="home-page">
      <div className="melee-main-frame players-frame">
        {/* Header */}
        <div className="melee-header">
          <h1 className="melee-logo">Joueurs</h1>
          <div className="melee-header-line" />
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

              return (
                <div
                  key={player.id}
                  className={`player-row ${isEditing ? 'editing' : ''} ${player.isMain ? 'main' : 'casual'}`}
                  onClick={() => !isEditing && setEditingPlayer(player.id)}
                >
                  {/* Avatar */}
                  <div className="player-row-avatar" style={{ background: player.color }}>
                    {avatar?.icon || player.initial}
                  </div>

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
                      {/* Sélection avatar */}
                      <div className="edit-section">
                        <span className="edit-label">Avatar</span>
                        <div className="avatar-grid">
                          {AVATARS.map(av => (
                            <button
                              key={av.id}
                              className={`avatar-option ${player.avatar === av.id ? 'selected' : ''}`}
                              onClick={() => handleUpdatePlayer(player.id, { avatar: av.id })}
                              title={av.name}
                            >
                              {av.icon}
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
                <label>Avatar</label>
                <div className="avatar-grid">
                  {AVATARS.map(av => (
                    <button
                      key={av.id}
                      className={`avatar-option ${newPlayer.avatar === av.id ? 'selected' : ''}`}
                      onClick={() => setNewPlayer({ ...newPlayer, avatar: av.id })}
                      title={av.name}
                    >
                      {av.icon}
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
      <Link to="/" className="back-btn">
        &larr; Menu
      </Link>
    </div>
  );
};

export default Players;
