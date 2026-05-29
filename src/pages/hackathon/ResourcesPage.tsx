import { groupedByTier, type ResourceTier } from '../../content/resources';

const TIER_PILL: Record<ResourceTier, string> = {
  compulsory: 'bg-bwai-red text-white',
  recommended: 'bg-bwai-blue text-white',
  encouraged: 'bg-neutral-200 text-bwai-ink',
};

export default function ResourcesPage() {
  const groups = groupedByTier();
  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-bwai-green px-8 py-12 text-white shadow-sm sm:px-16 sm:py-20">
        <div className="text-sm font-bold uppercase tracking-[0.4em] text-white/80 sm:text-base">
          Resources
        </div>
        <h2 className="mt-4 text-5xl font-semibold leading-[1.05] sm:text-7xl lg:text-8xl">
          Built on Google.
        </h2>
        <p className="mt-5 max-w-3xl text-lg text-white/90 sm:text-2xl">
          Everything below is free or has a generous free tier. Compulsory tools are required;
          recommended ones are the fast path; encouraged ones are bonus.
        </p>
      </section>

      {groups.map((g) => (
        <section key={g.tier} className="space-y-5">
          <header className="flex flex-wrap items-baseline gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${TIER_PILL[g.tier]}`}
            >
              {g.meta.label}
            </span>
            <p className="text-base text-neutral-600 sm:text-lg">{g.meta.blurb}</p>
          </header>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {g.items.map((r) => (
              <a
                key={r.name}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-3 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-neutral-900 dark:ring-neutral-800 sm:p-8"
              >
                <h3 className="text-2xl font-semibold text-bwai-ink dark:text-neutral-100 sm:text-3xl">
                  {r.name}
                </h3>
                <p className="text-base font-semibold text-bwai-ink dark:text-neutral-100 sm:text-lg">
                  {r.tagline}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 sm:text-base">
                  {r.description}
                </p>
                <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-neutral-500 transition-colors group-hover:text-bwai-blue dark:text-neutral-400">
                  Open ↗
                </span>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
