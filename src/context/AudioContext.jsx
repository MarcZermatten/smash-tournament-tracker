import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { getSettings, updateSettings } from '../data/storage';

// Liste des musiques disponibles
// Note: Ajouter les fichiers MP3 dans public/audio/
const MUSIC_PLAYLIST = [
  // Menu
  { id: 'menu_melee', name: 'Menu (Melee)', file: '/audio/menu_melee.mp3', category: 'Menu' },

  // Zelda
  { id: 'zelda_medley', name: 'Zelda Medley', file: '/audio/zelda_medley.mp3', category: 'Zelda' },
  { id: 'hyrule_field', name: 'Hyrule Field', file: '/audio/hyrule_field.mp3', category: 'Zelda' },
  { id: 'gerudo_valley', name: 'Gerudo Valley', file: '/audio/gerudo_valley.mp3', category: 'Zelda' },
  { id: 'termina_field', name: 'Termina Field', file: '/audio/termina_field.mp3', category: 'Zelda' },
  { id: 'ballad_goddess', name: 'Ballad of the Goddess', file: '/audio/ballad_goddess.mp3', category: 'Zelda' },
  { id: 'ocarina_medley', name: 'Ocarina of Time Medley', file: '/audio/ocarina_medley.mp3', category: 'Zelda' },
  { id: 'twilight_princess', name: 'Twilight Princess', file: '/audio/twilight_princess.mp3', category: 'Zelda' },

  // Mario
  { id: 'delfino_plaza', name: 'Delfino Plaza', file: '/audio/delfino_plaza.mp3', category: 'Mario' },
  { id: 'mario_galaxy', name: 'Super Mario Galaxy', file: '/audio/mario_galaxy.mp3', category: 'Mario' },
  { id: 'gusty_garden', name: 'Gusty Garden Galaxy', file: '/audio/gusty_garden.mp3', category: 'Mario' },
  { id: 'bowser_galaxy', name: "Bowser's Galaxy Generator", file: '/audio/bowser_galaxy.mp3', category: 'Mario' },
  { id: 'jump_up', name: 'Jump Up, Super Star!', file: '/audio/jump_up_superstar.mp3', category: 'Mario' },
  { id: 'paper_mario', name: 'Paper Mario Medley', file: '/audio/paper_mario.mp3', category: 'Mario' },
  { id: 'yoshi_island', name: "Yoshi's New Island", file: '/audio/yoshi_island.mp3', category: 'Mario' },

  // Kirby
  { id: 'dream_land', name: 'Dream Land', file: '/audio/dream_land.mp3', category: 'Kirby' },

  // Divers
  { id: 'dbz', name: 'Dragon Ball Z', file: '/audio/dbz.mp3', category: 'Divers' },
];

const AudioContext = createContext(null);

export const AudioProvider = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist] = useState(MUSIC_PLAYLIST);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [pendingAutoplay, setPendingAutoplay] = useState(false);

  const musicRef = useRef(null);
  const playedTracksRef = useRef([]);
  const hasInteractedRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Charger les paramètres au démarrage
  useEffect(() => {
    const settings = getSettings();
    setSoundEnabled(settings.soundEnabled ?? true);
    setMusicEnabled(settings.musicEnabled ?? true);
    setVolume(settings.volume ?? 0.5);
  }, []);

  // Détecter la première interaction utilisateur (une seule fois)
  useEffect(() => {
    if (hasInteractedRef.current) return;

    const handleFirstInteraction = () => {
      if (!hasInteractedRef.current) {
        hasInteractedRef.current = true;
        setHasUserInteracted(true);
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
      }
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Fonction helper pour obtenir la prochaine piste (random intelligent)
  const getNextRandomTrack = useCallback((currentTrackId) => {
    if (playlist.length <= 1) return null;

    // Filtrer les pistes disponibles (non jouées et différente de la piste actuelle)
    let available = playlist.filter(t =>
      t.id !== currentTrackId && !playedTracksRef.current.includes(t.id)
    );

    // Si toutes les pistes ont été jouées (sauf la piste actuelle), réinitialiser
    if (available.length === 0) {
      playedTracksRef.current = currentTrackId ? [currentTrackId] : [];
      available = playlist.filter(t => t.id !== currentTrackId);
    }

    // Choisir une piste aléatoire parmi les disponibles
    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)];
    }

    return null;
  }, [playlist]);

  // Fonction interne pour jouer une piste
  const playTrackInternal = useCallback((track, vol) => {
    // Arrêter proprement la musique en cours
    if (musicRef.current) {
      try {
        // Retirer les listeners avant de nettoyer pour éviter les faux événements
        musicRef.current.onended = null;
        musicRef.current.onerror = null;
        musicRef.current.pause();
        musicRef.current.src = '';
      } catch (e) {}
      musicRef.current = null;
    }

    if (!track || !track.file) return;

    const audio = new Audio(track.file);
    audio.volume = vol * 0.5;
    audio.loop = playlist.length === 1; // Loop si une seule piste

    // Gérer les erreurs de chargement (fichier manquant)
    audio.onerror = () => {
      // Vérifier que c'est toujours l'audio actuel
      if (musicRef.current === audio) {
        console.warn(`Audio file not found: ${track.file}`);
        setIsPlaying(false);
      }
    };

    // Quand la piste se termine (si pas en loop)
    if (playlist.length > 1) {
      audio.addEventListener('ended', () => {
        // Ajouter la piste actuelle aux pistes jouées
        if (!playedTracksRef.current.includes(track.id)) {
          playedTracksRef.current = [...playedTracksRef.current, track.id];
        }

        // Obtenir la prochaine piste avec le système intelligent
        const next = getNextRandomTrack(track.id);

        if (next) {
          setCurrentTrack(next);
          playTrackInternal(next, vol);
        }
      });
    }

    musicRef.current = audio;
    setCurrentTrack(track);

    audio.play().then(() => {
      setIsPlaying(true);
      setPendingAutoplay(false);
    }).catch(() => {
      // Autoplay bloqué - on attend l'interaction
      setPendingAutoplay(true);
      setIsPlaying(false);
    });
  }, [playlist, getNextRandomTrack]);

  // Lancer la musique au démarrage ou après première interaction
  useEffect(() => {
    // Éviter les double initialisations (React StrictMode)
    if (isInitializedRef.current) return;

    if (musicEnabled && hasUserInteracted && !musicRef.current) {
      isInitializedRef.current = true;
      const menuTrack = playlist.find(t => t.id === 'menu_melee') || playlist[0];
      if (menuTrack) {
        playTrackInternal(menuTrack, volume);
      }
    }
  }, [musicEnabled, hasUserInteracted, volume, playlist, playTrackInternal]);

  // Relancer si autoplay était en attente
  useEffect(() => {
    if (pendingAutoplay && hasUserInteracted && musicEnabled && !musicRef.current) {
      const track = currentTrack || playlist.find(t => t.id === 'menu_melee') || playlist[0];
      if (track) {
        playTrackInternal(track, volume);
      }
    }
  }, [pendingAutoplay, hasUserInteracted, musicEnabled, currentTrack, playlist, volume, playTrackInternal]);

  // Cleanup à l'unmount
  useEffect(() => {
    return () => {
      if (musicRef.current) {
        try {
          musicRef.current.pause();
          musicRef.current.src = '';
        } catch (e) {}
        musicRef.current = null;
      }
    };
  }, []);

  // Jouer un son
  const playSound = useCallback((soundName) => {
    if (!soundEnabled) return;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

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
  }, [soundEnabled, volume]);

  // Pause/Resume
  const togglePlayPause = useCallback(() => {
    if (!musicRef.current) return;

    if (isPlaying) {
      musicRef.current.pause();
      setIsPlaying(false);
    } else {
      musicRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
    }
  }, [isPlaying]);

  // Piste suivante (random intelligent)
  const nextTrack = useCallback(() => {
    if (playlist.length <= 1) return;

    // Ajouter la piste actuelle aux pistes jouées
    if (currentTrack && !playedTracksRef.current.includes(currentTrack.id)) {
      playedTracksRef.current = [...playedTracksRef.current, currentTrack.id];
    }

    // Obtenir la prochaine piste avec le système intelligent
    const next = getNextRandomTrack(currentTrack?.id);
    if (next) {
      playTrackInternal(next, volume);
    }
  }, [playlist, currentTrack, volume, playTrackInternal, getNextRandomTrack]);

  // Piste précédente (random intelligent)
  const previousTrack = useCallback(() => {
    if (playlist.length <= 1) return;

    // Ajouter la piste actuelle aux pistes jouées
    if (currentTrack && !playedTracksRef.current.includes(currentTrack.id)) {
      playedTracksRef.current = [...playedTracksRef.current, currentTrack.id];
    }

    // Obtenir la prochaine piste avec le système intelligent
    const next = getNextRandomTrack(currentTrack?.id);
    if (next) {
      playTrackInternal(next, volume);
    }
  }, [playlist, currentTrack, volume, playTrackInternal, getNextRandomTrack]);

  // Arrêter la musique
  const stopMusic = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.src = '';
      musicRef.current = null;
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  }, []);

  // Toggle son
  const toggleSound = useCallback(() => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    updateSettings({ soundEnabled: newValue });
  }, [soundEnabled]);

  // Toggle musique (pause/resume au lieu de stop/restart)
  const toggleMusic = useCallback(() => {
    const newValue = !musicEnabled;
    setMusicEnabled(newValue);
    updateSettings({ musicEnabled: newValue });

    if (musicRef.current) {
      if (!newValue) {
        // Juste mettre en pause, ne pas détruire
        musicRef.current.pause();
        setIsPlaying(false);
      } else {
        // Reprendre la lecture
        musicRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {});
      }
    } else if (newValue && hasUserInteracted) {
      // Pas de musique en cours, en démarrer une
      const menuTrack = playlist.find(t => t.id === 'menu_melee') || playlist[0];
      if (menuTrack) {
        playTrackInternal(menuTrack, volume);
      }
    }
  }, [musicEnabled, hasUserInteracted, playlist, volume, playTrackInternal]);

  // Changer le volume
  const changeVolume = useCallback((newVolume) => {
    setVolume(newVolume);
    updateSettings({ volume: newVolume });
    if (musicRef.current) {
      musicRef.current.volume = newVolume * 0.5;
    }
  }, []);

  // Sélectionner une piste
  const selectTrack = useCallback((trackId) => {
    const track = playlist.find(t => t.id === trackId);
    if (track) {
      playTrackInternal(track, volume);
    }
  }, [playlist, volume, playTrackInternal]);

  // Jouer une piste (API publique)
  const playTrack = useCallback((track) => {
    if (musicEnabled) {
      playTrackInternal(track, volume);
    }
  }, [musicEnabled, volume, playTrackInternal]);

  // Jouer un fichier audio par son chemin (pour les pistes cachées)
  const playAudioFile = useCallback((filePath, vol = 0.5) => {
    const hiddenTrack = { id: 'hidden', name: 'Hidden Track', file: filePath };
    playTrackInternal(hiddenTrack, vol);
  }, [playTrackInternal]);

  const value = {
    soundEnabled,
    musicEnabled,
    volume,
    currentTrack,
    isPlaying,
    playlist,
    playSound,
    playTrack,
    playAudioFile,
    stopMusic,
    togglePlayPause,
    nextTrack,
    previousTrack,
    toggleSound,
    toggleMusic,
    changeVolume,
    selectTrack,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export default AudioContext;
