import { Link } from 'react-router-dom';
import { useAudio } from '../hooks/useAudio';

const MenuButton = ({ to, icon, children, onClick, selected, disabled, style }) => {
  const { playSound } = useAudio();

  const handleClick = (e) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    playSound('confirm');
    if (onClick) onClick(e);
  };

  const handleMouseEnter = () => {
    if (!disabled) {
      playSound('menuMove');
    }
  };

  const className = `melee-button ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`;

  if (to) {
    return (
      <Link
        to={to}
        className={className}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        style={style}
      >
        {icon && <span className="melee-button-icon">{icon}</span>}
        <span>{children}</span>
      </Link>
    );
  }

  return (
    <button
      className={className}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      disabled={disabled}
      style={style}
    >
      {icon && <span className="melee-button-icon">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

export default MenuButton;
