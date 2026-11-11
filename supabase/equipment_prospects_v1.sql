-- Equipment finance: local dealer/vendor prospects to call. Separate from contacts on purpose. Owner-only.
create table if not exists public.equipment_prospects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, niche text, address text, phone text, notes text,
  contact_name text, email text,
  status text not null default 'new',        -- new | voicemail | talked | sending deals | not now
  next_date date default current_date,
  last_note text, last_called_at timestamptz, calls int not null default 0,
  created_at timestamptz not null default now());
create unique index if not exists equipment_prospects_name_uq on public.equipment_prospects(user_id, name);
alter table public.equipment_prospects enable row level security;
drop policy if exists "own rows" on public.equipment_prospects;
create policy "own rows" on public.equipment_prospects for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
