export const MIN_DURATION_SECONDS = 1;
export const MAX_DURATION_SECONDS = 86_400; // 24 hours
export const DEFAULT_DURATION_SECONDS = 2_700; // 45 minutes

export function validateDurationSeconds(n: unknown): number {
  const parsed = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new Error('durationSeconds must be an integer');
  }
  if (parsed < MIN_DURATION_SECONDS || parsed > MAX_DURATION_SECONDS) {
    throw new Error(
      `durationSeconds must be between ${MIN_DURATION_SECONDS} and ${MAX_DURATION_SECONDS}`,
    );
  }
  return parsed;
}
