import { useState } from 'react';
import RequireAdmin from '../../components/RequireAdmin';
import SubmissionsTab from '../../components/admin/SubmissionsTab';
import TimerTab from '../../components/admin/TimerTab';
import RulesTab from '../../components/admin/RulesTab';
import ResourcesTab from '../../components/admin/ResourcesTab';
import { setAdminToken } from '../../lib/api';

import ResultsTab from '../../components/admin/ResultsTab';
import GamesTab from '../../components/admin/GamesTab';

type Tab = 'submissions' | 'timer' | 'results' | 'games' | 'rules' | 'resources';

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'submissions', label: 'Submissions' },
  { key: 'timer', label: 'Timer' },
  { key: 'results', label: 'Results' },
  { key: 'games', label: 'Games' },
  { key: 'rules', label: 'Rules' },
  { key: 'resources', label: 'Resources' },
];

export default function AdminPage() {
  return (
    <RequireAdmin>
      <Dashboard />
    </RequireAdmin>
  );
}

function Dashboard() {
  const [tab, setTab] = useState<Tab>('submissions');

  function signOut() {
    setAdminToken(null);
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-widest text-bwai-blue">
            Admin
          </div>
          <h2 className="text-3xl font-semibold text-bwai-ink dark:text-neutral-100">
            Hackathon control
          </h2>
        </div>
        <button
          onClick={signOut}
          className="text-xs font-semibold uppercase tracking-wide text-neutral-500 hover:text-bwai-red dark:text-neutral-400"
        >
          Sign out
        </button>
      </header>

      <nav className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              tab === t.key
                ? 'bg-bwai-ink text-white dark:bg-white dark:text-bwai-ink'
                : 'bg-white text-bwai-ink ring-1 ring-neutral-200 hover:ring-bwai-blue dark:bg-neutral-900 dark:text-neutral-100 dark:ring-neutral-800 dark:hover:ring-bwai-blue'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div>
        {tab === 'submissions' && <SubmissionsTab />}
        {tab === 'timer' && <TimerTab />}
        {tab === 'results' && <ResultsTab />}
        {tab === 'games' && <GamesTab />}
        {tab === 'rules' && <RulesTab />}
        {tab === 'resources' && <ResourcesTab />}
      </div>
    </div>
  );
}
