import { useMemo } from 'react';

const Background = () => {
  const gridPaths = useMemo(() => {
    const paths = [];
    const gridSize = 25; // Espacement entre lignes (en unités SVG)
    const width = 1000;
    const height = 600;

    // Lignes HORIZONTALES (droites)
    for (let y = 0; y <= height; y += gridSize) {
      paths.push(`M 0 ${y} L ${width} ${y}`);
    }

    // Lignes VERTICALES (courbées - effet cylindre)
    for (let x = 0; x <= width; x += gridSize) {
      const centerX = width / 2;
      const distFromCenter = (x - centerX) / centerX; // -1 à 1
      const curveAmount = 80 * Math.pow(Math.abs(distFromCenter), 1.5) * Math.sign(distFromCenter);

      // Point de contrôle au milieu, décalé horizontalement
      const ctrlX = x + curveAmount;
      const ctrlY = height / 2;

      paths.push(`M ${x} 0 Q ${ctrlX} ${ctrlY} ${x} ${height}`);
    }

    return paths;
  }, []);

  return (
    <>
      <div className="melee-background">
        <svg
          className="grid-svg"
          viewBox="0 0 1000 600"
          preserveAspectRatio="none"
        >
          {gridPaths.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="#0088bb"
              strokeWidth="1"
              opacity="0.35"
            />
          ))}
        </svg>
      </div>

      {/* Ellipses lumineuses */}
      <div className="melee-glow" />

      {/* Lens flare */}
      <div className="lens-flare" />

      {/* Orbes lumineux flottants */}
      <div className="light-orb light-orb-1" />
      <div className="light-orb light-orb-2" />

      {/* Filtre VHS (scanlines + grain + aberration) */}
      <div className="vhs-overlay" />
    </>
  );
};

export default Background;
