import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/auth.js';
import { setResultsPublishedAt } from '../_lib/timer.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }
  if (!requireAdmin(req, res)) return;
  const body = (req.body ?? {}) as { publish?: unknown };
  const publish = body.publish === true;
  try {
    const at = await setResultsPublishedAt(publish ? new Date() : null);
    return res
      .status(200)
      .json({ publishedAt: at === null ? null : new Date(at).toISOString() });
  } catch (err) {
    console.error('publish-results failed', err);
    return res
      .status(500)
      .json({ error: err instanceof Error ? err.message : 'failed' });
  }
}
