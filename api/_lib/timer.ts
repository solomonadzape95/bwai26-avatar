import { supabase } from './supabase.js';
import { DEFAULT_DURATION_SECONDS, validateDurationSeconds } from './duration.js';

export type TimerState = {
  startedAt: number | null;
  durationSeconds: number;
};

const TABLE = 'timer_state';
const ROW_ID = 1;

export async function getTimerState(): Promise<TimerState> {
  const { data, error } = await supabase()
    .from(TABLE)
    .select('started_at, duration_seconds')
    .eq('id', ROW_ID)
    .single();
  if (error) throw new Error(`timer_state read failed: ${error.message}`);
  const raw = data?.started_at ?? null;
  const startedAt = raw ? new Date(raw).getTime() : null;
  const durationSeconds =
    typeof data?.duration_seconds === 'number' && data.duration_seconds > 0
      ? data.duration_seconds
      : DEFAULT_DURATION_SECONDS;
  return { startedAt, durationSeconds };
}

export async function startTimer(durationSeconds?: number): Promise<TimerState> {
  const now = new Date();
  const patch: Record<string, unknown> = { started_at: now.toISOString() };
  if (durationSeconds !== undefined) {
    patch.duration_seconds = validateDurationSeconds(durationSeconds);
  }
  const { error } = await supabase().from(TABLE).update(patch).eq('id', ROW_ID);
  if (error) throw new Error(`timer_state start failed: ${error.message}`);
  return getTimerState();
}

export async function stopTimer(): Promise<TimerState> {
  const { error } = await supabase()
    .from(TABLE)
    .update({ started_at: null })
    .eq('id', ROW_ID);
  if (error) throw new Error(`timer_state stop failed: ${error.message}`);
  return getTimerState();
}

export async function setDuration(durationSeconds: number): Promise<TimerState> {
  const valid = validateDurationSeconds(durationSeconds);
  const { error } = await supabase()
    .from(TABLE)
    .update({ duration_seconds: valid })
    .eq('id', ROW_ID);
  if (error) throw new Error(`timer_state duration write failed: ${error.message}`);
  return getTimerState();
}

export async function isTimerRunning(now: number = Date.now()): Promise<boolean> {
  const s = await getTimerState();
  if (s.startedAt === null) return false;
  return s.startedAt + s.durationSeconds * 1000 > now;
}

export async function getResultsPublishedAt(): Promise<number | null> {
  const { data, error } = await supabase()
    .from(TABLE)
    .select('results_published_at')
    .eq('id', ROW_ID)
    .single();
  if (error) throw new Error(`results_published_at read failed: ${error.message}`);
  const raw = data?.results_published_at ?? null;
  return raw ? new Date(raw).getTime() : null;
}

export async function setResultsPublishedAt(at: Date | null): Promise<number | null> {
  const { error } = await supabase()
    .from(TABLE)
    .update({ results_published_at: at ? at.toISOString() : null })
    .eq('id', ROW_ID);
  if (error) throw new Error(`results_published_at write failed: ${error.message}`);
  return at ? at.getTime() : null;
}
