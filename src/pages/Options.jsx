import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAudio } from '../hooks/useAudio';
import { exportData, importData, resetSeason, loadData } from '../data/storage';

const Options = () => {
  const { soundEnabled, musicEnabled, volume, toggleSound, toggleMusic, changeVolume } = useAudio();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const fileInputRef = useRef(null);

  const handleExport = () => {
    exportData();
    setImportStatus({ type: 'success', message: 'Donnees exportees !' });
    setTimeout(() => setImportStatus(null), 3000);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = importData(event.target?.result);
      if (result) {
        setImportStatus({ type: 'success', message: 'Donnees importees avec succes !' });
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
    setImportStatus({ type: 'success', message: 'Saison reinitialisee !' });
    setTimeout(() => setImportStatus(null), 3000);
  };

  const data = loadData();
  const totalMatches = data.matches.length;

  return (
    <div className="sub-page">
      <div className="sub-page-frame" style={{ maxWidth: '600px' }}>
        <div className="sub-page-header">
          <h1 className="sub-page-title">Options</h1>
        </div>

        <div className="sub-page-content">
          {/* Audio Settings */}
          <div className="sub-section">
            <div className="sub-section-header">Audio</div>

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
          </div>

          {/* Data Management */}
          <div className="sub-section">
            <div className="sub-section-header">Donnees</div>

            <p style={{ color: 'var(--cyan-light)', marginBottom: '1rem' }}>
              {totalMatches} partie{totalMatches > 1 ? 's' : ''} enregistree{totalMatches > 1 ? 's' : ''}
            </p>

            <div className="data-buttons">
              <button className="melee-button" onClick={handleExport}>
                Exporter (JSON)
              </button>

              <button className="melee-button" onClick={() => fileInputRef.current?.click()}>
                Importer
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
          </div>

          {/* Danger Zone */}
          <div className="sub-section danger-zone">
            <div className="sub-section-header" style={{ color: '#ff6b6b' }}>Zone Danger</div>

            {showResetConfirm ? (
              <div className="reset-confirm">
                <p style={{ color: '#f0a050', marginBottom: '1rem' }}>
                  Etes-vous sur ? Toutes les donnees seront perdues !
                </p>
                <div className="confirm-buttons">
                  <button
                    className="melee-button"
                    onClick={() => setShowResetConfirm(false)}
                  >
                    Annuler
                  </button>
                  <button
                    className="melee-button danger"
                    onClick={handleReset}
                  >
                    Confirmer Reset
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="melee-button danger"
                onClick={() => setShowResetConfirm(true)}
              >
                Reinitialiser la saison
              </button>
            )}
          </div>

          {/* Credits */}
          <div className="credits">
            <p style={{ color: 'var(--cyan-light)', fontSize: '0.95rem' }}>
              Smash Tournament Tracker
            </p>
            <p style={{ fontSize: '0.85rem', opacity: 0.5 }}>
              Fait avec amour pour Marc, Max, Flo, Boris & Daniel
            </p>
          </div>
        </div>
      </div>

      <Link to="/" className="back-btn">
        Retour
      </Link>

      <style>{`
        .option-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          font-family: 'Oswald', sans-serif;
          font-size: 1.1rem;
        }

        .option-row:last-child {
          border-bottom: none;
        }

        .toggle-btn {
          padding: 8px 20px;
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

        .data-buttons {
          display: flex;
          gap: 10px;
        }

        .data-buttons .melee-button {
          flex: 1;
        }

        .status-message {
          margin-top: 12px;
          padding: 10px;
          text-align: center;
          border-radius: 4px;
          font-family: 'Oswald', sans-serif;
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

        .danger-zone {
          border-color: rgba(255, 107, 107, 0.5);
        }

        .melee-button.danger {
          background: linear-gradient(180deg, #8b0000 0%, #4a0000 100%);
          border-color: #ff6b6b;
        }

        .melee-button.danger:hover {
          background: linear-gradient(180deg, #a00000 0%, #600000 100%);
          box-shadow: 0 0 20px rgba(255, 107, 107, 0.4);
        }

        .confirm-buttons {
          display: flex;
          gap: 10px;
        }

        .confirm-buttons .melee-button {
          flex: 1;
        }

        .credits {
          text-align: center;
          padding-top: 10px;
        }
      `}</style>
    </div>
  );
};

export default Options;
