import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getTournamentHistory, deleteTournament } from '../data/storage';
import { getPlayer } from '../data/players';
import { useAudio } from '../context/AudioContext';
import { useModal } from '../components/Modal';
import LayoutEditor from '../components/LayoutEditor';

// Configuration par défaut du layout Wall of Fame
const DEFAULT_LAYOUT = {
  frameTop: 16,
  frameScale: 104,
  logoSize: 315,
  logoX: -50,
  logoY: -100,
  titleX: -40,
  titleAlign: 0,
  fontSize: 104,
};

const LAYOUT_CONTROLS = [
  { key: 'frameTop', label: 'Position Y', min: 0, max: 20, unit: 'vh', group: 'Cadre' },
  { key: 'frameScale', label: 'Échelle', min: 70, max: 110, unit: '%', group: 'Cadre' },
  { key: 'logoSize', label: 'Taille', min: 80, max: 350, unit: 'px', group: 'Logo' },
  { key: 'logoX', label: 'Position X', min: -50, max: 200, unit: 'px', group: 'Logo' },
  { key: 'logoY', label: 'Position Y', min: -100, max: 100, unit: 'px', group: 'Logo' },
  { key: 'titleX', label: 'Décalage X', min: -300, max: 200, unit: 'px', group: 'Titre' },
  { key: 'titleAlign', label: 'Alignement', min: 0, max: 100, step: 50, unit: '%', group: 'Titre' },
  { key: 'fontSize', label: 'Taille texte', min: 80, max: 120, unit: '%', group: 'Texte' },
];

const WallOfFame = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const { playSound } = useAudio();
  const { showConfirm } = useModal();
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);

  // Styles dynamiques basés sur le layout
  const dynamicStyles = {
    frame: {
      transform: `scale(${layout.frameScale / 100})`,
      marginTop: `${layout.frameTop}vh`,
      transformOrigin: 'top center',
      fontSize: `${layout.fontSize}%`,
    },
    logoContainer: {
      left: `${layout.logoX}px`,
      transform: `translateY(calc(-50% + ${layout.logoY}px))`,
    },
    logo: {
      height: `${layout.logoSize}px`,
    },
    title: {
      marginLeft: `${layout.titleX}px`,
      textAlign: layout.titleAlign === 0 ? 'left' : layout.titleAlign === 100 ? 'right' : 'center',
    },
    header: {
      paddingLeft: `${layout.logoX + layout.logoSize + 20}px`,
    },
  };

  useEffect(() => {
    setTournaments(getTournamentHistory());
  }, []);

  const handleDelete = (id, e) => {
    e.stopPropagation();
    showConfirm('Supprimer ce tournoi de l\'historique ?', () => {
      deleteTournament(id);
      setTournaments(getTournamentHistory());
      setSelectedTournament(null);
      playSound('cancel');
    });
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Compter les victoires par joueur
  const winCounts = tournaments.reduce((acc, t) => {
    if (t.winner) {
      acc[t.winner] = (acc[t.winner] || 0) + 1;
    }
    return acc;
  }, {});

  const topWinners = Object.entries(winCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // ====== CALCUL DES RECORDS ======
  const records = useMemo(() => {
    if (tournaments.length === 0) return null;

    // Stats globales
    const totalMatches = tournaments.reduce((sum, t) => sum + (t.matchCount || 0), 0);
    const totalTournaments = tournaments.length;

    // Meilleur score dans un tournoi
    let bestScore = { player: null, score: 0, tournament: null };
    // Plus grosse domination (écart 1er-2e)
    let biggestGap = { player: null, gap: 0, tournament: null };
    // Stats par joueur
    const playerStats = {};

    tournaments.forEach(t => {
      if (!t.ranking) return;

      t.ranking.forEach((entry, idx) => {
        if (!playerStats[entry.player]) {
          playerStats[entry.player] = {
            tournaments: 0,
            wins: 0,
            podiums: 0,
            totalPoints: 0,
            bestScore: 0,
            secondPlaces: 0
          };
        }

        const stats = playerStats[entry.player];
        stats.tournaments++;
        stats.totalPoints += entry.total || 0;

        if (entry.total > stats.bestScore) {
          stats.bestScore = entry.total;
        }

        if (idx === 0) stats.wins++;
        if (idx === 1) stats.secondPlaces++;
        if (idx < 3) stats.podiums++;

        // Record meilleur score
        if (entry.total > bestScore.score) {
          bestScore = { player: entry.player, score: entry.total, tournament: t.name };
        }
      });

      // Domination (écart 1er-2e)
      if (t.ranking.length >= 2) {
        const gap = (t.ranking[0]?.total || 0) - (t.ranking[1]?.total || 0);
        if (gap > biggestGap.gap) {
          biggestGap = { player: t.ranking[0].player, gap, tournament: t.name };
        }
      }
    });

    // Joueur le plus régulier (meilleure moyenne de placement)
    let mostConsistent = { player: null, avgPosition: Infinity };
    // Meilleure moyenne de points
    let bestAverage = { player: null, avg: 0 };
    // Plus de podiums
    let mostPodiums = { player: null, count: 0 };
    // Plus de 2e places (l'éternel second)
    let mostSecondPlaces = { player: null, count: 0 };

    Object.entries(playerStats).forEach(([playerId, stats]) => {
      if (stats.tournaments >= 2) {
        const avg = stats.totalPoints / stats.tournaments;
        if (avg > bestAverage.avg) {
          bestAverage = { player: playerId, avg: Math.round(avg) };
        }
      }

      if (stats.podiums > mostPodiums.count) {
        mostPodiums = { player: playerId, count: stats.podiums };
      }

      if (stats.secondPlaces > mostSecondPlaces.count && stats.secondPlaces >= 2) {
        mostSecondPlaces = { player: playerId, count: stats.secondPlaces };
      }
    });

    return {
      totalTournaments,
      totalMatches,
      bestScore: bestScore.player ? bestScore : null,
      biggestGap: biggestGap.player && biggestGap.gap > 0 ? biggestGap : null,
      bestAverage: bestAverage.player ? bestAverage : null,
      mostPodiums: mostPodiums.player ? mostPodiums : null,
      mostSecondPlaces: mostSecondPlaces.player ? mostSecondPlaces : null
    };
  }, [tournaments]);

  const renderTournamentModal = () => {
    if (!selectedTournament) return null;
    const t = selectedTournament;
    const winner = getPlayer(t.winner);

    return (
      <div className="modal-overlay" onClick={() => setSelectedTournament(null)}>
        <div className="modal-content tournament-modal" onClick={e => e.stopPropagation()}>
          <button className="close-btn" onClick={() => setSelectedTournament(null)}>X</button>

          <div className="modal-header">
            <span className="trophy">🏆</span>
            <h2>{t.name}</h2>
            <span className="modal-date">{formatDate(t.startedAt)}</span>
          </div>

          {/* Vainqueur */}
          <div className="winner-showcase">
            {winner?.image ? (
              <img src={winner.image} alt={winner.name} className="winner-img" />
            ) : (
              <div className="winner-avatar" style={{ background: winner?.color }}>
                {winner?.initial}
              </div>
            )}
            <div className="winner-info">
              <span className="winner-label">Vainqueur</span>
              <span className="winner-name" style={{ color: winner?.color }}>
                {winner?.name}
              </span>
            </div>
          </div>

          {/* Classement complet */}
          <div className="full-ranking">
            <h3>Classement Final</h3>
            {t.ranking?.map((entry, idx) => {
              const player = getPlayer(entry.player);
              return (
                <div key={entry.player} className="rank-row">
                  <span className={`rank-num rank-${idx + 1}`}>{idx + 1}</span>
                  <span className="rank-name" style={{ color: player?.color }}>
                    {player?.name}
                  </span>
                  <span className="rank-pts">{entry.total} pts</span>
                </div>
              );
            })}
          </div>

          {/* Infos */}
          <div className="tournament-meta">
            <div className="meta-item">
              <span className="meta-label">Joueurs</span>
              <span className="meta-value">{t.players?.length || 0}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Modes</span>
              <span className="meta-value">{t.modes?.join(', ')}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Matchs</span>
              <span className="meta-value">{t.matchCount || 0}</span>
            </div>
          </div>

          <button
            className="delete-btn"
            onClick={(e) => handleDelete(t.id, e)}
          >
            Supprimer ce tournoi
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="home-page">
      <div className="melee-main-frame dashboard-frame" style={{ ...dynamicStyles.frame, maxWidth: '800px' }}>
        {/* Header avec Logo style menu principal */}
        <div className="subpage-header" style={dynamicStyles.header}>
          <div className="subpage-logo-container" style={dynamicStyles.logoContainer}>
            <img src="/logo.png" alt="BFSA" className="subpage-logo" style={dynamicStyles.logo} />
            <div className="subpage-logo-glow"></div>
          </div>
          <div className="subpage-title" style={dynamicStyles.title}>
            <h1>WALL OF FAME</h1>
            <span className="mode-subtitle">Historique des tournois</span>
          </div>
        </div>

        {/* Top 3 des vainqueurs */}
        {topWinners.length > 0 && (
          <div className="legends-section">
            <h2 className="section-title">Légendes</h2>
            <div className="legends-podium">
              {topWinners.map(([playerId, wins], idx) => {
                const player = getPlayer(playerId);
                return (
                  <div key={playerId} className={`legend-card legend-${idx + 1}`}>
                    <div className="legend-rank">
                      {idx === 0 ? '👑' : idx === 1 ? '🥈' : '🥉'}
                    </div>
                    {player?.image ? (
                      <img src={player.image} alt={player.name} className="legend-img" />
                    ) : (
                      <div className="legend-avatar" style={{ background: player?.color }}>
                        {player?.initial}
                      </div>
                    )}
                    <span className="legend-name" style={{ color: player?.color }}>
                      {player?.name}
                    </span>
                    <span className="legend-wins">{wins} victoire{wins > 1 ? 's' : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section Records */}
        {records && (
          <div className="records-section">
            <h2 className="section-title">🏅 Records</h2>

            {/* Stats globales */}
            <div className="global-stats">
              <div className="stat-box">
                <span className="stat-value">{records.totalTournaments}</span>
                <span className="stat-label">Tournois</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">{records.totalMatches}</span>
                <span className="stat-label">Matchs</span>
              </div>
            </div>

            {/* Records individuels */}
            <div className="records-grid">
              {records.bestScore && (
                <div className="record-card">
                  <span className="record-icon">⭐</span>
                  <div className="record-info">
                    <span className="record-title">Meilleur Score</span>
                    <span className="record-holder" style={{ color: getPlayer(records.bestScore.player)?.color }}>
                      {getPlayer(records.bestScore.player)?.name}
                    </span>
                    <span className="record-value">{records.bestScore.score} pts</span>
                    <span className="record-context">{records.bestScore.tournament}</span>
                  </div>
                </div>
              )}

              {records.biggestGap && (
                <div className="record-card">
                  <span className="record-icon">💪</span>
                  <div className="record-info">
                    <span className="record-title">Plus Grosse Domination</span>
                    <span className="record-holder" style={{ color: getPlayer(records.biggestGap.player)?.color }}>
                      {getPlayer(records.biggestGap.player)?.name}
                    </span>
                    <span className="record-value">+{records.biggestGap.gap} pts d'avance</span>
                    <span className="record-context">{records.biggestGap.tournament}</span>
                  </div>
                </div>
              )}

              {records.bestAverage && (
                <div className="record-card">
                  <span className="record-icon">📊</span>
                  <div className="record-info">
                    <span className="record-title">Meilleure Moyenne</span>
                    <span className="record-holder" style={{ color: getPlayer(records.bestAverage.player)?.color }}>
                      {getPlayer(records.bestAverage.player)?.name}
                    </span>
                    <span className="record-value">{records.bestAverage.avg} pts/tournoi</span>
                  </div>
                </div>
              )}

              {records.mostPodiums && (
                <div className="record-card">
                  <span className="record-icon">🎯</span>
                  <div className="record-info">
                    <span className="record-title">Plus de Podiums</span>
                    <span className="record-holder" style={{ color: getPlayer(records.mostPodiums.player)?.color }}>
                      {getPlayer(records.mostPodiums.player)?.name}
                    </span>
                    <span className="record-value">{records.mostPodiums.count} podiums</span>
                  </div>
                </div>
              )}

              {records.mostSecondPlaces && (
                <div className="record-card">
                  <span className="record-icon">🥈</span>
                  <div className="record-info">
                    <span className="record-title">L'Éternel Second</span>
                    <span className="record-holder" style={{ color: getPlayer(records.mostSecondPlaces.player)?.color }}>
                      {getPlayer(records.mostSecondPlaces.player)?.name}
                    </span>
                    <span className="record-value">{records.mostSecondPlaces.count}x 2e place</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Liste des tournois */}
        <div className="tournaments-section">
          <h2 className="section-title">Tournois Passés</h2>

          {tournaments.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🏆</span>
              <p>Aucun tournoi terminé</p>
              <p className="empty-hint">Terminez un tournoi pour le voir apparaître ici !</p>
            </div>
          ) : (
            <div className="tournaments-list">
              {tournaments.map((t) => {
                const winner = getPlayer(t.winner);
                return (
                  <div
                    key={t.id}
                    className="tournament-card"
                    onClick={() => { setSelectedTournament(t); playSound('select'); }}
                  >
                    <div className="tournament-trophy">🏆</div>
                    <div className="tournament-info">
                      <span className="tournament-name">{t.name}</span>
                      <span className="tournament-date">{formatDate(t.startedAt)}</span>
                    </div>
                    <div className="tournament-winner">
                      {winner?.image ? (
                        <img src={winner.image} alt={winner.name} className="mini-avatar" />
                      ) : (
                        <div className="mini-avatar" style={{ background: winner?.color }}>
                          {winner?.initial}
                        </div>
                      )}
                      <span style={{ color: winner?.color }}>{winner?.name}</span>
                    </div>
                    <div className="tournament-arrow">→</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Link to="/" className="back-btn">
        ← Menu
      </Link>

      {/* Layout Editor (mode dev) */}
      <LayoutEditor
        pageKey="walloffame"
        defaultLayout={DEFAULT_LAYOUT}
        controls={LAYOUT_CONTROLS}
        onLayoutChange={setLayout}
      />

      {renderTournamentModal()}

      <style>{`
        .section-title {
          font-family: 'Oswald', sans-serif;
          color: var(--cyan-light);
          font-size: 1.1rem;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(0, 150, 180, 0.3);
        }

        .legends-section {
          margin-bottom: 25px;
        }

        .legends-podium {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .legend-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 15px 20px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          min-width: 120px;
        }

        .legend-card.legend-1 {
          background: linear-gradient(180deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 200, 0, 0.05) 100%);
          border: 2px solid rgba(255, 215, 0, 0.4);
          order: 0;
        }

        .legend-card.legend-2 {
          background: rgba(192, 192, 192, 0.1);
          border: 2px solid rgba(192, 192, 192, 0.3);
          order: -1;
        }

        .legend-card.legend-3 {
          background: rgba(205, 127, 50, 0.1);
          border: 2px solid rgba(205, 127, 50, 0.3);
          order: 1;
        }

        .legend-rank {
          font-size: 1.8rem;
          margin-bottom: 8px;
        }

        .legend-img, .legend-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
          margin-bottom: 8px;
        }

        .legend-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Oswald', sans-serif;
          font-size: 1.3rem;
          color: #1a1a1a;
        }

        .legend-name {
          font-family: 'Oswald', sans-serif;
          font-size: 1.1rem;
        }

        .legend-wins {
          font-size: 0.8rem;
          color: var(--yellow-selected);
          margin-top: 4px;
        }

        .tournaments-section {
          flex: 1;
        }

        .tournaments-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tournament-card {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 12px 15px;
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid rgba(100, 150, 200, 0.2);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tournament-card:hover {
          border-color: var(--cyan-light);
          background: rgba(255, 255, 255, 0.06);
        }

        .tournament-trophy {
          font-size: 1.5rem;
        }

        .tournament-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .tournament-name {
          font-family: 'Oswald', sans-serif;
          font-size: 1rem;
        }

        .tournament-date {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .tournament-winner {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mini-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          object-fit: cover;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          color: #1a1a1a;
        }

        .tournament-arrow {
          color: rgba(255, 255, 255, 0.3);
          font-size: 1.2rem;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          font-size: 4rem;
          display: block;
          margin-bottom: 15px;
          opacity: 0.5;
        }

        .empty-state p {
          font-family: 'Oswald', sans-serif;
          color: var(--cyan-light);
          margin: 0;
        }

        .empty-hint {
          font-size: 0.9rem !important;
          color: rgba(255, 255, 255, 0.5) !important;
          margin-top: 10px !important;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .tournament-modal {
          background: linear-gradient(180deg, #1a2a4a 0%, #0a1525 100%);
          border: 2px solid var(--yellow-selected);
          border-radius: 12px;
          padding: 25px;
          max-width: 450px;
          width: 90%;
          position: relative;
        }

        .close-btn {
          position: absolute;
          top: 10px;
          right: 15px;
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
        }

        .modal-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .modal-header .trophy {
          font-size: 3rem;
          display: block;
          margin-bottom: 10px;
        }

        .modal-header h2 {
          font-family: 'Oswald', sans-serif;
          color: var(--yellow-selected);
          font-size: 1.4rem;
          margin: 0;
        }

        .modal-date {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .winner-showcase {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          padding: 20px;
          background: linear-gradient(180deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 200, 0, 0.05) 100%);
          border: 1px solid rgba(255, 215, 0, 0.3);
          border-radius: 10px;
          margin-bottom: 20px;
        }

        .winner-img, .winner-avatar {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          object-fit: cover;
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
        }

        .winner-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: #1a1a1a;
        }

        .winner-info {
          display: flex;
          flex-direction: column;
        }

        .winner-label {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .winner-name {
          font-family: 'Oswald', sans-serif;
          font-size: 1.5rem;
        }

        .full-ranking {
          margin-bottom: 20px;
        }

        .full-ranking h3 {
          font-family: 'Oswald', sans-serif;
          color: var(--cyan-light);
          font-size: 0.95rem;
          margin-bottom: 10px;
        }

        .rank-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .rank-num {
          width: 25px;
          height: 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-weight: bold;
          font-size: 0.85rem;
          background: rgba(255, 255, 255, 0.1);
        }

        .rank-num.rank-1 {
          background: linear-gradient(135deg, #ffd700, #b8860b);
          color: #1a1a1a;
        }

        .rank-num.rank-2 {
          background: linear-gradient(135deg, #c0c0c0, #808080);
          color: #1a1a1a;
        }

        .rank-num.rank-3 {
          background: linear-gradient(135deg, #cd7f32, #8b4513);
        }

        .rank-name {
          flex: 1;
          font-family: 'Oswald', sans-serif;
        }

        .rank-pts {
          color: var(--yellow-selected);
          font-size: 0.9rem;
        }

        .tournament-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 20px;
          padding: 10px;
          background: rgba(0, 50, 80, 0.3);
          border-radius: 6px;
        }

        .meta-item {
          text-align: center;
        }

        .meta-label {
          display: block;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .meta-value {
          display: block;
          font-family: 'Oswald', sans-serif;
          color: var(--cyan-light);
        }

        .delete-btn {
          width: 100%;
          padding: 10px;
          background: rgba(255, 100, 100, 0.1);
          border: 1px solid rgba(255, 100, 100, 0.3);
          color: #ff9999;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
        }

        .delete-btn:hover {
          background: rgba(255, 100, 100, 0.2);
        }

        /* Records Section */
        .records-section {
          margin-bottom: 25px;
        }

        .global-stats {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin-bottom: 20px;
        }

        .stat-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 15px 25px;
          background: rgba(0, 150, 180, 0.1);
          border: 1px solid rgba(0, 150, 180, 0.3);
          border-radius: 10px;
        }

        .stat-value {
          font-family: 'Oswald', sans-serif;
          font-size: 2rem;
          color: var(--cyan-light);
        }

        .stat-label {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .records-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }

        .record-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 15px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(100, 150, 200, 0.2);
          border-radius: 8px;
          transition: all 0.2s;
        }

        .record-card:hover {
          border-color: var(--cyan-light);
          background: rgba(255, 255, 255, 0.05);
        }

        .record-icon {
          font-size: 1.5rem;
          margin-top: 2px;
        }

        .record-info {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .record-title {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .record-holder {
          font-family: 'Oswald', sans-serif;
          font-size: 1.1rem;
          margin: 2px 0;
        }

        .record-value {
          font-size: 0.9rem;
          color: var(--yellow-selected);
        }

        .record-context {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default WallOfFame;
