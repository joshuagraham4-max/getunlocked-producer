-- Agent pages v3 (Nov 17, 2026). Run AFTER agent_pages_v1.sql and v2. Re-runnable.
-- Adds: agent logo, and the rate feed for the agents' open house flyers (the conventional rate you already enter in Radar).
alter table public.agent_pages add column if not exists logo_url text;

drop function if exists public.get_agent_page(text);
create function public.get_agent_page(p_slug text)
returns table (slug text, name text, brokerage text, market text, phone text, photo_url text, video_url text, logo_url text)
language sql security definer set search_path = public as $$
  select a.slug, a.name, a.brokerage, a.market, a.phone, a.photo_url, a.video_url, a.logo_url from public.agent_pages a
  where a.slug = lower(trim(p_slug)) and a.active limit 1;
$$;
revoke all on function public.get_agent_page(text) from public;
grant execute on function public.get_agent_page(text) to anon, authenticated;

drop function if exists public.get_agent_edit(text);
create function public.get_agent_edit(p_token text)
returns table (slug text, name text, brokerage text, market text, phone text, email text, photo_url text, video_url text, lead_pref text, ntfy_topic text, logo_url text)
language sql security definer set search_path = public as $$
  select a.slug, a.name, a.brokerage, a.market, a.phone, a.email, a.photo_url, a.video_url, a.lead_pref, a.ntfy_topic, a.logo_url
  from public.agent_pages a where a.edit_token = p_token and length(coalesce(p_token, '')) >= 24 limit 1;
$$;
revoke all on function public.get_agent_edit(text) from public;
grant execute on function public.get_agent_edit(text) to anon, authenticated;

drop function if exists public.save_agent_edit(text, text, text, text, text, text, text, text, text);
create or replace function public.save_agent_edit(p_token text, p_name text, p_brokerage text, p_market text, p_phone text,
  p_email text, p_photo_url text, p_video_url text, p_lead_pref text, p_logo_url text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if length(coalesce(p_token, '')) < 24 then return false; end if;
  if coalesce(trim(p_name), '') = '' then return false; end if;
  if p_photo_url is not null and length(p_photo_url) > 400000 then return false; end if;
  if p_logo_url is not null and length(p_logo_url) > 300000 then return false; end if;
  update public.agent_pages set
    name = left(trim(p_name), 80), brokerage = left(nullif(trim(coalesce(p_brokerage, '')), ''), 120),
    market = left(nullif(trim(coalesce(p_market, '')), ''), 120), phone = left(nullif(trim(coalesce(p_phone, '')), ''), 30),
    email = left(nullif(lower(trim(coalesce(p_email, ''))), ''), 160),
    photo_url = nullif(p_photo_url, ''), video_url = left(nullif(trim(coalesce(p_video_url, '')), ''), 300),
    logo_url = nullif(p_logo_url, ''),
    lead_pref = case when p_lead_pref in ('both', 'push', 'email') then p_lead_pref else lead_pref end
  where edit_token = p_token;
  return found;
end $$;
revoke all on function public.save_agent_edit(text, text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.save_agent_edit(text, text, text, text, text, text, text, text, text, text) to anon, authenticated;

-- Rate feed for agent flyers: your latest conventional rate from Radar, with the date you entered it.
-- The flyers only show payments while this is recent. Agents cannot change it.
create or replace function public.get_flyer_rate()
returns table (rate numeric, as_of date, finance_charges numeric, score int)
language sql security definer set search_path = public as $$
  select m.conventional, m.day, 6500::numeric, 740 from public.market_rates m
  where m.user_id = 'f43a0121-3b76-4d1e-92b5-73e685b81c52'::uuid and m.conventional is not null
  order by m.day desc limit 1;
$$;
revoke all on function public.get_flyer_rate() from public;
grant execute on function public.get_flyer_rate() to anon, authenticated;
