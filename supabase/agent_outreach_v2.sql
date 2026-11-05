-- Replies are handled by Joshua in Messenger; they do not go on the call list.
-- Every agent prospect is also a Contact (type agent), tagged with outreach status so Contacts can filter on it.
-- Works for rows added in the app and rows Claude loads in the daily batch.
create or replace function public.agent_outreach_sync() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  tag text := case new.status when 'messaging' then 'outreach: messaged' when 'replied' then 'outreach: replied'
                when 'no reply' then 'outreach: no reply' when 'skipped' then 'outreach: skipped' else 'outreach: not contacted' end;
  d date := (now() at time zone 'America/New_York')::date;
  first text := coalesce(nullif(new.first_name,''), split_part(trim(new.full_name),' ',1));
  last text := nullif(trim(substr(trim(new.full_name), length(split_part(trim(new.full_name),' ',1)) + 1)), '');
begin
  if new.first_name is null then new.first_name := first; end if;
  if new.contact_id is null then
    insert into contacts (user_id, first_name, last_name, contact_type, subtype, company, city, state, tags,
                          source_category, source_file, external_id, contact_note, do_not_contact)
    values (new.user_id, first, last, 'agent', 'partner prospect', new.brokerage, new.area, new.state,
            array['agent outreach', new.channel || ' outreach', tag], 'agent outreach', 'agent outreach', 'ao-' || new.id,
            concat_ws(' · ', d::text, 'agent outreach on ' || new.channel, new.area, new.profile_url), false)
    on conflict (user_id, external_id) do nothing
    returning id into new.contact_id;
    if new.contact_id is null then select id into new.contact_id from contacts where user_id = new.user_id and external_id = 'ao-' || new.id; end if;
  elsif tg_op = 'INSERT' then
    update contacts set tags = array(select distinct x from unnest(array(select t from unnest(coalesce(tags,'{}')) t where t not like 'outreach: %') || array['agent outreach', tag]) x)
    where id = new.contact_id;
  end if;
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    update contacts set tags = array(select distinct x from unnest(array(select t from unnest(coalesce(tags,'{}')) t where t not like 'outreach: %') || array['agent outreach', tag]) x)
    where id = new.contact_id;
    if new.status = 'replied' then
      update contacts set tags = array(select distinct x from unnest(coalesce(tags,'{}') || array['messenger reply']) x),
        contact_note = concat_ws(E'\n', contact_note, d::text || ' · replied on ' || new.channel) where id = new.contact_id;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists agent_outreach_sync on public.agent_outreach;
create trigger agent_outreach_sync before insert or update on public.agent_outreach for each row execute function public.agent_outreach_sync();
-- Backfill rows that already exist.
update public.agent_outreach set notes = notes where contact_id is null;
