import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTimerState } from './_lib/timer.js';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const state = await getTimerState();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(state);
  } catch (err) {
    console.error('timer state load failed', err);
    return res.status(500).json({ error: 'failed to load timer' });
  }
}
