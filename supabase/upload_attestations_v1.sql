-- Upload agreement: every user signs before importing contacts.
create table if not exists public.upload_attestations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  signed_name text not null,
  version text not null,
  agreement text not null,
  user_agent text,
  signed_at timestamptz not null default now()
);
create index if not exists upload_attestations_user_idx on public.upload_attestations(user_id, version);
alter table public.upload_attestations enable row level security;
drop policy if exists "attest own read" on public.upload_attestations;
drop policy if exists "attest own insert" on public.upload_attestations;
drop policy if exists "attest admin read" on public.upload_attestations;
create policy "attest own read" on public.upload_attestations for select to authenticated using (user_id = auth.uid());
create policy "attest own insert" on public.upload_attestations for insert to authenticated with check (user_id = auth.uid());
create policy "attest admin read" on public.upload_attestations for select to authenticated using (auth.uid() = 'f43a0121-3b76-4d1e-92b5-73e685b81c52'::uuid);
-- No update or delete policies: signed records cannot be changed.
