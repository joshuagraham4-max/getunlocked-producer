-- Partner pages v3 (Nov 20, 2026): allow CPA partner pages. Re-runnable. Run after partner_pages_v2.sql.
alter table public.partner_pages drop constraint if exists partner_pages_kind_check;
alter table public.partner_pages add constraint partner_pages_kind_check check (kind in ('planner', 'attorney', 'cpa'));
