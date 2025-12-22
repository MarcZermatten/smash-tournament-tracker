import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Background from './components/Background';
import Home from './pages/Home';
import OneVsOne from './pages/OneVsOne';
import FFA from './pages/FFA';
import Team from './pages/Team';
import Casual from './pages/Casual';
import LeaderboardPage from './pages/LeaderboardPage';
import Options from './pages/Options';
import Players from './pages/Players';
import './styles/melee.css';

function App() {
  return (
    <BrowserRouter>
      <Background />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/1v1" element={<OneVsOne />} />
        <Route path="/ffa" element={<FFA />} />
        <Route path="/team-ff" element={<Team mode="team_ff" />} />
        <Route path="/team-noff" element={<Team mode="team_noff" />} />
        <Route path="/casual" element={<Casual />} />
        <Route path="/options" element={<Options />} />
        <Route path="/players" element={<Players />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
