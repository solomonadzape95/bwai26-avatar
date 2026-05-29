import { supabase } from './supabase';
import {
  METRICS,
  type AiScores,
  type HumanScores,
  type Submission,
  type SubmissionSummary,
} from '../../src/lib/metrics';

type SubmissionRow = {
  id: string;
  project_name: string;
  github_url: string;
  overview: string;
  screenshot_urls: string[] | null;
  submitter_name: string;
  submitter_email: string;
  submitted_at: string;
};

type AiRow = {
  submission_id: string;
  weighted_total: number;
  scores: AiScores;
  summary: string;
  judged_at: string;
};

type HumanRow = {
  submission_id: string;
  scores: HumanScores;
  notes: string;
  judged_by: string;
  judged_at: string;
};

type CreateInput = {
  projectName: string;
  githubUrl: string;
  overview: string;
  screenshotUrls: string[];
  submitter: { name: string; email: string };
};

function build(s: SubmissionRow, ai?: AiRow, human?: HumanRow): Submission {
  const sub: Submission = {
    id: s.id,
    projectName: s.project_name,
    githubUrl: s.github_url,
    overview: s.overview,
    screenshotUrls: s.screenshot_urls ?? [],
    submitter: { name: s.submitter_name, email: s.submitter_email },
    submittedAt: s.submitted_at,
  };
  if (ai) {
    sub.ai = {
      scores: ai.scores,
      weightedTotal: Number(ai.weighted_total),
      summary: ai.summary,
      judgedAt: ai.judged_at,
    };
  }
  if (human) {
    sub.human = {
      scores: human.scores,
      notes: human.notes,
      judgedBy: human.judged_by,
      judgedAt: human.judged_at,
    };
  }
  return sub;
}

export function summarize(s: Submission): SubmissionSummary {
  return {
    id: s.id,
    projectName: s.projectName,
    submitter: s.submitter,
    submittedAt: s.submittedAt,
    aiWeightedTotal: s.ai?.weightedTotal ?? null,
    humanJudged: Boolean(s.human),
  };
}

export async function createSubmission(input: CreateInput): Promise<string> {
  const { data, error } = await supabase()
    .from('submissions')
    .insert({
      project_name: input.projectName,
      github_url: input.githubUrl,
      overview: input.overview,
      screenshot_urls: input.screenshotUrls,
      submitter_name: input.submitter.name,
      submitter_email: input.submitter.email,
    })
    .select('id')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'insert failed');
  return data.id as string;
}

export async function listSubmissions(): Promise<Submission[]> {
  const sb = supabase();
  const [subs, ai, human] = await Promise.all([
    sb.from('submissions').select('*').order('submitted_at', { ascending: false }),
    sb.from('ai_scores').select('*'),
    sb.from('human_scores').select('*'),
  ]);
  if (subs.error) throw new Error(subs.error.message);
  if (ai.error) throw new Error(ai.error.message);
  if (human.error) throw new Error(human.error.message);
  const aiMap = new Map<string, AiRow>(
    (ai.data ?? []).map((r) => [r.submission_id, r as AiRow]),
  );
  const humanMap = new Map<string, HumanRow>(
    (human.data ?? []).map((r) => [r.submission_id, r as HumanRow]),
  );
  return (subs.data as SubmissionRow[]).map((s) =>
    build(s, aiMap.get(s.id), humanMap.get(s.id)),
  );
}

export async function getSubmission(id: string): Promise<Submission | null> {
  const sb = supabase();
  const [sub, ai, human] = await Promise.all([
    sb.from('submissions').select('*').eq('id', id).maybeSingle(),
    sb.from('ai_scores').select('*').eq('submission_id', id).maybeSingle(),
    sb.from('human_scores').select('*').eq('submission_id', id).maybeSingle(),
  ]);
  if (sub.error) throw new Error(sub.error.message);
  if (!sub.data) return null;
  return build(
    sub.data as SubmissionRow,
    (ai.data as AiRow | null) ?? undefined,
    (human.data as HumanRow | null) ?? undefined,
  );
}

export async function upsertAi(
  submissionId: string,
  ai: NonNullable<Submission['ai']>,
): Promise<void> {
  const { error } = await supabase()
    .from('ai_scores')
    .upsert({
      submission_id: submissionId,
      weighted_total: ai.weightedTotal,
      scores: ai.scores,
      summary: ai.summary,
      judged_at: ai.judgedAt,
    });
  if (error) throw new Error(error.message);
}

export async function upsertHuman(
  submissionId: string,
  human: NonNullable<Submission['human']>,
  weightedTotal: number,
): Promise<void> {
  const { error } = await supabase()
    .from('human_scores')
    .upsert({
      submission_id: submissionId,
      scores: human.scores,
      notes: human.notes,
      judged_by: human.judgedBy,
      judged_at: human.judgedAt,
      weighted_total: weightedTotal,
    });
  if (error) throw new Error(error.message);
}

export type ResultRow = {
  rank: number;
  projectName: string;
  submitterName: string;
  submitterEmail: string;
  finalScore: number;
  source: 'human' | 'ai';
};

export async function listTopFive(): Promise<ResultRow[]> {
  const sb = supabase();
  const [subs, ai, human] = await Promise.all([
    sb.from('submissions').select('id, project_name, submitter_name, submitter_email'),
    sb.from('ai_scores').select('submission_id, weighted_total'),
    sb.from('human_scores').select('submission_id, weighted_total'),
  ]);
  if (subs.error) throw new Error(subs.error.message);
  if (ai.error) throw new Error(ai.error.message);
  if (human.error) throw new Error(human.error.message);
  const aiMap = new Map<string, number>(
    (ai.data ?? []).map((r) => [r.submission_id as string, Number(r.weighted_total)]),
  );
  const humanMap = new Map<string, number>(
    (human.data ?? [])
      .filter((r) => r.weighted_total !== null && r.weighted_total !== undefined)
      .map((r) => [r.submission_id as string, Number(r.weighted_total)]),
  );
  const ranked = (subs.data ?? [])
    .map((s) => {
      const id = s.id as string;
      const humanScore = humanMap.get(id);
      const aiScore = aiMap.get(id);
      const finalScore = humanScore ?? aiScore;
      if (finalScore === undefined) return null;
      return {
        projectName: s.project_name as string,
        submitterName: s.submitter_name as string,
        submitterEmail: s.submitter_email as string,
        finalScore,
        source: (humanScore !== undefined ? 'human' : 'ai') as 'human' | 'ai',
      };
    })
    .filter((r): r is Omit<ResultRow, 'rank'> => r !== null)
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 5)
    .map((r, i) => ({ ...r, rank: i + 1 }));
  return ranked;
}

export async function listFinalists(limit = 10): Promise<Submission[]> {
  const sb = supabase();
  const { data, error } = await sb
    .from('ai_scores')
    .select('submission_id')
    .order('weighted_total', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((r) => r.submission_id as string);
  if (ids.length === 0) return [];
  const records = await Promise.all(ids.map((id) => getSubmission(id)));
  return records.filter((r): r is Submission => r !== null);
}

export { METRICS };
