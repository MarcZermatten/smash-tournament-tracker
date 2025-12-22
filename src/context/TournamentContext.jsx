import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { resetSeason, saveTournament } from '../data/storage';

const TOURNAMENT_STORAGE_KEY = 'smash_tournament';

const TournamentContext = createContext(null);

const DEFAULT_TOURNAMENT = {
  active: false,
  name: '',
  players: [], // IDs des joueurs participants
  modes: ['1v1', 'ffa', 'team_ff'], // Modes actifs
  startedAt: null,
};

export const TournamentProvider = ({ children }) => {
  const [tournament, setTournament] = useState(() => {
    try {
      const saved = localStorage.getItem(TOURNAMENT_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Erreur chargement tournoi:', e);
    }
    return { ...DEFAULT_TOURNAMENT };
  });

  // Sauvegarder automatiquement
  useEffect(() => {
    localStorage.setItem(TOURNAMENT_STORAGE_KEY, JSON.stringify(tournament));
    window.dispatchEvent(new Event('tournamentUpdate'));
  }, [tournament]);

  // Démarrer un nouveau tournoi
  const startTournament = useCallback((config) => {
    // Reset tous les scores
    resetSeason();

    setTournament({
      active: true,
      name: config.name || `Tournoi ${new Date().toLocaleDateString('fr-FR')}`,
      players: config.players || [],
      modes: config.modes || ['1v1', 'ffa', 'team_ff'],
      startedAt: new Date().toISOString(),
    });

    return true;
  }, []);

  // Terminer le tournoi et l'archiver
  const endTournament = useCallback(() => {
    // Sauvegarder dans l'historique avant de terminer
    if (tournament.active) {
      saveTournament(tournament);
    }

    setTournament(prev => ({
      ...prev,
      active: false,
      endedAt: new Date().toISOString(),
    }));
  }, [tournament]);

  // Annuler le tournoi (sans sauvegarder les résultats)
  const cancelTournament = useCallback(() => {
    setTournament({ ...DEFAULT_TOURNAMENT });
  }, []);

  // Modifier les joueurs du tournoi
  const setTournamentPlayers = useCallback((players) => {
    setTournament(prev => ({ ...prev, players }));
  }, []);

  // Modifier les modes du tournoi
  const setTournamentModes = useCallback((modes) => {
    setTournament(prev => ({ ...prev, modes }));
  }, []);

  // Vérifier si un joueur participe au tournoi
  const isPlayerInTournament = useCallback((playerId) => {
    if (!tournament.active) return true; // Pas de tournoi = tout le monde joue
    return tournament.players.includes(playerId);
  }, [tournament]);

  // Vérifier si un mode est actif dans le tournoi
  const isModeActive = useCallback((mode) => {
    if (!tournament.active) return true;
    return tournament.modes.includes(mode);
  }, [tournament]);

  // Obtenir les joueurs du tournoi actif
  const getTournamentPlayers = useCallback(() => {
    if (!tournament.active) return null;
    return tournament.players;
  }, [tournament]);

  const value = {
    tournament,
    isActive: tournament.active,
    startTournament,
    endTournament,
    cancelTournament,
    setTournamentPlayers,
    setTournamentModes,
    isPlayerInTournament,
    isModeActive,
    getTournamentPlayers,
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};

export default TournamentContext;
