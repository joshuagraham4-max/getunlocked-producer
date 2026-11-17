-- Agent pages v2 (Nov 17, 2026). Run AFTER agent_pages_v1.sql. Re-runnable.
-- Adds: a private edit link per agent (photo, contact info, optional intro video) and seller-aware lead alerts.
alter table public.agent_pages add column if not exists video_url  text;
alter table public.agent_pages add column if not exists edit_token text;
update public.agent_pages set edit_token = replace(gen_random_uuid()::text, '-', '') || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12) where edit_token is null;
alter table public.agent_pages alter column edit_token set default (replace(gen_random_uuid()::text, '-', '') || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
alter table public.agent_pages alter column edit_token set not null;
create unique index if not exists agent_pages_edit_token_key on public.agent_pages (edit_token);

-- The public page now also gets the optional video link.
drop function if exists public.get_agent_page(text);
create function public.get_agent_page(p_slug text)
returns table (slug text, name text, brokerage text, market text, phone text, photo_url text, video_url text)
language sql security definer set search_path = public as $$
  select a.slug, a.name, a.brokerage, a.market, a.phone, a.photo_url, a.video_url from public.agent_pages a
  where a.slug = lower(trim(p_slug)) and a.active limit 1;
$$;
revoke all on function public.get_agent_page(text) from public;
grant execute on function public.get_agent_page(text) to anon, authenticated;

-- The agent's own edit page: the long secret in the link is the key.
create or replace function public.get_agent_edit(p_token text)
returns table (slug text, name text, brokerage text, market text, phone text, email text, photo_url text, video_url text, lead_pref text, ntfy_topic text)
language sql security definer set search_path = public as $$
  select a.slug, a.name, a.brokerage, a.market, a.phone, a.email, a.photo_url, a.video_url, a.lead_pref, a.ntfy_topic
  from public.agent_pages a where a.edit_token = p_token and length(coalesce(p_token, '')) >= 24 limit 1;
$$;
revoke all on function public.get_agent_edit(text) from public;
grant execute on function public.get_agent_edit(text) to anon, authenticated;

create or replace function public.save_agent_edit(p_token text, p_name text, p_brokerage text, p_market text, p_phone text,
  p_email text, p_photo_url text, p_video_url text, p_lead_pref text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if length(coalesce(p_token, '')) < 24 then return false; end if;
  if coalesce(trim(p_name), '') = '' then return false; end if;
  if p_photo_url is not null and length(p_photo_url) > 400000 then return false; end if;
  update public.agent_pages set
    name = left(trim(p_name), 80), brokerage = left(nullif(trim(coalesce(p_brokerage, '')), ''), 120),
    market = left(nullif(trim(coalesce(p_market, '')), ''), 120), phone = left(nullif(trim(coalesce(p_phone, '')), ''), 30),
    email = left(nullif(lower(trim(coalesce(p_email, ''))), ''), 160),
    photo_url = nullif(p_photo_url, ''), video_url = left(nullif(trim(coalesce(p_video_url, '')), ''), 300),
    lead_pref = case when p_lead_pref in ('both', 'push', 'email') then p_lead_pref else lead_pref end
  where edit_token = p_token;
  return found;
end $$;
revoke all on function public.save_agent_edit(text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.save_agent_edit(text, text, text, text, text, text, text, text, text) to anon, authenticated;

-- Seller-aware alerts: the page now asks buying, selling, or both.
create or replace function public.route_agent_lead() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  a public.agent_pages%rowtype;
  who text; d text; has_agent boolean; sells boolean; sell_only boolean; ph text; msg text; key text; frm text; body text; what text; subj text;
begin
  if new.source is distinct from 'agent-page' then return new; end if;
  select * into a from public.agent_pages where slug = (new.answers->>'agent_slug') and active limit 1;
  if not found then return new; end if;
  who := initcap(trim(new.first_name)) || coalesce(' ' || initcap(trim(new.last_name)), '');
  d := regexp_replace(coalesce(new.phone, ''), '\D', '', 'g');
  ph := case when length(d) = 10 then '(' || substr(d,1,3) || ') ' || substr(d,4,3) || '-' || substr(d,7) else new.phone end;
  has_agent := coalesce(new.answers->'qa'->>'hasagent', '') like 'Yes%';
  sells := coalesce(new.answers->'qa'->>'intent', '') ~ '^Selling' or coalesce(new.answers->'qa'->>'sellhome', '') ~ '^(Yes|Maybe)';
  sell_only := coalesce(new.answers->'qa'->>'intent', '') = 'Selling my home';
  what := case when sell_only then 'wants to sell a home' when sells then 'wants to sell and buy' else 'just asked about buying' end;
  subj := case when sell_only then 'New SELLER lead: ' when sells then 'New seller + buyer lead: ' else 'New buyer lead: ' end;
  msg := case when has_agent then 'ALREADY HAS AN AGENT. ' else '' end || who || ' ' || what || '. Call ' || ph || ' within 5 minutes.'
         || case when sells then ' Home: ' || coalesce(new.answers->'qa'->>'saddr', 'address pending') || '.' else '' end;

  begin
    perform net.http_post(url := 'https://ntfy.sh/',
      body := jsonb_build_object('topic', a.ntfy_topic, 'title', 'New lead for ' || a.name,
        'message', msg, 'priority', 5, 'tags', jsonb_build_array('telephone_receiver'), 'actions',
        jsonb_build_array(jsonb_build_object('action','view','label','Call now','url','tel:' || d))));
  exception when others then null; end;

  key := public.app_secret('RESEND_API_KEY');
  frm := coalesce(public.app_secret('RESEND_FROM'), 'Joshua Graham <onboarding@resend.dev>');
  if key is not null and a.email is not null and a.lead_pref in ('both', 'email') then
    body := case when has_agent then '<p><b>This person says they already work with an agent.</b> Your call.</p>' else '' end
         || '<p><b>Call within 5 minutes.</b> Leads that get a call in the first 5 minutes are far more likely to answer.</p>'
         || case when sells then '<p><b>Has a home to sell:</b> ' || coalesce(new.answers->'qa'->>'saddr', '') || '. Their guess: $' || coalesce(new.answers->'qa'->>'sworth', '?') || ', owes about $' || coalesce(new.answers->'qa'->>'spayoff', '?') || '. That is a listing lead for you.</p>' else '' end
         || '<p><b>' || who || '</b><br>' || ph || '<br>' || coalesce(new.email, '') || '</p>'
         || '<p>' || coalesce(new.answers->>'summary', '') || '</p>'
         || '<p>This lead came through your page. I''m the lender on it, and I''ll keep you posted. - Joshua Graham, 720-468-6872</p>';
    begin
      perform net.http_post(url := 'https://api.resend.com/emails',
        headers := jsonb_build_object('Authorization', 'Bearer ' || key, 'Content-Type', 'application/json'),
        body := jsonb_build_object('from', frm, 'to', jsonb_build_array(a.email), 'reply_to', 'jgraham@grahamfinancial.us',
          'subject', case when has_agent then '(Already has an agent) ' else '' end || subj || who || '. Call within 5 minutes.', 'html', body));
    exception when others then null; end;
  end if;
  return new;
exception when others then return new;
end $$;
