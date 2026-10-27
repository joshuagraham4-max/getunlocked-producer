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
  ref             text,            -- program code, e.g. NQ-04 (from ?ref= on the link)
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

-- Logged-in app users (you) can read and update leads inside the Producer app.
drop policy if exists "app users can read leads" on public.calculator_leads;
create policy "app users can read leads"
  on public.calculator_leads for select to authenticated using (true);

drop policy if exists "app users can update leads" on public.calculator_leads;
create policy "app users can update leads"
  on public.calculator_leads for update to authenticated using (true);

create index if not exists calculator_leads_created_idx on public.calculator_leads (created_at desc);
