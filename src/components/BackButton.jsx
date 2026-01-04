import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { playMenuSelectSound } from '../utils/sounds';

const BackButton = ({ to = -1, label = 'Retour' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    playMenuSelectSound();
    if (typeof to === 'number') {
      navigate(to);
    } else {
      navigate(to);
    }
  };

  return (
    <button
      className="melee-button back-button"
      onClick={handleClick}
      style={{
        position: 'fixed',
        bottom: '1rem',
        left: '1rem',
        padding: '0.6rem 1.2rem',
        fontSize: '0.9rem',
        zIndex: 100,
      }}
    >
      <Icon name="arrowLeft" size={14} /> {label}
    </button>
  );
};

export default BackButton;
