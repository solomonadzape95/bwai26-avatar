import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from './_lib/auth.js';
import { createSubmission, listSubmissions, summarize } from './_lib/submissions.js';
import { isTimerRunning } from './_lib/timer.js';

const GITHUB_RE = /^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/?$/;
const AISTUDIO_RE = /^https:\/\/aistudio\.google\.com\/[^\s]+$/;

function isSupabaseScreenshotUrl(url: string): boolean {
  const base = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  if (!base) return false;
  return url.startsWith(`${base}/storage/v1/object/public/screenshots/`);
}

type CreateBody = {
  projectName?: unknown;
  githubUrl?: unknown;
  aiStudioUrl?: unknown;
  overview?: unknown;
  screenshotUrls?: unknown;
  submitter?: { name?: unknown; email?: unknown };
};

function validate(body: CreateBody):
  | {
      ok: true;
      data: {
        projectName: string;
        githubUrl: string;
        aiStudioUrl: string;
        overview: string;
        screenshotUrls: string[];
        submitter: { name: string; email: string };
      };
    }
  | { ok: false; error: string } {
  const projectName = typeof body.projectName === 'string' ? body.projectName.trim() : '';
  if (projectName.length < 3 || projectName.length > 80) {
    return { ok: false, error: 'projectName must be 3–80 characters' };
  }
  const githubUrl = typeof body.githubUrl === 'string' ? body.githubUrl.trim() : '';
  const aiStudioUrl = typeof body.aiStudioUrl === 'string' ? body.aiStudioUrl.trim() : '';
  if (githubUrl.length > 0 && !GITHUB_RE.test(githubUrl)) {
    return { ok: false, error: 'githubUrl must look like https://github.com/<owner>/<repo>' };
  }
  if (aiStudioUrl.length > 0 && !AISTUDIO_RE.test(aiStudioUrl)) {
    return { ok: false, error: 'aiStudioUrl must start with https://aistudio.google.com/' };
  }
  if (githubUrl.length === 0 && aiStudioUrl.length === 0) {
    return {
      ok: false,
      error: 'Provide a GitHub repository URL, a Google AI Studio link, or both.',
    };
  }
  const overview = typeof body.overview === 'string' ? body.overview.trim() : '';
  if (overview.length < 100 || overview.length > 2000) {
    return { ok: false, error: 'overview must be 100–2000 characters' };
  }
  const urls = Array.isArray(body.screenshotUrls) ? body.screenshotUrls : [];
  if (urls.length < 1 || urls.length > 5) {
    return { ok: false, error: 'must provide 1–5 screenshots' };
  }
  const screenshotUrls: string[] = [];
  for (const u of urls) {
    if (typeof u !== 'string' || !isSupabaseScreenshotUrl(u)) {
      return { ok: false, error: 'every screenshot URL must be a Supabase public URL' };
    }
    screenshotUrls.push(u);
  }
  const sub = body.submitter ?? {};
  const name = typeof sub.name === 'string' ? sub.name.trim() : '';
  const email = typeof sub.email === 'string' ? sub.email.trim() : '';
  if (name.length < 2 || name.length > 80) return { ok: false, error: 'submitter.name required' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'submitter.email invalid' };
  return {
    ok: true,
    data: {
      projectName,
      githubUrl,
      aiStudioUrl,
      overview,
      screenshotUrls,
      submitter: { name, email },
    },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      if (!(await isTimerRunning())) {
        return res.status(403).json({ error: 'Submissions are closed.' });
      }
    } catch (err) {
      console.error('timer check failed', err);
      return res
        .status(500)
        .json({ error: err instanceof Error ? err.message : 'timer check failed' });
    }
    const v = validate((req.body ?? {}) as CreateBody);
    if (!v.ok) return res.status(400).json({ error: v.error });
    try {
      const id = await createSubmission(v.data);
      return res.status(201).json({ id });
    } catch (err) {
      console.error('createSubmission failed', err);
      return res
        .status(500)
        .json({ error: err instanceof Error ? err.message : 'insert failed' });
    }
  }

  if (req.method === 'GET') {
    if (!requireAdmin(req, res)) return;
    try {
      const all = await listSubmissions();
      return res.status(200).json({ submissions: all.map(summarize) });
    } catch (err) {
      console.error('listSubmissions failed', err);
      return res
        .status(500)
        .json({ error: err instanceof Error ? err.message : 'failed to load' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'method not allowed' });
}
