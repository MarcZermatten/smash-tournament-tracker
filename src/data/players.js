// Joueurs du tournoi
export const PLAYERS = {
  marc: { id: 'marc', name: 'Marc', color: '#FF6B6B', initial: 'M' },
  max: { id: 'max', name: 'Max', color: '#4ECDC4', initial: 'MX' },
  flo: { id: 'flo', name: 'Flo', color: '#FFE66D', initial: 'F' },
  boris: { id: 'boris', name: 'Boris', color: '#95E1D3', initial: 'B' },
  daniel: { id: 'daniel', name: 'Daniel', color: '#DDA0DD', initial: 'D', casual: true }
};

export const MAIN_PLAYERS = ['marc', 'max', 'flo', 'boris'];
export const ALL_PLAYERS = ['marc', 'max', 'flo', 'boris', 'daniel'];

// Système de points équitable
export const POINTS_SYSTEM = {
  ffa: {
    name: 'Free For All',
    description: '4 joueurs, chacun pour soi',
    positions: {
      1: 5,  // 1er place : 5 points (récompense la victoire)
      2: 3,  // 2ème place : 3 points
      3: 1,  // 3ème place : 1 point (participation)
      4: 0   // 4ème place : 0 point
    }
  },
  team_ff: {
    name: '2v2 Friendly Fire',
    description: 'Équipes, dégâts alliés activés',
    win: 3,   // Victoire : 3 points par joueur
    lose: 0   // Défaite : 0 point
  },
  team_noff: {
    name: '2v2 No Friendly Fire',
    description: 'Équipes, dégâts alliés désactivés',
    win: 3,
    lose: 0
  },
  casual: {
    name: 'Mode Casual',
    description: 'Parties détendues avec Daniel',
    // Points personnalisables selon la config
    win: 2,
    lose: 0
  }
};

// Combinaisons d'équipes pour rotation 2v2
export const TEAM_ROTATIONS = [
  { team1: ['marc', 'max'], team2: ['flo', 'boris'] },
  { team1: ['marc', 'flo'], team2: ['max', 'boris'] },
  { team1: ['marc', 'boris'], team2: ['max', 'flo'] }
];

export const getPlayer = (id) => PLAYERS[id];
export const getPlayerName = (id) => PLAYERS[id]?.name || id;
