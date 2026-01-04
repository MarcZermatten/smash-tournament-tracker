import { useState, useEffect } from 'react';
import Icon from './Icon';

/**
 * Composant réutilisable pour ajuster le layout des pages
 * @param {string} pageKey - Clé unique pour stocker le layout (ex: 'home', '1v1', 'ffa')
 * @param {object} defaultLayout - Layout par défaut
 * @param {array} controls - Configuration des contrôles [{key, label, min, max, step, unit}]
 * @param {function} onLayoutChange - Callback quand le layout change
 */
const LayoutEditor = ({ pageKey, defaultLayout, controls, onLayoutChange }) => {
  const storageKey = `smash_layout_${pageKey}`;

  const [layout, setLayout] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return { ...defaultLayout, ...JSON.parse(saved) };
    } catch (e) {}
    return defaultLayout;
  });

  const [devMode, setDevMode] = useState(() =>
    localStorage.getItem('smash_dev_layout') === 'true'
  );

  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [isCompact, setIsCompact] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [importText, setImportText] = useState('');

  // Écouter les changements du mode dev
  useEffect(() => {
    const handleDevModeChange = () => {
      setDevMode(localStorage.getItem('smash_dev_layout') === 'true');
    };
    window.addEventListener('devModeChange', handleDevModeChange);
    return () => window.removeEventListener('devModeChange', handleDevModeChange);
  }, []);

  // Notifier le parent quand le layout change
  useEffect(() => {
    onLayoutChange?.(layout);
  }, [layout, onLayoutChange]);

  const updateLayout = (key, value) => {
    setLayout(prev => {
      const newLayout = { ...prev, [key]: Number(value) };
      localStorage.setItem(storageKey, JSON.stringify(newLayout));
      return newLayout;
    });
  };

  const resetLayout = () => {
    setLayout(defaultLayout);
    localStorage.removeItem(storageKey);
  };

  const copyConfig = () => {
    const config = JSON.stringify(layout, null, 2);
    navigator.clipboard.writeText(config);
  };

  const exportConfig = () => {
    const config = JSON.stringify(layout, null, 2);
    setImportText(config);
    setShowImportExport(true);
  };

  const importConfig = () => {
    try {
      const imported = JSON.parse(importText);
      setLayout({ ...defaultLayout, ...imported });
      localStorage.setItem(storageKey, JSON.stringify({ ...defaultLayout, ...imported }));
      setShowImportExport(false);
      setImportText('');
    } catch (e) {
      alert('Configuration invalide!');
    }
  };

  const toggleGroup = (group) => {
    setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  if (!devMode) return null;

  // Grouper les contrôles par catégorie (si définie)
  const groupedControls = controls.reduce((acc, ctrl) => {
    const group = ctrl.group || 'Général';
    if (!acc[group]) acc[group] = [];
    acc[group].push(ctrl);
    return acc;
  }, {});

  return (
    <>
      <div className={`layout-editor ${isCompact ? 'compact' : ''}`}>
        <div className="layout-editor-header">
          <span className="layout-editor-title">
            <Icon name="settings" size={16} /> Layout - {pageKey}
          </span>
          <div className="layout-editor-actions">
            <button onClick={() => setIsCompact(!isCompact)} title={isCompact ? "Mode étendu" : "Mode compact"}>
              <Icon name={isCompact ? "maximize" : "minimize"} size={14} />
            </button>
            <button onClick={exportConfig} title="Export/Import">
              <Icon name="download" size={14} />
            </button>
            <button onClick={copyConfig} title="Copier config">
              <Icon name="clipboard" size={14} />
            </button>
            <button onClick={resetLayout} title="Reset">
              <Icon name="refresh" size={14} />
            </button>
          </div>
        </div>

        <div className="layout-editor-body">
          {Object.entries(groupedControls).map(([group, ctrls]) => (
            <div key={group} className="layout-group">
              <div
                className="layout-group-title"
                onClick={() => toggleGroup(group)}
                style={{ cursor: 'pointer' }}
              >
                <Icon name={collapsedGroups[group] ? "chevronRight" : "chevronDown"} size={12} />
                {group}
                <span className="group-count">({ctrls.length})</span>
              </div>
              {!collapsedGroups[group] && (
                <div className="layout-group-controls">
                  {ctrls.map(ctrl => (
                    <div key={ctrl.key} className="layout-control">
                      <label>
                        {ctrl.label}
                        <span className="layout-value">
                          {layout[ctrl.key]}{ctrl.unit || ''}
                        </span>
                      </label>
                      <div className="control-inputs">
                        <input
                          type="range"
                          min={ctrl.min}
                          max={ctrl.max}
                          step={ctrl.step || 1}
                          value={layout[ctrl.key]}
                          onChange={(e) => updateLayout(ctrl.key, e.target.value)}
                        />
                        <input
                          type="number"
                          min={ctrl.min}
                          max={ctrl.max}
                          step={ctrl.step || 1}
                          value={layout[ctrl.key]}
                          onChange={(e) => updateLayout(ctrl.key, e.target.value)}
                          className="number-input"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="layout-editor-footer">
          <div className="layout-stats">
            {Object.keys(layout).length} paramètres
          </div>
        </div>
      </div>

      {/* Modal Import/Export */}
      {showImportExport && (
        <div className="layout-modal-overlay" onClick={() => setShowImportExport(false)}>
          <div className="layout-modal" onClick={e => e.stopPropagation()}>
            <div className="layout-modal-header">
              <h3>Export / Import Configuration</h3>
              <button onClick={() => setShowImportExport(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="layout-modal-body">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Coller la configuration JSON ici..."
                rows={15}
              />
            </div>
            <div className="layout-modal-footer">
              <button onClick={importConfig} className="btn-import">
                <Icon name="download" size={14} /> Importer
              </button>
              <button onClick={() => {
                setImportText(JSON.stringify(layout, null, 2));
              }} className="btn-export">
                <Icon name="clipboard" size={14} /> Copier l'export
              </button>
              <button onClick={() => setShowImportExport(false)} className="btn-cancel">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .layout-editor {
          position: fixed;
          top: 100px;
          right: 20px;
          width: 350px;
          max-height: 70vh;
          background: rgba(10, 20, 40, 0.98);
          border: 2px solid var(--cyan);
          border-radius: 10px;
          z-index: 9999;
          font-size: 0.85rem;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }

        .layout-editor.compact {
          width: 280px;
          max-height: 400px;
          font-size: 0.75rem;
        }

        .layout-editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 15px;
          background: rgba(0, 150, 180, 0.3);
          border-bottom: 1px solid var(--cyan);
        }

        .layout-editor-title {
          font-family: 'Oswald', sans-serif;
          color: var(--cyan-light);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .layout-editor-actions {
          display: flex;
          gap: 5px;
        }

        .layout-editor-actions button {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          padding: 6px 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .layout-editor-actions button:hover {
          background: rgba(0, 0, 0, 0.5);
          border-color: var(--cyan);
          transform: scale(1.05);
        }

        .layout-editor-body {
          padding: 12px;
          overflow-y: auto;
          flex: 1;
        }

        .layout-group {
          margin-bottom: 15px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          overflow: hidden;
        }

        .layout-group-title {
          font-family: 'Oswald', sans-serif;
          font-size: 0.85rem;
          color: var(--yellow-selected);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 10px 12px;
          background: rgba(255, 200, 0, 0.1);
          border-bottom: 2px solid rgba(255, 200, 0, 0.3);
          display: flex;
          align-items: center;
          gap: 8px;
          user-select: none;
        }

        .layout-group-title:hover {
          background: rgba(255, 200, 0, 0.15);
        }

        .group-count {
          font-size: 0.7rem;
          opacity: 0.6;
          margin-left: auto;
        }

        .layout-group-controls {
          padding: 10px;
        }

        .layout-control {
          margin-bottom: 12px;
        }

        .layout-control label {
          display: flex;
          justify-content: space-between;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.85rem;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .layout-value {
          color: var(--cyan-light);
          font-family: 'Courier New', monospace;
          font-weight: bold;
          min-width: 60px;
          text-align: right;
        }

        .control-inputs {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .control-inputs input[type="range"] {
          flex: 1;
          height: 6px;
          -webkit-appearance: none;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 3px;
          outline: none;
        }

        .control-inputs input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: var(--cyan);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          transition: all 0.2s;
        }

        .control-inputs input[type="range"]::-webkit-slider-thumb:hover {
          background: var(--cyan-light);
          transform: scale(1.2);
        }

        .number-input {
          width: 65px;
          padding: 4px 8px;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          color: white;
          font-family: 'Courier New', monospace;
          font-size: 0.8rem;
          text-align: center;
        }

        .number-input:focus {
          outline: none;
          border-color: var(--cyan);
          background: rgba(0, 0, 0, 0.6);
        }

        .layout-editor-footer {
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .layout-stats {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          text-align: center;
        }

        /* Modal Import/Export */
        .layout-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .layout-modal {
          background: linear-gradient(180deg, #1a2a4a 0%, #0a1525 100%);
          border: 2px solid var(--cyan);
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }

        .layout-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 2px solid rgba(0, 150, 180, 0.3);
        }

        .layout-modal-header h3 {
          color: var(--yellow-selected);
          margin: 0;
          font-family: 'Oswald', sans-serif;
        }

        .layout-modal-header button {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          padding: 5px;
        }

        .layout-modal-header button:hover {
          color: var(--cyan);
        }

        .layout-modal-body {
          padding: 20px;
          flex: 1;
          overflow-y: auto;
        }

        .layout-modal-body textarea {
          width: 100%;
          min-height: 300px;
          background: rgba(0, 0, 0, 0.5);
          border: 2px solid rgba(100, 150, 200, 0.3);
          border-radius: 6px;
          color: white;
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
          padding: 12px;
          resize: vertical;
        }

        .layout-modal-body textarea:focus {
          outline: none;
          border-color: var(--cyan);
        }

        .layout-modal-footer {
          display: flex;
          gap: 10px;
          padding: 15px 20px;
          border-top: 2px solid rgba(0, 150, 180, 0.3);
          justify-content: flex-end;
        }

        .layout-modal-footer button {
          padding: 10px 20px;
          border: 2px solid;
          border-radius: 6px;
          font-family: 'Oswald', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .btn-import {
          background: rgba(0, 150, 180, 0.3);
          border-color: var(--cyan);
          color: white;
        }

        .btn-import:hover {
          background: rgba(0, 150, 180, 0.5);
        }

        .btn-export {
          background: rgba(255, 200, 0, 0.2);
          border-color: var(--yellow-selected);
          color: var(--yellow-selected);
        }

        .btn-export:hover {
          background: rgba(255, 200, 0, 0.3);
        }

        .btn-cancel {
          background: rgba(100, 100, 100, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          color: white;
        }

        .btn-cancel:hover {
          background: rgba(100, 100, 100, 0.4);
        }
      `}</style>
    </>
  );
};

export default LayoutEditor;
