-- Contacts v2 — CRM fields for the Radar + daily queues (Oct 30, 2026)
-- Additive only: new columns, no renames, no drops. Safe to re-run.

alter table public.contacts
  add column if not exists contact_type      text default 'past_client', -- past_client | agent | referral_partner | rolodex
  add column if not exists subtype           text,          -- rolodex: lender/vendor | title | insurance; agent: active partner
  add column if not exists company           text,          -- brokerage / business
  add column if not exists agent_role        text,          -- buyer / seller
  add column if not exists do_not_contact    boolean not null default false, -- rolodex: never queued or emailed
  add column if not exists external_id       text,          -- Konnectd contact id (or manual-*)
  add column if not exists tags              text[] default '{}',
  add column if not exists last_activity     timestamptz,
  add column if not exists verify_flag       text,          -- data that needs a human check
  -- loan data (past clients)
  add column if not exists loan_number       text,
  add column if not exists ltv_orig          numeric,       -- LTV at origination, %
  add column if not exists funded_date       date,
  add column if not exists loan_purpose      text,          -- purchase | refinance
  add column if not exists loan_type         text,          -- Conventional | FHA | VA | ...
  add column if not exists loan_type_source  text,          -- est | verified
  add column if not exists loan_term_months  int default 360,
  -- value (HouseCanary report overrides the estimate)
  add column if not exists home_value        numeric,
  add column if not exists home_value_source text,          -- est | canary | appraisal
  add column if not exists home_value_date   date,
  -- outreach
  add column if not exists outcome           text,          -- last call outcome
  add column if not exists follow_up_date    date,
  add column if not exists linked_agent_id   uuid references public.contacts(id) on delete set null;

create unique index if not exists contacts_user_external_uidx on public.contacts (user_id, external_id);
create index if not exists contacts_user_type_idx on public.contacts (user_id, contact_type);
create index if not exists contacts_user_followup_idx on public.contacts (user_id, follow_up_date);

-- Call / touch history (one row per touch)
create table if not exists public.contact_touches (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  contact_id  uuid not null references public.contacts(id) on delete cascade,
  touched_at  timestamptz not null default now(),
  channel     text,   -- call | text | email | meeting
  outcome     text,   -- talked | voicemail | no answer | booked | not interested | wrong number
  note        text
);
create index if not exists contact_touches_contact_idx on public.contact_touches (contact_id, touched_at desc);
alter table public.contact_touches enable row level security;
drop policy if exists "Users own touches" on public.contact_touches;
create policy "Users own touches" on public.contact_touches for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
