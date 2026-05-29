import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import RequireAdmin from '../../components/RequireAdmin';
import { api } from '../../lib/api';
import {
  METRICS,
  type HumanScores,
  type MetricKey,
  type Submission,
} from '../../lib/metrics';

export default function AdminSubmissionPage() {
  return (
    <RequireAdmin>
      <SubmissionView />
    </RequireAdmin>
  );
}

function emptyHumanScores(): HumanScores {
  const o = {} as HumanScores;
  for (const m of METRICS) o[m.key as MetricKey] = 7;
  return o;
}

function SubmissionView() {
  const { id = '' } = useParams();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [judging, setJudging] = useState(false);
  const [humanScores, setHumanScores] = useState<HumanScores>(emptyHumanScores());
  const [notes, setNotes] = useState('');
  const [judgedBy, setJudgedBy] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const { submission } = await api.getSubmission(id);
      setSubmission(submission);
      if (submission.human) {
        setHumanScores(submission.human.scores);
        setNotes(submission.human.notes);
        setJudgedBy(submission.human.judgedBy);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to load');
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function runJudging() {
    setJudging(true);
    setError(null);
    try {
      const { submission } = await api.judge(id);
      setSubmission(submission);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'judging failed');
    } finally {
      setJudging(false);
    }
  }

  async function saveHuman(e: React.FormEvent) {
    e.preventDefault();
    if (!judgedBy.trim()) {
      setError('judge name required');
      return;
    }
    setSaving(true);
    setSaveMessage(null);
    setError(null);
    try {
      const { submission } = await api.humanScore(id, {
        scores: humanScores,
        notes,
        judgedBy: judgedBy.trim(),
      });
      setSubmission(submission);
      setSaveMessage('Saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'save failed');
    } finally {
      setSaving(false);
    }
  }

  if (error && !submission) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-bwai-red">{error}</p>
        <Link to="/hackathon/admin" className="text-sm font-semibold text-bwai-blue hover:underline">
          ← Back to admin
        </Link>
      </div>
    );
  }

  if (!submission) {
    return <p className="text-sm text-neutral-500">Loading…</p>;
  }

  const humanTotal = METRICS.reduce(
    (sum, m) => sum + humanScores[m.key as MetricKey] * m.weight,
    0,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <Link to="/hackathon/admin" className="text-sm font-semibold text-bwai-blue hover:underline">
          ← Back
        </Link>
        <span className="font-mono text-xs text-neutral-400">{submission.id}</span>
      </div>

      <section className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <h2 className="text-2xl font-semibold text-bwai-ink">{submission.projectName}</h2>
        <p className="text-sm text-neutral-500">
          By {submission.submitter.name} ·{' '}
          <a href={`mailto:${submission.submitter.email}`} className="hover:text-bwai-blue">
            {submission.submitter.email}
          </a>{' '}
          · submitted {new Date(submission.submittedAt).toLocaleString()}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {submission.githubUrl && (
            <a
              href={submission.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-bwai-blue underline-offset-2 hover:underline"
            >
              {submission.githubUrl} ↗
            </a>
          )}
          {submission.aiStudioUrl && (
            <a
              href={submission.aiStudioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-bwai-green underline-offset-2 hover:underline"
            >
              AI Studio ↗
            </a>
          )}
        </div>
        <p className="whitespace-pre-line text-sm text-neutral-700">{submission.overview}</p>
        {submission.screenshotUrls.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {submission.screenshotUrls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                <img
                  src={url}
                  alt=""
                  className="aspect-video w-full rounded-xl object-cover ring-1 ring-neutral-200 hover:ring-bwai-blue"
                />
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-widest text-bwai-blue">
              AI judging
            </div>
            <h3 className="text-xl font-semibold text-bwai-ink">
              {submission.ai
                ? `Weighted total: ${submission.ai.weightedTotal.toFixed(2)} / 10`
                : 'Not judged yet'}
            </h3>
          </div>
          <button
            onClick={runJudging}
            disabled={judging}
            className="rounded-full bg-bwai-ink px-4 py-2 text-sm font-semibold text-white hover:bg-bwai-blue disabled:opacity-50"
          >
            {judging ? 'Running Gemini…' : submission.ai ? 'Re-run AI judging' : 'Run AI judging'}
          </button>
        </header>

        {submission.ai && (
          <>
            <p className="text-sm text-neutral-700">{submission.ai.summary}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {METRICS.map((m) => {
                const s = submission.ai!.scores[m.key as MetricKey];
                return (
                  <div key={m.key} className="rounded-xl bg-neutral-50 p-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-semibold text-bwai-ink">{m.label}</span>
                      <span className="font-mono text-lg font-bold tabular-nums text-bwai-ink">
                        {s.score}/10
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-600">{s.reasoning}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-neutral-400">
              Judged {new Date(submission.ai.judgedAt).toLocaleString()}
            </p>
          </>
        )}
      </section>

      <form
        onSubmit={saveHuman}
        className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200"
      >
        <header>
          <div className="text-xs font-medium uppercase tracking-widest text-bwai-green">
            Human judging
          </div>
          <h3 className="text-xl font-semibold text-bwai-ink">
            Weighted total (preview): {humanTotal.toFixed(2)} / 10
          </h3>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {METRICS.map((m) => (
            <div key={m.key} className="space-y-1">
              <div className="flex items-baseline justify-between">
                <label className="text-sm font-semibold text-bwai-ink">{m.label}</label>
                <span className="font-mono text-sm tabular-nums text-bwai-ink">
                  {humanScores[m.key as MetricKey]}/10
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={humanScores[m.key as MetricKey]}
                onChange={(e) =>
                  setHumanScores((prev) => ({
                    ...prev,
                    [m.key]: Number(e.target.value),
                  }))
                }
                className="w-full accent-bwai-blue"
              />
              <p className="text-xs text-neutral-500">{m.rubric}</p>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-bwai-ink">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            maxLength={4000}
            className="form-input"
            placeholder="Optional observations for the judging panel."
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-bwai-ink">Judge name</label>
          <input
            value={judgedBy}
            onChange={(e) => setJudgedBy(e.target.value)}
            maxLength={80}
            className="form-input"
            placeholder="Your name"
          />
        </div>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-bwai-red">{error}</p>}
        {saveMessage && (
          <p className="rounded-xl bg-bwai-green/10 px-4 py-3 text-sm text-bwai-green">
            {saveMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-bwai-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-bwai-blue disabled:opacity-50"
        >
          {saving ? 'Saving…' : submission.human ? 'Update human score' : 'Save human score'}
        </button>
      </form>
    </div>
  );
}
