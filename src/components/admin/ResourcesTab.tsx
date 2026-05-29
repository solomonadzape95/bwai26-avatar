import { Link } from 'react-router-dom';
import { groupedByTier, type ResourceTier } from '../../content/resources';

const TIER_PILL: Record<ResourceTier, string> = {
  compulsory: 'bg-bwai-red text-white',
  recommended: 'bg-bwai-blue text-white',
  encouraged: 'bg-neutral-200 text-bwai-ink',
};

export default function ResourcesTab() {
  const groups = groupedByTier();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-neutral-600">
          What attendees see on the Resources page. Edit the list (and tiers) in{' '}
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-bwai-ink">
            src/content/resources.ts
          </code>{' '}
          and redeploy.
        </p>
        <Link
          to="/hackathon/resources"
          target="_blank"
          className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-bwai-ink ring-1 ring-neutral-200 hover:ring-bwai-blue"
        >
          Open page ↗
        </Link>
      </div>

      {groups.map((g) => (
        <section key={g.tier} className="space-y-3">
          <header className="flex flex-wrap items-baseline gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${TIER_PILL[g.tier]}`}
            >
              {g.meta.label}
            </span>
            <p className="text-sm text-neutral-600">{g.meta.blurb}</p>
          </header>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {g.items.map((r) => (
              <a
                key={r.name}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-1.5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 hover:ring-bwai-blue"
              >
                <h3 className="text-lg font-semibold text-bwai-ink">{r.name}</h3>
                <p className="text-sm font-semibold text-bwai-ink">{r.tagline}</p>
                <p className="text-xs text-neutral-600">{r.description}</p>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
