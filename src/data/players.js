// Joueurs du tournoi - Système dynamique avec localStorage

// Avatars disponibles (icônes emoji fallback)
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

// Personnages SSBU - ROSTER COMPLET avec images locales
// Images téléchargées depuis SmashWiki dans /characters/
export const SSBU_CHARACTERS = [
  // Original 8 (N64)
  { id: 'mario', name: 'Mario', image: '/characters/mario.png' },
  { id: 'donkey_kong', name: 'Donkey Kong', image: '/characters/donkey_kong.png' },
  { id: 'link', name: 'Link', image: '/characters/link.png' },
  { id: 'samus', name: 'Samus', image: '/characters/samus.png' },
  { id: 'yoshi', name: 'Yoshi', image: '/characters/yoshi.png' },
  { id: 'kirby', name: 'Kirby', image: '/characters/kirby.png' },
  { id: 'fox', name: 'Fox', image: '/characters/fox.png' },
  { id: 'pikachu', name: 'Pikachu', image: '/characters/pikachu.png' },
  // N64 Unlockables
  { id: 'luigi', name: 'Luigi', image: '/characters/luigi.png' },
  { id: 'ness', name: 'Ness', image: '/characters/ness.png' },
  { id: 'captain_falcon', name: 'Captain Falcon', image: '/characters/captain_falcon.png' },
  { id: 'jigglypuff', name: 'Jigglypuff', image: '/characters/jigglypuff.png' },
  // Melee newcomers
  { id: 'peach', name: 'Peach', image: '/characters/peach.png' },
  { id: 'daisy', name: 'Daisy', image: '/characters/daisy.png' },
  { id: 'bowser', name: 'Bowser', image: '/characters/bowser.png' },
  { id: 'ice_climbers', name: 'Ice Climbers', image: '/characters/ice_climbers.png' },
  { id: 'sheik', name: 'Sheik', image: '/characters/sheik.png' },
  { id: 'zelda', name: 'Zelda', image: '/characters/zelda.png' },
  { id: 'dr_mario', name: 'Dr. Mario', image: '/characters/dr_mario.png' },
  { id: 'pichu', name: 'Pichu', image: '/characters/pichu.png' },
  { id: 'falco', name: 'Falco', image: '/characters/falco.png' },
  { id: 'marth', name: 'Marth', image: '/characters/marth.png' },
  { id: 'lucina', name: 'Lucina', image: '/characters/lucina.png' },
  { id: 'young_link', name: 'Young Link', image: '/characters/young_link.png' },
  { id: 'ganondorf', name: 'Ganondorf', image: '/characters/ganondorf.png' },
  { id: 'mewtwo', name: 'Mewtwo', image: '/characters/mewtwo.png' },
  { id: 'roy', name: 'Roy', image: '/characters/roy.png' },
  { id: 'chrom', name: 'Chrom', image: '/characters/chrom.png' },
  { id: 'mr_game_watch', name: 'Mr. Game & Watch', image: '/characters/mr_game_watch.png' },
  // Brawl newcomers
  { id: 'meta_knight', name: 'Meta Knight', image: '/characters/meta_knight.png' },
  { id: 'pit', name: 'Pit', image: '/characters/pit.png' },
  { id: 'dark_pit', name: 'Dark Pit', image: '/characters/dark_pit.png' },
  { id: 'zero_suit_samus', name: 'Zero Suit Samus', image: '/characters/zero_suit_samus.png' },
  { id: 'wario', name: 'Wario', image: '/characters/wario.png' },
  { id: 'snake', name: 'Snake', image: '/characters/snake.png' },
  { id: 'ike', name: 'Ike', image: '/characters/ike.png' },
  { id: 'pokemon_trainer', name: 'Pokemon Trainer', image: '/characters/pokemon_trainer.png' },
  { id: 'diddy_kong', name: 'Diddy Kong', image: '/characters/diddy_kong.png' },
  { id: 'lucas', name: 'Lucas', image: '/characters/lucas.png' },
  { id: 'sonic', name: 'Sonic', image: '/characters/sonic.png' },
  { id: 'king_dedede', name: 'King Dedede', image: '/characters/king_dedede.png' },
  { id: 'olimar', name: 'Olimar', image: '/characters/olimar.png' },
  { id: 'lucario', name: 'Lucario', image: '/characters/lucario.png' },
  { id: 'rob', name: 'R.O.B.', image: '/characters/rob.png' },
  { id: 'toon_link', name: 'Toon Link', image: '/characters/toon_link.png' },
  { id: 'wolf', name: 'Wolf', image: '/characters/wolf.png' },
  // Smash 4 newcomers
  { id: 'villager', name: 'Villager', image: '/characters/villager.png' },
  { id: 'mega_man', name: 'Mega Man', image: '/characters/mega_man.png' },
  { id: 'wii_fit_trainer', name: 'Wii Fit Trainer', image: '/characters/wii_fit_trainer.png' },
  { id: 'rosalina', name: 'Rosalina & Luma', image: '/characters/rosalina.png' },
  { id: 'little_mac', name: 'Little Mac', image: '/characters/little_mac.png' },
  { id: 'greninja', name: 'Greninja', image: '/characters/greninja.png' },
  { id: 'palutena', name: 'Palutena', image: '/characters/palutena.png' },
  { id: 'pac_man', name: 'Pac-Man', image: '/characters/pac_man.png' },
  { id: 'robin', name: 'Robin', image: '/characters/robin.png' },
  { id: 'shulk', name: 'Shulk', image: '/characters/shulk.png' },
  { id: 'bowser_jr', name: 'Bowser Jr.', image: '/characters/bowser_jr.png' },
  { id: 'duck_hunt', name: 'Duck Hunt', image: '/characters/duck_hunt.png' },
  { id: 'ryu', name: 'Ryu', image: '/characters/ryu.png' },
  { id: 'ken', name: 'Ken', image: '/characters/ken.png' },
  { id: 'cloud', name: 'Cloud', image: '/characters/cloud.png' },
  { id: 'corrin', name: 'Corrin', image: '/characters/corrin.png' },
  { id: 'bayonetta', name: 'Bayonetta', image: '/characters/bayonetta.png' },
  // Echo Fighters
  { id: 'dark_samus', name: 'Dark Samus', image: '/characters/dark_samus.png' },
  { id: 'richter', name: 'Richter', image: '/characters/richter.png' },
  // Ultimate newcomers (base game)
  { id: 'inkling', name: 'Inkling', image: '/characters/inkling.png' },
  { id: 'ridley', name: 'Ridley', image: '/characters/ridley.png' },
  { id: 'simon', name: 'Simon', image: '/characters/simon.png' },
  { id: 'king_k_rool', name: 'King K. Rool', image: '/characters/king_k_rool.png' },
  { id: 'isabelle', name: 'Isabelle', image: '/characters/isabelle.png' },
  { id: 'incineroar', name: 'Incineroar', image: '/characters/incineroar.png' },
  // Mii Fighters
  { id: 'mii_brawler', name: 'Mii Brawler', image: '/characters/mii_brawler.png' },
  { id: 'mii_swordfighter', name: 'Mii Swordfighter', image: '/characters/mii_swordfighter.png' },
  { id: 'mii_gunner', name: 'Mii Gunner', image: '/characters/mii_gunner.png' },
  // Fighters Pass Vol. 1
  { id: 'piranha_plant', name: 'Piranha Plant', image: '/characters/piranha_plant.png' },
  { id: 'joker', name: 'Joker', image: '/characters/joker.png' },
  { id: 'hero', name: 'Hero', image: '/characters/hero.png' },
  { id: 'banjo_kazooie', name: 'Banjo & Kazooie', image: '/characters/banjo_kazooie.png' },
  { id: 'terry', name: 'Terry', image: '/characters/terry.png' },
  { id: 'byleth', name: 'Byleth', image: '/characters/byleth.png' },
  // Fighters Pass Vol. 2
  { id: 'min_min', name: 'Min Min', image: '/characters/min_min.png' },
  { id: 'steve', name: 'Steve', image: '/characters/steve.png' },
  { id: 'sephiroth', name: 'Sephiroth', image: '/characters/sephiroth.png' },
  { id: 'pyra', name: 'Pyra', image: '/characters/pyra.png' },
  { id: 'mythra', name: 'Mythra', image: '/characters/mythra.png' },
  { id: 'kazuya', name: 'Kazuya', image: '/characters/kazuya.png' },
  { id: 'sora', name: 'Sora', image: '/characters/sora.png' },
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
  marc: { id: 'marc', name: 'Marc', color: '#32CD32', initial: 'M', avatar: 'gamewatch', isMain: true, image: '/characters/mr_game_watch.png' }, // Vert lime
  max: { id: 'max', name: 'Max', color: '#4169E1', initial: 'MX', avatar: 'hero', isMain: true, image: '/characters/hero.png' }, // Bleu royal
  flo: { id: 'flo', name: 'Flo', color: '#FFE66D', initial: 'F', avatar: 'mewtwo', isMain: true, image: '/characters/mewtwo.png' }, // Jaune doré
  boris: { id: 'boris', name: 'Boris', color: '#FF6B6B', initial: 'B', avatar: 'ness', isMain: true, image: '/characters/ness.png' }, // Rouge corail
  daniel: { id: 'daniel', name: 'Daniel', color: '#FF8C42', initial: 'D', avatar: 'jigglypuff', isMain: false, image: '/characters/jigglypuff.png' } // Orange
};

const STORAGE_KEY = 'smash_players';
const IMAGES_STORAGE_KEY = 'smash_player_images';

// Charger les images depuis localStorage (séparé pour éviter limite taille)
const loadPlayerImages = () => {
  try {
    const saved = localStorage.getItem(IMAGES_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Erreur chargement images:', e);
  }
  return {};
};

// Sauvegarder les images
const savePlayerImages = (images) => {
  try {
    localStorage.setItem(IMAGES_STORAGE_KEY, JSON.stringify(images));
  } catch (e) {
    console.error('Erreur sauvegarde images (taille max localStorage?):', e);
    return false;
  }
  return true;
};

// État des images
let PLAYER_IMAGES = loadPlayerImages();

// Charger les joueurs depuis localStorage ou utiliser les défauts
const loadPlayers = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const players = JSON.parse(saved);
      // Associer les images stockées séparément
      Object.keys(players).forEach(id => {
        // Si pas d'image custom, utiliser celle de DEFAULT_PLAYERS
        players[id].image = PLAYER_IMAGES[id] || DEFAULT_PLAYERS[id]?.image || null;
      });
      return players;
    }
  } catch (e) {
    console.error('Erreur chargement joueurs:', e);
  }

  // Initialiser PLAYER_IMAGES avec les images par défaut
  Object.keys(DEFAULT_PLAYERS).forEach(id => {
    if (DEFAULT_PLAYERS[id].image && !PLAYER_IMAGES[id]) {
      PLAYER_IMAGES[id] = DEFAULT_PLAYERS[id].image;
    }
  });
  savePlayerImages(PLAYER_IMAGES);

  return { ...DEFAULT_PLAYERS };
};

// Sauvegarder les joueurs (sans les images pour éviter dépassement)
const savePlayers = (players) => {
  try {
    // Copier sans les images pour le stockage principal
    const playersWithoutImages = {};
    Object.keys(players).forEach(id => {
      const { image, ...playerData } = players[id];
      playersWithoutImages[id] = playerData;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(playersWithoutImages));
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
export const getPlayerImage = (id) => PLAYER_IMAGES[id] || DEFAULT_PLAYERS[id]?.image || null;

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
    isMain: playerData.isMain !== false,
    image: null
  };

  // Si une image est fournie, la sauvegarder séparément
  if (playerData.image) {
    PLAYER_IMAGES[id] = playerData.image;
    PLAYERS[id].image = playerData.image;
    savePlayerImages(PLAYER_IMAGES);
  }

  savePlayers(PLAYERS);
  return { success: true, player: PLAYERS[id] };
};

// Modifier un joueur
export const updatePlayer = (id, updates) => {
  if (!PLAYERS[id]) {
    return { success: false, error: 'Joueur non trouvé' };
  }

  // Gérer l'image séparément
  if (updates.image !== undefined) {
    if (updates.image) {
      PLAYER_IMAGES[id] = updates.image;
    } else {
      delete PLAYER_IMAGES[id];
    }
    savePlayerImages(PLAYER_IMAGES);
  }

  PLAYERS[id] = {
    ...PLAYERS[id],
    ...updates,
    id, // L'ID ne peut pas être changé
    image: PLAYER_IMAGES[id] || null
  };

  // Recalculer l'initial si le nom change
  if (updates.name) {
    PLAYERS[id].initial = updates.name.substring(0, 2).toUpperCase();
  }

  savePlayers(PLAYERS);
  return { success: true, player: PLAYERS[id] };
};

// Uploader une image pour un joueur (base64)
export const setPlayerImage = (id, imageBase64) => {
  if (!PLAYERS[id]) {
    return { success: false, error: 'Joueur non trouvé' };
  }

  if (imageBase64) {
    PLAYER_IMAGES[id] = imageBase64;
    PLAYERS[id].image = imageBase64;
  } else {
    delete PLAYER_IMAGES[id];
    PLAYERS[id].image = null;
  }

  const saved = savePlayerImages(PLAYER_IMAGES);
  if (!saved) {
    return { success: false, error: 'Image trop grande pour le stockage local' };
  }

  window.dispatchEvent(new Event('playersUpdate'));
  return { success: true };
};

// Supprimer un joueur
export const removePlayer = (id) => {
  if (!PLAYERS[id]) {
    return { success: false, error: 'Joueur non trouvé' };
  }

  delete PLAYERS[id];
  delete PLAYER_IMAGES[id];
  savePlayers(PLAYERS);
  savePlayerImages(PLAYER_IMAGES);
  return { success: true };
};

// Reset aux joueurs par défaut
export const resetPlayers = () => {
  PLAYERS = { ...DEFAULT_PLAYERS };
  PLAYER_IMAGES = {};
  savePlayers(PLAYERS);
  savePlayerImages(PLAYER_IMAGES);
  return { success: true };
};

// Recharger depuis localStorage (utile après import)
export const reloadPlayers = () => {
  PLAYER_IMAGES = loadPlayerImages();
  PLAYERS = loadPlayers();
  return PLAYERS;
};

// Exports pour compatibilité avec l'ancien code
export const MAIN_PLAYERS = getMainPlayers();
export const ALL_PLAYERS = getAllPlayers();

// Système de points par défaut (fallback)
const DEFAULT_POINTS_SYSTEM = {
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

// Récupérer le système de points dynamique depuis storage
export const getPointsSystem = () => {
  try {
    const stored = localStorage.getItem('smash_tournament_data');
    if (stored) {
      const data = JSON.parse(stored);
      const savedPoints = data.settings?.points;
      if (savedPoints) {
        // Fusionner avec les valeurs par défaut pour avoir les noms/descriptions
        return {
          '1v1': {
            ...DEFAULT_POINTS_SYSTEM['1v1'],
            win: savedPoints['1v1']?.win ?? DEFAULT_POINTS_SYSTEM['1v1'].win,
            lose: savedPoints['1v1']?.lose ?? DEFAULT_POINTS_SYSTEM['1v1'].lose
          },
          ffa: {
            ...DEFAULT_POINTS_SYSTEM.ffa,
            positions: savedPoints.ffa || DEFAULT_POINTS_SYSTEM.ffa.positions
          },
          team_ff: {
            ...DEFAULT_POINTS_SYSTEM.team_ff,
            win: savedPoints.team_ff?.win ?? DEFAULT_POINTS_SYSTEM.team_ff.win,
            lose: savedPoints.team_ff?.lose ?? DEFAULT_POINTS_SYSTEM.team_ff.lose
          },
          team_noff: {
            ...DEFAULT_POINTS_SYSTEM.team_noff,
            win: savedPoints.team_noff?.win ?? DEFAULT_POINTS_SYSTEM.team_noff.win,
            lose: savedPoints.team_noff?.lose ?? DEFAULT_POINTS_SYSTEM.team_noff.lose
          },
          casual: {
            ...DEFAULT_POINTS_SYSTEM.casual,
            win: savedPoints.casual?.win ?? DEFAULT_POINTS_SYSTEM.casual.win,
            lose: savedPoints.casual?.lose ?? DEFAULT_POINTS_SYSTEM.casual.lose
          }
        };
      }
    }
  } catch (e) {
    console.error('Erreur chargement config points:', e);
  }
  return { ...DEFAULT_POINTS_SYSTEM };
};

// Export pour compatibilité (utilise les valeurs dynamiques)
export const POINTS_SYSTEM = getPointsSystem();

// Combinaisons d'équipes pour rotation 2v2 (calculées dynamiquement)
export const getTeamRotations = () => {
  const mains = getMainPlayers();
  if (mains.length < 4) return [];

  // Générer toutes les combinaisons de 2 joueurs
  const allPairs = [];
  for (let i = 0; i < mains.length; i++) {
    for (let j = i + 1; j < mains.length; j++) {
      allPairs.push([mains[i], mains[j]]);
    }
  }

  // Générer les matchups uniques (éviter doublons team1 vs team2 = team2 vs team1)
  const rotations = [];
  const usedMatchups = new Set();

  for (let i = 0; i < allPairs.length; i++) {
    for (let j = i + 1; j < allPairs.length; j++) {
      const team1 = allPairs[i];
      const team2 = allPairs[j];

      // Vérifier que les équipes n'ont pas de joueur en commun
      const hasOverlap = team1.some(p => team2.includes(p));
      if (hasOverlap) continue;

      // Créer une clé unique pour ce matchup (ordre canonique)
      const sortedTeam1 = [...team1].sort().join(',');
      const sortedTeam2 = [...team2].sort().join(',');
      const key = [sortedTeam1, sortedTeam2].sort().join('|');

      if (!usedMatchups.has(key)) {
        usedMatchups.add(key);
        rotations.push({ team1, team2 });
      }
    }
  }

  return rotations;
};

export const TEAM_ROTATIONS = getTeamRotations();
