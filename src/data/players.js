// Joueurs du tournoi - Système dynamique avec localStorage

// Avatars disponibles (icônes de personnages Smash)
export const AVATARS = [
  { id: 'fox', name: 'Fox', icon: '🦊' },
  { id: 'falco', name: 'Falco', icon: '🦅' },
  { id: 'marth', name: 'Marth', icon: '⚔️' },
  { id: 'sheik', name: 'Sheik', icon: '🥷' },
  { id: 'peach', name: 'Peach', icon: '👸' },
  { id: 'captain', name: 'Captain Falcon', icon: '🦸' },
  { id: 'jigglypuff', name: 'Jigglypuff', icon: '🎀' },
  { id: 'pikachu', name: 'Pikachu', icon: '⚡' },
  { id: 'samus', name: 'Samus', icon: '🔫' },
  { id: 'link', name: 'Link', icon: '🗡️' },
  { id: 'mario', name: 'Mario', icon: '🍄' },
  { id: 'luigi', name: 'Luigi', icon: '💚' },
  { id: 'dk', name: 'Donkey Kong', icon: '🦍' },
  { id: 'kirby', name: 'Kirby', icon: '🩷' },
  { id: 'yoshi', name: 'Yoshi', icon: '🥚' },
  { id: 'ness', name: 'Ness', icon: '⚾' },
];

// Couleurs disponibles
export const COLORS = [
  '#FF6B6B', // Rouge corail
  '#4ECDC4', // Turquoise
  '#FFE66D', // Jaune doré
  '#95E1D3', // Vert menthe
  '#DDA0DD', // Violet
  '#FF8C42', // Orange
  '#6A0DAD', // Violet foncé
  '#00CED1', // Cyan
  '#FF69B4', // Rose
  '#32CD32', // Vert lime
  '#4169E1', // Bleu royal
  '#FFD700', // Or
];

// Joueurs par défaut
const DEFAULT_PLAYERS = {
  marc: { id: 'marc', name: 'Marc', color: '#FF6B6B', initial: 'M', avatar: 'fox', isMain: true },
  max: { id: 'max', name: 'Max', color: '#4ECDC4', initial: 'MX', avatar: 'falco', isMain: true },
  flo: { id: 'flo', name: 'Flo', color: '#FFE66D', initial: 'F', avatar: 'marth', isMain: true },
  boris: { id: 'boris', name: 'Boris', color: '#95E1D3', initial: 'B', avatar: 'sheik', isMain: true },
  daniel: { id: 'daniel', name: 'Daniel', color: '#DDA0DD', initial: 'D', avatar: 'captain', isMain: false }
};

const STORAGE_KEY = 'smash_players';

// Charger les joueurs depuis localStorage ou utiliser les défauts
const loadPlayers = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Erreur chargement joueurs:', e);
  }
  return { ...DEFAULT_PLAYERS };
};

// Sauvegarder les joueurs
const savePlayers = (players) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
    // Émettre un événement pour notifier les composants
    window.dispatchEvent(new Event('playersUpdate'));
  } catch (e) {
    console.error('Erreur sauvegarde joueurs:', e);
  }
};

// État des joueurs (mutable)
let PLAYERS = loadPlayers();

// Getters
export const getPlayers = () => ({ ...PLAYERS });
export const getPlayer = (id) => PLAYERS[id];
export const getPlayerName = (id) => PLAYERS[id]?.name || id;
export const getAvatar = (avatarId) => AVATARS.find(a => a.id === avatarId);

// Liste des joueurs principaux (pour les tournois)
export const getMainPlayers = () =>
  Object.keys(PLAYERS).filter(id => PLAYERS[id].isMain);

// Tous les joueurs
export const getAllPlayers = () => Object.keys(PLAYERS);

// Ajouter un joueur
export const addPlayer = (playerData) => {
  const id = playerData.name.toLowerCase().replace(/\s+/g, '_');
  if (PLAYERS[id]) {
    return { success: false, error: 'Un joueur avec ce nom existe déjà' };
  }

  const initial = playerData.name.substring(0, 2).toUpperCase();

  PLAYERS[id] = {
    id,
    name: playerData.name,
    color: playerData.color || COLORS[Object.keys(PLAYERS).length % COLORS.length],
    initial,
    avatar: playerData.avatar || 'fox',
    isMain: playerData.isMain !== false
  };

  savePlayers(PLAYERS);
  return { success: true, player: PLAYERS[id] };
};

// Modifier un joueur
export const updatePlayer = (id, updates) => {
  if (!PLAYERS[id]) {
    return { success: false, error: 'Joueur non trouvé' };
  }

  PLAYERS[id] = {
    ...PLAYERS[id],
    ...updates,
    id // L'ID ne peut pas être changé
  };

  // Recalculer l'initial si le nom change
  if (updates.name) {
    PLAYERS[id].initial = updates.name.substring(0, 2).toUpperCase();
  }

  savePlayers(PLAYERS);
  return { success: true, player: PLAYERS[id] };
};

// Supprimer un joueur
export const removePlayer = (id) => {
  if (!PLAYERS[id]) {
    return { success: false, error: 'Joueur non trouvé' };
  }

  delete PLAYERS[id];
  savePlayers(PLAYERS);
  return { success: true };
};

// Reset aux joueurs par défaut
export const resetPlayers = () => {
  PLAYERS = { ...DEFAULT_PLAYERS };
  savePlayers(PLAYERS);
  return { success: true };
};

// Recharger depuis localStorage (utile après import)
export const reloadPlayers = () => {
  PLAYERS = loadPlayers();
  return PLAYERS;
};

// Exports pour compatibilité avec l'ancien code
export const MAIN_PLAYERS = getMainPlayers();
export const ALL_PLAYERS = getAllPlayers();

// Système de points équitable
export const POINTS_SYSTEM = {
  '1v1': {
    name: '1 vs 1',
    description: 'Duels en tête-à-tête',
    win: 3,
    lose: 0
  },
  ffa: {
    name: 'Free For All',
    description: '4 joueurs, chacun pour soi',
    positions: {
      1: 5,
      2: 3,
      3: 1,
      4: 0
    }
  },
  team_ff: {
    name: '2v2 Friendly Fire',
    description: 'Équipes, dégâts alliés activés',
    win: 3,
    lose: 0
  },
  team_noff: {
    name: '2v2 No Friendly Fire',
    description: 'Équipes, dégâts alliés désactivés',
    win: 3,
    lose: 0
  },
  casual: {
    name: 'Mode Casual',
    description: 'Parties détendues',
    win: 2,
    lose: 0
  }
};

// Combinaisons d'équipes pour rotation 2v2 (calculées dynamiquement)
export const getTeamRotations = () => {
  const mains = getMainPlayers();
  if (mains.length < 4) return [];

  return [
    { team1: [mains[0], mains[1]], team2: [mains[2], mains[3]] },
    { team1: [mains[0], mains[2]], team2: [mains[1], mains[3]] },
    { team1: [mains[0], mains[3]], team2: [mains[1], mains[2]] }
  ];
};

export const TEAM_ROTATIONS = getTeamRotations();
