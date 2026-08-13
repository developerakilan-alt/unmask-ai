-- Unmask AI — scan history sync
-- Mirrors the on-device scan history into a Supabase table so history
-- follows a signed-in account across devices. Apply with:
--   supabase db push
-- or paste into the Supabase SQL editor.

create table if not exists public.scan_history (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  filename text,
  created_at bigint,
  classification text check (classification in ('AI_GENERATED', 'REAL', 'UNCERTAIN')),
  ai_percent numeric,
  confidence numeric,
  model text,
  local boolean default false,
  source_url text,
  heatmap text
);

alter table public.scan_history enable row level security;

create policy "Users manage their own history"
  on public.scan_history
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
