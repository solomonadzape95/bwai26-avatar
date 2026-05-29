import { Link } from 'react-router-dom';

const CARDS = [
  {
    to: '/hackathon/rules',
    label: 'Rules',
    blurb: 'Eligibility, teams, what to build, how you’re judged.',
  },
  {
    to: '/hackathon/resources',
    label: 'Resources',
    blurb: 'Gemini, Antigravity, Firebase, Vertex AI, NotebookLM.',
  },
  {
    to: '/hackathon/timer',
    label: 'Timer',
    blurb: 'Live countdown to start, then to the submission deadline.',
  },
  {
    to: '/hackathon/submit',
    label: 'Submit',
    blurb: 'Project name, GitHub repo, overview, screenshots.',
  },
];

export default function HackathonHub() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-bwai-blue px-8 py-16 text-white shadow-sm sm:px-16 sm:py-24 lg:py-32">
        <div className="text-sm font-bold uppercase tracking-[0.4em] text-white/80 sm:text-base">
          Hackathon Hub
        </div>
        <h2 className="mt-4 text-5xl font-semibold leading-[1.05] sm:text-7xl lg:text-8xl xl:text-9xl">
          Build with AI 2026
        </h2>
        <p className="mt-6 max-w-3xl text-lg text-white/90 sm:text-2xl">
          45 minutes. One team. Build something with AI, ship it, pitch it. Everything you need is
          in the four pages below.
        </p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        {CARDS.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="group flex flex-col gap-3 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-neutral-200 transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-neutral-900 dark:ring-neutral-800 sm:p-10"
          >
            <h3 className="text-4xl font-semibold text-bwai-ink dark:text-neutral-100 sm:text-5xl lg:text-6xl">
              {c.label}
            </h3>
            <p className="text-base text-neutral-600 dark:text-neutral-300 sm:text-lg">
              {c.blurb}
            </p>
            <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-neutral-500 transition-colors group-hover:text-bwai-blue dark:text-neutral-400 sm:text-base">
              Open →
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
