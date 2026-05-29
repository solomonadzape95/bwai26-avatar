import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const BASE_LINKS = [
  { to: '/hackathon/rules', label: 'Rules' },
  { to: '/hackathon/resources', label: 'Resources' },
  { to: '/hackathon/timer', label: 'Timer' },
  { to: '/hackathon/submit', label: 'Submit' },
];

export default function HackathonShell() {
  const [resultsLive, setResultsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch('/api/results');
        if (!res.ok) return;
        const json = (await res.json()) as { published?: boolean };
        if (!cancelled) setResultsLive(Boolean(json.published));
      } catch {
        // ignore
      }
    }
    check();
    const id = setInterval(check, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const links = [
    ...BASE_LINKS,
    ...(resultsLive ? [{ to: '/hackathon/results', label: 'Results' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-100 dark:from-neutral-950 dark:to-black">
      <header className="flex flex-col gap-4 px-6 pt-8 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-16">
        <Link to="/hackathon" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
            <img src="/logo.png" alt="GDG" className="h-8 w-8 object-contain" />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Build with AI · 2026
            </div>
            <h1 className="text-xl font-semibold text-bwai-ink dark:text-neutral-100">
              Hackathon
            </h1>
          </div>
        </Link>
        <nav className="flex flex-wrap items-center gap-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                  isActive
                    ? 'bg-bwai-ink text-white dark:bg-white dark:text-bwai-ink'
                    : 'bg-white text-bwai-ink ring-1 ring-neutral-200 hover:ring-bwai-blue dark:bg-neutral-900 dark:text-neutral-100 dark:ring-neutral-800 dark:hover:ring-bwai-blue'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <Link
            to="/"
            className="rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 hover:text-bwai-blue dark:text-neutral-400"
          >
            ← Avatar
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      <main className="w-full px-6 py-10 sm:px-10 lg:px-16">
        <Outlet />
      </main>

      <footer className="px-6 pb-10 text-center text-xs text-neutral-400 sm:px-10 lg:px-16 dark:text-neutral-500">
        <p>Build with AI 2026 · GDGOCUNN</p>
      </footer>
    </div>
  );
}
