import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import type { SubmissionSummary } from '../../lib/metrics';

const CONCURRENCY = 3;

type Failure = { id: string; projectName: string; error: string };

type Progress = {
  active: boolean;
  total: number;
  done: number;
  inFlight: number;
  failures: Failure[];
};

const INITIAL: Progress = { active: false, total: 0, done: 0, inFlight: 0, failures: [] };

export default function SubmissionsTab() {
  const [submissions, setSubmissions] = useState<SubmissionSummary[] | null>(null);
  const [finalists, setFinalists] = useState<SubmissionSummary[] | null>(null);
  const [view, setView] = useState<'all' | 'finalists'>('all');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>(INITIAL);

  async function refresh() {
    setError(null);
    try {
      const [a, f] = await Promise.all([api.listSubmissions(), api.finalists()]);
      setSubmissions(a.submissions);
      setFinalists(f.finalists);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to load');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function judgeWithPool(targets: SubmissionSummary[]) {
    if (targets.length === 0) return;
    setProgress({
      active: true,
      total: targets.length,
      done: 0,
      inFlight: 0,
      failures: [],
    });
    let cursor = 0;
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, targets.length) }, async () => {
        while (cursor < targets.length) {
          const t = targets[cursor++];
          setProgress((p) => ({ ...p, inFlight: p.inFlight + 1 }));
          try {
            await api.judge(t.id);
            setProgress((p) => ({ ...p, done: p.done + 1, inFlight: p.inFlight - 1 }));
          } catch (err) {
            setProgress((p) => ({
              ...p,
              done: p.done + 1,
              inFlight: p.inFlight - 1,
              failures: [
                ...p.failures,
                {
                  id: t.id,
                  projectName: t.projectName,
                  error: err instanceof Error ? err.message : 'failed',
                },
              ],
            }));
          }
        }
      }),
    );
    setProgress((p) => ({ ...p, active: false }));
    await refresh();
  }

  async function runAiJudging() {
    if (!submissions) return;
    await judgeWithPool(submissions.filter((s) => s.aiWeightedTotal === null));
  }

  async function retryFailure(id: string, projectName: string) {
    setProgress((p) => ({
      ...p,
      failures: p.failures.filter((f) => f.id !== id),
    }));
    try {
      await api.judge(id);
      await refresh();
    } catch (err) {
      setProgress((p) => ({
        ...p,
        failures: [
          ...p.failures,
          { id, projectName, error: err instanceof Error ? err.message : 'failed' },
        ],
      }));
    }
  }

  const total = submissions?.length ?? 0;
  const judged = submissions?.filter((s) => s.aiWeightedTotal !== null).length ?? 0;
  const humanCount = submissions?.filter((s) => s.humanJudged).length ?? 0;
  const visible = view === 'all' ? submissions : finalists;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total" value={total} />
        <Stat label="AI-judged" value={`${judged}/${total}`} />
        <Stat label="Human-judged" value={`${humanCount}/${total}`} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={runAiJudging}
          disabled={
            progress.active ||
            !submissions ||
            submissions.every((s) => s.aiWeightedTotal !== null)
          }
          className="rounded-full bg-bwai-ink px-4 py-2 text-sm font-semibold text-white hover:bg-bwai-blue disabled:opacity-50 dark:bg-white dark:text-bwai-ink dark:hover:bg-bwai-blue dark:hover:text-white"
        >
          {progress.active
            ? `Judging ${progress.done}/${progress.total} · ${progress.inFlight} in flight`
            : 'Run AI judging on unjudged'}
        </button>
        <button
          onClick={refresh}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-bwai-ink ring-1 ring-neutral-200 hover:ring-bwai-blue dark:bg-neutral-900 dark:text-neutral-100 dark:ring-neutral-800"
        >
          Refresh
        </button>
        {!progress.active && progress.failures.length > 0 && (
          <span className="text-xs text-bwai-red">
            {progress.failures.length} failed
          </span>
        )}
      </div>

      {!progress.active && progress.failures.length > 0 && (
        <div className="rounded-2xl bg-red-50 p-4 dark:bg-red-950/30">
          <h3 className="text-sm font-semibold text-bwai-red">Review failures</h3>
          <ul className="mt-2 space-y-1.5">
            {progress.failures.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-bwai-ink dark:text-neutral-100">
                  <span className="font-semibold">{f.projectName}</span>{' '}
                  <span className="text-neutral-500 dark:text-neutral-400">— {f.error}</span>
                </span>
                <button
                  onClick={() => retryFailure(f.id, f.projectName)}
                  className="rounded-full bg-white px-3 py-1 font-semibold text-bwai-red ring-1 ring-bwai-red/40 hover:bg-bwai-red/10 dark:bg-neutral-900"
                >
                  Retry
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        <ViewToggle active={view === 'all'} onClick={() => setView('all')}>
          All ({total})
        </ViewToggle>
        <ViewToggle active={view === 'finalists'} onClick={() => setView('finalists')}>
          Finalists (top 10)
        </ViewToggle>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-bwai-red dark:bg-red-950/40">
          {error}
        </p>
      )}

      {visible === null ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-neutral-500 ring-1 ring-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-800">
          No submissions yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Submitter</th>
                <th className="px-4 py-3 text-right">AI score</th>
                <th className="px-4 py-3">Human</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-neutral-100 dark:border-neutral-800"
                >
                  <td className="px-4 py-3 font-medium text-bwai-ink dark:text-neutral-100">
                    {s.projectName}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                    {s.submitter.name}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-bwai-ink dark:text-neutral-100">
                    {s.aiWeightedTotal === null ? '—' : s.aiWeightedTotal.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {s.humanJudged ? (
                      <span className="rounded-full bg-bwai-green/10 px-2 py-0.5 text-xs font-semibold text-bwai-green">
                        ✓
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/hackathon/admin/${s.id}`}
                      className="text-xs font-semibold uppercase tracking-wide text-bwai-blue hover:underline"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-bwai-ink dark:text-neutral-100">
        {value}
      </div>
    </div>
  );
}

function ViewToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
        active
          ? 'bg-bwai-ink text-white dark:bg-white dark:text-bwai-ink'
          : 'bg-white text-bwai-ink ring-1 ring-neutral-200 hover:ring-bwai-blue dark:bg-neutral-900 dark:text-neutral-100 dark:ring-neutral-800'
      }`}
    >
      {children}
    </button>
  );
}
