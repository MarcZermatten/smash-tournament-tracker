import { useState, useRef } from 'react';
import { useAudio } from '../hooks/useAudio';
import { exportData, importData, resetSeason, loadData } from '../data/storage';
import BackButton from '../components/BackButton';

const Options = () => {
  const { soundEnabled, musicEnabled, volume, toggleSound, toggleMusic, changeVolume } = useAudio();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const fileInputRef = useRef(null);

  const handleExport = () => {
    exportData();
    setImportStatus({ type: 'success', message: 'Données exportées !' });
    setTimeout(() => setImportStatus(null), 3000);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = importData(event.target?.result);
      if (result) {
        setImportStatus({ type: 'success', message: 'Données importées avec succès !' });
        window.dispatchEvent(new Event('scoreUpdate'));
      } else {
        setImportStatus({ type: 'error', message: 'Erreur lors de l\'import' });
      }
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    resetSeason();
    setShowResetConfirm(false);
    window.dispatchEvent(new Event('scoreUpdate'));
    setImportStatus({ type: 'success', message: 'Saison réinitialisée !' });
    setTimeout(() => setImportStatus(null), 3000);
  };

  const data = loadData();
  const totalMatches = data.matches.length;

  return (
    <div className="page options-page">
      <div className="page-content">
        <h1 className="melee-title" style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
          ⚙️ Options
        </h1>

        {/* Audio Settings */}
        <section className="melee-frame mb-2">
          <h2 className="melee-frame-header">🔊 Audio</h2>

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
        </section>

        {/* Data Management */}
        <section className="melee-frame mb-2">
          <h2 className="melee-frame-header">💾 Données</h2>

          <p className="text-cyan mb-1">
            {totalMatches} partie{totalMatches > 1 ? 's' : ''} enregistrée{totalMatches > 1 ? 's' : ''}
          </p>

          <div className="data-buttons">
            <button className="melee-button" onClick={handleExport}>
              📤 Exporter (JSON)
            </button>

            <button className="melee-button" onClick={() => fileInputRef.current?.click()}>
              📥 Importer
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </div>

          {importStatus && (
            <div className={`status-message ${importStatus.type}`}>
              {importStatus.message}
            </div>
          )}
        </section>

        {/* Danger Zone */}
        <section className="melee-frame danger-zone">
          <h2 className="melee-frame-header" style={{ color: '#FF6B6B' }}>⚠️ Zone Danger</h2>

          {showResetConfirm ? (
            <div className="reset-confirm">
              <p className="text-orange mb-1">Êtes-vous sûr ? Toutes les données seront perdues !</p>
              <div className="confirm-buttons">
                <button
                  className="melee-button"
                  onClick={() => setShowResetConfirm(false)}
                  style={{ flex: 1 }}
                >
                  ❌ Annuler
                </button>
                <button
                  className="melee-button danger"
                  onClick={handleReset}
                  style={{ flex: 1 }}
                >
                  🗑️ Confirmer Reset
                </button>
              </div>
            </div>
          ) : (
            <button
              className="melee-button danger"
              onClick={() => setShowResetConfirm(true)}
            >
              🗑️ Réinitialiser la saison
            </button>
          )}
        </section>

        {/* Credits */}
        <section className="credits text-center mt-2">
          <p className="text-cyan" style={{ fontSize: '0.9rem' }}>
            Smash Tournament Tracker
          </p>
          <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>
            Fait avec ❤️ pour Marc, Max, Flo, Boris & Daniel
          </p>
        </section>
      </div>

      <BackButton to="/" />

      <style>{`
        .options-page {
          min-height: 100vh;
          padding: 2rem;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 3rem;
        }

        .page-content {
          width: 100%;
          max-width: 500px;
          animation: fadeIn 0.3s ease-out;
        }

        .option-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.8rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .option-row:last-child {
          border-bottom: none;
        }

        .toggle-btn {
          padding: 0.4rem 1rem;
          font-family: 'Russo One', sans-serif;
          font-size: 0.9rem;
          border: 2px solid;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 70px;
        }

        .toggle-btn.on {
          background: var(--gradient-gold);
          border-color: var(--melee-gold);
          color: #1a0a2e;
        }

        .toggle-btn.off {
          background: transparent;
          border-color: rgba(255,255,255,0.3);
          color: rgba(255,255,255,0.5);
        }

        .volume-control {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        .volume-slider {
          width: 120px;
          height: 6px;
          -webkit-appearance: none;
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
          outline: none;
        }

        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          background: var(--melee-gold);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px var(--melee-gold);
        }

        .volume-value {
          min-width: 40px;
          text-align: right;
          font-family: 'Orbitron', sans-serif;
          color: var(--melee-gold);
        }

        .data-buttons {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .data-buttons .melee-button {
          flex: 1;
          padding: 0.6rem;
          font-size: 0.9rem;
        }

        .status-message {
          margin-top: 0.8rem;
          padding: 0.5rem;
          text-align: center;
          border-radius: 4px;
        }

        .status-message.success {
          background: rgba(78, 205, 196, 0.2);
          color: var(--melee-cyan);
        }

        .status-message.error {
          background: rgba(255, 107, 107, 0.2);
          color: #FF6B6B;
        }

        .danger-zone {
          border-color: #FF6B6B;
        }

        .melee-button.danger {
          background: linear-gradient(180deg, #8B0000 0%, #4a0000 100%);
          border-color: #FF6B6B;
        }

        .melee-button.danger:hover {
          background: linear-gradient(180deg, #a00000 0%, #600000 100%);
          box-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
        }

        .confirm-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .credits {
          opacity: 0.8;
        }

        @media (max-width: 400px) {
          .data-buttons {
            flex-direction: column;
          }

          .volume-control {
            flex-direction: column;
            align-items: flex-end;
            gap: 0.3rem;
          }

          .volume-slider {
            width: 100px;
          }
        }
      `}</style>
    </div>
  );
};

export default Options;
