-- Partner pages v2 (Nov 19, 2026). Re-runnable. Run after partner_pages_v1.sql.
-- (1) Private edit link per partner (/pe/<token>): photo, logo, name, firm, contact info.
-- (2) Their client page (/pl/<slug>): leads land in calculator_leads (source 'partner-lander'), file in your Contacts,
--     buzz your phone (existing alert) AND buzz the partner's phone on their ntfy code.
-- (3) agent_outreach.audience so the 9:45 agent run never nudges planners or attorneys with agent scripts.

alter table public.partner_pages add column if not exists photo_url text;
alter table public.partner_pages add column if not exists logo_url text;
alter table public.partner_pages add column if not exists edit_token text;
update public.partner_pages set edit_token = replace(gen_random_uuid()::text, '-', '') || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12) where edit_token is null;
alter table public.partner_pages alter column edit_token set default (replace(gen_random_uuid()::text, '-', '') || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
alter table public.partner_pages alter column edit_token set not null;
create unique index if not exists partner_pages_edit_token_key on public.partner_pages (edit_token);

drop function if exists public.get_partner_page(text);
create function public.get_partner_page(p_slug text)
returns table (slug text, first_name text, last_name text, firm text, kind text, photo_url text, logo_url text)
language sql security definer set search_path = public as $$
  select p.slug, p.first_name, p.last_name, p.firm, p.kind, p.photo_url, p.logo_url from public.partner_pages p
  where p.slug = lower(trim(p_slug)) and p.active limit 1;
$$;
revoke all on function public.get_partner_page(text) from public;
grant execute on function public.get_partner_page(text) to anon, authenticated;

drop function if exists public.get_partner_edit(text);
create function public.get_partner_edit(p_token text)
returns table (slug text, first_name text, last_name text, firm text, kind text, phone text, email text, photo_url text, logo_url text, ntfy_topic text)
language sql security definer set search_path = public as $$
  select p.slug, p.first_name, p.last_name, p.firm, p.kind, p.phone, p.email, p.photo_url, p.logo_url, p.ntfy_topic
  from public.partner_pages p where p.edit_token = p_token and length(coalesce(p_token, '')) >= 24 limit 1;
$$;
revoke all on function public.get_partner_edit(text) from public;
grant execute on function public.get_partner_edit(text) to anon, authenticated;

drop function if exists public.save_partner_edit(text, text, text, text, text, text, text, text);
create function public.save_partner_edit(p_token text, p_first text, p_last text, p_firm text, p_phone text, p_email text, p_photo_url text, p_logo_url text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if length(coalesce(p_token, '')) < 24 then return false; end if;
  update public.partner_pages set
    first_name = coalesce(nullif(trim(p_first), ''), first_name),
    last_name  = nullif(trim(coalesce(p_last, '')), ''),
    firm       = nullif(trim(coalesce(p_firm, '')), ''),
    phone      = nullif(trim(coalesce(p_phone, '')), ''),
    email      = nullif(lower(trim(coalesce(p_email, ''))), ''),
    photo_url  = case when length(coalesce(p_photo_url, '')) > 400000 then photo_url else nullif(p_photo_url, '') end,
    logo_url   = case when length(coalesce(p_logo_url, '')) > 400000 then logo_url else nullif(p_logo_url, '') end
  where edit_token = p_token;
  return found;
end $$;
revoke all on function public.save_partner_edit(text, text, text, text, text, text, text, text) from public;
grant execute on function public.save_partner_edit(text, text, text, text, text, text, text, text) to anon, authenticated;

-- Their client page's leads buzz the partner's phone (your own alert already fires on every lead).
create or replace function public.route_partner_lead() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare a public.partner_pages%rowtype; who text; d text; ph text;
begin
  if new.source is distinct from 'partner-lander' then return new; end if;
  select * into a from public.partner_pages where slug = (new.answers->>'partner_slug') and active limit 1;
  if not found then return new; end if;
  who := initcap(trim(new.first_name)) || coalesce(' ' || initcap(trim(new.last_name)), '');
  d := regexp_replace(coalesce(new.phone, ''), '\D', '', 'g');
  ph := case when length(d) = 10 then '(' || substr(d,1,3) || ') ' || substr(d,4,3) || '-' || substr(d,7) else new.phone end;
  begin
    perform net.http_post(url := 'https://ntfy.sh/',
      body := jsonb_build_object('topic', a.ntfy_topic, 'title', 'New client lead for ' || a.first_name,
        'message', who || ' ' || ph || '. ' || coalesce(left(new.answers->>'summary', 300), '') || ' Joshua has it too.',
        'priority', 5, 'tags', jsonb_build_array('telephone_receiver'),
        'actions', jsonb_build_array(jsonb_build_object('action','view','label','Call now','url','tel:' || d))));
  exception when others then null; end;
  return new;
exception when others then return new;
end $$;
drop trigger if exists route_partner_lead on public.calculator_leads;
create trigger route_partner_lead after insert on public.calculator_leads
  for each row execute function public.route_partner_lead();

-- Keep planner and attorney DM rows apart from agent rows.
alter table public.agent_outreach add column if not exists audience text not null default 'agent';
create index if not exists agent_outreach_audience_idx on public.agent_outreach (audience);
