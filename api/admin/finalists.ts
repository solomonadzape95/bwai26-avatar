import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/auth';
import { listFinalists, summarize } from '../_lib/submissions';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method not allowed' });
  }
  if (!requireAdmin(req, res)) return;
  try {
    const finalists = await listFinalists(10);
    return res.status(200).json({ finalists: finalists.map(summarize) });
  } catch (err) {
    console.error('finalists failed', err);
    return res
      .status(500)
      .json({ error: err instanceof Error ? err.message : 'failed' });
  }
}
