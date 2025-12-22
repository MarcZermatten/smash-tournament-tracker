// Système de persistance LocalStorage
const STORAGE_KEY = 'smash_tournament_data';

const getDefaultData = () => ({
  matches: [],
  stats: {
    marc: { ffa: 0, team_ff: 0, team_noff: 0, casual: 0, '1v1': 0 },
    max: { ffa: 0, team_ff: 0, team_noff: 0, casual: 0, '1v1': 0 },
    flo: { ffa: 0, team_ff: 0, team_noff: 0, casual: 0, '1v1': 0 },
    boris: { ffa: 0, team_ff: 0, team_noff: 0, casual: 0, '1v1': 0 },
    daniel: { ffa: 0, team_ff: 0, team_noff: 0, casual: 0, '1v1': 0 }
  },
  tournamentHistory: [], // Historique des tournois terminés
  settings: {
    soundEnabled: true,
    musicEnabled: true,
    volume: 0.5,
    // Config points par défaut
    points: {
      '1v1': { win: 3, lose: 0 },
      ffa: { 1: 5, 2: 3, 3: 1, 4: 0 },
      team_ff: { win: 3, lose: 0 },
      team_noff: { win: 3, lose: 0 },
      casual: { win: 2, lose: 0 }
    },
    // Config matchs par défaut
    matchConfig: {
      '1v1': 'all', // 'all' = tous s'affrontent 1 fois
      ffa: 5,        // 5 matchs FFA
      team_ff: 'all',
      team_noff: 'all'
    }
  },
  version: 2
});

export const loadData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Migration si version plus ancienne
      return { ...getDefaultData(), ...data };
    }
  } catch (e) {
    console.error('Error loading data:', e);
  }
  return getDefaultData();
};

export const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Error saving data:', e);
    return false;
  }
};

export const addMatch = (match) => {
  const data = loadData();
  const newMatch = {
    ...match,
    id: Date.now(),
    timestamp: new Date().toISOString()
  };
  data.matches.push(newMatch);

  // Mettre à jour les stats
  if (match.type === 'ffa') {
    match.results.forEach(result => {
      data.stats[result.player].ffa += result.points;
    });
  } else {
    match.winners.forEach(player => {
      data.stats[player][match.type] += match.winPoints;
    });
    match.losers.forEach(player => {
      data.stats[player][match.type] += match.losePoints;
    });
  }

  saveData(data);
  return newMatch;
};

export const undoLastMatch = () => {
  const data = loadData();
  if (data.matches.length === 0) return null;

  const lastMatch = data.matches.pop();

  // Annuler les stats
  if (lastMatch.type === 'ffa') {
    lastMatch.results.forEach(result => {
      data.stats[result.player].ffa -= result.points;
    });
  } else {
    lastMatch.winners.forEach(player => {
      data.stats[player][lastMatch.type] -= lastMatch.winPoints;
    });
    lastMatch.losers.forEach(player => {
      data.stats[player][lastMatch.type] -= lastMatch.losePoints;
    });
  }

  saveData(data);
  return lastMatch;
};

export const getLeaderboard = () => {
  const data = loadData();
  const leaderboard = Object.entries(data.stats).map(([player, scores]) => ({
    player,
    total: (scores.ffa || 0) + (scores.team_ff || 0) + (scores.team_noff || 0) + (scores.casual || 0) + (scores['1v1'] || 0),
    '1v1': scores['1v1'] || 0,
    ...scores
  }));

  return leaderboard.sort((a, b) => b.total - a.total);
};

export const getMatchesByType = (type) => {
  const data = loadData();
  return data.matches.filter(m => m.type === type).reverse();
};

export const getPlayerStats = (playerId) => {
  const data = loadData();
  const matches = data.matches.filter(m => {
    if (m.type === 'ffa') {
      return m.results.some(r => r.player === playerId);
    }
    return m.winners.includes(playerId) || m.losers.includes(playerId);
  });

  let wins = 0;
  let total = 0;

  matches.forEach(m => {
    total++;
    if (m.type === 'ffa') {
      const result = m.results.find(r => r.player === playerId);
      if (result?.position === 1) wins++;
    } else {
      if (m.winners.includes(playerId)) wins++;
    }
  });

  return {
    points: data.stats[playerId],
    matches: total,
    wins,
    winRate: total > 0 ? Math.round((wins / total) * 100) : 0
  };
};

export const exportData = () => {
  const data = loadData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `smash_tournament_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importData = (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    if (data.matches && data.stats) {
      saveData(data);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Import error:', e);
    return false;
  }
};

export const resetSeason = () => {
  const data = getDefaultData();
  saveData(data);
  return data;
};

export const getSettings = () => {
  const data = loadData();
  return data.settings;
};

export const updateSettings = (newSettings) => {
  const data = loadData();
  data.settings = { ...data.settings, ...newSettings };
  saveData(data);
  return data.settings;
};

// ====== TOURNAMENT HISTORY ======

export const saveTournament = (tournament) => {
  const data = loadData();

  // Calculer le classement final
  const leaderboard = getLeaderboard();
  const tournamentPlayers = tournament.players || [];
  const finalRanking = leaderboard
    .filter(p => tournamentPlayers.includes(p.player))
    .map((p, idx) => ({
      ...p,
      rank: idx + 1
    }));

  const archivedTournament = {
    id: Date.now(),
    name: tournament.name,
    startedAt: tournament.startedAt,
    endedAt: new Date().toISOString(),
    players: tournament.players,
    modes: tournament.modes,
    ranking: finalRanking,
    winner: finalRanking[0]?.player || null,
    matchCount: data.matches.length
  };

  if (!data.tournamentHistory) {
    data.tournamentHistory = [];
  }
  data.tournamentHistory.unshift(archivedTournament); // Plus récent en premier

  saveData(data);
  return archivedTournament;
};

export const getTournamentHistory = () => {
  const data = loadData();
  return data.tournamentHistory || [];
};

export const getTournamentById = (id) => {
  const history = getTournamentHistory();
  return history.find(t => t.id === id);
};

export const deleteTournament = (id) => {
  const data = loadData();
  data.tournamentHistory = (data.tournamentHistory || []).filter(t => t.id !== id);
  saveData(data);
};

export const getPointsConfig = () => {
  const data = loadData();
  return data.settings?.points || getDefaultData().settings.points;
};

export const updatePointsConfig = (newPoints) => {
  const data = loadData();
  data.settings.points = { ...data.settings.points, ...newPoints };
  saveData(data);
  return data.settings.points;
};

export const getMatchConfig = () => {
  const data = loadData();
  return data.settings?.matchConfig || getDefaultData().settings.matchConfig;
};

export const updateMatchConfig = (newConfig) => {
  const data = loadData();
  data.settings.matchConfig = { ...data.settings.matchConfig, ...newConfig };
  saveData(data);
  return data.settings.matchConfig;
};
