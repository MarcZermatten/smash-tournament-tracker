import { useState, useEffect, useMemo } from 'react';

const Intro = ({ onComplete }) => {
  const [phase, setPhase] = useState('black'); // black, burst, logo, title, shine, fadeout, done
  const [visible, setVisible] = useState(true);

  // Générer les particules une seule fois
  const particles = useMemo(() =>
    [...Array(40)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
      size: 2 + Math.random() * 6,
      duration: 3 + Math.random() * 2,
    })), []
  );

  // Générer les rayons
  const rays = useMemo(() =>
    [...Array(12)].map((_, i) => ({
      id: i,
      rotation: i * 30,
      delay: i * 0.1,
    })), []
  );

  useEffect(() => {
    // Séquence d'animation épique - joue à chaque visite/refresh
    const timeline = [
      { phase: 'black', delay: 0 },
      { phase: 'burst', delay: 300 },
      { phase: 'logo', delay: 400 },
      { phase: 'title', delay: 1800 },
      { phase: 'shine', delay: 3000 },
      { phase: 'fadeout', delay: 4200 },
      { phase: 'done', delay: 5200 },
    ];

    const timers = timeline.map(({ phase, delay }) =>
      setTimeout(() => {
        setPhase(phase);
        if (phase === 'done') {
          setVisible(false);
          onComplete?.();
        }
      }, delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  if (!visible) return null;

  const showLogo = ['logo', 'title', 'shine', 'fadeout'].includes(phase);
  const showTitle = ['title', 'shine', 'fadeout'].includes(phase);
  const showShine = ['shine', 'fadeout'].includes(phase);
  const showBurst = phase !== 'black';

  return (
    <div className={`intro-overlay ${phase === 'fadeout' ? 'fading' : ''}`}>
      {/* Fond avec effet de profondeur */}
      <div className="intro-bg">
        <div className="intro-vignette" />

        {/* Rayons épiques */}
        <div className={`intro-rays-container ${showBurst ? 'rays-active' : ''}`}>
          {rays.map(ray => (
            <div
              key={ray.id}
              className="intro-ray"
              style={{
                '--rotation': `${ray.rotation}deg`,
                '--delay': `${ray.delay}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Effet de flash burst */}
      <div className={`intro-burst ${phase === 'burst' || phase === 'logo' ? 'burst-active' : ''}`} />

      {/* Container principal */}
      <div className="intro-content">
        {/* Logo wrapper avec glow */}
        <div className={`intro-logo-wrapper ${showLogo ? 'logo-visible' : 'logo-entering'}`}>
          <div className="intro-logo-glow" />
          <div className="intro-logo-ring" />
          <img src="/logo.png" alt="BFSA Ultimate Legacy" className="intro-logo" />
        </div>

        {/* Titre du tournoi */}
        <div className={`intro-title ${showTitle ? 'title-visible' : ''}`}>
          <span className="intro-title-text">ULTIMATE LEGACY</span>
          <span className="intro-subtitle">TOURNAMENT</span>
        </div>

        {/* Effet de brillance */}
        <div className={`intro-shine ${showShine ? 'shine-active' : ''}`} />
      </div>

      {/* Particules dorées */}
      <div className="intro-particles">
        {particles.map(p => (
          <div
            key={p.id}
            className="particle"
            style={{
              '--x': `${p.x}%`,
              '--y': `${p.y}%`,
              '--delay': `${p.delay}s`,
              '--size': `${p.size}px`,
              '--duration': `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Étoiles scintillantes */}
      <div className="intro-sparkles">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="sparkle"
            style={{
              '--x': `${10 + Math.random() * 80}%`,
              '--y': `${10 + Math.random() * 80}%`,
              '--delay': `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        .intro-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          transition: opacity 1s ease-out;
        }

        .intro-overlay.fading {
          opacity: 0;
          pointer-events: none;
        }

        .intro-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .intro-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 70% 70% at 50% 50%,
            transparent 0%,
            rgba(0, 0, 0, 0.3) 40%,
            rgba(0, 0, 0, 0.95) 100%
          );
          z-index: 1;
        }

        /* Rayons individuels épiques */
        .intro-rays-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          opacity: 0;
          transition: opacity 0.5s ease-out;
        }

        .intro-rays-container.rays-active {
          opacity: 1;
        }

        .intro-ray {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 150vmax;
          height: 3px;
          background: linear-gradient(90deg,
            rgba(255, 200, 0, 0.8) 0%,
            rgba(255, 180, 0, 0.4) 20%,
            rgba(255, 150, 0, 0.1) 50%,
            transparent 100%
          );
          transform-origin: left center;
          transform: rotate(var(--rotation));
          animation: rayPulse 3s ease-in-out infinite;
          animation-delay: var(--delay);
        }

        @keyframes rayPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        /* Flash burst d'apparition */
        .intro-burst {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: radial-gradient(circle,
            rgba(255, 220, 100, 1) 0%,
            rgba(255, 180, 0, 0.8) 30%,
            rgba(255, 150, 0, 0.4) 60%,
            transparent 100%
          );
          transform: translate(-50%, -50%);
          opacity: 0;
          pointer-events: none;
          z-index: 3;
        }

        .intro-burst.burst-active {
          animation: burstExpand 0.8s ease-out forwards;
        }

        @keyframes burstExpand {
          0% {
            width: 0;
            height: 0;
            opacity: 1;
          }
          30% {
            width: 200vmax;
            height: 200vmax;
            opacity: 0.8;
          }
          100% {
            width: 300vmax;
            height: 300vmax;
            opacity: 0;
          }
        }

        .intro-content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 5;
        }

        .intro-logo-wrapper {
          position: relative;
          transition: all 1.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .intro-logo-wrapper.logo-entering {
          transform: scale(0.1);
          opacity: 0;
          filter: blur(20px);
        }

        .intro-logo-wrapper.logo-visible {
          transform: scale(1);
          opacity: 1;
          filter: blur(0);
        }

        .intro-logo {
          height: 420px;
          width: auto;
          filter: drop-shadow(0 0 60px rgba(255, 200, 0, 0.5))
                  drop-shadow(0 20px 50px rgba(0, 0, 0, 0.8));
          position: relative;
          z-index: 3;
        }

        .intro-logo-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(circle,
            rgba(255, 200, 0, 0.4) 0%,
            rgba(255, 150, 0, 0.2) 30%,
            rgba(255, 100, 0, 0.1) 50%,
            transparent 70%
          );
          border-radius: 50%;
          animation: glowPulse 2.5s ease-in-out infinite;
          pointer-events: none;
          z-index: 1;
        }

        .intro-logo-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 500px;
          height: 500px;
          border: 2px solid rgba(255, 200, 0, 0.3);
          border-radius: 50%;
          animation: ringExpand 3s ease-out infinite;
          pointer-events: none;
          z-index: 2;
        }

        @keyframes glowPulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.7;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 1;
          }
        }

        @keyframes ringExpand {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }

        /* Titre ULTIMATE LEGACY */
        .intro-title {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 30px;
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .intro-title.title-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .intro-title-text {
          font-family: 'Oswald', sans-serif;
          font-size: 3rem;
          font-weight: 700;
          letter-spacing: 0.3em;
          color: transparent;
          background: linear-gradient(180deg,
            #FFD700 0%,
            #FFA500 50%,
            #FF8C00 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          text-shadow: 0 0 40px rgba(255, 200, 0, 0.5);
          animation: titleGlow 2s ease-in-out infinite;
        }

        .intro-subtitle {
          font-family: 'Oswald', sans-serif;
          font-size: 1.2rem;
          font-weight: 300;
          letter-spacing: 1em;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 10px;
        }

        @keyframes titleGlow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }

        .intro-shine {
          position: absolute;
          top: -50%;
          left: -100%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            105deg,
            transparent 0%,
            transparent 40%,
            rgba(255, 255, 255, 0.3) 45%,
            rgba(255, 255, 255, 0.5) 50%,
            rgba(255, 255, 255, 0.3) 55%,
            transparent 60%,
            transparent 100%
          );
          opacity: 0;
          pointer-events: none;
        }

        .intro-shine.shine-active {
          animation: shinePass 1.2s ease-out forwards;
        }

        @keyframes shinePass {
          0% {
            left: -100%;
            opacity: 1;
          }
          100% {
            left: 100%;
            opacity: 0;
          }
        }

        .intro-particles {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 4;
        }

        .particle {
          position: absolute;
          left: var(--x);
          top: var(--y);
          width: var(--size);
          height: var(--size);
          background: radial-gradient(circle,
            rgba(255, 220, 100, 1) 0%,
            rgba(255, 180, 0, 0.6) 50%,
            transparent 100%
          );
          border-radius: 50%;
          animation: particleRise var(--duration) ease-out infinite;
          animation-delay: var(--delay);
          opacity: 0;
        }

        @keyframes particleRise {
          0% {
            transform: translateY(0) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-150px) scale(0.3);
            opacity: 0;
          }
        }

        /* Étoiles scintillantes */
        .intro-sparkles {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 6;
        }

        .sparkle {
          position: absolute;
          left: var(--x);
          top: var(--y);
          width: 4px;
          height: 4px;
          animation: sparkleFlash 1.5s ease-in-out infinite;
          animation-delay: var(--delay);
        }

        .sparkle::before,
        .sparkle::after {
          content: '';
          position: absolute;
          background: white;
        }

        .sparkle::before {
          width: 100%;
          height: 2px;
          top: 50%;
          left: 0;
          transform: translateY(-50%);
        }

        .sparkle::after {
          width: 2px;
          height: 100%;
          left: 50%;
          top: 0;
          transform: translateX(-50%);
        }

        @keyframes sparkleFlash {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .intro-logo {
            height: 280px;
          }
          .intro-logo-glow {
            width: 400px;
            height: 400px;
          }
          .intro-logo-ring {
            width: 350px;
            height: 350px;
          }
          .intro-title-text {
            font-size: 2rem;
          }
          .intro-subtitle {
            font-size: 1rem;
            letter-spacing: 0.5em;
          }
        }

        @media (max-width: 480px) {
          .intro-logo {
            height: 200px;
          }
          .intro-logo-glow {
            width: 300px;
            height: 300px;
          }
          .intro-logo-ring {
            width: 250px;
            height: 250px;
          }
          .intro-title-text {
            font-size: 1.5rem;
            letter-spacing: 0.2em;
          }
          .intro-subtitle {
            font-size: 0.8rem;
            letter-spacing: 0.3em;
          }
        }
      `}</style>
    </div>
  );
};

export default Intro;
