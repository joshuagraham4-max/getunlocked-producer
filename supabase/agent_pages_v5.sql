-- Agent pages v5 (Nov 25, 2026). Run AFTER agent_pages_v1 to v4. Re-runnable.
-- Page reminders (Joshua, Nov 25): agents who got their page invite but never set it up get one reminder.
--   invited_at  = when the page invite went out (the morning run sets it; backfilled below from the Nov 20, 23 and 24 sends)
--   edited_at   = the last time the agent saved their edit page (set by save_agent_edit). Null = never set it up.
--   reminded_at = when the reminder went out (email from Joshua, or Messenger from the morning run)
alter table public.agent_pages add column if not exists invited_at timestamptz;
alter table public.agent_pages add column if not exists edited_at timestamptz;
alter table public.agent_pages add column if not exists reminded_at timestamptz;

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
    lead_pref = case when p_lead_pref in ('both', 'push', 'email') then p_lead_pref else lead_pref end,
    edited_at = now()
  where (length(t) >= 24 and edit_token = t) or (length(t) = 8 and short_code = lower(t));
  return found;
end $$;
revoke all on function public.save_agent_edit(text, text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.save_agent_edit(text, text, text, text, text, text, text, text, text, text) to anon, authenticated;

-- Backfill invite dates from the sends so far (coverage-invite-runbook "Sent so far").
update public.agent_pages a set invited_at = d.at
from (values
  ('2026-11-20 13:00-05'::timestamptz, array['paige-mclaughlin','nissa-hall','patti-nixon','paullette-morrison','ryan-dykstra','amanda-winter','kim-delahanty','kayte-foster','heather-stringfellow']),
  ('2026-11-23 12:15-05'::timestamptz, array['verna-crosato','belinda-cox','christy-dunfee','candice-graham','sam-hassan','charles-harrison','larisa-stur','bryan-messick','sean-closset','lindsey-smyth']),
  ('2026-11-24 12:33-05'::timestamptz, array['kim-beauprez','jasmine-robles','zach-zaleski','lani-carwin'])
) as d(at, slugs)
where a.invited_at is null and a.slug = any(d.slugs);

-- Pages already filled out before edited_at existed count as set up (Sean Closset, Nov 23).
update public.agent_pages set edited_at = '2026-11-23 15:00-05' where edited_at is null and slug = 'sean-closset';
