import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

type Row = {
  rank: number;
  projectName: string;
  submitterName: string;
  submitterEmail: string;
  finalScore: number;
  source: 'human' | 'ai';
};

export default function ResultsTab() {
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [top, setTop] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setError(null);
    try {
      const r = await api.resultsPreview();
      setPublishedAt(r.publishedAt);
      setTop(r.top);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function toggle(publish: boolean) {
    if (
      !publish &&
      !confirm('Unpublish results? The public Results page will hide them again.')
    )
      return;
    setBusy(true);
    setError(null);
    try {
      const { publishedAt } = await api.publishResults(publish);
      setPublishedAt(publishedAt);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Public results
            </div>
            <h3 className="mt-1 text-2xl font-semibold text-bwai-ink dark:text-neutral-100">
              {publishedAt ? 'Published' : 'Not published'}
            </h3>
            {publishedAt && (
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Live since {new Date(publishedAt).toLocaleString()}
              </p>
            )}
            {!publishedAt && (
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Until you publish, <code>/hackathon/results</code> shows a
                “coming soon” card.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {!publishedAt && (
              <button
                onClick={() => toggle(true)}
                disabled={busy || top.length === 0}
                className="rounded-full bg-bwai-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-bwai-blue disabled:opacity-50 dark:bg-white dark:text-bwai-ink dark:hover:bg-bwai-blue dark:hover:text-white"
              >
                {busy ? 'Publishing…' : 'Publish results'}
              </button>
            )}
            {publishedAt && (
              <button
                onClick={() => toggle(false)}
                disabled={busy}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-bwai-red ring-1 ring-bwai-red/40 hover:bg-bwai-red/10 disabled:opacity-50 dark:bg-neutral-900"
              >
                {busy ? 'Unpublishing…' : 'Unpublish'}
              </button>
            )}
          </div>
        </div>
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-bwai-red dark:bg-red-950/40">
            {error}
          </p>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
          Top 5 preview
        </h3>
        {top.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
            No judged submissions yet. Run AI judging (and ideally some human scores) first.
          </p>
        ) : (
          <ol className="mt-4 space-y-3">
            {top.map((r) => (
              <li
                key={r.rank}
                className="flex items-center gap-4 rounded-xl bg-neutral-50 px-4 py-3 dark:bg-neutral-950"
              >
                <span className="w-8 font-mono text-2xl font-bold tabular-nums text-bwai-ink dark:text-neutral-100">
                  {r.rank}
                </span>
                <div className="flex-1">
                  <div className="font-semibold text-bwai-ink dark:text-neutral-100">
                    {r.projectName}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {r.submitterName} · {r.submitterEmail}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-lg font-bold tabular-nums text-bwai-ink dark:text-neutral-100">
                    {r.finalScore.toFixed(2)}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                    {r.source === 'human' ? 'human' : 'ai only'}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
