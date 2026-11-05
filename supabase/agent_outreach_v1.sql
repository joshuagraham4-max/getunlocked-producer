-- Agent outreach on Facebook / Instagram / LinkedIn messenger. One row per agent prospect. Owner-only.
-- Claude fills the daily batch (name, area, hook from their posts); Joshua approves; replies hand off to Joshua.
create table if not exists public.agent_outreach (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  channel text not null default 'facebook',          -- facebook | instagram | linkedin
  full_name text not null, first_name text, area text, state text,
  brokerage text, profile_url text, hook text,         -- hook = something specific from their recent posts
  source text not null default 'new request',          -- existing friend | new request
  status text not null default 'ready',                -- requested | ready | messaging | replied | no reply | skipped
  step int not null default 0,                         -- messages sent in the sequence (0-3)
  next_date date default current_date,
  last_message text, sent_at timestamptz, replied_at timestamptz,
  contact_id uuid references public.contacts(id) on delete set null,
  notes text,
  created_at timestamptz not null default now());
create unique index if not exists agent_outreach_profile_uq on public.agent_outreach(user_id, channel, profile_url) where profile_url is not null;
create index if not exists agent_outreach_user_idx on public.agent_outreach(user_id, status, next_date);
alter table public.agent_outreach enable row level security;
drop policy if exists "own rows" on public.agent_outreach;
create policy "own rows" on public.agent_outreach for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
