import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { METRICS, weightedTotal } from '../../src/lib/metrics.js';
import type { AiScores, MetricKey, Submission } from '../../src/lib/metrics.js';
import { fetchReadme } from './github.js';

const MODEL = 'gemini-2.5-flash';

async function withRetry<T>(fn: () => Promise<T>, max = 4): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < max; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!/503|429|overload|unavailable|rate.?limit/i.test(msg)) throw err;
      const jitter = Math.random() * 250;
      await new Promise((r) => setTimeout(r, 800 * 2 ** i + jitter));
    }
  }
  throw lastErr;
}

function client(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');
  return new GoogleGenerativeAI(key);
}

function buildSchema() {
  const scoreItem = {
    type: SchemaType.OBJECT,
    properties: {
      score: {
        type: SchemaType.INTEGER,
        description: 'Integer score from 1 (worst) to 10 (best).',
      },
      reasoning: {
        type: SchemaType.STRING,
        description: '1–3 sentences justifying the score.',
      },
    },
    required: ['score', 'reasoning'],
  };

  const scoresProps: Record<string, typeof scoreItem> = {};
  for (const m of METRICS) scoresProps[m.key] = scoreItem;

  return {
    type: SchemaType.OBJECT,
    properties: {
      scores: {
        type: SchemaType.OBJECT,
        properties: scoresProps,
        required: METRICS.map((m) => m.key),
      },
      summary: {
        type: SchemaType.STRING,
        description: '2–4 sentence overall summary of the project for a human judge.',
      },
    },
    required: ['scores', 'summary'],
  };
}

async function fetchScreenshotAsInlineData(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch screenshot ${url}: ${res.status}`);
  const mimeType = res.headers.get('content-type') ?? 'image/png';
  const buf = await res.arrayBuffer();
  return {
    inlineData: {
      data: Buffer.from(buf).toString('base64'),
      mimeType,
    },
  };
}

function buildRubric(): string {
  return METRICS.map(
    (m) =>
      `- ${m.label} (key: "${m.key}", weight ${Math.round(m.weight * 100)}%): ${m.rubric}`,
  ).join('\n');
}

export async function judgeSubmission(s: Submission): Promise<NonNullable<Submission['ai']>> {
  const readme = await fetchReadme(s.githubUrl);

  const promptText = `You are an experienced hackathon judge for "Build with AI 2026". Score the following submission across 6 metrics on an integer scale of 1–10. Be honest and discerning — most submissions should fall in the 4–7 range; reserve 9–10 for genuinely exceptional work and 1–2 for incoherent or non-functional entries.

Rubric:
${buildRubric()}

Submission:
Project name: ${s.projectName}
GitHub: ${s.githubUrl}
Submitter: ${s.submitter.name}

Overview:
${s.overview}

README (may be truncated):
${readme || '(README could not be fetched — judge with caution and lower presentation score if applicable.)'}

Then look at the attached screenshots to verify the implementation claims and judge design quality.

Return only JSON matching the provided schema.`;

  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
    { text: promptText },
  ];
  for (const url of s.screenshotUrls.slice(0, 5)) {
    try {
      parts.push(await fetchScreenshotAsInlineData(url));
    } catch {
      // skip an unfetchable screenshot rather than failing the whole judging
    }
  }

  const model = client().getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: buildSchema() as never,
      temperature: 0.4,
    },
  });

  const result = await withRetry(() =>
    model.generateContent({
      contents: [{ role: 'user', parts: parts as never }],
    }),
  );

  const text = result.response.text();
  const parsed = JSON.parse(text) as { scores: AiScores; summary: string };

  for (const m of METRICS) {
    const score = parsed.scores[m.key as MetricKey];
    if (!score || typeof score.score !== 'number') {
      throw new Error(`Gemini response missing score for ${m.key}`);
    }
    score.score = Math.max(1, Math.min(10, Math.round(score.score)));
  }

  return {
    scores: parsed.scores,
    weightedTotal: Number(weightedTotal(parsed.scores).toFixed(2)),
    summary: parsed.summary,
    judgedAt: new Date().toISOString(),
  };
}
