const ALLOWED = new Set([10, 30, 120, 2700]);

export function getDurationSeconds(): number {
  const raw = process.env.HACKATHON_DURATION_SECONDS ?? '2700';
  const n = Number(raw);
  if (!Number.isFinite(n) || !ALLOWED.has(n)) {
    throw new Error(
      `HACKATHON_DURATION_SECONDS must be one of 10, 30, 120, 2700 (got "${raw}")`,
    );
  }
  return n;
}
