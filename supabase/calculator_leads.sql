-- Rental Property Calculator leads (Get Unlocked Producer · Supabase)
-- Run once in Supabase > SQL Editor. Safe to re-run.

create table if not exists public.calculator_leads (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  first_name      text not null,
  last_name       text,
  email           text not null,
  phone           text not null,
  est_loan_amount numeric,
  property_state  text,
  zip             text,
  consent         boolean not null default false,
  ref             text,            -- program code, e.g. RTL-01 (from ?ref= on the link)
  source          text,            -- e.g. rental-calculator
  page_url        text,
  user_agent      text,
  status          text not null default 'new'   -- for your CRM queue: new / contacted / app / closed / dead
);

alter table public.calculator_leads enable row level security;

-- The public page may INSERT only, and only with consent. It can never read, edit or delete leads.
drop policy if exists "public can submit leads" on public.calculator_leads;
create policy "public can submit leads"
  on public.calculator_leads
  for insert
  to anon
  with check (consent = true);

-- Only Joshua (jgraham@zpmloans.com) can read/update leads. Team members see nothing. (Locked Oct 30, 2026)
drop policy if exists "app users can read leads" on public.calculator_leads;
drop policy if exists "app users can update leads" on public.calculator_leads;
drop policy if exists "owner reads leads" on public.calculator_leads;
create policy "owner reads leads" on public.calculator_leads for select to authenticated
  using (auth.uid() = 'f43a0121-3b76-4d1e-92b5-73e685b81c52'::uuid);
drop policy if exists "owner updates leads" on public.calculator_leads;
create policy "owner updates leads" on public.calculator_leads for update to authenticated
  using (auth.uid() = 'f43a0121-3b76-4d1e-92b5-73e685b81c52'::uuid)
  with check (auth.uid() = 'f43a0121-3b76-4d1e-92b5-73e685b81c52'::uuid);

create index if not exists calculator_leads_created_idx on public.calculator_leads (created_at desc);
