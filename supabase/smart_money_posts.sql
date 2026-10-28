-- Smart Money posting checkmarks (Posted / Filmed) — Get Unlocked Producer · Supabase
-- Run once in Supabase > SQL Editor. Safe to re-run.

create table if not exists public.smart_money_posts (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day        date not null,
  slot       text not null,          -- am / pm / video
  done       boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, day, slot)
);

alter table public.smart_money_posts enable row level security;

-- Each signed-in user sees and changes only their own checkmarks.
drop policy if exists "own posts read"   on public.smart_money_posts;
drop policy if exists "own posts insert" on public.smart_money_posts;
drop policy if exists "own posts update" on public.smart_money_posts;
create policy "own posts read"   on public.smart_money_posts for select to authenticated using (user_id = auth.uid());
create policy "own posts insert" on public.smart_money_posts for insert to authenticated with check (user_id = auth.uid());
create policy "own posts update" on public.smart_money_posts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
