import { useCallback, useEffect, useState } from 'react';
import { readJson, writeJson } from './localCache';

export type TimerState = {
  startedAt: number | null;
  durationSeconds: number;
};

export type TimerPhase = 'loading' | 'not-started' | 'running' | 'ended';

const EMPTY: TimerState = { startedAt: null, durationSeconds: 0 };
const CACHE_KEY = 'bwai26.timerState';

export function endsAtMs(state: TimerState | null): number | null {
  if (!state || state.startedAt === null) return null;
  return state.startedAt + state.durationSeconds * 1000;
}

export function phaseOf(state: TimerState | null, now: number = Date.now()): TimerPhase {
  if (!state) return 'loading';
  if (state.startedAt === null) return 'not-started';
  const endsAt = state.startedAt + state.durationSeconds * 1000;
  return endsAt > now ? 'running' : 'ended';
}

export function endsAtDate(state: TimerState | null): Date | null {
  const ms = endsAtMs(state);
  return ms === null ? null : new Date(ms);
}

export function useTimerState(pollMs = 30_000) {
  const [state, setState] = useState<TimerState | null>(() =>
    readJson<TimerState>(CACHE_KEY),
  );
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/timer', { cache: 'no-store' });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const json = (await res.json()) as TimerState;
      const next = json ?? EMPTY;
      setState(next);
      writeJson(CACHE_KEY, next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to load');
    }
  }, []);

  useEffect(() => {
    refresh();
    if (!pollMs) return;
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  return { state, error, refresh };
}
