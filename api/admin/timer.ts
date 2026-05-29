import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/auth.js';
import { setDuration, startTimer, stopTimer } from '../_lib/timer.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }
  if (!requireAdmin(req, res)) return;

  const body = (req.body ?? {}) as {
    action?: unknown;
    durationSeconds?: unknown;
  };
  try {
    if (body.action === 'start') {
      const dur =
        typeof body.durationSeconds === 'number' ? body.durationSeconds : undefined;
      return res.status(200).json(await startTimer(dur));
    }
    if (body.action === 'stop') {
      return res.status(200).json(await stopTimer());
    }
    if (body.action === 'set-duration') {
      if (typeof body.durationSeconds !== 'number') {
        return res.status(400).json({ error: 'durationSeconds required' });
      }
      return res.status(200).json(await setDuration(body.durationSeconds));
    }
    return res.status(400).json({ error: 'unknown action' });
  } catch (err) {
    console.error('timer admin failed', err);
    return res
      .status(500)
      .json({ error: err instanceof Error ? err.message : 'failed' });
  }
}
