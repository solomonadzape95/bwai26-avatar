import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import BigCountdown from '../BigCountdown';
import { endsAtDate, phaseOf, useTimerState } from '../../lib/timerState';

function formatDuration(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [`${h}h`];
    if (m) parts.push(`${m}m`);
    if (s) parts.push(`${s}s`);
    return parts.join(' ');
  }
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s ? `${m}m ${s}s` : `${m}m`;
  }
  return `${seconds}s`;
}

const PRESETS = [10, 30, 120, 1800, 2700, 3600, 5400];

export default function TimerTab() {
  const { state, refresh, error } = useTimerState(5_000);
  const phase = phaseOf(state);
  const endsAt = endsAtDate(state);
  const durationSeconds = state?.durationSeconds ?? 0;

  const [draftSeconds, setDraftSeconds] = useState<number>(durationSeconds);
  const [busy, setBusy] = useState<'start' | 'stop' | 'save' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (durationSeconds > 0 && draftSeconds === 0) setDraftSeconds(durationSeconds);
  }, [durationSeconds, draftSeconds]);

  const draftValid = Number.isInteger(draftSeconds) && draftSeconds >= 1 && draftSeconds <= 86_400;
  const draftDiffers = draftSeconds !== durationSeconds;

  async function start() {
    if (!draftValid) return;
    if (phase === 'running' && !confirm('Restart the timer? This resets the countdown.')) return;
    setBusy('start');
    setActionError(null);
    try {
      await api.timerStart(draftSeconds);
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

  async function saveDuration() {
    if (!draftValid) return;
    setBusy('save');
    setActionError(null);
    try {
      await api.timerSetDuration(draftSeconds);
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
          Duration
        </h3>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          Saved in the database — any positive value up to 24 hours (86 400 s). Starting the
          timer with a different value also saves it.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Seconds
            </span>
            <input
              type="number"
              min={1}
              max={86_400}
              value={Number.isFinite(draftSeconds) ? draftSeconds : ''}
              onChange={(e) => {
                const next = Number(e.target.value);
                setDraftSeconds(Number.isFinite(next) ? Math.round(next) : 0);
              }}
              className="form-input mt-1 w-40"
            />
          </label>
          <span className="pb-2 text-sm text-neutral-500 dark:text-neutral-400">
            ={' '}
            <span className="font-semibold text-bwai-ink dark:text-neutral-100">
              {draftValid ? formatDuration(draftSeconds) : '—'}
            </span>
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setDraftSeconds(sec)}
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ring-neutral-200 transition-colors dark:ring-neutral-800 ${
                draftSeconds === sec
                  ? 'bg-bwai-ink text-white dark:bg-white dark:text-bwai-ink'
                  : 'bg-white text-bwai-ink hover:ring-bwai-blue dark:bg-neutral-950 dark:text-neutral-100'
              }`}
            >
              {formatDuration(sec)}
            </button>
          ))}
        </div>

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
            disabled={busy !== null || phase === 'loading' || !draftValid}
            className="rounded-full bg-bwai-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-bwai-blue disabled:opacity-50 dark:bg-white dark:text-bwai-ink dark:hover:bg-bwai-blue dark:hover:text-white"
          >
            {busy === 'start'
              ? 'Starting…'
              : phase === 'running'
              ? 'Restart with this duration'
              : 'Start timer'}
          </button>
          {draftDiffers && phase !== 'running' && (
            <button
              onClick={saveDuration}
              disabled={busy !== null || !draftValid}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-bwai-ink ring-1 ring-neutral-200 hover:ring-bwai-blue disabled:opacity-50 dark:bg-neutral-950 dark:text-neutral-100 dark:ring-neutral-800"
            >
              {busy === 'save' ? 'Saving…' : 'Save duration only'}
            </button>
          )}
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
