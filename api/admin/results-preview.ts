import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/auth';
import { getResultsPublishedAt } from '../_lib/timer';
import { listTopFive } from '../_lib/submissions';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method not allowed' });
  }
  if (!requireAdmin(req, res)) return;
  try {
    const [publishedAt, top] = await Promise.all([
      getResultsPublishedAt(),
      listTopFive(),
    ]);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      publishedAt: publishedAt === null ? null : new Date(publishedAt).toISOString(),
      top,
    });
  } catch (err) {
    console.error('results-preview failed', err);
    return res
      .status(500)
      .json({ error: err instanceof Error ? err.message : 'failed' });
  }
}
