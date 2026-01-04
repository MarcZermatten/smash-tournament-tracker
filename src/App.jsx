import { BrowserRouter } from 'react-router-dom';
import { TournamentProvider } from './context/TournamentContext';
import { AudioProvider } from './context/AudioContext';
import { ModalProvider } from './components/Modal';
import Background from './components/Background';
import Intro from './components/Intro';
import AudioControls from './components/AudioControls';
import AnimatedRoutes from './components/AnimatedRoutes';
import './styles/melee.css';

function App() {
  return (
    <AudioProvider>
      <TournamentProvider>
        <ModalProvider>
          <Intro />
          <BrowserRouter>
            <Background />
            <AnimatedRoutes />
            <AudioControls />
          </BrowserRouter>
        </ModalProvider>
      </TournamentProvider>
    </AudioProvider>
  );
}

export default App;
