-- Investor Facebook group posting kit: post bank, group list, posting log. Owner-only.
create table if not exists public.group_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null, body text not null, kind text not null default 'post',  -- post | link (tool + link day)
  image text, active boolean not null default true, sort int not null default 0,
  created_at timestamptz not null default now());
create table if not exists public.fb_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, url text, members text, rules text, promo_day text,
  status text not null default 'to join',  -- to join | requested | joined | removed
  notes text, created_at timestamptz not null default now());
create table if not exists public.group_post_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  post_id uuid references public.group_posts(id) on delete set null,
  group_id uuid references public.fb_groups(id) on delete cascade,
  day date not null default current_date, created_at timestamptz not null default now());
do $$ declare t text; begin foreach t in array array['group_posts','fb_groups','group_post_log'] loop
  execute format('alter table public.%I enable row level security', t);
  execute format('drop policy if exists "own rows" on public.%I', t);
  execute format('create policy "own rows" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
end loop; end $$;
