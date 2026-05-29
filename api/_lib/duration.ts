const ALLOWED = new Set([10, 30,120, 3600]);

export function getDurationSeconds(): number {
  const raw = process.env.HACKATHON_DURATION_SECONDS ?? '3600';
  const n = Number(raw);
  if (!Number.isFinite(n) || !ALLOWED.has(n)) {
    throw new Error(
      `HACKATHON_DURATION_SECONDS must be one of 10, 30, 3600 (got "${raw}")`,
    );
  }
  return n;
}
