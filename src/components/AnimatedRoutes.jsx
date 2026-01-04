import { Routes, Route, useLocation } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import Home from '../pages/Home';
import OneVsOne from '../pages/OneVsOne';
import FFA from '../pages/FFA';
import Team from '../pages/Team';
import Casual from '../pages/Casual';
import LeaderboardPage from '../pages/LeaderboardPage';
import Options from '../pages/Options';
import Players from '../pages/Players';
import TournamentSetup from '../pages/TournamentSetup';
import WallOfFame from '../pages/WallOfFame';

const AnimatedRoutes = () => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('enter');
  const [direction, setDirection] = useState('forward');
  const prevLocationRef = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      // Déterminer la direction
      const prev = prevLocationRef.current;
      const current = location.pathname;

      if (prev === '/' && current !== '/') {
        setDirection('forward');
      } else if (prev !== '/' && current === '/') {
        setDirection('backward');
      } else {
        setDirection('forward');
      }

      // Démarrer la transition de sortie
      setTransitionStage('exit');
    }
  }, [location, displayLocation]);

  useEffect(() => {
    if (transitionStage === 'exit') {
      // Attendre la fin de l'animation de sortie
      const timeout = setTimeout(() => {
        // Changer le contenu
        setDisplayLocation(location);
        setTransitionStage('enter');
        prevLocationRef.current = location.pathname;
      }, 350); // Durée de l'animation

      return () => clearTimeout(timeout);
    }
  }, [transitionStage, location]);

  const className = `page-transition-wrapper page-transition-${direction}-${transitionStage}`;

  return (
    <div className="page-transition-container">
      <div className={className}>
        <Routes location={displayLocation}>
        <Route path="/" element={<Home />} />
        <Route path="/tournament" element={<TournamentSetup />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/1v1" element={<OneVsOne />} />
        <Route path="/ffa" element={<FFA />} />
        <Route path="/team-ff" element={<Team mode="team_ff" />} />
        <Route path="/team-noff" element={<Team mode="team_noff" />} />
        <Route path="/casual" element={<Casual />} />
        <Route path="/options" element={<Options />} />
        <Route path="/players" element={<Players />} />
        <Route path="/wall-of-fame" element={<WallOfFame />} />
      </Routes>
      </div>
    </div>
  );
};

export default AnimatedRoutes;
