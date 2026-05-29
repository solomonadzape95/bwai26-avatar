import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { METRICS, weightedTotal, type AiScores, type HumanScores, type MetricKey } from '../src/lib/metrics';

type Tier = 'top' | 'mid' | 'low';
type SeedTeam = {
  project: string;
  name: string;
  email: string;
  tier: Tier | 'unjudged';
};

const TEAMS: SeedTeam[] = [
  { project: 'Lecture Notes Copilot', name: 'Ada Okafor', email: 'ada@bwai.test', tier: 'top' },
  { project: 'Drugbase Negotiator', name: 'Bayo Adeyemi', email: 'bayo@bwai.test', tier: 'top' },
  { project: 'Voicebox Calendar', name: 'Chika Nwosu', email: 'chika@bwai.test', tier: 'top' },
  { project: 'Code Reviewer Lite', name: 'Damola Bello', email: 'damola@bwai.test', tier: 'mid' },
  { project: 'AgroAdvisor', name: 'Emeka Eze', email: 'emeka@bwai.test', tier: 'mid' },
  { project: 'Lab Note Tutor', name: 'Fola Akinwale', email: 'fola@bwai.test', tier: 'mid' },
  { project: 'Pidgin Translator', name: 'Goodness Umeh', email: 'goodness@bwai.test', tier: 'mid' },
  { project: 'AnatomyMapper', name: 'Hauwa Yusuf', email: 'hauwa@bwai.test', tier: 'mid' },
  { project: 'Hostel Bill Splitter', name: 'Ibukun Olayinka', email: 'ibukun@bwai.test', tier: 'low' },
  { project: 'Past Question Vault', name: 'Jide Salami', email: 'jide@bwai.test', tier: 'low' },
  { project: 'Faculty Bus Tracker', name: 'Kemi Adesanya', email: 'kemi@bwai.test', tier: 'low' },
  { project: 'Project Pair Finder', name: 'Lekan Idowu', email: 'lekan@bwai.test', tier: 'low' },
  { project: 'AI Avatar Studio', name: 'Mide Akande', email: 'mide@bwai.test', tier: 'low' },
  { project: 'Lecture Recorder Bot', name: 'Ngozi Onyeka', email: 'ngozi@bwai.test', tier: 'unjudged' },
  { project: 'Dorm Mood Tracker', name: 'Obi Anyanwu', email: 'obi@bwai.test', tier: 'unjudged' },
];

const TIER_BANDS: Record<Tier, { lo: number; hi: number; summary: string }> = {
  top: {
    lo: 8.5,
    hi: 9.5,
    summary: 'Polished concept with clear AI use, working demo, and strong presentation.',
  },
  mid: {
    lo: 6.5,
    hi: 8.0,
    summary: 'Solid idea with a working slice; some metrics held it back.',
  },
  low: {
    lo: 4.0,
    hi: 6.0,
    summary: 'Promising direction but rough execution and shallow AI integration.',
  },
};

function targetTotalFor(tier: Tier): number {
  const band = TIER_BANDS[tier];
  return Number((band.lo + Math.random() * (band.hi - band.lo)).toFixed(2));
}

function aiScoresForTotal(target: number): AiScores {
  // pick per-metric scores around `target` (1..10), then nudge so the weighted total hits target
  const initial = METRICS.map((m) => {
    const noise = (Math.random() - 0.5) * 1.6;
    return { key: m.key, weight: m.weight, score: clamp(target + noise, 1, 10) };
  });
  // adjust so weighted total ≈ target
  const computed = initial.reduce((s, m) => s + m.score * m.weight, 0);
  const delta = target - computed;
  // distribute delta across metrics proportional to weight
  for (const m of initial) m.score = clamp(m.score + delta, 1, 10);
  // round to nearest int and re-clamp
  const scores = {} as AiScores;
  for (let i = 0; i < METRICS.length; i++) {
    const m = METRICS[i];
    const rounded = Math.max(1, Math.min(10, Math.round(initial[i].score)));
    scores[m.key as MetricKey] = {
      score: rounded,
      reasoning: `Seed: ${rounded}/10 on ${m.label}.`,
    };
  }
  return scores;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function pickScreenshots(urls: string[], count: number): string[] {
  if (urls.length === 0) return [];
  return Array.from({ length: count }, (_, i) => urls[(i + Math.floor(Math.random() * urls.length)) % urls.length]);
}

function readMockScreenshots(): string[] {
  const dir = join(process.cwd(), 'public', 'mocks', 'screenshots');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /\.(png|jpe?g|gif|webp)$/i.test(f))
    .sort()
    .map((f) => `/mocks/screenshots/${f}`);
}

async function main() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.');
  }
  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const shots = readMockScreenshots();
  console.log(`Found ${shots.length} mock screenshot(s) under public/mocks/screenshots/`);

  console.log(`Seeding ${TEAMS.length} submissions…`);
  const seeded: Array<{
    id: string;
    team: SeedTeam;
    aiTotal: number | null;
    humanTotal: number | null;
  }> = [];

  for (const team of TEAMS) {
    const ssCount = 1 + Math.floor(Math.random() * 4); // 1..4
    const screenshotUrls = pickScreenshots(shots, ssCount);
    const overview = `${team.project} is an AI-assisted tool that helps students at UNN. Built during Build with AI 2026. Demo, docs, and code linked in the README. (Seeded for QA — replace before publishing.)`.padEnd(
      120,
      ' ',
    );

    const sub = await sb
      .from('submissions')
      .insert({
        project_name: team.project,
        github_url: `https://github.com/bwai26-seed/${slugify(team.project)}`,
        overview,
        screenshot_urls: screenshotUrls,
        submitter_name: team.name,
        submitter_email: team.email,
      })
      .select('id')
      .single();
    if (sub.error || !sub.data) {
      console.error(`✗ ${team.project} insert failed:`, sub.error?.message);
      continue;
    }
    const id = sub.data.id as string;

    let aiTotal: number | null = null;
    if (team.tier !== 'unjudged') {
      const target = targetTotalFor(team.tier);
      const scores = aiScoresForTotal(target);
      const actual = Number(weightedTotal(scores).toFixed(2));
      aiTotal = actual;
      const ai = await sb.from('ai_scores').insert({
        submission_id: id,
        weighted_total: actual,
        scores,
        summary: TIER_BANDS[team.tier].summary,
      });
      if (ai.error) console.error(`  ai_scores failed:`, ai.error.message);
    }

    seeded.push({ id, team, aiTotal, humanTotal: null });
  }

  // Pick top 6 by AI score for human scoring; reshuffle some so humans don't perfectly match AI.
  const topJudged = seeded
    .filter((s) => s.aiTotal !== null)
    .sort((a, b) => (b.aiTotal ?? 0) - (a.aiTotal ?? 0))
    .slice(0, 6);

  console.log(`\nAssigning human scores to top ${topJudged.length} submissions…`);

  for (let i = 0; i < topJudged.length; i++) {
    const entry = topJudged[i];
    // Half of them: nudge target up/down so humans visibly differ from AI.
    const aiTotal = entry.aiTotal ?? 7;
    const drift = i % 2 === 0 ? 0.6 : -0.4;
    const target = clamp(aiTotal + drift, 5, 10);
    const humanScores = {} as HumanScores;
    for (const m of METRICS) {
      const noise = (Math.random() - 0.5) * 1.2;
      humanScores[m.key as MetricKey] = Math.max(1, Math.min(10, Math.round(target + noise)));
    }
    const total = Number(
      weightedTotal(
        Object.fromEntries(
          METRICS.map((m) => [m.key, { score: humanScores[m.key as MetricKey] }]),
        ) as Record<MetricKey, { score: number }>,
      ).toFixed(2),
    );
    const hum = await sb.from('human_scores').insert({
      submission_id: entry.id,
      scores: humanScores,
      notes: 'Seeded human score (QA).',
      judged_by: 'Seed Script',
      weighted_total: total,
    });
    if (hum.error) {
      console.error(`  human_scores for ${entry.team.project} failed:`, hum.error.message);
    } else {
      entry.humanTotal = total;
    }
  }

  console.log(`\nDone. Summary:\n`);
  const fmt = (n: number | null) => (n === null ? '   —' : n.toFixed(2).padStart(5, ' '));
  console.log('  AI   | HUMAN | TEAM');
  console.log('  -----+-------+-------------------------------------------');
  for (const row of seeded) {
    console.log(`  ${fmt(row.aiTotal)} | ${fmt(row.humanTotal)} | ${row.team.project} — ${row.team.name}`);
  }
  console.log(
    `\nSeeded ${seeded.length} submissions, ${seeded.filter((r) => r.aiTotal !== null).length} AI-scored, ${seeded.filter((r) => r.humanTotal !== null).length} human-scored.`,
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
