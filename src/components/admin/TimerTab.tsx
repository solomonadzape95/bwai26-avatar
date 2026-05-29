import { useState } from 'react';
import { api } from '../../lib/api';
import BigCountdown from '../BigCountdown';
import { endsAtDate, phaseOf, useTimerState } from '../../lib/timerState';

function formatDuration(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    return `${h} hour${h === 1 ? '' : 's'}`;
  }
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    return `${m} minute${m === 1 ? '' : 's'}`;
  }
  return `${seconds} second${seconds === 1 ? '' : 's'}`;
}

export default function TimerTab() {
  const { state, refresh, error } = useTimerState(5_000);
  const phase = phaseOf(state);
  const endsAt = endsAtDate(state);
  const durationSeconds = state?.durationSeconds ?? 0;

  const [busy, setBusy] = useState<'start' | 'stop' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function start() {
    if (phase === 'running' && !confirm('Restart the timer? This resets the countdown.')) return;
    setBusy('start');
    setActionError(null);
    try {
      await api.timerStart();
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'failed');
    } finally {
      setBusy(null);
    }
  }

  async function stop() {
    if (!confirm('Stop and clear the timer? Submissions will close immediately.')) return;
    setBusy('stop');
    setActionError(null);
    try {
      await api.timerStop();
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800 sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Status
            </div>
            <h3 className="mt-1 text-2xl font-semibold text-bwai-ink dark:text-neutral-100">
              {phase === 'loading' && 'Loading…'}
              {phase === 'not-started' && 'Not started'}
              {phase === 'running' && 'Running'}
              {phase === 'ended' && 'Ended'}
            </h3>
            {phase === 'running' && endsAt && (
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                Ends at{' '}
                <span className="font-semibold text-bwai-ink dark:text-neutral-100">
                  {endsAt.toLocaleString()}
                </span>
              </p>
            )}
            {phase === 'ended' && endsAt && (
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                Ended {endsAt.toLocaleString()}
              </p>
            )}
          </div>
          <PhaseDot phase={phase} />
        </div>

        {phase !== 'loading' && (
          <div className="mt-8">
            <BigCountdown
              durationSeconds={durationSeconds}
              endsAt={phase === 'running' ? endsAt : null}
              mode={phase === 'running' ? 'running' : 'frozen'}
              variant="admin"
              tone="dark"
            />
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
        <h3 className="text-lg font-semibold text-bwai-ink dark:text-neutral-100">
          {phase === 'running' ? 'Restart the countdown' : 'Start the countdown'}
        </h3>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          Duration is set by{' '}
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-bwai-ink dark:bg-neutral-800 dark:text-neutral-100">
            HACKATHON_DURATION_SECONDS
          </code>{' '}
          (currently{' '}
          <span className="font-semibold text-bwai-ink dark:text-neutral-100">
            {state ? formatDuration(state.durationSeconds) : '—'}
          </span>
          ). Change the env var and redeploy to use a different duration.
        </p>

        {actionError && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-bwai-red dark:bg-red-950/40">
            {actionError}
          </p>
        )}
        {error && !actionError && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-bwai-red dark:bg-red-950/40">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={start}
            disabled={busy !== null || phase === 'loading'}
            className="rounded-full bg-bwai-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-bwai-blue disabled:opacity-50 dark:bg-white dark:text-bwai-ink dark:hover:bg-bwai-blue dark:hover:text-white"
          >
            {busy === 'start'
              ? 'Starting…'
              : phase === 'running'
              ? 'Restart timer'
              : 'Start timer'}
          </button>
          {(phase === 'running' || phase === 'ended') && (
            <button
              onClick={stop}
              disabled={busy !== null}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-bwai-red ring-1 ring-bwai-red/40 hover:bg-bwai-red/10 disabled:opacity-50 dark:bg-neutral-900"
            >
              {busy === 'stop' ? 'Stopping…' : 'Stop & clear'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PhaseDot({ phase }: { phase: ReturnType<typeof phaseOf> }) {
  const color =
    phase === 'running'
      ? 'bg-bwai-green'
      : phase === 'ended'
      ? 'bg-bwai-red'
      : phase === 'not-started'
      ? 'bg-bwai-yellow'
      : 'bg-neutral-300';
  return <span className={`h-3 w-3 rounded-full ${color}`} />;
}
