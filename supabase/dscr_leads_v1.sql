-- DSCR lead system (bolt-on). Investor leads from PropStream imports and the Portfolio Review funnel,
-- funnel submissions (public insert only), and weekly profile posts.

-- (1) Investor leads: one row per investor prospect. Owner-only.
create table if not exists public.investor_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lead_type text not null default 'dead_money',        -- maturing_hard_money | dead_money | portfolio_review
  first_name text, last_name text, company text,        -- company = LLC / entity owner
  phone text, phone_2 text, email text,
  mailing_address text, mailing_city text, mailing_state text, mailing_zip text,
  property_address text, property_city text, property_state text, property_zip text, county text,
  property_type text, units int, properties_owned int,
  est_value numeric, est_equity numeric, loan_balance numeric,
  lender text, loan_amount numeric, recording_date date, est_maturity date,
  answers jsonb, scenario text,
  score int not null default 0,
  status text not null default 'new',                   -- new | queued | talked | booked | dead
  contact_id uuid references public.contacts(id) on delete set null,
  source text, import_batch text,
  created_at timestamptz not null default now());
create index if not exists investor_leads_user_idx on public.investor_leads(user_id, status, score desc);
alter table public.investor_leads enable row level security;
drop policy if exists "own rows" on public.investor_leads;
create policy "own rows" on public.investor_leads for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- (2) Portfolio Review funnel submissions: anyone can submit (with consent), nobody can read them except Joshua.
create table if not exists public.portfolio_reviews (
  id uuid primary key default gen_random_uuid(),
  first_name text not null, last_name text, phone text, email text,
  working_on text, rentals text, equity text, hard_money text, rent_type text, llc text, states text,
  scenario text, best_time text, text_ok boolean default false, consent boolean not null,
  ref text, source text default 'portfolio-review',
  created_at timestamptz not null default now(),
  constraint pr_consent check (consent = true),
  constraint pr_contact check (coalesce(phone,'') <> '' or coalesce(email,'') <> ''));
alter table public.portfolio_reviews enable row level security;
drop policy if exists "public can submit" on public.portfolio_reviews;
create policy "public can submit" on public.portfolio_reviews for insert to anon, authenticated with check (consent = true);
drop policy if exists "owner reads" on public.portfolio_reviews;
create policy "owner reads" on public.portfolio_reviews for select to authenticated using (auth.uid() = 'f43a0121-3b76-4d1e-92b5-73e685b81c52'::uuid);

-- (3) Each submission becomes an investor lead and a lead in Contacts with a follow-up due today (top of the call list).
create or replace function public.portfolio_review_to_lead() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  owner uuid := 'f43a0121-3b76-4d1e-92b5-73e685b81c52';
  d text := regexp_replace(coalesce(new.phone,''), '\D', '', 'g');
  ph text; em text := nullif(lower(trim(coalesce(new.email,''))), '');
  existing uuid; cid uuid; sc int := 50; lt text := 'portfolio_review';
  note text;
begin
  if length(d) = 11 and left(d,1) = '1' then d := substr(d,2); end if;
  ph := case when length(d) = 10 then '(' || substr(d,1,3) || ') ' || substr(d,4,3) || '-' || substr(d,7) end;
  if new.hard_money ilike 'yes, due soon%' then sc := sc + 40; lt := 'maturing_hard_money';
  elsif new.hard_money ilike 'yes%' then sc := sc + 25; lt := 'maturing_hard_money'; end if;
  sc := sc + case new.equity when '$500K+' then 30 when '$250-500K' then 22 when '$100-250K' then 14 else 5 end;
  sc := sc + case new.rentals when '10+' then 20 when '5-10' then 15 when '2-4' then 10 else 4 end;
  note := concat_ws(' · ', to_char(now() at time zone 'America/New_York','YYYY-MM-DD'), 'Portfolio Review',
    new.working_on, new.rentals || ' rentals', 'equity ' || new.equity, 'hard money: ' || new.hard_money, new.rent_type,
    'LLC: ' || new.llc, new.states, case when new.best_time <> '' then 'best time: ' || new.best_time end,
    case when new.scenario <> '' then 'scenario: ' || new.scenario end);
  select id into existing from contacts where user_id = owner and ((em is not null and (email = em or email_2 = em)) or (ph is not null and (phone = ph or phone_2 = ph))) limit 1;
  if existing is not null then
    update contacts set follow_up_date = current_date, contact_note = concat_ws(E'\n', contact_note, note),
      tags = array(select distinct x from unnest(coalesce(tags,'{}') || array['investor lead', lt]) x)
    where id = existing;
    cid := existing;
  else
    insert into contacts (user_id, first_name, last_name, email, phone, contact_type, subtype, follow_up_date, contact_note, tags,
                          source_category, source_file, external_id, do_not_contact)
    values (owner, initcap(trim(new.first_name)), initcap(trim(coalesce(new.last_name,''))), em, ph, 'lead', 'investor lead', current_date, note,
            array['investor lead', lt, coalesce(new.ref,'no ref')], 'portfolio review', 'portfolio review funnel', 'pr-' || new.id, false)
    on conflict (user_id, external_id) do nothing
    returning id into cid;
  end if;
  insert into investor_leads (user_id, lead_type, first_name, last_name, phone, email, property_state, answers, scenario, score, status, contact_id, source)
  values (owner, lt, initcap(trim(new.first_name)), initcap(trim(coalesce(new.last_name,''))), ph, em, new.states,
          jsonb_build_object('working_on',new.working_on,'rentals',new.rentals,'equity',new.equity,'hard_money',new.hard_money,
                             'rent_type',new.rent_type,'llc',new.llc,'best_time',new.best_time,'text_ok',new.text_ok,'ref',new.ref),
          new.scenario, sc, 'queued', cid, 'portfolio review funnel');
  return new;
end $$;
drop trigger if exists portfolio_review_to_lead on public.portfolio_reviews;
create trigger portfolio_review_to_lead after insert on public.portfolio_reviews for each row execute function public.portfolio_review_to_lead();

-- (4) Weekly profile posts (personal Facebook profile), one per day. Owner-only.
create table if not exists public.profile_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null, category text, scope text, hook text not null, body text not null,
  story_visual text, story_text text, image text,
  status text not null default 'draft',                 -- draft | approved | posted
  posted_at timestamptz, channel text not null default 'personal', publish_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, day, channel));
alter table public.profile_posts enable row level security;
drop policy if exists "own rows" on public.profile_posts;
create policy "own rows" on public.profile_posts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
