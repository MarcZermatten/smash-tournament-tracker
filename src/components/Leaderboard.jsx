import { useEffect, useState } from 'react';
import { getLeaderboard } from '../data/storage';
import { getPlayers } from '../data/players';
import PlayerCard from './PlayerCard';

const Leaderboard = ({ filterCasual = true, mode = null }) => {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const updateLeaderboard = () => {
      let data = getLeaderboard();

      // Filtrer Daniel si demandé
      if (filterCasual) {
        const players = getPlayers();
        data = data.filter(entry => !players[entry.player]?.casual);
      }

      // Filtrer par mode si spécifié
      if (mode) {
        data = data.map(entry => ({
          ...entry,
          total: entry[mode] || 0
        })).sort((a, b) => b.total - a.total);
      }

      setLeaderboard(data);
    };

    updateLeaderboard();

    // Écouter les changements de storage
    const handleStorage = () => updateLeaderboard();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('scoreUpdate', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('scoreUpdate', handleStorage);
    };
  }, [filterCasual, mode]);

  if (leaderboard.length === 0) {
    return (
      <div className="melee-frame text-center">
        <p className="text-cyan">Aucun score enregistré</p>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      {leaderboard.map((entry, index) => (
        <PlayerCard
          key={entry.player}
          playerId={entry.player}
          score={entry.total}
          position={index + 1}
        />
      ))}
    </div>
  );
};

export default Leaderboard;
