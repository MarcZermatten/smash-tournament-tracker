import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getLeaderboard, getPlayerStats } from '../data/storage';
import Icon from '../components/Icon';
import { getPlayer } from '../data/players';
import { useTournament } from '../context/TournamentContext';
import { useAudio } from '../context/AudioContext';
import { playMenuSelectSound } from '../utils/sounds';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [phase, setPhase] = useState('intro'); // intro, countdown, drumroll, revealing, champion, revealed
  const [revealedCount, setRevealedCount] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showMcDoAnnounce, setShowMcDoAnnounce] = useState(false);
  const { tournament, isActive } = useTournament();
  const { playSound, playAudioFile } = useAudio();

  useEffect(() => {
    const update = () => {
      let data = getLeaderboard();
      // Filtrer par les joueurs du tournoi (actif OU terminé avec joueurs définis)
      if (tournament.players && tournament.players.length > 0) {
        data = data.filter(e => tournament.players.includes(e.player));
      }
      setLeaderboard(data);
    };

    update();
    window.addEventListener('scoreUpdate', update);
    window.addEventListener('tournamentUpdate', update);
    return () => {
      window.removeEventListener('scoreUpdate', update);
      window.removeEventListener('tournamentUpdate', update);
    };
  }, [isActive, tournament]);

  // Fonction de reveal avec total passé en paramètre pour éviter closure stale
  // Timing précis : champion doit apparaître à exactement 10s du clic
  // Countdown: 3s, GAME: 2s, Révélation: 2s, Délai: 3s <Icon name="arrowRight" size={14} /> Total: 10s
  const doReveal = useCallback((total) => {
    setPhase('revealing');
    setRevealedCount(0);

    // Calculer le délai entre chaque révélation pour durer exactement 2s
    const totalRevealTime = 2000; // 2 secondes pour toutes les révélations
    const delayPerPlayer = total > 1 ? totalRevealTime / total : totalRevealTime;

    const revealNext = (currentCount) => {
      const newCount = currentCount + 1;
      setRevealedCount(newCount);
      playSound('select');

      if (newCount < total) {
        setTimeout(() => revealNext(newCount), delayPerPlayer);
      } else {
        // Après la dernière révélation, attendre 3s pour afficher le champion
        // Champion apparaîtra à : 3s (countdown) + 2s (GAME) + 2s (reveals) + 3s (delay) = 10s
        setTimeout(() => {
          setPhase('champion');
          playSound('confirm');

          setTimeout(() => {
            setPhase('revealed');
            setShowMcDoAnnounce(true);
          }, 4000);
        }, 3000); // 3 secondes de suspense avant le champion
      }
    };

    // Démarrer immédiatement la première révélation
    setTimeout(() => revealNext(0), 0);
  }, [playSound]);

  const startReveal = useCallback(() => {
    if (leaderboard.length === 0) return;

    const total = leaderboard.length; // Capturer la valeur maintenant
    playSound('select');

    // Lancer la musique One Punch Man (musique cachée, contrôlable via AudioContext)
    playAudioFile('/audio/one_punch_man.mp3', 0.5);

    // Jouer le son homerun après 8.7 secondes (aligné avec le moment épique)
    setTimeout(() => {
      const homerunSound = new Audio('/audio/ssbhomerun.mp3');
      homerunSound.volume = 0.7;
      homerunSound.play().catch(() => {});
    }, 8700);

    setPhase('countdown');
    setCountdown(3);

    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      setCountdown(count);
      playSound('select');

      if (count <= 0) {
        clearInterval(countdownInterval);
        // GAME phase - jouer l'annonce "GAME!"
        const gameSound = new Audio('/audio/ssbannouncer-game.mp3');
        gameSound.volume = 0.8;
        gameSound.play().catch(() => {});

        setPhase('drumroll');
        setTimeout(() => {
          doReveal(total); // Passer total directement
        }, 2000);
      }
    }, 1000);
  }, [leaderboard.length, playSound, playAudioFile, doReveal]);

  const resetReveal = () => {
    setPhase('intro');
    setRevealedCount(0);
    setShowMcDoAnnounce(false);
  };

  const isPositionRevealed = (position) => {
    // En phase 'revealed', tout est visible
    if (phase === 'revealed') return true;
    const total = leaderboard.length;
    return revealedCount >= (total - position);
  };

  const isJustRevealed = (position) => {
    const total = leaderboard.length;
    return revealedCount === (total - position);
  };

  const winner = leaderboard[0] ? getPlayer(leaderboard[0].player) : null;
  const lastTwoPlayers = leaderboard.slice(-2).map(e => getPlayer(e.player)?.name).join(' et ');

  const renderPlayerModal = () => {
    if (!selectedPlayer) return null;
    const player = getPlayer(selectedPlayer);
    const stats = getPlayerStats(selectedPlayer);

    return (
      <div className="player-modal-overlay" onClick={() => setSelectedPlayer(null)}>
        <div className="player-modal" onClick={e => e.stopPropagation()}>
          <button className="close-btn" onClick={() => setSelectedPlayer(null)}><Icon name="close" size={14} /></button>
          <div className="modal-header" style={{ '--player-color': player?.color }}>
            {player?.image ? (
              <img src={player.image} alt={player.name} className="modal-avatar-img" />
            ) : (
              <div className="modal-avatar" style={{ background: player?.color }}>{player?.initial}</div>
            )}
            <h2>{player?.name}</h2>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{stats?.matches || 0}</span>
              <span className="stat-label">Parties</span>
            </div>
            <div className="stat-item">
              <span className="stat-value gold">{stats?.wins || 0}</span>
              <span className="stat-label">Victoires</span>
            </div>
            <div className="stat-item">
              <span className="stat-value" style={{ color: (stats?.winRate || 0) >= 50 ? '#4ECDC4' : '#FF6B6B' }}>
                {stats?.winRate || 0}%
              </span>
              <span className="stat-label">Win Rate</span>
            </div>
          </div>
          <div className="points-breakdown">
            <h3>Points par mode</h3>
            <div className="mode-row"><span>1v1</span><span className="pts">{stats?.points?.['1v1'] || 0}</span></div>
            <div className="mode-row"><span>FFA</span><span className="pts">{stats?.points?.ffa || 0}</span></div>
            <div className="mode-row"><span>2v2 FF</span><span className="pts">{stats?.points?.team_ff || 0}</span></div>
            <div className="mode-row"><span>2v2 No FF</span><span className="pts">{stats?.points?.team_noff || 0}</span></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="results-page">
      {/* PHASE INTRO - Animation légendaire avec logo */}
      {phase === 'intro' && leaderboard.length > 0 && (
        <div className="legendary-intro">
          <div className="intro-bg">
            <div className="golden-rays"></div>
            <div className="particles">
              {[...Array(30)].map((_, i) => (
                <div key={i} className="particle" style={{
                  '--x': `${Math.random() * 100}%`,
                  '--delay': `${Math.random() * 3}s`,
                  '--duration': `${2 + Math.random() * 3}s`
                }}></div>
              ))}
            </div>
          </div>

          <div className="intro-content">
            <div className="logo-container">
              <img src="/logo.png" alt="BFSA Ultimate Legacy" className="legendary-logo" />
              <div className="logo-glow"></div>
              <div className="logo-ring"></div>
            </div>

            <div className="intro-text">
              <span className="presents">PRÉSENTE</span>
              <h1 className="title-legendary">LE CLASSEMENT FINAL</h1>
              {isActive && <span className="tournament-name">{tournament.name}</span>}
            </div>

            <div className="fighters-preview">
              {leaderboard.map((entry, idx) => {
                const player = getPlayer(entry.player);
                return (
                  <div key={entry.player} className="fighter-preview" style={{ '--delay': `${idx * 0.1}s` }}>
                    {player?.image ? (
                      <img src={player.image} alt="" />
                    ) : (
                      <div className="fighter-circle" style={{ background: player?.color }}>{player?.initial}</div>
                    )}
                  </div>
                );
              })}
            </div>

            <button className="start-reveal-btn" onClick={startReveal}>
              <span className="btn-glow"></span>
              <span className="btn-shine"></span>
              <span className="btn-content">
                <span className="btn-text">RÉVÉLER LES RÉSULTATS</span>
              </span>
            </button>

            <div className="combatants-count">{leaderboard.length} COMBATTANTS</div>
          </div>
          <Link to="/" className="back-btn-intro" onClick={playMenuSelectSound}><Icon name="arrowLeft" size={14} /> Retour au menu</Link>
        </div>
      )}

      {/* PHASE COUNTDOWN */}
      {phase === 'countdown' && (
        <div className="countdown-phase">
          <div className="countdown-flash" key={countdown}></div>
          <div className="countdown-content">
            <div className="countdown-number" key={countdown}>{countdown > 0 ? countdown : 'GO!'}</div>
          </div>
        </div>
      )}

      {/* PHASE GAME (ex-drumroll) */}
      {phase === 'drumroll' && (
        <div className="game-phase">
          <div className="game-flash"></div>
          <div className="game-content">
            <div className="game-text">GAME!</div>
          </div>
          <div className="suspense-particles">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="game-particle" style={{
                '--x': `${Math.random() * 100}%`,
                '--delay': `${Math.random() * 0.8}s`
              }}></div>
            ))}
          </div>
        </div>
      )}

      {/* PHASE REVEALING + CHAMPION + REVEALED */}
      {(phase === 'revealing' || phase === 'champion' || phase === 'revealed') && (
        <div className="reveal-phase">
          {/* Champion celebration overlay */}
          {phase === 'champion' && winner && (
            <div className="champion-overlay">
              <div className="champion-bg">
                <div className="champion-rays"></div>
                <div className="champion-sparkles">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="sparkle" style={{
                      '--x': `${Math.random() * 100}%`,
                      '--y': `${Math.random() * 100}%`,
                      '--delay': `${Math.random() * 1}s`
                    }}></div>
                  ))}
                </div>
              </div>
              <div className="champion-content">
                {/* TODO: Remplacer par asset "WINNER!" officiel */}
                <div className="winner-banner">WINNER</div>
                <div className="champion-avatar-container">
                  {winner?.image ? (
                    <img src={winner.image} alt={winner.name} className="champion-avatar" />
                  ) : (
                    <div className="champion-avatar-placeholder" style={{ background: winner?.color }}>
                      {winner?.initial}
                    </div>
                  )}
                  <div className="champion-ring"></div>
                </div>
                <h1 className="champion-name">{winner?.name}</h1>
                <div className="champion-title">CHAMPION</div>
                <div className="champion-score">{leaderboard[0]?.total} PTS</div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className={`leaderboard-container ${phase === 'champion' ? 'hidden' : ''}`}>
            <div className="leaderboard-header">
              <img src="/logo.png" alt="BFSA" className="header-logo" />
              <h1>CLASSEMENT</h1>
              {isActive && <span className="tournament-tag">{tournament.name}</span>}
            </div>

            {/* McDo Announce */}
            {showMcDoAnnounce && leaderboard.length >= 2 && (
              <div className="mcdo-announce">
                <div className="mcdo-icon-text">McDO</div>
                <div className="mcdo-text">
                  <span className="mcdo-title">CORVÉE McDO !</span>
                  <span className="mcdo-names">{lastTwoPlayers}</span>
                  <span className="mcdo-sub">doivent prendre les commandes !</span>
                </div>
              </div>
            )}

            <div className="leaderboard-list">
              {leaderboard.map((entry, position) => {
                const player = getPlayer(entry.player);
                const revealed = isPositionRevealed(position);
                const justRevealed = isJustRevealed(position);
                const isWinner = position === 0 && phase === 'revealed';
                const isLoser = position >= leaderboard.length - 2;
                const rank = position + 1;

                return (
                  <div
                    key={entry.player}
                    className={`lb-item ${revealed ? 'revealed' : 'hidden'} ${justRevealed ? 'just-revealed' : ''} ${isWinner ? 'winner' : ''} ${isLoser && revealed ? 'loser' : ''}`}
                    onClick={() => revealed && setSelectedPlayer(entry.player)}
                    style={{ '--player-color': player?.color }}
                  >
                    {revealed ? (
                      <>
                        <div className={`rank rank-${rank}`}>
                          {rank === 1 ? '1ST' : rank === 2 ? '2ND' : rank === 3 ? '3RD' : `#${rank}`}
                        </div>
                        <div className="player-info">
                          {player?.image ? (
                            <img src={player.image} alt={player.name} className="player-img" />
                          ) : (
                            <div className="player-avatar" style={{ background: player?.color }}>{player?.initial}</div>
                          )}
                          <div className="player-details">
                            <span className="name">{player?.name}</span>
                            <span className="breakdown">1v1: {entry['1v1'] || 0} | FFA: {entry.ffa || 0} | 2v2: {(entry.team_ff || 0) + (entry.team_noff || 0)}</span>
                          </div>
                        </div>
                        <div className="score">
                          <span className="score-value">{entry.total}</span>
                          <span className="score-label">PTS</span>
                        </div>
                        {isLoser && phase === 'revealed' && <div className="loser-badge">McD</div>}
                      </>
                    ) : (
                      <div className="hidden-content">
                        <span className="hidden-rank">#{rank}</span>
                        <span className="hidden-text">???</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {phase === 'revealed' && (
              <button className="reset-btn" onClick={resetReveal}><Icon name="refresh" size={16} /> Recommencer</button>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {leaderboard.length === 0 && (
        <div className="empty-state">
          <img src="/logo.png" alt="BFSA" className="empty-logo" />
          <div className="empty-icon"></div>
          <p>Aucun score enregistré</p>
          <p className="empty-hint">Jouez quelques parties pour voir le classement !</p>
        </div>
      )}

      <Link to="/" className="back-btn" onClick={playMenuSelectSound}><Icon name="arrowLeft" size={14} /> Menu</Link>
      {renderPlayerModal()}

      <style>{`
        .results-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        /* ==================== LEGENDARY INTRO ==================== */
        .legendary-intro {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #030508;
          z-index: 100;
        }

        .intro-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .golden-rays {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 200%;
          height: 200%;
          transform: translate(-50%, -50%);
          background: conic-gradient(from 0deg at 50% 50%,
            transparent 0deg,
            rgba(255, 200, 0, 0.05) 10deg,
            transparent 20deg,
            rgba(255, 200, 0, 0.03) 40deg,
            transparent 50deg
          );
          animation: raysSpin 30s linear infinite;
        }

        @keyframes raysSpin {
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        .particles {
          position: absolute;
          inset: 0;
        }

        .particle {
          position: absolute;
          left: var(--x);
          bottom: -10px;
          width: 4px;
          height: 4px;
          background: linear-gradient(180deg, #ffd700, #ff8c00);
          border-radius: 50%;
          animation: particleRise var(--duration) var(--delay) infinite;
        }

        @keyframes particleRise {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(-100vh) scale(1); opacity: 0; }
        }

        .intro-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .logo-container {
          position: relative;
          margin-bottom: 30px;
        }

        .legendary-logo {
          height: 400px;
          width: auto;
          filter: drop-shadow(0 10px 50px rgba(255, 200, 0, 0.5));
          animation: logoFloat 3s ease-in-out infinite;
        }

        @keyframes logoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }

        .logo-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, rgba(255, 200, 0, 0.3) 0%, transparent 70%);
          border-radius: 50%;
          animation: glowPulse 2s ease-in-out infinite;
        }

        @keyframes glowPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
        }

        .logo-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 600px;
          border: 2px solid rgba(255, 200, 0, 0.3);
          border-radius: 50%;
          animation: ringExpand 2s ease-out infinite;
        }

        @keyframes ringExpand {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }

        .intro-text {
          margin-bottom: 30px;
        }

        .presents {
          display: block;
          font-family: 'Oswald', sans-serif;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 0.5em;
          margin-bottom: 10px;
          animation: fadeIn 1s 0.5s both;
        }

        .title-legendary {
          font-family: 'Oswald', sans-serif;
          font-size: 3rem;
          font-weight: 700;
          color: var(--yellow-selected);
          text-shadow: 0 0 50px rgba(255, 200, 0, 0.8), 3px 3px 0 #8b6914;
          margin: 0;
          animation: titleReveal 1s 1s both;
        }

        @keyframes titleReveal {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .tournament-name {
          display: block;
          margin-top: 10px;
          font-family: 'Oswald', sans-serif;
          font-size: 1.2rem;
          color: var(--cyan-light);
          animation: fadeIn 1s 1.5s both;
        }

        .fighters-preview {
          display: flex;
          gap: 15px;
          margin-bottom: 40px;
        }

        .fighter-preview {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid rgba(255, 200, 0, 0.5);
          animation: fighterAppear 0.5s var(--delay) both;
          filter: grayscale(50%) brightness(0.7);
        }

        .fighter-preview img, .fighter-circle {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .fighter-circle {
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: #1a1a1a;
        }

        @keyframes fighterAppear {
          0% { transform: scale(0) rotate(180deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        .start-reveal-btn {
          position: relative;
          padding: 20px 50px;
          background: linear-gradient(180deg, #d4a520 0%, #8b6914 50%, #5a4510 100%);
          border: 4px solid #ffd700;
          border-radius: 15px;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s;
          margin-bottom: 30px;
        }

        .start-reveal-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 0 60px rgba(255, 215, 0, 0.8);
        }

        .btn-glow {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          animation: btnShine 2s infinite;
        }

        @keyframes btnShine {
          to { left: 100%; }
        }

        .btn-shine {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            rgba(255, 255, 255, 0.1) 60deg,
            transparent 120deg
          );
          animation: btnRotate 3s linear infinite;
        }

        @keyframes btnRotate {
          to { transform: rotate(360deg); }
        }

        .btn-content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }

        .btn-icon {
          font-size: 2rem;
        }

        .btn-text {
          font-family: 'Oswald', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }

        .combatants-count {
          font-family: 'Oswald', sans-serif;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 0.3em;
        }

        .back-btn-intro {
          position: absolute;
          top: 30px;
          left: 30px;
          padding: 12px 24px;
          background: rgba(0, 0, 0, 0.6);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          color: white;
          font-family: 'Oswald', sans-serif;
          font-size: 1rem;
          text-decoration: none;
          transition: all 0.2s;
          z-index: 10;
        }

        .back-btn-intro:hover {
          background: rgba(0, 0, 0, 0.8);
          border-color: var(--cyan-light);
          color: var(--cyan-light);
          transform: translateX(-5px);
        }

        /* ==================== COUNTDOWN ==================== */
        .countdown-phase {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          z-index: 100;
        }

        .countdown-flash {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(255, 255, 255, 0.8) 0%, transparent 50%);
          animation: flashPulse 1s ease-out;
        }

        @keyframes flashPulse {
          0% { opacity: 1; transform: scale(0.5); }
          50% { opacity: 0.8; }
          100% { opacity: 0; transform: scale(2); }
        }

        .countdown-content {
          text-align: center;
        }

        .countdown-number {
          font-family: 'Oswald', sans-serif;
          font-size: 15rem;
          font-weight: 900;
          color: var(--yellow-selected);
          text-shadow: 0 0 100px rgba(255, 200, 0, 1), 5px 5px 0 #8b6914;
          animation: countdownBeat 1s ease-out;
        }

        @keyframes countdownBeat {
          0% { transform: scale(2); opacity: 0; }
          50% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }

        .countdown-text {
          font-family: 'Oswald', sans-serif;
          font-size: 2rem;
          color: var(--cyan-light);
          letter-spacing: 0.3em;
        }

        /* ==================== GAME PHASE (ex-DRUMROLL) ==================== */
        .game-phase {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          z-index: 100;
          overflow: hidden;
        }

        .game-flash {
          position: absolute;
          inset: 0;
          background: white;
          animation: gameFlash 0.5s ease-out;
        }

        @keyframes gameFlash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }

        .game-content {
          position: relative;
          z-index: 2;
          text-align: center;
        }

        .game-text {
          font-family: 'Oswald', sans-serif;
          font-size: 12rem;
          font-weight: 900;
          color: #fff;
          text-shadow:
            0 0 40px rgba(255, 50, 50, 0.8),
            0 0 80px rgba(255, 100, 100, 0.5),
            8px 8px 0 #000,
            -4px -4px 0 #ff0000;
          letter-spacing: 0.1em;
          animation: gameTextReveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes gameTextReveal {
          0% {
            transform: scale(0) rotate(-15deg);
            opacity: 0;
          }
          60% {
            transform: scale(1.2) rotate(5deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        .game-set-text {
          font-family: 'Oswald', sans-serif;
          font-size: 4rem;
          font-weight: 700;
          color: var(--yellow-selected);
          text-shadow: 0 0 30px rgba(255, 200, 0, 0.8), 3px 3px 0 #000;
          letter-spacing: 0.3em;
          margin-top: 20px;
          animation: setTextAppear 0.5s 0.5s both;
        }

        @keyframes setTextAppear {
          0% { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }

        .suspense-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .game-particle {
          position: absolute;
          left: var(--x);
          bottom: -10%;
          width: 3px;
          height: 20px;
          background: linear-gradient(180deg, rgba(255, 200, 0, 1), rgba(255, 100, 0, 0));
          animation: particleShoot 1.5s var(--delay) ease-out;
        }

        @keyframes particleShoot {
          0% {
            transform: translateY(0) scale(0);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translateY(-120vh) scale(1);
            opacity: 0;
          }
        }

        /* ==================== CHAMPION OVERLAY ==================== */
        .champion-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          animation: championFadeIn 0.5s ease-out;
        }

        @keyframes championFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .champion-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(255, 200, 0, 0.2) 0%, #030508 70%);
        }

        .champion-rays {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 200%;
          height: 200%;
          transform: translate(-50%, -50%);
          background: conic-gradient(from 0deg at 50% 50%,
            transparent 0deg,
            rgba(255, 200, 0, 0.15) 5deg,
            transparent 10deg
          );
          animation: championRaysSpin 10s linear infinite;
        }

        @keyframes championRaysSpin {
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        .champion-sparkles {
          position: absolute;
          inset: 0;
        }

        .sparkle {
          position: absolute;
          left: var(--x);
          top: var(--y);
          width: 6px;
          height: 6px;
          background: #ffd700;
          border-radius: 50%;
          animation: sparkle 1s var(--delay) infinite;
        }

        @keyframes sparkle {
          0%, 100% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1); opacity: 1; }
        }

        .champion-content {
          position: relative;
          z-index: 2;
          text-align: center;
          animation: championReveal 1s ease-out;
        }

        @keyframes championReveal {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        .winner-banner {
          font-family: 'Oswald', sans-serif;
          font-size: 5rem;
          font-weight: 900;
          color: #fff;
          text-shadow:
            0 0 60px rgba(255, 215, 0, 1),
            0 0 100px rgba(255, 200, 0, 0.8),
            8px 8px 0 #000,
            -4px -4px 0 #ffd700;
          letter-spacing: 0.2em;
          margin-bottom: 20px;
          animation: winnerBounce 1s ease-in-out infinite;
        }

        @keyframes winnerBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-15px) scale(1.05); }
        }

        .champion-avatar-container {
          position: relative;
          margin: 20px 0;
        }

        .champion-avatar, .champion-avatar-placeholder {
          width: 180px;
          height: 180px;
          border-radius: 50%;
          object-fit: cover;
          border: 6px solid #ffd700;
          box-shadow: 0 0 60px rgba(255, 200, 0, 0.8);
        }

        .champion-avatar-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
          font-weight: bold;
          color: #1a1a1a;
        }

        .champion-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 220px;
          height: 220px;
          border: 3px solid rgba(255, 200, 0, 0.5);
          border-radius: 50%;
          animation: ringExpand 1.5s ease-out infinite;
        }

        .champion-name {
          font-family: 'Oswald', sans-serif;
          font-size: 4rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
          margin: 0;
        }

        .champion-title {
          font-family: 'Oswald', sans-serif;
          font-size: 2rem;
          color: var(--yellow-selected);
          text-shadow: 0 0 20px rgba(255, 200, 0, 0.8);
          letter-spacing: 0.3em;
        }

        .champion-score {
          font-family: 'Oswald', sans-serif;
          font-size: 3rem;
          color: var(--cyan-light);
          margin-top: 10px;
        }

        /* ==================== REVEAL PHASE ==================== */
        .reveal-phase {
          width: 100%;
          max-width: 700px;
        }

        .leaderboard-container {
          background: linear-gradient(180deg, rgba(10, 20, 40, 0.95) 0%, rgba(5, 10, 20, 0.98) 100%);
          border: 2px solid var(--cyan);
          border-radius: 15px;
          padding: 20px;
          transition: opacity 0.5s;
        }

        .leaderboard-container.hidden {
          opacity: 0;
          pointer-events: none;
        }

        .leaderboard-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid var(--cyan);
        }

        .header-logo {
          height: 50px;
        }

        .leaderboard-header h1 {
          font-family: 'Oswald', sans-serif;
          font-size: 1.8rem;
          color: var(--yellow-selected);
          margin: 0;
          flex: 1;
        }

        .tournament-tag {
          padding: 5px 12px;
          background: rgba(0, 200, 100, 0.2);
          border: 1px solid rgba(0, 200, 100, 0.4);
          border-radius: 20px;
          font-size: 0.85rem;
          color: #50ff90;
        }

        /* McDo */
        .mcdo-announce {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          margin-bottom: 15px;
          background: linear-gradient(90deg, rgba(255, 50, 50, 0.2), rgba(255, 200, 0, 0.2));
          border: 2px solid #ff6b6b;
          border-radius: 10px;
          animation: mcDoAppear 0.5s ease-out;
        }

        @keyframes mcDoAppear {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .mcdo-icon-text {
          font-family: 'Oswald', sans-serif;
          font-size: 2rem;
          font-weight: 900;
          color: #ff0000;
          background: linear-gradient(180deg, #ffeb3b 0%, #ff9800 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          animation: mcDoWiggle 0.4s infinite;
        }
        @keyframes mcDoWiggle { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
        .mcdo-text { display: flex; flex-direction: column; }
        .mcdo-title { font-family: 'Oswald', sans-serif; font-size: 1.2rem; font-weight: 700; color: #ff6b6b; }
        .mcdo-names { font-family: 'Oswald', sans-serif; font-size: 1.1rem; color: var(--yellow-selected); }
        .mcdo-sub { font-size: 0.8rem; color: rgba(255,255,255,0.6); }

        /* Leaderboard list */
        .leaderboard-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .lb-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 15px;
          background: rgba(255,255,255,0.03);
          border-left: 4px solid var(--player-color, rgba(255,255,255,0.2));
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
        }

        .lb-item.hidden {
          background: rgba(0,0,0,0.3);
          border-left-color: rgba(255,255,255,0.1);
          cursor: default;
        }

        .lb-item.revealed {
          animation: itemSlideIn 0.5s ease-out;
        }

        .lb-item.just-revealed {
          animation: itemPop 0.6s ease-out;
        }

        .lb-item.winner {
          background: linear-gradient(90deg, rgba(255, 215, 0, 0.3), rgba(255, 200, 0, 0.1));
          border-color: #ffd700;
          border-width: 4px;
        }

        .lb-item.loser {
          background: rgba(255, 100, 100, 0.1);
        }

        .lb-item.revealed:hover {
          background: rgba(255,255,255,0.08);
          transform: translateX(5px);
        }

        @keyframes itemSlideIn {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes itemPop {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }

        .hidden-content {
          display: flex;
          align-items: center;
          gap: 15px;
          width: 100%;
        }

        .hidden-rank {
          font-family: 'Oswald', sans-serif;
          font-size: 1.2rem;
          color: rgba(255,255,255,0.3);
          width: 40px;
        }

        .hidden-text {
          font-family: 'Oswald', sans-serif;
          color: rgba(255,255,255,0.2);
          letter-spacing: 0.2em;
        }

        .rank {
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Oswald', sans-serif;
          font-weight: bold;
          font-size: 1.1rem;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          flex-shrink: 0;
        }

        .rank-1 {
          background: linear-gradient(135deg, #ffd700, #b8860b);
          font-size: 1.4rem;
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
        }

        .rank-2 {
          background: linear-gradient(135deg, #e8e8e8, #a0a0a0);
          color: #1a1a1a;
        }

        .rank-3 {
          background: linear-gradient(135deg, #cd7f32, #8b4513);
        }

        .player-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .player-img, .player-avatar {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }

        .player-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Oswald', sans-serif;
          font-weight: bold;
          color: #1a1a1a;
        }

        .player-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .player-details .name {
          font-family: 'Oswald', sans-serif;
          font-size: 1.1rem;
        }

        .player-details .breakdown {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.4);
        }

        .score {
          text-align: right;
        }

        .score-value {
          display: block;
          font-family: 'Oswald', sans-serif;
          font-size: 1.8rem;
          color: var(--yellow-selected);
        }

        .score-label {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.4);
        }

        .loser-badge {
          position: absolute;
          right: 10px;
          top: -8px;
          font-size: 1.2rem;
        }

        .reset-btn {
          width: 100%;
          padding: 12px;
          margin-top: 15px;
          background: rgba(0, 150, 180, 0.2);
          border: 2px solid var(--cyan-light);
          border-radius: 8px;
          color: var(--cyan-light);
          font-family: 'Oswald', sans-serif;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .reset-btn:hover {
          background: rgba(0, 150, 180, 0.3);
        }

        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-logo {
          height: 100px;
          margin-bottom: 20px;
          opacity: 0.5;
        }

        .empty-icon {
          font-size: 4rem;
          display: block;
          margin-bottom: 15px;
        }

        .empty-state p {
          font-family: 'Oswald', sans-serif;
          font-size: 1.2rem;
          color: var(--cyan-light);
          margin: 5px 0;
        }

        .empty-hint {
          font-size: 0.9rem !important;
          color: rgba(255,255,255,0.4) !important;
        }

        /* Modal */
        .player-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .player-modal {
          position: relative;
          background: linear-gradient(180deg, #1a2a4a, #0a1525);
          border: 2px solid var(--player-color);
          border-radius: 12px;
          padding: 25px;
          max-width: 400px;
          width: 90%;
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
          opacity: 0.7;
        }

        .close-btn:hover { opacity: 1; }

        .modal-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid var(--player-color);
        }

        .modal-avatar, .modal-avatar-img {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
        }

        .modal-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: bold;
          color: #1a1a1a;
        }

        .modal-header h2 {
          font-family: 'Oswald', sans-serif;
          font-size: 1.5rem;
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }

        .stat-item { text-align: center; }
        .stat-value { display: block; font-family: 'Oswald', sans-serif; font-size: 1.8rem; color: var(--cyan-light); }
        .stat-value.gold { color: var(--yellow-selected); }
        .stat-label { font-size: 0.8rem; color: rgba(255,255,255,0.5); }

        .points-breakdown h3 {
          font-family: 'Oswald', sans-serif;
          color: var(--yellow-selected);
          margin-bottom: 10px;
          font-size: 1rem;
        }

        .mode-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          font-size: 0.9rem;
        }

        .mode-row .pts {
          color: var(--yellow-selected);
          font-weight: 600;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

    </div>
  );
};

export default LeaderboardPage;
