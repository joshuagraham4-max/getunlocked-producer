-- merge_contacts v2 (Nov 6, 2026): merge two duplicate contacts and keep ALL data.
-- Paste this whole block into Supabase > SQL editor and Run. Safe to run more than once.
--   * Every field: the kept record wins; blanks are filled from the other one.
--   * Up to 2 phones / 2 emails in their fields; any extras go into the note ("Also: ...").
--   * Do Not Contact carries over if EITHER record had it.
--   * Tags and buckets combine. Earliest follow-up date wins. Latest contact/activity dates win.
--   * Loans, call history, links, agent outreach and investor leads all move to the kept person.
--   * A full snapshot of the removed record goes into contact_merge_log, so any merge can be undone.

create table if not exists public.contact_merge_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  keep_id    uuid not null,
  dropped    jsonb not null,           -- the removed contact, exactly as it was
  kept_before jsonb not null,          -- the kept contact before the merge
  merged_at  timestamptz not null default now()
);
alter table public.contact_merge_log enable row level security;
drop policy if exists "own merge log" on public.contact_merge_log;
create policy "own merge log" on public.contact_merge_log
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.merge_contacts(keep_id uuid, drop_id uuid)
returns void language plpgsql as $fn$
declare
  k public.contacts; d public.contacts;
  phones text[]; emails text[]; extra text;
  use_d_email boolean;
begin
  select * into k from public.contacts where id = keep_id;
  select * into d from public.contacts where id = drop_id;
  if k.id is null or d.id is null or k.user_id <> d.user_id then raise exception 'contacts not found'; end if;
  if keep_id = drop_id then raise exception 'cannot merge a contact into itself'; end if;
  if auth.uid() is not null and k.user_id <> auth.uid() then raise exception 'not allowed'; end if;

  insert into public.contact_merge_log (user_id, keep_id, dropped, kept_before)
  values (k.user_id, keep_id, to_jsonb(d), to_jsonb(k));

  -- all distinct phones (compared by digits), kept record first
  select array_agg(p order by ord) into phones from (
    select distinct on (regexp_replace(p, '\D', '', 'g')) p, ord
    from unnest(array[k.phone, k.phone_2, d.phone, d.phone_2]) with ordinality as t(p, ord)
    where nullif(trim(p), '') is not null
    order by regexp_replace(p, '\D', '', 'g'), ord) x;
  -- all distinct emails (case-insensitive), kept record first
  select array_agg(e order by ord) into emails from (
    select distinct on (lower(trim(e))) trim(e) as e, ord
    from unnest(array[k.email, k.email_2, d.email, d.email_2]) with ordinality as t(e, ord)
    where nullif(trim(e), '') is not null
    order by lower(trim(e)), ord) x;

  extra := concat_ws(' ',
    case when coalesce(array_length(phones, 1), 0) > 2 then 'Also phone: ' || array_to_string(phones[3:], ', ') end,
    case when coalesce(array_length(emails, 1), 0) > 2 then 'Also email: ' || array_to_string(emails[3:], ', ') end);

  -- email sequence state follows whichever record's email ends up primary
  use_d_email := nullif(trim(k.email), '') is null and nullif(trim(d.email), '') is not null;

  update public.contacts set
    phone   = phones[1],
    phone_2 = phones[2],
    email   = emails[1],
    email_2 = emails[2],
    first_name = coalesce(nullif(k.first_name, ''), d.first_name),
    last_name  = coalesce(nullif(k.last_name, ''), d.last_name),
    address = coalesce(k.address, d.address), city = coalesce(k.city, d.city), state = coalesce(k.state, d.state), zip = coalesce(k.zip, d.zip),
    property_address = coalesce(k.property_address, d.property_address), property_city = coalesce(k.property_city, d.property_city),
    property_state = coalesce(k.property_state, d.property_state), property_zip = coalesce(k.property_zip, d.property_zip),
    co_borrower_first = coalesce(k.co_borrower_first, d.co_borrower_first), co_borrower_last = coalesce(k.co_borrower_last, d.co_borrower_last),
    co_borrower_phone = coalesce(k.co_borrower_phone, d.co_borrower_phone), co_borrower_email = coalesce(k.co_borrower_email, d.co_borrower_email),
    source_category = coalesce(k.source_category, d.source_category), source_file = coalesce(k.source_file, d.source_file),
    birthday = coalesce(k.birthday, d.birthday), company = coalesce(k.company, d.company),
    contact_type = coalesce(k.contact_type, d.contact_type), subtype = coalesce(k.subtype, d.subtype), agent_role = coalesce(k.agent_role, d.agent_role),
    external_id = coalesce(k.external_id, d.external_id), verify_flag = coalesce(k.verify_flag, d.verify_flag), book = coalesce(k.book, d.book),
    loan_number = coalesce(k.loan_number, d.loan_number), loan_amount = coalesce(k.loan_amount, d.loan_amount), note_rate = coalesce(k.note_rate, d.note_rate),
    appraised_value = coalesce(k.appraised_value, d.appraised_value), ltv_orig = coalesce(k.ltv_orig, d.ltv_orig), funded_date = coalesce(k.funded_date, d.funded_date),
    loan_purpose = coalesce(k.loan_purpose, d.loan_purpose), loan_type = coalesce(k.loan_type, d.loan_type), loan_type_source = coalesce(k.loan_type_source, d.loan_type_source),
    loan_term_months = coalesce(k.loan_term_months, d.loan_term_months),
    home_value = coalesce(k.home_value, d.home_value), home_value_source = coalesce(k.home_value_source, d.home_value_source), home_value_date = coalesce(k.home_value_date, d.home_value_date),
    do_not_contact = coalesce(k.do_not_contact, false) or coalesce(d.do_not_contact, false),
    last_contacted = greatest(k.last_contacted, d.last_contacted),
    last_activity  = greatest(k.last_activity, d.last_activity),
    outcome        = coalesce(k.outcome, d.outcome),
    follow_up_date = least(k.follow_up_date, d.follow_up_date),
    email_step = case when use_d_email then d.email_step else coalesce(k.email_step, d.email_step) end,
    email_next = case when use_d_email then d.email_next else coalesce(k.email_next, d.email_next) end,
    email_bad  = case when use_d_email then d.email_bad  else k.email_bad end,
    linked_agent_id = coalesce(nullif(k.linked_agent_id, drop_id), nullif(d.linked_agent_id, keep_id)),
    tags    = array(select distinct x from unnest(coalesce(k.tags, '{}') || coalesce(d.tags, '{}')) x where x is not null),
    buckets = array(select distinct x from unnest(coalesce(k.buckets, '{}') || coalesce(d.buckets, '{}')) x where x is not null),
    contact_note = nullif(concat_ws(E'\n', k.contact_note, d.contact_note, nullif(extra, ''),
      'Merged with ' || trim(concat_ws(' ', d.first_name, d.last_name)) || ' on ' || to_char(now(), 'YYYY-MM-DD')), '')
  where id = keep_id;

  update public.loans           set contact_id = keep_id where contact_id = drop_id;
  update public.contact_touches set contact_id = keep_id where contact_id = drop_id;
  update public.agent_outreach  set contact_id = keep_id where contact_id = drop_id;
  update public.investor_leads  set contact_id = keep_id where contact_id = drop_id;
  update public.contact_links set contact_id = keep_id where contact_id = drop_id and linked_id <> keep_id;
  update public.contact_links set linked_id  = keep_id where linked_id  = drop_id and contact_id <> keep_id;
  update public.contacts set linked_agent_id = keep_id where linked_agent_id = drop_id;
  delete from public.contacts where id = drop_id;

  -- the newest funded loan is the current one
  update public.loans l set is_current = (l.id = (select id from public.loans where contact_id = keep_id
    order by funded_date desc nulls last, note_rate desc nulls last limit 1))
  where l.contact_id = keep_id;
end $fn$;
