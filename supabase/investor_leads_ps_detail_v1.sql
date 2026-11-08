-- Full PropStream record per investor lead (every open loan, owner, mailing, MLS), plus PropStream's property id for matching.
alter table public.investor_leads add column if not exists ps_detail jsonb, add column if not exists ps_property_id bigint;
create index if not exists investor_leads_ps_id_idx on public.investor_leads(user_id, ps_property_id);
