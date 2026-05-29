const KEY = 'bwai26.lastSubmission';

export type StoredSubmission = {
  id: string;
  slug: string;
  projectName: string;
  submitterName: string;
  submittedAt: string;
};

export function readSubmitted(): StoredSubmission | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSubmission;
  } catch {
    return null;
  }
}

export function writeSubmitted(s: StoredSubmission): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSubmitted(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
}
