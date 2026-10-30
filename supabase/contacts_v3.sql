-- Contacts v3 — linked contacts, loans per person, duplicate review + merge (Oct 30, 2026)
-- Additive. Safe to re-run (tables/functions use IF NOT EXISTS / OR REPLACE).

-- 1) Links between contacts (co-borrower/spouse, same property, their agent, referred by)
create table if not exists public.contact_links (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  contact_id  uuid not null references public.contacts(id) on delete cascade,
  linked_id   uuid not null references public.contacts(id) on delete cascade,
  relation    text not null default 'co-borrower', -- co-borrower | spouse | same property | agent | referred by
  created_at  timestamptz not null default now(),
  unique (contact_id, linked_id, relation)
);
create index if not exists contact_links_contact_idx on public.contact_links (contact_id);
create index if not exists contact_links_linked_idx on public.contact_links (linked_id);
alter table public.contact_links enable row level security;
drop policy if exists "Users own links" on public.contact_links;
create policy "Users own links" on public.contact_links for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2) Loans (one person can have many; is_current marks the one the Radar uses)
create table if not exists public.loans (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  contact_id       uuid not null references public.contacts(id) on delete cascade,
  loan_number      text,
  note_rate        numeric,
  loan_amount      numeric,
  ltv_orig         numeric,
  funded_date      date,
  loan_type        text,
  loan_type_source text,
  loan_purpose     text,
  loan_term_months int default 360,
  property_address text, property_city text, property_state text, property_zip text,
  appraised_value  numeric,
  is_current       boolean not null default true,
  source           text,
  created_at       timestamptz not null default now()
);
create index if not exists loans_contact_idx on public.loans (contact_id);
alter table public.loans enable row level security;
drop policy if exists "Users own loans" on public.loans;
create policy "Users own loans" on public.loans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3) "Not the same person" decisions
create table if not exists public.contact_dupe_dismissed (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  a uuid not null references public.contacts(id) on delete cascade,
  b uuid not null references public.contacts(id) on delete cascade,
  primary key (a, b)
);
alter table public.contact_dupe_dismissed enable row level security;
drop policy if exists "Users own dismissals" on public.contact_dupe_dismissed;
create policy "Users own dismissals" on public.contact_dupe_dismissed for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4) Possible duplicates: same name, or shared email/phone (rolodex excluded). Runs with the caller's RLS.
create index if not exists contacts_name_idx  on public.contacts (user_id, lower(first_name), lower(last_name));
create index if not exists contacts_email_idx on public.contacts (user_id, email);
create index if not exists contacts_phone_idx on public.contacts (user_id, phone);
create or replace view public.contact_dupe_candidates with (security_invoker = true) as
with base as (select id, user_id, lower(first_name) fn, lower(last_name) ln, email, email_2, phone, phone_2 from public.contacts where coalesce(contact_type,'') <> 'rolodex'),
pairs as (
  select a.id a_id, b.id b_id, a.user_id, 'same name' reason from base a join base b on a.user_id=b.user_id and a.fn=b.fn and a.ln=b.ln and a.id<b.id
  union all
  select least(a.id,b.id), greatest(a.id,b.id), a.user_id, 'same email' from base a join base b on a.user_id=b.user_id and a.id<>b.id and a.email is not null and (a.email=b.email or a.email=b.email_2)
  union all
  select least(a.id,b.id), greatest(a.id,b.id), a.user_id, 'same phone' from base a join base b on a.user_id=b.user_id and a.id<>b.id and a.phone is not null and (a.phone=b.phone or a.phone=b.phone_2)
),
dedup as (select distinct on (a_id,b_id) a_id,b_id,user_id,reason from pairs order by a_id,b_id,reason)
select d.* from dedup d
where not exists (select 1 from public.contact_dupe_dismissed x where (x.a=d.a_id and x.b=d.b_id) or (x.a=d.b_id and x.b=d.a_id))
  and not exists (select 1 from public.contact_links l where (l.contact_id=d.a_id and l.linked_id=d.b_id) or (l.contact_id=d.b_id and l.linked_id=d.a_id));

-- 5) Merge two contacts: keep `keep_id`, fold `drop_id` into it, delete `drop_id`. Owner-only.
create or replace function public.merge_contacts(keep_id uuid, drop_id uuid) returns void
language plpgsql security invoker as $$
declare k public.contacts; d public.contacts;
begin
  select * into k from public.contacts where id = keep_id;
  select * into d from public.contacts where id = drop_id;
  if k.id is null or d.id is null or k.user_id <> d.user_id then raise exception 'contacts not found'; end if;
  if auth.uid() is not null and k.user_id <> auth.uid() then raise exception 'not allowed'; end if;
  update public.contacts set
    phone   = coalesce(k.phone, d.phone),
    phone_2 = coalesce(k.phone_2, case when d.phone is distinct from coalesce(k.phone, d.phone) then d.phone end, d.phone_2),
    email   = coalesce(k.email, d.email),
    email_2 = coalesce(k.email_2, case when d.email is distinct from coalesce(k.email, d.email) then d.email end, d.email_2),
    address = coalesce(k.address, d.address), city = coalesce(k.city, d.city), state = coalesce(k.state, d.state), zip = coalesce(k.zip, d.zip),
    property_address = coalesce(k.property_address, d.property_address), property_city = coalesce(k.property_city, d.property_city),
    property_state = coalesce(k.property_state, d.property_state), property_zip = coalesce(k.property_zip, d.property_zip),
    birthday = coalesce(k.birthday, d.birthday), company = coalesce(k.company, d.company),
    co_borrower_first = coalesce(k.co_borrower_first, d.co_borrower_first), co_borrower_last = coalesce(k.co_borrower_last, d.co_borrower_last),
    co_borrower_phone = coalesce(k.co_borrower_phone, d.co_borrower_phone), co_borrower_email = coalesce(k.co_borrower_email, d.co_borrower_email),
    home_value = coalesce(k.home_value, d.home_value), home_value_source = coalesce(k.home_value_source, d.home_value_source),
    last_contacted = greatest(k.last_contacted, d.last_contacted),
    contact_note = nullif(concat_ws(E'\n', k.contact_note, d.contact_note), ''),
    tags = array(select distinct x from unnest(coalesce(k.tags,'{}') || coalesce(d.tags,'{}')) x)
  where id = keep_id;
  update public.loans set contact_id = keep_id where contact_id = drop_id;
  update public.contact_touches set contact_id = keep_id where contact_id = drop_id;
  update public.contact_links set contact_id = keep_id where contact_id = drop_id and linked_id <> keep_id;
  update public.contact_links set linked_id = keep_id where linked_id = drop_id and contact_id <> keep_id;
  update public.contacts set linked_agent_id = keep_id where linked_agent_id = drop_id;
  delete from public.contacts where id = drop_id;
  -- the newest funded loan is the current one
  update public.loans l set is_current = (l.id = (select id from public.loans where contact_id = keep_id order by funded_date desc nulls last, note_rate desc nulls last limit 1))
  where l.contact_id = keep_id;
end $$;
