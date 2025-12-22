import { useAudio } from '../context/AudioContext';

const AudioControls = () => {
  const {
    soundEnabled, musicEnabled,
    toggleSound, toggleMusic,
    isPlaying, togglePlayPause,
    previousTrack, nextTrack
  } = useAudio();

  return (
    <div className="audio-controls-floating">
      {/* Contrôles son/musique */}
      <button
        className={`audio-ctrl-btn small ${soundEnabled ? '' : 'off'}`}
        onClick={toggleSound}
        title={soundEnabled ? 'Couper les sons' : 'Activer les sons'}
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>
      <button
        className={`audio-ctrl-btn small ${musicEnabled ? '' : 'off'}`}
        onClick={toggleMusic}
        title={musicEnabled ? 'Couper la musique' : 'Activer la musique'}
      >
        {musicEnabled ? '🎵' : '🎵'}
      </button>

      {/* Séparateur */}
      <div className="audio-separator" />

      {/* Contrôles pistes */}
      <button
        className="audio-ctrl-btn"
        onClick={previousTrack}
        title="Piste précédente"
        disabled={!musicEnabled}
      >
        ⏮
      </button>
      <button
        className="audio-ctrl-btn"
        onClick={togglePlayPause}
        title={isPlaying ? 'Pause' : 'Play'}
        disabled={!musicEnabled}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      <button
        className="audio-ctrl-btn"
        onClick={nextTrack}
        title="Piste suivante"
        disabled={!musicEnabled}
      >
        ⏭
      </button>

      <style>{`
        .audio-controls-floating {
          position: fixed;
          bottom: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 6px;
          z-index: 100;
          background: rgba(6, 18, 35, 0.95);
          padding: 8px 12px;
          border-radius: 30px;
          border: 2px solid rgba(100, 150, 200, 0.3);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }

        .audio-separator {
          width: 1px;
          height: 24px;
          background: rgba(100, 150, 200, 0.3);
          margin: 0 4px;
        }

        .audio-ctrl-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid var(--cyan);
          background: transparent;
          color: var(--cyan-light);
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .audio-ctrl-btn.small {
          width: 32px;
          height: 32px;
          font-size: 0.9rem;
        }

        .audio-ctrl-btn:hover:not(:disabled) {
          background: rgba(0, 100, 150, 0.5);
          transform: scale(1.1);
        }

        .audio-ctrl-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .audio-ctrl-btn.off {
          border-color: rgba(255, 255, 255, 0.3);
          opacity: 0.5;
        }

        .audio-ctrl-btn.off:hover {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};

export default AudioControls;
