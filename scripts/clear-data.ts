import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.');
  }
  if (!process.argv.includes('--yes')) {
    console.error(
      'Refusing to clear data without --yes. Run: pnpm clear-data --yes (or pnpm tsx scripts/clear-data.ts --yes).',
    );
    process.exit(1);
  }
  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  console.log('Clearing human_scores…');
  const h = await sb.from('human_scores').delete().not('submission_id', 'is', null);
  if (h.error) console.error('  human_scores:', h.error.message);
  console.log('Clearing ai_scores…');
  const a = await sb.from('ai_scores').delete().not('submission_id', 'is', null);
  if (a.error) console.error('  ai_scores:', a.error.message);
  console.log('Clearing submissions (cascade)…');
  const s = await sb.from('submissions').delete().not('id', 'is', null);
  if (s.error) console.error('  submissions:', s.error.message);
  console.log('Resetting timer_state…');
  const t = await sb
    .from('timer_state')
    .update({ started_at: null, results_published_at: null })
    .eq('id', 1);
  if (t.error) console.error('  timer_state:', t.error.message);
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
