import type { HumanScores, Submission, SubmissionSummary } from './metrics';
import type { TimerState } from './timerState';

const TOKEN_KEY = 'bwai26.adminToken';

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit & { admin?: boolean } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (init.admin) {
    const token = getAdminToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(path, { ...init, headers });
  const text = await res.text();
  const json: unknown = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const message =
      (json && typeof json === 'object' && 'error' in json && typeof (json as { error: unknown }).error === 'string'
        ? (json as { error: string }).error
        : null) ?? `Request failed: ${res.status}`;
    throw new Error(message);
  }
  return json as T;
}

export type CreateSubmissionInput = {
  projectName: string;
  githubUrl: string;
  aiStudioUrl: string;
  overview: string;
  screenshotUrls: string[];
  submitter: { name: string; email: string };
};

export const api = {
  submit: (input: CreateSubmissionInput) =>
    request<{ id: string }>('/api/submissions', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  adminLogin: (password: string) =>
    request<{ token: string }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
  listSubmissions: () =>
    request<{ submissions: SubmissionSummary[] }>('/api/submissions', { admin: true }),
  getSubmission: (id: string) =>
    request<{ submission: Submission }>(`/api/submissions/${id}`, { admin: true }),
  finalists: () =>
    request<{ finalists: SubmissionSummary[] }>('/api/admin/finalists', { admin: true }),
  judge: (id: string) =>
    request<{ submission: Submission }>(`/api/admin/judge/${id}`, {
      method: 'POST',
      admin: true,
    }),
  humanScore: (id: string, payload: { scores: HumanScores; notes: string; judgedBy: string }) =>
    request<{ submission: Submission }>(`/api/admin/human-score/${id}`, {
      method: 'POST',
      admin: true,
      body: JSON.stringify(payload),
    }),
  timerStart: (durationSeconds?: number) =>
    request<TimerState>('/api/admin/timer', {
      method: 'POST',
      admin: true,
      body: JSON.stringify(
        durationSeconds !== undefined
          ? { action: 'start', durationSeconds }
          : { action: 'start' },
      ),
    }),
  timerStop: () =>
    request<TimerState>('/api/admin/timer', {
      method: 'POST',
      admin: true,
      body: JSON.stringify({ action: 'stop' }),
    }),
  timerSetDuration: (durationSeconds: number) =>
    request<TimerState>('/api/admin/timer', {
      method: 'POST',
      admin: true,
      body: JSON.stringify({ action: 'set-duration', durationSeconds }),
    }),
  results: () =>
    request<{
      published: boolean;
      publishedAt: string | null;
      top: Array<{
        rank: number;
        projectName: string;
        submitterName: string;
        submitterEmail: string;
        finalScore: number;
        source: 'human' | 'ai';
      }>;
    }>('/api/results'),
  resultsPreview: () =>
    request<{
      publishedAt: string | null;
      top: Array<{
        rank: number;
        projectName: string;
        submitterName: string;
        submitterEmail: string;
        finalScore: number;
        source: 'human' | 'ai';
      }>;
    }>('/api/admin/results-preview', { admin: true }),
  publishResults: (publish: boolean) =>
    request<{ publishedAt: string | null }>('/api/admin/publish-results', {
      method: 'POST',
      admin: true,
      body: JSON.stringify({ publish }),
    }),
};
