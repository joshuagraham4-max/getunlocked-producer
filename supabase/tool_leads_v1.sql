-- Tool leads (Equity Unlock, and the Income / DPA / Medical tools to come). Nov 8, 2026. Re-runnable.
-- (1) Each tool saves what the visitor entered in calculator_leads.answers.
-- (2) The Contacts trigger now puts that summary in the contact's notes and tags the lead with the tool name.
alter table public.calculator_leads add column if not exists answers jsonb;

create or replace function public.calculator_lead_to_contact() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  owner uuid := 'f43a0121-3b76-4d1e-92b5-73e685b81c52';
  d text := regexp_replace(coalesce(new.phone,''), '\D', '', 'g');
  ph text; em text := nullif(lower(trim(coalesce(new.email,''))), '');
  existing uuid;
  tool text := coalesce(nullif(new.source,''), 'rental-calculator');
  tag text := case tool when 'rental-calculator' then 'calculator lead' else replace(tool, '-', ' ') || ' lead' end;
  note text := concat_ws(' · ', to_char(now() at time zone 'America/New_York','YYYY-MM-DD'), initcap(replace(tool, '-', ' ')) || ' lead',
                 'ref ' || new.ref, new.answers->>'summary',
                 case when new.answers is null and new.est_loan_amount is not null then 'est. loan $' || to_char(new.est_loan_amount,'FM999,999,999') end,
                 new.property_state, new.zip);
begin
  if length(d) = 11 and left(d,1) = '1' then d := substr(d,2); end if;
  ph := case when length(d) = 10 then '(' || substr(d,1,3) || ') ' || substr(d,4,3) || '-' || substr(d,7) end;
  select id into existing from contacts where user_id = owner and ((em is not null and (email = em or email_2 = em)) or (ph is not null and (phone = ph or phone_2 = ph))) limit 1;
  if existing is not null then
    update contacts set follow_up_date = current_date,
      contact_note = concat_ws(E'\n', contact_note, note),
      tags = array(select distinct x from unnest(coalesce(tags,'{}') || array[tag]) x)
    where id = existing;
  else
    insert into contacts (user_id, first_name, last_name, email, phone, zip, property_state, contact_type, subtype, follow_up_date,
                          contact_note, tags, source_category, source_file, external_id, do_not_contact)
    values (owner, initcap(trim(new.first_name)), initcap(trim(new.last_name)), em, ph, new.zip, new.property_state, 'lead', tag, current_date,
            note, array[tag, coalesce(new.ref,'no ref')], 'calculator', tool, 'calc-' || new.id, false)
    on conflict (user_id, external_id) do nothing;
  end if;
  return new;
end $$;
