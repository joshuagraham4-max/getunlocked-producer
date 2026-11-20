-- Partner pages v1 (Nov 19, 2026): financial planners and divorce attorneys. Re-runnable. Run after scenario_desk_v1.sql and lead_alerts_v1.sql.
-- Each partner gets https://<site>/p/<slug> ("Welcome, Phil."). Register opens the Scenario Desk in partner mode (ref PTR-<slug>).
-- (1) partner_pages table, created from Contacts (Referral Partners → "Create their partner page").
-- (2) Public read of only the fields the page shows.
-- (3) Partner desk scenarios file the sender as a Referral Partner (not an agent) with the scenario on their timeline.
-- (4) Your phone alert says "Partner scenario" for them.

create table if not exists public.partner_pages (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  slug        text not null unique,
  first_name  text not null,
  last_name   text,
  firm        text,
  kind        text not null default 'planner' check (kind in ('planner', 'attorney')),
  phone       text,
  email       text,
  ntfy_topic  text not null default ('gup-pt-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)),
  active      boolean not null default true,
  contact_id  uuid
);
alter table public.partner_pages enable row level security;
drop policy if exists "owner manages partner pages" on public.partner_pages;
create policy "owner manages partner pages" on public.partner_pages for all to authenticated
  using (auth.uid() = 'f43a0121-3b76-4d1e-92b5-73e685b81c52'::uuid)
  with check (auth.uid() = 'f43a0121-3b76-4d1e-92b5-73e685b81c52'::uuid);

create or replace function public.get_partner_page(p_slug text)
returns table (slug text, first_name text, firm text, kind text)
language sql security definer set search_path = public as $$
  select p.slug, p.first_name, p.firm, p.kind from public.partner_pages p
  where p.slug = lower(trim(p_slug)) and p.active limit 1;
$$;
revoke all on function public.get_partner_page(text) from public;
grant execute on function public.get_partner_page(text) to anon, authenticated;

-- Same as scenario_desk_v1.sql, plus: desk scenarios with a PTR- ref are filed as referral_partner.
create or replace function public.calculator_lead_to_contact() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  owner uuid := 'f43a0121-3b76-4d1e-92b5-73e685b81c52';
  d text := regexp_replace(coalesce(new.phone,''), '\D', '', 'g');
  ph text; em text := nullif(lower(trim(coalesce(new.email,''))), '');
  existing uuid; cid uuid;
  tool text := coalesce(nullif(new.source,''), 'rental-calculator');
  is_partner boolean := tool = 'scenario-desk' and coalesce(new.ref,'') ilike 'PTR-%';
  is_agent boolean := tool = 'scenario-desk' and not (coalesce(new.ref,'') ilike 'PTR-%');
  is_desk boolean := tool = 'scenario-desk';
  tag text := case when is_partner then 'partner desk' when tool = 'rental-calculator' then 'calculator lead' when tool = 'scenario-desk' then 'scenario desk' else replace(tool, '-', ' ') || ' lead' end;
  note text := concat_ws(' · ', to_char(now() at time zone 'America/New_York','YYYY-MM-DD'), initcap(replace(tool, '-', ' ')) || case when is_desk then '' else ' lead' end,
                 'ref ' || new.ref, new.answers->>'summary',
                 case when new.answers is null and new.est_loan_amount is not null then 'est. loan $' || to_char(new.est_loan_amount,'FM999,999,999') end,
                 new.property_state, new.zip);
begin
  if length(d) = 11 and left(d,1) = '1' then d := substr(d,2); end if;
  ph := case when length(d) = 10 then '(' || substr(d,1,3) || ') ' || substr(d,4,3) || '-' || substr(d,7) end;
  select id into existing from contacts where user_id = owner and ((em is not null and (email = em or email_2 = em)) or (ph is not null and (phone = ph or phone_2 = ph))) limit 1;
  if existing is not null then
    update contacts set follow_up_date = current_date,
      contact_note = case when is_desk then contact_note else concat_ws(E'\n', contact_note, note) end,
      tags = array(select distinct x from unnest(coalesce(tags,'{}') || array[tag]) x)
    where id = existing;
    cid := existing;
  else
    insert into contacts (user_id, first_name, last_name, email, phone, zip, property_state, contact_type, subtype, company, follow_up_date,
                          contact_note, tags, source_category, source_file, external_id, do_not_contact)
    values (owner, initcap(trim(new.first_name)), initcap(trim(new.last_name)), em, ph, new.zip, new.property_state,
            case when is_partner then 'referral_partner' when is_agent then 'agent' else 'lead' end,
            case when is_partner then coalesce(new.answers->>'partner_type', 'partner') else tag end,
            nullif(trim(coalesce(new.answers->>'brokerage','')), ''), current_date,
            case when is_desk then null else note end, array[tag, coalesce(new.ref,'no ref')], 'calculator', tool, 'calc-' || new.id, false)
    on conflict (user_id, external_id) do nothing
    returning id into cid;
  end if;
  if cid is not null then
    insert into contact_touches (user_id, contact_id, channel, outcome, note)
    values (owner, cid, 'note', case when is_partner then 'partner desk' when is_agent then 'scenario desk' else tag end, coalesce(new.answers->>'summary', note));
  end if;
  return new;
end $$;
drop trigger if exists calculator_lead_to_contact on public.calculator_leads;
create trigger calculator_lead_to_contact after insert on public.calculator_leads
  for each row execute function public.calculator_lead_to_contact();

-- Your phone alert: partner scenarios say so.
create or replace function public.alert_calculator_lead() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_new_lead(
    initcap(trim(new.first_name)) || coalesce(' ' || upper(left(trim(new.last_name), 1)) || '.', ''),
    case when new.source = 'scenario-desk' and coalesce(new.ref,'') ilike 'PTR-%'
         then 'Partner scenario' || coalesce(' (' || initcap(new.answers->>'partner_type') || ')', '')
         else initcap(replace(coalesce(nullif(new.source, ''), 'calculator'), '-', ' ')) end
    || coalesce(' (' || new.property_state || ')', ''));
  return new;
end $$;
drop trigger if exists alert_calculator_lead on public.calculator_leads;
create trigger alert_calculator_lead after insert on public.calculator_leads
  for each row execute function public.alert_calculator_lead();
