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
      const newLayout = { ...prev, [key]: value };
      localStorage.setItem(storageKey, JSON.stringify(newLayout));
      return newLayout;
    });
  };

  const resetLayout = () => {
    setLayout(defaultLayout);
    localStorage.removeItem(storageKey);
  };

  const copyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(layout, null, 2));
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
    <div className="layout-editor">
      <div className="layout-editor-header">
        <span className="layout-editor-title">Layout Editor - {pageKey}</span>
        <div className="layout-editor-actions">
          <button onClick={copyConfig} title="Copier config"><Icon name="clipboard" size={16} /></button>
          <button onClick={resetLayout} title="Reset"><Icon name="refresh" size={16} /></button>
        </div>
      </div>

      <div className="layout-editor-body">
        {Object.entries(groupedControls).map(([group, ctrls]) => (
          <div key={group} className="layout-group">
            <div className="layout-group-title">{group}</div>
            {ctrls.map(ctrl => (
              <div key={ctrl.key} className="layout-control">
                <label>
                  {ctrl.label}
                  <span className="layout-value">
                    {layout[ctrl.key]}{ctrl.unit || ''}
                  </span>
                </label>
                <input
                  type="range"
                  min={ctrl.min}
                  max={ctrl.max}
                  step={ctrl.step || 1}
                  value={layout[ctrl.key]}
                  onChange={(e) => updateLayout(ctrl.key, Number(e.target.value))}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      <style>{`
        .layout-editor {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 280px;
          max-height: 400px;
          background: rgba(10, 20, 40, 0.95);
          border: 2px solid var(--cyan);
          border-radius: 10px;
          z-index: 9999;
          font-size: 0.85rem;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .layout-editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: rgba(0, 150, 180, 0.3);
          border-bottom: 1px solid var(--cyan);
        }

        .layout-editor-title {
          font-family: 'Oswald', sans-serif;
          color: var(--cyan-light);
          font-weight: 500;
        }

        .layout-editor-actions {
          display: flex;
          gap: 5px;
        }

        .layout-editor-actions button {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .layout-editor-actions button:hover {
          background: rgba(0, 0, 0, 0.5);
          border-color: var(--cyan);
        }

        .layout-editor-body {
          padding: 10px;
          overflow-y: auto;
          flex: 1;
        }

        .layout-group {
          margin-bottom: 12px;
        }

        .layout-group-title {
          font-family: 'Oswald', sans-serif;
          font-size: 0.75rem;
          color: var(--yellow-selected);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 6px;
          padding-bottom: 4px;
          border-bottom: 1px solid rgba(255, 200, 0, 0.2);
        }

        .layout-control {
          margin-bottom: 8px;
        }

        .layout-control label {
          display: flex;
          justify-content: space-between;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.8rem;
          margin-bottom: 3px;
        }

        .layout-value {
          color: var(--cyan-light);
          font-family: monospace;
        }

        .layout-control input[type="range"] {
          width: 100%;
          height: 6px;
          -webkit-appearance: none;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          outline: none;
        }

        .layout-control input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          background: var(--cyan);
          border-radius: 50%;
          cursor: pointer;
        }

        .layout-control input[type="range"]::-webkit-slider-thumb:hover {
          background: var(--cyan-light);
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default LayoutEditor;
