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
  settings: {
    soundEnabled: true,
    musicEnabled: true,
    volume: 0.5
  },
  version: 1
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
