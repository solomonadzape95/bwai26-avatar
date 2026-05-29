-- bwai26-avatar hackathon schema (Supabase)
-- Paste this into Supabase → SQL Editor → Run.
-- After running, create a Storage bucket named "screenshots" via the dashboard
-- (Public bucket, image/* only, 5 MB max), then re-run the policy block at the bottom
-- if needed.

create extension if not exists "pgcrypto";

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  project_name text not null,
  github_url text not null,
  overview text not null,
  screenshot_urls text[] not null default '{}',
  submitter_name text not null,
  submitter_email text not null,
  submitted_at timestamptz not null default now()
);
create index if not exists submissions_submitted_at_idx
  on submissions (submitted_at desc);

create table if not exists ai_scores (
  submission_id uuid primary key references submissions(id) on delete cascade,
  weighted_total numeric not null,
  scores jsonb not null,
  summary text not null,
  judged_at timestamptz not null default now()
);
create index if not exists ai_scores_weighted_total_idx
  on ai_scores (weighted_total desc);

create table if not exists human_scores (
  submission_id uuid primary key references submissions(id) on delete cascade,
  scores jsonb not null,
  notes text not null default '',
  judged_by text not null,
  judged_at timestamptz not null default now()
);

create table if not exists timer_state (
  id smallint primary key check (id = 1),
  started_at timestamptz,
  results_published_at timestamptz
);
alter table timer_state add column if not exists results_published_at timestamptz;
insert into timer_state (id, started_at)
values (1, null)
on conflict (id) do nothing;

alter table human_scores add column if not exists weighted_total numeric;
create index if not exists human_scores_weighted_total_idx
  on human_scores (weighted_total desc);

alter table submissions add column if not exists ai_studio_url text;

-- Lock down tables: RLS on, no policies => only service_role can access.
alter table submissions  enable row level security;
alter table ai_scores    enable row level security;
alter table human_scores enable row level security;
alter table timer_state  enable row level security;

-- Storage policies for the "screenshots" bucket.
-- Create the bucket in the dashboard first (Public, image/*, 5 MB max).
do $$
begin
  if exists (select 1 from storage.buckets where id = 'screenshots') then
    if not exists (select 1 from pg_policies where policyname = 'screenshots public read') then
      create policy "screenshots public read" on storage.objects
        for select to anon, authenticated using (bucket_id = 'screenshots');
    end if;
    if not exists (select 1 from pg_policies where policyname = 'screenshots anon insert') then
      create policy "screenshots anon insert" on storage.objects
        for insert to anon, authenticated with check (bucket_id = 'screenshots');
    end if;
  end if;
end $$;
