import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_lib/auth';
import { getSubmission, upsertHuman } from '../../_lib/submissions';
import { METRICS, weightedTotal } from '../../../src/lib/metrics';
import type { HumanScores, MetricKey } from '../../../src/lib/metrics';

type Body = {
  scores?: Record<string, unknown>;
  notes?: unknown;
  judgedBy?: unknown;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }
  if (!requireAdmin(req, res)) return;

  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) return res.status(400).json({ error: 'missing id' });

  const body = (req.body ?? {}) as Body;
  const rawScores = body.scores ?? {};
  const scores = {} as HumanScores;
  for (const m of METRICS) {
    const v = rawScores[m.key];
    if (typeof v !== 'number' || v < 1 || v > 10) {
      return res.status(400).json({ error: `score for ${m.key} must be 1–10` });
    }
    scores[m.key as MetricKey] = Math.round(v);
  }
  const notes = typeof body.notes === 'string' ? body.notes.slice(0, 4000) : '';
  const judgedBy =
    typeof body.judgedBy === 'string' ? body.judgedBy.trim().slice(0, 80) : '';
  if (!judgedBy) return res.status(400).json({ error: 'judgedBy required' });

  const submission = await getSubmission(id);
  if (!submission) return res.status(404).json({ error: 'not found' });

  const human = {
    scores,
    notes,
    judgedBy,
    judgedAt: new Date().toISOString(),
  };
  const total = Number(
    weightedTotal(
      Object.fromEntries(
        METRICS.map((m) => [m.key, { score: scores[m.key as MetricKey] }]),
      ) as Record<MetricKey, { score: number }>,
    ).toFixed(2),
  );
  try {
    await upsertHuman(id, human, total);
    return res.status(200).json({ submission: { ...submission, human } });
  } catch (err) {
    console.error('human-score upsert failed', err);
    return res
      .status(500)
      .json({ error: err instanceof Error ? err.message : 'failed' });
  }
}
