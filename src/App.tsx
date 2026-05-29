import { Route, Routes } from 'react-router-dom';
import AvatarPage from './pages/AvatarPage';
import HackathonShell from './components/HackathonShell';
import HackathonHub from './pages/hackathon/HackathonHub';
import RulesPage from './pages/hackathon/RulesPage';
import ResourcesPage from './pages/hackathon/ResourcesPage';
import TimerPage from './pages/hackathon/TimerPage';
import SubmitPage from './pages/hackathon/SubmitPage';
import ResultsPage from './pages/hackathon/ResultsPage';
import AdminPage from './pages/hackathon/AdminPage';
import AdminSubmissionPage from './pages/hackathon/AdminSubmissionPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AvatarPage />} />
      <Route path="/hackathon" element={<HackathonShell />}>
        <Route index element={<HackathonHub />} />
        <Route path="rules" element={<RulesPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="timer" element={<TimerPage />} />
        <Route path="submit" element={<SubmitPage />} />
        <Route path="results" element={<ResultsPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="admin/:id" element={<AdminSubmissionPage />} />
      </Route>
    </Routes>
  );
}
