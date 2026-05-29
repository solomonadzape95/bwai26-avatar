import { supabase } from './supabase.js';
import { getDurationSeconds } from './duration.js';

export type TimerState = {
  startedAt: number | null;
  durationSeconds: number;
};

const TABLE = 'timer_state';
const ROW_ID = 1;

export async function getTimerState(): Promise<TimerState> {
  const durationSeconds = getDurationSeconds();
  const { data, error } = await supabase()
    .from(TABLE)
    .select('started_at')
    .eq('id', ROW_ID)
    .single();
  if (error) throw new Error(`timer_state read failed: ${error.message}`);
  const raw = data?.started_at ?? null;
  const startedAt = raw ? new Date(raw).getTime() : null;
  return { startedAt, durationSeconds };
}

export async function startTimer(): Promise<TimerState> {
  const now = new Date();
  const { error } = await supabase()
    .from(TABLE)
    .update({ started_at: now.toISOString() })
    .eq('id', ROW_ID);
  if (error) throw new Error(`timer_state start failed: ${error.message}`);
  return { startedAt: now.getTime(), durationSeconds: getDurationSeconds() };
}

export async function stopTimer(): Promise<TimerState> {
  const { error } = await supabase()
    .from(TABLE)
    .update({ started_at: null })
    .eq('id', ROW_ID);
  if (error) throw new Error(`timer_state stop failed: ${error.message}`);
  return { startedAt: null, durationSeconds: getDurationSeconds() };
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
