import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/auth.js';
import { startTimer, stopTimer } from '../_lib/timer.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }
  if (!requireAdmin(req, res)) return;

  const body = (req.body ?? {}) as { action?: unknown };
  try {
    if (body.action === 'start') {
      return res.status(200).json(await startTimer());
    }
    if (body.action === 'stop') {
      return res.status(200).json(await stopTimer());
    }
    return res.status(400).json({ error: 'unknown action' });
  } catch (err) {
    console.error('timer admin failed', err);
    return res
      .status(500)
      .json({ error: err instanceof Error ? err.message : 'failed' });
  }
}
