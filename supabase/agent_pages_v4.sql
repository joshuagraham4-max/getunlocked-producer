-- Agent pages v4 (Nov 17, 2026). Run AFTER agent_pages_v1, v2 and v3. Re-runnable.
-- Adds: a short edit-link code per agent (8 random characters). The long edit link keeps working, so nothing already sent breaks.
-- The short desk link (/d/<slug>) needs no database change.
create or replace function public.gen_short_code() returns text
language plpgsql volatile set search_path = public as $$
declare chars text := 'abcdefghjkmnpqrstuvwxyz23456789'; b bytea := decode(replace(gen_random_uuid()::text, '-', ''), 'hex'); out text := ''; i int;
begin
  for i in 0..7 loop out := out || substr(chars, 1 + (get_byte(b, i) % length(chars)), 1); end loop;
  return out;
end $$;

alter table public.agent_pages add column if not exists short_code text;
update public.agent_pages set short_code = public.gen_short_code() where short_code is null;
alter table public.agent_pages alter column short_code set default public.gen_short_code();
alter table public.agent_pages alter column short_code set not null;
create unique index if not exists agent_pages_short_code_key on public.agent_pages (short_code);

-- The agent's edit page now opens with either the long key or the short code.
create or replace function public.get_agent_edit(p_token text)
returns table (slug text, name text, brokerage text, market text, phone text, email text, photo_url text, video_url text, lead_pref text, ntfy_topic text, logo_url text)
language sql security definer set search_path = public as $$
  select a.slug, a.name, a.brokerage, a.market, a.phone, a.email, a.photo_url, a.video_url, a.lead_pref, a.ntfy_topic, a.logo_url
  from public.agent_pages a
  where (a.edit_token = p_token and length(coalesce(p_token, '')) >= 24)
     or (a.short_code = lower(trim(coalesce(p_token, ''))) and length(trim(coalesce(p_token, ''))) = 8)
  limit 1;
$$;
revoke all on function public.get_agent_edit(text) from public;
grant execute on function public.get_agent_edit(text) to anon, authenticated;

create or replace function public.save_agent_edit(p_token text, p_name text, p_brokerage text, p_market text, p_phone text,
  p_email text, p_photo_url text, p_video_url text, p_lead_pref text, p_logo_url text) returns boolean
language plpgsql security definer set search_path = public as $$
declare t text := trim(coalesce(p_token, ''));
begin
  if length(t) < 8 or (length(t) > 8 and length(t) < 24) then return false; end if;
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
  where (length(t) >= 24 and edit_token = t) or (length(t) = 8 and short_code = lower(t));
  return found;
end $$;
revoke all on function public.save_agent_edit(text, text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.save_agent_edit(text, text, text, text, text, text, text, text, text, text) to anon, authenticated;
