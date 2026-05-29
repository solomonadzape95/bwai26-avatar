import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_lib/auth';
import { getSubmission, upsertAi } from '../../_lib/submissions';
import { judgeSubmission } from '../../_lib/gemini';

export const config = { maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }
  if (!requireAdmin(req, res)) return;

  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) return res.status(400).json({ error: 'missing id' });

  const submission = await getSubmission(id);
  if (!submission) return res.status(404).json({ error: 'not found' });

  try {
    const ai = await judgeSubmission(submission);
    await upsertAi(id, ai);
    return res.status(200).json({ submission: { ...submission, ai } });
  } catch (err) {
    console.error('Gemini judging failed', err);
    return res
      .status(500)
      .json({ error: err instanceof Error ? err.message : 'judging failed' });
  }
}
