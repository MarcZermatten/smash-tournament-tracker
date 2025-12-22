import { useState, useCallback } from 'react';
import { MAIN_PLAYERS, TEAM_ROTATIONS, POINTS_SYSTEM, getPlayer } from '../data/players';
import { addMatch, getMatchesByType, undoLastMatch } from '../data/storage';
import { useAudio } from '../hooks/useAudio';
import BackButton from '../components/BackButton';
import Leaderboard from '../components/Leaderboard';

const Team = ({ mode = 'team_ff' }) => {
  const [view, setView] = useState('menu');
  const [selectedTeam, setSelectedTeam] = useState(null); // Index de TEAM_ROTATIONS
  const [winner, setWinner] = useState(null); // 'team1' ou 'team2'
  const [customTeam1, setCustomTeam1] = useState([]);
  const [customTeam2, setCustomTeam2] = useState([]);
  const [useCustomTeams, setUseCustomTeams] = useState(false);
  const [lastMatch, setLastMatch] = useState(null);
  const { playSound } = useAudio();

  const config = mode === 'team_ff' ? POINTS_SYSTEM.team_ff : POINTS_SYSTEM.team_noff;
  const modeIcon = mode === 'team_ff' ? '🔥' : '🤝';
  const modeName = mode === 'team_ff' ? '2v2 Friendly Fire' : '2v2 No Friendly Fire';

  const getTeams = () => {
    if (useCustomTeams) {
      return { team1: customTeam1, team2: customTeam2 };
    }
    if (selectedTeam !== null) {
      return TEAM_ROTATIONS[selectedTeam];
    }
    return null;
  };

  const isReady = () => {
    const teams = getTeams();
    if (!teams) return false;
    return teams.team1.length === 2 && teams.team2.length === 2 && winner !== null;
  };

  const handleSubmit = useCallback(() => {
    if (!isReady()) return;
    playSound('confirm');

    const teams = getTeams();
    const winners = winner === 'team1' ? teams.team1 : teams.team2;
    const losers = winner === 'team1' ? teams.team2 : teams.team1;

    const match = addMatch({
      type: mode,
      team1: teams.team1,
      team2: teams.team2,
      winners,
      losers,
      winPoints: config.win,
      losePoints: config.lose,
    });

    setLastMatch(match);
    setSelectedTeam(null);
    setWinner(null);
    setCustomTeam1([]);
    setCustomTeam2([]);
    setView('menu');

    window.dispatchEvent(new Event('scoreUpdate'));
  }, [mode, winner, selectedTeam, customTeam1, customTeam2, useCustomTeams, config, playSound]);

  const handleUndo = () => {
    const undone = undoLastMatch();
    if (undone) {
      playSound('cancel');
      setLastMatch(null);
      window.dispatchEvent(new Event('scoreUpdate'));
    }
  };

  const toggleCustomPlayer = (playerId, team) => {
    playSound('select');
    if (team === 1) {
      if (customTeam1.includes(playerId)) {
        setCustomTeam1(customTeam1.filter(p => p !== playerId));
      } else if (customTeam1.length < 2) {
        setCustomTeam1([...customTeam1, playerId]);
        setCustomTeam2(customTeam2.filter(p => p !== playerId));
      }
    } else {
      if (customTeam2.includes(playerId)) {
        setCustomTeam2(customTeam2.filter(p => p !== playerId));
      } else if (customTeam2.length < 2) {
        setCustomTeam2([...customTeam2, playerId]);
        setCustomTeam1(customTeam1.filter(p => p !== playerId));
      }
    }
  };

  const matches = getMatchesByType(mode);

  const renderMenu = () => (
    <div className="mode-menu">
      <h1 className="melee-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
        {modeIcon} {modeName}
      </h1>
      <p className="melee-subtitle" style={{ marginBottom: '2rem' }}>
        {config.description}
      </p>

      <nav className="melee-menu">
        <button className="melee-button" onClick={() => { setUseCustomTeams(false); setView('newMatch'); }}>
          🎮 Nouvelle Partie (Rotation)
        </button>
        <button className="melee-button" onClick={() => { setUseCustomTeams(true); setView('newMatch'); }}>
          🎯 Équipes Personnalisées
        </button>
        <button className="melee-button" onClick={() => setView('history')}>
          📜 Historique ({matches.length})
        </button>
        <button className="melee-button" onClick={() => setView('stats')}>
          📊 Classement {mode === 'team_ff' ? 'FF' : 'No FF'}
        </button>
      </nav>

      {lastMatch && (
        <div className="last-match-info" style={{ marginTop: '1.5rem' }}>
          <p className="text-cyan">Dernière partie enregistrée</p>
          <button
            className="melee-button"
            onClick={handleUndo}
            style={{ marginTop: '0.5rem', fontSize: '0.9rem', padding: '0.5rem 1rem' }}
          >
            ↩️ Annuler
          </button>
        </div>
      )}
    </div>
  );

  const renderRotationSelect = () => (
    <div className="rotation-select">
      <h2 className="melee-frame-header">Choisir la rotation</h2>

      <div className="rotations-grid">
        {TEAM_ROTATIONS.map((rotation, idx) => (
          <button
            key={idx}
            className={`rotation-option melee-frame ${selectedTeam === idx ? 'selected' : ''}`}
            onClick={() => { playSound('select'); setSelectedTeam(idx); }}
          >
            <div className="team-display">
              <div className="team team-1">
                {rotation.team1.map(p => (
                  <span key={p} className="team-player" style={{ '--player-color': getPlayer(p).color }}>
                    {getPlayer(p).name}
                  </span>
                ))}
              </div>
              <span className="vs">VS</span>
              <div className="team team-2">
                {rotation.team2.map(p => (
                  <span key={p} className="team-player" style={{ '--player-color': getPlayer(p).color }}>
                    {getPlayer(p).name}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderCustomTeamSelect = () => (
    <div className="custom-teams">
      <h2 className="melee-frame-header">Composer les équipes</h2>

      <div className="teams-builder">
        <div className="team-column melee-frame">
          <h3 className="text-cyan">Équipe 1</h3>
          <div className="team-slots">
            {MAIN_PLAYERS.map(playerId => {
              const player = getPlayer(playerId);
              const isInTeam1 = customTeam1.includes(playerId);
              const isInTeam2 = customTeam2.includes(playerId);

              return (
                <button
                  key={playerId}
                  className={`player-slot ${isInTeam1 ? 'selected' : ''} ${isInTeam2 ? 'other-team' : ''}`}
                  onClick={() => toggleCustomPlayer(playerId, 1)}
                  style={{ '--player-color': player.color }}
                >
                  <span className="player-avatar" style={{ background: player.color }}>{player.initial}</span>
                  <span>{player.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="vs-divider">VS</div>

        <div className="team-column melee-frame">
          <h3 className="text-orange">Équipe 2</h3>
          <div className="team-slots">
            {MAIN_PLAYERS.map(playerId => {
              const player = getPlayer(playerId);
              const isInTeam1 = customTeam1.includes(playerId);
              const isInTeam2 = customTeam2.includes(playerId);

              return (
                <button
                  key={playerId}
                  className={`player-slot ${isInTeam2 ? 'selected' : ''} ${isInTeam1 ? 'other-team' : ''}`}
                  onClick={() => toggleCustomPlayer(playerId, 2)}
                  style={{ '--player-color': player.color }}
                >
                  <span className="player-avatar" style={{ background: player.color }}>{player.initial}</span>
                  <span>{player.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderWinnerSelect = () => {
    const teams = getTeams();
    if (!teams || teams.team1.length !== 2 || teams.team2.length !== 2) return null;

    return (
      <div className="winner-select" style={{ marginTop: '1.5rem' }}>
        <h3 className="text-gold mb-1">Qui a gagné ?</h3>
        <div className="winner-buttons">
          <button
            className={`winner-btn melee-button ${winner === 'team1' ? 'selected' : ''}`}
            onClick={() => { playSound('select'); setWinner('team1'); }}
          >
            <span className="team-names">
              {teams.team1.map(p => getPlayer(p).name).join(' & ')}
            </span>
            <span className="points-preview text-gold">+{config.win} pts</span>
          </button>
          <button
            className={`winner-btn melee-button ${winner === 'team2' ? 'selected' : ''}`}
            onClick={() => { playSound('select'); setWinner('team2'); }}
          >
            <span className="team-names">
              {teams.team2.map(p => getPlayer(p).name).join(' & ')}
            </span>
            <span className="points-preview text-gold">+{config.win} pts</span>
          </button>
        </div>
      </div>
    );
  };

  const renderNewMatch = () => (
    <div className="new-match">
      {useCustomTeams ? renderCustomTeamSelect() : renderRotationSelect()}

      {renderWinnerSelect()}

      <div className="match-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
        <button
          className="melee-button"
          onClick={() => {
            setSelectedTeam(null);
            setWinner(null);
            setCustomTeam1([]);
            setCustomTeam2([]);
            setView('menu');
          }}
          style={{ flex: 1 }}
        >
          ❌ Annuler
        </button>
        <button
          className={`melee-button ${isReady() ? 'selected' : ''}`}
          onClick={handleSubmit}
          disabled={!isReady()}
          style={{ flex: 2 }}
        >
          ✅ Valider
        </button>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="match-history">
      <h2 className="melee-frame-header">📜 Historique {modeName}</h2>

      {matches.length === 0 ? (
        <p className="text-cyan text-center">Aucune partie enregistrée</p>
      ) : (
        <div className="history-list">
          {matches.slice(0, 20).map((match, idx) => (
            <div key={match.id} className="history-item melee-frame" style={{ marginBottom: '0.5rem', padding: '0.8rem' }}>
              <div className="history-header">
                <span className="text-gold">Partie #{matches.length - idx}</span>
                <span className="text-cyan" style={{ fontSize: '0.8rem' }}>
                  {new Date(match.timestamp).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="history-teams">
                <div className={`history-team ${match.winners.includes(match.team1[0]) ? 'winner' : 'loser'}`}>
                  🏆 {match.team1.map(p => getPlayer(p)?.name).join(' & ')}
                  {match.winners.includes(match.team1[0]) && <span className="text-gold"> +{match.winPoints}</span>}
                </div>
                <span className="vs-small">vs</span>
                <div className={`history-team ${match.winners.includes(match.team2[0]) ? 'winner' : 'loser'}`}>
                  🏆 {match.team2.map(p => getPlayer(p)?.name).join(' & ')}
                  {match.winners.includes(match.team2[0]) && <span className="text-gold"> +{match.winPoints}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="melee-button" onClick={() => setView('menu')} style={{ marginTop: '1rem', width: '100%' }}>
        ← Retour
      </button>
    </div>
  );

  const renderStats = () => (
    <div className="mode-stats">
      <h2 className="melee-frame-header">📊 Classement {modeName}</h2>
      <Leaderboard mode={mode} />
      <button className="melee-button" onClick={() => setView('menu')} style={{ marginTop: '1rem', width: '100%' }}>
        ← Retour
      </button>
    </div>
  );

  return (
    <div className="page team-page">
      <div className="page-content">
        {view === 'menu' && renderMenu()}
        {view === 'newMatch' && renderNewMatch()}
        {view === 'history' && renderHistory()}
        {view === 'stats' && renderStats()}
      </div>

      {view === 'menu' && <BackButton to="/" />}

      <style>{`
        .team-page {
          min-height: 100vh;
          padding: 2rem;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 3rem;
        }

        .page-content {
          width: 100%;
          max-width: 800px;
          animation: fadeIn 0.3s ease-out;
        }

        .mode-menu {
          text-align: center;
        }

        .rotations-grid {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .rotation-option {
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }

        .rotation-option:hover {
          border-color: var(--melee-gold);
        }

        .rotation-option.selected {
          border-color: var(--melee-cyan);
          box-shadow: 0 0 20px var(--melee-cyan);
        }

        .team-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .team {
          display: flex;
          gap: 0.5rem;
        }

        .team-player {
          padding: 0.3rem 0.6rem;
          background: var(--player-color);
          color: #1a0a2e;
          border-radius: 4px;
          font-weight: bold;
        }

        .vs {
          font-family: 'Orbitron', sans-serif;
          font-size: 1.2rem;
          color: var(--melee-gold);
        }

        .vs-small {
          font-size: 0.8rem;
          color: var(--melee-gold);
          margin: 0 0.5rem;
        }

        .teams-builder {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 1rem;
          align-items: start;
        }

        .team-column {
          padding: 1rem;
        }

        .team-column h3 {
          margin-bottom: 0.8rem;
          font-size: 1.1rem;
        }

        .team-slots {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .player-slot {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: var(--gradient-button);
          border: 2px solid transparent;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .player-slot:hover {
          border-color: var(--player-color);
        }

        .player-slot.selected {
          border-color: var(--melee-cyan);
          background: var(--gradient-button-hover);
        }

        .player-slot.other-team {
          opacity: 0.4;
        }

        .vs-divider {
          display: flex;
          align-items: center;
          font-family: 'Orbitron', sans-serif;
          font-size: 1.5rem;
          color: var(--melee-gold);
          text-shadow: 0 0 10px var(--melee-gold);
        }

        .winner-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .winner-btn {
          flex-direction: column;
          padding: 1rem;
        }

        .team-names {
          font-size: 1rem;
        }

        .points-preview {
          font-size: 0.8rem;
          margin-top: 0.3rem;
        }

        .history-teams {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.3rem;
          margin-top: 0.5rem;
        }

        .history-team {
          font-size: 0.9rem;
        }

        .history-team.winner {
          color: var(--melee-gold);
        }

        .history-team.loser {
          opacity: 0.6;
        }

        .history-team.loser::before {
          content: '';
        }

        .history-team.winner::before {
          content: '🏆 ';
        }

        .history-list {
          max-height: 60vh;
          overflow-y: auto;
        }

        @media (max-width: 600px) {
          .teams-builder {
            grid-template-columns: 1fr;
          }

          .vs-divider {
            justify-content: center;
            padding: 0.5rem;
          }

          .winner-buttons {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Team;
