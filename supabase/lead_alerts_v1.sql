-- New-lead phone alerts. Nov 8, 2026. Re-runnable.
-- Every new tool lead (rental calculator, Equity Unlock, future tools) and every Portfolio Review sends a push
-- notification to Joshua's phone through the free ntfy app (topic below). Tapping it opens the GUP app.
-- Only first name + last initial + the tool go in the alert; phone, email and numbers stay in GUP.
create extension if not exists pg_net with schema extensions;

create or replace function public.notify_new_lead(who text, what text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform net.http_post(
    url := 'https://ntfy.sh/',
    body := jsonb_build_object(
      'topic', 'gup-jg-sgfqsvuwba71l1',
      'title', 'New lead: ' || what,
      'message', coalesce(nullif(trim(who), ''), 'Someone') || ' just came in. Call within 5 minutes.',
      'priority', 5,
      'tags', jsonb_build_array('telephone_receiver'),
      'click', 'https://getunlocked-producer.vercel.app/'));
exception when others then null;   -- an alert failure must never block the lead from saving
end $$;

create or replace function public.alert_calculator_lead() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_new_lead(
    initcap(trim(new.first_name)) || coalesce(' ' || upper(left(trim(new.last_name), 1)) || '.', ''),
    initcap(replace(coalesce(nullif(new.source, ''), 'calculator'), '-', ' ')) || coalesce(' (' || new.property_state || ')', ''));
  return new;
end $$;
drop trigger if exists alert_calculator_lead on public.calculator_leads;
create trigger alert_calculator_lead after insert on public.calculator_leads
  for each row execute function public.alert_calculator_lead();

create or replace function public.alert_portfolio_review() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_new_lead(
    initcap(trim(new.first_name)) || coalesce(' ' || upper(left(trim(new.last_name), 1)) || '.', ''), 'Portfolio Review');
  return new;
end $$;
drop trigger if exists alert_portfolio_review on public.portfolio_reviews;
create trigger alert_portfolio_review after insert on public.portfolio_reviews
  for each row execute function public.alert_portfolio_review();

-- Test: run this line alone after setup; your phone should buzz.
-- select public.notify_new_lead('Test L.', 'Equity Unlock (FL)');
