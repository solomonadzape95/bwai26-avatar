export type MetricKey =
  | 'implementation'
  | 'ideaReasonability'
  | 'innovation'
  | 'aiIntegration'
  | 'impact'
  | 'presentation';

export type MetricDef = {
  key: MetricKey;
  label: string;
  weight: number;
  rubric: string;
};

export const METRICS: MetricDef[] = [
  {
    key: 'implementation',
    label: 'Implementation Quality',
    weight: 0.25,
    rubric:
      'Code quality, completeness, and polish. Does the project actually work end-to-end? Is the build solid or held together by tape?',
  },
  {
    key: 'ideaReasonability',
    label: 'Idea Reasonability',
    weight: 0.15,
    rubric:
      'Is the problem framing grounded and the proposed solution a reasonable response to it? Penalize incoherent or solution-in-search-of-a-problem submissions.',
  },
  {
    key: 'innovation',
    label: 'Innovation / Originality',
    weight: 0.15,
    rubric:
      'How novel is the approach? Direct re-skins of well-known apps score low; genuinely new takes score high.',
  },
  {
    key: 'aiIntegration',
    label: 'AI Integration',
    weight: 0.2,
    rubric:
      'How meaningfully does the project use AI? A wrapper around a single OpenAI call scores low. AI as the core of the experience scores high.',
  },
  {
    key: 'impact',
    label: 'Real-world Impact',
    weight: 0.15,
    rubric:
      'Could this be useful to real people? Distinguishes a fun toy from a project someone would actually adopt.',
  },
  {
    key: 'presentation',
    label: 'Presentation Quality',
    weight: 0.1,
    rubric:
      'Clarity of the README, overview, and screenshots. Can a reader understand what was built and how to use it?',
  },
];

export type Score = { score: number; reasoning: string };
export type AiScores = Record<MetricKey, Score>;
export type HumanScores = Record<MetricKey, number>;

export function weightedTotal(scores: Record<MetricKey, { score: number }>): number {
  return METRICS.reduce((sum, m) => sum + scores[m.key].score * m.weight, 0);
}

export type Submission = {
  id: string;
  projectName: string;
  githubUrl: string;             // empty string if AI Studio link was used instead
  aiStudioUrl?: string;          // optional public Google AI Studio link
  overview: string;
  screenshotUrls: string[];
  submitter: { name: string; email: string };
  submittedAt: string;
  ai?: {
    scores: AiScores;
    weightedTotal: number;
    summary: string;
    judgedAt: string;
  };
  human?: {
    scores: HumanScores;
    notes: string;
    judgedBy: string;
    judgedAt: string;
  };
};

export type SubmissionSummary = {
  id: string;
  projectName: string;
  submitter: { name: string; email: string };
  submittedAt: string;
  aiWeightedTotal: number | null;
  humanJudged: boolean;
};
