-- Agent lander pages (the free "mini lead machine" for realtors). Nov 16, 2026. Re-runnable.
-- Each agent gets https://<site>/a/<slug>. Buyers answer the qualifying questions; the lead lands in Joshua's Contacts
-- (existing calculator_leads triggers) AND is pushed to the agent right away: "Call within 5 minutes."
-- Email to the agent goes out through Resend once RESEND_API_KEY is stored (see the bottom). Text messages need a Twilio
-- number (carrier registration takes days), so SMS is a later add-on.
create extension if not exists pg_net with schema extensions;

create table if not exists public.agent_pages (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  slug        text not null unique,
  name        text not null,
  brokerage   text,
  market      text,
  phone       text,
  email       text,
  photo_url   text,
  lead_pref   text not null default 'both',   -- both / push / email : however the agent told Joshua they want leads
  ntfy_topic  text not null default ('gup-ag-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)),
  active      boolean not null default true,
  contact_id  uuid
);
alter table public.agent_pages enable row level security;
drop policy if exists "owner manages agent pages" on public.agent_pages;
create policy "owner manages agent pages" on public.agent_pages for all to authenticated
  using (auth.uid() = 'f43a0121-3b76-4d1e-92b5-73e685b81c52'::uuid)
  with check (auth.uid() = 'f43a0121-3b76-4d1e-92b5-73e685b81c52'::uuid);

-- The public page can read only the fields it shows. Email, push topic and everything else stay private.
create or replace function public.get_agent_page(p_slug text)
returns table (slug text, name text, brokerage text, market text, phone text, photo_url text)
language sql security definer set search_path = public as $$
  select a.slug, a.name, a.brokerage, a.market, a.phone, a.photo_url from public.agent_pages a
  where a.slug = lower(trim(p_slug)) and a.active limit 1;
$$;
revoke all on function public.get_agent_page(text) from public;
grant execute on function public.get_agent_page(text) to anon, authenticated;

-- Private key store (Resend key, etc.). RLS on with no policies: nothing can read it except the functions below.
create table if not exists public.app_secrets (key text primary key, value text not null);
alter table public.app_secrets enable row level security;
create or replace function public.app_secret(k text) returns text
language sql security definer set search_path = public as $$ select value from public.app_secrets where key = k $$;
revoke all on function public.app_secret(text) from public, anon, authenticated;

create or replace function public.route_agent_lead() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  a public.agent_pages%rowtype;
  who text; d text; ph text; msg text; key text; frm text; body text;
begin
  if new.source is distinct from 'agent-page' then return new; end if;
  select * into a from public.agent_pages where slug = (new.answers->>'agent_slug') and active limit 1;
  if not found then return new; end if;
  who := initcap(trim(new.first_name)) || coalesce(' ' || initcap(trim(new.last_name)), '');
  d := regexp_replace(coalesce(new.phone, ''), '\D', '', 'g');
  ph := case when length(d) = 10 then '(' || substr(d,1,3) || ') ' || substr(d,4,3) || '-' || substr(d,7) else new.phone end;
  msg := who || ' just asked about buying. Call ' || ph || ' within 5 minutes.';

  -- 1) Instant push to the agent (free ntfy app, subscribe to their topic). Always on.
  begin
    perform net.http_post(url := 'https://ntfy.sh/',
      body := jsonb_build_object('topic', a.ntfy_topic, 'title', 'New buyer lead for ' || a.name,
        'message', msg, 'priority', 5, 'tags', jsonb_build_array('telephone_receiver'), 'actions',
        jsonb_build_array(jsonb_build_object('action','view','label','Call now','url','tel:' || d))));
  exception when others then null; end;

  -- 2) Email to the agent through Resend, if the key is stored and the agent wants email.
  key := public.app_secret('RESEND_API_KEY');
  frm := coalesce(public.app_secret('RESEND_FROM'), 'Joshua Graham <onboarding@resend.dev>');
  if key is not null and a.email is not null and a.lead_pref in ('both', 'email') then
    body := '<p><b>Call within 5 minutes.</b> Leads that get a call in the first 5 minutes are far more likely to answer.</p>'
         || '<p><b>' || who || '</b><br>' || ph || '<br>' || coalesce(new.email, '') || '</p>'
         || '<p>' || coalesce(new.answers->>'summary', '') || '</p>'
         || '<p>This buyer came through your page. I''m their lender, and I''ll keep you posted. - Joshua Graham, 720-468-6872</p>';
    begin
      perform net.http_post(url := 'https://api.resend.com/emails',
        headers := jsonb_build_object('Authorization', 'Bearer ' || key, 'Content-Type', 'application/json'),
        body := jsonb_build_object('from', frm, 'to', jsonb_build_array(a.email), 'reply_to', 'jgraham@grahamfinancial.us',
          'subject', 'New buyer lead: ' || who || '. Call within 5 minutes.', 'html', body));
    exception when others then null; end;
  end if;
  return new;
exception when others then return new;   -- routing must never block the lead from saving
end $$;
drop trigger if exists route_agent_lead on public.calculator_leads;
create trigger route_agent_lead after insert on public.calculator_leads
  for each row execute function public.route_agent_lead();

-- To turn on agent email (optional, free Resend account): run these two lines with your real values.
-- insert into public.app_secrets (key, value) values ('RESEND_API_KEY', 're_xxxxxxxx') on conflict (key) do update set value = excluded.value;
-- insert into public.app_secrets (key, value) values ('RESEND_FROM', 'Joshua Graham <leads@yourdomain.com>') on conflict (key) do update set value = excluded.value;
