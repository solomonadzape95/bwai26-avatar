import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { phaseOf, useTimerState } from '../../lib/timerState';
import { isSupabaseConfigured, uploadScreenshot } from '../../lib/supabase';
import { submissionSlug } from '../../lib/slug';
import {
  clearSubmitted,
  readSubmitted,
  writeSubmitted,
  type StoredSubmission,
} from '../../lib/submissionStore';

const MAX_SCREENSHOTS = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const GITHUB_RE = /^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/?$/;

export default function SubmitPage() {
  const { state } = useTimerState();
  const phase = phaseOf(state);
  const [stored, setStored] = useState<StoredSubmission | null>(null);

  useEffect(() => {
    setStored(readSubmitted());
  }, []);

  if (phase === 'loading') {
    return (
      <p className="mx-auto max-w-md text-center text-sm text-neutral-500 dark:text-neutral-400">
        Loading…
      </p>
    );
  }
  if (phase === 'not-started') return <NotStartedBanner />;
  if (phase === 'ended') return <ClosedBanner />;
  if (stored) {
    return (
      <AlreadySubmittedCard
        stored={stored}
        onReset={() => {
          clearSubmitted();
          setStored(null);
        }}
      />
    );
  }
  return <SubmitForm onSubmitted={(s) => setStored(s)} />;
}

function NotStartedBanner() {
  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
      <div className="text-xs font-medium uppercase tracking-widest text-bwai-yellow">
        Standing by
      </div>
      <h2 className="mt-1 text-2xl font-semibold text-bwai-ink dark:text-neutral-100">
        Submissions open when the hackathon starts
      </h2>
      <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
        The organizers haven’t started the countdown yet. Check back once they do.
      </p>
      <Link to="/hackathon/timer" className="primary-cta mt-6 inline-block">
        Watch the timer →
      </Link>
    </div>
  );
}

function ClosedBanner() {
  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
      <div className="text-xs font-medium uppercase tracking-widest text-bwai-red">Closed</div>
      <h2 className="mt-1 text-2xl font-semibold text-bwai-ink dark:text-neutral-100">
        Submissions are closed
      </h2>
      <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
        The countdown has run out. Judging is in progress.
      </p>
    </div>
  );
}

function AlreadySubmittedCard({
  stored,
  onReset,
}: {
  stored: StoredSubmission;
  onReset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
      <div className="text-xs font-medium uppercase tracking-widest text-bwai-green">
        Already submitted
      </div>
      <h2 className="mt-1 text-2xl font-semibold text-bwai-ink dark:text-neutral-100">
        You’re in.
      </h2>
      <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
        Project:{' '}
        <span className="font-semibold text-bwai-ink dark:text-neutral-100">
          {stored.projectName}
        </span>
      </p>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
        Submission ID:{' '}
        <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-bwai-ink dark:bg-neutral-800 dark:text-neutral-100">
          {stored.slug}
        </code>
      </p>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        Submitted {new Date(stored.submittedAt).toLocaleString()}
      </p>
      <p className="mt-6 text-xs text-neutral-400 dark:text-neutral-500">
        On the wrong device or want to submit something different?{' '}
        <button
          onClick={onReset}
          className="font-semibold text-bwai-blue underline-offset-2 hover:underline"
        >
          Start a new submission
        </button>
      </p>
    </div>
  );
}

function SubmitForm({ onSubmitted }: { onSubmitted: (s: StoredSubmission) => void }) {
  const [projectName, setProjectName] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [overview, setOverview] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const trimmed = {
    projectName: projectName.trim(),
    githubUrl: githubUrl.trim(),
    overview: overview.trim(),
    submitterName: submitterName.trim(),
    submitterEmail: submitterEmail.trim(),
  };

  const checks = {
    project: trimmed.projectName.length >= 3 && trimmed.projectName.length <= 80,
    github: GITHUB_RE.test(trimmed.githubUrl),
    overview: trimmed.overview.length >= 100 && trimmed.overview.length <= 2000,
    screenshots: screenshots.length >= 1 && screenshots.length <= MAX_SCREENSHOTS,
    name: trimmed.submitterName.length >= 2 && trimmed.submitterName.length <= 80,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed.submitterEmail),
  };
  const ready = Object.values(checks).every(Boolean);

  const errors = {
    projectName:
      projectName.length === 0
        ? null
        : !checks.project
        ? '3–80 characters'
        : null,
    githubUrl:
      githubUrl.length === 0
        ? null
        : !checks.github
        ? 'Must look like https://github.com/<owner>/<repo>'
        : null,
    overview:
      overview.length === 0 ? null : !checks.overview ? '100–2000 characters' : null,
    submitterEmail:
      submitterEmail.length === 0 ? null : !checks.email ? 'Invalid email' : null,
  };

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    setUploadError(null);
    if (!isSupabaseConfigured()) {
      setUploadError(
        'Storage not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      );
      return;
    }
    const remaining = MAX_SCREENSHOTS - screenshots.length;
    const accepted = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      for (const f of accepted) {
        if (f.size > MAX_FILE_BYTES) {
          setUploadError(`${f.name} exceeds 5 MB`);
          continue;
        }
        const { url } = await uploadScreenshot(f);
        setScreenshots((prev) => [...prev, url]);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'upload failed');
    } finally {
      setUploading(false);
    }
  }

  function removeScreenshot(url: string) {
    setScreenshots((prev) => prev.filter((u) => u !== url));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { id } = await api.submit({
        projectName: trimmed.projectName,
        githubUrl: trimmed.githubUrl,
        overview: trimmed.overview,
        screenshotUrls: screenshots,
        submitter: { name: trimmed.submitterName, email: trimmed.submitterEmail },
      });
      const slug = submissionSlug(trimmed.projectName, trimmed.submitterName, id);
      const stored: StoredSubmission = {
        id,
        slug,
        projectName: trimmed.projectName,
        submitterName: trimmed.submitterName,
        submittedAt: new Date().toISOString(),
      };
      writeSubmitted(stored);
      onSubmitted(stored);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_300px]">
      <form onSubmit={handleSubmit} className="space-y-6">
        <header className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-widest text-bwai-red">
            Submit
          </div>
          <h2 className="text-3xl font-semibold text-bwai-ink dark:text-neutral-100 sm:text-4xl">
            Submit your project
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 sm:text-base">
            One submission per team. All fields required. Gemini scores first; the top 10 advance
            to a live human judging round.
          </p>
        </header>

        <Field label="Project name" hint="3–80 characters" error={errors.projectName}>
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            maxLength={80}
            className="form-input"
            placeholder="e.g. Lecture Notes Copilot"
          />
        </Field>

        <Field
          label="GitHub repository"
          hint="Public repo with a clear README"
          error={errors.githubUrl}
        >
          <input
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            className="form-input"
            placeholder="https://github.com/your-team/your-repo"
          />
        </Field>

        <Field
          label="Project overview"
          hint={`${trimmed.overview.length}/2000 · min 100`}
          error={errors.overview}
        >
          <textarea
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
            rows={6}
            maxLength={2000}
            className="form-input"
            placeholder="What does it do? Who is it for? How does AI fit in? What did you build during the hackathon?"
          />
        </Field>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <label className="text-sm font-semibold text-bwai-ink dark:text-neutral-100">
              Screenshots
            </label>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {screenshots.length}/{MAX_SCREENSHOTS} · max 5 MB each
            </span>
          </div>
          {screenshots.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {screenshots.map((url) => (
                <div
                  key={url}
                  className="group relative overflow-hidden rounded-2xl ring-1 ring-neutral-200 dark:ring-neutral-800"
                >
                  <img src={url} alt="" className="aspect-video w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeScreenshot(url)}
                    className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-bwai-red shadow-sm ring-1 ring-neutral-200 hover:bg-white"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          {screenshots.length < MAX_SCREENSHOTS && (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-neutral-300 bg-gradient-to-br from-bwai-blue/5 to-bwai-green/5 p-8 text-center text-sm text-neutral-600 transition-colors hover:border-bwai-blue hover:text-bwai-blue dark:border-neutral-700 dark:from-bwai-blue/10 dark:to-bwai-green/10 dark:text-neutral-300">
              <span className="text-base font-semibold">
                {uploading ? 'Uploading…' : 'Click to upload screenshots'}
              </span>
              <span className="text-xs text-neutral-400 dark:text-neutral-500">
                PNG/JPEG, up to 5 MB each
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
          )}
          {uploadError && <p className="text-xs text-bwai-red">{uploadError}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Submitter name">
            <input
              value={submitterName}
              onChange={(e) => setSubmitterName(e.target.value)}
              maxLength={80}
              className="form-input"
              placeholder="Your name"
            />
          </Field>
          <Field label="Submitter email" error={errors.submitterEmail}>
            <input
              type="email"
              value={submitterEmail}
              onChange={(e) => setSubmitterEmail(e.target.value)}
              className="form-input"
              placeholder="you@example.com"
            />
          </Field>
        </div>

        {submitError && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-bwai-red dark:bg-red-950/40">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={!ready || submitting}
          className="w-full rounded-full bg-bwai-ink px-5 py-3.5 text-base font-semibold text-white transition-colors hover:bg-bwai-blue disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-bwai-ink dark:hover:bg-bwai-blue dark:hover:text-white"
        >
          {submitting ? 'Submitting…' : 'Submit project'}
        </button>
      </form>

      <aside className="lg:sticky lg:top-8 lg:self-start">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
          <h3 className="text-xs font-bold uppercase tracking-widest text-bwai-blue">
            Checklist
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <Check label="Project name" done={checks.project} />
            <Check label="GitHub repository" done={checks.github} />
            <Check label="Overview (100+ chars)" done={checks.overview} />
            <Check label="At least 1 screenshot" done={checks.screenshots} />
            <Check label="Submitter name" done={checks.name} />
            <Check label="Submitter email" done={checks.email} />
          </ul>
          <p className="mt-5 text-xs text-neutral-500 dark:text-neutral-400">
            You can only submit once per browser. After submitting we’ll remember it locally so
            you don’t accidentally double-submit.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-semibold text-bwai-ink dark:text-neutral-100">
          {label}
        </label>
        {hint && !error && (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{hint}</span>
        )}
        {error && <span className="text-xs text-bwai-red">{error}</span>}
      </div>
      {children}
    </div>
  );
}

function Check({ label, done }: { label: string; done: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          done
            ? 'bg-bwai-green text-white'
            : 'bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600'
        }`}
      >
        {done ? '✓' : ' '}
      </span>
      <span
        className={
          done
            ? 'text-bwai-ink dark:text-neutral-100'
            : 'text-neutral-500 dark:text-neutral-400'
        }
      >
        {label}
      </span>
    </li>
  );
}
