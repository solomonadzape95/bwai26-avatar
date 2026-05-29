import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getResultsPublishedAt } from './_lib/timer.js';
import { listTopFive } from './_lib/submissions.js';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const publishedAt = await getResultsPublishedAt();
    if (!publishedAt) {
      return res.status(200).json({ published: false, publishedAt: null, top: [] });
    }
    const top = await listTopFive();
    res.setHeader('Cache-Control', 'no-store');
    return res
      .status(200)
      .json({ published: true, publishedAt: new Date(publishedAt).toISOString(), top });
  } catch (err) {
    console.error('results load failed', err);
    return res
      .status(500)
      .json({ error: err instanceof Error ? err.message : 'failed' });
  }
}
