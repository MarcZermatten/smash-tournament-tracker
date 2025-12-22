import { useCallback, useEffect, useRef, useState } from 'react';
import { getSettings, updateSettings } from '../data/storage';

// URLs de sons libres de droits qui ressemblent aux sons Melee
// À remplacer par tes propres fichiers dans /assets/audio/
const DEFAULT_SOUNDS = {
  select: null,    // Son de sélection - ajoute ton fichier
  confirm: null,   // Son de confirmation
  cancel: null,    // Son de retour
  menuMove: null,  // Son de navigation
};

const DEFAULT_MUSIC = {
  menu: null,      // Musique du menu principal
  ffa: null,       // Musique mode FFA
  team: null,      // Musique mode équipe
  results: null,   // Musique des résultats
};

export const useAudio = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [currentMusic, setCurrentMusic] = useState(null);

  const musicRef = useRef(null);
  const soundsRef = useRef({});

  // Charger les paramètres au démarrage
  useEffect(() => {
    const settings = getSettings();
    setSoundEnabled(settings.soundEnabled);
    setMusicEnabled(settings.musicEnabled);
    setVolume(settings.volume);
  }, []);

  // Précharger les sons
  useEffect(() => {
    Object.entries(DEFAULT_SOUNDS).forEach(([key, url]) => {
      if (url) {
        const audio = new Audio(url);
        audio.preload = 'auto';
        soundsRef.current[key] = audio;
      }
    });

    return () => {
      Object.values(soundsRef.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, []);

  // Jouer un son
  const playSound = useCallback((soundName) => {
    if (!soundEnabled) return;

    const sound = soundsRef.current[soundName];
    if (sound) {
      sound.volume = volume;
      sound.currentTime = 0;
      sound.play().catch(() => {});
    } else {
      // Fallback: générer un son simple avec Web Audio API
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Différents sons selon le type
        switch (soundName) {
          case 'select':
            oscillator.frequency.value = 800;
            gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
          case 'confirm':
            oscillator.frequency.value = 1000;
            gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
            break;
          case 'cancel':
            oscillator.frequency.value = 400;
            gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
          case 'menuMove':
            oscillator.frequency.value = 600;
            gainNode.gain.setValueAtTime(volume * 0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.05);
            break;
          default:
            break;
        }
      } catch (e) {
        // Web Audio API non supportée
      }
    }
  }, [soundEnabled, volume]);

  // Jouer une musique
  const playMusic = useCallback((musicName) => {
    if (!musicEnabled) return;

    // Arrêter la musique en cours
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.src = '';
    }

    const musicUrl = DEFAULT_MUSIC[musicName];
    if (musicUrl) {
      musicRef.current = new Audio(musicUrl);
      musicRef.current.loop = true;
      musicRef.current.volume = volume * 0.5; // Musique plus basse
      musicRef.current.play().catch(() => {});
      setCurrentMusic(musicName);
    }
  }, [musicEnabled, volume]);

  // Arrêter la musique
  const stopMusic = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.src = '';
      setCurrentMusic(null);
    }
  }, []);

  // Toggle son
  const toggleSound = useCallback(() => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    updateSettings({ soundEnabled: newValue });
  }, [soundEnabled]);

  // Toggle musique
  const toggleMusic = useCallback(() => {
    const newValue = !musicEnabled;
    setMusicEnabled(newValue);
    updateSettings({ musicEnabled: newValue });
    if (!newValue) {
      stopMusic();
    }
  }, [musicEnabled, stopMusic]);

  // Changer le volume
  const changeVolume = useCallback((newVolume) => {
    setVolume(newVolume);
    updateSettings({ volume: newVolume });
    if (musicRef.current) {
      musicRef.current.volume = newVolume * 0.5;
    }
  }, []);

  return {
    soundEnabled,
    musicEnabled,
    volume,
    currentMusic,
    playSound,
    playMusic,
    stopMusic,
    toggleSound,
    toggleMusic,
    changeVolume,
  };
};

export default useAudio;
