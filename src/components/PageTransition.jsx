import { useLocation } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';

const PageTransition = ({ children }) => {
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
      }, 500); // Durée de l'animation

      return () => clearTimeout(timeout);
    }
  }, [transitionStage, location]);

  const className = `page-transition-wrapper page-transition-${direction}-${transitionStage}`;

  return (
    <div className={className}>
      {children}
    </div>
  );
};

export default PageTransition;
