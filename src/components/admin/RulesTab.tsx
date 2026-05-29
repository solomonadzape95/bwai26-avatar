import { Link } from 'react-router-dom';
import { RULES_INTRO, RULES_TILES } from '../../content/rules';

export default function RulesTab() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-neutral-600">
          What attendees see on the Rules page. Edit copy in{' '}
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-bwai-ink">
            src/content/rules.ts
          </code>{' '}
          and redeploy.
        </p>
        <Link
          to="/hackathon/rules"
          target="_blank"
          className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-bwai-ink ring-1 ring-neutral-200 hover:ring-bwai-blue"
        >
          Open page ↗
        </Link>
      </div>

      <p className="rounded-2xl bg-white p-6 text-sm text-neutral-700 shadow-sm ring-1 ring-neutral-200">
        {RULES_INTRO}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {RULES_TILES.map((tile) => (
          <article
            key={tile.heading}
            className="flex flex-col gap-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"
          >
            <h3 className="text-lg font-semibold text-bwai-ink">{tile.heading}</h3>
            <p className="text-sm text-neutral-700">{tile.body}</p>
            {tile.bullets && (
              <ul className="mt-1 space-y-1 text-sm text-neutral-700">
                {tile.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-neutral-400" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
