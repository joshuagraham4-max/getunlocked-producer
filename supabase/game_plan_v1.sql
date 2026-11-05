-- Game Plan (Prospecting day on the Today tab): per-user settings and one row per day. Owner-only.
create table if not exists public.game_plan_settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now());
create table if not exists public.game_plan_days (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, day));
do $$ declare t text; begin foreach t in array array['game_plan_settings','game_plan_days'] loop
  execute format('alter table public.%I enable row level security', t);
  execute format('drop policy if exists "own rows" on public.%I', t);
  execute format('create policy "own rows" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
end loop; end $$;
